import test from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile as read } from './source-reader.mjs';

const config = read('client/game/120-tutorial-config.js');
const scenes = read('client/game/122-tutorial-scenarios.js');
const monitoring = read('client/game/124-tutorial-monitoring.js');
const lifecycle = read('client/game/123-tutorial-lifecycle.js');
const dialogue = read('client/game/121-tutorial-runtime-dialogue.js');
const hooks = read('client/game/126-tutorial-hooks.js');
const rendering = read('client/game/125-tutorial-rendering.js');
const versus = read('client/game/63-versus-rendering-ui.js');
const single = read('client/game/71-rendering-entities-hud.js');
const menus = read('client/game/40-ui-navigation-audio.js');

test('Polish 38 delivers split Solo dialogue and the shortened Versus closing', () => {
  assert.match(config, /"But timing is everything!"/);
  assert.match(config, /"Come find me in Versus when you want a challenge\."/);
  assert.doesNotMatch(config, /"I hope you'll enjoy Versus mode/);
  assert.match(config, /"Look at you! Bonking, bouncing, and stealing my flies\."/);
  assert.match(config, /"Annoyed\. But proud\."/);
});

test('single tutorial dining fly appears during its own poof before Ember announces dinner', () => {
  assert.match(lifecycle, /setup === "threeCatches"/);
  assert.match(lifecycle, /delayMs: POOF_TRANSITION_MS \+ FLY_DIALOGUE_REVEAL_HOLD_MS/);
  assert.match(lifecycle, /reason:"solo-first-fly-before-dinner"/);
  assert.match(dialogue, /setup === "threeCatches" && nextIndex === 1[\s\S]{0,190}beginDialogueLine\(nextIndex\)/);
});

test('Solo carryover flies animate and two-fly landing waits for its pending catch', () => {
  assert.match(monitoring, /Even carryover flies remain animated while Ember is speaking/);
  assert.match(monitoring, /if \(options\.animateFlies !== false\) animateFlies\(safeDt\)/);
  assert.match(monitoring, /\["comboTwo", "comboThree"\]\.includes\(setup\) && attemptEnded/);
  assert.match(monitoring, /tutorial\.sceneLandingDelayUntil = performance\.now\(\) \+ 180/);
});

test('Solo buffered-jump landing retains a successful charge instead of resetting it', () => {
  assert.match(monitoring, /bufferedJumpChainCount = Math\.max\(tutorial\.bufferedJumpChainCount, game\.buttonHeld \? 1 : 0\)/);
  assert.match(monitoring, /!tutorial\.passPending && tutorial\.bufferedJumpChainCount < 1/);
});

test('final Solo and Versus rounds restore active fly clues on replay/scene restart', () => {
  assert.match(scenes, /case "pvpFinalMatch"/);
  assert.match(scenes, /function startPvpFinalMatch\(\)/);
  assert.match(scenes, /targetVocabIndex/);
  assert.match(scenes, /vocabIndex/);
  assert.match(single, /tutorialArmed !== false/);
  assert.match(rendering, /function drawCurrentGoalHud\(\)/);
  assert.match(rendering, /tutorial\.kind === "pvp" && tutorialStep\(\)\?\.setup === "pvpFinalMatch"/);
});

test('both Versus jump meters are symmetrically sized and final opponent label says Ember', () => {
  assert.match(versus, /const meterW = 112/);
  assert.match(versus, /W - 124/);
  assert.match(versus, /"EMBER"/);
});

test('Versus inherits selected Solo P1 skin, remembers P2 skin and carries P1 into tutorial', () => {
  assert.match(menus, /function openPvpSetupMenu/);
  assert.match(menus, /const soloSelectedSkin = normalizePvpSkinId\(game\.skinId/);
  assert.match(menus, /storedP2/);
  assert.match(scenes, /tutorial\.pvpPlayerSkinId \|\| game\.pvpSetupSkinIds\?\.\[0\] \|\| game\.skinId/);
});

test('high-ground lesson uses one maximum jump and resets misses', () => {
  assert.match(scenes, /case "pvpDemoHighGround":[\s\S]{0,300}scriptPvpChargedJump\(1, 1, -1, 0\)/);
  assert.match(monitoring, /setup === "pvpHighGround"/);
  assert.match(monitoring, /failAttempt\("KNOCK EMBER OFF THE TOP IN ONE JUMP"\)/);
});

test('wait-next-bonk demo uses physical wall rebound and never turns Ember manually', () => {
  assert.match(scenes, /case "pvpDemoRecoveryBonk":[\s\S]{0,350}scriptPvpChargedJump\(1, \.55, -1, 0\)/);
  assert.match(scenes, /if \(ember\.wallBouncedThisJump\) tutorial\.pvpRecoveryWallReboundSeen = true/);
  assert.match(scenes, /scriptPvpChargedJump\(1, \.75, null, 0\)/);
  assert.doesNotMatch(scenes, /scriptPvpChargedJump\(1, \.55, 1, 0\)/);
});

test('Ember starts buffered sky drop centered atop the high platform and practice mirrors', () => {
  assert.match(scenes, /case "pvpDemoBufferedSky"[\s\S]{0,500}positionPvpOnPlatform\(ember, top, 1\)/);
  assert.match(scenes, /rightMiddle\.x \+ rightMiddle\.w - p1\.w \+ 2/);
  assert.match(scenes, /case "pvpBufferedSky"[\s\S]{0,250}positionPvpOnPlatform\(p1, top, -1\)/);
});

test('Ember reacts to player release and takes two real under-bonks without a teleport', () => {
  assert.match(scenes, /case "pvpUnderBonkTwo"[\s\S]{0,500}positionPvpOnPlatform\(p1, PARK_PLATFORMS\[2\], 1\)/);
  assert.match(monitoring, /tutorial\.pvpUnderBonkChargePrimed = true;\s*scriptPvpPress\(1, 1\)/);
  assert.match(monitoring, /if \(ember\.charging && tutorial\.pvpUnderBonkChargePrimed\)/);
  assert.match(monitoring, /if \(tutorial\.pvpUnderBonks > 0\)/);
  assert.match(monitoring, /second-under-bonk-straight-up/);
  assert.match(monitoring, /tutorial\.pvpUnderBonks >= 2/);
  assert.match(monitoring, /Ouch! That first under bonk counted\./);
});

test('bonk-boost flies spawn at high matching vocabulary positions and finish at real catch range', () => {
  assert.match(scenes, /PARK_PLATFORMS\[1\]\.w \/ 2\), 84, game\.targetVocabIndex/);
  assert.match(scenes, /PARK_PLATFORMS\[6\]\.w \/ 2\), 84, game\.targetVocabIndex/);
  assert.match(scenes, /tutorial\.pvpPracticeCatchCount > 0/);
  assert.match(hooks, /startPvpCriticalCatch\(player, targetFly, "contest"\)/);
});

test('chapter switching cleans hidden players and stale smoke', () => {
  assert.match(lifecycle, /tutorial\.pvpHiddenPlayerIndex = null/);
  assert.match(lifecycle, /tutorial\.pvpHiddenPlayerIndices = \[\]/);
  assert.match(lifecycle, /tutorial\.smokeClouds\.length = 0/);
});

test('Final tutorial current-goal panel is hidden and Solo progress headers removed', () => {
  assert.match(rendering, /if \(!tutorial\.active \|\| \(tutorial\.kind === "pvp" && tutorialStep\(\)\?\.setup === "pvpFinalMatch"\)\) return/);
  assert.doesNotMatch(rendering, /drawTutorialProgress\(\);/);
});
