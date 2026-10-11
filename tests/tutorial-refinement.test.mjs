import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = read("client/game/120-engine-tutorial.js");
const polish = read("public/scripts/rr-170-polish.js");

test("1.7.8 tutorial-polish build is wired everywhere", () => {
  assert.equal(JSON.parse(read("package.json")).version, "1.7.8");
  assert.match(read("src/common.js"), /2026\.10\.11-friends-tutorial-polish-2/);
  assert.match(read("client/game/110-online-mobile-polish.js"), /2026\.10\.11-friends-tutorial-polish-2/);
  assert.match(read("public/scripts/cloud-client.js"), /2026\.10\.11-friends-tutorial-polish-2/);
  const index = read("public/index.html");
  assert.match(index, /2026\.10\.11-tutorial-polish-2/);
  assert.doesNotMatch(index, /tutorial-scripted-1/);
});

test("first-boot tutorial waits for profile, gate, body, frame, and input release", () => {
  for (const phrase of [
    "authenticatedProfileReady",
    "authenticationBoundaryReleased",
    "ribbit-auth-locked",
    "hasAttribute(\"inert\")",
    "aria-hidden",
    "__RIBBIT_FRIENDS_GAME_INPUT_LOCKED__",
    "rr-authenticated"
  ]) assert.ok(polish.includes(phrase), phrase);
});

test("Ember dialogue is vertically and horizontally centered with fixed typography", () => {
  assert.match(engine, /DIALOGUE_TEXT_SCALE = 0\.50/);
  assert.match(engine, /const textTop = Math\.round\(textArea\.y \+ Math\.max\(0, \(textArea\.h - totalTextHeight\) \/ 2\)\)/);
  assert.match(engine, /textArea\.x \+ textArea\.w \/ 2 - fullLineWidth \/ 2/);
  assert.match(engine, /drawBitmapText\(\s*visibleOnLine,[\s\S]{0,420}"left"/);
});

test("authored tutorial flies retain normal movement and normal spawn sparkles", () => {
  assert.doesNotMatch(engine, /function alignTutorialFlies/);
  assert.match(engine, /phase:Math\.max\(0, spawnIndex\) \* 1\.37/);
  assert.match(engine, /currentFly\.spawnAge = 0/);
  assert.match(engine, /playFlySpawnSound/);
  assert.match(engine, /updateTutorialAmbient\(dt, \{ animateFlies: !tutorial\.resetPending \}\)/);
});

test("poof reset clears tongue, hides only the frog, and never moves it offscreen", () => {
  assert.match(engine, /resetTutorialTongue/);
  assert.match(engine, /tutorial\.frogHidden = true/);
  assert.match(engine, /resetAt = performance\.now\(\) \+ POOF_TRANSITION_MS/);
  assert.doesNotMatch(engine, /frog\.x\s*=\s*-1000|frog\.y\s*=\s*-1000/);
});

test("all five Ember portrait assets are packaged", () => {
  for (const name of ["confident", "smile", "cool", "laughing", "thinking"]) {
    assert.ok(existsSync(new URL(`../public/tutorial/ember-${name}.png`, import.meta.url)), name);
  }
});

test("scene goals cover long jumps, matching catches, tongue, combos, walls, and drops", () => {
  for (const literal of [
    'goal: ["LONG JUMPS", "0 / 3"]',
    'goal: ["MATCHES", "0 / 3"]',
    'goal: ["USE YOUR TONGUE", "TO CATCH THE FLY"]',
    'goal: ["3 MATCHES", "IN ONE JUMP"]',
    'goal: ["TURN AND CATCH", "WITHIN 2 JUMPS"]',
    'goal: ["2 BUFFERS", "3 FLIES"]'
  ]) assert.ok(engine.includes(literal), literal);
});

test("normal controls resume only after dialogue and the half-second scene-entry poof", () => {
  assert.match(engine, /function armScenarioAfterDialogue\(\) \{\s*beginScenarioEntryTransition\(\);/);
  assert.match(engine, /reason: "scene-entry"/);
  assert.match(engine, /tutorial\.resetPending/);
  assert.match(engine, /tutorialMovementLocked/);
  assert.match(engine, /tutorial\.frogHidden = false/);
});
