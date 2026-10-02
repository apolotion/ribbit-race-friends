import {DurableObject} from 'cloudflare:workers';
import {BUILD,digest,randomHex,equal,json,error,roomName,cookieValue,sessionCookie,limitedJson} from './common.js';
import {sanitizeSaveData_,sanitizeDeletedKeys_,mergePersistentSaveData_,parseSaveJson_,summarizeSave_} from './save-data.js';
import {createRoomApi} from './rooms-core.js';
import vocabulary from './vocabulary.json' with {type:'json'};

// A private SQLite-backed hub stores accounts, session hashes, cloud saves and matchmaking.
// Per-room WebSocket traffic never passes through this database.
export class FriendsHub extends DurableObject {
 constructor(ctx,env){
  super(ctx,env);this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;this.lastCleanup=0;
  this.sql.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, keyhash TEXT NOT NULL, savedata TEXT NOT NULL, revision INTEGER NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL, summary TEXT NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, uid TEXT NOT NULL, marker TEXT NOT NULL, guest INTEGER NOT NULL, name TEXT NOT NULL, expires INTEGER NOT NULL)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS sessions_exp ON sessions(expires)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS sessions_uid ON sessions(uid)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS temporary (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS temporary_exp ON temporary(expires)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS persistent (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS awards (matchid TEXT PRIMARY KEY, uid TEXT NOT NULL, created INTEGER NOT NULL)');
  const get=(key)=>{const r=this.one('SELECT value,expires FROM temporary WHERE key=?',key);return r&&r.expires>Date.now()?r.value:null;};
  const put=(key,value,seconds)=>{this.sql.exec('INSERT INTO temporary(key,value,expires) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,expires=excluded.expires',String(key),String(value),Date.now()+Math.max(1,Math.min(21600,seconds||600))*1000);};
  this.cache={get,put,getAll:keys=>Object.fromEntries(keys.map(k=>[k,get(k)]).filter(([,v])=>v!==null)),putAll:(o,s)=>{for(const[k,v]of Object.entries(o))put(k,v,s);},remove:k=>this.sql.exec('DELETE FROM temporary WHERE key=?',k),removeAll:ks=>{for(const k of ks)this.sql.exec('DELETE FROM temporary WHERE key=?',k);}};
  this.props={getProperty:k=>this.one('SELECT value FROM persistent WHERE key=?',k)?.value||null,
   setProperty:(k,v)=>this.sql.exec('INSERT INTO persistent(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',k,String(v)),
   deleteProperty:k=>this.sql.exec('DELETE FROM persistent WHERE key=?',k),
   setProperties:o=>{for(const[k,v]of Object.entries(o))this.props.setProperty(k,v);}};
 }
 one(q,...p){return this.sql.exec(q,...p).toArray()[0]||null;}
 tx(fn){return this.ctx.storage.transactionSync(fn);}
 cleanup(){if(Date.now()-this.lastCleanup<60000)return;this.lastCleanup=Date.now();this.sql.exec('DELETE FROM sessions WHERE expires < ?',Date.now());this.sql.exec('DELETE FROM temporary WHERE expires < ?',Date.now());}
 limit(key,maximum,seconds){const k='LIMIT:'+key,r=JSON.parse(this.cache.get(k)||'null')||{n:0,until:Date.now()+seconds*1000};if(r.n>=maximum)return false;r.n++;this.cache.put(k,JSON.stringify(r),Math.ceil((r.until-Date.now())/1000));return true;}
 readAuth(request){const token=cookieValue(request);if(!/^[a-f0-9]{64}$/.test(token))return null;const s=this.one('SELECT * FROM sessions WHERE hash=?',digest(token));if(!s||s.expires<=Date.now())return null;if(!s.guest&&!this.one('SELECT id FROM users WHERE id=?',s.uid))return null;return {...s,guest:!!s.guest};}
 validMarker(a,p){return a&&equal(p.sessionToken||p.guestToken||'',a.marker);}
 createSession(uid,name,guest=false){const token=randomHex(),s={hash:digest(token),uid,marker:randomHex(16),guest:guest?1:0,name,expires:Date.now()+(guest?21600:2592000)*1000};this.sql.exec('INSERT INTO sessions(hash,uid,marker,guest,name,expires) VALUES(?,?,?,?,?,?)',s.hash,s.uid,s.marker,s.guest,s.name,s.expires);return {token,auth:{...s,guest},seconds:guest?21600:2592000};}
 authResponse(a){const u=this.one('SELECT * FROM users WHERE id=?',a.uid);if(!u)return error('SESSION_EXPIRED','Sign in again.');return {ok:true,profileComplete:true,studentId:u.id,name:u.name,displayName:u.name,sessionToken:a.marker,classPeriod:'friends',classPeriods:['friends'],revision:u.revision,saveData:parseSaveJson_(u.savedata),autosaveSeconds:30,vocabulary,vocabularySource:'friends',friendsVersion:1};}
 stamp(meta){if(!meta)return meta;const n=Math.max(Date.now(),Number(this.props.getProperty('POLICY_CLOCK')||0)+1);this.props.setProperty('POLICY_CLOCK',String(n));return {...meta,policyStamp:n};}
 runtime(a,presence={}){return createRoomApi({auth:a,cache:this.cache,props:this.props,socketPresence:presence,store:{award:(uid,id)=>this.award(uid,id)}});}
 award(uid,matchid){
  const u=this.one('SELECT * FROM users WHERE id=?',uid);if(!u)return error('ACCOUNT_NOT_FOUND','Winner account no longer exists.');
  const s=parseSaveJson_(u.savedata),summary=summarizeSave_(s);
  if(this.one('SELECT matchid FROM awards WHERE matchid=?',matchid))return {ok:true,duplicate:true,pvpMatchWins:summary.pvpMatchWins};
  const n=summary.pvpMatchWins+1,stats=parseSaveJson_(s.ribbitRaceStatsV1);s.ribbitRacePvpMatchWins=String(n);stats.pvpMatchWins=n;s.ribbitRaceStatsV1=JSON.stringify(stats);
  let journal;try{journal=JSON.parse(s.ribbitRaceOnlineMatchIdsV1||'[]');}catch(_){journal=[];}if(!Array.isArray(journal))journal=[];
  s.ribbitRaceOnlineMatchIdsV1=JSON.stringify([...new Set([...journal.map(String),matchid])].slice(-50));
  this.sql.exec('INSERT INTO awards(matchid,uid,created) VALUES(?,?,?)',matchid,uid,Date.now());this.writeSave(u,s);return {ok:true,pvpMatchWins:n};
 }
 writeSave(u,s){const clean=sanitizeSaveData_(s),rev=u.revision+1;this.sql.exec('UPDATE users SET savedata=?,revision=?,updated=?,summary=? WHERE id=?',JSON.stringify(clean),rev,Date.now(),JSON.stringify(summarizeSave_(clean)),u.id);return {ok:true,revision:rev,saveSchemaVersion:2};}
 async fetch(request){
  const method=new URL(request.url).pathname.split('/').pop();let payload;
  try{payload=await limitedJson(request);}catch(e){return json(error('INVALID_REQUEST',e.message),400);}
  const ip=digest(request.headers.get('X-Friends-IP')||'unknown');
  let auth=this.readAuth(request),presence={};
  if(method==='authorizeSocket'){
   if(!auth)return json(error('SESSION_EXPIRED','Sign in first.'),401);
   if(!this.limit('socket:'+auth.uid,30,60))return json(error('RATE_LIMIT','Wait before reconnecting.'),429);
   const m=this.runtime(auth).metadata(payload);return m?json({ok:true,metadata:{...this.stamp(m),sessionHash:auth.hash}}):json(error('ROOM_AUTH_FAILED','Room session expired.'),403);
  }
  if(method==='apiOnlineExchange'&&auth&&this.validMarker(auth,payload)){
   const rt=this.runtime(auth),meta=rt.metadata(payload);
   if(meta){try{
    const r=await this.env.ROOMS.getByName(roomName(meta)).fetch(new Request('https://internal/sync',{method:'POST',body:JSON.stringify({...this.stamp(meta),sessionHash:auth.hash})}));presence=await r.json();
   }catch(_){presence={};}}
  }
  let setCookie='';
  try{
   const result=this.tx(()=>{
    this.cleanup();auth=this.readAuth(request); // Revalidate after asynchronous socket-presence query.
    if(method==='apiBootstrap')return {ok:true,friendsVersion:1,build:BUILD,autosaveSeconds:30,classPeriods:['friends'],vocabulary,vocabularySource:'friends',message:'Create a Friends account, sign in, or play without saving.',resume:auth&&!auth.guest?this.authResponse(auth):null};
    if(method==='apiGetVocabulary')return {ok:true,vocabulary,vocabularySource:'friends'};
    if(method==='apiOnlineDiagnostic')return this.runtime(auth).call(method,payload);
    if(method==='apiCreatePlayer'){
     if(this.env.ALLOW_REGISTRATION==='false')return error('REGISTRATION_CLOSED','New accounts are currently closed. Guest play is still available.');
     if(!this.limit('register:'+ip,6,3600))return error('RATE_LIMIT','Too many account requests. Try later or use guest play.');
     const name=String(payload.username||'').normalize('NFKC').trim(),key=name.toLowerCase();
     if(!/^[\p{L}\p{N}_-]{3,20}$/u.test(name))return error('INVALID_USERNAME','Use 3–20 letters, numbers, _ or -.');
     if(this.one('SELECT id FROM users WHERE username=?',key))return error('USERNAME_TAKEN','That username is taken. Choose another or sign in.');
     if(this.one('SELECT COUNT(*) AS n FROM users').n>=Math.max(1,Number(this.env.MAX_ACCOUNTS)||500))return error('REGISTRATION_FULL','The account limit has been reached. Guest play is still available.');
     const uid=crypto.randomUUID(),secret=randomHex(16),now=Date.now();
     this.sql.exec('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)',uid,key,name,digest(uid+':'+secret),'{}',0,now,now,JSON.stringify(summarizeSave_({})));
     if(auth)this.sql.exec('DELETE FROM sessions WHERE hash=?',auth.hash);
     const session=this.createSession(uid,name);setCookie=sessionCookie(request.url,session.token,session.seconds);
     return {...this.authResponse(session.auth),privateKey:secret.match(/.{8}/g).join('-')};
    }
    if(method==='apiLogin'){
     if(!this.limit('login:'+ip,30,600))return error('RATE_LIMIT','Too many attempts. Wait ten minutes.');
     const username=String(payload.username||'').normalize('NFKC').trim().toLowerCase(),key=String(payload.key||'').replace(/[-\s]/g,'').toLowerCase();
     const u=this.one('SELECT * FROM users WHERE username=?',username);
     if(!u||!equal(u.keyhash,digest(u.id+':'+key)))return error('INVALID_LOGIN','Username or private save key was not recognized.');
     if(auth)this.sql.exec('DELETE FROM sessions WHERE hash=?',auth.hash);
     const s=this.createSession(u.id,u.name);setCookie=sessionCookie(request.url,s.token,s.seconds);return this.authResponse(s.auth);
    }
    if(method==='apiOnlineGuestSession'){
     if(!this.limit('guest:'+ip,30,600))return error('RATE_LIMIT','Too many guest requests. Please wait.');
     if(auth?.guest)return {ok:true,guestToken:auth.marker,name:auth.name,guest:true};
     if(auth)this.sql.exec('DELETE FROM sessions WHERE hash=?',auth.hash);
     const uid='guest:'+crypto.randomUUID(),name='Guest_'+uid.slice(-4).toUpperCase(),s=this.createSession(uid,name,true);
     setCookie=sessionCookie(request.url,s.token,s.seconds);return {ok:true,guestToken:s.auth.marker,name,guest:true};
    }
    if(method==='apiLogout'){
     if(auth&&payload.sessionToken&&!this.validMarker(auth,payload))return error('SESSION_EXPIRED','The active account changed in another tab.');
     if(auth)this.sql.exec('DELETE FROM sessions WHERE hash=?',auth.hash);setCookie=sessionCookie(request.url,'',0);return {ok:true};
    }
    if(!auth)return error('SESSION_EXPIRED','Your session expired. Sign in or choose guest play again.');
    if(!['apiAccount','apiExport','apiRotateKey','apiDeleteAccount'].includes(method)&&!this.validMarker(auth,payload))return error('SESSION_EXPIRED','Your account changed in another tab. Refresh before saving.');
    if(!this.limit('api:'+auth.uid,500,60))return error('RATE_LIMIT','Too many requests. Wait a moment.');
    if(['apiLoad','apiAccount'].includes(method))return auth.guest?{ok:true,guest:true,name:auth.name}:this.authResponse(auth);
    if(method==='apiExport')return auth.guest?error('GUEST','Guest play has no cloud save.'):{...this.authResponse(auth),exportedAt:new Date().toISOString()};
    if(['apiRotateKey','apiDeleteAccount'].includes(method)){
     if(auth.guest)return error('GUEST','Sign in to a saved account.');
     if(!this.limit('manage:'+auth.uid,10,600))return error('RATE_LIMIT','Too many key attempts. Wait ten minutes.');
     const u=this.one('SELECT * FROM users WHERE id=?',auth.uid),key=String(payload.key||'').replace(/[-\s]/g,'').toLowerCase();
     if(!equal(u.keyhash,digest(u.id+':'+key)))return error('INVALID_KEY','The current private key was not recognized.');
     if(method==='apiDeleteAccount'){
      if(payload.confirm!==u.name)return error('CONFIRM','Type your exact username to confirm deletion.');
      this.runtime(auth).deletePrivate(u.id);this.sql.exec('DELETE FROM sessions WHERE uid=?',u.id);this.sql.exec('DELETE FROM users WHERE id=?',u.id);
      this.sql.exec('DELETE FROM awards WHERE uid=?',u.id);setCookie=sessionCookie(request.url,'',0);
      return {ok:true,deleted:true,message:'Account and cloud save deleted. Historical opponents may retain past matchup records.'};
     }
     const secret=randomHex(16);this.sql.exec('UPDATE users SET keyhash=? WHERE id=?',digest(u.id+':'+secret),u.id);
     this.sql.exec('DELETE FROM sessions WHERE uid=?',u.id);const s=this.createSession(u.id,u.name);
     setCookie=sessionCookie(request.url,s.token,s.seconds);return {ok:true,privateKey:secret.match(/.{8}/g).join('-'),name:u.name};
    }
    if(method==='apiSave'){
     if(auth.guest)return error('GUEST','Guest play does not save to the cloud.');
     const u=this.one('SELECT * FROM users WHERE id=?',auth.uid),saved=parseSaveJson_(u.savedata);
     if(Number(payload.baseRevision)!==u.revision)return {ok:false,code:'REVISION_CONFLICT',revision:u.revision,saveData:saved};
     return this.writeSave(u,mergePersistentSaveData_(saved,sanitizeSaveData_(payload.saveData),sanitizeDeletedKeys_(payload.deletedKeys)));
    }
    if(method==='apiGetLeaderboard'){
     const rows=this.sql.exec('SELECT id,name,summary,updated FROM users ORDER BY updated DESC LIMIT 500').toArray();
     return {ok:true,currentClassPeriod:'friends',entries:rows.map(u=>{const s=JSON.parse(u.summary);return {name:u.name,classPeriod:'friends',isCurrent:u.id===auth.uid,totalFlies:s.totalFlies,pvpMatchWins:s.pvpMatchWins,records:s.levelRecords,lastUpdated:new Date(u.updated).toISOString()};})};
    }
    if(['apiOnlineCreateRoom','apiOnlineJoinRoom','apiQuickplayEnter'].includes(method)&&!this.limit('rooms:'+auth.uid,20,60))return error('RATE_LIMIT','Too many room requests. Wait a minute.');
    if(method==='apiUpdateProfile')return this.authResponse(auth); // Login usernames are immutable; online display name is separate.
    return this.runtime(auth,presence).call(method,payload);
   });
   // Refresh the real-time room's authority/lease after processing state changes.
   if(auth&&payload.roomCode&&payload.playerToken&&result.ok){
    const meta=this.runtime(auth).metadata(payload);
    if(meta)this.ctx.waitUntil(this.env.ROOMS.getByName(roomName(meta)).fetch(new Request('https://internal/policy',{method:'POST',body:JSON.stringify({...this.stamp(meta),sessionHash:auth.hash})})).catch(()=>{}));
   }
   return json(result,200,setCookie?{'Set-Cookie':setCookie}:{});
  }catch(e){console.error('Friends API operation failed:',method,e?.message);return json(error('SERVER_ERROR','The server could not complete this request. Retry; your saved account has not been reset.'),500);}
 }
 // Internal binding-only lease validation. Never an externally exposed HTTP route.
 async lease(info){
  const s=this.one('SELECT * FROM sessions WHERE hash=?',info.sessionHash);
  if(!s||s.uid!==info.uid||s.expires<=Date.now())return false;
  const id=this.runtime({...s,guest:!!s.guest}).roomIdentity(info.roomCode);
  if(!id||id.epoch!==info.epoch||id.pairId!==info.pairId)return false;
  const control=JSON.parse(this.cache.get('RR_ONLINE_D2:'+info.roomCode+':'+info.epoch+':CONTROL3')||'{}');
  const own=JSON.parse(this.cache.get('RR_ONLINE_D2:'+info.roomCode+':'+info.epoch+':'+info.role)||'null');
  return !!own&&!own.left&&!control.aborted&&control.cpuIndex!==(info.role==='host'?0:1);
 }
}
