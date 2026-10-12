import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = read("client/game/120-engine-tutorial.js");
const polish = read("public/scripts/rr-170-polish.js");
const index = read("public/index.html");
const css = read("public/styles/rr-170.css");

function block(start, end) {
  const from = engine.indexOf(start);
  assert.ok(from >= 0, `Missing start marker: ${start}`);
  const to = engine.indexOf(end, from);
  assert.ok(to >= 0, `Missing end marker: ${end}`);
  return engine.slice(from, to);
}

test("1.7.10 tutorial-polish build is wired everywhere", () => {
  assert.equal(JSON.parse(read("package.json")).version, "1.7.10");
  assert.match(read("src/common.js"), /2026\.10\.12-friends-polish-11/);
  assert.match(read("client/game/110-online-mobile-polish.js"), /2026\.10\.12-friends-polish-11/);
  assert.match(read("public/scripts/cloud-client.js"), /2026\.10\.12-friends-polish-11/);
  assert.match(index, /2026\.10\.12-friends-polish-11/);
  assert.doesNotMatch(index, /tutorial-scripted-1/);
});

test("first-boot tutorial waits for auth and suppresses the menu before first paint", () => {
  for (const phrase of [
    "authenticatedProfileReady",
    "authenticationBoundaryReleased",
    "ribbit-auth-locked",
    "hasAttribute(\"inert\")",
    "aria-hidden",
    "__RIBBIT_FRIENDS_GAME_INPUT_LOCKED__",
    "rr-authenticated"
  ]) assert.ok(polish.includes(phrase), phrase);
  assert.match(index, /<body class="ribbit-auth-locked rr-tutorial-pending">/);
  assert.match(index, /tutorial-preboot\.js\?v=2026\.10\.12-friends-polish-11/);
  assert.match(read("public/scripts/tutorial-preboot.js"), /rrFriendsEngineTutorialSoloSeenV8/);
  assert.match(css, /body\.rr-tutorial-pending:not\(\.ribbit-auth-locked\) #game\s*\{[\s\S]{0,120}visibility:\s*hidden\s*!important/);
  assert.doesNotMatch(polish, /requestAnimationFrame\(\(\) => requestAnimationFrame/);
});

test("Ember dialogue uses the supplied layered reference, left-aligned text, and an uncropped square portrait", () => {
  const dialogue = block("function drawTutorialDialogue", "function drawTutorialStatus");
  assert.match(engine, /DIALOGUE_TEXT_SCALE = 0\.86/);
  assert.match(dialogue, /const textPanel = \{ x: 90, y: 6, w: 250, h: 50 \}/);
  assert.match(dialogue, /const portraitPanel = \{ x: 338, y: 6, w: 54, h: 54 \}/);
  assert.match(dialogue, /Five-layer pixel frame/);
  assert.match(dialogue, /drawReferencePanel\(textPanel, "#0b4462", "#052b43"\)/);
  assert.match(dialogue, /const imageSize = portraitPanel\.w - 10/);
  assert.match(dialogue, /const fit = Math\.min\(imageSize \/ sourceW, imageSize \/ sourceH\)/);
  assert.match(dialogue, /ctx\.drawImage\(portraitImage, 0, 0, sourceW, sourceH, drawX, drawY, drawW, drawH\)/);
  assert.match(dialogue, /const nameY = imageY \+ imageSize - nameH \+ 1/);
  assert.match(dialogue, /const nameH = 11/);
  assert.match(dialogue, /const textTop = Math\.round\(textArea\.y \+ Math\.max\(0, \(textArea\.h - totalTextHeight\) \/ 2\)\)/);
  assert.match(dialogue, /visibleOnLine,[\s\S]{0,80}textArea\.x,[\s\S]{0,120}"left"/);
  assert.doesNotMatch(dialogue, /fullLineWidth|textArea\.x \+ textArea\.w \/ 2/);
  assert.match(dialogue, /holdingPreviousLine/);
});

test("authored tutorial flies retain normal movement and normal spawn sparkles", () => {
  assert.doesNotMatch(engine, /function alignTutorialFlies/);
  assert.match(engine, /phase:Math\.max\(0, spawnIndex\) \* 1\.37/);
  assert.match(engine, /currentFly\.spawnAge = 0/);
  assert.match(engine, /playFlySpawnSound/);
  assert.match(engine, /updateTutorialAmbient\(dt, \{ animateFlies: true \}\)/);
});

test("poof reset clears tongue, hides only the frog, and never moves it offscreen", () => {
  assert.match(engine, /resetTutorialTongue/);
  assert.match(engine, /tutorial\.frogHidden = true/);
  assert.match(engine, /resetAt = performance\.now\(\) \+ POOF_TRANSITION_MS/);
  assert.doesNotMatch(engine, /frog\.x\s*=\s*-1000|frog\.y\s*=\s*-1000/);
});

test("all five Ember portrait assets are packaged", () => {
  for (const name of ["confident", "smile", "cool", "laughing", "thinking"]) {
    assert.ok(existsSync(new URL(`../public/tutorial/ember-${name}.png`, import.meta.url)), name);
  }
});

test("scene goals cover long jumps, matching catches, tongue, combos, walls, and drops", () => {
  for (const literal of [
    'goal: ["LONG JUMPS", "0 / 3"]',
    'goal: ["MATCHES", "0 / 3"]',
    'goal: ["USE YOUR TONGUE", "TO CATCH THE FLY"]',
    'goal: ["3 MATCHES", "IN ONE JUMP"]',
    'goal: ["TURN AND CATCH", "WITHIN 2 JUMPS"]',
    'goal: ["2 BUFFERS", "3 FLIES"]'
  ]) assert.ok(engine.includes(literal), literal);
});

test("normal controls resume after staged poofs, except the first long-jump lesson starts in place", () => {
  const arm = block("function armScenarioAfterDialogue", "function closeDialogue");
  assert.match(arm, /tutorial\.scenePositionedDuringDialogue/);
  assert.match(arm, /beginScenarioEntryTransition\(\)/);
  assert.match(arm, /if \(setup === "longJumps"\)/);
  assert.match(arm, /applyControlledPose\(tutorial\.pendingStartPose \|\| captureControlledPose\(\)\)/);
  assert.match(engine, /reason: "scene-entry"/);
  assert.match(engine, /POOF_TRANSITION_MS = 500/);
  assert.match(engine, /tutorialMovementLocked/);
  assert.match(engine, /tutorial\.frogHidden = false/);
});

test("closing the final dialogue with Space consumes that physical key press", () => {
  assert.match(engine, /tutorial\.blockJumpUntilRelease = true/);
  assert.match(engine, /closeDialogue\("space-keydown"\)/);
  assert.match(engine, /if \(tutorial\.blockJumpUntilRelease\)[\s\S]{0,260}tutorial\.blockJumpUntilRelease = false/);
  assert.match(engine, /tutorialBlocksLiveInput\(\)[\s\S]{0,180}tutorial\.blockJumpUntilRelease/);
});

test("tutorial restart keeps terms blank while preserving live goals for catch sequencing", () => {
  assert.match(engine, /function tutorialPlayerHasControl/);
  assert.match(engine, /const pausedGoal = game\.state === "paused"/);
  assert.match(engine, /if \(!tutorialPlayerHasControl\(\) && !pausedGoal/);
  assert.match(engine, /const visibleDuringExplanation = tutorialPromptVisibleDuringDialogue\(\)/);
  assert.match(engine, /\(\(!tutorialPlayerHasControl\(\) && !visibleDuringExplanation\) \|\| tutorial\.promptHidden\)/);
  assert.match(engine, /tutorial\.resetPending/);
});

test("three-catch prompt stays blank from the catch until the next fly poofs in", () => {
  assert.match(engine, /activeSetup === "threeCatches" && wasCorrect[\s\S]{0,180}tutorial\.promptHidden = true/);
  assert.match(engine, /function armTutorialFlies[\s\S]{0,1100}if \(revealPrompt\) tutorial\.promptHidden = false/);
  assert.match(engine, /tutorial\.promptHidden = !armed/);
});

test("wrong-fly lesson begins with both targets visible and converts the skipped fly after the right catch", () => {
  assert.doesNotMatch(engine, /That wrong fly does not count\./);
  assert.doesNotMatch(engine, /You can come back to it later\./);
  for (const phrase of [
    "Catch the right fly, and your English clue can update.",
    "That can turn the fly you skipped into the new correct match!"
  ]) assert.ok(engine.includes(phrase), phrase);
  const setup = engine.slice(engine.indexOf('case "wrongFly"'), engine.indexOf('case "comboMixed"'));
  assert.match(setup, /makeFly\(315, 108, tutorial\.wrongFlyOriginalVocabIndex, 0\)/);
  assert.match(setup, /makeFly\(390, 150, tutorial\.wrongFlyPromptIndex, 1\)/);
  const configure = block("function configureStep", "function addTutorialPoof");
  assert.doesNotMatch(configure, /armTutorialFlies\(\{ revealPrompt: false \}\)/);
  const arm = block("function armScenarioAfterDialogue", "function closeDialogue");
  assert.match(arm, /beginScenarioEntryTransition\(\)/);
  assert.match(engine, /setPrompt\(tutorial\.wrongFlyOriginalVocabIndex\)/);
  assert.match(engine, /tutorial\.wrongFlyRightCaught = true/);
  assert.match(engine, /wrongFlyCaughtAt = performance\.now\(\);\s*tutorial\.promptHidden = false/);
  assert.match(engine, /wrongFlyRightCaught = true[\s\S]{0,220}tutorial\.promptHidden = true/);
  assert.match(engine, /resetAttemptForNextJump\(\);\s*tutorial\.promptHidden = false/);
  assert.match(engine, /jumpAttempts > 4/);
  assert.doesNotMatch(engine, /"This time, catch a fly that doesn't match\."/);
  assert.match(engine, /if \(tutorial\.wrongFlyReturnedCaught\)[\s\S]{0,240}passStep\(\)/);
  assert.match(engine, /return \["RETURN FOR", `THE OLD FLY • \$\{Math\.max\(0, 4 - tutorial\.jumpAttempts\)\} JUMPS LEFT`\]/);
});

test("only the training-complete achievement can pass through during training", () => {
  assert.match(engine, /const trainingSession = Boolean\(tutorial\.active \|\| tutorial\.completeScreen \|\| game\.tutorialActive\)/);
  assert.match(engine, /if \(trainingSession && id !== TUTORIAL_ACHIEVEMENT_ID\) return false/);
  assert.match(engine, /markPvpAchievementEarned = function[\s\S]{0,220}return false/);
  assert.match(engine, /markAchievementEarned\(TUTORIAL_ACHIEVEMENT_ID, false\)/);
});
