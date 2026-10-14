import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = readGameModuleGroup(120, 139);
const ui = read("client/game/40-ui-navigation-audio.js");
const input = read("client/game/80-input-loop-startup.js");
const index = read("public/index.html");

function block(start, end) {
  const from = engine.indexOf(start);
  assert.ok(from >= 0, `Missing start marker: ${start}`);
  const to = engine.indexOf(end, from);
  assert.ok(to >= 0, `Missing end marker: ${end}`);
  return engine.slice(from, to);
}

test("polish-9 cache marker and tutorial seen key are synchronized", () => {
  assert.match(engine, /TUTORIAL_BUILD = "2026\.10\.13-friends-polish-62"/);
  assert.match(index, /game\.bundle\.js\?v=2026\.10\.13-friends-polish-62/);
  assert.match(engine, /rrFriendsEngineTutorialSoloSeenV8/);
  assert.match(read("public/scripts/tutorial-preboot.js"), /rrFriendsEngineTutorialSoloSeenV8/);
});

test("latest Solo tutorial copy and mechanics are installed", () => {
  for (const phrase of [
    "You don't have to land right on top of a fly to catch it.",
    "All this jumping sure does work up an appetite.",
    "So why stop at only one fly per jump?",
    "If you get lucky, you might catch two flies in one jump!",
    "Now, let's say that you're REALLY hungry and need a snack as soon as possible.",
    "Show me a buffered jump charge right after you land."
  ]) assert.ok(engine.includes(phrase), phrase);
  assert.doesNotMatch(engine, /That wrong fly does not count\./);
  assert.doesNotMatch(engine, /You can come back to it later\./);
  assert.match(engine, /setup === "longJumps"[\s\S]{0,220}failAttempt\("PLATFORM DROPS DO NOT COUNT AS LONG JUMPS"\)/);
  assert.match(engine, /const actualLaunch = Number\(game\.jumps \|\| 0\) > jumpsBefore/);
});

test("Ember portrait fills its square and the centered nameplate sits in the text panel", () => {
  const dialogue = block("function drawTutorialDialogue", "function drawTutorialStatus");
  assert.match(dialogue, /const portraitPanel = \{ x: 335, y: 6, w: 54, h: 54 \}/);
  assert.match(dialogue, /const imageSize = portraitPanel\.w - 10/);
  assert.match(dialogue, /ctx\.drawImage\(portraitImage, 0, 0, sourceW, sourceH, drawX, drawY, drawW, drawH\)/);
  assert.match(dialogue, /const namePlate = \{ x:textPanel\.x \+ 7, y:textPanel\.y \+ 7, w:48, h:10 \}/);
  assert.match(dialogue, /name now sits in the upper-left of the dialogue panel/);
  assert.match(dialogue, /drawBitmapText\("EMBER", namePlate\.x \+ namePlate\.w \/ 2, namePlate\.y \+ 2, \.58, "center"/);
});

test("goal card survives pause and flies remain animated through poofs", () => {
  assert.match(engine, /if \(game\.state === "paused"\) \{\s*drawCurrentGoalHud\(\)/);
  assert.match(engine, /updateTutorialAmbient\(dt, \{ animateFlies: true \}\)/);
  assert.match(engine, /drawSoloPauseOverlay = function[\s\S]{0,100}if \(tutorial\.active\) return/);
});

test("tongue and multi-fly lessons use the requested positioning and cinematic", () => {
  const range = engine.slice(engine.indexOf('case "rangeCatch"'), engine.indexOf('case "wrongFly"'));
  assert.match(range, /positionSoloFrog\(getNormalParkStartX\(\), CONFIG\.groundY - frog\.h, 1\)/);
  assert.match(range, /const targetX = Math\.round\(targetPlatform\.x \+ targetPlatform\.w \/ 2\)/);
  assert.match(range, /\* 0\.40/);
  assert.match(engine, /const isComboThreeFinish = activeSetup === "comboThree"/);
  assert.match(engine, /if \(isComboThreeFinish\) return true/);
});

test("Versus tutorial covers all sixteen authored scenes", () => {
  for (let scene = 1; scene <= 16; scene += 1) {
    assert.match(engine, new RegExp(`"scene": ${scene}`));
  }
  for (const phrase of [
    "WELCOME TO THE COMPETITION",
    "YOUR FIRST BONKS",
    "DINNER WHILE THEY'RE DIZZY",
    "LOW DROP BONK",
    "SKY BONKS",
    "UNDER BONKS",
    "YOUR FIRST REBOUNDS",
    "THE DINNER STEAL",
    "ONE ROUND, TWO HUNGRY FROGS"
  ]) assert.ok(engine.includes(phrase), phrase);
});

test("Versus demonstrations use Ember Level 5 and scripted Watch/Your Turn control", () => {
  assert.match(engine, /game\.pvpCpuDifficulty = 5/);
  assert.match(engine, /pvpPlayers\[1\]\.skinId = "ember"/);
  assert.match(engine, /tutorial\.pvpCaption = "WATCH EMBER!"/);
  assert.match(engine, /tutorial\.pvpCaption = "YOUR TURN!"/);
  assert.match(engine, /tutorial\.pvpDemoActive/);
  assert.match(engine, /tutorialBlocksLiveInput[\s\S]{0,260}tutorial\.pvpDemoActive/);
});

test("Versus fly lessons use scripted delayed reveals", () => {
  assert.match(engine, /PVP_ONE_SECOND_FLY_SETUPS/);
  assert.match(engine, /function schedulePvpFlyReveal/);
  assert.match(engine, /performance\.now\(\) \+ safeDelay/);
  assert.match(engine, /return PVP_ONE_SECOND_FLY_SETUPS\.has[\s\S]{0,80}\? 1000 : 0/);
  assert.match(engine, /\["pvpIntercept", "pvpDemoDinnerSteal", "pvpDinnerSteal"\]\.includes\(setup\)\) return 0/);
});

test("Versus tutorial button opens the tutorial instead of Coming Soon", () => {
  assert.match(ui, /pvpSetupBottomSelection === "tutorial"[\s\S]{0,180}RibbitRaceTutorialEngine/);
  assert.match(input, /PVP_SETUP_UI\.tutorialButton[\s\S]{0,220}RibbitRaceTutorialEngine\?\.start\?\.\("pvp"\)/);
});

test("final Versus lesson is one 30-second best-of-one match with scripted endings", () => {
  assert.match(engine, /game\.pvpTimeLimitSeconds = 30/);
  assert.match(engine, /game\.pvpBestOf = 1/);
  assert.match(engine, /game\.pvpCpuEnabled = true/);
  assert.match(engine, /PVP_WIN_DIALOGUE/);
  assert.match(engine, /PVP_LOSE_DIALOGUE/);
  assert.match(engine, /Your training is complete, win or lose\./);
  assert.match(engine, /beginPvpTutorialEnding/);
});
