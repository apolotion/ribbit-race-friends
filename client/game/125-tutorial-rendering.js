// Ribbit Race tutorial responsibility: 125 tutorial rendering
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
    !tutorial.pvpPlayerScriptLocked &&
    !tutorial.resetPending &&
    !tutorial.frogHidden &&
    !tutorial.pvpFrogsHidden &&
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
  // A scene's objective remains visible from its first dialogue frame through
  // its final poof so there is never a blank goal-card flash between lessons.
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

// Editorial emphasis belongs to an entire spoken sentence. Unlisted lines
// (including flavor text that repeats "bonk") intentionally remain white.
const TUTORIAL_EMPHASIS_BY_LINE = Object.freeze(
{
  "Hey there, tadpole! Welcome to Ribbit Race!": [
    "Ribbit Race"
  ],
  "I'm Ember - a Ribbit Race pro from this side of the pond.": [
    "Ember"
  ],
  "Catch the most flies and be the best!": [
    "most flies"
  ],
  "Hold the jump button to charge, then release to leap.": [
    "Hold",
    "charge",
    "release"
  ],
  "The more you charge, the farther you'll go - but timing is everything!": [
    "farther",
    "timing"
  ],
  "Hold too long, and you'll lose some of that distance.": [
    "too long"
  ],
  "Try releasing just as your charge gets close to full.": [
    "close to full"
  ],
  "Show me three long jumps in a row!": [
    "three long jumps"
  ],
  "Every fly has a term above its head.": [
    "term"
  ],
  "Your English clue appears at the bottom of the screen.": [
    "English clue",
    "bottom"
  ],
  "Catch the fly with the matching translation to score a point.": [
    "matching translation"
  ],
  "Let's get three points - one matching fly per jump!": [
    "one matching fly per jump"
  ],
  "You don't have to land right on top of a fly to catch it.": [
    "don't have to land"
  ],
  "Get close enough, and your tongue will automatically grab it.": [
    "close enough",
    "tongue"
  ],
  "Charge a long jump and let your tongue handle the rest!": [
    "long jump",
    "tongue"
  ],
  "There can be up to four flies on the screen at once, so check your clue!": [
    "four flies",
    "check your clue"
  ],
  "Catch the wrong fly, and you'll spit it right back out.": [
    "wrong fly",
    "spit"
  ],
  "Catch the right fly, and your English clue can update.": [
    "right fly",
    "English clue"
  ],
  "That can turn the fly you skipped into the new correct match!": [
    "new correct match"
  ],
  "Skip the wrong fly first and catch the matching one.": [
    "Skip",
    "matching one"
  ],
  "When the clue changes, come back and catch the fly you left behind!": [
    "clue changes",
    "come back"
  ],
  "Line up your leap, and you can catch several before you land!": [
    "several",
    "before you land"
  ],
  "Not every fly along the way will be a match, though.": [
    "Not every fly"
  ],
  "Try catching both of these flies in one jump.": [
    "both",
    "one jump"
  ],
  "Watch your English clue as you go.": [
    "English clue"
  ],
  "If you get lucky, you might catch two flies in one jump!": [
    "two flies",
    "one jump"
  ],
  "Line up your jump and catch all three matching flies before you land!": [
    "three matching flies",
    "before you land"
  ],
  "The only way that you can turn around is by bouncing off of a wall.": [
    "bouncing off of a wall"
  ],
  "Miss a fly, and you'll need to hit a wall to head back for it.": [
    "hit a wall"
  ],
  "Let's practice! Use your first jump to hit the wall and turn around.": [
    "first jump",
    "turn around"
  ],
  "Then jump back and catch the fly you passed.": [
    "jump back"
  ],
  "Jump into the wall, bounce back, and catch the fly before you touch the ground.": [
    "wall",
    "before you touch the ground"
  ],
  "Try to make it all happen in one jump!": [
    "one jump"
  ],
  "While you're standing on a platform, give the jump button a quick tap - press and release.": [
    "quick tap"
  ],
  "Instead of charging a jump, you'll drop straight through!": [
    "drop straight through"
  ],
  "Give it a try and catch the fly underneath you.": [
    "underneath"
  ],
  "You can buffer a jump charge by holding jump before you land.": [
    "buffer a jump charge",
    "holding jump before you land"
  ],
  "That lets you start charging instantly from the moment you touch the ground.": [
    "charging instantly"
  ],
  "Show me a buffered jump charge right after you land.": [
    "buffered jump charge"
  ],
  "You're able to buffer a platform drop too!": [
    "buffer a platform drop"
  ],
  "All you have to do is TAP jump just before landing.": [
    "TAP",
    "just before landing"
  ],
  "Time it right, and you'll drop straight through while keeping your momentum!": [
    "keeping your momentum"
  ],
  "Let's use a buffered drop to catch this fly!": [
    "buffered drop"
  ],
  "You can chain those drops together, too.": [
    "chain"
  ],
  "All you have to do is TAP jump just before each landing.": [
    "TAP",
    "before each landing"
  ],
  "Drop through one platform, then the next, and catch all three flies!": [
    "one platform",
    "the next",
    "three flies"
  ],
  "Catch five matching flies to complete a normal round.": [
    "five matching flies"
  ],
  "Each normal round lasts 60 seconds, and the frog with the most matching flies wins.": [
    "60 seconds",
    "most matching flies"
  ],
  "Normal matches are best of three, but this tutorial ends with one 30-second round.": [
    "best of three",
    "30-second"
  ],
  "I'll demonstrate each move first. When you see YOUR TURN, the controls are yours.": [
    "YOUR TURN"
  ],
  "Remember: catching the right flies is what wins rounds!": [
    "right flies"
  ],
  "First lesson: the bonk!": [
    "bonk"
  ],
  "Jump above me and land on my head.": [
    "above me",
    "land on my head"
  ],
  "Let's see three bonks!": [
    "three bonks"
  ],
  "Bonking me won't score you a point.": [
    "won't score"
  ],
  "Watch what I do after this next bonk.": [
    "after"
  ],
  "Bonk me, then catch the matching fly before I recover.": [
    "matching fly",
    "before I recover"
  ],
  "Sometimes, you can drop right in!": [
    "drop"
  ],
  "That's a drop bonk!": [
    "drop bonk"
  ],
  "Your turn. Let's try that same little drop.": [
    "drop"
  ],
  "One quick tap, and I'm coming down!": [
    "quick tap"
  ],
  "Give jump a quick tap—press and release—to drop through the platform.": [
    "quick tap"
  ],
  "Then land right on my head.": [
    "land"
  ],
  "Same quick tap, much bigger drop.": [
    "quick tap",
    "bigger drop"
  ],
  "Drop through the platform and land on me down here.": [
    "Drop through"
  ],
  "Watch how much longer it takes me to recover this time!": [
    "longer",
    "recover"
  ],
  "Remember your buffered drops? They work for bonks, too!": [
    "buffered drops"
  ],
  "Watch my landing.": [
    "landing"
  ],
  "Charge your jump to get above the platform.": [
    "above the platform"
  ],
  "Then press jump again just before you land on it.": [
    "press jump again",
    "just before you land"
  ],
  "Drop through and give me a surprise from above!": [
    "Drop through"
  ],
  "For a sky bonk, you jump high above the map, then land right on your rival!": [
    "sky bonk",
    "high above the map"
  ],
  "Charge a strong jump to get high above the map.": [
    "strong jump",
    "above the map"
  ],
  "Line up your leap so you come down right on my head.": [
    "come down"
  ],
  "No dropping straight off a platform—I want to see that big jump first!": [
    "big jump first"
  ],
  "Now, there's something that can get between you and a perfect sky bonk: platforms!": [
    "platforms"
  ],
  "Combine your sky bonk with a buffered platform drop.": [
    "sky bonk",
    "buffered platform drop"
  ],
  "Watch how I keep this fall going.": [
    "fall"
  ],
  "Jump high above the map, then come back down toward me.": [
    "high above the map"
  ],
  "Just before you land on the platform, press jump again to buffer a drop.": [
    "Just before you land",
    "buffer a drop"
  ],
  "Pass straight through and land your sky bonk on me down here!": [
    "straight through"
  ],
  "A bonk can knock you off a platform all the way to the ground.": [
    "all the way to the ground"
  ],
  "That fall can add more stun time—and make you give up your spot.": [
    "more stun time",
    "give up your spot"
  ],
  "Now I'll take the top platform. You start in the middle.": [
    "top platform",
    "middle"
  ],
  "Jump above me and land a bonk.": [
    "above me"
  ],
  "You can't keep bonking me while I'm already stunned.": [
    "can't keep bonking",
    "already stunned"
  ],
  "Bonk me once, use the wall to turn around, and time your return for after I recover.": [
    "wall",
    "after I recover"
  ],
  "Too early, and you won't get that second bonk!": [
    "Too early"
  ],
  "The harder you jump just before I bonk you, the farther I'll bounce!": [
    "harder you jump",
    "farther"
  ],
  "One second after this message closes, I'll start a maximum-charge jump.": [
    "One second",
    "maximum-charge jump"
  ],
  "Time your leap to land on me as I spring upward.": [
    "as I spring upward"
  ],
  "This next trick is called an under bonk.": [
    "under bonk"
  ],
  "Watch what happens when I get to this platform first.": [
    "platform first"
  ],
  "Jump onto this platform before I try to jump up past you.": [
    "before"
  ],
  "Then hold your spot while I recover and try again.": [
    "hold your spot"
  ],
  "Give me two under bonks without giving up your perch!": [
    "two under bonks"
  ],
  "You keep a low profile and slip underneath.": [
    "low profile",
    "underneath"
  ],
  "Watch my feet on this one.": [
    "feet"
  ],
  "Tap jump very quickly to get underneath and past me.": [
    "Tap jump very quickly",
    "past me"
  ],
  "Remember: quick taps, not charged jumps!": [
    "quick taps",
    "not charged jumps"
  ],
  "When we meet side-to-side in the air, we don't bonk. We rebound!": [
    "side-to-side",
    "rebound"
  ],
  "Watch what happens to our directions.": [
    "directions"
  ],
  "I'll jump when you do.": [
    "when you do"
  ],
  "Meet me at the same height and aim for my side, not my head.": [
    "same height",
    "side"
  ],
  "Show me three clean rebounds!": [
    "three clean rebounds"
  ],
  "Only the airborne frog turns around.": [
    "Only the airborne frog"
  ],
  "A frog standing on the ground or a platform stays put.": [
    "stays put"
  ],
  "Watch how I use that to reach a fly behind me!": [
    "behind me"
  ],
  "Your matching fly is behind you.": [
    "behind you"
  ],
  "Jump into my side, rebound, and catch it on the way back!": [
    "side",
    "rebound",
    "way back"
  ],
  "Sometimes, I'd rather send you away from dinner!": [
    "away from dinner"
  ],
  "Watch how I cut off your path to that fly.": [
    "cut off your path"
  ],
  "I'm going for that fly as soon as we're back in position.": [
    "as soon as we're back"
  ],
  "Time your jump to meet me side-to-side before I reach it.": [
    "side-to-side",
    "before I reach it"
  ],
  "You don't have to catch it—just send me the wrong way!": [
    "don't have to catch it"
  ],
  "Stopping your catch is useful.": [
    "Stopping your catch"
  ],
  "Turning it into my catch? Even better!": [
    "my catch"
  ],
  "Rebound off me to turn me away from the matching fly.": [
    "Rebound",
    "turn me away"
  ],
  "Then grab it yourself before I make it back!": [
    "grab it yourself"
  ],
  "Normally, Versus is best of three, with 60 seconds in each round.": [
    "best of three",
    "60 seconds"
  ],
  "For this tutorial, we're playing one 30-second round. Best of one—this round decides our match!": [
    "30-second round",
    "Best of one"
  ],
  "Catch more matching flies than I do, and you beat your coach.": [
    "more matching flies"
  ],
  "Bonks buy you time. Rebounds change your direction.": [
    "time",
    "direction"
  ],
  "More height, more stun time.": [
    "More height",
    "more stun time"
  ],
  "The buffer keeps the platform from stopping my fall.": [
    "buffer"
  ],
  "High sky bonk plus a buffered drop can give maximum bonk stun time!": [
    "maximum bonk stun time"
  ],
  "You jumped into me from underneath while I held the platform.": [
    "underneath",
    "held the platform"
  ],
  "The trick is to tap jump very quickly.": [
    "tap jump very quickly"
  ],
  "Don't hold it to charge—just a quick press and release.": [
    "Don't hold",
    "press and release"
  ],
  "We both turned around—without touching a wall!": [
    "both turned around"
  ],
  "No stun that time. Just a change of plans.": [
    "No stun"
  ],
  "First, a full jump toward the wall. Then another full jump back toward the top!": [
    "full jump",
    "wall",
    "back toward the top"
  ],
  "Use a full jump toward the wall, then another full jump back toward me.": [
    "full jump",
    "wall",
    "back toward me"
  ]
});

function tutorialDialogueEmphasisRanges(line) {
  const spoken = String(line || "");
  const text = normalizeBitmapText(spoken).trim().toUpperCase();
  const selected = TUTORIAL_EMPHASIS_BY_LINE[spoken] || [];
  const ranges = [];
  for (const phrase of selected) {
    const needle = normalizeBitmapText(phrase).toUpperCase();
    let from = 0;
    while (needle && from < text.length) {
      const start = text.indexOf(needle, from);
      if (start < 0) break;
      const end = start + needle.length;
      // Whole words only: EMBER must never color the middle of REMEMBER.
      if (!/[A-Z0-9]/.test(text[start - 1] || "") && !/[A-Z0-9]/.test(text[end] || "")) ranges.push([start, end]);
      from = end;
    }
  }
  return ranges.sort((a,b) => a[0] - b[0]);
}

function drawEmberDialogueLine(fullLine, visibleText, x, y, scale, spokenLine = fullLine, lineOffset = 0) {
  const ranges = tutorialDialogueEmphasisRanges(spokenLine)
    .map(([start,end]) => [Math.max(0,start-lineOffset), Math.min(fullLine.length,end-lineOffset)])
    .filter(([start,end]) => end > start);
  const visible = String(visibleText || "");
  let cursor = 0, drawX = x;
  while (cursor < visible.length) {
    const orangeRange = ranges.find(([start,end]) => cursor >= start && cursor < end);
    const nextBoundary = orangeRange
      ? Math.min(visible.length, orangeRange[1])
      : Math.min(visible.length, ...ranges.filter(([start]) => start > cursor).map(([start]) => start));
    const chunk = visible.slice(cursor,nextBoundary);
    // The accent-color boundary after "my catch" lands directly against the
    // white question mark. Give punctuation one pixel of breathing room.
    if (chunk.startsWith("?") && cursor > 0) drawX += Math.max(1, Math.round(scale * 2));
    // Word-chunk width calculation trims some trailing bitmap whitespace.
    // Keep a visible gap between "a" and highlighted "quick tap".
    if (orangeRange && cursor > 0 && visible[cursor - 1] === " ") drawX += Math.max(1, Math.round(scale * 2));
    drawBitmapText(chunk,drawX,y,scale,"left",orangeRange ? "#ff9b45" : COLORS.white);
    drawX += measureBitmapText(chunk,scale);
    cursor = nextBoundary;
  }
}

function drawTutorialDialogue() {
  if (!tutorial.active || !tutorial.dialogueOpen ||
      tutorial.dialogueHiddenDuringPoof || game.state === "countdown") return;

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

  if (!holdingPreviousLine && now < tutorial.dialogueLineStartedAt) return;

  if (!holdingPreviousLine && game.state !== "paused" && !tutorial.dialogueForceComplete) {
    // Delayed first lines and new chapters must not inherit the old line's
    // sound timer. One chirp per fresh group of visible characters.
    if (visibleCount > tutorial.dialogueTalkCharCount &&
        now >= tutorial.dialogueTalkBlipAt && visibleCount > 0) {
      const toneStep = visibleCount % 4;
      const frequency = [980, 1060, 1120, 1020][toneStep];
      try { tone(frequency, 0.026, 0.011, 20); } catch (_) {}
      tutorial.dialogueTalkBlipAt = now + 54;
    }
    tutorial.dialogueTalkCharCount = Math.max(tutorial.dialogueTalkCharCount, visibleCount);
  }

  // Reference baseline: a long dark-navy text window with layered black,
  // cyan, and white pixel framing. Ember's complete square portrait sits in
  // its own attached card, with the nameplate beneath the picture instead of
  // covering any part of it.
  // Center the complete dialogue group between the left and right scoreboards.
  // The group spans x=90..389, leaving an equal visual gutter on both sides.
  const textPanel = { x: 90, y: 6, w: 239, h: 54 };
  const portraitPanel = { x: 335, y: 6, w: 54, h: 54 };
  const namePlate = { x:textPanel.x + 7, y:textPanel.y + 7, w:48, h:10 };
  const textArea = {
    x: textPanel.x + 11,
    y: textPanel.y + 22,
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
  // One-line and two-line messages always begin on the same top baseline.
  // This avoids making the reader's eyes jump vertically between lines.
  const textTop = Math.round(textArea.y);

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
  const normalizedSpokenLine = normalizeBitmapText(fullLine).trim();
  let searchOffset = 0;
  wrappedLines.forEach((wrappedLine, index) => {
    const lineOffset = Math.max(searchOffset, normalizedSpokenLine.indexOf(wrappedLine, searchOffset));
    searchOffset = lineOffset + wrappedLine.length;
    const visibleOnLine = wrappedLine.slice(0, Math.max(0, Math.min(wrappedLine.length, remaining)));
    drawEmberDialogueLine(
      wrappedLine,
      visibleOnLine,
      textArea.x,
      textTop + index * lineHeight,
      textScale, fullLine, lineOffset
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
  const clouds = tutorial.smokeClouds;
  if (!clouds.length) return;
  const now = performance.now();
  let writeIndex = 0;
  for (let readIndex = 0; readIndex < clouds.length; readIndex += 1) {
    const cloud = clouds[readIndex];
    if (now - cloud.born < 520) clouds[writeIndex++] = cloud;
  }
  clouds.length = writeIndex;

  ctx.save();
  for (const cloud of clouds) {
    const progress = clamp((now - cloud.born) / 520, 0, 1);
    const alpha = (1 - progress) * .88;
    const spread = 1 + progress * 1.8;
    ctx.globalAlpha = alpha;
    for (let index = 0; index < TUTORIAL_SMOKE_OFFSETS.length; index += 1) {
      const [offsetX, offsetY] = TUTORIAL_SMOKE_OFFSETS[index];
      const size = Math.max(2, Math.round((index % 3 === 0 ? 6 : 4) * (1 + progress * .55)));
      const x = Math.round(cloud.x + offsetX * spread - size / 2);
      const y = Math.round(cloud.y + offsetY * spread - size / 2);
      ctx.fillStyle = index % 2 ? "#d9e1e4" : "#f7fdff";
      ctx.fillRect(x, y, size, size);
      if (size >= 5) {
        ctx.fillStyle = "#aebcc2";
        ctx.fillRect(x + size - 2, y + size - 2, 2, 2);
      }
    }
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
  if (!tutorial.active || tutorial.kind === "pvp") return;
  const scene = Number(tutorialStep()?.scene || (tutorial.step + 1));
  const total = tutorial.kind === "pvp"
    ? PVP_STEPS.reduce((max, step) => Math.max(max, Number(step?.scene || 0)), 0)
    : SOLO_STEPS.reduce((max, step) => Math.max(max, Number(step?.scene || 0)), 0);
  const title = String(tutorialStep()?.title || "TUTORIAL").toUpperCase();
  const sceneLabel = `${scene}/${total}`;
  // Keep chapter context directly above the Find the Match HUD so it never
  // collides with Ember dialogue or the WATCH EMBER timer-area caption.
  const w = 172, x = Math.round(W / 2 - w / 2), y = 219;
  ctx.save();
  ctx.globalAlpha = .94;
  ctx.fillStyle = "rgba(7,24,34,.30)";
  ctx.fillRect(x + 2, y + 2, w, 13);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x, y, w, 13);
  ctx.fillStyle = tutorial.kind === "pvp" ? "#bd2d45" : "#0f9fbb";
  ctx.fillRect(x + 2, y + 2, w - 4, 9);
  const titleScale = Math.min(.39, 134 / Math.max(1, measureBitmapText(title, 1)));
  drawBitmapText(title, x + 6, y + 4, titleScale, "left", COLORS.white);
  drawBitmapText(sceneLabel, x + w - 7, y + 4, .38, "right", COLORS.white);
  ctx.restore();
}

function getTutorialGoalRect() {
  // Match the vocabulary card's y-level and the normal TIME/JUMPS/BEST width.
  // The two-pixel gutter after x=326 prevents either black outline from
  // painting over the other.
  return { x:328, y:234, w:152, h:33 };
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
    pvpOffense: ["REBOUND OFF EMBER", "THEN CATCH THE FLY"],
    pvpBonkThree: ["LAND ON EMBER'S HEAD 3 TIMES", "KEEP YOUR COMPLETED BONKS"],
    pvpBonkCatch: ["BONK EMBER FROM ABOVE", "CATCH THE MATCH BEFORE RECOVERY"],
    pvpDropLow: ["QUICK TAP WHILE ON LOW PERCH", "DROP DIRECTLY ONTO EMBER"],
    pvpDropHigh: ["QUICK TAP ON THE TOP PERCH", "DROP ON EMBER FOR LONG STUN"],
    pvpBufferedBonk: ["CHARGE ABOVE THE PERCH", "TAP JUST BEFORE LANDING: BONK"],
    pvpSkyBonk: ["MAX CHARGE HIGH ABOVE THE MAP", "AIM YOUR DESCENT AT EMBER"],
    pvpBufferedSky: ["LAUNCH HIGH FROM TOP PLATFORM", "BUFFER THROUGH, BONK EMBER"],
    pvpHighGround: ["START ON THE LOWER-LEFT PERCH", "KNOCK EMBER OFF THE TOP"],
    pvpRecoveryBonk: ["BONK, THEN HIT THE WALL", "BONK ONLY AFTER SHE RECOVERS"],
    pvpBoostBonk: ["BONK JUST AS EMBER LAUNCHES", "USE THE BOOST TO REACH A FLY"],
    pvpUnderBonkTwo: ["HOLD THE CENTER LOW PLATFORM", "UNDER-BONK EMBER TWICE"],
    pvpAvoidUnder: ["USE FIVE TINY QUICK-TAP HOPS", "SLIP BELOW EMBER WITHOUT A BONK"],
    pvpReboundThree: ["MEET EMBER SIDEWAYS IN THE AIR", "LAND THREE REBOUNDS TOTAL"],
    pvpReboundCatch: ["REBOUND FROM STATIONARY EMBER", "CATCH MATCHING FLY IN ONE JUMP"],
    pvpIntercept: ["REBOUND TO CHANGE EMBER'S PATH", "STOP HER BEFORE THE FLY"],
    pvpDinnerSteal: ["REBOUND EMBER AWAY FROM FLY", "CATCH IT BEFORE YOU LAND"],
    pvpFinalMatch: ["READ THE ENGLISH PROMPT", "OUTSCORE EMBER BEFORE 30 SEC"],
    pvpDemoBonk: ["WATCH EMBER'S CHARGED LEAP", "SHE LANDS ON YOUR HEAD"],
    pvpDemoBonkCatch: ["EMBER BONKS THEN RETURNS", "FOR THE MATCHING FLY"],
    pvpDemoDropLow: ["EMBER TAPS JUMP ON A PERCH", "THEN DROPS ONTO YOUR HEAD"],
    pvpDemoDropHigh: ["EMBER DROPS FROM THE TOP", "NOTICE THE LONGER STUN"],
    pvpDemoBufferedBonk: ["EMBER CHARGES ONE JUMP", "BUFFERS A DROP BEFORE LANDING"],
    pvpDemoSkyBonk: ["EMBER JUMPS ABOVE THE SKY", "AND BONKS AS SHE FALLS"],
    pvpDemoBufferedSky: ["EMBER LAUNCHES ABOVE THE MAP", "THEN BUFFERS THROUGH A PERCH"],
    pvpDemoHighGround: ["WATCH EMBER LEAP FROM BELOW", "AND KNOCK YOU OFF THE TOP"],
    pvpDemoRecoveryBonk: ["WATCH THE FIRST BONK", "THE WALL TURNS EMBER BACK"],
    pvpDemoBoostBonk: ["WATCH HOW A BONK BOOSTS JUMPS", "TOWARD THE MATCHING FLY"],
    pvpDemoUnderBonk: ["EMBER STANDS ON THE PLATFORM", "YOU JUMP INTO HER FROM BELOW"],
    pvpDemoAvoidUnder: ["WATCH FIVE GENTLE HOPS", "EMBER SLIPS UNDER THE PERCH"],
    pvpDemoRebound: ["WATCH BOTH FROGS MEET SIDEWAYS", "BOTH CHANGE DIRECTIONS"],
    pvpDemoReboundCatch: ["EMBER BOUNCES OFF YOUR SIDE", "THEN CATCHES THE FLY BEHIND"],
    pvpDemoIntercept: ["EMBER DEFLECTS YOUR LEAP", "AND KEEPS YOU FROM THE FLY"],
    pvpDemoDinnerSteal: ["EMBER REBOUNDS TO STEAL", "YOUR MATCHING FLY"]
  };
  return instructions[setup] || ["READ EMBER'S INSTRUCTIONS", "THEN TRY THE SHOWN TECHNIQUE"];
}

function drawGoalHowToTooltip() {
  if (!tutorial.active || !tutorial.goalHovered || !tutorialPlayerHasControl() || ["normalRound"].includes(tutorialStep()?.setup)) return;
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
  if (!tutorial.active || (tutorial.kind === "pvp" && tutorialStep()?.setup === "pvpFinalMatch")) return;
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
  const holdUntilDialogue = !tutorial.dialogueOpen &&
    (tutorial.pvpCaption === "WATCH EMBER!" || tutorial.pvpCaption === "YOUR TURN!");
  if (tutorial.kind !== "pvp" || !tutorial.pvpCaption || tutorial.dialogueOpen ||
      (!holdUntilDialogue && performance.now() > tutorial.pvpCaptionUntil)) return;
  const text = tutorial.pvpCaption;
  // Replace the normal center timer during lesson scenes. The final 30-second
  // match restores the stock timer and no tutorial caption is drawn here.
  if (tutorialStep()?.setup === "pvpFinalMatch") return;
  const width = 96;
  const x = Math.round((W - width) / 2);
  const y = 7;
  ctx.save();
  ctx.fillStyle = "rgba(7,24,34,.34)";
  ctx.fillRect(x + 2, y + 2, width, 14);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x, y, width, 14);
  ctx.fillStyle = "#f7fdff";
  ctx.fillRect(x + 2, y + 2, width - 4, 10);
  ctx.fillStyle = EMBER_SKIN.mid;
  ctx.fillRect(x + 4, y + 3, width - 8, 2);
  const scale = Math.min(.60, (width - 10) / Math.max(1, measureBitmapText(text, 1)));
  drawBitmapText(text, x + width / 2, y + 5, scale, "center", EMBER_SKIN.dark);
  ctx.restore();
}

function tutorialSceneCatalog() {
  const steps = tutorial.kind === "pvp" ? PVP_STEPS : SOLO_STEPS;
  const seen = new Set();
  return steps.reduce((list, step, index) => {
    const scene = Number(step?.scene || index + 1);
    if (seen.has(scene)) return list;
    seen.add(scene);
    list.push({ scene, index, title:String(step?.title || `SCENE ${scene}`) });
    return list;
  }, []);
}

function getTutorialPauseChapterRects() {
  return {
    previous:{ x:125, y:89, w:24, h:20 },
    next:{ x:331, y:89, w:24, h:20 },
    // A mouse wheel or touchpad scroll over this lane browses chapters.
    scroll:{ x:120, y:74, w:240, h:55 }
  };
}

function selectTutorialChapter(delta) {
  if (!tutorial.active || game.state !== "paused") return false;
  const catalog = tutorialSceneCatalog();
  if (!catalog.length) return false;
  const currentScene = Number(tutorialStep()?.scene || 1);
  const currentIndex = Math.max(0, catalog.findIndex((entry) => entry.scene === currentScene));
  const baseIndex = Number.isInteger(tutorial.pauseChapterPreviewIndex)
    ? tutorial.pauseChapterPreviewIndex
    : currentIndex;
  const nextIndex = (baseIndex + Math.sign(delta || 0) + catalog.length) % catalog.length;
  tutorial.pauseChapterPreviewIndex = nextIndex;
  tutorial.chapterNavigationPending = true;
  // Browsing is only a preview; keep Ember's current dialogue visible behind
  // the pause panel until Continue actually activates the chosen chapter.
  tone(440, .04, .010, delta < 0 ? -30 : 30);
  return true;
}

function applyTutorialChapterPreview() {
  if (!tutorial.active || !Number.isInteger(tutorial.pauseChapterPreviewIndex)) return false;
  const catalog = tutorialSceneCatalog();
  const target = catalog[tutorial.pauseChapterPreviewIndex];
  tutorial.pauseChapterPreviewIndex = null;
  tutorial.chapterNavigationPending = false;
  if (!target) return false;

  clearPvpScriptActions();
  tutorial.pvpDemoActive = false;
  tutorial.pvpDemoBegun = false;
  tutorial.pvpPlayerScriptLocked = false;
  tutorial.pvpCaption = "";
  tutorial.pvpCaptionUntil = 0;
  tutorial.deferredPoofOptions = null;
  tutorial.resetPending = false;
  tutorial.dialogueHiddenDuringPoof = false;
  tutorial.passed = false;
  tutorial.passPending = false;
  tutorial.dynamicDialogueLines = null;
  tutorial.dynamicPortraitKey = "";
  tutorial.successDialogueShown = false;
  tutorial.dialogueOpen = false;
  tutorial.dialogueHeldLineText = "";
  tutorial.dialogueHeldPortraitKey = "";
  tutorial.transitionHeldLineText = "";
  tutorial.transitionHeldPortraitKey = "";
  tutorial.step = target.index;

  if (tutorial.kind === "pvp") configurePvpStep(tutorial.step);
  else configureSoloStep(tutorial.step);
  tutorial.pendingStartPose = captureControlledPose();
  tutorial.pendingPvpTargetPoses = tutorial.kind === "pvp" ? capturePvpTutorialPoses() : null;
  restoreStepSequence();
  clearHeldInput();
  openDialogue();
  // A chapter selected while the old scene was paused must be live and fully
  // authored on the first frame, even if it skipped over a pending poof.
  tutorial.dialogueOpen = true;
  tutorial.dialogueHiddenDuringPoof = false;
  tutorial.dialogueForceComplete = false;
  tutorial.resetPending = false;
  tutorial.deferredPoofOptions = null;
  game.state = "playing";
  game.pauseHelpOpen = false;
  game.pauseSelection = "continue";
  try { if (typeof tutorialClockSuspendedAt !== "undefined") tutorialClockSuspendedAt = null; } catch (_) {}
  // This chapter's frogs were already rebuilt at their authored positions.
  // Skipping again through a poof would make them vanish and delay the
  // first sentence despite nothing moving.
  tutorial.scenePositionedDuringDialogue = true;
  tutorial.dialogueLineStartedAt = performance.now();
  tutorial.dialoguePreLineDelayUntil = tutorial.dialogueLineStartedAt;
  tutorial.dialogueHeldLineText = "";
  tutorial.dialogueHeldPortraitKey = "";
  tutorial.dialogueHeldUntil = 0;
  tutorial.dialogueTalkCharCount = 0;
  tutorial.dialogueTalkBlipAt = performance.now();
  tutorial.smokeClouds.length = 0;
  return true;
}

function drawTutorialPauseArrow(rect, direction, disabled = false) {
  const active = tutorial.pauseChapterHover === direction;
  const skin = getSelectedSkin();
  ctx.fillStyle = "rgba(25,43,52,.28)";
  ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
  ctx.fillStyle = disabled ? "#9aa9ae" : active ? skin.dark : COLORS.ink;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = disabled ? "#e4eaec" : active ? skin.belly : "#f7fdff";
  ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
  ctx.fillStyle = disabled ? "#96a2a6" : active ? skin.dark : "#48555a";
  const left = Math.round(rect.x + (rect.w - 8) / 2);
  const top = Math.round(rect.y + (rect.h - 7) / 2);
  if (direction === "previous") {
    ctx.fillRect(left + 3, top + 0, 2, 1);
    ctx.fillRect(left + 2, top + 1, 3, 1);
    ctx.fillRect(left + 1, top + 2, 5, 1);
    ctx.fillRect(left + 0, top + 3, 7, 1);
    ctx.fillRect(left + 1, top + 4, 5, 1);
    ctx.fillRect(left + 2, top + 5, 3, 1);
    ctx.fillRect(left + 3, top + 6, 2, 1);
  } else {
    ctx.fillRect(left + 3, top + 0, 2, 1);
    ctx.fillRect(left + 3, top + 1, 3, 1);
    ctx.fillRect(left + 2, top + 2, 5, 1);
    ctx.fillRect(left + 1, top + 3, 7, 1);
    ctx.fillRect(left + 2, top + 4, 5, 1);
    ctx.fillRect(left + 3, top + 5, 3, 1);
    ctx.fillRect(left + 3, top + 6, 2, 1);
  }
}

function drawTutorialPauseOverlay() {
  if (!tutorial.active || game.state !== "paused") return;
  // Use the *same* panel and controls as the ordinary Versus pause menu. The
  // former double-rendered stock + tutorial panels, leaving stacked titles.
  drawOverlayPanel(
    "PAUSED",
    [],
    "",
    true,
    { x:75, y:28, w:330, h:204, titleOffset:17, lineStartOffset:58, lineGap:15, footerOffset:169 }
  );
  const catalog = tutorialSceneCatalog();
  const currentScene = Number(tutorialStep()?.scene || 1);
  const currentIndex = Math.max(0, catalog.findIndex((entry) => entry.scene === currentScene));
  const previewIndex = Number.isInteger(tutorial.pauseChapterPreviewIndex)
    ? tutorial.pauseChapterPreviewIndex
    : currentIndex;
  const entry = catalog[previewIndex] || { title:"TUTORIAL", scene:1 };
  const rects = getTutorialPauseChapterRects();
  const skin = getSelectedSkin();

  // Replace the standard pause panel's mode/score details with one compact,
  // bordered chapter scroller. Keep its entire footprint above audio controls.
  drawBitmapText("TUTORIAL CHAPTERS", W / 2, 76, .59, "center", "#68787e");
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(154, 87, 172, 29);
  ctx.fillStyle = "#e7f4f6";
  ctx.fillRect(156, 89, 168, 25);
  ctx.fillStyle = skin.mid;
  ctx.fillRect(158, 91, 164, 2);
  drawBitmapText(`CHAPTER ${previewIndex + 1} / ${catalog.length}`, W / 2, 94, .71, "center", skin.dark);
  const title = entry.title.toUpperCase();
  const titleScale = Math.min(.67, 158 / Math.max(1, measureBitmapText(title, 1)));
  drawBitmapText(title, W / 2, 104, titleScale, "center", "#48555a");
  drawTutorialPauseArrow(rects.previous, "previous", false);
  drawTutorialPauseArrow(rects.next, "next", false);

  ctx.fillStyle = "#d6e7e9";
  ctx.fillRect(155, 119, 170, 3);
  ctx.fillStyle = skin.mid;
  ctx.fillRect(155, 119, Math.round(170 * (previewIndex + 1) / Math.max(1, catalog.length)), 3);
  
  drawPauseControls();
  drawBitmapText(RIBBIT_CREDIT_TEXT, W / 2, 216, 1, "center", "#48555a");
}

function drawTutorialOverlay() {
  if (!tutorial.active || game.state === "countdown") return;
  // The Current Goal card remains visible while paused. It sits below the
  // pause panel, so the pause menu still owns the top visual layer.
  if (game.state === "paused") {
    drawCurrentGoalHud();
    if (tutorial.dialogueOpen) drawTutorialDialogue();
    return;
  }
  drawCurrentGoalHud();
  drawTutorialSmoke();
  drawPvpTutorialCaption();
  drawTutorialReferenceHighlights();
  // Chapter navigation belongs in the pause menu; no badge above Find the Match.
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
  // The tutorial can hide the vocabulary term while preserving the familiar
  // FIND THE MATCH card and its header.
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
    tutorial.active && tutorial.dialogueOpen &&
    (tutorialStep()?.setup === "threeCatches" || tutorial.kind === "pvp") &&
    flies.some((currentFly) => currentFly?.tutorialAuthored && currentFly.state === "active" && currentFly.tutorialArmed !== false)
  );
}

// The next vocabulary target is allowed to exist internally for authored fly
// logic, but it is not revealed in the footer until the frog is actually back
// under player control. Scene retries and poof resets therefore stay blank.
const originalDrawVocabularyPromptForTutorial = drawVocabularyPrompt;
drawVocabularyPrompt = function(...args) {
  const visibleDuringExplanation = tutorialPromptVisibleDuringDialogue();
  const keepDuringMissReset = Boolean(tutorial.resetPending && tutorial.preservePromptDuringReset);
  const keepDuringTongueCinematic = Boolean(
    tutorialStep()?.setup === "rangeCatch" &&
    (game.soloCriticalCatchActive || tongue.active || tutorial.rangeTongueCaught)
  );
  const authoredVisible = tutorial.active && flies.some((fly) => fly?.tutorialAuthored && fly.state === "active" && fly.tutorialArmed);
  // The renderer paints every fly in the tutorial, including newly spawned
  // and still-unarmed authored flies. Its footer must follow that same visual
  // rule: whenever a visible body exists, use one of those vocabulary terms.
  const anyVisible = tutorial.active && flies.some((fly) => fly && fly.state !== "eaten" && Number.isInteger(fly.vocabIndex));
  const pvpMatchFly = tutorial.active && tutorial.kind === "pvp" && anyVisible;
  if (pvpMatchFly && !flies.some((fly) => fly && fly.state !== "eaten" &&
      fly.vocabIndex === game.targetVocabIndex)) {
    const first = flies.find((fly) => fly && fly.state !== "eaten" && Number.isInteger(fly.vocabIndex));
    if (first) setPrompt(first.vocabIndex);
  }
  // Never remove the physical FIND THE MATCH panel—even when all flies were
  // eaten, during the next poof, or in a scene just reached through Level Select.
  if (tutorial.active && (
    !Number.isInteger(game.targetVocabIndex) || (!authoredVisible && !pvpMatchFly && tutorialStep()?.setup !== "pvpFinalMatch") ||
    ((!tutorialPlayerHasControl() && !visibleDuringExplanation && !keepDuringMissReset && !keepDuringTongueCinematic && !pvpMatchFly) ||
    (tutorial.promptHidden && !pvpMatchFly))
  )) {
    drawBlankTutorialVocabularyPrompt();
    return;
  }
  return originalDrawVocabularyPromptForTutorial.apply(this, args);
};
