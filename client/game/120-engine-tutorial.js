// Ribbit Race Friends 1.7.4  -  checked tutorial scenarios inside the real Park engine.
(() => {
  "use strict";

  const SOLO_SEEN_KEY = "rrFriendsEngineTutorialSoloSeenV4";
  const PVP_SEEN_KEY = "rrFriendsEngineTutorialPvpSeenV4";
  const TUTORIAL_BUILD = "2026.10.11-friends-ember-dialogue-1";
  const TUTORIAL_ACHIEVEMENT_ID = "tutorial-graduate";
  const EMBER_SKIN = Object.freeze({ ...FROG_SKINS.ember, hat: "none" });
  const EMBER_PORTRAIT_SOURCES = Object.freeze({
    confident: "/tutorial/ember-confident.png",
    smile: "/tutorial/ember-smile.png",
    cool: "/tutorial/ember-cool.png",
    laughing: "/tutorial/ember-laughing.png",
    thinking: "/tutorial/ember-thinking.png"
  });
  const EMBER_PORTRAITS = Object.fromEntries(
    Object.entries(EMBER_PORTRAIT_SOURCES).map(([key, source]) => {
      if (typeof Image === "undefined") return [key, null];
      const image = new Image();
      image.decoding = "async";
      image.src = source;
      return [key, image];
    })
  );

  const tutorial = {
    active: false,
    completeScreen: false,
    dialogueOpen: false,
    dialogueOpenedAt: 0,
    dialoguePointerId: null,
    blockJumpUntilRelease: false,
    kind: "solo",
    step: 0,
    passed: false,
    passAt: 0,
    enteredAt: 0,
    snapshot: null,
    runtime: null,
    returnRuntime: null,
    scoreStart: 0,
    jumpStart: 0,
    lastDir: 1,
    wallTouched: false,
    wallTouchedThisJump: false,
    quickDrop: false,
    bufferedDrop: false,
    bufferedPlatforms: new Set(),
    maxCatchesOneJump: 0,
    lastJumpPower: 0,
    failedAttemptAt: 0,
    failureText: "",
    attemptStarted: false,
    attemptWasAirborne: false,
    attemptEnded: false,
    sequence: [],
    mentorSide: "right",
    mentorX: PVP_START_X[1],
    mentorY: CONFIG.groundY - frog.h,
    pauseNoticeUntil: 0,
    pvpBonks: 0,
    pvpRebounds: 0,
    pvpLastStun: 0,
    pvpScoreStart: 0,
    originalLaunchJump: null,
    previousState: "",
    completionButton: Object.freeze({ x: 151, y: 199, w: 178, h: 30 })
  };

  const previousFriendsInputLock =
    typeof window !== "undefined" ? window.RibbitFriendsGameInputLocked : null;
  if (typeof window !== "undefined") {
    window.RibbitFriendsGameInputLocked = () => {
      let previouslyLocked = false;
      try { previouslyLocked = previousFriendsInputLock?.() === true; } catch (_) {}
      return previouslyLocked ||
        tutorial.dialogueOpen ||
        tutorial.blockJumpUntilRelease ||
        tutorial.completeScreen;
    };
  }

  const SOLO_STEPS = Object.freeze([
    Object.freeze({
      title: "WELCOME TO RIBBIT RACE",
      dialogue: [
        "HEY THERE! I'M EMBER. WELCOME TO RIBBIT RACE!",
        "I'LL SHOW YOU THE ROPES SO YOU CAN HOP, CATCH,",
        "AND COMPETE LIKE A PRO."
      ],
      portrait: "smile",
      goal: ["MAKE ONE JUMP"], setup: "welcome", mentor: "right"
    }),
    Object.freeze({
      title: "MATCH THE TERM",
      dialogue: [
        "YOUR GOAL IS SIMPLE: CATCH FLIES AND BE THE BEST!",
        "I'LL GIVE YOU AN ENGLISH TERM. CATCH THE FLY",
        "WITH THE MATCHING SPANISH WORD."
      ],
      portrait: "confident",
      goal: ["CATCH THE", "MATCHING FLY"], setup: "match", mentor: "right"
    }),
    Object.freeze({
      title: "CHARGE A FULL JUMP",
      dialogue: [
        "HOLD TO CHARGE YOUR JUMP, THEN RELEASE TO LEAP!",
        "THE LONGER YOU HOLD, THE FARTHER YOU GO.",
        "CATCH THIS FLY WITH ONE FULLY CHARGED JUMP."
      ],
      portrait: "cool",
      goal: ["MAX CHARGE", "+ CATCH"], setup: "maxJump", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "AUTOMATIC CATCH RANGE",
      dialogue: [
        "FLIES ARE CAUGHT AUTOMATICALLY WHEN YOU'RE CLOSE.",
        "YOUR TONGUE CAN REACH A LITTLE FARTHER TOO - ",
        "YOU DON'T HAVE TO LAND DIRECTLY ON THE FLY."
      ],
      portrait: "confident",
      goal: ["GET WITHIN", "CATCH RANGE"], setup: "rangeCatch", mentor: "right"
    }),
    Object.freeze({
      title: "WRONG FLIES ARE SAFE",
      dialogue: [
        "GRAB THE WRONG FLY? NO WORRIES!",
        "YOUR FROG WILL SPIT IT BACK OUT.",
        "TRY THE WRONG ONE ON PURPOSE THIS TIME."
      ],
      portrait: "laughing",
      goal: ["CATCH THE", "WRONG FLY"], setup: "wrongFly", mentor: "right"
    }),
    Object.freeze({
      title: "TURN AROUND WITH A WALL",
      dialogue: [
        "ONE CATCH: YOU CAN'T TURN AROUND IN MID-AIR.",
        "HIT A WALL TO FLIP DIRECTION, THEN COME BACK",
        "FOR THE FLY YOU PASSED."
      ],
      portrait: "thinking",
      goal: ["WALL TURN", "THEN CATCH"], setup: "wallTurn", mentor: "left", oneAttempt: true
    }),
    Object.freeze({
      title: "REBOUND CATCH",
      dialogue: [
        "NOW LET'S MAKE THAT WALL TURN LOOK SMOOTH.",
        "YOU GET ONE JUMP: HIT THE WALL, REBOUND,",
        "AND CATCH THE FLY ON THE WAY BACK."
      ],
      portrait: "cool",
      goal: ["ONE JUMP", "REBOUND CATCH"], setup: "reboundCatch", mentor: "left", oneAttempt: true
    }),
    Object.freeze({
      title: "QUICK PLATFORM DROP",
      dialogue: [
        "ON A PLATFORM, TAP JUMP QUICKLY TO DROP THROUGH.",
        "THE FLY IS JUST AHEAD AND BELOW.",
        "ONE ATTEMPT - DROP AND CATCH IT."
      ],
      portrait: "confident",
      goal: ["QUICK DROP", "+ CATCH"], setup: "quickDrop", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "BUFFER A PLATFORM DROP",
      dialogue: [
        "YOU CAN BUFFER A DROP BEFORE YOU LAND.",
        "CHARGE TO THE TOP PLATFORM, TAP JUST BEFORE",
        "TOUCHDOWN, AND FALL THROUGH TO THE FLY."
      ],
      portrait: "thinking",
      goal: ["BUFFER THROUGH", "TOP PLATFORM"], setup: "bufferDrop", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "DOUBLE BUFFER DROP",
      dialogue: [
        "READY FOR THE FANCY VERSION?",
        "BUFFER THROUGH THE TOP, THEN THE MIDDLE,",
        "AND CATCH ALL THREE FLIES ON THE WAY DOWN."
      ],
      portrait: "cool",
      goal: ["2 BUFFERS", "3 FLIES"], setup: "doubleBuffer", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "TWO FLIES IN ONE ARC",
      dialogue: [
        "LINE UP MULTIPLE FLIES IN ONE JUMP ARC.",
        "IT'S A GREAT WAY TO GO FASTER!",
        "CATCH BOTH BEFORE YOU LAND."
      ],
      portrait: "smile",
      goal: ["2 FLIES", "1 JUMP"], setup: "doubleCatch", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "FINAL PRACTICE ROUND",
      dialogue: [
        "THAT'S THE BASICS! NOW PUT IT ALL TOGETHER.",
        "CATCH FIVE FLIES IN A NORMAL PARK ROUND.",
        "I'LL BE CHEERING FROM THE SIDELINES!"
      ],
      portrait: "smile",
      goal: ["CATCH ALL", "5 FLIES"], setup: "normalRound", mentor: "right"
    })
  ]);

  const PVP_STEPS = Object.freeze([
    Object.freeze({
      title: "VERSUS TUTORIAL",
      dialogue: ["VERSUS USES THE SAME JUMP-AND-CATCH RULES.", "THIS TIME, I'LL BE THE OTHER FROG.", "MAKE ONE CHARGED JUMP TO BEGIN."],
      portrait: "confident", goal: ["MAKE ONE", "CHARGED JUMP"], setup: "pvpWelcome"
    }),
    Object.freeze({
      title: "BONK FROM ABOVE",
      dialogue: ["LAND ON TOP OF ME WHILE YOU'RE FALLING.", "THAT'S A BONK - IT KNOCKS THE LOWER FROG DOWN", "AND STUNS THEM FOR A MOMENT."],
      portrait: "cool", goal: ["BONK EMBER", "FROM ABOVE"], setup: "pvpBonk"
    }),
    Object.freeze({
      title: "SKY BONK",
      dialogue: ["THE HIGHER THE BONK, THE LONGER THE STUN.", "CLIMB INTO THE TOP HALF OF THE SCREEN", "BEFORE YOU COME DOWN ON ME."],
      portrait: "smile", goal: ["LAND A", "SKY BONK"], setup: "pvpSkyBonk"
    }),
    Object.freeze({
      title: "WAIT FOR RECOVERY",
      dialogue: ["A BONKED FROG GETS A SHORT BREAK FROM BONKS.", "WAIT FOR ME TO RECOVER, THEN LAND", "A SECOND CLEAN BONK."],
      portrait: "thinking", goal: ["BONK TWICE", "AFTER RECOVERY"], setup: "pvpDoubleBonk"
    }),
    Object.freeze({
      title: "HORIZONTAL REBOUND",
      dialogue: ["SIDE-TO-SIDE CONTACT MAKES BOTH FROGS REBOUND.", "USE IT TO TURN AROUND WITHOUT A WALL.", "COLLIDE WITH ME HORIZONTALLY."],
      portrait: "cool", goal: ["MAKE A", "REBOUND"], setup: "pvpRebound"
    }),
    Object.freeze({
      title: "OFFENSIVE REBOUND",
      dialogue: ["REBOUNDS CAN SET UP A SNEAKY FLY CATCH.", "BOUNCE OFF ME, TURN AROUND,", "AND STEAL THE FLY BEHIND YOU."],
      portrait: "laughing", goal: ["REBOUND", "THEN CATCH"], setup: "pvpOffense"
    })
  ]);


  const GROUND = () => ({ x: 0, y: CONFIG.groundY, w: W, h: 15, ground: true, tutorialId: "ground" });
  const cloneParkPlatforms = () => PARK_PLATFORMS.map((platform, index) => ({ ...platform, tutorialId: `park-${index}` }));
  const platformKey = (platform) => platform ? String(platform.tutorialId || `${platform.x}:${platform.y}:${platform.w}`) : "";

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

  function clearHeldInput() {
    try { clearSoloPhysicalInputState(true); } catch (_) {}
    try { clearPvpPhysicalShiftState(true); } catch (_) {}
    game.buttonHeld = false;
    frog.charging = false;
    frog.chargeHoldTime = 0;
    game.airborneTapPressAt = -Infinity;
    game.platformDropBufferUntil = -Infinity;
  }

  function clearLabelCaches() {
    try { flyLabelPlacementCache.clear(); } catch (_) {}
    try { flyLabelSpriteCache.clear(); } catch (_) {}
  }

  function restoreStepSequence() {
    const setup = tutorialStep()?.setup;
    if (setup === "doubleBuffer") setSequence([0, 1, 2]);
    else if (setup === "doubleCatch") setSequence([0, 1]);
  }

  function openDialogue() {
    tutorial.dialogueOpen = true;
    tutorial.dialogueOpenedAt = performance.now();
    tutorial.dialoguePointerId = null;
    tutorial.blockJumpUntilRelease = false;
    clearHeldInput();
  }

  function armScenarioAfterDialogue() {
    clearScenarioState();
    restoreStepSequence();
    tutorial.enteredAt = performance.now();
  }

  function closeDialogue(source = "keyboard") {
    if (!tutorial.active || !tutorial.dialogueOpen) return false;
    if (performance.now() - tutorial.dialogueOpenedAt < 120) return false;
    tutorial.dialogueOpen = false;
    tutorial.dialoguePointerId = null;
    tutorial.blockJumpUntilRelease = source === "space";
    clearHeldInput();
    armScenarioAfterDialogue();
    tone(420, .045, .012, 45);
    return true;
  }

  function setMentor(side = "right") {
    tutorial.mentorSide = side === "left" ? "left" : "right";
    tutorial.mentorX = tutorial.mentorSide === "left" ? PVP_START_X[0] : PVP_START_X[1];
    tutorial.mentorY = CONFIG.groundY - frog.h;
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
    tutorial.bufferedPlatforms = new Set();
    tutorial.maxCatchesOneJump = 0;
    tutorial.lastJumpPower = 0;
    tutorial.failedAttemptAt = 0;
    tutorial.failureText = "";
    tutorial.attemptStarted = false;
    tutorial.attemptWasAirborne = false;
    tutorial.attemptEnded = false;
    tutorial.sequence = [];
    tutorial.pvpBonks = 0;
    tutorial.pvpRebounds = 0;
    tutorial.pvpLastStun = 0;
    tutorial.pvpScoreStart = Number(pvpPlayers[0]?.score || 0);
    tutorial.lastDir = tutorial.kind === "pvp" ? Number(pvpPlayers[0]?.dir || 1) : Number(frog.dir || 1);
    clearHeldInput();
    clearLabelCaches();
  }

  function makeFly(x, y, vocabIndex, spawnIndex = -100) {
    const fly = {
      id: nextFlyId++, baseX:x, baseY:y, x, y,
      phase:0, spawnIndex, spawnAge:1,
      vocabIndex, state:"active", touchLocked:false,
      blockedPromptSerial:-1,
      pvpBlockedPromptSerials:[-1,-1],
      pvpPursuers:[false,false], pvpPursuitTimes:[null,null],
      pvpPursuitPromptSerial:-1,
      spitElapsed:0, spitDelay:0, spitDuration:.34, spitStarted:false,
      spitOwnerIndex:null, spitStartX:x, spitStartY:y, returnX:x, returnY:y,
      tutorialAuthored:true
    };
    flies.push(fly);
    return fly;
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

  function usePlatforms(authored = []) {
    platforms = [GROUND(), ...authored.map((platform, index) => ({ ...platform, tutorialId: platform.tutorialId || `tutorial-${index}` }))];
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
    platforms = cloneParkPlatforms();
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
    setMentor(step.mentor || "right");

    switch (step.setup) {
      case "welcome":
        positionSoloFrog(82, CONFIG.groundY - frog.h, 1);
        break;

      case "match":
        positionSoloFrog(55, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeFly(165, 150, 0, 0);
        makeFly(314, 108, 1, 1);
        break;

      case "maxJump": {
        const startPlatform = platforms[1];
        positionOnPlatform(startPlatform, 18, 1);
        setPrompt(0);
        makeFly(241, 39, 0, 0);
        break;
      }

      case "rangeCatch":
        positionSoloFrog(55, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeFly(165, 154, 0, 0);
        break;

      case "wrongFly":
        positionSoloFrog(55, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeFly(150, 158, 1, 0);
        makeFly(300, 105, 0, 1);
        break;

      case "wallTurn":
        positionSoloFrog(286, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeFly(247, 162, 0, 0);
        break;

      case "reboundCatch":
        positionSoloFrog(386, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeFly(320, 151, 0, 0);
        break;

      case "quickDrop": {
        const dropPlatform = { x: 118, y: 126, w: 112, h: 12, tutorialId: "quick-drop" };
        usePlatforms([dropPlatform, { x: 331, y: 126, w: 70, h: 12 }]);
        positionOnPlatform(platforms[1], 24, 1);
        setPrompt(0);
        makeFly(194, 158, 0, 0);
        break;
      }

      case "bufferDrop": {
        const start = { x: 36, y: 176, w: 92, h: 12, tutorialId: "buffer-start" };
        const top = { x: 205, y: 70, w: 94, h: 12, tutorialId: "buffer-top" };
        const middle = { x: 205, y: 126, w: 94, h: 12, tutorialId: "buffer-middle" };
        usePlatforms([start, top, middle]);
        positionOnPlatform(platforms[1], 18, 1);
        setPrompt(0);
        makeFly(258, 111, 0, 0);
        break;
      }

      case "doubleBuffer": {
        const top = { x: 164, y: 70, w: 174, h: 12, tutorialId: "double-top" };
        const middle = { x: 164, y: 126, w: 174, h: 12, tutorialId: "double-middle" };
        const bottom = { x: 164, y: 182, w: 174, h: 12, tutorialId: "double-bottom" };
        usePlatforms([top, middle, bottom]);
        positionOnPlatform(platforms[1], 20, 1);
        makeFly(224, 96, 0, 0);
        makeFly(268, 150, 1, 1);
        makeFly(311, 169, 2, 2);
        setSequence([0, 1, 2]);
        break;
      }

      case "doubleCatch":
        positionSoloFrog(45, CONFIG.groundY - frog.h, 1);
        makeFly(140, 151, 0, 0);
        makeFly(225, 94, 1, 1);
        setSequence([0, 1]);
        break;

      case "normalRound":
        platforms = cloneParkPlatforms();
        game.sandboxMode = false;
        game.soloCatchGoal = 5;
        resetGame(true);
        game.state = "playing";
        break;

      default:
        break;
    }

    clearScenarioState();
    setMentor(step.mentor || "right");
    if (step.setup === "doubleBuffer") setSequence([0, 1, 2]);
    else if (step.setup === "doubleCatch") setSequence([0, 1]);
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
    pvpPlayers[1].skinId = "ember";
    game.pvpSetupSkinIds[1] = "ember";
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
      default:
        break;
    }
    pvpPlayers[1].skinId = "ember";
    clearScenarioState();
  }

  function configureStep(showDialogue = true) {
    if (tutorial.kind === "pvp") configurePvpStep(tutorial.step);
    else configureSoloStep(tutorial.step);
    tutorial.dialogueOpen = false;
    tutorial.dialoguePointerId = null;
    tutorial.blockJumpUntilRelease = false;
    if (showDialogue) openDialogue();
  }

  function failAttempt(message) {
    if (!tutorial.active || tutorial.failedAttemptAt || tutorial.passed) return;
    tutorial.failureText = message || "TRY AGAIN";
    tutorial.failedAttemptAt = performance.now();
    tone(150, .08, .018, -35);
  }

  function passStep() {
    if (!tutorial.active || tutorial.passed) return;
    tutorial.passed = true;
    tutorial.passAt = performance.now();
    tone(620, .07, .018, 85);
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

  function beginCompletionScreen() {
    if (!tutorial.active) return;
    tutorial.active = false;
    tutorial.dialogueOpen = false;
    tutorial.blockJumpUntilRelease = false;
    game.tutorialActive = false;
    tutorial.returnRuntime = restoreLegitimateState(true);
    game.mode = "solo";
    game.selectedLevelId = "park";
    game.soloRandomLevelMode = false;
    game.soloEndlessMode = false;
    game.soloCatchGoal = 5;
    game.soloTimeLimitSeconds = 0;
    game.timeOfDayLock = "afternoon";
    game.timeOfDay = "afternoon";
    resetGame(true);
    platforms = cloneParkPlatforms();
    flies.length = 0;
    game.spawnQueue = [];
    positionSoloFrog(W / 2 - frog.w / 2, CONFIG.groundY - frog.h, 1);
    game.state = "tutorialComplete";
    tutorial.completeScreen = true;
    clearHeldInput();
    clearLabelCaches();
  }

  function dismissCompletionScreen() {
    if (!tutorial.completeScreen) return;
    tutorial.completeScreen = false;
    const runtime = tutorial.returnRuntime;
    tutorial.returnRuntime = null;
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
    game.tutorialActive = false;
    game.sandboxMode = false;
    const runtime = restoreLegitimateState(false);
    restoreRuntime(runtime);
    resetGame(false);
    openMainMenu(false);
    game.cheatToastText = "TUTORIAL EXITED";
    game.cheatToastTimer = CONFIG.achievementToastDuration;
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

  function start(kind = "solo") {
    if (tutorial.active || tutorial.completeScreen) return true;
    tutorial.active = true;
    tutorial.completeScreen = false;
    tutorial.kind = kind === "pvp" ? "pvp" : "solo";
    tutorial.step = 0;
    tutorial.runtime = saveRuntime();
    tutorial.snapshot = RibbitCloud.beginPlaytestSession?.() || {};
    game.tutorialActive = true;
    configureStep();
    canvas?.focus?.();
    return true;
  }

  function attemptFinishedOnLanding() {
    if (!tutorial.attemptStarted) return false;
    if (!frog.grounded) tutorial.attemptWasAirborne = true;
    if (tutorial.attemptWasAirborne && frog.grounded && !tutorial.attemptEnded) {
      tutorial.attemptEnded = true;
      return true;
    }
    return false;
  }

  function alignTutorialFlies() {
    if (!tutorial.active) return;
    for (const currentFly of flies) {
      if (!currentFly?.tutorialAuthored || currentFly.state !== "active") continue;
      currentFly.phase = 0;
      currentFly.x = currentFly.baseX;
      currentFly.y = currentFly.baseY;
    }
  }

  function monitorSolo() {
    const step = SOLO_STEPS[tutorial.step]?.setup;
    maintainSequencePrompt();
    alignTutorialFlies();
    tutorial.maxCatchesOneJump = Math.max(tutorial.maxCatchesOneJump, Number(game.currentJumpCorrectCatches || 0));

    if (!frog.grounded && frog.dir !== tutorial.lastDir) {
      tutorial.wallTouched = true;
      tutorial.wallTouchedThisJump = true;
    }
    tutorial.lastDir = frog.dir;

    if (game.bufferedDropCatchArmed && frog.dropThroughPlatform) {
      tutorial.bufferedDrop = true;
      tutorial.bufferedPlatforms.add(platformKey(frog.dropThroughPlatform));
    }

    const caught = Math.max(0, Number(game.score || 0) - tutorial.scoreStart);
    const attemptEnded = attemptFinishedOnLanding();

    if (step === "welcome" && game.jumps > tutorial.jumpStart) passStep();
    else if (step === "match" && caught >= 1) passStep();
    else if (step === "maxJump") {
      if (caught >= 1 && tutorial.lastJumpPower >= .95) passStep();
      else if (attemptEnded) failAttempt(tutorial.lastJumpPower < .95 ? "FILL THE METER BEFORE RELEASING" : "CATCH THE FLY IN THAT ONE JUMP");
    } else if (step === "rangeCatch" && caught >= 1) passStep();
    else if (step === "wrongFly" && (frog.wrongCatchBubbleTimer > 0 || flies.some(fly => fly.state === "spitting"))) passStep();
    else if (step === "wallTurn") {
      if (tutorial.wallTouchedThisJump && caught >= 1) passStep();
      else if (attemptEnded) failAttempt("ONE WALL TURN, THEN CATCH THE FLY");
    } else if (step === "reboundCatch") {
      if (tutorial.wallTouchedThisJump && caught >= 1 && !frog.grounded) passStep();
      else if (attemptEnded) failAttempt("ONE JUMP ONLY  -  REBOUND AND CATCH");
    } else if (step === "quickDrop") {
      if (tutorial.quickDrop && caught >= 1) passStep();
      else if (attemptEnded) failAttempt(tutorial.quickDrop ? "YOU DROPPED THROUGH  -  NOW CATCH THE FLY" : "TAP QUICKLY  -  DO NOT CHARGE");
    } else if (step === "bufferDrop") {
      if (tutorial.bufferedPlatforms.size >= 1 && caught >= 1) passStep();
      else if (attemptEnded) failAttempt("TAP BEFORE LANDING ON THE TOP PLATFORM");
    } else if (step === "doubleBuffer") {
      if (tutorial.bufferedPlatforms.size >= 2 && caught >= 3) passStep();
      else if (attemptEnded) failAttempt("BUFFER TWICE AND CATCH ALL THREE FLIES");
    } else if (step === "doubleCatch") {
      if (tutorial.maxCatchesOneJump >= 2 && caught >= 2) passStep();
      else if (attemptEnded) failAttempt("CATCH BOTH FLIES BEFORE LANDING");
    } else if (step === "normalRound" && (game.score >= 5 || game.state === "won")) passStep();
  }

  function monitorPvp() {
    const step = PVP_STEPS[tutorial.step]?.setup;
    const p1 = pvpPlayers[0], p2 = pvpPlayers[1];
    const stunned = Number(p2?.stunTimer || 0) > 0 || Boolean(p2?.bonked);
    if (stunned && tutorial.pvpLastStun <= 0) tutorial.pvpBonks += 1;
    tutorial.pvpLastStun = Number(p2?.stunTimer || 0);
    const rebound = [p1?.lastOpponentBounceType, p2?.lastOpponentBounceType].some(value => /horizontal|rebound/i.test(String(value || "")));
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
    if (game.state === "paused") game.state = "playing";
    if (tutorial.dialogueOpen) return;
    if (["main", "title", "setup", "friendsLogin"].includes(game.state)) {
      finish(false);
      return;
    }

    if (tutorial.kind === "pvp") monitorPvp();
    else {
      if (SOLO_STEPS[tutorial.step]?.setup !== "normalRound") game.spawnQueue.length = 0;
      monitorSolo();
    }

    if (tutorial.failedAttemptAt && performance.now() - tutorial.failedAttemptAt > 900) {
      configureStep(false);
      return;
    }
    if (tutorial.passed && performance.now() - tutorial.passAt > 800) nextStep();
  }

  function tutorialStep() {
    const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
    return steps[tutorial.step] || steps[0];
  }

  function drawMentorFrog() {
    if (!tutorial.active || tutorial.kind !== "solo") return;
    const centerX = Math.round(tutorial.mentorX + frog.w / 2);
    const baseY = Math.round(tutorial.mentorY + frog.h);
    const blink = Math.floor(game.visualTime * 1.8) % 11 === 0;
    ctx.save();
    ctx.translate(centerX, baseY);
    ctx.scale(tutorial.mentorSide === "left" ? 1 : -1, 1);
    ctx.translate(-11, -14);
    drawGameplayFrogSpriteLocal(EMBER_SKIN, false, blink);
    ctx.restore();
    drawBitmapText("EMBER", centerX, baseY + 4, .42, "center", EMBER_SKIN.dark);
  }

  function drawTutorialDialogue() {
    if (!tutorial.active || !tutorial.dialogueOpen) return;
    const step = tutorialStep();
    const lines = Array.isArray(step.dialogue) && step.dialogue.length
      ? step.dialogue.slice(0, 3)
      : [step.title];
    const panel = { x: 12, y: 144, w: 456, h: 78 };
    const portrait = { x: 374, y: 149, w: 86, h: 68 };
    const textLeft = panel.x + 14;
    const textCenter = (textLeft + portrait.x - 10) / 2;
    const mobile = typeof isRibbitMobileMode === "function" && isRibbitMobileMode();
    const prompt = mobile ? "TAP TO CONTINUE" : "PRESS SPACE TO CONTINUE";
    const portraitImage = EMBER_PORTRAITS[step.portrait] || EMBER_PORTRAITS.confident;

    ctx.save();
    ctx.globalAlpha = .96;

    // Pixel shadow and dark Dave-the-Diver-inspired dialogue frame.
    ctx.fillStyle = "rgba(8,25,35,.45)";
    ctx.fillRect(panel.x + 4, panel.y + 5, panel.w, panel.h);
    ctx.fillStyle = "#052f45";
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = "#37d9ef";
    ctx.fillRect(panel.x + 2, panel.y + 2, panel.w - 4, 3);
    ctx.fillRect(panel.x + 2, panel.y + panel.h - 5, panel.w - 4, 3);
    ctx.fillRect(panel.x + 2, panel.y + 2, 3, panel.h - 4);
    ctx.fillRect(panel.x + panel.w - 5, panel.y + 2, 3, panel.h - 4);
    ctx.fillStyle = "#073b55";
    ctx.fillRect(panel.x + 7, panel.y + 8, portrait.x - panel.x - 15, panel.h - 16);

    // Speech notch points toward Ember's portrait on the right.
    ctx.fillStyle = "#37d9ef";
    ctx.fillRect(portrait.x - 8, panel.y + 31, 8, 16);
    ctx.fillStyle = "#073b55";
    ctx.fillRect(portrait.x - 8, panel.y + 34, 8, 10);

    // Portrait frame.
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(portrait.x, portrait.y, portrait.w, portrait.h);
    ctx.fillStyle = "#2a6d8e";
    ctx.fillRect(portrait.x + 3, portrait.y + 3, portrait.w - 6, portrait.h - 6);
    if (portraitImage?.complete && portraitImage.naturalWidth > 0) {
      const oldSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        portraitImage,
        portrait.x + 4,
        portrait.y + 4,
        portrait.w - 8,
        portrait.h - 8
      );
      ctx.imageSmoothingEnabled = oldSmoothing;
    } else {
      ctx.save();
      ctx.translate(portrait.x + portrait.w / 2, portrait.y + portrait.h - 10);
      ctx.scale(2.1, 2.1);
      ctx.translate(-11, -14);
      drawGameplayFrogSpriteLocal(EMBER_SKIN, false, false);
      ctx.restore();
    }

    // Orange nameplate overlays the portrait's lower edge.
    const nameX = portrait.x + 9;
    const nameY = portrait.y + portrait.h - 14;
    const nameW = portrait.w - 18;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(nameX - 2, nameY - 2, nameW + 4, 14);
    ctx.fillStyle = "#ff9b45";
    ctx.fillRect(nameX, nameY, nameW, 10);
    drawBitmapText("EMBER", nameX + nameW / 2, nameY + 1, .46, "center", "#3d2417");

    // Dialogue copy.
    drawBitmapText(step.title, textCenter, panel.y + 10, .44, "center", "#74e6f5");
    const lineYs = [panel.y + 25, panel.y + 38, panel.y + 51];
    for (let index = 0; index < lines.length; index += 1) {
      drawBitmapText(lines[index], textLeft, lineYs[index], .37, "left", COLORS.white);
    }
    drawBitmapText(prompt, textLeft, panel.y + 65, .34, "left", "#bdeef5");

    // Continue indicator.
    const arrowX = portrait.x - 18;
    const arrowY = panel.y + panel.h - 14;
    ctx.fillStyle = "#dff8ff";
    ctx.fillRect(arrowX, arrowY, 8, 3);
    ctx.fillRect(arrowX + 2, arrowY + 3, 4, 3);
    ctx.fillRect(arrowX + 3, arrowY + 6, 2, 2);
    ctx.restore();
  }

  function drawTutorialStatus() {
    if (!tutorial.active || tutorial.dialogueOpen) return;
    const failed = Boolean(tutorial.failedAttemptAt);
    const success = tutorial.passed;
    if (!failed && !success) return;
    const text = failed
      ? (tutorial.failureText || "TRY THAT AGAIN")
      : "NICE WORK! NEXT LESSON...";
    const w = clamp(60 + text.length * 4, 190, 330);
    const x = W / 2 - w / 2;
    const y = 18;
    ctx.save();
    ctx.globalAlpha = .92;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(x, y, w, 18);
    ctx.fillStyle = failed ? "#f8d8df" : EMBER_SKIN.belly;
    ctx.fillRect(x + 3, y + 3, w - 6, 12);
    drawBitmapText(text, W / 2, y + 5, .43, "center", failed ? "#a51f1c" : EMBER_SKIN.dark);
    ctx.restore();
  }

  function drawTutorialProgress() {
    if (!tutorial.active) return;
    const total = tutorial.kind === "pvp" ? PVP_STEPS.length : SOLO_STEPS.length;
    const label = `${tutorial.kind === "pvp" ? "PVP" : "PARK"} TUTORIAL ${tutorial.step + 1}/${total}`;
    const w = 126, x = W / 2 - w / 2, y = 4;
    ctx.save();
    ctx.globalAlpha = .82;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = tutorial.kind === "pvp" ? "#bd2d45" : "#0f9fbb";
    ctx.fillRect(x + 2, y + 2, w - 4, 8);
    ctx.globalAlpha = 1;
    drawBitmapText(label, W / 2, y + 3, .42, "center", COLORS.white);
    ctx.restore();
  }

  function drawCurrentGoalHud() {
    if (!tutorial.active) return;
    const step = tutorialStep();
    const goal = Array.isArray(step.goal) ? step.goal : [step.title];
    const x = 324, y = CONFIG.playBottom + 4, w = W - x, h = H - y;
    ctx.save();
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = EMBER_SKIN.belly;
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = EMBER_SKIN.mid;
    ctx.fillRect(x + 5, y + 5, w - 10, 4);
    drawBitmapText("CURRENT GOAL", x + w / 2, y + 8, .43, "center", EMBER_SKIN.dark);
    if (goal.length > 1) {
      drawBitmapText(goal[0], x + w / 2, y + 19, .52, "center", "#34484f");
      drawBitmapText(goal[1], x + w / 2, y + 29, .52, "center", "#34484f");
    } else {
      drawBitmapText(goal[0], x + w / 2, y + 24, .55, "center", "#34484f");
    }
    ctx.restore();
  }

  function drawTutorialOverlay() {
    if (!tutorial.active) return;
    drawMentorFrog();
    drawTutorialProgress();
    if (tutorial.dialogueOpen) {
      drawTutorialDialogue();
    } else {
      drawCurrentGoalHud();
      drawTutorialStatus();
    }
    if (performance.now() < tutorial.pauseNoticeUntil) {
      drawBitmapText("THE TUTORIAL CANNOT BE PAUSED", W / 2, 218, .48, "center", "#a51f1c", COLORS.white);
    }
  }

  function drawCompletionScreen() {
    if (!tutorial.completeScreen) return;
    const button = tutorial.completionButton;
    const pulse = .75 + Math.sin(game.visualTime * 5) * .25;
    ctx.save();
    ctx.fillStyle = "rgba(8,25,35,.76)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(38,54,61,.35)";
    ctx.fillRect(73, 31, 340, 210);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(68, 26, 340, 210);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(73, 31, 330, 200);
    ctx.fillStyle = EMBER_SKIN.mid;
    ctx.fillRect(78, 36, 320, 39);
    ctx.fillStyle = EMBER_SKIN.light;
    ctx.fillRect(82, 40, 312, 4);
    drawBitmapText("CONGRATULATIONS!", W / 2, 46, 1.25, "center", COLORS.white, EMBER_SKIN.dark);
    drawPixelTrophy(134, 91, false, 1.7);
    drawMiniFrogSwatchFacing(347, 92, EMBER_SKIN, 1.65, -1);
    drawBitmapText("PARK TUTORIAL COMPLETE", W / 2, 103, .82, "center", EMBER_SKIN.dark);
    drawBitmapText("ACHIEVEMENT UNLOCKED", W / 2, 126, .55, "center", "#59676d");
    drawAchievementIcon("park", 177, 139, true, 1.35, EMBER_SKIN);
    drawBitmapText("RIBBIT READY", 257, 145, .86, "center", EMBER_SKIN.dark);
    drawBitmapText("YOU'RE READY TO RACE!", W / 2, 172, .62, "center", "#34484f");
    ctx.globalAlpha = .92 + pulse * .08;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(button.x, button.y, button.w, button.h);
    ctx.fillStyle = EMBER_SKIN.belly;
    ctx.fillRect(button.x + 3, button.y + 3, button.w - 6, button.h - 6);
    ctx.fillStyle = EMBER_SKIN.light;
    ctx.fillRect(button.x + 5, button.y + 5, button.w - 10, 3);
    drawBitmapText("CONTINUE", button.x + button.w / 2, button.y + 10, .85, "center", EMBER_SKIN.dark);
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
    if (active && !frog.grounded) {
      tutorial.lastJumpPower = power;
      tutorial.quickDrop = tutorial.quickDrop || quick;
      tutorial.wallTouchedThisJump = false;
      tutorial.attemptStarted = true;
      tutorial.attemptWasAirborne = true;
      tutorial.attemptEnded = false;
    }
    return result;
  };

  // Hide the normal first-jump keyboard bubble; Ember teaches the tutorial.
  const originalDrawSpeechBubble = drawSpeechBubble;
  drawSpeechBubble = function(...args) {
    if (tutorial.active) return;
    return originalDrawSpeechBubble.apply(this, args);
  };

  // Pause is intentionally disabled inside authored tutorial checks.
  const originalPauseGame = pauseGame;
  pauseGame = function(...args) {
    if (tutorial.active || tutorial.completeScreen) {
      tutorial.pauseNoticeUntil = performance.now() + 1200;
      return;
    }
    return originalPauseGame.apply(this, args);
  };

  const originalTogglePauseFromHud = togglePauseFromHud;
  togglePauseFromHud = function(...args) {
    if (tutorial.active || tutorial.completeScreen) {
      tutorial.pauseNoticeUntil = performance.now() + 1200;
      return;
    }
    return originalTogglePauseFromHud.apply(this, args);
  };

  const originalHandleGameEscapeAction = handleGameEscapeAction;
  handleGameEscapeAction = function(...args) {
    if (tutorial.active || tutorial.completeScreen) {
      tutorial.pauseNoticeUntil = performance.now() + 1200;
      return;
    }
    return originalHandleGameEscapeAction.apply(this, args);
  };

  const originalDrawScene = drawScene;
  drawScene = function(...args) {
    const result = originalDrawScene.apply(this, args);
    if (tutorial.active) drawTutorialOverlay();
    if (tutorial.completeScreen) drawCompletionScreen();
    return result;
  };

  const originalUpdate = update;
  update = function(dt, ...rest) {
    if (tutorial.active && tutorial.dialogueOpen) {
      if (game.state === "paused") game.state = "playing";
      return undefined;
    }
    const result = originalUpdate.call(this, dt, ...rest);
    updateTutorial();
    return result;
  };

  document.addEventListener("keydown", (event) => {
    if (tutorial.completeScreen && ["Enter", "NumpadEnter", "Space", "Escape"].includes(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      dismissCompletionScreen();
      return;
    }
    if (tutorial.active && tutorial.dialogueOpen && ["Space", "Enter", "NumpadEnter"].includes(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) closeDialogue(event.code === "Space" ? "space" : "keyboard");
      return;
    }
    if (tutorial.active && ["Escape", "Backspace"].includes(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      tutorial.pauseNoticeUntil = performance.now() + 1200;
    }
  }, { capture:true, passive:false });

  document.addEventListener("keyup", (event) => {
    if (!tutorial.blockJumpUntilRelease || event.code !== "Space") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    tutorial.blockJumpUntilRelease = false;
    clearHeldInput();
  }, { capture:true, passive:false });

  canvas.addEventListener("pointerdown", (event) => {
    if (tutorial.active && tutorial.dialogueOpen) {
      event.preventDefault();
      event.stopImmediatePropagation();
      tutorial.dialoguePointerId = event.pointerId;
      return;
    }
    if (!tutorial.active) return;
    const point = getCanvasPoint(event);
    if (pointInsideRect(point, HUD_UI.pauseButton)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      tutorial.pauseNoticeUntil = performance.now() + 1200;
    }
  }, { capture:true, passive:false });

  canvas.addEventListener("pointerup", (event) => {
    if (tutorial.active && tutorial.dialogueOpen && tutorial.dialoguePointerId === event.pointerId) {
      event.preventDefault();
      event.stopImmediatePropagation();
      tutorial.dialoguePointerId = null;
      closeDialogue("pointer");
      return;
    }
    if (!tutorial.completeScreen) return;
    const point = getCanvasPoint(event);
    if (!pointInsideRect(point, tutorial.completionButton)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    dismissCompletionScreen();
  }, { capture:true, passive:false });

  canvas.addEventListener("pointercancel", (event) => {
    if (tutorial.dialoguePointerId !== event.pointerId) return;
    tutorial.dialoguePointerId = null;
  }, { capture:true, passive:false });

  window.RibbitRaceTutorialEngine = Object.freeze({
    start,
    exit: () => finish(false),
    get active() { return tutorial.active; },
    get completeScreen() { return tutorial.completeScreen; },
    get dialogueOpen() { return tutorial.dialogueOpen; },
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
