import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = read("client/game/120-engine-tutorial.js");
const polish = read("public/scripts/rr-170-polish.js");

test("1.7.6 tutorial refinement build is wired", () => {
  assert.equal(JSON.parse(read("package.json")).version, "1.7.6");
  assert.match(read("src/common.js"), /2026\.10\.11-friends-tutorial-cinematic-1/);
  assert.match(engine, /rrFriendsEngineTutorialSoloSeenV6/);
});

test("first boot tutorial retries automatically after authentication", () => {
  assert.match(polish, /window\.addEventListener\("rr-authenticated"/);
  assert.match(polish, /engine\.start\(forcedKind\|\|"solo"\)/);
  assert.match(polish, /Number\(canvas\.width\) > 0/);
  assert.doesNotMatch(polish, /RibbitRaceRuntimeHooks/);
});

test("Ember dialogue is compact at the top and uses right-side portraits", () => {
  assert.match(engine, /const panel = \{ x: 22, y: 8, w: 436, h: 45 \}/);
  assert.match(engine, /const portrait = \{ x: 399, y: 10, w: 55, h: 41 \}/);
  assert.match(engine, /dialogueLineIndex/);
  assert.match(engine, /SPACE TO PLAY/);
  assert.match(engine, /requestAnimationFrame\(\(\) => \{ try \{ drawScene\(\)/);
});

test("tutorial arena no longer draws the map Ember frog", () => {
  assert.match(engine, /No second frog is rendered in the playable tutorial arena/);
  assert.doesNotMatch(engine, /drawMentorFrog\(\);/);
});

test("authored tutorial flies retain normal hover movement", () => {
  assert.doesNotMatch(engine, /function alignTutorialFlies/);
  assert.doesNotMatch(engine, /currentFly\.x = currentFly\.baseX/);
  assert.match(engine, /phase:Math\.max\(0, spawnIndex\) \* 1\.37/);
});

test("failed authored attempts poof out, wait half a second, then poof back in", () => {
  const start = engine.indexOf("function failAttempt");
  const end = engine.indexOf("function passStep", start);
  const block = engine.slice(start, end);
  assert.match(block, /tutorial\.resetAt = performance\.now\(\) \+ 500/);
  assert.match(block, /tutorial\.frogHidden = true/);
  assert.match(engine, /function completePendingReset/);
  assert.match(engine, /playTutorialPoofSound\("out"\)/);
  assert.match(engine, /playTutorialPoofSound\("in"\)/);
  assert.match(engine, /function drawTutorialSmoke/);
});

test("tongue lesson requires a tongue catch beyond body-contact range", () => {
  assert.match(engine, /makeParkFly\(4, 0, 0\)/);
  assert.match(engine, /activeSetup === "rangeCatch" && wasCorrect && source !== "tongue"/);
  assert.match(engine, /source === "tongue"\) tutorial\.rangeTongueCaught = true/);
  assert.match(engine, /caught >= 1 && tutorial\.rangeTongueCaught/);
});

test("wrong fly lesson requires wrong then right in one jump", () => {
  assert.match(engine, /WRONG, THEN RIGHT/);
  assert.match(engine, /makeParkFly\(3, 1, 0\)/);
  assert.match(engine, /makeParkFly\(2, 0, 1\)/);
  assert.match(engine, /tutorial\.wrongOrderInvalid/);
  assert.match(engine, /tutorial\.wrongFlyCaught && tutorial\.rightFlyCaught/);
});

test("wall-turn lesson allows two jumps and rebound stays one attempt", () => {
  assert.match(engine, /WITHIN 2 JUMPS/);
  assert.match(engine, /tutorial\.jumpAttempts >= 2/);
  assert.match(engine, /ONE JUMP ONLY  -  REBOUND AND CATCH/);
});

test("all five mirrored Ember portraits are packaged", () => {
  for (const name of ["confident", "smile", "cool", "laughing", "thinking"]) {
    assert.ok(existsSync(new URL(`../public/tutorial/ember-${name}.png`, import.meta.url)), name);
  }
});
