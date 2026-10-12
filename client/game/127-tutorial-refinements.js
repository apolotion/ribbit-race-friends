// Ribbit Race tutorial responsibility: 127 tutorial refinements
// Polish 19 refinements: chapter preview, tutorial scene layouts, and tutorial-safe runtime behavior.
const polish19 = {
  pauseChapterPreview: null,
  pauseChapterKind: "",
  lastPvpStep: -1,
  lastBonkCount: 0,
  pendingDemoAt: 0,
  pvpOutroFaces: 0
};
function polish19StepList(){ return tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS; }
function polish19StepTitle(index=tutorial.step){
  const step=polish19StepList()[clamp(Math.floor(index),0,polish19StepList().length-1)]||{};
  return String(step.chapterTitle||step.title||step.setup||"TUTORIAL").replace(/^PVP\s*/i,"").toUpperCase();
}
function polish19SceneFlyGoal(){
  const setup=String(tutorialStep()?.setup||"");
  const goals={threeCatches:3,rangeCatch:1,wrongFly:2,comboMixed:2,comboTwo:2,comboThree:3,wallTurn:1,reboundCatch:1,quickDrop:1,bufferDrop:1,doubleBuffer:3,normalRound:5};
  return goals[setup]||0;
}
function polish19SetPvpPose(player,x,y,dir){
  if(!player)return; Object.assign(player,{x,y,vx:0,vy:0,dir,grounded:true,charging:false,charge:0,chargeHoldTime:0,inputHeld:false,bonked:false,stunTimer:0});
  if(player.tongue)Object.assign(player.tongue,{active:false,elapsed:0,targetFlyId:null,captured:false});
}
function polish19InitialPvpPose(){
  const groundY=CONFIG.groundY-pvpPlayers[0].h;
  polish19SetPvpPose(pvpPlayers[0],145,groundY,1);
  polish19SetPvpPose(pvpPlayers[1],305,groundY,-1);
}
function polish19ApplyPvpChapterPose(index=tutorial.step){
  if(tutorial.kind!=="pvp"||!pvpPlayers?.length)return;
  const step=PVP_STEPS[index]||{}, key=(String(step.setup||"")+" "+String(step.title||"")).toLowerCase();
  const ground=CONFIG.groundY-pvpPlayers[0].h, p0=pvpPlayers[0], e=pvpPlayers[1];
  polish19InitialPvpPose();
  if(/drop bonk/.test(key)&&!/buffer|sky/.test(key)){
    polish19SetPvpPose(p0,128,ground,1); polish19SetPvpPose(e,235,(platforms[2]?.y||126)-e.h,-1);
  }
  if(/high|highest/.test(key)&&/drop/.test(key)){
    polish19SetPvpPose(p0,126,ground,1); polish19SetPvpPose(e,(platforms[4]?.x||206)+(platforms[4]?.w||68)-e.w-5,(platforms[4]?.y||70)-e.h,-1);
  }
  if(/buffer/.test(key)&&/bonk/.test(key)){
    polish19SetPvpPose(p0,80,ground,1); polish19SetPvpPose(e,240,ground,-1);
  }
  if(/sky bonk/.test(key)){
    polish19SetPvpPose(p0,92,(platforms[1]?.y||169)-p0.h,1); polish19SetPvpPose(e,240,(platforms[4]?.y||70)-e.h,-1);
  }
  if(/high ground|knock.*platform/.test(key)){
    polish19SetPvpPose(p0,240,(platforms[4]?.y||70)-p0.h,1); polish19SetPvpPose(e,390,(platforms[6]?.y||169)-e.h,-1);
  }
  if(/recover|wait.*bonk/.test(key)){
    polish19SetPvpPose(p0,(platforms[2]?.x||129)-p0.w/2,ground,1); polish19SetPvpPose(e,240,ground,-1);
  }
  if(/under bonk/.test(key)){
    polish19SetPvpPose(p0,240,ground,1); polish19SetPvpPose(e,240,(platforms[2]?.y||126)-e.h,-1);
  }
  if(/low profile/.test(key)){
    polish19SetPvpPose(p0,240,(platforms[3]?.y||176)-p0.h,1); polish19SetPvpPose(e,315,ground,-1);
  }
  if(/rebound/.test(key)&&!/catch|fly/.test(key)){
    polish19SetPvpPose(p0,145,ground,1); polish19SetPvpPose(e,305,ground,-1);
  }
  if(/rebound.*catch|catch.*rebound/.test(key)){
    polish19SetPvpPose(p0,240,(platforms[3]?.y||176)-p0.h,1); polish19SetPvpPose(e,130,ground,-1);
  }
  if(/intercept|cut.*path|defensive/.test(key)){
    polish19SetPvpPose(p0,155,ground,1); polish19SetPvpPose(e,315,ground,-1);
  }
}
function polish19RetractPvpTongues(){ for(const p of pvpPlayers||[]){if(p?.tongue)Object.assign(p.tongue,{active:false,elapsed:0,targetFlyId:null,captured:false});} }
const polish19OriginalConfigurePvpStep = configurePvpStep;
configurePvpStep = function(index){
  const result=polish19OriginalConfigurePvpStep.call(this,index);
  // The authored configurePvpStep layouts are the source of truth. The older
  // generic chapter pose pass used to overwrite them and caused incorrect
  // facing/positioning after chapter navigation.
  polish19RetractPvpTongues();
  tutorial.pvpEmberFacingLock = Number(pvpPlayers[1]?.dir || -1);
  polish19.lastPvpStep=index;
  return result;
};
function polish19EffectsFinished(){ return !(game.pvpImpactEffects||[]).some(effect=>Number(effect.elapsed||0)<Number(effect.duration||.4)); }
function polish19ApplyChapterPreview(){
  return applyTutorialChapterPreview();
}


function polish19PvpRuntimeCorrection(dt=0){
  if(!tutorial.active||tutorial.kind!=="pvp"||!pvpPlayers?.length)return;
  const step=tutorialStep()||{},key=(String(step.setup||"")+" "+String(step.title||"")).toLowerCase();
  const player=pvpPlayers[0],ember=pvpPlayers[1],control=tutorialPlayerHasControl();
  // No ordinary fly generation outside authored fly exercises and the final race.
  const flyLesson=/dinner|catch|fly|intercept|steal|offense|final|race|match/.test(key);
  if(!flyLesson){game.spawnQueue.length=0;if(!tongue.active)flies.splice(0,flies.length);game.targetVocabIndex=null;}
  // Bonk-and-catch: keep a legal facing direction and a higher fly above the first platform.
  if(/dinner|dizzy/.test(key)){
    const fx=control?405:75,fy=104;
    for(const f of flies){if(f?.tutorialAuthored||flies.length===1){if(f.state==='active'){f.baseX=fx;f.baseY=fy;f.x=fx;f.y=fy;}}}
    if(!control&&!ember.grounded){tutorial.pvpEmberFacingLock=-1;ember.dir=-1;ember.chargeFacingDir=-1;}
    if(control&&!player.grounded)player.dir=1;
  }
  // Keep all tongues retracted through a poof/reset.
  if(tutorial.resetPending||tutorial.frogHidden)polish19RetractPvpTongues();

  // Outside the final match, Ember can only reverse under the same physical
  // rules as every other frog: a wall bounce or a side-to-side rebound. This
  // blocks AI/script drift from making her turn around in open air.
  const finalLesson=/final|race|match/.test(key);
  if(!finalLesson&&ember){
    const legalTurn=Boolean(ember.wallBouncedThisJump||
      (ember.bouncedOffOpponentThisJump&&ember.lastOpponentBounceType==="rebound"));
    if(legalTurn){
      tutorial.pvpEmberFacingLock=Number(ember.dir||tutorial.pvpEmberFacingLock||-1);
    }else if(!tutorial.resetPending&&!tutorial.pvpFrogsHidden){
      const locked=Number(tutorial.pvpEmberFacingLock||ember.dir||-1) < 0 ? -1 : 1;
      ember.dir=locked;
      ember.chargeFacingDir=locked;
    }
  }
  // Final race hands control to the existing Level 5 CPU and normal fly system.
  if(/final|race|match/.test(key)){
    game.pvpCpuEnabled=true;game.pvpCpuDifficulty=5;game.pvpCpuLevel=5;game.pvpTimeLimitSeconds=30;game.pvpBestOf=1;game.pvpRoundGoalMode='endless';
    ember.cpu=true;ember.cpuLevel=5;ember.skinId='ember';ember.hatId='crown';
  }
}
const polish19OriginalUpdateTutorial=updateTutorial;
updateTutorial=function(...args){const out=polish19OriginalUpdateTutorial.apply(this,args);polish19PvpRuntimeCorrection(Number(args[0]||0));return out;};

window.RibbitRaceTutorialEngine = Object.freeze({
  currentDialogueTextPolish19(){ return String(currentDialogueLine?.()||""); },
  tutorialStatePolish19(){ return {...tutorial}; },
  get pvpBonksPolish19(){ return Number(tutorial.pvpBonks||0); },
  get dialogueLinePolish19(){ return Number(tutorial.dialogueLineIndex||0); },
  get playerControlPolish19(){ return tutorialPlayerHasControl(); },
  get kindPolish19(){ return tutorial.kind; },
  get stepTitlePolish19(){ return String(tutorialStep()?.title||""); },
  get polish19Setup(){ return String(tutorialStep()?.setup||""); },
  get sceneFlyGoal(){ return polish19SceneFlyGoal(); },
  get chapterPreview(){ return tutorial.pauseChapterPreviewIndex; },
  setChapterPreview(index){
    const catalog = tutorialSceneCatalog();
    if (!catalog.length) return null;
    tutorial.pauseChapterPreviewIndex = (Number(index) + catalog.length) % catalog.length;
    tutorial.chapterNavigationPending = true;
    tutorial.dialogueOpen = false;
    clearHeldInput();
    return tutorial.pauseChapterPreviewIndex;
  },
  applyChapterPreview(){ return applyTutorialChapterPreview(); },
  currentChapterTitle(){
    const catalog = tutorialSceneCatalog();
    const currentScene = Number(tutorialStep()?.scene || 1);
    const fallback = Math.max(0, catalog.findIndex((entry) => entry.scene === currentScene));
    const index = Number.isInteger(tutorial.pauseChapterPreviewIndex) ? tutorial.pauseChapterPreviewIndex : fallback;
    return String(catalog[index]?.title || "TUTORIAL").toUpperCase();
  },
  currentChapterNumber(){
    const catalog = tutorialSceneCatalog();
    const currentScene = Number(tutorialStep()?.scene || 1);
    const fallback = Math.max(0, catalog.findIndex((entry) => entry.scene === currentScene));
    return (Number.isInteger(tutorial.pauseChapterPreviewIndex) ? tutorial.pauseChapterPreviewIndex : fallback) + 1;
  },
  chapterCount(){ return tutorialSceneCatalog().length; },
  retryScene(){ retryCurrentScene?.(); },
  start,
  exit: () => finish(false),
  get active() { return tutorial.active; },
  get completeScreen() { return tutorial.completeScreen; },
  get dialogueOpen() { return tutorial.dialogueOpen; },
  get kind() { return tutorial.kind; },
  get step() { return tutorial.step; },
  get setup() { return tutorialStep()?.setup || ""; },
  retryScene() {
    if (!tutorial.active || tutorial.resetPending) return false;
    beginPoofTransition({
      reason:"hotkey-retry",
      showFailure:false,
      preserveExistingFlies:false,
      armFlies:false,
      action:rebuildCurrentScenarioWithDialogue
    });
    return true;
  },
  get build() { return TUTORIAL_BUILD; },
  get portraitsReady() { return emberPortraitsReady; },
  ready: () => EMBER_PORTRAITS_READY,
  seen(kind = "solo") {
    try { return localStorage.getItem(kind === "pvp" ? PVP_SEEN_KEY : SOLO_SEEN_KEY) === "true"; }
    catch (_) { return false; }
  },
  resetSeen(kind = "solo") {
    try { localStorage.removeItem(kind === "pvp" ? PVP_SEEN_KEY : SOLO_SEEN_KEY); } catch (_) {}
  }
});
