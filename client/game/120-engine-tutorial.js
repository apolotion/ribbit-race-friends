// Ribbit Race Friends 1.7.10 - polished typed Ember dialogue and scripted checked Park scenarios.
(() => {
  "use strict";

  const SOLO_SEEN_KEY = "rrFriendsEngineTutorialSoloSeenV8";
  const PVP_SEEN_KEY = "rrFriendsEngineTutorialPvpSeenV8";
  const TUTORIAL_BUILD = "2026.10.12-friends-polish-13";
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
  const PVP_ONE_SECOND_FLY_SETUPS = new Set([
    "pvpDemoBonkCatch", "pvpBonkCatch",
    "pvpDemoReboundCatch", "pvpReboundCatch",
    "pvpDemoIntercept",
    "pvpDemoDinnerSteal", "pvpDinnerSteal"
  ]);
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
    carryoverFlySnapshots: [],
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
    bufferedJumpReleased: false,
    wasGroundedLastFrame: true,
    revealPromptOnLanding: false,
    pvpScoreStart: 0,
    dynamicDialogueLines: null,
    dynamicPortraitKey: "",
    postSuccessAdvance: false,
    successDialogueShown: false,
    pvpDemoActive: false,
    pvpDemoKind: "",
    pvpDemoStartedAt: 0,
    pvpDemoBegun: false,
    pvpDemoDuration: 0,
    pvpFrogsHidden: false,
    pvpCaption: "",
    pvpCaptionUntil: 0,
    pvpPracticeCount: 0,
    pvpBonkCatchArmed: false,
    pvpBonkCatchSucceeded: false,
    pvpBufferedBonkSeen: false,
    pvpSkyBonkSeen: false,
    pvpMaximumBonkSeen: false,
    pvpUnderBonks: 0,
    pvpReboundCount: 0,
    pvpInterceptSeen: false,
    pvpBoostedBonkSeen: false,
    pvpLastPracticeEventAt: 0,
    pvpLastBonkQuickDrop: false,
    pvpHighGroundBonkSeen: false,
    pvpCpuTriggerAt: 0,
    pvpMirrorWasHeld: false,
    pvpFinalMatchStarted: false,
    pvpFinalOutcome: null,
    pvpFlyRevealAt: 0,
    pvpFlyRevealSetup: "",
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
        "All this jumping sure does work up an appetite.",
        "So why stop at only one fly per jump?",
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
        "If you get lucky, you can catch two flies in a single jump!"
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
        "Now, let's say that you're REALLY hungry and need a snack as soon as possible.",
        "You can buffer a jump charge by holding jump before you land.",
        "That lets you start charging instantly from the moment you touch the ground.",
        "Show me a buffered jump charge right after you land."
      ],
      portrait: "confused",
      goal: ["BUFFER A JUMP", "AFTER LANDING"],
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
    {
      "scene": 1,
      "title": "WELCOME TO THE COMPETITION",
      "setup": "pvpWelcome",
      "portrait": "happy",
      "goal": [
        "LISTEN TO",
        "EMBER"
      ],
      "autoAdvanceAfterDialogue": true,
      "dialogue": [
        "Welcome back, tadpole! Ready to share the pond?",
        "Catching flies is one thing. Catching them before I do? That takes a little more practice!",
        "Each normal round lasts 60 seconds, and the frog with the most matching flies wins.",
        "Normal matches are best of three, but this tutorial ends with one 30-second round.",
        "I'll demonstrate each move first. When you see YOUR TURN, the controls are yours.",
        "We'll cover bonks, rebounds, and ways to get between a hungry frog and their dinner.",
        "Remember: catching the right flies is what wins rounds!",
        "Don't worry. I'll go easy on you. For now..."
      ]
    },
    {
      "scene": 2,
      "title": "YOUR FIRST BONKS",
      "setup": "pvpDemoBonk",
      "portrait": "determined",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "First lesson: the bonk!",
        "Hold still for a second. I need to borrow the top of your head."
      ],
      "successDialogue": [
        "Bonk!",
        "Land on top of another frog, and you'll leave them stunned for a little while.",
        "You couldn't move until you shook that off—but I could keep hopping!"
      ]
    },
    {
      "scene": 2,
      "title": "YOUR FIRST BONKS",
      "setup": "pvpBonkThree",
      "portrait": "thumbsup",
      "goal": [
        "BONK EMBER",
        "0 / 3"
      ],
      "dialogue": [
        "Now you try.",
        "Jump above me and land on my head.",
        "Let's see three bonks, each in a single jump!"
      ],
      "successDialogue": [
        "Three for three!",
        "Remind me to start wearing a helmet."
      ]
    },
    {
      "scene": 3,
      "title": "DINNER WHILE THEY'RE DIZZY",
      "setup": "pvpDemoBonkCatch",
      "portrait": "questioning",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "Bonking me won't score you a point.",
        "But it can give you a chance to grab one!",
        "Watch what I do after this next bonk."
      ],
      "successDialogue": [
        "While you were shaking that off, I helped myself to dinner!",
        "That's your opening after a bonk—but it won't last forever."
      ]
    },
    {
      "scene": 3,
      "title": "DINNER WHILE THEY'RE DIZZY",
      "setup": "pvpBonkCatch",
      "portrait": "determined",
      "goal": [
        "BONK + CATCH",
        "BEFORE RECOVERY"
      ],
      "dialogue": [
        "Your turn.",
        "Bonk me, then catch the matching fly before I recover.",
        "And don't waste your chance admiring that excellent bonk!"
      ],
      "successDialogue": [
        "Bonked and beaten to dinner.",
        "You're catching on. Unfortunately for me."
      ]
    },
    {
      "scene": 4,
      "title": "LOW DROP BONK",
      "setup": "pvpDemoDropLow",
      "portrait": "peace",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "Let's put those platforms to work!",
        "You don't always have to jump onto another frog to bonk them.",
        "Sometimes, you can drop right in!",
        "We'll start close to the ground.",
        "One quick tap, and I'm coming down!"
      ],
      "successDialogue": [
        "That's a drop bonk!",
        "A quick tap, a little fall, and one surprised frog underneath!",
        "From this height, you're back on your feet pretty quickly."
      ]
    },
    {
      "scene": 4,
      "title": "LOW DROP BONK",
      "setup": "pvpDropLow",
      "portrait": "determined",
      "goal": [
        "LOW PLATFORM",
        "DROP BONK"
      ],
      "dialogue": [
        "Your turn. Let's try that same little drop.",
        "Give jump a quick tap—press and release—to drop through the platform.",
        "Then land right on my head."
      ],
      "successDialogue": [
        "Oof! Not bad, tadpole.",
        "Back on my feet already! Now let's see what a little more height does."
      ]
    },
    {
      "scene": 4,
      "title": "HIGH DROP BONK",
      "setup": "pvpDemoDropHigh",
      "portrait": "laughing",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "How's the weather down there?",
        "Never mind—I'll drop in and check for myself!"
      ],
      "successDialogue": [
        "Took a little longer to shake that one off, didn't it?",
        "The higher the drop, the longer the stun!",
        "Same move, bigger fall, more time to catch flies while you recover."
      ]
    },
    {
      "scene": 4,
      "title": "HIGH DROP BONK",
      "setup": "pvpDropHigh",
      "portrait": "determined",
      "goal": [
        "TOP PLATFORM",
        "DROP BONK"
      ],
      "dialogue": [
        "All right. Your turn up top.",
        "Same quick tap, much bigger drop.",
        "Drop through the platform and land on me down here.",
        "Watch how much longer it takes me to recover this time!"
      ],
      "successDialogue": [
        "Oooof.",
        "You kept me seeing stars longer than that little drop did!",
        "More height, more stun time."
      ]
    },
    {
      "scene": 5,
      "title": "STRAIGHT THROUGH TO A BONK",
      "setup": "pvpDemoBufferedBonk",
      "portrait": "questioning",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "Think that platform will keep me from reaching you?",
        "Remember your buffered drops? They work for bonks, too!",
        "Watch my landing."
      ],
      "successDialogue": [
        "Straight through the platform and right on target!"
      ]
    },
    {
      "scene": 5,
      "title": "STRAIGHT THROUGH TO A BONK",
      "setup": "pvpBufferedBonk",
      "portrait": "determined",
      "goal": [
        "BUFFER DROP",
        "+ BONK"
      ],
      "dialogue": [
        "Now let's switch places.",
        "Charge your jump to get above the platform.",
        "Then press jump again just before you land on it.",
        "Drop through and give me a surprise from above!"
      ],
      "successDialogue": [
        "Right through my ceiling!",
        "I really need to find a better hiding place."
      ]
    },
    {
      "scene": 6,
      "title": "SKY BONKS",
      "setup": "pvpDemoSkyBonk",
      "portrait": "amazed",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "You've learned how to drop onto me.",
        "Now let's take things a little higher. Actually... a lot higher!",
        "For a sky bonk, you jump high above the map, then land right on your rival!",
        "Watch me take the scenic route."
      ],
      "successDialogue": [
        "Now that's a sky bonk!",
        "That big jump gives me a long way down—and you get longer to admire the stars afterward!"
      ]
    },
    {
      "scene": 6,
      "title": "SKY BONKS",
      "setup": "pvpSkyBonk",
      "portrait": "determined",
      "goal": [
        "JUMP HIGH",
        "THEN BONK"
      ],
      "dialogue": [
        "Your turn, tadpole. Let's see those frog legs work!",
        "Charge a strong jump to get high above the map.",
        "Line up your leap so you come down right on my head.",
        "No dropping straight off a platform—I want to see that big jump first!"
      ],
      "successDialogue": [
        "You went all the way up there just to land on me?",
        "I'm flattered. And a little flattened."
      ]
    },
    {
      "scene": 6,
      "title": "SKY BONK THROUGH A PLATFORM",
      "setup": "pvpDemoBufferedSky",
      "portrait": "questioning",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "Now, there's something that can get between you and a perfect sky bonk: platforms!",
        "Combine your sky bonk with a buffered platform drop.",
        "Watch how I keep this fall going."
      ],
      "successDialogue": [
        "Straight through the platform and right down to you!",
        "The buffer keeps the platform from stopping my fall.",
        "High sky bonk plus a buffered drop can give maximum bonk stun time!"
      ]
    },
    {
      "scene": 6,
      "title": "SKY BONK THROUGH A PLATFORM",
      "setup": "pvpBufferedSky",
      "portrait": "determined",
      "goal": [
        "MAX-STUN",
        "BUFFERED SKY BONK"
      ],
      "dialogue": [
        "Now let's put those moves together.",
        "Jump high above the map, then come back down toward me.",
        "Just before you land on the platform, press jump again to buffer a drop.",
        "Pass straight through and land your sky bonk on me down here!"
      ],
      "successDialogue": [
        "Oooooof.",
        "Yep. That's the longest I'll be seeing stars.",
        "Beautiful combination. Absolutely awful place to watch it from."
      ]
    },
    {
      "scene": 7,
      "title": "THERE GOES THE HIGH GROUND",
      "setup": "pvpDemoHighGround",
      "portrait": "annoyed",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "Enjoying the view up there?",
        "Don't get too comfortable!",
        "A bonk can knock you off a platform all the way to the ground.",
        "That fall can add more stun time—and make you give up your spot."
      ],
      "successDialogue": [
        "See? You lost your perch, and I bought myself a little more time."
      ]
    },
    {
      "scene": 7,
      "title": "THERE GOES THE HIGH GROUND",
      "setup": "pvpHighGround",
      "portrait": "determined",
      "goal": [
        "KNOCK EMBER",
        "TO THE GROUND"
      ],
      "dialogue": [
        "Now I'll take the top platform. You start in the middle.",
        "Jump above me and land a bonk.",
        "Let's see you bring me back down to earth!"
      ],
      "successDialogue": [
        "Well... the view was nice while it lasted."
      ]
    },
    {
      "scene": 8,
      "title": "WAIT FOR THE NEXT BONK",
      "setup": "pvpDemoRecoveryBonk",
      "portrait": "questioning",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "You can't keep bonking me while I'm already stunned.",
        "Here—let me show you what happens."
      ],
      "successDialogue": [
        "Nothing that time! You were still shaking off the first one.",
        "But once you recover... you're back in the race—and back in bonking range!"
      ]
    },
    {
      "scene": 8,
      "title": "WAIT FOR THE NEXT BONK",
      "setup": "pvpRecoveryBonk",
      "portrait": "determined",
      "goal": [
        "BONK TWICE",
        "AFTER RECOVERY"
      ],
      "dialogue": [
        "Now you try.",
        "Bonk me once, use the wall to turn around, and time your return for after I recover.",
        "Too early, and you won't get that second bonk!"
      ],
      "successDialogue": [
        "I barely got my balance back!",
        "Good timing. Annoyingly good timing."
      ]
    },
    {
      "scene": 9,
      "title": "BORROWING MY BOUNCE",
      "setup": "pvpDemoBoostBonk",
      "portrait": "amazed",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "Here's a trick with a little extra spring.",
        "The harder you jump just before I bonk you, the farther I'll bounce!",
        "Watch the difference."
      ],
      "successDialogue": [
        "You did the charging. I got the lift!"
      ]
    },
    {
      "scene": 9,
      "title": "BORROWING MY BOUNCE",
      "setup": "pvpBoostBonk",
      "portrait": "determined",
      "goal": [
        "BONK EMBER",
        "AS SHE JUMPS"
      ],
      "dialogue": [
        "Now let's see how much bounce you can borrow from me.",
        "Start charging your jump, and I'll start just after you.",
        "Time your leap to land on me as I spring upward with a strong jump."
      ],
      "successDialogue": [
        "There you go!",
        "Apparently, I'm your coach and your personal springboard."
      ]
    },
    {
      "scene": 10,
      "title": "UNDER BONKS",
      "setup": "pvpDemoUnderBonk",
      "portrait": "questioning",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "You don't always have to land on me to get a bonk.",
        "Sometimes, you can let me jump right into trouble!",
        "This next trick is called an under bonk.",
        "Watch what happens when I get to this platform first."
      ],
      "successDialogue": [
        "Bonk!",
        "You jumped into me from underneath while I held the platform.",
        "That's an under bonk!"
      ]
    },
    {
      "scene": 10,
      "title": "UNDER BONKS",
      "setup": "pvpUnderBonkTwo",
      "portrait": "determined",
      "goal": [
        "UNDER BONKS",
        "0 / 2"
      ],
      "dialogue": [
        "Now let's switch places.",
        "Jump onto this platform before I try to jump up past you.",
        "Then hold your spot while I recover and try again.",
        "Give me two under bonks without giving up your perch!"
      ],
      "successDialogue": [
        "Okay. Your platform.",
        "Apparently, jumping into the same frog twice doesn't improve the results."
      ]
    },
    {
      "scene": 11,
      "title": "AVOIDING UNDER BONKS",
      "setup": "pvpDemoAvoidUnder",
      "portrait": "peace",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "How do you get past a frog waiting to give you an under bonk?",
        "You keep a low profile and slip underneath.",
        "Watch my feet on this one."
      ],
      "successDialogue": [
        "Right under your nose!",
        "The trick is to tap jump very quickly.",
        "Don't hold it to charge—just a quick press and release."
      ]
    },
    {
      "scene": 11,
      "title": "AVOIDING UNDER BONKS",
      "setup": "pvpAvoidUnder",
      "portrait": "determined",
      "goal": [
        "SLIP UNDER",
        "WITHOUT A BONK"
      ],
      "dialogue": [
        "Now I'll take the platform.",
        "Tap jump very quickly to get underneath and past me.",
        "Remember: quick taps, not charged jumps!"
      ],
      "successDialogue": [
        "Not even a bump!",
        "You're learning how to ruin my plans. I'm very proud. Annoyed, but proud."
      ]
    },
    {
      "scene": 12,
      "title": "YOUR FIRST REBOUNDS",
      "setup": "pvpDemoRebound",
      "portrait": "amazed",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "That's enough bonking my head. Let's try something sideways!",
        "When we meet side-to-side in the air, we don't bonk. We rebound!",
        "Watch what happens to our directions."
      ],
      "successDialogue": [
        "We both turned around—without touching a wall!",
        "No stun that time. Just a change of plans."
      ]
    },
    {
      "scene": 12,
      "title": "YOUR FIRST REBOUNDS",
      "setup": "pvpReboundThree",
      "portrait": "determined",
      "goal": [
        "REBOUNDS",
        "0 / 3"
      ],
      "dialogue": [
        "Now let's practice.",
        "I'll jump when you do.",
        "Meet me at the same height and aim for my side, not my head.",
        "Show me three clean rebounds!"
      ],
      "successDialogue": [
        "Three turnarounds, and not a wall in sight!",
        "Now let's put those bounces to work."
      ]
    },
    {
      "scene": 13,
      "title": "YOUR VERY GRUMPY WALL",
      "setup": "pvpDemoReboundCatch",
      "portrait": "peace",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "Only the airborne frog turns around.",
        "A frog standing on the ground—or a platform—stays put.",
        "Watch how I use that to reach a fly behind me!"
      ],
      "successDialogue": [
        "You stayed put. I changed direction.",
        "And look at that—dinner was right behind me!"
      ]
    },
    {
      "scene": 13,
      "title": "YOUR VERY GRUMPY WALL",
      "setup": "pvpReboundCatch",
      "portrait": "determined",
      "goal": [
        "REBOUND",
        "THEN CATCH"
      ],
      "dialogue": [
        "Now I'll stand on the platform.",
        "Your matching fly is behind you.",
        "Jump into my side, rebound, and catch it on the way back!",
        "Think of me as a very talented, very grumpy wall."
      ],
      "successDialogue": [
        "Nice catch!",
        "You're welcome for the directions, by the way."
      ]
    },
    {
      "scene": 14,
      "title": "NOT SO FAST!",
      "setup": "pvpDemoIntercept",
      "portrait": "annoyed",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "Rebounds aren't always helpful to the other frog.",
        "Sometimes, I'd rather send you away from dinner!",
        "Watch how I cut off your path to that fly."
      ],
      "successDialogue": [
        "Not so fast, tadpole!",
        "I didn't catch the fly. I just kept you from getting it."
      ]
    },
    {
      "scene": 14,
      "title": "NOT SO FAST!",
      "setup": "pvpIntercept",
      "portrait": "determined",
      "goal": [
        "REBOUND EMBER",
        "BEFORE HER CATCH"
      ],
      "dialogue": [
        "Now let's see you stop me.",
        "I'm going for that fly as soon as we're back in position.",
        "Time your jump to meet me side-to-side before I reach it.",
        "You don't have to catch it—just send me the wrong way!"
      ],
      "successDialogue": [
        "Hey! I was about to eat that!",
        "Good rebound. Terrible table manners."
      ]
    },
    {
      "scene": 15,
      "title": "THE DINNER STEAL",
      "setup": "pvpDemoDinnerSteal",
      "portrait": "laughing",
      "goal": [
        "WATCH",
        "EMBER"
      ],
      "demonstration": true,
      "dialogue": [
        "Now for my favorite trick.",
        "Stopping your catch is useful.",
        "Turning it into my catch? Even better!",
        "Watch this."
      ],
      "successDialogue": [
        "You were heading for dinner.",
        "Then we bumped into each other... and I got there instead!",
        "Nothing personal. A frog's gotta eat."
      ]
    },
    {
      "scene": 15,
      "title": "THE DINNER STEAL",
      "setup": "pvpDinnerSteal",
      "portrait": "determined",
      "goal": [
        "REBOUND",
        "THEN STEAL"
      ],
      "dialogue": [
        "All right. Your turn to return the favor.",
        "Rebound off me to turn me away from the matching fly.",
        "Then grab it yourself before I make it back!"
      ],
      "successDialogue": [
        "You bounced me out of the way and took my dinner!",
        "I'd complain, but... I did just teach you how to do that."
      ]
    },
    {
      "scene": 16,
      "title": "ONE ROUND, TWO HUNGRY FROGS",
      "setup": "pvpFinalMatch",
      "portrait": "determined",
      "goal": [
        "30-SECOND",
        "MATCH VS EMBER"
      ],
      "finalMatch": true,
      "dialogue": [
        "Look at you! Bonking me, bouncing off me, and stealing my flies.",
        "You've come a long way, tadpole. Now let's put it all together in a real race!",
        "Normally, PvP is best of three, with 60 seconds in each round.",
        "For this tutorial, we're playing one 30-second round. Best of one—this round decides our match!",
        "Catch more matching flies than I do, and you beat your coach.",
        "Bonks buy you time. Rebounds change your direction.",
        "But don't get so busy bonking me that you forget your dinner!",
        "No more demonstrations. Ready? Let's see who's still hungry when the timer runs out!"
      ]
    }
  ]);

  const PVP_WIN_DIALOGUE = Object.freeze([
    "Wait... you caught more than me?",
    "I teach you a few tricks, and you use them to steal my dinner!",
    "Nice work, tadpole. You earned that win!",
    "You've finished your training—and beaten your coach along the way.",
    "A normal match is best of three. Next time, you'll have to beat me twice!",
    "Enjoy your victory. I'll be practicing while you're celebrating."
  ]);

  const PVP_LOSE_DIALOGUE = Object.freeze([
    "Looks like dinner's on my side of the pond today!",
    "Don't look so glum, tadpole. I did warn you I was a pro.",
    "One loss doesn't send you back to tadpole school!",
    "You've learned the tricks. Now it's about spotting the right moment to use them.",
    "Sometimes the smartest move is to leave me alone and grab a fly!",
    "Your training is complete, win or lose.",
    "Keep those frog legs ready. I expect a much hungrier rival next time!"
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
    pvpOffense: Object.freeze(["laughing", "determined", "peace"]),
    pvpDemoBonk: Object.freeze(["determined", "laughing"]),
    pvpBonkThree: Object.freeze(["thumbsup", "determined", "laughing"]),
    pvpDemoBonkCatch: Object.freeze(["questioning", "determined", "happy"]),
    pvpBonkCatch: Object.freeze(["determined", "thumbsup", "laughing"]),
    pvpDemoDropLow: Object.freeze(["peace", "happy", "laughing", "determined"]),
    pvpDropLow: Object.freeze(["determined", "questioning", "thumbsup"]),
    pvpDemoDropHigh: Object.freeze(["laughing", "dazed", "amazed"]),
    pvpDropHigh: Object.freeze(["determined", "shocked", "thumbsup"]),
    pvpDemoBufferedBonk: Object.freeze(["questioning", "determined", "laughing"]),
    pvpBufferedBonk: Object.freeze(["determined", "thumbsup", "amazed"]),
    pvpDemoSkyBonk: Object.freeze(["amazed", "laughing", "determined"]),
    pvpSkyBonk: Object.freeze(["determined", "questioning", "thumbsup"]),
    pvpDemoBufferedSky: Object.freeze(["questioning", "determined", "shocked"]),
    pvpBufferedSky: Object.freeze(["determined", "amazed", "thumbsup"]),
    pvpDemoHighGround: Object.freeze(["annoyed", "determined", "laughing"]),
    pvpHighGround: Object.freeze(["determined", "thumbsup", "sad"]),
    pvpDemoRecoveryBonk: Object.freeze(["questioning", "annoyed", "determined"]),
    pvpRecoveryBonk: Object.freeze(["determined", "questioning", "laughing"]),
    pvpDemoBoostBonk: Object.freeze(["amazed", "questioning", "happy"]),
    pvpBoostBonk: Object.freeze(["determined", "thumbsup", "laughing"]),
    pvpDemoUnderBonk: Object.freeze(["questioning", "shocked", "laughing"]),
    pvpUnderBonkTwo: Object.freeze(["determined", "annoyed", "thumbsup"]),
    pvpDemoAvoidUnder: Object.freeze(["peace", "determined", "happy"]),
    pvpAvoidUnder: Object.freeze(["determined", "questioning", "thumbsup"]),
    pvpDemoRebound: Object.freeze(["amazed", "laughing", "peace"]),
    pvpReboundThree: Object.freeze(["determined", "thumbsup", "happy"]),
    pvpDemoReboundCatch: Object.freeze(["peace", "determined", "happy"]),
    pvpReboundCatch: Object.freeze(["determined", "questioning", "thumbsup"]),
    pvpDemoIntercept: Object.freeze(["annoyed", "determined", "laughing"]),
    pvpIntercept: Object.freeze(["determined", "questioning", "thumbsup"]),
    pvpDemoDinnerSteal: Object.freeze(["laughing", "determined", "happy"]),
    pvpDinnerSteal: Object.freeze(["determined", "annoyed", "thumbsup"]),
    pvpFinalMatch: Object.freeze(["determined", "happy", "thumbsup", "questioning"])
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
        if (tutorial.kind === "pvp" && !tutorialStep()?.demonstration) {
          tutorial.pvpCaption = "YOUR TURN!";
          tutorial.pvpCaptionUntil = performance.now() + 1600;
        }
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
    const step = tutorialStep();
    const setup = step?.setup;
    if (tutorial.kind === "pvp") {
      if (step?.demonstration) {
        startPvpDemonstration();
        return;
      }
      if (step?.finalMatch) {
        startPvpFinalMatch();
        return;
      }
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
    tutorial.pvpCaption = "";
    tutorial.pvpCaptionUntil = 0;
    tutorial.pvpPracticeCount = 0;
    tutorial.pvpBonkCatchArmed = false;
    tutorial.pvpBonkCatchSucceeded = false;
    tutorial.pvpBufferedBonkSeen = false;
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
        tutorial.promptHidden = true;
        break;

      case "threeCatches":
        setupThreeCatchAttempt(0, false);
        break;

      case "rangeCatch": {
        positionSoloFrog(getNormalParkStartX(), CONFIG.groundY - frog.h, 1);
        setPrompt(0);
        // Center the fly over Park's right-middle platform. Its height is about
        // two-fifths of the way from the middle platform toward the top platform.
        const targetPlatform = platforms[5];
        const targetX = Math.round(targetPlatform.x + targetPlatform.w / 2);
        const targetY = Math.round(platforms[5].y - (platforms[5].y - platforms[4].y) * 0.40);
        makeFly(targetX, targetY, 0, 4);
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
        const target = makeFly(PARK_FLY_SPAWNS[1].x, PARK_FLY_SPAWNS[1].y + 14, 0, 0);
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
    game.pvpCpuDifficulty = 5;
    game.pvpRoundTarget = 99;
    game.pvpRoundGoalMode = "firstto";
    game.pvpFirstTo = 99;
    game.pvpBestOf = 1;
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

  function positionPvpOnPlatform(player, platform, dir = 1, offset = null) {
    const x = platform.x + (offset === null ? Math.round((platform.w - player.w) / 2) : offset);
    positionPvp(player, x, platform.y - player.h, dir);
  }

  function setPvpAirborne(player, x, y, vx, vy, dir = 1) {
    positionPvp(player, x, y, dir);
    player.grounded = false;
    player.vx = vx;
    player.vy = vy;
    player.previousY = y;
    player.jumpStartY = y;
    player.highestY = y;
    player.firstJumpMade = true;
  }

  function addPvpTutorialFly(x, y, vocabIndex = 0, authoredIndex = 0) {
    const fly = makeFly(x, y, vocabIndex, authoredIndex);
    fly.tutorialArmed = false;
    return fly;
  }

  function pvpFlyRevealDelayMs(setup) {
    // The timed Scene 14 practice reveal is immediate. Other scripted fly
    // lessons use the one-second post-poof delay from the authored script.
    if (setup === "pvpIntercept") return 0;
    return PVP_ONE_SECOND_FLY_SETUPS.has(String(setup || "")) ? 1000 : 0;
  }

  function schedulePvpFlyReveal(setup, delayMs = pvpFlyRevealDelayMs(setup)) {
    const hasHiddenFly = flies.some((fly) => fly?.tutorialAuthored && fly.tutorialArmed === false);
    if (!hasHiddenFly) {
      tutorial.pvpFlyRevealAt = 0;
      tutorial.pvpFlyRevealSetup = "";
      return 0;
    }
    const safeDelay = Math.max(0, Number(delayMs) || 0);
    if (safeDelay <= 0) {
      tutorial.pvpFlyRevealAt = 0;
      tutorial.pvpFlyRevealSetup = "";
      return armTutorialFlies();
    }
    tutorial.pvpFlyRevealAt = performance.now() + safeDelay;
    tutorial.pvpFlyRevealSetup = String(setup || "");
    tutorial.promptHidden = true;
    return 0;
  }

  function updatePvpFlyReveal(now = performance.now()) {
    if (tutorial.kind !== "pvp" || tutorial.pvpFlyRevealAt <= 0 || now < tutorial.pvpFlyRevealAt) return false;
    tutorial.pvpFlyRevealAt = 0;
    tutorial.pvpFlyRevealSetup = "";
    armTutorialFlies();
    return true;
  }

  function configurePvpStep(index) {
    basePvpScenario();
    const step = PVP_STEPS[index] || PVP_STEPS[0];
    const p1 = pvpPlayers[0];
    const ember = pvpPlayers[1];
    const lowerLeft = PARK_PLATFORMS[1];
    const middleLeft = PARK_PLATFORMS[2];
    const top = PARK_PLATFORMS[4];
    const middleRight = PARK_PLATFORMS[5];

    switch (step.setup) {
      case "pvpWelcome":
        positionPvp(p1, 145, CONFIG.groundY - p1.h, 1);
        positionPvp(ember, 305, CONFIG.groundY - ember.h, -1);
        break;
      case "pvpDemoBonk":
        positionPvp(p1, 230, CONFIG.groundY - p1.h, 1);
        setPvpAirborne(ember, 230, 62, 0, 105, -1);
        break;
      case "pvpBonkThree":
        positionPvp(p1, 135, CONFIG.groundY - p1.h, 1);
        positionPvp(ember, 255, CONFIG.groundY - ember.h, -1);
        break;
      case "pvpDemoBonkCatch":
        positionPvp(p1, 185, CONFIG.groundY - p1.h, 1);
        setPvpAirborne(ember, 185, 62, 0, 105, 1);
        addPvpTutorialFly(310, 125, 0, 0);
        break;
      case "pvpBonkCatch":
        positionPvp(p1, 120, CONFIG.groundY - p1.h, 1);
        positionPvp(ember, 225, CONFIG.groundY - ember.h, -1);
        addPvpTutorialFly(340, 120, 0, 0);
        break;
      case "pvpDemoDropLow":
        positionPvp(p1, lowerLeft.x + Math.round((lowerLeft.w - p1.w) / 2), CONFIG.groundY - p1.h, 1);
        positionPvpOnPlatform(ember, lowerLeft, -1);
        break;
      case "pvpDropLow":
        positionPvpOnPlatform(p1, lowerLeft, 1);
        positionPvp(ember, lowerLeft.x + Math.round((lowerLeft.w - ember.w) / 2), CONFIG.groundY - ember.h, -1);
        break;
      case "pvpDemoDropHigh":
        positionPvp(p1, top.x + Math.round((top.w - p1.w) / 2), CONFIG.groundY - p1.h, 1);
        positionPvpOnPlatform(ember, top, -1);
        break;
      case "pvpDropHigh":
        positionPvpOnPlatform(p1, top, 1);
        positionPvp(ember, top.x + Math.round((top.w - ember.w) / 2), CONFIG.groundY - ember.h, -1);
        break;
      case "pvpDemoBufferedBonk":
        positionPvp(p1, middleRight.x + Math.round((middleRight.w - p1.w) / 2), CONFIG.groundY - p1.h, 1);
        setPvpAirborne(ember, middleRight.x + Math.round((middleRight.w - ember.w) / 2), 24, 0, 90, -1);
        ember.dropThroughPlatform = middleRight;
        ember.bufferedDropBonkArmed = true;
        break;
      case "pvpBufferedBonk":
        positionPvp(p1, 95, CONFIG.groundY - p1.h, 1);
        positionPvp(ember, middleLeft.x + Math.round((middleLeft.w - ember.w) / 2), CONFIG.groundY - ember.h, -1);
        break;
      case "pvpDemoSkyBonk":
        positionPvp(p1, 245, CONFIG.groundY - p1.h, 1);
        setPvpAirborne(ember, 245, -12, 0, 105, -1);
        ember.highestY = -20;
        ember.wentAboveMapThisJump = true;
        break;
      case "pvpSkyBonk":
        positionPvp(p1, 92, CONFIG.groundY - p1.h, 1);
        positionPvp(ember, 355, CONFIG.groundY - ember.h, -1);
        break;
      case "pvpDemoBufferedSky":
        positionPvp(p1, middleRight.x + Math.round((middleRight.w - p1.w) / 2), CONFIG.groundY - p1.h, 1);
        setPvpAirborne(ember, middleRight.x + Math.round((middleRight.w - ember.w) / 2), -18, 0, 110, -1);
        ember.highestY = -24;
        ember.wentAboveMapThisJump = true;
        ember.dropThroughPlatform = middleRight;
        ember.bufferedDropBonkArmed = true;
        break;
      case "pvpBufferedSky":
        positionPvp(p1, 92, CONFIG.groundY - p1.h, 1);
        positionPvp(ember, middleRight.x + Math.round((middleRight.w - ember.w) / 2), CONFIG.groundY - ember.h, -1);
        break;
      case "pvpDemoHighGround":
        positionPvpOnPlatform(p1, top, 1);
        setPvpAirborne(ember, top.x + 5, 20, 40, 95, 1);
        break;
      case "pvpHighGround":
        positionPvpOnPlatform(p1, middleLeft, 1);
        positionPvpOnPlatform(ember, top, -1);
        break;
      case "pvpDemoRecoveryBonk":
        positionPvp(p1, 405, CONFIG.groundY - p1.h, 1);
        setPvpAirborne(ember, 405, 70, 0, 100, -1);
        break;
      case "pvpRecoveryBonk":
        positionPvp(p1, 385, CONFIG.groundY - p1.h, 1);
        positionPvp(ember, 315, CONFIG.groundY - ember.h, 1);
        break;
      case "pvpDemoBoostBonk":
        setPvpAirborne(p1, 225, 155, 0, -170, 1);
        setPvpAirborne(ember, 225, 105, 0, 90, -1);
        break;
      case "pvpBoostBonk":
        positionPvp(p1, 150, CONFIG.groundY - p1.h, 1);
        positionPvp(ember, 260, CONFIG.groundY - ember.h, -1);
        break;
      case "pvpDemoUnderBonk":
        positionPvpOnPlatform(ember, middleLeft, -1);
        setPvpAirborne(p1, middleLeft.x + Math.round((middleLeft.w - p1.w) / 2), CONFIG.groundY - p1.h, 0, -190, 1);
        break;
      case "pvpUnderBonkTwo":
        positionPvpOnPlatform(p1, middleLeft, 1);
        positionPvp(ember, middleLeft.x + Math.round((middleLeft.w - ember.w) / 2), CONFIG.groundY - ember.h, -1);
        break;
      case "pvpDemoAvoidUnder":
        positionPvpOnPlatform(p1, middleLeft, 1);
        positionPvp(ember, middleLeft.x - 45, CONFIG.groundY - ember.h, 1);
        break;
      case "pvpAvoidUnder":
        positionPvpOnPlatform(ember, middleLeft, -1);
        positionPvp(p1, middleLeft.x - 45, CONFIG.groundY - p1.h, 1);
        break;
      case "pvpDemoRebound":
      case "pvpReboundThree":
        positionPvp(p1, 150, CONFIG.groundY - p1.h, 1);
        positionPvp(ember, 300, CONFIG.groundY - ember.h, -1);
        break;
      case "pvpDemoReboundCatch":
        positionPvpOnPlatform(p1, middleLeft, 1);
        setPvpAirborne(ember, 285, 145, -105, -70, -1);
        addPvpTutorialFly(365, 145, 0, 0);
        break;
      case "pvpReboundCatch":
        positionPvpOnPlatform(ember, middleRight, -1);
        positionPvp(p1, 390, CONFIG.groundY - p1.h, -1);
        addPvpTutorialFly(440, 145, 0, 0);
        break;
      case "pvpDemoIntercept":
        setPvpAirborne(p1, 135, 150, 105, -80, 1);
        setPvpAirborne(ember, 315, 150, -105, -80, -1);
        addPvpTutorialFly(390, 130, 0, 0);
        break;
      case "pvpIntercept":
        positionPvp(p1, 275, CONFIG.groundY - p1.h, -1);
        positionPvp(ember, 135, CONFIG.groundY - ember.h, 1);
        addPvpTutorialFly(390, 130, 0, 0);
        break;
      case "pvpDemoDinnerSteal":
        setPvpAirborne(p1, 130, 150, 105, -75, 1);
        setPvpAirborne(ember, 300, 150, -105, -75, -1);
        addPvpTutorialFly(365, 130, 0, 0);
        break;
      case "pvpDinnerSteal":
        positionPvp(p1, 315, CONFIG.groundY - p1.h, -1);
        positionPvp(ember, 210, CONFIG.groundY - ember.h, 1);
        addPvpTutorialFly(410, 130, 0, 0);
        break;
      case "pvpFinalMatch":
        positionPvp(p1, PVP_START_X[0], CONFIG.groundY - p1.h, 1);
        positionPvp(ember, PVP_START_X[1], CONFIG.groundY - ember.h, -1);
        break;
      default:
        break;
    }
    ember.skinId = "ember";
    game.pvpSetupSkinIds[1] = "ember";
    clearScenarioState();
  }

  function beginPvpDemoMotion(setup) {
    const p1 = pvpPlayers[0];
    const ember = pvpPlayers[1];
    const lowerLeft = PARK_PLATFORMS[1];
    const middleLeft = PARK_PLATFORMS[2];
    const top = PARK_PLATFORMS[4];
    const middleRight = PARK_PLATFORMS[5];
    tutorial.pvpDemoBegun = true;
    tutorial.pvpDemoStartedAt = performance.now();
    tutorial.pvpCaption = "WATCH EMBER!";
    tutorial.pvpCaptionUntil = performance.now() + 1800;
    schedulePvpFlyReveal(setup);

    switch (setup) {
      case "pvpDemoBonk":
        setPvpAirborne(ember, 230, 58, 0, 118, -1);
        break;
      case "pvpDemoBonkCatch":
        setPvpAirborne(ember, 185, 58, 0, 118, 1);
        break;
      case "pvpDemoDropLow":
        ember.dropThroughPlatform = lowerLeft;
        ember.quickDropThisJump = true;
        ember.grounded = false;
        ember.vy = CONFIG.platformDropVelocityY;
        break;
      case "pvpDemoDropHigh":
        ember.dropThroughPlatform = top;
        ember.quickDropThisJump = true;
        ember.grounded = false;
        ember.vy = CONFIG.platformDropVelocityY;
        break;
      case "pvpDemoBufferedBonk":
        setPvpAirborne(ember, middleRight.x + Math.round((middleRight.w - ember.w) / 2), 18, 0, 110, -1);
        ember.dropThroughPlatform = middleRight;
        ember.bufferedDropBonkArmed = true;
        break;
      case "pvpDemoSkyBonk":
        setPvpAirborne(ember, 245, -16, 0, 115, -1);
        ember.highestY = -24;
        ember.wentAboveMapThisJump = true;
        break;
      case "pvpDemoBufferedSky":
        setPvpAirborne(ember, middleRight.x + Math.round((middleRight.w - ember.w) / 2), -20, 0, 118, -1);
        ember.highestY = -28;
        ember.wentAboveMapThisJump = true;
        ember.dropThroughPlatform = middleRight;
        ember.bufferedDropBonkArmed = true;
        break;
      case "pvpDemoHighGround":
        setPvpAirborne(ember, top.x + Math.round((top.w - ember.w) / 2), 16, 0, 115, 1);
        break;
      case "pvpDemoRecoveryBonk":
        setPvpAirborne(ember, 405, 58, 0, 118, -1);
        break;
      case "pvpDemoBoostBonk":
        setPvpAirborne(p1, 225, 155, 0, -195, 1);
        setPvpAirborne(ember, 225, 100, 0, 105, -1);
        break;
      case "pvpDemoUnderBonk":
        setPvpAirborne(p1, middleLeft.x + Math.round((middleLeft.w - p1.w) / 2), CONFIG.groundY - p1.h, 0, -215, 1);
        break;
      case "pvpDemoAvoidUnder":
        setPvpAirborne(ember, middleLeft.x - 45, CONFIG.groundY - ember.h, 95, -55, 1);
        break;
      case "pvpDemoRebound":
        setPvpAirborne(p1, 150, 150, 95, -80, 1);
        setPvpAirborne(ember, 300, 150, -95, -80, -1);
        break;
      case "pvpDemoReboundCatch":
        setPvpAirborne(ember, 285, 145, -105, -75, -1);
        break;
      case "pvpDemoIntercept":
        setPvpAirborne(p1, 135, 150, 105, -80, 1);
        setPvpAirborne(ember, 315, 150, -105, -80, -1);
        break;
      case "pvpDemoDinnerSteal":
        setPvpAirborne(p1, 130, 150, 105, -75, 1);
        setPvpAirborne(ember, 300, 150, -105, -75, -1);
        break;
      default:
        break;
    }
  }

  function startPvpDemonstration() {
    const setup = tutorialStep()?.setup || "";
    tutorial.pvpDemoActive = true;
    tutorial.pvpDemoKind = setup;
    tutorial.pvpDemoBegun = false;
    tutorial.pvpDemoDuration = /DropHigh|BufferedSky|Recovery/.test(setup) ? 4.8 : 3.2;
    tutorial.pvpCaption = "WATCH EMBER!";
    tutorial.pvpCaptionUntil = performance.now() + 2400;
    beginPoofTransition({
      reason: "pvp-demo-entry",
      showFailure: false,
      preserveExistingFlies: false,
      armFlies: false,
      action: () => {
        configurePvpStep(tutorial.step);
        tutorial.pvpDemoActive = true;
        tutorial.pvpDemoKind = setup;
        tutorial.pvpDemoBegun = false;
        tutorial.pvpDemoStartedAt = performance.now() + 120;
      }
    });
  }

  function updatePvpDemonstration() {
    if (!tutorial.pvpDemoActive || tutorial.resetPending) return;
    const now = performance.now();
    if (!tutorial.pvpDemoBegun) {
      if (now < tutorial.pvpDemoStartedAt) return;
      beginPvpDemoMotion(tutorial.pvpDemoKind);
      return;
    }
    const elapsed = (now - tutorial.pvpDemoStartedAt) / 1000;
    const p1 = pvpPlayers[0];
    const ember = pvpPlayers[1];
    const setup = tutorial.pvpDemoKind;

    // Script the demonstration's follow-up action without interrupting physics.
    if (setup === "pvpDemoBonkCatch" && elapsed > 1.05 && ember.score === 0) {
      const target = flies.find(fly => fly?.tutorialAuthored && fly.state === "active");
      if (target) attemptPvpFlyCatch(ember, target, "body");
    }
    if (setup === "pvpDemoRecoveryBonk" && elapsed > 2.5 && tutorial.pvpPracticeCount < 2 && p1.stunTimer <= 0 && !p1.bonked) {
      tutorial.pvpPracticeCount = 2;
      setPvpAirborne(ember, p1.x, Math.max(18, p1.y - 70), 0, 112, -1);
    }
    if (setup === "pvpDemoReboundCatch" && elapsed > 1.15 && ember.score === 0) {
      const target = flies.find(fly => fly?.tutorialAuthored && fly.state === "active");
      if (target) attemptPvpFlyCatch(ember, target, "body");
    }
    if (setup === "pvpDemoDinnerSteal" && elapsed > 1.15 && ember.score === 0) {
      const target = flies.find(fly => fly?.tutorialAuthored && fly.state === "active");
      if (target) attemptPvpFlyCatch(ember, target, "body");
    }

    const settled = p1.grounded && ember.grounded && p1.stunTimer <= 0 && ember.stunTimer <= 0 &&
      !p1.bonked && !ember.bonked && !p1.tongue.active && !ember.tongue.active;
    if (elapsed >= tutorial.pvpDemoDuration && (settled || elapsed >= tutorial.pvpDemoDuration + 1.5)) {
      tutorial.pvpDemoActive = false;
      tutorial.pvpCaption = "";
      passStep();
    }
  }

  function startPvpFinalMatch() {
    tutorial.pvpFinalMatchStarted = true;
    tutorial.pvpFinalOutcome = null;
    tutorial.pvpCaption = "";
    game.mode = "pvp";
    game.onlineMode = false;
    game.pvpCpuEnabled = true;
    game.pvpCpuDifficulty = 5;
    game.pvpRoundGoalMode = "endless";
    game.pvpTimeLimitSeconds = 30;
    game.pvpBestOf = 1;
    game.pvpRoundWins = [0, 0];
    game.pvpRoundNumber = 1;
    game.pvpMatchWinnerIndex = null;
    game.selectedLevelId = "park";
    game.pvpSetupLevelId = "park";
    game.pvpSetupSkinIds[1] = "ember";
    applySelectedLevel();
    resetPvpGame();
    pvpPlayers[1].skinId = "ember";
    game.pvpSetupSkinIds[1] = "ember";
    tutorial.scoreStart = 0;
    tutorial.pvpScoreStart = 0;
    startResumeCountdown(false);
  }

  function configureStep(showDialogue = true, options = {}) {
    const preservedVisualPose = options.preserveVisualPose || null;
    try { window.RibbitRaceResetFinalCatchLabels?.(); } catch (_) {}
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
    if (tutorial.kind === "pvp" && pvpPlayers[1]) {
      addTutorialPoof(
        Number(pvpPlayers[1].x || 0) + Number(pvpPlayers[1].w || frog.w) / 2,
        Number(pvpPlayers[1].y || 0) + Number(pvpPlayers[1].h || frog.h) / 2,
        "out"
      );
      tutorial.pvpFrogsHidden = true;
    }
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
    const completedResetReason = tutorial.resetReason;

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
    clearTutorialCarryoverFlies();
    if (armFlies) {
      const setup = tutorialStep()?.setup || "";
      if (tutorial.kind === "pvp" && pvpFlyRevealDelayMs(setup) > 0) {
        schedulePvpFlyReveal(setup);
      } else {
        armTutorialFlies({ preserveKeys: preserveFlyKeys });
      }
    }
    tutorial.frogHidden = false;
    tutorial.pvpFrogsHidden = false;
    freezeControlledEntity();
    const entity = controlledTutorialEntity();
    addTutorialPoof(
      Number(entity?.x || 0) + Number(entity?.w || frog.w) / 2,
      Number(entity?.y || 0) + Number(entity?.h || frog.h) / 2,
      "in"
    );
    if (tutorial.kind === "pvp" && pvpPlayers[1]) {
      addTutorialPoof(
        Number(pvpPlayers[1].x || 0) + Number(pvpPlayers[1].w || frog.w) / 2,
        Number(pvpPlayers[1].y || 0) + Number(pvpPlayers[1].h || frog.h) / 2,
        "in"
      );
    }
    playTutorialPoofSound("in");

    if (showFailure) {
      tutorial.failureText = message;
      tutorial.failureFlashStartedAt = performance.now();
      tutorial.failureMessageUntil = tutorial.failureFlashStartedAt + tutorial.failureFlashDuration;
    }
    tutorial.enteredAt = performance.now();
    game.state = "playing";
    game.pauseHelpOpen = false;
    if (completedResetReason === "pause-retry") startResumeCountdown(false);
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
    const step = tutorialStep();
    tutorial.passPending = false;
    tutorial.passPendingAt = 0;
    if (!tutorial.successDialogueShown && Array.isArray(step?.successDialogue) && step.successDialogue.length) {
      tutorial.successDialogueShown = true;
      freezeControlledEntity();
      openDynamicDialogue(step.successDialogue, step.portrait || "thumbsup", true);
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
    game.tutorialActive = false;
    flies.length = 0;
    game.spawnQueue.length = 0;
    resetTutorialTongue();
    tutorial.completeScreen = true;
    game.winPending = false;
    game.buttonHeld = false;
    frog.charging = false;
    clearHeldInput();
    if (tutorial.kind === "pvp") {
      game.mode = "solo";
      game.skinId = pvpPlayers[0]?.skinId || game.skinId || "azure";
      game.selectedLevelId = "park";
      applySelectedLevel();
    }
    if (!alreadyWon || tutorial.kind === "pvp") {
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
      carryover.phase = 0;
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

  function nextStep() {
    const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
    if (tutorial.step >= steps.length - 1) {
      finish(true);
      return;
    }
    const previousSetup = tutorialStep()?.setup || "";
    const carryoverFlies = tutorial.kind === "solo" && previousSetup === "comboMixed"
      ? captureTutorialCarryoverFlies()
      : [];
    const visualPose = captureControlledPose();
    freezeControlledEntity();
    tutorial.step += 1;
    configureStep(true, { preserveVisualPose: visualPose });
    if (carryoverFlies.length) installTutorialCarryoverFlies(carryoverFlies);
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
      if (tutorial.bufferedJumpChainCount >= 1 && tutorial.bufferedJumpReleased) {
        passStep();
      } else if (attemptEnded && tutorial.jumpAttempts >= 3) {
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
    return Boolean(
      p1?.grounded && ember?.grounded &&
      !p1?.bonked && !ember?.bonked &&
      Number(p1?.stunTimer || 0) <= 0 && Number(ember?.stunTimer || 0) <= 0 &&
      !p1?.tongue?.active && !ember?.tongue?.active
    );
  }

  function drivePvpPracticeCpu(setup, now) {
    const p1 = pvpPlayers[0];
    const ember = pvpPlayers[1];
    if (!p1 || !ember) return;

    if (setup === "pvpBoostBonk") {
      if (p1.charging && tutorial.pvpCpuTriggerAt <= 0) tutorial.pvpCpuTriggerAt = now + 500;
      if (tutorial.pvpCpuTriggerAt > 0 && now >= tutorial.pvpCpuTriggerAt && ember.grounded && !ember.charging && !ember.inputHeld) {
        pressPvpButton(1, "tutorial");
      }
      if (ember.charging && now >= tutorial.pvpCpuTriggerAt + 520) releasePvpButton(1, "tutorial");
    }

    if (setup === "pvpUnderBonkTwo") {
      const platform = getPvpStandingPlatform(p1);
      if (platform && !platform.ground && ember.grounded && ember.stunTimer <= 0 && !ember.bonked &&
          now - tutorial.pvpLastPracticeEventAt > 1050) {
        tutorial.pvpLastPracticeEventAt = now;
        setPvpAirborne(
          ember,
          clamp(p1.x + (p1.w - ember.w) / 2, 0, W - ember.w),
          CONFIG.groundY - ember.h,
          0,
          -205,
          1
        );
      }
    }

    if (setup === "pvpReboundThree") {
      if (p1.inputHeld && !tutorial.pvpMirrorWasHeld && ember.grounded) {
        tutorial.pvpMirrorWasHeld = true;
        pressPvpButton(1, "tutorial");
      } else if (!p1.inputHeld && tutorial.pvpMirrorWasHeld) {
        tutorial.pvpMirrorWasHeld = false;
        releasePvpButton(1, "tutorial");
      }
    }

    if (setup === "pvpIntercept" || setup === "pvpDinnerSteal") {
      if (tutorial.pvpCpuTriggerAt <= 0) tutorial.pvpCpuTriggerAt = now + 500;
      if (now >= tutorial.pvpCpuTriggerAt && ember.grounded && !ember.inputHeld && !ember.charging) {
        ember.dir = setup === "pvpDinnerSteal" ? 1 : 1;
        pressPvpButton(1, "tutorial");
      }
      if (ember.charging && now >= tutorial.pvpCpuTriggerAt + 500) releasePvpButton(1, "tutorial");
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

    if (setup === "pvpBonkThree") {
      if (tutorial.pvpBonks >= 3 && pvpTutorialSettled()) passStep();
      else if (tutorial.pvpBonks > tutorial.pvpPracticeCount && tutorial.pvpBonks < 3 && pvpTutorialSettled() && !tutorial.resetPending) {
        tutorial.pvpPracticeCount = tutorial.pvpBonks;
        const layouts = [[95,260],[285,165],[165,330]];
        const layout = layouts[Math.min(layouts.length - 1, tutorial.pvpBonks)] || layouts[0];
        beginPoofTransition({
          reason: "next-pvp-bonk",
          showFailure: false,
          preserveExistingFlies: true,
          action: () => {
            positionPvp(p1, layout[0], CONFIG.groundY - p1.h, 1);
            positionPvp(ember, layout[1], CONFIG.groundY - ember.h, -1);
          }
        });
      }
      return;
    }

    if (setup === "pvpBonkCatch") {
      if (tutorial.pvpBonkCatchSucceeded && pvpTutorialSettled()) passStep();
      else if (tutorial.pvpBonkCatchArmed && ember.stunTimer <= 0 && !ember.bonked && !tutorial.pvpBonkCatchSucceeded) {
        failAttempt("CATCH THE FLY BEFORE EMBER RECOVERS");
      }
      return;
    }

    if (setup === "pvpDropLow" || setup === "pvpDropHigh") {
      if (tutorial.pvpBonks >= 1 && tutorial.pvpLastBonkQuickDrop && pvpTutorialSettled()) passStep();
      else if (tutorial.pvpBonks >= 1 && !tutorial.pvpLastBonkQuickDrop) failAttempt("USE A QUICK PLATFORM DROP FOR THE BONK");
      return;
    }

    if (setup === "pvpBufferedBonk") {
      if (tutorial.pvpBufferedBonkSeen && pvpTutorialSettled()) passStep();
      else if (tutorial.pvpBonks >= 1 && !tutorial.pvpBufferedBonkSeen) failAttempt("BUFFER THROUGH THE PLATFORM BEFORE THE BONK");
      return;
    }

    if (setup === "pvpSkyBonk") {
      if (tutorial.pvpSkyBonkSeen && pvpTutorialSettled()) passStep();
      else if (tutorial.pvpBonks >= 1 && !tutorial.pvpSkyBonkSeen) failAttempt("JUMP HIGH ABOVE THE MAP BEFORE THE BONK");
      return;
    }

    if (setup === "pvpBufferedSky") {
      if (tutorial.pvpSkyBonkSeen && tutorial.pvpBufferedBonkSeen && tutorial.pvpMaximumBonkSeen && pvpTutorialSettled()) passStep();
      else if (tutorial.pvpBonks >= 1 && (!tutorial.pvpSkyBonkSeen || !tutorial.pvpBufferedBonkSeen)) failAttempt("COMBINE A SKY BONK WITH A BUFFERED DROP");
      return;
    }

    if (setup === "pvpHighGround") {
      if (tutorial.pvpHighGroundBonkSeen && ember.grounded && pvpTutorialSettled()) passStep();
      return;
    }

    if (setup === "pvpRecoveryBonk") {
      if (tutorial.pvpBonks >= 2 && pvpTutorialSettled()) passStep();
      return;
    }

    if (setup === "pvpBoostBonk") {
      if (tutorial.pvpBoostedBonkSeen && pvpTutorialSettled()) passStep();
      return;
    }

    if (setup === "pvpUnderBonkTwo") {
      if (tutorial.pvpUnderBonks >= 2 && pvpTutorialSettled()) passStep();
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
      if (tutorial.pvpReboundCount >= 3 && pvpTutorialSettled()) passStep();
      else if (tutorial.pvpReboundCount > tutorial.pvpPracticeCount && tutorial.pvpReboundCount < 3 && pvpTutorialSettled() && !tutorial.resetPending) {
        tutorial.pvpPracticeCount = tutorial.pvpReboundCount;
        const layouts = [[110,300],[285,140],[150,315]];
        const layout = layouts[Math.min(layouts.length - 1, tutorial.pvpReboundCount)] || layouts[0];
        beginPoofTransition({
          reason: "next-pvp-rebound",
          showFailure: false,
          preserveExistingFlies: true,
          action: () => {
            positionPvp(p1, layout[0], CONFIG.groundY - p1.h, 1);
            positionPvp(ember, layout[1], CONFIG.groundY - ember.h, -1);
          }
        });
      }
      return;
    }

    if (setup === "pvpReboundCatch") {
      if (tutorial.pvpReboundCount >= 1 && Number(p1.score || 0) > tutorial.pvpScoreStart && pvpTutorialSettled()) passStep();
      return;
    }

    if (setup === "pvpIntercept") {
      if (Number(ember.score || 0) > tutorial.pvpScoreStart) failAttempt("REBOUND EMBER BEFORE SHE REACHES THE FLY");
      else if (tutorial.pvpInterceptSeen && pvpTutorialSettled()) passStep();
      return;
    }

    if (setup === "pvpDinnerSteal") {
      if (Number(ember.score || 0) > tutorial.pvpScoreStart) failAttempt("TURN EMBER AWAY, THEN TAKE THE FLY");
      else if (tutorial.pvpReboundCount >= 1 && Number(p1.score || 0) > tutorial.pvpScoreStart && pvpTutorialSettled()) passStep();
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

  function updateTutorial() {
    if (!tutorial.active) return;
    if (game.state === "paused" || game.state === "countdown") return;

    if (tutorial.resetPending) {
      if (performance.now() >= tutorial.resetAt) completePendingReset();
      return;
    }
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
      !tutorial.pvpDemoActive &&
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
    const pausedGoal = game.state === "paused";
    if (!tutorialPlayerHasControl() && !pausedGoal && !step.demonstration && step.setup !== "threeCatches" && step.setup !== "wrongFly") return [];
    if (tutorial.kind === "pvp") {
      if (step.setup === "pvpBonkThree") return ["BONK EMBER", `${Math.min(3, tutorial.pvpBonks)} / 3`];
      if (step.setup === "pvpUnderBonkTwo") return ["UNDER BONKS", `${Math.min(2, tutorial.pvpUnderBonks)} / 2`];
      if (step.setup === "pvpReboundThree") return ["REBOUNDS", `${Math.min(3, tutorial.pvpReboundCount)} / 3`];
      if (step.setup === "pvpFinalMatch") return ["30-SECOND MATCH", `${Number(pvpPlayers[0]?.score || 0)} - ${Number(pvpPlayers[1]?.score || 0)}`];
      return Array.isArray(step.goal) ? step.goal : [step.title];
    }
    if (step.setup === "longJumps") return ["LONG JUMPS", `${tutorial.longJumpStreak} / 3`];
    if (step.setup === "threeCatches") return ["MATCHES", `${Math.min(3, tutorial.sceneCatchCount)} / 3`];
    if (step.setup === "wrongFly") {
      if (tutorial.wrongFlyReturnedCaught) return ["RETURNED", "FOR THE MATCH"];
      if (tutorial.wrongFlyRightCaught) return ["RETURN FOR", `THE OLD FLY • ${Math.max(0, 4 - tutorial.jumpAttempts)} JUMPS LEFT`];
      if (tutorial.wrongFlyRightSpawned) return ["CATCH THE", `RIGHT FLY • ${Math.max(0, 4 - tutorial.jumpAttempts)} JUMPS LEFT`];
      return ["TRY THE WRONG", `FLY • ${Math.max(0, 4 - tutorial.jumpAttempts)} JUMPS LEFT`];
    }
    if (step.setup === "bufferJumpCharge") return ["BUFFERED JUMP", `${Math.min(1, tutorial.bufferedJumpChainCount)} / 1`];
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
    const portraitPanel = { x: 338, y: 6, w: 54, h: 54 };
    const namePlate = { x:textPanel.x + 8, y:textPanel.y + 7, w:48, h:10 };
    const textArea = {
      x: textPanel.x + 11,
      y: textPanel.y + 21,
      w: textPanel.w - 22,
      h: textPanel.h - 27
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

    const imageSize = portraitPanel.w - 10;
    const imageX = portraitPanel.x + 5;
    const imageY = portraitPanel.y + 5;
    ctx.fillStyle = "#168fd5";
    ctx.fillRect(imageX, imageY, imageSize, imageSize);

    if (portraitImage?.complete && portraitImage.naturalWidth > 0) {
      const oldSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      // Draw the complete source square without cropping. The supplied Ember
      // portraits are square, so this contain fit fills the entire image well
      // while keeping every edge of the artwork visible.
      const sourceW = portraitImage.naturalWidth;
      const sourceH = portraitImage.naturalHeight;
      const fit = Math.min(imageSize / sourceW, imageSize / sourceH);
      const drawW = Math.round(sourceW * fit);
      const drawH = Math.round(sourceH * fit);
      const drawX = imageX + Math.round((imageSize - drawW) / 2);
      const drawY = imageY + Math.round((imageSize - drawH) / 2);
      ctx.drawImage(portraitImage, 0, 0, sourceW, sourceH, drawX, drawY, drawW, drawH);
      ctx.imageSmoothingEnabled = oldSmoothing;
    } else {
      ctx.fillStyle = EMBER_SKIN.dark;
      ctx.fillRect(imageX + 5, imageY + 4, imageSize - 10, imageSize - 8);
    }

    // Ember's name now sits in the upper-left of the dialogue panel instead
    // of covering her portrait. The label text is mathematically centered in
    // its orange plate, while the full square portrait remains unobstructed.
    ctx.fillStyle = "rgba(42,22,12,.42)";
    ctx.fillRect(namePlate.x + 1, namePlate.y + namePlate.h - 1, namePlate.w - 2, 2);
    const nameFill = ctx.createLinearGradient(namePlate.x, namePlate.y, namePlate.x, namePlate.y + namePlate.h);
    nameFill.addColorStop(0, "#ffd777");
    nameFill.addColorStop(1, "#f39a3b");
    ctx.fillStyle = nameFill;
    ctx.fillRect(namePlate.x, namePlate.y, namePlate.w, namePlate.h);
    ctx.fillStyle = "#fff0a8";
    ctx.fillRect(namePlate.x + 3, namePlate.y + 2, namePlate.w - 6, 1);
    ctx.fillStyle = "#b55f24";
    ctx.fillRect(namePlate.x + 2, namePlate.y + namePlate.h - 2, namePlate.w - 4, 1);
    drawBitmapText("EMBER", namePlate.x + namePlate.w / 2, namePlate.y + 2, .58, "center", "#2f1b12");

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
    const scene = Number(tutorialStep()?.scene || (tutorial.step + 1));
    const total = tutorial.kind === "pvp"
      ? PVP_STEPS.reduce((max, step) => Math.max(max, Number(step?.scene || 0)), 0)
      : SOLO_STEPS.reduce((max, step) => Math.max(max, Number(step?.scene || 0)), 0);
    const label = `${tutorial.kind === "pvp" ? "VERSUS" : "PARK"} TUTORIAL ${scene}/${total}`;
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
      bufferJumpCharge: ["HOLD JUMP BEFORE LANDING", "RELEASE THE BUFFERED JUMP"],
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

  function drawPvpTutorialCaption() {
    if (tutorial.kind !== "pvp" || !tutorial.pvpCaption || performance.now() > tutorial.pvpCaptionUntil) return;
    const text = tutorial.pvpCaption;
    const width = Math.max(100, measureBitmapText(text, 1) + 28);
    const x = Math.round((W - width) / 2);
    const y = 62;
    ctx.save();
    ctx.fillStyle = "rgba(7,24,34,.34)";
    ctx.fillRect(x + 3, y + 3, width, 22);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(x, y, width, 22);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(x + 2, y + 2, width - 4, 18);
    ctx.fillStyle = EMBER_SKIN.mid;
    ctx.fillRect(x + 5, y + 4, width - 10, 3);
    drawBitmapText(text, x + width / 2, y + 9, 1, "center", EMBER_SKIN.dark);
    ctx.restore();
  }

  function drawTutorialOverlay() {
    if (!tutorial.active || game.state === "countdown") return;
    // The Current Goal card remains visible while paused. It sits below the
    // pause panel, so the pause menu still owns the top visual layer.
    if (game.state === "paused") {
      drawCurrentGoalHud();
      return;
    }
    drawCurrentGoalHud();
    drawTutorialSmoke();
    drawPvpTutorialCaption();
    drawTutorialReferenceHighlights();
    if (!tutorial.dialogueOpen) drawTutorialProgress();
    if (!tutorial.dialogueOpen && tutorialStep()?.setup !== "normalRound") drawGoalHowToTooltip();
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
    const panel = { x: 72, y: 16, w: 336, h: 106 };

    ctx.save();
    // Match the normal level-complete card: offset shadow, cross-shaped dark
    // frame, white paper interior, and a frog-themed header band.
    ctx.fillStyle = "rgba(12,26,33,0.38)";
    ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h);
    ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8);
    ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);

    ctx.fillStyle = skin.dark;
    ctx.fillRect(panel.x + 12, panel.y + 9, panel.w - 24, 43);
    ctx.fillStyle = skin.mid;
    ctx.fillRect(panel.x + 14, panel.y + 11, panel.w - 28, 38);
    ctx.fillStyle = skin.light;
    ctx.fillRect(panel.x + 17, panel.y + 13, panel.w - 34, 4);
    const title = "TUTORIAL COMPLETE!";
    const titleScale = Math.min(2.25, (panel.w - 28) / Math.max(1, measureBitmapText(title, 1)));
    drawBitmapText(title, W / 2, panel.y + 21, titleScale, "center", COLORS.white, skin.dark);

    drawBitmapText("RIBBIT READY!", W / 2, panel.y + 62, 1.25, "center", skin.dark);
    drawBitmapText("TRAINING COMPLETE", W / 2, panel.y + 82, .82, "center", "#59666b");

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
    // The long-jump warmup has no vocabulary objective, so the entire prompt
    // card stays blank instead of advertising Find the Match.
    if (tutorialStep()?.setup !== "longJumps") {
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

  // Capture real PvP tutorial interactions before the ordinary achievement
  // layer clears one-frame technique flags.
  const originalBonkPvpPlayerForTutorial = bonkPvpPlayer;
  bonkPvpPlayer = function(victim, stomper, ...rest) {
    const active = tutorial.active && tutorial.kind === "pvp";
    const buffered = Boolean(stomper?.bufferedDropBonkArmed);
    const quickDrop = Boolean(stomper?.quickDropThisJump);
    const sky = Boolean(stomper?.wentAboveMapThisJump || Number(stomper?.highestY) < 5);
    const boosted = Boolean(victim && Number(victim.vy) < -80);
    const startedOnPlatform = Boolean(victim && getPvpStandingPlatform(victim) && !getPvpStandingPlatform(victim)?.ground);
    const result = originalBonkPvpPlayerForTutorial.call(this, victim, stomper, ...rest);
    if (active && stomper?.index === 0 && victim?.index === 1) {
      tutorial.pvpBonks += 1;
      tutorial.pvpLastPracticeEventAt = performance.now();
      tutorial.pvpLastBonkQuickDrop = quickDrop;
      tutorial.pvpBufferedBonkSeen = tutorial.pvpBufferedBonkSeen || buffered;
      tutorial.pvpSkyBonkSeen = tutorial.pvpSkyBonkSeen || sky;
      tutorial.pvpMaximumBonkSeen = tutorial.pvpMaximumBonkSeen || isMaximumPvpBonkDuration(victim.bonkStunDuration);
      tutorial.pvpBoostedBonkSeen = tutorial.pvpBoostedBonkSeen || boosted;
      tutorial.pvpHighGroundBonkSeen = tutorial.pvpHighGroundBonkSeen || startedOnPlatform;
      if (tutorialStep()?.setup === "pvpBonkCatch") tutorial.pvpBonkCatchArmed = true;
    }
    return result;
  };

  const originalBonkPvpPlayerFromBelowForTutorial = bonkPvpPlayerFromBelow;
  bonkPvpPlayerFromBelow = function(stationary, hitter, ...rest) {
    const active = tutorial.active && tutorial.kind === "pvp";
    const result = originalBonkPvpPlayerFromBelowForTutorial.call(this, stationary, hitter, ...rest);
    if (active && stationary?.index === 0 && hitter?.index === 1) {
      tutorial.pvpUnderBonks += 1;
      tutorial.pvpLastPracticeEventAt = performance.now();
    }
    return result;
  };

  const originalBouncePvpPlayersSidewaysForTutorial = bouncePvpPlayersSideways;
  bouncePvpPlayersSideways = function(a, b, ...rest) {
    const active = tutorial.active && tutorial.kind === "pvp";
    const beforeA = a?.lastOpponentBounceType;
    const beforeB = b?.lastOpponentBounceType;
    const result = originalBouncePvpPlayersSidewaysForTutorial.call(this, a, b, ...rest);
    if (active && (a?.lastOpponentBounceType === "rebound" || b?.lastOpponentBounceType === "rebound") &&
        beforeA !== "rebound" && beforeB !== "rebound" && performance.now() - tutorial.pvpLastPracticeEventAt > 120) {
      tutorial.pvpReboundCount += 1;
      tutorial.pvpRebounds = tutorial.pvpReboundCount;
      tutorial.pvpLastPracticeEventAt = performance.now();
      if (tutorialStep()?.setup === "pvpIntercept") tutorial.pvpInterceptSeen = true;
    }
    return result;
  };

  const originalAttemptPvpFlyCatchForTutorial = attemptPvpFlyCatch;
  attemptPvpFlyCatch = function(player, targetFly, source = "body", ...rest) {
    const scoreBefore = Number(player?.score || 0);
    const result = originalAttemptPvpFlyCatchForTutorial.call(this, player, targetFly, source, ...rest);
    if (tutorial.active && tutorial.kind === "pvp" && result && player?.index === 0 && Number(player.score || 0) > scoreBefore) {
      if (tutorialStep()?.setup === "pvpBonkCatch" && tutorial.pvpBonkCatchArmed && pvpPlayers[1].stunTimer > 0) {
        tutorial.pvpBonkCatchSucceeded = true;
      }
    }
    return result;
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
    const isComboThreeFinish = activeSetup === "comboThree" && baseConditions && tutorial.catchEvents.filter(Boolean).length >= 2;
    if (isComboThreeFinish) return true;
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

    if (!wasCorrect && ["wrongFly", "comboMixed"].includes(activeSetup) && targetFly) {
      targetFly.tutorialHoldAfterSpit = true;
    }

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
        tutorial.promptHidden = false;
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

  // Once an authored wrong fly finishes its spit-back animation, keep it at
  // its authored point. This makes it clear that it was rejected rather than
  // collected, and it remains visible until the next setup poof.
  const originalAnimateFliesForTutorialHold = animateFlies;
  animateFlies = function(dt, ...rest) {
    const result = originalAnimateFliesForTutorialHold.call(this, dt, ...rest);
    if (tutorial.active && tutorial.kind === "solo") {
      for (const currentFly of flies) {
        if (!currentFly?.tutorialHoldAfterSpit || currentFly.state !== "active") continue;
        currentFly.phase = 0;
        currentFly.x = currentFly.baseX;
        currentFly.y = currentFly.baseY;
      }
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
    const result = tutorial.originalLaunchJump.apply(this, args);
    const actualLaunch = Number(game.jumps || 0) > jumpsBefore;
    if (active && actualLaunch) {
      const setup = tutorialStep()?.setup;
      tutorial.quickDrop = tutorial.quickDrop || quick;
      tutorial.lastJumpPower = power;
      tutorial.wallTouchedThisJump = false;
      tutorial.attemptStarted = true;
      tutorial.jumpAttempts += 1;
      tutorial.attemptWasAirborne = true;
      tutorial.attemptEnded = false;

      // A normal platform drop is a real jump attempt. A true buffered drop is
      // performed by the landing buffer and never calls launchJump, so it remains
      // excluded naturally. Airborne fidget taps also never reach this branch.
      if (quick) {
        if (setup === "longJumps") {
          failAttempt("PLATFORM DROPS DO NOT COUNT AS LONG JUMPS");
        } else if (setup === "doubleBuffer") {
          failAttempt("START WITH A CHARGED JUMP");
        }
        return result;
      }

      if (setup === "bufferJumpCharge" && tutorial.bufferedJumpChainCount >= 1) {
        tutorial.bufferedJumpReleased = true;
      }
      if (setup === "quickDrop") tutorial.quickDropWrongJump = true;
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
      (tutorialMovementLocked() || tutorial.pvpDemoActive || tutorial.passPending || tutorial.blockJumpUntilRelease)
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

  const originalDrawPvpPlayerForTutorial = drawPvpPlayer;
  drawPvpPlayer = function(player, ...rest) {
    if (tutorial.active && tutorial.kind === "pvp" && tutorial.pvpFrogsHidden) return;
    return originalDrawPvpPlayerForTutorial.call(this, player, ...rest);
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
      updateTutorialAmbient(dt, { animateFlies: true });
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
    leaderboardLevel: "any",
    leaderboardPage: 0,
    leaderboardRawPayload: null,
    leaderboardReplayRects: [],
    leaderboardDropdown: "",
    leaderboardHitRects: {},
    leaderboardHoverKey: "",
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
  const countedHatFlyObjects = new WeakSet();
  const LEADERBOARD_BUTTON = Object.freeze({ x: 34, y: 229, w: 28, h: 28 });
  const CUSTOM_BASE_BUTTON = Object.freeze({ x: 159, y: 67, w: 25, h: 22 });
  const PAUSE_FULLSCREEN_BUTTON = Object.freeze({ x: 426, y: 198, w: 20, h: 20 });
  const MAIN_PROFILE_BUTTON = Object.freeze({ x: 47, y: 211, w: 24, h: 24 });
  const MAIN_DEVICE_BUTTON = Object.freeze({ x: 74, y: 211, w: 24, h: 24 });

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
    if (window.RibbitRaceFinalCatchLabelsGone) return;
    return withLocalizedVocabulary(
      Number(currentFly?.vocabIndex),
      () => originalDrawFlyNameTagPolish8.call(this, currentFly, ...rest),
      "fly"
    );
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
    drawBitmapText(message, x + width / 2, y + 8, scale, "center", "#111a1e");
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
    ctx.fillStyle = active ? skin.light : "#ffffff";
    ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 2);

    // Two ribbons and a large circular gold medal. The silhouette intentionally
    // avoids the old trophy/cup shape so it reads as a medal at menu scale.
    const cx = Math.round(rect.x + rect.w / 2);
    const ribbonY = rect.y + 6;
    ctx.fillStyle = "#7d2638";
    ctx.fillRect(cx - 7, ribbonY, 5, 9);
    ctx.fillRect(cx + 2, ribbonY, 5, 9);
    ctx.fillStyle = "#ef7582";
    ctx.fillRect(cx - 6, ribbonY + 1, 3, 7);
    ctx.fillStyle = "#5c8ed0";
    ctx.fillRect(cx + 3, ribbonY + 1, 3, 7);

    const medalY = rect.y + 14;
    ctx.fillStyle = "#855018";
    ctx.fillRect(cx - 8, medalY + 2, 16, 8);
    ctx.fillRect(cx - 6, medalY, 12, 12);
    ctx.fillStyle = "#e2a62e";
    ctx.fillRect(cx - 6, medalY + 2, 12, 8);
    ctx.fillRect(cx - 4, medalY + 1, 8, 10);
    ctx.fillStyle = "#ffe37a";
    ctx.fillRect(cx - 4, medalY + 2, 6, 4);
    ctx.fillStyle = "#fff1ad";
    ctx.fillRect(cx - 3, medalY + 3, 2, 2);
    // Tiny centered star/award mark.
    ctx.fillStyle = "#855018";
    ctx.fillRect(cx - 1, medalY + 5, 3, 5);
    ctx.fillRect(cx - 3, medalY + 7, 7, 2);

    if (active) {
      ctx.fillStyle = skin.light;
      [[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy]) => ctx.fillRect(rect.x + dx, rect.y + dy, 2, 2));
    }
  }

  const LEADERBOARD_METRICS = Object.freeze([
    Object.freeze({ id:"time", label:"FASTEST TIME" }),
    Object.freeze({ id:"jumps", label:"FEWEST JUMPS" }),
    Object.freeze({ id:"endless", label:"60 SECOND ENDLESS" }),
    Object.freeze({ id:"flies", label:"MOST FLIES EATEN" }),
    Object.freeze({ id:"pvpwins", label:"MOST PVP WINS" })
  ]);
  const LEADERBOARD_LEVELS = Object.freeze(["any", "park", "swamp", "jungle", "pond", "lake", "garden"]);

  function leaderboardMetricDefinition(id = polish.leaderboardMetric) {
    return LEADERBOARD_METRICS.find((entry) => entry.id === id) || LEADERBOARD_METRICS[0];
  }

  function leaderboardSourceRows(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    for (const key of ["entries", "leaderboard", "rows", "records", "results", "data"]) {
      if (Array.isArray(payload[key])) return payload[key];
    }
    return [];
  }

  function leaderboardRecordForEntry(entry, metric, requestedLevel) {
    if (metric === "flies") {
      return {
        score:Number(entry.totalFlies ?? entry.flies ?? entry.value ?? entry.score) || 0,
        level:"ALL",
        date:entry.lastUpdated || entry.resultDate || entry.date || "",
        replayId:entry.replayId || entry.replay_id || null
      };
    }
    if (metric === "pvpwins") {
      return {
        score:Number(entry.pvpMatchWins ?? entry.wins ?? entry.value ?? entry.score) || 0,
        level:"ALL",
        date:entry.lastUpdated || entry.resultDate || entry.date || "",
        replayId:entry.replayId || entry.replay_id || null
      };
    }

    const records = entry?.records && typeof entry.records === "object" ? entry.records : null;
    if (!records) {
      const rowMetric = String(entry.metric || entry.category || metric).toLowerCase();
      const level = String(entry.level || entry.resultLevel || requestedLevel || "any").toLowerCase();
      if (rowMetric !== metric && !(metric === "pvpwins" && rowMetric === "wins")) return null;
      if (requestedLevel !== "any" && level !== requestedLevel) return null;
      return {
        score:entry.value ?? entry.time ?? entry.jumps ?? entry.score ?? entry.wins ?? null,
        level:level === "any" ? "ALL" : level,
        date:entry.date || entry.createdAt || entry.at || "",
        replayId:entry.replayId || entry.replay_id || entry.replay?.id || null
      };
    }

    const candidateLevels = requestedLevel === "any"
      ? ["park", "swamp", "jungle", "pond", "lake", "garden"]
      : [requestedLevel];
    const higherIsBetter = metric === "endless";
    let best = null;
    for (const levelId of candidateLevels) {
      const record = records[levelId] || {};
      const value = Number(record[metric]);
      if (!Number.isFinite(value) || value <= 0) continue;
      if (!best || (higherIsBetter ? value > best.score : value < best.score)) {
        best = {
          score:value,
          level:levelId,
          date:metric === "endless"
            ? (record.endlessDate || record.date || entry.lastUpdated || entry.resultDate || "")
            : (record.date || entry.lastUpdated || entry.resultDate || ""),
          replayId:record[`${metric}ReplayId`] || record.replayId || record.replay_id || entry.replayId || entry.replay_id || null
        };
      }
    }
    return best;
  }

  function normalizeLeaderboardRows(payload) {
    const metric = polish.leaderboardMetric;
    const level = polish.leaderboardLevel;
    const source = leaderboardSourceRows(payload);
    const higherIsBetter = ["endless", "flies", "pvpwins"].includes(metric);
    const rows = [];
    for (const entry of source) {
      const record = leaderboardRecordForEntry(entry, metric, level);
      if (!record || !Number.isFinite(Number(record.score)) || Number(record.score) <= 0) continue;
      rows.push({
        rank:0,
        name:String(entry.name || entry.displayName || entry.username || entry.player || "FROG"),
        classPeriod:String(entry.classPeriod || entry.period || ""),
        value:Number(record.score),
        metric,
        level:String(record.level || (level === "any" ? "ALL" : level)).toUpperCase(),
        date:String(record.date || ""),
        replayId:record.replayId || null,
        skinId:entry.skinId || entry.skin || entry.frogSkin || "azure",
        appearance:entry.appearance || entry.frogAppearance || entry.palette || null,
        isCurrent:Boolean(entry.isCurrent)
      });
    }
    rows.sort((a, b) => {
      if (a.value !== b.value) return higherIsBetter ? b.value - a.value : a.value - b.value;
      return a.name.localeCompare(b.name, undefined, { sensitivity:"base" });
    });
    let priorScore = null;
    let priorRank = 0;
    rows.forEach((row, index) => {
      if (priorScore !== null && row.value === priorScore) row.rank = priorRank;
      else { row.rank = index + 1; priorRank = row.rank; priorScore = row.value; }
    });
    return rows;
  }

  function rebuildLeaderboardRows() {
    polish.leaderboardEntries = normalizeLeaderboardRows(polish.leaderboardRawPayload || []);
    const pageCount = Math.max(1, Math.ceil(polish.leaderboardEntries.length / 5));
    polish.leaderboardPage = clamp(polish.leaderboardPage, 0, pageCount - 1);
  }

  async function loadLeaderboard(force = false) {
    polish.leaderboardLoading = true;
    polish.leaderboardError = "";
    try {
      let payload = !force ? polish.leaderboardRawPayload : null;
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      if (!payload) {
        for (const candidate of [
          () => cloud?.getLeaderboardData?.(force),
          () => cloud?.getLeaderboard?.(polish.leaderboardMetric),
          () => cloud?.loadLeaderboard?.(polish.leaderboardMetric),
          () => window.FriendsApiClient?.leaderboard?.(polish.leaderboardMetric)
        ]) {
          try {
            const value = await candidate();
            if (value && (Array.isArray(value) || typeof value === "object")) { payload = value; break; }
          } catch (_) {}
        }
      }
      if (!payload) {
        for (const path of ["/api/leaderboard?limit=100", "/api/records?limit=100"]) {
          try {
            const response = await fetch(path, { credentials:"include", cache:"no-store" });
            if (!response.ok) continue;
            payload = await response.json();
            if (payload) break;
          } catch (_) {}
        }
      }
      polish.leaderboardRawPayload = payload || [];
      rebuildLeaderboardRows();
      if (!polish.leaderboardEntries.length) polish.leaderboardError = "NO RECORDS YET";
    } catch (_) {
      polish.leaderboardError = "LEADERBOARD UNAVAILABLE";
      polish.leaderboardEntries = [];
    } finally {
      polish.leaderboardLoading = false;
    }
  }

  function openLeaderboard() {
    polish.previousState = game.state === "rrLeaderboard" ? "achievements" : game.state;
    game.state = "rrLeaderboard";
    polish.leaderboardPage = 0;
    polish.leaderboardDropdown = "";
    loadLeaderboard(false);
    safeCall(tone, 540, .05, .012, 35);
  }

  function closeLeaderboard() {
    game.state = polish.previousState === "rrLeaderboard" ? "achievements" : (polish.previousState || "achievements");
    polish.leaderboardDropdown = "";
    safeCall(tone, 330, .045, .010, -30);
  }

  function formatLeaderboardValue(row) {
    const numeric = Number(row?.value);
    if (!Number.isFinite(numeric)) return "—";
    if (row.metric === "time") {
      const minutes = Math.floor(numeric / 60);
      const seconds = (numeric - minutes * 60).toFixed(1).padStart(4, "0");
      return `${String(minutes).padStart(2, "0")}:${seconds}`;
    }
    if (row.metric === "jumps") return `${Math.floor(numeric)}`;
    return `${Math.floor(numeric)}`;
  }

  function formatLeaderboardDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
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

  function leaderboardFrogPalette(row) {
    const appearance = row?.appearance;
    if (appearance && typeof appearance === "object" && appearance.dark && appearance.mid && appearance.light && appearance.belly) {
      return appearance;
    }
    try { return getPvpSkinPalette(row?.skinId || "azure", "azure"); }
    catch (_) { return FROG_SKINS[row?.skinId] || FROG_SKINS.azure; }
  }

  function drawLeaderboardArrow(cx, cy, direction = 1, active = false) {
    ctx.fillStyle = active ? getSelectedSkin().dark : "#48555a";
    if (direction > 0) {
      ctx.fillRect(cx - 4, cy - 1, 7, 3); ctx.fillRect(cx + 1, cy - 4, 3, 9); ctx.fillRect(cx + 4, cy - 2, 2, 5);
    } else {
      ctx.fillRect(cx - 3, cy - 1, 7, 3); ctx.fillRect(cx - 3, cy - 4, 3, 9); ctx.fillRect(cx - 6, cy - 2, 2, 5);
    }
  }

  function drawLeaderboardDropdown(rect, label, value, open, key) {
    drawBitmapText(label, rect.x, rect.y - 11, .44, "left", "#48555a");
    ctx.fillStyle = "rgba(25,43,52,.22)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = open ? getSelectedSkin().dark : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    drawBitmapText(value, rect.x + 8, rect.y + 7, .54, "left", "#26363d");
    ctx.fillStyle = "#26363d";
    ctx.fillRect(rect.x + rect.w - 13, rect.y + 8, 7, 2);
    ctx.fillRect(rect.x + rect.w - 12, rect.y + 10, 5, 2);
    ctx.fillRect(rect.x + rect.w - 11, rect.y + 12, 3, 2);
    polish.leaderboardHitRects[key] = rect;
  }

  function drawLeaderboardScreen() {
    const skin = getSelectedSkin();
    const metricDef = leaderboardMetricDefinition();
    const levelLabel = polish.leaderboardLevel === "any" ? "ANY LEVEL" : polish.leaderboardLevel.toUpperCase();
    polish.leaderboardHitRects = {};
    polish.leaderboardReplayRects = [];

    ctx.fillStyle = "#edf5f7"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(8, 6, W - 16, H - 12);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(12, 10, W - 24, H - 20);

    const header = { x:20, y:14, w:440, h:38 };
    ctx.fillStyle = skin.dark; ctx.fillRect(header.x, header.y, header.w, header.h);
    ctx.fillStyle = skin.mid; ctx.fillRect(header.x + 3, header.y + 3, header.w - 6, header.h - 6);
    ctx.fillStyle = skin.light; ctx.fillRect(header.x + 7, header.y + 5, header.w - 14, 3);
    drawBitmapText("LEADERBOARD", W / 2, header.y + 11, 1.35, "center", COLORS.white, skin.dark);

    const close = { x:439, y:17, w:18, h:18 };
    ctx.fillStyle = COLORS.ink; ctx.fillRect(close.x, close.y, close.w, close.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(close.x + 2, close.y + 2, close.w - 4, close.h - 4);
    ctx.fillStyle = "#26363d";
    for (let i = 0; i < 6; i += 1) { ctx.fillRect(close.x + 5 + i, close.y + 5 + i, 2, 2); ctx.fillRect(close.x + 11 - i, close.y + 5 + i, 2, 2); }
    polish.leaderboardHitRects.close = close;

    const refresh = { x:13, y:72, w:22, h:22 };
    ctx.fillStyle = COLORS.ink; ctx.fillRect(refresh.x, refresh.y, refresh.w, refresh.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(refresh.x + 2, refresh.y + 2, refresh.w - 4, refresh.h - 4);
    drawBitmapText("↻", refresh.x + refresh.w / 2, refresh.y + 5, .90, "center", "#26363d");
    polish.leaderboardHitRects.refresh = refresh;

    const metricRect = { x:42, y:72, w:198, h:22 };
    const levelRect = { x:256, y:72, w:204, h:22 };
    drawLeaderboardDropdown(metricRect, "RANK BY", metricDef.label, polish.leaderboardDropdown === "metric", "metric");
    drawLeaderboardDropdown(levelRect, "LEVEL", ["flies", "pvpwins"].includes(polish.leaderboardMetric) ? "ALL LEVELS" : levelLabel, polish.leaderboardDropdown === "level", "level");

    const context = `ALL PLAYERS • ${metricDef.label} • ${["flies", "pvpwins"].includes(polish.leaderboardMetric) ? "ALL LEVELS" : levelLabel} • ${polish.leaderboardEntries.length} PLAYERS`;
    const contextScale = Math.min(.46, 440 / Math.max(1, measureBitmapText(context, 1)));
    drawBitmapText(context, W / 2, 101, contextScale, "center", "#59666b");

    const table = { x:13, y:110, w:447, h:104 };
    ctx.fillStyle = COLORS.ink; ctx.fillRect(table.x, table.y, table.w, table.h);
    ctx.fillStyle = skin.mid; ctx.fillRect(table.x + 2, table.y + 2, table.w - 4, 18);
    const columns = { rank:48, name:104, level:238, result:330, date:398, replay:444 };
    drawBitmapText("RANK", columns.rank, table.y + 7, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("NAME", columns.name, table.y + 7, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("LEVEL", columns.level, table.y + 7, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("RESULT", columns.result, table.y + 7, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("DATE", columns.date, table.y + 7, .47, "center", COLORS.white, skin.dark);

    const perPage = 5;
    const pageCount = Math.max(1, Math.ceil(polish.leaderboardEntries.length / perPage));
    polish.leaderboardPage = clamp(polish.leaderboardPage, 0, pageCount - 1);
    const rows = polish.leaderboardEntries.slice(polish.leaderboardPage * perPage, polish.leaderboardPage * perPage + perPage);
    if (polish.leaderboardLoading) {
      drawBitmapText("LOADING RECORDS...", W / 2, 159, .72, "center", "#48555a");
    } else if (!rows.length) {
      drawBitmapText(polish.leaderboardError || "NO RECORDS YET", W / 2, 159, .72, "center", "#48555a");
    } else {
      rows.forEach((row, offset) => {
        const y = table.y + 20 + offset * 16;
        ctx.fillStyle = row.isCurrent ? "#b8f5dc" : (offset % 2 ? "#eef2f3" : "#ffffff");
        ctx.fillRect(table.x + 2, y, table.w - 4, 16);
        ctx.fillStyle = "#d2dde0"; ctx.fillRect(table.x + 2, y + 15, table.w - 4, 1);
        drawBitmapText(String(row.rank || "—"), columns.rank, y + 5, .50, "center", "#26363d");
        const rowPalette = leaderboardFrogPalette(row);
        drawMiniFrogSwatchFacing(77, y + 4, rowPalette, .43, 1);
        const nameScale = Math.min(.50, 105 / Math.max(1, measureBitmapText(row.name.toUpperCase(), 1)));
        drawBitmapText(row.name.toUpperCase(), 89, y + 5, nameScale, "left", "#26363d");
        drawBitmapText(row.level, columns.level, y + 5, .48, "center", "#26363d");
        drawBitmapText(formatLeaderboardValue(row), columns.result, y + 5, .50, "center", "#26363d");
        drawBitmapText(formatLeaderboardDate(row.date), columns.date, y + 5, .45, "center", "#26363d");
        if (row.replayId) {
          const replayRect = { x:432, y:y + 1, w:22, h:14, row };
          drawReplayIcon(replayRect.x + replayRect.w / 2, replayRect.y + replayRect.h / 2, polish.leaderboardHoverKey === `replay:${offset}`);
          polish.leaderboardReplayRects.push(replayRect);
        }
      });
    }

    const prev = { x:164, y:228, w:64, h:24 };
    const next = { x:252, y:228, w:64, h:24 };
    for (const [key, rect, label] of [["prev", prev, "PREVIOUS"], ["next", next, "NEXT"]]) {
      const disabled = key === "prev" ? polish.leaderboardPage <= 0 : polish.leaderboardPage >= pageCount - 1;
      ctx.fillStyle = disabled ? "#aab5b8" : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      drawBitmapText(label, rect.x + rect.w / 2, rect.y + 8, .42, "center", disabled ? "#98a3a6" : "#48555a");
      polish.leaderboardHitRects[key] = rect;
    }
    drawBitmapText(`${polish.leaderboardPage + 1} / ${pageCount}`, W / 2, 236, .55, "center", "#26363d");

    // Dropdown menus are drawn last so they sit over the table like the existing DOM leaderboard.
    if (polish.leaderboardDropdown === "metric") {
      const x = metricRect.x, y = metricRect.y + metricRect.h, w = metricRect.w, h = 17;
      LEADERBOARD_METRICS.forEach((entry, index) => {
        const rect = { x, y:y + index * h, w, h };
        ctx.fillStyle = COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = entry.id === polish.leaderboardMetric ? skin.belly : (index % 2 ? "#edf1f2" : "#ffffff"); ctx.fillRect(rect.x + 2, rect.y + 1, rect.w - 4, rect.h - 2);
        drawBitmapText(entry.label, rect.x + 7, rect.y + 5, .43, "left", "#26363d");
        polish.leaderboardHitRects[`metric:${entry.id}`] = rect;
      });
    } else if (polish.leaderboardDropdown === "level" && !["flies", "pvpwins"].includes(polish.leaderboardMetric)) {
      const x = levelRect.x, y = levelRect.y + levelRect.h, w = levelRect.w, h = 17;
      LEADERBOARD_LEVELS.forEach((entry, index) => {
        const rect = { x, y:y + index * h, w, h };
        ctx.fillStyle = COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = entry === polish.leaderboardLevel ? skin.belly : (index % 2 ? "#edf1f2" : "#ffffff"); ctx.fillRect(rect.x + 2, rect.y + 1, rect.w - 4, rect.h - 2);
        drawBitmapText(entry === "any" ? "ANY LEVEL" : entry.toUpperCase(), rect.x + 7, rect.y + 5, .43, "left", "#26363d");
        polish.leaderboardHitRects[`level:${entry}`] = rect;
      });
    }
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

  function unlockHatFromLiveProgress(hatId, displayName) {
    let unlocked = [];
    try {
      const parsed = JSON.parse(localStorage.getItem("ribbitRaceUnlockedHatsV2") || "[]");
      unlocked = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (_) {}
    if (unlocked.includes(hatId)) return false;
    unlocked.push(hatId);
    try { localStorage.setItem("ribbitRaceUnlockedHatsV2", JSON.stringify(unlocked)); } catch (_) {}
    try {
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      cloud?.queueSave?.({ ribbitRaceUnlockedHatsV2: unlocked });
    } catch (_) {}
    try { queueAchievementToast?.({ type:"generic", text:`${displayName} UNLOCKED` }); } catch (_) {}
    try { tone(784, .08, .016, 100); tone(1047, .10, .012, 115, .06); } catch (_) {}
    return true;
  }

  function recordHatCatch(skinIdOverride = null) {
    const skinId = String(skinIdOverride || game.skinId || "azure").toLowerCase();
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
      statsProfile[`${skinId}FlyCount`] = Math.max(Number(statsProfile[`${skinId}FlyCount`]) || 0, progress.bySkin[skinId]);
      saveStatsProfile();
    } catch (_) {}

    if (skinId === "azure" && progress.bySkin.azure >= 75) unlockHatFromLiveProgress("top-hat", "TOP HAT");
    if (skinId === "plum" && progress.bySkin.plum >= 50) unlockHatFromLiveProgress("party-hat", "PARTY HAT");

    for (const fn of [
      typeof evaluateHatUnlocks === "function" ? evaluateHatUnlocks : null,
      typeof refreshHatUnlocks === "function" ? refreshHatUnlocks : null,
      typeof checkHatUnlocks === "function" ? checkHatUnlocks : null,
      typeof updateHatUnlocks === "function" ? updateHatUnlocks : null
    ]) safeCall(fn);
    try { if (game.customHatOpen) drawScene(); } catch (_) {}
    return progress.bySkin[skinId];
  }

  function shouldCountHatCatch(targetFly) {
    if (!targetFly || typeof targetFly !== "object") return false;
    if (countedHatFlyObjects.has(targetFly)) return false;
    if (targetFly.sandboxTest) return false;
    if (game.tutorialActive || window.RibbitRaceTutorialEngine?.active) return false;
    countedHatFlyObjects.add(targetFly);
    return true;
  }

  // Count at the actual successful catch functions. The old attemptFlyCatch
  // wrapper could miss catches when another wrapper returned early or when the
  // catch came from a bonus/tongue path.
  const originalCompleteCorrectCatchForHats = completeCorrectCatch;
  completeCorrectCatch = function(targetFly, ...rest) {
    const result = originalCompleteCorrectCatchForHats.call(this, targetFly, ...rest);
    if (result && shouldCountHatCatch(targetFly)) recordHatCatch(game.skinId);
    return result;
  };

  const originalCompleteBonusCatchForHats = completeBonusCatch;
  completeBonusCatch = function(targetFly, ...rest) {
    const result = originalCompleteBonusCatchForHats.call(this, targetFly, ...rest);
    if (result && shouldCountHatCatch(targetFly)) recordHatCatch(game.skinId);
    return result;
  };

  const originalCompletePvpCorrectCatchForHats = completePvpCorrectCatch;
  completePvpCorrectCatch = function(player, targetFly, ...rest) {
    const result = originalCompletePvpCorrectCatchForHats.call(this, player, targetFly, ...rest);
    const localIndex = game.onlineMode ? Number(OnlineVersus?.localIndex?.() || 0) : 0;
    const eligible = player && (game.onlineMode ? player.index === localIndex : (player.index === 0 || !game.pvpCpuEnabled));
    if (result && eligible && shouldCountHatCatch(targetFly)) recordHatCatch(player.skinId || game.pvpSetupSkinIds?.[player.index] || game.skinId);
    return result;
  };


  const originalAttemptFlyCatchPolish8 = attemptFlyCatch;
  attemptFlyCatch = function(targetFly, source = "body", ...rest) {
    return originalAttemptFlyCatchPolish8.call(this, targetFly, source, ...rest);
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
    try {
      finalizeCustomEditorForHistory();
      beginCustomColorHistoryTransaction();
      const palette = normalizeCustomPalette({
        body: skin.mid,
        belly: skin.belly,
        accents: skin.accents || skin.light
      });
      game.customDraftBody = palette.body;
      game.customDraftBelly = palette.belly;
      game.customDraftAccents = palette.accents;
      polish.baseSkinIndex = Math.max(0, getBaseSkinIds().indexOf(skinId));
      commitCustomColorHistoryTransaction();
      requestCustomPreviewRender();
      try { tone(650, .05, .012, 65); } catch (_) {}
      return true;
    } catch (error) {
      console.warn("Could not apply custom frog base", error);
      return false;
    }
  }

  const CUSTOM_BASE_PANEL = Object.freeze({ x:104, y:64, w:272, h:132 });
  const CUSTOM_BASE_CLOSE = Object.freeze({ x:353, y:67, w:18, h:18 });

  function getCustomBaseOptionRects() {
    const ids = getBaseSkinIds();
    return ids.map((id, index) => ({
      id,
      x:116 + (index % 4) * 63,
      y:98 + Math.floor(index / 4) * 44,
      w:56,
      h:40
    }));
  }

  function drawCustomBaseButton() {
    if (game.state !== "custom") return;
    const rect = CUSTOM_BASE_BUTTON;
    const draftSkin = getCustomDraftSkin();
    ctx.fillStyle = "rgba(25,43,52,.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = polish.customBaseOpen ? draftSkin.dark : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = polish.customBaseOpen ? draftSkin.belly : "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    // Template icon: two stacked cards with a miniature frog on the front card.
    ctx.fillStyle = "#94a4a9"; ctx.fillRect(rect.x + 9, rect.y + 5, 10, 9);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(rect.x + 11, rect.y + 7, 6, 5);
    ctx.fillStyle = draftSkin.dark; ctx.fillRect(rect.x + 5, rect.y + 8, 11, 9);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(rect.x + 7, rect.y + 10, 7, 5);
    drawMiniFrogSwatchFacing(rect.x + 11, rect.y + 11, draftSkin, .30, 1);
    if (!polish.customBaseOpen) return;

    const panel = CUSTOM_BASE_PANEL;
    const headerRight = CUSTOM_BASE_CLOSE.x - 4;
    ctx.fillStyle = "rgba(25,43,52,.34)"; ctx.fillRect(panel.x + 4, panel.y + 4, panel.w, panel.h);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(panel.x + 3, panel.y + 3, panel.w - 6, panel.h - 6);
    ctx.fillStyle = draftSkin.mid; ctx.fillRect(panel.x + 5, panel.y + 5, headerRight - panel.x - 8, 24);
    ctx.fillStyle = draftSkin.light; ctx.fillRect(panel.x + 9, panel.y + 8, headerRight - panel.x - 16, 3);
    drawBitmapText("SET BASE FROG", (panel.x + headerRight) / 2, panel.y + 10, .62, "center", COLORS.white, draftSkin.dark);

    ctx.fillStyle = COLORS.ink; ctx.fillRect(CUSTOM_BASE_CLOSE.x, CUSTOM_BASE_CLOSE.y, CUSTOM_BASE_CLOSE.w, CUSTOM_BASE_CLOSE.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(CUSTOM_BASE_CLOSE.x + 2, CUSTOM_BASE_CLOSE.y + 2, CUSTOM_BASE_CLOSE.w - 4, CUSTOM_BASE_CLOSE.h - 4);
    ctx.fillStyle = draftSkin.dark;
    for (let i = 0; i < 7; i += 1) {
      ctx.fillRect(CUSTOM_BASE_CLOSE.x + 5 + i, CUSTOM_BASE_CLOSE.y + 5 + i, 2, 2);
      ctx.fillRect(CUSTOM_BASE_CLOSE.x + 11 - i, CUSTOM_BASE_CLOSE.y + 5 + i, 2, 2);
    }

    const selectedId = getBaseSkinIds().find((id) => {
      const skin = FROG_SKINS[id];
      return normalizeHexColor(draftSkin.mid, "") === normalizeHexColor(skin.mid, "") &&
        normalizeHexColor(draftSkin.belly, "") === normalizeHexColor(skin.belly, "") &&
        normalizeHexColor(draftSkin.accents || draftSkin.light, "") === normalizeHexColor(skin.accents || skin.light, "");
    }) || "";
    for (const option of getCustomBaseOptionRects()) {
      const skin = FROG_SKINS[option.id];
      const selected = option.id === selectedId;
      ctx.fillStyle = selected ? COLORS.ink : "#9aa9ae";
      ctx.fillRect(option.x, option.y, option.w, option.h);
      ctx.fillStyle = selected ? mixHexColors(skin.belly, "#ffffff", .12) : "#f7fdff";
      ctx.fillRect(option.x + 2, option.y + 2, option.w - 4, option.h - 4);
      ctx.fillStyle = skin.light;
      ctx.fillRect(option.x + 5, option.y + 4, option.w - 10, 3);
      drawMiniFrogSwatchFacing(option.x + option.w / 2, option.y + 11, skin, .72, 1);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(option.x + 3, option.y + 27, option.w - 6, 10);
      const labelScale = Math.min(.40, (option.w - 8) / Math.max(1, measureBitmapText(skin.name || option.id.toUpperCase(), 1)));
      drawBitmapText((skin.name || option.id).toUpperCase(), option.x + option.w / 2, option.y + 29, labelScale, "center", skin.dark);
      if (selected) {
        ctx.fillStyle = skin.dark;
        ctx.fillRect(option.x + 3, option.y + 3, 2, 2);
        ctx.fillRect(option.x + option.w - 5, option.y + 3, 2, 2);
        ctx.fillRect(option.x + 3, option.y + option.h - 5, 2, 2);
        ctx.fillRect(option.x + option.w - 5, option.y + option.h - 5, 2, 2);
      }
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

  // Own exactly one contextual VS/CPU speech bubble. Local Versus (VS) offers a return
  // to CPU play; CPU mode offers a switch to Local Versus. Keeping this in the
  // core draw hook prevents the old generic helper from stacking a second box.
  const originalDrawPvpVsHoverTooltipPolish8 = typeof drawPvpVsHoverTooltip === "function" ? drawPvpVsHoverTooltip : null;
  drawPvpVsHoverTooltip = function() {
    if (OnlineVersus.isRoomMenu() || game.pvpSetupHoveredKey !== "vs") return;
    const message = game.pvpCpuEnabled
      ? "CLICK TO ENABLE LOCAL VERSUS"
      : "CLICK TO PLAY AGAINST CPU";
    const anchor = PVP_SETUP_UI.vsButton;
    const scale = .50;
    const width = Math.max(142, Math.min(196, measureBitmapText(message, scale) + 18));
    const height = 22;
    const centerX = anchor.x + anchor.w / 2;
    const x = clamp(Math.round(centerX - width / 2), 4, W - width - 4);
    const y = anchor.y - height - 10;
    ctx.save();
    ctx.fillStyle = "rgba(25,43,52,.30)"; ctx.fillRect(x + 2, y + 2, width, height);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    ctx.fillStyle = getSelectedSkin().light; ctx.fillRect(x + 5, y + 4, width - 10, 2);
    drawBitmapText(message, x + width / 2, y + 8, scale, "center", "#26363d");
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(Math.round(centerX) - 4, y + height, 9, 2);
    ctx.fillRect(Math.round(centerX) - 3, y + height + 2, 7, 2);
    ctx.fillRect(Math.round(centerX) - 2, y + height + 4, 5, 2);
    ctx.restore();
  };

  function immediateResetToStart() {
    try { flies.length = 0; } catch (_) {}
    try { game.spawnQueue.length = 0; } catch (_) {}
    try { tongue.active = false; tongue.targetFlyId = null; tongue.captured = false; } catch (_) {}
    try {
      if (game.mode === "pvp") {
        resetPvpGame();
        game.state = "playing";
      } else {
        resetGame(false);
        applySelectedLevel();
        Object.assign(frog, {
          x:Number(LEVELS?.[game.selectedLevelId]?.startX ?? 25) + Number(CONFIG.initialFrogOffsetX || 36),
          y:CONFIG.groundY - frog.h,
          vx:0, vy:0, grounded:true, charging:false, chargeHoldTime:0,
          departurePlatform:null, dropThroughPlatform:null
        });
        game.state = "playing";
      }
      clearHeldInput();
      startResumeCountdown(false);
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
    const criticalCatchActive = Boolean(game.soloCriticalCatchActive || game.pvpCriticalCatchActive);
    if (polish.priorCriticalCatch && !criticalCatchActive) {
      polish.labelFadeStartedAt = performance.now();
      // The cinematic already faded the plates out. Keep them permanently gone
      // after this point so there is no one-frame post-zoom reappearance.
      window.RibbitRaceFinalCatchLabelsGone = true;
    }
    polish.priorCriticalCatch = criticalCatchActive;
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
    // The core Online renderer owns its original split-color header and panel.
    drawCustomBaseButton();
    drawPauseFullscreenButton();
    drawWorldRecordNotice();
    drawPvpPauseButtonPolish8();
    return result;
  };

  function interactiveRectForPoint(point) {
    const insideAny = (items = []) => items.some((item) => item && pointIn(point, item));
    if (game.state === "main") {
      return insideAny([MAIN_PROFILE_BUTTON, MAIN_DEVICE_BUTTON, MAIN_UI.soloButton, MAIN_UI.pvpButton,
        MAIN_UI.frogButton, MAIN_UI.achievementsButton, MAIN_UI.statsButton]);
    }
    if (game.state === "title") {
      return insideAny([...(HOME_UI.levelButtons || []), HOME_UI.randomButton, HOME_UI.backButton,
        HOME_UI.tutorialButton, HOME_UI.settingsButton, HOME_UI.timeButton]);
    }
    if (game.state === "setup") {
      return insideAny([...(SETUP_UI.skinButtons || []), SETUP_UI.sandboxButton, SETUP_UI.customButton,
        SETUP_UI.hatButton, SETUP_UI.backButton]);
    }
    if (game.state === "custom") {
      const sliders = (CUSTOM_UI.sliders || []).map((item) => ({ x:item.hitX, y:item.hitY, w:item.hitW, h:item.hitH }));
      return insideAny([...(CUSTOM_UI.slotButtons || []), ...(CUSTOM_UI.partButtons || []), ...sliders,
        CUSTOM_UI.useButton, CUSTOM_UI.backButton, CUSTOM_UI.undoButton, CUSTOM_UI.redoButton,
        CUSTOM_BASE_BUTTON, polish.customBaseOpen ? CUSTOM_BASE_CLOSE : null,
        ...(polish.customBaseOpen ? getCustomBaseOptionRects() : [])]);
    }
    if (game.state === "achievements") {
      return insideAny([LEADERBOARD_BUTTON, ACHIEVEMENTS_UI.backButton, ACHIEVEMENTS_UI.pagePrevButton, ACHIEVEMENTS_UI.pageNextButton]);
    }
    if (game.state === "stats") {
      return insideAny([STATS_UI.backButton, STATS_UI.pagePrevButton, STATS_UI.pageNextButton]);
    }
    if (game.state === "rrLeaderboard") {
      return insideAny([...Object.values(polish.leaderboardHitRects || {}), ...polish.leaderboardReplayRects]);
    }
    if (game.state === "pvpSetup") {
      return insideAny([...(PVP_SETUP_UI.levelButtons || []), PVP_SETUP_UI.p1Selector, PVP_SETUP_UI.p2Selector,
        PVP_SETUP_UI.vsButton, PVP_SETUP_UI.cpuDifficultyButton, PVP_SETUP_UI.wifiButton,
        PVP_SETUP_UI.tutorialButton, PVP_SETUP_UI.startButton, PVP_SETUP_UI.backButton,
        PVP_SETUP_UI.settingsButton, PVP_SETUP_UI.timeButton]);
    }
    if (game.state === "pvpSettings") {
      return insideAny([...(PVP_SETTINGS_UI.rows || []), PVP_SETTINGS_UI.backButton]);
    }
    if (game.state === "paused") {
      return insideAny([PAUSE_UI.muteButton, PAUSE_UI.sliderHit, PAUSE_UI.continueButton, PAUSE_UI.restartButton,
        PAUSE_UI.homeButton, PAUSE_UI.helpButton, PAUSE_UI.helpCloseButton, PAUSE_FULLSCREEN_BUTTON]);
    }
    if (game.state === "won") {
      return insideAny([VICTORY_UI.replayButton, VICTORY_UI.homeButton, VICTORY_UI.pagePrevButton, VICTORY_UI.pageNextButton]);
    }
    if (["playing","countdown","pvpCelebration"].includes(game.state)) return pointIn(point, HUD_UI.pauseButton);
    return false;
  }

  canvas.addEventListener("pointermove", (event) => {
    const point = getCanvasPoint(event);
    try {
      if (OnlineVersus?.isMenuVisible?.() && !OnlineVersus?.isActive?.()) return;
    } catch (_) {}
    polish.mainHoverKey = "";
    if (game.state === "main") {
      if (pointIn(point, MAIN_PROFILE_BUTTON)) polish.mainHoverKey = "profile";
      else if (pointIn(point, MAIN_DEVICE_BUTTON)) polish.mainHoverKey = "device";
      else if (pointIn(point, MAIN_UI.achievementsButton)) polish.mainHoverKey = "achievements";
      else if (pointIn(point, MAIN_UI.statsButton)) polish.mainHoverKey = "stats";
    } else if (game.state === "achievements" && pointIn(point, LEADERBOARD_BUTTON)) {
      polish.mainHoverKey = "leaderboard";
    }
    polish.leaderboardHoverKey = "";
    if (game.state === "rrLeaderboard") {
      for (const [key, rect] of Object.entries(polish.leaderboardHitRects || {})) {
        if (pointIn(point, rect)) { polish.leaderboardHoverKey = key; break; }
      }
      const replayIndex = polish.leaderboardReplayRects.findIndex((item) => pointIn(point, item));
      if (replayIndex >= 0) polish.leaderboardHoverKey = `replay:${replayIndex}`;
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
      const hits = polish.leaderboardHitRects || {};
      if (pointIn(point, hits.close)) { closeLeaderboard(); return; }
      if (pointIn(point, hits.refresh)) { polish.leaderboardRawPayload = null; loadLeaderboard(true); return; }
      if (pointIn(point, hits.metric)) {
        polish.leaderboardDropdown = polish.leaderboardDropdown === "metric" ? "" : "metric";
        return;
      }
      if (pointIn(point, hits.level) && !["flies", "pvpwins"].includes(polish.leaderboardMetric)) {
        polish.leaderboardDropdown = polish.leaderboardDropdown === "level" ? "" : "level";
        return;
      }
      for (const entry of LEADERBOARD_METRICS) {
        if (pointIn(point, hits[`metric:${entry.id}`])) {
          polish.leaderboardMetric = entry.id;
          if (["flies", "pvpwins"].includes(entry.id)) polish.leaderboardLevel = "any";
          polish.leaderboardPage = 0;
          polish.leaderboardDropdown = "";
          rebuildLeaderboardRows();
          return;
        }
      }
      for (const level of LEADERBOARD_LEVELS) {
        if (pointIn(point, hits[`level:${level}`])) {
          polish.leaderboardLevel = level;
          polish.leaderboardPage = 0;
          polish.leaderboardDropdown = "";
          rebuildLeaderboardRows();
          return;
        }
      }
      const pageCount = Math.max(1, Math.ceil(polish.leaderboardEntries.length / 5));
      if (pointIn(point, hits.prev) && polish.leaderboardPage > 0) { polish.leaderboardPage -= 1; polish.leaderboardDropdown = ""; return; }
      if (pointIn(point, hits.next) && polish.leaderboardPage < pageCount - 1) { polish.leaderboardPage += 1; polish.leaderboardDropdown = ""; return; }
      const replay = polish.leaderboardReplayRects.find((item) => pointIn(point, item));
      if (replay) { playReplayById(replay.row.replayId, `${replay.row.name} • ${replay.row.metric}`); return; }
      polish.leaderboardDropdown = "";
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
      if (pointIn(point, CUSTOM_BASE_CLOSE)) {
        event.preventDefault(); event.stopImmediatePropagation();
        polish.customBaseOpen = false;
        return;
      }
      const option = getCustomBaseOptionRects().find((item) => pointIn(point, item));
      if (option) {
        event.preventDefault(); event.stopImmediatePropagation();
        applyCustomBaseSkin(option.id);
        polish.customBaseOpen = false;
        game.state = "custom";
        try { drawScene(); } catch (_) {}
        return;
      }
    }
    if (game.state === "paused" && game.onlineMode && pointIn(point, PAUSE_UI.homeButton)) {
      event.preventDefault(); event.stopImmediatePropagation(); clearQuickplayAndHome(); return;
    }
  }, { capture:true, passive:false });

  window.addEventListener("keydown", (event) => {
    if (game.state === "rrLeaderboard") {
      if (event.code === "Escape" || event.code === "Backspace") {
        event.preventDefault(); event.stopImmediatePropagation(); closeLeaderboard();
      }
      return;
    }
    if (event.code === "KeyR" && game.state === "paused") {
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
      #cloud-leaderboard, #leaderboard-overlay, #rr-palette-tools, #rr-custom-top-hat { display:none !important; }
      #game, canvas { cursor:default; }
      button:not(:disabled), select:not(:disabled), [role="button"]:not([aria-disabled="true"]), a[href] { cursor:pointer !important; }
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
  // Polish 10 restores the original canvas-native ONLINE panel from
  // 30-online-versus.js. The old overlay duplicated that menu, intercepted its
  // clicks, and could leave Quickplay active behind an unresponsive ONLINE
  // screen. Keep this legacy block inert so the real menu owns rendering/input.
  return;

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

// The core OnlineVersus renderer already positions one speech bubble above
// the exact hovered control. Keep the old generic helper disabled so it cannot
// draw a second tooltip over Player/CPU or menu buttons.
(() => {
  "use strict";
  return;
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
