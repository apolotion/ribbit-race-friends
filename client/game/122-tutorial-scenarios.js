// Ribbit Race tutorial responsibility: 122 tutorial scenarios
function makeFly(x, y, vocabIndex, spawnIndex = -100) {
  const fly = {
    id: nextFlyId++, baseX:x, baseY:y, x, y,
    phase:Math.max(0, spawnIndex) * 1.37, spawnIndex, spawnAge:-0.08,
    vocabIndex, state:"active", touchLocked:false,
    blockedPromptSerial:-1,
    pvpBlockedPromptSerials:[-1,-1],
    pvpPursuers:[false,false], pvpPursuitTimes:[null,null],
    pvpPursuitPromptSerial:-1,
    spitElapsed:0, spitDelay:0, spitDuration:.34, spitStarted:false,
    spitOwnerIndex:null, spitStartX:x, spitStartY:y, returnX:x, returnY:y,
    tutorialAuthored:true, tutorialArmed:false, tutorialRequiresRebound:false,
    tutorialKey:[spawnIndex, vocabIndex, Math.round(x), Math.round(y)].join(":")
  };
  flies.push(fly);
  return fly;
}

function makeParkFly(spawnIndex, vocabIndex, authoredIndex = spawnIndex) {
  const spawn = PARK_FLY_SPAWNS[spawnIndex] || PARK_FLY_SPAWNS[0];
  return makeFly(spawn.x, spawn.y, vocabIndex, authoredIndex);
}

function setPrompt(index) {
  game.targetVocabIndex = Math.max(0, Math.min(VOCABULARY.length - 1, index));
  game.promptSerial += 1;
  for (const currentFly of flies) {
    currentFly.touchLocked = false;
    currentFly.blockedPromptSerial = -1;
    currentFly.pvpBlockedPromptSerials = [-1, -1];
  }
}

function setSequence(indices) {
  tutorial.sequence = [...indices];
  if (tutorial.sequence.length) setPrompt(tutorial.sequence[0]);
}

function maintainSequencePrompt() {
  if (!tutorial.sequence.length) return;
  const caught = Math.max(0, Number(game.score || 0) - tutorial.scoreStart);
  const nextIndex = tutorial.sequence[Math.min(caught, tutorial.sequence.length - 1)];
  if (Number.isInteger(nextIndex) && game.targetVocabIndex !== nextIndex) setPrompt(nextIndex);
}

function positionSoloFrog(x, y = CONFIG.groundY - frog.h, dir = 1) {
  Object.assign(frog, {
    x, y, vx:0, vy:0, dir, grounded:true, charging:false,
    charge:.08, chargeDirection:1, chargeHoldTime:0,
    departurePlatform:null, dropThroughPlatform:null,
    firstJumpMade:true, landingSquash:0
  });
  clearHeldInput();
}

function positionOnPlatform(platform, xOffset = 12, dir = 1) {
  positionSoloFrog(platform.x + xOffset, platform.y - frog.h, dir);
}

function positionCenteredOnPlatform(platform, dir = 1) {
  positionOnPlatform(platform, Math.round((platform.w - frog.w) / 2), dir);
}

function usePlatforms(authored = []) {
  platforms = [GROUND(), ...authored.map((platform, index) => ({ ...platform, tutorialId: platform.tutorialId || `tutorial-${index}` }))];
}

function baseSoloScenario() {
  game.mode = "solo";
  game.setupSkinFocusId = game.skinId || game.setupSkinFocusId || "azure";
  game.selectedLevelId = "park";
  game.soloRandomLevelMode = false;
  game.soloEndlessMode = false;
  game.soloCatchGoal = 99;
  game.soloTimeLimitSeconds = 0;
  game.timeOfDayLock = "afternoon";
  game.timeOfDay = "afternoon";
  game.sandboxMode = false;
  resetGame(true);
  restoreExactParkStage();
  game.sandboxMode = false;
  game.state = "playing";
  flies.length = 0;
  game.spawnQueue = [];
  game.completedVocabIndices = new Set();
  game.score = 0;
  game.jumps = 0;
  game.winPending = false;
  game.finishTime = null;
  game.soloCriticalCatchActive = false;
  game.soloCriticalCatchElapsed = 0;
  nextFlyId = 1;
  tongue.active = false;
  positionSoloFrog(getNormalParkStartX());
  setPrompt(0);
}

const THREE_CATCH_ATTEMPTS = Object.freeze([
  Object.freeze({ type:"ground", x:42, dir:1, spawn:3, vocab:0 }),
  Object.freeze({ type:"ground", x:412, dir:-1, spawn:4, vocab:1 }),
  Object.freeze({ type:"platform", platform:1, offset:40, dir:1, spawn:2, vocab:2 })
]);

function setupThreeCatchAttempt(index, armed = false) {
  const attemptIndex = clamp(Math.floor(index), 0, THREE_CATCH_ATTEMPTS.length - 1);
  const spec = THREE_CATCH_ATTEMPTS[attemptIndex];
  tutorial.sceneAttemptIndex = attemptIndex;
  tutorial.sceneAttemptCaught = false;
  tutorial.attemptStarted = false;
  tutorial.attemptWasAirborne = false;
  tutorial.attemptEnded = false;
  tutorial.jumpAttempts = 0;
  tutorial.promptHidden = !armed;
  flies.length = 0;
  clearLabelCaches();
  if (spec.type === "platform") positionOnPlatform(platforms[spec.platform], spec.offset, spec.dir);
  else positionSoloFrog(spec.x, CONFIG.groundY - frog.h, spec.dir);
  setPrompt(spec.vocab);
  const target = makeParkFly(spec.spawn, spec.vocab, attemptIndex);
  if (armed) {
    target.tutorialArmed = true;
    target.spawnAge = 0;
    tutorial.promptHidden = false;
    try { playFlySpawnSound(); } catch (_) {}
  }
}

function tutorialDisplayCatchTarget(setup) {
  const targets = {
    intro:0, longJumps:0, threeCatches:3, rangeCatch:1, wrongFly:2,
    comboMixed:1, comboTwo:2, comboThree:3, wallTurn:1,
    reboundCatch:1, quickDrop:1, bufferJumpCharge:0,
    bufferDrop:1, doubleBuffer:3, normalRound:5
  };
  return Number.isInteger(targets[setup]) ? targets[setup] : 0;
}

function configureSoloStep(index) {
  baseSoloScenario();
  clearScenarioState();
  const step = SOLO_STEPS[index] || SOLO_STEPS[0];
  game.tutorialDisplayCatchTarget = tutorialDisplayCatchTarget(step.setup);
  setMentor(step.mentor || "right");

  switch (step.setup) {
    case "intro":
      positionSoloFrog(getNormalParkStartX(), CONFIG.groundY - frog.h, 1);
      break;

    case "longJumps":
      positionSoloFrog(getNormalParkStartX(), CONFIG.groundY - frog.h, 1);
      tutorial.promptHidden = true;
      break;

    case "threeCatches":
      setupThreeCatchAttempt(0, false);
      break;

    case "rangeCatch": {
      positionSoloFrog(getNormalParkStartX(), CONFIG.groundY - frog.h, 1);
      setPrompt(0);
      // Center the fly over Park's right-middle platform. Its height is about
      // two-fifths of the way from the middle platform toward the top platform.
      const targetPlatform = platforms[5];
      const targetX = Math.round(targetPlatform.x + targetPlatform.w / 2);
      const targetY = Math.round(platforms[5].y - (platforms[5].y - platforms[4].y) * 0.40);
      makeFly(targetX, targetY, 0, 4);
      break;
    }

    case "wrongFly": {
      positionCenteredOnPlatform(platforms[3], 1);
      tutorial.wrongFlyPromptIndex = 0;
      tutorial.wrongFlyOriginalVocabIndex = 1;
      setPrompt(tutorial.wrongFlyPromptIndex);
      const skippedFly = makeFly(315, 108, tutorial.wrongFlyOriginalVocabIndex, 0);
      const rightFly = makeFly(390, 150, tutorial.wrongFlyPromptIndex, 1);
      tutorial.wrongFlyOriginalFlyId = skippedFly.id;
      tutorial.wrongFlyRightFlyId = rightFly.id;
      tutorial.wrongFlyRightSpawned = true;
      break;
    }

    case "comboMixed":
      positionSoloFrog(42, CONFIG.groundY - frog.h, 1);
      setPrompt(0);
      makeFly(165, 108, 0, 0);
      makeFly(240, 108, 1, 1);
      break;

    case "comboTwo":
      // Mirror the previous setup so the player approaches from the opposite
      // side instead of repeating the same left-to-right jump pattern.
      positionSoloFrog(W - 42 - frog.w, CONFIG.groundY - frog.h, -1);
      makeFly(315, 108, 0, 0);
      makeFly(240, 108, 1, 1);
      setSequence([0, 1]);
      break;

    case "comboThree":
      // Match the authored diagram: start on the left middle platform, climb
      // over the top-center platform, then sweep through two flies on the right.
      positionCenteredOnPlatform(platforms[2], 1);
      makeFly(242, 52, 0, 0);
      makeFly(365, 52, 1, 1);
      makeFly(430, 111, 2, 2);
      setSequence([0, 1, 2]);
      break;

    case "wallTurn":
      positionSoloFrog(342, CONFIG.groundY - frog.h, 1);
      setPrompt(0);
      makeParkFly(7, 0, 0);
      break;

    case "reboundCatch": {
      positionSoloFrog(350, CONFIG.groundY - frog.h, 1);
      setPrompt(0);
      const target = makeFly(PARK_FLY_SPAWNS[1].x, PARK_FLY_SPAWNS[1].y + 14, 0, 0);
      target.tutorialRequiresRebound = true;
      break;
    }

    case "quickDrop":
      restoreExactParkStage();
      positionCenteredOnPlatform(platforms[2], 1);
      setPrompt(0);
      makeParkFly(7, 0, 0);
      break;

    case "bufferJumpCharge":
      restoreExactParkStage();
      positionCenteredOnPlatform(platforms[1], 1);
      tutorial.promptHidden = true;
      setPrompt(0);
      break;

    case "bufferDrop":
      restoreExactParkStage();
      positionSoloFrog(
        platforms[2].x + Math.round((platforms[2].w - frog.w) / 2) - 5,
        CONFIG.groundY - frog.h,
        1
      );
      setPrompt(0);
      makeFly(408, 150, 0, 0);
      break;

    case "doubleBuffer":
      restoreExactParkStage();
      positionCenteredOnPlatform(platforms[1], 1);
      makeParkFly(2, 0, 0);
      makeParkFly(4, 1, 1);
      makeParkFly(6, 2, 2);
      setSequence([0, 1, 2]);
      break;

    case "normalRound":
      restoreExactParkStage();
      game.sandboxMode = false;
      game.soloCatchGoal = 5;
      resetGame(true);
      restoreExactParkStage();
      game.state = "playing";
      // The final round is a real five-fly Park round, including its English
      // clue and every fly's matching vocabulary label after a retry/skip.
      setPrompt(Number.isInteger(game.targetVocabIndex) ? game.targetVocabIndex : 0);
      tutorial.promptHidden = false;
      try { window.RibbitRaceResetFinalCatchLabels?.(); } catch (_) {}
      break;

    default:
      break;
  }

  setMentor(step.mentor || "right");
  restoreExactParkStage();
}

function basePvpScenario() {
  const selectedPlayerSkin = String(tutorial.pvpPlayerSkinId || game.pvpSetupSkinIds?.[0] || game.skinId || "azure");
  game.mode = "pvp";
  game.onlineMode = false;
  game.selectedLevelId = "park";
  game.pvpSetupLevelId = "park";
  // CPU mode gives the human player the normal Space control. Ember's normal
  // AI is suppressed during lessons and restored only for the final match.
  game.pvpCpuEnabled = true;
  game.pvpCpuDifficulty = 5;
  game.pvpRoundTarget = 99;
  game.pvpRoundGoalMode = "firstto";
  game.pvpFirstTo = 99;
  game.pvpBestOf = 1;
  game.pvpTimeLimitSeconds = 0;
  game.timeOfDayLock = "afternoon";
  game.timeOfDay = "afternoon";
  applySelectedLevel();
  resetPvpGame();
  game.state = "playing";
  game.spawnQueue = [];
  flies.length = 0;
  nextFlyId = 1;
  resetPvpPlayer(pvpPlayers[0], 70, 1);
  resetPvpPlayer(pvpPlayers[1], 330, -1);
  pvpPlayers[0].skinId = selectedPlayerSkin;
  pvpPlayers[1].skinId = "ember";
  game.pvpSetupSkinIds[0] = selectedPlayerSkin;
  game.pvpSetupSkinIds[1] = "ember";
  setPrompt(0);
}

function positionPvp(player, x, y = CONFIG.groundY - player.h, dir = 1) {
  resetPvpPlayer(player, x, dir);
  player.y = y;
  player.previousY = y;
}

function positionPvpOnPlatform(player, platform, dir = 1, offset = null) {
  const x = platform.x + (offset === null ? Math.round((platform.w - player.w) / 2) : offset);
  positionPvp(player, x, platform.y - player.h, dir);
}

function setPvpAirborne(player, x, y, vx, vy, dir = 1) {
  positionPvp(player, x, y, dir);
  player.grounded = false;
  player.vx = vx;
  player.vy = vy;
  player.previousY = y;
  player.jumpStartY = y;
  player.highestY = y;
  player.firstJumpMade = true;
}

function addPvpTutorialFly(x, y, vocabIndex = 0, authoredIndex = 0) {
  const fly = makeFly(x, y, vocabIndex, authoredIndex);
  fly.tutorialArmed = false;
  return fly;
}

function pvpFlyRevealDelayMs(setup) {
  // The timed Scene 14 practice reveal is immediate. Other scripted fly
  // lessons use the one-second post-poof delay from the authored script.
  if (["pvpIntercept", "pvpDemoDinnerSteal", "pvpDinnerSteal"].includes(setup)) return 0;
  return PVP_ONE_SECOND_FLY_SETUPS.has(String(setup || "")) ? 1000 : 0;
}

function schedulePvpFlyReveal(setup, delayMs = pvpFlyRevealDelayMs(setup)) {
  const hasHiddenFly = flies.some((fly) => fly?.tutorialAuthored && fly.tutorialArmed === false);
  if (!hasHiddenFly) {
    tutorial.pvpFlyRevealAt = 0;
    tutorial.pvpFlyRevealSetup = "";
    return 0;
  }
  const safeDelay = Math.max(0, Number(delayMs) || 0);
  if (safeDelay <= 0) {
    tutorial.pvpFlyRevealAt = 0;
    tutorial.pvpFlyRevealSetup = "";
    return armTutorialFlies();
  }
  tutorial.pvpFlyRevealAt = performance.now() + safeDelay;
  tutorial.pvpFlyRevealSetup = String(setup || "");
  tutorial.promptHidden = true;
  return 0;
}

function updatePvpFlyReveal(now = performance.now()) {
  if (tutorial.kind !== "pvp" || tutorial.pvpFlyRevealAt <= 0 || now < tutorial.pvpFlyRevealAt) return false;
  tutorial.pvpFlyRevealAt = 0;
  tutorial.pvpFlyRevealSetup = "";
  armTutorialFlies();
  return true;
}

function positionPvpBonkPracticeLayout(index = 0) {
  const p1 = pvpPlayers[0];
  const ember = pvpPlayers[1];
  const lowerLeft = PARK_PLATFORMS[1];
  const middleLeft = PARK_PLATFORMS[2];
  const middleRight = PARK_PLATFORMS[5];
  const layouts = [
    // 1. The screenshot's left-to-right ground lane.
    () => { positionPvp(p1, 145, CONFIG.groundY - p1.h, 1); positionPvp(ember, 305, CONFIG.groundY - ember.h, -1); },
    // 2. Ember's body center is exactly under platform two (middle-left).
    () => { positionPvpOnPlatform(p1, lowerLeft, 1); positionPvp(ember, middleLeft.x + (middleLeft.w - ember.w) / 2, CONFIG.groundY - ember.h, -1); },
    // 3. The player takes that ground position; Ember waits on middle-right.
    () => { positionPvp(p1, middleLeft.x + (middleLeft.w - p1.w) / 2, CONFIG.groundY - p1.h, 1); positionPvpOnPlatform(ember, middleRight, -1); }
  ];
  tutorial.pvpPracticeLayoutIndex = clamp(Math.floor(index), 0, layouts.length - 1);
  layouts[tutorial.pvpPracticeLayoutIndex]();
  ember.inputHeld = false;
  ember.charging = false;
}

function positionPvpReboundPracticeLayout(completed = 0) {
  const p1 = pvpPlayers[0];
  const ember = pvpPlayers[1];
  if (completed >= 2) {
    // Final rebound: the frogs start on opposite sides of the top platform.
    const top = PARK_PLATFORMS[4];
    positionPvpOnPlatform(p1, top, 1, 4);
    positionPvpOnPlatform(ember, top, -1, top.w - ember.w - 4);
  } else if (completed === 1) {
    // Second rebound: mirror the platform layout exactly; one frog centered
    // on each of the mid-height platforms, both looking inward.
    positionPvpOnPlatform(p1, PARK_PLATFORMS[2], 1);
    positionPvpOnPlatform(ember, PARK_PLATFORMS[5], -1);
  } else {
    positionPvp(p1, 150, CONFIG.groundY - p1.h, 1);
    positionPvp(ember, 300, CONFIG.groundY - ember.h, -1);
  }
  tutorial.pvpMirrorWasHeld = false;
}

function configurePvpStep(index) {
  basePvpScenario();
  const step = PVP_STEPS[index] || PVP_STEPS[0];
  const p1 = pvpPlayers[0];
  const ember = pvpPlayers[1];
  const lowerLeft = PARK_PLATFORMS[1];
  const middleLeft = PARK_PLATFORMS[2];
  const top = PARK_PLATFORMS[4];
  const middleRight = PARK_PLATFORMS[5];

  switch (step.setup) {
    case "pvpWelcome":
    case "pvpDemoBonk":
      // Exact ground-level opening lane from the reference screenshot.
      positionPvp(p1, 145, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
      break;
    case "pvpBonkThree":
      positionPvpBonkPracticeLayout(tutorial.pvpPracticeLayoutIndex || 0);
      break;
    case "pvpDemoBonkCatch":
      positionPvp(p1, 145, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
      addPvpTutorialFly(lowerLeft.x + lowerLeft.w / 2, lowerLeft.y - 35, 0, 0);
      break;
    case "pvpBonkCatch": {
      // The learner uses the SAME frog positions and facing as Ember's demo;
      // only the matching fly crosses to the opposite (right) side.
      const lowerRight = PARK_PLATFORMS[6];
      positionPvp(p1, 145, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
      addPvpTutorialFly(lowerRight.x + lowerRight.w / 2, lowerRight.y - 35, 0, 0);
      break;
    }
    case "pvpDemoDropLow": {
      const lowerMiddle = PARK_PLATFORMS[3];
      // Ember occupies the right half of the lower-middle platform while the
      // player waits diagonally down-left and faces her. This gives the drop a
      // clear, forgiving line instead of forcing a near-perfect vertical hit.
      const emberOffset = lowerMiddle.w - ember.w - 6;
      positionPvpOnPlatform(ember, lowerMiddle, -1, emberOffset);
      positionPvp(p1, lowerMiddle.x + emberOffset - 18, CONFIG.groundY - p1.h, 1);
      break;
    }
    case "pvpDropLow": {
      const lowerMiddle = PARK_PLATFORMS[3];
      // Mirror the demonstration for the player's attempt.
      const playerOffset = 6;
      positionPvpOnPlatform(p1, lowerMiddle, 1, playerOffset);
      positionPvp(ember, lowerMiddle.x + playerOffset + 18, CONFIG.groundY - ember.h, -1);
      break;
    }
    case "pvpDemoDropHigh": {
      // Ember stands on the right side of the top platform facing left. The
      // target waits on the ground just left of the lower-middle platform.
      const offset = top.w - ember.w - 4;
      positionPvpOnPlatform(ember, top, -1, offset);
      positionPvp(p1, PARK_PLATFORMS[3].x - p1.w - 4, CONFIG.groundY - p1.h, 1);
      break;
    }
    case "pvpDropHigh": {
      // Mirror the setup for the player: face right from the left side of the
      // top platform and drop onto Ember waiting to the right of the lane.
      positionPvpOnPlatform(p1, top, 1, 4);
      positionPvp(ember, PARK_PLATFORMS[3].x + PARK_PLATFORMS[3].w + 4, CONFIG.groundY - ember.h, -1);
      break;
    }
    case "pvpDemoBufferedBonk": {
      // One continuous charge into a buffered platform drop: the target waits
      // at true stage center and Ember approaches from beneath the right perch.
      const lowRight = PARK_PLATFORMS[6];
      positionPvp(p1, Math.round((W-p1.w)/2), CONFIG.groundY-p1.h, 1);
      positionPvp(ember, lowRight.x+(lowRight.w-ember.w)/2, CONFIG.groundY-ember.h, -1);
      break;
    }
    case "pvpBufferedBonk": {
      // P1 uses their default left starting position. Ember waits in the
      // center: one jump, one buffered drop, one bonk. A miss retries.
      positionPvp(p1, PVP_START_X[0], CONFIG.groundY-p1.h, 1);
      positionPvp(ember, Math.round((W-ember.w)/2), CONFIG.groundY-ember.h, -1);
      break;
    }
    case "pvpDemoSkyBonk":
      // Mirror the example: Ember launches LEFT from the top platform,
      // toward P1 waiting on the lower-left platform.
      positionPvpOnPlatform(ember, top, -1);
      positionPvpOnPlatform(p1, PARK_PLATFORMS[1], 1);
      break;
    case "pvpSkyBonk":
      positionPvpOnPlatform(p1, top, 1);
      positionPvpOnPlatform(ember, PARK_PLATFORMS[6], -1);
      break;
    case "pvpDemoBufferedSky": {
      const rightMiddle = PARK_PLATFORMS[5];
      // Ember launches from the exact top-center. P1 faces left under
      // the outer edge of the middle-right platform, on the tested bonk lane.
      positionPvpOnPlatform(ember, top, 1);
      positionPvp(p1, rightMiddle.x + rightMiddle.w - p1.w + 2, CONFIG.groundY - p1.h, -1);
      break;
    }
    case "pvpBufferedSky": {
      const leftMiddle = PARK_PLATFORMS[2];
      positionPvpOnPlatform(p1, top, -1);
      positionPvp(ember, leftMiddle.x-2, CONFIG.groundY-ember.h, 1);
      break;
    }
    case "pvpDemoHighGround":
      // Start exactly like the authored reference: P1 waits in the middle of
      // the top perch, while Ember begins from the lower-right platform.
      positionPvpOnPlatform(p1, top, 1);
      positionPvpOnPlatform(ember, PARK_PLATFORMS[6], -1);
      break;
    case "pvpHighGround":
      // Swap roles on the same two platforms. A single player jump must knock
      // Ember down; a miss poofs the original positions back into place.
      positionPvpOnPlatform(ember, top, -1);
      positionPvpOnPlatform(p1, PARK_PLATFORMS[6], -1);
      break;
    case "pvpDemoRecoveryBonk":
      // Match the requested lane from the reference image.
      positionPvp(p1, 150, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 300, CONFIG.groundY - ember.h, -1);
      break;
    case "pvpRecoveryBonk":
      positionPvp(p1, Math.round(W * 0.25), CONFIG.groundY - p1.h, 1);
      positionPvp(ember, Math.round(W * 0.50), CONFIG.groundY - ember.h, -1);
      break;
    case "pvpDemoBoostBonk":
      // Ember's demonstration starts with player on the left and Ember on the
      // right. The user's own turn retains its established start positions.
      positionPvp(p1, 145, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
      addPvpTutorialFly(Math.round(PARK_PLATFORMS[1].x + PARK_PLATFORMS[1].w / 2), 84, game.targetVocabIndex, 0);
      break;
    case "pvpBoostBonk":
      // The player's setup stays unchanged, with the vocabulary fly moved
      // across the stage from Ember's demonstration (left -> right).
      positionPvp(p1, 145, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
      addPvpTutorialFly(Math.round(PARK_PLATFORMS[6].x + PARK_PLATFORMS[6].w / 2), 84, game.targetVocabIndex, 0);
      break;
    case "pvpDemoUnderBonk": {
      // The lower frog waits one frog-width before the target under the center
      // lower platform. Ember naturally *jumps* from mid-right to that platform.
      // There is no teleport in this demonstration.
      const lowerCenter = PARK_PLATFORMS[3];
      positionPvp(p1, lowerCenter.x + Math.round((lowerCenter.w - p1.w) / 2) - p1.w + 4,
        CONFIG.groundY - p1.h, 1);
      // The slight right-of-center approach gives the natural leftward jump
      // time to finish over the exact center of the lower platform.
      positionPvpOnPlatform(ember, middleRight, -1, middleRight.w - ember.w - 2);
      break;
    }
    case "pvpUnderBonkTwo": {
      // The player follows Ember's example: leap from the left-mid perch to
      // the center-lower perch. Ember waits below, then charges only once
      // the player has released the first jump.
      const center = PARK_PLATFORMS[3];
      positionPvpOnPlatform(p1, PARK_PLATFORMS[2], 1);
      positionPvp(ember, center.x + 28, CONFIG.groundY - ember.h, 1);
      break;
    }
    case "pvpDemoAvoidUnder":
      // Mirror the requested player-practice lane: Ember demonstrates from the
      // right, slipping under the player waiting on the center platform.
      positionPvpOnPlatform(p1, PARK_PLATFORMS[3], 1);
      positionPvp(ember, PARK_PLATFORMS[3].x + PARK_PLATFORMS[3].w + 8, CONFIG.groundY - ember.h, -1);
      break;
    case "pvpAvoidUnder":
      // Player practice uses the pictured layout: player on the left ground,
      // Ember perched above on the lower-middle platform.
      positionPvp(p1, 150, CONFIG.groundY - p1.h, 1);
      positionPvpOnPlatform(ember, PARK_PLATFORMS[3], -1);
      break;
    case "pvpDemoRebound":
      positionPvp(p1, 150, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 300, CONFIG.groundY - ember.h, -1);
      break;
    case "pvpReboundThree":
      positionPvpReboundPracticeLayout(tutorial.pvpReboundCount);
      break;
    case "pvpDemoReboundCatch":
      // The stationary frog stands on the lower-middle perch. Ember starts
      // at ground level on its right and rebounds toward the fly behind her.
      positionPvpOnPlatform(p1, PARK_PLATFORMS[3], 1);
      positionPvp(ember, 273, CONFIG.groundY - ember.h, -1);
      addPvpTutorialFly(399, PARK_PLATFORMS[4].y + 8, 0, 0);
      break;
    case "pvpReboundCatch": {
      // Player practice is the exact left/right reflection of the demo.
      const reflectedPlayerX = W - 273 - p1.w;
      positionPvpOnPlatform(ember, PARK_PLATFORMS[3], -1);
      positionPvp(p1, reflectedPlayerX, CONFIG.groundY - p1.h, 1);
      addPvpTutorialFly(W - 399, PARK_PLATFORMS[4].y + 8, 0, 0);
      break;
    }
    case "pvpDemoIntercept":
      positionPvp(p1, 118, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
      // Keep the bait well above rebound height so nobody can eat it
      // immediately after changing directions.
      addPvpTutorialFly(390, PARK_PLATFORMS[4].y - 2, 0, 0);
      break;
    case "pvpIntercept":
      positionPvp(p1, 275, CONFIG.groundY - p1.h, -1);
      positionPvp(ember, 135, CONFIG.groundY - ember.h, 1);
      addPvpTutorialFly(390, PARK_PLATFORMS[4].y - 2, 0, 0);
      break;
    case "pvpDemoDinnerSteal":
      // Rebound occurs near center. The fly is close enough on Ember's
      // *outgoing* rebound arc to be caught in the very same jump, but far
      // enough from her starting pose that she cannot eat it beforehand.
      positionPvp(p1, 118, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
      addPvpTutorialFly(348, PARK_PLATFORMS[4].y + 4, 0, 0);
      break;
    case "pvpDinnerSteal":
      // Switch ownership of the same opposing approach lanes: P1 starts LEFT,
      // rebounds back LEFT, and reaches the fly over the lower-left platform.
      // Positioning P1 on the right would rebound them AWAY from that fly.
      positionPvp(p1, 118, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
      addPvpTutorialFly(Math.round(PARK_PLATFORMS[1].x + PARK_PLATFORMS[1].w / 2) + 14, PARK_PLATFORMS[4].y + 4, 0, 0);
      break;
    case "pvpFinalMatch":
      positionPvp(p1, PVP_START_X[0], CONFIG.groundY - p1.h, 1);
      positionPvp(ember, PVP_START_X[1], CONFIG.groundY - ember.h, -1);
      break;
    default:
      break;
  }
  ember.skinId = "ember";
  game.pvpSetupSkinIds[1] = "ember";
  clearScenarioState();
  tutorial.pvpEmberFacingLock = Number(ember.dir || -1);
  // Tutorial lessons without an authored fly keep the vocabulary body blank.
  // Fly scenes reveal the clue only when their fly is actually armed.
  tutorial.promptHidden = !step.finalMatch;
}

function clearPvpScriptActions() {
  tutorial.pvpScriptActions = [];
  tutorial.pvpScriptBufferPlatform = null;
  tutorial.pvpScriptBufferTriggered = false;
}

function queuePvpScriptAction(delayMs, action, label = "") {
  if (typeof action !== "function") return;
  tutorial.pvpScriptActions.push({
    dueAt: performance.now() + Math.max(0, Number(delayMs) || 0),
    action,
    label:String(label || "")
  });
  tutorial.pvpScriptActions.sort((a, b) => a.dueAt - b.dueAt);
}

function updatePvpScriptActions(now = performance.now()) {
  if (!tutorial.pvpScriptActions.length) return;
  const due = [];
  const pending = [];
  for (const item of tutorial.pvpScriptActions) {
    if (now >= item.dueAt) due.push(item);
    else pending.push(item);
  }
  tutorial.pvpScriptActions = pending;
  for (const item of due) {
    try { item.action(); }
    catch (error) { console.warn("Ribbit Race tutorial script action recovered", item.label, error); }
  }
}

function scriptPvpPress(index, facing = null) {
  const player = pvpPlayers[index];
  if (!player) return false;
  if (player.grounded && (Number(facing) === 1 || Number(facing) === -1)) {
    player.dir = Number(facing);
    player.chargeFacingDir = Number(facing);
    if (index === 1) tutorial.pvpEmberFacingLock = Number(facing);
  }
  if (tutorial.active && tutorial.kind === "pvp" && tutorial.pvpDemoActive && index === 0) {
    tutorial.pvpPlayerScriptLocked = true;
  }
  player.inputHeld = false;
  try {
    originalPressPvpButtonForTutorial.call(this, index, "tutorial-script");
    return true;
  } catch (_) {
    player.inputHeld = true;
    if (player.grounded) {
      player.charging = true;
      player.charge = 0.04;
      player.chargeDirection = 1;
      player.chargeHoldTime = 0;
    }
    return true;
  }
}

function scriptPvpRelease(index, power = null) {
  const player = pvpPlayers[index];
  if (!player) return false;
  if (Number.isFinite(Number(power))) {
    player.charge = clamp(Number(power), 0.04, 1);
    player.chargeDirection = player.charge >= .98 ? -1 : 1;
  }
  try {
    originalReleasePvpButtonForTutorial.call(this, index, "tutorial-script");
    return true;
  } catch (_) {
    player.inputHeld = false;
    return false;
  }
}

function scriptPvpChargedJump(index, power = .75, facing = null, delayMs = 0) {
  const chargeMs = Math.max(120, Math.round(clamp(Number(power) || .75, .04, 1) * Number(CONFIG.chargeSecondsOneWay || .8333) * 1000));
  queuePvpScriptAction(delayMs, () => scriptPvpPress(index, facing), `press-${index}`);
  queuePvpScriptAction(delayMs + chargeMs, () => scriptPvpRelease(index, power), `release-${index}`);
  return delayMs + chargeMs;
}

function scriptPvpQuickDrop(index, delayMs = 0) {
  queuePvpScriptAction(delayMs, () => scriptPvpPress(index), `quick-drop-press-${index}`);
  queuePvpScriptAction(delayMs + 70, () => scriptPvpRelease(index, .05), `quick-drop-release-${index}`);
}

function armPvpScriptedBuffer(index, platform) {
  tutorial.pvpScriptBufferPlatform = { index:Number(index), platform };
  tutorial.pvpScriptBufferTriggered = false;
}

function updatePvpScriptedBuffer() {
  const state = tutorial.pvpScriptBufferPlatform;
  if (!state || tutorial.pvpScriptBufferTriggered) return;
  const player = pvpPlayers[state.index];
  const platform = state.platform;
  if (!player || !platform || player.grounded || player.vy <= 0) return;
  const distance = platform.y - (player.y + player.h);
  if (distance < -3) return;
  // Predict the landing rather than using a fixed 24px trigger. A fast sky
  // fall covers 24px before a 55ms tap has released, missing the buffer.
  const timeToLanding = (Math.sqrt(player.vy * player.vy + 2 * CONFIG.gravity * Math.max(0,distance)) - player.vy) / CONFIG.gravity;
  const landingX = player.x + player.vx * timeToLanding;
  const horizontallyOver = landingX + player.w * .78 > platform.x && landingX + player.w * .22 < platform.x + platform.w;
  if (!horizontallyOver || timeToLanding > .14) return;
  tutorial.pvpScriptBufferTriggered = true;
  scriptPvpPress(state.index);
  queuePvpScriptAction(55, () => scriptPvpRelease(state.index), `buffer-release-${state.index}`);
}

function holdEmberStill() {
  const ember = pvpPlayers[1];
  if (!ember || ember.bonked || ember.stunTimer > 0 || !ember.grounded) return;
  ember.inputHeld = false;
  ember.charging = false;
  ember.chargeHoldTime = 0;
  ember.vx = 0;
  ember.vy = 0;
}

function beginPvpDemoMotion(setup) {
  const p1 = pvpPlayers[0];
  const ember = pvpPlayers[1];
  const lowerLeft = PARK_PLATFORMS[1];
  const middleLeft = PARK_PLATFORMS[2];
  const top = PARK_PLATFORMS[4];
  const middleRight = PARK_PLATFORMS[5];
  clearPvpScriptActions();
  tutorial.pvpDemoBegun = true;
  tutorial.pvpDemoStartedAt = performance.now();
  tutorial.pvpDemoStage = 0;
  tutorial.pvpDemoBonkAt = 0;
  tutorial.pvpDemoBonkCount = 0;
  tutorial.pvpDemoBlockedBonkAt = 0;
  tutorial.pvpDemoUnderBonkAt = 0;
  tutorial.pvpDemoBonkHandled = false;
  tutorial.pvpDemoFollowupStarted = false;
  tutorial.pvpLessonAirborneSeen = [false, false];
  tutorial.pvpLessonLanded = [false, false];
  tutorial.pvpTechniqueCatchQualified = false;
  tutorial.pvpTechniqueCatchPlayerIndex = -1;
  tutorial.pvpTechniqueCatchAt = 0;
  tutorial.pvpReboundAt = 0;
  tutorial.pvpDemoRetryQueued = false;
  tutorial.pvpLowProfileSawAirborne = false;
  tutorial.pvpLowProfileJumpCount = 0;
  tutorial.pvpCaption = "WATCH EMBER!";
  tutorial.pvpCaptionUntil = performance.now() + 2400;

  switch (setup) {
    case "pvpDemoBonk":
      scriptPvpChargedJump(1, .74, -1, 0);
      break;
    case "pvpDemoBonkCatch":
      scriptPvpChargedJump(1, .74, -1, 0);
      break;
    case "pvpDemoDropLow":
    case "pvpDemoDropHigh":
      scriptPvpQuickDrop(1, 0);
      break;
    case "pvpDemoBufferedBonk":
      // One charge to pass through the lower-middle platform and bonk P1.
      tutorial.pvpDemoStage = 0;
      armPvpScriptedBuffer(1, PARK_PLATFORMS[3]);
      scriptPvpChargedJump(1, .70, -1, 0);
      break;
    case "pvpDemoSkyBonk":
      // Full charge reaches the mirrored lower-left target after the natural
      // wall rebound, instead of falling short of the bonk.
      scriptPvpChargedJump(1, 1, -1, 0);
      break;
    case "pvpDemoBufferedSky":
      // The buffered tap must target the lower-right perch: the descending
      // maximum jump crosses that platform before landing under mid-right.
      armPvpScriptedBuffer(1, PARK_PLATFORMS[6]);
      scriptPvpChargedJump(1, 1, 1, 0);
      break;
    case "pvpDemoHighGround":
      // Reach the frog standing in the middle of the top perch in ONE jump.
      // No follow-up wall jump is needed to demonstrate the knock-off.
      scriptPvpChargedJump(1, 1, -1, 0);
      break;
    case "pvpDemoRecoveryBonk":
      scriptPvpChargedJump(1, .55, -1, 0);
      break;
    case "pvpDemoBoostBonk":
      // Demonstration reverses the old left/right spots, including jump
      // facing. Keep both frogs using real charges/collisions.
      scriptPvpChargedJump(1, .74, -1, 0);
      scriptPvpChargedJump(0, .25, 1, 1149);
      break;
    case "pvpDemoUnderBonk":
      // A 40% charge stays well beyond the 250ms quick-drop threshold,
      // even with discrete frame updates. This arc lands on lower-center, not a drop
      // followed by a scripted teleport. The player jumps once she lands.
      scriptPvpChargedJump(1, .40, -1, 0);
      break;
    case "pvpDemoAvoidUnder":
      // Five shallow hops while moving left beneath the opponent's platform.
      scriptPvpChargedJump(1, .18, -1, 0);
      break;
    case "pvpDemoRebound":
      // Three-quarters charged before both frogs rebound in the air.
      scriptPvpChargedJump(0, .75, 1, 0);
      scriptPvpChargedJump(1, .75, -1, 0);
      break;
    case "pvpDemoReboundCatch":
      scriptPvpChargedJump(1, 1, -1, 0);
      break;
    case "pvpDemoIntercept":
      scriptPvpChargedJump(0, .85, 1, 0);
      scriptPvpChargedJump(1, .85, -1, 100);
      break;
    case "pvpDemoDinnerSteal":
      // The two frogs each get ONE charged jump. The rebound turns Ember
      // toward the fly; no scripted second jump is allowed after landing.
      // Launch together at matching height. A 100ms stagger put Ember below
      // P1 at their crossing, causing a miss and endless poof retries.
      scriptPvpChargedJump(0, 1, 1, 0);
      scriptPvpChargedJump(1, 1, -1, 0);
      break;
    default:
      break;
  }
}

function startPvpDemonstration(options = {}) {
  const setup = tutorialStep()?.setup || "";
  const intendedPvpPoses = tutorial.pendingPvpTargetPoses;
  const skipPoof = Boolean(options.skipPoof || pvpAtIntendedPositions(intendedPvpPoses));
  const prepare = () => {
    tutorial.pvpDemoActive = true;
    tutorial.pvpDemoKind = setup;
    tutorial.pvpDemoBegun = false;
    tutorial.pvpPlayerScriptLocked = true;
    tutorial.pvpDemoDuration = /Boost|Recovery|BufferedSky|HighGround/.test(setup) ? 8.0 : /BonkCatch|ReboundCatch|DinnerSteal/.test(setup) ? 6.5 : 5.0;
    tutorial.pvpCaption = "WATCH EMBER!";
    tutorial.pvpCaptionUntil = performance.now() + 3000;
    // Every demonstration waits a full second after the final dialogue line
    // and the poof-in before scripted movement begins.
    tutorial.pvpDemoStartedAt = performance.now() + 1000;
    schedulePvpFlyReveal(setup, pvpFlyRevealDelayMs(setup));
    clearHeldInput();
    freezeControlledEntity();
  };
  if (skipPoof) {
    tutorial.scenePositionedDuringDialogue = false;
    tutorial.pendingStartPose = null;
    tutorial.pendingPvpTargetPoses = null;
    prepare();
    return;
  }
  tutorial.pvpDemoActive = true;
  tutorial.pvpDemoKind = setup;
  tutorial.pvpDemoBegun = false;
  tutorial.pvpPlayerScriptLocked = true;
  tutorial.pvpCaption = "WATCH EMBER!";
  tutorial.pvpCaptionUntil = performance.now() + 3000;
  beginPoofTransition({
    reason: "pvp-demo-entry",
    showFailure: false,
    preserveExistingFlies: false,
    armFlies: false,
    action: () => {
      if (Array.isArray(intendedPvpPoses)) applyPvpTutorialPoses(intendedPvpPoses);
      else configurePvpStep(tutorial.step);
      tutorial.pendingPvpTargetPoses = null;
      tutorial.pendingPvpVisualPoses = null;
      prepare();
    }
  });
}

function restartMissedPvpReboundDemonstration() {
  if (tutorial.pvpDemoRetryQueued || tutorial.resetPending) return false;
  tutorial.pvpDemoRetryQueued = true;
  const stillVisible = collectVisibleTutorialFlyKeys();
  clearPvpScriptActions();
  return beginPoofTransition({
    reason: "retry-single-jump-rebound-catch",
    showFailure: false,
    preserveExistingFlies: true,
    armFlies: false,
    waitForEffects: false,
    action: () => {
      rebuildCurrentScenarioForRetry();
      // A fly that survived the attempt stays present without a second spawn
      // effect; an eaten one returns with the frogs' poof-in.
      armTutorialFlies({ preserveKeys: stillVisible });
      tutorial.pvpDemoRetryQueued = false;
      startPvpDemonstration({ skipPoof: true });
    }
  });
}

function updatePvpDemonstration() {
  if (tutorial.pvpDemoRetryQueued) return;
  if (!tutorial.pvpDemoActive || tutorial.resetPending) return;
  const now = performance.now();
  updatePvpScriptActions(now);
  updatePvpScriptedBuffer();
  if (!tutorial.pvpDemoBegun) {
    if (now < tutorial.pvpDemoStartedAt) return;
    beginPvpDemoMotion(tutorial.pvpDemoKind);
    return;
  }

  const elapsed = (now - tutorial.pvpDemoStartedAt) / 1000;
  const p1 = pvpPlayers[0];
  const ember = pvpPlayers[1];
  const setup = tutorial.pvpDemoKind;
  const landed = updatePvpLessonLandings();

  if (["pvpDemoReboundCatch", "pvpDemoDinnerSteal"].includes(setup)) {
    // An actual matching catch after a rebound (while airborne) is the sole
    // completion condition. A missed jump must land before the poof retry.
    if (tutorial.pvpTechniqueCatchQualified && tutorial.pvpTechniqueCatchPlayerIndex === 1) {
      if (!game.pvpCriticalCatchActive && ember.grounded && !ember.tongue.active &&
          now - tutorial.pvpTechniqueCatchAt >= 450) {
        clearPvpScriptActions();
        tutorial.pvpDemoActive = false;
        tutorial.pvpPlayerScriptLocked = false;
        tutorial.pvpCaption = "";
        passStep();
      }
      return;
    }
    const missedLanding = tutorial.pvpReboundCount > 0 ? landed[1] : (landed[0] || landed[1]);
    if (missedLanding) {
      restartMissedPvpReboundDemonstration();
      return;
    }
  }

  // After the opening bonk, Ember lands and makes one ordinary follow-up jump
  // toward the fly. This visibly demonstrates the two-jump bonk-and-catch path.
  if (setup === "pvpDemoBonkCatch" && tutorial.pvpDemoBonkAt > 0 && !tutorial.pvpDemoFollowupStarted &&
      ember.grounded && now - tutorial.pvpDemoBonkAt >= 280) {
    tutorial.pvpDemoFollowupStarted = true;
    const followDirection = ember.dir;
    // No target-facing steering: the wall is the only way back to dinner.
    scriptPvpChargedJump(1, .72, followDirection, 0);
  }

  // Chapter 5 is deliberately a one-jump lesson. Missing the target
  // returns the frogs to the start, rather than chaining a second jump.

  // High-ground knock-off is one charged jump; missing the target retries
  // from the original positions instead of scripting a second jump.

  if (setup === "pvpDemoBoostBonk" && tutorial.pvpDemoStage >= 1 && tutorial.pvpDemoBonkCount >= 2 &&
      !tutorial.pvpDemoFollowupStarted && ember.grounded && !ember.charging) {
    tutorial.pvpDemoFollowupStarted = true;
    scriptPvpChargedJump(1, .86, null, 120);
    // Let the normal automatic tongue/catch radius collect the high fly.
    // A forced tongue here used to reach across the map after Ember had
    // already passed her fly and played a misleading slow-motion catch.
  }

  if (setup === "pvpDemoUnderBonk" && tutorial.pvpDemoStage === 0 && ember.firstJumpMade &&
      ember.grounded && !ember.charging && !ember.bonked &&
      getPvpStandingPlatform(ember) === PARK_PLATFORMS[3]) {
    // She arrived on the lower-center platform by real physics, not a reset.
    tutorial.pvpDemoStage = 1;
    scriptPvpChargedJump(0, .78, 1, 120);
  }

  if (setup === "pvpDemoAvoidUnder") {
    // Count genuine takeoff/landing cycles, never five render frames spent
    // grounded. The fifth clean landing finishes without a poof or scene retry.
    if (!ember.grounded && ember.firstJumpMade) tutorial.pvpLowProfileSawAirborne = true;
    else if (ember.grounded && tutorial.pvpLowProfileSawAirborne) {
      tutorial.pvpLowProfileSawAirborne = false;
      tutorial.pvpLowProfileJumpCount = (tutorial.pvpLowProfileJumpCount || 0) + 1;
      tutorial.pvpDemoStage = tutorial.pvpLowProfileJumpCount;
      if (tutorial.pvpLowProfileJumpCount < 5 && !ember.bonked && ember.stunTimer <= 0) {
        scriptPvpChargedJump(1, .18, -1, 120);
      }
    }
  }

  // In the recovery demonstration the real wall bounce brings Ember back
  // onto the still-stunned frog. That contact is a harmless footstool, not a
  // second bonk. Wait for recovery before explaining the result.

  // Show the bounce-boost comparison as two real jumps from the same launch
  // points. The second lower-frog jump uses near-maximum charge.
  if (setup === "pvpDemoBoostBonk" && tutorial.pvpDemoStage === 0 && tutorial.pvpDemoBonkCount >= 1 && elapsed >= 3.0 && pvpTutorialSettled()) {
    tutorial.pvpDemoStage = 1;
    addTutorialPoof(p1.x + p1.w / 2, p1.y + p1.h / 2, "out");
    addTutorialPoof(ember.x + ember.w / 2, ember.y + ember.h / 2, "out");
    playTutorialPoofSound("out");
    positionPvp(p1, 145, CONFIG.groundY - p1.h, 1);
    positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
    addTutorialPoof(p1.x + p1.w / 2, p1.y + p1.h / 2, "in");
    addTutorialPoof(ember.x + ember.w / 2, ember.y + ember.h / 2, "in");
    playTutorialPoofSound("in");
    scriptPvpChargedJump(1, .74, -1, 500);
    scriptPvpChargedJump(0, .95, 1, 825);
  }

  // Recovery timing: first cross toward the waiting frog, then show that
  // another attempted bonk during the real stun does not score again. Every
  // change in position comes from an actual jump, not a tutorial teleport.
  if (setup === "pvpDemoRecoveryBonk") {
    const lowerCenter = PARK_PLATFORMS[3];
    if (tutorial.pvpDemoStage === 0 && ember.firstJumpMade && ember.grounded &&
        getPvpStandingPlatform(ember) === lowerCenter && !ember.charging &&
        !tutorial.pvpScriptActions.length) {
      tutorial.pvpDemoStage = 1;
      scriptPvpChargedJump(1, .42, -1, 120);
    } else if (tutorial.pvpDemoStage === 1 && tutorial.pvpDemoBonkCount >= 1 &&
        ember.grounded && !ember.charging && !tutorial.pvpScriptActions.length) {
      tutorial.pvpDemoStage = 2;
      scriptPvpChargedJump(1, .55, 1, 0);
    }
  }

  // Dinner Steal intentionally has NO follow-up jump: rebound and catch
  // must occur before the very first leap ends for each frog.

  // After Ember's introductory bonk, hold both frogs exactly where the real
  // physics left them. The next scene performs its authored poof immediately
  // before “Now you try.”
  if (setup === "pvpDemoBonk" && tutorial.pvpDemoBonkAt > 0 &&
      now - tutorial.pvpDemoBonkAt >= 1000 && !tutorial.pvpDemoBonkHandled) {
    tutorial.pvpDemoBonkHandled = true;
    tutorial.pvpDemoActive = false;
    tutorial.pvpPlayerScriptLocked = false;
    clearPvpScriptActions();
    freezeControlledEntity();
    passStep();
    return;
  }

  let completed = false;
  if (["pvpDemoDropLow","pvpDemoDropHigh","pvpDemoBufferedBonk","pvpDemoSkyBonk","pvpDemoBufferedSky","pvpDemoHighGround"].includes(setup)) {
    const bonkImpactReady = tutorial.pvpDemoBonkAt > 0 && now - tutorial.pvpDemoBonkAt >= 100;
    completed = bonkImpactReady &&
      (setup === "pvpDemoSkyBonk" ? ember.grounded : now - tutorial.pvpDemoBonkAt >= 950) &&
      (setup !== "pvpDemoHighGround" || (p1.grounded && p1.y + p1.h >= CONFIG.groundY - 1)) &&
      (setup !== "pvpDemoBufferedSky" || ember.grounded);
  } else if (setup === "pvpDemoBonkCatch" || setup === "pvpDemoReboundCatch" || setup === "pvpDemoDinnerSteal") {
    const techniqueSeen = setup === "pvpDemoBonkCatch" ? tutorial.pvpDemoBonkCount > 0 : tutorial.pvpReboundCount > 0;
    completed = techniqueSeen && tutorial.pvpPracticeCatchCount >= 1 && now - tutorial.pvpLastPracticeEventAt >= 650;
  } else if (setup === "pvpDemoRebound") {
    completed = tutorial.pvpReboundCount >= 1 && now - tutorial.pvpLastPracticeEventAt >= 750 && pvpTutorialSettled();
  } else if (setup === "pvpDemoIntercept") {
    completed = tutorial.pvpReboundCount >= 1 && p1.grounded && ember.grounded &&
      now - tutorial.pvpLastPracticeEventAt >= 750;
  } else if (setup === "pvpDemoRecoveryBonk") {
    completed = tutorial.pvpDemoBlockedBonkAt > 0 && !p1.bonked && p1.stunTimer <= 0 && pvpTutorialSettled();
  } else if (setup === "pvpDemoBoostBonk") {
    // The higher fly must actually be eaten at normal range; bonking alone
    // cannot finish the demo and trigger a fictional long-distance catch.
    completed = tutorial.pvpDemoStage >= 1 && tutorial.pvpDemoBonkCount >= 2 &&
      tutorial.pvpPracticeCatchCount > 0 && now - tutorial.pvpDemoBonkAt >= 1000 &&
      !game.pvpCriticalCatchActive && pvpTutorialSettled();
  } else if (setup === "pvpDemoUnderBonk") {
    completed = tutorial.pvpDemoUnderBonkAt > 0 && now - tutorial.pvpDemoUnderBonkAt >= 1000 && p1.grounded;
  } else if (setup === "pvpDemoAvoidUnder") {
    completed = tutorial.pvpLowProfileJumpCount === 5 && ember.grounded && !ember.bonked && ember.stunTimer <= 0;
  }

  if (!completed && elapsed >= tutorial.pvpDemoDuration + 2.0 && tutorial.pvpDemoBonkAt <= 0) {
    // A missed demonstration retries its authored setup; it never reports a
    // success or collects a distant fly just because a timer expired.
    startPvpDemonstration();
    return;
  }

  if (completed) {
    clearPvpScriptActions();
    tutorial.pvpDemoActive = false;
    tutorial.pvpPlayerScriptLocked = false;
    tutorial.pvpCaption = "";
    passStep();
  }
}

function startPvpFinalMatch() {
  tutorial.pvpFinalMatchStarted = true;
  try { window.RibbitRaceResetFinalCatchLabels?.(); } catch (_) {}
  tutorial.pvpFinalOutcome = null;
  tutorial.pvpDemoActive = false;
  tutorial.pvpPlayerScriptLocked = false;
  tutorial.pvpCaption = "";
  clearPvpScriptActions();
  game.mode = "pvp";
  game.onlineMode = false;
  game.pvpCpuEnabled = true;
  game.pvpCpuDifficulty = 5;
  game.sandboxMode = false;
  tutorial.blockJumpUntilRelease = false;
  tutorial.pvpFrogsHidden = false;
  tutorial.pvpHiddenPlayerIndices = [];
  tutorial.dialogueHiddenDuringPoof = false;
  tutorial.resetPending = false;
  game.pvpRoundGoalMode = "endless";
  game.pvpTimeLimitSeconds = 30;
  game.pvpBestOf = 1;
  game.pvpRoundWins = [0, 0];
  game.pvpRoundNumber = 1;
  game.pvpMatchWinnerIndex = null;
  game.selectedLevelId = "park";
  game.pvpSetupLevelId = "park";
  game.pvpSetupSkinIds[1] = "ember";
  applySelectedLevel();
  resetPvpGame();
  if (!Number.isInteger(game.targetVocabIndex)) setPrompt(0);
  for (const fly of flies) {
    if (fly && fly.state === "active" && !Number.isInteger(fly.vocabIndex))
      fly.vocabIndex = game.targetVocabIndex;
  }
  pvpPlayers[0].skinId = String(tutorial.pvpPlayerSkinId || game.pvpSetupSkinIds?.[0] || game.skinId || "azure");
  pvpPlayers[1].skinId = "ember";
  pvpPlayers[0].cpu = false;
  pvpPlayers[1].cpu = true;
  pvpPlayers[0].isCpu = false;
  pvpPlayers[1].isCpu = true;
  pvpPlayers[0].firstJumpMade = false;
  pvpPlayers[1].firstJumpMade = false;
  game.pvpSetupSkinIds[0] = pvpPlayers[0].skinId;
  game.pvpSetupSkinIds[1] = "ember";
  tutorial.scoreStart = 0;
  tutorial.pvpScoreStart = 0;
  startResumeCountdown(false);
}
