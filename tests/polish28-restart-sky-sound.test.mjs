import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readProjectFile as read } from './source-reader.mjs';

const lifecycle = read('client/game/123-tutorial-lifecycle.js');
const dialogue = read('client/game/121-tutorial-runtime-dialogue.js');
const scene = read('client/game/122-tutorial-scenarios.js');
const hud = read('client/game/63-versus-rendering-ui.js');
const rendering = read('client/game/125-tutorial-rendering.js');
const hooks = read('client/game/126-tutorial-hooks.js');
const refinements = read('client/game/127-tutorial-refinements.js');
const config = read('client/game/120-tutorial-config.js');
const core = read('client/game/10-core-config.js');
function section(s,a,b) {
  const from=s.indexOf(a),to=s.indexOf(b,from+a.length);
  assert.ok(from>=0 && to>from,`${a} -> ${b}`);
  return s.slice(from,to);
}
function setupGeometry() {
  const ctx={W:480, CONFIG:{groundY:214}, game:{pvpSetupSkinIds:['azure','ember']},
    tutorial:{pvpPracticeLayoutIndex:0},
    pvpPlayers:[{index:0,w:22,h:14},{index:1,w:22,h:14}],
    clamp:(n,a,b)=>Math.min(b,Math.max(a,n)),
    resetPvpPlayer:(p,x,dir)=>Object.assign(p,{x,y:200,dir,grounded:true}),
    basePvpScenario(){}, clearScenarioState(){}, addPvpTutorialFly(){}, PVP_START_X:[70,330]
  };
  vm.createContext(ctx);
  vm.runInContext(section(core,'const PARK_PLATFORMS =','const PARK_FLY_SPAWNS'),ctx);
  vm.runInContext(section(config,'const PVP_STEPS =','const PVP_WIN_DIALOGUE'),ctx);
  vm.runInContext(section(scene,'function positionPvp(player','function setPvpAirborne'),ctx);
  vm.runInContext(section(scene,'function positionPvpBonkPracticeLayout','function clearPvpScriptActions'),ctx);
  ctx.setup=(id)=>vm.runInContext(`configurePvpStep(PVP_STEPS.findIndex(s=>s.setup===${JSON.stringify(id)}))`,ctx);
  return ctx;
}

test('Restart Scene cancels a half-finished poof, stale callback, and queued actions synchronously', () => {
  let canceledActionCalls=0, rebuilds=0, clearCount=0;
  const stale=()=>{canceledActionCalls++;};
  const ctx={
    tutorial:{active:true,kind:'pvp',step:18,resetPending:true,resetAt:900000,
      resetAction:stale,deferredPoofOptions:{action:stale},
      resetMessage:'OUTDATED',resetReason:'old-poof',
      resetPreserveFlyKeys:new Set(['old']),resetShowFailure:false,resetArmFlies:false,
      smokeClouds:[{born:1}],pvpScriptActions:[{action:stale}],pvpFlyRevealAt:30000,
      pvpHiddenPlayerIndices:[0,1],pvpFrogsHidden:true,frogHidden:true,
      dialogueHiddenDuringPoof:true,paused:true},
    game:{state:'paused',pvpImpactEffects:[{elapsed:0,duration:0.5}],
      pauseChargeSnapshot:{charge:0.8},resumeChargeAfterCountdown:true,pauseHelpOpen:true},
    clearPvpScriptActions(){this.tutorial.pvpScriptActions.length=0;},
    clearHeldInput(){},resetPvpTutorialTongues(){},
    clearScenarioState(){clearCount++;},
    rebuildCurrentScenarioWithDialogue(){rebuilds++;this.tutorial.dialogueOpen=true;this.game.state='playing';}
  };
  // Mock closures reference context identifiers, not `this`.
  ctx.clearPvpScriptActions=()=>{ctx.tutorial.pvpScriptActions.length=0;};
  ctx.rebuildCurrentScenarioWithDialogue=()=>{rebuilds++;ctx.tutorial.dialogueOpen=true;ctx.game.state='playing';};
  vm.createContext(ctx);
  vm.runInContext(section(lifecycle,'function restartTutorialSceneImmediately','function beginScenarioEntryTransition'),ctx);
  assert.equal(ctx.restartTutorialSceneImmediately(),true);
  assert.equal(ctx.tutorial.resetPending,false);
  assert.equal(ctx.tutorial.resetAction,null);
  assert.equal(ctx.tutorial.deferredPoofOptions,null);
  assert.equal(ctx.tutorial.dialogueHiddenDuringPoof,false);
  assert.equal(ctx.tutorial.smokeClouds.length,0);
  assert.equal(ctx.tutorial.pvpScriptActions.length,0);
  assert.equal(ctx.tutorial.dialogueOpen,true);
  assert.equal(ctx.game.state,'playing');
  assert.equal(ctx.game.pvpImpactEffects.length,0);
  assert.equal(ctx.game.pauseChargeSnapshot,null);
  assert.equal(rebuilds,1);
  assert.equal(clearCount,0); // rebuilding owns the single scenario clear
  assert.equal(canceledActionCalls,0);
  assert.doesNotMatch(section(lifecycle,'function restartTutorialSceneImmediately','function beginScenarioEntryTransition'),/beginPoofTransition\(/);
});

test('Pause Restart Scene resets the suspended clock before constructing new scene',()=>{
  const block=section(hooks,'const originalActivatePauseSelectionForTutorial','function tutorialBlocksLiveInput');
  assert.match(block,/if \(game\.pauseSelection === "restart"\) \{[\s\S]{0,180}tutorialClockSuspendedAt = null/);
  assert.match(block,/restartTutorialSceneImmediately\(\)/);
  assert.doesNotMatch(block,/reason: "tutorial-retry"/);
  assert.match(refinements,/retryScene\(\) \{[\s\S]{0,180}restartTutorialSceneImmediately\(\)/);
});

test('Sky bonk poofs after the second line and skips a second poof at the scenic-route line',()=>{
  const ctx={
    tutorial:{kind:'pvp',resetPending:false,pendingPvpTargetPoses:[{x:144},{x:244}],dialogueHiddenDuringPoof:false},
    POOF_TRANSITION_MS:500,DIALOGUE_SCENE_SETTLE_MS:120,
    performance:{now:()=>1000},
    capturePvpTutorialPoses:()=>[{x:1},{x:2}],
    applyPvpTutorialPoses:(poses)=>{ctx.applied=poses;},
    beginDialogueLine:(index,options)=>{ctx.lines.push({index,options});},
    beginPoofTransition:(options)=>{ctx.poofs.push(options);ctx.tutorial.resetPending=true;return true;},
    tutorialStep:()=>({setup:'pvpDemoSkyBonk'}),
    lines:[],poofs:[]
  };
  vm.createContext(ctx);
  vm.runInContext(section(dialogue,'function beginPvpSkyBonkDialoguePlacement','function armScenarioAfterDialogue'),ctx);
  assert.equal(ctx.beginPvpSkyBonkDialoguePlacement(2),true);
  assert.equal(ctx.lines[0].index,2);
  assert.equal(ctx.lines[0].options.holdPreviousText,false);
  assert.equal(ctx.lines[0].options.delayMs,620);
  assert.equal(ctx.tutorial.dialogueHiddenDuringPoof,true);
  assert.equal(ctx.poofs.length,1);
  assert.equal(ctx.poofs[0].reason,'pvp-sky-bonk-mid-dialogue');
  ctx.poofs[0].action();
  assert.equal(ctx.tutorial.scenePositionedDuringDialogue,true);
  assert.equal(ctx.tutorial.dialogueHiddenDuringPoof,false);
  assert.equal(ctx.applied,ctx.tutorial.pendingPvpTargetPoses===null?ctx.applied:ctx.tutorial.pendingPvpTargetPoses);
  ctx.tutorial.resetPending=false;
  ctx.prepareDialogueLine(3); // Watch me take the scenic route.
  assert.equal(ctx.poofs.length,1);
  assert.equal(ctx.lines.at(-1).index,3);
  const arm=section(dialogue,'function armScenarioAfterDialogue','function closeDialogue');
  assert.match(arm,/skipPoof:keepOpeningPose \|\| tutorial\.scenePositionedDuringDialogue/);
});

test('Sky-bonk positions and charged-jump direction mirror toward the left',()=>{
  const c=setupGeometry();
  c.setup('pvpDemoSkyBonk');
  assert.equal(c.pvpPlayers[1].dir,-1);
  assert.equal(c.pvpPlayers[0].dir,1);
  assert.equal(c.pvpPlayers[0].x+c.pvpPlayers[0].w/2,72);
  assert.equal(c.pvpPlayers[1].x+c.pvpPlayers[1].w/2,240);
  const demo=section(scene,'function beginPvpDemoMotion','function startPvpDemonstration');
  assert.match(demo,/case "pvpDemoSkyBonk":[\s\S]{0,350}scriptPvpChargedJump\(1, 1, -1, 0\)/);
});

test('Buffered sky demonstration faces right toward middle-right; player attempt mirrors the whole layout',()=>{
  const c=setupGeometry();
  c.setup('pvpDemoBufferedSky');
  const demoPositions=c.pvpPlayers.map(p=>({x:p.x,y:p.y,dir:p.dir}));
  assert.equal(demoPositions[1].dir,1);
  assert.equal(demoPositions[1].x,229); // top platform center; facing right
  assert.equal(demoPositions[0].x,331); // nudged slightly left beneath x=281..351
  assert.equal(demoPositions[0].y,200);
  c.setup('pvpBufferedSky');
  assert.equal(c.pvpPlayers[0].dir,-1);
  assert.equal(c.pvpPlayers[0].x,229); // top platform center; facing left
  assert.equal(c.pvpPlayers[1].x,127); // slightly nearer the left-edge wall
  assert.equal(c.pvpPlayers[1].dir,1);
  const demo=section(scene,'function beginPvpDemoMotion','function startPvpDemonstration');
  assert.match(demo,/case "pvpDemoBufferedSky":[\s\S]{0,330}armPvpScriptedBuffer\(1, PARK_PLATFORMS\[6\]\)/);
  assert.match(demo,/case "pvpDemoBufferedSky":[\s\S]{0,350}scriptPvpChargedJump\(1, 1, 1, 0\)/);
});

test('Tutorial HUD has no round-win crowns; Ember keeps her crown skin',()=>{
  const block=section(hud,'function drawPvpHud','function getPvpRoundAchievementDefinitions');
  assert.match(block,/if \(!tutorialPvp\) \{[\s\S]{0,185}drawPvpCrown/);
  assert.match(read('client/game/126-tutorial-hooks.js'),/return \{ \.\.\.palette, hat:"crown" \}/);
});

test('Ember restarts typewriter speech sounds for each new line and suppresses hidden poof dialogue',()=>{
  const ctx={tutorial:{dialogueLineIndex:0,dialogueTalkCharCount:127,dialogueTalkBlipAt:9999},
    performance:{now:()=>1000},currentDialogueLine:()=>"Old sentence",currentEmberPortraitKey:()=>"happy",
    resetDialogueSpaceHold:()=>{}};
  vm.createContext(ctx);
  vm.runInContext(section(dialogue,'function beginDialogueLine','function openDialogue'),ctx);
  ctx.beginDialogueLine(0,{delayMs:620,holdPreviousText:false});
  assert.equal(ctx.tutorial.dialogueTalkCharCount,0);
  assert.equal(ctx.tutorial.dialogueTalkBlipAt,1000);
  assert.equal(ctx.tutorial.dialogueLineStartedAt,1620);
  assert.match(rendering,/visibleCount > tutorial\.dialogueTalkCharCount/);
  assert.match(rendering,/tone\(frequency, 0\.026, 0\.011, 20\)/);
  assert.match(rendering,/tutorial\.dialogueHiddenDuringPoof \|\| game\.state === "countdown"/);
});

// A lightweight numeric check follows the game's own Euler update formula and
// real Park platform coordinates. It checks that mirrored scripted jumps can
// actually reach their waiting frogs (and that the buffer lane is crossed).
test('Full-charge sky demos reach the mirrored bonk targets and buffered platform',()=>{
  function descendingContact({x:initialX,dir,power,targetX,targetY,platform}) {
    const gravity=820,w=22,h=14,dt=1/120;
    let x=initialX,y=56;
    let vx=dir*(120+115*power),vy=-463*power;
    let crossedBuffer=false;
    for(let n=0;n<400;n++){
      const previousBottom=y+h;
      vy+=gravity*dt;
      x+=vx*dt;
      y+=vy*dt;
      if(x<=0){x=0;vx=Math.abs(vx);}
      if(x+w>=480){x=480-w;vx=-Math.abs(vx);}
      if(vy>0 && platform && previousBottom<=platform.y && y+h>=platform.y &&
         x+w>platform.x && x<platform.x+platform.w) crossedBuffer=true;
      if(vy>0 && previousBottom<=targetY && y+h>=targetY){
        return {overlap:x+w*.78>targetX&&x+w*.22<targetX+w,crossedBuffer,x};
      }
    }
    return {overlap:false,crossedBuffer};
  }
  const left=descendingContact({x:229,dir:-1,power:1,targetX:61,targetY:155});
  assert.equal(left.overlap,true,'mirrored sky bonk should descend onto P1');
  const right=descendingContact({x:248,dir:1,power:1,targetX:337,targetY:200,
    platform:{x:372,y:169,w:72}});
  assert.equal(right.crossedBuffer,true,'buffered sky demo must actually cross the lower-right platform');
  assert.equal(right.overlap,true,'buffered sky demo must descend onto the waiting frog');
});
