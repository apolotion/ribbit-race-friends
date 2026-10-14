import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const replaySource=readFileSync('client/game/133-engine-replay.js','utf8');
const captureSource=replaySource.slice(0,replaySource.indexOf('// The stage belongs to the canvas alone'));

function context(state='countdown',mode='solo'){
  let now=0;
  const ctx={
    performance:{now:()=>now},window:{},Date,Math,Number,Array,Promise,console,setTimeout,clearTimeout,
    game:{mode,state,selectedLevelId:'park',elapsed:0,worldTime:0,visualTime:0,
      countdownNumber:3,countdownTimer:.75,jumps:0,score:0,skinId:'azure',pvpRoundWins:[0,0]},
    frog:{x:100,y:205,w:24,h:16,vx:0,vy:0,dir:1,grounded:true,danceTime:0,afterimages:[]},
    tongue:{active:false},flies:[],
    pvpPlayers:[{x:100,y:205,w:24,h:16,tongue:{active:false}},{x:120,y:205,w:24,h:16,tongue:{active:false}}],
    LEVELS:{park:{platforms:[],flySpawns:[]}},VOCABULARY:[{english:'School',spanish:'Escuela'}],
    tutorial:{active:false},OnlineVersus:{isSpectating:()=>false,preparingStart:()=>false}
  };
  vm.createContext(ctx);
  vm.runInContext(captureSource,ctx,{filename:'133-engine-replay-capture.js'});
  return {ctx,at(ms){now=ms;return now;},tick(ms){now=ms;ctx.ribbitReplayCaptureTick(now);}};
}
function frame(t,phase='playing',number=0,dance=0){
  return {t,phase,clock:0,world:0,visual:t/1000,target:0,score:5,jumps:10,
    round:1,roundTime:30,roundWins:[0,0],pvpElapsed:0,
    gameState:{state:phase,countdownNumber:number,countdownTimer:.75},
    player:{x:125,y:215,w:24,h:16,danceTime:dance,grounded:true},
    tongue:{active:false},players:[],flies:[]};
}
function record(version=2){
  return {kind:'ribbit-engine-frames',version,mode:'solo',level:'park',fps:60,
    duration:9000,vocab:[{english:'School',spanish:'Escuela'}],sounds:[{t:0,f:330,d:.1,v:.02,s:0}],
    final:{time:4,jumps:10,score:5,startT:5000,danceMs:3000,scoreDelayMs:1000,scoreHoldMs:3000},
    frames:[frame(0,'countdown',3),frame(2000,'countdown',1),frame(3000),frame(5000,'won',0,0),frame(6000,'won',0,1),frame(8000,'won',0,3)]};
}

test('First replay frame is the first countdown 3 before sound; 2 and 1 are recorded before movement',()=>{
  const {ctx,tick}=context();
  ctx.ribbitReplayCaptureCountdownStart(0);
  ctx.window.RibbitReplaySoundCapture(330,.1,.02,0,0);
  for(let i=1;i<=135;i++){
    ctx.game.countdownNumber=i<=45?3:i<=90?2:1;
    ctx.game.countdownTimer=.75-((i-1)%45)/60;
    tick(i*1000/60);
  }
  ctx.game.state='playing';ctx.game.countdownNumber=0;tick(136*1000/60);
  const recording=ctx.ribbitReplayExportCurrent();
  assert.equal(recording.version,2);
  assert.equal(recording.frames[0].t,0);
  assert.equal(recording.frames[0].phase,'countdown');
  assert.equal(recording.frames[0].gameState.countdownNumber,3);
  assert.deepEqual([...new Set(recording.frames.filter(f=>f.phase==='countdown').map(f=>f.gameState.countdownNumber))],[3,2,1]);
  assert.equal(recording.sounds[0].t,0);
  assert.equal(recording.sounds[0].f,330);
  assert.ok(recording.frames.some(f=>f.phase==='playing'));
});

test('Online synchronized 3-2-1 still records even when previous elapsed clock is nonzero',()=>{
  const {ctx,at}=context('countdown','pvp');
  ctx.game.elapsed=12;
  let waiting=true;
  ctx.OnlineVersus.preparingStart=()=>waiting;
  ctx.ribbitReplayCaptureCountdownStart(0);
  assert.equal(ctx.ribbitReplayExportCurrent(),null);
  waiting=false;
  at(100);
  ctx.game.countdownNumber=3;
  ctx.ribbitReplayCaptureCountdownStart(100);
  ctx.window.RibbitReplaySoundCapture(460,.09,.01,0,0);
  assert.equal(ctx.ribbitReplayExportCurrent(),null); // only first frame so far
  ctx.ribbitReplayCaptureTick(150);
  const data=ctx.ribbitReplayExportCurrent();
  assert.equal(data.frames[0].phase,'countdown');
  assert.equal(data.sounds[0].t,0);
  assert.match(readFileSync('client/game/30-online-versus.js','utf8'),/if\(number===3\)window\.RibbitEngineReplay\?\.captureCountdownStart\?\.\(performance\.now\(\)\)/);
});

test('Replay schema v2 stores 1-second solo lead, 3-second centered final-score ending',()=>{
  const {ctx,tick}=context('playing');
  tick(0);tick(1000);
  ctx.game.state='won';ctx.game.finishTime=1;ctx.game.jumps=12;ctx.game.score=5;
  tick(1200);
  for(let i=1;i<=182;i++){ctx.frog.danceTime=i/60;tick(1200+i*1000/60);}
  const data=ctx.ribbitReplayExportCurrent();
  assert.equal(data.version,2);
  assert.equal(data.compatibility.frameSchema,2);
  assert.equal(data.final.scoreDelayMs,1000);
  assert.equal(data.final.scoreHoldMs,3000);
  assert.equal(data.duration-data.final.startT,4000);
  assert.ok(data.frames.at(-1).t<data.duration);
  assert.equal(ctx.ribbitReplayFinalTimeline(data).showAt,data.final.startT+1000);
  assert.equal(ctx.ribbitReplayFinalTimeline(data).finishAt,data.final.startT+4000);
});

test('Polish 44 v1 records without duration/audio/phase remain playable and unchanged',()=>{
  const {ctx}=context();
  const original={kind:'ribbit-engine-frames',version:1,mode:'solo',level:'park',
    frames:[{t:0,player:{x:0,y:10},players:[],flies:[]},{t:80,player:{x:2,y:10},players:[],flies:[]}],
    vocab:[{english:'School',spanish:'Escuela'}]};
  const frozen=JSON.stringify(original);
  const adapted=ctx.ribbitReplayAdaptLegacy(original);
  assert.ok(adapted);assert.equal(adapted.duration,80);
  assert.equal(adapted.legacySchema,1);assert.equal(adapted.sounds.length,0);
  assert.equal(adapted.frames,original.frames);
  assert.equal(ctx.validateRibbitReplayData(original),true);
  assert.equal(JSON.stringify(original),frozen); // never rewrite the archived bytes
  assert.equal(ctx.validateRibbitReplayData({...original,version:9}),false);
});

test('Polish 48–51 v1 final is retimed in memory, preserving the original archived recording',()=>{
  const {ctx}=context();
  const old=record(1);delete old.final.startT;
  old.duration=10000; // archived replay used to hold an extra 2s after the 3s dance
  const before=JSON.stringify(old);
  const adapted=ctx.ribbitReplayAdaptLegacy(old);
  assert.equal(adapted.legacySchema,1);
  assert.equal(adapted.final,old.final);
  assert.equal(adapted.duration,9000); // 5s win onset + 1s + 3s = 9s
  assert.equal(ctx.ribbitReplayFinalTimeline(adapted).start,5000);
  assert.equal(JSON.stringify(old),before);
});

test('Frog Tags can stitch old v1 rounds with new v2 recordings without altering either',()=>{
  const {ctx}=context();
  const first=record(1),second=record(2);
  const originals=[JSON.stringify(first),JSON.stringify(second)];
  const result=ctx.ribbitReplayCombineRounds([first,second]);
  assert.equal(result.legacyCombinedRounds,2);
  assert.ok(result.frames.length>=12);
  assert.equal(result.frames[6].t>result.frames[5].t,true);
  assert.equal(JSON.stringify(first),originals[0]);
  assert.equal(JSON.stringify(second),originals[1]);
});

function viewingContext(){
  const {ctx}=context('playing');
  const drawn=[],seen=[];
  const classes={add(){},remove(){}};
  Object.assign(ctx,{
    W:480,H:270,COLORS:{ink:'#26363d',white:'#fff'},clamp:(n,min,max)=>Math.min(max,Math.max(min,n)),
    platforms:[],flySpawns:[],normalizeVocabularyEntries:v=>v,
    document:{body:{classList:classes},getElementById:()=>null},
    canvas:{addEventListener(){}},drawScene(){seen.push({state:ctx.game.state,dance:ctx.frog.danceTime});},
    drawVictoryScreen(){},drawResumeCountdown(){seen.push({countdown:ctx.game.countdownNumber});},
    drawBitmapText(...args){drawn.push(args);},
    ctx:{fillRect(...args){drawn.push(['rect',...args]);},fillStyle:''},
    clearHeldInput(){},tone(){},toggleRibbitFullscreen(){},
    window:{...ctx.window,addEventListener(){}}
  });
  vm.runInContext(replaySource.slice(replaySource.indexOf('// The stage belongs to the canvas alone')),ctx);
  vm.runInContext('this.activeReplay=()=>ribbitReplayView',ctx);
  return {ctx,seen,drawn};
}

test('At 1 second of jumping, the score appears in the CENTER and the frog keeps dancing for 3 more',()=>{
  const {ctx,seen,drawn}=viewingContext();
  ctx.ribbitReplayBegin(record(2),'TEST');
  ctx.ribbitReplaySeek(5.9);ctx.paintRibbitReplayStage();
  assert.ok(!drawn.some(a=>a[0]==='REPLAY COMPLETE!'));
  ctx.ribbitReplaySeek(6.01);ctx.paintRibbitReplayStage();
  assert.ok(drawn.some(a=>a[0]==='REPLAY COMPLETE!' && a[1]===240));
  assert.ok(drawn.some(a=>a[0]==='rect' && a[1]===44 && a[2]===71));
  ctx.ribbitReplaySeek(8.98);ctx.paintRibbitReplayStage();
  assert.ok(seen.at(-1).dance>=3.9,`expected an animated final frame; actual ${seen.at(-1).dance}`);
  assert.ok(seen.at(-1).state==='won');
});

test('Space or replay button at the end rewinds to countdown and restarts its first sound',()=>{
  const {ctx}=viewingContext();
  ctx.ribbitReplayBegin(record(2),'TEST');
  ctx.ribbitReplaySeek(9);ctx.activeReplay().paused=true;
  ctx.handleRibbitReplayKey({code:'Space',repeat:false,preventDefault(){},stopImmediatePropagation(){}});
  assert.equal(ctx.activeReplay().position,0);
  assert.equal(ctx.activeReplay().soundIndex,0);
  assert.equal(ctx.activeReplay().paused,false);
  assert.equal(ctx.activeReplay().rate,1);
  ctx.activeReplay().position=9000;ctx.activeReplay().paused=true;
  ctx.ribbitReplayTogglePlayback();
  assert.equal(ctx.activeReplay().position,0);
  ctx.activeReplay().position=5000;ctx.activeReplay().paused=true;
  ctx.ribbitReplayTogglePlayback();
  assert.equal(ctx.activeReplay().position,5000); // mid-replay: toggles normally
  assert.equal(ctx.activeReplay().paused,false);
});


test('Schema v2 replay saves and uses original stage geometry after future map edits',()=>{
  const {ctx,tick}=context('playing');
  ctx.LEVELS.park.platforms.push({x:40,y:90,w:80,h:8});
  ctx.LEVELS.park.flySpawns.push({x:65,y:25});
  tick(0);tick(100);
  const data=ctx.ribbitReplayExportCurrent();
  assert.equal(data.stageLayout.platforms[0].x,40);
  assert.equal(data.stageLayout.flySpawns[0].x,65);
  ctx.LEVELS.park.platforms[0].x=155;
  assert.equal(data.stageLayout.platforms[0].x,40,'saved geometry must not move with later map changes');
  assert.match(replaySource,/platforms=data.stageLayout\?\.platforms\|\|LEVELS\[data.level\]\.platforms/);
});

test('Legacy no-phase no-audio replay renders successfully using safe defaults',()=>{
  const {ctx,seen}=viewingContext();
  const legacy={kind:'ribbit-engine-frames',version:1,mode:'solo',level:'park',
    frames:[{t:0,clock:0,world:0,visual:0,score:0,jumps:0,player:{x:125,y:215,w:24,h:16},players:[],flies:[]},
      {t:100,clock:.1,world:.1,visual:.1,score:0,jumps:0,player:{x:127,y:215,w:24,h:16},players:[],flies:[]}]};
  assert.equal(ctx.ribbitReplayBegin(legacy,'OLD REPLAY'),true);
  ctx.ribbitReplaySeek(.07);
  assert.doesNotThrow(()=>ctx.paintRibbitReplayStage());
  assert.equal(seen.at(-1).state,'playing');
});
