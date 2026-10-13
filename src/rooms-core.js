import {Buffer} from 'node:buffer';
// Current room lifecycle/Quickplay/replay logic, ported from Direct Connect 2.
// Compatibility names (studentId/directProof) are private wire-schema fields only.
// No Google runtime, school identifiers, PINs, or school URLs are included.
import {createHash, timingSafeEqual} from 'node:crypto';
import {summarizeSave_,mergePersistentSaveData_} from './save-data.js';
import {BUILD} from './common.js';
export function createRoomApi({cache,props,auth,store,socketPresence}) {
 const Utilities={getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},
  computeDigest:(alg,value)=>[...createHash('sha256').update(String(value)).digest()],
  newBlob:v=>({getBytes:()=>[...new TextEncoder().encode(String(v))],getDataAsString:()=>String(v)}),
  base64DecodeWebSafe:v=>Buffer.from(v,'base64url').toString('utf8')};
 const CacheService={getScriptCache:()=>cache};
 const PropertiesService={getScriptProperties:()=>props};
 let locked=false;
 const lock={tryLock:()=>{locked=true;return true;},hasLock:()=>locked,releaseLock:()=>{locked=false;}};
 // FriendsHub runs each operation in one synchronous SQLite transaction; no cross-request lock is needed.
 const LockService={getScriptLock:()=>lock};
 const safeEqual_=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const RR_ONLINE = Object.freeze({
  PROTOCOL: 3, ROOM_PREFIX: 'RR_ONLINE_D2:', RESULT_PREFIX: 'RR_ONLINE_D2_RESULT:',
  ROOM_SECONDS: 3600, RESULT_SECONDS: 21600, OPPONENT_TIMEOUT_MS: 30000,
  MAX_INPUTS: 96, MAX_INPUTS_PER_REQUEST: 32, MAX_SNAPSHOT_BYTES: 62000,
  MAX_APPEARANCE_BYTES: 1800, MAX_ROOM_BYTES: 95000, ROOM_CODE_LENGTH: 5,
  ALPHABET: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
});

function apiOnlineDiagnostic() {
 return {ok:true,build:BUILD,friendsVersion:1,transport:'cloudflare-websocket',
  googleRequired:false,cloudSave:true,protocol:3,quickplayVersion:3,saveCompatibility:rrDirectSaveCompatibility_()};
}

function rrOnlineError_(code,message) { return {ok:false,code:code,message:message}; }
function rrOnlineNow_() { return Date.now(); }
function rrOnlineJson_(value,fallback) { try { return JSON.parse(value || 'null') || fallback; } catch(_) { return fallback; } }
function rrOnlineClone_(value) { return JSON.parse(JSON.stringify(value)); }
function rrOnlineHash_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8)
    .map(b => ((b + 256) % 256).toString(16).padStart(2,'0')).join('');
}
function rrOnlineToken_() { return Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,''); }
function rrOnlineRoomKey_(code) { return RR_ONLINE.ROOM_PREFIX + code; }
function rrOnlineMailKey_(room,role) { return rrOnlineRoomKey_(room.code) + ':' + room.epoch + ':' + role; }
function rrOnlineCode_(v) { const c=String(v||'').toUpperCase().replace(/[^A-Z2-9]/g,''); return c.length===5?c:''; }
function rrOnlineCodeNew_() { let c=''; for(let i=0;i<5;i++) c+=RR_ONLINE.ALPHABET[Math.floor(Math.random()*RR_ONLINE.ALPHABET.length)]; return c; }
function rrOnlineReadRoom_(cache,code) { const r=rrOnlineJson_(cache.get(rrOnlineRoomKey_(code)),null); return r&&r.version===3?r:null; }
function rrOnlinePut_(cache,key,value) {
  const json=JSON.stringify(value);
  if(Utilities.newBlob(json).getBytes().length > RR_ONLINE.MAX_ROOM_BYTES) throw new Error('ROOM_TOO_LARGE: Return to the lobby and create a new room.');
  cache.put(key,json,RR_ONLINE.ROOM_SECONDS);
}
function rrOnlineAuthenticate_(req) {
 if(!auth)return rrOnlineError_('SESSION_EXPIRED','Sign in or choose guest play.');
 return {ok:true,studentId:auth.uid,isGuest:auth.guest,sessionHash:rrOnlineHash_(auth.guest?'guest:'+auth.marker:auth.marker),
  expiresAt:Math.min(auth.expires,Date.now()+3600000),name:rrOnlineStoredName_(auth.uid,auth.name)};
}
function rrOnlineMember_(auth,token) {
  return {studentId:auth.studentId,isGuest:!!auth.isGuest,tokenHash:rrOnlineHash_(token),sessionHash:auth.sessionHash,expiresAt:auth.expiresAt,name:auth.name||'PLAYER'};
}
function rrOnlineRole_(room,req) {
 if(!auth||!room||!req?.playerToken)return '';
 const h=rrOnlineHash_(String(req.playerToken));
 for(const role of ['host','guest']){const m=room[role];
  if(m&&m.studentId===auth.uid&&m.expiresAt>Date.now()&&safeEqual_(m.tokenHash,h))return role;}
 return '';
}
function rrOnlineSkin_(v) { const s=String(v||''); return /^(azure|crimson|plum|forest|violet|silver|blossom|ember|custom[1-3])$/.test(s)?s:'azure'; }
function rrOnlineAppearance_(v) {
  if(!v||typeof v!=='object'||Array.isArray(v)) return null;
  const out={id:rrOnlineSkin_(v.id),name:String(v.name||'FROG').replace(/[<>\x00-\x1f]/g,'').slice(0,20)};
  ['dark','mid','light','belly','accents','bump','crest','arms','feet','tongue','tongueDark'].forEach(k=>{if(/^#[0-9a-f]{6}$/i.test(String(v[k]||'')))out[k]=v[k];});
  out.hat=String(v.hat||'none').replace(/[^a-z0-9-]/g,'').slice(0,40)||'none';
  return out;
}
function rrOnlineSettings_(v) {
  v=v||{};
  return {stage:/^(park|swamp|jungle|pond|lake|garden|random)$/.test(v.stage)?v.stage:'park',
    roundGoal:/^(first5|first10|endless)$/.test(v.roundGoal)?v.roundGoal:'first5',
    bestOf:[1,3,5].includes(Number(v.bestOf))?Number(v.bestOf):3,
    timeLimit:[0,30,60,90].includes(Number(v.timeLimit))?Number(v.timeLimit):0,
    timeOfDay:/^(afternoon|morning|night)$/.test(v.timeOfDay)?v.timeOfDay:'random', unpause:v.unpause!==false};
}
function rrOnlineVocab_(v) {
  if(!Array.isArray(v))return [];
  return v.slice(0,250).map(p=>({english:String(p&&p.english||'').replace(/[\x00-\x1f]/g,' ').slice(0,80),
    spanish:String(p&&p.spanish||'').replace(/[\x00-\x1f]/g,' ').slice(0,80)})).filter(p=>p.english&&p.spanish);
}
function rrOnlineNewMail_(req,role) {
  return {lastSeen:Date.now(),requestSeq:0,displayName:req?.displayName?rrOnlineDisplayName_(req.displayName):'',lobbyRevision:1,ready:false,readyForSettings:0,
    skinId:rrOnlineSkin_(req&&req.skinId),appearance:rrOnlineAppearance_(req&&req.appearance),
    settings:role==='host'?rrOnlineSettings_(req&&req.settings):null,settingsRevision:1,settingsEditing:false,
    vocabulary:role==='host'?rrOnlineVocab_(req&&req.vocabulary):[],
    inputs:[],acceptedInputSequence:0,ackInputSequence:0,inputCount:0,snapshotCount:0,
    snapshot:null,snapshotSequence:0,phase:'lobby',startSequence:0,startAt:0,startConfig:null,
    nextRoundSequence:0,nextRoundCommandId:'',returnLobbyCommandId:'',returnSeenId:'',lobbyEpoch:1,
    result:null,matchId:'',directProof:null,directAdmittedMatchId:'',peerSignal:null,catchClaims:[],acceptedClaimSequence:0,ackClaimSequence:0};
}
function apiOnlineCreateRoom(req) {
  const directError=rrDirectClientError_(req,true);if(directError)return directError;
  if(Number(req&&req.protocol)!==3)return rrOnlineError_('UPDATE_REQUIRED','Refresh both laptops to use Online Versus 3.');
  const auth=rrOnlineAuthenticate_(req); if(!auth.ok)return auth;
  if(req.displayName)auth.name=rrOnlineDisplayName_(req.displayName,auth.name);
  const lock=LockService.getScriptLock(); if(!lock.tryLock(500))return rrOnlineError_('ROOM_BUSY','Room server busy. Try again.');
  try {
    const cache=CacheService.getScriptCache(); let code='';
    for(let i=0;i<20;i++){const c=rrOnlineCodeNew_();if(!cache.get(rrOnlineRoomKey_(c))){code=c;break;}}
    if(!code)return rrOnlineError_('ROOM_BUSY','Could not assign a room. Try again.');
    const token=rrOnlineToken_(),room={version:3,code,epoch:Utilities.getUuid(),createdAt:Date.now(),direct:rrDirectNewPair_(),host:rrOnlineMember_(auth,token),guest:null};
    rrOnlinePut_(cache,rrOnlineRoomKey_(code),room);
    rrOnlinePut_(cache,rrOnlineMailKey_(room,'host'),rrOnlineNewMail_(req,'host'));
    rrQuickRegisteredRoom_(cache,room);
    return {ok:true,protocol:3,roomCode:code,playerToken:token,role:'host',epoch:room.epoch,directOnlyVersion:2,directPolicy:rrDirectPolicy_(room,'host')};
  } finally {lock.releaseLock();}
}
function apiOnlineJoinRoom(req) {
  const directError=rrDirectClientError_(req,true);if(directError)return directError;
  if(Number(req&&req.protocol)!==3)return rrOnlineError_('UPDATE_REQUIRED','Refresh both laptops to use Online Versus 3.');
  const auth=rrOnlineAuthenticate_(req);if(!auth.ok)return auth;
  if(req.displayName)auth.name=rrOnlineDisplayName_(req.displayName,auth.name);
  const code=rrOnlineCode_(req&&req.roomCode);if(!code)return rrOnlineError_('INVALID_ROOM_CODE','Enter the five-character room code.');
  const lock=LockService.getScriptLock();if(!lock.tryLock(500))return rrOnlineError_('ROOM_BUSY','Room server busy. Try again.');
  try {
    const cache=CacheService.getScriptCache(),room=rrOnlineReadRoom_(cache,code);
    if(!room)return rrOnlineError_('ROOM_EXPIRED','Room not found or expired. Ask the host for a new code.');
    if(room.quickplay)return rrOnlineError_('QUICKPLAY_ROOM','Use Quickplay to find an opponent; this is a reserved matchmaking room.');
    if(room.host.studentId===auth.studentId)return rrOnlineError_('SAME_PLAYER','Use two different player sessions.');
    if(room.guest&&room.guest.studentId!==auth.studentId)return rrOnlineError_('ROOM_FULL','That room already has two players.');
    const host=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,'host')),null);
    if(!host)return rrOnlineError_('ROOM_EXPIRED','Room expired. Ask the host for a new code.');
    if(!['lobby','finished'].includes(host.phase))return rrOnlineError_('MATCH_IN_PROGRESS','This match already started. Wait for a new lobby.');
    const token=rrOnlineToken_();room.guest=rrOnlineMember_(auth,token);room.direct=rrDirectNewPair_();
    // Rejoining or replacing a guest invalidates every previous peer proof.
    host.ready=false;host.readyForSettings=0;host.directProof=null;host.peerSignal=null;
    if(host.phase==='finished'){host.phase='lobby';host.matchId='';host.startConfig=null;host.snapshot=null;host.lobbyEpoch++;host.settingsRevision++;}
    rrOnlinePut_(cache,rrOnlineMailKey_(room,'host'),host);
    rrOnlinePut_(cache,rrOnlineRoomKey_(code),room);
    rrOnlinePut_(cache,rrOnlineMailKey_(room,'guest'),rrOnlineNewMail_(req,'guest'));
    return {ok:true,protocol:3,roomCode:code,playerToken:token,role:'guest',epoch:room.epoch,directOnlyVersion:2,directPolicy:rrDirectPolicy_(room,'guest')};
  } finally {lock.releaseLock();}
}
function rrOnlineInput_(events) {
  if(!Array.isArray(events))return [];
  return events.slice(0,RR_ONLINE.MAX_INPUTS_PER_REQUEST).filter(e=>e&&['down','up'].includes(e.action)&&Number.isSafeInteger(Number(e.sequence))&&Number(e.sequence)>0).map(e=>({
    sequence:Number(e.sequence),action:e.action,sentAt:Math.max(0,Number(e.sentAt)||0),
    charge:Math.max(0.04,Math.min(1,Number(e.charge)||0.04)),
    chargeDirection:Number(e.chargeDirection)<0?-1:1,holdSeconds:Math.max(0,Math.min(60,Number(e.holdSeconds)||0)),
    wasCharging:!!e.wasCharging,serverAt:Math.max(0,Number(e.serverAt)||0),roundKey:String(e.roundKey||'').slice(0,140),matchId:String(e.matchId||'').slice(0,100)
  })).sort((a,b)=>a.sequence-b.sequence);
}
// Signaling stays inside the authenticated room. The paired browser may use
// STUN discovery, but never TURN or Apps Script fallback for live gameplay.
function rrOnlinePeerSignal_(v){return null;}

function rrOnlineClaims_(items) {
  if(!Array.isArray(items))return [];
  return items.slice(0,24).filter(v=>v&&Number.isSafeInteger(v.sequence)&&v.sequence>0).map(v=>({
    sequence:v.sequence,matchId:String(v.matchId||'').slice(0,100),roundKey:String(v.roundKey||'').slice(0,140),
    flyId:Math.max(0,Math.floor(Number(v.flyId)||0)),vocabIndex:Math.max(0,Math.floor(Number(v.vocabIndex)||0)),
    promptSerial:Math.max(0,Math.floor(Number(v.promptSerial)||0)),inputSequence:Math.max(0,Math.floor(Number(v.inputSequence)||0)),
    source:v.source==='tongue'?'tongue':'body',flightAge:Math.max(0,Math.min(5,Number(v.flightAge)||0)),
    serverAt:Math.max(0,Number(v.serverAt)||0),x:Math.max(-30,Math.min(510,Number(v.x)||0)),
    y:Math.max(-300,Math.min(300,Number(v.y)||0)),dir:Number(v.dir)<0?-1:1
  })).sort((a,b)=>a.sequence-b.sequence);
}

function rrOnlineSnapshot_(v,matchId) {
  if(!v||Number(v.protocol)!==3||v.matchId!==matchId||!Array.isArray(v.players)||v.players.length!==2)throw new Error('INVALID_SNAPSHOT: mismatched match.');
  const allowed=['countdown','playing','pvpSuddenDeathAlert','pvpCelebration','won'];
  if(!v.game||!allowed.includes(v.game.state))throw new Error('INVALID_SNAPSHOT: private menu state must not be relayed.');
  const json=JSON.stringify(v);
  if(Utilities.newBlob(json).getBytes().length>RR_ONLINE.MAX_SNAPSHOT_BYTES)throw new Error('SNAPSHOT_TOO_LARGE: refresh the updated game on both laptops.');
  const clean=JSON.parse(json);clean.sequence=Math.max(0,Math.floor(Number(clean.sequence)||0));return clean;
}
function rrOnlineStartConfig_(room,host,guest) {
  const s=room.quickplay?RR_QUICKPLAY.RULES:host.settings,levels=['park','swamp','jungle','pond','lake','garden'];
  const roundStages=room.quickplay?rrQuickStages_():null;
  return {protocol:3,directOnlyVersion:2,directPairId:room.direct.pairId,inputSequenceBase:Number(guest.acceptedInputSequence)||0,claimSequenceBase:Number(guest.acceptedClaimSequence)||0,stage:roundStages?roundStages[0]:(s.stage==='random'?levels[Math.floor(Math.random()*levels.length)]:s.stage),
    requestedStage:s.stage,timeOfDay:s.timeOfDay==='random'?['afternoon','morning','night'][Math.floor(Math.random()*3)]:s.timeOfDay,
    moonPhaseIndex:Math.floor(Math.random()*8),goalMode:s.roundGoal==='endless'?'endless':'firstto',
    firstTo:s.roundGoal==='first10'?10:5,bestOf:s.bestOf,timeLimit:s.roundGoal==='endless'?(s.timeLimit||60):s.timeLimit,
    hostSkin:host.skinId,guestSkin:guest.skinId,hostAppearance:host.appearance,guestAppearance:guest.appearance,
    vocabulary:host.vocabulary,matchId:room.code+'-'+Utilities.getUuid(),unpause:s.unpause,
    quickplay:!!room.quickplay,quickplayVersion:room.quickplay?3:0,roundStages,roundBreakMs:5000,lifecycleVersion:3,
    hostName:host.displayName||room.host?.name||'PLAYER 1',guestName:guest.displayName||room.guest?.name||'PLAYER 2'};
}
function rrOnlinePublic_(mail,role,member) {
  if(!mail)return null;
  return {name:rrOnlineDisplayName_(mail.displayName,member?.name||(role==='host'?'PLAYER 1':'PLAYER 2')),guest:!!member?.isGuest,
    connected:!mail.left&&Date.now()-mail.lastSeen<RR_ONLINE.OPPONENT_TIMEOUT_MS,lastSeen:mail.lastSeen,left:!!mail.left,
    ready:!!mail.ready,lobbyRevision:mail.lobbyRevision,readyForSettings:mail.readyForSettings,skinId:mail.skinId,appearance:mail.appearance};
}
function apiOnlineExchange(req) {
  const directError=rrDirectClientError_(req,false);if(directError)return directError;
  const began=Date.now();
  if(Number(req?.protocol)!==3||Number(req?.lifecycleVersion)!==3)return rrOnlineError_('UPDATE_REQUIRED','Deploy the matching Friends Edition on both devices.');
  const code=rrOnlineCode_(req.roomCode),cache=CacheService.getScriptCache(),room=rrOnlineReadRoom_(cache,code);
  if(!room)return rrOnlineError_('ROOM_EXPIRED','Room expired. Create a new room.');
  const role=rrOnlineRole_(room,req);if(!role)return rrOnlineError_('ROOM_AUTH_FAILED','Room session expired. Reopen Online.');
  const keys={host:rrOnlineMailKey_(room,'host'),guest:rrOnlineMailKey_(room,'guest')},values=cache.getAll([keys.host,keys.guest]);
  const mails={host:rrOnlineJson_(values[keys.host],null),guest:room.guest?rrOnlineJson_(values[keys.guest],null):null};
  if(!mails[role])return rrOnlineError_('ROOM_EXPIRED','Temporary room state expired. Create a new room.');
  let control=rrOnlineControl_(cache,room);
  if(control.aborted)return rrOnlineError_('DIRECT_PAIR_CLOSED',control.reason||'This server pairing ended. Try another opponent.');
  if(!room.direct||room.direct.version!==2)return rrOnlineError_('UPDATE_REQUIRED','Create a new Friends Edition room.');
  if(mails[role].left||(control.cpuIndex===(role==='host'?0:1)))return rrOnlineError_('REPLACED_BY_CPU','A level 5 CPU is continuing this match. You can find a new opponent.');
  control=rrOnlineCheckTakeover_(cache,room,role,mails,control,req);
  const authority=control.authorityRole,otherRole=authority==='host'?'guest':'host';
  const host=mails[authority],guest=mails[otherRole],own=mails[role],isAuthority=role===authority;
  if(!host)return rrOnlineError_('ROOM_EXPIRED','The shared match state expired.');
  const resultKey=host.matchId?RR_ONLINE.RESULT_PREFIX+host.matchId:'';
  const finishedResult=resultKey?rrOnlineJson_(cache.get(resultKey),null):null;
  const seq=Math.max(0,Math.floor(Number(req.requestSequence)||0)),isNew=seq>Number(own.requestSeq||0);
  own.lastSeen=Date.now();
  if(isNew){
    own.requestSeq=seq;own.clientRttMs=Math.min(15000,Math.max(0,Number(req.clientRttMs)||0));
    if(req.loadedRoundKey)own.loadedRoundKey=String(req.loadedRoundKey).slice(0,140);
    own.armedSyncRevision=Math.max(0,Math.floor(Number(req.armedSyncRevision)||0));
    if(control.cpuIndex<0&&req.peerSignal){
      const signal=rrOnlinePeerSignal_(req.peerSignal),old=own.peerSignal;
      if(signal&&signal.pairId===room.direct.pairId&&
        (role==='host'?signal.type==='offer':signal.type==='answer'&&signal.replyTo===mails.host?.peerSignal?.id)&&
        (!old||old.pairId!==signal.pairId||signal.attempt>old.attempt||
         (signal.id===old.id&&signal.revision>=old.revision)))own.peerSignal=signal;
    }
    if(control.cpuIndex<0){
      own.directProof=rrDirectAcceptProof_(room,role,req,mails);
      if(!own.directProof){own.ready=false;own.readyForSettings=0;own.quickplayAccepted=false;own.quickplayRematchFor='';}
    }
    if(room.quickplay)own.quickplayAccepted=!!req.quickplayAccepted&&!!own.directProof;
    if(room.quickplay&&own.directProof&&finishedResult&&req.quickplayRematchFor===host.matchId)own.quickplayRematchFor=host.matchId;
    if(host.phase==='lobby'&&control.cpuIndex<0){
      const revision=Math.max(0,Math.floor(Number(req.lobbyRevision)||0));
      if(revision>=own.lobbyRevision){own.lobbyRevision=revision;own.skinId=rrOnlineSkin_(req.skinId);own.appearance=rrOnlineAppearance_(req.appearance);
        own.displayName=rrOnlineDisplayName_(req.displayName,room[role].name);own.ready=!!req.ready&&!!own.directProof;own.readyForSettings=Math.max(0,Math.floor(Number(req.readyForSettings)||0));}
      if(room.quickplay&&own.quickplayAccepted){own.ready=true;own.readyForSettings=1;}
      if(isAuthority){own.settings=room.quickplay?{...RR_QUICKPLAY.RULES}:rrOnlineSettings_(req.settings);own.settingsRevision=room.quickplay?1:Math.max(1,Math.floor(Number(req.settingsRevision)||1));own.settingsEditing=room.quickplay?false:!!req.settingsEditing;}
    }
    if(!isAuthority&&control.cpuIndex<0&&req.matchId===host.matchId&&['starting','playing'].includes(host.phase)){
      own.inputs=(own.inputs||[]).filter(e=>e.sequence>Number(host.ackInputSequence||0));
      for(const e of rrOnlineInput_(req.inputEvents).filter(e=>e.matchId===host.matchId)){
        if(e.sequence<=own.acceptedInputSequence)continue;
        if(own.inputs.length>=RR_ONLINE.MAX_INPUTS)return rrOnlineError_('INPUT_BACKLOG','Waiting for the match host to receive your controls.');
        own.inputs.push(e);own.acceptedInputSequence=e.sequence;own.inputCount++;
      }
      own.catchClaims=(own.catchClaims||[]).filter(c=>c.sequence>Number(host.ackClaimSequence||0));
      for(const c of rrOnlineClaims_(req.catchClaims).filter(c=>c.matchId===host.matchId)){
        if(c.sequence<=Number(own.acceptedClaimSequence||0))continue;if(own.catchClaims.length>=48)break;
        own.catchClaims.push(c);own.acceptedClaimSequence=c.sequence;
      }
    }
    own.held=!!req.held;
    if(isAuthority){
      own.ackClaimSequence=Math.max(Number(own.ackClaimSequence)||0,Math.floor(Number(req.ackClaimSequence)||0));
      own.ackInputSequence=Math.max(Number(own.ackInputSequence)||0,Math.floor(Number(req.ackInputSequence)||0));
      if(req.snapshot&&req.snapshot.matchId===own.matchId&&Number(req.authorityVersion||1)===control.version){
        try{const snap=rrOnlineSnapshot_(req.snapshot,own.matchId);
          if(snap.sequence>own.snapshotSequence){snap.authorityVersion=control.version;own.snapshot=snap;own.snapshotSequence=snap.sequence;own.snapshotStoredAt=Date.now();own.snapshotCount++;}}
        catch(error){return rrOnlineError_('INVALID_SNAPSHOT',error.message);}
      }
      if(req.nextRoundCommand&&req.nextRoundCommand.commandId!==own.nextRoundCommandId&&own.phase==='playing'){
        own.nextRoundCommandId=String(req.nextRoundCommand.commandId).slice(0,100);own.nextRoundSequence++;}
    }
    if(req.returnLobbyCommandId&&control.cpuIndex<0)own.returnLobbyCommandId=String(req.returnLobbyCommandId).slice(0,100);
  }
  if(isAuthority){
    const remoteReturn=guest?.returnLobbyCommandId||'',wantsReturn=control.cpuIndex<0&&((own.returnLobbyCommandId&&own.returnSeenId!==own.returnLobbyCommandId)||(remoteReturn&&own.guestReturnSeenId!==remoteReturn));
    if(wantsReturn){own.returnSeenId=own.returnLobbyCommandId;own.guestReturnSeenId=remoteReturn;own.phase='lobby';own.ready=false;own.startConfig=null;own.snapshot=null;own.snapshotSequence=0;own.matchId='';own.startAt=0;own.lobbyEpoch++;own.settingsRevision++;own.result=null;own.settingsEditing=false;}
    const present=guest&&!guest.left&&Date.now()-guest.lastSeen<RR_ONLINE.OPPONENT_TIMEOUT_MS;
    if(room.quickplay&&finishedResult&&present&&rrDirectPairReady_(room,mails)&&control.cpuIndex<0&&own.quickplayRematchFor===own.matchId&&guest.quickplayRematchFor===own.matchId){
      own.phase='lobby';own.ready=true;own.readyForSettings=1;own.settingsRevision=1;own.settingsEditing=false;own.settings={...RR_QUICKPLAY.RULES};own.quickplayRematchFor='';own.snapshot=null;own.snapshotSequence=0;}
    if(own.phase==='lobby'&&present&&rrDirectPairReady_(room,mails)&&control.cpuIndex<0&&own.ready&&guest.ready&&!own.settingsEditing&&own.readyForSettings===own.settingsRevision&&guest.readyForSettings===own.settingsRevision&&
      (room.quickplay?(own.quickplayAccepted&&guest.quickplayAccepted):own.skinId!==guest.skinId)){
      own.startConfig=rrOnlineStartConfig_(room,own,guest);own.matchId=own.startConfig.matchId;own.directAdmittedMatchId=own.matchId;own.phase='starting';own.startAt=0;own.startSync=null;own.loadedRoundKey='';own.armedSyncRevision=0;
      own.startSequence++;own.snapshot=null;own.snapshotSequence=0;own.replayAck=0;own.snapshotCount=0;own.ackInputSequence=Number(guest.acceptedInputSequence)||0;
      own.matchInputBaseline=Number(guest.inputCount)||0;own.ackClaimSequence=Number(guest.acceptedClaimSequence)||0;own.result=null;
    }
    const syncPartner=control.cpuIndex<0?guest:{loadedRoundKey:own.loadedRoundKey,armedSyncRevision:own.armedSyncRevision,clientRttMs:0};
    if(control.cpuIndex>=0||rrDirectPairReady_(room,mails)||own.startSync?.phase==='playing')rrOnlineSyncRound_(own,syncPartner,req);
    if(isNew&&req.matchId===own.matchId&&Array.isArray(req.replayFrames)&&req.replayFrames.length){try{own.replayAck=rrReplayStore_(cache,room,own,req.replayFrames);}catch(error){console.warn('Replay archive skipped: '+error.message);}}
  }
  try{rrOnlinePut_(cache,keys[role],own);}catch(error){return rrOnlineError_('ROOM_TOO_LARGE',error.message);}
  const result=host.matchId?rrOnlineJson_(cache.get(RR_ONLINE.RESULT_PREFIX+host.matchId),null):null;
  const pub={host:rrOnlinePublic_(mails.host,'host',room.host),guest:rrOnlinePublic_(mails.guest,'guest',room.guest)};
  if(control.cpuIndex>=0){const replaced=control.cpuIndex===0?'host':'guest';if(pub[replaced]){pub[replaced].connected=false;pub[replaced].cpu=true;pub[replaced].name='CPU LV 5';}}
  const response={ok:true,protocol:3,lifecycleVersion:3,directOnlyVersion:2,directPolicy:rrDirectPolicy_(room,role,mails),serverTime:Date.now(),serverMs:Date.now()-began,role,roomCode:code,requestSequence:seq,
    authorityRole:authority,authorityVersion:control.version,cpuIndex:control.cpuIndex,takeover:control.cpuIndex>=0?control:null,
    roomStatus:result?'finished':host.phase,lobbyEpoch:host.lobbyEpoch,quickplay:!!room.quickplay,quickplayVersion:room.quickplay?3:0,
    quickplayRematch:{host:!!host.matchId&&mails.host?.quickplayRematchFor===host.matchId,guest:!!host.matchId&&mails.guest?.quickplayRematchFor===host.matchId},
    players:pub,settings:host.settings,settingsRevision:host.settingsRevision,hostEditing:!!host.settingsEditing,
    startSequence:host.startSequence,startAt:host.startAt,startConfig:null,nextRoundSequence:host.nextRoundSequence,startSync:host.startSync||null,replayAck:Number(host.replayAck)||0,
    snapshotSequence:host.snapshotSequence,latestSnapshot:null,snapshotAgeMs:Math.max(0,Date.now()-(host.snapshotStoredAt||Date.now())),
    acceptedInputSequence:Number(guest?.acceptedInputSequence)||0,processedInputSequence:host.ackInputSequence,
    acceptedClaimSequence:Number(guest?.acceptedClaimSequence)||0,processedClaimSequence:Number(host.ackClaimSequence)||0,
    peerSignal:control.cpuIndex<0?(isAuthority?guest:host)?.peerSignal||null:null,
    // Uploads are audit-only; neither participant receives the hub gameplay data.
    newCatchClaims:[],newInputEvents:[],result};
  if(host.startSequence>Number(req.seenStartSequence||0))response.startConfig=host.startConfig;
  if(control.cpuIndex>=0&&Number(req.authorityVersion||1)<control.version)response.recoverySnapshot=host.snapshot;
  return response;
}
function apiOnlineLeaveRoom(req) {
  const cache=CacheService.getScriptCache(),code=rrOnlineCode_(req?.roomCode),room=rrOnlineReadRoom_(cache,code);
  if(!room)return {ok:true,left:true};const role=rrOnlineRole_(room,req);if(!role)return rrOnlineError_('ROOM_AUTH_FAILED','Room session expired.');
  const departingId=room[role]?.studentId;
  const lock=LockService.getScriptLock();if(!lock.tryLock(400))return rrOnlineError_('ROOM_BUSY','Room busy. Retrying leave.');
  try{
    const control=rrOnlineControl_(cache,room),h=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,control.authorityRole)),null);
    const ownKey=rrOnlineMailKey_(room,role),own=rrOnlineJson_(cache.get(ownKey),null);
    const finished=h?.snapshot?.game?.pvpMatchWinnerIndex;
    const live=!!h?.matchId&&h.directAdmittedMatchId===h.matchId&&['starting','playing'].includes(h.phase)&&finished!==0&&finished!==1;
    if(!live&&room.quickplay){rrDirectAbortPair_(cache,room,'PAIRING ENDED. FIND A NEW OPPONENT.',false);return {ok:true,left:true};}
    if(live){if(own){own.left=true;own.lastSeen=0;own.held=false;own.ready=false;rrOnlinePut_(cache,ownKey,own);}}
    else if(role==='host'||control.authorityRole===role)cache.removeAll([rrOnlineRoomKey_(code),rrOnlineMailKey_(room,'host'),rrOnlineMailKey_(room,'guest'),rrOnlineControlKey_(room)]);
    else {room.guest=null;rrOnlinePut_(cache,rrOnlineRoomKey_(code),room);cache.remove(ownKey);}
    cache.remove(RR_QUICKPLAY.PREFIX+'COUNTS');
    if(room.quickplay)rrQuickReleaseParticipant_(cache,room,role);
    return {ok:true,left:true,replacedByCpu:live,cpuLevel:live?5:null};
  }finally{lock.releaseLock();}
}
function apiOnlineFinishMatch(req) {
  const directError=rrDirectClientError_(req,false);if(directError)return directError;
  const cache=CacheService.getScriptCache(),code=rrOnlineCode_(req?.roomCode),room=rrOnlineReadRoom_(cache,code);
  if(!room)return rrOnlineError_('ROOM_EXPIRED','Room expired before the result saved.');
  const control=rrOnlineControl_(cache,room),caller=rrOnlineRole_(room,req);
  if(control.aborted)return rrOnlineError_('DIRECT_PAIR_CLOSED','This interrupted match has no result.');
  if(caller!==control.authorityRole)return rrOnlineError_('HOST_REQUIRED','Only the current simulation host can report this result.');
  const matchId=String(req.matchId||'').slice(0,100),key=RR_ONLINE.RESULT_PREFIX+matchId;
  const old=rrOnlineJson_(cache.get(key),null);if(old)return {ok:true,duplicate:true,result:old};
  const host=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,control.authorityRole)),null);
  const other=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,control.authorityRole==='host'?'guest':'host')),null);
  if(!host||!room.guest||host.matchId!==matchId||host.directAdmittedMatchId!==matchId)return rrOnlineError_('INVALID_RESULT','This result does not match the room.');
  if(control.cpuIndex<0&&(!other||Date.now()-other.lastSeen>45000||other.inputCount<=Number(host.matchInputBaseline||0)||host.snapshotCount<2))return rrOnlineError_('ACTIVE_PLAYER_REQUIRED','Both players must participate in the completed match.');
  let snapshot;try{snapshot=rrOnlineSnapshot_(req.finalSnapshot,matchId);}catch(error){return rrOnlineError_('INVALID_RESULT',error.message);}
  const i=snapshot.game.pvpMatchWinnerIndex;if(i!==0&&i!==1)return rrOnlineError_('INVALID_RESULT','The complete match has not finished.');
  const role=i===0?'host':'guest',wins=snapshot.game.pvpRoundWins||[];
  if(Number(wins[i])<Math.floor((host.startConfig?.bestOf||3)/2)+1||req.winnerRole!==role)return rrOnlineError_('INVALID_RESULT','This is not a complete match win.');
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return rrOnlineError_('ROOM_BUSY','Saving result. Retrying shortly.');
  try{
    const duplicate=rrOnlineJson_(cache.get(key),null);if(duplicate)return {ok:true,duplicate:true,result:duplicate};
    const winnerCpu=control.cpuIndex===i,winner=room[role];let award={ok:true,pvpMatchWins:null};
    if(!winnerCpu&&!winner.isGuest){award=rrOnlineAwardPvpMatchWin_(winner.studentId,matchId);if(!award.ok)return award;}
    if(control.cpuIndex<0){
      for(const r of ['host','guest']){const m=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,r)),null);if(m?.displayName)room[r].name=rrOnlineDisplayName_(m.displayName,room[r].name);}
      rrQuickApplyRatings_(room,matchId,role);rrBattleRecord_(room,matchId,role);
    }
    const result={matchId,winnerRole:role,winnerCpu,winnerGuest:!!winner.isGuest,cpuReplacement:control.cpuIndex>=0,
      pvpMatchWins:award.pvpMatchWins,completedAt:Date.now(),roundWins:[Number(wins[0])||0,Number(wins[1])||0],
      ranked:control.cpuIndex<0&&!room.host.isGuest&&!room.guest.isGuest};
    cache.put(key,JSON.stringify(result),RR_ONLINE.RESULT_SECONDS);rrQuickResultReceived_(cache,room,result);
    return {ok:true,result,pvpMatchWins:award.pvpMatchWins};
  }finally{lock.releaseLock();}
}

function rrOnlineAwardPvpMatchWin_(uid,matchId) {return store.award(uid,matchId);}


// ── Friends Quickplay: shared queue, private skill ratings, and fixed match rules ──
// Ratings live ONLY in Script Properties. They are never put in an exchange,
// player profile, public leaderboard, client save, or matchmaking response.
const RR_QUICKPLAY = Object.freeze({
  VERSION: 3, PREFIX: 'RR_QUICKPLAY_D2:', RATING_PREFIX: 'RR_QP_RATING_V1:',
  QUEUE_LIVE_MS: 30000, QUEUE_TTL: 120, ASSIGNMENT_TTL: 120,
  START_WAIT_MS: 65000, COUNT_TTL: 2, POLL_MS: 1250,
  INITIAL_RATING: 1000, INITIAL_WINDOW: 140, WINDOW_STEP: 90,
  WINDOW_STEP_MS: 10000, ANY_OPPONENT_AFTER_MS: 65000,
  K_FACTOR: 28, RATING_HISTORY: 24, MAX_WAITERS: 150, MAX_ROOMS: 180,
  ROUND_BREAK_MS: 5000,
  RULES: Object.freeze({stage:'random',roundGoal:'endless',bestOf:3,timeLimit:60,timeOfDay:'random',unpause:false})
});
function rrQuickName_(raw, fallback) {
  const parts=String(raw||'').replace(/[<>\x00-\x1f]/g,'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return fallback||'PLAYER';
  if(parts.length===1)return parts[0].slice(0,22);
  const last=parts[parts.length-1].replace(/[^A-Za-zÀ-ÿ'’-]/g,'');
  return (parts[0]+' '+(last?last.charAt(0).toUpperCase()+'.':'')).trim().slice(0,26);
}
function rrQuickRegistry_(cache) {
  const r=rrOnlineJson_(cache.get(RR_QUICKPLAY.PREFIX+'INDEX'),null);
  return r&&r.version===1?r:{version:1,waiters:[],rooms:[]};
}
function rrQuickPutRegistry_(cache,r) {
  // Called under the short matchmaking/control lock, never by a gameplay tick.
  cache.put(RR_QUICKPLAY.PREFIX+'INDEX',JSON.stringify(r),3600);
  cache.remove(RR_QUICKPLAY.PREFIX+'COUNTS');
}
function rrQuickTicketKey_(ticket) {return RR_QUICKPLAY.PREFIX+'T:'+rrOnlineHash_(ticket);}
function rrQuickActiveKey_(sid) {return RR_QUICKPLAY.PREFIX+'ACTIVE:'+rrOnlineHash_(sid).slice(0,32);}
function rrQuickUserKey_(sid) {return RR_QUICKPLAY.PREFIX+'U:'+rrOnlineHash_(sid).slice(0,32);}
function rrQuickRoleForStudent_(room,sid) {
  if(!room||!sid)return '';
  if(room.host?.studentId===sid)return 'host';
  if(room.guest?.studentId===sid)return 'guest';
  return '';
}
function rrQuickReleaseParticipant_(cache,room,role) {
  if(!room?.quickplay||!['host','guest'].includes(role))return false;
  const sid=room[role]?.studentId;if(!sid)return false;
  let changed=false;
  const activeKey=rrQuickActiveKey_(sid),active=rrOnlineJson_(cache.get(activeKey),null);
  const activeMatches=active?.roomCode===room.code&&active.epoch===room.epoch;
  if(activeMatches){cache.remove(activeKey);changed=true;}
  const userKey=rrQuickUserKey_(sid),ticketKey=cache.get(userKey),ticket=ticketKey?rrOnlineJson_(cache.get(ticketKey),null):null;
  const ticketMatches=ticket?.connection?.roomCode===room.code&&ticket.connection.epoch===room.epoch;
  if(ticketMatches){cache.remove(ticketKey);cache.remove(userKey);changed=true;}
  else if(!ticket&&activeMatches&&ticketKey){cache.remove(userKey);changed=true;}
  if(ticketKey){
    const registry=rrQuickRegistry_(cache),before=registry.waiters.length;
    registry.waiters=registry.waiters.filter(item=>item.key!==ticketKey);
    if(registry.waiters.length!==before)rrQuickPutRegistry_(cache,registry);
  }
  if(changed)cache.remove(RR_QUICKPLAY.PREFIX+'COUNTS');
  return changed;
}
function rrQuickWriteTicket_(cache,ticket) {
  cache.put(rrQuickTicketKey_(ticket.token),JSON.stringify(ticket),ticket.status==='matched'?RR_QUICKPLAY.ASSIGNMENT_TTL:RR_QUICKPLAY.QUEUE_TTL);
}
function rrQuickRegisteredRoom_(cache,room,registry) {
  const own=!registry;registry=registry||rrQuickRegistry_(cache);
  registry.rooms=registry.rooms.filter(r=>r.code!==room.code&&Date.now()-r.createdAt<3600000);
  registry.rooms.push({code:room.code,epoch:room.epoch,createdAt:room.createdAt,quickplay:!!room.quickplay});
  registry.rooms=registry.rooms.slice(-RR_QUICKPLAY.MAX_ROOMS);
  if(own)rrQuickPutRegistry_(cache,registry);
}
function rrQuickReadRating_(sid) {
  if(String(sid).startsWith('guest:'))return {rating:RR_QUICKPLAY.INITIAL_RATING,games:0,history:[]};
  const value=rrOnlineJson_(PropertiesService.getScriptProperties().getProperty(RR_QUICKPLAY.RATING_PREFIX+rrOnlineHash_(sid).slice(0,40)),null);
  return value&&Number.isFinite(value.rating)?value:{rating:RR_QUICKPLAY.INITIAL_RATING,games:0,history:[]};
}
function rrQuickRatingKey_(sid) {return RR_QUICKPLAY.RATING_PREFIX+rrOnlineHash_(sid).slice(0,40);}
function rrQuickApplyRatings_(room,matchId,winnerRole) {
  // Caller holds the result lock. Each player's recent match journal makes
  // retries safe, even if the previous request stopped between the two writes.
  if(!room.quickplay||room.host?.isGuest||room.guest?.isGuest)return;
  matchId=rrOnlineHash_(matchId).slice(0,24);
  const ids=[room.host.studentId,room.guest.studentId],records=ids.map(rrQuickReadRating_);
  const saved=records.map(r=>(Array.isArray(r.history)?r.history:[]).find(e=>e.id===matchId));
  if(saved[0]&&saved[1])return;
  let before,after;
  const oldEvent=saved[0]||saved[1];
  if(oldEvent){before=oldEvent.before;after=oldEvent.after;}
  else {
    before=records.map(r=>r.rating);
    const expected=1/(1+Math.pow(10,(before[1]-before[0])/400));
    const delta=RR_QUICKPLAY.K_FACTOR*((winnerRole==='host'?1:0)-expected);
    after=[Math.round((before[0]+delta)*10)/10,Math.round((before[1]-delta)*10)/10];
  }
  const updates={};
  records.forEach((r,i)=>{
    if(saved[i])return;
    r.rating=after[i];r.games=(Number(r.games)||0)+1;
    r.history=(Array.isArray(r.history)?r.history:[]).map(e=>({id:e.id})).concat({id:matchId,before,after}).slice(-RR_QUICKPLAY.RATING_HISTORY);
    r.lastOpponent=rrOnlineHash_(ids[1-i]).slice(0,32);r.updatedAt=Date.now();
    updates[rrQuickRatingKey_(ids[i])]=JSON.stringify(r);
  });
  if(Object.keys(updates).length)PropertiesService.getScriptProperties().setProperties(updates,false);
}
function rrQuickQueueWindow_(entry,now) {
  const wait=Math.max(0,now-entry.joinedAt);
  return wait>=RR_QUICKPLAY.ANY_OPPONENT_AFTER_MS?100000:
    RR_QUICKPLAY.INITIAL_WINDOW+RR_QUICKPLAY.WINDOW_STEP*Math.floor(wait/RR_QUICKPLAY.WINDOW_STEP_MS);
}
function rrQuickLiveTickets_(cache,registry,now) {
  const keys=registry.waiters.map(x=>x.key),values=keys.length?cache.getAll(keys):{};
  const tickets=[];
  registry.waiters=registry.waiters.filter(item=>{
    const t=rrOnlineJson_(values[item.key],null);
    const live=t&&t.status==='queued'&&now-t.lastSeen<RR_QUICKPLAY.QUEUE_LIVE_MS&&t.auth.expiresAt>now;
    if(live)tickets.push(t);
    return live;
  });
  return tickets.sort((a,b)=>a.joinedAt-b.joinedAt);
}
function rrQuickCounts_(cache,force) {
  const key=RR_QUICKPLAY.PREFIX+'COUNTS';
  if(!force){const old=rrOnlineJson_(cache.get(key),null);if(old&&Date.now()-old.at<2500)return old;}
  const reg=rrQuickRegistry_(cache),now=Date.now(),queueKeys=reg.waiters.map(x=>x.key),keys=queueKeys.slice();
  for(const r of reg.rooms){keys.push(rrOnlineMailKey_(r,'host'),rrOnlineMailKey_(r,'guest'),rrOnlineControlKey_(r));}
  const all=keys.length?cache.getAll(keys):{};let queued=0,ongoing=0;
  queueKeys.forEach(k=>{const t=rrOnlineJson_(all[k],null);if(t&&t.status==='queued'&&now-t.lastSeen<RR_QUICKPLAY.QUEUE_LIVE_MS&&t.auth.expiresAt>now)queued++;});
  for(const r of reg.rooms){
    const control=rrOnlineJson_(all[rrOnlineControlKey_(r)],{authorityRole:'host',cpuIndex:-1});
    const h=rrOnlineJson_(all[rrOnlineMailKey_(r,control.authorityRole)],null);
    const g=rrOnlineJson_(all[rrOnlineMailKey_(r,control.authorityRole==='host'?'guest':'host')],null);
    if(!h||h.left||now-h.lastSeen>=RR_ONLINE.OPPONENT_TIMEOUT_MS)continue;
    if(control.cpuIndex<0&&(!g||g.left||now-g.lastSeen>=RR_ONLINE.OPPONENT_TIMEOUT_MS))continue;
    const completed=h.snapshot?.game?.pvpMatchWinnerIndex;
    if(['starting','playing'].includes(h.phase)&&completed!==0&&completed!==1)ongoing++;
  }
  const result={ongoing,queued,at:now};cache.put(key,JSON.stringify(result),RR_QUICKPLAY.COUNT_TTL);return result;
}
function apiQuickplayStatus(req) {
  const auth=rrOnlineAuthLight_(req);if(!auth.ok)return auth;
  return {ok:true,quickplayVersion:3,counts:rrQuickCounts_(CacheService.getScriptCache(),false),rules:RR_QUICKPLAY.RULES};
}
function rrQuickResponse_(cache,ticket) {
  const common={ok:true,protocol:3,quickplayVersion:3,status:ticket.status,directOnlyVersion:2,queueToken:ticket.token,joinedAt:ticket.joinedAt,
    pollAfterMs:RR_QUICKPLAY.POLL_MS,counts:rrQuickCounts_(cache,true)};
  if(ticket.status==='matched'){
    const room=rrOnlineReadRoom_(cache,ticket.connection?.roomCode);
    if(!room||room.epoch!==ticket.connection.epoch||rrOnlineControl_(cache,room).aborted)
      return rrOnlineError_('DIRECT_PAIR_CLOSED','That pairing ended. Choose Find Opponent again.');
  }
  if(ticket.status==='matched')common.connection={...ticket.connection,quickplay:true,quickplayVersion:3,rules:RR_QUICKPLAY.RULES};
  return common;
}
function rrQuickAuthenticateTicket_(cache,req) {
  if(!req?.queueToken||(!req.sessionToken&&!req.guestToken))return null;
  const entry=rrOnlineJson_(cache.get(rrQuickTicketKey_(req.queueToken)),null);
  const hash=rrOnlineHash_(req.sessionToken?String(req.sessionToken):'guest:'+String(req.guestToken));
  if(!entry||entry.auth.expiresAt<=Date.now()||!safeEqual_(entry.auth.sessionHash,hash))return null;
  return entry;
}
function rrQuickCreateMatch_(cache,registry,a,b) {
  let code='';for(let i=0;i<20;i++){const c=rrOnlineCodeNew_();if(!cache.get(rrOnlineRoomKey_(c))){code=c;break;}}
  if(!code)throw new Error('Could not allocate a Quickplay room. Please retry.');
  // Random host assignment avoids always giving the longest-waiting student
  // the simulation-host role. No host/client choice is exposed to students.
  const ordered=Math.random()<.5?[a,b]:[b,a],tokens=[rrOnlineToken_(),rrOnlineToken_()];
  const room={version:3,code,epoch:Utilities.getUuid(),createdAt:Date.now(),direct:rrDirectNewPair_(),quickplay:true,
    host:rrOnlineMember_(ordered[0].auth,tokens[0]),guest:rrOnlineMember_(ordered[1].auth,tokens[1])};
  const writes={};writes[rrOnlineRoomKey_(code)]=JSON.stringify(room);
  ordered.forEach((t,i)=>{
    const role=i===0?'host':'guest',mail=rrOnlineNewMail_({displayName:t.auth.name,skinId:t.skinId,appearance:t.appearance,settings:RR_QUICKPLAY.RULES,vocabulary:t.vocabulary},role);
    mail.ready=false;mail.readyForSettings=0;mail.quickplayAccepted=false;
    writes[rrOnlineMailKey_(room,role)]=JSON.stringify(mail);
    t.status='matched';t.assignedAt=Date.now();t.connection={ok:true,protocol:3,role,roomCode:code,playerToken:tokens[i],epoch:room.epoch,directOnlyVersion:2,directPolicy:rrDirectPolicy_(room,role)};
  });
  cache.putAll(writes,RR_ONLINE.ROOM_SECONDS);
  ordered.forEach(t=>{rrQuickWriteTicket_(cache,t);cache.put(rrQuickActiveKey_(t.auth.studentId),JSON.stringify({roomCode:code,epoch:room.epoch}),RR_ONLINE.ROOM_SECONDS);});
  const selected=new Set(ordered.map(t=>rrQuickTicketKey_(t.token)));
  registry.waiters=registry.waiters.filter(item=>!selected.has(item.key));rrQuickRegisteredRoom_(cache,room,registry);
}
function rrQuickTryMatch_(cache,registry) {
  const now=Date.now(),tickets=rrQuickLiveTickets_(cache,registry,now);
  for(let i=0;i<tickets.length;i++){
    const a=tickets[i],aId=rrOnlineHash_(a.auth.studentId).slice(0,32);
    const candidates=tickets.slice(i+1).filter(b=>b.auth.studentId!==a.auth.studentId&&
      Math.abs(a.rating-b.rating)<=Math.max(rrQuickQueueWindow_(a,now),rrQuickQueueWindow_(b,now))&&
      !cache.get(rrDirectFailedPairKey_(a.auth.studentId,b.auth.studentId)));
    if(!candidates.length)continue;
    candidates.sort((x,y)=>{
      const recentlyX=(a.lastOpponent===rrOnlineHash_(x.auth.studentId).slice(0,32)||x.lastOpponent===aId)&&now-a.joinedAt<12000?400:0;
      const recentlyY=(a.lastOpponent===rrOnlineHash_(y.auth.studentId).slice(0,32)||y.lastOpponent===aId)&&now-a.joinedAt<12000?400:0;
      return (Math.abs(a.rating-x.rating)+recentlyX)-(Math.abs(a.rating-y.rating)+recentlyY)||x.joinedAt-y.joinedAt;
    });
    rrQuickCreateMatch_(cache,registry,a,candidates[0]);return true;
  }
  return false;
}
function apiQuickplayEnter(req) {
  const directError=rrDirectClientError_(req,true);if(directError)return directError;
  if(Number(req?.quickplayVersion)!==3)return rrOnlineError_('QUICKPLAY_UPDATE_REQUIRED','Publish the matching Quickplay HTML.');
  const auth=rrOnlineAuthenticate_(req);if(!auth.ok)return auth;
  if(req.displayName)auth.name=rrOnlineDisplayName_(req.displayName,auth.name);
  const requestId=String(req.requestId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,90);
  if(!requestId)return rrOnlineError_('INVALID_REQUEST','Quickplay needs a request ID. Refresh this page.');
  const cache=CacheService.getScriptCache(),lock=LockService.getScriptLock();
  if(!lock.tryLock(500))return rrOnlineError_('QUEUE_BUSY','Matchmaking is busy. Retrying...');
  try {
    const reg=rrQuickRegistry_(cache),userKey=rrQuickUserKey_(auth.studentId);
    const active=rrOnlineJson_(cache.get(rrQuickActiveKey_(auth.studentId)),null);
    if(active){
      const room=rrOnlineReadRoom_(cache,active.roomCode),role=room&&room.epoch===active.epoch?rrQuickRoleForStudent_(room,auth.studentId):'';
      const control=room?rrOnlineControl_(cache,room):null;
      if(room&&role&&control?.cpuIndex===(role==='host'?0:1))rrQuickReleaseParticipant_(cache,room,role);
      else {
        const h=room&&room.epoch===active.epoch?rrOnlineJson_(cache.get(rrOnlineMailKey_(room,'host')),null):null;
        if(h&&Date.now()-h.lastSeen<RR_ONLINE.OPPONENT_TIMEOUT_MS&&['starting','playing'].includes(h.phase)&&h.snapshot?.game?.pvpMatchWinnerIndex==null)
          return rrOnlineError_('ALREADY_PLAYING','Finish or leave the Quickplay match already open for this account.');
      }
    }
    const existingKey=cache.get(userKey),existing=existingKey?rrOnlineJson_(cache.get(existingKey),null):null;
    if(existing&&Date.now()-existing.lastSeen<RR_QUICKPLAY.QUEUE_LIVE_MS){
      if(existing.requestId===requestId&&existing.auth.sessionHash===auth.sessionHash)return rrQuickResponse_(cache,existing);
      if(existing.status==='queued')return rrOnlineError_('ALREADY_QUEUED','This account is already queued in another tab. Cancel that queue first.');
      if(existing.status==='matched'){
        const previous=rrOnlineReadRoom_(cache,existing.connection.roomCode);
        if(previous&&Date.now()-(previous.direct?.createdAt||0)>RR_DIRECT.PAIR_WAIT_MS){
          const waiting=rrOnlineJson_(cache.get(rrOnlineMailKey_(previous,'host')),null);
          if(waiting?.phase==='lobby')rrDirectAbortPair_(cache,previous,'SERVER PAIRING TIMED OUT.',true);
        }
        const closed=previous&&rrOnlineControl_(cache,previous).aborted;
        const host=previous?rrOnlineJson_(cache.get(rrOnlineMailKey_(previous,'host')),null):null;
        if(!closed&&host&&Date.now()-host.lastSeen<RR_ONLINE.OPPONENT_TIMEOUT_MS&&(!host.snapshot?.game||host.snapshot.game.pvpMatchWinnerIndex==null))
          return rrOnlineError_('ALREADY_PLAYING','This account already has a Quickplay match open. Finish or leave that match first.');
      }
    }
    const rating=rrQuickReadRating_(auth.studentId),token=rrOnlineToken_(),now=Date.now();
    const ticket={token,requestId,status:'queued',auth,joinedAt:now,lastSeen:now,pollSequence:0,
      rating:rating.rating,lastOpponent:rating.lastOpponent||'',skinId:rrOnlineSkin_(req.skinId),appearance:rrOnlineAppearance_(req.appearance),
      vocabulary:rrOnlineVocab_(req.vocabulary)};
    if(ticket.vocabulary.length<4)return rrOnlineError_('VOCABULARY_REQUIRED','Load at least four vocabulary pairs before Quickplay.');
    rrQuickLiveTickets_(cache,reg,now);
    if(reg.waiters.length>=RR_QUICKPLAY.MAX_WAITERS)return rrOnlineError_('QUEUE_FULL','Quickplay is full. Please try again shortly.');
    rrQuickWriteTicket_(cache,ticket);cache.put(userKey,rrQuickTicketKey_(token),RR_ONLINE.ROOM_SECONDS);
    reg.waiters.push({key:rrQuickTicketKey_(token),joinedAt:now});
    rrQuickTryMatch_(cache,reg);rrQuickPutRegistry_(cache,reg);
    return rrQuickResponse_(cache,rrOnlineJson_(cache.get(rrQuickTicketKey_(token)),ticket));
  } finally {lock.releaseLock();}
}
function apiQuickplayPoll(req) {
  const directError=rrDirectClientError_(req,false);if(directError)return directError;
  const cache=CacheService.getScriptCache();let ticket=rrQuickAuthenticateTicket_(cache,req);
  if(!ticket)return rrOnlineError_('QUEUE_EXPIRED','The queue expired. Finding a new match...');
  if(ticket.status==='matched')return rrQuickResponse_(cache,ticket);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(200))return {ok:true,quickplayVersion:3,directOnlyVersion:2,status:'queued',queueToken:ticket.token,joinedAt:ticket.joinedAt,pollAfterMs:1500,counts:rrQuickCounts_(cache,false)};
  try {
    // Re-read after obtaining the lock: the other student's request may already
    // have assigned this ticket. Never overwrite that assignment with a heartbeat.
    ticket=rrQuickAuthenticateTicket_(cache,req);
    if(!ticket)return rrOnlineError_('QUEUE_EXPIRED','The queue expired. Finding a new match...');
    if(ticket.status==='queued'){
      ticket.lastSeen=Date.now();
      if(Number(req.sequence)>Number(ticket.pollSequence||0)){
        if(req.skinId)ticket.skinId=rrOnlineSkin_(req.skinId);
        if(req.appearance)ticket.appearance=rrOnlineAppearance_(req.appearance);
        if(req.displayName)ticket.auth.name=rrOnlineDisplayName_(req.displayName,ticket.auth.name);
      }
      ticket.pollSequence=Math.max(ticket.pollSequence||0,Number(req.sequence)||0);rrQuickWriteTicket_(cache,ticket);
      const reg=rrQuickRegistry_(cache);
      if(!reg.waiters.some(t=>t.key===rrQuickTicketKey_(ticket.token)))reg.waiters.push({key:rrQuickTicketKey_(ticket.token),joinedAt:ticket.joinedAt});
      rrQuickTryMatch_(cache,reg);rrQuickPutRegistry_(cache,reg);
      ticket=rrOnlineJson_(cache.get(rrQuickTicketKey_(ticket.token)),ticket);
    }
    return rrQuickResponse_(cache,ticket);
  } finally {lock.releaseLock();}
}
function apiQuickplayCancel(req) {
  const cache=CacheService.getScriptCache(),ticket=rrQuickAuthenticateTicket_(cache,req);
  if(!ticket)return {ok:true,cancelled:true};
  const lock=LockService.getScriptLock();if(!lock.tryLock(500))return rrOnlineError_('QUEUE_BUSY','Cancelling queue. Please retry.');
  try {
    const current=rrQuickAuthenticateTicket_(cache,req);if(!current)return {ok:true,cancelled:true};
    const reg=rrQuickRegistry_(cache);reg.waiters=reg.waiters.filter(t=>t.key!==rrQuickTicketKey_(current.token));
    if(current.status==='matched'){
      const room=rrOnlineReadRoom_(cache,current.connection.roomCode);
      if(room&&room.epoch===current.connection.epoch){
        const h=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,'host')),null),g=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,'guest')),null);
        // Only cancel an assignment that has not started. Active games are
        // left through apiOnlineLeaveRoom, with the room/player credentials.
        if(h&&h.phase==='lobby'){rrDirectAbortPair_(cache,room,'PAIRING CANCELLED BEFORE THE MATCH STARTED.',false);reg.rooms=reg.rooms.filter(r=>r.code!==room.code||r.epoch!==room.epoch);}
      }
    }
    cache.remove(rrQuickTicketKey_(current.token));
    const u=rrQuickUserKey_(current.auth.studentId);if(cache.get(u)===rrQuickTicketKey_(current.token))cache.remove(u);
    rrQuickPutRegistry_(cache,reg);return {ok:true,cancelled:true};
  } finally {lock.releaseLock();}
}
function rrQuickResultReceived_(cache,room,result) {
  // Result markers are small, persistent server-only rating records. Runtime
  // counts deliberately use mailboxes rather than exposing any rating data.
  cache.remove(RR_QUICKPLAY.PREFIX+'COUNTS');
}
function rrQuickStages_() {
  const stages=['park','swamp','jungle','pond','lake','garden'];
  for(let i=stages.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[stages[i],stages[j]]=[stages[j],stages[i]];}
  return stages.slice(0,3);
}


// Friends Quickplay: a load/acknowledgement barrier, shared future GO time and a
// separate bounded replay cache. Watchers NEVER read/write player mailboxes.
const RR_REPLAY = Object.freeze({PREFIX:'RR_REPLAY_V1:',VERSION:1,DELAY_MS:3000,
  CHUNK_MS:6000,MAX_CHUNKS:24,TTL_SECONDS:240,MAX_BATCH:80,MAX_REPLY:48});
function rrOnlineSyncRound_(host,guest,req) {
  const t=Date.now();
  const key=String(req.roundLoadKey||'').slice(0,140);
  // Only the host can create a new round barrier, and it must describe the
  // actual snapshot in that host's mailbox, not a spectator/client command.
  if(key&&host.snapshot?.roundKey===key&&host.snapshot?.game?.state==='countdown'&&
     key.indexOf(host.matchId+':')===0&&host.startSync?.key!==key){
    host.startSync={key,revision:0,phase:'loading',countdownAt:0,goAt:0};
    host.syncRevision=(Number(host.syncRevision)||0)+1;
  }
  const s=host.startSync;if(!s||s.phase==='playing')return;
  const loaded=host.loadedRoundKey===s.key&&guest?.loadedRoundKey===s.key;
  if(!loaded)return;
  const rtt=Math.max(100,Number(host.clientRttMs)||0,Number(guest.clientRttMs)||0);
  const schedule=()=>{
    s.revision=++host.syncRevision;s.phase='scheduled';
    s.countdownAt=t+Math.min(12000,Math.max(1800,rtt*2+1200));
    s.goAt=s.countdownAt+2250;host.startAt=s.countdownAt;
  };
  if(s.phase==='loading')schedule();
  else if(s.phase==='scheduled'){
    const ack=host.armedSyncRevision===s.revision&&guest.armedSyncRevision===s.revision;
    const margin=Math.max(350,rtt*.65);
    if(t>=s.countdownAt-margin)schedule();
    else if(ack)s.phase='committed';
  }else if(s.phase==='committed'&&t>=s.goAt){s.phase='playing';host.phase='playing';}
}
function rrReplayHeadKey_(code){return RR_REPLAY.PREFIX+'HEAD:'+code;}
function rrReplayChunkKey_(code,epoch,number){return RR_REPLAY.PREFIX+code+':'+epoch+':'+(number%RR_REPLAY.MAX_CHUNKS);}
function rrReplayMeta_(room,host){
  const c=host.startConfig||{};
  return {roomCode:room.code,matchId:host.matchId,epoch:room.epoch,quickplay:!!room.quickplay,
    names:[rrQuickName_(room.host?.name),rrQuickName_(room.guest?.name)],
    appearances:[rrOnlineAppearance_(c.hostAppearance),rrOnlineAppearance_(c.guestAppearance)],
    skins:[rrOnlineSkin_(c.hostSkin),rrOnlineSkin_(c.guestSkin)],vocabulary:rrOnlineVocab_(c.vocabulary),
    bestOf:c.bestOf||3,goalMode:c.goalMode||'endless',firstTo:c.firstTo||5,timeLimit:c.timeLimit||0};
}
function rrReplayCleanFrame_(v){
  if(!v||!Number.isSafeInteger(v.q)||v.q<1||!Number.isFinite(v.t)||v.t<0||v.t>3600000)return null;
  if(!['countdown','playing','pvpSuddenDeathAlert','pvpCelebration','won'].includes(v.s))return null;
  if(!/^(park|swamp|jungle|pond|lake|garden)$/.test(v.l)||!Array.isArray(v.p)||v.p.length!==2||!Array.isArray(v.f))return null;
  const nums=(a,max)=>Array.isArray(a)?a.slice(0,max).map(n=>Number.isFinite(n)?Math.max(-1e9,Math.min(1e9,n)):0):[];
  // Only allow compact, numeric replay fields. Never archive session tokens,
  // private skill ratings, account identifiers, commands, or arbitrary object keys.
  const f={q:v.q,t:Math.round(v.t),s:v.s,l:v.l,g:nums(v.g,26),p:v.p.map(a=>nums(a,30)),
    f:v.f.slice(0,8).map(a=>nums(a,13)),fx:(Array.isArray(v.fx)?v.fx:[]).slice(0,5).map(a=>nums(a,8))};
  if(JSON.stringify(f).length>9500)return null;return f;
}
function rrReplayStore_(cache,room,host,batch){
  if(!host.matchId||!host.startConfig||!Array.isArray(batch)||!batch.length)return Number(host.replayAck)||0;
  const key=rrReplayHeadKey_(room.code),now=Date.now();
  let head=rrOnlineJson_(cache.get(key),null);
  if(!head||head.epoch!==room.epoch||head.matchId!==host.matchId)
    head={version:1,epoch:room.epoch,matchId:host.matchId,code:room.code,lastSeq:0,lastT:0,lastStored:now,numbers:[],meta:rrReplayMeta_(room,host)};
  const buckets=new Map();let accepted=false;
  for(const item of batch.slice(0,RR_REPLAY.MAX_BATCH)){
    const f=rrReplayCleanFrame_(item);if(!f||f.q<=head.lastSeq||f.t<head.lastT)continue;
    const n=Math.floor(f.t/RR_REPLAY.CHUNK_MS);
    let chunk=buckets.get(n);
    if(!chunk){
      const previous=rrOnlineJson_(cache.get(rrReplayChunkKey_(room.code,room.epoch,n)),null);
      chunk=previous?.number===n&&previous.matchId===host.matchId?previous:{number:n,matchId:host.matchId,frames:[]};
      buckets.set(n,chunk);
    }
    // A capture is released only after it was received and stored by the hub.
    // A spoofed client timestamp cannot remove the spectator delay.
    f.storedAt=now;chunk.frames.push(f);
    if(chunk.frames.length>64)chunk.frames.shift();
    head.lastSeq=f.q;head.lastT=f.t;head.lastStored=now;accepted=true;
    if(!head.numbers.includes(n))head.numbers.push(n);
  }
  if(accepted){
    head.numbers=head.numbers.sort((a,b)=>a-b).slice(-RR_REPLAY.MAX_CHUNKS);
    const writes={};
    for(const [n,c]of buckets){
      let json=JSON.stringify(c);while(json.length>87000&&c.frames.length>1){c.frames.shift();json=JSON.stringify(c);}
      writes[rrReplayChunkKey_(room.code,room.epoch,n)]=json;
    }
    writes[key]=JSON.stringify(head);cache.putAll(writes,RR_REPLAY.TTL_SECONDS);
  }
  return head.lastSeq;
}
function apiOnlineWatchList(req){
  const session=rrOnlineAuthLight_(req);if(!session.ok)return session;
  const cache=CacheService.getScriptCache(),reg=rrQuickRegistry_(cache),now=Date.now();
  const codes=[...new Set((reg.rooms||[]).map(r=>r.code))].slice(-60);
  const heads=cache.getAll(codes.map(rrReplayHeadKey_)),rooms=[];
  for(const code of codes){
    const h=rrOnlineJson_(heads[rrReplayHeadKey_(code)],null);
    if(h?.version===1&&h.lastSeq>1&&now-h.lastStored<60000)
      rooms.push({roomCode:code,names:h.meta.names,quickplay:!!h.meta.quickplay,recordedAt:h.lastStored});
  }
  return {ok:true,spectatorVersion:1,delayMs:RR_REPLAY.DELAY_MS,rooms:rooms.slice(-30).reverse()};
}
function apiOnlineSpectate(req){
  const code=rrOnlineCode_(req?.roomCode);if(!code)return rrOnlineError_('INVALID_ROOM_CODE','Enter the five-character room ID.');
  const cache=CacheService.getScriptCache(),now=Date.now();
  let token=String(req.viewerToken||''),access=null;
  if(token){
    access=rrOnlineJson_(cache.get(RR_REPLAY.PREFIX+'VIEWER:'+rrOnlineHash_(token)),null);
    if(!access||access.code!==code||access.expires<=now||!safeEqual_(access.sessionHash,rrOnlineHash_(req.sessionToken?String(req.sessionToken):'guest:'+String(req.guestToken||''))))
      return rrOnlineError_('SPECTATOR_EXPIRED','Viewer session expired. Reopen Spectate.');
  }else{
    const auth=rrOnlineAuthenticate_(req);if(!auth.ok)return auth;
  if(req.displayName)auth.name=rrOnlineDisplayName_(req.displayName,auth.name);
    token=rrOnlineToken_();access={code,sessionHash:auth.sessionHash,expires:Math.min(auth.expiresAt,now+3600000)};
    cache.put(RR_REPLAY.PREFIX+'VIEWER:'+rrOnlineHash_(token),JSON.stringify(access),3600);
  }
  const h=rrOnlineJson_(cache.get(rrReplayHeadKey_(code)),null);
  if(!h||h.version!==1)return {ok:true,spectatorVersion:1,viewerToken:token,waiting:true,frames:[],message:'WAITING FOR RECORDED PLAY'};
  const newStream=req.matchId!==h.matchId||req.epoch!==h.epoch;
  const cursor=newStream?-1:Math.max(-1,Math.floor(Number(req.cursor)||0));
  // Initial viewing begins near the delayed live edge, not by requesting a
  // replay retransmission from either player. Earlier retained frames may expire.
  const numbers=cursor<0?h.numbers.slice(-3):h.numbers;
  const keys=numbers.map(n=>rrReplayChunkKey_(code,h.epoch,n)),values=cache.getAll(keys);
  let frames=[];
  numbers.forEach((n,i)=>{
    const c=rrOnlineJson_(values[keys[i]],null);if(c?.number!==n||c?.matchId!==h.matchId)return;
    frames.push(...c.frames.filter(f=>f.q>cursor&&f.storedAt<=now-RR_REPLAY.DELAY_MS));
  });
  frames.sort((a,b)=>a.q-b.q);
  if(cursor<0)frames=frames.slice(-24);else frames=frames.slice(0,RR_REPLAY.MAX_REPLY);
  return {ok:true,spectatorVersion:1,viewerToken:token,epoch:h.epoch,matchId:h.matchId,
    meta:newStream?h.meta:null,delayMs:RR_REPLAY.DELAY_MS,frames,serverTime:now,
    waiting:frames.length===0,ended:now-h.lastStored>18000,pollAfterMs:1200};
}


// School Online 3: guest identities remain temporary; account identities stay private.
const RR_SCHOOL_ONLINE = Object.freeze({VERSION:3, LIFECYCLE:3, GUEST_TTL:21600,
  GUEST_PREFIX:'RR_GUEST_V1:', PROFILE_PREFIX:'RR_ONLINE_PROFILE_V1:',
  CONTROL_SUFFIX:':CONTROL3', BATTLE_SHEET:'Frog Tags', CPU_LEVEL:5});
function rrOnlineDisplayName_(value,fallback) {
  const name=String(value||'').normalize('NFC').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 _.'’-]/g,'').replace(/\s+/g,' ').trim().slice(0,20);
  return name || String(fallback||'PLAYER').slice(0,20);
}
function rrOnlineGuestKey_(token) {return RR_SCHOOL_ONLINE.GUEST_PREFIX+rrOnlineHash_(token);}
function rrOnlineReadGuest_(token) {
 return auth?.guest?{studentId:auth.uid,isGuest:true,name:auth.name,expiresAt:auth.expires}:null;
}
function rrOnlineAuthLight_(req) {return rrOnlineAuthenticate_(req);}
function apiOnlineGuestSession(req) {throw new Error('Guest sessions are issued by FriendsHub.');}
function rrOnlineProfileKey_(id){return RR_SCHOOL_ONLINE.PROFILE_PREFIX+rrOnlineHash_(id).slice(0,40);}
function rrOnlineStoredName_(id,fallback){return rrOnlineDisplayName_(String(id).startsWith('guest:')?cache.get(rrOnlineProfileKey_(id)):props.getProperty(rrOnlineProfileKey_(id)),fallback);}
function rrOnlineBattleId_(sid){
  const props=PropertiesService.getScriptProperties();let salt=props.getProperty('RR_BATTLE_TAG_SALT_V1');
  if(!salt){
    const lock=LockService.getScriptLock(),owned=lock.hasLock();
    if(!owned&&!lock.tryLock(1500))throw new Error('Frog Tags is busy. Try again.');
    try{salt=props.getProperty('RR_BATTLE_TAG_SALT_V1');if(!salt){salt=rrOnlineToken_();props.setProperty('RR_BATTLE_TAG_SALT_V1',salt);}}
    finally{if(!owned)lock.releaseLock();}
  }
  return rrOnlineHash_(salt+':'+String(sid)).slice(0,32);
}
function apiOnlineProfile(req) {
 const a=rrOnlineAuthenticate_(req);if(!a.ok)return a;
 let name=a.name;
 if(Object.hasOwn(req,'name')){name=rrOnlineDisplayName_(req.name,a.name);if(a.isGuest)cache.put(rrOnlineProfileKey_(a.studentId),name,21600);else props.setProperty(rrOnlineProfileKey_(a.studentId),name);}
 return {ok:true,name,guest:a.isGuest,battleTag:rrOnlineBattleId_(a.studentId).slice(0,6).toUpperCase()};
}
function rrOnlineControlKey_(room){return rrOnlineRoomKey_(room.code)+':'+room.epoch+RR_SCHOOL_ONLINE.CONTROL_SUFFIX;}
function rrOnlineControl_(cache,room){return rrOnlineJson_(cache.get(rrOnlineControlKey_(room)),{version:1,authorityRole:'host',cpuIndex:-1});}
function rrOnlineCopyAuthority_(destination,source){
  ['phase','matchId','snapshot','snapshotSequence','snapshotStoredAt','snapshotCount','settings','settingsRevision','settingsEditing','vocabulary',
   'directAdmittedMatchId','startConfig','startSequence','startAt','startSync','syncRevision','nextRoundSequence','nextRoundCommandId','lobbyEpoch','replayAck',
   'ackInputSequence','ackClaimSequence','matchInputBaseline','returnSeenId','guestReturnSeenId','result'].forEach(k=>{if(source[k]!==undefined)destination[k]=rrOnlineClone_(source[k]);});
  destination.loadedRoundKey=source.startSync?.key||destination.loadedRoundKey;
  destination.armedSyncRevision=Number(source.startSync?.revision)||0;
}
function rrOnlineCheckTakeover_(cache,room,role,mails,control,req) {
  if(control.cpuIndex>=0||control.aborted)return control;
  const authority=mails[control.authorityRole],opposite=role==='host'?'guest':'host',remote=mails[opposite];
  if(!authority||!room.guest||!['starting','playing'].includes(authority.phase)||!authority.matchId||authority.directAdmittedMatchId!==authority.matchId)return control;
  // A healthy direct connection takes precedence over delayed the hub heartbeats.
  if(!remote?.left&&rrDirectAcceptProof_(room,role,req||{},mails))return control;
  if(authority.snapshot?.game?.pvpMatchWinnerIndex===0||authority.snapshot?.game?.pvpMatchWinnerIndex===1)return control;
  const timeout=Math.min(25000,Math.max(12000,3*Math.max(Number(mails[role]?.clientRttMs)||0,Number(remote?.clientRttMs)||0)+1800));
  if(remote&&!remote.left&&Date.now()-remote.lastSeen<timeout)return control;
  const lock=LockService.getScriptLock();if(!lock.tryLock(150))return control;
  try{
    control=rrOnlineControl_(cache,room);if(control.cpuIndex>=0)return control;
    const fresh=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,opposite)),null);
    if(fresh&&!fresh.left&&Date.now()-fresh.lastSeen<timeout)return control;
    const winner=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,role)),null);if(!winner||winner.left)return control;
    const prior=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,control.authorityRole)),authority);
    if(role!==control.authorityRole){rrOnlineCopyAuthority_(winner,prior);winner.lastSeen=Date.now();rrOnlinePut_(cache,rrOnlineMailKey_(room,role),winner);mails[role]=winner;}
    control={version:control.version+1,authorityRole:role,cpuIndex:opposite==='host'?0:1,cpuLevel:5,
      takeoverAt:Date.now(),reason:fresh?.left?'left':'disconnected',matchId:prior.matchId};
    rrOnlinePut_(cache,rrOnlineControlKey_(room),control);
    rrQuickReleaseParticipant_(cache,room,opposite);
    return control;
  }finally{lock.releaseLock();}
}
function rrBattleSheet_(){throw new Error('Friends Edition stores Frog Tags in private SQLite, not a Sheet.');}
function rrBattleRecord_(room,matchId,winnerRole){
 if(!room.quickplay||!room.host||!room.guest)return;
 for(const role of ['host','guest']){
  const me=room[role],other=room[role==='host'?'guest':'host'];
  const id=rrOnlineBattleId_(me.studentId),op=rrOnlineBattleId_(other.studentId);
  const temporary=me.isGuest||other.isGuest,k='FRIENDS_BATTLE:'+id;
  const rows=rrOnlineJson_(temporary?cache.get(k):props.getProperty(k),[]);
  let row=rows.find(r=>r.opponentId===op);if(!row){row={opponentId:op,name:other.name,matches:0,wins:0,losses:0,recent:[],temporary};rows.push(row);}
  if(!row.recent.includes(matchId)){row.matches++;row[role===winnerRole?'wins':'losses']++;row.name=other.name;row.updatedAt=Date.now();row.recent=[...row.recent,matchId].slice(-60);}
  if(temporary)cache.put(k,JSON.stringify(rows.slice(-100)),21600);else props.setProperty(k,JSON.stringify(rows.slice(-200)));
 }
}
function apiOnlineBattleTags(req){
 const a=rrOnlineAuthenticate_(req);if(!a.ok)return a;const id=rrOnlineBattleId_(a.studentId),key='FRIENDS_BATTLE:'+id;
 const rows=[...rrOnlineJson_(props.getProperty(key),[]),...rrOnlineJson_(cache.get(key),[])];
 return {ok:true,entries:rows.sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,200).map(({recent,...r})=>r),guest:a.isGuest,battleTag:id.slice(0,6).toUpperCase()};
}


// Friends Edition: the hub is the authenticated control/audit plane, never a
// fallback for human gameplay. Challenges are returned ONLY to their owner.
const RR_DIRECT = Object.freeze({VERSION:2, PROOF_TTL_MS:20000,
  PEER_MAX_AGE_MS:6000, PAIR_WAIT_MS:65000, FAILED_PAIR_SECONDS:120});
function rrDirectClientError_(req,preflight) {
 if(Number(req?.friendsVersion)!==1)return rrOnlineError_('UPDATE_REQUIRED','Refresh the Friends Edition on both devices.');
 if(preflight&&req?.directCapable!==true)return rrOnlineError_('DIRECT_CHECK_REQUIRED','Complete the server connection check first.');
 return null;
}
function rrDirectNewPair_() {
  return {version:RR_DIRECT.VERSION,pairId:Utilities.getUuid(),createdAt:Date.now(),
    hostChallenge:rrOnlineToken_(),guestChallenge:rrOnlineToken_()};
}
function rrDirectOfferId_(mails) {return mails.host?.peerSignal?.type==='offer'?mails.host.peerSignal.id:'';}
function rrDirectAcceptProof_(room,role,req,mails) {
 const p=req.directProof,other=role==='host'?'guest':'host',d=room.direct;
 const a=socketPresence?.[role],b=socketPresence?.[other];
 if(!d||!room.guest||!a?.live||!b?.live||socketPresence.pairId!==d.pairId||req.directVerified!==true||!p||p.pairId!==d.pairId||
    !safeEqual_(String(p.peerChallenge||''),d[other+'Challenge']))return null;
 return {pairId:d.pairId,nonce:a.connectionId,peerNonce:b.connectionId,verifiedAt:Date.now()};
}
function rrDirectFresh_(room,mail) {
  const p=mail?.directProof;
  return !!(p&&p.pairId===room.direct?.pairId&&!mail.left&&
    Date.now()-p.verifiedAt<RR_DIRECT.PROOF_TTL_MS);
}
function rrDirectPairReady_(room,mails) {
 if(!rrDirectFresh_(room,mails.host)||!rrDirectFresh_(room,mails.guest)||!socketPresence?.host?.live||!socketPresence?.guest?.live)return false;
 const a=mails.host.directProof,b=mails.guest.directProof;
 return a.nonce===b.peerNonce&&b.nonce===a.peerNonce&&a.nonce===socketPresence.host.connectionId&&b.nonce===socketPresence.guest.connectionId;
}
function rrDirectPolicy_(room,role,mails) {
  return {version:RR_DIRECT.VERSION,required:true,pairId:room.direct?.pairId||'',
    challenge:room.direct?.[role+'Challenge']||'',
    verified:!!mails&&rrDirectPairReady_(room,mails),selfVerified:!!mails&&rrDirectFresh_(room,mails[role]),
    relayGameplayAllowed:false};
}
function rrDirectFailedPairKey_(a,b) {
  return 'RR_DIRECT_PAIR_FAIL:'+rrOnlineHash_([String(a),String(b)].sort().join('|'));
}
function rrDirectClearQuickPair_(cache,room) {
  if(!room.quickplay)return;
  for(const role of ['host','guest']){
    const sid=room[role]?.studentId;if(!sid)continue;
    const akey=rrQuickActiveKey_(sid),a=rrOnlineJson_(cache.get(akey),null);
    if(a?.roomCode===room.code&&a.epoch===room.epoch)cache.remove(akey);
    const ukey=rrQuickUserKey_(sid),tkey=cache.get(ukey),t=tkey?rrOnlineJson_(cache.get(tkey),null):null;
    if(t?.connection?.roomCode===room.code&&t.connection.epoch===room.epoch){cache.remove(tkey);cache.remove(ukey);}
  }
  const reg=rrQuickRegistry_(cache);reg.rooms=reg.rooms.filter(r=>r.code!==room.code||r.epoch!==room.epoch);
  rrQuickPutRegistry_(cache,reg);
}
function rrDirectAbortPair_(cache,room,reason,failed) {
  // Caller owns the short control lock. A tombstone survives late mailbox writes.
  const c=rrOnlineControl_(cache,room);
  if(c.cpuIndex>=0)return false;
  rrOnlinePut_(cache,rrOnlineControlKey_(room),{...c,aborted:true,reason,abortedAt:Date.now()});
  if(failed&&room.quickplay&&room.host&&room.guest)
    cache.put(rrDirectFailedPairKey_(room.host.studentId,room.guest.studentId),'1',RR_DIRECT.FAILED_PAIR_SECONDS);
  rrDirectClearQuickPair_(cache,room);return true;
}
function apiOnlineDirectAbort(req) {
  const error=rrDirectClientError_(req,false);if(error)return error;
  const cache=CacheService.getScriptCache(),room=rrOnlineReadRoom_(cache,rrOnlineCode_(req?.roomCode));
  if(!room)return {ok:true,closed:true};
  const role=rrOnlineRole_(room,req);if(!role)return rrOnlineError_('ROOM_AUTH_FAILED','Room session expired.');
  if(req.pairId!==room.direct?.pairId)return rrOnlineError_('STALE_PAIR','This is not the current pairing.');
  const lock=LockService.getScriptLock();if(!lock.tryLock(400))return rrOnlineError_('ROOM_BUSY','Closing connection. Retrying.');
  try {
    const control=rrOnlineControl_(cache,room);
    if(control.cpuIndex>=0)return {ok:true,closed:false,cpuReplacement:true};
    const host=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,control.authorityRole)),null);
    // A completed result must not be cancelled by a late disconnect callback.
    if(host?.matchId&&cache.get(RR_ONLINE.RESULT_PREFIX+host.matchId))return {ok:true,closed:false,finished:true};
    rrDirectAbortPair_(cache,room,'SERVER CONNECTION UNAVAILABLE. THE HUMAN MATCH WAS ENDED.',true);
    return {ok:true,closed:true,noResultAwarded:true};
  } finally {lock.releaseLock();}
}
function rrDirectSaveCompatibility_(){
  // Pure checks against made-up values. No account/roster/vocabulary mutation.
  try {
    const summary=summarizeSave_({ribbitRacePvpMatchWins:'9','ribbitRaceBestEndlessFlies:park':'15'});
    const merged=mergePersistentSaveData_({ribbitRacePvpMatchWins:'9','ribbitRaceBestEndlessFlies:park':'10',ribbitRaceOnlineMatchIdsV1:'["diagnostic"]'},
      {ribbitRacePvpMatchWins:'7','ribbitRaceBestEndlessFlies:park':'15',ribbitRaceOnlineMatchIdsV1:'[]'},[]);
    const tests={pvpLeaderboard:summary.pvpMatchWins===9,endlessLeaderboard:summary.levelRecords?.park?.endless===15,
      pvpSaveMaximum:merged.ribbitRacePvpMatchWins==='9',endlessSaveMaximum:merged['ribbitRaceBestEndlessFlies:park']==='15',
      resultJournal:merged.ribbitRaceOnlineMatchIdsV1==='["diagnostic"]'};
    return {ok:Object.values(tests).every(Boolean),tests};
  }catch(error){return {ok:false,message:String(error.message||error)};}
}

 const apis={apiOnlineDiagnostic,apiOnlineCreateRoom,apiOnlineJoinRoom,apiOnlineExchange,apiOnlineLeaveRoom,apiOnlineFinishMatch,apiQuickplayStatus,apiQuickplayEnter,apiQuickplayPoll,apiQuickplayCancel,apiOnlineWatchList,apiOnlineSpectate,apiOnlineGuestSession,apiOnlineProfile,apiOnlineBattleTags,apiOnlineDirectAbort};

 function metadata(req){
  const room=rrOnlineReadRoom_(cache,rrOnlineCode_(req.roomCode));if(!room)return null;
  const role=rrOnlineRole_(room,req);if(!role)return null;
  const control=rrOnlineControl_(cache,room),own=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,role)),null);
  if(!own||own.left||control.aborted||control.cpuIndex===(role==='host'?0:1))return null;
  const authority=rrOnlineJson_(cache.get(rrOnlineMailKey_(room,control.authorityRole)),null);
  return {roomCode:room.code,epoch:room.epoch,pairId:room.direct.pairId,role,uid:auth.uid,
   marker:auth.marker,expires:Math.min(room[role].expiresAt,auth.expires),authorityRole:control.authorityRole,
   authorityVersion:control.version,cpuIndex:control.cpuIndex,matchId:authority?.matchId||'',phase:authority?.phase||'lobby',
   startSequence:Number(authority?.startSequence)||0,lobbyEpoch:Number(authority?.lobbyEpoch)||1};
 }
 return {deletePrivate:uid=>{props.deleteProperty(rrOnlineProfileKey_(uid));props.deleteProperty(rrQuickRatingKey_(uid));props.deleteProperty('FRIENDS_BATTLE:'+rrOnlineBattleId_(uid));},call:(name,req)=>{const f=apis[name];return f?f(req):rrOnlineError_('NOT_FOUND','Unknown room operation.');},metadata,
  roomIdentity:code=>{const r=rrOnlineReadRoom_(cache,rrOnlineCode_(code));return r?{epoch:r.epoch,pairId:r.direct?.pairId}:null;}};
}
