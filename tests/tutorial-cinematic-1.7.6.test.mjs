import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = readGameModuleGroup(120, 139);
const core = read("client/game/10-core-config.js");
const render = readGameModuleGroup(70, 79);
const polish = read("public/scripts/rr-170-polish.js");

function block(start, end) {
  const from = engine.indexOf(start);
  assert.ok(from >= 0, `Missing start marker: ${start}`);
  const to = engine.indexOf(end, from);
  assert.ok(to >= 0, `Missing end marker: ${end}`);
  return engine.slice(from, to);
}

test("1.7.26 polished tutorial build and first-boot marker are installed", () => {
  assert.equal(JSON.parse(read("package.json")).version, "1.7.26");
  assert.match(read("src/common.js"), /2026\.10\.13-friends-polish-38/);
  assert.match(engine, /const TUTORIAL_BUILD = "2026\.10\.13-friends-polish-38"/);
  assert.match(engine, /rrFriendsEngineTutorialSoloSeenV8/);
});

test("Ember portraits preload and rotate within every dialogue scene", () => {
  assert.match(engine, /EMBER_PORTRAITS_READY/);
  assert.match(engine, /EMBER_PORTRAIT_SEQUENCE_BY_SETUP/);
  for (const setup of ["intro", "longJumps", "threeCatches", "rangeCatch", "normalRound", "pvpWelcome"]) {
    assert.match(engine, new RegExp(`${setup}: Object\\.freeze\\(\\[`));
  }
  assert.match(engine, /sequence\[tutorial\.dialogueLineIndex % sequence\.length\]/);
  assert.match(engine, /No second frog is rendered in the playable tutorial arena/);
});

test("dialogue uses large left-aligned two-line RPG typography, hold-to-speed, and a half-speed two-frame arrow", () => {
  assert.match(engine, /TYPEWRITER_MS_PER_CHARACTER = 28/);
  assert.match(engine, /DIALOGUE_TEXT_SCALE = 0\.86/);
  assert.match(engine, /layoutBitmapText\(fullLine, textArea\.w, \{/);
  assert.match(engine, /maxScale: DIALOGUE_TEXT_SCALE/);
  assert.match(engine, /minScale: 0\.68/);
  assert.match(engine, /drawEmberDialogueLine\([\s\S]{0,180}textArea\.x/);
  assert.doesNotMatch(engine, /textArea\.x \+ textArea\.w \/ 2 - fullLineWidth \/ 2/);
  assert.match(engine, /Adding held time once more makes holding\s+\/\/ Space exactly twice as fast/);
  assert.match(engine, /DIALOGUE_SPACE_HOLD_THRESHOLD_MS = 180/);
  assert.match(engine, /DIALOGUE_TRIANGLE_FRAME_MS = 520/);
  assert.match(engine, /Math\.floor\(performance\.now\(\) \/ DIALOGUE_TRIANGLE_FRAME_MS\) % 2/);
  assert.match(engine, /drawDialogueContinueTriangle/);
  assert.doesNotMatch(engine, /SPACE (?:FOR NEXT|TO PLAY)|TAP (?:FOR NEXT|TO PLAY)/);
});

test("dialogue matches the layered cyan-and-white reference with a full square Ember portrait", () => {
  const dialogue = block("function drawTutorialDialogue", "function drawTutorialStatus");
  assert.match(dialogue, /const textPanel = \{ x: 90, y: 6, w: 239, h: 54 \}/);
  assert.match(dialogue, /const portraitPanel = \{ x: 335, y: 6, w: 54, h: 54 \}/);
  assert.match(dialogue, /const drawReferencePanel/);
  assert.match(dialogue, /Five-layer pixel frame: black -> cyan -> white -> cyan -> black/);
  assert.match(dialogue, /drawReferencePanel\(textPanel, "#0b4462", "#052b43"\)/);
  assert.match(dialogue, /drawReferencePanel\(portraitPanel, "#159ee4", "#087cc5"\)/);
  assert.match(dialogue, /const imageSize = portraitPanel\.w - 10/);
  assert.match(dialogue, /const fit = Math\.min\(imageSize \/ sourceW, imageSize \/ sourceH\)/);
  assert.match(dialogue, /ctx\.drawImage\(portraitImage, 0, 0, sourceW, sourceH, drawX, drawY, drawW, drawH\)/);
  assert.match(dialogue, /const namePlate = \{ x:textPanel\.x \+ 7, y:textPanel\.y \+ 7, w:48, h:10 \}/);
  assert.match(dialogue, /drawBitmapText\("EMBER", namePlate\.x \+ namePlate\.w \/ 2, namePlate\.y \+ 2, \.58, "center"/);
  assert.doesNotMatch(dialogue, /indigo|rightRail|portraitRail/i);
});

test("first boot waits for login and starts without a one-frame main-menu reveal", () => {
  assert.match(polish, /authenticationBoundaryReleased/);
  assert.match(polish, /authenticatedProfileReady/);
  assert.match(polish, /rr-tutorial-pending/);
  assert.match(polish, /const started=engine\.start\(forcedKind\|\|"solo"\)/);
  assert.doesNotMatch(polish, /requestAnimationFrame\(\(\) => requestAnimationFrame/);
  const index = read("public/index.html");
  assert.match(index, /ribbit-auth-locked rr-tutorial-pending/);
  assert.match(index, /tutorial-preboot\.js/);
});

test("background and armed flies keep animating while dialogue locks only the frog", () => {
  assert.match(engine, /function updateTutorialAmbient/);
  assert.match(engine, /game\.visualTime \+= safeDt/);
  assert.match(engine, /game\.worldTime \+= safeDt/);
  assert.match(engine, /animateFlies\(safeDt\)/);
  const open = block("function openDialogue", "function tutorialFlyKey");
  assert.doesNotMatch(open, /armTutorialFlies\(\)/);
  assert.match(open, /Authored tutorial flies stay hidden until the frog's matching poof-in/);
  assert.match(engine, /function tutorialBlocksLiveInput/);
  assert.match(engine, /tutorialMovementLocked\(\) \|\| tutorial\.pvpDemoActive \|\| tutorial\.pvpPlayerScriptLocked/);
});

test("the dinner fly finishes its poof, then waits half a second before the line", () => {
  const prep = block("function prepareDialogueLine", "function armScenarioAfterDialogue");
  assert.match(prep, /setup === "threeCatches" && nextIndex === 1/);
  assert.match(prep, /beginDialogueLine\(nextIndex\)/);
  const sceneStart = block("function configureStep", "function addTutorialPoof");
  assert.match(sceneStart, /setup === "threeCatches"/);
  assert.match(sceneStart, /delayMs: POOF_TRANSITION_MS \+ FLY_DIALOGUE_REVEAL_HOLD_MS/);
  assert.match(engine, /FLY_DIALOGUE_REVEAL_HOLD_MS = 500/);
  assert.match(engine, /dialogueHeldLineText/);
  assert.match(engine, /tutorial\.dialogueHeldUntil > now/);
  assert.match(engine, /tutorial\.dialogueLineIndex === 2/);
  assert.match(engine, /tutorial\.dialogueLineIndex === 3/);
  assert.match(engine, /drawFlashingReferenceFrame\(\{ x:154, y:234, w:172, h:33 \}\)/);
});

test("range and match-spit actors poof on their lines while wall-turn waits until its final line closes", () => {
  const prep = block("function prepareDialogueLine", "function armScenarioAfterDialogue");
  assert.match(prep, /setup === "rangeCatch" && nextIndex === 4/);
  assert.match(prep, /setup === "comboMixed" && nextIndex === 2/);
  assert.doesNotMatch(prep, /setup === "wallTurn"/);
  assert.match(prep, /beginDialogueScenarioPlacement\(nextIndex\)/);
  const placement = block("function beginDialogueScenarioPlacement", "function prepareDialogueLine");
  assert.match(placement, /delayMs: POOF_TRANSITION_MS \+ postPoofDelayMs/);
  assert.match(placement, /holdPreviousText: true/);
  assert.match(placement, /tutorial\.scenePositionedDuringDialogue = true/);
  const arm = block("function armScenarioAfterDialogue", "function closeDialogue");
  assert.match(arm, /beginScenarioEntryTransition\(\)/);
  assert.ok(engine.includes("Then jump back and catch the fly you passed."));
});

test("poof transitions are exactly half a second and preserve already-visible flies when requested", () => {
  assert.match(engine, /POOF_TRANSITION_MS = 500/);
  assert.match(engine, /tutorial\.resetAt = performance\.now\(\) \+ POOF_TRANSITION_MS/);
  assert.match(engine, /collectVisibleTutorialFlyKeys/);
  assert.match(engine, /preserveExistingFlies/);
  assert.match(engine, /armTutorialFlies\(\{ preserveKeys: preserveFlyKeys \}\)/);
  assert.match(engine, /updateTutorialAmbient\(dt, \{ animateFlies: true \}\)/);
  assert.match(engine, /playTutorialPoofSound\("out"\)/);
  assert.match(engine, /playTutorialPoofSound\("in"\)/);
});

test("Park is mirrored and only its two center platforms share a vertical column", () => {
  for (const literal of [
    '{ x: 36,  y: 169, w: 72, h: 12 }',
    '{ x: 372, y: 169, w: 72, h: 12 }',
    '{ x: 129, y: 126, w: 70, h: 12 }',
    '{ x: 281, y: 126, w: 70, h: 12 }',
    '{ x: 204, y: 176, w: 72, h: 12 }',
    '{ x: 206, y: 70,  w: 68, h: 12 }'
  ]) assert.ok(core.includes(literal), literal);
  assert.match(engine, /platforms = cloneParkPlatforms\(\)/);
  assert.match(engine, /positionSoloFrog\(getNormalParkStartX\(\)\)/);
});

test("each proper long-jump landing gets the normal catch sparkle and success sound", () => {
  const monitor = block('if (setup === "longJumps")', 'if (setup === "threeCatches")');
  assert.match(monitor, /lastJumpPower >= \.90/);
  assert.match(monitor, /frog\.catchSparkleTimer = Math\.max\(frog\.catchSparkleTimer, CONFIG\.catchSparkleDuration\)/);
  assert.match(monitor, /playCorrectFlySound\(\)/);
  assert.match(monitor, /longJumpStreak >= 3/);
});

test("tongue lesson starts at the normal ground position, lowers the fly by the same offset, and invokes the stock cinematic", () => {
  const range = engine.slice(engine.indexOf('case "rangeCatch"'), engine.indexOf('case "wrongFly"'));
  assert.match(range, /positionSoloFrog\(getNormalParkStartX\(\), CONFIG\.groundY - frog\.h, 1\)/);
  assert.match(range, /const targetPlatform = platforms\[5\]/);
  assert.match(range, /const targetX = Math\.round\(targetPlatform\.x \+ targetPlatform\.w \/ 2\)/);
  assert.match(range, /const targetY = Math\.round\(platforms\[5\]\.y - \(platforms\[5\]\.y - platforms\[4\]\.y\) \* 0\.40\)/);
  assert.match(range, /makeFly\(targetX, targetY, 0, 4\)/);
  assert.match(engine, /activeSetup === "rangeCatch" && wasCorrect && source !== "tongue"/);
  assert.match(engine, /const originalShouldStartSoloCriticalCatchForTutorial = shouldStartSoloCriticalCatch/);
  assert.match(engine, /const isRangeMatch = activeSetup === "rangeCatch"/);
  assert.match(engine, /if \(isRangeMatch\) return true/);
  assert.doesNotMatch(engine, /slowMoUntil|tutorialSlowMo|separate slow-mo/i);
});

test("multi-fly lessons use the requested mirrored and three-fly routes", () => {
  assert.match(engine, /case "comboMixed":[\s\S]{0,250}makeFly\(165, 108, 0, 0\)[\s\S]{0,100}makeFly\(240, 108, 1, 1\)/);
  assert.match(engine, /case "comboTwo":[\s\S]{0,260}W - 42 - frog\.w[\s\S]{0,120}makeFly\(315, 108, 0, 0\)[\s\S]{0,100}makeFly\(240, 108, 1, 1\)/);
  assert.match(engine, /case "comboThree":[\s\S]{0,260}positionCenteredOnPlatform\(platforms\[2\], 1\)[\s\S]{0,120}makeFly\(242, 52, 0, 0\)[\s\S]{0,100}makeFly\(365, 52, 1, 1\)[\s\S]{0,100}makeFly\(430, 111, 2, 2\)/);
  assert.match(engine, /activeSetup === "comboMixed" && wasCorrect[\s\S]{0,420}wrongPromptIndex/);
  assert.match(engine, /function retryThreeCatchAttempt/);
  assert.match(engine, /setupThreeCatchAttempt\(missedAttemptIndex, true\)/);
});

test("correct three-catch landings hold a quarter second before the next poof", () => {
  assert.match(engine, /tutorial\.sceneLandingDelayUntil = now \+ 250/);
  assert.match(engine, /freezeControlledEntity\(\)/);
  assert.match(engine, /if \(now < tutorial\.sceneLandingDelayUntil\) return/);
});

test("buffer and quick drops do not consume tutorial jump attempts", () => {
  const launch = block("launchJump = function", "// Hide the normal first-jump keyboard bubble");
  assert.match(launch, /const quick = Boolean\(active && standing && !standing\.ground/);
  assert.match(launch, /const actualLaunch = Number\(game\.jumps \|\| 0\) > jumpsBefore/);
  assert.match(launch, /if \(active && actualLaunch\)/);
  assert.match(launch, /A normal platform drop is a real jump attempt/);
  assert.match(launch, /if \(quick\) \{/);
  assert.match(launch, /if \(setup === "longJumps"\)[\s\S]{0,100}failAttempt\("PLATFORM DROPS DO NOT COUNT AS LONG JUMPS"\)/);
  assert.match(engine, /case "wallTurn":[\s\S]{0,170}makeParkFly\(7, 0, 0\)/);
});

test("successful wall techniques continue physics to landing before freezing", () => {
  assert.match(engine, /function passStep\(\)[\s\S]{0,420}!frog\.grounded \|\| tongue\.active \|\| game\.soloCriticalCatchActive/);
  assert.match(engine, /tutorial\.passPending = true/);
  assert.match(engine, /if \(frog\.grounded && !tongue\.active && !game\.soloCriticalCatchActive\) finalizePassedStep\(\)/);
  assert.match(engine, /function finalizePassedStep\(\)[\s\S]{0,900}freezeControlledEntity\(\)/);
});

test("Current Goal uses the normal stats footprint and the clue shadow stops at its boundary", () => {
  assert.match(engine, /return \{ x:328, y:234, w:tutorial\.kind === "pvp" \? 116 : 150, h:33 \}/);
  assert.match(engine, /const goalCenterX = x \+ w \/ 2/);
  assert.match(render, /ctx\.fillRect\(left \+ 2, top \+ 2, width - 2, height\)/);
  assert.match(engine, /function currentGoalHowToLines/);
  assert.match(engine, /pointInsideRect\(getCanvasPoint\(event\), getTutorialGoalRect\(\)\)/);
});

test("tutorial terms blank only their value while goals remain live", () => {
  assert.match(engine, /Math\.min\(3, tutorial\.sceneCatchCount\)/);
  assert.match(engine, /function drawBlankTutorialVocabularyPrompt/);
  assert.match(engine, /"FIND THE MATCH"/);
  assert.match(engine, /function currentGoalLines[\s\S]{0,220}scene's objective remains visible/);
  assert.match(engine, /function drawTutorialOverlay\(\)[\s\S]{0,500}drawCurrentGoalHud\(\)/);
});

test("pause provides retry and skip, and resuming tutorial bypasses the countdown", () => {
  assert.match(render, /"RESTART SCENE"/);
  assert.match(render, /"EXIT TUTORIAL"/);
  assert.match(engine, /const originalResumePausedGameForTutorial = resumePausedGame/);
  assert.match(engine, /if \(tutorial\.active && game\.state === "paused"\)[\s\S]{0,260}game\.state = "playing"/);
  assert.match(engine, /game\.countdownNumber = 0/);
  assert.match(engine, /game\.countdownTimer = 0/);
  assert.match(engine, /restorePauseChargeSnapshot\(\)/);
});

test("trajectory preview is suppressed through dialogue and poofs", () => {
  assert.match(engine, /const originalDrawArcPreviewForTutorial = drawArcPreview/);
  assert.match(engine, /tutorialMovementLocked\(\) \|\| tutorial\.frogHidden \|\| tutorial\.resetPending/);
});

test("tutorial completion waits for Ember, then shows a dancing-frog completion sign with one Home button", () => {
  assert.match(engine, /FINAL_TUTORIAL_DIALOGUE/);
  assert.match(engine, /beginFinalTutorialMessage\(\)/);
  assert.match(engine, /const originalCompleteWinForTutorial = completeWin/);
  assert.match(engine, /game\.victoryMessage = "TUTORIAL COMPLETE!"/);
  assert.match(engine, /drawBitmapText\(title[\s\S]{0,220}"TUTORIAL COMPLETE!"|const title = "TUTORIAL COMPLETE!"/);
  assert.match(engine, /replayButton: \{ x: -300, y: -300, w: 1, h: 1 \}/);
  assert.match(engine, /homeButton: \{ x: Math\.round\(W \/ 2 - 60\), y: 232, w: 120, h: 22 \}/);
  assert.match(engine, /frog\.x = Math\.round\(W \/ 2 - frog\.w \/ 2\)/);
  assert.match(engine, /playWinSound\(\)/);
  assert.match(engine, /PVP_TUTORIAL_ACHIEVEMENT_ID/);
  assert.match(engine, /markAchievementEarned\(TUTORIAL_ACHIEVEMENT_ID, false\)/);
});
