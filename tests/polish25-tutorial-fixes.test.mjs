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
  assert.match(nav, /profileButton: Object\.freeze\(\{ id: "profile", x: 45/);
  assert.match(nav, /deviceButton: Object\.freeze\(\{ id: "device", x: 75/);
  assert.match(nav, /settingsButton: Object\.freeze\(\{ id: "settings", x: 350/);
  assert.match(nav, /tutorialButton: Object\.freeze\(\{ id: "tutorial", x: 378/);
});

test("Solo pause icon no longer paints the old white button tile", () => {
  const block = hud.slice(hud.indexOf("const pause = HUD_UI.pauseButton;"), hud.indexOf("ctx.restore();", hud.indexOf("const pause = HUD_UI.pauseButton;")) + 13);
  assert.doesNotMatch(block, /ctx\.fillRect\(pause\.x, pause\.y, pause\.w, pause\.h\)/);
  assert.match(block, /transparent Versus pause treatment/);
});

test("PvP tutorial now supports offscreen frog indicators", () => {
  assert.match(pvpUi, /function drawPvpOffscreenIndicator\(player\)/);
  assert.match(pvpUi, /pvpPlayers\.forEach\(drawPvpOffscreenIndicator\)/);
});

test("Requested tutorial copy and layouts were updated", () => {
  assert.match(config, /I plan on charging a max jump\./);
  assert.match(config, /Try and time your bonk just as I release it!/);
  assert.match(tutorial, /case "pvpDropHigh"[\s\S]{0,220}positionPvpOnPlatform\(p1, top, 1, 4\)/);
  assert.match(tutorial, /case "pvpDemoRebound"[\s\S]{0,120}\.50/);
  assert.match(tutorial, /case "pvpDemoIntercept"|case "pvpDemoDinnerSteal"/);
});

test("Final tutorial match re-enables real CPU control", () => {
  assert.match(tutorial, /pvpPlayers\[1\]\.cpu = true/);
  assert.match(tutorial, /pvpPlayers\[1\]\.isCpu = true/);
  assert.match(tutorial, /clearPvpScriptActions\(\);/);
});

test("Recovery bonk and rebound practice use the revised authored checks", () => {
  assert.match(monitor, /recoveryWindowHit/);
  assert.match(monitor, /positionPvpOnPlatform\(p1, PARK_PLATFORMS\[5\], 1\)/);
  assert.match(monitor, /positionPvpOnPlatform\(p1, PARK_PLATFORMS\[4\], 1, 4\)/);
});
