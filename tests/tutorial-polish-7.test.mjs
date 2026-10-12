import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = read("client/game/120-engine-tutorial.js");
const ui = read("client/game/40-ui-navigation-audio.js");
const index = read("public/index.html");

function block(start, end) {
  const from = engine.indexOf(start);
  assert.ok(from >= 0, `Missing start marker: ${start}`);
  const to = engine.indexOf(end, from);
  assert.ok(to >= 0, `Missing end marker: ${end}`);
  return engine.slice(from, to);
}

test("polish-9 cache marker forces the rebuilt tutorial and Versus lesson UI to load", () => {
  assert.match(engine, /2026\.10\.12-friends-polish-14/);
  assert.match(index, /game\.bundle\.js\?v=2026\.10\.12-friends-polish-14/);
});

test("dialogue uses the new reference framing and keeps Ember's full square unobstructed", () => {
  const dialogue = block("function drawTutorialDialogue", "function drawTutorialStatus");
  assert.match(dialogue, /const textPanel = \{ x: 90, y: 6, w: 250, h: 50 \}/);
  assert.match(dialogue, /const portraitPanel = \{ x: 338, y: 6, w: 54, h: 54 \}/);
  assert.match(dialogue, /drawReferencePanel\(textPanel, "#0b4462", "#052b43"\)/);
  assert.match(dialogue, /drawReferencePanel\(portraitPanel, "#159ee4", "#087cc5"\)/);
  assert.match(dialogue, /const imageSize = portraitPanel\.w - 10/);
  assert.match(dialogue, /const fit = Math\.min\(imageSize \/ sourceW, imageSize \/ sourceH\)/);
  assert.match(dialogue, /const namePlate = \{ x:textPanel\.x \+ 8, y:textPanel\.y \+ 7, w:48, h:10 \}/);
  assert.match(dialogue, /drawBitmapText\("EMBER", namePlate\.x \+ namePlate\.w \/ 2, namePlate\.y \+ 2, \.58, "center"/);
});

test("pause panel renders above an active Ember dialogue", () => {
  assert.match(engine, /drawSoloPauseOverlay = function[\s\S]{0,180}drawTutorialDialogue\(\)[\s\S]{0,160}originalDrawSoloPauseOverlayForTutorial/);
  assert.match(engine, /if \(game\.state === "paused"\) \{[\s\S]{0,100}drawCurrentGoalHud\(\)/);
});

test("tongue tutorial moves both frog and fly down from the old platform setup", () => {
  const range = engine.slice(engine.indexOf('case "rangeCatch"'), engine.indexOf('case "wrongFly"'));
  assert.match(range, /positionSoloFrog\(getNormalParkStartX\(\), CONFIG\.groundY - frog\.h, 1\)/);
  assert.match(range, /const targetPlatform = platforms\[5\]/);
  assert.match(range, /const targetX = Math\.round\(targetPlatform\.x \+ targetPlatform\.w \/ 2\)/);
  assert.match(range, /const targetY = Math\.round\(platforms\[5\]\.y - \(platforms\[5\]\.y - platforms\[4\]\.y\) \* 0\.40\)/);
  assert.match(range, /makeFly\(targetX, targetY, 0, 4\)/);
});

test("wrong-fly pair stays hidden through Ember's explanation and appears with the closing poof", () => {
  const wrong = engine.slice(engine.indexOf('case "wrongFly"'), engine.indexOf('case "comboMixed"'));
  assert.match(wrong, /makeFly\(315, 108, tutorial\.wrongFlyOriginalVocabIndex, 0\)/);
  assert.match(wrong, /makeFly\(390, 150, tutorial\.wrongFlyPromptIndex, 1\)/);
  const configure = block("function configureStep", "function addTutorialPoof");
  assert.doesNotMatch(configure, /armTutorialFlies\(\{ revealPrompt: false \}\)/);
  const arm = block("function armScenarioAfterDialogue", "function closeDialogue");
  assert.match(arm, /beginScenarioEntryTransition\(\)/);
  assert.doesNotMatch(engine, /"This time, catch a fly that doesn't match\."/);
});

test("buffered jump charge lesson precedes platform-drop buffering", () => {
  assert.match(engine, /title: "BUFFER A JUMP"[\s\S]{0,500}touch the ground/);
  assert.match(engine, /setup: "bufferJumpCharge"/);
  assert.match(engine, /landedThisFrame[\s\S]{0,240}bufferedJumpChainCount = game\.buttonHeld \? 1 : 0/);
  assert.match(engine, /bufferedJumpChainCount >= 1 && tutorial\.bufferedJumpReleased/);
  assert.match(engine, /BUFFERED JUMP/);
  assert.match(engine, /All you have to do is TAP jump just before landing\./);
  assert.match(engine, /All you have to do is TAP jump just before each landing\./);
});

test("buffered-drop placements are centered and triple-buffer starts bottom-left", () => {
  assert.match(engine, /case "bufferDrop":[\s\S]{0,220}makeFly\(408, 150, 0, 0\)/);
  assert.match(engine, /case "doubleBuffer":[\s\S]{0,160}positionCenteredOnPlatform\(platforms\[1\], 1\)/);
  assert.match(engine, /setup === "doubleBuffer"[\s\S]{0,100}failAttempt\("START WITH A CHARGED JUMP"\)/);
});

test("Solo tutorial book mirrors the clock across the 480-pixel screen", () => {
  assert.match(ui, /tutorialButton: Object\.freeze\(\{ id: "tutorial", x: 47, y: 211, w: 24, h: 24 \}\)/);
  assert.match(ui, /timeButton: Object\.freeze\(\{ x: 409, y: 211, w: 24, h: 24 \}\)/);
  assert.equal(47, 480 - 409 - 24);
});

test("English clue is ready during its explanation and match count is capped", () => {
  assert.match(engine, /function tutorialPromptVisibleDuringDialogue/);
  assert.match(engine, /tutorial\.dialogueLineIndex >= 3/);
  assert.match(engine, /Math\.min\(3, tutorial\.sceneCatchCount\)/);
  assert.match(engine, /sceneCatchCount = Math\.min\(3, tutorial\.sceneCatchCount \+ 1\)/);
});

test("Current Goal trophy is centered from the header to the lower border", () => {
  assert.match(engine, /const contentTop = y \+ 16/);
  assert.match(engine, /const contentBottom = y \+ h - 3/);
  assert.match(engine, /const trophyTop = Math\.round\(contentTop \+ \(contentBottom - contentTop - trophyHeight\) \/ 2\)/);
});


test("polish-9 centers the drop frog, moves buffer-drop start to ground, and changes the second smooth line", () => {
  assert.match(engine, /case "quickDrop":[\s\S]{0,140}positionCenteredOnPlatform\(platforms\[2\], 1\)/);
  assert.match(engine, /case "bufferDrop":[\s\S]{0,260}platforms\[2\]\.x \+ Math\.round\(\(platforms\[2\]\.w - frog\.w\) \/ 2\)[\s\S]{0,100}CONFIG\.groundY - frog\.h/);
  assert.match(engine, /"Dropping it like it's hot!"/);
  assert.match(engine, /"You don't have to land right on top of a fly to catch it\."/);
});

test("final practice opens one Ember closing line before the custom one-button completion screen", () => {
  assert.match(engine, /FINAL_TUTORIAL_DIALOGUE = Object\.freeze/);
  assert.match(engine, /"You did it, tadpole! You're officially Ribbit Ready!"/);
  assert.match(engine, /completeWin = function[\s\S]{0,260}beginFinalTutorialMessage\(\)/);
  assert.match(engine, /if \(tutorial\.finalDialogueActive\)[\s\S]{0,160}beginCompletionScreen\(\)/);
  assert.match(engine, /const title = "TUTORIAL COMPLETE!"/);
  assert.match(engine, /replayButton: \{ x: -300/);
  assert.match(engine, /homeButton: \{ x: Math\.round\(W \/ 2 - 60\)/);
});
