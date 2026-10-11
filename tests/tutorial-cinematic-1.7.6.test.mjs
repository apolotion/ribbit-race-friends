import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = read("client/game/120-engine-tutorial.js");
const polish = read("public/scripts/rr-170-polish.js");

function block(start, end) {
  const from = engine.indexOf(start);
  assert.ok(from >= 0, `Missing start marker: ${start}`);
  const to = engine.indexOf(end, from);
  assert.ok(to >= 0, `Missing end marker: ${end}`);
  return engine.slice(from, to);
}

test("1.7.8 polished tutorial build and first-boot marker are installed", () => {
  assert.equal(JSON.parse(read("package.json")).version, "1.7.8");
  assert.match(read("src/common.js"), /2026\.10\.11-friends-tutorial-polish-2/);
  assert.match(engine, /const TUTORIAL_BUILD = "2026\.10\.11-friends-tutorial-polish-2"/);
  assert.match(engine, /rrFriendsEngineTutorialSoloSeenV7/);
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

test("dialogue uses one consistent typewriter scale, two-line wrapping, hold-to-speed, and a two-frame arrow", () => {
  assert.match(engine, /TYPEWRITER_MS_PER_CHARACTER = 28/);
  assert.match(engine, /DIALOGUE_TEXT_SCALE = 0\.50/);
  assert.match(engine, /wrapBitmapTextAtScale\(fullLine, textArea\.w, DIALOGUE_TEXT_SCALE\)\.slice\(0, 2\)/);
  assert.match(engine, /Adding held time once more makes holding\s+\/\/ Space exactly twice as fast/);
  assert.match(engine, /DIALOGUE_SPACE_HOLD_THRESHOLD_MS = 180/);
  assert.match(engine, /Math\.floor\(performance\.now\(\) \/ 260\) % 2/);
  assert.match(engine, /drawDialogueContinueTriangle/);
  assert.doesNotMatch(engine, /SPACE (?:FOR NEXT|TO PLAY)|TAP (?:FOR NEXT|TO PLAY)/);
});

test("dialogue box keeps approved dimensions with thin symmetric framing and a larger centered Ember name", () => {
  const dialogue = block("function drawTutorialDialogue", "function drawTutorialStatus");
  assert.match(dialogue, /const panel = \{ x: 92, y: 7, w: 300, h: 42 \}/);
  assert.match(dialogue, /const portrait = \{ x: 338, y: 9, w: 51, h: 38 \}/);
  assert.match(dialogue, /ctx\.fillRect\(panel\.x \+ 2, panel\.y \+ 2, panel\.w - 4, panel\.h - 4\)/);
  assert.match(dialogue, /ctx\.fillRect\(portrait\.x \+ 2, portrait\.y \+ 2, portrait\.w - 4, portrait\.h - 4\)/);
  assert.match(dialogue, /const nameH = 10/);
  assert.match(dialogue, /drawBitmapText\("EMBER", nameX \+ nameW \/ 2, nameY \+ 3, \.62, "center"/);
  assert.doesNotMatch(dialogue, /SPACE TO|TAP TO|drawPixelArrow|strokeRect\(/i);
});

test("first boot waits for the complete login boundary rather than merely hiding the gate", () => {
  assert.match(polish, /authenticationBoundaryReleased/);
  assert.match(polish, /authenticatedProfileReady/);
  assert.match(polish, /ribbit-auth-locked/);
  assert.match(polish, /frame\.hasAttribute\("inert"\)/);
  assert.match(polish, /__RIBBIT_FRIENDS_GAME_INPUT_LOCKED__/);
  assert.match(polish, /rr-authenticated/);
  assert.match(polish, /typeof RibbitCloud/);
  assert.match(polish, /getProfile/);
  assert.match(engine, /function tutorialAuthenticationReady/);
  assert.match(engine, /queueTutorialAfterAuthentication/);
});

test("background and fly animation continue through dialogue while movement alone is locked", () => {
  assert.match(engine, /function updateTutorialAmbient/);
  assert.match(engine, /game\.visualTime \+= safeDt/);
  assert.match(engine, /game\.worldTime \+= safeDt/);
  assert.match(engine, /animateFlies\(safeDt\)/);
  assert.match(engine, /if \(tutorialStep\(\)\?\.setup !== "threeCatches"\) armTutorialFlies\(\)/);
  assert.match(engine, /function tutorialBlocksLiveInput/);
  assert.match(engine, /tutorial\.active && game\.state === "playing" && tutorialMovementLocked\(\)/);
});

test("the dinner fly poofs in before Ember's dinner line and both UI references flash", () => {
  const prep = block("function prepareDialogueLine", "function armScenarioAfterDialogue");
  assert.match(prep, /setup === "threeCatches" && nextIndex === 1/);
  assert.match(prep, /armTutorialFlies\(\)/);
  assert.match(prep, /delayMs = POOF_TRANSITION_MS/);
  assert.match(engine, /FLY_REFERENCE_FLASH_MS = 440/);
  assert.match(engine, /tutorial\.dialogueLineIndex === 2/);
  assert.match(engine, /tutorial\.dialogueLineIndex === 3/);
  assert.match(engine, /drawFlashingReferenceFrame\(\{ x:154, y:234, w:172, h:33 \}\)/);
});

test("poof transitions are exactly half a second and preserve already-visible flies", () => {
  assert.match(engine, /POOF_TRANSITION_MS = 500/);
  assert.match(engine, /tutorial\.resetAt = performance\.now\(\) \+ POOF_TRANSITION_MS/);
  assert.match(engine, /collectVisibleTutorialFlyKeys/);
  assert.match(engine, /preserveExistingFlies/);
  assert.match(engine, /armTutorialFlies\(\{ preserveKeys: preserveFlyKeys \}\)/);
  assert.match(engine, /animateFlies: !tutorial\.resetPending/);
  assert.match(engine, /playTutorialPoofSound\("out"\)/);
  assert.match(engine, /playTutorialPoofSound\("in"\)/);
});

test("the tutorial uses a carbon copy of Park and the normal Park start position", () => {
  assert.match(engine, /function restoreExactParkStage\(\) \{\s*platforms = cloneParkPlatforms\(\);\s*flySpawns = LEVELS\.park\.flySpawns;/);
  assert.match(engine, /function getNormalParkStartX/);
  assert.match(engine, /positionSoloFrog\(getNormalParkStartX\(\)\)/);
  assert.match(engine, /case "longJumps":[\s\S]{0,180}positionSoloFrog\(getNormalParkStartX\(\)/);
});

test("each proper long-jump landing gets the same catch sparkle and success sound", () => {
  const monitor = block("if (setup === \"longJumps\")", "if (setup === \"threeCatches\")");
  assert.match(monitor, /lastJumpPower >= \.90/);
  assert.match(monitor, /frog\.catchSparkleTimer = Math\.max\(frog\.catchSparkleTimer, CONFIG\.catchSparkleDuration\)/);
  assert.match(monitor, /playCorrectFlySound\(\)/);
  assert.match(monitor, /longJumpStreak >= 3/);
});

test("tongue lesson starts on the lower-left platform and uses the stock final-catch zoom cinematic", () => {
  const range = engine.slice(engine.indexOf('case "rangeCatch"'), engine.indexOf('case "wrongFly"'));
  assert.match(range, /positionOnPlatform\(platforms\[1\], 8, 1\)/);
  assert.match(range, /makeFly\(300, 68, 0, 4\)/);
  assert.match(engine, /activeSetup === "rangeCatch" && wasCorrect && source !== "tongue"/);
  assert.match(engine, /const originalBeginTongueCatchForTutorial = beginTongueCatch/);
  assert.match(engine, /game\.soloCatchGoal = Math\.max\(1, Number\(game\.score \|\| 0\) \+ 1\)/);
  assert.match(engine, /originalBeginTongueCatchForTutorial\.call/);
  assert.doesNotMatch(engine, /slowMoUntil/);
});

test("multi-fly lessons are reachable and a missed matching fly retries only that fly", () => {
  assert.match(engine, /makeParkFly\(3, 0, 0\);\s*makeParkFly\(7, 1, 1\)/);
  assert.match(engine, /makeFly\(145, 110, 0, 0\)/);
  assert.match(engine, /makeFly\(190, 120, 1, 1\)/);
  assert.match(engine, /makeFly\(235, 155, 2, 2\)/);
  assert.match(engine, /function retryThreeCatchAttempt/);
  assert.match(engine, /const missedAttemptIndex = tutorial\.sceneAttemptIndex/);
  assert.match(engine, /setupThreeCatchAttempt\(missedAttemptIndex, false\)/);
  assert.match(engine, /tutorial\.sceneCatchCount \+= 1/);
});

test("scene completion freezes the frog and keeps its pose until the scripted poof", () => {
  assert.match(engine, /function passStep\(\)[\s\S]{0,220}freezeControlledEntity\(\)/);
  assert.match(engine, /const visualPose = captureControlledPose\(\)/);
  assert.match(engine, /configureStep\(true, \{ preserveVisualPose: visualPose \}\)/);
  assert.match(engine, /tutorial\.pendingStartPose = captureControlledPose\(\)/);
  assert.match(engine, /applyControlledPose\(intendedStartPose\)/);
});

test("Current Goal text is centered on the full card and exposes a how-to hover panel", () => {
  assert.match(engine, /const goalCenterX = x \+ w \/ 2/);
  assert.match(engine, /drawBitmapText\(goal\[0\], goalCenterX/);
  assert.match(engine, /function currentGoalHowToLines/);
  assert.match(engine, /longJumps: \["HOLD JUMP TO CHARGE", "RELEASE NEAR FULL POWER"\]/);
  assert.match(engine, /function drawGoalHowToTooltip/);
  assert.match(engine, /pointInsideRect\(getCanvasPoint\(event\), getTutorialGoalRect\(\)\)/);
});

test("pause remains functional with Retry Scene and Skip Tutorial actions", () => {
  assert.match(engine, /const originalDrawPauseControlsForTutorial = drawPauseControls/);
  assert.match(engine, /"RETRY SCENE"/);
  assert.match(engine, /"SKIP TUTORIAL"/);
  assert.match(engine, /game\.pauseSelection === "home"[\s\S]{0,90}finish\(false\)/);
  assert.match(engine, /game\.pauseSelection === "restart"[\s\S]{0,360}reason: "pause-retry"/);
  assert.doesNotMatch(engine, /THE TUTORIAL CANNOT BE PAUSED|Pause is intentionally disabled/);
});

test("trajectory preview is suppressed through dialogue and poofs", () => {
  assert.match(engine, /const originalDrawArcPreviewForTutorial = drawArcPreview/);
  assert.match(engine, /tutorialMovementLocked\(\) \|\| tutorial\.frogHidden \|\| tutorial\.resetPending/);
});

test("tutorial completion still reuses the normal Single Player victory screen and achievement", () => {
  assert.match(engine, /chooseVictoryMessage\("park"\)/);
  assert.match(engine, /playWinSound\(\)/);
  assert.match(engine, /tutorial-graduate/);
  assert.match(engine, /normal Single Player victory screen/);
});
