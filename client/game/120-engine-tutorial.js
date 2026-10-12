// Ribbit Race Friends 1.7.10 - polished typed Ember dialogue and scripted checked Park scenarios.
(() => {
  "use strict";

  const SOLO_SEEN_KEY = "rrFriendsEngineTutorialSoloSeenV8";
  const PVP_SEEN_KEY = "rrFriendsEngineTutorialPvpSeenV8";
  const TUTORIAL_BUILD = "2026.10.12-friends-polish-8";
  const TUTORIAL_ACHIEVEMENT_ID = "tutorial-graduate";
  const TYPEWRITER_MS_PER_CHARACTER = 28;
  const DIALOGUE_TEXT_SCALE = 0.86;
  const DIALOGUE_SPACE_HOLD_THRESHOLD_MS = 180;
  const POOF_TRANSITION_MS = 500;
  const FLY_REFERENCE_FLASH_MS = 440;
  const DIALOGUE_TRIANGLE_FRAME_MS = 520;
  const DIALOGUE_SCENE_SETTLE_MS = 120;
  const CORRECT_CATCH_LANDING_HOLD_MS = 500;
  const FLY_DIALOGUE_REVEAL_HOLD_MS = 500;
  const FINAL_TUTORIAL_DIALOGUE = Object.freeze([
    "You did it, tadpole! You're officially Ribbit Ready!"
  ]);
  const EMBER_SKIN = Object.freeze({ ...FROG_SKINS.ember, hat: "none" });
  const EMBER_PORTRAIT_SOURCES = Object.freeze({
    amazed: "/tutorial/ember-amazed.png",
    annoyed: "/tutorial/ember-annoyed.png",
    confused: "/tutorial/ember-confused.png",
    dazed: "/tutorial/ember-dazed.png",
    determined: "/tutorial/ember-determined.png",
    happy: "/tutorial/ember-happy.png",
    laughing: "/tutorial/ember-laughing.png",
    peace: "/tutorial/ember-peace.png",
    questioning: "/tutorial/ember-questioning.png",
    sad: "/tutorial/ember-sad.png",
    shocked: "/tutorial/ember-shocked.png",
    thumbsup: "/tutorial/ember-thumbsup.png",
    confident: "/tutorial/ember-determined.png",
    smile: "/tutorial/ember-happy.png",
    cool: "/tutorial/ember-peace.png",
    thinking: "/tutorial/ember-questioning.png"
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
    dialoguePreLineDelayUntil: 0,
    dialogueHeldLineText: "",
    dialogueHeldPortraitKey: "",
    dialogueHeldUntil: 0,
    dialogueForceComplete: false,
    dialogueSpaceHeld: false,
    dialogueSpaceHeldAt: 0,
    dialogueFastForwardExtraMs: 0,
    dialoguePointerId: null,
    dialogueTalkBlipAt: 0,
    dialogueTalkCharCount: 0,
    blockJumpUntilRelease: false,
    startQueued: false,
    kind: "solo",
    step: 0,
    passed: false,
    passAt: 0,
    passPending: false,
    passPendingAt: 0,
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
    resetAction: null,
    resetShowFailure: true,
    resetArmFlies: true,
    resetPreserveFlyKeys: null,
    resetReason: "",
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
    sceneLandingDelayUntil: 0,
    scenePositionedDuringDialogue: false,
    pendingStartPose: null,
    promptHidden: false,
    wrongFlyPromptIndex: 0,
    wrongFlyOriginalVocabIndex: 1,
    wrongFlyOriginalFlyId: null,
    wrongFlyRightFlyId: null,
    wrongFlyRightSpawned: false,
    wrongFlyRightCaught: false,
    wrongFlyReturnedCaught: false,
    wrongFlyResolvedAt: 0,
    wrongFlyFollowupQueued: false,
    goalHovered: false,
    authStartQueued: false,
    authQueuedKind: "solo",
    mentorSide: "right",
    mentorX: PVP_START_X[1],
    mentorY: CONFIG.groundY - frog.h,
    pvpBonks: 0,
    pvpRebounds: 0,
    pvpLastStun: 0,
    bufferedJumpChainCount: 0,
    bufferedJumpWindowOpenedAt: 0,
    wasGroundedLastFrame: true,
    revealPromptOnLanding: false,
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
        "Who knows? Maybe you'll even be able to keep up with me someday!",
        "Your goal is simple...",
        "Catch the most flies and be the best!"
      ],
      portrait: "happy",
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
      portrait: "determined",
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
      portrait: "happy",
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
        "You don't have to land right on top of a fly to catch it.",
        "Get close enough, and your tongue will automatically grab it.",
        "This fly is too far for even my legs.",
        "Charge a long jump and let your tongue handle the rest!"
      ],
      portrait: "peace",
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
        "That wrong fly does not count.",
        "You can come back to it later.",
        "Catch the right fly, and your English clue can update.",
        "That can turn the fly you skipped into the new correct match!"
      ],
      portrait: "questioning",
      goal: ["SPIT, MATCH,", "THEN RETURN"],
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
      portrait: "happy",
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
      portrait: "thumbsup",
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
      portrait: "questioning",
      goal: ["TURN AND CATCH", "WITHIN 2 JUMPS"],
      setup: "wallTurn",
      mentor: "left"
    }),
    Object.freeze({
      scene: 8,
      title: "ONE-JUMP REBOUND",
      dialogue: [
        "Nice turnaround! Now let's turn those two jumps into one.",
        "You don't always have to land before making your comeback!",
        "Jump into the wall, bounce back, and catch the fly before you touch the ground.",
        "Try to make it all happen in one jump!"
      ],
      portrait: "determined",
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
      portrait: "thumbsup",
      goal: ["QUICK DROP", "+ CATCH"],
      setup: "quickDrop",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 10,
      title: "BUFFER A JUMP",
      dialogue: [
        "Let's say that you're REALLY hungry and want to eat as soon as possible.",
        "You can buffer a jump charge by holding jump before you land.",
        "That lets you start charging instantly from the moment you touch the ground.",
        "Show me two buffered jump charges in a row."
      ],
      portrait: "confused",
      goal: ["2 BUFFERED", "JUMP CHARGES"],
      setup: "bufferJumpCharge",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 11,
      title: "BUFFER A DROP",
      dialogue: [
        "Looking smooth!",
        "And you're not just able to buffer another jump.",
        "You're able to buffer a platform drop too!",
        "All you have to do is TAP jump just before landing.",
        "Time it right, and you'll drop straight through while keeping your momentum!",
        "Let's use a buffered drop to catch this fly!"
      ],
      portrait: "peace",
      goal: ["BUFFER THROUGH", "MIDDLE PLATFORM"],
      setup: "bufferDrop",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 12,
      title: "DOUBLE BUFFER DROP",
      dialogue: [
        "Dropping it like it's hot!",
        "You can chain those drops together, too.",
        "All you have to do is TAP jump just before each landing.",
        "Drop through one platform, then the next, and catch all three flies!"
      ],
      portrait: "peace",
      goal: ["2 BUFFERS", "3 FLIES"],
      setup: "doubleBuffer",
      mentor: "right",
      oneAttempt: true
    }),
    Object.freeze({
      scene: 13,
      title: "FINAL PRACTICE ROUND",
      dialogue: [
        "You're moving so fast, I thought you were a dart frog for a second!",
        "You've got the basics. Now let's put them all together.",
        "Catch five matching flies to complete a normal round.",
        "Pick your matches, time your jumps, and make those walls and platforms work for you!",
        "I'll be cheering you on from the lily pads!"
      ],
      portrait: "happy",
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

  // Ember changes expression from sentence to sentence instead of holding one
  // static portrait for an entire lesson. Every sequence intentionally contains
  // at least two different faces, even when a scene is only a few lines long.
  const EMBER_PORTRAIT_SEQUENCE_BY_SETUP = Object.freeze({
    intro: Object.freeze(["happy", "peace", "thumbsup", "questioning", "happy", "amazed"]),
    longJumps: Object.freeze(["determined", "thumbsup", "questioning", "questioning", "determined", "happy"]),
    threeCatches: Object.freeze(["happy", "amazed", "thumbsup", "questioning", "determined", "happy"]),
    rangeCatch: Object.freeze(["thumbsup", "peace", "questioning", "determined", "amazed", "happy"]),
    wrongFly: Object.freeze(["happy", "questioning", "questioning", "annoyed", "dazed", "thumbsup", "confused", "determined", "happy"]),
    comboMixed: Object.freeze(["happy", "thumbsup", "determined", "questioning", "peace"]),
    comboTwo: Object.freeze(["amazed", "thumbsup", "questioning", "happy"]),
    comboThree: Object.freeze(["thumbsup", "laughing", "amazed"]),
    wallTurn: Object.freeze(["amazed", "questioning", "determined", "thumbsup", "questioning", "happy"]),
    reboundCatch: Object.freeze(["thumbsup", "determined", "happy", "peace"]),
    quickDrop: Object.freeze(["thumbsup", "questioning", "determined", "happy", "peace"]),
    bufferJumpCharge: Object.freeze(["confused", "questioning", "thumbsup", "determined"]),
    bufferDrop: Object.freeze(["peace", "questioning", "determined", "thumbsup", "happy", "peace"]),
    doubleBuffer: Object.freeze(["peace", "thumbsup", "determined", "laughing"]),
    normalRound: Object.freeze(["laughing", "happy", "thumbsup", "peace", "happy"]),
    pvpWelcome: Object.freeze(["determined", "happy", "peace"]),
    pvpBonk: Object.freeze(["peace", "laughing", "questioning"]),
    pvpSkyBonk: Object.freeze(["happy", "peace", "determined"]),
    pvpDoubleBonk: Object.freeze(["questioning", "peace", "determined"]),
    pvpRebound: Object.freeze(["peace", "questioning", "laughing"]),
    pvpOffense: Object.freeze(["laughing", "determined", "peace"])
  });


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

  function freezeControlledEntity() {
    const entity = controlledTutorialEntity();
    if (!entity) return;
    entity.vx = 0;
    entity.vy = 0;
    entity.charging = false;
    entity.chargeHoldTime = 0;
    if ("inputHeld" in entity) entity.inputHeld = false;
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
    return profileReady && gateReleased && bodyReleased && frameReleased && inputReleased;
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
    if (tutorial.finalDialogueActive) return FINAL_TUTORIAL_DIALOGUE;
    const step = tutorialStep();
    return Array.isArray(step?.dialogue) && step.dialogue.length ? step.dialogue : [step?.title || "TUTORIAL"];
  }

  function currentDialogueLine() {
    const lines = dialogueLinesForCurrentStep();
    return String(lines[Math.min(tutorial.dialogueLineIndex, lines.length - 1)] || "");
  }

  function currentEmberPortraitKey() {
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
        .filter((currentFly) => currentFly?.tutorialAuthored && currentFly.tutorialArmed !== false)
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
        tutorial.enteredAt = performance.now();
      }
    });
  }

  function prepareDialogueLine(nextIndex) {
    const setup = tutorialStep()?.setup;
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
    const setup = tutorialStep()?.setup;
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
    if (performance.now() - tutorial.dialogueOpenedAt < 90) return false;

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
    tutorial.goalHovered = false;
    tutorial.pvpBonks = 0;
    tutorial.pvpRebounds = 0;
    tutorial.pvpLastStun = 0;
    tutorial.bufferedJumpChainCount = 0;
    tutorial.bufferedJumpWindowOpenedAt = 0;
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
      tutorialAuthored:true, tutorialArmed:false, tutorialRequiresRebound:false,
      tutorialKey:[spawnIndex, vocabIndex, Math.round(x), Math.round(y)].join(":")
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

  function positionCenteredOnPlatform(platform, dir = 1) {
    positionOnPlatform(platform, Math.round((platform.w - frog.w) / 2), dir);
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
    restoreExactParkStage();
    game.sandboxMode = false;
    game.state = "playing";
    flies.length = 0;
    game.spawnQueue = [];
    game.completedVocabIndices = new Set();
    game.score = 0;
    game.jumps = 0;
    game.winPending = false;
    game.finishTime = null;
    game.soloCriticalCatchActive = false;
    game.soloCriticalCatchElapsed = 0;
    nextFlyId = 1;
    tongue.active = false;
    positionSoloFrog(getNormalParkStartX());
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
    tutorial.promptHidden = !armed;
    flies.length = 0;
    clearLabelCaches();
    if (spec.type === "platform") positionOnPlatform(platforms[spec.platform], spec.offset, spec.dir);
    else positionSoloFrog(spec.x, CONFIG.groundY - frog.h, spec.dir);
    setPrompt(spec.vocab);
    const target = makeParkFly(spec.spawn, spec.vocab, attemptIndex);
    if (armed) {
      target.tutorialArmed = true;
      target.spawnAge = 0;
      tutorial.promptHidden = false;
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
        positionSoloFrog(getNormalParkStartX(), CONFIG.groundY - frog.h, 1);
        break;

      case "longJumps":
        positionSoloFrog(getNormalParkStartX(), CONFIG.groundY - frog.h, 1);
        break;

      case "threeCatches":
        setupThreeCatchAttempt(0, false);
        break;

      case "rangeCatch": {
        const oldY = platforms[1].y - frog.h;
        const newY = CONFIG.groundY - frog.h;
        const deltaY = newY - oldY;
        positionSoloFrog(getNormalParkStartX(), CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeFly(324, 38 + deltaY, 0, 4);
        break;
      }

      case "wrongFly": {
        positionCenteredOnPlatform(platforms[3], 1);
        tutorial.wrongFlyPromptIndex = 0;
        tutorial.wrongFlyOriginalVocabIndex = 1;
        setPrompt(tutorial.wrongFlyPromptIndex);
        const skippedFly = makeFly(315, 108, tutorial.wrongFlyOriginalVocabIndex, 0);
        const rightFly = makeFly(390, 150, tutorial.wrongFlyPromptIndex, 1);
        tutorial.wrongFlyOriginalFlyId = skippedFly.id;
        tutorial.wrongFlyRightFlyId = rightFly.id;
        tutorial.wrongFlyRightSpawned = true;
        break;
      }

      case "comboMixed":
        positionSoloFrog(42, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeFly(165, 108, 0, 0);
        makeFly(240, 108, 1, 1);
        break;

      case "comboTwo":
        // Mirror the previous setup so the player approaches from the opposite
        // side instead of repeating the same left-to-right jump pattern.
        positionSoloFrog(W - 42 - frog.w, CONFIG.groundY - frog.h, -1);
        makeFly(315, 108, 0, 0);
        makeFly(240, 108, 1, 1);
        setSequence([0, 1]);
        break;

      case "comboThree":
        // Match the authored diagram: start on the left middle platform, climb
        // over the top-center platform, then sweep through two flies on the right.
        positionCenteredOnPlatform(platforms[2], 1);
        makeFly(242, 52, 0, 0);
        makeFly(365, 52, 1, 1);
        makeFly(430, 111, 2, 2);
        setSequence([0, 1, 2]);
        break;

      case "wallTurn":
        positionSoloFrog(342, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        makeParkFly(7, 0, 0);
        break;

      case "reboundCatch": {
        positionSoloFrog(350, CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        const target = makeParkFly(1, 0, 0);
        target.tutorialRequiresRebound = true;
        break;
      }

      case "quickDrop":
        restoreExactParkStage();
        positionCenteredOnPlatform(platforms[2], 1);
        setPrompt(0);
        makeParkFly(7, 0, 0);
        break;

      case "bufferJumpCharge":
        restoreExactParkStage();
        positionCenteredOnPlatform(platforms[1], 1);
        tutorial.promptHidden = true;
        setPrompt(0);
        break;

      case "bufferDrop":
        restoreExactParkStage();
        positionSoloFrog(
          platforms[2].x + Math.round((platforms[2].w - frog.w) / 2),
          CONFIG.groundY - frog.h,
          1
        );
        setPrompt(0);
        makeFly(408, 150, 0, 0);
        break;

      case "doubleBuffer":
        restoreExactParkStage();
        positionCenteredOnPlatform(platforms[1], 1);
        makeParkFly(2, 0, 0);
        makeParkFly(4, 1, 1);
        makeParkFly(6, 2, 2);
        setSequence([0, 1, 2]);
        break;

      case "normalRound":
        restoreExactParkStage();
        game.sandboxMode = false;
        game.soloCatchGoal = 5;
        resetGame(true);
        restoreExactParkStage();
        game.state = "playing";
        break;

      default:
        break;
    }

    setMentor(step.mentor || "right");
    restoreExactParkStage();
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

  function configureStep(showDialogue = true, options = {}) {
    const preservedVisualPose = options.preserveVisualPose || null;
    if (tutorial.kind === "pvp") configurePvpStep(tutorial.step);
    else configureSoloStep(tutorial.step);
    tutorial.pendingStartPose = captureControlledPose();
    if (preservedVisualPose) {
      applyControlledPose(preservedVisualPose);
      freezeControlledEntity();
    }
    tutorial.dialogueOpen = false;
    tutorial.dialoguePointerId = null;
    tutorial.blockJumpUntilRelease = false;
    if (showDialogue) {
      openDialogue();
    } else {
      restoreStepSequence();
      armTutorialFlies();
      tutorial.enteredAt = performance.now();
      game.state = "playing";
      game.pauseHelpOpen = false;
    }
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

  function beginPoofTransition(options = {}) {
    if (!tutorial.active || tutorial.resetPending) return false;
    const entity = controlledTutorialEntity();
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
    tutorial.resetAt = performance.now() + POOF_TRANSITION_MS;
    tutorial.resetMessage = String(options.message || "");
    tutorial.resetAction = typeof options.action === "function" ? options.action : null;
    tutorial.resetShowFailure = options.showFailure !== false;
    tutorial.resetArmFlies = options.armFlies !== false;
    tutorial.resetPreserveFlyKeys = options.preserveExistingFlies
      ? collectVisibleTutorialFlyKeys()
      : null;
    tutorial.resetReason = String(options.reason || "reset");
    tutorial.frogHidden = true;
    tutorial.goalHovered = false;
    clearHeldInput();
    freezeControlledEntity();
    return true;
  }

  function rebuildCurrentScenarioForRetry() {
    if (tutorial.kind === "pvp") configurePvpStep(tutorial.step);
    else configureSoloStep(tutorial.step);
    tutorial.pendingStartPose = captureControlledPose();
    tutorial.dialogueOpen = false;
    tutorial.dialoguePointerId = null;
    tutorial.blockJumpUntilRelease = false;
    restoreStepSequence();
    game.pauseHelpOpen = false;
    game.state = "playing";
  }

  function beginScenarioEntryTransition() {
    const intendedStartPose = tutorial.pendingStartPose || captureControlledPose();
    beginPoofTransition({
      reason: "scene-entry",
      showFailure: false,
      preserveExistingFlies: false,
      action: () => {
        applyControlledPose(intendedStartPose);
        tutorial.pendingStartPose = null;
        restoreStepSequence();
        if (tutorialStep()?.setup === "wrongFly") tutorial.promptHidden = false;
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

    tutorial.resetPending = false;
    tutorial.resetAt = 0;
    tutorial.resetMessage = "";
    tutorial.resetAction = null;
    tutorial.resetShowFailure = true;
    tutorial.resetArmFlies = true;
    tutorial.resetPreserveFlyKeys = null;
    tutorial.resetReason = "";

    try {
      if (action) action();
      else rebuildCurrentScenarioForRetry();
    } catch (error) {
      console.warn("Ribbit Race tutorial reset recovered", error);
      rebuildCurrentScenarioForRetry();
    }

    resetTutorialTongue();
    if (armFlies) armTutorialFlies({ preserveKeys: preserveFlyKeys });
    tutorial.frogHidden = false;
    freezeControlledEntity();
    const entity = controlledTutorialEntity();
    addTutorialPoof(
      Number(entity?.x || 0) + Number(entity?.w || frog.w) / 2,
      Number(entity?.y || 0) + Number(entity?.h || frog.h) / 2,
      "in"
    );
    playTutorialPoofSound("in");

    if (showFailure) {
      tutorial.failureText = message;
      tutorial.failureFlashStartedAt = performance.now();
      tutorial.failureMessageUntil = tutorial.failureFlashStartedAt + tutorial.failureFlashDuration;
    }
    tutorial.enteredAt = performance.now();
    game.state = "playing";
    game.pauseHelpOpen = false;
  }

  function failAttempt(message) {
    if (!tutorial.active || tutorial.passed || tutorial.resetPending) return;
    beginPoofTransition({
      reason: "failed-attempt",
      message: message || "TRY AGAIN",
      showFailure: true,
      preserveExistingFlies: true,
      action: rebuildCurrentScenarioForRetry
    });
  }

  function finalizePassedStep() {
    if (!tutorial.active || tutorial.passed) return;
    tutorial.passPending = false;
    tutorial.passPendingAt = 0;
    tutorial.passed = true;
    tutorial.passAt = performance.now();
    freezeControlledEntity();
    tone(620, .07, .018, 85);
  }

  function passStep() {
    if (!tutorial.active || tutorial.passed || tutorial.passPending) return;
    // Techniques such as wall rebounds can succeed in mid-air. Let the real
    // engine finish the landing before Ember freezes the pose for dialogue.
    if (tutorial.kind === "solo" && (!frog.grounded || tongue.active || game.soloCriticalCatchActive)) {
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
    flies.length = 0;
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
    if (!game.roundUnlockedAchievementIds.includes(TUTORIAL_ACHIEVEMENT_ID)) {
      game.roundUnlockedAchievementIds.push(TUTORIAL_ACHIEVEMENT_ID);
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

  function nextStep() {
    const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
    if (tutorial.step >= steps.length - 1) {
      finish(true);
      return;
    }
    const visualPose = captureControlledPose();
    freezeControlledEntity();
    tutorial.step += 1;
    configureStep(true, { preserveVisualPose: visualPose });
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
    beginPoofTransition({
      reason: "retry-missed-fly",
      message: "CATCH THIS MATCHING FLY IN ONE JUMP",
      showFailure: true,
      preserveExistingFlies: true,
      action: () => {
        setupThreeCatchAttempt(missedAttemptIndex, false);
        resetAttemptForNextJump();
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
    const landedThisFrame = !tutorial.wasGroundedLastFrame && frog.grounded;
    if (landedThisFrame) {
      tutorial.bufferedJumpWindowOpenedAt = now;
      if (setup === "bufferJumpCharge") {
        tutorial.bufferedJumpChainCount = game.buttonHeld
          ? tutorial.bufferedJumpChainCount + 1
          : 0;
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
        tutorial.sceneLandingDelayUntil = now + CORRECT_CATCH_LANDING_HOLD_MS;
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
      if (tutorial.bufferedJumpChainCount >= 2) {
        passStep();
      } else if (attemptEnded && tutorial.jumpAttempts >= 3) {
        failAttempt("BUFFER TWO JUMP CHARGES IN A ROW");
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

  function tutorialMovementLocked() {
    return Boolean(
      tutorial.active &&
      (tutorial.dialogueOpen || tutorial.resetPending || tutorial.frogHidden || tutorial.passed ||
        tutorial.sceneLandingDelayUntil > performance.now())
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
    if (options.animateFlies !== false) animateFlies(safeDt);
  }

  function updateTutorial() {
    if (!tutorial.active) return;
    if (game.state === "paused" || game.state === "countdown") return;

    if (tutorial.resetPending) {
      if (performance.now() >= tutorial.resetAt) completePendingReset();
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

    if (tutorial.kind === "pvp") monitorPvp();
    else {
      if (SOLO_STEPS[tutorial.step]?.setup !== "normalRound") game.spawnQueue.length = 0;
      monitorSolo();
    }
  }

  function tutorialStep() {
    const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
    return steps[tutorial.step] || steps[0];
  }

  function drawMentorFrog() {
    // Ember teaches through the close-up dialogue portrait only.
    // No second frog is rendered in the playable tutorial arena.
  }

  function tutorialPlayerHasControl() {
    return Boolean(
      tutorial.active &&
      game.state === "playing" &&
      !tutorial.dialogueOpen &&
      !tutorial.resetPending &&
      !tutorial.frogHidden &&
      !tutorial.passed &&
      !tutorial.passPending &&
      tutorial.sceneLandingDelayUntil <= performance.now() &&
      !tutorial.blockJumpUntilRelease
    );
  }

  function currentGoalLines() {
    const step = tutorialStep();
    if (!step) return ["TUTORIAL"];
    if (!tutorialPlayerHasControl() && step.setup !== "threeCatches" && step.setup !== "wrongFly") return [];
    if (step.setup === "longJumps") return ["LONG JUMPS", `${tutorial.longJumpStreak} / 3`];
    if (step.setup === "threeCatches") return ["MATCHES", `${Math.min(3, tutorial.sceneCatchCount)} / 3`];
    if (step.setup === "wrongFly") {
      if (tutorial.wrongFlyReturnedCaught) return ["RETURNED", "FOR THE MATCH"];
      if (tutorial.wrongFlyRightCaught) return ["RETURN FOR", `THE OLD FLY • ${Math.max(0, 4 - tutorial.jumpAttempts)} JUMPS LEFT`];
      if (tutorial.wrongFlyRightSpawned) return ["CATCH THE", `RIGHT FLY • ${Math.max(0, 4 - tutorial.jumpAttempts)} JUMPS LEFT`];
      return ["TRY THE WRONG", `FLY • ${Math.max(0, 4 - tutorial.jumpAttempts)} JUMPS LEFT`];
    }
    if (step.setup === "bufferJumpCharge") return ["BUFFERED JUMPS", `${tutorial.bufferedJumpChainCount} / 2`];
    return Array.isArray(step.goal) ? step.goal : [step.title];
  }

  function drawDialogueContinueTriangle(x, y) {
    const frameOffset = Math.floor(performance.now() / DIALOGUE_TRIANGLE_FRAME_MS) % 2;
    const top = Math.round(y + frameOffset);
    const left = Math.round(x - 3);
    ctx.fillStyle = "#bdeef5";
    ctx.fillRect(left, top, 7, 1);
    ctx.fillRect(left + 1, top + 1, 5, 1);
    ctx.fillRect(left + 2, top + 2, 3, 1);
    ctx.fillRect(left + 3, top + 3, 1, 1);
  }

  function drawTutorialDialogue() {
    if (!tutorial.active || !tutorial.dialogueOpen || game.state === "countdown") return;

    const now = performance.now();
    const lines = dialogueLinesForCurrentStep();
    const holdingPreviousLine = Boolean(
      tutorial.dialogueHeldLineText &&
      tutorial.dialogueHeldUntil > now
    );
    const fullLine = holdingPreviousLine
      ? tutorial.dialogueHeldLineText
      : currentDialogueLine();
    const visibleCount = holdingPreviousLine
      ? fullLine.length
      : visibleDialogueCharacterCount(fullLine);
    const lastLine = tutorial.dialogueLineIndex >= lines.length - 1;

    if (!holdingPreviousLine && game.state !== "paused") {
      if (!dialogueLineIsComplete() && visibleCount > 0 && now >= (tutorial.dialogueTalkBlipAt || 0)) {
        const toneStep = visibleCount % 4;
        const frequency = [980, 1060, 1120, 1020][toneStep];
        try { tone(frequency, 0.016, 0.0045, 20); } catch (_) {}
        tutorial.dialogueTalkBlipAt = now + 54;
      }
    }

    // Reference baseline: a long dark-navy text window with layered black,
    // cyan, and white pixel framing. Ember's complete square portrait sits in
    // its own attached card, with the nameplate beneath the picture instead of
    // covering any part of it.
    const textPanel = { x: 90, y: 6, w: 250, h: 50 };
    const portraitPanel = { x: 338, y: 6, w: 54, h: 64 };
    const textArea = {
      x: textPanel.x + 12,
      y: textPanel.y + 10,
      w: textPanel.w - 24,
      h: textPanel.h - 20
    };
    const portraitKey = holdingPreviousLine
      ? tutorial.dialogueHeldPortraitKey
      : currentEmberPortraitKey();
    const portraitImage = EMBER_PORTRAITS[portraitKey] || EMBER_PORTRAITS.confident;
    const textLayout = layoutBitmapText(fullLine, textArea.w, {
      maxScale: DIALOGUE_TEXT_SCALE,
      minScale: 0.68,
      maxLines: 2
    });
    const wrappedLines = textLayout.lines.slice(0, 2);
    const textScale = textLayout.scale;
    const lineHeight = Math.max(7, Math.ceil(8 * textScale + 2));
    const totalTextHeight = wrappedLines.length * lineHeight - 2;
    const textTop = Math.round(textArea.y + Math.max(0, (textArea.h - totalTextHeight) / 2));

    ctx.save();
    ctx.globalAlpha = .995;

    const drawReferencePanel = (panel, topColor, bottomColor) => {
      ctx.fillStyle = "rgba(4,18,28,.42)";
      ctx.fillRect(panel.x + 2, panel.y + 3, panel.w, panel.h);

      // Five-layer pixel frame: black -> cyan -> white -> cyan -> black.
      ctx.fillStyle = "#031723";
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
      ctx.fillStyle = "#06dff2";
      ctx.fillRect(panel.x + 1, panel.y + 1, panel.w - 2, panel.h - 2);
      ctx.fillStyle = "#f5ffff";
      ctx.fillRect(panel.x + 2, panel.y + 2, panel.w - 4, panel.h - 4);
      ctx.fillStyle = "#17d8ed";
      ctx.fillRect(panel.x + 3, panel.y + 3, panel.w - 6, panel.h - 6);
      ctx.fillStyle = "#05202e";
      ctx.fillRect(panel.x + 5, panel.y + 5, panel.w - 10, panel.h - 10);

      const fill = ctx.createLinearGradient(panel.x, panel.y + 5, panel.x, panel.y + panel.h - 5);
      fill.addColorStop(0, topColor);
      fill.addColorStop(1, bottomColor);
      ctx.fillStyle = fill;
      ctx.fillRect(panel.x + 7, panel.y + 7, panel.w - 14, panel.h - 14);

      // White and cyan corner pixels echo the supplied frame design.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(panel.x + 7, panel.y + 7, 3, 2);
      ctx.fillRect(panel.x + 7, panel.y + 7, 2, 4);
      ctx.fillStyle = "#50f4ff";
      ctx.fillRect(panel.x + panel.w - 10, panel.y + panel.h - 9, 3, 2);
      ctx.fillRect(panel.x + panel.w - 9, panel.y + panel.h - 10, 2, 3);
    };

    drawReferencePanel(textPanel, "#0b4462", "#052b43");
    drawReferencePanel(portraitPanel, "#159ee4", "#087cc5");

    const imageSize = portraitPanel.w - 12;
    const imageX = portraitPanel.x + 6;
    const imageY = portraitPanel.y + 6;
    ctx.fillStyle = "#168fd5";
    ctx.fillRect(imageX, imageY, imageSize, imageSize);

    if (portraitImage?.complete && portraitImage.naturalWidth > 0) {
      const oldSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      const sourceW = portraitImage.naturalWidth;
      const sourceH = portraitImage.naturalHeight;
      const fit = Math.min(imageSize / sourceW, imageSize / sourceH);
      const drawW = Math.max(1, Math.round(sourceW * fit));
      const drawH = Math.max(1, Math.round(sourceH * fit));
      const drawX = imageX + Math.round((imageSize - drawW) / 2);
      const drawY = imageY + Math.round((imageSize - drawH) / 2);
      ctx.drawImage(portraitImage, 0, 0, sourceW, sourceH, drawX, drawY, drawW, drawH);
      ctx.imageSmoothingEnabled = oldSmoothing;
    } else {
      ctx.fillStyle = EMBER_SKIN.dark;
      ctx.fillRect(imageX + 5, imageY + 4, imageSize - 10, imageSize - 8);
    }

    // Separate nameplate beneath the full square portrait.
    const nameX = imageX;
    const nameY = imageY + imageSize + 1;
    const nameW = imageSize;
    const nameH = 9;
    ctx.fillStyle = "#3d2417";
    ctx.fillRect(nameX, nameY, nameW, nameH);
    const nameFill = ctx.createLinearGradient(nameX, nameY + 1, nameX, nameY + nameH - 1);
    nameFill.addColorStop(0, "#ffd06a");
    nameFill.addColorStop(1, "#f49a3b");
    ctx.fillStyle = nameFill;
    ctx.fillRect(nameX + 1, nameY + 1, nameW - 2, nameH - 2);
    ctx.fillStyle = "#ffe69a";
    ctx.fillRect(nameX + 3, nameY + 2, nameW - 6, 1);
    drawBitmapText("EMBER", nameX + nameW / 2, nameY + 1, .62, "center", "#2f1b12");

    let remaining = visibleCount;
    wrappedLines.forEach((wrappedLine, index) => {
      const visibleOnLine = wrappedLine.slice(0, Math.max(0, Math.min(wrappedLine.length, remaining)));
      drawBitmapText(
        visibleOnLine,
        textArea.x,
        textTop + index * lineHeight,
        textScale,
        "left",
        COLORS.white
      );
      remaining -= wrappedLine.length + 1;
    });

    if (!holdingPreviousLine && !lastLine && dialogueLineIsComplete()) {
      drawDialogueContinueTriangle(textArea.x + textArea.w - 6, textPanel.y + textPanel.h - 11);
    }
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

  function drawFlashingReferenceFrame(rect) {
    if (!rect) return;
    const phase = (performance.now() % FLY_REFERENCE_FLASH_MS) / FLY_REFERENCE_FLASH_MS;
    const bright = phase < .5;
    const color = bright ? "#ffe36d" : "#78e8f5";
    const alpha = bright ? .96 : .76;
    const x = Math.round(rect.x - 3);
    const y = Math.round(rect.y - 3);
    const w = Math.round(rect.w + 6);
    const h = Math.round(rect.h + 6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillRect(x, y + 2, 2, h - 4);
    ctx.fillRect(x + w - 2, y + 2, 2, h - 4);
    ctx.globalAlpha = bright ? .12 : .07;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }

  function getTutorialFlyLabelRect(currentFly) {
    if (!currentFly) return null;
    const term = normalizeVocabularyCellText(getLocalizedFlyTerm(VOCABULARY[currentFly.vocabIndex]) || "?", 80);
    const anchor = getFlyLabelAnchor(currentFly);
    if (!anchor) return null;
    const layout = layoutStableFlyLabelText(term, 120);
    if (!layout) return null;
    const widest = Math.max(...layout.lines.map((line) => measureBitmapText(line, layout.scale)), 0);
    const lineHeight = Math.max(7, Math.ceil(8 * layout.scale + 1));
    const width = Math.round(clamp(Math.max(32, widest + 10), 32, 132));
    const height = Math.round(Math.max(17, 8 + layout.lines.length * lineHeight));
    return chooseFlyLabelRect(currentFly, anchor, width, height);
  }

  function drawTutorialReferenceHighlights() {
    if (!tutorial.active || !tutorial.dialogueOpen || tutorialStep()?.setup !== "threeCatches") return;
    if (tutorial.dialogueLineIndex === 2) {
      const target = flies.find((currentFly) => currentFly?.tutorialAuthored && currentFly.tutorialArmed !== false);
      drawFlashingReferenceFrame(getTutorialFlyLabelRect(target));
    } else if (tutorial.dialogueLineIndex === 3) {
      drawFlashingReferenceFrame({ x:154, y:234, w:172, h:33 });
    }
  }

  function drawTutorialProgress() {
    if (!tutorial.active) return;
    const scene = tutorial.kind === "pvp"
      ? Math.min(PVP_STEPS.length, tutorial.step + 1)
      : Number(tutorialStep()?.scene || Math.min(SOLO_STEPS.length, tutorial.step + 1));
    const total = tutorial.kind === "pvp"
      ? PVP_STEPS.length
      : SOLO_STEPS.reduce((max, step) => Math.max(max, Number(step?.scene || 0)), 0);
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

  function getTutorialGoalRect() {
    // Match the vocabulary card's y-level and the normal TIME/JUMPS/BEST width.
    // The two-pixel gutter after x=326 prevents either black outline from
    // painting over the other.
    return { x:328, y:234, w:150, h:33 };
  }

  function currentGoalHowToLines() {
    const setup = tutorialStep()?.setup;
    if (setup === "wrongFly") {
      if (tutorial.wrongFlyRightCaught) return ["THE OLD FLY NOW MATCHES", "YOU MAY RETURN FOR IT"];
      if (tutorial.wrongFlyRightSpawned) return ["CATCH THE FLY THAT MATCHES", "WATCH THE CLUE UPDATE"];
      return ["TRY THE WRONG FLY", "IT WILL SPIT BACK OUT"];
    }
    const instructions = {
      intro: ["READ EMBER'S TIPS"],
      longJumps: ["HOLD JUMP TO CHARGE", "RELEASE NEAR FULL POWER"],
      threeCatches: ["READ THE ENGLISH CLUE", "CATCH ITS MATCHING TERM"],
      rangeCatch: ["CHARGE A LONG JUMP", "LET YOUR TONGUE REACH"],
      comboMixed: ["LINE UP ONE JUMP", "MATCH FIRST, WRONG SECOND"],
      comboTwo: ["LINE UP BOTH FLIES", "CATCH BOTH BEFORE LANDING"],
      comboThree: ["FOLLOW THE FLY ARC", "CATCH ALL 3 BEFORE LANDING"],
      wallTurn: ["JUMP INTO A WALL", "RETURN FOR THE FLY"],
      reboundCatch: ["HIT THE WALL IN MIDAIR", "CATCH BEFORE LANDING"],
      quickDrop: ["TAP JUMP QUICKLY", "WHILE ON THE PLATFORM"],
      bufferJumpCharge: ["HOLD JUMP BEFORE LANDING", "DO 2 BUFFERED JUMPS"],
      bufferDrop: ["TAP JUMP BEFORE LANDING", "DROP THROUGH THE PLATFORM"],
      doubleBuffer: ["BUFFER BEFORE EACH LANDING", "CHAIN ALL 3 FLIES"],
      normalRound: ["READ EACH ENGLISH CLUE", "CATCH 5 MATCHING TERMS"],
      pvpWelcome: ["HOLD, THEN RELEASE", "TO MAKE A CHARGED JUMP"],
      pvpBonk: ["FALL ON TOP OF EMBER"],
      pvpSkyBonk: ["JUMP HIGH", "THEN LAND ON EMBER"],
      pvpDoubleBonk: ["WAIT FOR RECOVERY", "THEN BONK AGAIN"],
      pvpRebound: ["COLLIDE SIDE-TO-SIDE"],
      pvpOffense: ["REBOUND OFF EMBER", "THEN CATCH THE FLY"]
    };
    return instructions[setup] || ["COMPLETE THE CURRENT GOAL"];
  }

  function drawGoalHowToTooltip() {
    if (!tutorial.active || !tutorial.goalHovered || !tutorialPlayerHasControl() || tutorialStep()?.setup === "normalRound") return;
    const lines = currentGoalHowToLines();
    const panel = { x:304, y:183, w:172, h:40 };
    const skin = getSelectedSkin();

    ctx.save();
    ctx.fillStyle = "rgba(25,43,52,.34)";
    ctx.fillRect(panel.x + 3, panel.y + 3, panel.w, panel.h);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(panel.x + 2, panel.y + 2, panel.w - 4, panel.h - 4);
    ctx.fillStyle = skin.mid;
    ctx.fillRect(panel.x + 4, panel.y + 4, panel.w - 8, 7);
    drawBitmapText("HOW TO", panel.x + panel.w / 2, panel.y + 5, .52, "center", COLORS.white, skin.dark);

    const lineScale = .46;
    const lineHeight = 7;
    const firstY = lines.length > 1 ? panel.y + 18 : panel.y + 22;
    lines.slice(0, 2).forEach((line, index) => {
      const fitted = Math.min(lineScale, (panel.w - 12) / Math.max(1, measureBitmapText(line, 1)));
      drawBitmapText(line, panel.x + panel.w / 2, firstY + index * lineHeight, fitted, "center", "#34484f");
    });

    // Small main-menu-style pointer aimed at the Current Goal card.
    const pointerX = 400;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(pointerX - 4, panel.y + panel.h, 9, 2);
    ctx.fillRect(pointerX - 3, panel.y + panel.h + 2, 7, 2);
    ctx.fillRect(pointerX - 2, panel.y + panel.h + 4, 5, 2);
    ctx.fillRect(pointerX - 1, panel.y + panel.h + 6, 3, 1);
    ctx.restore();
  }

  function drawCurrentGoalHud() {
    if (!tutorial.active) return;
    const goal = currentGoalLines();
    const { x, y, w, h } = getTutorialGoalRect();
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

    ctx.fillStyle = EMBER_SKIN.mid;
    ctx.fillRect(x + 6, y + 4, w - 12, 2);
    ctx.fillStyle = EMBER_SKIN.dark;
    ctx.fillRect(x + 6, y + 7, w - 12, 8);
    drawBitmapText("CURRENT GOAL", x + w / 2, y + 8, .38, "center", COLORS.white);

    if (goal.length > 0) {
      const trophyScale = .58;
      const trophyHeight = 17 * trophyScale;
      const contentTop = y + 16;
      const contentBottom = y + h - 3;
      const trophyTop = Math.round(contentTop + (contentBottom - contentTop - trophyHeight) / 2);
      drawPixelTrophy(x + 16, trophyTop, false, trophyScale);
      // Goal copy is centered on the full card, not on the leftover space beside
      // the trophy. This keeps LONG JUMPS and every other objective truly centered.
      const goalCenterX = x + w / 2;
      const goalWidth = w - 18;
      if (goal.length > 1) {
        const scale0 = Math.min(.44, goalWidth / Math.max(1, measureBitmapText(goal[0], 1)));
        const scale1 = Math.min(.44, goalWidth / Math.max(1, measureBitmapText(goal[1], 1)));
        drawBitmapText(goal[0], goalCenterX, y + 18, scale0, "center", "#34484f");
        drawBitmapText(goal[1], goalCenterX, y + 26, scale1, "center", "#34484f");
      } else {
        const scale = Math.min(.48, goalWidth / Math.max(1, measureBitmapText(goal[0], 1)));
        drawBitmapText(goal[0], goalCenterX, y + 22, scale, "center", "#34484f");
      }
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
    if (!tutorial.active || game.state === "paused" || game.state === "countdown") return;
    const finalPractice = tutorialStep()?.setup === "normalRound";
    if (!finalPractice) drawCurrentGoalHud();
    drawTutorialSmoke();
    drawTutorialReferenceHighlights();
    if (!tutorial.dialogueOpen) drawTutorialProgress();
    if (!tutorial.dialogueOpen && !finalPractice) drawGoalHowToTooltip();
    if (tutorial.dialogueOpen) drawTutorialDialogue();
  }

  function getTutorialCompletionButtonRects() {
    return {
      replayButton: { x: -300, y: -300, w: 1, h: 1 },
      homeButton: { x: Math.round(W / 2 - 60), y: 232, w: 120, h: 22 }
    };
  }

  function drawTutorialCompletionHomeButton(rect) {
    const skin = getSelectedSkin();
    const selected = game.victoryHoveredSelection === "home" ||
      game.victoryPressedSelection === "home" ||
      (!game.victoryMouseMode && game.victorySelection === "home");
    ctx.fillStyle = "rgba(7,24,34,.34)";
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = selected ? COLORS.ink : "#8fa6ac";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = selected ? skin.dark : "#f7fdff";
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.fillStyle = selected ? skin.mid : COLORS.white;
    ctx.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
    ctx.fillStyle = selected ? skin.light : "#dceff3";
    ctx.fillRect(rect.x + 7, rect.y + 5, rect.w - 14, 3);
    drawBitmapText("HOME", rect.x + rect.w / 2, rect.y + 8, 1, "center", selected ? COLORS.white : "#34484f", selected ? skin.dark : null);
  }

  function drawCompletionScreen() {
    if (!tutorial.completeScreen || game.state !== "won") return;
    const skin = getSelectedSkin();
    const panel = { x: 82, y: 18, w: 316, h: 58 };

    ctx.save();
    ctx.fillStyle = "rgba(6,22,31,.42)";
    ctx.fillRect(panel.x + 4, panel.y + 5, panel.w, panel.h);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = "#06dff2";
    ctx.fillRect(panel.x + 2, panel.y + 2, panel.w - 4, panel.h - 4);
    ctx.fillStyle = "#f5ffff";
    ctx.fillRect(panel.x + 3, panel.y + 3, panel.w - 6, panel.h - 6);
    ctx.fillStyle = skin.dark;
    ctx.fillRect(panel.x + 5, panel.y + 5, panel.w - 10, panel.h - 10);
    ctx.fillStyle = skin.mid;
    ctx.fillRect(panel.x + 7, panel.y + 7, panel.w - 14, panel.h - 14);
    ctx.fillStyle = skin.light;
    ctx.fillRect(panel.x + 10, panel.y + 9, panel.w - 20, 4);

    const title = "TUTORIAL COMPLETE!";
    const titleScale = Math.min(1.8, (panel.w - 24) / Math.max(1, measureBitmapText(title, 1)));
    drawBitmapText(title, W / 2, panel.y + 20, titleScale, "center", COLORS.white, skin.dark);
    drawBitmapText("RIBBIT READY!", W / 2, panel.y + 42, .92, "center", COLORS.white, skin.dark);

    drawTutorialCompletionHomeButton(getTutorialCompletionButtonRects().homeButton);
    ctx.restore();
  }

  const originalDrawVictoryScreenForTutorial = drawVictoryScreen;
  drawVictoryScreen = function(...args) {
    if (tutorial.completeScreen) return;
    return originalDrawVictoryScreenForTutorial.apply(this, args);
  };

  const originalGetVictoryButtonRectsForTutorial = getVictoryButtonRects;
  getVictoryButtonRects = function(...args) {
    if (tutorial.completeScreen) return getTutorialCompletionButtonRects();
    return originalGetVictoryButtonRectsForTutorial.apply(this, args);
  };

  const originalSelectVictoryOptionForTutorial = selectVictoryOption;
  selectVictoryOption = function(option, ...rest) {
    if (tutorial.completeScreen) {
      game.victorySelection = "home";
      game.victoryMouseMode = false;
      return;
    }
    return originalSelectVictoryOptionForTutorial.call(this, option, ...rest);
  };

  const originalActivateVictorySelectionForTutorial = activateVictorySelection;
  activateVictorySelection = function(...args) {
    if (tutorial.completeScreen) {
      dismissCompletionScreen();
      return;
    }
    return originalActivateVictorySelectionForTutorial.apply(this, args);
  };


  function drawBlankTutorialVocabularyPrompt() {
    if (!["playing", "paused", "countdown"].includes(game.state) || game.sandboxMode || game.winPending) return;
    const left = 154;
    const top = 234;
    const width = 172;
    const height = 33;
    ctx.fillStyle = "rgba(25,43,52,0.35)";
    ctx.fillRect(left + 2, top + 2, width - 2, height);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(left, top, width, height);
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(left + 2, top + 2, width - 4, height - 4);
    ctx.fillStyle = getSelectedSkin().mid;
    ctx.fillRect(left + 4, top + 4, width - 8, 8);
    drawBitmapText(
      "FIND THE MATCH",
      W / 2,
      top + 5,
      0.96,
      "center",
      COLORS.white,
      getSelectedSkin().dark
    );
  }


  function tutorialPromptVisibleDuringDialogue() {
    return Boolean(
      tutorial.active &&
      tutorial.dialogueOpen &&
      tutorialStep()?.setup === "threeCatches" &&
      tutorial.dialogueLineIndex >= 3 &&
      flies.some((currentFly) => currentFly?.tutorialAuthored && currentFly.tutorialArmed !== false)
    );
  }

  // The next vocabulary target is allowed to exist internally for authored fly
  // logic, but it is not revealed in the footer until the frog is actually back
  // under player control. Scene retries and poof resets therefore stay blank.
  const originalDrawVocabularyPromptForTutorial = drawVocabularyPrompt;
  drawVocabularyPrompt = function(...args) {
    const visibleDuringExplanation = tutorialPromptVisibleDuringDialogue();
    if (tutorial.active && ((!tutorialPlayerHasControl() && !visibleDuringExplanation) || tutorial.promptHidden)) {
      drawBlankTutorialVocabularyPrompt();
      return;
    }
    return originalDrawVocabularyPromptForTutorial.apply(this, args);
  };

  // Training is a reversible playtest session. Suppress every ordinary solo/PvP
  // achievement while it is active; only the dedicated completion achievement
  // may pass through when the tutorial itself awards it.
  const originalMarkAchievementEarnedForTutorial = markAchievementEarned;
  markAchievementEarned = function(id, ...rest) {
    const trainingSession = Boolean(tutorial.active || tutorial.completeScreen || game.tutorialActive);
    if (trainingSession && id !== TUTORIAL_ACHIEVEMENT_ID) return false;
    return originalMarkAchievementEarnedForTutorial.call(this, id, ...rest);
  };

  const originalMarkPvpAchievementEarnedForTutorial = markPvpAchievementEarned;
  markPvpAchievementEarned = function(...args) {
    if (tutorial.active || tutorial.completeScreen || game.tutorialActive) return false;
    return originalMarkPvpAchievementEarnedForTutorial.apply(this, args);
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
      game.targetVocabIndex = null;
    }

    if (activeSetup === "wrongFly") {
      const caughtFlyId = Number(targetFly?.id);
      if (!wasCorrect && caughtFlyId === Number(tutorial.wrongFlyOriginalFlyId)) {
        tutorial.wrongFlyCaught = true;
        tutorial.wrongFlyCaughtAt = performance.now();
        tutorial.promptHidden = true;
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

  // Capture real-engine jump outcomes for scenario checks.
  tutorial.originalLaunchJump = launchJump;
  launchJump = function(...args) {
    const active = tutorial.active && tutorial.kind === "solo";
    const power = Number(frog.charge || 0);
    const standing = active ? getStandingPlatform() : null;
    const quick = Boolean(active && standing && !standing.ground && frog.chargeHoldTime < CONFIG.platformDropHoldThreshold);
    const jumpsBefore = Number(game.jumps || 0);
    const totalJumpsBefore = Number(game.totalJumps || 0);
    const result = tutorial.originalLaunchJump.apply(this, args);
    if (active && !frog.grounded) {
      const setup = tutorialStep()?.setup;
      tutorial.quickDrop = tutorial.quickDrop || quick;

      // Platform drops are movement techniques, not jump attempts. They do not
      // consume the two-jump wall lesson or inflate the tutorial's jump HUD.
      if (quick) {
        game.jumps = jumpsBefore;
        game.totalJumps = totalJumpsBefore;
        try { saveTotalJumpCount(game.totalJumps); } catch (_) {}
        if (setup === "quickDrop") {
          tutorial.attemptStarted = true;
          tutorial.attemptWasAirborne = true;
          tutorial.attemptEnded = false;
        } else if (setup === "doubleBuffer") {
          failAttempt("START WITH A CHARGED JUMP");
        }
        return result;
      }

      tutorial.lastJumpPower = power;
      tutorial.wallTouchedThisJump = false;
      tutorial.attemptStarted = true;
      tutorial.jumpAttempts += 1;
      tutorial.attemptWasAirborne = true;
      tutorial.attemptEnded = false;
      if (setup === "quickDrop") {
        tutorial.quickDropWrongJump = true;
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
      "RETRY SCENE",
      (full) => drawMiniRestartIcon(restartButton.x + 8, restartButton.y + 3, full ? COLORS.white : "#7a5a2a"),
      restartButton.x + restartButton.w / 2 + 10
    );
    drawSelectablePauseButton(
      homeButton,
      game.pauseFocusVisible && game.pauseSelection === "home",
      game.pauseHoveredSelection === "home",
      game.pausePressedSelection === "home",
      { dark: skin.dark, mid: "#d76b31", light: "#ffb45f" },
      "SKIP TUTORIAL",
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
        reason: "pause-retry",
        showFailure: false,
        preserveExistingFlies: true,
        action: rebuildCurrentScenarioForRetry
      });
      return;
    }
    return originalActivatePauseSelectionForTutorial.apply(this, args);
  };

  function tutorialBlocksLiveInput() {
    return Boolean(
      tutorial.active && game.state === "playing" &&
      (tutorialMovementLocked() || tutorial.passPending || tutorial.blockJumpUntilRelease)
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

  const originalPressPvpButtonForTutorial = pressPvpButton;
  pressPvpButton = function(index, ...rest) {
    if (tutorialBlocksLiveInput()) {
      const player = pvpPlayers[index];
      if (player) { player.inputHeld = false; player.charging = false; player.chargeHoldTime = 0; }
      return;
    }
    return originalPressPvpButtonForTutorial.call(this, index, ...rest);
  };

  const originalReleasePvpButtonForTutorial = releasePvpButton;
  releasePvpButton = function(index, ...rest) {
    if (tutorialBlocksLiveInput()) {
      const player = pvpPlayers[index];
      if (player) { player.inputHeld = false; player.charging = false; player.chargeHoldTime = 0; }
      return;
    }
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

  const originalDrawScene = drawScene;
  drawScene = function(...args) {
    const result = originalDrawScene.apply(this, args);
    if (tutorial.active) drawTutorialOverlay();
    if (tutorial.completeScreen) drawCompletionScreen();
    return result;
  };

  const originalUpdate = update;
  update = function(dt, ...rest) {
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
      updateTutorialAmbient(dt, { animateFlies: !tutorial.resetPending });
      freezeControlledEntity();
      updateTutorial();
      return undefined;
    }

    const result = originalUpdate.call(this, dt, ...rest);
    updateTutorial();
    return result;
  };

  window.addEventListener("keydown", (event) => {
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
    if (tutorial.active && tutorial.dialogueOpen && game.state !== "paused" && game.state !== "countdown") {
      event.preventDefault();
      event.stopImmediatePropagation();
      tutorial.dialoguePointerId = event.pointerId;
    }
  }, { capture:true, passive:false });

  canvas.addEventListener("pointermove", (event) => {
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

// Ribbit Race Friends — online/replay/UI/language polish 8.
(() => {
  "use strict";
  if (window.__RIBBIT_POLISH_8__) return;
  window.__RIBBIT_POLISH_8__ = true;

  const polish = {
    leaderboardEntries: [],
    leaderboardLoading: false,
    leaderboardError: "",
    leaderboardMetric: "time",
    leaderboardPage: 0,
    leaderboardReplayRects: [],
    previousState: "achievements",
    mainHoverKey: "",
    onlineHoverKey: "",
    worldRecordHovered: false,
    labelFadeStartedAt: 0,
    priorCriticalCatch: false,
    previousRoundState: "",
    lastArchivedRoundKey: "",
    baseSkinIndex: 0,
    customBaseOpen: false,
    quickplayLeaving: false
  };

  const LANGUAGE_KEY = "ribbitRaceLanguageModeV1";
  const HAT_PROGRESS_KEY = "ribbitRaceHatProgressV2";
  const ONLINE_HISTORY_KEY = "ribbitRaceOnlineHistoryV2";
  const LEADERBOARD_BUTTON = Object.freeze({ x: 17, y: 232, w: 24, h: 24 });
  const CUSTOM_BASE_BUTTON = Object.freeze({ x: 156, y: 58, w: 25, h: 22 });
  const PAUSE_FULLSCREEN_BUTTON = Object.freeze({ x: 372, y: 171, w: 20, h: 20 });
  const MAIN_PROFILE_BUTTON = Object.freeze({ x: 16, y: 211, w: 24, h: 24 });
  const MAIN_DEVICE_BUTTON = Object.freeze({ x: 43, y: 211, w: 24, h: 24 });

  function safeCall(candidate, ...args) {
    try { return typeof candidate === "function" ? candidate(...args) : undefined; }
    catch (error) { console.warn("Ribbit polish helper recovered", error); return undefined; }
  }

  function getLanguageMode() {
    try {
      return window.RibbitLanguagePreferences?.getMode?.() ||
        localStorage.getItem(LANGUAGE_KEY) || "en-es";
    } catch (_) { return "en-es"; }
  }

  function setLanguageMode(mode) {
    const normalized = mode === "es-en" ? "es-en" : "en-es";
    try { localStorage.setItem(LANGUAGE_KEY, normalized); } catch (_) {}
    try { window.RibbitLanguagePreferences?.setMode?.(normalized); } catch (_) {}
    try {
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      cloud?.queueSave?.({ ribbitRaceLanguageModeV1: normalized });
      cloud?.savePatch?.({ languageMode: normalized, ribbitRaceLanguageModeV1: normalized });
    } catch (_) {}
    return normalized;
  }

  const SPANISH_UI = Object.freeze({
    "RIBBIT RACE": "RIBBIT RACE",
    "CHOOSE A MODE": "ELIGE UN MODO",
    "SINGLE PLAYER": "UN JUGADOR",
    "VERSUS": "VERSUS",
    "FROG COLOR": "COLOR DE RANA",
    "ACHIEVEMENTS": "LOGROS",
    "STATS": "ESTADÍSTICAS",
    "BACK": "VOLVER",
    "HOME": "INICIO",
    "HOME MENU": "MENÚ PRINCIPAL",
    "CONTINUE": "CONTINUAR",
    "RESTART": "REINICIAR",
    "PAUSED": "PAUSA",
    "START": "EMPEZAR",
    "QUICKPLAY": "PARTIDA RÁPIDA",
    "HOST": "CREAR SALA",
    "JOIN": "UNIRSE",
    "SPECTATE": "OBSERVAR",
    "CUSTOMIZER": "PERSONALIZAR",
    "FROG TAGS": "PLACAS DE RANA",
    "FIND MATCH": "BUSCAR PARTIDA",
    "CANCEL": "CANCELAR",
    "READY": "LISTO",
    "LEAVE": "SALIR",
    "LEADERBOARD": "CLASIFICACIÓN",
    "PLAYER 1": "JUGADOR 1",
    "PLAYER 2": "JUGADOR 2",
    "CHOOSE YOUR FROG": "ELIGE TU RANA",
    "RANDOM": "ALEATORIO",
    "SETTINGS": "AJUSTES",
    "ACCOUNT & LANGUAGE": "CUENTA E IDIOMA",
    "COMPUTER / MOBILE MODE": "MODO COMPUTADORA / MÓVIL",
    "STATS & RECORDS": "ESTADÍSTICAS Y RÉCORDS",
    "WORLD RECORD": "RÉCORD MUNDIAL",
    "TUTORIAL COMPLETE!": "¡TUTORIAL COMPLETADO!"
  });

  const originalDrawBitmapTextPolish8 = drawBitmapText;
  drawBitmapText = function(text, ...args) {
    let rendered = text;
    if (getLanguageMode() === "es-en" && typeof text === "string") {
      rendered = SPANISH_UI[text] || text;
      for (const [english, spanish] of Object.entries(SPANISH_UI)) {
        if (rendered !== text) break;
        if (text.startsWith(`${english} •`)) rendered = `${spanish}${text.slice(english.length)}`;
      }
    }
    return originalDrawBitmapTextPolish8.call(this, rendered, ...args);
  };

  function withLocalizedVocabulary(index, operation, kind) {
    const entry = VOCABULARY?.[index];
    if (!entry || getLanguageMode() !== "es-en") return operation();
    const english = entry.english;
    const spanish = entry.spanish;
    try {
      if (kind === "fly") {
        try { entry.spanish = english; } catch (_) {}
      } else {
        try { entry.english = spanish; } catch (_) {}
      }
      return operation();
    } finally {
      try { entry.english = english; entry.spanish = spanish; } catch (_) {}
    }
  }

  const originalDrawFlyNameTagPolish8 = drawFlyNameTag;
  drawFlyNameTag = function(currentFly, ...rest) {
    const fadeAge = performance.now() - polish.labelFadeStartedAt;
    const fade = polish.labelFadeStartedAt > 0 ? clamp(fadeAge / 340, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha *= fade;
    const result = withLocalizedVocabulary(
      Number(currentFly?.vocabIndex),
      () => originalDrawFlyNameTagPolish8.call(this, currentFly, ...rest),
      "fly"
    );
    ctx.restore();
    return result;
  };

  const originalDrawVocabularyPromptPolish8 = drawVocabularyPrompt;
  drawVocabularyPrompt = function(...args) {
    return withLocalizedVocabulary(
      Number(game.targetVocabIndex),
      () => originalDrawVocabularyPromptPolish8.apply(this, args),
      "clue"
    );
  };

  function drawSpeechBubble(rect, message, options = {}) {
    if (!rect || !message) return;
    const maxWidth = options.maxWidth || 190;
    const scale = options.scale || 0.56;
    const textWidth = Math.min(maxWidth - 14, Math.max(54, measureBitmapText(message, scale)));
    const width = Math.ceil(textWidth + 14);
    const height = options.height || 21;
    const centerX = rect.x + rect.w / 2;
    const x = clamp(Math.round(centerX - width / 2), 4, W - width - 4);
    const y = clamp(Math.round(rect.y - height - 8), 4, H - height - 10);
    const pointerX = clamp(Math.round(centerX), x + 8, x + width - 8);
    ctx.save();
    ctx.fillStyle = "rgba(24,41,49,.28)";
    ctx.fillRect(x + 2, y + 2, width, height);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    ctx.fillStyle = getSelectedSkin().light;
    ctx.fillRect(x + 5, y + 4, width - 10, 2);
    drawBitmapText(message, x + width / 2, y + 8, scale, "center", "#24353c");
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(pointerX - 4, y + height, 9, 2);
    ctx.fillRect(pointerX - 3, y + height + 2, 7, 2);
    ctx.fillRect(pointerX - 2, y + height + 4, 5, 2);
    ctx.fillRect(pointerX - 1, y + height + 6, 3, 1);
    ctx.restore();
  }

  function pointIn(point, rect) {
    return Boolean(point && rect && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h);
  }

  function drawMiniMedalButton(rect, active = false) {
    const skin = getSelectedSkin();
    ctx.fillStyle = "rgba(25,43,52,.28)";
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = active ? skin.dark : COLORS.ink;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = active ? mixHexColors(skin.belly, "#ffffff", .12) : "#f7fdff";
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    drawPixelTrophy(rect.x + rect.w / 2, rect.y + 4, false, .75);
    if (active) {
      ctx.fillStyle = skin.light;
      [[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy]) => ctx.fillRect(rect.x + dx, rect.y + dy, 2, 2));
    }
  }

  function normalizeLeaderboardRows(payload) {
    const arrays = [];
    if (Array.isArray(payload)) arrays.push(payload);
    if (payload && typeof payload === "object") {
      for (const key of ["entries", "leaderboard", "rows", "records", "results", "data"]) {
        if (Array.isArray(payload[key])) arrays.push(payload[key]);
      }
    }
    const source = arrays.find((rows) => rows.length) || [];
    return source.map((row, index) => ({
      rank: Number(row.rank || index + 1),
      name: String(row.name || row.displayName || row.username || row.player || "FROG"),
      value: row.value ?? row.time ?? row.jumps ?? row.score ?? row.wins ?? "—",
      metric: String(row.metric || row.category || polish.leaderboardMetric),
      date: String(row.date || row.createdAt || row.at || ""),
      replayId: row.replayId || row.replay_id || row.replay?.id || null,
      skinId: row.skinId || row.skin || "azure"
    }));
  }

  async function loadLeaderboard() {
    polish.leaderboardLoading = true;
    polish.leaderboardError = "";
    try {
      let payload;
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      for (const candidate of [
        () => cloud?.getLeaderboard?.(polish.leaderboardMetric),
        () => cloud?.loadLeaderboard?.(polish.leaderboardMetric),
        () => window.FriendsApiClient?.leaderboard?.(polish.leaderboardMetric)
      ]) {
        try {
          const value = await candidate();
          if (value) { payload = value; break; }
        } catch (_) {}
      }
      if (!payload) {
        const urls = [
          `/api/leaderboard?metric=${encodeURIComponent(polish.leaderboardMetric)}&limit=50`,
          `/api/leaderboards/${encodeURIComponent(polish.leaderboardMetric)}?limit=50`,
          `/api/records?metric=${encodeURIComponent(polish.leaderboardMetric)}&limit=50`
        ];
        for (const url of urls) {
          try {
            const response = await fetch(url, { credentials: "include" });
            if (!response.ok) continue;
            payload = await response.json();
            break;
          } catch (_) {}
        }
      }
      polish.leaderboardEntries = normalizeLeaderboardRows(payload);
      if (!polish.leaderboardEntries.length) polish.leaderboardError = "NO RECORDS YET";
    } catch (error) {
      polish.leaderboardError = "LEADERBOARD UNAVAILABLE";
      console.warn("Leaderboard load failed", error);
    } finally {
      polish.leaderboardLoading = false;
    }
  }

  function openLeaderboard() {
    polish.previousState = game.state === "rrLeaderboard" ? "achievements" : game.state;
    game.state = "rrLeaderboard";
    polish.leaderboardPage = 0;
    loadLeaderboard();
    safeCall(tone, 540, .05, .012, 35);
  }

  function closeLeaderboard() {
    game.state = polish.previousState === "rrLeaderboard" ? "achievements" : (polish.previousState || "achievements");
    safeCall(tone, 330, .045, .010, -30);
  }

  function formatLeaderboardValue(row) {
    const value = row?.value;
    if (Number.isFinite(Number(value))) {
      const numeric = Number(value);
      if (/time/i.test(row.metric)) return `${numeric.toFixed(2)} SEC`;
      return String(numeric);
    }
    return String(value ?? "—").toUpperCase();
  }

  function drawReplayIcon(cx, cy, active = false) {
    ctx.fillStyle = active ? getSelectedSkin().dark : "#48555a";
    ctx.fillRect(cx - 7, cy - 6, 14, 12);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(cx - 5, cy - 4, 10, 8);
    ctx.fillStyle = active ? getSelectedSkin().mid : "#708086";
    ctx.fillRect(cx - 2, cy - 2, 3, 5);
    ctx.fillRect(cx + 1, cy - 1, 2, 3);
  }

  function drawLeaderboardScreen() {
    const skin = getSelectedSkin();
    ctx.fillStyle = "#edf5f7";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(8, 7, W - 16, H - 14);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(12, 11, W - 24, H - 22);
    ctx.fillStyle = skin.dark;
    ctx.fillRect(20, 18, W - 40, 34);
    ctx.fillStyle = skin.mid;
    ctx.fillRect(22, 20, W - 44, 29);
    ctx.fillStyle = skin.light;
    ctx.fillRect(25, 22, W - 50, 3);
    drawBitmapText("LEADERBOARD", W / 2, 29, 1.65, "center", COLORS.white, skin.dark);

    const tabs = [
      { id:"time", label:"FASTEST TIME", x:38 },
      { id:"jumps", label:"FEWEST JUMPS", x:178 },
      { id:"wins", label:"ONLINE WINS", x:318 }
    ];
    tabs.forEach((tab) => {
      const active = polish.leaderboardMetric === tab.id;
      ctx.fillStyle = active ? COLORS.ink : "#9ca9ad";
      ctx.fillRect(tab.x, 59, 124, 19);
      ctx.fillStyle = active ? skin.mid : "#f7fdff";
      ctx.fillRect(tab.x + 2, 61, 120, 15);
      drawBitmapText(tab.label, tab.x + 62, 65, .50, "center", active ? COLORS.white : "#48555a", active ? skin.dark : null);
    });

    polish.leaderboardReplayRects = [];
    const perPage = 7;
    const start = polish.leaderboardPage * perPage;
    const rows = polish.leaderboardEntries.slice(start, start + perPage);
    if (polish.leaderboardLoading) {
      drawBitmapText("LOADING RECORDS...", W / 2, 135, .85, "center", "#48555a");
    } else if (!rows.length) {
      drawBitmapText(polish.leaderboardError || "NO RECORDS YET", W / 2, 135, .85, "center", "#48555a");
    } else {
      rows.forEach((row, offset) => {
        const y = 86 + offset * 21;
        const replayRect = { x:427, y:y - 3, w:22, h:18, row };
        ctx.fillStyle = "rgba(25,43,52,.18)";
        ctx.fillRect(31, y + 2, 420, 18);
        ctx.fillStyle = COLORS.ink;
        ctx.fillRect(29, y, 420, 18);
        ctx.fillStyle = offset % 2 ? "#eef5f7" : "#ffffff";
        ctx.fillRect(31, y + 2, 416, 14);
        drawBitmapText(`#${row.rank}`, 47, y + 5, .56, "center", row.rank === 1 ? "#a46318" : "#48555a");
        drawBitmapText(row.name.toUpperCase(), 77, y + 5, .55, "left", "#26363d");
        drawBitmapText(formatLeaderboardValue(row), 360, y + 5, .55, "right", skin.dark);
        if (row.replayId) {
          drawReplayIcon(replayRect.x + replayRect.w / 2, replayRect.y + replayRect.h / 2, false);
          polish.leaderboardReplayRects.push(replayRect);
        }
      });
    }

    const backRect = { x:180, y:238, w:120, h:22 };
    ctx.fillStyle = COLORS.ink; ctx.fillRect(backRect.x, backRect.y, backRect.w, backRect.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(backRect.x + 2, backRect.y + 2, backRect.w - 4, backRect.h - 4);
    drawMiniHouseIcon(backRect.x + 8, backRect.y + 4);
    drawBitmapText("BACK", backRect.x + 68, backRect.y + 7, .82, "center", "#48555a");
  }

  async function playReplayById(replayId, title = "REPLAY") {
    if (!replayId) return false;
    try {
      document.querySelectorAll("video").forEach((video) => { if (/replay/i.test(video.closest("[class],[id]")?.textContent || "")) video.pause?.(); });
    } catch (_) {}
    for (const candidate of [
      () => typeof playStoredReplay === "function" ? playStoredReplay(replayId, title) : undefined,
      () => window.RibbitRacePlayStoredReplay?.(replayId, title),
      () => window.RibbitReplayArchive?.play?.(replayId, title),
      () => window.RibbitReplayPlayer?.play?.(replayId, title),
      () => window.RibbitRaceReplay?.play?.(replayId, title)
    ]) {
      try {
        const value = await candidate();
        if (value !== undefined && value !== false) return true;
      } catch (_) {}
    }
    window.dispatchEvent(new CustomEvent("ribbit-play-replay", { detail:{ replayId, title } }));
    return true;
  }
  window.RibbitRacePlayReplay = playReplayById;

  function repairReplayModal(root = document) {
      const rrReplaySource = arguments[0];
      const rrReplayId = rrReplaySource?.replayId || rrReplaySource?.replay_id || rrReplaySource?.id || rrReplaySource;
      if (rrReplayId && typeof playStoredReplay === "function") {
        playStoredReplay(rrReplayId, "WORLD RECORD REPLAY");
        return;
      }

    const candidates = [...root.querySelectorAll?.("video") || []];
    for (const video of candidates) {
      const modal = video.closest("[role='dialog'], .modal, [class*='replay'], [id*='replay']") || video.parentElement;
      if (!modal || modal.dataset.rrReplayRepaired === "1") continue;
      const text = String(modal.textContent || "");
      if (!/REPLAY|WORLD RECORD/i.test(text)) continue;
      modal.dataset.rrReplayRepaired = "1";
      const src = video.currentSrc || video.src || "";
      const replayId = modal.dataset.replayId || video.dataset.replayId || src.split(/[/?#]/).filter(Boolean).pop();
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "PLAY REPLAY IN GAME";
      button.className = "rr-replay-play-button";
      button.addEventListener("click", (event) => {
        event.preventDefault(); event.stopPropagation();
        modal.hidden = true; modal.style.display = "none";
        playReplayById(replayId, /WORLD RECORD/i.test(text) ? "WORLD RECORD REPLAY" : "ONLINE REPLAY");
      });
      video.replaceWith(button);
    }
  }

  const modalObserver = new MutationObserver((records) => {
    repairReplayModal(document);
    for (const record of records) for (const node of record.addedNodes) {
      if (node instanceof HTMLElement) repairReplayModal(node);
    }
  });
  try { modalObserver.observe(document.documentElement, { childList:true, subtree:true }); repairReplayModal(document); } catch (_) {}

  function readHatProgress() {
    try { return JSON.parse(localStorage.getItem(HAT_PROGRESS_KEY) || "{}") || {}; }
    catch (_) { return {}; }
  }

  function saveHatProgress(progress) {
    try { localStorage.setItem(HAT_PROGRESS_KEY, JSON.stringify(progress)); } catch (_) {}
    try {
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      cloud?.queueSave?.({ ribbitRaceHatProgressV2: progress });
    } catch (_) {}
  }

  function recordHatCatch() {
    const skinId = String(game.skinId || "azure").toLowerCase();
    const progress = readHatProgress();
    progress.total = Math.max(0, Number(progress.total) || 0) + 1;
    progress.bySkin = progress.bySkin && typeof progress.bySkin === "object" ? progress.bySkin : {};
    progress.bySkin[skinId] = Math.max(0, Number(progress.bySkin[skinId]) || 0) + 1;
    saveHatProgress(progress);
    try { window.dispatchEvent(new CustomEvent("rr-hat-progress", { detail:{ skinId, count:progress.bySkin[skinId], total:progress.total } })); } catch (_) {}
    try {
      if (!statsProfile.fliesBySkin || typeof statsProfile.fliesBySkin !== "object") statsProfile.fliesBySkin = {};
      statsProfile.fliesBySkin[skinId] = Math.max(Number(statsProfile.fliesBySkin[skinId]) || 0, progress.bySkin[skinId]);
      statsProfile.totalFliesEaten = Math.max(Number(statsProfile.totalFliesEaten) || 0, progress.total);
      statsProfile[`${skinId}FliesCaught`] = Math.max(Number(statsProfile[`${skinId}FliesCaught`]) || 0, progress.bySkin[skinId]);
      saveStatsProfile();
    } catch (_) {}
    for (const fn of [
      typeof evaluateHatUnlocks === "function" ? evaluateHatUnlocks : null,
      typeof refreshHatUnlocks === "function" ? refreshHatUnlocks : null,
      typeof checkHatUnlocks === "function" ? checkHatUnlocks : null,
      typeof updateHatUnlocks === "function" ? updateHatUnlocks : null
    ]) safeCall(fn);
  }

  const originalAttemptFlyCatchPolish8 = attemptFlyCatch;
  attemptFlyCatch = function(targetFly, source = "body", ...rest) {
    const correctBefore = Boolean(targetFly && targetFly.vocabIndex === game.targetVocabIndex);
    const result = originalAttemptFlyCatchPolish8.call(this, targetFly, source, ...rest);
    const training = Boolean(game.tutorialActive || window.RibbitRaceTutorialEngine?.active);
    if (result && correctBefore && !training && !targetFly?.sandboxTest) recordHatCatch();
    return result;
  };

  function clearPinnedHatRequirement() {
    for (const key of Object.keys(game)) {
      if (/hat/i.test(key) && /(pinned|requirement|tooltip|notice)/i.test(key)) {
        if (typeof game[key] === "boolean") game[key] = false;
        else if (typeof game[key] === "number") game[key] = 0;
        else game[key] = null;
      }
    }
  }

  function getBaseSkinIds() {
    return ["azure","crimson","plum","forest","violet","silver","blossom","ember"].filter((id) => FROG_SKINS?.[id]);
  }

  function applyCustomBaseSkin(skinId) {
    const skin = FROG_SKINS?.[skinId];
    if (!skin) return false;
    for (const fn of [
      typeof setCustomColorFromSkin === "function" ? setCustomColorFromSkin : null,
      typeof applyCustomBasePalette === "function" ? applyCustomBasePalette : null,
      typeof setCustomPalette === "function" ? setCustomPalette : null
    ]) {
      try { if (fn) { fn(skinId, skin); return true; } } catch (_) {}
    }
    try {
      const slot = Number(game.customSlotIndex || 0);
      if (!Array.isArray(game.customFrogSlots)) game.customFrogSlots = [];
      game.customFrogSlots[slot] = {
        ...(game.customFrogSlots[slot] || {}),
        dark:skin.dark, mid:skin.mid, light:skin.light, belly:skin.belly,
        accents:skin.accents || skin.light, baseSkinId:skinId
      };
      safeCall(saveCustomFrogSlots);
      return true;
    } catch (_) { return false; }
  }

  function getCustomBaseOptionRects() {
    const ids = getBaseSkinIds();
    return ids.map((id, index) => ({ id, x:52 + (index % 4) * 92, y:83 + Math.floor(index / 4) * 29, w:84, h:23 }));
  }

  function drawCustomBaseButton() {
    if (game.state !== "custom") return;
    const rect = CUSTOM_BASE_BUTTON;
    ctx.fillStyle = "rgba(25,43,52,.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = polish.customBaseOpen ? getSelectedSkin().dark : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = polish.customBaseOpen ? getSelectedSkin().belly : "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    if (typeof drawMiniPaletteIcon === "function") drawMiniPaletteIcon(rect.x + 5, rect.y + 4, 0.75);
    drawBitmapText("BASE", rect.x + rect.w / 2, rect.y + 14, .38, "center", "#48555a");
    if (!polish.customBaseOpen) return;

    const panel = { x:42, y:72, w:396, h:78 };
    ctx.fillStyle = "rgba(25,43,52,.30)"; ctx.fillRect(panel.x + 4, panel.y + 4, panel.w, panel.h);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(panel.x + 3, panel.y + 3, panel.w - 6, panel.h - 6);
    drawBitmapText("SET BASE FROG", W / 2, panel.y + 8, .62, "center", "#48555a");
    for (const option of getCustomBaseOptionRects()) {
      const skin = FROG_SKINS[option.id];
      ctx.fillStyle = skin.dark; ctx.fillRect(option.x, option.y, option.w, option.h);
      ctx.fillStyle = skin.belly; ctx.fillRect(option.x + 2, option.y + 2, option.w - 4, option.h - 4);
      ctx.fillStyle = skin.light; ctx.fillRect(option.x + 5, option.y + 4, option.w - 10, 2);
      drawBitmapText(option.id.toUpperCase(), option.x + option.w / 2, option.y + 8, .54, "center", skin.dark);
    }
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else (document.getElementById("game-frame") || canvas || document.documentElement).requestFullscreen?.();
    } catch (_) {}
  }

  function drawPauseFullscreenButton() {
    if (game.state !== "paused") return;
    const rect = PAUSE_FULLSCREEN_BUTTON;
    ctx.fillStyle = "rgba(25,43,52,.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.fillStyle = "#48555a";
    ctx.fillRect(rect.x + 5, rect.y + 5, 4, 2); ctx.fillRect(rect.x + 5, rect.y + 5, 2, 4);
    ctx.fillRect(rect.x + rect.w - 9, rect.y + 5, 4, 2); ctx.fillRect(rect.x + rect.w - 7, rect.y + 5, 2, 4);
    ctx.fillRect(rect.x + 5, rect.y + rect.h - 7, 4, 2); ctx.fillRect(rect.x + 5, rect.y + rect.h - 9, 2, 4);
    ctx.fillRect(rect.x + rect.w - 9, rect.y + rect.h - 7, 4, 2); ctx.fillRect(rect.x + rect.w - 7, rect.y + rect.h - 9, 2, 4);
  }

  function isOnlineMenuVisible() {
    try { return Boolean(OnlineVersus?.isMenuVisible?.() && !OnlineVersus?.isActive?.()); }
    catch (_) { return false; }
  }

  function selectedOnlinePalette() {
    try { return getPvpSetupPreviewPalette?.(0) || getSelectedSkin(); }
    catch (_) { return getSelectedSkin(); }
  }

  function drawOnlineUnifiedHeader() {
    if (!isOnlineMenuVisible()) return;
    const palette = selectedOnlinePalette();
    const title = (() => {
      try {
        if (OnlineVersus?.isQuickplayMenu?.()) return "QUICKPLAY";
        if (OnlineVersus?.isRoomMenu?.()) return "ONLINE ROOM";
      } catch (_) {}
      return "ONLINE";
    })();
    const panel = { x:40, y:8, w:400, h:42 };
    ctx.fillStyle = COLORS.ink; ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = palette.dark; ctx.fillRect(panel.x + 3, panel.y + 3, panel.w - 6, panel.h - 6);
    ctx.fillStyle = palette.mid; ctx.fillRect(panel.x + 5, panel.y + 5, panel.w - 10, panel.h - 10);
    ctx.fillStyle = palette.light; ctx.fillRect(panel.x + 8, panel.y + 7, panel.w - 16, 3);
    drawBitmapText(title, W / 2, panel.y + 14, 1.55, "center", COLORS.white, palette.dark);
  }

  function drawMainMenuTooltips() {
    if (game.state !== "main" || !polish.mainHoverKey) return;
    const lookup = {
      profile:[MAIN_PROFILE_BUTTON, "ACCOUNT & LANGUAGE"],
      device:[MAIN_DEVICE_BUTTON, "COMPUTER / MOBILE MODE"],
      achievements:[MAIN_UI.achievementsButton, "ACHIEVEMENTS"],
      stats:[MAIN_UI.statsButton, "STATS & RECORDS"]
    };
    const entry = lookup[polish.mainHoverKey];
    if (entry) drawSpeechBubble(entry[0], entry[1], { maxWidth:170, scale:.50 });
  }

  function drawAchievementLeaderboardButton() {
    if (game.state !== "achievements") return;
    drawMiniMedalButton(LEADERBOARD_BUTTON, polish.mainHoverKey === "leaderboard");
    if (polish.mainHoverKey === "leaderboard") drawSpeechBubble(LEADERBOARD_BUTTON, "LEADERBOARD & REPLAYS", { maxWidth:150, scale:.48 });
  }

  function drawWorldRecordNotice() {
    if (game.state !== "won" || !(game.newWorldRecord || game.worldRecordNotice || game.roundWorldRecord)) return;
    const rect = { x:150, y:205, w:180, h:24 };
    ctx.fillStyle = "rgba(25,43,52,.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = "#805316"; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#ffe7a0"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    drawPixelTrophy(rect.x + 15, rect.y + 3, false, .78);
    drawBitmapText("NEW WORLD RECORD!", rect.x + 103, rect.y + 8, .72, "center", "#805316");
    if (polish.worldRecordHovered) {
      const previous = game.previousWorldRecord || game.worldRecordPrevious || game.worldRecordPrior || game.recordPrevious || game.previousRecord || {};
      const name = previous.name || previous.holder || previous.displayName || game.previousWorldRecordHolder || "NO PREVIOUS HOLDER";
      const value = previous.value ?? previous.time ?? previous.jumps ?? previous.score ?? game.previousWorldRecordValue ?? "—";
      const rawDate = previous.date || previous.createdAt || game.previousWorldRecordDate; const date = rawDate ? new Date(rawDate).toLocaleDateString() : "";
      drawSpeechBubble(rect, `PREVIOUS: ${name} • ${value}${date ? ` • ${date}` : ""}`, { maxWidth:260, scale:.43, height:23 });
    }
  }

  function drawPvpPauseButtonPolish8() {
    if (game.mode !== "pvp" || !["playing","paused","countdown","pvpCelebration"].includes(game.state)) return;
    if (isOnlineMenuVisible()) return;
    const rect = { x:W - 34, y:31, w:26, h:19 };
    const paused = game.state === "paused";
    ctx.save(); ctx.globalAlpha = paused ? .84 : .58;
    ctx.fillStyle = "rgba(25,43,52,.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = paused ? getSelectedSkin().mid : getSelectedSkin().belly;
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.fillStyle = paused ? COLORS.white : getSelectedSkin().dark;
    if (paused) {
      ctx.fillRect(rect.x + 9, rect.y + 5, 3, 9);
      ctx.fillRect(rect.x + 12, rect.y + 7, 3, 5);
      ctx.fillRect(rect.x + 15, rect.y + 9, 2, 1);
    } else {
      ctx.fillRect(rect.x + 7, rect.y + 5, 4, 9);
      ctx.fillRect(rect.x + 15, rect.y + 5, 4, 9);
    }
    ctx.restore();
  }

  const originalDrawPvpVsHoverTooltipPolish8 = typeof drawPvpVsHoverTooltip === "function" ? drawPvpVsHoverTooltip : null;
  if (originalDrawPvpVsHoverTooltipPolish8) {
    drawPvpVsHoverTooltip = function() {
      if (OnlineVersus?.isRoomMenu?.() || game.pvpSetupHoveredKey !== "vs") return;
      const message = game.pvpHuman2 ? "CLICK TO PLAY AGAINST CPU" : "CLICK TO ENABLE LOCAL VERSUS";
      drawSpeechBubble(PVP_SETUP_UI.vsButton, message, { maxWidth:180, scale:.48 });
    };
  }

  function immediateResetToStart() {
    try { flies.length = 0; } catch (_) {}
    try { game.spawnQueue.length = 0; } catch (_) {}
    try { tongue.active = false; tongue.targetFlyId = null; } catch (_) {}
    try {
      if (game.mode === "pvp") {
        resetPvpGame();
        game.state = "playing";
      } else {
        resetGame(false);
        applySelectedLevel();
        game.state = "playing";
        Object.assign(frog, { x:Number(LEVELS?.[game.selectedLevelId]?.startX ?? 25) + Number(CONFIG.initialFrogOffsetX || 36), y:CONFIG.groundY - frog.h, vx:0, vy:0, grounded:true, charging:false, chargeHoldTime:0 });
      }
      game.countdownNumber = 0;
      game.countdownTimer = 0;
    } catch (_) {}
  }

  function clearQuickplayAndHome() {
    polish.quickplayLeaving = true;
    try { OnlineVersus?.leaveRoom?.(); } catch (_) {}
    try { OnlineVersus?.cancelQuickplay?.(); } catch (_) {}
    try { OnlineVersus?.reset?.(); } catch (_) {}
    try { flies.length = 0; game.spawnQueue.length = 0; } catch (_) {}
    try { openMainMenu(false); } catch (_) { game.state = "main"; }
    setTimeout(() => { polish.quickplayLeaving = false; }, 250);
  }

  function archiveOnlineRound() {
    const significantSolo = game.mode === "solo" && game.state === "won" && Boolean(game.newBestTime || game.newFewestJumps || game.newEndlessBest || game.newWorldRecord);
    const onlineFinished = Boolean(game.onlineMode && ["won","pvpCelebration"].includes(game.state));
    if (!significantSolo && !onlineFinished) return;
    const key = `${game.pvpMatchId || game.onlineRoomCode || "online"}:${game.pvpRoundIndex || 0}:${game.pvpElapsed || game.elapsed || 0}`;
    if (polish.lastArchivedRoundKey === key) return;
    polish.lastArchivedRoundKey = key;
    let payload;
    for (const fn of [
      typeof finishReplayRecording === "function" ? finishReplayRecording : null,
      typeof finalizeReplayRecording === "function" ? finalizeReplayRecording : null,
      window.RibbitReplayRecorder?.finish
    ]) {
      try { if (fn) { payload = fn(); if (payload) break; } } catch (_) {}
    }
    const opponent = (() => {
      if (!onlineFinished) return "SOLO PERSONAL BEST";
      try {
        const local = Number(OnlineVersus?.localIndex?.() || 0);
        return String(pvpPlayers?.[1 - local]?.displayName || pvpPlayers?.[1 - local]?.name || OnlineVersus?.opponentName?.() || "ONLINE FROG");
      } catch (_) { return "ONLINE FROG"; }
    })();
    const metadata = { opponent, at:Date.now(), won:Boolean(onlineFinished && game.pvpMatchWinnerIndex === (OnlineVersus?.localIndex?.() || 0)), online:onlineFinished, significant:true, personalBest:significantSolo };
    const upload = async () => {
      let replayId = payload?.id || payload?.replayId || null;
      for (const fn of [
        window.RibbitReplayArchive?.save,
        window.RibbitReplayArchive?.upload,
        window.RibbitCloud?.uploadReplay,
        typeof uploadReplay === "function" ? uploadReplay : null
      ]) {
        try {
          if (!fn || replayId) continue;
          const response = await fn(payload, { ...metadata, significant:true, personalBest:true });
          replayId = response?.replayId || response?.id || replayId;
        } catch (_) {}
      }
      if (onlineFinished) {
        try {
          const history = JSON.parse(localStorage.getItem(ONLINE_HISTORY_KEY) || "{}");
          if (!Array.isArray(history[opponent])) history[opponent] = [];
          history[opponent].unshift({ ...metadata, replayId });
          history[opponent] = history[opponent].slice(0, 50);
          localStorage.setItem(ONLINE_HISTORY_KEY, JSON.stringify(history));
        } catch (_) {}
        try { window.RibbitFrogTags?.addGame?.(opponent, { ...metadata, replayId }); } catch (_) {}
      }
    };
    upload();
  }

  const originalActivatePauseSelectionPolish8 = activatePauseSelection;
  activatePauseSelection = function(...args) {
    if (game.onlineMode && game.state === "paused" && game.pauseSelection === "home") {
      clearQuickplayAndHome();
      return;
    }
    return originalActivatePauseSelectionPolish8.apply(this, args);
  };

  const originalUpdatePolish8 = update;
  update = function(dt, ...rest) {
    const result = originalUpdatePolish8.call(this, dt, ...rest);
    if (polish.priorCriticalCatch && !game.soloCriticalCatchActive && !game.pvpCriticalCatchActive) {
      polish.labelFadeStartedAt = performance.now();
    }
    polish.priorCriticalCatch = Boolean(game.soloCriticalCatchActive || game.pvpCriticalCatchActive);
    archiveOnlineRound();
    polish.previousRoundState = game.state;
    return result;
  };

  const originalDrawScenePolish8 = drawScene;
  drawScene = function(...args) {
    if (game.state === "rrLeaderboard") {
      drawLeaderboardScreen();
      return;
    }
    const result = originalDrawScenePolish8.apply(this, args);
    drawAchievementLeaderboardButton();
    drawMainMenuTooltips();
    drawOnlineUnifiedHeader();
    drawCustomBaseButton();
    drawPauseFullscreenButton();
    drawWorldRecordNotice();
    drawPvpPauseButtonPolish8();
    return result;
  };

  function interactiveRectForPoint(point) {
    if (game.state === "main") {
      if (pointIn(point, MAIN_PROFILE_BUTTON) || pointIn(point, MAIN_DEVICE_BUTTON) ||
          pointIn(point, MAIN_UI.soloButton) || pointIn(point, MAIN_UI.pvpButton) ||
          pointIn(point, MAIN_UI.frogButton) || pointIn(point, MAIN_UI.achievementsButton) ||
          pointIn(point, MAIN_UI.statsButton)) return true;
    }
    if (game.state === "achievements" && pointIn(point, LEADERBOARD_BUTTON)) return true;
    if (game.state === "rrLeaderboard") return true;
    if (game.state === "custom" && pointIn(point, CUSTOM_BASE_BUTTON)) return true;
    if (game.state === "paused" && pointIn(point, PAUSE_FULLSCREEN_BUTTON)) return true;
    if (["playing","paused","countdown","pvpCelebration"].includes(game.state) && pointIn(point, HUD_UI.pauseButton)) return true;
    return false;
  }

  canvas.addEventListener("pointermove", (event) => {
    const point = getCanvasPoint(event);
    polish.mainHoverKey = "";
    if (game.state === "main") {
      if (pointIn(point, MAIN_PROFILE_BUTTON)) polish.mainHoverKey = "profile";
      else if (pointIn(point, MAIN_DEVICE_BUTTON)) polish.mainHoverKey = "device";
      else if (pointIn(point, MAIN_UI.achievementsButton)) polish.mainHoverKey = "achievements";
      else if (pointIn(point, MAIN_UI.statsButton)) polish.mainHoverKey = "stats";
    } else if (game.state === "achievements" && pointIn(point, LEADERBOARD_BUTTON)) {
      polish.mainHoverKey = "leaderboard";
    }
    polish.worldRecordHovered = game.state === "won" && pointIn(point, { x:150, y:205, w:180, h:24 });
    try { canvas.style.setProperty("cursor", interactiveRectForPoint(point) ? "pointer" : "default", "important"); } catch (_) {}
  }, { capture:true, passive:true });

  canvas.addEventListener("pointerleave", () => {
    polish.mainHoverKey = "";
    polish.worldRecordHovered = false;
    try { canvas.style.setProperty("cursor", "default", "important"); } catch (_) {}
  }, { capture:true, passive:true });

  canvas.addEventListener("pointerdown", (event) => {
    const point = getCanvasPoint(event);
    if (game.state === "achievements" && pointIn(point, LEADERBOARD_BUTTON)) {
      event.preventDefault(); event.stopImmediatePropagation(); openLeaderboard(); return;
    }
    if (game.state === "rrLeaderboard") {
      event.preventDefault(); event.stopImmediatePropagation();
      const tabs = [
        { id:"time", rect:{x:38,y:59,w:124,h:19} },
        { id:"jumps", rect:{x:178,y:59,w:124,h:19} },
        { id:"wins", rect:{x:318,y:59,w:124,h:19} }
      ];
      const tab = tabs.find((item) => pointIn(point, item.rect));
      if (tab) { polish.leaderboardMetric = tab.id; polish.leaderboardPage = 0; loadLeaderboard(); return; }
      const replay = polish.leaderboardReplayRects.find((item) => pointIn(point, item));
      if (replay) { playReplayById(replay.row.replayId, `${replay.row.name} • ${replay.row.metric}`); return; }
      if (pointIn(point, {x:180,y:238,w:120,h:22})) { closeLeaderboard(); return; }
      return;
    }
    const pvpPauseRect = { x:W - 34, y:31, w:26, h:19 };
    if (game.mode === "pvp" && ["playing","paused","countdown","pvpCelebration"].includes(game.state) && pointIn(point, pvpPauseRect)) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (game.state === "paused") resumePausedGame(); else pauseGame();
      return;
    }
    if (game.mode === "pvp" && pointIn(point, HUD_UI.pauseButton)) {
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    if (game.state === "paused" && pointIn(point, PAUSE_FULLSCREEN_BUTTON)) {
      event.preventDefault(); event.stopImmediatePropagation(); toggleFullscreen(); return;
    }
    if (game.state === "custom" && pointIn(point, CUSTOM_BASE_BUTTON)) {
      event.preventDefault(); event.stopImmediatePropagation();
      polish.customBaseOpen = !polish.customBaseOpen;
      return;
    }
    if (game.state === "custom" && polish.customBaseOpen) {
      const option = getCustomBaseOptionRects().find((item) => pointIn(point, item));
      if (option) {
        event.preventDefault(); event.stopImmediatePropagation();
        applyCustomBaseSkin(option.id);
        polish.customBaseOpen = false;
        game.state = "custom";
        return;
      }
    }
    if (game.state === "paused" && game.onlineMode && pointIn(point, PAUSE_UI.homeButton)) {
      event.preventDefault(); event.stopImmediatePropagation(); clearQuickplayAndHome(); return;
    }
    if ((game.state === "setup" || game.state === "custom") && game.customHatOpen) {
      setTimeout(clearPinnedHatRequirement, 0);
    }
  }, { capture:true, passive:false });

  window.addEventListener("keydown", (event) => {
    if (game.state === "rrLeaderboard") {
      if (event.code === "Escape" || event.code === "Backspace") {
        event.preventDefault(); event.stopImmediatePropagation(); closeLeaderboard();
      }
      return;
    }
    if (event.code === "KeyR" && ["playing","paused","countdown"].includes(game.state)) {
      event.preventDefault(); event.stopImmediatePropagation(); immediateResetToStart();
    }
  }, { capture:true, passive:false });

  window.addEventListener("paste", () => {
    const wasCustom = game.state === "custom";
    if (!wasCustom) return;
    setTimeout(() => { game.state = "custom"; safeCall(drawScene); }, 0);
  }, { capture:true });

  try {
    const style = document.createElement("style");
    style.textContent = `
      #fullscreen-button, #rr-fullscreen-button, .fullscreen-button, [data-action="fullscreen"] { display:none !important; }
      #game, canvas { cursor:default; }
      .rr-replay-play-button { width:min(520px,90%); min-height:82px; margin:42px auto; display:block; border:6px solid #26363d; background:#f7fdff; color:#26363d; font:700 22px/1.2 monospace; cursor:pointer; }
      [class*="account"] button, [class*="profile"] button, [role="dialog"] button { color:#ffffff; text-shadow:0 1px #26363d; }
      [class*="account"] input, [class*="account"] select, [class*="profile"] input, [class*="profile"] select { color:#26363d !important; background:#ffffff !important; }
      .rr-language-field { display:grid; gap:5px; margin:8px 0; color:#26363d; font:700 13px/1.2 monospace; }
      .rr-language-field select { width:100%; min-height:38px; border:3px solid #26363d; padding:4px 8px; }
    `;
    document.head.appendChild(style);
  } catch (_) {}

  window.RibbitRacePolish8 = Object.freeze({
    openLeaderboard,
    playReplay: playReplayById,
    getLanguageMode,
    setLanguageMode,
    recordHatCatch
  });
})();

// Canvas-native online menu layout and contextual online help.
(() => {
  "use strict";
  if (window.__RIBBIT_POLISH_8_ONLINE__) return;
  window.__RIBBIT_POLISH_8_ONLINE__ = true;

  const state = { hover:"", quickHover:"" };
  const ONLINE_RECTS = Object.freeze({
    quickplay:{x:42,y:92,w:190,h:40}, spectate:{x:248,y:92,w:190,h:40},
    host:{x:42,y:139,w:190,h:40}, join:{x:248,y:139,w:190,h:40},
    customizer:{x:42,y:186,w:190,h:40}, tags:{x:248,y:186,w:190,h:40},
    back:{x:180,y:235,w:120,h:23}
  });
  const QUICK_RECTS = Object.freeze({
    frog:{x:132,y:98,w:216,h:86}, find:{x:126,y:190,w:228,h:26}, back:{x:180,y:235,w:120,h:23}
  });

  function inside(point,rect){return point&&rect&&point.x>=rect.x&&point.x<=rect.x+rect.w&&point.y>=rect.y&&point.y<=rect.y+rect.h;}
  function callFirst(names,...args){
    for(const name of names){
      try{
        const fn=OnlineVersus?.[name]||window[name];
        if(typeof fn==='function'){const value=fn.apply(OnlineVersus,args);if(value!==false)return true;}
      }catch(_){ }
    }
    return false;
  }
  function menuKind(){
    try{
      if(!OnlineVersus?.isMenuVisible?.()||OnlineVersus?.isActive?.())return "";
      if(OnlineVersus?.isRoomMenu?.())return "room";
      if(OnlineVersus?.isQuickplayMenu?.()||OnlineVersus?.isQueueMenu?.())return "quickplay";
      const raw=OnlineVersus?.menuMode?.()||OnlineVersus?.mode?.()||OnlineVersus?.state?.()||OnlineVersus?.statusText?.()||"";
      const text=typeof raw==='string'?raw:JSON.stringify(raw);
      if(/quick|queue|matchmaking|find match|searching|play while waiting/i.test(text))return "quickplay";
      return "main";
    }catch(_){return "";}
  }
  function palette(){
    try{return getPvpSetupPreviewPalette?.(0)||getSelectedSkin();}catch(_){return getSelectedSkin();}
  }
  function panelButton(rect,label,selected=false,icon=""){
    const skin=palette();
    ctx.fillStyle="rgba(25,43,52,.25)";ctx.fillRect(rect.x+3,rect.y+3,rect.w,rect.h);
    ctx.fillStyle=selected?skin.dark:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.fillStyle=selected?mixHexColors(skin.belly,"#ffffff",.12):"#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
    ctx.fillStyle=selected?skin.light:"#ffffff";ctx.fillRect(rect.x+7,rect.y+5,rect.w-14,3);
    const ix=rect.x+20,iy=rect.y+rect.h/2;
    ctx.fillStyle=selected?skin.dark:"#48555a";
    if(icon==="quick"){ctx.fillRect(ix-6,iy-8,5,16);ctx.fillRect(ix+1,iy-5,5,10);ctx.fillRect(ix-1,iy-2,4,4);}
    else if(icon==="spectate"){ctx.fillRect(ix-9,iy-5,18,10);ctx.fillStyle="#f7fdff";ctx.fillRect(ix-5,iy-3,10,6);ctx.fillStyle=selected?skin.dark:"#48555a";ctx.fillRect(ix-1,iy-1,3,3);}
    else if(icon==="host"){ctx.fillRect(ix-8,iy-3,16,9);ctx.fillRect(ix-5,iy-8,10,5);ctx.fillStyle="#f7fdff";ctx.fillRect(ix-3,iy-1,6,4);}
    else if(icon==="join"){ctx.fillRect(ix-8,iy-2,12,4);ctx.fillRect(ix+2,iy-7,4,14);ctx.fillRect(ix-10,iy-5,3,10);}
    else if(icon==="custom"){ctx.fillRect(ix-7,iy-7,14,14);ctx.fillStyle="#ef7582";ctx.fillRect(ix-4,iy-4,4,4);ctx.fillStyle="#5ce5e8";ctx.fillRect(ix+1,iy-4,4,4);ctx.fillStyle="#eac65b";ctx.fillRect(ix-4,iy+1,4,4);}
    else if(icon==="tags"){ctx.fillRect(ix-8,iy-8,7,16);ctx.fillRect(ix+2,iy-8,7,16);ctx.fillStyle="#f7fdff";ctx.fillRect(ix-5,iy-5,2,2);ctx.fillRect(ix+5,iy-5,2,2);}
    else if(icon==="back"){drawMiniHouseIcon(rect.x+9,rect.y+5);}
    drawBitmapText(label,rect.x+rect.w/2+(icon&&icon!=="back"?10:icon==="back"?8:0),rect.y+14,.86,"center",selected?COLORS.white:"#48555a",selected?skin.dark:null);
  }
  function speech(rect,text){
    const skin=palette();const scale=.47;const width=Math.ceil(Math.min(210,Math.max(78,measureBitmapText(text,scale)+16)));const h=22;
    const cx=rect.x+rect.w/2;const x=clamp(Math.round(cx-width/2),5,W-width-5);const y=Math.max(4,rect.y-h-8);const px=clamp(Math.round(cx),x+10,x+width-10);
    ctx.fillStyle="rgba(25,43,52,.28)";ctx.fillRect(x+2,y+2,width,h);ctx.fillStyle=COLORS.ink;ctx.fillRect(x,y,width,h);ctx.fillStyle="#f7fdff";ctx.fillRect(x+2,y+2,width-4,h-4);ctx.fillStyle=skin.light;ctx.fillRect(x+5,y+4,width-10,2);drawBitmapText(text,x+width/2,y+8,scale,"center","#26363d");ctx.fillStyle=COLORS.ink;ctx.fillRect(px-4,y+h,9,2);ctx.fillRect(px-3,y+h+2,7,2);ctx.fillRect(px-2,y+h+4,5,2);
  }
  function drawHeader(title){
    const skin=palette();const r={x:28,y:8,w:424,h:48};ctx.fillStyle=COLORS.ink;ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle=skin.dark;ctx.fillRect(r.x+3,r.y+3,r.w-6,r.h-6);ctx.fillStyle=skin.mid;ctx.fillRect(r.x+5,r.y+5,r.w-10,r.h-10);ctx.fillStyle=skin.light;ctx.fillRect(r.x+9,r.y+7,r.w-18,4);drawBitmapText(title,W/2,r.y+17,1.65,"center",COLORS.white,skin.dark);
  }
  function drawOnlineMain(){
    const level=LEVELS[getPvpSetupPreviewLevelId?.()||"park"]||LEVELS.park;ctx.fillStyle="#dce8eb";ctx.fillRect(0,0,W,H);try{drawBackground(level.id);for(const platform of level.platforms)drawPlatform(platform,level.id);}catch(_){ }
    ctx.fillStyle="rgba(247,253,255,.94)";ctx.fillRect(7,5,W-14,H-10);ctx.fillStyle=COLORS.ink;ctx.fillRect(7,5,W-14,4);ctx.fillRect(7,H-9,W-14,4);ctx.fillRect(7,5,4,H-10);ctx.fillRect(W-11,5,4,H-10);
    drawHeader("ONLINE");drawBitmapText("CHOOSE ONLINE MODE",W/2,66,.88,"center","#48555a");
    panelButton(ONLINE_RECTS.quickplay,"QUICKPLAY",state.hover==="quickplay","quick");panelButton(ONLINE_RECTS.spectate,"SPECTATE",state.hover==="spectate","spectate");panelButton(ONLINE_RECTS.host,"HOST",state.hover==="host","host");panelButton(ONLINE_RECTS.join,"JOIN",state.hover==="join","join");panelButton(ONLINE_RECTS.customizer,"CUSTOMIZER",state.hover==="customizer","custom");panelButton(ONLINE_RECTS.tags,"FROG TAGS",state.hover==="tags","tags");panelButton(ONLINE_RECTS.back,"BACK",state.hover==="back","back");
    const tips={quickplay:"FIND A 60-SECOND ONLINE MATCH",spectate:"WATCH A LIVE MATCH",host:"CREATE A PRIVATE ROOM",join:"JOIN WITH A ROOM CODE",customizer:"EDIT YOUR ONLINE FROG",tags:"VIEW OPPONENTS AND REPLAYS",back:"RETURN TO LOCAL VERSUS"};if(state.hover)speech(ONLINE_RECTS[state.hover],tips[state.hover]);
  }
  function drawQuickFix(){
    drawHeader("QUICKPLAY");
    // Clear the menu-only Player 2 badge and pause icon without touching gameplay.
    ctx.fillStyle="#f7fdff";ctx.fillRect(W-42,54,38,26);ctx.fillRect(W-122,H-27,118,24);
    // Keep the explanation readable and put Back in the same place as the Online menu.
    ctx.fillStyle="#f7fdff";ctx.fillRect(84,216,312,50);
    drawBitmapText("FRIENDS ONLINE • NO AUTOMATIC RELAY FALLBACK",W/2,219,.42,"center","#07516a");
    panelButton(QUICK_RECTS.back,"BACK",state.quickHover==="back","back");
    const tips={frog:"CHOOSE THE FROG USED ONLINE",find:"ENTER THE QUICKPLAY QUEUE",back:"RETURN TO ONLINE MODES"};if(state.quickHover)speech(QUICK_RECTS[state.quickHover],tips[state.quickHover]);
  }
  function action(key){
    if(key==="quickplay"){
      callFirst(["cancelQuickplay","leaveQueue","leaveRoom","cancelQuickplayTicket"]);
      callFirst(["openQuickplay","quickplay","startQuickplay","openMatchmaking","isQuickplay","quickplayPoll","tickQuickplay","enterQuickplay","quickplayEnter","cancelQuickplay","quickplayCancel","quickplayCounts"]);
    }
    else if(key==="spectate")callFirst(["openSpectate","spectate","openSpectatorPicker","spectating","isSpectating","spectateRoom","drawSpectator","pollSpectator","stopSpectating","startSpectating","updateSpectator","spectatorVersion"]);
    else if(key==="host")callFirst(["openHost","host","createRoom","hostRoom","isHost","hostRtt","hostName","isHostActive","awaitingHostFrame","handleHostRoundCompletion"]);
    else if(key==="join")callFirst(["openJoin","join","joinRoom","joinedAt","showJoin","joinOnlineRoom"]);
    else if(key==="customizer"){if(!callFirst(["openCustomizer","customizer","appearance","appearanceFor","localAppearance","remoteAppearance","openOnlineCustomizer","saveOnlineCustomizer","closeOnlineCustomizer","refreshQueuedAppearance"]))try{openSetupMenu();}catch(_){ }}
    else if(key==="tags"){if(!callFirst(["openFrogTags","frogTags"]))try{window.RibbitFrogTags?.open?.();}catch(_){ }}
    else if(key==="back"){if(!callFirst(["close","back","returnToLocal"]))try{closePvpSetupMenu();}catch(_){game.state="main";}}
  }
  const priorDraw=drawScene;drawScene=function(...args){const kind=menuKind();if(kind==="main"){drawOnlineMain();return;}const result=priorDraw.apply(this,args);if(kind==="quickplay")drawQuickFix();return result;};
  canvas.addEventListener("pointermove",e=>{const kind=menuKind();if(!kind)return;const p=getCanvasPoint(e);state.hover="";state.quickHover="";if(kind==="main")for(const [key,rect] of Object.entries(ONLINE_RECTS))if(inside(p,rect)){state.hover=key;break;}if(kind==="quickplay")for(const [key,rect] of Object.entries(QUICK_RECTS))if(inside(p,rect)){state.quickHover=key;break;}canvas.style.setProperty("cursor",(state.hover||state.quickHover)?"pointer":"default","important");},{capture:true,passive:true});
  canvas.addEventListener("pointerdown",e=>{const kind=menuKind();if(kind==="main"&&state.hover){e.preventDefault();e.stopImmediatePropagation();action(state.hover);return;}if(kind==="quickplay"&&state.quickHover==="back"){
      e.preventDefault();e.stopImmediatePropagation();
      callFirst(["cancelQuickplay","leaveQueue","leaveRoom","cancelQuickplayTicket"]);
      action("back");
    }},{capture:true,passive:false});
})();

// Hat progress compatibility bridge for old and new save formats.
(() => {
  "use strict";
  function localProgress(){try{return JSON.parse(localStorage.getItem("ribbitRaceHatProgressV2")||"{}")||{};}catch(_){return {};}}
  function skinFromArgs(args){
    const known=["azure","crimson","plum","forest","violet","silver","blossom","ember"];
    for(const arg of args){
      if(typeof arg==="string"&&known.includes(arg.toLowerCase()))return arg.toLowerCase();
      if(arg&&typeof arg==="object"){
        for(const key of ["skinId","skin","frog","frogId","requiredSkin"]){const value=String(arg[key]||"").toLowerCase();if(known.includes(value))return value;}
        const text=JSON.stringify(arg).toLowerCase();const found=known.find(id=>text.includes(id));if(found)return found;
      }
    }
    return String(game.skinId||"azure").toLowerCase();
  }
  function mergeProgress(value,args){
    const progress=localProgress();const skin=skinFromArgs(args);const local=Math.max(0,Number(progress.bySkin?.[skin])||0);
    if(typeof value==="number")return Math.max(value,local);
    if(value&&typeof value==="object"){
      const clone={...value};
      for(const key of ["current","progress","count","value","earned"]){if(Number.isFinite(Number(clone[key])))clone[key]=Math.max(Number(clone[key]),local);}
      return clone;
    }
    return value;
  }
  if(typeof getHatRequirementProgress==="function"){
    const prior=getHatRequirementProgress;getHatRequirementProgress=function(...args){return mergeProgress(prior.apply(this,args),args);};
  }
  if(typeof getHatUnlockProgress==="function"){
    const prior=getHatUnlockProgress;getHatUnlockProgress=function(...args){return mergeProgress(prior.apply(this,args),args);};
  }
  if(typeof getCustomHatProgress==="function"){
    const prior=getCustomHatProgress;getCustomHatProgress=function(...args){return mergeProgress(prior.apply(this,args),args);};
  }
  if(typeof getSkinFlyCount==="function"){
    const prior=getSkinFlyCount;getSkinFlyCount=function(...args){return mergeProgress(prior.apply(this,args),args);};
  }
  if(typeof getFrogSkinFlyCount==="function"){
    const prior=getFrogSkinFlyCount;getFrogSkinFlyCount=function(...args){return mergeProgress(prior.apply(this,args),args);};
  }
  if(typeof drawHatProgressBar==="function"){
    const prior=drawHatProgressBar;drawHatProgressBar=function(hat,...rest){
      try{if(hat?.id==="ember"||hat?.skinId==="ember"){if(isFrogSkinUnlocked?.("ember"))return;}}catch(_){ }
      return prior.call(this,hat,...rest);
    };
  }
})();

// Merge locally archived online replays into Frog Tags history.
(() => {
  "use strict";
  function localGames(name){try{const all=JSON.parse(localStorage.getItem("ribbitRaceOnlineHistoryV2")||"{}");return Array.isArray(all[name])?all[name]:[];}catch(_){return [];}}
  try{
    const tags=window.RibbitFrogTags;
    if(tags&&typeof tags.against==="function"&&!tags.__polish8Merged){
      const original=tags.against.bind(tags);
      const replacement=function(name){
        const base=original(name)||[];const extra=localGames(name);const seen=new Set();
        return [...extra,...base].filter(game=>{const key=String(game.replayId||game.id||`${game.at}:${game.won}`);if(seen.has(key))return false;seen.add(key);return true;});
      };
      try{tags.against=replacement;tags.__polish8Merged=true;}catch(_){ }
    }
  }catch(_){ }
})();

// Place any exposed OnlineVersus help text directly above its hovered control.
(() => {
  "use strict";
  function getSpec(){
    for(const name of ["hoveredSpec","getHoveredSpec","hoveredAction","getHoveredAction","currentHover"]){
      try{const value=OnlineVersus?.[name]?.();if(value&&typeof value==="object"&&value.rect)return value;}catch(_){ }
    }
    return null;
  }
  function bubble(spec){
    const text=String(spec.description||spec.help||spec.tooltip||spec.label||"");if(!text)return;
    const rect=spec.rect;const scale=.45;const width=Math.ceil(Math.min(210,Math.max(72,measureBitmapText(text,scale)+14)));const h=21;const cx=rect.x+rect.w/2;const x=clamp(Math.round(cx-width/2),5,W-width-5);const y=Math.max(4,rect.y-h-8);const px=clamp(Math.round(cx),x+9,x+width-9);
    ctx.fillStyle="rgba(25,43,52,.28)";ctx.fillRect(x+2,y+2,width,h);ctx.fillStyle=COLORS.ink;ctx.fillRect(x,y,width,h);ctx.fillStyle="#f7fdff";ctx.fillRect(x+2,y+2,width-4,h-4);ctx.fillStyle=getSelectedSkin().light;ctx.fillRect(x+5,y+4,width-10,2);drawBitmapText(text,x+width/2,y+8,scale,"center","#26363d");ctx.fillStyle=COLORS.ink;ctx.fillRect(px-4,y+h,9,2);ctx.fillRect(px-3,y+h+2,7,2);ctx.fillRect(px-2,y+h+4,5,2);
  }
  const prior=drawScene;drawScene=function(...args){const result=prior.apply(this,args);try{if(OnlineVersus?.isMenuVisible?.()&&!OnlineVersus?.isActive?.()){const spec=getSpec();if(spec)bubble(spec);}}catch(_){ }return result;};
})();


// Live Top Hat requirement bridge (Azure catches are tracked immediately).
(() => {
  "use strict";
  const TOP_HAT_ID = 'top-hat';
  function azureCount(){
    try{const p=JSON.parse(localStorage.getItem("ribbitRaceHatProgressV2")||"{}");return Math.max(0,Number(p.bySkin?.azure)||0);}catch(_){return 0;}
  }
  function override(id,base){return String(id||"").toLowerCase()===String(TOP_HAT_ID).toLowerCase()&&azureCount()>=75?true:base;}
  if(typeof isHatUnlocked==="function"){const prior=isHatUnlocked;isHatUnlocked=function(id,...rest){return override(id,prior.call(this,id,...rest));};}
  if(typeof isFrogHatUnlocked==="function"){const prior=isFrogHatUnlocked;isFrogHatUnlocked=function(id,...rest){return override(id,prior.call(this,id,...rest));};}
  if(typeof isCustomHatUnlocked==="function"){const prior=isCustomHatUnlocked;isCustomHatUnlocked=function(id,...rest){return override(id,prior.call(this,id,...rest));};}
  let announced=false;
  window.addEventListener("rr-hat-progress",event=>{
    if(event.detail?.skinId!=="azure"||Number(event.detail?.count)<75||announced)return;
    announced=true;
    try{if(typeof unlockHat==="function")unlockHat(TOP_HAT_ID);}catch(_){ }
    try{if(typeof markAchievementEarned==="function")markAchievementEarned("hat-"+TOP_HAT_ID,false);}catch(_){ }
    try{game.cheatToastText="TOP HAT UNLOCKED";game.cheatToastTimer=CONFIG.achievementToastDuration;}catch(_){ }
  });
  window.RibbitTopHatProgress=Object.freeze({id:TOP_HAT_ID,current:azureCount,required:75});
})();

// Do not keep drawing Ember's total-flies progress after Ember is unlocked.
(() => {
  "use strict";
  function emberUnlocked(){try{return Boolean(isFrogSkinUnlocked?.("ember"));}catch(_){return false;}}
  function selectedEmber(args){
    try{
      if(String(game.setupSkinFocusId||game.skinId||"").toLowerCase()==="ember")return true;
      return args.some(arg=>String(arg?.id||arg?.skinId||arg||"").toLowerCase()==="ember");
    }catch(_){return false;}
  }
  if(typeof drawFrogSkinRequirement==="function"){
    const prior=drawFrogSkinRequirement;drawFrogSkinRequirement=function(...args){if(emberUnlocked()&&selectedEmber(args))return;return prior.apply(this,args);};
  }
  if(typeof drawSkinUnlockProgress==="function"){
    const prior=drawSkinUnlockProgress;drawSkinUnlockProgress=function(...args){if(emberUnlocked()&&selectedEmber(args))return;return prior.apply(this,args);};
  }
  if(typeof drawSetupUnlockProgress==="function"){
    const prior=drawSetupUnlockProgress;drawSetupUnlockProgress=function(...args){if(emberUnlocked()&&selectedEmber(args))return;return prior.apply(this,args);};
  }
})();
