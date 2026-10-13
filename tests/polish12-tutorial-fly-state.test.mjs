import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readGameModuleGroup } from "./source-reader.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const engine = readGameModuleGroup(120, 139);
const hooks = read("client/game/115-v170-hooks.js");
const mobilePolish = read("client/game/110-online-mobile-polish.js");

function block(start, end) {
  const a = engine.indexOf(start);
  const b = engine.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `${start} -> ${end}`);
  return engine.slice(a, b);
}

test("polish 12 cache marker is wired", () => {
  assert.match(engine, /2026\.10\.13-friends-polish-37/);
  assert.match(read("public/index.html"), /game\.bundle\.js\?v=2026\.10\.13-friends-polish-37/);
  assert.match(read("src/common.js"), /2026\.10\.13-friends-polish-37/);
});

test("Ember nameplate is centered in the upper-left of the dialogue panel", () => {
  const dialogue = block("function drawTutorialDialogue", "function drawTutorialStatus");
  assert.match(dialogue, /const namePlate = \{ x:textPanel\.x \+ 7, y:textPanel\.y \+ 7, w:48, h:10 \}/);
  assert.match(dialogue, /drawBitmapText\("EMBER", namePlate\.x \+ namePlate\.w \/ 2, namePlate\.y \+ 2, \.58, "center"/);
  assert.doesNotMatch(dialogue, /nameY = imageY \+ imageSize/);
});

test("final-catch label suppression resets between tutorial scenes", () => {
  assert.match(hooks, /window\.RibbitRaceResetFinalCatchLabels = \(\) =>/);
  assert.match(hooks, /window\.RibbitV160ResetFinalCatchLabels\?\.\(\)/);
  assert.match(mobilePolish, /window\.RibbitV160ResetFinalCatchLabels=\(\)=>/);
  const configure = block("function configureStep", "function addTutorialPoof");
  assert.match(configure, /window\.RibbitRaceResetFinalCatchLabels\?\.\(\)/);
});

test("spit-out carryover fly remains visible and still until the next poof", () => {
  assert.match(engine, /function captureTutorialCarryoverFlies/);
  assert.match(engine, /previousSetup === "comboMixed"/);
  assert.match(engine, /carryover\.tutorialCarryover = true/);
  assert.match(engine, /carryover\.touchLocked = true/);
  assert.match(engine, /function clearTutorialCarryoverFlies/);
  const ambient = block("function updateTutorialAmbient", "function updateTutorial");
  assert.match(ambient, /tutorialCarryover/);
  assert.match(ambient, /frozen\.currentFly\.phase = 0/);
});

test("three-fly landing waits for an active tongue catch", () => {
  const monitor = block("function monitorSolo", "function monitorPvp");
  assert.match(monitor, /setup === "comboThree" && attemptEnded && \(tongue\.active \|\| game\.soloCriticalCatchActive\)/);
  assert.match(monitor, /tutorial\.attemptEnded = false/);
});

test("uncaught flies remain for Ember's final line and clear for the completion card", () => {
  const finalMessage = block("function beginFinalTutorialMessage", "function beginCompletionScreen");
  assert.doesNotMatch(finalMessage, /flies\.length = 0/);
  assert.match(finalMessage, /Keep every uncaught fly visible/);
  const completion = block("function beginCompletionScreen", "function dismissCompletionScreen");
  assert.match(completion, /flies\.length = 0/);
});
