// Ribbit Race tutorial responsibility: 123 tutorial lifecycle
function configureStep(showDialogue = true, options = {}) {
  const preservedVisualPose = options.preserveVisualPose || null;
  const preservedPvpVisualPoses = Array.isArray(options.preservePvpVisualPoses)
    ? options.preservePvpVisualPoses
    : null;
  // A scene change must never inherit stale smoke, hidden frogs, or a queued
  // mid-poof callback from the prior scene.
  tutorial.deferredPoofOptions = null;
  tutorial.resetPending = false;
  tutorial.resetAt = 0;
  tutorial.resetAction = null;
  tutorial.resetMessage = "";
  tutorial.resetReason = "";
  tutorial.preservePromptDuringReset = false;
  tutorial.frogHidden = false;
  tutorial.pvpFrogsHidden = false;
  tutorial.pvpHiddenPlayerIndex = null;
  tutorial.pvpHiddenPlayerIndices = [];
  tutorial.pvpDemoActive = false;
  tutorial.pvpPlayerScriptLocked = false;
  tutorial.pvpAwaitRecoveryAdvance = false;
  tutorial.pendingPvpVisualPoses = null;
  tutorial.dialogueHiddenDuringPoof = false;
  tutorial.resetPvpPoofPlayers = [0, 1];
  tutorial.smokeClouds.length = 0;
  try { window.RibbitRaceResetFinalCatchLabels?.(); } catch (_) {}
  if (tutorial.kind === "pvp") configurePvpStep(tutorial.step);
  else configureSoloStep(tutorial.step);

  tutorial.pendingStartPose = captureControlledPose();
  tutorial.pendingPvpTargetPoses = tutorial.kind === "pvp" ? capturePvpTutorialPoses() : null;

  // PvP scene dialogue is delivered over the completed prior pose. The next
  // authored setup does not move either frog until the final dialogue line has
  // closed and the scripted poof begins.
  if (tutorial.kind === "pvp" && preservedPvpVisualPoses) {
    applyPvpTutorialPoses(preservedPvpVisualPoses);
    tutorial.pendingPvpVisualPoses = preservedPvpVisualPoses;
    freezeControlledEntity();
  } else if (preservedVisualPose) {
    applyControlledPose(preservedVisualPose);
    freezeControlledEntity();
  }

  tutorial.dialogueOpen = false;
  tutorial.dialoguePointerId = null;
  tutorial.blockJumpUntilRelease = false;
  if (showDialogue) clearPvpCaptionForDialogue();

  // These two authored transitions explicitly poof before Ember refers to the
  // new height/perch. The text begins one second after both frogs reappear.
  const prePoofBeforeDialogue = Boolean(
    showDialogue && tutorial.kind === "pvp" &&
    ["pvpBonkThree", "pvpBonkCatch", "pvpDemoDropLow", "pvpDropLow", "pvpDemoDropHigh", "pvpDropHigh", "pvpDemoBufferedBonk", "pvpDemoHighGround", "pvpSkyBonk"].includes(tutorialStep()?.setup)
  );
  if (prePoofBeforeDialogue && preservedPvpVisualPoses && pvpAtIntendedPositions(tutorial.pendingPvpTargetPoses)) {
    // The authored start and displayed pose are identical. Show the first
    // line immediately without hiding/reappearing either frog.
    tutorial.pendingPvpVisualPoses = null;
    tutorial.pendingPvpTargetPoses = null;
    openDialogue();
    tutorial.scenePositionedDuringDialogue = true;
  } else if (prePoofBeforeDialogue && preservedPvpVisualPoses) {
    tutorial.dialogueOpen = true;
    tutorial.scenePositionedDuringDialogue = false;
    // The high-drop joke must begin a full second AFTER the new positions
    // poof in, not a few hundred milliseconds later. No textbox or text is
    // drawn during the pause, and fast-forward cannot bypass it.
    const postPoofDialogueHoldMs = tutorialStep()?.setup === "pvpDemoDropHigh"
      ? 1000 : tutorialStep()?.setup === "pvpSkyBonk" ? 500 : 300;
    beginDialogueLine(0, { delayMs:POOF_TRANSITION_MS + postPoofDialogueHoldMs, holdPreviousText:false });
    tutorial.transitionHeldLineText = "";
    tutorial.transitionHeldPortraitKey = "";
    tutorial.dialogueHeldLineText = "";
    tutorial.dialogueHeldPortraitKey = "";
    tutorial.dialogueHeldUntil = 0;
    game.state = "playing";
    game.pauseHelpOpen = false;
    beginPoofTransition({
      reason:"pvp-authored-poof-before-dialogue",
      showFailure:false,
      preserveExistingFlies:false,
      armFlies:false,
      action:() => {
        applyPvpTutorialPoses(tutorial.pendingPvpTargetPoses);
        tutorial.pendingStartPose = null;
        tutorial.pendingPvpTargetPoses = null;
        tutorial.scenePositionedDuringDialogue = true;
        tutorial.enteredAt = performance.now();
      }
    });
  } else if (showDialogue && tutorial.kind === "solo" && tutorialStep()?.setup === "threeCatches") {
    // The fly appears with the poof; *then* Ember says dinner is ready.
    // Chapter navigation and normal progression share this ordering.
    tutorial.dialogueOpen = true;
    beginDialogueLine(0, { delayMs: POOF_TRANSITION_MS + FLY_DIALOGUE_REVEAL_HOLD_MS, holdPreviousText:false });
    game.state = "playing";
    const targetPose = tutorial.pendingStartPose;
    if (!beginPoofTransition({
      reason:"solo-first-fly-before-dinner",
      showFailure:false,
      preserveExistingFlies:false,
      action:() => {
        applyControlledPose(targetPose);
        tutorial.pendingStartPose = null;
        tutorial.scenePositionedDuringDialogue = true;
        tutorial.enteredAt = performance.now();
      }
    })) {
      applyControlledPose(targetPose);
      armTutorialFlies();
      beginDialogueLine(0, {delayMs:FLY_DIALOGUE_REVEAL_HOLD_MS,holdPreviousText:false});
    }
  } else if (showDialogue) {
    tutorial.transitionHeldLineText = "";
    tutorial.transitionHeldPortraitKey = "";
    openDialogue();
  } else {
    restoreStepSequence();
    armTutorialFlies();
    tutorial.enteredAt = performance.now();
    game.state = "playing";
    game.pauseHelpOpen = false;
  }
}

function pvpAtIntendedPositions(poses, tolerance = 1) {
  if (!Array.isArray(poses) || poses.length < 2) return false;
  return poses.slice(0,2).every((pose, index) => {
    const player = pvpPlayers[index];
    return player && pose &&
      Math.abs(Number(player.x) - Number(pose.x)) <= tolerance &&
      Math.abs(Number(player.y) - Number(pose.y)) <= tolerance;
  });
}

function addTutorialPoof(x, y, kind = "out") {
  tutorial.smokeClouds.push({
    x: Math.round(x),
    y: Math.round(y),
    kind,
    born: performance.now()
  });
  if (tutorial.smokeClouds.length > 8) tutorial.smokeClouds.splice(0, tutorial.smokeClouds.length - 8);
}

function playTutorialPoofSound(kind = "out") {
  if (kind === "out") {
    tone(310, .07, .018, -170);
    tone(150, .10, .012, -65, .025);
  } else {
    tone(190, .07, .014, 165);
    tone(480, .08, .012, 105, .025);
  }
}

// Visual-only despawn: remove a tutorial fly from collision/scoring instantly,
// but let a small shrinking sprite and pixel sparkles fade out for 0.48 s.
// Never despawn/clone a carryover fly that an authored retry preserves.
function despawnTutorialFlies(options = {}) {
  if (!tutorial.active || !Array.isArray(flies)) return 0;
  if (!Array.isArray(tutorial.flyDespawnEffects)) tutorial.flyDespawnEffects = [];
  const now = performance.now();
  const survivors = [];
  let count = 0;
  for (const fly of flies) {
    const selected = fly && (options.onlyUnrelated ? !fly.tutorialAuthored :
      (options.all || fly.tutorialAuthored));
    const preserve = options.preserveKeys instanceof Set &&
      options.preserveKeys.has(tutorialFlyKey(fly));
    if (!selected || preserve || (!options.onlyUnrelated && !options.all && fly.tutorialArmed === false)) {
      survivors.push(fly);
      continue;
    }
    if (fly.state === "active" && (options.all || fly.tutorialArmed !== false)) {
      const x = Number(fly.x ?? fly.baseX), y = Number(fly.y ?? fly.baseY);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        tutorial.flyDespawnEffects.push({ x, y, born:now, vocabIndex:fly.vocabIndex });
        if (tutorial.flyDespawnEffects.length > 20) tutorial.flyDespawnEffects.shift();
      }
    }
    count++;
  }
  if (count) {
    flies.splice(0, flies.length, ...survivors);
    clearLabelCaches();
  }
  return count;
}

function drawTutorialFlyDespawnEffects(now = performance.now()) {
  const effects = tutorial.flyDespawnEffects;
  if (!Array.isArray(effects) || effects.length === 0) return;
  tutorial.flyDespawnEffects = effects.filter((effect) => now - effect.born < 480);
  ctx.save();
  for (const effect of tutorial.flyDespawnEffects) {
    const progress = clamp((now - effect.born) / 480, 0, 1);
    const fade = Math.max(0, 1 - progress);
    const scale = Math.max(0.01, 1 - progress * 0.9);
    ctx.globalAlpha = fade;
    if (progress < 0.72) drawFlyAt(effect.x, effect.y - progress * 5, scale);
    // Pixel debris expands as the fly shrinks, then fades away entirely.
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 2 * i / 8;
      const radius = 3 + 13 * progress + (i % 3);
      const x = Math.round(effect.x + Math.cos(angle) * radius);
      const y = Math.round(effect.y + Math.sin(angle) * radius * 0.75);
      const size = progress < 0.55 ? 3 : 2;
      ctx.fillStyle = i % 2 ? "#f6e185" : "#ccfaff";
      ctx.fillRect(x, y, size, size);
    }
  }
  ctx.restore();
}

function beginPoofTransition(options = {}) {
  if (!tutorial.active || tutorial.resetPending) return false;
  if (tutorial.kind === "pvp" && tutorial.deferredPoofOptions && !options.force) return true;
  const activeImpact = tutorial.kind === "pvp" && Array.isArray(game.pvpImpactEffects) &&
    game.pvpImpactEffects.some((effect) => Number(effect?.elapsed || 0) < Number(effect?.duration || .4));
  // Let the full rebound/bonk impact play before smoke covers or freezes it.
  if (activeImpact && options.waitForEffects !== false && !options.force) {
    tutorial.deferredPoofOptions = { ...options, force:true };
    clearHeldInput();
    return true;
  }

  const pvpPoofPlayers = tutorial.kind === "pvp"
    ? (Array.isArray(options.pvpPoofPlayers) ? [...new Set(options.pvpPoofPlayers.map(Number).filter((index) => index === 0 || index === 1))] : [0, 1])
    : [];
  tutorial.resetPvpPoofPlayers = pvpPoofPlayers;
  tutorial.pvpHiddenPlayerIndices = pvpPoofPlayers.slice();
  tutorial.pvpFrogsHidden = tutorial.kind === "pvp" && pvpPoofPlayers.length >= 2;

  const entity = controlledTutorialEntity();
  if (tutorial.kind !== "pvp" || pvpPoofPlayers.includes(0)) {
    const oldX = Number(entity?.x || 0);
    const oldY = Number(entity?.y || 0);
    addTutorialPoof(
      oldX + Number(entity?.w || frog.w) / 2,
      oldY + Number(entity?.h || frog.h) / 2,
      "out"
    );
  }
  if (tutorial.kind === "pvp" && pvpPlayers[1] && pvpPoofPlayers.includes(1)) {
    addTutorialPoof(
      Number(pvpPlayers[1].x || 0) + Number(pvpPlayers[1].w || frog.w) / 2,
      Number(pvpPlayers[1].y || 0) + Number(pvpPlayers[1].h || frog.h) / 2,
      "out"
    );
  }
  playTutorialPoofSound("out");
  resetTutorialTongue();
  if (tutorial.kind === "pvp") resetPvpTutorialTongues();
  try { clearFrogAfterimages(entity); } catch (_) {}
  if (tutorial.kind === "pvp") {
    for (const [index, player] of pvpPlayers.entries()) {
      if (!pvpPoofPlayers.includes(index)) continue;
      try { clearFrogAfterimages(player); } catch (_) {}
    }
  }

  tutorial.resetPending = true;
  tutorial.resetAt = performance.now() + POOF_TRANSITION_MS;
  tutorial.resetMessage = String(options.message || "");
  tutorial.resetAction = typeof options.action === "function" ? options.action : null;
  tutorial.resetShowFailure = options.showFailure !== false;
  tutorial.resetArmFlies = options.armFlies !== false;
  tutorial.resetPreserveFlyKeys = options.preserveExistingFlies
    ? collectVisibleTutorialFlyKeys()
    : null;
  tutorial.resetReason = String(options.reason || "reset");
  tutorial.preservePromptDuringReset = options.preservePrompt === true;
  tutorial.frogHidden = tutorial.kind !== "pvp" || pvpPoofPlayers.includes(0);
  tutorial.goalHovered = false;
  clearHeldInput();
  freezeControlledEntity();
  return true;
}

function rebuildCurrentScenarioForRetry() {
  if (tutorial.kind === "pvp") {
    clearPvpScriptActions();
    tutorial.pvpDemoActive = false;
    tutorial.pvpDemoBegun = false;
    configurePvpStep(tutorial.step);
    tutorial.pendingPvpTargetPoses = capturePvpTutorialPoses();
  } else configureSoloStep(tutorial.step);
  tutorial.pendingStartPose = captureControlledPose();
  tutorial.dialogueOpen = false;
  tutorial.dialoguePointerId = null;
  tutorial.blockJumpUntilRelease = false;
  restoreStepSequence();
  game.pauseHelpOpen = false;
  game.state = "playing";
}

function rebuildCurrentScenarioWithDialogue() {
  if (tutorial.kind === "pvp") {
    clearPvpScriptActions();
    tutorial.pvpDemoActive = false;
    tutorial.pvpDemoBegun = false;
    tutorial.pvpCaption = "";
    configurePvpStep(tutorial.step);
    tutorial.pendingPvpTargetPoses = capturePvpTutorialPoses();
  } else configureSoloStep(tutorial.step);
  tutorial.pendingStartPose = captureControlledPose();
  tutorial.dynamicDialogueLines = null;
  tutorial.dynamicPortraitKey = "";
  tutorial.postSuccessAdvance = false;
  tutorial.successDialogueShown = false;
  tutorial.blockJumpUntilRelease = false;
  restoreStepSequence();
  openDialogue();
}

function restartTutorialSceneImmediately() {
  if (!tutorial.active) return false;
  // Interrupt any in-progress or deferred poof BEFORE it can fire a stale
  // callback. This also handles Restart Scene while a prior reset was paused.
  tutorial.deferredPoofOptions = null;
  tutorial.resetPending = false;
  tutorial.resetAt = 0;
  tutorial.resetAction = null;
  tutorial.resetMessage = "";
  tutorial.resetReason = "";
  tutorial.resetShowFailure = true;
  tutorial.resetArmFlies = true;
  tutorial.resetPreserveFlyKeys = null;
  tutorial.preservePromptDuringReset = false;
  tutorial.resetPvpPoofPlayers = [0, 1];
  tutorial.pvpFrogsHidden = false;
  tutorial.pvpHiddenPlayerIndices = [];
  tutorial.frogHidden = false;
  tutorial.dialogueHiddenDuringPoof = false;
  tutorial.smokeClouds.length = 0;
  tutorial.pendingStartPose = null;
  tutorial.pendingPvpTargetPoses = null;
  tutorial.pendingPvpVisualPoses = null;
  tutorial.pauseChapterPreviewIndex = null;
  tutorial.chapterNavigationPending = false;
  tutorial.pvpFlyRevealAt = 0;
  tutorial.pvpFlyRevealSetup = "";
  clearPvpScriptActions();
  clearHeldInput();
  if (tutorial.kind === "pvp") {
    resetPvpTutorialTongues();
    if (Array.isArray(game.pvpImpactEffects)) game.pvpImpactEffects.length = 0;
  }
  // Both scenario configurators clear their own state, so rebuild only once.
  // Reset the paused clock here too for any API-based scene retry.
  try { if (typeof tutorialClockSuspendedAt !== "undefined") tutorialClockSuspendedAt = null; } catch (_) {}
  rebuildCurrentScenarioWithDialogue();
  game.pauseChargeSnapshot = null;
  game.resumeChargeAfterCountdown = false;
  game.pauseHelpOpen = false;
  game.state = "playing";
  return true;
}

function beginScenarioEntryTransition() {
  const intendedStartPose = tutorial.pendingStartPose || captureControlledPose();
  const intendedPvpPoses = tutorial.pendingPvpTargetPoses;
  const setup = tutorialStep()?.setup || "";
  if (tutorial.kind === "pvp" && pvpAtIntendedPositions(intendedPvpPoses)) {
    tutorial.pendingStartPose = null;
    tutorial.pendingPvpTargetPoses = null;
    tutorial.pendingPvpVisualPoses = null;
    restoreStepSequence();
    tutorial.pvpCaption = "YOUR TURN!";
    tutorial.pvpCaptionUntil = performance.now() + 1600;
    schedulePvpFlyReveal(setup, pvpFlyRevealDelayMs(setup));
    if (["pvpReboundCatch", "pvpIntercept"].includes(setup)) tutorial.promptHidden = false;
    tutorial.enteredAt = performance.now();
    return;
  }
  beginPoofTransition({
    reason: "scene-entry",
    showFailure: false,
    preserveExistingFlies: false,
    armFlies: tutorial.kind !== "pvp",
    action: () => {
      if (tutorial.kind === "pvp") {
        if (Array.isArray(intendedPvpPoses)) applyPvpTutorialPoses(intendedPvpPoses);
        else configurePvpStep(tutorial.step);
        tutorial.pendingPvpTargetPoses = null;
        tutorial.pendingPvpVisualPoses = null;
        restoreStepSequence();
        tutorial.pvpCaption = "YOUR TURN!";
        tutorial.pvpCaptionUntil = performance.now() + 1600;
        schedulePvpFlyReveal(setup, pvpFlyRevealDelayMs(setup));
        if (["pvpReboundCatch", "pvpIntercept"].includes(setup)) tutorial.promptHidden = false;
      } else {
        applyControlledPose(intendedStartPose);
        restoreStepSequence();
        if (setup === "wrongFly") tutorial.promptHidden = false;
      }
      tutorial.pendingStartPose = null;
      tutorial.enteredAt = performance.now();
    }
  });
}

function completePendingReset() {
  if (!tutorial.resetPending) return;
  const action = tutorial.resetAction;
  const message = tutorial.resetMessage || "TRY AGAIN";
  const showFailure = tutorial.resetShowFailure;
  const armFlies = tutorial.resetArmFlies;
  const preserveFlyKeys = tutorial.resetPreserveFlyKeys;
  const preservePrompt = tutorial.preservePromptDuringReset;
  const completedResetReason = tutorial.resetReason;

  tutorial.resetPending = false;
  tutorial.resetAt = 0;
  tutorial.resetMessage = "";
  tutorial.resetAction = null;
  tutorial.resetShowFailure = true;
  tutorial.resetArmFlies = true;
  tutorial.resetPreserveFlyKeys = null;
  tutorial.resetReason = "";
  tutorial.preservePromptDuringReset = false;

  try {
    if (action) action();
    else rebuildCurrentScenarioForRetry();
  } catch (error) {
    console.warn("Ribbit Race tutorial reset recovered", error);
    rebuildCurrentScenarioForRetry();
  }

  resetTutorialTongue();
  if (tutorial.kind === "pvp") resetPvpTutorialTongues();
  clearTutorialCarryoverFlies();
  if (armFlies) {
    const setup = tutorialStep()?.setup || "";
    if (tutorial.kind === "pvp" && pvpFlyRevealDelayMs(setup) > 0) {
      schedulePvpFlyReveal(setup);
    } else {
      armTutorialFlies({ preserveKeys: preserveFlyKeys });
    }
  }
  if (preservePrompt || (tutorial.kind === "pvp" && flies.some((fly) => fly?.tutorialAuthored && fly.state === "active" && fly.tutorialArmed))) tutorial.promptHidden = false;
  const resetPoofPlayers = Array.isArray(tutorial.resetPvpPoofPlayers) ? tutorial.resetPvpPoofPlayers : [0, 1];
  tutorial.frogHidden = false;
  tutorial.pvpFrogsHidden = false;
  tutorial.pvpHiddenPlayerIndices = [];
  freezeControlledEntity();
  const entity = controlledTutorialEntity();
  if (tutorial.kind !== "pvp" || resetPoofPlayers.includes(0)) {
    addTutorialPoof(
      Number(entity?.x || 0) + Number(entity?.w || frog.w) / 2,
      Number(entity?.y || 0) + Number(entity?.h || frog.h) / 2,
      "in"
    );
  }
  if (tutorial.kind === "pvp" && pvpPlayers[1] && resetPoofPlayers.includes(1)) {
    addTutorialPoof(
      Number(pvpPlayers[1].x || 0) + Number(pvpPlayers[1].w || frog.w) / 2,
      Number(pvpPlayers[1].y || 0) + Number(pvpPlayers[1].h || frog.h) / 2,
      "in"
    );
  }
  tutorial.resetPvpPoofPlayers = [0, 1];
  playTutorialPoofSound("in");

  if (showFailure) {
    tutorial.failureText = message;
    tutorial.failureFlashStartedAt = performance.now();
    tutorial.failureMessageUntil = tutorial.failureFlashStartedAt + tutorial.failureFlashDuration;
  }
  tutorial.enteredAt = performance.now();
  game.state = "playing";
  game.pauseHelpOpen = false;
  // Tutorial retries replay Ember's scene dialogue and return without a
  // countdown. Ordinary game restarts still use the normal 3-2-1 flow.
}

function failAttempt(message) {
  if (!tutorial.active || tutorial.passed || tutorial.resetPending) return;
  const setup = tutorialStep()?.setup || "";
  const emberStaysPut = tutorial.kind === "pvp" &&
    PVP_RETRY_EMBER_STATIONARY_SETUPS.has(setup);
  const emberPose = emberStaysPut ? capturePvpTutorialPoses()?.[1] : null;
  const retainedFlyObjects = setup === "pvpReboundCatch"
    ? flies.filter((fly) => fly?.tutorialAuthored && fly.state === "active" && fly.tutorialArmed !== false)
    : [];
  beginPoofTransition({
    reason: "failed-attempt",
    message: message || "TRY AGAIN",
    showFailure: true,
    preserveExistingFlies: true,
    preservePrompt: true,
    pvpPoofPlayers: emberStaysPut ? [0] : [0, 1],
    action: () => {
      rebuildCurrentScenarioForRetry();
      if (retainedFlyObjects.length) {
        // configurePvpStep may rebuild its list, but visible authored flies
        // remain the SAME objects/IDs and stay fully grown across the poof.
        flies.length = 0;
        for (const fly of retainedFlyObjects) {
          fly.spawnAge = Math.max(Number(fly.spawnAge) || 0, CONFIG.flySpawnEffectDuration + CONFIG.flyGrowDuration + 0.1);
          flies.push(fly);
          nextFlyId = Math.max(nextFlyId, Number(fly.id) + 1);
        }
      }
      if (emberPose && pvpPlayers[1]) applyControlledPose(emberPose, pvpPlayers[1]);
    }
  });
}

function finalizePassedStep() {
  if (!tutorial.active || tutorial.passed) return;
  const step = tutorialStep();
  tutorial.passPending = false;
  tutorial.passPendingAt = 0;
  // An unused chapter fly (particularly in the intercept lesson) leaves with
  // an animated exit before Ember starts the next explanation.
  despawnTutorialFlies();
  if (!tutorial.successDialogueShown && Array.isArray(step?.successDialogue) && step.successDialogue.length) {
    tutorial.successDialogueShown = true;
    // PvP success may open while the *victim* is still falling. Do not erase
    // the victim's current airborne velocity before opening voiced dialogue;
    // the dialogue-only physics branch will complete the landing and recovery.
    if (tutorial.kind === "pvp") clearHeldInput();
    else freezeControlledEntity();
    openDynamicDialogue(step.successDialogue,
      ["pvpDropHigh", "pvpSkyBonk", "pvpBufferedSky"].includes(step.setup) ? "dazed" : (step.portrait || "thumbsup"), true);
    tone(620, .07, .018, 85);
    return;
  }
  tutorial.passed = true;
  tutorial.passAt = performance.now();
  freezeControlledEntity();
  tone(620, .07, .018, 85);
}

function passStep() {
  if (!tutorial.active || tutorial.passed || tutorial.passPending) return;
  // Techniques such as wall rebounds can succeed in mid-air. Let the real
  // engine finish the landing before Ember freezes the pose for dialogue.
  // Exception: sky-bonk lessons start the next SPOKEN line when the attacker
  // lands, with the victim still completing their legitimate five-second stun
  // and upright recovery behind the dialogue. Waiting for !victim.bonked
  // here would silently reintroduce the five-second narration delay.
  const skyBonkLandingDialogue = tutorial.kind === "pvp" &&
    ["pvpDemoSkyBonk", "pvpSkyBonk", "pvpDemoBufferedSky", "pvpBufferedSky"].includes(tutorialStep()?.setup);
  if ((tutorial.kind === "solo" && (!frog.grounded || tongue.active || game.soloCriticalCatchActive)) ||
      (tutorial.kind === "pvp" && tutorialStep()?.setup !== "pvpFinalMatch" &&
       (!pvpPlayers[0].grounded || (!skyBonkLandingDialogue && pvpPlayers[0].bonked) ||
        pvpPlayers[0].tongue?.active || game.pvpCriticalCatchActive ||
        // The other frog must reach a perch/ground, but their stun can remain.
        (!skyBonkLandingDialogue && pvpPlayers[1].bonked) ||
        (!pvpPlayers[1].grounded && !tutorialStep()?.demonstration)))) {
    tutorial.passPending = true;
    tutorial.passPendingAt = performance.now();
    clearHeldInput();
    return;
  }
  finalizePassedStep();
}

function unlockTutorialAchievement() {
  try {
    const oldMode = game.mode;
    game.mode = "solo";
    markAchievementEarned(TUTORIAL_ACHIEVEMENT_ID, false);
    game.mode = oldMode;
  } catch (_) {}
}

function restoreLegitimateState(completed) {
  const kind = tutorial.kind;
  const snapshot = tutorial.snapshot;
  const runtime = tutorial.runtime;
  tutorial.snapshot = null;
  tutorial.runtime = null;
  try { RibbitCloud.restorePlaytestSnapshot(snapshot || {}); } catch (_) {}
  try { refreshRuntimeProgressFromStorage(); } catch (_) {}
  try { RibbitCloud.endPlaytestSession(); } catch (_) {}
  if (completed && kind === "solo") unlockTutorialAchievement();
  if (completed) {
    try { localStorage.setItem(kind === "pvp" ? PVP_SEEN_KEY : SOLO_SEEN_KEY, "true"); } catch (_) {}
  }
  return runtime;
}

function beginFinalTutorialMessage() {
  if (!tutorial.active || tutorial.finalDialogueActive || tutorial.completeScreen) return false;
  tutorial.finalDialogueActive = true;
  tutorial.finalDialogueStartedAt = performance.now();
  tutorial.dialogueOpen = true;
  tutorial.dialogueLineIndex = 0;
  tutorial.dialoguePointerId = null;
  tutorial.dialogueForceComplete = false;
  tutorial.dialoguePreLineDelayUntil = 0;
  tutorial.dialogueHeldLineText = "";
  tutorial.dialogueHeldPortraitKey = "";
  tutorial.dialogueHeldUntil = 0;
  tutorial.blockJumpUntilRelease = false;
  tutorial.promptHidden = true;
  game.winPending = false;
  game.targetVocabIndex = null;
  game.spawnQueue.length = 0;
  // Keep every uncaught fly visible while Ember delivers the final message.
  // They are cleared only after the message closes and the completion card opens.
  resetTutorialTongue();
  clearHeldInput();
  freezeControlledEntity();
  beginDialogueLine(0);
  game.state = "playing";
  game.pauseHelpOpen = false;
  try { drawScene(); } catch (_) {}
  return true;
}

function beginCompletionScreen() {
  if (!tutorial.active) return;
  const alreadyWon = game.state === "won";
  tutorial.active = false;
  tutorial.finalDialogueActive = false;
  tutorial.dialogueOpen = false;
  tutorial.blockJumpUntilRelease = false;
  tutorial.resetPending = false;
  tutorial.resetAction = null;
  tutorial.resetPreserveFlyKeys = null;
  tutorial.pendingStartPose = null;
  tutorial.goalHovered = false;
  tutorial.dialoguePointerId = null;
  tutorial.frogHidden = false;
  resetDialogueSpaceHold();
  game.tutorialActive = tutorial.kind === "pvp";
  game.tutorialDisplayCatchTarget = null;
  flies.length = 0;
  game.spawnQueue.length = 0;
  resetTutorialTongue();
  tutorial.completeScreen = true;
  game.winPending = false;
  game.buttonHeld = false;
  frog.charging = false;
  clearHeldInput();
  if (tutorial.kind === "pvp") {
    // Keep the Versus renderer, Ember's crown and both score/charge HUDs.
    // Previous completion code changed to Solo and erased Ember entirely.
    game.mode = "pvp";
    game.pvpCpuEnabled = true;
    game.pvpSetupSkinIds[1] = "ember";
    positionPvp(pvpPlayers[0], 150, CONFIG.groundY - pvpPlayers[0].h, 1);
    positionPvp(pvpPlayers[1], 300, CONFIG.groundY - pvpPlayers[1].h, -1);
    pvpPlayers[1].skinId = "ember";
    tutorial.pvpCompletionPoofAt = performance.now();
    [pvpPlayers[0], pvpPlayers[1]].forEach((player) => {
      addTutorialPoof(player.x + player.w / 2, player.y + player.h / 2, "in");
    });
    playTutorialPoofSound("in");
  }
  if (tutorial.kind === "pvp") {
    game.state = "won";
    game.victorySelection = "home";
    game.victoryMouseMode = false;
    game.winInputLock = CONFIG.winDanceRevealDelay + 0.5;
    playWinSound();
  } else if (!alreadyWon) {
    clearFrogAfterimages(frog);
    frog.danceTime = 0;
    frog.grounded = true;
    frog.x = Math.round(W / 2 - frog.w / 2);
    frog.y = CONFIG.groundY - frog.h;
    game.state = "won";
    game.finishTime = Number.isFinite(Number(game.finishTime)) ? game.finishTime : game.elapsed;
    game.newBestTime = false;
    game.newFewestJumps = false;
    game.newEndlessBest = false;
    game.bestTime = readBestTime("park");
    game.bestJumps = readFewestJumps("park");
    game.victoryMessage = "TUTORIAL COMPLETE!";
    game.victorySelection = "home";
    game.victoryMouseMode = false;
    game.victoryHoveredSelection = null;
    game.victoryPressedSelection = null;
    game.victoryNoticePage = 0;
    game.winInputLock = CONFIG.winDanceRevealDelay + 0.5;
    playWinSound();
  }
  game.roundUnlockedSkinIds = [];
  game.roundUnlockedLevelId = null;
  if (!Array.isArray(game.roundUnlockedAchievementIds)) game.roundUnlockedAchievementIds = [];
  const completedTutorialAchievement = tutorial.kind === "pvp" ? PVP_TUTORIAL_ACHIEVEMENT_ID : TUTORIAL_ACHIEVEMENT_ID;
  if (!game.roundUnlockedAchievementIds.includes(completedTutorialAchievement)) {
    game.roundUnlockedAchievementIds.push(completedTutorialAchievement);
    try { unlockAchievement(completedTutorialAchievement); } catch (_) {}
  }
  clearLabelCaches();
}

function dismissCompletionScreen() {
  if (!tutorial.completeScreen) return;
  tutorial.completeScreen = false;
  tutorial.goalHovered = false;
  tutorial.pendingStartPose = null;
  tutorial.authStartQueued = false;
  resetDialogueSpaceHold();
  try { document.body.classList.remove("rr-tutorial-active", "rr-tutorial-pending"); } catch (_) {}
  const runtime = restoreLegitimateState(true);
  restoreRuntime(runtime);
  resetGame(false);
  openMainMenu(false);
  game.cheatToastText = "ACHIEVEMENT UNLOCKED: RIBBIT READY";
  game.cheatToastTimer = CONFIG.achievementToastDuration;
}

function finish(completed = false) {
  if (completed) {
    beginCompletionScreen();
    return;
  }
  if (!tutorial.active) return;
  tutorial.active = false;
  tutorial.dialogueOpen = false;
  tutorial.blockJumpUntilRelease = false;
  tutorial.resetPending = false;
  tutorial.resetAction = null;
  tutorial.resetPreserveFlyKeys = null;
  tutorial.pendingStartPose = null;
  tutorial.goalHovered = false;
  tutorial.dialoguePointerId = null;
  tutorial.frogHidden = false;
  tutorial.authStartQueued = false;
  resetDialogueSpaceHold();
  try { document.body.classList.remove("rr-tutorial-active", "rr-tutorial-pending"); } catch (_) {}
  game.tutorialActive = false;
  game.sandboxMode = false;
  const runtime = restoreLegitimateState(false);
  restoreRuntime(runtime);
  resetGame(false);
  openMainMenu(false);
  game.cheatToastText = "TUTORIAL EXITED";
  game.cheatToastTimer = CONFIG.achievementToastDuration;
}

function captureTutorialCarryoverFlies() {
  return flies
    .filter((currentFly) => currentFly?.tutorialAuthored && currentFly.state !== "eaten")
    .map((currentFly) => ({
      vocabIndex: Number(currentFly.vocabIndex) || 0,
      x: Number(currentFly.returnX ?? currentFly.baseX ?? currentFly.x) || 0,
      y: Number(currentFly.returnY ?? currentFly.baseY ?? currentFly.y) || 0,
      spawnIndex: Number(currentFly.spawnIndex) || 0
    }));
}

function installTutorialCarryoverFlies(snapshots = []) {
  tutorial.carryoverFlySnapshots = Array.isArray(snapshots) ? snapshots.slice() : [];
  for (const snapshot of tutorial.carryoverFlySnapshots) {
    const carryover = makeFly(snapshot.x, snapshot.y, snapshot.vocabIndex, snapshot.spawnIndex);
    carryover.tutorialArmed = true;
    carryover.tutorialCarryover = true;
    carryover.touchLocked = true;
    carryover.blockedPromptSerial = Number.MAX_SAFE_INTEGER;
    carryover.state = "active";
    carryover.spawnAge = Math.max(CONFIG.flySpawnEffectDuration + 0.1, CONFIG.flyGrowDuration + 0.1);
    // Preserve normal wing/flutter oscillation while Ember narrates the
    // follow-up; the fly stays present and moves, but cannot be caught.
    carryover.phase = Math.max(0.25, Number(snapshot.spawnIndex || 0) * 1.37);
    carryover.baseX = carryover.x = snapshot.x;
    carryover.baseY = carryover.y = snapshot.y;
  }
  clearLabelCaches();
}

function clearTutorialCarryoverFlies() {
  let removed = false;
  for (let index = flies.length - 1; index >= 0; index -= 1) {
    if (!flies[index]?.tutorialCarryover) continue;
    flies.splice(index, 1);
    removed = true;
  }
  tutorial.carryoverFlySnapshots = [];
  if (removed) clearLabelCaches();
}

function pvpTutorialRecoveryIsPlaying() {
  return tutorial.kind === "pvp" && pvpPlayers.some((player) =>
    player && (player.bonked || player.stunTimer > 0 ||
      (player.recoveryFlipTimer || 0) > 0));
}

function nextStep() {
  // Fast-forwarding text may close a success line in a split second. Keep the
  // current frogs and their genuine stun/recovery motion visible before the
  // NEXT chapter's poof; do not reset away the recovery animation.
  if (tutorial.active && !tutorial.resetPending && pvpTutorialRecoveryIsPlaying()) {
    tutorial.pvpAwaitRecoveryAdvance = true;
    tutorial.pvpPlayerScriptLocked = true;
    clearHeldInput();
    return;
  }
  tutorial.pvpAwaitRecoveryAdvance = false;
  const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
  if (tutorial.step >= steps.length - 1) {
    finish(true);
    return;
  }
  const previousSetup = tutorialStep()?.setup || "";
  const carryoverFlies = tutorial.kind === "solo" && previousSetup === "comboMixed"
    ? captureTutorialCarryoverFlies()
    : [];
  // Carryover vocabulary from the single-player mixed lesson remains visible;
  // every other uncaught tutorial fly gets its own soft exit before rebuild.
  despawnTutorialFlies({ preserveKeys: new Set(carryoverFlies.map(tutorialFlyKey)) });
  const visualPose = captureControlledPose();
  const pvpVisualPoses = tutorial.kind === "pvp" ? capturePvpTutorialPoses() : null;
  tutorial.transitionHeldLineText = String(tutorial.dialogueHeldLineText || currentDialogueLine() || "");
  tutorial.transitionHeldPortraitKey = String(tutorial.dialogueHeldPortraitKey || currentEmberPortraitKey() || "");
  freezeControlledEntity();
  tutorial.step += 1;
  configureStep(true, { preserveVisualPose: visualPose, preservePvpVisualPoses: pvpVisualPoses });
  if (carryoverFlies.length) installTutorialCarryoverFlies(carryoverFlies);
}

function skipToNextTutorialScene() {
  if (!tutorial.active) return false;
  despawnTutorialFlies();
  const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
  const currentScene = Number(tutorialStep()?.scene || 1);
  const targetIndex = steps.findIndex((step, index) => index > tutorial.step && Number(step?.scene || index + 1) > currentScene);
  clearPvpScriptActions();
  tutorial.pvpDemoActive = false;
  tutorial.pvpDemoBegun = false;
  tutorial.deferredPoofOptions = null;
  if (targetIndex < 0) {
    finish(true);
    return true;
  }
  const visualPose = captureControlledPose();
  const pvpVisualPoses = tutorial.kind === "pvp" ? capturePvpTutorialPoses() : null;
  tutorial.step = targetIndex;
  configureStep(true, { preserveVisualPose:visualPose, preservePvpVisualPoses:pvpVisualPoses });
  game.cheatToastText = `TUTORIAL SCENE ${Number(tutorialStep()?.scene || 1)}`;
  game.cheatToastTimer = CONFIG.achievementToastDuration;
  tone(620, .06, .012, 90);
  return true;
}

function start(kind = "solo") {
  if (tutorial.active || tutorial.completeScreen) return true;
  if (!tutorialAuthenticationReady()) {
    queueTutorialAfterAuthentication(kind);
    return false;
  }
  if (!emberPortraitsReady) {
    if (!tutorial.startQueued) {
      tutorial.startQueued = true;
      EMBER_PORTRAITS_READY.finally(() => {
        tutorial.startQueued = false;
        start(kind);
      });
    }
    return true;
  }
  tutorial.active = true;
  tutorial.completeScreen = false;
  tutorial.authStartQueued = false;
  try { document.body.classList.add("rr-tutorial-active"); } catch (_) {}
  tutorial.kind = kind === "pvp" ? "pvp" : "solo";
  if (tutorial.kind === "pvp") {
    tutorial.pvpPlayerSkinId = String(game.pvpSetupSkinIds?.[0] || game.skinId || "azure");
  }
  tutorial.step = 0;
  tutorial.runtime = saveRuntime();
  tutorial.snapshot = RibbitCloud.beginPlaytestSession?.() || {};
  game.tutorialActive = true;
  tutorial.resetPending = false;
  tutorial.resetAction = null;
  tutorial.pendingStartPose = null;
  tutorial.goalHovered = false;
  configureStep(true);
  try { drawScene(); } catch (_) {}
  requestAnimationFrame(() => {
    try { drawScene(); } catch (_) {}
    try { document.body.classList.remove("rr-tutorial-pending"); } catch (_) {}
  });
  canvas?.focus?.();
  return true;
}
