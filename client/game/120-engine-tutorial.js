// Ribbit Race Friends 1.7.7  -  typed Ember dialogue and scripted checked Park scenarios.
(() => {
  "use strict";

  const SOLO_SEEN_KEY = "rrFriendsEngineTutorialSoloSeenV7";
  const PVP_SEEN_KEY = "rrFriendsEngineTutorialPvpSeenV7";
  const TUTORIAL_BUILD = "2026.10.11-friends-tutorial-scripted-1";
  const TUTORIAL_ACHIEVEMENT_ID = "tutorial-graduate";
  const TYPEWRITER_MS_PER_CHARACTER = 28;
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
    dialogueLineStartedAt: 0,
    dialogueForceComplete: false,
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
    lastObservedDropPlatform: "",
    bufferEventCount: 0,
    maxCatchesOneJump: 0,
    lastJumpPower: 0,
    failedAttemptAt: 0,
    failureText: "",
    failureMessageUntil: 0,
    failureFlashStartedAt: 0,
    failureFlashDuration: 1450,
    smokeClouds: [],
    resetPending: false,
    resetAt: 0,
    resetMessage: "",
    frogHidden: false,
    wrongFlyCaught: false,
    wrongFlyCaughtAt: 0,
    rightFlyCaught: false,
    wrongOrderInvalid: false,
    rangeTongueCaught: false,
    rangeTongueCaughtAt: 0,
    jumpAttempts: 0,
    attemptStarted: false,
    attemptWasAirborne: false,
    attemptEnded: false,
    sequence: [],
    catchEvents: [],
    longJumpStreak: 0,
    sceneCatchCount: 0,
    sceneAttemptIndex: 0,
    sceneAttemptCaught: false,
    slowMoUntil: 0,
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
      // The tutorial freezes gameplay through the wrapped update function. Do not
      // stop the render loop here: the typewriter, smoke and failure fades need
      // continuous frames while Ember is speaking.
      return previouslyLocked;
    };
  }

  const SOLO_STEPS = Object.freeze([
    Object.freeze({
      scene: 1,
      title: "WELCOME TO RIBBIT RACE",
      dialogue: [
        "Hey there, tadpole! Welcome to Ribbit Race!",
        "I'm Ember - a Ribbit Race pro from this side of the pond.",
        "I'll show you the ropes so you can hop, catch, and compete with the best.",
        "Who knows? Maybe you'll even keep up with me someday!",
        "Your goal is simple...",
        "Catch the most flies and be the best!"
      ],
      portrait: "smile",
      goal: ["LISTEN TO", "EMBER"],
      setup: "intro",
      mentor: "right",
      autoAdvanceAfterDialogue: true
    }),
    Object.freeze({
      scene: 2,
      title: "PUT THOSE LEGS TO WORK",
      dialogue: [
        "Let's put those frog legs to work!",
        "Hold the jump button to charge, then release to leap.",
        "The more you charge, the farther you'll go - but timing is everything!",
        "Hold too long, and you'll lose some of that distance.",
        "Try releasing just as your charge gets close to full.",
        "Show me three long jumps in a row!"
      ],
      portrait: "confident",
      goal: ["LONG JUMPS", "0 / 3"],
      setup: "longJumps",
      mentor: "right"
    }),
    Object.freeze({
      scene: 3,
      title: "MATCH THE TERM",
      dialogue: [
        "Not bad, tadpole! You've got some spring in those legs.",
        "Looks like dinner is ready!",
        "Every fly has a term above its head.",
        "Your English clue appears at the bottom of the screen.",
        "Catch the fly with the matching translation to score a point.",
        "Let's get three points - one matching fly per jump!"
      ],
      portrait: "smile",
      goal: ["MATCHES", "0 / 3"],
      setup: "threeCatches",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 4,
      title: "TONGUE RANGE",
      dialogue: [
        "Enjoy your meal? Don't forget to leave a tip!",
        "Speaking of tips... here's a good one!",
        "You don't have to land right on a fly to catch it.",
        "Get close enough, and your tongue will grab it automatically.",
        "This fly is a little too far away for even my frog legs.",
        "Charge a long jump and let your tongue handle the rest!"
      ],
      portrait: "cool",
      goal: ["USE YOUR TONGUE", "TO CATCH THE FLY"],
      setup: "rangeCatch",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 5,
      title: "WRONG FLIES",
      dialogue: [
        "Now you're catching in style!",
        "But dinner won't always be served one fly at a time.",
        "There can be up to four flies on the screen at once, so check your clue!",
        "Catch the wrong fly, and you'll spit it right back out.",
        "Let's see what that looks like.",
        "This time, catch a fly that doesn't match your English clue!"
      ],
      portrait: "laughing",
      goal: ["CATCH A", "WRONG FLY"],
      setup: "wrongFly",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 6,
      title: "MULTIPLE FLIES",
      dialogue: [
        "I don't know about you, but all this jumping sure does work up my appetite.",
        "So why stop at one fly per jump?",
        "Line up your leap, and you can catch several before you land!",
        "Not every fly along the way will be a match, though.",
        "Try catching both of these flies in one jump."
      ],
      portrait: "confident",
      goal: ["MATCH + SPIT", "IN ONE JUMP"],
      setup: "comboMixed",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 6,
      title: "MULTIPLE FLIES",
      dialogue: [
        "One match and one spit-out!",
        "Let's try turning both catches into points.",
        "Watch your English clue as you go.",
        "This time, catch two matching flies in a single jump!"
      ],
      portrait: "smile",
      goal: ["2 MATCHES", "IN ONE JUMP"],
      setup: "comboTwo",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 6,
      title: "MULTIPLE FLIES",
      dialogue: [
        "Two for two! Okay, that was pretty good.",
        "But how about a bigger helping?",
        "Line up your jump and catch all three matching flies before you land!"
      ],
      portrait: "laughing",
      goal: ["3 MATCHES", "IN ONE JUMP"],
      setup: "comboThree",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 7,
      title: "TURN WITH A WALL",
      dialogue: [
        "Three flies in one jump?! Okay, now you're showing off!",
        "There's just one catch to this all-you-can-eat buffet...",
        "The only way to turn around is by hitting a wall.",
        "Miss a fly, and you'll need to bounce off a wall to head back for it.",
        "Let's practice! Use your first jump to hit the wall and turn around.",
        "Then jump back and catch the fly you passed."
      ],
      portrait: "thinking",
      goal: ["TURN AND CATCH", "WITHIN 2 JUMPS"],
      setup: "wallTurn",
      mentor: "left"
    }),
    Object.freeze({
      scene: 8,
      title: "ONE-JUMP REBOUND",
      dialogue: [
        "Nice turnaround! Now let's turn those two jumps into one.",
        "You don't have to land before making your comeback!",
        "Jump into the wall, bounce back, and catch the fly before you touch the ground.",
        "Make it all happen in one jump!"
      ],
      portrait: "cool",
      goal: ["ONE JUMP", "REBOUND CATCH"],
      setup: "reboundCatch",
      mentor: "left",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 9,
      title: "QUICK PLATFORM DROP",
      dialogue: [
        "You're a natural, tadpole!",
        "Now, what happens when dinner is downstairs?",
        "While you're standing on a platform, give the jump button a quick tap - press and release.",
        "Instead of charging a jump, you'll drop straight through!",
        "Give it a try and catch the fly underneath you."
      ],
      portrait: "confident",
      goal: ["QUICK DROP", "+ CATCH"],
      setup: "quickDrop",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 10,
      title: "BUFFER A DROP",
      dialogue: [
        "What if you want to eat as soon as possible?",
        "Press jump just before you land on the platform.",
        "Time it right, and you'll drop straight through while keeping your momentum!",
        "This is called buffering - getting your next move ready before you land.",
        "Let's use a buffered drop to catch this fly!"
      ],
      portrait: "thinking",
      goal: ["BUFFER THROUGH", "TOP PLATFORM"],
      setup: "bufferDrop",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 11,
      title: "DOUBLE BUFFER DROP",
      dialogue: [
        "Looking smooth!",
        "You can chain those drops together, too.",
        "Press jump just before each landing to drop through one platform, then the next.",
        "Keep that rhythm going and catch all three flies!"
      ],
      portrait: "cool",
      goal: ["2 BUFFERS", "3 FLIES"],
      setup: "doubleBuffer",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 12,
      title: "FINAL PRACTICE ROUND",
      dialogue: [
        "You're moving so fast, I thought you were a dart frog for a second!",
        "You've got the basics. Now let's put them all together.",
        "Catch five matching flies to complete a normal round.",
        "Pick your matches, time your jumps, and make those walls and platforms work for you!",
        "I'll be cheering you on from the lily pads!"
      ],
      portrait: "smile",
      goal: ["CATCH ALL", "5 FLIES"],
      setup: "normalRound",
      mentor: "right"
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
    else if (setup === "comboTwo") setSequence([0, 1]);
    else if (setup === "comboThree") setSequence([0, 1, 2]);
  }

  function dialogueLinesForCurrentStep() {
    const step = tutorialStep();
    return Array.isArray(step?.dialogue) && step.dialogue.length ? step.dialogue : [step?.title || "TUTORIAL"];
  }

  function currentDialogueLine() {
    const lines = dialogueLinesForCurrentStep();
    return String(lines[Math.min(tutorial.dialogueLineIndex, lines.length - 1)] || "");
  }

  function visibleDialogueCharacterCount(line = currentDialogueLine()) {
    if (tutorial.dialogueForceComplete) return line.length;
    const age = Math.max(0, performance.now() - tutorial.dialogueLineStartedAt);
    return Math.min(line.length, Math.floor(age / TYPEWRITER_MS_PER_CHARACTER));
  }

  function dialogueLineIsComplete() {
    const line = currentDialogueLine();
    return visibleDialogueCharacterCount(line) >= line.length;
  }

  function openDialogue() {
    tutorial.dialogueOpen = true;
    tutorial.dialogueLineIndex = 0;
    tutorial.dialogueOpenedAt = performance.now();
    tutorial.dialogueLineStartedAt = tutorial.dialogueOpenedAt;
    tutorial.dialogueForceComplete = false;
    tutorial.dialoguePointerId = null;
    tutorial.blockJumpUntilRelease = false;
    game.state = "playing";
    game.pauseHelpOpen = false;
    clearHeldInput();
    try { drawScene(); } catch (_) {}
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
    restoreStepSequence();
    armTutorialFlies();
    tutorial.enteredAt = performance.now();
    game.state = "playing";
    game.pauseHelpOpen = false;
  }

  function closeDialogue(source = "keyboard") {
    if (!tutorial.active || !tutorial.dialogueOpen) return false;
    if (performance.now() - tutorial.dialogueOpenedAt < 90) return false;

    if (!dialogueLineIsComplete()) {
      tutorial.dialogueForceComplete = true;
      try { drawScene(); } catch (_) {}
      return true;
    }

    const lines = dialogueLinesForCurrentStep();
    if (tutorial.dialogueLineIndex < Math.max(0, lines.length - 1)) {
      tutorial.dialogueLineIndex += 1;
      tutorial.dialogueOpenedAt = performance.now();
      tutorial.dialogueLineStartedAt = tutorial.dialogueOpenedAt;
      tutorial.dialogueForceComplete = false;
      tutorial.dialoguePointerId = null;
      tone(470, .025, .007, 35);
      try { drawScene(); } catch (_) {}
      return true;
    }

    const step = tutorialStep();
    tutorial.dialogueOpen = false;
    tutorial.dialogueLineIndex = 0;
    tutorial.dialogueForceComplete = false;
    tutorial.dialoguePointerId = null;
    tutorial.blockJumpUntilRelease = source === "space";
    clearHeldInput();
    game.state = "playing";
    game.pauseHelpOpen = false;

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
    tutorial.slowMoUntil = 0;
    tutorial.pvpBonks = 0;
    tutorial.pvpRebounds = 0;
    tutorial.pvpLastStun = 0;
    tutorial.pvpScoreStart = Number(pvpPlayers[0]?.score || 0);
    tutorial.lastDir = tutorial.kind === "pvp" ? Number(pvpPlayers[0]?.dir || 1) : Number(frog.dir || 1);
    resetTutorialTongue();
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
    flies.length = 0;
    clearLabelCaches();
    if (spec.type === "platform") positionOnPlatform(platforms[spec.platform], spec.offset, spec.dir);
    else positionSoloFrog(spec.x, CONFIG.groundY - frog.h, spec.dir);
    setPrompt(spec.vocab);
    const target = makeParkFly(spec.spawn, spec.vocab, attemptIndex);
    if (armed) {
      target.tutorialArmed = true;
      target.spawnAge = 0;
      try { playFlySpawnSound(); } catch (_) {}
    }
  }

  function configureSoloStep(index) {
    baseSoloScenario();
    clearScenarioState();
    const step = SOLO_STEPS[index] || SOLO_STEPS[0];
    setMentor(step.mentor || "right");

    switch (step.setup) {
      case "intro":
        positionSoloFrog(72, CONFIG.groundY - frog.h, 1);
        break;

      case "longJumps":
        positionSoloFrog(48, CONFIG.groundY - frog.h, 1);
        break;

      case "threeCatches":
        setupThreeCatchAttempt(0, false);
        break;

      case "rangeCatch": {
        // Begin on the normal left-middle Park platform. This authored target
        // sits just beyond body contact along a full-jump arc, but inside the
        // normal tongue reach during the descending half of that jump.
        positionOnPlatform(platforms[2], 6, 1);
        setPrompt(0);
        makeFly(360, 75, 0, 4);
        break;
      }

      case "wrongFly":
        positionOnPlatform(platforms[1], 10, 1);
        setPrompt(0);
        makeParkFly(3, 1, 0);
        break;

      case "comboMixed":
        positionSoloFrog(42, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeParkFly(3, 0, 0);
        makeParkFly(2, 1, 1);
        break;

      case "comboTwo":
        positionSoloFrog(42, CONFIG.groundY - frog.h, 1);
        makeParkFly(3, 0, 0);
        makeParkFly(2, 1, 1);
        setSequence([0, 1]);
        break;

      case "comboThree":
        positionSoloFrog(42, CONFIG.groundY - frog.h, 1);
        makeParkFly(3, 0, 0);
        makeParkFly(2, 1, 1);
        makeParkFly(4, 2, 2);
        setSequence([0, 1, 2]);
        break;

      case "wallTurn":
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
        platforms = cloneParkPlatforms();
        positionOnPlatform(platforms[2], 10, 1);
        setPrompt(0);
        makeParkFly(7, 0, 0);
        break;

      case "bufferDrop":
        platforms = cloneParkPlatforms();
        // Start at the forward edge of the lower-left platform so the normal
        // charged arc reaches the top-center platform consistently.
        positionOnPlatform(platforms[1], platforms[1].w - frog.w - 2, 1);
        setPrompt(0);
        makeParkFly(4, 0, 0);
        break;

      case "doubleBuffer":
        platforms = cloneParkPlatforms();
        positionOnPlatform(platforms[1], platforms[1].w - frog.w - 2, 1);
        makeParkFly(2, 0, 0);
        makeParkFly(4, 1, 1);
        makeParkFly(6, 2, 2);
        setSequence([0, 1, 2]);
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

    setMentor(step.mentor || "right");
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
    resetTutorialTongue();
    const entity = tutorial.kind === "pvp" ? pvpPlayers[0] : frog;
    addTutorialPoof(
      Number(entity?.x || 0) + Number(entity?.w || frog.w) / 2,
      Number(entity?.y || 0) + Number(entity?.h || frog.h) / 2,
      "in"
    );
    playTutorialPoofSound("in");
    tutorial.failureText = message;
    tutorial.failureFlashStartedAt = performance.now();
    tutorial.failureMessageUntil = tutorial.failureFlashStartedAt + tutorial.failureFlashDuration;
    game.state = "playing";
  }

  function failAttempt(message) {
    if (!tutorial.active || tutorial.passed || tutorial.resetPending) return;
    const entity = tutorial.kind === "pvp" ? pvpPlayers[0] : frog;
    const oldX = Number(entity?.x || 0);
    const oldY = Number(entity?.y || 0);
    addTutorialPoof(
      oldX + Number(entity?.w || frog.w) / 2,
      oldY + Number(entity?.h || frog.h) / 2,
      "out"
    );
    playTutorialPoofSound("out");
    resetTutorialTongue();
    try { clearFrogAfterimages(entity); } catch (_) {}
    tutorial.resetPending = true;
    tutorial.resetAt = performance.now() + 500;
    tutorial.resetMessage = message || "TRY AGAIN";
    tutorial.frogHidden = true;
    clearHeldInput();

    // Keep the entity at its real location while the simulation is frozen.
    // Drawing is suppressed by frogHidden, so no off-screen indicator can appear
    // and a tongue that was active cannot stretch from a sentinel coordinate.
    if (entity) {
      entity.vx = 0;
      entity.vy = 0;
      entity.charging = false;
      if ("inputHeld" in entity) entity.inputHeld = false;
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
    try { document.body.classList.remove("rr-tutorial-active"); } catch (_) {}
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
    try { document.body.classList.remove("rr-tutorial-active"); } catch (_) {}
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
    try { document.body.classList.add("rr-tutorial-active"); } catch (_) {}
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

  function resetAttemptForNextJump() {
    tutorial.attemptStarted = false;
    tutorial.attemptWasAirborne = false;
    tutorial.attemptEnded = false;
    tutorial.wallTouchedThisJump = false;
    tutorial.maxCatchesOneJump = 0;
    tutorial.sceneAttemptCaught = false;
    tutorial.catchEvents = [];
  }

  function advanceThreeCatchAttempt() {
    const oldX = frog.x + frog.w / 2;
    const oldY = frog.y + frog.h / 2;
    addTutorialPoof(oldX, oldY, "out");
    playTutorialPoofSound("out");
    setupThreeCatchAttempt(tutorial.sceneAttemptIndex + 1, true);
    addTutorialPoof(frog.x + frog.w / 2, frog.y + frog.h / 2, "in");
    playTutorialPoofSound("in");
    resetAttemptForNextJump();
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

    if (setup === "intro") return;

    if (setup === "longJumps") {
      if (!attemptEnded) return;
      if (tutorial.lastJumpPower >= .90) {
        tutorial.longJumpStreak += 1;
        if (tutorial.longJumpStreak >= 3) passStep();
        else resetAttemptForNextJump();
      } else {
        tutorial.longJumpStreak = 0;
        failAttempt("RELEASE CLOSE TO FULL CHARGE");
      }
      return;
    }

    if (setup === "threeCatches") {
      if (!attemptEnded) return;
      if (tutorial.sceneAttemptCaught) {
        tutorial.sceneCatchCount += 1;
        if (tutorial.sceneCatchCount >= 3) passStep();
        else advanceThreeCatchAttempt();
      } else {
        failAttempt("CATCH THE MATCHING FLY IN ONE JUMP");
      }
      return;
    }

    if (setup === "rangeCatch") {
      if (tutorial.rangeTongueCaught && now - tutorial.rangeTongueCaughtAt >= 520) passStep();
      else if (attemptEnded && !tutorial.rangeTongueCaught) failAttempt("GET CLOSE ENOUGH FOR YOUR TONGUE TO REACH");
      return;
    }

    if (setup === "wrongFly") {
      if (tutorial.wrongFlyCaught && now - tutorial.wrongFlyCaughtAt >= 520) passStep();
      else if (attemptEnded && !tutorial.wrongFlyCaught) failAttempt("CATCH A FLY THAT DOES NOT MATCH");
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
        : "TAP QUICKLY - DO NOT CHARGE");
      return;
    }

    if (setup === "bufferDrop") {
      if (tutorial.bufferEventCount >= 1 && caught >= 1) passStep();
      else if (attemptEnded) failAttempt("BUFFER THROUGH THE TOP PLATFORM AND CATCH THE FLY");
      return;
    }

    if (setup === "doubleBuffer") {
      if (tutorial.bufferEventCount >= 2 && caught >= 3) passStep();
      else if (attemptEnded) failAttempt("BUFFER TWICE AND CATCH ALL THREE FLIES");
      return;
    }

    if (setup === "normalRound" && game.state === "won") beginCompletionScreen();
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

    if (tutorial.passed && performance.now() - tutorial.passAt > 350) nextStep();
  }

  function tutorialStep() {
    const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
    return steps[tutorial.step] || steps[0];
  }

  function drawMentorFrog() {
    // Ember teaches through the close-up dialogue portrait only.
    // No second frog is rendered in the playable tutorial arena.
  }

  function currentGoalLines() {
    const step = tutorialStep();
    if (!step) return ["TUTORIAL"];
    if (step.setup === "longJumps") return ["LONG JUMPS", `${tutorial.longJumpStreak} / 3`];
    if (step.setup === "threeCatches") return ["MATCHES", `${tutorial.sceneCatchCount} / 3`];
    return Array.isArray(step.goal) ? step.goal : [step.title];
  }

  function drawTutorialDialogue() {
    if (!tutorial.active || !tutorial.dialogueOpen) return;

    const step = tutorialStep();
    const lines = dialogueLinesForCurrentStep();
    const fullLine = currentDialogueLine();
    const visibleCount = visibleDialogueCharacterCount(fullLine);
    const visibleLine = fullLine.slice(0, visibleCount);
    const lastLine = tutorial.dialogueLineIndex >= lines.length - 1;
    const mobile = typeof isRibbitMobileMode === "function" && isRibbitMobileMode();
    const prompt = mobile
      ? (lastLine ? "TAP TO PLAY" : "TAP FOR NEXT")
      : (lastLine ? "SPACE TO PLAY" : "SPACE FOR NEXT");

    // Sized to sit cleanly between the fly counter and Pause button.
    const panel = { x: 92, y: 7, w: 300, h: 42 };
    const portrait = { x: 337, y: 9, w: 51, h: 38 };
    const textLeft = panel.x + 11;
    const textRight = portrait.x - 10;
    const textWidth = Math.max(40, textRight - textLeft);
    const fullWidthAtOne = Math.max(1, measureBitmapText(fullLine, 1));
    const textScale = clamp(textWidth / fullWidthAtOne, .34, .66);
    const portraitImage = EMBER_PORTRAITS[step.portrait] || EMBER_PORTRAITS.confident;

    ctx.save();
    ctx.globalAlpha = .99;

    // Even light-blue frame on every edge; no faux scrollbar or continue arrow.
    ctx.fillStyle = "rgba(8,25,35,.38)";
    ctx.fillRect(panel.x + 3, panel.y + 3, panel.w, panel.h);
    ctx.fillStyle = "#78e8f5";
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = "#052f45";
    ctx.fillRect(panel.x + 3, panel.y + 3, panel.w - 6, panel.h - 6);
    ctx.fillStyle = "#073b55";
    ctx.fillRect(panel.x + 7, panel.y + 7, portrait.x - panel.x - 17, panel.h - 14);

    // Speech notch points to Ember on the right.
    ctx.fillStyle = "#78e8f5";
    ctx.fillRect(portrait.x - 7, panel.y + 15, 7, 12);
    ctx.fillStyle = "#073b55";
    ctx.fillRect(portrait.x - 7, panel.y + 18, 7, 6);

    ctx.fillStyle = "#78e8f5";
    ctx.fillRect(portrait.x, portrait.y, portrait.w, portrait.h);
    ctx.fillStyle = "#2a6d8e";
    ctx.fillRect(portrait.x + 3, portrait.y + 3, portrait.w - 6, portrait.h - 6);
    if (portraitImage?.complete && portraitImage.naturalWidth > 0) {
      const oldSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(portraitImage, portrait.x + 3, portrait.y + 3, portrait.w - 6, portrait.h - 6);
      ctx.imageSmoothingEnabled = oldSmoothing;
    } else {
      ctx.fillStyle = EMBER_SKIN.dark;
      ctx.fillRect(portrait.x + 9, portrait.y + 7, portrait.w - 18, portrait.h - 13);
    }

    const nameX = portrait.x + 4;
    const nameY = portrait.y + portrait.h - 9;
    const nameW = portrait.w - 8;
    ctx.fillStyle = "#ff9b45";
    ctx.fillRect(nameX, nameY, nameW, 7);
    drawBitmapText("EMBER", nameX + nameW / 2, nameY, .29, "center", "#3d2417");

    // Scale from the complete sentence so the typewriter does not resize as it types.
    drawBitmapText(visibleLine, textLeft, panel.y + 15, textScale, "left", COLORS.white);
    drawBitmapText(prompt, textRight, panel.y + 32, .23, "right", "#bdeef5");
    ctx.restore();
  }

  function drawTutorialStatus() {
    // Scene completion transitions directly to Ember's next dialogue.
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
    const scene = tutorial.kind === "pvp"
      ? Math.min(PVP_STEPS.length, tutorial.step + 1)
      : Number(tutorialStep()?.scene || Math.min(12, tutorial.step + 1));
    const total = tutorial.kind === "pvp" ? PVP_STEPS.length : 12;
    const label = `${tutorial.kind === "pvp" ? "PVP" : "PARK"} TUTORIAL ${scene}/${total}`;
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
    const goal = currentGoalLines();
    const x = 320;
    const y = CONFIG.playBottom;
    const w = W - x;
    const h = H - y;
    const now = performance.now();
    const flashAge = Math.max(0, now - tutorial.failureFlashStartedAt);
    const duration = Math.max(1, tutorial.failureFlashDuration || 1450);
    const activeFlash = tutorial.failureFlashStartedAt > 0 && flashAge < duration;
    const fadeStart = duration * .68;
    const fade = activeFlash
      ? (flashAge <= fadeStart ? 1 : clamp(1 - (flashAge - fadeStart) / (duration - fadeStart), 0, 1))
      : 0;
    const pulse = .5 + .5 * Math.sin(flashAge / 78);
    const flashAlpha = activeFlash ? (.10 + .30 * pulse) * fade : 0;

    ctx.save();
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = EMBER_SKIN.belly;
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

    // Header text is centered inside the dark line; the orange accent sits above it.
    ctx.fillStyle = EMBER_SKIN.mid;
    ctx.fillRect(x + 6, y + 4, w - 12, 2);
    ctx.fillStyle = EMBER_SKIN.dark;
    ctx.fillRect(x + 6, y + 7, w - 12, 9);
    drawBitmapText("CURRENT GOAL", x + w / 2, y + 9, .38, "center", COLORS.white);

    drawPixelTrophy(x + 16, y + 20, false, .70);
    const goalLeft = x + 33;
    const goalWidth = w - 40;
    if (goal.length > 1) {
      const scale0 = Math.min(.50, goalWidth / Math.max(1, measureBitmapText(goal[0], 1)));
      const scale1 = Math.min(.50, goalWidth / Math.max(1, measureBitmapText(goal[1], 1)));
      drawBitmapText(goal[0], goalLeft + goalWidth / 2, y + 19, scale0, "center", "#34484f");
      drawBitmapText(goal[1], goalLeft + goalWidth / 2, y + 29, scale1, "center", "#34484f");
    } else {
      const scale = Math.min(.54, goalWidth / Math.max(1, measureBitmapText(goal[0], 1)));
      drawBitmapText(goal[0], goalLeft + goalWidth / 2, y + 24, scale, "center", "#34484f");
    }

    if (flashAlpha > 0) {
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = "#d92727";
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      ctx.globalAlpha = flashAlpha * .95;
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

    if (activeSetup === "rangeCatch" && wasCorrect && source === "tongue") {
      tutorial.rangeTongueCaught = true;
      tutorial.rangeTongueCaughtAt = performance.now();
      tutorial.slowMoUntil = tutorial.rangeTongueCaughtAt + 700;
    }

    if (activeSetup === "wrongFly" && !wasCorrect) {
      tutorial.wrongFlyCaught = true;
      tutorial.wrongFlyCaughtAt = performance.now();
    }

    if (activeSetup === "threeCatches" && wasCorrect) {
      tutorial.sceneAttemptCaught = true;
    }

    if (["comboMixed", "comboTwo", "comboThree"].includes(activeSetup)) {
      tutorial.catchEvents.push(wasCorrect);
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
      game.state = "playing";
      game.pauseHelpOpen = false;
      updateTutorial();
      return undefined;
    }
    const slowScale = tutorial.active && performance.now() < tutorial.slowMoUntil ? .28 : 1;
    const result = originalUpdate.call(this, dt * slowScale, ...rest);
    updateTutorial();
    return result;
  };

  window.addEventListener("keydown", (event) => {
    if (tutorial.active && tutorial.blockJumpUntilRelease && event.code === "Space") {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
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

  window.addEventListener("keyup", (event) => {
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
