import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = read("client/game/120-engine-tutorial.js");
const core = read("client/game/10-core-config.js");
const render = read("client/game/70-rendering.js");
const polish = read("public/scripts/rr-170-polish.js");

function block(start, end) {
  const from = engine.indexOf(start);
  assert.ok(from >= 0, `Missing start marker: ${start}`);
  const to = engine.indexOf(end, from);
  assert.ok(to >= 0, `Missing end marker: ${end}`);
  return engine.slice(from, to);
}

test("1.7.10 polished tutorial build and first-boot marker are installed", () => {
  assert.equal(JSON.parse(read("package.json")).version, "1.7.10");
  assert.match(read("src/common.js"), /2026\.10\.12-friends-tutorial-polish-5/);
  assert.match(engine, /const TUTORIAL_BUILD = "2026\.10\.12-friends-tutorial-polish-5"/);
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
  assert.match(engine, /drawBitmapText\([\s\S]{0,180}textArea\.x,[\s\S]{0,180}"left"/);
  assert.doesNotMatch(engine, /textArea\.x \+ textArea\.w \/ 2 - fullLineWidth \/ 2/);
  assert.match(engine, /Adding held time once more makes holding\s+\/\/ Space exactly twice as fast/);
  assert.match(engine, /DIALOGUE_SPACE_HOLD_THRESHOLD_MS = 180/);
  assert.match(engine, /DIALOGUE_TRIANGLE_FRAME_MS = 520/);
  assert.match(engine, /Math\.floor\(performance\.now\(\) \/ DIALOGUE_TRIANGLE_FRAME_MS\) % 2/);
  assert.match(engine, /drawDialogueContinueTriangle/);
  assert.doesNotMatch(engine, /SPACE (?:FOR NEXT|TO PLAY)|TAP (?:FOR NEXT|TO PLAY)/);
});

test("dialogue keeps the approved dark box while Ember uses an equal-height border with no right-side rail", () => {
  const dialogue = block("function drawTutorialDialogue", "function drawTutorialStatus");
  assert.match(dialogue, /const textPanel = \{ x: 92, y: 7, w: 244, h: 42 \}/);
  assert.match(dialogue, /const portraitPanel = \{ x: 338, y: 7, w: 42, h: 42 \}/);
  assert.match(dialogue, /const border = 2/);
  assert.match(dialogue, /drawDialoguePanel\(textPanel, "#052f45"\)/);
  assert.match(dialogue, /ctx\.fillStyle = "#073b55"/);
  assert.match(dialogue, /drawDialoguePanel\(portraitPanel, "#2a6d8e"\)/);
  assert.match(dialogue, /const imageSize = portraitPanel\.w - border \* 2/);
  assert.match(dialogue, /drawBitmapText\("EMBER"[\s\S]{0,100}\.68, "center"/);
  assert.doesNotMatch(dialogue, /strokeRect\(|indigo|rightRail|portraitRail/i);
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
  assert.match(engine, /tutorialMovementLocked\(\) \|\| tutorial\.passPending \|\| tutorial\.blockJumpUntilRelease/);
});

test("the dinner fly finishes its poof, then waits half a second before the line", () => {
  const prep = block("function prepareDialogueLine", "function armScenarioAfterDialogue");
  assert.match(prep, /setup === "threeCatches" && nextIndex === 1/);
  assert.match(prep, /beginDialogueScenarioPlacement\(nextIndex, \{/);
  assert.match(prep, /postPoofDelayMs: FLY_DIALOGUE_REVEAL_HOLD_MS/);
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
  assert.match(engine, /animateFlies: !tutorial\.resetPending/);
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

test("tongue lesson poofs to the front edge and invokes the stock final-catch cinematic", () => {
  const range = engine.slice(engine.indexOf('case "rangeCatch"'), engine.indexOf('case "wrongFly"'));
  assert.match(range, /positionOnPlatform\(platforms\[1\], platforms\[1\]\.w - frog\.w - 1, 1\)/);
  assert.match(range, /makeFly\(324, 38, 0, 4\)/);
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
  assert.match(engine, /setupThreeCatchAttempt\(missedAttemptIndex, false\)/);
});

test("correct three-catch landings hold for half a second before the next poof", () => {
  assert.match(engine, /CORRECT_CATCH_LANDING_HOLD_MS = 500/);
  assert.match(engine, /tutorial\.sceneLandingDelayUntil = now \+ CORRECT_CATCH_LANDING_HOLD_MS/);
  assert.match(engine, /freezeControlledEntity\(\)/);
  assert.match(engine, /if \(now < tutorial\.sceneLandingDelayUntil\) return/);
});

test("buffer and quick drops do not consume tutorial jump attempts", () => {
  const launch = block("launchJump = function", "// Hide the normal first-jump keyboard bubble");
  assert.match(launch, /const quick = Boolean\(active && standing && !standing\.ground/);
  assert.match(launch, /game\.jumps = jumpsBefore/);
  assert.match(launch, /game\.totalJumps = totalJumpsBefore/);
  assert.match(launch, /return result/);
  assert.match(engine, /case "wallTurn":[\s\S]{0,170}makeParkFly\(7, 0, 0\)/);
});

test("successful wall techniques continue physics to landing before freezing", () => {
  assert.match(engine, /function passStep\(\)[\s\S]{0,420}!frog\.grounded \|\| tongue\.active \|\| game\.soloCriticalCatchActive/);
  assert.match(engine, /tutorial\.passPending = true/);
  assert.match(engine, /if \(frog\.grounded && !tongue\.active && !game\.soloCriticalCatchActive\) finalizePassedStep\(\)/);
  assert.match(engine, /function finalizePassedStep\(\)[\s\S]{0,220}freezeControlledEntity\(\)/);
});

test("Current Goal uses the normal stats footprint and the clue shadow stops at its boundary", () => {
  assert.match(engine, /return \{ x:328, y:235, w:150, h:31 \}/);
  assert.match(engine, /const goalCenterX = x \+ w \/ 2/);
  assert.match(render, /ctx\.fillRect\(left \+ 2, top \+ 2, width - 2, height\)/);
  assert.match(engine, /function currentGoalHowToLines/);
  assert.match(engine, /pointInsideRect\(getCanvasPoint\(event\), getTutorialGoalRect\(\)\)/);
});

test("terms stay blank until controls return while the three-catch goal remains live", () => {
  assert.match(engine, /if \(!tutorialPlayerHasControl\(\) && step\.setup !== "threeCatches" && step\.setup !== "wrongFly"\) return \[\]/);
  assert.match(engine, /sceneCatchCount \+ \(tutorial\.sceneAttemptCaught \? 1 : 0\)/);
  assert.match(engine, /drawBlankTutorialVocabularyPrompt\(\)/);
  assert.match(engine, /const finalPractice = tutorialStep\(\)\?\.setup === "normalRound"/);
  assert.match(engine, /if \(!finalPractice\) drawCurrentGoalHud\(\)/);
});

test("pause provides retry and skip, and resuming tutorial bypasses the countdown", () => {
  assert.match(engine, /"RETRY SCENE"/);
  assert.match(engine, /"SKIP TUTORIAL"/);
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

test("tutorial completion reuses the normal victory screen and only awards Ribbit Ready", () => {
  assert.match(engine, /chooseVictoryMessage\("park"\)/);
  assert.match(engine, /playWinSound\(\)/);
  assert.match(engine, /id !== TUTORIAL_ACHIEVEMENT_ID/);
  assert.match(engine, /markAchievementEarned\(TUTORIAL_ACHIEVEMENT_ID, false\)/);
});
