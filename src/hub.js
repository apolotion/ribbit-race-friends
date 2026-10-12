import {DurableObject} from 'cloudflare:workers';
import {BUILD,digest,randomHex,equal,pinHash,json,error,roomName,cookieValue,sessionCookie,limitedJson} from './common.js';
import {sanitizeSaveData_,sanitizeDeletedKeys_,mergePersistentSaveData_,parseSaveJson_,summarizeSave_} from './save-data.js';
import {createRoomApi} from './rooms-core.js';
import vocabulary from './vocabulary.json' with {type:'json'};

// A private SQLite-backed hub stores accounts, session hashes, cloud saves and matchmaking.
// Per-room WebSocket traffic never passes through this database.
export class FriendsHub extends DurableObject {
 constructor(ctx,env){
  super(ctx,env);this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;this.lastCleanup=0;
  this.sql.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, keyhash TEXT NOT NULL, savedata TEXT NOT NULL, revision INTEGER NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL, summary TEXT NOT NULL)');
  try{this.sql.exec("ALTER TABLE users ADD COLUMN pinsalt TEXT NOT NULL DEFAULT ''");}catch(_){}
  try{this.sql.exec("ALTER TABLE users ADD COLUMN pinhash TEXT NOT NULL DEFAULT ''");}catch(_){}
  this.sql.exec('CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, uid TEXT NOT NULL, marker TEXT NOT NULL, guest INTEGER NOT NULL, name TEXT NOT NULL, expires INTEGER NOT NULL)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS sessions_exp ON sessions(expires)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS sessions_uid ON sessions(uid)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS temporary (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS temporary_exp ON temporary(expires)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS persistent (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS awards (matchid TEXT PRIMARY KEY, uid TEXT NOT NULL, created INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS record_replays (uid TEXT NOT NULL, username TEXT NOT NULL, level TEXT NOT NULL, metric TEXT NOT NULL, value REAL NOT NULL, mime TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(uid,level,metric))');
  this.sql.exec('CREATE INDEX IF NOT EXISTS record_replays_lookup ON record_replays(username,level,metric)');
  const get=(key)=>{const r=this.one('SELECT value,expires FROM temporary WHERE key=?',key);return r&&r.expires>Date.now()?r.value:null;};
  const put=(key,value,seconds)=>{this.sql.exec('INSERT INTO temporary(key,value,expires) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,expires=excluded.expires',String(key),String(value),Date.now()+Math.max(1,Math.min(21600,seconds||600))*1000);};
  this.cache={get,put,getAll:keys=>Object.fromEntries(keys.map(k=>[k,get(k)]).filter(([,v])=>v!==null)),putAll:(o,s)=>{for(const[k,v]of Object.entries(o))put(k,v,s);},remove:k=>this.sql.exec('DELETE FROM temporary WHERE key=?',k),removeAll:ks=>{for(const k of ks)this.sql.exec('DELETE FROM temporary WHERE key=?',k);}};
  this.props={getProperty:k=>this.one('SELECT value FROM persistent WHERE key=?',k)?.value||null,
   setProperty:(k,v)=>this.sql.exec('INSERT INTO persistent(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',k,String(v)),
   deleteProperty:k=>this.sql.exec('DELETE FROM persistent WHERE key=?',k),
   setProperties:o=>{for(const[k,v]of Object.entries(o))this.props.setProperty(k,v);}};

  // Run once during construction and again on each Hub request. The per-request
  // call is intentional: Cloudflare may keep a Durable Object warm while a Worker
  // environment variable is added, so constructor-only recovery can be missed.
  this.runOwnerLegacyCleanup();
 }
 runOwnerLegacyCleanup(){
  const username=String(this.env.OWNER_DELETE_LEGACY_USERNAME||'').normalize('NFKC').trim().toLowerCase();
  if(!username||!/^[\p{L}\p{N}_-]{3,20}$/u.test(username))return null;
  const recoveryMarker='OWNER_LEGACY_DELETE_V2:'+digest(username).slice(0,32);
  const prior=this.props.getProperty(recoveryMarker);
  if(prior){try{return JSON.parse(prior);}catch(_){return {status:'already-processed',username};}}
  const old=this.one('SELECT id,username,pinhash FROM users WHERE username=?',username);
  let result;
  if(!old){
   result={status:'not-found',username,at:Date.now()};
  }else if(String(old.pinhash||'')){
   // Never use this owner cleanup to erase an account that already has a PIN.
   result={status:'refused-pin-account',username:old.username,at:Date.now()};
  }else{
   this.runtime({uid:old.id,marker:'',guest:false,expires:0}).deletePrivate(old.id);
   this.sql.exec('DELETE FROM sessions WHERE uid=?',old.id);
   this.sql.exec('DELETE FROM awards WHERE uid=?',old.id);
   this.sql.exec('DELETE FROM record_replays WHERE uid=?',old.id);
   this.sql.exec('DELETE FROM users WHERE id=?',old.id);
   result={status:'deleted-legacy',username:old.username,at:Date.now()};
  }
  this.props.setProperty(recoveryMarker,JSON.stringify(result));
  console.log('Owner legacy account cleanup:',JSON.stringify(result));
  return result;
 }
 one(q,...p){return this.sql.exec(q,...p).toArray()[0]||null;}
 tx(fn){return this.ctx.storage.transactionSync(fn);}
 cleanup(){if(Date.now()-this.lastCleanup<60000)return;this.lastCleanup=Date.now();this.sql.exec('DELETE FROM sessions WHERE expires < ?',Date.now());this.sql.exec('DELETE FROM temporary WHERE expires < ?',Date.now());}
 limit(key,maximum,seconds){const k='LIMIT:'+key,r=JSON.parse(this.cache.get(k)||'null')||{n:0,until:Date.now()+seconds*1000};if(r.n>=maximum)return false;r.n++;this.cache.put(k,JSON.stringify(r),Math.ceil((r.until-Date.now())/1000));return true;}
 readAuth(request){const token=cookieValue(request);if(!/^[a-f0-9]{64}$/.test(token))return null;const s=this.one('SELECT * FROM sessions WHERE hash=?',digest(token));if(!s||s.expires<=Date.now())return null;if(!s.guest&&!this.one('SELECT id FROM users WHERE id=?',s.uid))return null;return {...s,guest:!!s.guest};}
 validMarker(a,p){return a&&equal(p.sessionToken||p.guestToken||'',a.marker);}
 createSession(uid,name,guest=false){const token=randomHex(),s={hash:digest(token),uid,marker:randomHex(16),guest:guest?1:0,name,expires:Date.now()+(guest?21600:2592000)*1000};this.sql.exec('INSERT INTO sessions(hash,uid,marker,guest,name,expires) VALUES(?,?,?,?,?,?)',s.hash,s.uid,s.marker,s.guest,s.name,s.expires);return {token,auth:{...s,guest},seconds:guest?21600:2592000};}
 authResponse(a){const u=this.one('SELECT * FROM users WHERE id=?',a.uid);if(!u)return error('SESSION_EXPIRED','Sign in again.');return {ok:true,profileComplete:true,studentId:u.id,name:u.name,displayName:u.name,sessionToken:a.marker,classPeriod:'friends',classPeriods:['friends'],revision:u.revision,saveData:parseSaveJson_(u.savedata),autosaveSeconds:30,vocabulary,vocabularySource:'friends',friendsVersion:1,pinReady:!!u.pinhash};}
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
 replayLevel(value){const level=String(value||'').toLowerCase();return ['park','swamp','jungle','pond','lake','garden'].includes(level)?level:'';}
 replayMetric(value){const metric=String(value||'').toLowerCase();return ['time','jumps'].includes(metric)?metric:'';}
 replayHealth(request){
  const auth=this.readAuth(request);
  return json({ok:true,service:'record-replays',storage:'durable-object-sqlite',signedIn:!!auth&&!auth.guest,guest:!!auth?.guest,maxReplayBytes:3900000});
 }
 async replayGet(request,url){
  const auth=this.readAuth(request);if(!auth)return json(error('SESSION_EXPIRED','Sign in or use guest play to view replays.'),401);
  const username=String(url.searchParams.get('username')||'').normalize('NFKC').trim().toLowerCase();
  const level=this.replayLevel(url.searchParams.get('level')),metric=this.replayMetric(url.searchParams.get('metric'));
  if(!username||!level||!metric)return json(error('INVALID_REPLAY','Choose a player, level and record category.'),400);
  const row=this.one('SELECT mime,data,value,updated FROM record_replays WHERE username=? AND level=? AND metric=?',username,level,metric);
  if(!row)return json(error('REPLAY_NOT_FOUND','This record was made before replay capture was enabled.'),404);
  return json({ok:true,username,level,metric,value:Number(row.value),mime:row.mime,data:row.data,updated:Number(row.updated)});
 }
 async replaySubmit(request){
  const auth=this.readAuth(request);if(!auth||auth.guest)return json(error('SESSION_EXPIRED','Sign in to save a record replay.'),401);
  if(request.method!=='POST')return json(error('METHOD_NOT_ALLOWED','Replay submission requires POST.'),405);
  let payload;try{payload=await limitedJson(request,4_500_000);}catch(e){return json(error('INVALID_REQUEST',e.message),400);}
  const user=this.one('SELECT id,username,name FROM users WHERE id=?',auth.uid);
  if(!user)return json(error('ACCOUNT_NOT_FOUND','The account no longer exists.'),404);
  const requested=String(payload.username||'').normalize('NFKC').trim().toLowerCase();
  if(requested&&requested!==user.username)return json(error('REPLAY_ACCOUNT_MISMATCH','A replay can only be saved to the signed-in account.'),403);
  const level=this.replayLevel(payload.level);
  const time=Number(payload.time),jumps=Math.floor(Number(payload.jumps));
  const mime=String(payload.mime||'video/webm').toLowerCase();
  const data=String(payload.data||'').trim();
  if(!level||!Number.isFinite(time)||time<=0||time>3600||!Number.isFinite(jumps)||jumps<0||jumps>100000)return json(error('INVALID_REPLAY','Replay timing or level data is invalid.'),400);
  if(!/^video\/webm(?:;|$)/.test(mime)||data.length<32||data.length>3_900_000||!/^[A-Za-z0-9+/=]+$/.test(data))return json(error('INVALID_REPLAY','Replay video data is invalid or too large.'),400);
  const now=Date.now(),stored=[];
  const saveMetric=(metric,value)=>{
   const previous=this.one('SELECT value FROM record_replays WHERE uid=? AND level=? AND metric=?',user.id,level,metric);
   const better=!previous||(metric==='time'?value<Number(previous.value):value<Number(previous.value));
   if(!better)return;
   this.sql.exec('INSERT INTO record_replays(uid,username,level,metric,value,mime,data,updated) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(uid,level,metric) DO UPDATE SET username=excluded.username,value=excluded.value,mime=excluded.mime,data=excluded.data,updated=excluded.updated',user.id,user.username,level,metric,value,mime,data,now);
   stored.push(metric);
  };
  saveMetric('time',time);saveMetric('jumps',jumps);
  return json({ok:true,stored,level,time,jumps});
 }
 async fetch(request){
  this.runOwnerLegacyCleanup();
  const requestUrl=new URL(request.url);
  if(requestUrl.pathname==='/api/replays/health')return this.replayHealth(request);
  if(requestUrl.pathname==='/api/replays/get')return this.replayGet(request,requestUrl);
  if(requestUrl.pathname==='/api/replays/submit')return this.replaySubmit(request);
  const method=requestUrl.pathname.split('/').pop();let payload;
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
     const pin=String(payload.pin||'').trim();if(!/^\d{4}$/.test(pin))return error('INVALID_PIN','Choose exactly four numbers for your PIN.');
     const uid=crypto.randomUUID(),salt=randomHex(16),now=Date.now();
     this.sql.exec('INSERT INTO users(id,username,name,keyhash,savedata,revision,created,updated,summary,pinsalt,pinhash) VALUES(?,?,?,?,?,?,?,?,?,?,?)',uid,key,name,'','{}',0,now,now,JSON.stringify(summarizeSave_({})),salt,pinHash(uid,pin,salt));
     if(auth)this.sql.exec('DELETE FROM sessions WHERE hash=?',auth.hash);
     const session=this.createSession(uid,name);setCookie=sessionCookie(request.url,session.token,session.seconds);
     return this.authResponse(session.auth);
    }
    if(method==='apiLogin'){
     if(!this.limit('login:'+ip,30,600))return error('RATE_LIMIT','Too many attempts. Wait ten minutes.');
     const username=String(payload.username||'').normalize('NFKC').trim().toLowerCase(),pin=String(payload.pin||'').trim();
     if(!/^\d{4}$/.test(pin))return error('INVALID_LOGIN','Enter your username and 4-digit PIN.');
     const u=this.one('SELECT * FROM users WHERE username=?',username);
     if(!u)return error('INVALID_LOGIN','Username or PIN was not recognized.');
     if(!u.pinhash)return error('LEGACY_KEY_REQUIRED','This account uses an obsolete private key. Contact the game owner for recovery or deletion.');
     if(!equal(u.pinhash,pinHash(u.id,pin,u.pinsalt)))return error('INVALID_LOGIN','Username or PIN was not recognized.');
     if(auth)this.sql.exec('DELETE FROM sessions WHERE hash=?',auth.hash);
     const ss=this.createSession(u.id,u.name);setCookie=sessionCookie(request.url,ss.token,ss.seconds);return this.authResponse(ss.auth);
    }
    if(method==='apiMigrateLegacyKey'){
     if(!this.limit('migrate:'+ip,12,600))return error('RATE_LIMIT','Too many migration attempts. Wait ten minutes.');
     const username=String(payload.username||'').normalize('NFKC').trim().toLowerCase(),key=String(payload.key||'').replace(/[-\s]/g,'').toLowerCase(),pin=String(payload.pin||'').trim();
     if(!/^\d{4}$/.test(pin))return error('INVALID_PIN','Choose exactly four numbers for your new PIN.');
     const u=this.one('SELECT * FROM users WHERE username=?',username);
     if(!u||!u.keyhash||!equal(u.keyhash,digest(u.id+':'+key)))return error('INVALID_LOGIN','Username or old private key was not recognized.');
     const salt=randomHex(16);this.sql.exec('UPDATE users SET pinsalt=?,pinhash=?,keyhash=? WHERE id=?',salt,pinHash(u.id,pin,salt),'',u.id);
     this.sql.exec('DELETE FROM sessions WHERE uid=?',u.id);const ss=this.createSession(u.id,u.name);setCookie=sessionCookie(request.url,ss.token,ss.seconds);return this.authResponse(ss.auth);
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
    if(!['apiAccount','apiExport','apiChangePin','apiDeleteAccount'].includes(method)&&!this.validMarker(auth,payload))return error('SESSION_EXPIRED','Your account changed in another tab. Refresh before saving.');
    if(!this.limit('api:'+auth.uid,500,60))return error('RATE_LIMIT','Too many requests. Wait a moment.');
    if(['apiLoad','apiAccount'].includes(method))return auth.guest?{ok:true,guest:true,name:auth.name}:this.authResponse(auth);
    if(method==='apiExport')return auth.guest?error('GUEST','Guest play has no cloud save.'):{...this.authResponse(auth),exportedAt:new Date().toISOString()};
    if(['apiChangePin','apiDeleteAccount'].includes(method)){
     if(auth.guest)return error('GUEST','Sign in to a saved account.');
     if(!this.limit('manage:'+auth.uid,10,600))return error('RATE_LIMIT','Too many PIN attempts. Wait ten minutes.');
     const u=this.one('SELECT * FROM users WHERE id=?',auth.uid),pin=String(payload.pin||'').trim();
     if(!u.pinhash)return error('LEGACY_KEY_REQUIRED','This legacy account requires owner recovery before it can use a PIN.');
     if(!/^\d{4}$/.test(pin)||!equal(u.pinhash,pinHash(u.id,pin,u.pinsalt)))return error('INVALID_PIN','The current PIN was not recognized.');
     if(method==='apiDeleteAccount'){
      if(payload.confirm!==u.name)return error('CONFIRM','Type your exact username to confirm deletion.');
      this.runtime(auth).deletePrivate(u.id);this.sql.exec('DELETE FROM sessions WHERE uid=?',u.id);this.sql.exec('DELETE FROM users WHERE id=?',u.id);
      this.sql.exec('DELETE FROM awards WHERE uid=?',u.id);this.sql.exec('DELETE FROM record_replays WHERE uid=?',u.id);setCookie=sessionCookie(request.url,'',0);
      return {ok:true,deleted:true,message:'Account and cloud save deleted. Historical opponents may retain past matchup records.'};
     }
     const nextPin=String(payload.newPin||'').trim();if(!/^\d{4}$/.test(nextPin))return error('INVALID_PIN','Choose exactly four numbers for the new PIN.');
     const salt=randomHex(16);this.sql.exec('UPDATE users SET pinsalt=?,pinhash=? WHERE id=?',salt,pinHash(u.id,nextPin,salt),u.id);
     this.sql.exec('DELETE FROM sessions WHERE uid=?',u.id);const ss=this.createSession(u.id,u.name);
     setCookie=sessionCookie(request.url,ss.token,ss.seconds);return {ok:true,name:u.name,message:'PIN changed. Other devices were signed out.'};
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


// RR170_LIVE_MATCH_ENDPOINTS — live-match discovery for private and Quickplay spectators.
const RR170_LIVE_MATCH_ENDPOINTS = true;
(() => {
  if (typeof FriendsHub !== "function") return;
  const originalFetch = FriendsHub.prototype.fetch;
  const jsonResponse = (value, status=200) => new Response(JSON.stringify(value), {
    status,
    headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
  });
  const readJson = async request => {
    try { return await request.json(); } catch (_) { return {}; }
  };
  const cleanText = (v,n=40) => String(v||"").replace(/[<>\x00-\x1f]/g,"").trim().slice(0,n);
  const cleanAppearance = value => {
    if (!value || typeof value !== "object") return null;
    const out = {id:cleanText(value.id,24),name:cleanText(value.name,24),hat:cleanText(value.hat,40)};
    for (const key of ["dark","mid","light","belly","accents","bump","crest","arms","feet","tongue","tongueDark"]) {
      if (/^#[0-9a-f]{6}$/i.test(String(value[key]||""))) out[key]=String(value[key]);
    }
    return out;
  };
  FriendsHub.prototype.fetch = async function(request) {
    const url = new URL(request.url);
    const op = url.pathname.split("/").filter(Boolean).pop() || "";
    if (op === "apiLiveMatchHeartbeat") {
      const data = await readJson(request);
      const roomCode = cleanText(data.roomCode,16).toUpperCase();
      if (!roomCode) return jsonResponse({ok:false,code:"ROOM_REQUIRED"},400);
      const record = {
        roomCode,
        quickplay:!!data.quickplay,
        phase:cleanText(data.phase,24)||"playing",
        hostName:cleanText(data.hostName,28)||"PLAYER 1",
        guestName:cleanText(data.guestName,28)||"PLAYER 2",
        hostAppearance:cleanAppearance(data.hostAppearance),
        guestAppearance:cleanAppearance(data.guestAppearance),
        matchId:cleanText(data.matchId,100),
        updatedAt:Date.now(),
        expiresAt:Date.now()+20000
      };
      const storage=this.ctx?.storage||this.state?.storage;
      if(!storage)return jsonResponse({ok:false,code:"STORAGE_UNAVAILABLE"},503);
      await storage.put("rr170-live:"+roomCode,record);
      return jsonResponse({ok:true});
    }
    if (op === "apiLiveMatchEnded") {
      const data = await readJson(request);
      const roomCode=cleanText(data.roomCode,16).toUpperCase();
      const storage=this.ctx?.storage||this.state?.storage;
      if(roomCode&&storage) await storage.delete("rr170-live:"+roomCode);
      return jsonResponse({ok:true});
    }
    if (op === "apiListLiveMatches") {
      const storage=this.ctx?.storage||this.state?.storage;
      if(!storage)return jsonResponse({ok:false,code:"STORAGE_UNAVAILABLE"},503);
      const values=await storage.list({prefix:"rr170-live:"});
      const now=Date.now(), matches=[];
      for(const [key,value] of values) {
        if(!value || Number(value.expiresAt||0)<=now) { await storage.delete(key); continue; }
        matches.push(value);
      }
      matches.sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0));
      return jsonResponse({ok:true,matches:matches.slice(0,100),serverTime:now});
    }
    return originalFetch.call(this,request);
  };
})();
