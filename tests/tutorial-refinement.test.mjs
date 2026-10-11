import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = read("client/game/120-engine-tutorial.js");
const polish = read("public/scripts/rr-170-polish.js");

test("1.7.7 tutorial-scripted build is wired", () => {
  assert.equal(JSON.parse(read("package.json")).version, "1.7.7");
  assert.match(read("src/common.js"), /2026\.10\.11-friends-tutorial-scripted-1/);
  assert.match(engine, /rrFriendsEngineTutorialSoloSeenV7/);
});

test("first-boot tutorial waits for a signed-in or guest profile", () => {
  assert.match(polish, /window\.addEventListener\("rr-authenticated"/);
  assert.match(polish, /authReady/);
  assert.match(polish, /authenticatedProfileReady/);
  assert.match(polish, /engine\.start\(forcedKind\|\|"solo"\)/);
});

test("Ember dialogue is compact at the top with a right-side portrait", () => {
  assert.match(engine, /const panel = \{ x: 92, y: 7, w: 300, h: 42 \}/);
  assert.match(engine, /const portrait = \{ x: 337, y: 9, w: 51, h: 38 \}/);
  assert.match(engine, /TYPEWRITER_MS_PER_CHARACTER/);
  assert.match(engine, /visibleLine/);
});

test("tutorial arena does not draw a second Ember map frog", () => {
  assert.match(engine, /No second frog is rendered in the playable tutorial arena/);
  assert.doesNotMatch(engine, /drawMentorFrog\(\);/);
});

test("authored tutorial flies use normal movement and sparkle spawning", () => {
  assert.doesNotMatch(engine, /function alignTutorialFlies/);
  assert.match(engine, /phase:Math\.max\(0, spawnIndex\) \* 1\.37/);
  assert.match(engine, /currentFly\.spawnAge = 0/);
  assert.match(engine, /playFlySpawnSound/);
});

test("poof reset clears tongue and hides the frog without an offscreen marker", () => {
  assert.match(engine, /resetTutorialTongue/);
  assert.match(engine, /tutorial\.frogHidden = true/);
  assert.match(engine, /resetAt = performance\.now\(\) \+ 500/);
  assert.doesNotMatch(engine, /frog\.x\s*=\s*-1000|frog\.y\s*=\s*-1000/);
});

test("scene goals cover long jumps, matching catches, tongue, wrong fly, combos and drops", () => {
  assert.match(engine, /goal: \["LONG JUMPS", "0 \/ 3"\]/);
  assert.match(engine, /goal: \["MATCHES", "0 \/ 3"\]/);
  assert.match(engine, /goal: \["USE YOUR TONGUE", "TO CATCH THE FLY"\]/);
  assert.match(engine, /goal: \["CATCH A", "WRONG FLY"\]/);
  assert.match(engine, /goal: \["3 MATCHES", "IN ONE JUMP"\]/);
  assert.match(engine, /goal: \["2 BUFFERS", "3 FLIES"\]/);
});

test("wall turn allows two jumps and rebound remains one attempt", () => {
  assert.match(engine, /WITHIN 2 JUMPS/);
  assert.match(engine, /jumpAttempts >= 2/);
  assert.match(engine, /ONE JUMP/);
  assert.match(engine, /REBOUND CATCH/);
});

test("all five mirrored Ember portrait assets are packaged", () => {
  for (const name of ["confident", "smile", "cool", "laughing", "thinking"]) {
    assert.ok(existsSync(new URL(`../public/tutorial/ember-${name}.png`, import.meta.url)), name);
  }
});
