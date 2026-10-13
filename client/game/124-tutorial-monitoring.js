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
  if (setup === "comboThree" && attemptEnded && (tongue.active || game.soloCriticalCatchActive)) {
    tutorial.attemptEnded = false;
    return;
  }
  const landedThisFrame = !tutorial.wasGroundedLastFrame && frog.grounded;
  if (landedThisFrame) {
    tutorial.bufferedJumpWindowOpenedAt = now;
    if (setup === "bufferJumpCharge") {
      tutorial.bufferedJumpChainCount = game.buttonHeld ? 1 : 0;
      if (tutorial.jumpAttempts >= 1 && !game.buttonHeld) {
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
    if (!attemptEnded) return;
    const success = tutorial.maxCatchesOneJump >= 2 &&
      tutorial.catchEvents.length >= 2 &&
      tutorial.catchEvents.slice(0, 2).every(Boolean);
    if (success) passStep();
    else failAttempt("CATCH TWO MATCHING FLIES BEFORE LANDING");
    return;
  }

  if (setup === "comboThree") {
    if (!attemptEnded) return;
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
    const platform = getPvpStandingPlatform(p1);
    if (platform && !platform.ground && ember.grounded && ember.stunTimer <= 0 && !ember.bonked &&
        now - tutorial.pvpLastPracticeEventAt > 1050 && !ember.charging && !ember.inputHeld) {
      tutorial.pvpLastPracticeEventAt = now;
      ember.dir = p1.x + p1.w / 2 >= ember.x + ember.w / 2 ? 1 : -1;
      if (tutorial.pvpUnderBonks > 0 && Math.abs(ember.x - 80) > 2) {
        // Only Ember returns to the approach lane; the player's perch and
        // completed under-bonk count remain untouched.
        beginPoofTransition({ reason:"under-bonk-return", showFailure:false,
          preserveExistingFlies:true, armFlies:false, pvpPoofPlayers:[1],
          action:() => { positionPvp(ember,80,CONFIG.groundY-ember.h,1); tutorial.pvpLastPracticeEventAt=performance.now(); }
        });
      } else scriptPvpChargedJump(1, .78, ember.dir, 0);
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
      ember.dir = 1;
      scriptPvpChargedJump(1, setup === "pvpDinnerSteal" ? .68 : .72, 1, 0);
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
  drivePvpPracticeCpu(setup, now);
  const playerLanded = consumePvpPlayerLanding();

  if (setup === "pvpBonkThree") {
    if (tutorial.pvpBonks >= 3) {
      if (pvpPracticeEventReady(1000, now)) passStep();
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
      failAttempt("CHARGE, BUFFER THROUGH, THEN BONK EMBER");
    }
    return;
  }

  if (setup === "pvpSkyBonk") {
    if (tutorial.pvpSkyBonkSeen) {
      if (pvpPracticeEventReady(1000, now)) passStep();
    } else if (tutorial.pvpBonks >= 1) {
      failAttempt("JUMP HIGH ABOVE THE MAP BEFORE THE BONK");
    } else if (playerLanded && now - tutorial.enteredAt > 600) {
      failAttempt("LAND YOUR STRONG JUMP ON EMBER");
    }
    return;
  }

  if (setup === "pvpBufferedSky") {
    if (tutorial.pvpSkyBonkSeen && tutorial.pvpBufferedBonkSeen && tutorial.pvpMaximumBonkSeen) {
      if (pvpPracticeEventReady(1000, now)) passStep();
    } else if (tutorial.pvpBonks >= 1) {
      failAttempt("COMBINE A SKY BONK WITH A BUFFERED DROP");
    } else if (playerLanded && now - tutorial.enteredAt > 700) {
      failAttempt("JUMP HIGH, BUFFER THROUGH, THEN BONK");
    }
    return;
  }

  if (setup === "pvpHighGround") {
    if (tutorial.pvpHighGroundBonkSeen && ember.grounded && ember.y + ember.h >= CONFIG.groundY - 1 && pvpPracticeEventReady(1000, now)) passStep();
    // The lower-middle start needs a wall approach and a second jump back.
    // Landing on the way is not a failed attempt; keep the route continuous.
    return;
  }

  if (setup === "pvpRecoveryBonk") {
    if (tutorial.pvpBonks >= 2 && pvpPracticeEventReady(1000, now)) passStep();
    else if (playerLanded && tutorial.pvpBonks === 0 && now - tutorial.enteredAt > 500) failAttempt("BONK EMBER, TURN AT THE WALL, THEN RETURN");
    return;
  }

  if (setup === "pvpBoostBonk") {
    if (tutorial.pvpBoostedBonkSeen && pvpPracticeEventReady(1000, now)) passStep();
    else if (tutorial.pvpEmberLaunchStarted && ember.grounded && now - tutorial.pvpEmberJumpScheduledAt > 2600 && !tutorial.pvpBoostedBonkSeen) {
      failAttempt("BONK EMBER AS HER MAX-CHARGE JUMP BEGINS");
    }
    return;
  }

  if (setup === "pvpUnderBonkTwo") {
    if (tutorial.pvpUnderBonks >= 2 && pvpPracticeEventReady(1000, now)) passStep();
    return;
  }

  if (setup === "pvpAvoidUnder") {
    if (p1.bonked || p1.stunTimer > 0) {
      failAttempt("USE A QUICK TAP TO STAY LOW");
    } else {
      const platform = PARK_PLATFORMS[2];
      if (p1.x > platform.x + platform.w + 18 && pvpTutorialSettled()) passStep();
    }
    return;
  }

  if (setup === "pvpReboundThree") {
    if (tutorial.pvpReboundCount >= 3) {
      if (pvpTutorialSettled()) passStep();
      return;
    }
    if (tutorial.pvpReboundCount > tutorial.pvpPracticeCount && pvpTutorialSettled() && !tutorial.resetPending) {
      tutorial.pvpPracticeCount = tutorial.pvpReboundCount;
      const layouts = [[110,300],[285,140],[150,315]];
      const layout = layouts[Math.min(layouts.length - 1, tutorial.pvpReboundCount)] || layouts[0];
      beginPoofTransition({
        reason: "next-pvp-rebound",
        showFailure: false,
        preserveExistingFlies: true,
        action: () => {
          const playerDirection = layout[0] < layout[1] ? 1 : -1;
          positionPvp(p1, layout[0], CONFIG.groundY - p1.h, playerDirection);
          positionPvp(ember, layout[1], CONFIG.groundY - ember.h, -playerDirection);
          tutorial.pvpMirrorWasHeld = false;
        }
      });
    } else if (playerLanded && tutorial.pvpReboundCount === tutorial.pvpPracticeCount && now - tutorial.enteredAt > 500) {
      failAttempt("MEET EMBER SIDE-TO-SIDE IN THE AIR");
    }
    return;
  }

  if (setup === "pvpReboundCatch") {
    if (tutorial.pvpReboundCount >= 1 && tutorial.pvpPracticeCatchCount >= 1 && pvpTutorialSettled()) passStep();
    else if (playerLanded && tutorial.pvpPracticeCatchCount < 1 && now - tutorial.enteredAt > 600) failAttempt("REBOUND OFF EMBER, THEN CATCH THE FLY");
    return;
  }

  if (setup === "pvpIntercept") {
    if (tutorial.pvpPracticeCatchCount > 0 && !tutorial.pvpInterceptSeen) failAttempt("REBOUND EMBER BEFORE SHE REACHES THE FLY");
    else if (tutorial.pvpInterceptSeen && pvpTutorialSettled()) passStep();
    else if (ember.grounded && tutorial.pvpEmberLaunchStarted && now - tutorial.pvpEmberJumpScheduledAt > 2600 && !tutorial.pvpInterceptSeen) failAttempt("INTERCEPT EMBER BEFORE THE FLY");
    return;
  }

  if (setup === "pvpDinnerSteal") {
    if (tutorial.pvpPracticeCatchCount > 0 && tutorial.pvpReboundCount < 1) failAttempt("TURN EMBER AWAY, THEN TAKE THE FLY");
    else if (tutorial.pvpReboundCount >= 1 && tutorial.pvpPracticeCatchCount >= 1 && pvpTutorialSettled()) passStep();
    else if (ember.grounded && tutorial.pvpEmberLaunchStarted && now - tutorial.pvpEmberJumpScheduledAt > 3000 && tutorial.pvpPracticeCatchCount < 1) failAttempt("REBOUND, THEN STEAL THE FLY");
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
  if (options.animateFlies !== false) {
    const frozenCarryovers = flies
      .filter((currentFly) => currentFly?.tutorialCarryover)
      .map((currentFly) => ({ currentFly, x:currentFly.baseX, y:currentFly.baseY }));
    animateFlies(safeDt);
    for (const frozen of frozenCarryovers) {
      frozen.currentFly.phase = 0;
      frozen.currentFly.x = frozen.x;
      frozen.currentFly.y = frozen.y;
      frozen.currentFly.baseX = frozen.x;
      frozen.currentFly.baseY = frozen.y;
    }
  }
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
