import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const tutorial = read("client/game/120-engine-tutorial.js");
const mobile = read("client/game/100-mobile-experience.js");
const ui = read("client/game/40-ui-navigation-audio.js");
const input = read("client/game/80-input-loop-startup.js");
const rendering = read("client/game/70-rendering.js");
const online = read("client/game/30-online-versus.js");

test("Polish 13 aligns profile/device hit geometry and removes the legacy blank tooltip", () => {
  assert.match(tutorial, /MAIN_PROFILE_BUTTON = Object\.freeze\(\{ x: 47, y: 211, w: 24, h: 24 \}\)/);
  assert.match(tutorial, /MAIN_DEVICE_BUTTON = Object\.freeze\(\{ x: 74, y: 211, w: 24, h: 24 \}\)/);
  assert.match(tutorial, /profile:\[MAIN_PROFILE_BUTTON, "ACCOUNT & LANGUAGE"\]/);
  assert.match(tutorial, /device:\[MAIN_DEVICE_BUTTON, "COMPUTER \/ MOBILE MODE"\]/);
  assert.match(tutorial, /drawBitmapText\(message[\s\S]{0,120}"#111a1e"\)/);
  assert.match(mobile, /legacy helper silent prevents a second blank white box/);
});

test("Achievements medal aligns to the achievement grid", () => {
  assert.match(tutorial, /LEADERBOARD_BUTTON = Object\.freeze\(\{ x: 34, y: 229, w: 28, h: 28 \}\)/);
  assert.match(ui, /startX: 34/);
});

test("Leaderboard renders player frogs and striped dropdown choices", () => {
  assert.match(tutorial, /function leaderboardFrogPalette/);
  assert.match(tutorial, /drawMiniFrogSwatchFacing\(77, y \+ 4, rowPalette, \.43, 1\)/);
  assert.match(tutorial, /index % 2 \? "#edf1f2" : "#ffffff"/);
});

test("Quickplay moves content upward and uses one selected-frog header palette", () => {
  assert.match(online, /preview:\{x:151,y:91,w:178,h:72\}/);
  assert.match(online, /enter:\{x:144,y:176,w:192,h:26\}/);
  assert.match(online, /cancel:\{x:185,y:232,w:110,h:22\}/);
  assert.match(online, /All Online screens use one continuous header/);
  assert.match(online, /ctx\.fillRect\(40,17,400,40\)/);
});

test("Pause utilities occupy the bottom-right and tutorial restart counts down", () => {
  assert.match(ui, /helpButton: \{ x: 400, y: 198, w: 20, h: 20 \}/);
  assert.match(tutorial, /PAUSE_FULLSCREEN_BUTTON = Object\.freeze\(\{ x: 426, y: 198, w: 20, h: 20 \}\)/);
  assert.match(tutorial, /completedResetReason === "pause-retry"\) startResumeCountdown\(false\)/);
  assert.match(input, /if \(game\.state === "paused"\)[\s\S]{0,900}KeyR/);
});

test("Locked hats do not pin help and unlocked Ember has no completed progress bar", () => {
  assert.match(rendering, /game\.customHatHoveredIndex = null/);
  assert.match(rendering, /A click is only a dud response/);
  assert.match(rendering, /displayFocusId === "ember" && !isFrogSkinUnlocked\("ember"\)/);
  assert.doesNotMatch(tutorial, /setTimeout\(clearPinnedHatRequirement, 0\)/);
});

test("Set Base is an undoable draft edit with a themed labeled picker", () => {
  assert.match(tutorial, /CUSTOM_BASE_BUTTON = Object\.freeze\(\{ x: 159, y: 67, w: 25, h: 22 \}\)/);
  assert.match(tutorial, /beginCustomColorHistoryTransaction\(\)/);
  assert.match(tutorial, /game\.customDraftBody = palette\.body/);
  assert.match(tutorial, /commitCustomColorHistoryTransaction\(\)/);
  assert.match(tutorial, /const draftSkin = getCustomDraftSkin\(\)/);
  assert.match(tutorial, /headerRight = CUSTOM_BASE_CLOSE\.x - 4/);
  assert.match(tutorial, /skin\.name \|\| option\.id/);
});
