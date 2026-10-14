import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source = (id) => readFileSync(new URL(`../client/game/${id}`, import.meta.url), 'utf8');
const dialogueSource = source('121-tutorial-runtime-dialogue.js');
const renderSource = source('125-tutorial-rendering.js');
const lifecycleSource = source('123-tutorial-lifecycle.js');
const monitorSource = source('124-tutorial-monitoring.js');

function extract(sourceText, start, end) {
  const a=sourceText.indexOf(start);
  const b=sourceText.indexOf(end,a+start.length);
  assert.ok(a>=0 && b>a, `must locate ${start} and ${end}`);
  return sourceText.slice(a,b);
}
function makeFly(vocabIndex, tutorialArmed=false) {
  return { state:'active', tutorialAuthored:true, tutorialArmed, vocabIndex, spawnAge:-.08 };
}

function makePromptHarness(kind='pvp',setup='pvpDemoReboundCatch') {
  let promptDraws=0;
  let blankDraws=0;
  const labels=[];
  const state = {
    tutorial:{active:true,kind,dialogueOpen:false,resetPending:false,preservePromptDuringReset:false,
      promptHidden:false,rangeTongueCaught:false},
    game:{state:'playing',sandboxMode:false,winPending:false,targetVocabIndex:0,soloCriticalCatchActive:false},
    flies:[],tongue:{active:false},W:480,
    ctx:{fillRect(){},set fillStyle(_color){}},COLORS:{ink:'#223',white:'#fff'},
    getSelectedSkin:()=>({mid:'#f55',dark:'#b33'}),
    drawBitmapText:(text)=>labels.push(text),
    drawVocabularyPrompt:()=>{promptDraws+=1;},
    tutorialStep:()=>({setup}),tutorialPlayerHasControl:()=>true,
    setPrompt(index){state.game.targetVocabIndex=index;},
    Number,Math,Array,Boolean
  };
  vm.createContext(state);
  const flyFunction=extract(dialogueSource,'function tutorialDisplayedFlies() {','function armTutorialFlies(');
  const promptFunctions=renderSource.slice(renderSource.indexOf('function drawBlankTutorialVocabularyPrompt()'));
  vm.runInContext(flyFunction+'\n'+promptFunctions,state);
  return {state,labels,draw:()=>state.drawVocabularyPrompt(),stats:()=>({promptDraws,blankDraws})};
}

test('clue waits for real tutorial fly poof while its FIND THE MATCH frame remains visible',()=>{
  const h=makePromptHarness();
  h.state.flies.push(makeFly(0,false));
  h.draw();
  assert.equal(h.stats().promptDraws,0,'unarmed fly must not reveal English text');
  assert.ok(h.labels.includes('FIND THE MATCH'),'HUD frame stays visible before spawn');
  h.state.flies[0].tutorialArmed=true;
  h.draw();
  assert.equal(h.stats().promptDraws,1,'the clue appears as soon as fly poofs in');
});

test('hidden target never appears early if a different authored fly is already on-screen',()=>{
  const h=makePromptHarness();
  h.state.flies.push(makeFly(0,false),makeFly(3,true));
  h.draw();
  assert.equal(h.state.game.targetVocabIndex,3,'matches spawned fly, not still-hidden fly');
  assert.equal(h.stats().promptDraws,1);
});

test('the final Versus tutorial match is blank until real flies spawn, and solo explanation also waits',()=>{
  const final=makePromptHarness('pvp','pvpFinalMatch');
  final.draw();
  assert.equal(final.stats().promptDraws,0);
  assert.ok(final.labels.includes('FIND THE MATCH'));
  final.state.flies.push({state:'active',vocabIndex:2});
  final.draw();
  assert.equal(final.stats().promptDraws,1);
  assert.equal(final.state.game.targetVocabIndex,2);
  const solo=makePromptHarness('solo','threeCatches');
  solo.state.tutorial.dialogueOpen=true;
  solo.state.flies.push(makeFly(0,false));
  solo.draw();
  assert.equal(solo.stats().promptDraws,0);
  solo.state.flies[0].tutorialArmed=true;
  solo.draw();
  assert.equal(solo.stats().promptDraws,1);
});

test('both dialogue-opening paths clear WATCH EMBER and YOUR TURN immediately',()=>{
  const fragment=extract(dialogueSource,'function clearPvpCaptionForDialogue() {','function tutorialFlyKey(');
  const ctx={
    tutorial:{kind:'pvp',pvpCaption:'YOUR TURN!',pvpCaptionUntil:9999},
    game:{state:'playing'},performance:{now:()=>1000},
    beginDialogueLine:()=>{},clearHeldInput:()=>{},freezeControlledEntity:()=>{},
    resetDialogueSpaceHold:()=>{},drawScene:()=>{},
    window:{},Number,Array,Math,Boolean
  };
  vm.createContext(ctx);vm.runInContext(fragment,ctx);
  ctx.openDialogue();
  assert.equal(ctx.tutorial.dialogueOpen,true);
  assert.equal(ctx.tutorial.pvpCaption,'');
  assert.equal(ctx.tutorial.pvpCaptionUntil,0);
  ctx.tutorial.pvpCaption='WATCH EMBER!';ctx.tutorial.pvpCaptionUntil=9999;
  ctx.openDynamicDialogue(['Well done!']);
  assert.equal(ctx.tutorial.pvpCaption,'');
  assert.equal(ctx.tutorial.pvpCaptionUntil,0);
  assert.match(lifecycleSource,/if \(showDialogue\) clearPvpCaptionForDialogue\(\);/,
    'chapter transitions also clear the caption BEFORE the new dialogue is visible');
});

test('How’s the weather down there? begins exactly 1000 ms after the post-transition poof',()=>{
  let now=1000;let scheduled=null;
  let poofAction=null;
  const ctx={
    tutorial:{kind:'pvp',dialogueOpen:false,step:0,pvpCaption:'WATCH EMBER!',pvpCaptionUntil:8000,
      smokeClouds:[],pvpHiddenPlayerIndices:[]},
    game:{state:'playing',pauseHelpOpen:false},
    POOF_TRANSITION_MS:500,performance:{now:()=>now},
    tutorialStep:()=>({setup:'pvpDemoDropHigh'}),
    configurePvpStep:()=>{},captureControlledPose:()=>({x:200}),
    capturePvpTutorialPoses:()=>[{x:20,y:100},{x:90,y:150}],
    applyPvpTutorialPoses:()=>{},freezeControlledEntity:()=>{},
    restoreStepSequence:()=>{},clearPvpCaptionForDialogue(){ctx.tutorial.pvpCaption='';ctx.tutorial.pvpCaptionUntil=0;},
    pvpAtIntendedPositions:()=>false,
    beginDialogueLine:(_index,options)=>{scheduled=now+options.delayMs;assert.equal(options.holdPreviousText,false);},
    beginPoofTransition:(options)=>{poofAction=options.action;return true;},
    openDialogue:()=>{},Array,Boolean,Number,Math
  };
  vm.createContext(ctx);
  const configure=extract(lifecycleSource,'function configureStep(showDialogue = true, options = {}) {','function pvpAtIntendedPositions(');
  vm.runInContext(configure,ctx);
  ctx.configureStep(true,{preservePvpVisualPoses:[{x:5,y:200},{x:400,y:200}]});
  assert.equal(ctx.tutorial.pvpCaption,'','banner hidden at scene switch');
  assert.equal(ctx.tutorial.dialogueOpen,true);
  assert.ok(poofAction);
  now+=500; poofAction();
  assert.equal(scheduled-now,1000,'one entire second after frogs reappear');
  assert.match(renderSource,/if \(!holdingPreviousLine && now < tutorial\.dialogueLineStartedAt\) return;/,
    'the dialogue card itself does not draw during this wait');
  assert.match(source('120-tutorial-config.js'),/"How's the weather down there\?"/);
});

test('tutorial monitoring only considers flies armed on screen, not pending fly spawns',()=>{
  assert.match(monitorSource,/const visible = tutorialDisplayedFlies\(\)/);
  assert.match(dialogueSource,/\(!fly\.tutorialAuthored \|\| fly\.tutorialArmed !== false\)/);
  assert.match(source('122-tutorial-scenarios.js'),/tutorial\.pvpFlyRevealAt = performance\.now\(\) \+ safeDelay/);
});
