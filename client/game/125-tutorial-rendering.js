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

function drawEmberDialogueLine(fullLine, visibleText, x, y, scale) {
  const emphasis = /RIBBIT RACE|EMBER|FL(?:Y|IES)|BONKS?|REBOUNDS?|VERSUS/gi;
  const ranges=[];
  let match;
  while((match=emphasis.exec(String(fullLine||"")))) ranges.push([match.index,match.index+match[0].length]);
  const visible=String(visibleText||"");
  if(!visible){return;}
  let cursor=0,drawX=x;
  while(cursor<visible.length){
    const orangeRange=ranges.find(([start,end])=>cursor>=start&&cursor<end);
    const nextBoundary=orangeRange
      ? Math.min(visible.length,orangeRange[1])
      : Math.min(visible.length,...ranges.filter(([start])=>start>cursor).map(([start])=>start),visible.length);
    const chunk=visible.slice(cursor,nextBoundary);
    const color=orangeRange?"#ff9b45":COLORS.white;
    drawBitmapText(chunk,drawX,y,scale,"left",color);
    drawX+=measureBitmapText(chunk,scale);
    cursor=nextBoundary;
  }
}


const POLISH19_EMPHASIS_BY_LINE = Object.freeze({
  "Hold the jump button to charge, then release to leap.": Object.freeze(["HOLD","CHARGE","RELEASE","LEAP"]),
  "Catch the fly with the matching translation to score a point.": Object.freeze(["CATCH","MATCHING"]),
  "All you have to do is TAP jump just before landing.": Object.freeze(["TAP","BEFORE LANDING"]),
  "The only way that you can turn around is by bouncing off of a wall.": Object.freeze(["BOUNCING","WALL"]),
  "Miss a fly, and you'll need to hit a wall to head back for it.": Object.freeze(["MISS","HIT A WALL"]),
  "I'm Ember - a Ribbit Race pro from this side of the pond.": Object.freeze(["EMBER","RIBBIT RACE"]),
  "I'm Ember — a Ribbit Race pro from this side of the pond.": Object.freeze(["EMBER","RIBBIT RACE"])
});
function polish19EmphasisForLine(line){ return POLISH19_EMPHASIS_BY_LINE[String(line||"")] || []; }

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
  wrappedLines.forEach((wrappedLine, index) => {
    const visibleOnLine = wrappedLine.slice(0, Math.max(0, Math.min(wrappedLine.length, remaining)));
    drawEmberDialogueLine(
      wrappedLine,
      visibleOnLine,
      textArea.x,
      textTop + index * lineHeight,
      textScale
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
    previous:{ x:126, y:75, w:24, h:20 },
    next:{ x:330, y:75, w:24, h:20 }
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
  tutorial.dialogueOpen = false;
  tutorial.dialogueHeldLineText = "";
  tutorial.dialogueHeldPortraitKey = "";
  resetDialogueSpaceHold();
  clearHeldInput();
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
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  if (direction === "previous") {
    ctx.fillRect(cx - 5, cy - 1, 9, 3);
    ctx.fillRect(cx - 7, cy - 3, 3, 7);
  } else {
    ctx.fillRect(cx - 4, cy - 1, 9, 3);
    ctx.fillRect(cx + 4, cy - 3, 3, 7);
  }
}

function drawTutorialPauseOverlay() {
  if (!tutorial.active || game.state !== "paused") return;
  drawOverlayPanel(
    "PAUSED",
    [],
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
  drawTutorialPauseArrow(rects.previous, "previous", false);
  drawTutorialPauseArrow(rects.next, "next", false);
  drawBitmapText("TUTORIAL", W / 2, 80, 1.05, "center", "#34484f");
  const titleScale = Math.min(.58, 214 / Math.max(1, measureBitmapText(entry.title, 1)));
  drawBitmapText(entry.title.toUpperCase(), W / 2, 105, titleScale, "center", "#48555a");
  drawBitmapText(`CHAPTER ${previewIndex + 1} / ${catalog.length}`, W / 2, 118, .42, "center", "#68787e");
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
  drawTutorialProgress();
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
    tutorial.active &&
    tutorial.dialogueOpen &&
    tutorialStep()?.setup === "threeCatches" &&
    flies.some((currentFly) => currentFly?.tutorialAuthored && currentFly.tutorialArmed !== false)
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
  if (tutorial.active && (
    ((!tutorialPlayerHasControl() && !visibleDuringExplanation && !keepDuringMissReset && !keepDuringTongueCinematic) || tutorial.promptHidden)
  )) {
    drawBlankTutorialVocabularyPrompt();
    return;
  }
  return originalDrawVocabularyPromptForTutorial.apply(this, args);
};
