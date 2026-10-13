import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";

const read = (path) => readFileSync(path, "utf8");
const tutorial = readGameModuleGroup(120, 139);
const online = read("client/game/30-online-versus.js");
const ui = read("client/game/40-ui-navigation-audio.js");
const input = read("client/game/80-input-loop-startup.js");
const rendering = readGameModuleGroup(70, 79);
const core = read("client/game/10-core-config.js");
const pageHats = read("public/scripts/extended-features.js");

function block(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} -> ${end}`);
  return source.slice(from, to);
}

test("Polish 16 cache marker is wired", () => {
  for (const source of [tutorial, read("src/common.js"), read("public/index.html"), read("public/scripts/cloud-client.js")]) {
    assert.match(source, /2026\.10\.13-friends-polish-43/);
  }
});

test("leaderboard rows and dropdowns use visibly different gray stripes", () => {
  assert.match(tutorial, /offset % 2 \? "#dfe5e7" : "#ffffff"/);
  assert.match(tutorial, /index % 2 \? "#dce3e5" : "#ffffff"/);
});

test("online tooltip follows the exact hovered button with compact width", () => {
  const tooltip = block(online, "function drawOnlineTooltip", "function drawOnlineProfile");
  assert.match(tooltip, /const cx=b\.x\+b\.w\/2/);
  assert.match(tooltip, /const width=Math\.ceil\(widest\+18\)/);
  assert.match(tooltip, /px=clamp\(Math\.round\(cx\)/);
  assert.match(tooltip, /state\.screen!=="entry"/);
});

test("Quickplay frog label is raised clear of the frame", () => {
  assert.match(online, /fitText\(palette\.name\|\|state\.localSkinId,W\/2,r\.y\+58/);
});

test("pause utilities sit inside the lower-right and normal restart counts down", () => {
  assert.match(ui, /helpButton: \{ x: 353, y: 198, w: 20, h: 20 \}/);
  assert.match(tutorial, /PAUSE_FULLSCREEN_BUTTON = Object\.freeze\(\{ x: 379, y: 198, w: 20, h: 20 \}\)/);
  assert.match(ui, /function restartCurrentLevel\(\)[\s\S]{0,430}startResumeCountdown\(\)/);
  assert.match(input, /event\.code === "KeyR"[\s\S]{0,250}restartCurrentLevel\(\)/);
  assert.doesNotMatch(tutorial, /event\.code === "KeyR" && game\.state === "paused"/);
});

test("tutorial retry replays dialogue and deliberately skips countdown", () => {
  assert.match(tutorial, /function rebuildCurrentScenarioWithDialogue\(\)[\s\S]{0,900}openDialogue\(\)/);
  assert.match(tutorial, /restartTutorialSceneImmediately\(\)/);
  assert.doesNotMatch(tutorial, /completedResetReason === "pause-retry"\) startResumeCountdown/);
});

test("locked hats remain nonselectable and do not keep a black focus border", () => {
  assert.match(rendering, /\(\(focused&&unlocked\)\|\|selected\)\?COLORS\.ink:"#9aa9ae"/);
  assert.match(rendering, /Locked hats remain informational/);
  assert.match(input, /if \(!isHatUnlocked\(chosen\.id\)\)[\s\S]{0,360}playLockedSkinSound\(\)/);
  assert.doesNotMatch(input, /if \(!isHatUnlocked\(chosen\.id\)\)[\s\S]{0,260}applyHatSelectorChoice/);
});

test("unlocking every base frog color has an achievement and evaluator", () => {
  assert.match(core, /id: "all-frog-colors", name: "RAINBOW POND"/);
  assert.match(ui, /function hasUnlockedAllStandardFrogSkins\(\)/);
  assert.match(ui, /hasUnlockedAllStandardFrogSkins\(\)\) markAchievementEarned\("all-frog-colors"/);
});

test("Set Base header spans the picker and close sits at the extreme inner corner", () => {
  assert.match(tutorial, /CUSTOM_BASE_CLOSE = Object\.freeze\(\{ x:355, y:68, w:18, h:18 \}\)/);
  assert.match(tutorial, /ctx\.fillRect\(panel\.x \+ 5, panel\.y \+ 5, panel\.w - 10, 24\)/);
  assert.match(tutorial, /drawBitmapText\("CHOOSE BASE FROG", panel\.x \+ panel\.w \/ 2, panel\.y \+ 10, \.72, "center"/);
  assert.match(tutorial, /drawMiniFrogSwatchFacing\(option\.x \+ option\.w \/ 2/);
  assert.match(tutorial, /skin\.name \|\| option\.id/);
});

test("Ember nameplate is top-left while equal-height panels retain a visible gap", () => {
  const dialogue = block(tutorial, "function drawTutorialDialogue", "function drawTutorialStatus");
  assert.match(dialogue, /const textPanel = \{ x: 90, y: 6, w: 239, h: 54 \}/);
  assert.match(dialogue, /const portraitPanel = \{ x: 335, y: 6, w: 54, h: 54 \}/);
  assert.match(dialogue, /const namePlate = \{ x:textPanel\.x \+ 7, y:textPanel\.y \+ 7, w:48, h:10 \}/);
  assert.match(dialogue, /const textTop = Math\.round\(textArea\.y\)/);
});

test("matching retry preserves its clue and tongue cinematic keeps its prompt", () => {
  assert.match(tutorial, /function retryThreeCatchAttempt\(\)[\s\S]{0,420}preservePrompt: true/);
  assert.match(tutorial, /keepDuringMissReset/);
  assert.match(tutorial, /keepDuringTongueCinematic/);
  assert.match(tutorial, /setupThreeCatchAttempt\(missedAttemptIndex, true\)/);
});

test("wrong-fly carryover continues normal animation", () => {
  const animation = block(tutorial, "animateFlies = function", "// Capture real-engine jump outcomes");
  assert.match(animation, /originalAnimateFliesForTutorialHold\.call/);
  assert.match(animation, /tutorialArmed = true/);
  assert.doesNotMatch(animation, /baseX\s*=|baseY\s*=|phase\s*=\s*0/);
});

test("single buffer start is five pixels left and closing rivalry line is present", () => {
  assert.match(tutorial, /platforms\[2\]\.x \+ Math\.round\(\(platforms\[2\]\.w - frog\.w\) \/ 2\) - 5/);
  assert.match(tutorial, /Come find me in Versus when you want a challenge\./);
});

test("time-based hats unlock at the win boundary but do not show victory cards", () => {
  assert.match(tutorial, /originalCompleteWinForHatChallenges/);
  assert.match(tutorial, /snapshot\.level === "park" && snapshot\.skin === "forest"[\s\S]{0,120}unlockHatFromLiveProgress\("straw-hat"/);
  assert.match(tutorial, /window\.dispatchEvent\(new CustomEvent\("ribbit-hat-unlocked"/);
  assert.doesNotMatch(input, /items\.push\(\{ type: "hat"/);
  assert.match(read("client/game/40-ui-navigation-audio.js"), /if \(entry\?\.type === "hat"\) return/);
  assert.match(pageHats, /finished\(d=\{\}\)\{if\(!this\.progress\)this\.initialize\(\)/);
});

test("Versus renders the shared mint pause/play sprite once", () => {
  const versus = read("client/game/63-versus-rendering-ui.js");
  assert.match(versus, /drawHudPausePlaySprite\(HUD_UI\.pauseButton/);
  assert.doesNotMatch(tutorial, /drawPvpPauseButtonPolish8\(\);/);
  assert.match(tutorial, /game\.state === "paused" && !game\.onlineMode/);
});
