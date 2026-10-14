import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (name) => fs.readFileSync(new URL(`../client/game/${name}`, import.meta.url), 'utf8');
const physics = read('60-versus-physics.js');
const rounds = read('61-versus-catches-rounds.js');
const update = read('63-versus-rendering-ui.js');
const scenarios = read('122-tutorial-scenarios.js');
const monitor = read('124-tutorial-monitoring.js');
const slice = (src, start, end) => {
  const i = src.indexOf(start), j = src.indexOf(end, i + start.length);
  assert.ok(i >= 0 && j > i, `missing ${start} -> ${end}`);
  return src.slice(i,j);
};
const run = (src, env) => { vm.createContext(env); vm.runInContext(src,env); return env; };
const tutorialFinal = { active:true, kind:'pvp',pvpFinalOutcome:null };
const finalStep = () => ({setup:'pvpFinalMatch'});

// Rebound demonstration must not be an animation that simply says it succeeded.
test('Ember dinner-steal demo has mirrored start, delayed charge and airborne interception', () => {
  const scene = slice(scenarios, 'case "pvpDemoDinnerSteal":', 'case "pvpDinnerSteal":');
  assert.match(scene, /positionPvp\(p1, W - 305 - p1\.w, CONFIG\.groundY - p1\.h, 1\)/);
  assert.match(scene, /positionPvp\(ember, 305, CONFIG\.groundY - ember\.h, -1\)/);
  assert.match(scene, /addPvpTutorialFly\(320, PARK_PLATFORMS\[5\]\.y - 12/);
  const motion = slice(scenarios.slice(scenarios.indexOf('function beginPvpDemoMotion(')), 'case "pvpDemoDinnerSteal":', 'default:');
  const m = /scriptPvpChargedJump\(0, (\.[\d]+), 1, 0\);\s*scriptPvpChargedJump\(1, (\.[\d]+), -1, (\d+)\)/.exec(motion);
  assert.ok(m, 'the demonstration should script both releases with a delay');
  const [p1Power, emberPower, delay] = [+m[1],+m[2],+m[3] / 1000];
  assert.ok(delay >= .08 && delay <= .60, 'Ember begins charging noticeably later');
  const chargeLength = p => Math.max(.12,p*.8333), speed = p => 120+115*p;
  const lead = delay + chargeLength(emberPower)-chargeLength(p1Power);
  assert.ok(lead > .1 && lead < .65, 'Ember releases after player has entered the jump arc');
  let metInAir=false;
  for (let sinceEmber=0.01;sinceEmber<=.5;sinceEmber+=.005) {
    const t1=lead+sinceEmber;
    const x1=480-305-22+speed(p1Power)*t1;
    const xe=305-speed(emberPower)*sinceEmber;
    const y1=200-463*p1Power*t1+410*t1*t1;
    const ye=200-463*emberPower*sinceEmber+410*sinceEmber*sinceEmber;
    if (Math.abs(x1-xe)<22 && Math.abs(y1-ye)<16 && y1<192 && ye<192) metInAir=true;
  }
  assert.ok(metInAir,'their parabolic jump arcs must intersect in the air');
  // Ember must still be horizontally over the right-middle perch when the
  // descending jump reaches the top (platform y=126, frog h=14).
  const pe=463*emberPower,vxe=speed(emberPower);
  const crossing=(pe+Math.sqrt(pe*pe-4*410*88))/(2*410);
  let contact=null;
  for (let t=.01;t<.5;t+=.001) {
    const t1=lead+t,xe=305-vxe*t,x1=480-305-22+speed(p1Power)*t1;
    const ye=200-pe*t+410*t*t,y1=200-463*p1Power*t1+410*t1*t1;
    if(Math.abs(x1-xe)<22 && Math.abs(y1-ye)<14 && ye<195 && y1<195){contact={t,xe};break;}
  }
  assert.ok(contact,'contact is physically reachable');
  const landingX=contact.xe + vxe * (crossing-contact.t);
  assert.ok(landingX + 22*.22 < 351 && landingX + 22*.78 > 281,
    `Ember should land on the y=126 right perch rather than outside it (x=${landingX})`);
});

test('a queued replacement keeps the final tutorial matching clue visible even with no active flies',()=>{
  const portion=slice(update,'      if (tutorial.active && tutorial.kind === "pvp" && tutorialStep()?.setup === "pvpFinalMatch" &&', '      updatePvpCpuInput(dt);');
  let prompts=[];
  const env={tutorial:{...tutorialFinal,promptHidden:true},tutorialStep:finalStep,
    game:{state:'playing',pvpCriticalCatchActive:false,pvpTimedOutcomePending:false,pvpTimeRemaining:10,
      spawnQueue:[{vocabIndex:2,dueAt:19}],targetVocabIndex:0,elapsed:6,completedVocabIndices:new Set()},
    flies:[],STEP:1/60,Number,Set,setPrompt(v){prompts.push(v);this.game.targetVocabIndex=v;},
    // setPrompt in the real engine closes over game; this stub is bound below.
  };
  env.setPrompt=(v)=>{prompts.push(v);env.game.targetVocabIndex=v;};
  run(`function testRefresh(){${portion}}`,env);
  env.testRefresh();
  assert.deepEqual(prompts,[2]);
  assert.equal(env.tutorial.promptHidden,false);
  assert.equal(env.game.targetVocabIndex,2);
  assert.ok(env.game.spawnQueue[0].dueAt <= 6.017, 'new fly is expedited');
  env.flies=[{vocabIndex:5,state:'active'}];env.testRefresh();
  assert.equal(env.game.targetVocabIndex,5,'visible available fly takes priority');
});

test('final match holds existing charge through zero and auto-releases Ember CPU, not the player',()=>{
  const src = slice(rounds,'    function beginPvpTimerJumpGrace()', '    function pvpTimerGracePlayerCanCatch(');
  const p1={index:0,grounded:true,charging:true,bonked:false,stunTimer:0,inputHeld:true,
    charge:.64,chargeDirection:1,chargeHoldTime:.49,chargeFacingDir:1,dir:1,tongue:{active:false}};
  const cpu={...p1,index:1,charge:.77,tongue:{active:false}};
  const released=[];
  const game={pvpCpuEnabled:true,pvpElapsed:30,promptSerial:6,spawnQueue:[],mode:'pvp'};
  const env={tutorial:{...tutorialFinal},tutorialStep:finalStep,game,pvpPlayers:[p1,cpu],
    isPvpPhysicalJumpHeld:()=>true,getPvpCpuIndex:()=>1,
    preservePvpChargedJumpsAtTimeLimit(){game.pvpPreservedCharges=[{charging:true},{charging:true}]},
    clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),Number,
    releasePvpButton(index,source){released.push({index,source});env.pvpPlayers[index].charging=false;env.pvpPlayers[index].grounded=false;env.game.pvpTutorialGraceHeld[index]=false;}};
  run(src,env);
  env.beginPvpTimerJumpGrace();
  assert.equal(game.pvpTimedOutcomePending,true);
  assert.equal(game.pvpTutorialGraceFromHeld,true);
  assert.equal(game.pvpTimerGraceActive,true);
  assert.equal(p1.charging,true,'human can still release their own previously charged jump');
  assert.deepEqual(released,[{index:1,source:'cpu'}]);
  assert.equal(cpu.grounded,false,'Ember finishes her charge on buzzer');
  assert.equal(game.pvpTutorialGraceHeld[0],true);
});

test('human release after the buzzer launches the existing charge exactly once',()=>{
  const src=slice(physics,'    function releasePvpButton(index, source = "human")', '    function getPvpPlatformMotionProgressAt(');
  const p1={index:0,grounded:true,charging:true,charge:.80,inputHeld:true,stunTimer:0,bonked:false,
    chargeDirection:1,chargeHoldTime:.45,chargeFacingDir:1,dir:1,firstJumpMade:false,
    recoveryFlipTimer:0,airTime:0,tongue:{active:false}, w:22,h:14,y:200};
  const cpu={index:1,grounded:true,charging:false,inputHeld:false};
  let jumps=0;
  const game={mode:'pvp',state:'playing',pvpTimedOutcomePending:true,pvpTimerGraceActive:true,
    pvpTutorialGraceHeld:[true,false],pvpPreservedCharges:[{charging:true},null],pvpElapsed:31};
  const config={platformDropHoldThreshold:.25,minimumJumpX:120,maximumJumpX:235,
    minimumJumpY:10,maximumJumpY:463,platformDropVelocityY:50};
  const env={pvpPlayers:[p1,cpu],game,CONFIG:config,flies:[],OnlineVersus:{rememberLaunch(){}},Number,Math,Set,
    getPvpCpuIndex:()=>1,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),lerp:(a,b,t)=>a+(b-a)*t,
    getPvpStandingPlatform:()=>({ground:true}),predictPvpBonkWithin:()=>false,getPvpLowHopAvoidanceCandidate:()=>false,
    beginHighPowerJumpStreak(){},playJumpSound(){jumps++},markPvpAchievementEarned(){}};
  run(src,env);env.releasePvpButton(0,'human');
  assert.equal(jumps,1);
  assert.equal(p1.grounded,false);
  assert.ok(p1.vy < -300);
  assert.equal(game.pvpTutorialGraceHeld[0],false);
  env.releasePvpButton(0,'human');assert.equal(jumps,1);
});

test('an under-bonk cannot lift the grounded platform frog, including during collision cooldown',()=>{
  const src=physics.slice(physics.indexOf('    function resolvePvpCollision()'));
  const make=(cooldown)=>{
    const supported={index:0,x:158,y:112,w:22,h:14,grounded:true,collisionCooldown:cooldown,vx:0,vy:0};
    const rising={index:1,x:160,y:122,w:22,h:14,grounded:false,collisionCooldown:cooldown,vx:0,vy:-230,previousY:134};
    let recorded=null;
    const platform={x:129,y:126,w:70,h:12};
    const env={pvpPlayers:[supported,rising],game:{},CONFIG:{groundY:214},STEP:1/60,
      tutorial:{active:false},Number,Math,getPvpStandingPlatform:()=>platform,
      getPvpOverlapMetrics:()=>({axis:'vertical',overlapX:20,overlapY:4}),
      getPvpSweptCollisionMetrics:()=>null,
      bonkPvpPlayerFromBelow(p,h){recorded='under';h.bonked=true;},
      bonkPvpPlayer(){recorded='above';},
      separatePvpPlayersAlongAxis(){recorded='fallback';supported.y-=7;},
      bouncePvpPlayersSideways(){recorded='side'},
      resolvePvpOverlapByAxis(){recorded='axis'},
      footstoolDisabledPvpPlayer(){recorded='disabled'},
      bouncePvpPlayerFromDisabled(){recorded='disabledbounce'}};
    run(src,env);env.resolvePvpCollision();
    return {supported,rising,recorded};
  };
  const ordinary=make(0);
  assert.equal(ordinary.recorded,'under');
  assert.equal(ordinary.supported.y,112);
  assert.equal(ordinary.rising.bonked,true);
  const cooling=make(.1);
  assert.equal(cooling.supported.y,112);
  assert.notEqual(cooling.recorded,'fallback','cooldown may not use generic vertical separation');
  assert.ok(cooling.rising.y >= 126.5);
});

test('final victory teardown clears overlapping slow-motion, score and timer grace state before dialogue',()=>{
  const src=slice(monitor,'function beginPvpTutorialEnding()', 'function monitorPvp()');
  let transition=null;
  const env={tutorial:{...tutorialFinal,dynamicDialogueLines:null,step:0},
    game:{mode:'pvp',spawnQueue:[{dueAt:12}],pvpCriticalCatchActive:true,
      pvpTimerGraceActive:true,pvpTimedOutcomePending:true,pvpTutorialGraceHeld:[true,true],
      pvpWinPendingIndex:1,pvpCriticalCatchFlyVisual:{id:8}},
    pvpPlayers:[{index:0,w:22,h:14,score:5},{index:1,w:22,h:14,score:4}],
    performance:{now:()=>1200},Number,CONFIG:{groundY:214},
    despawnTutorialFlies(){},beginPoofTransition(arg){transition=arg;return true},
    PVP_WIN_DIALOGUE:['Winner'],PVP_LOSE_DIALOGUE:['Loser']};
  run(src,env);env.beginPvpTutorialEnding();
  assert.equal(env.tutorial.pvpFinalOutcome,'win');
  assert.equal(env.game.pvpCriticalCatchActive,false);
  assert.equal(env.game.pvpTimedOutcomePending,false);
  assert.equal(env.game.pvpTimerGraceActive,false);
  assert.equal(env.game.pvpWinPendingIndex,null);
  assert.equal(env.game.pvpCriticalCatchFlyVisual,null);
  assert.equal(env.game.spawnQueue.length,0);
  assert.equal(transition?.reason,'pvp-final-post-victory');
});
