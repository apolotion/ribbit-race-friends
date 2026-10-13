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
  const result = originalBonkPvpPlayerForTutorial.call(this, victim, stomper, ...rest);
  if (active && tutorialStep()?.demonstration && stomper?.index === 1 && victim?.index === 0) {
    tutorial.pvpDemoBonkAt = performance.now();
    tutorial.pvpDemoBonkCount += 1;
    tutorial.pvpLastPracticeEventAt = tutorial.pvpDemoBonkAt;
  }
  if (active && stomper?.index === 0 && victim?.index === 1) {
    tutorial.pvpBonks += 1;
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
  const beforeA = a?.lastOpponentBounceType;
  const beforeB = b?.lastOpponentBounceType;
  const result = originalBouncePvpPlayersSidewaysForTutorial.call(this, a, b, ...rest);
  if (active && (a?.lastOpponentBounceType === "rebound" || b?.lastOpponentBounceType === "rebound") &&
      beforeA !== "rebound" && beforeB !== "rebound" && performance.now() - tutorial.pvpLastPracticeEventAt > 120) {
    tutorial.pvpReboundCount += 1;
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
    tutorial.pvpPracticeCatchCount += 1;
    tutorial.pvpLastPracticeEventAt = performance.now();
    tutorial.promptHidden = true;
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

const originalDrawSoloPauseOverlayForTutorial = drawSoloPauseOverlay;
drawSoloPauseOverlay = function(...args) {
  if (tutorial.active && tutorial.dialogueOpen) drawTutorialDialogue();
  return originalDrawSoloPauseOverlayForTutorial.apply(this, args);
};

// Keep the normal pause flow available during the tutorial. The two lower
// buttons are repainted and repurposed as Retry Scene and Skip Tutorial.
const originalDrawPauseControlsForTutorial = drawPauseControls;
drawPauseControls = function(...args) {
  const result = originalDrawPauseControlsForTutorial.apply(this, args);
  if (!tutorial.active || game.state !== "paused") return result;

  const skin = getSelectedSkin();
  const restartButton = PAUSE_UI.restartButton;
  const homeButton = PAUSE_UI.homeButton;
  drawSelectablePauseButton(
    restartButton,
    game.pauseFocusVisible && game.pauseSelection === "restart",
    game.pauseHoveredSelection === "restart",
    game.pausePressedSelection === "restart",
    { dark: "#6b4c21", mid: "#b78634", light: "#f2cf70" },
    "RESTART SCENE",
    (full) => drawMiniRestartIcon(restartButton.x + 8, restartButton.y + 3, full ? COLORS.white : "#7a5a2a"),
    restartButton.x + restartButton.w / 2 + 10
  );
  drawSelectablePauseButton(
    homeButton,
    game.pauseFocusVisible && game.pauseSelection === "home",
    game.pauseHoveredSelection === "home",
    game.pausePressedSelection === "home",
    { dark: skin.dark, mid: "#d76b31", light: "#ffb45f" },
    "EXIT TUTORIAL",
    () => drawMiniHouseIcon(homeButton.x + 7, homeButton.y + 3),
    homeButton.x + homeButton.w / 2 + 10
  );
  return result;
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
    finish(false);
    return;
  }
  if (game.pauseSelection === "restart") {
    game.state = "playing";
    game.pauseHelpOpen = false;
    game.pauseChargeSnapshot = null;
    game.resumeChargeAfterCountdown = false;
    beginPoofTransition({
      reason: "tutorial-retry",
      showFailure: false,
      preserveExistingFlies: false,
      armFlies: false,
      action: rebuildCurrentScenarioWithDialogue
    });
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
pressPvpButton = function(index, ...rest) {
  if (tutorialBlocksLiveInput()) return;
  return originalPressPvpButtonForTutorial.call(this, index, ...rest);
};

const originalReleasePvpButtonForTutorial = releasePvpButton;
releasePvpButton = function(index, ...rest) {
  if (tutorialBlocksLiveInput()) return;
  return originalReleasePvpButtonForTutorial.call(this, index, ...rest);
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
    const result = originalUpdate.call(this, dt, ...rest);
    updateTutorial();
    return result;
  }

  // During dialogue, poofs, and the brief success hold, keep the Park sky,
  // scenery clock, particles, and already-spawned flies alive while freezing
  // only the controlled frog. Flies stay still during a poof transition.
  if (tutorial.active && tutorialMovementLocked()) {
    updateTutorialAmbient(dt, { animateFlies: true });
    freezeControlledEntity();
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

  if (tutorial.active && event.code === "KeyR" &&
      game.state !== "paused" && !tutorial.completeScreen) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!event.repeat) window.RibbitRaceTutorialEngine?.retryScene?.();
    return;
  }

  // Escape uses the game's ordinary pause flow, exactly like P. It must never
  // reset a tutorial attempt or skip the current demonstration.
  if (tutorial.active && game.state === "paused" && !event.repeat &&
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
  if (tutorial.active && game.state === "paused") {
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

canvas.addEventListener("pointermove", (event) => {
  if (tutorial.active && game.state === "paused") {
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
