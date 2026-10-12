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
  if (setup === "pvpIntercept") return 0;
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
    // Attempt one mirrors Ember's demonstration beneath the second platform.
    () => { positionPvp(p1, middleLeft.x + 18, CONFIG.groundY - p1.h, 1); positionPvp(ember, middleLeft.x + 86, CONFIG.groundY - ember.h, -1); },
    // Attempt two uses the matching opening beneath the right-middle platform.
    () => { positionPvp(p1, middleRight.x - 6, CONFIG.groundY - p1.h, 1); positionPvp(ember, middleRight.x + 60, CONFIG.groundY - ember.h, -1); },
    // Attempt three begins from the lower-left platform and remains one-jump reachable.
    () => { positionPvpOnPlatform(p1, lowerLeft, 1, 14); positionPvp(ember, lowerLeft.x + lowerLeft.w + 13, CONFIG.groundY - ember.h, -1); }
  ];
  tutorial.pvpPracticeLayoutIndex = clamp(Math.floor(index), 0, layouts.length - 1);
  layouts[tutorial.pvpPracticeLayoutIndex]();
  ember.inputHeld = false;
  ember.charging = false;
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
      // Establish the exact opening bonk lane beneath the second platform so
      // Scene 2 can begin without an unnecessary poof.
      positionPvp(p1, middleLeft.x + 18, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, middleLeft.x + 86, CONFIG.groundY - ember.h, -1);
      break;
    case "pvpDemoBonk":
      // Both frogs begin beneath the second platform. Ember starts on the
      // right and makes a real right-to-left charged jump onto the player.
      positionPvp(p1, middleLeft.x + 18, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, middleLeft.x + 86, CONFIG.groundY - ember.h, -1);
      break;
    case "pvpBonkThree":
      positionPvpBonkPracticeLayout(tutorial.pvpPracticeLayoutIndex || 0);
      break;
    case "pvpDemoBonkCatch":
      positionPvp(p1, middleLeft.x + 18, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, middleLeft.x + 86, CONFIG.groundY - ember.h, -1);
      // Center dinner above the first platform. Ember bonks right-to-left,
      // keeps facing left, lands, then needs a real charged follow-up jump.
      addPvpTutorialFly(lowerLeft.x + lowerLeft.w / 2, lowerLeft.y - 35, 0, 0);
      break;
    case "pvpBonkCatch":
      // Mirror the demonstration: the player starts on the right, bonks Ember
      // to the left, and continues toward the same elevated dinner route.
      positionPvp(p1, middleLeft.x + 86, CONFIG.groundY - p1.h, -1);
      positionPvp(ember, middleLeft.x + 18, CONFIG.groundY - ember.h, 1);
      addPvpTutorialFly(lowerLeft.x + lowerLeft.w / 2, lowerLeft.y - 35, 0, 0);
      break;
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
      // grounded player faces right beneath the same edge.
      const offset = top.w - ember.w - 4;
      const dropX = top.x + offset;
      positionPvpOnPlatform(ember, top, -1, offset);
      positionPvp(p1, dropX - 3, CONFIG.groundY - p1.h, 1);
      break;
    }
    case "pvpDropHigh": {
      // Reverse the roles while retaining the same clear drop lane.
      const offset = top.w - p1.w - 4;
      const dropX = top.x + offset;
      positionPvpOnPlatform(p1, top, -1, offset);
      positionPvp(ember, dropX - 3, CONFIG.groundY - ember.h, 1);
      break;
    }
    case "pvpDemoBufferedBonk":
      positionPvp(p1, middleRight.x + 31, CONFIG.groundY - p1.h, -1);
      positionPvp(ember, 188, CONFIG.groundY - ember.h, 1);
      break;
    case "pvpBufferedBonk":
      positionPvp(p1, 188, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, middleRight.x + 31, CONFIG.groundY - ember.h, -1);
      break;
    case "pvpDemoSkyBonk":
      positionPvpOnPlatform(ember, top, 1);
      positionPvpOnPlatform(p1, PARK_PLATFORMS[6], -1);
      break;
    case "pvpSkyBonk":
      positionPvpOnPlatform(p1, top, 1);
      positionPvpOnPlatform(ember, PARK_PLATFORMS[6], -1);
      break;
    case "pvpDemoBufferedSky":
      positionPvpOnPlatform(ember, top, 1, 4);
      positionPvp(p1, middleRight.x + Math.round((middleRight.w - p1.w) / 2), CONFIG.groundY - p1.h, -1);
      break;
    case "pvpBufferedSky":
      positionPvpOnPlatform(p1, top, 1, 4);
      positionPvp(ember, middleRight.x + Math.round((middleRight.w - ember.w) / 2), CONFIG.groundY - ember.h, -1);
      break;
    case "pvpDemoHighGround":
      positionPvpOnPlatform(p1, top, -1, Math.max(2, top.w - p1.w - 6));
      positionPvpOnPlatform(ember, middleLeft, 1, Math.max(2, middleLeft.w - ember.w - 8));
      break;
    case "pvpHighGround":
      positionPvpOnPlatform(p1, middleLeft, 1, Math.max(2, middleLeft.w - p1.w - 8));
      positionPvpOnPlatform(ember, top, -1, Math.max(2, top.w - ember.w - 6));
      break;
    case "pvpDemoRecoveryBonk":
      positionPvp(ember, 320, CONFIG.groundY - ember.h, 1);
      positionPvp(p1, 415, CONFIG.groundY - p1.h, -1);
      break;
    case "pvpRecoveryBonk":
      positionPvp(p1, 320, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 404, CONFIG.groundY - ember.h, 1);
      break;
    case "pvpDemoBoostBonk":
      positionPvp(p1, 230, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 78, CONFIG.groundY - ember.h, 1);
      break;
    case "pvpBoostBonk":
      positionPvpOnPlatform(p1, middleLeft, 1, 12);
      positionPvp(ember, middleLeft.x + 38, CONFIG.groundY - ember.h, -1);
      break;
    case "pvpDemoUnderBonk":
      positionPvpOnPlatform(ember, middleLeft, -1);
      positionPvp(p1, middleLeft.x + Math.round((middleLeft.w - p1.w) / 2), CONFIG.groundY - p1.h, 1);
      break;
    case "pvpUnderBonkTwo":
      positionPvpOnPlatform(p1, middleLeft, 1);
      positionPvp(ember, middleLeft.x + Math.round((middleLeft.w - ember.w) / 2), CONFIG.groundY - ember.h, -1);
      break;
    case "pvpDemoAvoidUnder":
      positionPvpOnPlatform(p1, middleLeft, 1);
      positionPvp(ember, middleLeft.x - 45, CONFIG.groundY - ember.h, 1);
      break;
    case "pvpAvoidUnder":
      positionPvpOnPlatform(ember, middleLeft, -1);
      positionPvp(p1, middleLeft.x - 45, CONFIG.groundY - p1.h, 1);
      break;
    case "pvpDemoRebound":
    case "pvpReboundThree":
      positionPvp(p1, 150, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 300, CONFIG.groundY - ember.h, -1);
      break;
    case "pvpDemoReboundCatch":
      positionPvpOnPlatform(p1, middleLeft, 1);
      positionPvp(ember, 330, CONFIG.groundY - ember.h, -1);
      addPvpTutorialFly(402, 145, 0, 0);
      break;
    case "pvpReboundCatch":
      positionPvpOnPlatform(ember, middleRight, -1);
      positionPvp(p1, 390, CONFIG.groundY - p1.h, -1);
      addPvpTutorialFly(440, 145, 0, 0);
      break;
    case "pvpDemoIntercept":
      positionPvp(p1, 118, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
      addPvpTutorialFly(390, 130, 0, 0);
      break;
    case "pvpIntercept":
      positionPvp(p1, 275, CONFIG.groundY - p1.h, -1);
      positionPvp(ember, 135, CONFIG.groundY - ember.h, 1);
      addPvpTutorialFly(390, 130, 0, 0);
      break;
    case "pvpDemoDinnerSteal":
      positionPvp(p1, 118, CONFIG.groundY - p1.h, 1);
      positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
      addPvpTutorialFly(390, 130, 0, 0);
      break;
    case "pvpDinnerSteal":
      positionPvp(p1, 315, CONFIG.groundY - p1.h, -1);
      positionPvp(ember, 210, CONFIG.groundY - ember.h, 1);
      addPvpTutorialFly(410, 130, 0, 0);
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
  if (Number(facing) === 1 || Number(facing) === -1) {
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
  const bottom = player.y + player.h;
  const horizontallyOver = player.x + player.w * .78 > platform.x && player.x + player.w * .22 < platform.x + platform.w;
  if (!horizontallyOver || bottom < platform.y - 24 || bottom > platform.y + 4) return;
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
  tutorial.pvpDemoBonkHandled = false;
  tutorial.pvpDemoFollowupStarted = false;
  tutorial.pvpCaption = "WATCH EMBER!";
  tutorial.pvpCaptionUntil = performance.now() + 2400;

  switch (setup) {
    case "pvpDemoBonk":
      scriptPvpChargedJump(1, .44, -1, 0);
      break;
    case "pvpDemoBonkCatch":
      scriptPvpChargedJump(1, .44, -1, 0);
      break;
    case "pvpDemoDropLow":
    case "pvpDemoDropHigh":
      scriptPvpQuickDrop(1, 0);
      break;
    case "pvpDemoBufferedBonk":
      armPvpScriptedBuffer(1, middleRight);
      scriptPvpChargedJump(1, .86, 1, 0);
      break;
    case "pvpDemoSkyBonk":
      // Start from the top platform and perform the same strong charged leap a
      // human player would use to reach the lower-right landing zone.
      scriptPvpChargedJump(1, .92, 1, 0);
      break;
    case "pvpDemoBufferedSky":
      armPvpScriptedBuffer(1, middleRight);
      scriptPvpChargedJump(1, .98, 1, 0);
      break;
    case "pvpDemoHighGround":
      scriptPvpChargedJump(1, .88, 1, 0);
      break;
    case "pvpDemoRecoveryBonk":
      scriptPvpChargedJump(1, .74, 1, 0);
      break;
    case "pvpDemoBoostBonk":
      // First comparison: the lower frog makes a small hop while Ember uses a
      // normal charged jump. The second comparison is staged after they land.
      scriptPvpChargedJump(0, .24, 1, 0);
      scriptPvpChargedJump(1, .74, 1, 120);
      break;
    case "pvpDemoUnderBonk":
      scriptPvpChargedJump(0, .78, 1, 0);
      break;
    case "pvpDemoAvoidUnder":
      scriptPvpChargedJump(1, .10, 1, 0);
      break;
    case "pvpDemoRebound":
      scriptPvpChargedJump(0, .58, 1, 0);
      scriptPvpChargedJump(1, .58, -1, 0);
      break;
    case "pvpDemoReboundCatch":
      scriptPvpChargedJump(1, .64, -1, 0);
      break;
    case "pvpDemoIntercept":
    case "pvpDemoDinnerSteal":
      scriptPvpChargedJump(0, .62, 1, 0);
      scriptPvpChargedJump(1, .62, -1, 100);
      break;
    default:
      break;
  }
}

function startPvpDemonstration(options = {}) {
  const setup = tutorialStep()?.setup || "";
  const skipPoof = Boolean(options.skipPoof);
  const intendedPvpPoses = tutorial.pendingPvpTargetPoses;
  const prepare = () => {
    tutorial.pvpDemoActive = true;
    tutorial.pvpDemoKind = setup;
    tutorial.pvpDemoBegun = false;
    tutorial.pvpPlayerScriptLocked = true;
    tutorial.pvpDemoDuration = /Boost|Recovery|BufferedSky/.test(setup) ? 8.0 : /BonkCatch|ReboundCatch|DinnerSteal/.test(setup) ? 6.5 : 5.0;
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

function updatePvpDemonstration() {
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

  // After the opening bonk, Ember lands and makes one ordinary follow-up jump
  // toward the fly. This visibly demonstrates the two-jump bonk-and-catch path.
  if (setup === "pvpDemoBonkCatch" && tutorial.pvpDemoBonkAt > 0 && !tutorial.pvpDemoFollowupStarted &&
      ember.grounded && now - tutorial.pvpDemoBonkAt >= 280) {
    tutorial.pvpDemoFollowupStarted = true;
    const targetFly = flies.find((fly) => fly?.tutorialAuthored && fly.state === "active");
    const followDirection = targetFly && targetFly.x < ember.x ? -1 : 1;
    // Keep the direction established by the bonk; do not perform a visible
    // turn-around before the follow-up dinner jump.
    ember.dir = followDirection;
    ember.chargeFacingDir = followDirection;
    scriptPvpChargedJump(1, .72, followDirection, 0);
  }

  // The recovery lesson intentionally makes one early return while the player
  // is still stunned, then a real second charged jump once recovery finishes.
  if (setup === "pvpDemoRecoveryBonk" && tutorial.pvpDemoBonkAt > 0) {
    if (tutorial.pvpDemoStage === 0 && now - tutorial.pvpDemoBonkAt >= 420) {
      tutorial.pvpDemoStage = 1;
      if (ember.grounded) scriptPvpChargedJump(1, .62, 1, 0);
    } else if (tutorial.pvpDemoStage === 1 && p1.stunTimer <= 0 && !p1.bonked && ember.grounded) {
      tutorial.pvpDemoStage = 2;
      scriptPvpChargedJump(1, .72, 1, 0);
    }
  }

  // Show the bounce-boost comparison as two real jumps from the same launch
  // points. The second lower-frog jump uses near-maximum charge.
  if (setup === "pvpDemoBoostBonk" && tutorial.pvpDemoStage === 0 && elapsed >= 3.0) {
    tutorial.pvpDemoStage = 1;
    addTutorialPoof(p1.x + p1.w / 2, p1.y + p1.h / 2, "out");
    addTutorialPoof(ember.x + ember.w / 2, ember.y + ember.h / 2, "out");
    playTutorialPoofSound("out");
    positionPvp(p1, 230, CONFIG.groundY - p1.h, 1);
    positionPvp(ember, 78, CONFIG.groundY - ember.h, 1);
    addTutorialPoof(p1.x + p1.w / 2, p1.y + p1.h / 2, "in");
    addTutorialPoof(ember.x + ember.w / 2, ember.y + ember.h / 2, "in");
    playTutorialPoofSound("in");
    scriptPvpChargedJump(0, .96, 1, 520);
    scriptPvpChargedJump(1, .74, 1, 650);
  }

  // Natural catch is preferred; these fallbacks fire only after the visible
  // follow-up movement has played so a slight physics miss cannot stall class.
  if ((setup === "pvpDemoBonkCatch" || setup === "pvpDemoReboundCatch" || setup === "pvpDemoDinnerSteal") &&
      elapsed > 4.6 && tutorial.pvpPracticeCatchCount === 0) {
    const target = flies.find(fly => fly?.tutorialAuthored && fly.state === "active" && fly.tutorialArmed !== false);
    if (target) attemptPvpFlyCatch(ember, target, "body");
  }

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
    completed = tutorial.pvpDemoBonkAt > 0 && now - tutorial.pvpDemoBonkAt >= 1000;
  } else if (setup === "pvpDemoBonkCatch" || setup === "pvpDemoReboundCatch" || setup === "pvpDemoDinnerSteal") {
    completed = tutorial.pvpPracticeCatchCount >= 1 && now - tutorial.pvpLastPracticeEventAt >= 650;
  } else if (setup === "pvpDemoRebound") {
    completed = tutorial.pvpReboundCount >= 1 && now - tutorial.pvpLastPracticeEventAt >= 750 && pvpTutorialSettled();
  } else if (setup === "pvpDemoIntercept") {
    completed = tutorial.pvpReboundCount >= 1 && now - tutorial.pvpLastPracticeEventAt >= 750;
  } else if (setup === "pvpDemoRecoveryBonk") {
    completed = tutorial.pvpDemoStage >= 2 && tutorial.pvpDemoBonkAt > 0 && now - tutorial.pvpDemoBonkAt >= 1000;
  } else if (setup === "pvpDemoBoostBonk") {
    completed = tutorial.pvpDemoStage >= 1 && elapsed >= 6.2;
  } else if (setup === "pvpDemoUnderBonk") {
    completed = p1.bonked || p1.stunTimer > 0 || elapsed >= 3.3;
  } else if (setup === "pvpDemoAvoidUnder") {
    completed = ember.x > PARK_PLATFORMS[2].x + PARK_PLATFORMS[2].w + 12 || elapsed >= 3.0;
  }

  if (completed || elapsed >= tutorial.pvpDemoDuration + 2.0) {
    clearPvpScriptActions();
    tutorial.pvpDemoActive = false;
    tutorial.pvpPlayerScriptLocked = false;
    tutorial.pvpCaption = "";
    passStep();
  }
}

function startPvpFinalMatch() {
  tutorial.pvpFinalMatchStarted = true;
  tutorial.pvpFinalOutcome = null;
  tutorial.pvpCaption = "";
  game.mode = "pvp";
  game.onlineMode = false;
  game.pvpCpuEnabled = true;
  game.pvpCpuDifficulty = 5;
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
  pvpPlayers[0].skinId = String(tutorial.pvpPlayerSkinId || game.pvpSetupSkinIds?.[0] || game.skinId || "azure");
  pvpPlayers[1].skinId = "ember";
  game.pvpSetupSkinIds[0] = pvpPlayers[0].skinId;
  game.pvpSetupSkinIds[1] = "ember";
  tutorial.scoreStart = 0;
  tutorial.pvpScoreStart = 0;
  startResumeCountdown(false);
}
