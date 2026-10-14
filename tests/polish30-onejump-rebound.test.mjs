import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readProjectFile as read} from './source-reader.mjs';

const source = read('client/game/122-tutorial-scenarios.js');
const monitor = read('client/game/124-tutorial-monitoring.js');
const hooks = read('client/game/126-tutorial-hooks.js');
const config = read('client/game/120-tutorial-config.js');

function between(source, start, end) {
  const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
  assert.ok(from>=0 && to>from, `Missing source segment ${start} -> ${end}`);
  return source.slice(from,to);
}
function geometry() {
  const ctx={
    W:480, CONFIG:{groundY:214},
    game:{pvpSetupSkinIds:['azure','ember'],targetVocabIndex:0},
    tutorial:{pvpPracticeLayoutIndex:0},
    pvpPlayers:[{index:0,w:22,h:14},{index:1,w:22,h:14}],
    flies:[],clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),
    resetPvpPlayer:(p,x,dir)=>Object.assign(p,{x,y:200,dir,grounded:true}),
    basePvpScenario(){},clearScenarioState(){},PVP_START_X:[70,330],
    addPvpTutorialFly:(x,y)=>ctx.flies.push({x,y})
  };
  vm.createContext(ctx);
  vm.runInContext(between(read('client/game/10-core-config.js'),'const PARK_PLATFORMS =','const PARK_FLY_SPAWNS'),ctx);
  vm.runInContext(between(config,'const PVP_STEPS =','const PVP_WIN_DIALOGUE'),ctx);
  vm.runInContext(between(source,'function positionPvp(player','function setPvpAirborne'),ctx);
  vm.runInContext(between(source,'function positionPvpBonkPracticeLayout','function clearPvpScriptActions'),ctx);
  ctx.setup=(name)=>{
    ctx.flies.length=0;
    vm.runInContext(`configurePvpStep(PVP_STEPS.findIndex(s=>s.setup===${JSON.stringify(name)}))`,ctx);
    return ctx;
  };
  return ctx;
}

test('Rebound-and-catch player turn is horizontally mirrored to the left',()=>{
  const ctx=geometry().setup('pvpDemoReboundCatch');
  const oldP1X=ctx.pvpPlayers[0].x,oldEmberX=ctx.pvpPlayers[1].x,oldFlyX=ctx.flies[0].x;
  ctx.setup('pvpReboundCatch');
  const [player,ember]=ctx.pvpPlayers;
  assert.equal(player.x,480-oldEmberX-player.w);
  assert.equal(ember.x,480-oldP1X-ember.w);
  assert.equal(ctx.flies[0].x,480-oldFlyX);
  assert.equal(player.dir,1);
  assert.equal(ember.dir,-1);
  assert.equal(ctx.flies[0].y,78);
});

test('Dinner-steal player rebound points toward left fly, not away from it',()=>{
  const ctx=geometry().setup('pvpDinnerSteal');
  const [player,ember]=ctx.pvpPlayers;
  assert.ok(player.x<ember.x && player.dir===1 && ember.dir===-1);
  assert.ok(ctx.flies[0].x<player.x);
  assert.ok(ctx.flies[0].y<170);
});

test('Only an actual flight followed by landing can trigger intercept retry',()=>{
  const ctx={
    PVP_STEPS:[{setup:'pvpIntercept'}],
    tutorial:{step:0,enteredAt:100,pvpInterceptSeen:false,pvpReboundCount:0,pvpEmberLaunchStarted:true,
      pvpEmberJumpScheduledAt:150,pvpLessonAirborneSeen:[false,false],pvpLessonLanded:[false,false]},
    pvpPlayers:[{index:0,grounded:true,firstJumpMade:false},{index:1,grounded:true,firstJumpMade:false}],
    performance:{now:()=>2000},drivePvpPracticeCpu(){},consumePvpPlayerLanding:()=>false,
    pvpTutorialSettled:()=>false, failAttempt:()=>{ctx.failed++},passStep:()=>{ctx.passed++},
    failed:0,passed:0
  };
  vm.createContext(ctx);
  vm.runInContext(between(monitor,'function updatePvpLessonLandings','function pvpPracticeEventReady'),ctx);
  vm.runInContext(between(monitor,'function monitorPvp','function tutorialMovementLocked'),ctx);
  for (let i=0;i<4;i++)ctx.monitorPvp();
  assert.equal(ctx.failed,0,'grounded charge cannot cause poof');
  ctx.pvpPlayers[1].grounded=false;ctx.pvpPlayers[1].firstJumpMade=true;
  ctx.monitorPvp();assert.equal(ctx.failed,0,'airborne frog cannot cause poof');
  ctx.pvpPlayers[1].grounded=true;
  ctx.monitorPvp();assert.equal(ctx.failed,1,'a missed actual landing causes one retry');
  ctx.monitorPvp();assert.equal(ctx.failed,1,'staying grounded cannot retrigger poof');
});

test('Dinner-steal retries both frogs only after one of their launched jumps lands',()=>{
  const ctx={
    PVP_STEPS:[{setup:'pvpDinnerSteal'}],
    tutorial:{step:0,enteredAt:100,pvpTechniqueCatchQualified:false,pvpEmberLaunchStarted:true,
      pvpEmberJumpScheduledAt:150,pvpLessonAirborneSeen:[false,false],pvpLessonLanded:[false,false]},
    pvpPlayers:[{index:0,grounded:true,firstJumpMade:false},{index:1,grounded:true,firstJumpMade:false}],
    game:{pvpCriticalCatchActive:false},
    performance:{now:()=>2000},drivePvpPracticeCpu(){},consumePvpPlayerLanding:()=>false,
    pvpTutorialSettled:()=>false, failAttempt:()=>{ctx.failed++},passStep:()=>{ctx.passed++},failed:0,passed:0
  };
  vm.createContext(ctx);
  vm.runInContext(between(monitor,'function updatePvpLessonLandings','function pvpPracticeEventReady'),ctx);
  vm.runInContext(between(monitor,'function monitorPvp','function tutorialMovementLocked'),ctx);
  ctx.monitorPvp();assert.equal(ctx.failed,0);
  ctx.pvpPlayers[0].firstJumpMade=true;ctx.pvpPlayers[0].grounded=false;
  ctx.monitorPvp();assert.equal(ctx.failed,0);
  ctx.pvpPlayers[0].grounded=true;
  ctx.monitorPvp();assert.equal(ctx.failed,1);
  ctx.monitorPvp();assert.equal(ctx.failed,1);
});

test('Real same-jump rebound catch triggers zoom for both Ember and the player',()=>{
  const ctx={
    tutorial:{active:true,kind:'pvp',pvpReboundAt:100, pvpLastPracticeEventAt:0,
      pvpPracticeCatchCount:0,pvpTechniqueCatchQualified:false},
    setup:'pvpDemoDinnerSteal',
    game:{spawnQueue:[],pvpCriticalCatchActive:false},
    performance:{now:()=>500},
    tutorialStep(){return {setup:ctx.setup}},
    attemptPvpFlyCatch(player){player.score++;return true},
    startPvpCriticalCatch(player,fly,kind){ctx.zoomEvents.push([player.index,kind,fly.x]);ctx.game.pvpCriticalCatchActive=true;return true},
    zoomEvents:[],pvpPlayers:[{index:0,score:0,grounded:false},{index:1,score:0,grounded:false}]
  };
  vm.createContext(ctx);
  vm.runInContext(between(hooks,'const originalAttemptPvpFlyCatchForTutorial','// Training is a reversible playtest session'),ctx);
  const fly={id:4,x:350,baseX:350};
  const ember=ctx.pvpPlayers[1];ember.bouncedOffOpponentThisJump=true;ember.lastOpponentBounceType='rebound';
  ctx.attemptPvpFlyCatch(ember,fly);
  assert.equal(ctx.tutorial.pvpTechniqueCatchQualified,true);
  assert.deepEqual(ctx.zoomEvents.map(x=>x[0]),[1]);
  assert.equal(ctx.zoomEvents[0][1],'technique');
  assert.equal(ember.score,0,'training catches cannot change the score');
  ctx.game.pvpCriticalCatchActive=false;ctx.tutorial.pvpTechniqueCatchQualified=false;
  ctx.setup='pvpDinnerSteal';ctx.tutorial.pvpReboundAt=550;
  ctx.performance.now=()=>600;
  const player=ctx.pvpPlayers[0];player.bouncedOffOpponentThisJump=true;player.lastOpponentBounceType='rebound';
  ctx.attemptPvpFlyCatch(player,fly);
  assert.equal(ctx.tutorial.pvpTechniqueCatchQualified,true);
  assert.deepEqual(ctx.zoomEvents.map(x=>x[0]),[1,0]);
  assert.equal(player.score,0);
  ctx.game.pvpCriticalCatchActive=false;ctx.tutorial.pvpTechniqueCatchQualified=false;
  player.grounded=true;
  ctx.attemptPvpFlyCatch(player,fly);
  assert.equal(ctx.tutorial.pvpTechniqueCatchQualified,false,'late catch after landing cannot qualify');
  assert.equal(ctx.zoomEvents.length,2);
});

test('Demonstrations cannot use a second jump or a timer-only completion',()=>{
  const motion=between(source,'function beginPvpDemoMotion','function startPvpDemonstration');
  const dinner=between(motion,'case "pvpDemoDinnerSteal"','default:');
  assert.match(dinner,/scriptPvpChargedJump\(0, 1, 1, 0\)/);
  assert.match(dinner,/scriptPvpChargedJump\(1, 1, -1, 0\)/);
  assert.equal((dinner.match(/scriptPvpChargedJump/g)||[]).length,2);
  const follow=between(source,'function updatePvpDemonstration','function startPvpFinalMatch');
  assert.doesNotMatch(follow,/setup === "pvpDemoDinnerSteal" && tutorial\.pvpReboundCount[^\n]*[\s\S]{0,200}scriptPvpChargedJump/);
  assert.match(follow,/tutorial\.pvpTechniqueCatchQualified && tutorial\.pvpTechniqueCatchPlayerIndex === 1/);
  assert.match(follow,/if \(missedLanding\) \{\s*restartMissedPvpReboundDemonstration\(\)/);
});
