import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";

const read = (path) => readFileSync(path, "utf8");
const tutorial = readGameModuleGroup(120, 139);
const rendering = readGameModuleGroup(70, 79);
const soloModel = read("client/game/20-models-and-state.js");
const nav = read("client/game/40-ui-navigation-audio.js");
const replay = read("public/scripts/extended-features.js");
const replayCss = read("public/styles/extended-features.css");
const hub = read("src/hub.js");
const worker = read("src/index.js");
const common = read("src/common.js");

function between(text, start, end) {
  const a = text.indexOf(start);
  const b = text.indexOf(end, a + start.length);
  assert.ok(a >= 0, `missing start: ${start}`);
  assert.ok(b > a, `missing end: ${end}`);
  return text.slice(a, b);
}

test("polish 18 build marker is wired through client and Worker", () => {
  for (const text of [tutorial, common, read("client/game/90-extended-features.js"), read("client/game/110-online-mobile-polish.js"), read("public/scripts/cloud-client.js")]) {
    assert.match(text, /2026\.10\.13-friends-polish-45/);
  }
});

test("tutorial chapter strip sits directly above the vocabulary HUD", () => {
  const block = between(tutorial, "function drawTutorialProgress", "function getTutorialGoalRect");
  assert.match(block, /const w = 172, x = Math\.round\(W \/ 2 - w \/ 2\), y = 219/);
  assert.match(block, /sceneLabel/);
  assert.match(block, /title/);
});

test("opening bonk uses existing under-platform positions and a real right-to-left charge", () => {
  const config = between(tutorial, 'case "pvpWelcome"', 'case "pvpBonkThree"');
  assert.match(config, /positionPvp\(p1, 145,/);
  assert.match(config, /positionPvp\(ember, 305,/);
  assert.match(config, /positionPvp\(ember,[\s\S]*,\s*-1\)/);
  const demo = between(tutorial, "function beginPvpDemoMotion", "function startPvpDemonstration");
  assert.match(demo, /case "pvpDemoBonk":[\s\S]*scriptPvpChargedJump\(1, \.74, -1, 0\)/);
  assert.match(tutorial, /const keepOpeningPose = setup === "pvpDemoBonk"/);
});

test("PvP poofs can hide only the moving frog and wait for impact effects", () => {
  assert.match(tutorial, /pvpPoofPlayers/);
  assert.match(tutorial, /pvpHiddenPlayerIndices/);
  assert.match(tutorial, /pvpImpactEffects/);
  assert.match(tutorial, /deferredPoofOptions/);
  assert.match(tutorial, /emberStaysPut \? \[0\] : \[0, 1\]/);
});

test("tutorialskip advances one tutorial scene for testing", () => {
  assert.match(tutorial, /debugSkipBuffer\.endsWith\("tutorialskip"\)/);
  assert.match(tutorial, /nextStep\(\)/);
});

test("sandbox shift animation is grounded-only and respawns use the normal interval", () => {
  assert.match(soloModel, /if\(!frog\.grounded \|\| frog\.vy !== 0\) return/);
  assert.match(soloModel, /CONFIG\.flyRespawnDelay/);
});

test("hat progress remains hidden until the hat selector is available", () => {
  assert.match(tutorial, /PENDING_HAT_NOTICES_KEY/);
  assert.match(tutorial, /hatSelectorIsVisibleToPlayer/);
  assert.match(tutorial, /queueHiddenHatNotice/);
  assert.match(tutorial, /flushPendingHatNotices/);
});

test("leaderboard is canvas-native, wraps pages, and opens replay playback", () => {
  assert.match(tutorial, /function drawLeaderboardScreen\(\)/);
  assert.match(tutorial, /drawMiniFrogSwatchFacing/);
  assert.match(tutorial, /polish\.leaderboardPage = \(polish\.leaderboardPage - 1 \+ pageCount\) % pageCount/);
  assert.match(tutorial, /polish\.leaderboardPage = \(polish\.leaderboardPage \+ 1\) % pageCount/);
  assert.match(tutorial, /playReplayById\(replay\.row\.replayId/);
});

test("in-engine replay uses same-origin Worker storage and immutable user ids", () => {
  assert.doesNotMatch(replay, /rr-replay-window/);
  assert.doesNotMatch(replay, /<video controls playsinline/);
  assert.match(replay, /URLSearchParams/);
  assert.match(replay, /credentials:"same-origin"/);
  assert.match(read("client/game/133-engine-replay.js"), /ribbitReplayPreviousDrawScene/);
  assert.match(hub, /CREATE TABLE IF NOT EXISTS record_replays/);
  assert.match(hub, /url\.searchParams\.get\('uid'\)/);
  assert.match(hub, /SELECT mime,data,value,updated FROM record_replays WHERE uid=\?/);
  assert.match(hub, /apiGetLeaderboard/);
  assert.match(hub, /uid:u\.id,username:u\.username/);
  assert.match(worker, /api\/replays/);
});

test("main menu has canvas-native account and device windows and keyboard focus", () => {
  assert.match(tutorial, /rrProfileMenu/);
  assert.match(tutorial, /rrDeviceMenu/);
  assert.match(tutorial, /PROFILE_MENU_ROWS/);
  assert.match(tutorial, /DEVICE_MENU_RECTS/);
  assert.match(tutorial, /ArrowLeft","KeyA/);
  assert.match(tutorial, /ArrowRight","KeyD/);
});

test("single-player tutorial and settings utility buttons are swapped", () => {
  assert.match(nav, /settingsButton: Object\.freeze\(\{ id: "settings", x: 349/);
  assert.match(nav, /tutorialButton: Object\.freeze\(\{ id: "tutorial", x: 379/);
});

test("achievement and standard page navigation wrap consistently", () => {
  assert.match(nav, /setAchievementPage[\s\S]*% count/);
  assert.match(nav, /setStatsPage[\s\S]*% count/);
  assert.match(rendering, /setCustomHatPage[\s\S]*% pageCount/);
});

test("loaded account frog skin is synchronized into gameplay", () => {
  assert.match(tutorial, /function syncLoadedFrogAppearance/);
  assert.match(tutorial, /localStorage\.getItem\("ribbitRaceFrogSkin"\)/);
  assert.match(tutorial, /frog\.skinId = skinId/);
  assert.match(tutorial, /rr-authenticated/);
});
