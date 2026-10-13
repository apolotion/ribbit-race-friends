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
  // Authored scene layouts own positions and facing. Never rewrite a moving
  // frog or fly based on a title ("DINNER" used to force the player right and
  // snap the fly back to a fixed point on every frame).
  // Keep all tongues retracted through a poof/reset.
  if(tutorial.resetPending||tutorial.frogHidden)polish19RetractPvpTongues();

  // Normal physics is the sole owner of airborne facing. Initial orientation
  // is authored by configurePvpStep/scriptPvpPress, never corrected per frame.
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
    // Preview leaves the current dialogue intact until Continue.
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
  start,
  exit: () => finish(false),
  get active() { return tutorial.active; },
  get scriptedInputLocked() { return tutorial.pvpDemoActive || tutorial.pvpPlayerScriptLocked; },
  get completeScreen() { return tutorial.completeScreen; },
  get dialogueOpen() { return tutorial.dialogueOpen; },
  get kind() { return tutorial.kind; },
  get step() { return tutorial.step; },
  get setup() { return tutorialStep()?.setup || ""; },
  retryScene() {
    if (!tutorial.active) return false;
    return restartTutorialSceneImmediately();
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
