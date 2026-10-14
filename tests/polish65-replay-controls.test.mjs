import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('client/game/133-engine-replay.js','utf8');
const style=readFileSync('public/styles/rr-170.css','utf8');
const solo=readFileSync('client/game/71-rendering-entities-hud.js','utf8');
const versus=readFileSync('client/game/63-versus-rendering-ui.js','utf8');
const hooks=readFileSync('client/game/126-tutorial-hooks.js','utf8');
const section=(start,end)=>{
  const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
  assert.ok(from>=0&&to>from,`section: ${start}`);
  return source.slice(from,to);
};

function transportContext(paused){
  let now=0;const tones=[];
  const view={data:{duration:5000,sounds:[{t:150,f:440,d:.1,v:.02,s:0}]},
    paused,position:0,rate:1,lastTick:0,soundIndex:0,volume:1,muted:false,lastNonzeroVolume:1,
    spaceFastForwardHeld:false,spaceStartedPaused:false,scrubbing:false};
  const env={ribbitReplayView:view,window:{},game:{volume:1,muted:false},Math,Number,
    performance:{now:()=>now},clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),
    ribbitReplayUpdateControls(){},ribbitReplayCaptureTick(){},tone(...args){tones.push(args)}
  };
  vm.createContext(env);
  vm.runInContext(section('function ribbitReplayTick(', 'function replayFrameAt('),env);
  vm.runInContext(section('function ribbitReplayToggleMute()', 'function ribbitReplayBegin('),env);
  vm.runInContext(section('function ribbitReplaySpacePress(', 'window.addEventListener("keydown",handleRibbitReplayKey,true);'),env);
  return {env,view,tones,setNow(value){now=value;},tick(value){now=value;env.ribbitReplayTick(value);}};
}

test('Space temporarily scrubs at 2x while paused, stays paused, and plays no audio',()=>{
  const {env,view,tones,setNow,tick}=transportContext(true);
  env.ribbitReplaySpacePress();
  assert.equal(view.spaceStartedPaused,true);
  for(let t=20;t<=360;t+=20)tick(t);
  assert.ok(view.position>=700&&view.position<=740,`2x advance: ${view.position}`);
  assert.equal(tones.length,0,'silent paused fast-forward');
  setNow(370);env.ribbitReplaySpaceRelease();
  assert.equal(view.paused,true);
  assert.equal(view.rate,1);
  assert.equal(view.spaceFastForwardHeld,false);
  tick(440);assert.equal(view.position,720,'paused position cannot drift after release');
});

test('Space fast-forward while playing sounds and restores underlying rate',()=>{
  const {env,view,tones,tick}=transportContext(false);
  view.rate=.75;
  env.ribbitReplaySpacePress();
  for(let t=20;t<=120;t+=20)tick(t);
  assert.equal(view.position,240);
  assert.equal(tones.length,1,'playing fast-forward may sound recorded audio');
  env.ribbitReplaySpaceRelease();
  tick(220);
  assert.equal(view.rate,.75,'temporary 2x never changes selected rate');
  assert.equal(view.position,315);
});

test('M and speaker icon share mute state; volume up/down are exact five-percent steps',()=>{
  const {env,view}=transportContext(true);
  env.ribbitReplayToggleMute();assert.equal(view.muted,true);assert.equal(view.volume,1);
  env.ribbitReplayChangeVolume(-.05);assert.equal(view.volume,0);assert.equal(view.muted,true);
  env.ribbitReplayToggleMute();assert.equal(view.muted,false);assert.equal(view.volume,1);
  env.ribbitReplayChangeVolume(-.05);assert.equal(view.volume,.95);
  env.ribbitReplayChangeVolume(.05);assert.equal(view.volume,1);
  env.ribbitReplayChangeVolume(.05);assert.equal(view.volume,1,'volume clamps at 100%');
});

test('world record values use the correct stage and both leaderboard categories',()=>{
  const env={Math,Number};vm.createContext(env);
  vm.runInContext(section('function ribbitReplayExtractWorldRecords(', 'async function ribbitReplayLoadWorldRecords('),env);
  const rows={entries:[
    {name:'test',records:{park:{time:23.4,jumps:15},jungle:{time:12,jumps:6}}},
    {name:'second',records:{park:{time:17.8,jumps:11}}},
    {name:'third',records:{park:{time:18.1,jumps:9}}}
  ]};
  const wr=env.ribbitReplayExtractWorldRecords(rows,'park');
  assert.equal(wr.time,17.8);assert.equal(wr.jumps,9);
  const none=env.ribbitReplayExtractWorldRecords(null,'park');
  assert.equal(none.time,null);assert.equal(none.jumps,null);
  assert.match(source,/game\.bestTime=view\.worldRecords\?\.time\?\?null/);
  assert.match(solo,/RibbitEngineReplay\?\.active\?\.\(\) \? "WR" : "BEST"/);
});

test('pre-Polish-65 replay countdowns are synthesized at a stable 60Hz without editing archives',()=>{
  const env={RIBBIT_REPLAY_COUNTDOWN_STEP_MS:750,Math};vm.createContext(env);
  vm.runInContext(section('function ribbitReplayEnsureCountdown(', '// Merge historical round recordings'),env);
  const frame=t=>({t,phase:'playing',gameState:{state:'playing'},player:{x:125,y:205},players:[],flies:[]});
  const original={frames:[frame(110),frame(800)],sounds:[],duration:800};
  const snapshot=JSON.stringify(original);
  const playable=env.ribbitReplayEnsureCountdown(original);
  assert.equal(playable.frames.length,137);
  assert.deepEqual([playable.frames[0].gameState.countdownNumber,
    playable.frames[45].gameState.countdownNumber,playable.frames[90].gameState.countdownNumber],[3,2,1]);
  assert.equal(playable.frames[135].phase,'playing');
  assert.equal(JSON.stringify(original),snapshot,'saved replay remains unchanged');
});

test('replay UI keeps transport, vertical hover volume, stopwatch and top-right exit',()=>{
  for(const marker of ['data-replay-action="play"','data-replay-action="mute"','rr-replay-volume-popover',
    'rr-stopwatch-frame','data-replay-action="speed"','data-replay-action="exit"',
    'ribbitReplayClose();return;','ribbitReplaySpacePress','ribbitReplaySpaceRelease',
    'if(!ribbitReplayView.paused){ribbitReplayView.paused=true'])assert.ok(source.includes(marker),marker);
  assert.match(style,/\.rr-replay-volume:hover \.rr-replay-volume-popover/);
  assert.match(style,/rotate\(-90deg\)/);
  assert.match(style,/rr-replay-speed\s*\{[\s\S]*?flex:0 0 clamp\(/);
  assert.match(source,/drawBitmapText\("LEVEL COMPLETE!"/);
  assert.match(source,/for\(let i=0;i<15;i\+\+\)/);
  assert.match(hooks,/if \(window\.RibbitEngineReplay\?\.active\?\.\(\)\) return;/);
  assert.match(versus,/tutorial\.active \|\| game\.tutorialActive \|\| player\.firstJumpMade/);
  assert.match(solo,/tutorial\.active \|\| game\.tutorialActive/);
});
