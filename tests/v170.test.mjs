import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

test("v1.7.6 engine tutorial project additions exist",()=>{
  for(const p of [
    "client/game/99-v170-hooks.js",
    "client/game/120-engine-tutorial.js",
    "public/scripts/rr-170-polish.js",
    "public/scripts/rr-170-online.js",
    "public/styles/rr-170.css",
    "public/tutorial/ember-confident.png",
    "public/tutorial/ember-smile.png",
    "public/tutorial/ember-cool.png",
    "public/tutorial/ember-laughing.png",
    "public/tutorial/ember-thinking.png"
  ])assert.ok(existsSync(new URL(`../${p}`,import.meta.url)),p);
  assert.equal(JSON.parse(read("package.json")).version,"1.7.6");
});

test("tutorial uses the real Park engine instead of a popup practice canvas",()=>{
  const engine=read("client/game/120-engine-tutorial.js");
  const polish=read("public/scripts/rr-170-polish.js");
  for(const word of [
    "WELCOME TO RIBBIT RACE",
    "FINAL PRACTICE ROUND",
    "resetGame(true)",
    'game.selectedLevelId = "park"',
    "CURRENT GOAL"
  ])assert.match(engine,new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  assert.doesNotMatch(polish,/rr170-tutorial-canvas|rr170-tutorial-shell|Tutorial\.open/);
  assert.doesNotMatch(polish,/rr170-solo-tutorial|rr170-pvp-tutorial/);
});

test("mobile touch support remains present",()=>{
  const s=read("public/scripts/rr-170-polish.js");
  for(const word of ["rr170-touch-left","rr170-touch-right","rr170-pause"])
    assert.match(s,new RegExp(word));
});

test("spectator picker remains available without a floating live-matches button",()=>{
  const s=read("public/scripts/rr-170-online.js");
  assert.match(s,/apiListLiveMatches/);
  assert.match(read("src/hub.js"),/apiLiveMatchHeartbeat/);
  assert.doesNotMatch(s,/installSpectateButton|spectatorButton/);
  assert.match(s,/installCanvasSpectateIntercept/);
});

test("safety guards are present",()=>{
  const s=read("client/game/99-v170-hooks.js");
  assert.match(s,/closeCallEligible/);
  assert.match(s,/recentCatchKeys/);
  assert.match(s,/unlockBeanieFallback/);
});

test("tutorial hides legacy floating controls and preserves cloud progress",()=>{
  const engine=read("client/game/120-engine-tutorial.js");
  const polish=read("public/scripts/rr-170-polish.js");
  const css=read("public/styles/rr-170.css");
  assert.match(engine,/beginPlaytestSession/);
  assert.match(engine,/restorePlaytestSnapshot/);
  assert.match(engine,/endPlaytestSession/);
  assert.match(polish,/tutorialActive\(\)/);
  assert.match(polish,/medal\.hidden = inTutorial/);
  assert.match(css,/\.rr170-button\[hidden\]/);
  assert.match(css,/display:\s*none\s*!important/);
});


test("1.7.6 tutorial uses Ember speech bubbles and authored engine checks",()=>{
  const engine=read("client/game/120-engine-tutorial.js");
  for(const word of [
    'FROG_SKINS.ember',
    'drawTutorialDialogue',
    'drawCurrentGoalHud',
    'DOUBLE BUFFER DROP',
    'chooseVictoryMessage("park")',
    'tutorial-graduate',
    'THE TUTORIAL CANNOT BE PAUSED'
  ]) assert.match(engine,new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  assert.doesNotMatch(engine,/COMPLETE THE SCENARIO/);
});

test("tutorial scenarios enforce requested one-attempt and platform layouts",()=>{
  const engine=read("client/game/120-engine-tutorial.js");
  assert.match(engine,/oneAttempt:\s*true/);
  assert.match(engine,/platforms = cloneParkPlatforms\(\)/);
  assert.match(engine,/makeParkFly\(4, 0, 0\)/);
  assert.match(engine,/bufferedPlatforms\.size\s*>=\s*2/);
  assert.match(engine,/CATCH ALL THREE FLIES/);
  assert.match(engine,/positionSoloFrog\(350/);
});

test("tutorial completion achievement is registered in the shared gallery",()=>{
  const core=read("client/game/10-core-config.js");
  assert.match(core,/id:\s*"tutorial-graduate"/);
  assert.match(core,/name:\s*"RIBBIT READY"/);
  assert.match(core,/"level-garden","tutorial-graduate"/);
});


test("Ember dialogue is right-sided, modal, and closes on Space before play resumes",()=>{
  const engine=read("client/game/120-engine-tutorial.js");
  for(const word of [
    "EMBER_PORTRAIT_SOURCES",
    "dialogueOpen",
    "SPACE TO PLAY",
    "TAP TO PLAY",
    "blockJumpUntilRelease",
    "closeDialogue",
    'portrait: "smile"',
    "HEY THERE! I'M EMBER. WELCOME TO RIBBIT RACE!"
  ]) assert.match(engine,new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  assert.match(engine,/const portrait = \{ x: 399/);
  assert.match(engine,/if \(tutorial\.active && tutorial\.dialogueOpen\)/);
  assert.match(engine,/armScenarioAfterDialogue\(\)/);
});
