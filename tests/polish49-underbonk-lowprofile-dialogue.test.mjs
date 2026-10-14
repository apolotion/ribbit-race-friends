import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(new URL(`../client/game/${file}`, import.meta.url), "utf8");
const scene = read("122-tutorial-scenarios.js");
const monitor = read("124-tutorial-monitoring.js");
const dialogue = read("121-tutorial-runtime-dialogue.js");
const hooks = read("126-tutorial-hooks.js");
const config = read("120-tutorial-config.js");
const caseBody = (source, id, boundary) => {
  const start = source.indexOf(`case "${id}"`);
  assert.ok(start !== -1, `${id} exists`);
  const end = source.indexOf(boundary, start + 1);
  assert.ok(end !== -1, `${id} has next case`);
  return source.slice(start, end);
};
const setupBody = (source, id, nextSetup) => {
  const start = source.indexOf(`if (setup === "${id}")`);
  assert.ok(start !== -1, `handler ${id} exists`);
  const end = source.indexOf(`if (setup === "${nextSetup}")`, start + 1);
  assert.ok(end !== -1, `handler ${nextSetup} exists`);
  return source.slice(start, end);
};

test("under-bonk demonstration spawns player facing right, Ember facing left on middle-right", () => {
  const block = caseBody(scene, "pvpDemoUnderBonk", 'case "pvpUnderBonkTwo"');
  assert.match(block, /positionPvp\(p1, 210, CONFIG\.groundY - p1\.h, 1\)/);
  assert.match(block, /positionPvpOnPlatform\(ember, middleRight, -1, middleRight\.w - ember\.w - 8\)/);
});

test("switch-places lesson swaps screenshot ground positions and needs one bonk", () => {
  const block = caseBody(scene, "pvpUnderBonkTwo", 'case "pvpDemoAvoidUnder"');
  assert.match(block, /positionPvp\(p1, 64, CONFIG\.groundY - p1\.h, 1\)/);
  assert.match(block, /positionPvp\(ember, 238, CONFIG\.groundY - ember\.h, -1\)/);
  assert.match(config, /Give me one clean under bonk/);
  assert.match(monitor, /if \(tutorial\.pvpUnderBonks >= 1\)/);
});

test("single under-bonk uses a real jump and no second scripted contact or poof", () => {
  const block = setupBody(monitor, "pvpUnderBonkTwo", "pvpReboundThree");
  assert.match(block, /scriptPvpChargedJump\(1, \.55, direction, 0\)/);
  assert.doesNotMatch(block, /addTutorialPoof\(|positionPvp\(/);
  assert.doesNotMatch(block, /second-under-bonk-straight-up/);
});

test("low-profile demonstration uses exactly four completed jumps", () => {
  const progress = setupBody(scene, "pvpDemoAvoidUnder", "pvpDemoRebound");
  assert.match(progress, /scriptPvpChargedJump\(1, \.18, -1, 120\)/);
  assert.match(scene, /scriptPvpChargedJump\(1, \.18, -1, 0\)/);
  assert.match(scene, /tutorial\.pvpLowProfileJumpCount < 4/);
  assert.match(scene, /completed = tutorial\.pvpLowProfileJumpCount === 4/);
  assert.doesNotMatch(scene, /tutorial\.pvpLowProfileJumpCount < 5/);
});

test("low-profile practice spawns player left of lower-center platform and checks just past its right edge", () => {
  const start = caseBody(scene, "pvpAvoidUnder", 'case "pvpDemoRebound"');
  assert.match(start, /positionPvp\(p1, 155, CONFIG\.groundY - p1\.h, 1\)/);
  assert.match(start, /positionPvpOnPlatform\(ember, perch, -1\)/);
  const finish = setupBody(monitor, "pvpAvoidUnder", "pvpReboundThree");
  assert.match(finish, /pvpAvoidUnderPassedBeneath = true/);
  assert.match(finish, /p1\.x \+ p1\.w >= platform\.x \+ platform\.w \+ 1/);
  assert.doesNotMatch(finish, /platform\.x \+ platform\.w \+ 18/);
});

test("grounded landing squash advances during PvP dialogue and lesson state resets", () => {
  assert.match(hooks, /if \(tutorial\.kind === "pvp" && tutorial\.dialogueOpen/);
  const locked = hooks.slice(hooks.indexOf('if (tutorial.kind === "pvp" && tutorial.dialogueOpen'), hooks.indexOf('updatePvpImpactEffects(dt);'));
  assert.match(locked, /for \(const player of pvpPlayers\)/);
  assert.match(locked, /updatePvpPlayer\(player, dt\)/);
  assert.doesNotMatch(locked, /if \(!player\.grounded \|\| player\.bonked/);
  assert.match(dialogue, /tutorial\.pvpUnderBonkDismountQueued = false/);
  assert.match(dialogue, /tutorial\.pvpAvoidUnderPassedBeneath = false/);
  assert.match(config, /pvpUnderBonkDismountQueued: false/);
  assert.match(config, /pvpAvoidUnderPassedBeneath: false/);
});
