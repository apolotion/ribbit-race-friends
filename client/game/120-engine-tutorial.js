// Ribbit Race Friends 1.7.6  -  cinematic Ember dialogue and refined checked Park scenarios.
(() => {
  "use strict";

  const SOLO_SEEN_KEY = "rrFriendsEngineTutorialSoloSeenV6";
  const PVP_SEEN_KEY = "rrFriendsEngineTutorialPvpSeenV6";
  const TUTORIAL_BUILD = "2026.10.11-friends-tutorial-cinematic-1";
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
  let emberPortraitsReady = typeof Image === "undefined";
  const EMBER_PORTRAITS_READY = Promise.all(
    Object.values(EMBER_PORTRAITS).filter(Boolean).map((image) => new Promise((resolve) => {
      if (image.complete && image.naturalWidth > 0) { resolve(true); return; }
      const finish = () => resolve(true);
      image.addEventListener("load", finish, { once:true });
      image.addEventListener("error", finish, { once:true });
    }))
  ).then(() => { emberPortraitsReady = true; return true; }, () => { emberPortraitsReady = true; return true; });

  const tutorial = {
    active: false,
    completeScreen: false,
    dialogueOpen: false,
    dialogueLineIndex: 0,
    dialogueOpenedAt: 0,
    dialoguePointerId: null,
    blockJumpUntilRelease: false,
    startQueued: false,
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
    failureMessageUntil: 0,
    failureFlashStartedAt: 0,
    smokeClouds: [],
    resetPending: false,
    resetAt: 0,
    resetMessage: "",
    frogHidden: false,
    wrongFlyCaught: false,
    rightFlyCaught: false,
    wrongOrderInvalid: false,
    rangeTongueCaught: false,
    jumpAttempts: 0,
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
        "I'LL TEACH YOU TO HOP, CATCH, AND COMPETE.",
        "CLOSE THIS BOX, THEN MAKE ONE JUMP."
      ],
      portrait: "smile",
      goal: ["MAKE ONE JUMP"], setup: "welcome", mentor: "right"
    }),
    Object.freeze({
      title: "MATCH THE TERM",
      dialogue: [
        "THE ENGLISH TERM APPEARS AT THE BOTTOM.",
        "CATCH THE FLY WITH THE MATCHING SPANISH WORD."
      ],
      portrait: "confident",
      goal: ["CATCH THE", "MATCHING FLY"], setup: "match", mentor: "right"
    }),
    Object.freeze({
      title: "CHARGE A FULL JUMP",
      dialogue: [
        "HOLD JUMP UNTIL THE METER IS COMPLETELY FULL.",
        "RELEASE AND CATCH THE FLY IN THAT ONE JUMP."
      ],
      portrait: "cool",
      goal: ["MAX CHARGE", "+ CATCH"], setup: "maxJump", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "AUTOMATIC CATCH RANGE",
      dialogue: [
        "YOUR FROG CATCHES FLIES AUTOMATICALLY IN RANGE.",
        "THIS FLY IS JUST BEYOND BODY-CATCH RANGE.",
        "GET CLOSE ENOUGH AND YOUR TONGUE WILL GRAB IT."
      ],
      portrait: "confident",
      goal: ["USE YOUR TONGUE", "TO CATCH THE FLY"], setup: "rangeCatch", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "WRONG FLIES ARE SAFE",
      dialogue: [
        "WRONG FLY? NO PROBLEM—YOU'LL SPIT IT BACK OUT.",
        "CATCH THE WRONG FLY, THEN THE RIGHT FLY.",
        "DO BOTH IN THE SAME JUMP."
      ],
      portrait: "laughing",
      goal: ["WRONG, THEN RIGHT", "IN ONE JUMP"], setup: "wrongFly", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "TURN AROUND WITH A WALL",
      dialogue: [
        "YOU CAN'T TURN AROUND IN MID-AIR.",
        "HIT THE RIGHT WALL, THEN COME BACK FOR THE FLY.",
        "ONE OR TWO JUMPS WILL WORK."
      ],
      portrait: "thinking",
      goal: ["TURN AND CATCH", "WITHIN 2 JUMPS"], setup: "wallTurn", mentor: "left"
    }),
    Object.freeze({
      title: "REBOUND CATCH",
      dialogue: [
        "NOW DO THE WALL TURN IN ONE JUMP.",
        "HIT THE WALL, REBOUND, AND CATCH THE FLY."
      ],
      portrait: "cool",
      goal: ["ONE JUMP", "REBOUND CATCH"], setup: "reboundCatch", mentor: "left", oneAttempt: true
    }),
    Object.freeze({
      title: "QUICK PLATFORM DROP",
      dialogue: [
        "TAP JUMP QUICKLY WHILE STANDING ON A PLATFORM.",
        "DROP THROUGH AND CATCH THE FLY BELOW."
      ],
      portrait: "confident",
      goal: ["QUICK DROP", "+ CATCH"], setup: "quickDrop", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "BUFFER A PLATFORM DROP",
      dialogue: [
        "CHARGE FROM THE LOW PLATFORM TO THE TOP.",
        "TAP JUST BEFORE LANDING TO BUFFER THROUGH IT.",
        "CATCH THE FLY NEAR THE MIDDLE PLATFORM."
      ],
      portrait: "thinking",
      goal: ["BUFFER THROUGH", "TOP PLATFORM"], setup: "bufferDrop", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "DOUBLE BUFFER DROP",
      dialogue: [
        "BUFFER THROUGH THE TOP, THEN THE MIDDLE.",
        "CATCH ALL THREE FLIES ON THE WAY DOWN."
      ],
      portrait: "cool",
      goal: ["2 BUFFERS", "3 FLIES"], setup: "doubleBuffer", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "TWO FLIES IN ONE ARC",
      dialogue: [
        "LINE UP TWO FLIES ALONG ONE JUMP ARC.",
        "CATCH BOTH BEFORE YOU LAND."
      ],
      portrait: "smile",
      goal: ["2 FLIES", "1 JUMP"], setup: "doubleCatch", mentor: "right", oneAttempt: true
    }),
    Object.freeze({
      title: "FINAL PRACTICE ROUND",
      dialogue: [
        "THAT'S THE BASICS—NOW PUT IT ALL TOGETHER.",
        "CATCH FIVE FLIES IN A NORMAL PARK ROUND.",
        "I'LL BE CHEERING FOR YOU!"
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
    tutorial.dialogueLineIndex = 0;
    tutorial.dialogueOpenedAt = performance.now();
    tutorial.dialoguePointerId = null;
    tutorial.blockJumpUntilRelease = false;
    clearHeldInput();
  }

  function armTutorialFlies() {
    let armed = 0;
    for (const currentFly of flies) {
      if (!currentFly?.tutorialAuthored) continue;
      currentFly.tutorialArmed = true;
      currentFly.spawnAge = 0;
      armed += 1;
    }
    if (armed > 0) {
      try { playFlySpawnSound(); } catch (_) { tone(760, .045, .012, 80); }
    }
  }

  function armScenarioAfterDialogue() {
    clearScenarioState();
    restoreStepSequence();
    armTutorialFlies();
    tutorial.enteredAt = performance.now();
  }

  function closeDialogue(source = "keyboard") {
    if (!tutorial.active || !tutorial.dialogueOpen) return false;
    if (performance.now() - tutorial.dialogueOpenedAt < 120) return false;
    const lines = Array.isArray(tutorialStep()?.dialogue) ? tutorialStep().dialogue : [];
    if (tutorial.dialogueLineIndex < Math.max(0, lines.length - 1)) {
      tutorial.dialogueLineIndex += 1;
      tutorial.dialogueOpenedAt = performance.now();
      tutorial.dialoguePointerId = null;
      tone(470, .035, .009, 35);
      return true;
    }
    tutorial.dialogueOpen = false;
    tutorial.dialogueLineIndex = 0;
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
    tutorial.failureMessageUntil = 0;
    tutorial.failureFlashStartedAt = 0;
    tutorial.wrongFlyCaught = false;
    tutorial.rightFlyCaught = false;
    tutorial.wrongOrderInvalid = false;
    tutorial.rangeTongueCaught = false;
    tutorial.frogHidden = false;
    tutorial.jumpAttempts = 0;
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
      phase:Math.max(0, spawnIndex) * 1.37, spawnIndex, spawnAge:-0.08,
      vocabIndex, state:"active", touchLocked:false,
      blockedPromptSerial:-1,
      pvpBlockedPromptSerials:[-1,-1],
      pvpPursuers:[false,false], pvpPursuitTimes:[null,null],
      pvpPursuitPromptSerial:-1,
      spitElapsed:0, spitDelay:0, spitDuration:.34, spitStarted:false,
      spitOwnerIndex:null, spitStartX:x, spitStartY:y, returnX:x, returnY:y,
      tutorialAuthored:true, tutorialArmed:false, tutorialRequiresRebound:false
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

  function usePlatforms(authored = []) {
    platforms = [GROUND(), ...authored.map((platform, index) => ({ ...platform, tutorialId: platform.tutorialId || `tutorial-${index}` }))];
  }

  function baseSoloScenario() {
    game.mode = "solo";
    game.skinId = "azure";
    game.setupSkinFocusId = "azure";
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
        makeParkFly(3, 0, 0);
        makeParkFly(4, 1, 1);
        break;

      case "maxJump": {
        const startPlatform = platforms[1];
        positionOnPlatform(startPlatform, 18, 1);
        setPrompt(0);
        makeParkFly(2, 0, 0);
        break;
      }

      case "rangeCatch": {
        // Start on the left middle platform. The normal Park spawn at 314,108
        // is beyond body contact but reachable by a well-timed tongue extension.
        const startPlatform = platforms[2];
        positionOnPlatform(startPlatform, 8, 1);
        setPrompt(0);
        makeParkFly(4, 0, 0);
        break;
      }

      case "wrongFly":
        positionOnPlatform(platforms[1], 8, 1);
        setPrompt(0);
        // Normal Park spawns aligned along one charged-jump arc: wrong, then right.
        makeParkFly(3, 1, 0);
        makeParkFly(2, 0, 1);
        break;

      case "wallTurn":
        // The frog starts just beyond a normal upper-middle Park spawn.
        positionSoloFrog(342, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeParkFly(4, 0, 0);
        break;

      case "reboundCatch": {
        positionSoloFrog(350, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        const target = makeParkFly(1, 0, 0);
        target.tutorialRequiresRebound = true;
        break;
      }

      case "quickDrop":
        // Keep the exact Park geometry. Start on the middle-height platform and
        // drop into the normal low-middle spawn.
        platforms = cloneParkPlatforms();
        positionOnPlatform(platforms[2], 10, 1);
        setPrompt(0);
        makeParkFly(7, 0, 0);
        break;

      case "bufferDrop":
        // Exact Park geometry: lower-left platform -> top platform -> buffered
        // drop toward the middle-right normal spawn.
        platforms = cloneParkPlatforms();
        positionOnPlatform(platforms[1], 10, 1);
        setPrompt(0);
        makeParkFly(4, 0, 0);
        break;

      case "doubleBuffer":
        // Exact Park layout and normal spawn points following the requested
        // lower-left -> top -> middle-right -> lower-right route.
        platforms = cloneParkPlatforms();
        positionOnPlatform(platforms[1], 10, 1);
        makeParkFly(2, 0, 0);
        makeParkFly(4, 1, 1);
        makeParkFly(6, 2, 2);
        setSequence([0, 1, 2]);
        break;

      case "doubleCatch":
        positionSoloFrog(45, CONFIG.groundY - frog.h, 1);
        makeParkFly(3, 0, 0);
        makeParkFly(2, 1, 1);
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
    else armScenarioAfterDialogue();
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

  function completePendingReset() {
    if (!tutorial.resetPending) return;
    const message = tutorial.resetMessage || "TRY AGAIN";
    tutorial.resetPending = false;
    tutorial.resetAt = 0;
    tutorial.resetMessage = "";
    configureStep(false);
    tutorial.frogHidden = false;
    const entity = tutorial.kind === "pvp" ? pvpPlayers[0] : frog;
    addTutorialPoof(Number(entity?.x || 0) + Number(entity?.w || frog.w) / 2,
      Number(entity?.y || 0) + Number(entity?.h || frog.h) / 2, "in");
    playTutorialPoofSound("in");
    tutorial.failureText = message;
    tutorial.failureFlashStartedAt = performance.now();
    tutorial.failureMessageUntil = tutorial.failureFlashStartedAt + 1050;
  }

  function failAttempt(message) {
    if (!tutorial.active || tutorial.passed || tutorial.resetPending) return;
    const entity = tutorial.kind === "pvp" ? pvpPlayers[0] : frog;
    const oldX = Number(entity?.x || 0);
    const oldY = Number(entity?.y || 0);
    addTutorialPoof(oldX + Number(entity?.w || frog.w) / 2, oldY + Number(entity?.h || frog.h) / 2, "out");
    playTutorialPoofSound("out");
    tutorial.resetPending = true;
    tutorial.resetAt = performance.now() + 500;
    tutorial.resetMessage = message || "TRY AGAIN";
    tutorial.frogHidden = true;
    clearHeldInput();
    if (tutorial.kind === "pvp") {
      if (pvpPlayers[0]) { pvpPlayers[0].x = -1000; pvpPlayers[0].y = -1000; pvpPlayers[0].vx = 0; pvpPlayers[0].vy = 0; }
    } else {
      frog.x = -1000; frog.y = -1000; frog.vx = 0; frog.vy = 0; frog.grounded = false;
    }
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
    const alreadyWon = game.state === "won";
    tutorial.active = false;
    tutorial.dialogueOpen = false;
    tutorial.blockJumpUntilRelease = false;
    tutorial.resetPending = false;
    tutorial.frogHidden = false;
    game.tutorialActive = false;
    tutorial.completeScreen = true;
    game.winPending = false;
    game.buttonHeld = false;
    frog.charging = false;
    clearHeldInput();
    if (!alreadyWon) {
      clearFrogAfterimages(frog);
      frog.danceTime = 0;
      frog.grounded = true;
      frog.y = Math.min(frog.y, CONFIG.groundY - frog.h);
      game.state = "won";
      game.finishTime = Number.isFinite(Number(game.finishTime)) ? game.finishTime : game.elapsed;
      game.newBestTime = false;
      game.newFewestJumps = false;
      game.newEndlessBest = false;
      game.bestTime = readBestTime("park");
      game.bestJumps = readFewestJumps("park");
      game.victoryMessage = chooseVictoryMessage("park");
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
    if (!game.roundUnlockedAchievementIds.includes(TUTORIAL_ACHIEVEMENT_ID)) {
      game.roundUnlockedAchievementIds.push(TUTORIAL_ACHIEVEMENT_ID);
    }
    clearLabelCaches();
  }

  function dismissCompletionScreen() {
    if (!tutorial.completeScreen) return;
    tutorial.completeScreen = false;
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
    tutorial.kind = kind === "pvp" ? "pvp" : "solo";
    tutorial.step = 0;
    tutorial.runtime = saveRuntime();
    tutorial.snapshot = RibbitCloud.beginPlaytestSession?.() || {};
    game.tutorialActive = true;
    configureStep();
    try { drawScene(); } catch (_) {}
    requestAnimationFrame(() => { try { drawScene(); } catch (_) {} });
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


  function monitorSolo() {
    const step = SOLO_STEPS[tutorial.step]?.setup;
    maintainSequencePrompt();
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
    } else if (step === "rangeCatch") {
      if (caught >= 1 && tutorial.rangeTongueCaught) passStep();
      else if (attemptEnded) failAttempt("GET CLOSE ENOUGH FOR YOUR TONGUE TO REACH");
    } else if (step === "wrongFly") {
      if (tutorial.wrongFlyCaught && tutorial.rightFlyCaught && !tutorial.wrongOrderInvalid && !frog.grounded) passStep();
      else if (attemptEnded) failAttempt("CATCH THE WRONG FLY, THEN THE RIGHT FLY IN ONE JUMP");
    } else if (step === "wallTurn") {
      if (tutorial.wallTouched && caught >= 1) passStep();
      else if (attemptEnded && tutorial.jumpAttempts >= 2) failAttempt("USE ONE JUMP TO TURN, THEN ONE TO CATCH");
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
    } else if (step === "normalRound" && game.state === "won") {
      beginCompletionScreen();
    }
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
    if (tutorial.resetPending) {
      if (performance.now() >= tutorial.resetAt) completePendingReset();
      return;
    }
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

    if (tutorial.passed && performance.now() - tutorial.passAt > 800) nextStep();
  }

  function tutorialStep() {
    const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
    return steps[tutorial.step] || steps[0];
  }

  function drawMentorFrog() {
    // Ember teaches through the close-up dialogue portrait only.
    // No second frog is rendered in the playable tutorial arena.
  }

  function drawTutorialDialogue() {
    if (!tutorial.active || !tutorial.dialogueOpen) return;
    const step = tutorialStep();
    const lines = Array.isArray(step.dialogue) && step.dialogue.length ? step.dialogue : [step.title];
    const line = String(lines[Math.min(tutorial.dialogueLineIndex, lines.length - 1)] || step.title);
    const panel = { x: 22, y: 8, w: 436, h: 45 };
    const portrait = { x: 399, y: 10, w: 55, h: 41 };
    const textLeft = panel.x + 13;
    const textRight = portrait.x - 12;
    const textCenter = (textLeft + textRight) / 2;
    const mobile = typeof isRibbitMobileMode === "function" && isRibbitMobileMode();
    const lastLine = tutorial.dialogueLineIndex >= lines.length - 1;
    const prompt = mobile ? (lastLine ? "TAP TO PLAY" : "TAP FOR NEXT") : (lastLine ? "SPACE TO PLAY" : "SPACE FOR NEXT");
    const portraitImage = EMBER_PORTRAITS[step.portrait] || EMBER_PORTRAITS.confident;
    const maxTextWidth = Math.max(40, textRight - textLeft);
    const textScale = clamp(maxTextWidth / Math.max(1, measureBitmapText(line, 1)), .44, .72);

    ctx.save();
    ctx.globalAlpha = .98;
    ctx.fillStyle = "rgba(8,25,35,.42)";
    ctx.fillRect(panel.x + 3, panel.y + 4, panel.w, panel.h);
    ctx.fillStyle = "#052f45";
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = "#37d9ef";
    ctx.fillRect(panel.x + 2, panel.y + 2, panel.w - 4, 2);
    ctx.fillRect(panel.x + 2, panel.y + panel.h - 4, panel.w - 4, 2);
    ctx.fillRect(panel.x + 2, panel.y + 2, 2, panel.h - 4);
    ctx.fillRect(panel.x + panel.w - 4, panel.y + 2, 2, panel.h - 4);
    ctx.fillStyle = "#073b55";
    ctx.fillRect(panel.x + 6, panel.y + 6, portrait.x - panel.x - 12, panel.h - 12);

    ctx.fillStyle = "#37d9ef";
    ctx.fillRect(portrait.x - 7, panel.y + 16, 7, 13);
    ctx.fillStyle = "#073b55";
    ctx.fillRect(portrait.x - 7, panel.y + 19, 7, 7);

    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(portrait.x, portrait.y, portrait.w, portrait.h);
    ctx.fillStyle = "#2a6d8e";
    ctx.fillRect(portrait.x + 2, portrait.y + 2, portrait.w - 4, portrait.h - 4);
    if (portraitImage?.complete && portraitImage.naturalWidth > 0) {
      const oldSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(portraitImage, portrait.x + 3, portrait.y + 3, portrait.w - 6, portrait.h - 6);
      ctx.imageSmoothingEnabled = oldSmoothing;
    } else {
      // Never substitute the small gameplay frog. Keep the portrait panel styled
      // until the approved sunglasses-and-Hawaiian-shirt portrait has loaded.
      ctx.fillStyle = EMBER_SKIN.dark;
      ctx.fillRect(portrait.x + 10, portrait.y + 8, portrait.w - 20, portrait.h - 15);
      drawBitmapText("EMBER", portrait.x + portrait.w / 2, portrait.y + 18, .32, "center", "#ff9b45");
    }

    const nameX = portrait.x + 5;
    const nameY = portrait.y + portrait.h - 10;
    const nameW = portrait.w - 10;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(nameX - 1, nameY - 1, nameW + 2, 10);
    ctx.fillStyle = "#ff9b45";
    ctx.fillRect(nameX, nameY, nameW, 7);
    drawBitmapText("EMBER", nameX + nameW / 2, nameY, .31, "center", "#3d2417");

    drawBitmapText(step.title, textCenter, panel.y + 6, .31, "center", "#74e6f5");
    drawBitmapText(line, textLeft, panel.y + 20, textScale, "left", COLORS.white);
    drawBitmapText(prompt, textRight, panel.y + 35, .24, "right", "#bdeef5");
    ctx.fillStyle = "#dff8ff";
    ctx.fillRect(portrait.x - 14, panel.y + panel.h - 9, 7, 2);
    ctx.fillRect(portrait.x - 12, panel.y + panel.h - 7, 3, 2);
    ctx.restore();
  }

  function drawTutorialStatus() {
    if (!tutorial.active || tutorial.dialogueOpen || !tutorial.passed) return;
    const text = "NICE WORK! NEXT LESSON...";
    const w = 230;
    const x = W / 2 - w / 2;
    const y = 18;
    ctx.save();
    ctx.globalAlpha = .92;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(x, y, w, 18);
    ctx.fillStyle = EMBER_SKIN.belly;
    ctx.fillRect(x + 3, y + 3, w - 6, 12);
    drawBitmapText(text, W / 2, y + 5, .43, "center", EMBER_SKIN.dark);
    ctx.restore();
  }

  function drawTutorialSmoke() {
    if (!tutorial.smokeClouds.length) return;
    const now = performance.now();
    tutorial.smokeClouds = tutorial.smokeClouds.filter(cloud => now - cloud.born < 520);
    const offsets = [[0,0],[-7,-2],[7,-3],[-4,-8],[5,-10],[-10,-9],[11,-8],[0,-14]];
    ctx.save();
    for (const cloud of tutorial.smokeClouds) {
      const progress = clamp((now - cloud.born) / 520, 0, 1);
      const alpha = (1 - progress) * .88;
      const spread = 1 + progress * 1.8;
      ctx.globalAlpha = alpha;
      offsets.forEach(([ox, oy], index) => {
        const size = Math.max(2, Math.round((index % 3 === 0 ? 6 : 4) * (1 + progress * .55)));
        const x = Math.round(cloud.x + ox * spread - size / 2);
        const y = Math.round(cloud.y + oy * spread - size / 2);
        ctx.fillStyle = index % 2 ? "#d9e1e4" : "#f7fdff";
        ctx.fillRect(x, y, size, size);
        if (size >= 5) {
          ctx.fillStyle = "#aebcc2";
          ctx.fillRect(x + size - 2, y + size - 2, 2, 2);
        }
      });
    }
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
    const x = 321, y = CONFIG.playBottom + 3, w = W - x - 1, h = H - y - 1;
    const now = performance.now();
    const failed = now < tutorial.failureMessageUntil;
    const flashAge = Math.max(0, now - tutorial.failureFlashStartedAt);
    const flashAlpha = failed ? (.30 + .30 * (0.5 + 0.5 * Math.sin(flashAge / 72))) : 0;
    ctx.save();
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = EMBER_SKIN.belly;
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = EMBER_SKIN.mid;
    ctx.fillRect(x + 5, y + 5, w - 10, 10);
    ctx.fillStyle = EMBER_SKIN.light;
    ctx.fillRect(x + 7, y + 7, w - 14, 2);
    drawPixelTrophy(x + 14, y + 16, false, .72);
    drawBitmapText("CURRENT GOAL", x + w / 2 + 6, y + 7, .42, "center", COLORS.white, EMBER_SKIN.dark);
    const goalLeft = x + 32;
    const goalWidth = w - 38;
    if (goal.length > 1) {
      const scale0 = Math.min(.50, goalWidth / Math.max(1, measureBitmapText(goal[0], 1)));
      const scale1 = Math.min(.50, goalWidth / Math.max(1, measureBitmapText(goal[1], 1)));
      drawBitmapText(goal[0], goalLeft + goalWidth / 2, y + 18, scale0, "center", "#34484f");
      drawBitmapText(goal[1], goalLeft + goalWidth / 2, y + 28, scale1, "center", "#34484f");
    } else {
      const scale = Math.min(.55, goalWidth / Math.max(1, measureBitmapText(goal[0], 1)));
      drawBitmapText(goal[0], goalLeft + goalWidth / 2, y + 23, scale, "center", "#34484f");
    }
    if (failed) {
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = "#d92727";
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      ctx.globalAlpha = .9;
      ctx.strokeStyle = "#ff4438";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    }
    ctx.restore();
  }

  function drawTutorialOverlay() {
    if (!tutorial.active) return;
    drawCurrentGoalHud();
    drawTutorialSmoke();
    if (!tutorial.dialogueOpen) drawTutorialProgress();
    if (tutorial.dialogueOpen) drawTutorialDialogue();
    else drawTutorialStatus();
    if (performance.now() < tutorial.pauseNoticeUntil) {
      drawBitmapText("THE TUTORIAL CANNOT BE PAUSED", W / 2, 218, .48, "center", "#a51f1c", COLORS.white);
    }
  }

  function drawCompletionScreen() {
    // The tutorial now uses Ribbit Race's normal Single Player victory screen.
  }


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

  // Record how tutorial flies were caught so authored lessons can verify the intended technique.
  const originalAttemptFlyCatch = attemptFlyCatch;
  attemptFlyCatch = function(targetFly, source = "body", ...rest) {
    const activeSetup = tutorial.active && tutorial.kind === "solo" ? tutorialStep()?.setup : "";
    const wasCorrect = Boolean(targetFly && targetFly.vocabIndex === game.targetVocabIndex);
    if (activeSetup === "rangeCatch" && wasCorrect && source !== "tongue") return false;
    if (activeSetup === "reboundCatch" && targetFly?.tutorialRequiresRebound && !tutorial.wallTouchedThisJump) return false;
    const result = originalAttemptFlyCatch.call(this, targetFly, source, ...rest);
    if (!result || !activeSetup) return result;
    if (activeSetup === "rangeCatch" && wasCorrect && source === "tongue") tutorial.rangeTongueCaught = true;
    if (activeSetup === "wrongFly") {
      if (!wasCorrect) tutorial.wrongFlyCaught = true;
      else if (tutorial.wrongFlyCaught) tutorial.rightFlyCaught = true;
      else tutorial.wrongOrderInvalid = true;
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
    const result = tutorial.originalLaunchJump.apply(this, args);
    if (active && !frog.grounded) {
      tutorial.lastJumpPower = power;
      tutorial.quickDrop = tutorial.quickDrop || quick;
      tutorial.wallTouchedThisJump = false;
      tutorial.attemptStarted = true;
      tutorial.jumpAttempts += 1;
      tutorial.attemptWasAirborne = true;
      tutorial.attemptEnded = false;
      const setup = tutorialStep()?.setup;
      if (setup === "quickDrop" && !quick) {
        failAttempt("TAP QUICKLY  -  DO NOT CHARGE");
      }
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

  const originalDrawFrogForTutorial = drawFrog;
  drawFrog = function(...args) {
    if (tutorial.active && tutorial.frogHidden) return;
    return originalDrawFrogForTutorial.apply(this, args);
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
    if (tutorial.active && (tutorial.dialogueOpen || tutorial.resetPending)) {
      if (game.state === "paused") game.state = "playing";
      updateTutorial();
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
    const rects = getVictoryButtonRects(getVictoryUnlockNoticeLayout());
    if (!pointInsideRect(point, rects.replayButton) && !pointInsideRect(point, rects.homeButton)) return;
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
    get portraitsReady() { return emberPortraitsReady; },
    ready: () => EMBER_PORTRAITS_READY,
    seen(kind = "solo") {
      try { return localStorage.getItem(kind === "pvp" ? PVP_SEEN_KEY : SOLO_SEEN_KEY) === "true"; }
      catch (_) { return false; }
    },
    resetSeen(kind = "solo") {
      try { localStorage.removeItem(kind === "pvp" ? PVP_SEEN_KEY : SOLO_SEEN_KEY); } catch (_) {}
    }
  });
})();
