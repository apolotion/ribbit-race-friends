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

// Optimization-release regressions. One test file replaces the historical suite
// in the upload package; these checks exercise behavior, not obsolete UI strings.
import {readFileSync,readdirSync,existsSync,mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import vm from 'node:vm';
import {minify} from 'terser';
import {cleanRelease} from './clean-release.mjs';
const read=path=>readFileSync(resolve(path),'utf8');

function renderHarness(){
 class Context {
  constructor(){this.fillStyle='';this.globalAlpha=1;this.globalCompositeOperation='source-over';this.calls=0;this.images=0;this.matrix={a:4,b:0,c:0,d:4,e:0,f:0};}
  fillRect(){this.calls++;}drawImage(){this.images++;}getTransform(){return this.matrix;}
  setTransform(a,b,c,d,e,f){this.matrix={a,b,c,d,e,f};}
 }
 const target=new Context();const canvases=[];
 const box={ctx:target,COLORS:{white:'#fff'},document:{createElement(){const image={width:0,height:0,getContext(){return new Context();}};canvases.push(image);return image;}}};
 const source=read('client/game/70-rendering-text-world.js');
 vm.createContext(box);vm.runInContext(source.slice(0,source.indexOf('    function wrapBitmapTextAtScale'))+'\nthis.text=drawBitmapTextToContext;this.measure=measureBitmapText;this.status=()=>({bytes:bitmapRunCacheBytes,count:bitmapRunCache.size,hits:bitmapRunCacheHits,misses:bitmapRunCacheMisses});',box);
 return {box,target,canvases,draw:(text='HELLO',color='#fff')=>box.text(target,text,100,20,.7,'left',color)};
}
test('text cache reuses backing image for unchanged text',()=>{const h=renderHarness();h.draw();const a=h.box.status();h.draw();assert.equal(h.box.status().misses,a.misses);assert.equal(h.box.status().hits,a.hits+1);});
test('text cache keys include palette and display scale',()=>{const h=renderHarness();h.draw('HELLO','#fff');h.draw('HELLO','#f00');h.target.matrix={a:2,b:0,c:0,d:2,e:0,f:0};h.draw('HELLO','#fff');assert.equal(h.box.status().count,3);});
test('text cache remains within entry and memory budgets',()=>{const h=renderHarness();for(let i=0;i<1100;i++)h.draw('RELEASE TEST '+i);const a=h.box.status();assert.ok(a.count<=256);assert.ok(a.bytes<=6*1024*1024);assert.ok(h.canvases.some(c=>c.width===0));});
test('rotated and fractional camera transforms use original text painter',()=>{const h=renderHarness();h.target.matrix.b=.2;h.draw();assert.equal(h.box.status().count,0);assert.ok(h.target.calls>0);h.target.matrix.b=0;h.target.matrix.a=4.2;h.draw();assert.equal(h.box.status().count,0);});
test('empty strings do not allocate canvases',()=>{const h=renderHarness();h.draw('');assert.equal(h.canvases.length,0);});
test('bitmap measures accents and normalized typographic punctuation consistently',()=>{const h=renderHarness();assert.equal(h.box.measure('I’LL'),h.box.measure("I'LL"));assert.equal(h.box.measure('É'),h.box.measure('E'));});
test('repeated menu text removes thousands of fillRect calls',()=>{const h=renderHarness();for(let i=0;i<100;i++)h.draw('SINGLE PLAYER');assert.equal(h.target.calls,0);assert.equal(h.target.images,100);assert.equal(h.canvases.length,1);});

test('minification preserves template-literal content and dynamic function names',async()=>{
 const code='function callableByName(){return 7;} const value=`line one\n// this is data, not a comment\nline three`;globalThis.result=[eval("callableByName")(),value];';
 const packed=await minify(code,{compress:false,mangle:false});
 const before={},after={};vm.runInNewContext(code,before);vm.runInNewContext(packed.code,after);
 assert.equal(JSON.stringify(after.result),JSON.stringify(before.result));assert.match(packed.code,/callableByName/);
});
test('production bundle is syntax-valid and exposes the established startup function',()=>{const source=read('public/scripts/game.bundle.js');new vm.Script(source);assert.match(source,/function startRibbitRaceGame\(/);assert.ok(Buffer.byteLength(source)<1300000);assert.doesNotMatch(source,/__QA|__RRTEST/);});
test('all 29 readable game modules remain present',()=>{const files=readdirSync('client/game').filter(n=>/^\d+-.+\.js$/.test(n));assert.equal(files.length,29);for(const file of files)new vm.Script(read('client/game/'+file),{filename:file});});
test('runtime physics constants are unchanged',()=>{const s=read('client/game/10-core-config.js');assert.match(s,/gravity: 820/);assert.match(s,/maximumJumpX: 235/);assert.match(s,/maximumJumpY: 463/);assert.match(s,/maxFlies: 4/);});
test('both tutorials retain all dialogue and objective handlers',()=>{const s=read('client/game/120-tutorial-config.js');assert.match(s,/SOLO_STEPS/);assert.match(s,/PVP_STEPS/);assert.match(s,/pvpFinalMatch/);assert.match(s,/comboTwo/);assert.match(read('client/game/124-tutorial-monitoring.js'),/pvpUnderBonkTwo/);});
test('lossless portrait atlas replaces duplicate files and shares a single decoder',()=>{const s=read('client/game/120-tutorial-config.js');assert.equal((s.match(/new Image\(/g)||[]).length,1);const body=s.match(/const EMBER_PORTRAIT_FRAMES = Object.freeze\(([\s\S]*?)\);/)[1];const frames=JSON.parse(body);assert.equal(Object.keys(frames).length,16);assert.equal(new Set(Object.values(frames).map(v=>v.join(','))).size,12);assert.ok(Object.values(frames).every(v=>v[2]===190&&v[3]===190));const b=readFileSync('public/tutorial/ember-portraits.webp');assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');});
test('HTML and manifest reference only existing local assets',()=>{const html=read('public/index.html');for(const m of html.matchAll(/(?:src|href)="(\/(?:scripts|styles|icons|tutorial)\/[^"?#]+|\/favicon\.png|\/manifest\.webmanifest)/g))assert.ok(existsSync('public'+m[1]),m[1]);for(const i of JSON.parse(read('public/manifest.webmanifest')).icons)assert.ok(existsSync('public'+i.src),i.src);assert.equal((html.match(/\/styles\/game.css/g)||[]).length,1);});
test('version and deployment bindings identify the new release without migrations',()=>{assert.equal(JSON.parse(read('package.json')).version,'1.7.27');assert.match(read('src/common.js'),/friends-polish-40/);const wr=JSON.parse(read('wrangler.jsonc'));assert.deepEqual(wr.migrations,[{tag:'friends-v1',new_sqlite_classes:['FriendsHub','FriendsRoom']}]);assert.equal(wr.assets.binding,'ASSETS');assert.equal(wr.durable_objects.bindings.length,2);});
test('cleanup removes allowlisted obsolete assets but preserves unknown user files',()=>{const root=mkdtempSync(join(tmpdir(),'rr-release-'));mkdirSync(join(root,'public/styles'),{recursive:true});writeFileSync(join(root,'public/styles/base.css'),'old');writeFileSync(join(root,'custom-notes.txt'),'keep');writeFileSync(join(root,'UPDATE_NOTE_POLISH_24.txt'),'old');cleanRelease(root);assert.equal(existsSync(join(root,'public/styles/base.css')),false);assert.equal(existsSync(join(root,'UPDATE_NOTE_POLISH_24.txt')),false);assert.equal(readFileSync(join(root,'custom-notes.txt'),'utf8'),'keep');rmSync(root,{recursive:true});});

function replayHarness(){
 const recorders=[],requests=[],events=[];
 class Recorder {
  static isTypeSupported(){return true;}
  constructor(stream,{mimeType}={}){this.stream=stream;this.mimeType=mimeType||'video/webm';this.state='inactive';this.handlers={};recorders.push(this);}
  addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
  start(){this.state='recording';} pause(){this.state='paused';} resume(){this.state='recording';}
  stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['saved-frame'],{type:this.mimeType})});for(const fn of this.handlers.stop||[])fn();});}
 }
 let snap={mode:'solo',state:'playing',runId:1,level:'park',time:12,jumps:6,tutorialActive:false,sandboxMode:false};
 const tracks=[];
 const canvas={captureStream(){const track={stopped:false,stop(){this.stopped=true;}};tracks.push(track);return {getTracks:()=>[track]};}};
 const window={addEventListener(){},dispatchEvent(e){events.push(e);},matchMedia:()=>({matches:false})};
 class Reader {readAsDataURL(){this.result='data:video/webm;base64,dmFsaWQtZGF0YQ==';queueMicrotask(()=>this.onload());}}
 const env={window,MediaRecorder:Recorder,Blob,FileReader:Reader,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},bridge:()=>({snapshot:()=>snap,canvas:()=>canvas}),setTimeout(){},console,Date,fetch:async(path,options)=>{requests.push({path,options});return {ok:true,json:async()=>({ok:true,stored:['time']})};}};
 const source=read('public/scripts/extended-features.js');const a=source.indexOf('  class ReplayController {'),b=source.indexOf('  const replayController',a);
 vm.createContext(env);vm.runInContext(source.slice(a,b)+'\nReplayController.prototype.installLeaderboard=function(){};this.controller=new ReplayController();',env);
 return {env,controller:env.controller,recorders,requests,tracks,events,get snap(){return snap},setSnap:v=>{snap={...snap,...v}}};
}
test('only the Solo PB controller records Single Player',()=>{const source=read('client/game/110-online-mobile-polish.js');const monitor=source.slice(source.indexOf('const deepTick='),source.indexOf('// --- Replay archive'));assert.doesNotMatch(monitor,/RecordReplay.start|RecordReplay.finish/);const h=replayHarness();h.controller.tick();h.controller.tick();assert.equal(h.recorders.length,1);});
test('Versus, tutorials and sandbox never start the Solo video recorder',()=>{for(const patch of [{mode:'pvp'},{tutorialActive:true},{sandboxMode:true},{onlineVersus:true}]){const h=replayHarness();h.setSnap(patch);h.controller.tick();assert.equal(h.recorders.length,0);}});
test('pause and resume keep the same replay rather than duplicating it',()=>{const h=replayHarness();h.controller.tick();h.setSnap({state:'paused'});h.controller.tick();assert.equal(h.recorders[0].state,'paused');h.setSnap({state:'playing'});h.controller.tick();assert.equal(h.recorders.length,1);assert.equal(h.recorders[0].state,'recording');});
test('leaving a run stops every canvas capture track and drops temporary chunks',async()=>{const h=replayHarness();h.controller.tick();h.setSnap({state:'main'});h.controller.tick();await Promise.resolve();assert.equal(h.controller.session,null);assert.ok(h.tracks.every(t=>t.stopped));});
test('restart discards old recording before starting a new one',async()=>{const h=replayHarness();h.controller.tick();h.setSnap({runId:2});h.controller.tick();await Promise.resolve();assert.equal(h.recorders.length,2);assert.equal(h.tracks[0].stopped,true);assert.equal(h.tracks[1].stopped,false);assert.equal(h.controller.session.parts.length,0);});
test('finishing a PB uploads to the original authenticated endpoint and releases tracks',async()=>{const h=replayHarness();h.controller.tick();await h.controller.finish(h.snap);assert.equal(h.requests.length,1);assert.equal(h.requests[0].path,'/api/replays/submit');assert.equal(h.requests[0].options.credentials,'same-origin');const data=JSON.parse(h.requests[0].options.body);assert.equal(data.level,'park');assert.equal(data.time,12);assert.equal(data.jumps,6);assert.equal(h.events[0].type,'ribbit-replay-uploaded');assert.ok(h.tracks.every(t=>t.stopped));});
test('asynchronous stop cannot merge a previous video into the next run',async()=>{const h=replayHarness();h.controller.tick();const pending=h.controller.finish(h.snap);h.setSnap({runId:2});h.controller.tick();await pending;assert.equal(h.controller.session.runId,2);assert.equal(h.controller.session.parts.length,0);});
test('temporary Solo replay buffer is bounded and does not restart after overflow',async()=>{const h=replayHarness();h.controller.tick();h.recorders[0].ondataavailable({data:new Blob(['x'.repeat(2800001)])});h.controller.tick();await Promise.resolve();assert.equal(h.controller.session,null);assert.equal(h.recorders.length,1);assert.ok(h.tracks[0].stopped);});
test('finishing an already-inactive encoder resolves without hanging',async()=>{const h=replayHarness();h.controller.tick();h.recorders[0].state='inactive';h.controller.session.parts.push(new Blob(['frame']));await h.controller.finish(h.snap);assert.equal(h.requests.length,1);});
test('UI compatibility scanner no longer walks every DOM node on every frame',()=>{const s=read('public/scripts/rr-170-polish.js');assert.match(s,/if \(lastPresentationState !== presentationState\) document.querySelectorAll/);assert.match(s,/if \(left.hidden === two\)/);});
