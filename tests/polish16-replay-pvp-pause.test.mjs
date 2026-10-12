import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const tutorial = read("client/game/120-engine-tutorial.js");
const versus = read("client/game/60-versus-gameplay.js");
const hub = read("src/hub.js");
const worker = read("src/index.js");
const replay = read("public/scripts/extended-features.js");
const index = read("public/index.html");

function block(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} -> ${end}`);
  return source.slice(from, to);
}

test("Polish 16 is wired and restores the prior packaged app icons", () => {
  for (const source of [tutorial, read("src/common.js"), index, read("public/scripts/cloud-client.js")]) {
    assert.match(source, /2026\.10\.12-friends-polish-20/);
  }
  assert.match(index, /\/icons\/favicon-32\.png/);
  assert.match(index, /\/icons\/ribbit-race-180\.png/);
  assert.equal(existsSync("public/icons/ribbit-race-transparent-source.png"), false);
  assert.ok(readFileSync("public/icons/ribbit-race-512.png").length > 1000);
});

test("record replays are same-origin Worker routes backed by FriendsHub SQLite", () => {
  assert.match(worker, /path\.startsWith\('\/api\/replays\/'\)/);
  assert.match(worker, /env\.HUB\.getByName\('friends-main-v1'\)/);
  assert.match(hub, /CREATE TABLE IF NOT EXISTS record_replays/);
  assert.match(hub, /\/api\/replays\/health/);
  assert.match(hub, /storage:'durable-object-sqlite'/);
  assert.match(hub, /\/api\/replays\/submit/);
  assert.match(hub, /\/api\/replays\/get/);
  assert.match(replay, /credentials:"same-origin"/);
  assert.match(replay, /Replay PB upload skipped/);
  assert.match(hub, /SELECT id,username,name FROM users WHERE id=\?/);
  assert.match(replay, /A separate video server is not required/);
});

test("PvP scenes hold prior poses through dialogue and poof only after the handoff", () => {
  const configure = block(tutorial, "function configureStep", "function addTutorialPoof");
  assert.match(configure, /pendingPvpTargetPoses = tutorial\.kind === "pvp" \? capturePvpTutorialPoses\(\) : null/);
  assert.match(configure, /applyPvpTutorialPoses\(preservedPvpVisualPoses\)/);
  assert.match(configure, /freezeControlledEntity\(\)/);
  const arm = block(tutorial, "function armScenarioAfterDialogue", "function closeDialogue");
  assert.match(arm, /startPvpDemonstration/);
  assert.match(arm, /beginScenarioEntryTransition\(\)/);
});

test("Escape uses ordinary pause while R alone retries an active tutorial scene", () => {
  assert.doesNotMatch(tutorial, /\["Escape", "KeyR"\]/);
  assert.match(tutorial, /event\.code === "KeyR"/);
  assert.match(tutorial, /Escape uses the game's ordinary pause flow/);
  assert.match(tutorial, /if \(tutorial\.active && game\.state === "paused"/);
  assert.match(tutorial, /if \(tutorial\.active\)[\s\S]{0,320}drawTutorialOverlay\(\)[\s\S]{0,260}drawTutorialPauseOverlay\(\)/);
});

test("tutorial pause is topmost and includes chapter navigation", () => {
  assert.match(tutorial, /function tutorialSceneCatalog/);
  assert.match(tutorial, /function selectTutorialChapter/);
  assert.match(tutorial, /drawTutorialPauseArrow/);
  assert.match(tutorial, /drawBitmapText\("TUTORIAL"/);
  assert.match(tutorial, /CHAPTER \$\{previewIndex \+ 1\} \/ \$\{catalog\.length\}/);
  assert.match(tutorial, /drawPauseControls\(\)/);
});

test("opening bonk is a real right-to-left charged jump from the authored clear lane", () => {
  assert.match(tutorial, /case "pvpDemoBonk":[\s\S]{0,260}middleLeft\.x \+ 18[\s\S]{0,180}middleLeft\.x \+ 86/);
  assert.match(tutorial, /case "pvpDemoBonk":[\s\S]{0,120}scriptPvpChargedJump\(1, \.44, -1, 0\)/);
  assert.match(tutorial, /tutorial\.pvpDemoStartedAt = performance\.now\(\) \+ 1000/);
});

test("three bonks preserve completed attempts, reposition on misses and sparkle on success", () => {
  assert.match(tutorial, /function positionPvpBonkPracticeLayout/);
  assert.match(tutorial, /const completedBonks = tutorial\.pvpBonks/);
  assert.match(tutorial, /tutorial\.pvpBonks = completedBonks/);
  assert.match(tutorial, /reason:"retry-pvp-bonk-position"/);
  assert.match(tutorial, /setup === "pvpBonkThree"[\s\S]{0,240}catchSparkleTimer/);
  assert.match(tutorial, /playCorrectFlySound\(\)/);
});

test("rebound effects finish before any next poof", () => {
  const settled = block(tutorial, "function pvpTutorialSettled", "function consumePvpPlayerLanding");
  assert.match(settled, /game\.pvpImpactEffects/);
  assert.match(settled, /!impactActive/);
  assert.match(tutorial, /setup === "pvpDemoRebound"[\s\S]{0,180}pvpTutorialSettled\(\)/);
  assert.match(tutorial, /setup === "pvpReboundThree"[\s\S]{0,180}pvpTutorialSettled\(\)/);
});

test("PvP lesson prompts and authored flies are isolated", () => {
  assert.match(tutorial, /function clearUnrelatedPvpTutorialFlies/);
  assert.match(tutorial, /if \(!flies\[index\]\?\.tutorialAuthored\) flies\.splice/);
  assert.doesNotMatch(tutorial.slice(0, 500), /pvpDemoBonkCatch/);
  assert.match(tutorial, /schedulePvpFlyReveal\(setup, pvpFlyRevealDelayMs\(setup\)\)/);
  assert.match(tutorial, /tutorial\.promptHidden = true/);
});

test("frog poofs retract both PvP tongues and lesson timer chrome stays hidden", () => {
  assert.match(tutorial, /function resetPvpTutorialTongues/);
  assert.match(tutorial, /playerTongue\.active = false/);
  assert.match(tutorial, /function beginPoofTransition[\s\S]{0,1800}resetPvpTutorialTongues\(\)/);
  assert.match(versus, /const tutorialPvp = Boolean/);
  assert.match(versus, /if \(!tutorialPvp \|\| tutorialFinalMatch\)/);
});

test("drop-bonk layouts are authored for clear lower and high routes", () => {
  assert.match(tutorial, /case "pvpDemoDropLow"[\s\S]{0,280}lowerMiddle/);
  assert.match(tutorial, /case "pvpDropLow"[\s\S]{0,280}lowerMiddle/);
  assert.match(tutorial, /case "pvpDemoDropHigh"[\s\S]{0,360}positionPvpOnPlatform\(ember, top, -1, offset\)/);
  assert.match(tutorial, /case "pvpDropHigh"[\s\S]{0,320}positionPvpOnPlatform\(p1, top, -1, offset\)/);
  assert.match(tutorial, /RibbitRaceTutorialShouldIgnorePvpPlatform/);
  assert.match(versus, /RibbitRaceTutorialShouldIgnorePvpPlatform/);
});
