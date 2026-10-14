import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readProjectFile as read } from './source-reader.mjs';

const input = read('client/game/80-input-loop-startup.js');
const integration = read('client/game/132-cross-screen-integration.js');
const catches = read('client/game/61-versus-catches-rounds.js');
function section(source, from, until) {
  const start = source.indexOf(from), end = source.indexOf(until, start + from.length);
  assert.ok(start >= 0 && end > start, `${from} section exists`);
  return source.slice(start, end);
}

// Install the real core handlers AND the late window-capture integration layer.
// The old layer routed Right Shift to P1 before document capture could route P2.
function inputHarness(mode = 'pvp', cpu = false) {
  const listeners = {window: {}, document: {}, canvas: {}};
  const target = name => ({addEventListener(type, fn) {
    (listeners[name][type] ||= []).push(fn);
  }});
  const calls = [];
  const c = {
    window: target('window'), document: target('document'), canvas: target('canvas'),
    game: {mode, state:'playing', pvpCpuEnabled:cpu, onlineMode:false},
    pvpPlayers: [{inputHeld:false}, {inputHeld:false}], frog:{},
    KeyboardEvent: {DOM_KEY_LOCATION_LEFT:1, DOM_KEY_LOCATION_RIGHT:2},
    OnlineVersus: {handleControlDown:()=>false, handleControlUp:()=>false},
    friendsGameInputLocked:()=>false, drawScene:()=>{}, update:()=>{},
    pressPvpButton(index) { calls.push(['down', index]); c.pvpPlayers[index].inputHeld=true; },
    releasePvpButton(index) { calls.push(['up', index]); c.pvpPlayers[index].inputHeld=false; },
    pressMainButton() { calls.push(['down', 'solo']); c.game.buttonHeld=true; },
    releaseMainButton() { calls.push(['up', 'solo']); c.game.buttonHeld=false; }
  };
  vm.createContext(c);
  vm.runInContext(section(input, 'const pvpPhysicalInputsHeld', 'window.addEventListener("blur"'), c);
  vm.runInContext(integration, c);
  return {c, calls, fire(code, down, overrides = {}) {
    const event = {code, key:code.startsWith('Shift') ? 'Shift' : code==='KeyW' ? 'w' : code==='KeyZ' ? 'z' : '',
      location:code==='ShiftLeft' ? 1 : code==='ShiftRight' ? 2 : 0, repeat:false,
      preventDefault(){}, stopPropagation(){this.stopped=true;},
      stopImmediatePropagation(){this.stopped=true;this.immediate=true;}, ...overrides};
    const type = down ? 'keydown' : 'keyup';
    for (const name of ['window', 'document']) {
      for (const fn of listeners[name][type] || []) { fn(event); if(event.immediate) break; }
      if(event.stopped) break;
    }
  }};
}

test('Right Shift down and up reach only P2 through the complete keyboard listener stack', () => {
  const h=inputHarness();h.fire('ShiftRight',true);assert.equal(h.c.pvpPlayers[0].inputHeld,false);
  assert.equal(h.c.pvpPlayers[1].inputHeld,true);h.fire('ShiftRight',false);
  assert.deepEqual(h.calls,[['down',1],['up',1]]);
});
test('releasing Right Shift cannot release a Left Shift charge on P1', () => {
  const h=inputHarness();h.fire('ShiftLeft',true);h.fire('ShiftRight',true);h.fire('ShiftRight',false);
  assert.equal(h.c.pvpPlayers[0].inputHeld,true);assert.equal(h.c.pvpPlayers[1].inputHeld,false);
  h.fire('ShiftLeft',false);assert.deepEqual(h.calls,[['down',0],['down',1],['up',1],['up',0]]);
});
test('releasing Left Shift cannot release the Right Shift charge on P2', () => {
  const h=inputHarness();h.fire('ShiftRight',true);h.fire('ShiftLeft',true);h.fire('ShiftLeft',false);
  assert.equal(h.c.pvpPlayers[1].inputHeld,true);h.fire('ShiftRight',false);
  assert.deepEqual(h.calls,[['down',1],['down',0],['up',0],['up',1]]);
});
test('repeated Right Shift keydown does not double-charge either frog', () => {
  const h=inputHarness();h.fire('ShiftRight',true);h.fire('ShiftRight',true,{repeat:true});h.fire('ShiftRight',false);
  assert.deepEqual(h.calls,[['down',1],['up',1]]);
});
test('Right Shift remains blocked for a CPU opponent and never falls back to P1', () => {
  const h=inputHarness('pvp',true);h.fire('ShiftRight',true);h.fire('ShiftRight',false);assert.deepEqual(h.calls,[]);
});
test('code-only Right Shift emitted by mobile controls remains P2-only', () => {
  const h=inputHarness();h.fire('ShiftRight',true,{key:'',location:0});h.fire('ShiftRight',false,{key:'',location:0});
  assert.deepEqual(h.calls,[['down',1],['up',1]]);
});
test('generic Shift with right-side location remains P2-only', () => {
  const h=inputHarness();h.fire('',true,{key:'Shift',location:2});h.fire('',false,{key:'Shift',location:2});
  assert.deepEqual(h.calls,[['down',1],['up',1]]);
});
test('W and Left Shift share the P1 held-key set without premature releases', () => {
  const h=inputHarness();h.fire('KeyW',true);h.fire('ShiftLeft',true);h.fire('KeyW',false);
  assert.equal(h.c.pvpPlayers[0].inputHeld,true);h.fire('ShiftLeft',false);
  assert.deepEqual(h.calls,[['down',0],['up',0]]);
});
test('Slash and Right Shift share P2 held state without affecting P1', () => {
  const h=inputHarness();h.fire('ShiftRight',true);h.fire('Slash',true);h.fire('ShiftRight',false);
  assert.equal(h.c.pvpPlayers[1].inputHeld,true);h.fire('Slash',false);
  assert.deepEqual(h.calls,[['down',1],['up',1]]);
});
test('Space still controls P1 against CPU', () => {
  const h=inputHarness('pvp',true);h.fire('Space',true);h.fire('Space',false);
  assert.deepEqual(h.calls,[['down',0],['up',0]]);
});
test('solo Right Shift and W are routed once and share held-key state', () => {
  const h=inputHarness('solo');h.fire('ShiftRight',true);h.fire('KeyW',true);h.fire('ShiftRight',false);
  assert.equal(h.c.game.buttonHeld,true);h.fire('KeyW',false);
  assert.deepEqual(h.calls,[['down','solo'],['up','solo']]);
});
test('Right Shift cannot charge either frog behind pause', () => {
  const h=inputHarness();h.c.game.state='paused';h.fire('ShiftRight',true);assert.deepEqual(h.calls,[]);
});

function catchHarness() {
  const labels=[], events=[];
  const c={
    window:{}, game:{mode:'pvp',state:'playing',pvpRoundGoalMode:'firstto',pvpFirstTo:5,pvpRoundNumber:1,promptSerial:10,
      pvpSuddenDeath:false,pvpSuddenDeathScores:[0,0],pvpCriticalCatchActive:false,pvpCriticalCatchElapsed:.8,pvpCriticalCatchDuration:2,
      pvpTimeLimitSeconds:60,pvpTimeRemaining:30,pvpCriticalCatchPlayedThisRound:false,score:0,soloCriticalCatchDuration:2,
      soloCriticalCatchElapsed:.8,soloCriticalCatchActive:false,soloCatchGoal:5},
    pvpPlayers:[{index:0,score:0,x:100,y:100,w:22,h:14,tongue:{}},{index:1,score:0,x:400,y:100,w:22,h:14,tongue:{}}],
    frog:{x:100,y:100,w:22,h:14}, tongue:{active:false},
    OnlineVersus:{canStartCritical:key=>{events.push(key);return true;}},
    CONFIG:{playBottom:220}, W:480, COLORS:{white:'#fff',ink:'#111'},
    ctx:{save(){},restore(){},fillRect(){}}, drawBitmapText:text=>labels.push(text),
    clamp:(x,min,max)=>Math.max(min,Math.min(max,x)),lerp:(a,b,t)=>a+(b-a)*t,
    easeOutCubic:t=>1-Math.pow(1-t,3),tone(){},
    flyMatchesPrompt:fly=>fly.vocabIndex===0,
    getPvpMouth:p=>({x:p.x+p.w/2,y:p.y+p.h/2}),
    isPvpEndlessMode:()=>c.game.pvpRoundGoalMode==='endless',
    getPvpTargetScore:()=>c.game.pvpSuddenDeath?3:c.game.pvpFirstTo,
    isSoloEndlessMode:()=>!!c.game.soloEndlessMode,
    getSoloTargetScore:()=>c.game.soloCatchGoal
  };
  vm.createContext(c);vm.runInContext(catches,c);
  const fly={id:'fly1',state:'active',vocabIndex:0,baseX:140,baseY:107,pvpPursuers:[true,false]};
  function close(){c.pvpPlayers[0].vx=55;c.pvpPlayers[1].x=145;c.pvpPlayers[1].vx=-55;fly.pvpPursuers[1]=true;}
  function trigger(){const kind=c.getPvpCriticalCatchKind(c.pvpPlayers[0],fly);if(kind)c.startPvpCriticalCatch(c.pvpPlayers[0],fly,kind);return kind;}
  return {c,fly,close,labels,events,trigger};
}
for (const score of [0,1,2,3]) {
  test(`a contested catch from ${score}/5 is CLOSE CATCH, never FINAL CATCH`, () => {
    const h=catchHarness();h.c.game.pvpTimeLimitSeconds=0;h.c.pvpPlayers[0].score=score;h.close();
    assert.equal(h.trigger(),'contest');h.c.drawPvpCriticalCatchOverlay();assert.deepEqual(h.labels,['CLOSE CATCH!']);
    assert.equal(h.c.game.pvpCriticalCatchPlayedThisRound,false);
  });
}
test('the fifth of five flies uses FINAL CATCH even when both frogs contest it', () => {
  const h=catchHarness();h.c.pvpPlayers[0].score=4;h.close();assert.equal(h.trigger(),'final');
  h.c.drawPvpCriticalCatchOverlay();assert.deepEqual(h.labels,['FINAL CATCH!']);
});
test('endless mode never treats the fifth contested fly as a final score goal', () => {
  const h=catchHarness();h.c.game.pvpRoundGoalMode='endless';h.c.pvpPlayers[0].score=4;h.close();
  assert.equal(h.trigger(),'contest');h.c.drawPvpCriticalCatchOverlay();assert.deepEqual(h.labels,['CLOSE CATCH!']);
});
test('the ten-fly option uses the actual score goal rather than assuming five', () => {
  const h=catchHarness();h.c.game.pvpFirstTo=10;h.c.pvpPlayers[0].score=4;h.close();assert.equal(h.trigger(),'contest');
  h.c.game.pvpCriticalCatchActive=false;h.c.pvpPlayers[0].score=9;assert.equal(h.trigger(),'final');
});
test('last-second catches keep slow motion without falsely saying FINAL CATCH', () => {
  const h=catchHarness();h.c.game.pvpTimeRemaining=.5;assert.equal(h.trigger(),'clutch');
  h.c.drawPvpCriticalCatchOverlay();assert.deepEqual(h.labels,['CLUTCH CATCH!']);
  assert.equal(h.c.game.pvpCriticalCatchPlayedThisRound,false);assert.ok(h.c.updatePvpCriticalCatch(.05)<1);
});
test('close contests at the buzzer keep the CLOSE CATCH label', () => {
  const h=catchHarness();h.c.game.pvpTimeRemaining=.5;h.close();assert.equal(h.trigger(),'contest');
  h.c.drawPvpCriticalCatchOverlay();assert.deepEqual(h.labels,['CLOSE CATCH!']);
});
test('a buzzer-grace catch is NOT mislabeled CLUTCH after time expires', () => {
  const h=catchHarness();h.c.game.pvpTimeRemaining=0;h.c.game.pvpTimerGraceActive=true;
  assert.equal(h.trigger(),'');assert.equal(h.c.game.pvpCriticalCatchActive,false);
});
test('a real goal completion still wins title priority at the buzzer', () => {
  const h=catchHarness();h.c.game.pvpTimeRemaining=.2;h.c.pvpPlayers[0].score=4;
  assert.equal(h.trigger(),'final');h.c.drawPvpCriticalCatchOverlay();assert.deepEqual(h.labels,['FINAL CATCH!']);
});
test('a clutch cinematic cannot consume the later actual final-goal cinematic', () => {
  const h=catchHarness();h.c.game.pvpTimeRemaining=.5;assert.equal(h.trigger(),'clutch');
  h.c.updatePvpCriticalCatch(3);h.c.pvpPlayers[0].score=4;assert.equal(h.trigger(),'final');
  assert.equal(h.c.game.pvpCriticalCatchKind,'final');assert.equal(h.c.game.pvpCriticalCatchPlayedThisRound,true);
  assert.ok(h.events[0].startsWith('clutch:'));assert.ok(h.events[1].endsWith(':final'));
});
test('ordinary uncontested catches have no added cinematic', () => {
  const h=catchHarness();assert.equal(h.trigger(),'');assert.equal(h.c.game.pvpCriticalCatchActive,false);
});
test('wrong flies cannot start a contested or final cinematic', () => {
  const h=catchHarness();h.fly.vocabIndex=1;h.c.pvpPlayers[0].score=4;h.close();assert.equal(h.trigger(),'');
});
test('solo final-catch title is independent of stale Versus contest state', () => {
  const h=catchHarness();h.c.game.mode='solo';h.c.game.score=4;h.c.game.pvpCriticalCatchKind='contest';
  assert.equal(h.c.startSoloCriticalCatch(h.fly),true);h.c.drawSoloCriticalCatchOverlay();
  assert.deepEqual(h.labels,['FINAL CATCH!']);
});
test('ordinary solo catches before fifth do not start a final cinematic', () => {
  const h=catchHarness();h.c.game.mode='solo';
  for(const score of [0,1,2,3]) {h.c.game.score=score;assert.equal(h.c.shouldStartSoloCriticalCatch(h.fly),false);}
});
test('authored tutorial slow motion hides only the misleading title, not the effect', () => {
  const h=catchHarness();h.c.window.RibbitTutorialShouldHideFinalCatchTitle=()=>true;
  h.c.game.mode='solo';h.c.game.soloCriticalCatchActive=true;h.c.drawSoloCriticalCatchOverlay();
  assert.deepEqual(h.labels,[]);assert.ok(h.c.updateSoloCriticalCatch(.05)<1);
});
test('suppressed tutorial final titles cannot leak through the Versus overlay', () => {
  const h=catchHarness();h.c.window.RibbitTutorialShouldHideFinalCatchTitle=()=>true;
  h.c.pvpPlayers[0].score=4;h.trigger();h.c.drawPvpCriticalCatchOverlay();assert.deepEqual(h.labels,[]);
});
test('tutorial close contests keep their accurate CLOSE CATCH title', () => {
  const h=catchHarness();h.c.window.RibbitTutorialShouldHideFinalCatchTitle=()=>true;h.close();h.trigger();
  h.c.drawPvpCriticalCatchOverlay();assert.deepEqual(h.labels,['CLOSE CATCH!']);
});
