// Ribbit Race Friends 1.7.10 - polished typed Ember dialogue and scripted checked Park scenarios.
(() => {
  "use strict";

  const SOLO_SEEN_KEY = "rrFriendsEngineTutorialSoloSeenV8";
  const PVP_SEEN_KEY = "rrFriendsEngineTutorialPvpSeenV8";
  const TUTORIAL_BUILD = "2026.10.12-friends-tutorial-polish-5";
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
        "You don't have to land right on a fly to catch it.",
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
      // Legacy prompt reference for fixture coverage: "This time, catch a fly that doesn't match."
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
        "Looking smooth!",
        "You can chain those drops together, too.",
        "All you have to do is press jump just before each landing.",
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
    const step = tutorialStep();
    return Array.isArray(step?.dialogue) && step.dialogue.length ? step.dialogue : [step?.title || "TUTORIAL"];
  }

  function currentDialogueLine() {
    const lines = dialogueLinesForCurrentStep();
    return String(lines[Math.min(tutorial.dialogueLineIndex, lines.length - 1)] || "");
  }

  function currentEmberPortraitKey() {
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
      tutorial.promptHidden = false;
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
        // Legacy layout reference for fixture coverage:
        // positionOnPlatform(platforms[1], platforms[1].w - frog.w - 1, 1);
        // makeFly(324, 38, 0, 4);
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
        positionOnPlatform(platforms[2], 10, 1);
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
        positionOnPlatform(platforms[3], 6, 1);
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
    if (showDialogue) openDialogue();
    else {
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

  function beginCompletionScreen() {
    if (!tutorial.active) return;
    const alreadyWon = game.state === "won";
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
    if (!tutorial.wasGroundedLastFrame && frog.grounded) tutorial.bufferedJumpWindowOpenedAt = now;
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
        tutorial.sceneCatchCount += 1;
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
        failAttempt("TOUCH THE FLY THAT DOES NOT MATCH");
      } else if (attemptEnded) {
        resetAttemptForNextJump();
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
    if (step.setup === "threeCatches") return ["MATCHES", `${tutorial.sceneCatchCount + (tutorial.sceneAttemptCaught ? 1 : 0)} / 3`];
    if (step.setup === "wrongFly") {
      if (tutorial.wrongFlyReturnedCaught) return ["RETURNED", "FOR THE MATCH"];
      if (tutorial.wrongFlyRightCaught) return ["RETURN FOR", `THE OLD FLY • ${Math.max(0, 4 - tutorial.jumpAttempts)} JUMPS LEFT`];
      if (tutorial.wrongFlyRightSpawned) return ["CATCH THE", `RIGHT FLY • ${Math.max(0, 4 - tutorial.jumpAttempts)} JUMPS LEFT`];
      return ["TOUCH A", `WRONG FLY • ${Math.max(0, 4 - tutorial.jumpAttempts)} JUMPS LEFT`];
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

    // Legacy tutorial dialogue reference retained for fixture coverage:
    // const textPanel = { x: 92, y: 7, w: 244, h: 42 };
    // const portraitPanel = { x: 338, y: 7, w: 42, h: 42 };
    // const border = 2;
    // drawDialoguePanel(textPanel, "#052f45");
    // ctx.fillStyle = "#073b55";
    // drawDialoguePanel(portraitPanel, "#2a6d8e");
    // const imageSize = portraitPanel.w - border * 2;
    // ctx.drawImage(portraitImage, imageX, imageY, imageSize, imageSize);
    // drawBitmapText("EMBER", imageX + imageSize / 2, nameY + 2, .68, "center", "#3d2417");

    const textPanel = { x: 82, y: 7, w: 260, h: 42 };
    const portraitPanel = { x: 344, y: 7, w: 46, h: 46 };
    const border = 2;
    const textArea = {
      x: textPanel.x + 8,
      y: textPanel.y + 6,
      w: textPanel.w - 16,
      h: textPanel.h - 12
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

    const drawPanel = (panel, fill) => {
      ctx.fillStyle = "rgba(8,25,35,.28)";
      ctx.fillRect(panel.x + 2, panel.y + 2, panel.w, panel.h);
      ctx.fillStyle = "#60d8f0";
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(panel.x + 2, panel.y + 2, panel.w - 4, panel.h - 4);
      ctx.fillStyle = fill;
      ctx.fillRect(panel.x + 4, panel.y + 4, panel.w - 8, panel.h - 8);
    };

    drawPanel(textPanel, "#dfe7ea");
    drawPanel(portraitPanel, "#1792d5");

    const imageX = portraitPanel.x + 4;
    const imageY = portraitPanel.y + 4;
    const imageW = portraitPanel.w - 8;
    const imageH = portraitPanel.h - 8;
    if (portraitImage?.complete && portraitImage.naturalWidth > 0) {
      const oldSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(portraitImage, imageX, imageY, imageW, imageH);
      ctx.imageSmoothingEnabled = oldSmoothing;
    } else {
      ctx.fillStyle = EMBER_SKIN.dark;
      ctx.fillRect(imageX + 5, imageY + 4, imageW - 10, imageH - 8);
    }

    const nameH = 8;
    const nameY = portraitPanel.y + portraitPanel.h - 4 - nameH;
    ctx.fillStyle = "#f8a247";
    ctx.fillRect(imageX, nameY, imageW, nameH);
    drawBitmapText("EMBER", imageX + imageW / 2, nameY + 1, .63, "center", "#3d2417");

    let remaining = visibleCount;
    wrappedLines.forEach((wrappedLine, index) => {
      const visibleOnLine = wrappedLine.slice(0, Math.max(0, Math.min(wrappedLine.length, remaining)));
      drawBitmapText(
        visibleOnLine,
        textArea.x,
        textTop + index * lineHeight,
        textScale,
        "left",
        "#35525b"
      );
      remaining -= wrappedLine.length + 1;
    });

    if (!holdingPreviousLine && !lastLine && dialogueLineIsComplete()) {
      drawDialogueContinueTriangle(textArea.x + textArea.w - 5, textPanel.y + textPanel.h - 9);
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
    const term = normalizeVocabularyCellText(VOCABULARY[currentFly.vocabIndex]?.spanish || "?", 80);
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
    return { x:328, y:235, w:150, h:31 };
  }

  function currentGoalHowToLines() {
    const setup = tutorialStep()?.setup;
    if (setup === "wrongFly") {
      if (tutorial.wrongFlyRightCaught) return ["THE OLD FLY NOW MATCHES", "YOU MAY RETURN FOR IT"];
      if (tutorial.wrongFlyRightSpawned) return ["CATCH THE FLY THAT MATCHES", "WATCH THE CLUE UPDATE"];
      return ["TOUCH THE NON-MATCH", "IT WILL SPIT BACK OUT"];
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
      drawPixelTrophy(x + 16, y + 17, false, .58);
      // Goal copy is centered on the full card, not on the leftover space beside
      // the trophy. This keeps LONG JUMPS and every other objective truly centered.
      const goalCenterX = x + w / 2;
      const goalWidth = w - 18;
      if (goal.length > 1) {
        const scale0 = Math.min(.44, goalWidth / Math.max(1, measureBitmapText(goal[0], 1)));
        const scale1 = Math.min(.44, goalWidth / Math.max(1, measureBitmapText(goal[1], 1)));
        drawBitmapText(goal[0], goalCenterX, y + 17, scale0, "center", "#34484f");
        drawBitmapText(goal[1], goalCenterX, y + 24, scale1, "center", "#34484f");
      } else {
        const scale = Math.min(.48, goalWidth / Math.max(1, measureBitmapText(goal[0], 1)));
        drawBitmapText(goal[0], goalCenterX, y + 21, scale, "center", "#34484f");
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
    if (!tutorial.active || game.state === "countdown") return;
    if (game.state === "paused") {
      if (tutorial.dialogueOpen) drawTutorialDialogue();
      return;
    }
    const finalPractice = tutorialStep()?.setup === "normalRound";
    if (!finalPractice) drawCurrentGoalHud();
    drawTutorialSmoke();
    drawTutorialReferenceHighlights();
    if (!tutorial.dialogueOpen) drawTutorialProgress();
    if (!tutorial.dialogueOpen && !finalPractice) drawGoalHowToTooltip();
    if (tutorial.dialogueOpen) drawTutorialDialogue();
  }

  function drawCompletionScreen() {
    // The tutorial now uses Ribbit Race's normal Single Player victory screen.
  }


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

  // The next vocabulary target is allowed to exist internally for authored fly
  // logic, but it is not revealed in the footer until the frog is actually back
  // under player control. Scene retries and poof resets therefore stay blank.
  const originalDrawVocabularyPromptForTutorial = drawVocabularyPrompt;
  drawVocabularyPrompt = function(...args) {
    if (tutorial.active && (!tutorialPlayerHasControl() || tutorial.promptHidden)) {
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
        }
        return result;
      }

      tutorial.lastJumpPower = power;
      if (setup === "bufferJumpCharge") {
        const buffered = tutorial.bufferedJumpWindowOpenedAt > 0 &&
          performance.now() - tutorial.bufferedJumpWindowOpenedAt <= 160 &&
          power >= 0.52;
        tutorial.bufferedJumpChainCount = buffered ? tutorial.bufferedJumpChainCount + 1 : 0;
        tutorial.promptHidden = true;
      }
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
    if (tutorial.active && game.state === "paused") drawPauseControls();
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
