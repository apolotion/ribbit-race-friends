import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const tutorial = read("client/game/120-engine-tutorial.js");
const ui = read("client/game/70-rendering.js");
const online = read("client/game/30-online-versus.js");
const language = read("public/scripts/language-preferences.js");
const index = read("public/index.html");

test("polish 8 ships canvas-native leaderboard and replay controls", () => {
  assert.match(tutorial, /game\.state = "rrLeaderboard"/);
  assert.match(tutorial, /drawLeaderboardScreen/);
  assert.match(tutorial, /leaderboardReplayRects/);
  assert.match(tutorial, /playReplayById/);
  assert.match(tutorial, /RibbitRacePlayStoredReplay/);
  assert.match(tutorial, /repairReplayModal/);
  assert.match(tutorial, /PLAY REPLAY IN GAME/);
  const allClient = ["client/game/90-extended-features.js","client/game/110-online-mobile-polish.js"].map(read).join("\n");
  assert.match(allClient, /rrReplaySource|RibbitRacePlayStoredReplay/);
});

test("achievements uses a small bottom-left leaderboard button", () => {
  assert.match(tutorial, /LEADERBOARD_BUTTON = Object\.freeze\(\{ x: 22, y: 229, w: 28, h: 28 \}\)/);
  assert.match(tutorial, /drawMiniMedalButton/);
  assert.match(tutorial, /LEADERBOARD & REPLAYS/);
});

test("online menu follows requested order and contextual speech bubbles", () => {
  const versus = read("client/game/60-versus-gameplay.js");
  const order = ["quick","host","join","spectate","profile","battle"];
  let cursor = online.indexOf("const ONLINE_HUB");
  for (const key of order) {
    const next = online.indexOf(`id:'${key}'`, cursor);
    assert.ok(next >= cursor, `${key} appears in requested order`);
    cursor = next;
  }
  assert.match(online, /View completed Quickplay encounters and your head-to-head record/);
  assert.match(online, /Return to Local Versus/);
  assert.match(versus, /CLICK TO PLAY AGAINST CPU/);
  assert.match(versus, /CLICK TO ENABLE LOCAL VERSUS/);
});

test("language preferences are collected at signup and localize each client", () => {
  assert.match(index, /language-preferences\.js/);
  assert.match(language, /What language do you speak\?/);
  assert.match(language, /What language are you learning\?/);
  assert.match(language, /Target language/);
  assert.match(tutorial, /ribbitRaceLanguageModeV1/);
  assert.match(tutorial, /withLocalizedVocabulary/);
  assert.match(tutorial, /SPANISH_UI/);
});

test("hat progress updates per skin outside training", () => {
  assert.match(tutorial, /ribbitRaceHatProgressV2/);
  assert.match(tutorial, /progress\.bySkin\[skinId\]/);
  assert.match(tutorial, /originalCompleteCorrectCatchForHats/);
  assert.match(tutorial, /countedHatFlyObjects/);
  assert.match(tutorial, /game\.tutorialActive \|\| window\.RibbitRaceTutorialEngine\?\.active/);
  assert.match(tutorial, /evaluateHatUnlocks/);
  assert.match(tutorial, /clearPinnedHatRequirement/);
});

test("custom frog uses an in-preview Set Base selector and preserves paste state", () => {
  assert.match(tutorial, /SET BASE FROG/);
  assert.match(tutorial, /getCustomBaseOptionRects/);
  assert.match(tutorial, /applyCustomBaseSkin/);
  assert.match(tutorial, /window\.addEventListener\("paste"/);
  assert.match(tutorial, /game\.state = "custom"/);
});

test("pause and cursor polish are installed", () => {
  assert.match(tutorial, /PAUSE_FULLSCREEN_BUTTON/);
  assert.match(tutorial, /toggleFullscreen/);
  assert.match(tutorial, /drawPvpPauseButtonPolish8/);
  assert.match(tutorial, /setProperty\("cursor"/);
  assert.match(tutorial, /immediateResetToStart/);
  assert.match(tutorial, /clearQuickplayAndHome/);
});

test("new app icons are present", () => {
  for (const file of [
    "public/favicon.png",
    "public/icons/favicon-32.png",
    "public/icons/favicon-64.png",
    "public/icons/ribbit-race-180.png",
    "public/icons/ribbit-race-192.png",
    "public/icons/ribbit-race-512.png"
  ]) assert.ok(existsSync(file), file);
});
