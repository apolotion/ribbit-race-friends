// Ribbit Race tutorial responsibility: 124 tutorial monitoring
function attemptFinishedOnLanding() {
  if (!tutorial.attemptStarted) return false;
  if (!frog.grounded) tutorial.attemptWasAirborne = true;
  if (tutorial.attemptWasAirborne && frog.grounded && !tutorial.attemptEnded) {
    tutorial.attemptEnded = true;
    return true;
  }
  return false;
}

function resetAttemptForNextJump() {
  tutorial.sceneLandingDelayUntil = 0;
  tutorial.attemptStarted = false;
  tutorial.attemptWasAirborne = false;
  tutorial.attemptEnded = false;
  tutorial.wallTouchedThisJump = false;
  tutorial.maxCatchesOneJump = 0;
  tutorial.sceneAttemptCaught = false;
  tutorial.catchEvents = [];
}

function advanceThreeCatchAttempt() {
  const nextAttemptIndex = tutorial.sceneAttemptIndex + 1;
  beginPoofTransition({
    reason: "next-matching-fly",
    showFailure: false,
    preserveExistingFlies: false,
    action: () => {
      setupThreeCatchAttempt(nextAttemptIndex, false);
      resetAttemptForNextJump();
    }
  });
}

function retryThreeCatchAttempt() {
  const missedAttemptIndex = tutorial.sceneAttemptIndex;
  tutorial.promptHidden = false;
  beginPoofTransition({
    reason: "retry-missed-fly",
    message: "CATCH THIS MATCHING FLY IN ONE JUMP",
    showFailure: true,
    preserveExistingFlies: true,
    preservePrompt: true,
    action: () => {
      setupThreeCatchAttempt(missedAttemptIndex, true);
      resetAttemptForNextJump();
      tutorial.promptHidden = false;
    }
  });
}

function beginWrongFlyFollowupTransition() {
  if (
    !tutorial.active ||
    tutorial.resetPending ||
    tutorial.wrongFlyRightSpawned ||
    tutorial.wrongFlyFollowupQueued
  ) return false;

  tutorial.wrongFlyFollowupQueued = true;
  tutorial.promptHidden = true;
  const started = beginPoofTransition({
    reason: "wrong-fly-followup",
    showFailure: false,
    preserveExistingFlies: true,
    action: () => {
      positionCenteredOnPlatform(platforms[3], 1);
      setPrompt(tutorial.wrongFlyPromptIndex);
      const rightFly = makeParkFly(6, tutorial.wrongFlyPromptIndex, 1);
      tutorial.wrongFlyRightFlyId = rightFly.id;
      tutorial.wrongFlyRightSpawned = true;
      tutorial.wrongFlyFollowupQueued = false;
      resetAttemptForNextJump();
    }
  });
  if (!started) tutorial.wrongFlyFollowupQueued = false;
  return started;
}

function observeBufferedDrop(setup) {
  const currentKey = platformKey(frog.dropThroughPlatform);
  if (!currentKey) {
    tutorial.lastObservedDropPlatform = "";
    return;
  }
  if (currentKey === tutorial.lastObservedDropPlatform) return;
  tutorial.lastObservedDropPlatform = currentKey;
  if (!["bufferDrop", "doubleBuffer"].includes(setup)) return;
  if (tutorial.lastJumpPower < .5 || frog.grounded) return;
  tutorial.bufferedDrop = true;
  tutorial.bufferedPlatforms.add(currentKey);
  tutorial.bufferEventCount = tutorial.bufferedPlatforms.size;
}

function monitorSolo() {
  const setup = SOLO_STEPS[tutorial.step]?.setup;
  maintainSequencePrompt();
  tutorial.maxCatchesOneJump = Math.max(
    tutorial.maxCatchesOneJump,
    Number(game.currentJumpCorrectCatches || 0)
  );

  if (!frog.grounded && frog.dir !== tutorial.lastDir) {
    tutorial.wallTouched = true;
    tutorial.wallTouchedThisJump = true;
  }
  tutorial.lastDir = frog.dir;
  observeBufferedDrop(setup);

  const caught = Math.max(0, Number(game.score || 0) - tutorial.scoreStart);
  const attemptEnded = attemptFinishedOnLanding();
  const now = performance.now();

  // A landing can occur on the same frame that the tongue is still carrying
  // the third fly. Keep the attempt alive until that catch resolves instead
  // of treating the landing as a miss and poofing the frog away.
  if (["comboTwo", "comboThree"].includes(setup) && attemptEnded &&
      (tongue.active || game.soloCriticalCatchActive)) {
    // The final fly may still be travelling along the tongue on the very
    // frame the frog lands. Hold the result until the catch resolves.
    tutorial.sceneLandingDelayUntil = performance.now() + 180;
    tutorial.attemptEnded = false;
    return;
  }
  const landedThisFrame = !tutorial.wasGroundedLastFrame && frog.grounded;
  if (landedThisFrame) {
    tutorial.bufferedJumpWindowOpenedAt = now;
    if (setup === "bufferJumpCharge") {
      tutorial.bufferedJumpChainCount = Math.max(tutorial.bufferedJumpChainCount, game.buttonHeld ? 1 : 0);
      if (tutorial.jumpAttempts >= 1 && !game.buttonHeld && !tutorial.bufferedJumpReleased &&
          !tutorial.passPending && tutorial.bufferedJumpChainCount < 1) {
        failAttempt("HOLD JUMP BEFORE YOU LAND TO BUFFER THE NEXT CHARGE");
        tutorial.wasGroundedLastFrame = Boolean(frog.grounded);
        return;
      }
    }
  }
  tutorial.wasGroundedLastFrame = Boolean(frog.grounded);

  if (tutorial.passPending) {
    if (frog.grounded && !tongue.active && !game.soloCriticalCatchActive) finalizePassedStep();
    return;
  }

  if (setup === "intro") return;

  if (setup === "longJumps") {
    if (!attemptEnded) return;
    if (tutorial.lastJumpPower >= .90) {
      tutorial.longJumpStreak += 1;
      frog.catchSparkleTimer = Math.max(frog.catchSparkleTimer, CONFIG.catchSparkleDuration);
      try { playCorrectFlySound(); } catch (_) { tone(720, .055, .014, 90); }
      if (tutorial.longJumpStreak >= 3) passStep();
      else resetAttemptForNextJump();
    } else {
      tutorial.longJumpStreak = 0;
      failAttempt("RELEASE CLOSE TO FULL CHARGE");
    }
    return;
  }

  if (setup === "threeCatches") {
    if (tutorial.sceneLandingDelayUntil > 0) {
      if (now < tutorial.sceneLandingDelayUntil) return;
      tutorial.sceneLandingDelayUntil = 0;
      if (tutorial.sceneCatchCount >= 3) passStep();
      else advanceThreeCatchAttempt();
      return;
    }
    if (!attemptEnded) return;
    if (tutorial.sceneAttemptCaught) {
      tutorial.sceneLandingDelayUntil = now + 250;
      freezeControlledEntity();
    } else {
      retryThreeCatchAttempt();
    }
    return;
  }

  if (setup === "rangeCatch") {
    if (tutorial.rangeTongueCaught && !game.soloCriticalCatchActive && now - tutorial.rangeTongueCaughtAt >= 250) passStep();
    else if (attemptEnded && !tutorial.rangeTongueCaught && !tongue.active) failAttempt("GET CLOSE ENOUGH FOR YOUR TONGUE TO REACH");
    return;
  }

  if (setup === "wrongFly") {
    if (tutorial.jumpAttempts > 4 && attemptEnded && !tutorial.wrongFlyReturnedCaught) {
      failAttempt("COME BACK FOR IT IN 4 JUMPS OR LESS");
      return;
    }
    if (tutorial.wrongFlyReturnedCaught) {
      if (frog.grounded && !tongue.active && now - tutorial.wrongFlyResolvedAt >= CORRECT_CATCH_LANDING_HOLD_MS) passStep();
      return;
    }
    if (tutorial.wrongFlyRightCaught) {
      if (attemptEnded) {
        resetAttemptForNextJump();
        tutorial.promptHidden = false;
        tutorial.revealPromptOnLanding = false;
      }
      return;
    }
    if (attemptEnded && !tutorial.wrongFlyCaught) {
      failAttempt("CATCH THE FLY THAT DOES NOT MATCH");
    } else if (attemptEnded) {
      resetAttemptForNextJump();
      tutorial.promptHidden = false;
    }
    return;
  }

  if (setup === "comboMixed") {
    if (!attemptEnded) return;
    const mixedSuccess = tutorial.catchEvents.length >= 2 &&
      tutorial.catchEvents[0] === true &&
      tutorial.catchEvents[1] === false;
    if (mixedSuccess) passStep();
    else failAttempt("CATCH THE MATCH FIRST, THEN THE WRONG FLY");
    return;
  }

  if (setup === "comboTwo") {
    if (tongue.active || game.soloCriticalCatchActive) return;
    const lateLanding = frog.grounded && tutorial.sceneLandingDelayUntil > 0 &&
      now >= tutorial.sceneLandingDelayUntil;
    if (!attemptEnded && !lateLanding) return;
    tutorial.sceneLandingDelayUntil = 0;
    const success = tutorial.maxCatchesOneJump >= 2 &&
      tutorial.catchEvents.length >= 2 &&
      tutorial.catchEvents.slice(0, 2).every(Boolean);
    if (success) passStep();
    else failAttempt("CATCH TWO MATCHING FLIES BEFORE LANDING");
    return;
  }

  if (setup === "comboThree") {
    const lateLanding = frog.grounded && tutorial.sceneLandingDelayUntil > 0 &&
      !tongue.active && !game.soloCriticalCatchActive && now >= tutorial.sceneLandingDelayUntil;
    if (!attemptEnded && !lateLanding) return;
    tutorial.sceneLandingDelayUntil = 0;
    const success = tutorial.maxCatchesOneJump >= 3 &&
      tutorial.catchEvents.length >= 3 &&
      tutorial.catchEvents.slice(0, 3).every(Boolean);
    if (success) passStep();
    else failAttempt("CATCH ALL THREE MATCHING FLIES BEFORE LANDING");
    return;
  }

  if (setup === "wallTurn") {
    if (tutorial.wallTouched && caught >= 1) passStep();
    else if (attemptEnded && tutorial.jumpAttempts >= 2) failAttempt("HIT THE WALL, THEN RETURN FOR THE FLY");
    return;
  }

  if (setup === "reboundCatch") {
    if (tutorial.wallTouchedThisJump && caught >= 1 && !frog.grounded) passStep();
    else if (attemptEnded) failAttempt("REBOUND AND CATCH THE FLY IN ONE JUMP");
    return;
  }

  if (setup === "quickDrop") {
    if (tutorial.quickDrop && caught >= 1) passStep();
    else if (attemptEnded) failAttempt(tutorial.quickDrop
      ? "DROP THROUGH AND CATCH THE FLY"
      : tutorial.quickDropWrongJump
        ? "TAP QUICKLY - DO NOT CHARGE"
        : "TAP JUMP QUICKLY TO DROP THROUGH");
    return;
  }

  if (setup === "bufferJumpCharge") {
    if (tutorial.bufferedJumpChainCount >= 1 && tutorial.bufferedJumpReleased) {
      passStep();
    } else if (attemptEnded && tutorial.bufferedJumpChainCount < 1) {
      failAttempt("HOLD JUMP BEFORE LANDING, THEN RELEASE");
    }
    return;
  }

  if (setup === "bufferDrop") {
    if (tutorial.bufferEventCount >= 1 && caught >= 1) passStep();
    else if (attemptEnded) failAttempt("BUFFER THROUGH THE MIDDLE PLATFORM AND CATCH THE FLY");
    return;
  }

  if (setup === "doubleBuffer") {
    if (tutorial.quickDrop && tutorial.bufferEventCount === 0 && attemptEnded) {
      failAttempt("DROP THROUGH THE FIRST PLATFORM IS NOT THE ROUTE");
    } else if (tutorial.bufferEventCount >= 2 && caught >= 3) passStep();
    else if (attemptEnded) failAttempt("BUFFER TWICE AND CATCH ALL THREE FLIES");
    return;
  }

  if (setup === "normalRound" && game.state === "won") beginCompletionScreen();
}

function pvpTutorialSettled() {
  const p1 = pvpPlayers[0];
  const ember = pvpPlayers[1];
  const impactActive = Array.isArray(game.pvpImpactEffects) &&
    game.pvpImpactEffects.some((effect) => Number(effect?.elapsed || 0) < Number(effect?.duration || 0));
  return Boolean(
    p1?.grounded && ember?.grounded &&
    !p1?.bonked && !ember?.bonked &&
    Number(p1?.stunTimer || 0) <= 0 && Number(ember?.stunTimer || 0) <= 0 &&
    !p1?.tongue?.active && !ember?.tongue?.active &&
    !impactActive
  );
}

function consumePvpPlayerLanding() {
  const player = pvpPlayers[0];
  if (!player) return false;
  if (!player.grounded) tutorial.pvpPlayerAttemptWasAirborne = true;
  if (tutorial.pvpPlayerAttemptWasAirborne && player.grounded) {
    tutorial.pvpPlayerAttemptWasAirborne = false;
    return true;
  }
  return false;
}

// Identifies a genuine completed jump, never the initial grounded charge.
// It is independent of consumePvpPlayerLanding (used by other lessons).
function updatePvpLessonLandings() {
  if (!Array.isArray(tutorial.pvpLessonAirborneSeen)) tutorial.pvpLessonAirborneSeen = [false, false];
  if (!Array.isArray(tutorial.pvpLessonLanded)) tutorial.pvpLessonLanded = [false, false];
  const justLanded = [false, false];
  for (const [index, player] of pvpPlayers.entries()) {
    if (!player) continue;
    if (!player.grounded && player.firstJumpMade) tutorial.pvpLessonAirborneSeen[index] = true;
    if (tutorial.pvpLessonAirborneSeen[index] && player.grounded && !tutorial.pvpLessonLanded[index]) {
      tutorial.pvpLessonLanded[index] = true;
      justLanded[index] = true;
    }
  }
  return justLanded;
}

function pvpPracticeEventReady(delayMs = 1000, now = performance.now()) {
  return tutorial.pvpLastPracticeEventAt > 0 && now - tutorial.pvpLastPracticeEventAt >= delayMs;
}

function drivePvpPracticeCpu(setup, now) {
  const p1 = pvpPlayers[0];
  const ember = pvpPlayers[1];
  if (!p1 || !ember) return;

  updatePvpScriptActions(now);
  updatePvpScriptedBuffer();

  if (!PVP_MOVING_PRACTICE_SETUPS.has(setup)) holdEmberStill();

  if (setup === "pvpBoostBonk") {
    // Ember always begins a visible maximum-charge jump one second after the
    // dialogue handoff. Her launch no longer depends on the player's input.
    if (tutorial.pvpEmberJumpScheduledAt <= 0) {
      tutorial.pvpEmberJumpScheduledAt = Math.max(now, tutorial.enteredAt || now) + 1000;
    }
    if (!tutorial.pvpEmberLaunchStarted && now >= tutorial.pvpEmberJumpScheduledAt && ember.grounded) {
      tutorial.pvpEmberLaunchStarted = true;
      scriptPvpChargedJump(1, .98, -1, 0);
    }
    return;
  }

  if (setup === "pvpUnderBonkTwo") {
    // Begin charging *as soon as* P1 releases their first jump from the
    // left-middle platform. Ember may only launch once P1 lands on the
    // lower-middle perch; she is never teleported between attempts.
    const center = PARK_PLATFORMS[3];
    const playerFlying = !p1.grounded && p1.firstJumpMade && !p1.charging;
    if (playerFlying) tutorial.pvpUnderBonkAttemptAirborne = true;
    if (playerFlying && tutorial.pvpUnderBonks === 0 &&
        !tutorial.pvpUnderBonkChargePrimed && !tutorial.dialogueOpen) {
      tutorial.pvpUnderBonkChargePrimed = true;
      scriptPvpPress(1, 1);
    }
    const onCenter = p1.grounded && getPvpStandingPlatform(p1) === center;
    if (!tutorial.pvpUnderBonkAttemptAirborne || !onCenter ||
        tutorial.pvpUnderBonkPendingSecond || tutorial.dialogueOpen ||
        tutorial.pvpUnderBonks >= 2 || ember.bonked || ember.stunTimer > 0 ||
        !ember.grounded || tutorial.pvpScriptActions.length ||
        (tutorial.pvpUnderBonks > 0 && now - tutorial.pvpLastPracticeEventAt < 900)) return;
    tutorial.pvpUnderBonkPendingSecond = true;
    tutorial.pvpUnderBonkEmberAirborne = false;
    // Target P1's current position, not their initial spawn position. Both
    // jumps really collide with the underside of the frog, including after
    // Ember recovers and approaches the opposite direction on the second.
    const direction = p1.x + p1.w/2 >= ember.x + ember.w/2 ? 1 : -1;
    ember.dir = direction;
    if (ember.charging && tutorial.pvpUnderBonkChargePrimed) {
      tutorial.pvpUnderBonkChargePrimed = false;
      scriptPvpRelease(1, .55);
    } else if (!ember.charging && !ember.inputHeld) {
      if (tutorial.pvpUnderBonks > 0) {
        // Ember has already recovered directly beneath the player's perch.
        // A normal second jump with zero horizontal drift strikes the underside
        // instead of side-rebounding and knocking the player away.
        scriptPvpPress(1, direction);
        queuePvpScriptAction(458, () => {
          if (!ember.grounded || ember.bonked) return;
          scriptPvpRelease(1, .55);
          ember.vx = 0;
        }, "second-under-bonk-straight-up");
      } else {
        scriptPvpChargedJump(1, .55, direction, 0);
      }
    }
    return;
  }

  if (setup === "pvpReboundThree") {
    if (p1.inputHeld && !tutorial.pvpMirrorWasHeld && ember.grounded) {
      tutorial.pvpMirrorWasHeld = true;
      scriptPvpPress(1);
    } else if (!p1.inputHeld && tutorial.pvpMirrorWasHeld) {
      tutorial.pvpMirrorWasHeld = false;
      scriptPvpRelease(1, Math.max(.18, Number(p1.lastLaunchPower || p1.charge || .55)));
    }
    return;
  }

  if (setup === "pvpIntercept" || setup === "pvpDinnerSteal") {
    if (tutorial.pvpEmberJumpScheduledAt <= 0) {
      tutorial.pvpEmberJumpScheduledAt = Math.max(now, tutorial.enteredAt || now) + 500;
    }
    if (!tutorial.pvpEmberLaunchStarted && now >= tutorial.pvpEmberJumpScheduledAt && ember.grounded) {
      tutorial.pvpEmberLaunchStarted = true;
      const launchDirection = setup === "pvpDinnerSteal" ? -1 : 1;
      ember.dir = launchDirection;
      scriptPvpChargedJump(1, setup === "pvpDinnerSteal" ? .82 : .72, launchDirection, 0);
    }
    return;
  }
}

function beginPvpTutorialEnding() {
  if (tutorial.pvpFinalOutcome !== null || tutorial.dynamicDialogueLines) return;
  const playerWon = Number(pvpPlayers[0]?.score || 0) > Number(pvpPlayers[1]?.score || 0) || game.pvpWinnerIndex === 0 || game.pvpMatchWinnerIndex === 0;
  tutorial.pvpFinalOutcome = playerWon ? "win" : "lose";
  game.pvpCpuEnabled = false;
  tutorial.pvpCaption = playerWon ? "YOU WIN!" : "EMBER WINS!";
  tutorial.pvpCaptionUntil = performance.now() + 2400;
  openDynamicDialogue(playerWon ? PVP_WIN_DIALOGUE : PVP_LOSE_DIALOGUE, playerWon ? "shocked" : "happy", false);
}

function monitorPvp() {
  const setup = PVP_STEPS[tutorial.step]?.setup;
  const p1 = pvpPlayers[0];
  const ember = pvpPlayers[1];
  const now = performance.now();
  // The final round is a real Level-5 CPU match. Never run the scripted
  // practice controller here: holdEmberStill() clears CPU charging every
  // frame and makes her plan/sound loop forever without ever jumping.
  if (setup === "pvpFinalMatch") {
    if (tutorial.pvpFinalMatchCountdownUntil && now >= tutorial.pvpFinalMatchCountdownUntil) {
      tutorial.pvpFinalMatchCountdownUntil = 0;
      tutorial.pvpPlayerScriptLocked = false;
      startResumeCountdown(false);
      return;
    }
    // Never inherit a prior tutorial cinematic's permanent label-hiding flag.
    if (!game.pvpCriticalCatchActive && window.RibbitRaceFinalCatchLabelsGone)
      try { window.RibbitRaceResetFinalCatchLabels?.(); } catch (_) {}
    if (tutorial.pvpFinalMatchStarted && game.state === "playing" &&
        !game.pvpSuddenDeath && game.pvpTimeLimitSeconds > 0 &&
        game.pvpTimeRemaining <= 0 &&
        (Number.isFinite(game.pvpTimeExpiredRealAt) || Number.isFinite(game.pvpTimeExpiredAt))) {
      if (!Number.isFinite(tutorial.pvpZeroClockObservedAt) || tutorial.pvpZeroClockObservedAt <= 0)
        tutorial.pvpZeroClockObservedAt = now;
      if (now - tutorial.pvpZeroClockObservedAt > 2800) {
        // In an orphaned cinematic/bonk state, the clock must still end the
        // round. After an ordinary grace period resolve by the actual scores.
        game.pvpCriticalCatchActive = false;
        game.pvpTimerGraceActive = false;
        game.pvpTimedOutcomePending = true;
        resolvePvpTimedOutcomeAfterJump();
        tutorial.pvpZeroClockObservedAt = 0;
      }
    } else tutorial.pvpZeroClockObservedAt = 0;
    if (tutorial.pvpFinalMatchStarted && game.state === "won") beginPvpTutorialEnding();
    return;
  }
  if (tutorial.passPending) {
    if (p1?.grounded && !p1.bonked && !p1.tongue?.active &&
        !ember?.bonked && !game.pvpCriticalCatchActive) finalizePassedStep();
    return;
  }
  drivePvpPracticeCpu(setup, now);
  const playerLanded = consumePvpPlayerLanding();
  const lessonLandings = ["pvpReboundCatch", "pvpIntercept", "pvpDinnerSteal"].includes(setup)
    ? updatePvpLessonLandings() : [false, false];

  if (setup === "pvpBonkThree") {
    if (tutorial.pvpBonks >= 3) {
      // Do not freeze Ember high in the air. Wait for the real fall and
      // normal 180-degree unstun recovery before the success dialogue.
      if (pvpPracticeEventReady(1000, now) && ember.grounded && !ember.bonked &&
          ember.stunTimer <= 0 && ember.y + ember.h >= CONFIG.groundY - 1) passStep();
      return;
    }
    if (tutorial.pvpBonks > tutorial.pvpPracticeCount) {
      if (pvpPracticeEventReady(1000, now) && !tutorial.resetPending) {
        tutorial.pvpPracticeCount = tutorial.pvpBonks;
        const nextLayout = Math.min(2, tutorial.pvpBonks);
        beginPoofTransition({
          reason: "next-pvp-bonk",
          showFailure: false,
          preserveExistingFlies: true,
          action: () => {
            positionPvpBonkPracticeLayout(nextLayout);
            tutorial.pvpPracticeStartedAt = performance.now();
            tutorial.pvpPlayerAttemptWasAirborne = false;
            clearHeldInput();
          }
        });
      }
      return;
    }
    if (playerLanded && now - tutorial.enteredAt > 450 && !tutorial.resetPending) {
      const completedBonks = tutorial.pvpBonks;
      const completedSetups = tutorial.pvpPracticeCount;
      const layoutIndex = tutorial.pvpPracticeLayoutIndex;
      beginPoofTransition({
        reason:"retry-pvp-bonk-position",
        message:"TRY THE BONK AGAIN",
        showFailure:true,
        preserveExistingFlies:true,
        armFlies:false,
        action:() => {
          positionPvpBonkPracticeLayout(layoutIndex);
          tutorial.pvpBonks = completedBonks;
          tutorial.pvpPracticeCount = completedSetups;
          tutorial.pvpPracticeStartedAt = performance.now();
          tutorial.pvpPlayerAttemptWasAirborne = false;
          tutorial.pvpCaption = "YOUR TURN!";
          tutorial.pvpCaptionUntil = performance.now() + 1200;
          clearHeldInput();
        }
      });
    }
    return;
  }

  if (setup === "pvpBonkCatch") {
    if (tutorial.pvpBonkCatchSucceeded) {
      if (pvpPracticeEventReady(800, now)) passStep();
    } else if (tutorial.pvpBonkCatchArmed && ember.stunTimer <= 0 && !ember.bonked) {
      failAttempt("CATCH THE FLY BEFORE EMBER RECOVERS");
    } else if (playerLanded && !tutorial.pvpBonkCatchArmed && now - tutorial.enteredAt > 450) {
      failAttempt("BONK EMBER, THEN CATCH THE FLY");
    }
    return;
  }

  if (setup === "pvpDropLow" || setup === "pvpDropHigh") {
    if (tutorial.pvpBonks >= 1 && tutorial.pvpLastBonkQuickDrop) {
      if (pvpPracticeEventReady(1000, now)) passStep();
    } else if (tutorial.pvpBonks >= 1 && !tutorial.pvpLastBonkQuickDrop) {
      failAttempt("USE A QUICK PLATFORM DROP FOR THE BONK");
    } else if (playerLanded && now - tutorial.enteredAt > 400) {
      failAttempt("DROP THROUGH THE PLATFORM AND LAND ON EMBER");
    }
    return;
  }

  if (setup === "pvpBufferedBonk") {
    if (tutorial.pvpBufferedBonkSeen) {
      if (pvpPracticeEventReady(1000, now)) passStep();
    } else if (tutorial.pvpBonks >= 1) {
      failAttempt("BUFFER THROUGH THE PLATFORM BEFORE THE BONK");
    } else if (playerLanded && now - tutorial.enteredAt > 500) {
      failAttempt("ONE JUMP: BUFFER THROUGH, THEN BONK EMBER");
    }
    return;
  }

  if (setup === "pvpSkyBonk") {
    if (tutorial.pvpSkyBonkSeen) {
      if (p1.grounded && pvpPracticeEventReady(100, now)) passStep();
    } else if (tutorial.pvpBonks >= 1) {
      failAttempt("JUMP HIGH ABOVE THE MAP BEFORE THE BONK");
    } else if (playerLanded && now - tutorial.enteredAt > 600) {
      failAttempt("LAND YOUR STRONG JUMP ON EMBER");
    }
    return;
  }

  if (setup === "pvpBufferedSky") {
    if (tutorial.pvpSkyBonkSeen && tutorial.pvpBufferedBonkSeen && tutorial.pvpMaximumBonkSeen) {
      if (p1.grounded && pvpPracticeEventReady(100, now) && !p1.tongue?.active && !game.pvpCriticalCatchActive) passStep();
    } else if (tutorial.pvpBonks >= 1) {
      failAttempt("COMBINE A SKY BONK WITH A BUFFERED DROP");
    } else if (playerLanded && now - tutorial.enteredAt > 700) {
      failAttempt("JUMP HIGH, BUFFER THROUGH, THEN BONK");
    }
    return;
  }

  if (setup === "pvpHighGround") {
    if (tutorial.pvpHighGroundBonkSeen && ember.grounded && ember.y + ember.h >= CONFIG.groundY - 1 && pvpPracticeEventReady(900, now)) passStep();
    else if (playerLanded && !tutorial.pvpHighGroundBonkSeen && now - tutorial.enteredAt > 450)
      failAttempt("KNOCK EMBER OFF THE TOP IN ONE JUMP");
    return;
  }

  if (setup === "pvpRecoveryBonk") {
    const recoveryWindowHit = tutorial.pvpBonks >= 2 && tutorial.pvpLastPracticeEventAt > 0 && now - tutorial.pvpLastPracticeEventAt <= 1000;
    if (recoveryWindowHit && pvpPracticeEventReady(300, now)) passStep();
    else if (playerLanded && tutorial.pvpBonks === 0 && now - tutorial.enteredAt > 500) failAttempt("BONK EMBER, TURN AT THE WALL, THEN RETURN");
    return;
  }

  if (setup === "pvpBoostBonk") {
    if (tutorial.pvpBoostedBonkSeen && pvpPracticeEventReady(900, now)) passStep();
    else if (playerLanded && !tutorial.pvpBoostedBonkSeen && now - tutorial.enteredAt > 450)
      failAttempt("REBOUND OFF EMBER BEFORE LANDING");
    return;
  }

  if (setup === "pvpUnderBonkTwo") {
    const center = PARK_PLATFORMS[3];
    const landedOnCenter = p1.grounded && getPvpStandingPlatform(p1) === center;
    if (tutorial.pvpUnderBonks >= 2) {
      if (pvpPracticeEventReady(800, now) && ember.stunTimer <= 0 && ember.grounded && !ember.bonked) passStep();
      return;
    }
    if (tutorial.pvpUnderBonks === 1 && !tutorial.pvpUnderBonkFirstLineShown &&
        ember.stunTimer <= 0 && ember.grounded && !ember.bonked) {
      tutorial.pvpUnderBonkFirstLineShown = true;
      tutorial.pvpUnderBonkPendingSecond = false;
      tutorial.pvpUnderBonkEmberAirborne = false;
      openDynamicDialogue(["Ouch! That first under bonk counted."], "annoyed", false);
      tutorial.scenePositionedDuringDialogue = true; // no poof after the response
      tutorial.pvpLastPracticeEventAt = now - 200;
      return;
    }
    if (tutorial.pvpUnderBonkAttemptAirborne && playerLanded && !landedOnCenter && tutorial.pvpUnderBonks === 0) {
      failAttempt("LAND ON THE LOWER-MIDDLE PLATFORM");
      return;
    }
    // If Ember lands after attempting to jump past P1 without getting under
    // bonked, the attempt really failed; poof both frogs, keeping no progress.
    if (tutorial.pvpUnderBonkPendingSecond && ember.firstJumpMade && !ember.grounded)
      tutorial.pvpUnderBonkEmberAirborne = true;
    if (tutorial.pvpUnderBonkPendingSecond && tutorial.pvpUnderBonkEmberAirborne && ember.grounded &&
        !ember.bonked && ember.stunTimer <= 0 && now - tutorial.pvpLastPracticeEventAt > 600) {
      failAttempt("HOLD YOUR PERCH AND UNDER BONK EMBER");
    }
    return;
  }

  if (setup === "pvpAvoidUnder") {
    if (p1.bonked || p1.stunTimer > 0) {
      failAttempt("USE A QUICK TAP TO STAY LOW");
    } else {
      const platform = PARK_PLATFORMS[3];
      if (p1.x > platform.x + platform.w + 18 && pvpTutorialSettled()) passStep();
    }
    return;
  }

  if (setup === "pvpReboundThree") {
    // Three total successful rebounds, not three *consecutive* rebounds.
    // A missed attempt may reset frog positions but never erase earned counts.
    if (tutorial.pvpReboundCount >= 3) {
      if (pvpTutorialSettled()) passStep();
      return;
    }
    if (tutorial.pvpReboundCount > tutorial.pvpPracticeCount && pvpTutorialSettled() && !tutorial.resetPending) {
      const completed = Math.min(2, tutorial.pvpReboundCount);
      tutorial.pvpPracticeCount = completed;
      beginPoofTransition({
        reason: "next-pvp-rebound",
        showFailure: false,
        preserveExistingFlies: true,
        action: () => {
          positionPvpReboundPracticeLayout(completed);
          tutorial.pvpPlayerAttemptWasAirborne = false;
          tutorial.pvpPracticeStartedAt = performance.now();
          clearHeldInput();
        }
      });
    } else if (playerLanded && tutorial.pvpReboundCount === tutorial.pvpPracticeCount &&
               now - tutorial.enteredAt > 500 && !tutorial.resetPending) {
      const completed = tutorial.pvpReboundCount;
      beginPoofTransition({
        reason: "retry-pvp-rebound-without-losing-progress",
        message: "TRY THE REBOUND AGAIN",
        showFailure: true,
        preserveExistingFlies: true,
        armFlies: false,
        action: () => {
          positionPvp(pvpPlayers[0], 150, CONFIG.groundY-pvpPlayers[0].h, 1);
          positionPvp(pvpPlayers[1], 300, CONFIG.groundY-pvpPlayers[1].h, -1);
          tutorial.pvpReboundCount = completed;
          tutorial.pvpRebounds = completed;
          tutorial.pvpPracticeCount = completed;
          tutorial.pvpPlayerAttemptWasAirborne = false;
          tutorial.pvpPracticeStartedAt = performance.now();
          clearHeldInput();
        }
      });
    }
    return;
  }

  if (setup === "pvpReboundCatch") {
    if (tutorial.pvpTechniqueCatchQualified && tutorial.pvpTechniqueCatchPlayerIndex === 0) {
      if (!game.pvpCriticalCatchActive && p1.grounded && !p1.tongue.active &&
          now - tutorial.pvpTechniqueCatchAt >= 350) passStep();
    } else if (lessonLandings[0]) {
      // Both frogs poof only after the player's attempted jump actually landed.
      failAttempt("REBOUND OFF EMBER, THEN CATCH THE FLY IN ONE JUMP");
    }
    return;
  }

  if (setup === "pvpIntercept") {
    if (tutorial.pvpInterceptSeen) {
      if (p1.grounded && ember.grounded && pvpTutorialSettled()) passStep();
    } else if (lessonLandings[0] || lessonLandings[1]) {
      // The old grounded check fired while Ember merely CHARGED. Only a
      // completed flight without the rebound can now trigger the retry.
      failAttempt("REBOUND EMBER BEFORE HER FLY CATCH");
    }
    return;
  }

  if (setup === "pvpDinnerSteal") {
    if (tutorial.pvpTechniqueCatchQualified && tutorial.pvpTechniqueCatchPlayerIndex === 0) {
      if (!game.pvpCriticalCatchActive && p1.grounded && !p1.tongue.active &&
          now - tutorial.pvpTechniqueCatchAt >= 350) passStep();
    } else if (tutorial.pvpReboundCount > 0 ? lessonLandings[0] : (lessonLandings[0] || lessonLandings[1])) {
      // If the rebound occurred, the *player* gets the entire airborne arc
      // to reach the fly before the poof retry is allowed.
      failAttempt("REBOUND AND STEAL THE FLY BEFORE LANDING");
    }
    return;
  }

  if (setup === "pvpFinalMatch") {
    if (tutorial.pvpFinalMatchStarted && game.state === "won") beginPvpTutorialEnding();
    return;
  }
}

function tutorialMovementLocked() {
  return Boolean(
    tutorial.active &&
    (tutorial.dialogueOpen || tutorial.resetPending || tutorial.frogHidden || tutorial.pvpFrogsHidden ||
      tutorial.passed || tutorial.sceneLandingDelayUntil > performance.now())
  );
}

function updateTutorialAmbient(dt, options = {}) {
  const safeDt = Math.max(0, Math.min(0.1, Number(dt) || 0));
  if (safeDt <= 0 || game.state === "paused" || game.state === "countdown") return;
  game.visualTime += safeDt;
  game.worldTime += safeDt;
  game.messageTimer += safeDt;
  frog.catchSparkleTimer = Math.max(0, frog.catchSparkleTimer - safeDt);
  frog.wrongCatchBubbleTimer = Math.max(0, frog.wrongCatchBubbleTimer - safeDt);
  frog.landingSquash = Math.max(0, frog.landingSquash - safeDt * 4.5);
  // Even carryover flies remain animated while Ember is speaking after a
  // spit-out. They are untouchable, but should never appear frozen.
  if (options.animateFlies !== false) animateFlies(safeDt);
}

function clearUnrelatedPvpTutorialFlies() {
  if (!tutorial.active || tutorial.kind !== "pvp" || tutorialStep()?.setup === "pvpFinalMatch") return;
  game.spawnQueue.length = 0;
  for (let index = flies.length - 1; index >= 0; index -= 1) {
    if (!flies[index]?.tutorialAuthored) flies.splice(index, 1);
  }
}

function updateTutorial() {
  if (!tutorial.active) return;
  if (tutorial.deferredPoofOptions) {
    const activeImpact = Array.isArray(game.pvpImpactEffects) &&
      game.pvpImpactEffects.some((effect) => Number(effect?.elapsed || 0) < Number(effect?.duration || .4));
    if (!activeImpact) {
      const deferred = tutorial.deferredPoofOptions;
      tutorial.deferredPoofOptions = null;
      beginPoofTransition(deferred);
    }
  }
  if (game.state === "paused" || game.state === "countdown") return;

  if (tutorial.resetPending) {
    if (performance.now() >= tutorial.resetAt) completePendingReset();
    return;
  }
  clearUnrelatedPvpTutorialFlies();
  updatePvpFlyReveal();
  // Tutorial flies and the English clue must always describe the SAME target,
  // including after chapter navigation, retry poofs, and rebound demo resets.
  // A queued reveal is respected; already-visible flies are never hidden again.
  if (tutorial.kind === "pvp") {
    // An armed, on-screen fly always has a matching English clue, EVEN while
    // Ember explains the move or a completed scene is transitioning. This
    // applies to both authored practice flies and the live final match.
    const visible = flies.filter((fly) => fly && fly.state !== "eaten" && Number.isInteger(fly.vocabIndex));
    if (visible.length && !visible.some((fly) => Number(fly.vocabIndex) === game.targetVocabIndex)) {
      setPrompt(visible[0].vocabIndex);
    }
    if (visible.length) tutorial.promptHidden = false;
  }
  if (tutorial.pvpDemoActive) {
    updatePvpDemonstration();
    return;
  }
  if (tutorial.dialogueOpen) return;
  if (["main", "title", "setup", "friendsLogin"].includes(game.state)) {
    finish(false);
    return;
  }

  if (tutorial.passed) {
    if (performance.now() - tutorial.passAt > 350) nextStep();
    return;
  }

  if (tutorial.kind === "pvp") {
    if (PVP_STEPS[tutorial.step]?.setup !== "pvpFinalMatch") game.spawnQueue.length = 0;
    monitorPvp();
  } else {
    if (SOLO_STEPS[tutorial.step]?.setup !== "normalRound") game.spawnQueue.length = 0;
    monitorSolo();
  }
}
