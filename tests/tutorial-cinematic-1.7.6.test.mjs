import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = read("client/game/120-engine-tutorial.js");

test("1.7.6 cinematic tutorial build and first-boot marker are installed", () => {
  assert.equal(JSON.parse(read("package.json")).version, "1.7.6");
  assert.match(read("src/common.js"), /2026\.10\.11-friends-tutorial-cinematic-1/);
  assert.match(engine, /rrFriendsEngineTutorialSoloSeenV6/);
});

test("Ember portraits preload before tutorial start and never fall back to the gameplay frog", () => {
  assert.match(engine, /EMBER_PORTRAITS_READY/);
  assert.match(engine, /emberPortraitsReady/);
  assert.match(engine, /Never substitute the small gameplay frog/);
  const block = engine.slice(engine.indexOf("function drawTutorialDialogue"), engine.indexOf("function drawTutorialStatus"));
  assert.doesNotMatch(block, /drawGameplayFrogSpriteLocal/);
});

test("dialogue advances one fitted line at a time", () => {
  assert.match(engine, /dialogueLineIndex/);
  assert.match(engine, /measureBitmapText\(line, 1\)/);
  assert.match(engine, /SPACE FOR NEXT/);
  assert.match(engine, /SPACE TO PLAY/);
  assert.match(engine, /tutorial\.dialogueLineIndex \+= 1/);
});

test("tutorial flies stay hidden during dialogue and spawn with the normal sparkle afterwards", () => {
  assert.match(engine, /tutorialArmed:false/);
  assert.match(engine, /spawnAge:-0\.08/);
  assert.match(engine, /function armTutorialFlies/);
  assert.match(engine, /currentFly\.spawnAge = 0/);
  assert.match(engine, /playFlySpawnSound/);
  assert.match(engine, /originalDrawFlySpawnSparksForTutorial/);
});

test("failed attempts use two poofs separated by half a second", () => {
  assert.match(engine, /tutorial\.resetAt = performance\.now\(\) \+ 500/);
  assert.match(engine, /playTutorialPoofSound\("out"\)/);
  assert.match(engine, /playTutorialPoofSound\("in"\)/);
  assert.match(engine, /tutorial\.frogHidden = true/);
  assert.match(engine, /completePendingReset/);
});

test("undercharged max jumps wait until landing before resetting", () => {
  const launch = engine.slice(engine.indexOf("launchJump = function"), engine.indexOf("// Hide the normal first-jump"));
  assert.doesNotMatch(launch, /setup === "maxJump"/);
  assert.match(engine, /step === "maxJump"[\s\S]{0,250}else if \(attemptEnded\) failAttempt/);
});

test("tongue lesson uses a normal upper Park spawn and blocks body completion", () => {
  assert.match(engine, /case "rangeCatch"[\s\S]{0,500}makeParkFly\(4, 0, 0\)/);
  assert.match(engine, /activeSetup === "rangeCatch" && wasCorrect && source !== "tongue"/);
  assert.match(engine, /source === "tongue"\) tutorial\.rangeTongueCaught = true/);
});

test("wrong-fly lesson uses normal Park spawns and rejects the wrong order", () => {
  assert.match(engine, /case "wrongFly"[\s\S]{0,350}makeParkFly\(3, 1, 0\)/);
  assert.match(engine, /makeParkFly\(2, 0, 1\)/);
  assert.match(engine, /tutorial\.wrongOrderInvalid = true/);
});

test("drop tutorials retain the original Park platform geometry", () => {
  for (const setup of ["quickDrop", "bufferDrop", "doubleBuffer"]) {
    const index = engine.indexOf(`case "${setup}"`);
    assert.ok(index >= 0, setup);
    assert.match(engine.slice(index, index + 850), /platforms = cloneParkPlatforms\(\)/, setup);
  }
  assert.match(engine, /makeParkFly\(7, 0, 0\)/);
  assert.match(engine, /makeParkFly\(4, 0, 0\)/);
  assert.match(engine, /makeParkFly\(2, 0, 0\)[\s\S]{0,200}makeParkFly\(4, 1, 1\)[\s\S]{0,200}makeParkFly\(6, 2, 2\)/);
});

test("current goal uses a trophy panel and owns the failure flash", () => {
  assert.match(engine, /drawPixelTrophy\(x \+ 14/);
  assert.match(engine, /failureFlashStartedAt/);
  assert.match(engine, /ctx\.fillStyle = "#d92727"/);
  const overlay = engine.slice(engine.indexOf("function drawTutorialOverlay"), engine.indexOf("function drawCompletionScreen"));
  assert.ok(overlay.indexOf("drawCurrentGoalHud()") < overlay.indexOf("drawTutorialDialogue()"));
  const status = engine.slice(engine.indexOf("function drawTutorialStatus"), engine.indexOf("function drawTutorialSmoke"));
  assert.doesNotMatch(status, /failureText/);
});

test("tutorial completion reuses the normal Single Player victory screen and jingle", () => {
  assert.match(engine, /game\.state === "won"[\s\S]{0,100}beginCompletionScreen\(\)/);
  assert.match(engine, /const alreadyWon = game\.state === "won"/);
  assert.match(engine, /chooseVictoryMessage\("park"\)/);
  assert.match(engine, /playWinSound\(\)/);
  assert.match(engine, /The tutorial now uses Ribbit Race's normal Single Player victory screen/);
});
