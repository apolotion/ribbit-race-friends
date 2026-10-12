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

test("polish-6 cache marker forces the rebuilt tutorial UI to load", () => {
  assert.match(engine, /2026\.10\.12-friends-tutorial-polish-6/);
  assert.match(index, /game\.bundle\.js\?v=2026\.10\.12-tutorial-polish-6/);
});

test("dialogue uses the requested baseline framing and compact Ember nameplate", () => {
  const dialogue = block("function drawTutorialDialogue", "function drawTutorialStatus");
  assert.match(dialogue, /const textPanel = \{ x: 92, y: 7, w: 246, h: 46 \}/);
  assert.match(dialogue, /const portraitPanel = \{ x: 340, y: 7, w: 50, h: 52 \}/);
  assert.match(dialogue, /drawBaselinePanel\(textPanel, "#07364e"\)/);
  assert.match(dialogue, /drawBaselinePanel\(portraitPanel, "#168fce"\)/);
  assert.match(dialogue, /const nameH = 8/);
  assert.match(dialogue, /drawBitmapText\("EMBER"[\s\S]{0,100}\.61, "center"/);
});

test("pause panel renders above an active Ember dialogue", () => {
  assert.match(engine, /drawSoloPauseOverlay = function[\s\S]{0,180}drawTutorialDialogue\(\)[\s\S]{0,120}originalDrawSoloPauseOverlayForTutorial/);
  assert.match(engine, /if \(!tutorial\.active \|\| game\.state === "paused" \|\| game\.state === "countdown"\) return/);
});

test("tongue tutorial moves both frog and fly down from the old platform setup", () => {
  const range = engine.slice(engine.indexOf('case "rangeCatch"'), engine.indexOf('case "wrongFly"'));
  assert.match(range, /const oldY = platforms\[1\]\.y - frog\.h/);
  assert.match(range, /const newY = CONFIG\.groundY - frog\.h/);
  assert.match(range, /const deltaY = newY - oldY/);
  assert.match(range, /positionSoloFrog\(getNormalParkStartX\(\), CONFIG\.groundY - frog\.h, 1\)/);
  assert.match(range, /makeFly\(324, 38 \+ deltaY, 0, 4\)/);
});

test("wrong-fly lesson begins with both targets already present", () => {
  const wrong = engine.slice(engine.indexOf('case "wrongFly"'), engine.indexOf('case "comboMixed"'));
  assert.match(wrong, /makeFly\(315, 108, tutorial\.wrongFlyOriginalVocabIndex, 0\)/);
  assert.match(wrong, /makeFly\(390, 150, tutorial\.wrongFlyPromptIndex, 1\)/);
  assert.match(engine, /armTutorialFlies\(\{ revealPrompt: false \}\)/);
  assert.doesNotMatch(engine, /"This time, catch a fly that doesn't match\."/);
});

test("buffered jump charge lesson precedes platform-drop buffering", () => {
  assert.match(engine, /title: "BUFFER A JUMP"[\s\S]{0,500}touch the ground/);
  assert.match(engine, /setup: "bufferJumpCharge"/);
  assert.match(engine, /landedThisFrame[\s\S]{0,240}game\.buttonHeld[\s\S]{0,120}bufferedJumpChainCount \+ 1/);
  assert.match(engine, /BUFFERED JUMPS/);
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
  assert.match(engine, /Math\.min\(3, tutorial\.sceneCatchCount \+ \(tutorial\.sceneAttemptCaught \? 1 : 0\)\)/);
});

test("Current Goal trophy is centered from the header to the lower border", () => {
  assert.match(engine, /const contentTop = y \+ 16/);
  assert.match(engine, /const contentBottom = y \+ h - 3/);
  assert.match(engine, /const trophyTop = Math\.round\(contentTop \+ \(contentBottom - contentTop - trophyHeight\) \/ 2\)/);
});
