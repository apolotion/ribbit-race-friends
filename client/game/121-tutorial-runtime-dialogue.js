// Ribbit Race tutorial responsibility: 121 tutorial runtime dialogue
function saveRuntime() {
  return {
    selectedLevelId: game.selectedLevelId,
    skinId: game.skinId,
    setupSkinFocusId: game.setupSkinFocusId,
    soloRandomLevelMode: game.soloRandomLevelMode,
    soloEndlessMode: game.soloEndlessMode,
    soloCatchGoal: game.soloCatchGoal,
    soloTimeLimitSeconds: game.soloTimeLimitSeconds,
    timeOfDay: game.timeOfDay,
    timeOfDayLock: game.timeOfDayLock,
    moonPhaseIndex: game.moonPhaseIndex,
    pvpCpuEnabled: game.pvpCpuEnabled,
    pvpRoundTarget: game.pvpRoundTarget,
    pvpTimeLimitSeconds: game.pvpTimeLimitSeconds,
    pvpSetupLevelId: game.pvpSetupLevelId,
    pvpSetupSkinIds: Array.isArray(game.pvpSetupSkinIds) ? [...game.pvpSetupSkinIds] : ["azure", "crimson"]
  };
}

function restoreRuntime(runtime) {
  if (!runtime) return;
  Object.assign(game, {
    selectedLevelId: runtime.selectedLevelId || "park",
    skinId: runtime.skinId || game.skinId || "azure",
    setupSkinFocusId: runtime.setupSkinFocusId || runtime.skinId || game.setupSkinFocusId || "azure",
    soloRandomLevelMode: Boolean(runtime.soloRandomLevelMode),
    soloEndlessMode: Boolean(runtime.soloEndlessMode),
    soloCatchGoal: Number(runtime.soloCatchGoal) || 5,
    soloTimeLimitSeconds: Number(runtime.soloTimeLimitSeconds) || 0,
    timeOfDay: runtime.timeOfDay || "afternoon",
    timeOfDayLock: runtime.timeOfDayLock || null,
    moonPhaseIndex: Number.isInteger(runtime.moonPhaseIndex) ? runtime.moonPhaseIndex : game.moonPhaseIndex,
    pvpCpuEnabled: Boolean(runtime.pvpCpuEnabled),
    pvpRoundTarget: Number(runtime.pvpRoundTarget) || 5,
    pvpTimeLimitSeconds: Number(runtime.pvpTimeLimitSeconds) || 0,
    pvpSetupLevelId: runtime.pvpSetupLevelId || "park",
    pvpSetupSkinIds: [...(runtime.pvpSetupSkinIds || ["azure", "crimson"])]
  });
}

function clearHeldInput() {
  try { clearSoloPhysicalInputState(true); } catch (_) {}
  try { clearPvpPhysicalShiftState(true); } catch (_) {}
  game.buttonHeld = false;
  frog.charging = false;
  frog.chargeHoldTime = 0;
  game.airborneTapPressAt = -Infinity;
  game.platformDropBufferUntil = -Infinity;
}

function controlledTutorialEntity() {
  return tutorial.kind === "pvp" ? pvpPlayers[0] : frog;
}

function captureControlledPose(entity = controlledTutorialEntity()) {
  if (!entity) return null;
  return {
    x: Number(entity.x) || 0,
    y: Number(entity.y) || 0,
    vx: Number(entity.vx) || 0,
    vy: Number(entity.vy) || 0,
    dir: Number(entity.dir) < 0 ? -1 : 1,
    grounded: Boolean(entity.grounded),
    charging: Boolean(entity.charging),
    charge: Number(entity.charge) || 0.08,
    chargeDirection: Number(entity.chargeDirection) || 1,
    chargeHoldTime: Number(entity.chargeHoldTime) || 0,
    departurePlatform: entity.departurePlatform || null,
    dropThroughPlatform: entity.dropThroughPlatform || null,
    firstJumpMade: Boolean(entity.firstJumpMade),
    landingSquash: Number(entity.landingSquash) || 0,
    inputHeld: Boolean(entity.inputHeld),
    previousY: Number.isFinite(Number(entity.previousY)) ? Number(entity.previousY) : undefined,
    highestY: Number.isFinite(Number(entity.highestY)) ? Number(entity.highestY) : undefined
  };
}

function applyControlledPose(pose, entity = controlledTutorialEntity()) {
  if (!pose || !entity) return;
  Object.assign(entity, {
    x: pose.x,
    y: pose.y,
    vx: pose.vx,
    vy: pose.vy,
    dir: pose.dir,
    grounded: pose.grounded,
    charging: pose.charging,
    charge: pose.charge,
    chargeDirection: pose.chargeDirection,
    chargeHoldTime: pose.chargeHoldTime,
    departurePlatform: pose.departurePlatform,
    dropThroughPlatform: pose.dropThroughPlatform,
    firstJumpMade: pose.firstJumpMade,
    landingSquash: pose.landingSquash
  });
  if ("inputHeld" in entity) entity.inputHeld = Boolean(pose.inputHeld);
  if (pose.previousY !== undefined && "previousY" in entity) entity.previousY = pose.previousY;
  if (pose.highestY !== undefined && "highestY" in entity) entity.highestY = pose.highestY;
}

function capturePvpTutorialPoses() {
  return pvpPlayers.map((player) => captureControlledPose(player));
}

function applyPvpTutorialPoses(poses) {
  if (!Array.isArray(poses)) return;
  poses.forEach((pose, index) => applyControlledPose(pose, pvpPlayers[index]));
}

function resetPvpTutorialTongues() {
  for (const player of pvpPlayers) {
    const playerTongue = player?.tongue;
    if (!playerTongue) continue;
    playerTongue.active = false;
    playerTongue.elapsed = 0;
    playerTongue.targetFlyId = null;
    playerTongue.targetX = 0;
    playerTongue.targetY = 0;
    playerTongue.captured = false;
  }
}

function freezeControlledEntity() {
  const entities = tutorial.kind === "pvp" ? pvpPlayers : [controlledTutorialEntity()];
  for (const entity of entities) {
    if (!entity) continue;
    entity.vx = 0;
    entity.vy = 0;
    entity.charging = false;
    entity.chargeHoldTime = 0;
    if ("inputHeld" in entity) entity.inputHeld = false;
  }
  clearHeldInput();
}

function getNormalParkStartX() {
  return Number(LEVELS?.park?.startX ?? 25) + Number(CONFIG.initialFrogOffsetX || 36);
}

function restoreExactParkStage() {
  platforms = cloneParkPlatforms();
  flySpawns = LEVELS.park.flySpawns;
}

function tutorialAuthenticationReady() {
  if (typeof document === "undefined") return true;
  const gate = document.getElementById("cloud-gate");
  const frame = document.getElementById("game-frame");
  let profileReady = false;
  try {
    // cloud-client.js declares RibbitCloud as a global lexical binding rather
    // than a window property, so prefer the identifier and keep the window
    // fallback for compatible hosted builds.
    const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
    const profile = cloud?.getProfile?.() || cloud?.profile?.();
    profileReady = Boolean(profile?.signedIn || profile?.guestMode);
  } catch (_) {}
  const gateReleased = !gate || gate.hidden === true;
  const bodyReleased = !document.body?.classList?.contains("ribbit-auth-locked");
  const frameReleased = !frame || (!frame.hasAttribute("inert") && frame.getAttribute("aria-hidden") !== "true");
  let functionLockReleased = true;
  try {
    functionLockReleased = typeof window.RibbitFriendsGameInputLocked !== "function" ||
      window.RibbitFriendsGameInputLocked() !== true;
  } catch (_) { functionLockReleased = false; }
  const inputReleased = window.__RIBBIT_FRIENDS_GAME_INPUT_LOCKED__ !== true && functionLockReleased;
  const languageDialogOpen = [...document.querySelectorAll('[id*="language" i], [class*="language" i]')].some((node) => {
    if (!(node instanceof HTMLElement) || node.hidden) return false;
    const style=getComputedStyle(node); if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;
    return Boolean(node.querySelector('button,select,input'));
  });
  return profileReady && gateReleased && bodyReleased && frameReleased && inputReleased && !languageDialogOpen;
}

function queueTutorialAfterAuthentication(kind) {
  tutorial.authQueuedKind = kind === "pvp" ? "pvp" : "solo";
  if (tutorial.authStartQueued) return;
  tutorial.authStartQueued = true;
  const retry = () => {
    if (!tutorial.authStartQueued || tutorial.active || tutorial.completeScreen) return;
    if (!tutorialAuthenticationReady()) {
      setTimeout(retry, 180);
      return;
    }
    tutorial.authStartQueued = false;
    start(tutorial.authQueuedKind);
  };
  window.addEventListener("rr-authenticated", retry, { once:true });
  setTimeout(retry, 220);
}

function clearLabelCaches() {
  try { flyLabelPlacementCache.clear(); } catch (_) {}
  try { flyLabelSpriteCache.clear(); } catch (_) {}
}

function restoreStepSequence() {
  const setup = tutorialStep()?.setup;
  if (setup === "doubleBuffer") setSequence([0, 1, 2]);
  else if (setup === "comboTwo") setSequence([0, 1]);
  else if (setup === "comboThree") setSequence([0, 1, 2]);
}

function dialogueLinesForCurrentStep() {
  if (Array.isArray(tutorial.dynamicDialogueLines) && tutorial.dynamicDialogueLines.length) {
    return tutorial.dynamicDialogueLines;
  }
  if (tutorial.finalDialogueActive) return FINAL_TUTORIAL_DIALOGUE;
  const step = tutorialStep();
  return Array.isArray(step?.dialogue) && step.dialogue.length ? step.dialogue : [step?.title || "TUTORIAL"];
}

function currentDialogueLine() {
  const lines = dialogueLinesForCurrentStep();
  return String(lines[Math.min(tutorial.dialogueLineIndex, lines.length - 1)] || "");
}

function currentEmberPortraitKey() {
  if (tutorial.dynamicPortraitKey) return tutorial.dynamicPortraitKey;
  if (tutorial.finalDialogueActive) return "thumbsup";
  const step = tutorialStep();
  const sequence = EMBER_PORTRAIT_SEQUENCE_BY_SETUP[step?.setup] || [];
  if (sequence.length) return sequence[tutorial.dialogueLineIndex % sequence.length];
  return step?.portrait || "confident";
}

function resetDialogueSpaceHold() {
  tutorial.dialogueSpaceHeld = false;
  tutorial.dialogueSpaceHeldAt = 0;
  tutorial.dialogueFastForwardExtraMs = 0;
}

function dialogueTypingAge(now = performance.now()) {
  const typingStart = Math.max(tutorial.dialogueLineStartedAt, tutorial.dialoguePreLineDelayUntil || 0);
  const normalAge = Math.max(0, now - typingStart);
  const heldExtra = tutorial.dialogueSpaceHeld
    ? Math.max(0, now - Math.max(typingStart, tutorial.dialogueSpaceHeldAt || now))
    : 0;
  // Normal time already counts once. Adding held time once more makes holding
  // Space exactly twice as fast without changing the base typewriter rhythm.
  return normalAge + Math.max(0, tutorial.dialogueFastForwardExtraMs) + heldExtra;
}

function visibleDialogueCharacterCount(line = currentDialogueLine()) {
  if (tutorial.dialogueForceComplete) return line.length;
  return Math.min(line.length, Math.floor(dialogueTypingAge() / TYPEWRITER_MS_PER_CHARACTER));
}

function dialogueLineIsComplete() {
  const line = currentDialogueLine();
  return visibleDialogueCharacterCount(line) >= line.length;
}

function beginDialogueLine(index, options = {}) {
  const now = performance.now();
  const delayMs = Math.max(0, Number(options.delayMs) || 0);
  const previousLine = currentDialogueLine();
  const previousPortraitKey = currentEmberPortraitKey();
  const shouldHoldPrevious = Boolean(
    delayMs > 0 &&
    options.holdPreviousText !== false &&
    previousLine &&
    Math.max(0, Math.floor(index)) !== tutorial.dialogueLineIndex
  );
  tutorial.dialogueLineIndex = Math.max(0, Math.floor(index));
  tutorial.dialogueOpenedAt = now;
  tutorial.dialogueLineStartedAt = now + delayMs;
  tutorial.dialoguePreLineDelayUntil = tutorial.dialogueLineStartedAt;
  tutorial.dialogueHeldLineText = shouldHoldPrevious ? previousLine : "";
  tutorial.dialogueHeldPortraitKey = shouldHoldPrevious ? previousPortraitKey : "";
  // Keep the prior sentence through the first typewriter tick so the panel
  // never flashes blank between the staged fly poof and the new line.
  tutorial.dialogueHeldUntil = shouldHoldPrevious
    ? tutorial.dialogueLineStartedAt + TYPEWRITER_MS_PER_CHARACTER
    : 0;
  tutorial.dialogueForceComplete = false;
  tutorial.dialoguePointerId = null;
  tutorial.dialogueTalkCharCount = 0;
  tutorial.dialogueTalkBlipAt = now;
  resetDialogueSpaceHold();
}

function openDialogue() {
  tutorial.dialogueOpen = true;
  tutorial.scenePositionedDuringDialogue = false;
  beginDialogueLine(0);
  tutorial.blockJumpUntilRelease = false;
  game.state = "playing";
  game.pauseHelpOpen = false;
  clearHeldInput();
  freezeControlledEntity();
  // Authored tutorial flies stay hidden until the frog's matching poof-in.
  // This makes every lesson setup read as one intentional stage transition.
  try { drawScene(); } catch (_) {}
}

function openDynamicDialogue(lines, portraitKey = "thumbsup", postSuccessAdvance = false) {
  tutorial.dynamicDialogueLines = Array.isArray(lines) ? lines.map(String) : [String(lines || "")];
  tutorial.dynamicPortraitKey = portraitKey || "thumbsup";
  tutorial.postSuccessAdvance = Boolean(postSuccessAdvance);
  tutorial.dialogueOpen = true;
  tutorial.scenePositionedDuringDialogue = false;
  beginDialogueLine(0);
  tutorial.blockJumpUntilRelease = false;
  game.state = "playing";
  game.pauseHelpOpen = false;
  clearHeldInput();
  freezeControlledEntity();
  try { drawScene(); } catch (_) {}
}

function tutorialFlyKey(currentFly) {
  if (!currentFly) return "";
  if (currentFly.tutorialKey) return String(currentFly.tutorialKey);
  return [
    Number(currentFly.spawnIndex) || 0,
    Number(currentFly.vocabIndex) || 0,
    Math.round(Number(currentFly.baseX ?? currentFly.x) || 0),
    Math.round(Number(currentFly.baseY ?? currentFly.y) || 0)
  ].join(":");
}

function collectVisibleTutorialFlyKeys() {
  return new Set(
    flies
      .filter((currentFly) => currentFly?.tutorialAuthored && currentFly.state === "active" && currentFly.tutorialArmed !== false)
      .map(tutorialFlyKey)
      .filter(Boolean)
  );
}

function armTutorialFlies(options = {}) {
  const preserveKeys = options.preserveKeys instanceof Set ? options.preserveKeys : null;
  const revealPrompt = options.revealPrompt !== false;
  let spawned = 0;
  for (const currentFly of flies) {
    if (!currentFly?.tutorialAuthored || currentFly.tutorialArmed !== false) continue;
    currentFly.tutorialArmed = true;
    if (preserveKeys?.has(tutorialFlyKey(currentFly))) {
      // This fly was already present before a frog-only reset. Keep it visible
      // instead of replaying its poof animation.
      currentFly.spawnAge = Math.max(
        Number(currentFly.spawnAge) || 0,
        CONFIG.flySpawnEffectDuration + 0.08,
        CONFIG.flyGrowDuration + 0.08
      );
    } else {
      currentFly.spawnAge = 0;
      spawned += 1;
    }
  }
  if (spawned > 0) {
    if (revealPrompt) tutorial.promptHidden = false;
    try { playFlySpawnSound(); } catch (_) { tone(760, .045, .012, 80); }
  }
  return spawned;
}

function beginDialogueScenarioPlacement(nextIndex, options = {}) {
  const intendedStartPose = tutorial.pendingStartPose || captureControlledPose();
  const postPoofDelayMs = Math.max(
    0,
    Number.isFinite(Number(options.postPoofDelayMs))
      ? Number(options.postPoofDelayMs)
      : DIALOGUE_SCENE_SETTLE_MS
  );
  beginDialogueLine(nextIndex, {
    delayMs: POOF_TRANSITION_MS + postPoofDelayMs,
    holdPreviousText: true
  });
  beginPoofTransition({
    reason: "dialogue-scene-entry",
    showFailure: false,
    preserveExistingFlies: false,
    action: () => {
      applyControlledPose(intendedStartPose);
      tutorial.pendingStartPose = null;
      tutorial.scenePositionedDuringDialogue = true;
      restoreStepSequence();
      if (tutorialStep()?.setup === "wrongFly") tutorial.promptHidden = false;
      if (tutorial.kind === "pvp" && !tutorialStep()?.demonstration) {
        tutorial.pvpCaption = "YOUR TURN!";
        tutorial.pvpCaptionUntil = performance.now() + 1600;
      }
      tutorial.enteredAt = performance.now();
    }
  });
}

function beginPvpSkyBonkDialoguePlacement(nextIndex) {
  if (tutorial.resetPending || tutorial.kind !== "pvp") return false;
  const targetPoses = Array.isArray(tutorial.pendingPvpTargetPoses)
    ? tutorial.pendingPvpTargetPoses
    : capturePvpTutorialPoses();
  tutorial.dialogueHiddenDuringPoof = true;
  beginDialogueLine(nextIndex, {
    delayMs: POOF_TRANSITION_MS + DIALOGUE_SCENE_SETTLE_MS,
    holdPreviousText: false
  });
  const started = beginPoofTransition({
    reason: "pvp-sky-bonk-mid-dialogue",
    showFailure: false,
    preserveExistingFlies: false,
    armFlies: false,
    waitForEffects: false,
    action: () => {
      applyPvpTutorialPoses(targetPoses);
      tutorial.pendingPvpTargetPoses = null;
      tutorial.pendingPvpVisualPoses = null;
      tutorial.pendingStartPose = null;
      tutorial.scenePositionedDuringDialogue = true;
      tutorial.dialogueHiddenDuringPoof = false;
      tutorial.dialogueLineStartedAt += 500;
      tutorial.dialoguePreLineDelayUntil = tutorial.dialogueLineStartedAt;
      tutorial.enteredAt = performance.now();
    }
  });
  if (!started) tutorial.dialogueHiddenDuringPoof = false;
  return started;
}

function prepareDialogueLine(nextIndex) {
  const setup = tutorialStep()?.setup;
  // "Now let's take things a little higher" is the last line in the old
  // positions. Reposition once before explaining the sky bonk, not after
  // "Watch me take the scenic route."
  if (setup === "pvpDemoSkyBonk" && nextIndex === 2) {
    beginPvpSkyBonkDialoguePlacement(nextIndex);
    return;
  }
  // The dinner setup poofs the frog and fly into place together. Ember keeps
  // the previous sentence visible, then waits a clean half-second after the
  // fly appears before announcing that dinner is ready.
  if (setup === "threeCatches" && nextIndex === 1) {
    beginDialogueScenarioPlacement(nextIndex, {
      postPoofDelayMs: FLY_DIALOGUE_REVEAL_HOLD_MS
    });
    return;
  }
  // These lessons move the frog and reveal every authored fly on the exact
  // sentence that describes the new setup.
  if ((setup === "rangeCatch" && nextIndex === 4) ||
      (setup === "comboMixed" && nextIndex === 2)) {
    beginDialogueScenarioPlacement(nextIndex);
    return;
  }
  beginDialogueLine(nextIndex);
}

function armScenarioAfterDialogue() {
  const step = tutorialStep();
  const setup = step?.setup;
  if (tutorial.kind === "pvp") {
    if (step?.demonstration) {
      // Scene 2 begins from the same side-by-side pose established by the
      // welcome scene; Ember simply charges from that position.
      const keepOpeningPose = setup === "pvpDemoBonk";
      startPvpDemonstration({ skipPoof:keepOpeningPose || tutorial.scenePositionedDuringDialogue });
      return;
    }
    if (step?.finalMatch) {
      startPvpFinalMatch();
      return;
    }
    if (tutorial.scenePositionedDuringDialogue) {
      tutorial.scenePositionedDuringDialogue = false;
      tutorial.pendingPvpTargetPoses = null;
      tutorial.pendingPvpVisualPoses = null;
      tutorial.pvpCaption = "YOUR TURN!";
      tutorial.pvpCaptionUntil = performance.now() + 1600;
      schedulePvpFlyReveal(setup, pvpFlyRevealDelayMs(setup));
      tutorial.enteredAt = performance.now();
      game.state = "playing";
      game.pauseHelpOpen = false;
      clearHeldInput();
      return;
    }
    beginScenarioEntryTransition();
    return;
  }
  if (tutorial.scenePositionedDuringDialogue) {
    tutorial.scenePositionedDuringDialogue = false;
    tutorial.pendingStartPose = null;
    restoreStepSequence();
    armTutorialFlies();
    tutorial.enteredAt = performance.now();
    game.state = "playing";
    game.pauseHelpOpen = false;
    clearHeldInput();
    return;
  }
  // The first playable lesson starts exactly where a normal Park round starts.
  // There is no fly setup here, so an extra disappearance/reappearance would
  // only make the frog jump visually when the player first gains control.
  if (setup === "longJumps") {
    applyControlledPose(tutorial.pendingStartPose || captureControlledPose());
    tutorial.pendingStartPose = null;
    restoreStepSequence();
    tutorial.enteredAt = performance.now();
    game.state = "playing";
    game.pauseHelpOpen = false;
    clearHeldInput();
    return;
  }
  beginScenarioEntryTransition();
}

function closeDialogue(source = "keyboard") {
  if (!tutorial.active || !tutorial.dialogueOpen || game.state === "paused" || game.state === "countdown") return false;
  if (tutorial.resetPending || tutorial.dialogueHiddenDuringPoof ||
      performance.now() < tutorial.dialogueLineStartedAt ||
      performance.now() - tutorial.dialogueOpenedAt < 90) return false;

  if (!dialogueLineIsComplete()) {
    tutorial.dialogueForceComplete = true;
    try { drawScene(); } catch (_) {}
    return true;
  }

  const lines = dialogueLinesForCurrentStep();
  if (tutorial.dialogueLineIndex < Math.max(0, lines.length - 1)) {
    prepareDialogueLine(tutorial.dialogueLineIndex + 1);
    tone(470, .025, .007, 35);
    try { drawScene(); } catch (_) {}
    return true;
  }

  const step = tutorialStep();
  const keepJumpBlockedUntilRelease = source === "space-keydown" && tutorial.blockJumpUntilRelease;
  tutorial.dialogueOpen = false;
  tutorial.dialogueLineIndex = 0;
  tutorial.dialogueForceComplete = false;
  tutorial.dialoguePointerId = null;
  tutorial.dialoguePreLineDelayUntil = 0;
  tutorial.dialogueHeldLineText = "";
  tutorial.dialogueHeldPortraitKey = "";
  tutorial.dialogueHeldUntil = 0;
  tutorial.blockJumpUntilRelease = keepJumpBlockedUntilRelease;
  resetDialogueSpaceHold();
  clearHeldInput();
  game.state = "playing";
  game.pauseHelpOpen = false;

  if (tutorial.dynamicDialogueLines) {
    const shouldAdvance = tutorial.postSuccessAdvance;
    const pvpEnding = tutorial.pvpFinalOutcome !== null;
    tutorial.dynamicDialogueLines = null;
    tutorial.dynamicPortraitKey = "";
    tutorial.postSuccessAdvance = false;
    if (pvpEnding) {
      tone(620, .06, .016, 90);
      beginCompletionScreen();
      return true;
    }
    if (shouldAdvance) {
      finalizePassedStep();
      return true;
    }
  }

  if (tutorial.finalDialogueActive) {
    tutorial.finalDialogueActive = false;
    tone(620, .06, .016, 90);
    beginCompletionScreen();
    return true;
  }

  if (step?.autoAdvanceAfterDialogue) {
    tone(420, .035, .010, 45);
    nextStep();
    return true;
  }

  armScenarioAfterDialogue();
  tone(420, .035, .010, 45);
  try { drawScene(); } catch (_) {}
  return true;
}

function setMentor(side = "right") {
  tutorial.mentorSide = side === "left" ? "left" : "right";
  tutorial.mentorX = tutorial.mentorSide === "left" ? PVP_START_X[0] : PVP_START_X[1];
  tutorial.mentorY = CONFIG.groundY - frog.h;
}

function resetTutorialTongue() {
  tongue.active = false;
  tongue.elapsed = 0;
  tongue.targetFlyId = null;
  tongue.targetX = 0;
  tongue.targetY = 0;
  tongue.captured = false;
}

function clearScenarioState() {
  tutorial.passed = false;
  tutorial.passAt = 0;
  tutorial.passPending = false;
  tutorial.passPendingAt = 0;
  tutorial.enteredAt = performance.now();
  tutorial.scoreStart = Number(game.score || 0);
  tutorial.jumpStart = Number(game.jumps || 0);
  tutorial.wallTouched = false;
  tutorial.wallTouchedThisJump = false;
  tutorial.quickDrop = false;
  tutorial.bufferedDrop = false;
  tutorial.bufferedPlatforms = new Set();
  tutorial.lastObservedDropPlatform = "";
  tutorial.bufferEventCount = 0;
  tutorial.maxCatchesOneJump = 0;
  tutorial.lastJumpPower = 0;
  tutorial.failedAttemptAt = 0;
  tutorial.failureText = "";
  tutorial.failureMessageUntil = 0;
  tutorial.failureFlashStartedAt = 0;
  tutorial.wrongFlyCaught = false;
  tutorial.wrongFlyCaughtAt = 0;
  tutorial.rightFlyCaught = false;
  tutorial.wrongOrderInvalid = false;
  tutorial.rangeTongueCaught = false;
  tutorial.rangeTongueCaughtAt = 0;
  tutorial.quickDropWrongJump = false;
  tutorial.frogHidden = false;
  tutorial.jumpAttempts = 0;
  tutorial.attemptStarted = false;
  tutorial.attemptWasAirborne = false;
  tutorial.attemptEnded = false;
  tutorial.sequence = [];
  tutorial.catchEvents = [];
  tutorial.longJumpStreak = 0;
  tutorial.sceneCatchCount = 0;
  tutorial.sceneAttemptIndex = 0;
  tutorial.sceneAttemptCaught = false;
  tutorial.sceneLandingDelayUntil = 0;
  tutorial.scenePositionedDuringDialogue = false;
  tutorial.dialogueHiddenDuringPoof = false;
  tutorial.promptHidden = false;
  tutorial.wrongFlyPromptIndex = 0;
  tutorial.wrongFlyOriginalVocabIndex = 1;
  tutorial.wrongFlyOriginalFlyId = null;
  tutorial.wrongFlyRightFlyId = null;
  tutorial.wrongFlyRightSpawned = false;
  tutorial.wrongFlyRightCaught = false;
  tutorial.wrongFlyReturnedCaught = false;
  tutorial.wrongFlyResolvedAt = 0;
  tutorial.wrongFlyFollowupQueued = false;
  tutorial.carryoverFlySnapshots = [];
  tutorial.goalHovered = false;
  tutorial.pvpBonks = 0;
  tutorial.pvpRebounds = 0;
  tutorial.pvpLastStun = 0;
  tutorial.dynamicDialogueLines = null;
  tutorial.dynamicPortraitKey = "";
  tutorial.postSuccessAdvance = false;
  tutorial.successDialogueShown = false;
  tutorial.pvpDemoActive = false;
  tutorial.pvpDemoKind = "";
  tutorial.pvpDemoStartedAt = 0;
  tutorial.pvpDemoBegun = false;
  tutorial.pvpDemoDuration = 0;
  tutorial.pvpFrogsHidden = false;
  tutorial.pvpHiddenPlayerIndex = null;
  tutorial.pauseChapterHover = "";
  tutorial.pvpCaption = "";
  tutorial.pvpCaptionUntil = 0;
  tutorial.pvpPracticeCount = 0;
  tutorial.pvpBonkCatchArmed = false;
  tutorial.pvpBonkCatchSucceeded = false;
  tutorial.pvpBufferedBonkSeen = false;
  tutorial.pvpBufferedApproachCount = 0;
  tutorial.pvpSkyBonkSeen = false;
  tutorial.pvpMaximumBonkSeen = false;
  tutorial.pvpUnderBonks = 0;
  tutorial.pvpReboundCount = 0;
  tutorial.pvpInterceptSeen = false;
  tutorial.pvpBoostedBonkSeen = false;
  tutorial.pvpLastPracticeEventAt = 0;
  tutorial.pvpLastBonkQuickDrop = false;
  tutorial.pvpHighGroundBonkSeen = false;
  tutorial.pvpCpuTriggerAt = 0;
  tutorial.pvpMirrorWasHeld = false;
  tutorial.pvpFinalMatchStarted = false;
  tutorial.pvpFinalOutcome = null;
  tutorial.pvpFlyRevealAt = 0;
  tutorial.pvpFlyRevealSetup = "";
  tutorial.pvpPracticeLayoutIndex = 0;
  tutorial.pvpPracticeCatchCount = 0;
  tutorial.pvpScriptActions = [];
  tutorial.pvpDemoStage = 0;
  tutorial.pvpDemoBonkAt = 0;
  tutorial.pvpDemoBonkCount = 0;
  tutorial.pvpDemoBlockedBonkAt = 0;
  tutorial.pvpDemoUnderBonkAt = 0;
  tutorial.pvpPlayerAttemptWasAirborne = false;
  tutorial.pvpPlayerOnlyReset = false;
  tutorial.pvpEmberChargeStarted = false;
  tutorial.pvpEmberLaunchStarted = false;
  tutorial.pvpLastEmberPositionKey = "";
  tutorial.pvpPendingPracticePoofAt = 0;
  tutorial.pvpPracticeStartedAt = performance.now();
  tutorial.pvpPracticeFailureAt = 0;
  tutorial.pvpDemoBonkHandled = false;
  tutorial.pvpDemoFollowupStarted = false;
  tutorial.pvpLessonAirborneSeen = [false, false];
  tutorial.pvpLessonLanded = [false, false];
  tutorial.pvpTechniqueCatchQualified = false;
  tutorial.pvpTechniqueCatchPlayerIndex = -1;
  tutorial.pvpTechniqueCatchAt = 0;
  tutorial.pvpReboundAt = 0;
  tutorial.pvpDemoRetryQueued = false;
  tutorial.pvpDemoComparePhase = 0;
  tutorial.pvpScriptBufferPlatform = null;
  tutorial.pvpScriptBufferTriggered = false;
  tutorial.pvpEmberJumpScheduledAt = 0;
  tutorial.pvpLastP1Grounded = Boolean(pvpPlayers[0]?.grounded);
  tutorial.pvpLastEmberGrounded = Boolean(pvpPlayers[1]?.grounded);
  tutorial.pvpEmberFacingLock = Number(pvpPlayers[1]?.dir || -1);
  tutorial.pvpPlayerScriptLocked = false;
  tutorial.bufferedJumpChainCount = 0;
  tutorial.bufferedJumpWindowOpenedAt = 0;
  tutorial.bufferedJumpReleased = false;
  tutorial.wasGroundedLastFrame = tutorial.kind === "pvp" ? Boolean(pvpPlayers[0]?.grounded) : Boolean(frog.grounded);
  tutorial.revealPromptOnLanding = false;
  tutorial.finalDialogueActive = false;
  tutorial.finalDialogueStartedAt = 0;
  tutorial.pvpScoreStart = Number(pvpPlayers[0]?.score || 0);
  tutorial.lastDir = tutorial.kind === "pvp" ? Number(pvpPlayers[0]?.dir || 1) : Number(frog.dir || 1);
  resetTutorialTongue();
  clearHeldInput();
  clearLabelCaches();
}
