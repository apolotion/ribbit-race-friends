// Ribbit Race tutorial responsibility: 120 tutorial config
"use strict";

const SOLO_SEEN_KEY = "rrFriendsEngineTutorialSoloSeenV8";
const PVP_SEEN_KEY = "rrFriendsEngineTutorialPvpSeenV8";
const TUTORIAL_BUILD = "2026.10.12-friends-polish-23";
const TUTORIAL_ACHIEVEMENT_ID = "tutorial-graduate";
const PVP_TUTORIAL_ACHIEVEMENT_ID = "versus-tutorial-graduate";
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
  "pvpDemoReboundCatch", "pvpReboundCatch",
  "pvpDemoIntercept",
  "pvpDemoDinnerSteal", "pvpDinnerSteal"
]);
const PVP_RETRY_EMBER_STATIONARY_SETUPS = new Set([
  "pvpBonkCatch", "pvpUnderBonkTwo", "pvpAvoidUnder", "pvpReboundCatch"
]);
const PVP_MOVING_PRACTICE_SETUPS = new Set([
  "pvpBoostBonk", "pvpUnderBonkTwo", "pvpReboundThree", "pvpIntercept", "pvpDinnerSteal"
]);
const TUTORIAL_SMOKE_OFFSETS = Object.freeze([
  [0, 0], [-7, -2], [7, -3], [-4, -8],
  [5, -10], [-10, -9], [11, -8], [0, -14]
]);

const FINAL_TUTORIAL_DIALOGUE = Object.freeze([
  "You did it, tadpole! You're officially Ribbit Ready!",
      "Enjoy Versus with the other frogs in the pond—and come find me whenever you want real competition!",
  "If you really want a challenge, come face me in Versus. I'll be waiting!"
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
  transitionHeldLineText: "",
  transitionHeldPortraitKey: "",
  chapterNavigationPending: false,
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
  preservePromptDuringReset: false,
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
  pvpHiddenPlayerIndex: null,
  pvpHiddenPlayerIndices: [],
  resetPvpPoofPlayers: [0, 1],
  deferredPoofOptions: null,
  debugSkipBuffer: "",
  pendingPvpVisualPoses: null,
  pendingPvpTargetPoses: null,
  pauseChapterHover: "",
  pauseChapterPreviewIndex: null,
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
  pvpPlayerSkinId: "azure",
  pvpPracticeLayoutIndex: 0,
  pvpPracticeCatchCount: 0,
  pvpScriptActions: [],
  pvpDemoStage: 0,
  pvpDemoBonkAt: 0,
  pvpDemoBonkCount: 0,
  pvpDemoBlockedBonkAt: 0,
  pvpDemoUnderBonkAt: 0,
  pvpPlayerAttemptWasAirborne: false,
  pvpPlayerOnlyReset: false,
  pvpEmberChargeStarted: false,
  pvpEmberLaunchStarted: false,
  pvpLastEmberPositionKey: "",
  pvpPendingPracticePoofAt: 0,
  pvpPracticeStartedAt: 0,
  pvpPracticeFailureAt: 0,
  pvpDemoBonkHandled: false,
  pvpDemoFollowupStarted: false,
  pvpDemoComparePhase: 0,
  pvpScriptBufferPlatform: null,
  pvpScriptBufferTriggered: false,
  pvpEmberJumpScheduledAt: 0,
  pvpLastP1Grounded: true,
  pvpLastEmberGrounded: true,
  pvpEmberFacingLock: -1,
  pvpPlayerScriptLocked: false,
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
      "That can turn the fly you skipped into the new correct match!",
      "Skip the wrong fly first and catch the matching one.",
      "When the clue changes, come back and catch the fly you left behind!"
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
      "If you get lucky, you might catch two flies in one jump!"
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
      "There's only one catch to this all-you-can-eat buffet...",
      "The only way that you can turn around is by bouncing off of a wall.",
      "Miss a fly, and you'll need to hit a wall to head back for it.",
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
      "Now what if dinner is downstairs?",
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
      "Let's see three bonks!"
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
      "You're really catching on!"
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
      "On second thought... I'll drop in and check for myself!"
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
      "That fall can add more stun time—and make you give up your spot.",
      "First, a full jump toward the wall. Then another full jump back toward the top!"
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
      "Use a full jump toward the wall, then another full jump back toward me.",
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
      "One second after this message closes, I'll start a maximum-charge jump.",
      "Time your leap to land on me as I spring upward."
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
      "You're learning how to ruin my plans. I'm very proud. Annoyed. But proud."
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
      "A frog standing on the ground or a platform stays put.",
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
      "Normally, Versus is best of three, with 60 seconds in each round.",
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
