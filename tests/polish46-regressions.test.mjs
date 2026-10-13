import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = file => readFileSync(new URL(`../client/game/${file}`, import.meta.url), 'utf8');
const replay=source('133-engine-replay.js');
const gameplay=source('50-solo-gameplay.js');
const physics=source('60-versus-physics.js');
const effects=source('63-versus-rendering-ui.js');
const monitor=source('124-tutorial-monitoring.js');
const rendering=source('125-tutorial-rendering.js');
const entities=source('71-rendering-entities-hud.js');
const lifecycle=source('123-tutorial-lifecycle.js');
const scenario=source('122-tutorial-scenarios.js');
const hooks=source('126-tutorial-hooks.js');
const dialogue=source('121-tutorial-runtime-dialogue.js');
const catches=source('61-versus-catches-rounds.js');

test('Polish 46 records a 60 FPS countdown from before the first audible three',()=>{
  assert.match(replay,/const RIBBIT_REPLAY_FPS = 60;/);
  const hook=gameplay.indexOf('captureCountdownStart?.(performance.now())');
  const sound=gameplay.indexOf('playCountdownSound(3)',hook);
  assert.ok(hook>=0 && sound>hook);
  assert.match(replay,/game\.state === "countdown"/);
  assert.match(replay,/drawResumeCountdown\(\)/);
});

test('Solo and Versus replay store independent tongue states and frame interpolation',()=>{
  assert.match(replay,/tongue:\{\.\.\.tongue\}/);
  assert.match(replay,/if\(player\.tongue\)/);
  assert.match(replay,/tongue:soloTongue/);
  assert.match(replay,/elapsed:p\.tongue\.elapsed\+/);
  assert.match(replay,/Object\.assign\(tongue,state\.tongue/);
});

test('An on-screen tutorial fly cannot be rendered without a matching clue',()=>{
  assert.match(rendering,/fly\.state !== "eaten" &&\s*fly\.vocabIndex === game\.targetVocabIndex/);
  assert.match(rendering,/if \(pvpMatchFly/);
  assert.match(monitor,/const visible = flies\.filter\(\(fly\) => fly && fly\.state !== "eaten"/);
  assert.match(entities,/game\.mode === "pvp" \? fly\.state !== "eaten"/);
});

test('Authored tutorial fly signs are instantly legible and inside the visible stage',()=>{
  assert.match(entities,/game\.tutorialActive && game\.mode === "pvp"\s*\? 1 : clamp/);
  assert.match(entities,/clamp\(centeredX, 3, W - width - 3\)/);
});

test('Sky-bonk stun recovery clears squash and stays on the actual ground',()=>{
  assert.match(physics,/player\.recoveryFlipTimer = \.24/);
  assert.match(physics,/player\.recoveryFlipTimer = Math\.max/);
  assert.match(physics,/CONFIG\.groundY/);
  assert.match(effects,/recoveryFlipTimer/);
  assert.match(dialogue,/recoveryFlipTimer/);
});

test('A tiny charge cannot bypass normal bonk lessons',()=>{
  assert.match(hooks,/chargeHoldTime < 0\.16/);
  assert.match(hooks,/failAttempt\("HOLD JUMP TO CHARGE/);
  assert.match(hooks,/quickTapAllowed\.has\(lesson\)/);
});

test('Successful tutorial dialogue waits for landing rather than freezing midair',()=>{
  assert.match(lifecycle,/tutorial\.passPending = true/);
  assert.match(lifecycle,/!pvpPlayers\[0\]\.grounded/);
  assert.match(dialogue,/function freezeControlledEntity\(\)/);
});

test('Lesson completion is independent of a fast-forwarded Ember dialogue',()=>{
  assert.match(dialogue,/recoveryFlipTimer/);
  assert.match(dialogue,/closeDialogue/);
});

test('Tutorial prompts and guidance remain visible through rebounds and the final race',()=>{
  assert.match(rendering,/const pvpMatchFly = tutorial\.active && tutorial\.kind === "pvp" && anyVisible/);
  assert.match(rendering,/pvpFinalMatch: \[/);
  assert.match(rendering,/tutorial\.pvpCaption === "YOUR TURN!"/);
});

test('Authored rebound and bonk layouts use physical frog positions',()=>{
  assert.match(scenario,/case "pvpBufferedSky":/);
  assert.match(scenario,/positionPvp\(ember, leftMiddle\.x-32/);
  assert.match(scenario,/case "pvpHighGround"/);
  assert.match(scenario,/positionPvpOnPlatform\(p1, PARK_PLATFORMS\[1\], 1\)/);
  assert.match(scenario,/case "pvpRecoveryBonk"/);
  assert.match(scenario,/positionPvp\(p1, 145/);
});

test('Chapter navigation fully resets lesson dialogue and recreates the target scene',()=>{
  assert.match(rendering,/function applyTutorialChapterPreview\(\)/);
  assert.match(rendering,/tutorial\.passPending = false/);
  assert.match(rendering,/tutorial\.dialogueOpen = true/);
  assert.match(rendering,/game\.state = "playing"/);
});

test('The tutorial final race has a hard timer resolution with no infinite zero-clock state',()=>{
  assert.match(monitor,/game\.pvpTimedOutcomePending = true/);
  assert.match(effects,/performance\.now\(\) - game\.pvpTimeExpiredRealAt >= 2000/);
  assert.match(effects,/resolvePvpTimedOutcomeAfterJump\(\)/);
});

test('Clutch catch only starts in the final displayed second',()=>{
  assert.match(catches,/Number\(game\.pvpTimeRemaining\) > 0 && Number\(game\.pvpTimeRemaining\) <= 1\.0/);
  assert.match(catches,/Number\(game\.pvpTimeRemaining\) > 0 && Number\(game\.pvpTimeRemaining\) <= 1\)/);
});

test('Final tutorial match poofs before a full one-second start pause',()=>{
  assert.match(scenario,/tutorial\.pvpFinalMatchPoofStarted = true/);
  assert.match(scenario,/tutorial\.pvpFinalMatchCountdownUntil = performance\.now\(\) \+ 1000/);
});
