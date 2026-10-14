import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read = (name) => readFileSync(new URL(`../client/game/${name}`, import.meta.url),'utf8');
const steps = read('123-tutorial-lifecycle.js');
const scenes = read('122-tutorial-scenarios.js');
const checks = read('124-tutorial-monitoring.js');
const hooks = read('126-tutorial-hooks.js');
const render = read('125-tutorial-rendering.js');
const versus = read('63-versus-rendering-ui.js');
const catches = read('61-versus-catches-rounds.js');
const menu = read('40-ui-navigation-audio.js');
const config = read('120-tutorial-config.js');
function extract(s, start, end) {
  const begin=s.indexOf(start),finish=s.indexOf(end,begin+start.length);
  assert.ok(begin>=0&&finish>begin,`source section ${start}`);
  return s.slice(begin,finish);
}
function bonkDialogueHarness(setup, victimStunned) {
  let finalized=0;
  const c={tutorial:{active:true,kind:'pvp',passed:false,passPending:false},
    tutorialStep:()=>({setup,demonstration:setup.startsWith('pvpDemo')}),
    pvpPlayers:[{grounded:true,bonked:setup.startsWith('pvpDemo')&&victimStunned,tongue:{active:false}},
      {grounded:true,bonked:!setup.startsWith('pvpDemo')&&victimStunned}],
    game:{pvpCriticalCatchActive:false},frog:{grounded:true},tongue:{active:false},
    finalizePassedStep(){finalized++},performance:{now:()=>3500},clearHeldInput(){} };
  vm.createContext(c);
  vm.runInContext(extract(steps,'function passStep()','function unlockTutorialAchievement()'),c);
  c.passStep();
  return {finalized,pending:c.tutorial.passPending};
}
test('sky and buffered-sky dialogue starts at attacker landing even while victim is stunned',()=>{
  for (const setup of ['pvpSkyBonk','pvpBufferedSky','pvpDemoSkyBonk','pvpDemoBufferedSky']) {
    const result=bonkDialogueHarness(setup,true);
    assert.equal(result.finalized,1,setup);
    assert.equal(result.pending,false,setup);
  }
  const ordinary=bonkDialogueHarness('pvpDropLow',true);
  // Drop-bonk narration now also follows the attacker's landing.
  assert.equal(ordinary.finalized,1);
  assert.equal(ordinary.pending,false);
});
test('sky-victim recovery is still played throughout ensuing dialogue',()=>{
  assert.match(hooks,/tutorial\.dialogueOpen \|\| tutorial\.pvpAwaitRecoveryAdvance/);
  assert.match(hooks,/updatePvpPlayer\(player, dt\)/);
  assert.doesNotMatch(steps.slice(steps.indexOf("function nextStep()"),steps.indexOf("function skipToNextTutorialScene")),/pvpTutorialRecoveryIsPlaying\(\)/);
  assert.match(checks,/setup === "pvpSkyBonk"[\s\S]*?p1\.grounded && ember\.grounded && pvpPracticeEventReady\(100, now\)/);
  assert.match(checks,/setup === "pvpBufferedSky"[\s\S]*?p1\.grounded && ember\.grounded && pvpPracticeEventReady\(100, now\)/);
});
test('first bonk and drop-bonk demo speak on attacker landing and hold poofs until recovery',()=>{
  assert.match(scenes,/setup === "pvpDemoBonk"[\s\S]*?ember\.grounded && !ember\.bonked/);
  assert.match(scenes,/completed = bonkImpactReady && ember\.grounded && !ember\.bonked/);
  assert.doesNotMatch(steps.slice(steps.indexOf("function nextStep()"),steps.indexOf("function skipToNextTutorialScene")),/pvpTutorialRecoveryIsPlaying\(\)/);
});
test('buffer-drop starts swapped; under-bonk, avoiding under-bonk and rebound practice use requested poses',()=>{
  const section=(id,end)=>extract(scenes,`case "${id}"`,`case "${end}"`);
  assert.match(section('pvpBufferedBonk','pvpDemoSkyBonk'),/positionPvp\(p1, 64, CONFIG\.groundY-p1\.h, 1\)/);
  assert.match(section('pvpBufferedBonk','pvpDemoSkyBonk'),/positionPvp\(ember, Math\.round\(\(W-ember\.w\)\/2\) \+ 24, CONFIG\.groundY-ember\.h, -1\)/);
  assert.match(section('pvpUnderBonkTwo','pvpDemoAvoidUnder'),/positionPvpOnPlatform\(p1, middleLeft, 1, middleLeft\.w - p1\.w - 2\)/);
  assert.match(section('pvpAvoidUnder','pvpDemoRebound'),/positionPvpOnPlatform\(p1, perch, 1\)/);
  assert.match(section('pvpReboundThree','pvpDemoReboundCatch'),/positionPvpReboundPracticeLayout\(0\)/);
});
test('grumpy-wall and Not So Fast prompt exceptions, fly flipped and coached middle platform attempt',()=>{
  assert.match(render,/pvpReboundCatch[\s\S]*?pvpIntercept|pvpIntercept[\s\S]*?pvpReboundCatch/);
  assert.match(scenes,/case "pvpDemoIntercept"[\s\S]{0,350}addPvpTutorialFly\(W - 90/);
  assert.match(scenes,/case "pvpIntercept"[\s\S]{0,350}addPvpTutorialFly\(90/);
  assert.match(scenes,/case "pvpDemoIntercept"[\s\S]*?scriptPvpChargedJump\(1, \.85, -1, 0\)/);
});
test('Dinner Steal slows down Ember demo but not player-turn accidental Ember catches',()=>{
  assert.match(catches,/lesson === "pvpDinnerSteal" && player\.index !== 0/);
  assert.match(catches,/lesson === "pvpDemoDinnerSteal" && player\.index !== 1/);
});
test('final tutorial 1v1 forces resume countdown without changing regular Versus preference',()=>{
  const resume=extract(menu,'    function resumePausedGame()','    function activatePauseSelection()');
  const make=(final)=>{
    let countdown=0;
    const c={game:{mode:'pvp',pvpUnpauseCountdown:false,state:'paused'},
      tutorial:{active:final,kind:'pvp'},tutorialStep:()=>({setup:final?'pvpFinalMatch':'pvpSkyBonk'}),
      startResumeCountdown(force){assert.equal(force,true);countdown++},
      restorePauseChargeSnapshot(){},playCountdownGoSound(){} };
    vm.createContext(c);vm.runInContext(`${resume}\nthis.go=resumePausedGame;`,c);
    c.go();return {countdown,state:c.game.state};
  };
  assert.equal(make(true).countdown,1);
  const ordinary=make(false);
  assert.equal(ordinary.countdown,0);
  assert.equal(ordinary.state,'playing');
});
test('the final tutorial screen preserves BOTH frogs, Ember and native Versus HUD',()=>{
  const c={tutorial:{active:true,kind:'pvp',dialogueOpen:true},game:{mode:'pvp',state:'won',spawnQueue:[],pvpSetupSkinIds:['pink','ember']},
    pvpPlayers:[{x:0,y:0,w:22,h:14,index:0},{x:0,y:0,w:22,h:14,index:1}],
    frog:{},flies:[{id:1}],CONFIG:{groundY:214,winDanceRevealDelay:1},
    performance:{now:()=>1000},resetDialogueSpaceHold(){},resetTutorialTongue(){},clearHeldInput(){},
    positionPvp(p,x,y,dir){Object.assign(p,{x,y,dir})},
    addTutorialPoof(){c.poofs++},playTutorialPoofSound(){},playWinSound(){},
    PVP_TUTORIAL_ACHIEVEMENT_ID:'versus-ready',TUTORIAL_ACHIEVEMENT_ID:'solo-ready',unlockAchievement(){},clearLabelCaches(){},
    Array,Number,Math,Set};
  c.poofs=0;
  vm.createContext(c);
  vm.runInContext(extract(steps,'function beginCompletionScreen()','function dismissCompletionScreen()'),c);
  c.beginCompletionScreen();
  assert.equal(c.tutorial.completeScreen,true);
  assert.equal(c.game.mode,'pvp');
  assert.equal(c.game.tutorialActive,true);
  assert.equal(c.pvpPlayers[0].x,150);
  assert.equal(c.pvpPlayers[1].x,300);
  assert.equal(c.pvpPlayers[1].skinId,'ember');
  assert.equal(c.poofs,2);
  assert.equal(c.game.state,'won');
  assert.match(versus,/tutorial\.completeScreen && tutorial\.kind === "pvp"[\s\S]*?drawPvpVictoryDanceFrogExact/);
  assert.match(versus,/player\.index === 1 && !tutorial\.completeScreen/);
  assert.match(render,/Math\.round\(\(CONFIG\.playBottom - 106\) \/ 2\)/);
});
test('final match retains Current Goal and delays the Ember meter until completion poof',()=>{
  assert.match(render,/function drawCurrentGoalHud\(\)[\s\S]*?if \(!tutorial\.active\) return/);
  assert.match(versus,/player\.index === 1 && !tutorial\.completeScreen/);
  assert.match(versus,/tutorial\.active \|\| tutorial\.completeScreen/);
});
test('Not So Fast demonstration has compatible rebound arcs and can reach the mid-height perch',()=>{
  const start=scenes.indexOf('case "pvpDemoIntercept":',scenes.indexOf('function beginPvpDemoMotion'));
  const next=scenes.indexOf('case "pvpDemoDinnerSteal":',start);
  assert.ok(start>=0&&next>start);
  const launch=scenes.slice(start,next);
  const p1=/scriptPvpChargedJump\(0, (\.[0-9]+), 1, 0\)/.exec(launch);
  const ember=/scriptPvpChargedJump\(1, (\.[0-9]+), -1, (\d+)\)/.exec(launch);
  assert.ok(p1&&ember);
  const g=820, jumpX=(p)=>120+115*p, jumpY=(p)=>463*p;
  const p1P=+p1[1], eP=+ember[1], delay=+ember[2]/1000;
  const t=.33,te=t-delay;
  const x1=150+jumpX(p1P)*t, y1=200-jumpY(p1P)*t+g*t*t/2;
  const xe=300-jumpX(eP)*te, ye=200-jumpY(eP)*te+g*te*te/2;
  assert.ok(x1 < xe+22 && xe < x1+22, 'frogs overlap horizontally at rebound');
  assert.ok(y1 < ye+14 && ye < y1+14, 'frogs overlap vertically at rebound');
  // New choreography begins with a leftward jump, high enough to clear the
  // middle-left perch (y=126), BEFORE the genuine sideways rebound reverses her.
  const apexY=200-jumpY(eP)**2/(2*g);
  assert.ok(apexY+14<126, `Ember must clear the mid-height perch from below (apex ${apexY})`);
  assert.ok(300-jumpX(eP)*.42<219, 'Ember actually advances LEFT towards the mid-height platform');
});
