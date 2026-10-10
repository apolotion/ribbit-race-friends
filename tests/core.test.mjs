import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomApi} from '../src/rooms-core.js';
import {sanitizeSaveData_,mergePersistentSaveData_,summarizeSave_} from '../src/save-data.js';
import {digest,equal,randomHex,pinHash,sessionCookie,limitedJson} from '../src/common.js';
const defaults={friendsVersion:1,protocol:3,lifecycleVersion:3,quickplayVersion:3,directCapable:true,skinId:'azure',appearance:null,settings:{stage:'park',roundGoal:'first5',bestOf:1,timeLimit:0},vocabulary:[{english:'Help',spanish:'Ayuda'},{english:'Paper',spanish:'Papel'},{english:'Time',spanish:'Tiempo'},{english:'More',spanish:'Más'}]};
function harness(){const entries=new Map(),properties=new Map();let socketPresence={};const calls=[];
 const cache={get:k=>{const e=entries.get(k);return e&&e.until>Date.now()?e.value:null;},put:(k,v,s=600)=>entries.set(k,{value:String(v),until:Date.now()+s*1000}),remove:k=>entries.delete(k),removeAll:ks=>ks.forEach(k=>entries.delete(k))};cache.getAll=ks=>Object.fromEntries(ks.map(k=>[k,cache.get(k)]).filter(([,v])=>v!==null));cache.putAll=(o,s)=>Object.entries(o).forEach(([k,v])=>cache.put(k,v,s));
 const props={getProperty:k=>properties.get(k)||null,setProperty:(k,v)=>properties.set(k,String(v)),deleteProperty:k=>properties.delete(k),setProperties:o=>Object.entries(o).forEach(([k,v])=>properties.set(k,String(v)))};
 const users=[{uid:'user-a',marker:'marker-a',guest:false,name:'One',expires:Date.now()+3600000},{uid:'user-b',marker:'marker-b',guest:false,name:'Two',expires:Date.now()+3600000},{uid:'guest:viewer',marker:'marker-c',guest:true,name:'Viewer',expires:Date.now()+3600000}];
 const api=i=>createRoomApi({cache,props,auth:users[i],socketPresence,store:{award:(uid,id)=>{calls.push({uid,id});return {ok:true,pvpMatchWins:calls.length};}}});
 const invoke=(i,name,p={})=>api(i).call(name,{...defaults,...(users[i].guest?{guestToken:users[i].marker}:{sessionToken:users[i].marker}),...p});
 function pair(){const host=invoke(0,'apiOnlineCreateRoom'),guest=invoke(1,'apiOnlineJoinRoom',{roomCode:host.roomCode,skinId:'crimson'});let seq=[0,0],last=[host,guest];
  const ex=(i,extra={})=>last[i]=invoke(i,'apiOnlineExchange',{roomCode:host.roomCode,playerToken:[host,guest][i].playerToken,requestSequence:++seq[i],lobbyRevision:seq[i]+1,ready:true,readyForSettings:1,settingsRevision:1,skinId:i?'crimson':'azure',...extra});
  ex(0);socketPresence={pairId:last[0].directPolicy.pairId,host:{live:true,connectionId:'socket-a'},guest:{live:true,connectionId:'socket-b'}};
  const proof=i=>({directVerified:true,directProof:{pairId:last[i].directPolicy.pairId,peerChallenge:last[1-i].directPolicy.challenge}});
  const start=()=>{ex(1,proof(1));return ex(0,proof(0));};
  return {host,guest,ex,last,proof,start,disable:()=>{socketPresence={};}};
 }
 return {invoke,api,pair,cache,props,calls,users,setPresence:value=>{socketPresence=value;}};}

test('PIN derivation is salted and cookie is Secure/HttpOnly',()=>{const salt=randomHex(16);assert.equal(pinHash('u','1234',salt).length,64);assert.notEqual(pinHash('u','1234',salt),pinHash('u','1234',randomHex(16)));const c=sessionCookie('https://example.invalid','abc',30);assert.match(c,/__Host-rrfriends=abc/);assert.match(c,/HttpOnly/);assert.match(c,/Secure/);assert.equal(equal('abc','abcd'),false);assert.equal(digest('x').length,64);});
test('JSON request size limit rejects oversized streamed input',async()=>{await assert.rejects(()=>limitedJson(new Request('https://x',{method:'POST',body:'{"value":"'+('x'.repeat(60))+'"}'}),30),/too large/);});
test('save keeps Endless maxima, time minima, PvP maxima and result journal',()=>{const s=mergePersistentSaveData_({'ribbitRaceBestEndlessFlies:park':'10','ribbitRaceBestTime:park':'30',ribbitRacePvpMatchWins:'9',ribbitRaceOnlineMatchIdsV1:'["real"]'},{'ribbitRaceBestEndlessFlies:park':'15','ribbitRaceBestTime:park':'40',ribbitRacePvpMatchWins:'7',ribbitRaceOnlineMatchIdsV1:'[]'},[]);assert.equal(s['ribbitRaceBestEndlessFlies:park'],'15');assert.equal(s['ribbitRaceBestTime:park'],'30');assert.equal(s.ribbitRacePvpMatchWins,'9');assert.equal(s.ribbitRaceOnlineMatchIdsV1,'["real"]');assert.equal(summarizeSave_(s).levelRecords.park.endless,15);});
test('save ignores unrelated keys and bounds payloads',()=>{const s=sanitizeSaveData_({schoolPassword:'ignore',ribbitRaceTotalFlies:'3'});assert.equal(s.schoolPassword,undefined);assert.throws(()=>sanitizeSaveData_({ribbitRaceHuge:'x'.repeat(180001)}),/too large/);});
test('achievements merge without deleting prior unlocks',()=>{const s=mergePersistentSaveData_({ribbitRaceEarnedAchievementsV1:'["a"]'},{ribbitRaceEarnedAchievementsV1:'["b"]'},['ribbitRaceEarnedAchievementsV1']);assert.deepEqual(JSON.parse(s.ribbitRaceEarnedAchievementsV1),['a','b']);});
test('old clients and untested preflight rejected',()=>{const h=harness();assert.equal(h.invoke(0,'apiOnlineCreateRoom',{friendsVersion:0}).code,'UPDATE_REQUIRED');assert.equal(h.invoke(0,'apiOnlineCreateRoom',{directCapable:false}).code,'DIRECT_CHECK_REQUIRED');});
test('private room rejects same account and wrong account token',()=>{const h=harness(),p=h.pair();assert.equal(h.invoke(0,'apiOnlineJoinRoom',{roomCode:p.host.roomCode}).code,'SAME_PLAYER');assert.equal(h.invoke(2,'apiOnlineExchange',{roomCode:p.host.roomCode,playerToken:p.host.playerToken}).code,'ROOM_AUTH_FAILED');});
test('Ready and a fabricated flag cannot start without authenticated sockets',()=>{const h=harness(),p=h.pair();p.disable();p.ex(1,p.proof(1));const r=p.ex(0,p.proof(0));assert.equal(r.startSequence,0);assert.equal(r.directPolicy.verified,false);});
test('two fresh socket confirmations admit a private match',()=>{const p=harness().pair(),r=p.start();assert.equal(r.startSequence,1);assert.equal(r.roomStatus,'starting');assert.equal(r.startConfig.bestOf,1);assert.equal(r.directPolicy.verified,true);});
test('wrong partner challenge does not admit',()=>{const p=harness().pair();p.ex(1,{directVerified:true,directProof:{pairId:p.last[1].directPolicy.pairId,peerChallenge:'wrong'}});const r=p.ex(0,p.proof(0));assert.equal(r.startSequence,0);});
test('Google-style audit snapshots and inputs never returned for live human playback',()=>{const p=harness().pair(),r=p.start();assert.equal(r.latestSnapshot,null);assert.deepEqual(r.newInputEvents,[]);assert.deepEqual(r.newCatchClaims,[]);});
test('private lobby leave invalidates old room capability',()=>{const h=harness(),p=h.pair();assert.equal(h.invoke(1,'apiOnlineLeaveRoom',{roomCode:p.guest.roomCode,playerToken:p.guest.playerToken}).ok,true);assert.equal(h.api(1).metadata(p.guest),null);});
test('in-progress opponent departure produces one server-authorized CPU slot',()=>{const h=harness(),p=h.pair();p.start();h.invoke(1,'apiOnlineLeaveRoom',{roomCode:p.guest.roomCode,playerToken:p.guest.playerToken});p.disable();const r=p.ex(0);assert.equal(r.cpuIndex,1);assert.equal(r.authorityRole,'host');});
test('host departure transfers simulation authority to surviving guest',()=>{const h=harness(),p=h.pair();p.start();h.invoke(0,'apiOnlineLeaveRoom',{roomCode:p.host.roomCode,playerToken:p.host.playerToken});p.disable();const r=p.ex(1);assert.equal(r.cpuIndex,0);assert.equal(r.authorityRole,'guest');assert.equal(r.authorityVersion,2);});
test('unstarted failed pairing is closed without awarding any result',()=>{const h=harness(),p=h.pair();const r=h.invoke(0,'apiOnlineDirectAbort',{...p.host,pairId:p.last[0].directPolicy.pairId});assert.equal(r.noResultAwarded,true);assert.equal(p.ex(0).code,'DIRECT_PAIR_CLOSED');assert.equal(h.calls.length,0);});
test('Quickplay pairs with fixed best-of-three Endless rules',()=>{const h=harness();const a=h.invoke(0,'apiQuickplayEnter',{requestId:'qa'}),b=h.invoke(1,'apiQuickplayEnter',{requestId:'qb'});const c=h.invoke(0,'apiQuickplayPoll',{queueToken:a.queueToken,sequence:1});assert.equal(b.status,'matched');assert.equal(c.status,'matched');assert.equal(b.connection.roomCode,c.connection.roomCode);assert.equal(b.connection.rules.bestOf,3);assert.equal(b.connection.rules.timeLimit,60);});
test('guest spectator capability survives subsequent polls',()=>{const h=harness(),p=h.pair();const a=h.invoke(2,'apiOnlineSpectate',{roomCode:p.host.roomCode});const b=h.invoke(2,'apiOnlineSpectate',{roomCode:p.host.roomCode,viewerToken:a.viewerToken});assert.equal(a.ok,true);assert.equal(b.ok,true);});
test('spectator capability cannot be reused by a different account',()=>{const h=harness(),p=h.pair();const a=h.invoke(2,'apiOnlineSpectate',{roomCode:p.host.roomCode});assert.equal(h.invoke(0,'apiOnlineSpectate',{roomCode:p.host.roomCode,viewerToken:a.viewerToken}).code,'SPECTATOR_EXPIRED');});
test('private ratings are absent from public profile',()=>{const h=harness(),r=h.invoke(0,'apiOnlineProfile');assert.equal(r.ok,true);assert.equal(r.rating,undefined);assert.equal(r.battleTag.length,6);});
test('guest display names stay in expiring storage',()=>{const h=harness();h.invoke(2,'apiOnlineProfile',{name:'New Guest'});assert.equal(h.invoke(2,'apiOnlineProfile').name,'New Guest');});


test('Quickplay player replaced by CPU can immediately enter a new queue',()=>{
 const h=harness();
 const first=h.invoke(0,'apiQuickplayEnter',{requestId:'qa'});
 const second=h.invoke(1,'apiQuickplayEnter',{requestId:'qb'});
 const firstMatched=h.invoke(0,'apiQuickplayPoll',{queueToken:first.queueToken,sequence:1});
 assert.equal(firstMatched.status,'matched');assert.equal(second.status,'matched');
 const connections=[firstMatched.connection,second.connection],seq=[0,0],last=[null,null];
 const ex=(i,extra={})=>last[i]=h.invoke(i,'apiOnlineExchange',{roomCode:connections[i].roomCode,playerToken:connections[i].playerToken,requestSequence:++seq[i],lobbyRevision:seq[i]+1,ready:true,readyForSettings:1,settingsRevision:1,skinId:i?'crimson':'azure',quickplayAccepted:true,...extra});
 ex(0);ex(1);
 const byRole=Object.fromEntries(connections.map((connection,index)=>[connection.role,index]));
 const presence={pairId:last[0].directPolicy.pairId,host:{live:true,connectionId:'socket-host'},guest:{live:true,connectionId:'socket-guest'}};
 h.setPresence(presence);
 const proof=i=>({directVerified:true,directProof:{pairId:last[i].directPolicy.pairId,peerChallenge:last[1-i].directPolicy.challenge}});
 ex(byRole.guest,proof(byRole.guest));
 const started=ex(byRole.host,proof(byRole.host));
 assert.ok(['starting','playing'].includes(started.roomStatus));
 const departing=1,survivor=0;
 h.invoke(departing,'apiOnlineLeaveRoom',{roomCode:connections[departing].roomCode,playerToken:connections[departing].playerToken});
 h.setPresence({});const takeover=ex(survivor);
 assert.equal(takeover.cpuIndex,connections[departing].role==='host'?0:1);
 const requeued=h.invoke(departing,'apiQuickplayEnter',{requestId:'qb-new'});
 assert.equal(requeued.ok,true);assert.equal(requeued.status,'queued');
});
