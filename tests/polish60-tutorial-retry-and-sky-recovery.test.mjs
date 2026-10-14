import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=(name)=>readFileSync(new URL(`../client/game/${name}`,import.meta.url),'utf8');
const dialogue=source('121-tutorial-runtime-dialogue.js');
const lifecycle=source('123-tutorial-lifecycle.js');
const monitoring=source('124-tutorial-monitoring.js');
const scenarios=source('122-tutorial-scenarios.js');
const preview=source('125-tutorial-rendering.js');
const physics=source('60-versus-physics.js');
function slice(code,first,last){
  const a=code.indexOf(first),b=code.indexOf(last,a+first.length);
  assert.ok(a>=0&&b>a,`source section not found: ${first}`);
  return code.slice(a,b);
}
function evaluate(code,environment){
  const context=vm.createContext(environment);
  vm.runInContext(code,context);
  return context;
}

test('a completed sky-bonk line can advance with Space even while its victim is still stunned',()=>{
  let configured=0,finalized=0,cleared=0;
  const tutorial={active:true,kind:'pvp',dialogueOpen:true,dialogueLineIndex:0,
    dialogueLineStartedAt:1000,dialogueOpenedAt:1000,
    dynamicDialogueLines:['Bonk!'],postSuccessAdvance:true,pvpFinalOutcome:null,
    blockJumpUntilRelease:false};
  const environment={tutorial,game:{state:'playing'},performance:{now:()=>3000},
    pvpPlayers:[{bonked:true,stunTimer:4.8,recoveryFlipTimer:0},{grounded:true}],
    dialogueLineIsComplete:()=>true,dialogueLinesForCurrentStep:()=>['Bonk!'],
    tutorialStep:()=>({setup:'pvpSkyBonk'}),resetDialogueSpaceHold(){},
    clearHeldInput(){cleared++},finalizePassedStep(){finalized++},
    isPvpPhysicalJumpHeld:()=>true,beginCompletionScreen(){throw Error('not final');},
    tone(){},drawScene(){},armScenarioAfterDialogue(){},nextStep(){configured++}};
  const c=evaluate(slice(dialogue,'function closeDialogue(source = "keyboard")','function setMentor('),environment);
  assert.equal(c.closeDialogue('space-keydown'),true);
  assert.equal(finalized,1,'the dialogue completion proceeds while a victim has 4.8 seconds of stun');
  assert.equal(tutorial.blockJumpUntilRelease,true,'the Space keydown cannot become a new jump');
  assert.equal(c.pvpPlayers[0].stunTimer,4.8,'the victim is not prematurely unstunned');
  assert.ok(cleared>=1);
  const steps={kind:'pvp',step:0,pvpAwaitRecoveryAdvance:false,
    dialogueHeldLineText:'',dialogueHeldPortraitKey:''};
  const c2=evaluate(slice(lifecycle,'function nextStep()','function skipToNextTutorialScene()'),{
    tutorial:steps,PVP_STEPS:[{setup:'pvpSkyBonk'},{setup:'pvpDemoBufferedSky'}],SOLO_STEPS:[],
    tutorialStep:()=>({setup:'pvpSkyBonk'}),despawnTutorialFlies(){},tutorialFlyKey:()=>'fly',
    captureControlledPose:()=>({}),capturePvpTutorialPoses:()=>[],
    currentDialogueLine:()=>'',currentEmberPortraitKey:()=>'',
    freezeControlledEntity(){},configureStep(){configured++},
    pvpTutorialRecoveryIsPlaying(){throw Error('must not gate on stun');}
  });
  c2.nextStep();
  assert.equal(steps.step,1);
  assert.equal(configured,1);
});

test('full sky-bonk stun stays at five seconds and produces one visible recovery',()=>{
  const player={index:0,x:120,y:200,w:22,h:14,vx:0,vy:0,grounded:true,
    bonked:false,stunTimer:5,stunCountdownStarted:true,recoveryFlipTimer:0,
    inputHeld:false,charging:false,charge:0,landingSquash:0,collisionCooldown:0,
    catchSparkleTimer:0,wrongCatchBubbleTimer:0,blinkTimer:4,blinking:false};
  const c=evaluate(slice(physics,'function updatePvpPlayer(player, dt)','function spawnPvpImpactEffect('),{
    CONFIG:{groundY:214},tutorial:{active:true,kind:'pvp',dialogueOpen:true,pvpPlayerScriptLocked:true},
    game:{pvpElapsed:20,pvpCpuEnabled:false},getPvpCpuIndex:()=>1,
    isPvpPhysicalJumpHeld:()=>false,startPvpCharge(){throw Error('charge during stun');},
    clamp:(n,a,b)=>Math.max(a,Math.min(b,n))
  });
  for(let i=0;i<249;i++)c.updatePvpPlayer(player,.02);
  assert.ok(player.stunTimer>.018&&player.stunTimer<.022);
  assert.equal(player.recoveryFlipTimer,0,'must not rotate early');
  c.updatePvpPlayer(player,.02);
  assert.equal(player.stunTimer,0);
  assert.equal(player.recoveryFlipTimer,.56);
  for(let i=0;i<28;i++)c.updatePvpPlayer(player,.02);
  assert.equal(player.recoveryFlipTimer,0);
  c.updatePvpPlayer(player,.02);
  assert.equal(player.recoveryFlipTimer,0,'recovery rotation plays once');
});

test('under-bonk Ember genuinely jumps when player reaches a cloned lower-middle platform',()=>{
  const perch={x:204,y:176,w:72,h:12};
  const p1={x:224,y:162,w:22,h:14,grounded:true};
  const ember={x:238,y:200,w:22,h:14,grounded:true,bonked:false,stunTimer:0};
  let jumps=0;
  const tutorial={enteredAt:100,dialogueOpen:false,pvpUnderBonkPendingSecond:false,
    pvpUnderBonks:0,pvpScriptActions:[]};
  const c=evaluate(slice(monitoring,'function drivePvpPracticeCpu(setup, now)','function beginPvpTutorialEnding()'),{
    tutorial,pvpPlayers:[p1,ember],PARK_PLATFORMS:[{},{},{},{...perch}],
    PVP_MOVING_PRACTICE_SETUPS:new Set(['pvpUnderBonkTwo']),
    getPvpStandingPlatform:()=>({...perch}),
    updatePvpScriptActions(){},updatePvpScriptedBuffer(){},holdEmberStill(){},
    scriptPvpChargedJump(index,power,direction){assert.equal(index,1);assert.equal(direction,-1);assert.equal(power,.50);jumps++;}
  });
  c.drivePvpPracticeCpu('pvpUnderBonkTwo',1500);
  assert.equal(jumps,1,'the runtime platform is a clone, not the original template object');
  assert.equal(tutorial.pvpUnderBonkPendingSecond,true);
  assert.equal(tutorial.pvpUnderBonkAttemptStartedAt,1500);
  tutorial.pvpUnderBonkPendingSecond=false;
  c.getPvpStandingPlatform=()=>({...perch,x:perch.x+70});
  c.drivePvpPracticeCpu('pvpUnderBonkTwo',1600);
  assert.equal(jumps,1,'the CPU must not jump until the player lands on the correct perch');
});

test('under-bonk fails immediately upon landing on a wrong perch or when Ember misses and lands',()=>{
  const block=slice(monitoring.slice(monitoring.indexOf('function monitorPvp()')),'  if (setup === "pvpUnderBonkTwo") {','  if (setup === "pvpAvoidUnder") {');
  const p1={x:150,y:112,w:22,h:14,grounded:true,firstJumpMade:true};
  const ember={x:238,y:200,w:22,h:14,grounded:true,firstJumpMade:true,bonked:false,stunTimer:0};
  const tutorial={pvpUnderBonks:0,pvpUnderBonkPendingSecond:false,resetPending:false,
    pvpUnderBonkPlayerAirborne:true,enteredAt:100};
  const failures=[];
  const c=evaluate(`function check(){${block}}`,{
    tutorial,p1,ember,setup:'pvpUnderBonkTwo',now:2400,playerLanded:true,PARK_PLATFORMS:[{},{},{},{x:204,y:176}],
    getPvpStandingPlatform:()=>({x:129,y:126}),failAttempt:message=>failures.push(message),
    pvpPracticeEventReady:()=>false,passStep(){},
  });
  c.check();
  assert.match(failures[0],/LOWER-MIDDLE PLATFORM/);
  failures.length=0;
  tutorial.pvpUnderBonkPlayerAirborne=false;
  tutorial.pvpUnderBonkPendingSecond=true;
  tutorial.pvpUnderBonkEmberAirborne=true;
  c.check();
  assert.match(failures[0],/JUMPED PAST YOU/);
});

test('missed rebound poofs when only Ember lands, retaining completed rebound count',()=>{
  const block=slice(monitoring.slice(monitoring.indexOf('function monitorPvp()')),'  if (setup === "pvpReboundThree") {','  if (setup === "pvpReboundCatch") {');
  const p1={grounded:true,firstJumpMade:false},ember={grounded:true,firstJumpMade:true};
  const tutorial={pvpReboundCount:0,pvpPracticeCount:0,pvpLessonLanded:[false,false],
    pvpReboundLandingHoldAt:1800,enteredAt:1000,resetPending:false};
  let poof;
  const c=evaluate(`function check(){${block}}`,{
    tutorial,p1,ember,setup:'pvpReboundThree',now:2500,game:{},performance:{now:()=>2500},
    updatePvpLessonLandings:()=>[false,true],pvpTutorialSettled:()=>true,
    beginPoofTransition:options=>{poof=options;},
    failAttempt(){throw Error('must poof');},passStep(){}
  });
  c.check();
  assert.equal(poof?.reason,'retry-pvp-rebound-without-losing-progress');
  assert.equal(tutorial.pvpReboundCount,0);
});

test('chapter select sky-bonk starts on previous ground positions then retains its actual target platforms',()=>{
  const player={x:0,y:0,w:22,h:14},ember={x:0,y:0,w:22,h:14};
  const tutorial={active:true,kind:'pvp',pauseChapterPreviewIndex:0,step:2,
    smokeClouds:[],dialogueOpen:false};
  const stage=[{},{},{},{},{},{},{x:372,w:72}];
  const game={state:'paused'};
  const c=evaluate(slice(preview,'function applyTutorialChapterPreview()','function drawTutorialPauseArrow('),{
    tutorial,game,pvpPlayers:[player,ember],PARK_PLATFORMS:stage,W:480,
    CONFIG:{groundY:214},performance:{now:()=>4000},
    tutorialSceneCatalog:()=>[{index:8,setup:'pvpDemoSkyBonk'}],
    clearPvpScriptActions(){},configurePvpStep(){
      Object.assign(player,{x:217,y:54});Object.assign(ember,{x:152,y:151});
    },captureControlledPose:()=>({}),capturePvpTutorialPoses:()=>[{
      x:player.x,y:player.y},{x:ember.x,y:ember.y}],
    positionPvp:(p,x,y,dir)=>Object.assign(p,{x,y,dir}),
    restoreStepSequence(){},clearHeldInput(){},
    openDialogue(){tutorial.dialogueOpen=true;}
  });
  assert.equal(c.applyTutorialChapterPreview(),true);
  assert.equal(player.x,205);
  assert.equal(player.y,200);
  assert.equal(ember.x,397);
  assert.equal(ember.y,200);
  assert.equal(tutorial.pendingPvpTargetPoses[0].y,54);
  assert.equal(tutorial.pendingPvpTargetPoses[1].y,151);
  assert.equal(tutorial.dialogueOpen,true);
  assert.equal(game.state,'playing');
});

test('retry captions persist through poof completion and are cleared when Ember resumes speaking',()=>{
  assert.match(lifecycle,/if \(tutorial\.kind === "pvp" && !tutorial\.dialogueOpen &&[\s\S]+?tutorial\.pvpCaption = "YOUR TURN!"/);
  assert.match(lifecycle,/completedResetReason === "failed-attempt"[\s\S]*?tutorial\.pvpCaptionUntil = Number\.POSITIVE_INFINITY/);
  assert.match(dialogue,/function clearPvpCaptionForDialogue\(\)[\s\S]*?tutorial\.pvpCaption = ""/);
});
