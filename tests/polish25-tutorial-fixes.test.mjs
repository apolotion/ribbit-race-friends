import test from "node:test";
import assert from "node:assert/strict";
import { readProjectFile as read } from "./source-reader.mjs";

const tutorial = read("client/game/122-tutorial-scenarios.js");
const config = read("client/game/120-tutorial-config.js");
const hud = read("client/game/71-rendering-entities-hud.js");
const nav = read("client/game/40-ui-navigation-audio.js");
const hooks = read("client/game/126-tutorial-hooks.js");
const monitor = read("client/game/124-tutorial-monitoring.js");
const pvpUi = read("client/game/63-versus-rendering-ui.js");

test("Polish 25 removes the live tutorial R retry shortcut and keeps restart inside pause", () => {
  assert.doesNotMatch(hooks, /event\.code === \"KeyR\"[\s\S]{0,160}retryScene/);
});

test("Shared utility icons have breathing room again", () => {
  assert.match(nav, /profileButton: Object\.freeze\(\{ id: "profile", x: 48/);
  assert.match(nav, /deviceButton: Object\.freeze\(\{ id: "device", x: 78/);
  assert.match(nav, /settingsButton: Object\.freeze\(\{ id: "settings", x: 349/);
  assert.match(nav, /tutorialButton: Object\.freeze\(\{ id: "tutorial", x: 379/);
});

test("Solo pause icon shares the new mint framed pause/play glyph", () => {
  assert.match(hud, /function drawHudPausePlaySprite\(rect, paused = false/);
  assert.match(hud, /drawHudPausePlaySprite\(pause, game\.state === "paused"/);
  assert.match(hud, /if \(paused\) \{/);
  assert.doesNotMatch(hud, /transparent Versus pause treatment/);
});

test("PvP tutorial now supports offscreen frog indicators", () => {
  assert.match(pvpUi, /function drawPvpOffscreenIndicator\(player\)/);
  assert.match(pvpUi, /pvpPlayers\.forEach\(drawPvpOffscreenIndicator\)/);
});

test("Requested tutorial copy and layouts were updated", () => {
  assert.match(config, /I plan on charging a max jump\./);
  assert.match(config, /Try and time your bonk just as I release it!/);
  assert.match(tutorial, /case "pvpDropHigh"[\s\S]{0,220}positionPvpOnPlatform\(p1, top, 1, 4\)/);
  assert.match(tutorial, /case "pvpDemoRebound"[\s\S]{0,120}\.75/);
  assert.match(tutorial, /case "pvpDemoIntercept"|case "pvpDemoDinnerSteal"/);
});

test("Final tutorial match re-enables real CPU control", () => {
  assert.match(tutorial, /pvpPlayers\[1\]\.cpu = true/);
  assert.match(tutorial, /pvpPlayers\[1\]\.isCpu = true/);
  assert.match(tutorial, /clearPvpScriptActions\(\);/);
});

test("Recovery bonk and rebound practice use the revised authored checks", () => {
  assert.match(monitor, /recoveryWindowHit/);
  assert.match(monitor, /positionPvpReboundPracticeLayout\(completed\)/);
  assert.match(tutorial, /positionPvpOnPlatform\(p1, PARK_PLATFORMS\[2\], 1\)/);
  assert.match(tutorial, /positionPvpOnPlatform\(ember, PARK_PLATFORMS\[5\], -1\)/);
});
