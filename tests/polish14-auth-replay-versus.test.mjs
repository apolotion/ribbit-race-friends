import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";

const read = (path) => readFileSync(path, "utf8");
const tutorial = readGameModuleGroup(120, 139);
const solo = read("client/game/50-solo-gameplay.js");
const cloud = read("public/scripts/cloud-client.js");
const polish = read("public/scripts/rr-170-polish.js");
const preboot = read("public/scripts/tutorial-preboot.js");
const replay = read("public/scripts/extended-features.js");
const index = read("public/index.html");

test("new accounts force the Solo tutorial after authentication", () => {
  assert.match(cloud, /rrForceSoloTutorialAfterSignup/);
  assert.match(cloud, /localStorage\.removeItem\('rrFriendsEngineTutorialSoloSeenV8'\)/);
  assert.match(polish, /signupForced/);
  assert.match(polish, /engine\.start\(forcedKind\|\|"solo"\)/);
  assert.match(preboot, /rrForceSoloTutorialAfterSignup/);
});

test("one optional post-win tongue catch can produce six out of five", () => {
  assert.match(solo, /game\.score >= getSoloTargetScore\(\) \+ 1/);
  assert.match(solo, /bonusTongueAvailable/);
  assert.match(solo, /return completeBonusCatch\(targetFly\)/);
  assert.match(solo, /game\.score < getSoloTargetScore\(\) \+ 1/);
});

test("leaderboard uses a pixel refresh icon and clickable PB replay names", () => {
  assert.match(tutorial, /function drawLeaderboardRefreshIcon/);
  assert.match(tutorial, /leaderboardNameRects/);
  assert.match(tutorial, /function playLeaderboardRecord/);
  assert.match(tutorial, /RibbitRacePlayRecordReplay/);
  assert.match(replay, /\/api\/replays\/submit/);
  assert.match(replay, /\/api\/replays\/get/);
  assert.match(replay, /URLSearchParams/);
});

test("PvP tutorial preserves player skin, locks Ember, and supports Space", () => {
  assert.match(tutorial, /tutorial\.pvpPlayerSkinId/);
  assert.match(tutorial, /game\.pvpCpuEnabled = true/);
  assert.match(tutorial, /pvpPlayers\[0\]\.skinId = selectedPlayerSkin/);
  assert.match(tutorial, /event\.code === "ShiftRight"/);
  assert.match(tutorial, /originalDrawPvpSpeechBubbleForTutorial/);
  assert.match(tutorial, /if \(tutorial\.active && tutorial\.kind === "pvp"\) return/);
});

test("PvP demonstrations use real charged jumps after a one-second viewing delay", () => {
  assert.match(tutorial, /function scriptPvpChargedJump/);
  assert.match(tutorial, /tutorial\.pvpDemoStartedAt = performance\.now\(\) \+ 1000/);
  assert.match(tutorial, /case "pvpDemoBonk":[\s\S]{0,120}scriptPvpChargedJump\(1, \.74, -1, 0\)/);
  assert.match(tutorial, /case "pvpDemoSkyBonk":[\s\S]{0,180}scriptPvpChargedJump\(1, 1, -1, 0\)/);
  assert.match(tutorial, /WATCH EMBER!/);
});

test("PvP practice keeps authored bonk layouts, crowns Ember, and uses pause-only scene restart", () => {
  assert.match(tutorial, /function positionPvpBonkPracticeLayout/);
  assert.match(tutorial, /next-pvp-bonk/);
  assert.match(tutorial, /Let's see three bonks!/);
  assert.match(tutorial, /hat:"crown"/);
  assert.match(tutorial, /pvpEmberJumpScheduledAt[\s\S]{0,700}scriptPvpChargedJump\(1, \.98, -1, 0\)/);
  assert.doesNotMatch(tutorial, /\["Escape", "KeyR"\]/);
  assert.doesNotMatch(tutorial, /event\.code === "KeyR"[\s\S]{0,160}retryScene/);
});

test("lesson scenes suppress stray flies and keep score counters tutorial-safe", () => {
  assert.match(tutorial, /function clearUnrelatedPvpTutorialFlies/);
  assert.match(tutorial, /despawnTutorialFlies\(\{ onlyUnrelated:true \}\)/);
  assert.match(tutorial, /player\.score = scoreBefore/);
  assert.match(tutorial, /pvpPracticeCatchCount/);
});

test("previous Ribbit Race favicon assets are restored and packaged", () => {
  assert.match(index, /\/icons\/favicon-32\.png/);
  assert.match(index, /\/icons\/favicon-64\.png/);
  assert.equal(existsSync("public/icons/ribbit-race-transparent-source.png"), false);
  assert.ok(readFileSync("public/icons/favicon-64.png").length > 100);
});
