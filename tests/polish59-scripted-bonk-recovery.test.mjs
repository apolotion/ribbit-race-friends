import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read = (name) => readFileSync(new URL(`../client/game/${name}`, import.meta.url),'utf8');
const physics = read('60-versus-physics.js');
const lifecycle = read('123-tutorial-lifecycle.js');
const scenario = read('122-tutorial-scenarios.js');
const hooks = read('126-tutorial-hooks.js');
const render = read('63-versus-rendering-ui.js');
const steps = read('120-tutorial-config.js');
const section = (code,start,end) => {
  const s = code.indexOf(start);
  assert.ok(s>=0, `missing source start ${start}`);
  const e = code.indexOf(end,s+start.length);
  assert.ok(e>s, `missing source end ${end}`);
  return code.slice(s,e);
};
const world=(properties,source)=>{const context=vm.createContext(properties);vm.runInContext(source,context);return context;};

const player = (index)=>({index,x:190,y:200,h:14,w:22,vx:0,vy:0,
  grounded:true,stunTimer:.15,stunCountdownStarted:true,bonked:false,
  catchSparkleTimer:0,wrongCatchBubbleTimer:0,landingSquash:0,
  recoveryFlipTimer:0,bonkLandingPopTimer:0,collisionCooldown:0,
  blinkTimer:4,blinking:false,charging:false,inputHeld:true,charge:0,
  chargeDirection:1,chargeHoldTime:0,openingJumpActive:false});

test('real engine keeps stunned tutorial frog in place and prevents held-space autojump, then rotates once',()=>{
  const p=player(0);
  let starts=0;
  const c=world({p,CONFIG:{groundY:214},tutorial:{active:true,kind:'pvp',pvpDemoActive:true,
    dialogueOpen:false,pvpPlayerScriptLocked:true,resetPending:false},game:{pvpElapsed:10,pvpCpuEnabled:false},
    getPvpCpuIndex:()=>1,isPvpPhysicalJumpHeld:()=>true,startPvpCharge:()=>starts++,
    clamp:(v,l,h)=>Math.max(l,Math.min(h,v))},section(physics,'function updatePvpPlayer(player, dt)','function spawnPvpImpactEffect('));
  c.updatePvpPlayer(p,.15);
  assert.equal(p.stunTimer,0);
  assert.equal(p.grounded,true);
  assert.equal(p.y,200);
  assert.equal(p.charging,false);
  assert.equal(p.inputHeld,false);
  assert.equal(starts,0,'held Space cannot bypass scripted stun');
  assert.equal(p.recoveryFlipDuration,.56);
  assert.equal(p.recoveryFlipTimer,.56);
  c.tutorial.dialogueOpen=true;
  for(let i=0;i<28;i++) c.updatePvpPlayer(p,.02);
  assert.equal(p.recoveryFlipTimer,0);
  assert.equal(p.stunTimer,0);
  assert.equal(p.y,200);
  assert.equal(starts,0,'dialogue must not start a new jump');
  c.updatePvpPlayer(p,.02);
  assert.equal(p.recoveryFlipTimer,0,'flip is not triggered a second time');
});

test('normal Versus still uses its original 0.24-second recovery duration',()=>{
  const p=player(0);
  let starts=0;
  const c=world({p,CONFIG:{groundY:214},tutorial:{active:false,kind:'pvp'},
    game:{pvpElapsed:10,pvpCpuEnabled:false},getPvpCpuIndex:()=>1,
    isPvpPhysicalJumpHeld:()=>false,startPvpCharge:()=>starts++,
    clamp:(v,l,h)=>Math.max(l,Math.min(h,v))},section(physics,'function updatePvpPlayer(player, dt)','function spawnPvpImpactEffect('));
  c.updatePvpPlayer(p,.15);
  assert.equal(p.recoveryFlipDuration,.24);
  assert.equal(p.recoveryFlipTimer,.24);
  assert.equal(starts,0);
  assert.match(render,/player\.recoveryFlipDuration/);
});

test('Bonk! and the drop demonstrations advance on Ember landing, not player recovery',()=>{
  const actual=section(scenario,'function updatePvpDemonstration()','function startPvpFinalMatch()');
  for (const setup of ['pvpDemoBonk','pvpDemoDropLow','pvpDemoDropHigh','pvpDemoBufferedBonk']) {
    let passed=0;
    const c=world({
      tutorial:{pvpDemoRetryQueued:false,pvpDemoActive:true,resetPending:false,
        pvpDemoBegun:true,pvpDemoStartedAt:0,pvpDemoBonkAt:100,
        pvpDemoBonkHandled:false,pvpDemoKind:setup,pvpDemoBonkCount:1,
        pvpDemoFollowupStarted:true,pvpReboundCount:0,pvpTechniqueCatchQualified:false,
        pvpPracticeCatchCount:0,pvpDemoStage:0,pvpLowProfileSawAirborne:false},
      pvpPlayers:[{grounded:true,bonked:false,stunTimer:2,recoveryFlipTimer:0},
        {grounded:true,bonked:false,stunTimer:0,charging:false}],
      game:{pvpCriticalCatchActive:false},CONFIG:{groundY:214},
      performance:{now:()=>450},updatePvpScriptActions(){},updatePvpScriptedBuffer(){},
      updatePvpLessonLandings:()=>[false,false],clearPvpScriptActions(){},
      clearHeldInput(){},passStep(){passed++},pvpTutorialSettled:()=>false
    },actual);
    c.updatePvpDemonstration();
    assert.equal(passed,1,`dialogue must open on Ember landing for ${setup}`);
    assert.equal(c.pvpPlayers[0].stunTimer,2,`victim stun must still be running for ${setup}`);
  }
});

test('bonk and buffered-drop start at screenshot targets with greater charged jump',()=>{
  const start=section(scenario,'case "pvpDemoBufferedBonk":','case "pvpDemoSkyBonk"');
  assert.match(start,/positionPvp\(p1, Math\.round\(\(W-p1\.w\)\/2\) - 24, CONFIG\.groundY-p1\.h, 1\)/);
  assert.match(start,/positionPvp\(ember, Math\.round\(\(W-ember\.w\)\/2\) \+ 24, CONFIG\.groundY-ember\.h, -1\)/);
  assert.match(scenario,/case "pvpDemoBufferedBonk"[\s\S]*?scriptPvpChargedJump\(1, \.80, -1, 0\)/);
  // With the 480-wide stage, Ember starts at center408, P1 at center216.
  // The 0.80 jump crosses the central perch with enough charge to reach P1.
  const jumpX=120+115*.8;
  assert.ok(408 - jumpX*.86 <216+22,'Ember reaches the waiting frog from the right');
  assert.ok(408 - jumpX*.86 >216-22,'Ember does not overshoot before descending');
});

test('retry only poofs P1 while Ember keeps her progressed recovery rather than rewinding',()=>{
  let retryAction;
  const p0={index:0,x:100,y:200,w:22,h:14,tongue:{}},
        ember={index:1,x:270,y:200,w:22,h:14,stunTimer:.4,recoveryFlipTimer:.42,
          recoveryFlipDuration:.56,tongue:{active:false}};
  const c=world({tutorial:{active:true,kind:'pvp',passed:false,resetPending:false},
    tutorialStep:()=>({setup:'pvpBonkCatch'}),
    PVP_RETRY_EMBER_STATIONARY_SETUPS:new Set(['pvpBonkCatch']),
    pvpPlayers:[p0,ember],flies:[],CONFIG:{flySpawnEffectDuration:.2,flyGrowDuration:.15},nextFlyId:10,
    beginPoofTransition(options){retryAction=options.action;assert.equal(options.pvpPoofPlayers.join(','),'0');},
    rebuildCurrentScenarioForRetry(){ember.x=400;ember.stunTimer=0;ember.recoveryFlipTimer=0;},
    failAttempt:undefined},section(lifecycle,'function failAttempt(message)','function finalizePassedStep()'));
  c.failAttempt('MISSED');
  // Half a second later Ember has progressed through the actual animation.
  ember.stunTimer=0;
  ember.recoveryFlipTimer=.23;
  retryAction();
  assert.equal(ember.x,270);
  assert.equal(ember.stunTimer,0);
  assert.equal(ember.recoveryFlipTimer,.23);
});

test('tutorial dialogue and single-frog poof keep ordinary frog simulation advancing',()=>{
  assert.match(hooks,/tutorial\.resetPending[\s\S]{0,200}tutorial\.resetPvpPoofPlayers\?\.includes\(1\)/);
  assert.match(hooks,/updatePvpPlayer\(pvpPlayers\[1\], dt\)/);
  assert.match(hooks,/tutorial\.dialogueOpen \|\| tutorial\.pvpAwaitRecoveryAdvance/);
  assert.match(hooks,/updatePvpPlayer\(player, dt\)/);
  assert.doesNotMatch(lifecycle.slice(lifecycle.indexOf("function nextStep()"),lifecycle.indexOf("function skipToNextTutorialScene")),/pvpTutorialRecoveryIsPlaying\(\)/);
  assert.match(steps,/"successDialogue": \[\s*"Bonk!"/);
});
