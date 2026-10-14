// Ribbit Race tutorial responsibility: 126 tutorial hooks
// Capture real PvP tutorial interactions before the ordinary achievement
// layer clears one-frame technique flags.
const originalBonkPvpPlayerForTutorial = bonkPvpPlayer;
bonkPvpPlayer = function(victim, stomper, ...rest) {
  const active = tutorial.active && tutorial.kind === "pvp";
  const buffered = Boolean(stomper?.bufferedDropBonkArmed);
  const quickDrop = Boolean(stomper?.quickDropThisJump);
  const sky = Boolean(stomper?.wentAboveMapThisJump || Number(stomper?.highestY) < 5);
  const boosted = Boolean(victim && Number(victim.vy) < -80);
  const startedOnPlatform = Boolean(victim && getPvpStandingPlatform(victim) && !getPvpStandingPlatform(victim)?.ground);
  const setupBeforeBonk = tutorial.active && tutorial.kind === "pvp" ? tutorialStep()?.setup : "";
  const recoveryGap = Number(game.pvpElapsed) - Number(victim?.lastStunEndAt);
  const countsAsRecoveryBonk = setupBeforeBonk === "pvpRecoveryBonk" && stomper?.index === 0 && victim?.index === 1 &&
    tutorial.pvpBonks === 1 && Number.isFinite(recoveryGap) && recoveryGap >= 0 && recoveryGap <= 1;
  const result = originalBonkPvpPlayerForTutorial.call(this, victim, stomper, ...rest);
  if (active && sky && ["pvpDemoSkyBonk", "pvpSkyBonk", "pvpDemoBufferedSky", "pvpBufferedSky"].includes(setupBeforeBonk)) {
    // Tutorial sky-bonk demonstrations use the full five-second stun. The
    // countdown begins on LANDING and must finish before the recovery turn.
    victim.bonkStunDuration = CONFIG.pvpBonkMaxStunSeconds;
    if (victim.stunCountdownStarted) victim.stunTimer = CONFIG.pvpBonkMaxStunSeconds;
  }
  if (active && tutorialStep()?.demonstration && stomper?.index === 1 && victim?.index === 0) {
    tutorial.pvpDemoBonkAt = performance.now();
    tutorial.pvpDemoBonkCount += 1;
    tutorial.pvpLastPracticeEventAt = tutorial.pvpDemoBonkAt;
    // The first demonstration bonk keeps its ordinary height-derived Versus
    // stun duration.  Never extend stun artificially for tutorial dialogue.
  }
  if (active && stomper?.index === 0 && victim?.index === 1) {
    tutorial.pvpBonks += 1;
    if (setupBeforeBonk === "pvpRecoveryBonk" && tutorial.pvpBonks >= 2) {
      tutorial.pvpRecoverySecondBonkOnTime = countsAsRecoveryBonk;
    }
    tutorial.pvpLastPracticeEventAt = performance.now();
    tutorial.pvpLastBonkQuickDrop = quickDrop;
    tutorial.pvpBufferedBonkSeen = tutorial.pvpBufferedBonkSeen || buffered;
    tutorial.pvpSkyBonkSeen = tutorial.pvpSkyBonkSeen || sky;
    tutorial.pvpMaximumBonkSeen = tutorial.pvpMaximumBonkSeen || isMaximumPvpBonkDuration(victim.bonkStunDuration);
    tutorial.pvpBoostedBonkSeen = tutorial.pvpBoostedBonkSeen || boosted;
    tutorial.pvpHighGroundBonkSeen = tutorial.pvpHighGroundBonkSeen || startedOnPlatform;
    if (tutorialStep()?.setup === "pvpBonkThree") {
      stomper.catchSparkleTimer = Math.max(Number(stomper.catchSparkleTimer) || 0, CONFIG.catchSparkleDuration);
      try { playCorrectFlySound(); } catch (_) { tone(720, .055, .014, 90); }
    }
    if (tutorialStep()?.setup === "pvpBonkCatch") tutorial.pvpBonkCatchArmed = true;
  }
  return result;
};

const originalFootstoolDisabledForTutorial = footstoolDisabledPvpPlayer;
footstoolDisabledPvpPlayer = function(active, disabled, ...rest) {
  const result = originalFootstoolDisabledForTutorial.call(this,active,disabled,...rest);
  if (tutorial.active && tutorial.kind === "pvp" && tutorialStep()?.demonstration && active?.index === 1) {
    tutorial.pvpDemoBlockedBonkAt = performance.now();
  }
  return result;
};

const originalBonkPvpPlayerFromBelowForTutorial = bonkPvpPlayerFromBelow;
bonkPvpPlayerFromBelow = function(stationary, hitter, ...rest) {
  const active = tutorial.active && tutorial.kind === "pvp";
  const result = originalBonkPvpPlayerFromBelowForTutorial.call(this, stationary, hitter, ...rest);
  if (active && tutorialStep()?.demonstration && stationary?.index === 1 && hitter?.index === 0) tutorial.pvpDemoUnderBonkAt = performance.now();
  if (active && stationary?.index === 0 && hitter?.index === 1) {
    tutorial.pvpUnderBonks += 1;
    tutorial.pvpLastPracticeEventAt = performance.now();
  }
  return result;
};

const originalBouncePvpPlayersSidewaysForTutorial = bouncePvpPlayersSideways;
bouncePvpPlayersSideways = function(a, b, ...rest) {
  const active = tutorial.active && tutorial.kind === "pvp";
  const result = originalBouncePvpPlayersSidewaysForTutorial.call(this, a, b, ...rest);
  if (active && (a?.lastOpponentBounceType === "rebound" || b?.lastOpponentBounceType === "rebound") &&
      performance.now() - tutorial.pvpLastPracticeEventAt > 120) {
    tutorial.pvpReboundCount += 1;
    tutorial.pvpReboundAt = performance.now();
    if (!a.grounded && !b.grounded && ["pvpDemoRebound", "pvpReboundThree", "pvpDemoReboundCatch", "pvpReboundCatch", "pvpDemoDinnerSteal", "pvpDinnerSteal"].includes(tutorialStep()?.setup)) {
      // Use the game's existing fly-catch sparkle effect on BOTH frogs.
      a.catchSparkleTimer = Math.max(Number(a.catchSparkleTimer)||0, CONFIG.catchSparkleDuration);
      b.catchSparkleTimer = Math.max(Number(b.catchSparkleTimer)||0, CONFIG.catchSparkleDuration);
      // Match the normal correct-fly-catch feedback; both frogs participated.
      if (tutorialStep()?.setup === "pvpReboundThree") {
        try { playCorrectFlySound(); } catch (_) { tone(720, .055, .014, 90); }
      }
    }
    tutorial.pvpRebounds = tutorial.pvpReboundCount;
    tutorial.pvpLastPracticeEventAt = performance.now();
    if (tutorialStep()?.setup === "pvpIntercept") tutorial.pvpInterceptSeen = true;
  }
  return result;
};

const originalAttemptPvpFlyCatchForTutorial = attemptPvpFlyCatch;
attemptPvpFlyCatch = function(player, targetFly, source = "body", ...rest) {
  const scoreBefore = Number(player?.score || 0);
  const result = originalAttemptPvpFlyCatchForTutorial.call(this, player, targetFly, source, ...rest);
  const setup = tutorial.active && tutorial.kind === "pvp" ? tutorialStep()?.setup : "";
  const scored = Boolean(result && player && Number(player.score || 0) > scoreBefore);
  if (setup && setup !== "pvpFinalMatch" && scored) {
    // Verify an actual rebound AND catch in the SAME airborne jump. This
    // native physics flag clears on landing and on every new jump.
    const reboundCatchSetups = ["pvpDemoReboundCatch", "pvpReboundCatch", "pvpDemoDinnerSteal", "pvpDinnerSteal"];
    const catchingIndex = setup.startsWith("pvpDemo") ? 1 : 0;
    const qualified = reboundCatchSetups.includes(setup) && player.index === catchingIndex &&
      !player.grounded && Boolean(player.bouncedOffOpponentThisJump) &&
      player.lastOpponentBounceType === "rebound" && tutorial.pvpReboundAt > 0;
    if (setup === "pvpDemoBoostBonk" && player.index === 1 && tutorial.pvpDemoBonkCount >= 1 &&
        !game.pvpCriticalCatchActive) startPvpCriticalCatch(player, targetFly, "technique");
    if (setup === "pvpBoostBonk" && player.index === 0 && tutorial.pvpBoostedBonkSeen &&
        !game.pvpCriticalCatchActive) startPvpCriticalCatch(player, targetFly, "technique");
    if (qualified) {
      tutorial.pvpTechniqueCatchQualified = true;
      tutorial.pvpTechniqueCatchPlayerIndex = player.index;
      tutorial.pvpTechniqueCatchAt = performance.now();
      // Use the existing in-engine slow-motion and zoom cinematic on a real
      // catch, not when merely approaching or tonguing an uncaught fly.
      if (!game.pvpCriticalCatchActive) startPvpCriticalCatch(player, targetFly, "technique");
    }
    tutorial.pvpPracticeCatchCount += 1;
    tutorial.pvpLastPracticeEventAt = performance.now();
    if (setup === "pvpDemoBoostBonk" && player.index === 1) {
      // A successful boost catch ends the demonstration's scripted motion.
      // Do not let a queued second jump start while Ember is eating.
      clearPvpScriptActions();
      tutorial.pvpDemoFollowupStarted = true;
    }
    tutorial.promptHidden = !(typeof flies !== "undefined" && Array.isArray(flies) && flies.some((fly) => fly?.tutorialAuthored && fly.state === "active" && fly.tutorialArmed && Number.isInteger(fly.vocabIndex)));
    // Lesson catches prove the technique but never alter the visible PvP score.
    player.score = scoreBefore;
    game.spawnQueue.length = 0;
    if (player.index === 0 && setup === "pvpBonkCatch" && tutorial.pvpBonkCatchArmed && pvpPlayers[1].stunTimer > 0) {
      tutorial.pvpBonkCatchSucceeded = true;
    }
  }
  return result;
};

// Training is a reversible playtest session. Suppress every ordinary solo/PvP
// achievement while it is active; only the dedicated completion achievement
// may pass through when the tutorial itself awards it.
window.RibbitTutorialShouldHidePvpCatchTitle = () => Boolean(
  tutorial.active && tutorial.kind === "pvp"
);

const originalMarkAchievementEarnedForTutorial = markAchievementEarned;
markAchievementEarned = function(id, ...rest) {
  const trainingSession = Boolean(tutorial.active || tutorial.completeScreen || game.tutorialActive);
  if (trainingSession && ![TUTORIAL_ACHIEVEMENT_ID, PVP_TUTORIAL_ACHIEVEMENT_ID].includes(id)) return false;
  return originalMarkAchievementEarnedForTutorial.call(this, id, ...rest);
};

const originalMarkPvpAchievementEarnedForTutorial = markPvpAchievementEarned;
markPvpAchievementEarned = function(...args) {
  if (tutorial.active || tutorial.completeScreen || game.tutorialActive) return false;
  return originalMarkPvpAchievementEarnedForTutorial.apply(this, args);
};

function tutorialTrainingSessionActive() {
  return Boolean(tutorial.active || tutorial.completeScreen || game.tutorialActive);
}

// Training is a reversible sandbox. None of its catches, jumps, hat counters,
// or normal statistics may leak into the player's permanent profile.
const originalRecordFlyEatenForTutorial = recordFlyEaten;
recordFlyEaten = function(...args) {
  if (tutorialTrainingSessionActive()) return;
  return originalRecordFlyEatenForTutorial.apply(this, args);
};
const originalRecordCorrectCatchForAchievementsForTutorial = recordCorrectCatchForAchievements;
recordCorrectCatchForAchievements = function(...args) {
  if (tutorialTrainingSessionActive()) return;
  return originalRecordCorrectCatchForAchievementsForTutorial.apply(this, args);
};
const originalSaveTotalFlyCountForTutorial = saveTotalFlyCount;
saveTotalFlyCount = function(...args) {
  if (tutorialTrainingSessionActive()) return;
  return originalSaveTotalFlyCountForTutorial.apply(this, args);
};
const originalSaveTotalJumpCountForTutorial = saveTotalJumpCount;
saveTotalJumpCount = function(...args) {
  if (tutorialTrainingSessionActive()) return;
  return originalSaveTotalJumpCountForTutorial.apply(this, args);
};
const originalSaveStatsProfileForTutorial = saveStatsProfile;
saveStatsProfile = function(...args) {
  if (tutorialTrainingSessionActive()) return;
  return originalSaveStatsProfileForTutorial.apply(this, args);
};

const originalDrawFlyNameTagForTutorial = drawFlyNameTag;
drawFlyNameTag = function(currentFly, ...rest) {
  if (currentFly?.tutorialAuthored && currentFly.tutorialArmed === false) return;
  return originalDrawFlyNameTagForTutorial.call(this, currentFly, ...rest);
};
const originalDrawFlySpawnSparksForTutorial = drawFlySpawnSparks;
drawFlySpawnSparks = function(currentFly, ...rest) {
  if (currentFly?.tutorialAuthored && currentFly.tutorialArmed === false) return;
  return originalDrawFlySpawnSparksForTutorial.call(this, currentFly, ...rest);
};
const originalGetFlySpawnScaleForTutorial = getFlySpawnScale;
getFlySpawnScale = function(currentFly, ...rest) {
  if (currentFly?.tutorialAuthored && currentFly.tutorialArmed === false) return 0;
  return originalGetFlySpawnScaleForTutorial.call(this, currentFly, ...rest);
};

const originalCompleteWinForTutorial = completeWin;
completeWin = function(...args) {
  const finalSoloTutorial = tutorial.active && tutorial.kind === "solo" && tutorialStep()?.setup === "normalRound";
  if (finalSoloTutorial) {
    beginFinalTutorialMessage();
    return;
  }
  return originalCompleteWinForTutorial.apply(this, args);
};

// The tongue lesson opts into the exact stock final-catch cinematic. By
// extending the engine's own eligibility check, beginTongueCatch triggers the
// normal slow-motion physics, camera zoom, impact overlay, and sound timing.
const originalShouldStartSoloCriticalCatchForTutorial = shouldStartSoloCriticalCatch;
shouldStartSoloCriticalCatch = function(targetFly, ...rest) {
  const activeSetup = tutorial.active && tutorial.kind === "solo" ? tutorialStep()?.setup : "";
  const baseConditions = targetFly && targetFly.vocabIndex === game.targetVocabIndex &&
    game.mode === "solo" && game.state === "playing" &&
    !game.sandboxMode && !game.soloCriticalCatchActive && !game.winPending;
  const isRangeMatch = activeSetup === "rangeCatch" && baseConditions;
  if (isRangeMatch) return true;
  const isReboundFinish = activeSetup === "reboundCatch" && baseConditions && tutorial.wallTouchedThisJump;
  if (isReboundFinish) return true;
  const isComboThreeFinish = activeSetup === "comboThree" && baseConditions && tutorial.catchEvents.filter(Boolean).length >= 2;
  if (isComboThreeFinish) return true;
  const isDoubleBufferFinish = activeSetup === "doubleBuffer" && baseConditions && tutorial.catchEvents.filter(Boolean).length >= 2;
  if (isDoubleBufferFinish) return true;
  return originalShouldStartSoloCriticalCatchForTutorial.call(this, targetFly, ...rest);
};

// Record how tutorial flies were caught so authored lessons can verify the intended technique.
const originalAttemptFlyCatch = attemptFlyCatch;
attemptFlyCatch = function(targetFly, source = "body", ...rest) {
  const activeSetup = tutorial.active && tutorial.kind === "solo" ? tutorialStep()?.setup : "";
  const wasCorrect = Boolean(targetFly && targetFly.vocabIndex === game.targetVocabIndex);
  if (activeSetup === "rangeCatch" && wasCorrect && source !== "tongue") return false;
  if (activeSetup === "reboundCatch" && targetFly?.tutorialRequiresRebound && !tutorial.wallTouchedThisJump) return false;

  const result = originalAttemptFlyCatch.call(this, targetFly, source, ...rest);
  if (!result || !activeSetup) return result;

  if (!wasCorrect && ["wrongFly", "comboMixed"].includes(activeSetup) && targetFly) {
    targetFly.tutorialHoldAfterSpit = true;
  }

  if (activeSetup === "comboMixed" && wasCorrect) {
    const remainingFly = flies.find((currentFly) =>
      currentFly?.tutorialAuthored && currentFly.state === "active"
    );
    if (remainingFly && VOCABULARY.length > 1) {
      let wrongPromptIndex = (Number(remainingFly.vocabIndex) + 1) % VOCABULARY.length;
      if (wrongPromptIndex === remainingFly.vocabIndex) wrongPromptIndex = (wrongPromptIndex + 1) % VOCABULARY.length;
      setPrompt(wrongPromptIndex);
    }
  }

  if (activeSetup === "rangeCatch" && wasCorrect && source === "tongue") {
    tutorial.rangeTongueCaught = true;
    tutorial.rangeTongueCaughtAt = performance.now();
    game.spawnQueue.length = 0;
    tutorial.promptHidden = false;
  }

  if (activeSetup === "wrongFly") {
    const caughtFlyId = Number(targetFly?.id);
    if (!wasCorrect && caughtFlyId === Number(tutorial.wrongFlyOriginalFlyId)) {
      tutorial.wrongFlyCaught = true;
      tutorial.wrongFlyCaughtAt = performance.now();
      tutorial.promptHidden = false;
    } else if (wasCorrect && caughtFlyId === Number(tutorial.wrongFlyRightFlyId)) {
      tutorial.wrongFlyRightCaught = true;
      tutorial.wrongFlyResolvedAt = performance.now();
      game.spawnQueue.length = 0;
      setPrompt(tutorial.wrongFlyOriginalVocabIndex);
      tutorial.promptHidden = true;
    } else if (
      wasCorrect &&
      caughtFlyId === Number(tutorial.wrongFlyOriginalFlyId) &&
      tutorial.wrongFlyRightCaught
    ) {
      tutorial.wrongFlyReturnedCaught = true;
      tutorial.wrongFlyResolvedAt = performance.now();
      tutorial.promptHidden = true;
      game.spawnQueue.length = 0;
    }
  }

  if (activeSetup === "threeCatches" && wasCorrect) {
    if (!tutorial.sceneAttemptCaught) {
      tutorial.sceneCatchCount = Math.min(3, tutorial.sceneCatchCount + 1);
    }
    tutorial.sceneAttemptCaught = true;
    tutorial.promptHidden = true;
  }

  if (["comboMixed", "comboTwo", "comboThree", "doubleBuffer"].includes(activeSetup)) {
    tutorial.catchEvents.push(wasCorrect);
  }

  return result;
};

// Once an authored wrong fly finishes its spit-back animation, keep it at
// its authored point. This makes it clear that it was rejected rather than
// collected, and it remains visible until the next setup poof.
const originalAnimateFliesForTutorialHold = animateFlies;
animateFlies = function(dt, ...rest) {
  const result = originalAnimateFliesForTutorialHold.call(this, dt, ...rest);
  if (tutorial.active && tutorial.kind === "solo") {
    for (const currentFly of flies) {
      if (!currentFly?.tutorialHoldAfterSpit || currentFly.state !== "active") continue;
      // Keep rejected tutorial flies alive, but preserve their ordinary hover
      // animation so they never look frozen or already collected.
      currentFly.tutorialArmed = true;
    }
  }
  return result;
};

// Capture real-engine jump outcomes for scenario checks.
tutorial.originalLaunchJump = launchJump;
launchJump = function(...args) {
  const active = tutorial.active && tutorial.kind === "solo";
  const power = Number(frog.charge || 0);
  const standing = active ? getStandingPlatform() : null;
  const quick = Boolean(active && standing && !standing.ground && frog.chargeHoldTime < CONFIG.platformDropHoldThreshold);
  const jumpsBefore = Number(game.jumps || 0);
  const result = tutorial.originalLaunchJump.apply(this, args);
  const actualLaunch = Number(game.jumps || 0) > jumpsBefore;
  if (active && actualLaunch) {
    const setup = tutorialStep()?.setup;
    tutorial.quickDrop = tutorial.quickDrop || quick;
    tutorial.lastJumpPower = power;
    tutorial.wallTouchedThisJump = false;
    tutorial.attemptStarted = true;
    tutorial.jumpAttempts += 1;
    tutorial.attemptWasAirborne = true;
    tutorial.attemptEnded = false;

    // A normal platform drop is a real jump attempt. A true buffered drop is
    // performed by the landing buffer and never calls launchJump, so it remains
    // excluded naturally. Airborne fidget taps also never reach this branch.
    if (quick) {
      if (setup === "longJumps") {
        failAttempt("PLATFORM DROPS DO NOT COUNT AS LONG JUMPS");
      } else if (setup === "doubleBuffer") {
        failAttempt("START WITH A CHARGED JUMP");
      }
      return result;
    }

    if (setup === "bufferJumpCharge" && tutorial.bufferedJumpChainCount >= 1) {
      tutorial.bufferedJumpReleased = true;
    }
    if (setup === "quickDrop") tutorial.quickDropWrongJump = true;
  }
  return result;
};

// Hide the normal first-jump keyboard bubble; Ember teaches the tutorial.
const originalDrawSpeechBubble = drawSpeechBubble;
drawSpeechBubble = function(...args) {
  if (tutorial.active) return;
  return originalDrawSpeechBubble.apply(this, args);
};

// Both tutorials share the exact same pause chrome as regular Versus.
// Defer the stock Solo panel so the tutorial dialogue and goal render behind
// a single final pause panel. Drawing a second panel caused ghosted headings.
const originalDrawSoloPauseOverlayForTutorial = drawSoloPauseOverlay;
drawSoloPauseOverlay = function(...args) {
  if (tutorial.active) return;
  return originalDrawSoloPauseOverlayForTutorial.apply(this, args);
};

const originalResumePausedGameForTutorial = resumePausedGame;
resumePausedGame = function(...args) {
  if (tutorial.active && game.state === "paused") {
    game.state = "playing";
    game.countdownNumber = 0;
    game.countdownTimer = 0;
    game.resumeChargeAfterCountdown = false;
    game.pauseHelpOpen = false;
    restorePauseChargeSnapshot();
    if (Number.isInteger(tutorial.pauseChapterPreviewIndex)) applyTutorialChapterPreview();
    return;
  }
  return originalResumePausedGameForTutorial.apply(this, args);
};

const originalActivatePauseSelectionForTutorial = activatePauseSelection;
activatePauseSelection = function(...args) {
  if (!tutorial.active || game.state !== "paused") {
    return originalActivatePauseSelectionForTutorial.apply(this, args);
  }
  if (game.pauseSelection === "home") {
    tutorial.pauseChapterPreviewIndex = null;
    tutorial.chapterNavigationPending = false;
    finish(false);
    return;
  }
  if (game.pauseSelection === "restart") {
    // The paused clock must not extend deadlines created by this restart.
    // Cancel mid-poof callbacks and reconstruct just once, synchronously.
    tutorialClockSuspendedAt = null;
    restartTutorialSceneImmediately();
    return;
  }
  return originalActivatePauseSelectionForTutorial.apply(this, args);
};

function tutorialBlocksLiveInput() {
  return Boolean(
    tutorial.active && game.state === "playing" &&
    (tutorialMovementLocked() || tutorial.pvpDemoActive || tutorial.pvpPlayerScriptLocked ||
      tutorial.pvpFrogsHidden || tutorial.passPending || tutorial.blockJumpUntilRelease)
  );
}

const originalPressMainButtonForTutorial = pressMainButton;
pressMainButton = function(...args) {
  if (tutorialBlocksLiveInput()) {
    game.buttonHeld = false;
    frog.charging = false;
    frog.chargeHoldTime = 0;
    return;
  }
  return originalPressMainButtonForTutorial.apply(this, args);
};

const originalReleaseMainButtonForTutorial = releaseMainButton;
releaseMainButton = function(...args) {
  if (tutorialBlocksLiveInput()) {
    game.buttonHeld = false;
    frog.charging = false;
    frog.chargeHoldTime = 0;
    return;
  }
  return originalReleaseMainButtonForTutorial.apply(this, args);
};

const originalEnsureTargetVocabularyForTutorial = ensureTargetVocabularyAvailable;
ensureTargetVocabularyAvailable = function(...args) {
  if (tutorial.active && tutorial.kind === "pvp" && tutorialStep()?.setup !== "pvpFinalMatch") return;
  return originalEnsureTargetVocabularyForTutorial.apply(this,args);
};

const originalUpdatePvpCpuInputForTutorial = updatePvpCpuInput;
updatePvpCpuInput = function(dt, ...rest) {
  const setup = tutorial.active && tutorial.kind === "pvp" ? tutorialStep()?.setup : "";
  if (tutorial.active && tutorial.kind === "pvp" && setup !== "pvpFinalMatch") return;
  return originalUpdatePvpCpuInputForTutorial.call(this, dt, ...rest);
};

const originalDrawPvpSpeechBubbleForTutorial = drawPvpSpeechBubble;
drawPvpSpeechBubble = function(player, ...rest) {
  if (tutorial.active && tutorial.kind === "pvp") return;
  return originalDrawPvpSpeechBubbleForTutorial.call(this, player, ...rest);
};

const originalGetPvpSkinPaletteForTutorial = getPvpSkinPalette;
getPvpSkinPalette = function(skinId, fallbackId = "azure", playerIndexHint = null, ...rest) {
  const palette = originalGetPvpSkinPaletteForTutorial.call(this, skinId, fallbackId, playerIndexHint, ...rest);
  if (tutorial.active && tutorial.kind === "pvp" && (playerIndexHint === 1 || String(skinId) === "ember")) {
    return { ...palette, hat:"crown" };
  }
  return palette;
};

const originalPressPvpButtonForTutorial = pressPvpButton;
pressPvpButton = function(index, source = "human", ...rest) {
  // The final Level 5 CPU is a genuine simulation-controlled frog, not a human
  // input. Tutorial dialogue/Space-release locks must never suppress its
  // charge and release actions.
  const finalCpu = tutorial.active && tutorial.kind === "pvp" &&
    tutorialStep()?.setup === "pvpFinalMatch" && index === getPvpCpuIndex() && source === "cpu";
  if (!finalCpu && tutorialBlocksLiveInput()) return;
  return originalPressPvpButtonForTutorial.call(this, index, source, ...rest);
};

const originalReleasePvpButtonForTutorial = releasePvpButton;
releasePvpButton = function(index, source = "human", ...rest) {
  const finalCpu = tutorial.active && tutorial.kind === "pvp" &&
    tutorialStep()?.setup === "pvpFinalMatch" && index === getPvpCpuIndex() && source === "cpu";
  if (!finalCpu && tutorialBlocksLiveInput()) return;
  const lesson = tutorial.active && tutorial.kind === "pvp" && index === 0 && source === "human"
    ? tutorialStep()?.setup : "";
  const quickTapAllowed = new Set([
    "pvpDropLow", "pvpDropHigh", "pvpAvoidUnder", "pvpReboundThree",
    // These lessons intentionally require multiple airborne jumps/attempts.
    "pvpRecoveryBonk", "pvpBoostBonk", "pvpUnderBonkTwo", "pvpFinalMatch"
  ]);
  const actor = pvpPlayers[index];
  const accidentalShortJump = Boolean(lesson && !quickTapAllowed.has(lesson) &&
    actor?.grounded && actor.charging && actor.chargeHoldTime < 0.16 &&
    (!getPvpStandingPlatform(actor) || getPvpStandingPlatform(actor)?.ground));
  const result = originalReleasePvpButtonForTutorial.call(this, index, source, ...rest);
  if (accidentalShortJump && actor && !actor.grounded &&
      !tutorial.resetPending && !tutorial.passed) {
    failAttempt("HOLD JUMP TO CHARGE — A QUICK TAP IS NOT A BONK");
  }
  return result;
};

const originalDrawArcPreviewForTutorial = drawArcPreview;
drawArcPreview = function(...args) {
  if (tutorial.active && (tutorialMovementLocked() || tutorial.frogHidden || tutorial.resetPending)) return;
  return originalDrawArcPreviewForTutorial.apply(this, args);
};

const originalDrawFrogForTutorial = drawFrog;
drawFrog = function(...args) {
  if (tutorial.active && tutorial.frogHidden) return;
  return originalDrawFrogForTutorial.apply(this, args);
};

const originalDrawPvpPlayerForTutorial = drawPvpPlayer;
drawPvpPlayer = function(player, ...rest) {
  if (tutorial.active && tutorial.kind === "pvp") {
    const index = pvpPlayers.indexOf(player);
    if (tutorial.pvpFrogsHidden || tutorial.pvpHiddenPlayerIndices.includes(index)) return;
  }
  return originalDrawPvpPlayerForTutorial.call(this, player, ...rest);
};

const originalDrawScene = drawScene;
drawScene = function(...args) {
  const result = originalDrawScene.apply(this, args);
  if (tutorial.active) {
    drawTutorialOverlay();
    // Dialogue and the goal are painted first; the complete tutorial pause
    // panel is then drawn over them as the topmost layer.
    if (game.state === "paused") drawTutorialPauseOverlay();
  }
  if (tutorial.completeScreen) drawCompletionScreen();
  return result;
};

// Script actions use wall-clock deadlines. Suspend them together with the
// scene during pause/countdown, rather than firing every queued action at once.
let tutorialClockSuspendedAt = null;
function synchronizeTutorialClock(now = performance.now()) {
  if (!tutorial.active) { tutorialClockSuspendedAt = null; return; }
  if (game.state === "paused" || game.state === "countdown") {
    if (tutorialClockSuspendedAt === null) tutorialClockSuspendedAt = now;
    return;
  }
  if (tutorialClockSuspendedAt === null) return;
  const delay = Math.max(0, now - tutorialClockSuspendedAt);
  tutorialClockSuspendedAt = null;
  for (const key of Object.keys(tutorial)) {
    if (/(?:At|Until)$/.test(key) && typeof tutorial[key] === "number" && tutorial[key] > 0) tutorial[key] += delay;
  }
  for (const action of tutorial.pvpScriptActions || []) action.dueAt += delay;
  for (const cloud of tutorial.smokeClouds || []) cloud.born += delay;
}

const originalUpdate = update;
update = function(dt, ...rest) {
  synchronizeTutorialClock();
  // Let the built-in pause/countdown machinery run normally so the pause menu
  // remains interactive. Tutorial monitoring simply waits until play resumes.
  if (tutorial.active && (game.state === "paused" || game.state === "countdown")) {
    // Only the final 1v1 countdown advances the scenery clock: clouds, kite,
    // wind and water should keep moving behind 3-2-1. Physics, flies and
    // the 30-second match clock are still paused until GO.
    if (game.state === "countdown" && tutorial.kind === "pvp" &&
        tutorialStep()?.setup === "pvpFinalMatch") {
      game.visualTime += Math.max(0, Math.min(.05, Number(dt) || 0));
    }
    const result = originalUpdate.call(this, dt, ...rest);
    updateTutorial();
    return result;
  }

  // The final Versus entrance reserves a one-second hold after the poof.
  // It cannot consume any of the 30-second match clock, run the CPU early,
  // or spawn/catch flies before the visible 3-2-1 countdown has begun.
  if (tutorial.active && tutorial.kind === "pvp" &&
      tutorialStep()?.setup === "pvpFinalMatch" && tutorial.pvpFinalMatchCountdownUntil > 0 &&
      game.state === "playing") {
    updateTutorialAmbient(dt, { animateFlies:true });
    for (const player of pvpPlayers) { player.inputHeld = false; player.charging = false; }
    updateTutorial();
    return undefined;
  }

  // During dialogue, poofs, and the brief success hold, keep the Park sky,
  // scenery clock, particles, and already-spawned flies alive while freezing
  // only the controlled frog. Flies stay still during a poof transition.
  if (tutorial.active && tutorialMovementLocked()) {
    updateTutorialAmbient(dt, { animateFlies: true });
    if (tutorial.kind === "pvp" &&
        (tutorial.dialogueOpen || tutorial.pvpAwaitRecoveryAdvance) && !tutorial.resetPending &&
        !tutorial.pvpFrogsHidden && game.state === "playing") {
      // Dialogue blocks controls, not gravity. A surprise bonk or wall rebound
      // may leave either frog airborne when Ember begins speaking. Finish that
      // fall using the normal per-frog platform/ground physics, without running
      // new opponent collisions, fly catches, CPU inputs, or scoring events.
      for (const player of pvpPlayers) {
        player.inputHeld = false;
        player.charging = false;
        // Even a grounded and otherwise idle frog needs this normal update:
        // it advances landingSquash, bonkLandingPopTimer, stun countdowns
        // and the ONE recoveryFlipTimer throughout fast-forwarded dialogue.
        // updatePvpPlayer has a grounded early-return, so it will not launch
        // a new jump or introduce opponent collisions while inputs are locked.
        updatePvpPlayer(player, dt);
      }
      updatePvpImpactEffects(dt);
    } else {
      freezeControlledEntity();
    }
    updateTutorial();
    return undefined;
  }

  const result = originalUpdate.call(this, dt, ...rest);
  updateTutorial();
  return result;
};

window.addEventListener("keydown", (event) => {
  if (tutorial.active && !event.metaKey && !event.ctrlKey && !event.altKey && /^[a-z]$/i.test(String(event.key || ""))) {
    tutorial.debugSkipBuffer = `${tutorial.debugSkipBuffer}${String(event.key).toLowerCase()}`.slice(-24);
    if (tutorial.debugSkipBuffer.endsWith("tutorialskip")) {
      tutorial.debugSkipBuffer = "";
      event.preventDefault();
      event.stopImmediatePropagation();
      skipToNextTutorialScene();
      return;
    }
  }
  if (tutorial.active && tutorial.kind === "pvp" && event.code === "ShiftRight") {
    // Ember is always the scripted Level 5 coach. Right Shift never hands her
    // to the player during training.
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  // R only restarts a tutorial scene from the pause menu. Live gameplay no
  // longer binds a hidden instant-retry shortcut.

  // Escape uses the game's ordinary pause flow, exactly like P. It must never
  // reset a tutorial attempt or skip the current demonstration.
  if (tutorial.active && game.state === "paused" && !game.pauseHelpOpen && !event.repeat &&
      ["ArrowLeft", "ArrowRight"].includes(event.code)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    selectTutorialChapter(event.code === "ArrowLeft" ? -1 : 1);
    return;
  }

  if (tutorial.completeScreen && ["Enter", "NumpadEnter", "Space", "Escape"].includes(event.code)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    dismissCompletionScreen();
    return;
  }

  if (tutorial.active && tutorial.dialogueOpen && game.state !== "paused" && game.state !== "countdown") {
    if (event.code === "Space") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;

      // A completed final line closes on keydown and owns this entire physical
      // key press. The matching keyup only releases the lock, so a second Space
      // press is required to start charging the frog.
      if (dialogueLineIsComplete()) {
        tutorial.blockJumpUntilRelease = true;
        tutorial.dialogueSpaceHeld = false;
        tutorial.dialogueSpaceHeldAt = 0;
        closeDialogue("space-keydown");
        return;
      }

      if (!tutorial.dialogueSpaceHeld) {
        tutorial.dialogueSpaceHeld = true;
        tutorial.dialogueSpaceHeldAt = performance.now();
      }
      return;
    }
    if (["Enter", "NumpadEnter"].includes(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) closeDialogue("keyboard");
    }
  }
}, { capture:true, passive:false });

window.addEventListener("keyup", (event) => {
  if (tutorial.active && tutorial.kind === "pvp" && event.code === "ShiftRight") {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  if (event.code !== "Space" || !tutorial.active) return;

  if (tutorial.blockJumpUntilRelease) {
    event.preventDefault();
    event.stopImmediatePropagation();
    tutorial.blockJumpUntilRelease = false;
    tutorial.dialogueSpaceHeld = false;
    tutorial.dialogueSpaceHeldAt = 0;
    clearHeldInput();
    return;
  }

  if (!tutorial.dialogueOpen || !tutorial.dialogueSpaceHeld) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const now = performance.now();
  const heldFor = Math.max(0, now - (tutorial.dialogueSpaceHeldAt || now));
  const typingStart = Math.max(tutorial.dialogueLineStartedAt, tutorial.dialoguePreLineDelayUntil || 0);
  tutorial.dialogueFastForwardExtraMs += Math.max(0, now - Math.max(typingStart, tutorial.dialogueSpaceHeldAt || now));
  tutorial.dialogueSpaceHeld = false;
  tutorial.dialogueSpaceHeldAt = 0;
  clearHeldInput();
  // A quick tap completes an unfinished sentence. A sustained hold is reserved
  // for the requested 2x typewriter speed and never skips dialogue.
  if (heldFor < DIALOGUE_SPACE_HOLD_THRESHOLD_MS) closeDialogue("space");
}, { capture:true, passive:false });

canvas.addEventListener("pointerdown", (event) => {
  if (tutorial.active && game.state === "paused" && !game.pauseHelpOpen) {
    const point = getCanvasPoint(event);
    const chapterRects = getTutorialPauseChapterRects();
    if (pointInsideRect(point, chapterRects.previous) || pointInsideRect(point, chapterRects.next)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      selectTutorialChapter(pointInsideRect(point, chapterRects.previous) ? -1 : 1);
      return;
    }
  }
  if (tutorial.active && tutorial.dialogueOpen && game.state !== "paused" && game.state !== "countdown") {
    if (pointInsideRect(getCanvasPoint(event), HUD_UI.pauseButton)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    tutorial.dialoguePointerId = event.pointerId;
  }
}, { capture:true, passive:false });

let tutorialPauseLastWheelAt = 0;
canvas.addEventListener("wheel", (event) => {
  if (!tutorial.active || game.state !== "paused" || game.pauseHelpOpen || !event.deltaY) return;
  if (!pointInsideRect(getCanvasPoint(event), getTutorialPauseChapterRects().scroll)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const now = performance.now();
  if (now - tutorialPauseLastWheelAt < 125) return;
  tutorialPauseLastWheelAt = now;
  selectTutorialChapter(event.deltaY > 0 ? 1 : -1);
}, { capture:true, passive:false });

canvas.addEventListener("pointermove", (event) => {
  if (tutorial.active && game.state === "paused" && !game.pauseHelpOpen) {
    const point = getCanvasPoint(event);
    const chapterRects = getTutorialPauseChapterRects();
    tutorial.pauseChapterHover = pointInsideRect(point, chapterRects.previous)
      ? "previous"
      : pointInsideRect(point, chapterRects.next) ? "next" : "";
    return;
  }
  tutorial.pauseChapterHover = "";
  if (!tutorialPlayerHasControl() || tutorialStep()?.setup === "normalRound") {
    tutorial.goalHovered = false;
    return;
  }
  tutorial.goalHovered = pointInsideRect(getCanvasPoint(event), getTutorialGoalRect());
}, { passive:true });

canvas.addEventListener("pointerleave", () => { tutorial.goalHovered = false; }, { passive:true });

canvas.addEventListener("pointerup", (event) => {
  if (tutorial.active && tutorial.dialogueOpen && game.state !== "paused" && game.state !== "countdown" && tutorial.dialoguePointerId === event.pointerId) {
    event.preventDefault();
    event.stopImmediatePropagation();
    tutorial.dialoguePointerId = null;
    closeDialogue("pointer");
    return;
  }
  if (!tutorial.completeScreen) return;
  const point = getCanvasPoint(event);
  const rects = getVictoryButtonRects(getVictoryUnlockNoticeLayout());
  if (!pointInsideRect(point, rects.replayButton) && !pointInsideRect(point, rects.homeButton)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  dismissCompletionScreen();
}, { capture:true, passive:false });

canvas.addEventListener("pointercancel", (event) => {
  tutorial.goalHovered = false;
  if (tutorial.dialoguePointerId !== event.pointerId) return;
  tutorial.dialoguePointerId = null;
}, { capture:true, passive:false });

window.RibbitRaceTutorialShouldIgnorePvpPlatform = (player, platform) => {
  if (!tutorial.active || tutorial.kind !== "pvp" || !player || !platform) return false;
  const setup = tutorialStep()?.setup || "";
  const isHighDropper = (setup === "pvpDemoDropHigh" && player.index === 1) ||
    (setup === "pvpDropHigh" && player.index === 0);
  return Boolean(isHighDropper && platform === PARK_PLATFORMS[3]);
};
