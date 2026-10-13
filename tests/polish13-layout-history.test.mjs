import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";

const read = (path) => readFileSync(path, "utf8");
const tutorial = readGameModuleGroup(120, 139);
const mobile = read("client/game/100-mobile-experience.js");
const ui = read("client/game/40-ui-navigation-audio.js");
const input = read("client/game/80-input-loop-startup.js");
const rendering = readGameModuleGroup(70, 79);
const online = read("client/game/30-online-versus.js");

test("Polish 13 aligns profile/device hit geometry and removes the legacy blank tooltip", () => {
  assert.match(tutorial, /MAIN_PROFILE_BUTTON = MAIN_UI\.profileButton/);
  assert.match(tutorial, /MAIN_DEVICE_BUTTON = MAIN_UI\.deviceButton/);
  assert.match(tutorial, /profile:\[MAIN_PROFILE_BUTTON, "ACCOUNT & LANGUAGE"\]/);
  assert.match(tutorial, /device:\[MAIN_DEVICE_BUTTON, "COMPUTER \/ MOBILE MODE"\]/);
  assert.match(tutorial, /drawBitmapText\(message[\s\S]{0,120}"#111a1e"\)/);
  assert.match(mobile, /legacy helper silent prevents a second blank white box/);
});

test("Achievements medal aligns to the achievement grid", () => {
  assert.match(tutorial, /LEADERBOARD_BUTTON = Object\.freeze\(\{ x: 416, y: 229, w: 28, h: 28 \}\)/);
  assert.match(ui, /pageNextButton: Object\.freeze\(\{ x: 370, y: 232, w: 20, h: 20 \}\)/);
});

test("Leaderboard renders player frogs with visibly striped rows and dropdown choices", () => {
  assert.match(tutorial, /function leaderboardFrogPalette/);
  assert.match(tutorial, /drawMiniFrogSwatchFacing\(table\.x \+ 42, y \+ 4, rowPalette, \.43, 1\)/);
  assert.match(tutorial, /offset % 2 \? "#dfe5e7" : "#ffffff"/);
  assert.match(tutorial, /index % 2 \? "#dce3e5" : "#ffffff"/);
});

test("Quickplay moves content upward and uses one selected-frog header palette", () => {
  assert.match(online, /preview:\{x:151,y:91,w:178,h:72\}/);
  assert.match(online, /enter:\{x:144,y:176,w:192,h:26\}/);
  assert.match(online, /cancel:\{x:184,y:231,w:112,h:23\}/);
  assert.match(online, /All Online screens use one continuous header/);
  assert.match(online, /ctx\.fillRect\(40,17,400,40\)/);
});

test("Pause utilities occupy the panel bottom-right while tutorial retry replays dialogue without countdown", () => {
  assert.match(ui, /helpButton: \{ x: 353, y: 198, w: 20, h: 20 \}/);
  assert.match(tutorial, /PAUSE_FULLSCREEN_BUTTON = Object\.freeze\(\{ x: 379, y: 198, w: 20, h: 20 \}\)/);
  assert.match(tutorial, /restartTutorialSceneImmediately\(\)/);
  assert.doesNotMatch(tutorial, /completedResetReason === "pause-retry"\) startResumeCountdown/);
  assert.match(input, /if \(game\.state === "paused"\)[\s\S]{0,900}KeyR/);
});

test("Locked hats keep their requirement visible and unlocked Ember has no completed progress bar", () => {
  assert.match(rendering, /game\.customHatHoveredIndex = Math\.max\(0, lockedIndex\)/);
  assert.match(rendering, /Locked hats remain informational/);
  assert.match(rendering, /displayFocusId === "ember" && !isFrogSkinUnlocked\("ember"\)/);
  assert.doesNotMatch(tutorial, /setTimeout\(clearPinnedHatRequirement, 0\)/);
});

test("Set Base is an undoable draft edit with a themed labeled picker", () => {
  assert.match(tutorial, /CUSTOM_BASE_BUTTON = Object\.freeze\(\{ x: 159, y: 67, w: 25, h: 22 \}\)/);
  assert.match(tutorial, /beginCustomColorHistoryTransaction\(\)/);
  assert.match(tutorial, /game\.customDraftBody = palette\.body/);
  assert.match(tutorial, /commitCustomColorHistoryTransaction\(\)/);
  assert.match(tutorial, /const draftSkin = getCustomDraftSkin\(\)/);
  assert.match(tutorial, /ctx\.fillRect\(panel\.x \+ 5, panel\.y \+ 5, panel\.w - 10, 24\)/);
  assert.match(tutorial, /CUSTOM_BASE_CLOSE = Object\.freeze\(\{ x:355, y:68, w:18, h:18 \}\)/);
  assert.match(tutorial, /skin\.name \|\| option\.id/);
});
