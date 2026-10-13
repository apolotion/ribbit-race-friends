import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";

const read = (path) => readFileSync(path, "utf8");
const tutorial = readGameModuleGroup(120, 139);
const online = read("client/game/30-online-versus.js");
const versus = readGameModuleGroup(60, 69);
const input = read("client/game/80-input-loop-startup.js");
const core = read("client/game/10-core-config.js");
const hooks = read("client/game/115-v170-hooks.js");
const cloud = read("public/scripts/cloud-client.js");
const pagePolish = read("public/scripts/rr-170-polish.js");
const onlinePage = read("public/scripts/rr-170-online.js");
const css = read("public/styles/rr-170.css");
const index = read("public/index.html");

test("polish 11 cache marker is wired through client, worker, and asset URLs", () => {
  for (const source of [tutorial, cloud, index, read("src/common.js")]) {
    assert.match(source, /2026\.10\.13-friends-polish-44/);
  }
});

test("account and device share canvas geometry and HTML overlays are suppressed", () => {
  const mobileGame=read("client/game/100-mobile-experience.js");
  assert.match(mobileGame, /avatar: MAIN_UI\.profileButton/);
  assert.match(mobileGame, /device: MAIN_UI\.deviceButton/);
  assert.match(css, /#rr170-pause, #rr170-account-icon, #rr170-device-icon/);
  assert.match(tutorial, /ACCOUNT & LANGUAGE/);
  assert.match(tutorial, /COMPUTER \/ MOBILE MODE/);
});

test("Achievements uses an inset medal button and canvas-native dropdown leaderboard", () => {
  assert.match(tutorial, /LEADERBOARD_BUTTON = Object\.freeze\(\{ x: 416, y: 229, w: 28, h: 28 \}\)/);
  assert.match(tutorial, /drawMiniMedalButton/);
  assert.match(tutorial, /LEADERBOARD_METRICS/);
  assert.match(tutorial, /drawLeaderboardDropdown/);
  assert.match(tutorial, /RANK BY/);
  assert.match(tutorial, /LEVEL/);
  assert.match(tutorial, /drawLeaderboardScreen/);
  assert.match(cloud, /getLeaderboardData/);
  assert.match(css, /#cloud-leaderboard[\s\S]{0,100}display: none !important/);
});

test("final-catch fly labels remain gone while flies and sparks keep rendering", () => {
  assert.match(hooks, /critical-catch lifecycle[\s\S]{0,260}remainder of the round/i);
  assert.match(tutorial, /if \(window\.RibbitRaceFinalCatchLabelsGone\) return/);
  assert.match(read("client/game/80-input-loop-startup.js"), /drawFlySpawnSparks\(currentFly\);[\s\S]{0,80}drawFlyAt\(currentFly\.x/);
  assert.match(versus, /drawFlySpawnSparks\(fly\);[\s\S]{0,80}drawFlyAt\(fly\.x/);
});

test("original online panel owns rendering and input in requested order", () => {
  assert.doesNotMatch(tutorial, /legacy block inert|function drawOnlineMain\(/);
  const hub = online.slice(online.indexOf("const ONLINE_HUB"), online.indexOf("const PROFILE_UI"));
  const order = ["quick", "spectate", "host", "join", "profile", "battle"];
  let cursor = 0;
  for (const id of order) {
    const next = hub.indexOf(`id:'${id}'`, cursor);
    assert.ok(next >= cursor, `${id} is in the requested order`);
    cursor = next;
  }
  assert.match(online, /battleReplayRects\.some/);
  assert.doesNotMatch(pagePolish, /medal\.hidden = inTutorial/);
});

test("online menus suppress menu-only Player 2 and Pause badges", () => {
  assert.match(onlinePage, /Never paint the Player 2\/opponent badge over ONLINE/);
  assert.match(pagePolish, /Only real runtime states get pause\/touch controls/);
  assert.match(pagePolish, /\^\(playing\|countdown\|paused\|pvpcelebration\)\$/i);
});

test("Versus uses one contextual CPU/local speech bubble", () => {
  assert.match(versus, /CLICK TO ENABLE LOCAL VERSUS/);
  assert.match(versus, /CLICK TO PLAY AGAINST CPU/);
  assert.match(tutorial, /Own exactly one contextual VS\/CPU speech bubble/);
  assert.match(tutorial, /drawPvpVsHoverTooltip = function[\s\S]{0,260}CLICK TO PLAY AGAINST CPU/);
});

test("pointer cursor covers canvas controls and Online retains its own cursor", () => {
  assert.match(tutorial, /function interactiveRectForPoint/);
  for (const token of ["HOME_UI", "SETUP_UI", "CUSTOM_UI", "ACHIEVEMENTS_UI", "STATS_UI", "PVP_SETUP_UI", "PVP_SETTINGS_UI", "PAUSE_UI", "VICTORY_UI"]) {
    assert.match(tutorial, new RegExp(token));
  }
  assert.match(tutorial, /OnlineVersus\?\.isMenuVisible\?\.\(\)[\s\S]{0,80}return;/);
});

test("pause controls place book left, fullscreen right, and P pauses", () => {
  assert.match(read("client/game/40-ui-navigation-audio.js"), /helpButton: \{ x: 353, y: 198, w: 20, h: 20 \}/);
  assert.match(tutorial, /PAUSE_FULLSCREEN_BUTTON = Object\.freeze\(\{ x: 379, y: 198, w: 20, h: 20 \}\)/);
  assert.match(input, /event\.code === "KeyP"/);
  assert.match(online, /state\.active&&e\.code==='KeyP'/);
});

test("R is pause-only, normal restart counts down, and tutorial retry replays dialogue", () => {
  assert.match(input, /if \(game\.state === "paused"\)[\s\S]{0,900}event\.code === "KeyR"/);
  assert.match(input, /RibbitRaceTutorialEngine\?\.active[\s\S]{0,180}activatePauseSelection\(\)[\s\S]{0,180}restartCurrentLevel\(\)/);
  assert.match(read("client/game/40-ui-navigation-audio.js"), /function restartCurrentLevel\(\)[\s\S]{0,420}startResumeCountdown\(\)/);
  assert.doesNotMatch(input, /\["playing","countdown"\]\.includes\(game\.state\)[\s\S]{0,120}KeyR/);
  assert.match(tutorial, /restartTutorialSceneImmediately\(\)/);
  assert.doesNotMatch(tutorial, /completedResetReason === "pause-retry"\) startResumeCountdown/);
});

test("worldrecord cheat is visual-only and uses gold trophy presentation", () => {
  assert.match(core, /WORLD_RECORD_TEST_CODE = "worldrecord"/);
  assert.match(read("client/game/40-ui-navigation-audio.js"), /Visual-only QA shortcut/);
  const toast = readGameModuleGroup(70, 79);
  assert.match(toast, /worldRecordToast/);
  assert.match(toast, /const badgeSize = height - 4/);
  assert.match(toast, /drawMiniSun\(left \+ 16, top \+ 11/);
});

test("live hat progress reads per-skin catches and locked clicks do not pin help", () => {
  assert.match(core, /readLiveHatSkinCount/);
  assert.match(core, /CATCH 75 FLIES AS AZURE/);
  assert.match(core, /readLiveHatSkinCount\("azure"\)/);
  assert.match(tutorial, /rr-hat-progress/);
  assert.match(readGameModuleGroup(70, 79), /customHatSuppressedRequirementIndex/);
});

test("custom frog has compact sprite-only base picker and no legacy palette panel", () => {
  assert.match(css, /#rr-palette-tools \{ display: none !important; \}/);
  assert.match(tutorial, /CUSTOM_BASE_PANEL/);
  assert.match(tutorial, /CUSTOM_BASE_CLOSE/);
  assert.match(tutorial, /drawMiniFrogSwatchFacing/);
  assert.match(tutorial, /beginCustomColorHistoryTransaction\(\)/);
  assert.match(tutorial, /game\.customDraftBody = palette\.body/);
  assert.match(tutorial, /commitCustomColorHistoryTransaction\(\)/);
  assert.match(tutorial, /Template icon: two stacked cards/);
  assert.match(tutorial, /skin\.name \|\| option\.id/);
});

test("Solo tutorial retains the requested fixes", () => {
  for (const phrase of [
    "If you get lucky, you might catch two flies in one jump!",
    "Now, let's say that you're REALLY hungry and need a snack as soon as possible.",
    "Show me a buffered jump charge right after you land.",
    "All this jumping sure does work up an appetite.",
    "So why stop at only one fly per jump?"
  ]) assert.ok(tutorial.includes(phrase), phrase);
  assert.doesNotMatch(tutorial, /That wrong fly does not count|You can come back to it later/);
  assert.match(tutorial, /PLATFORM DROPS DO NOT COUNT AS LONG JUMPS/);
  assert.match(tutorial, /if \(setup === "longJumps"\) \{[\s\S]{0,120}failAttempt\("PLATFORM DROPS DO NOT COUNT AS LONG JUMPS"\)/);
  assert.match(tutorial, /updateTutorialAmbient\(dt, \{ animateFlies: true \}\)/);
  assert.match(tutorial, /isComboThreeFinish/);
  assert.match(tutorial, /PARK_FLY_SPAWNS\[1\]\.y \+ 14/);
});

test("Versus tutorial keeps Ember Level 5, scripted demonstrations, and 30-second final match", () => {
  assert.match(tutorial, /game\.pvpCpuDifficulty = 5/);
  assert.match(tutorial, /WATCH EMBER!/);
  assert.match(tutorial, /YOUR TURN!/);
  assert.match(tutorial, /pvpFinalMatch/);
  assert.match(tutorial, /pvpTimeLimitSeconds = 30/);
  assert.equal((tutorial.match(/"scene":\s*\d+/g) || []).filter((_, index) => index < 16).length >= 16, true);
});
