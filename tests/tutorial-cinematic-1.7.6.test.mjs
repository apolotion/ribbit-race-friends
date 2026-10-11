import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = read("client/game/120-engine-tutorial.js");

const block = (start, end) => engine.slice(engine.indexOf(start), engine.indexOf(end, engine.indexOf(start)));

test("1.7.7 scripted tutorial build and first-boot marker are installed", () => {
  assert.equal(JSON.parse(read("package.json")).version, "1.7.7");
  assert.match(read("src/common.js"), /2026\.10\.11-friends-tutorial-scripted-1/);
  assert.match(engine, /rrFriendsEngineTutorialSoloSeenV7/);
});

test("Ember portraits preload and the tutorial never falls back to a map mentor", () => {
  assert.match(engine, /EMBER_PORTRAITS_READY/);
  assert.match(engine, /emberPortraitsReady/);
  assert.match(engine, /No second frog is rendered in the playable tutorial arena/);
  assert.doesNotMatch(block("function drawTutorialDialogue", "function drawTutorialStatus"), /drawGameplayFrogSpriteLocal/);
});

test("dialogue uses a real typewriter and advances one line at a time", () => {
  assert.match(engine, /TYPEWRITER_MS_PER_CHARACTER = 28/);
  assert.match(engine, /visibleDialogueCharacterCount/);
  assert.match(engine, /dialogueForceComplete/);
  assert.match(engine, /tutorial\.dialogueLineIndex \+= 1/);
  assert.match(engine, /SPACE FOR NEXT/);
  assert.match(engine, /SPACE TO PLAY/);
  assert.match(engine, /TAP FOR NEXT/);
  assert.match(engine, /TAP TO PLAY/);
});

test("dialogue box is compact, top-centered between HUD corners and has no faux scroll control", () => {
  assert.match(engine, /const panel = \{ x: 92, y: 7, w: 300, h: 42 \}/);
  assert.match(engine, /const portrait = \{ x: 337, y: 9, w: 51, h: 38 \}/);
  assert.match(engine, /Even light-blue frame on every edge; no faux scrollbar or continue arrow/);
  const dialogue = block("function drawTutorialDialogue", "function drawTutorialStatus");
  assert.doesNotMatch(dialogue, /drawPixelArrow|strokeRect\(/i);
});

test("tutorial starts only after authentication and its first dialogue is explicitly opened", () => {
  const polish = read("public/scripts/rr-170-polish.js");
  assert.match(polish, /authReady=false/);
  assert.match(polish, /rr-authenticated/);
  assert.match(polish, /authenticatedProfileReady/);
  assert.match(polish, /engine\.start\(forcedKind\|\|"solo"\)/);
  assert.match(engine, /function openDialogue/);
  assert.match(engine, /dialogueOpenedAt = performance\.now\(\)/);
  assert.match(engine, /requestAnimationFrame/);
});

test("tutorial flies are hidden during dialogue and visibly spawn after it closes", () => {
  assert.match(engine, /tutorialArmed:false/);
  assert.match(engine, /function armTutorialFlies/);
  assert.match(engine, /currentFly\.spawnAge = 0/);
  assert.match(engine, /playFlySpawnSound/);
  assert.match(engine, /originalDrawFlySpawnSparksForTutorial/);
});

test("failed attempts hide the frog, clear the tongue and use two poofs separated by half a second", () => {
  assert.match(engine, /tutorial\.resetAt = performance\.now\(\) \+ 500/);
  assert.match(engine, /tutorial\.frogHidden = true/);
  assert.match(engine, /function resetTutorialTongue/);
  assert.match(engine, /playTutorialPoofSound\("out"\)/);
  assert.match(engine, /playTutorialPoofSound\("in"\)/);
  assert.match(engine, /function completePendingReset/);
});

test("scripted scenes match the requested twelve-scene curriculum", () => {
  for (const setup of [
    "intro","longJumps","threeCatches","rangeCatch","wrongFly","comboMixed","comboTwo","comboThree",
    "wallTurn","reboundCatch","quickDrop","bufferDrop","doubleBuffer","normalRound"
  ]) assert.match(engine, new RegExp(`setup: "${setup}"`));
  assert.match(engine, /Show me three long jumps in a row!/);
  assert.match(engine, /Let's get three points - one matching fly per jump!/);
  assert.match(engine, /This time, catch a fly that doesn't match your English clue!/);
  assert.match(engine, /catch all three matching flies before you land!/i);
});

test("max-jump failure waits for landing, while the lesson requires three 90-percent jumps", () => {
  assert.match(engine, /longJumpStreak/);
  assert.match(engine, /lastJumpPower >= \.90/);
  assert.match(engine, /attemptEnded/);
  const launch = block("launchJump = function", "// Hide the normal first-jump");
  assert.doesNotMatch(launch, /failAttempt\("CHARGE/);
});

test("tongue lesson rejects body contact and applies slow motion after a tongue catch", () => {
  assert.match(engine, /case "rangeCatch"/);
  assert.match(engine, /makeFly\(360, 75/);
  assert.match(engine, /activeSetup === "rangeCatch" && wasCorrect && source !== "tongue"/);
  assert.match(engine, /source === "tongue"/);
  assert.match(engine, /slowMoUntil/);
});

test("wrong and multi-fly lessons validate catch order and same-jump sequences", () => {
  assert.match(engine, /case "wrongFly"/);
  assert.match(engine, /tutorial\.wrongFlyCaught/);
  assert.match(engine, /comboMixed/);
  assert.match(engine, /comboTwo/);
  assert.match(engine, /comboThree/);
  assert.match(engine, /tutorial\.catchEvents\.push\(wasCorrect\)/);
});

test("wall, rebound and Park drop layouts preserve authored checks", () => {
  assert.match(engine, /case "wallTurn"/);
  assert.match(engine, /WITHIN 2 JUMPS/);
  assert.match(engine, /case "reboundCatch"/);
  assert.match(engine, /positionSoloFrog\(350/);
  for (const setup of ["quickDrop","bufferDrop","doubleBuffer"]) {
    const i = engine.indexOf(`case "${setup}"`);
    assert.ok(i >= 0, setup);
    assert.match(engine.slice(i, i + 1200), /platforms = cloneParkPlatforms\(\)/, setup);
  }
  assert.match(engine, /bufferEventCount >= 2 && caught >= 3/);
});

test("current goal owns smooth failure feedback and tutorial status text is suppressed", () => {
  assert.match(engine, /drawPixelTrophy\(x \+ 16/);
  assert.match(engine, /failureFlashDuration: 1450/);
  assert.match(engine, /const fadeStart = duration \* \.68/);
  assert.match(engine, /flashAlpha/);
  assert.match(block("function drawTutorialStatus", "function drawTutorialSmoke"), /Scene completion transitions directly/);
  assert.doesNotMatch(block("function drawTutorialStatus", "function drawTutorialSmoke"), /NICE WORK/);
});

test("tutorial completion reuses the normal Single Player victory screen and achievement", () => {
  assert.match(engine, /chooseVictoryMessage\("park"\)/);
  assert.match(engine, /playWinSound\(\)/);
  assert.match(engine, /tutorial-graduate/);
  assert.match(engine, /normal Single Player victory screen/);
});
