import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=file=>readFileSync(file,'utf8');
const engine=read('client/game/133-engine-replay.js');
const tagSource=read('client/game/134-frog-tags-replay-browser.js');

function recorder(){
  let now=0;
  const ctx={
    performance:{now:()=>now},window:{},
    game:{state:'countdown',mode:'pvp',selectedLevelId:'park',elapsed:0,visualTime:0,worldTime:0,
      score:0,jumps:0,pvpMatchWinnerIndex:null,pvpRoundWins:[0,0],pvpRoundNumber:1,
      pvpTimeLimitSeconds:60},
    frog:{x:10,y:100,w:20,h:14,dir:1,afterimages:[]},
    tongue:{active:false},pvpPlayers:[{x:40,y:100,w:22,h:14,dir:1,afterimages:[],tongue:{active:false}},
      {x:180,y:100,w:22,h:14,dir:-1,afterimages:[],tongue:{active:false}}],
    flies:[{id:1,x:80,y:20,vocabIndex:0,spawnAge:1,state:'alive'}],
    tutorial:{active:false},OnlineVersus:{isSpectating:()=>false},
    VOCABULARY:[{english:'Jump',spanish:'Saltar'}],LEVELS:{park:{}},
    Date,Math,Promise,console,setTimeout,clearTimeout
  };
  vm.createContext(ctx);
  vm.runInContext(engine.slice(0,engine.indexOf('// Merge historical round recordings')),ctx);
  return {ctx,tick(ms=1000/60){now+=ms;ctx.game.elapsed+=ms/1000;ctx.ribbitReplayCaptureTick(now);}};
}

test('Polish 47 records countdowns and ALL rounds in the same 60fps Versus set',()=>{
  const {ctx,tick}=recorder();
  ctx.ribbitReplayCaptureCountdownStart(0);
  for(let i=0;i<20;i++)tick();
  ctx.game.state='playing';for(let i=0;i<22;i++)tick();
  ctx.game.state='pvpCelebration';ctx.game.pvpRoundWins=[1,0];for(let i=0;i<12;i++)tick();
  ctx.game.state='won';for(let i=0;i<12;i++)tick();
  ctx.game.state='countdown';ctx.game.pvpRoundNumber=2;ctx.game.elapsed=0;for(let i=0;i<24;i++)tick();
  ctx.game.state='playing';for(let i=0;i<20;i++)tick();
  ctx.game.state='pvpCelebration';ctx.game.pvpRoundWins=[1,1];for(let i=0;i<12;i++)tick();
  ctx.game.state='won';for(let i=0;i<12;i++)tick();
  ctx.game.state='countdown';ctx.game.pvpRoundNumber=3;ctx.game.elapsed=0;for(let i=0;i<24;i++)tick();
  ctx.game.state='playing';for(let i=0;i<20;i++)tick();
  ctx.game.state='pvpCelebration';ctx.game.pvpMatchWinnerIndex=0;ctx.game.pvpRoundWins=[2,1];for(let i=0;i<12;i++)tick();
  const data=ctx.ribbitReplayExportCurrent();
  assert.equal(data.mode,'pvp');
  assert.equal(data.fps,60);
  assert.ok(Number.isFinite(data.recordedAt));
  assert.ok(data.frames.length>=180,`got ${data.frames.length}`);
  assert.deepEqual([...new Set(data.frames.map(f=>f.round))],[1,2,3]);
  assert.ok(data.frames.some(f=>f.phase==='countdown'&&f.round===3));
  assert.ok(data.frames.some(f=>f.phase==='pvpCelebration'&&f.round===3));
  assert.ok(ctx.validateRibbitReplayData(data));
});

test('Frog Tags browser groups opponent encounters into dated sets and preserves old rounds',()=>{
  const histories={
    ribbitRaceOnlineHistoryV2:JSON.stringify({ASH:[{opponent:'Ash',id:'old-rounds',at:1100,won:true,replayId:'legacy-2'}]})
  };
  const rows=[
    {id:'new-set',setId:'new-set',scope:'set',opponent:'ASH',roundCount:3,replayId:'full-1',won:true,at:3000,score:[2,1]},
    {id:'old-rounds',opponent:'ASH',replayId:'legacy-1',at:1000,won:true},
    {id:'old-rounds',opponent:'ASH',replayId:'legacy-2',at:1100,won:true},
    {id:'other-set',setId:'other-set',scope:'set',opponent:'BEE',replayId:'full-2',at:2200,won:false,roundCount:2}
  ];
  const ctx={window:{RibbitFrogTags:{list:()=>rows},addEventListener:()=>{}},
    localStorage:{getItem:key=>histories[key]||null},Date,Math,console};
  vm.createContext(ctx);vm.runInContext(tagSource,ctx);
  const groups=ctx.window.RibbitFrogTags.browseSets();
  assert.equal(groups.length,3);
  assert.equal(groups[0].scope,'set');
  assert.equal(groups[0].roundCount,3);
  assert.equal(groups[1].opponent,'BEE');
  const againstAsh=ctx.window.RibbitFrogTags.browseSets('ash');
  assert.equal(againstAsh.length,2);
  assert.equal(againstAsh[1].scope,'legacy-set');
  assert.deepEqual(Array.from(againstAsh[1].replayIds),['legacy-1','legacy-2']);
});

test('Frog Tags and leaderboard use identical in-engine replay controls and show date and blank final clue',()=>{
  assert.match(engine,/KeyX/);assert.match(engine,/KeyZ/);
  assert.match(engine,/KeyN.*event\.shiftKey/);assert.match(engine,/KeyB.*event\.shiftKey/);
  assert.match(engine,/ribbitReplayCollectionStep\(1\)/);
  assert.match(engine,/ribbitReplayCollectionStep\(-1\)/);
  assert.match(engine,/\.rr-spectator-date/);
  assert.match(engine,/RibbitReplayClueBlank=finalHold \|\| view\.position/);
  assert.match(read('client/game/71-rendering-entities-hud.js'),/window\.RibbitReplayClueBlank/);
  assert.match(read('client/game/30-online-versus.js'),/RibbitOpenFrogTagGames/);
  assert.match(read('client/game/110-online-mobile-polish.js'),/scope:"set"/);
  assert.match(tagSource,/window\.RibbitEngineReplay\?\.play\?\.\(data,caption,\{recordedAt:group\.at,collection\}\)/);
});

test('new Z/X replay hotkeys seek 10 seconds and Shift+B/N switch recordings, without losing the player',()=>{
  const section=engine.slice(engine.indexOf('function ribbitReplayAdjustRate('),engine.indexOf('window.addEventListener("keydown",handleRibbitReplayKey,true)'));
  const actions=[];
  const ctx={
    ribbitReplayView:{position:15000,paused:true,rate:1,
      collection:{index:1,entries:[{},{}],playIndex:i=>actions.push(['switch',i])},
      data:{duration:60000,sounds:[]}},
    ribbitReplaySeek:seconds=>{actions.push(['seek',seconds]);ctx.ribbitReplayView.position=Math.max(0,seconds*1000)},
    ribbitReplayUpdateControls:()=>{},
    ribbitReplayCollectionStep:delta=>{actions.push(['switch',ctx.ribbitReplayView.collection.index+delta]);return true;},
    ribbitReplayClose:()=>{},toggleRibbitFullscreen:()=>{},
    window:{RibbitFrogTagReplayBrowser:{isOpen:()=>false}},
    clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),Math,RIBBIT_REPLAY_FPS:60
  };
  vm.createContext(ctx);vm.runInContext(section,ctx);
  function press(code,shiftKey=false){ctx.handleRibbitReplayKey({code,shiftKey,repeat:false,preventDefault(){},stopImmediatePropagation(){}});}
  press('KeyX');press('KeyZ');press('KeyB',true);press('KeyN',true);
  assert.deepEqual(actions,[['seek',25],['seek',15],['switch',0],['switch',2]]);
});

test('stitching historical rounds produces monotonic complete-set replay times',()=>{
  const capture=engine.slice(0,engine.indexOf('// The stage belongs to the canvas alone'));
  const ctx={window:{},LEVELS:{park:{}},Math,Number,Array,Date};
  vm.createContext(ctx);
  // No recording simulation is needed; extracting the pure validator and merger
  // directly protects their behavior when old 1.7.34 round replays are grouped.
  const pure=engine.slice(engine.indexOf('function validateRibbitReplayData('),engine.indexOf('// The stage belongs to the canvas alone'));
  vm.runInContext('const RIBBIT_REPLAY_MAX_FRAMES=30000;\n'+pure,ctx);
  const row=i=>({kind:'ribbit-engine-frames',version:1,mode:'pvp',level:'park',duration:1000,
    frames:[{t:0,player:{x:0,y:0},flies:[]},{t:1000,player:{x:1,y:1},flies:[]}],
    sounds:[{t:500,f:460,d:.1,v:.02,s:0}],round:i});
  const result=ctx.ribbitReplayCombineRounds([row(1),row(2),row(3)]);
  assert.equal(result.legacyCombinedRounds,3);
  assert.equal(result.frames.length,6);
  assert.ok(result.frames[2].t>result.frames[1].t);
  assert.ok(result.frames[4].t>result.frames[3].t);
  assert.ok(result.duration>result.frames.at(-1).t);
  assert.equal(result.sounds.length,3);
  assert.ok(ctx.validateRibbitReplayData(result));
});
