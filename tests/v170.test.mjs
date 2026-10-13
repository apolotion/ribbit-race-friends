import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

test("v1.7.14 engine tutorial project additions exist",()=>{
  for(const p of [
    "client/game/115-v170-hooks.js",
    "client/game/120-tutorial-config.js",
    "public/scripts/rr-170-polish.js",
    "public/scripts/rr-170-online.js",
    "public/styles/rr-170.css",
    "public/tutorial/ember-confident.png",
    "public/tutorial/ember-smile.png",
    "public/tutorial/ember-cool.png",
    "public/tutorial/ember-laughing.png",
    "public/tutorial/ember-thinking.png"
  ])assert.ok(existsSync(new URL(`../${p}`,import.meta.url)),p);
  assert.equal(JSON.parse(read("package.json")).version,"1.7.14");
});

test("tutorial uses the real Park engine instead of a popup practice canvas",()=>{
  const engine=readGameModuleGroup(120, 139);
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
  const s=read("client/game/115-v170-hooks.js");
  assert.match(s,/closeCallEligible/);
  assert.match(s,/recentCatchKeys/);
  assert.match(s,/unlockBeanieFallback/);
});

test("tutorial hides legacy floating controls and preserves cloud progress",()=>{
  const engine=readGameModuleGroup(120, 139);
  const polish=read("public/scripts/rr-170-polish.js");
  const css=read("public/styles/rr-170.css");
  assert.match(engine,/beginPlaytestSession/);
  assert.match(engine,/restorePlaytestSnapshot/);
  assert.match(engine,/endPlaytestSession/);
  assert.match(polish,/tutorialActive\(\)/);
  assert.match(polish,/rr170-achievement-leaderboard/);
  assert.doesNotMatch(polish,/medal\.hidden = inTutorial/);
  assert.match(css,/\.rr170-button\[hidden\]/);
  assert.match(css,/display:\s*none\s*!important/);
});

test("1.7.14 tutorial uses Ember dialogue, checked engine scenes, and a working pause menu",()=>{
  const engine=readGameModuleGroup(120, 139);
  for(const word of [
    'FROG_SKINS.ember',
    'drawTutorialDialogue',
    'drawCurrentGoalHud',
    'DOUBLE BUFFER DROP',
    'FINAL_TUTORIAL_DIALOGUE',
    'TUTORIAL COMPLETE!',
    'tutorial-graduate',
    'drawTutorialPauseOverlay',
    'getTutorialPauseChapterRects'
  ]) assert.match(engine,new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  assert.match(read("client/game/73-rendering-menus-overlays.js"), /"RESTART SCENE"[\s\S]*?"EXIT TUTORIAL"/);
  assert.doesNotMatch(engine,/COMPLETE THE SCENARIO|THE TUTORIAL CANNOT BE PAUSED/);
});

test("tutorial scenarios use Park layouts and reachable authored fly placement",()=>{
  const engine=readGameModuleGroup(120, 139);
  assert.match(engine,/oneAttempt:\s*true/);
  assert.match(engine,/platforms = cloneParkPlatforms\(\)/);
  assert.match(engine,/positionSoloFrog\(getNormalParkStartX\(\), CONFIG\.groundY - frog\.h, 1\)/);
  assert.match(engine,/makeFly\(targetX, targetY, 0, 4\)/);
  assert.match(engine,/makeFly\(240, 108, 1, 1\)/);
  assert.match(engine,/bufferEventCount >= 2/);
  assert.match(engine,/catch all three matching flies before you land!/i);
  assert.match(engine,/positionSoloFrog\(350/);
});

test("tutorial completion achievement is registered in the shared gallery",()=>{
  const core=read("client/game/10-core-config.js");
  assert.match(core,/id:\s*"tutorial-graduate"/);
  assert.match(core,/name:\s*"RIBBIT READY"/);
  assert.match(core,/"level-garden","tutorial-graduate"/);
});

test("Ember dialogue is modal, left-aligned, and uses a down triangle instead of text prompts",()=>{
  const engine=readGameModuleGroup(120, 139);
  for(const word of [
    "EMBER_PORTRAIT_SOURCES",
    "EMBER_PORTRAIT_SEQUENCE_BY_SETUP",
    "dialogueOpen",
    "drawDialogueContinueTriangle",
    "dialogueSpaceHeld",
    "closeDialogue",
    'portrait: "happy"',
    "Hey there, tadpole! Welcome to Ribbit Race!"
  ]) assert.match(engine,new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  assert.match(engine,/const portraitPanel = \{ x: 335/);
  assert.match(engine,/drawEmberDialogueLine\([\s\S]{0,160}textArea\.x/);
  assert.match(engine,/if \(tutorial\.active && tutorial\.dialogueOpen && game\.state !== "paused"/);
  assert.match(engine,/armScenarioAfterDialogue\(\)/);
  assert.doesNotMatch(engine,/SPACE TO PLAY|TAP TO PLAY|SPACE FOR NEXT|TAP FOR NEXT/);
});
