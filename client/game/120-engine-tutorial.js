// Ribbit Race Friends 1.7.2 — tutorials run inside the real Park game engine.
(() => {
  "use strict";

  const SOLO_SEEN_KEY = "rrFriendsEngineTutorialSoloSeenV2";
  const PVP_SEEN_KEY = "rrFriendsEngineTutorialPvpSeenV2";
  const TUTORIAL_BUILD = "2026.10.11-friends-engine-tutorial-2";

  const tutorial = {
    active: false,
    kind: "solo",
    step: 0,
    passed: false,
    passAt: 0,
    enteredAt: 0,
    snapshot: null,
    runtime: null,
    scoreStart: 0,
    jumpStart: 0,
    lastDir: 1,
    wallTouched: false,
    wallTouchedThisJump: false,
    quickDrop: false,
    bufferedDrop: false,
    maxCatchesOneJump: 0,
    lastJumpPower: 0,
    failedAttemptAt: 0,
    failureText: "",
    finalComplete: false,
    pvpBonks: 0,
    pvpRebounds: 0,
    pvpLastStun: 0,
    pvpScoreStart: 0,
    originalLaunchJump: null,
    originalLaunchPvpJump: null,
    originalCompleteWin: null,
    previousState: ""
  };

  const SOLO_STEPS = Object.freeze([
    { title: "WELCOME TO RIBBIT RACE", lines: ["YOU ARE PLAYING THE REAL PARK LEVEL.", "MAKE ONE JUMP TO BEGIN."], setup: "welcome" },
    { title: "MATCH THE TERM", lines: ["THE ENGLISH TERM IS AT THE BOTTOM.", "CATCH THE FLY WITH THE MATCHING SPANISH WORD."], setup: "match" },
    { title: "CHARGE A FULL JUMP", lines: ["HOLD UNTIL THE METER REACHES THE END.", "RELEASE ONLY WHEN THE JUMP IS FULLY CHARGED."], setup: "maxJump" },
    { title: "AUTOMATIC CATCH RANGE", lines: ["JUMP CLOSE TO THE MATCHING FLY.", "YOUR FROG OR TONGUE WILL CATCH IT AUTOMATICALLY."], setup: "rangeCatch" },
    { title: "WRONG FLIES ARE SAFE", lines: ["CATCH THE WRONG FLY ON PURPOSE.", "THE FROG WILL SPIT IT BACK OUT."], setup: "wrongFly" },
    { title: "TURN AROUND WITH A WALL", lines: ["THE FLY IS BEHIND YOU.", "HIT THE WALL, TURN AROUND, THEN CATCH IT."], setup: "wallTurn" },
    { title: "REBOUND CATCH", lines: ["BOUNCE OFF THE WALL AND CATCH THE FLY", "DURING THAT SAME JUMP."], setup: "reboundCatch" },
    { title: "QUICK PLATFORM DROP", lines: ["TAP JUMP QUICKLY WHILE STANDING ON THE PLATFORM.", "DROP THROUGH IT AND CATCH THE FLY BELOW."], setup: "quickDrop" },
    { title: "BUFFER A PLATFORM DROP", lines: ["CHARGE A JUMP TOWARD THE PLATFORM.", "TAP JUST BEFORE LANDING TO PASS THROUGH IT."], setup: "bufferDrop" },
    { title: "TWO FLIES IN ONE ARC", lines: ["LINE UP THE JUMP SO BOTH MATCHING FLIES", "ARE CAUGHT BEFORE YOU LAND."], setup: "doubleCatch" },
    { title: "FINAL PRACTICE ROUND", lines: ["NOW PLAY A NORMAL PARK ROUND.", "CATCH ALL FIVE MATCHING FLIES."], setup: "normalRound" }
  ]);

  const PVP_STEPS = Object.freeze([
    { title: "VERSUS TUTORIAL", lines: ["THIS IS THE REAL PARK VERSUS ENGINE.", "MAKE ONE CHARGED JUMP TO BEGIN."], setup: "pvpWelcome" },
    { title: "BONK FROM ABOVE", lines: ["FALL ON TOP OF THE OTHER FROG.", "A VALID BONK STUNS THE LOWER FROG."], setup: "pvpBonk" },
    { title: "SKY BONK", lines: ["BONK FROM HIGHER UP FOR A LONGER STUN.", "REACH THE TOP HALF OF THE SCREEN FIRST."], setup: "pvpSkyBonk" },
    { title: "WAIT FOR RECOVERY", lines: ["BONK, WAIT UNTIL THE STUN ENDS,", "THEN BONK THE FROG A SECOND TIME."], setup: "pvpDoubleBonk" },
    { title: "HORIZONTAL REBOUND", lines: ["COLLIDE SIDE-TO-SIDE TO TURN AROUND.", "HORIZONTAL CONTACTS REBOUND; THEY DO NOT BONK."], setup: "pvpRebound" },
    { title: "OFFENSIVE REBOUND", lines: ["REBOUND OFF THE OTHER FROG,", "THEN USE THE TURNAROUND TO CATCH THE FLY."], setup: "pvpOffense" }
  ]);

  function saveRuntime() {
    return {
      selectedLevelId: game.selectedLevelId,
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

  function clearScenarioState() {
    tutorial.passed = false;
    tutorial.passAt = 0;
    tutorial.enteredAt = performance.now();
    tutorial.scoreStart = Number(game.score || 0);
    tutorial.jumpStart = Number(game.jumps || 0);
    tutorial.wallTouched = false;
    tutorial.wallTouchedThisJump = false;
    tutorial.quickDrop = false;
    tutorial.bufferedDrop = false;
    tutorial.maxCatchesOneJump = 0;
    tutorial.lastJumpPower = 0;
    tutorial.failedAttemptAt = 0;
    tutorial.failureText = "";
    tutorial.pvpBonks = 0;
    tutorial.pvpRebounds = 0;
    tutorial.pvpLastStun = 0;
    tutorial.pvpScoreStart = Number(pvpPlayers[0]?.score || 0);
    tutorial.lastDir = tutorial.kind === "pvp" ? Number(pvpPlayers[0]?.dir || 1) : Number(frog.dir || 1);
  }

  function makeFly(x, y, vocabIndex, spawnIndex = -100) {
    const fly = {
      id: nextFlyId++, baseX:x, baseY:y, x, y,
      phase: 0, spawnIndex, spawnAge: 1,
      vocabIndex, state:"active", touchLocked:false,
      blockedPromptSerial:-1,
      pvpBlockedPromptSerials:[-1,-1],
      pvpPursuers:[false,false], pvpPursuitTimes:[null,null],
      pvpPursuitPromptSerial:-1,
      spitElapsed:0, spitDelay:0, spitDuration:.34, spitStarted:false,
      spitOwnerIndex:null, spitStartX:x, spitStartY:y, returnX:x, returnY:y
    };
    flies.push(fly);
    return fly;
  }

  function setPrompt(index) {
    game.targetVocabIndex = Math.max(0, Math.min(VOCABULARY.length - 1, index));
    game.promptSerial += 1;
    for (const fly of flies) {
      fly.touchLocked = false;
      fly.blockedPromptSerial = -1;
      fly.pvpBlockedPromptSerials = [-1, -1];
    }
  }

  function positionSoloFrog(x, y = CONFIG.groundY - frog.h, dir = 1) {
    Object.assign(frog, {
      x, y, vx:0, vy:0, dir, grounded:true, charging:false,
      charge:.08, chargeDirection:1, chargeHoldTime:0,
      departurePlatform:null, dropThroughPlatform:null,
      firstJumpMade:false, landingSquash:0
    });
    game.buttonHeld = false;
    game.airborneTapPressAt = -Infinity;
    game.platformDropBufferUntil = -Infinity;
  }

  function positionOnPlatform(platform, xOffset = 12, dir = 1) {
    positionSoloFrog(platform.x + xOffset, platform.y - frog.h, dir);
  }

  function baseSoloScenario() {
    game.mode = "solo";
    game.selectedLevelId = "park";
    game.soloRandomLevelMode = false;
    game.soloEndlessMode = false;
    game.soloCatchGoal = 99;
    game.soloTimeLimitSeconds = 0;
    game.timeOfDayLock = "afternoon";
    game.timeOfDay = "afternoon";
    game.sandboxMode = false;
    resetGame(true);
    game.sandboxMode = false;
    game.state = "playing";
    flies.length = 0;
    game.spawnQueue = [];
    game.completedVocabIndices = new Set();
    game.score = 0;
    game.jumps = 0;
    game.winPending = false;
    game.finishTime = null;
    nextFlyId = 1;
    tongue.active = false;
    positionSoloFrog(35);
    setPrompt(0);
  }

  function configureSoloStep(index) {
    baseSoloScenario();
    const step = SOLO_STEPS[index] || SOLO_STEPS[0];
    const platform = PARK_PLATFORMS[2];
    switch (step.setup) {
      case "welcome":
        makeFly(165, 108, 0, 0);
        makeFly(314, 108, 1, 1);
        break;
      case "match":
        positionSoloFrog(55, CONFIG.groundY - frog.h, 1);
        makeFly(145, 166, 0, 0);
        makeFly(280, 108, 1, 1);
        break;
      case "maxJump":
        positionSoloFrog(35, CONFIG.groundY - frog.h, 1);
        makeFly(235, 62, 0, 0);
        break;
      case "rangeCatch":
        positionSoloFrog(35, CONFIG.groundY - frog.h, 1);
        makeFly(178, 118, 0, 0);
        break;
      case "wrongFly":
        positionSoloFrog(50, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeFly(140, 168, 1, 0);
        makeFly(285, 108, 0, 1);
        break;
      case "wallTurn":
        positionSoloFrog(48, CONFIG.groundY - frog.h, -1);
        makeFly(120, 166, 0, 0);
        break;
      case "reboundCatch":
        positionSoloFrog(44, CONFIG.groundY - frog.h, -1);
        makeFly(112, 151, 0, 0);
        break;
      case "quickDrop":
        positionOnPlatform(platform, 18, 1);
        makeFly(platform.x + 37, platform.y + 31, 0, 0);
        break;
      case "bufferDrop":
        positionSoloFrog(66, CONFIG.groundY - frog.h, 1);
        makeFly(platform.x + 38, platform.y + 31, 0, 0);
        break;
      case "doubleCatch":
        positionSoloFrog(35, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeFly(135, 151, 0, 0);
        makeFly(225, 94, 1, 1);
        break;
      case "normalRound":
        game.sandboxMode = false;
        game.soloCatchGoal = 5;
        resetGame(true);
        game.state = "playing";
        break;
      default: break;
    }
    clearScenarioState();
  }

  function basePvpScenario() {
    game.mode = "pvp";
    game.onlineMode = false;
    game.selectedLevelId = "park";
    game.pvpSetupLevelId = "park";
    game.pvpCpuEnabled = false;
    game.pvpRoundTarget = 99;
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
    setPrompt(0);
  }

  function positionPvp(player, x, y = CONFIG.groundY - player.h, dir = 1) {
    resetPvpPlayer(player, x, dir);
    player.y = y;
    player.previousY = y;
  }

  function configurePvpStep(index) {
    basePvpScenario();
    const step = PVP_STEPS[index] || PVP_STEPS[0];
    const platform = PARK_PLATFORMS[2];
    switch (step.setup) {
      case "pvpWelcome":
        makeFly(240, 108, 0, 0);
        break;
      case "pvpBonk":
        positionPvp(pvpPlayers[0], platform.x + 10, platform.y - pvpPlayers[0].h - 75, 1);
        pvpPlayers[0].grounded = false; pvpPlayers[0].vy = 55;
        positionPvp(pvpPlayers[1], platform.x + 28, platform.y - pvpPlayers[1].h, -1);
        break;
      case "pvpSkyBonk":
        positionPvp(pvpPlayers[0], 225, 42, 1);
        pvpPlayers[0].grounded = false; pvpPlayers[0].vy = 35; pvpPlayers[0].highestY = 42;
        positionPvp(pvpPlayers[1], 225, CONFIG.groundY - pvpPlayers[1].h, -1);
        break;
      case "pvpDoubleBonk":
        positionPvp(pvpPlayers[0], 210, 110, 1);
        pvpPlayers[0].grounded = false; pvpPlayers[0].vy = 55;
        positionPvp(pvpPlayers[1], 210, CONFIG.groundY - pvpPlayers[1].h, -1);
        break;
      case "pvpRebound":
        positionPvp(pvpPlayers[0], 170, CONFIG.groundY - pvpPlayers[0].h, 1);
        positionPvp(pvpPlayers[1], 255, CONFIG.groundY - pvpPlayers[1].h, -1);
        pvpPlayers[0].grounded = false; pvpPlayers[0].vx = 70; pvpPlayers[0].vy = -25;
        pvpPlayers[1].grounded = false; pvpPlayers[1].vx = -70; pvpPlayers[1].vy = -25;
        break;
      case "pvpOffense":
        positionPvp(pvpPlayers[0], 150, CONFIG.groundY - pvpPlayers[0].h, 1);
        positionPvp(pvpPlayers[1], 230, CONFIG.groundY - pvpPlayers[1].h, -1);
        makeFly(105, 170, 0, 0);
        break;
      default: break;
    }
    clearScenarioState();
  }

  function configureStep() {
    if (tutorial.kind === "pvp") configurePvpStep(tutorial.step);
    else configureSoloStep(tutorial.step);
  }

  function failAttempt(message) {
    if (!tutorial.active || tutorial.failedAttemptAt) return;
    tutorial.failureText = message || "TRY AGAIN";
    tutorial.failedAttemptAt = performance.now();
  }

  function passStep() {
    if (!tutorial.active || tutorial.passed) return;
    tutorial.passed = true;
    tutorial.passAt = performance.now();
    tone(620, .07, .018, 85);
  }

  function nextStep() {
    const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
    if (tutorial.step >= steps.length - 1) {
      finish(true);
      return;
    }
    tutorial.step += 1;
    configureStep();
  }

  function finish(completed = false) {
    if (!tutorial.active) return;
    const kind = tutorial.kind;
    tutorial.active = false;
    game.tutorialActive = false;
    game.sandboxMode = false;
    if (completed) {
      try { localStorage.setItem(kind === "pvp" ? PVP_SEEN_KEY : SOLO_SEEN_KEY, "true"); } catch (_) {}
    }
    const snapshot = tutorial.snapshot;
    const runtime = tutorial.runtime;
    try { RibbitCloud.restorePlaytestSnapshot(snapshot || {}); } catch (_) {}
    try { refreshRuntimeProgressFromStorage(); } catch (_) {}
    restoreRuntime(runtime);
    tutorial.snapshot = null;
    tutorial.runtime = null;
    try { RibbitCloud.endPlaytestSession(); } catch (_) {}
    resetGame(false);
    openMainMenu(false);
    game.cheatToastText = completed ? "TUTORIAL COMPLETE!" : "TUTORIAL EXITED";
    game.cheatToastTimer = CONFIG.achievementToastDuration;
  }

  function start(kind = "solo") {
    if (tutorial.active) return true;
    tutorial.active = true;
    tutorial.kind = kind === "pvp" ? "pvp" : "solo";
    tutorial.step = 0;
    tutorial.finalComplete = false;
    tutorial.runtime = saveRuntime();
    tutorial.snapshot = RibbitCloud.beginPlaytestSession?.() || {};
    game.tutorialActive = true;
    configureStep();
    canvas?.focus?.();
    return true;
  }

  function monitorSolo() {
    const step = SOLO_STEPS[tutorial.step]?.setup;
    tutorial.maxCatchesOneJump = Math.max(tutorial.maxCatchesOneJump, Number(game.currentJumpCorrectCatches || 0));
    if (!frog.grounded && frog.dir !== tutorial.lastDir) {
      tutorial.wallTouched = true;
      tutorial.wallTouchedThisJump = true;
    }
    tutorial.lastDir = frog.dir;
    if (game.bufferedDropCatchArmed || (frog.dropThroughPlatform && game.elapsed > 0.2)) tutorial.bufferedDrop = true;

    if (step === "welcome" && game.jumps > tutorial.jumpStart) passStep();
    else if (step === "match" && game.score > tutorial.scoreStart) passStep();
    else if (step === "maxJump") {
      if (tutorial.lastJumpPower >= .95) passStep();
      else if (game.jumps > tutorial.jumpStart && frog.grounded && !frog.charging) failAttempt("HOLD LONGER — REACH FULL CHARGE");
    } else if (step === "rangeCatch" && game.score > tutorial.scoreStart) passStep();
    else if (step === "wrongFly" && (frog.wrongCatchBubbleTimer > 0 || flies.some(f => f.state === "spitting"))) passStep();
    else if (step === "wallTurn" && tutorial.wallTouched && game.score > tutorial.scoreStart) passStep();
    else if (step === "reboundCatch" && tutorial.wallTouchedThisJump && game.score > tutorial.scoreStart && !frog.grounded) passStep();
    else if (step === "quickDrop") {
      if (tutorial.quickDrop && game.score > tutorial.scoreStart) passStep();
      else if (game.jumps > tutorial.jumpStart && frog.grounded && !tutorial.quickDrop) failAttempt("TAP QUICKLY — DO NOT CHARGE");
    } else if (step === "bufferDrop") {
      if (tutorial.bufferedDrop) passStep();
      else if (game.jumps > tutorial.jumpStart && frog.grounded && performance.now() - tutorial.enteredAt > 900) failAttempt("TAP JUST BEFORE LANDING ON THE PLATFORM");
    } else if (step === "doubleCatch") {
      if (tutorial.maxCatchesOneJump >= 2) passStep();
      else if (game.score > tutorial.scoreStart && frog.grounded) failAttempt("CATCH BOTH BEFORE LANDING");
    } else if (step === "normalRound" && (game.score >= 5 || game.state === "won")) passStep();
  }

  function monitorPvp() {
    const step = PVP_STEPS[tutorial.step]?.setup;
    const p1 = pvpPlayers[0], p2 = pvpPlayers[1];
    const stunned = Number(p2?.stunTimer || 0) > 0 || Boolean(p2?.bonked);
    if (stunned && tutorial.pvpLastStun <= 0) tutorial.pvpBonks += 1;
    tutorial.pvpLastStun = Number(p2?.stunTimer || 0);
    const rebound = [p1?.lastOpponentBounceType, p2?.lastOpponentBounceType].some(v => /horizontal|rebound/i.test(String(v || "")));
    if (rebound) tutorial.pvpRebounds = Math.max(1, tutorial.pvpRebounds);

    if (step === "pvpWelcome" && p1?.firstJumpMade) passStep();
    else if (step === "pvpBonk" && tutorial.pvpBonks >= 1) passStep();
    else if (step === "pvpSkyBonk" && tutorial.pvpBonks >= 1 && Number(p1?.highestY || 999) < 80) passStep();
    else if (step === "pvpDoubleBonk" && tutorial.pvpBonks >= 2) passStep();
    else if (step === "pvpRebound" && tutorial.pvpRebounds >= 1) passStep();
    else if (step === "pvpOffense" && tutorial.pvpRebounds >= 1 && Number(p1?.score || 0) > tutorial.pvpScoreStart) passStep();
  }

  function updateTutorial() {
    if (!tutorial.active) return;
    // If the player intentionally returns to a menu through Pause, finish cleanly.
    if (["main", "title", "setup", "friendsLogin"].includes(game.state)) {
      finish(false);
      return;
    }
    if (tutorial.kind === "pvp") monitorPvp();
    else {
      // Tutorial scenarios author their own flies. Remove ordinary replacement
      // tickets before they become live, while the final practice round keeps
      // the normal five-fly spawn loop intact.
      if (SOLO_STEPS[tutorial.step]?.setup !== "normalRound") game.spawnQueue.length = 0;
      monitorSolo();
    }

    if (tutorial.failedAttemptAt && performance.now() - tutorial.failedAttemptAt > 1050) {
      configureStep();
      return;
    }
    if (tutorial.passed && performance.now() - tutorial.passAt > 900) nextStep();
  }

  function tutorialLines() {
    const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
    return steps[tutorial.step] || steps[0];
  }

  function drawTutorialOverlay() {
    if (!tutorial.active) return;
    const step = tutorialLines();
    const total = tutorial.kind === "pvp" ? PVP_STEPS.length : SOLO_STEPS.length;
    const palette = tutorial.kind === "pvp"
      ? {dark:"#6f1325", mid:"#bd2d45", light:"#f5c6d0"}
      : {dark:"#07516a", mid:"#0f9fbb", light:"#b8f5dc"};
    const x = 58, y = 7, w = 364, h = 49;
    ctx.save();
    ctx.globalAlpha = .94;
    ctx.fillStyle = "#26363d"; ctx.fillRect(x-3,y-3,w+6,h+6);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(x,y,w,h);
    ctx.fillStyle = palette.mid; ctx.fillRect(x,y,w,14);
    ctx.fillStyle = palette.light; ctx.fillRect(x+3,y+3,w-6,2);
    ctx.globalAlpha = 1;
    drawBitmapText(`${tutorial.kind === "pvp" ? "PVP" : "PARK"} TUTORIAL ${tutorial.step+1}/${total}`, W/2, y+3, .58, "center", "#fff", palette.dark);
    drawBitmapText(step.title, W/2, y+18, .62, "center", palette.dark);
    drawBitmapText(step.lines[0], W/2, y+31, .42, "center", "#34484f");
    drawBitmapText(step.lines[1], W/2, y+40, .42, "center", "#34484f");
    const status = tutorial.failedAttemptAt ? tutorial.failureText : (tutorial.passed ? "CHECK COMPLETE!" : "COMPLETE THE SCENARIO");
    const statusColor = tutorial.failedAttemptAt ? "#a51f1c" : (tutorial.passed ? "#1d6d3a" : palette.dark);
    drawBitmapText(status, W/2, 61, .42, "center", statusColor);
    ctx.restore();
  }

  // Capture real-engine jump outcomes for scenario checks.
  tutorial.originalLaunchJump = launchJump;
  launchJump = function(...args) {
    const active = tutorial.active && tutorial.kind === "solo";
    const power = Number(frog.charge || 0);
    const standing = active ? getStandingPlatform() : null;
    const quick = Boolean(active && standing && !standing.ground && frog.chargeHoldTime < CONFIG.platformDropHoldThreshold);
    const result = tutorial.originalLaunchJump.apply(this, args);
    if (active) {
      tutorial.lastJumpPower = power;
      tutorial.quickDrop = tutorial.quickDrop || quick;
      tutorial.wallTouchedThisJump = false;
    }
    return result;
  };

  // Draw instructions over the actual game scene—not in a separate practice window.
  const originalDrawScene = drawScene;
  drawScene = function(...args) {
    const result = originalDrawScene.apply(this, args);
    drawTutorialOverlay();
    return result;
  };

  const originalUpdate = update;
  update = function(dt, ...rest) {
    const result = originalUpdate.call(this, dt, ...rest);
    updateTutorial();
    return result;
  };

  window.RibbitRaceTutorialEngine = Object.freeze({
    start,
    exit: () => finish(false),
    get active() { return tutorial.active; },
    get kind() { return tutorial.kind; },
    get step() { return tutorial.step; },
    get build() { return TUTORIAL_BUILD; },
    seen(kind = "solo") {
      try { return localStorage.getItem(kind === "pvp" ? PVP_SEEN_KEY : SOLO_SEEN_KEY) === "true"; }
      catch (_) { return false; }
    },
    resetSeen(kind = "solo") {
      try { localStorage.removeItem(kind === "pvp" ? PVP_SEEN_KEY : SOLO_SEEN_KEY); } catch (_) {}
    }
  });
})();
