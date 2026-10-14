import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const core = read('client/game/10-core-config.js');
const solo = read('client/game/50-solo-gameplay.js');
const versus = read('client/game/60-versus-physics.js');
const rounds = read('client/game/61-versus-catches-rounds.js');
const render = read('client/game/63-versus-rendering-ui.js');
const polish19 = read('client/game/132-cross-screen-integration.js');
const online = read('client/game/30-online-versus.js');
const common = read('src/common.js');

function between(source, start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Missing ${start} -> ${end}`);
  return source.slice(a, b);
}
const configCode = between(core, 'const CONFIG = Object.freeze({', '\n    const canvas =');
const CONFIG = vm.runInNewContext(`${configCode}\nCONFIG;`);

function flyHarness(mode = 'pvp') {
  const context = {
    CONFIG, flySpawns: Array.from({length: 8}, (_,i) => ({x:24+i*45,y:70+(i%3)*20})),
    game: {
      mode, sandboxMode:false, score:0, elapsed:0, spawnQueue:[],
      lastFlySpawnIndex:-1, lastFlySpawnTime:-Infinity
    },
    flies:[],nextFlyId:1,
    getSoloTargetScore:()=>5, isSoloEndlessMode:()=>false,
    getReservedVocabIndices:()=>new Set(), chooseUnusedVocabularyIndex:()=>12,
    playFlySpawnSound:()=>{},
  };
  vm.createContext(context);
  vm.runInContext([
    between(solo,'    function getFlySpawnMinimumSpacing()', '    function ensureTargetVocabularyAvailable('),
    between(solo,'    function spawnFly(', '    function getFrogMouth('),
    between(solo,'    function scheduleFlyReplacementFromCatch()', '    function recordFlyEaten('),
    'this.spawnFly = spawnFly;',
    'this.scheduleReplacement = scheduleFlyReplacementFromCatch;'
  ].join('\n'), context);
  function advanceTo(t) {
    context.game.elapsed = t;
    // Identical ticket consumption to the Versus play loop.
    while (context.flies.length < CONFIG.maxFlies && context.game.spawnQueue.length &&
      context.game.spawnQueue[0].dueAt <= context.game.elapsed) {
      const ticket = context.game.spawnQueue[0];
      if (!context.spawnFly(ticket)) break;
      context.game.spawnQueue.shift();
    }
  }
  return {context, advanceTo};
}

test('Polish 51 uses a distinct Versus spawn cadence and leaves Solo timings unchanged', () => {
  assert.equal(JSON.parse(read('package.json')).version,'1.7.46');
  assert.match(common,/2026\.10\.13-friends-polish-58/);
  assert.equal(CONFIG.flyRespawnDelay,2);
  assert.equal(CONFIG.flySpawnMinimumSpacing,1);
  assert.equal(CONFIG.secondFlySpawnDelay,2);
  assert.equal(CONFIG.pvpFlyRespawnDelay,1);
  assert.equal(CONFIG.pvpFlySpawnMinimumSpacing,.75);
  assert.equal(CONFIG.pvpOpeningFlyInterval,.85);
  assert.match(versus,/index \* CONFIG\.pvpOpeningFlyInterval \+ STEP/);
  assert.match(rounds,/index \* CONFIG\.pvpOpeningFlyInterval \+ STEP/);
  assert.match(render,/latestDue \+ CONFIG\.pvpFlySpawnMinimumSpacing/);
  assert.match(online,/lastFlySpawnTime=Number\.isFinite\(sim\.lastFlySpawnTime\).*CONFIG\.pvpFlySpawnMinimumSpacing/);
});

test('Versus catches never postpone outstanding opening fly tickets', () => {
  const {context} = flyHarness();
  context.game.elapsed = 0.95;
  const first = {dueAt:1.7,source:'initial',vocabIndex:2};
  const second = {dueAt:2.55,source:'initial',vocabIndex:3};
  context.game.spawnQueue.push(first,second);
  context.scheduleReplacement();
  assert.equal(first.dueAt,1.7);
  assert.equal(second.dueAt,2.55);
  assert.deepEqual(Array.from(context.game.spawnQueue, t=>t.dueAt),[1.7,1.95,2.55]);
});

test('Solo catches retain their original two-second respawn and opening spacing', () => {
  const {context} = flyHarness('solo');
  context.game.elapsed=.95;
  context.game.spawnQueue.push({dueAt:2,source:'initial',vocabIndex:2},{dueAt:4,source:'initial',vocabIndex:3});
  context.scheduleReplacement();
  assert.deepEqual(Array.from(context.game.spawnQueue, t=>t.dueAt),[2.95,2.95,4.95]);
  assert.equal(context.game.spawnQueue.find(t=>t.source==='replacement').dueAt,2.95);
});

test('Versus opens with all four flies in under 3 seconds, each with its own vocabulary', () => {
  const {context,advanceTo} = flyHarness();
  context.game.spawnQueue = [0,1,2,3].map(i=>({dueAt:i ? i*CONFIG.pvpOpeningFlyInterval+1/120 : 0,source:'initial',vocabIndex:i}));
  for(let i=0;i<360;i++) advanceTo(i/120);
  assert.equal(context.flies.length,4);
  assert.deepEqual(Array.from(context.flies, f=>f.vocabIndex).sort(),[0,1,2,3]);
  assert.ok(context.flies.every(f=>f.state==='active' && f.id && f.baseX===f.x && f.baseY===f.y));
  assert.ok(context.game.lastFlySpawnTime < 3,`spawned by ${context.game.lastFlySpawnTime}`);
  assert.equal(context.game.spawnQueue.length,0);
});

test('Rapid early Versus catches do not leave the arena with one or zero flies for many seconds', () => {
  const {context,advanceTo} = flyHarness();
  context.game.spawnQueue = [0,1,2,3].map(i=>({dueAt:i ? i*CONFIG.pvpOpeningFlyInterval+1/120 : 0,source:'initial',vocabIndex:i}));
  const visited=[];
  for (let frame=0;frame<=560;frame++) {
    const t=frame/120;
    advanceTo(t);
    if (frame===120 || frame===135) {
      const removed=context.flies.shift();
      assert.ok(removed,'expected available fly to catch');
      context.scheduleReplacement();
    }
    if (frame%30===0) visited.push([t,context.flies.length]);
  }
  assert.equal(context.flies.length,4,`pool was ${JSON.stringify(visited)}`);
  assert.ok(context.game.lastFlySpawnTime < 4.3,`pool recovered at ${context.game.lastFlySpawnTime}`);
  assert.equal(context.game.spawnQueue.length,0);
});

test('Versus spawn gate allows 0.75-second spacing, Solo still requires one full second',()=>{
  const {context} = flyHarness();
  context.game.elapsed=10;
  assert.equal(context.spawnFly({vocabIndex:1}),true);
  context.game.elapsed=10.74;
  assert.equal(context.spawnFly({vocabIndex:2}),false);
  context.game.elapsed=10.76;
  assert.equal(context.spawnFly({vocabIndex:2}),true);
  const {context:soloGame}=flyHarness('solo');
  soloGame.game.elapsed=10;
  assert.equal(soloGame.spawnFly({vocabIndex:1}),true);
  soloGame.game.elapsed=10.76;
  assert.equal(soloGame.spawnFly({vocabIndex:2}),false);
  soloGame.game.elapsed=11.01;
  assert.equal(soloGame.spawnFly({vocabIndex:2}),true);
});

test('Legacy countdown wrapper does not despawn active flies or cancel queued replacements', () => {
  const game={mode:'pvp',state:'countdown',elapsed:12.5,spawnQueue:[{source:'replacement',dueAt:13.6,vocabIndex:5}],pvpCpuEnabled:false};
  const flies=[{id:7,x:100,y:62,vocabIndex:4,state:'active'},{id:8,x:220,y:88,vocabIndex:3,state:'active'}];
  const oldSpawnQueue=game.spawnQueue,oldFlies=flies.slice();
  const context={window:{RibbitRaceTutorialEngine:null}, game,flies,pvpPlayers:[],engine:()=>null,
    update(dt){if(game.state==='countdown' && dt>.5)game.state='playing';return dt;}};
  vm.createContext(context);
  vm.runInContext(between(polish19,'  const priorUpdateP19=update;', '  // PvP tutorial prompt/HUD refinements.'),context);
  context.update(1/120);
  assert.equal(game.state,'countdown');
  context.update(.6);
  assert.equal(game.state,'playing');
  assert.strictEqual(game.spawnQueue,oldSpawnQueue);
  assert.deepEqual(flies,oldFlies);
  assert.equal(game.elapsed,12.5);
  assert.doesNotMatch(polish19,/state\s*===\s*["']countdown["']\s*\)\s*\{\s*flies\.length\s*=\s*0/);
});

test('Actual resume countdown and instant resume preserve fly objects, queued vocabulary and spawn clock',()=>{
  const resumeSource=read('client/game/40-ui-navigation-audio.js');
  const game={mode:'pvp',state:'paused',pvpUnpauseCountdown:true,elapsed:19.2,lastFlySpawnTime:18.75,
    spawnQueue:[{vocabIndex:8,dueAt:19.8,source:'replacement'}]};
  const flies=[{id:35,baseX:210,baseY:90,x:210,y:92,spawnAge:5,vocabIndex:1,state:'active'}];
  const context={CONFIG,game,flies,pvpPlayers:[{},{}],frog:{},window:{RibbitEngineReplay:{captureCountdownStart(){}}},
    clearSoloPhysicalInputState(){},clearPvpPhysicalShiftState(){},
    OnlineVersus:{isActive:()=>false},performance:{now:()=>1000},
    playCountdownSound(){},playCountdownGoSound(){},restorePauseChargeSnapshot(){}};
  vm.createContext(context);
  vm.runInContext([
    between(solo,'    function updateResumeCountdown(dt)', '    function startNewGameCountdown()'),
    between(resumeSource,'    function resumePausedGame()', '    function activatePauseSelection()'),
    'this.resumePausedGame=resumePausedGame;', 'this.updateResumeCountdown=updateResumeCountdown;'
  ].join('\n'),context);
  const existingFly=flies[0],existingTicket=game.spawnQueue[0];
  context.resumePausedGame();
  assert.equal(game.state,'countdown');
  for(let i=0;i<3;i++)context.updateResumeCountdown(CONFIG.resumeCountdownStepDuration);
  assert.equal(game.state,'playing');
  assert.strictEqual(flies[0],existingFly);
  assert.strictEqual(game.spawnQueue[0],existingTicket);
  assert.equal(game.elapsed,19.2);
  assert.equal(game.lastFlySpawnTime,18.75);
  game.state='paused';game.pvpUnpauseCountdown=false;
  context.resumePausedGame();
  assert.equal(game.state,'playing');
  assert.strictEqual(flies[0],existingFly);
  assert.strictEqual(game.spawnQueue[0],existingTicket);
});

test('60-second Versus refills after repeated catches without losing each fly vocabulary',()=>{
  const {context,advanceTo}=flyHarness();
  context.game.spawnQueue=[0,1,2,3].map(i=>({
    dueAt:i?i*CONFIG.pvpOpeningFlyInterval+1/120:0,source:'initial',vocabIndex:i
  }));
  let catches=0,zeros=0;
  for(let frame=0;frame<=120*60;frame++) {
    const t=frame/120;
    advanceTo(t);
    if(frame>360 && frame%216===0) {
      const fly=context.flies.shift();
      assert.ok(fly,`Versus has run out of targets at ${t}s`);
      assert.ok(Number.isInteger(fly.vocabIndex));
      context.scheduleReplacement();
      catches++;
    }
    if(frame>360&&context.flies.length===0)zeros++;
  }
  assert.ok(catches>=25);
  assert.equal(zeros,0,'fast-paced play should never empty all targets');
  assert.ok(context.flies.length>=3,'four-fly supply should stay healthy');
});

test('Explicit new-round and sudden-death resets still clear old flies; resuming does not',()=>{
  assert.match(between(versus,'function resetPvpGame()', 'function continuePvpMatch()'), /flies\.length = 0;/);
  assert.match(between(rounds,'function beginPvpSuddenDeath()', 'function preservePvpChargedJumpsAtTimeLimit()'), /flies\.length = 0;/);
  assert.match(between(versus,'function startNewPvpCountdown(', 'function getPvpMouth('), /resetPvpGame\(\)/);
  assert.doesNotMatch(polish19,/game\.mode===["']pvp["']&&game\.state===["']countdown["']\)\{flies\.length=0/);
});
