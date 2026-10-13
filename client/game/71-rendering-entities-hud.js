// Ribbit Race rendering responsibility: 71 rendering entities hud
    function drawFlyAt(x, y, scale = 1) {
      const px = Math.round(x);
      const py = Math.round(y);
      const s = scale;

      ctx.fillStyle = COLORS.white;
      ctx.fillRect(px - 5 * s, py - 3 * s, 4 * s, 3 * s);
      ctx.fillRect(px + 2 * s, py - 3 * s, 4 * s, 3 * s);
      ctx.fillStyle = "#d8f5ff";
      ctx.fillRect(px - 6 * s, py - 1 * s, 4 * s, 2 * s);
      ctx.fillRect(px + 3 * s, py - 1 * s, 4 * s, 2 * s);

      ctx.fillStyle = COLORS.flyBlack;
      ctx.fillRect(px - 3 * s, py - 4 * s, 6 * s, 9 * s);
      ctx.fillRect(px - 2 * s, py + 5 * s, 4 * s, 2 * s);
      ctx.fillStyle = COLORS.flyYellow;
      ctx.fillRect(px - 2 * s, py - 4 * s, 4 * s, 2 * s);
      ctx.fillStyle = COLORS.flyBlue;
      ctx.fillRect(px - 2 * s, py, 4 * s, 3 * s);
    }

    function getFlyLabelAnchor(currentFly) {
    if (typeof window !== "undefined" && window.RibbitV160ShouldHideFlyLabels?.()) return;
      if (currentFly.state === "spitting") {
        return { x: currentFly.returnX, y: currentFly.returnY };
      }
      return { x: currentFly.baseX, y: currentFly.baseY };
    }

    // Word plates must be visually stable. Each fly keeps one label rectangle and
    // one pre-rasterized label image for its lifetime in the current round. Every
    // plate is placed ABOVE its fly; new flies route around existing plates without
    // moving anything that is already visible.
    const flyLabelPlacementCache = new Map();
    const flyLabelSpriteCache = new Map();

    function flyLabelCacheKey(currentFly) {
    if (typeof window !== "undefined" && window.RibbitV160ShouldHideFlyLabels?.()) return;
      const id = Number(currentFly?.id) || 0;
      const vocab = Number(currentFly?.vocabIndex) || 0;
      if (game.mode === "pvp") {
        const round = Math.max(1, Number(game.pvpRoundNumber) || 1);
        const phase = game.pvpSuddenDeath ? "sd" : "normal";
        return `pvp:${round}:${phase}:${id}:${vocab}`;
      }
      return `solo:${id}:${vocab}`;
    }

    function pruneFlyLabelPlacementCache() {
    if (typeof window !== "undefined" && window.RibbitV160ShouldHideFlyLabels?.()) return;
      const live = new Set(flies.map((currentFly) => flyLabelCacheKey(currentFly)));
      for (const key of flyLabelPlacementCache.keys()) {
        if (!live.has(key)) flyLabelPlacementCache.delete(key);
      }
      for (const key of flyLabelSpriteCache.keys()) {
        if (!live.has(key)) flyLabelSpriteCache.delete(key);
      }
    }

    function overlapArea(first, second) {
      const width = Math.max(0, Math.min(first.x + first.w, second.x + second.w) - Math.max(first.x, second.x));
      const height = Math.max(0, Math.min(first.y + first.h, second.y + second.h) - Math.max(first.y, second.y));
      return width * height;
    }

    function getFlyLabelHudObstacles() {
    if (typeof window !== "undefined" && window.RibbitV160ShouldHideFlyLabels?.()) return;
      const obstacles = [
        { x: 3, y: 3, w: 92, h: 29 },
        { x: W - 95, y: 3, w: 92, h: 29 }
      ];
      if (game.mode === "pvp" || (game.mode === "solo" && Number(game.soloTimeLimitSeconds) > 0)) {
        obstacles.splice(1, 0, { x: W / 2 - 58, y: 3, w: 116, h: 25 });
      }
      return obstacles;
    }

    function chooseFlyLabelRect(currentFly, anchor, width, height) {
    if (typeof window !== "undefined" && window.RibbitV160ShouldHideFlyLabels?.()) return;
      // 1.6.0: the plate center remains locked directly above the fly's stable anchor.
      // It never shifts sideways to avoid the score, timer, pause button, or another
      // label. When two plates would overlap, only the vertical row may change.
      const cacheKey = flyLabelCacheKey(currentFly);
      const anchorX = Math.round(Number(anchor?.x ?? currentFly?.baseX ?? currentFly?.x) || 0);
      const anchorY = Math.round(Number(anchor?.y ?? currentFly?.baseY ?? currentFly?.y) || 0);
      const vocabIndex = Number(currentFly?.vocabIndex) || 0;
      const cached = flyLabelPlacementCache.get(cacheKey);
      if (cached && cached.vocabIndex === vocabIndex && cached.width === width && cached.height === height) {
        return cached.rect;
      }

      const centeredX = Math.round(anchorX - width / 2);
      const firstTop = Math.round(anchorY - height - 8);
      const stableLabelObstacles = [];
      for (const [otherKey, placement] of flyLabelPlacementCache.entries()) {
        if (otherKey === cacheKey || !placement?.rect) continue;
        stableLabelObstacles.push(placement.rect);
      }

      let chosen = null;
      for (let row = 0; row < 6; row += 1) {
        const candidate = {
          x: centeredX,
          y: Math.max(2, firstTop - row * (height + 4)),
          w: width,
          h: height
        };
        if (!stableLabelObstacles.some((other) => overlapArea(candidate, other) > 0)) {
          chosen = candidate;
          break;
        }
      }
      if (!chosen) chosen = { x: centeredX, y: Math.max(2, firstTop), w: width, h: height };

      const stableRect = Object.freeze(chosen);
      flyLabelPlacementCache.set(cacheKey, {
        vocabIndex,
        width,
        height,
        anchorX,
        anchorY,
        rect: stableRect
      });
      return stableRect;
    }

    function drawStableFlyLabelTextToSprite(targetContext, layout, width, textTop, lineHeight) {
    if (typeof window !== "undefined" && window.RibbitV160ShouldHideFlyLabels?.()) return;
      const lines = Array.isArray(layout?.lines) && layout.lines.length ? layout.lines : [""];
      const logicalScale = Number(layout?.scale) || 1;
      const cell = Math.max(1, Math.round(logicalScale * RENDER_SCALE));
      targetContext.save();
      targetContext.setTransform(1, 0, 0, 1, 0, 0);
      targetContext.fillStyle = "#34484f";
      lines.forEach((line, lineIndex) => {
        const value = normalizeBitmapText(line).toUpperCase();
        const visibleWidth = Math.round(measureBitmapText(value, logicalScale) * RENDER_SCALE);
        let cursorX = Math.round((width * RENDER_SCALE - visibleWidth) / 2);
        const lineY = Math.round((textTop + lineIndex * lineHeight) * RENDER_SCALE);
        for (const character of value) {
          if (character === " ") {
            cursorX += 4 * cell;
            continue;
          }
          const glyph = getBitmapGlyph(character);
          const glyphYOffset = glyph.length > 7 ? -cell : 0;
          for (let row = 0; row < glyph.length; row += 1) {
            for (let column = 0; column < glyph[row].length; column += 1) {
              if (glyph[row][column] !== "1") continue;
              targetContext.fillRect(
                cursorX + column * cell,
                lineY + glyphYOffset + row * cell,
                cell,
                cell
              );
            }
          }
          cursorX += 6 * cell;
        }
      });
      targetContext.restore();
    }

    function getFlyLabelSprite(currentFly, term, layout, width, height) {
    if (typeof window !== "undefined" && window.RibbitV160ShouldHideFlyLabels?.()) return;
      const cacheKey = flyLabelCacheKey(currentFly);
      const stripeColor = getSelectedSkin().mid;
      const signature = `${term}\u0000${layout.scale}\u0000${layout.lines.join("\u0001")}\u0000${width}x${height}\u0000${stripeColor}`;
      const cached = flyLabelSpriteCache.get(cacheKey);
      if (cached?.signature === signature) return cached.canvas;

      const sprite = document.createElement("canvas");
      sprite.width = width * RENDER_SCALE;
      sprite.height = height * RENDER_SCALE;
      const spriteContext = sprite.getContext("2d", { alpha: true });
      spriteContext.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      spriteContext.imageSmoothingEnabled = false;

      spriteContext.fillStyle = "rgba(38,54,61,0.28)";
      spriteContext.fillRect(2, 2, width - 2, height - 2);
      spriteContext.fillStyle = COLORS.ink;
      spriteContext.fillRect(0, 0, width, height);
      spriteContext.fillStyle = COLORS.white;
      spriteContext.fillRect(1, 1, width - 2, height - 2);
      spriteContext.fillStyle = stripeColor;
      spriteContext.fillRect(2, 2, width - 4, 2);

      const lineHeight = Math.max(7, Math.ceil(8 * layout.scale + 1));
      const textHeight = layout.lines.length * lineHeight - 1;
      const textTop = Math.round(5 + Math.max(0, (height - 7 - textHeight) / 2));
      drawStableFlyLabelTextToSprite(spriteContext, layout, width, textTop, lineHeight);

      flyLabelSpriteCache.set(cacheKey, { signature, canvas: sprite });
      return sprite;
    }

    function getCriticalCatchWordFade() {
      let progress = null;
      if (game.mode === "solo" && game.soloCriticalCatchActive) progress = getSoloCriticalCatchVisuals().progress;
      else if (game.mode === "pvp" && game.pvpCriticalCatchActive) progress = getPvpCriticalCatchVisuals().progress;
      if (progress === null) return 1;
      return 1 - clamp((progress - 0.08) / 0.52, 0, 1);
    }

    function drawFlyNameTag(currentFly) {
      if (game.sandboxMode || currentFly.sandboxTest) return;
      const term = normalizeVocabularyCellText(getLocalizedFlyTerm(VOCABULARY[currentFly.vocabIndex]) || "?", 80);
      const anchor = getFlyLabelAnchor(currentFly);
      const layout = layoutStableFlyLabelText(term, 120);
      const widest = Math.max(...layout.lines.map((line) => measureBitmapText(line, layout.scale)), 0);
      const lineHeight = Math.max(7, Math.ceil(8 * layout.scale + 1));
      const width = Math.round(clamp(Math.max(32, widest + 10), 32, 132));
      const height = Math.round(Math.max(17, 8 + layout.lines.length * lineHeight));
      const rect = chooseFlyLabelRect(currentFly, anchor, width, height);
      const sprite = getFlyLabelSprite(currentFly, term, layout, width, height);
      const appear = clamp(currentFly.spawnAge / CONFIG.flyGrowDuration, 0, 1);
      const cinematic = game.soloCriticalCatchActive || game.pvpCriticalCatchActive;
      const alpha = appear * getCriticalCatchWordFade();
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = alpha;
      if (cinematic) {
        // During the final-catch camera move the plate stays in world space,
        // follows the fly's current bob/spit offset, and fades with the action.
        const currentX = Number.isFinite(Number(currentFly.x)) ? Number(currentFly.x) : anchor.x;
        const currentY = Number.isFinite(Number(currentFly.y)) ? Number(currentFly.y) : anchor.y;
        const drawX = rect.x + (currentX - anchor.x);
        const drawY = rect.y + (currentY - anchor.y);
        ctx.drawImage(sprite, drawX, drawY, width, height);
      } else {
        // Outside cinematics keep the existing physical-pixel lock for maximum
        // stability on high-DPI and scaled displays.
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(sprite, Math.round(rect.x * RENDER_SCALE), Math.round(rect.y * RENDER_SCALE));
      }
      ctx.restore();
    }

    function getFlySpawnScale(currentFly) {
      const progress = clamp(currentFly.spawnAge / CONFIG.flyGrowDuration, 0, 1);
      return lerp(0.16, 1, easeOutCubic(progress));
    }

    function drawFlySpawnSparks(currentFly) {
      if (currentFly.spawnAge >= CONFIG.flySpawnEffectDuration) return;

      const progress = clamp(currentFly.spawnAge / CONFIG.flySpawnEffectDuration, 0, 1);
      const radius = lerp(2, 14, easeOutCubic(progress));
      const fade = Math.pow(1 - progress, 1.15);
      const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [0.72, 0.72], [-0.72, 0.72], [0.72, -0.72], [-0.72, -0.72]
      ];

      ctx.save();
      ctx.globalAlpha = fade;

      directions.forEach(([dx, dy], index) => {
        const stagger = 0.80 + (index % 3) * 0.10;
        const x = Math.round(currentFly.x + dx * radius * stagger);
        const y = Math.round(currentFly.y + dy * radius * stagger);
        const horizontal = Math.abs(dx) > Math.abs(dy);

        ctx.fillStyle = index % 2 === 0 ? COLORS.white : COLORS.flyYellow;
        ctx.fillRect(x - 1, y - 1, horizontal ? 4 : 2, horizontal ? 2 : 4);
        ctx.fillStyle = COLORS.cloudShade;
        ctx.fillRect(x, y, 2, 2);
      });

      if (progress < 0.36) {
        const flashAlpha = 1 - progress / 0.36;
        ctx.globalAlpha = flashAlpha;
        const x = Math.round(currentFly.x);
        const y = Math.round(currentFly.y);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(x - 8, y - 1, 16, 3);
        ctx.fillRect(x - 1, y - 8, 3, 16);
        ctx.fillStyle = COLORS.flyYellow;
        ctx.fillRect(x - 4, y, 8, 1);
        ctx.fillRect(x, y - 4, 1, 8);
      }

      ctx.restore();
    }

    function getPreviewPoints() {
      if (!frog.charging || !frog.grounded) return [];

      // The preview always shows the normal jump arc. An immediate tap can
      // still drop through a platform, but the guide never snaps to a separate
      // downward path while the player is pressing the button.
      const velocity = getJumpVelocity(frog.charge, false);
      const apexTime = Math.max(0, -velocity.vy / CONFIG.gravity);
      const wallTime = velocity.vx > 0
        ? (W - frog.w - frog.x) / velocity.vx
        : frog.x / -velocity.vx;
      const endTime = Math.max(0, Math.min(apexTime, wallTime));

      if (endTime <= 0) return [];

      const points = [];
      const firstSampleTime = 0.045;
      const sampleInterval = 0.09;

      function addPoint(time) {
        const x = clamp(frog.x + velocity.vx * time, 0, W - frog.w);
        const y = frog.y + velocity.vy * time + 0.5 * CONFIG.gravity * time * time;
        points.push({ x: x + frog.w / 2, y: y + frog.h / 2 });
      }

      for (let time = firstSampleTime; time < endTime; time += sampleInterval) {
        addPoint(time);
      }

      addPoint(endTime);
      return points;
    }

    function drawArcPreview() {
      const points = getPreviewPoints();
      if (!points.length) return;

      ctx.save();
      points.forEach((point, index) => {
        if (point.y < -8 || point.y > CONFIG.playBottom) return;

        const progress = points.length <= 1 ? 0 : index / (points.length - 1);
        const fadeProgress = index < 3
          ? 0
          : (index - 2) / Math.max(1, points.length - 2);
        const alpha = 0.94 * Math.pow(1 - fadeProgress, 1.25);
        if (alpha <= 0.025) return;

        ctx.globalAlpha = alpha;
        const x = Math.round(point.x);
        const y = Math.round(point.y);
        const lateFade = progress > 0.72;

        ctx.fillStyle = getSelectedSkin().dark;
        ctx.fillRect(x - (lateFade ? 1 : 2), y - 1, lateFade ? 3 : 5, lateFade ? 2 : 4);
        ctx.fillStyle = getSelectedSkin().light;
        ctx.fillRect(x - 1, y - (lateFade ? 1 : 2), lateFade ? 2 : 4, lateFade ? 2 : 3);
      });
      ctx.restore();
    }

    function drawTongue() {
      if (!tongue.active) return;

      const mouth = getFrogMouth();
      const progress = clamp(tongue.elapsed / tongue.duration, 0, 1);
      const extension = Math.sin(progress * Math.PI);
      const rawEndX = lerp(mouth.x, tongue.targetX, extension);
      const endX = frog.dir > 0
        ? Math.max(mouth.x, rawEndX)
        : Math.min(mouth.x, rawEndX);
      const endY = lerp(mouth.y, tongue.targetY, extension);
      const dx = endX - mouth.x;
      const dy = endY - mouth.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const steps = Math.ceil(distance / 3);

      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = Math.round(lerp(mouth.x, endX, t));
        const y = Math.round(lerp(mouth.y, endY, t));
        ctx.fillStyle = getSelectedSkin().tongueDark;
        ctx.fillRect(x - 1, y, 3, 2);
        ctx.fillStyle = getSelectedSkin().tongue;
        ctx.fillRect(x, y - 1, 2, 2);
      }
    }

    function getFrogPalette() {
      const skin = getSelectedSkin();
      return {
        dark: skin.dark,
        mid: skin.mid,
        light: skin.light,
        belly: skin.belly,
        accents: skin.accents || skin.bump || skin.crest || skin.light,
        arms: skin.arms || skin.accents || skin.bump || skin.light,
        crest: skin.crest || skin.accents || skin.light,
        feet: skin.feet || skin.accents || skin.light,
        hat: skin.hat || "none"
      };
    }

    function drawCatchSparkles() {
      if (frog.catchSparkleTimer <= 0) return;

      const progress = clamp(
        1 - frog.catchSparkleTimer / CONFIG.catchSparkleDuration,
        0,
        1
      );
      const centerX = frog.x + frog.w / 2;
      const centerY = frog.y + frog.h / 2;
      const radius = lerp(8, 19, easeOutCubic(progress));
      const fade = Math.pow(1 - progress, 0.65);
      const sparkleDirections = [
        { x: -0.92, y: -0.58, color: COLORS.white },
        { x: -0.34, y: -1.00, color: COLORS.flyYellow },
        { x:  0.48, y: -0.88, color: getSelectedSkin().light },
        { x:  0.98, y: -0.22, color: COLORS.white },
        { x:  0.76, y:  0.66, color: COLORS.flyYellow },
        { x: -0.72, y:  0.70, color: getSelectedSkin().light }
      ];

      ctx.save();
      ctx.globalAlpha = fade;

      sparkleDirections.forEach((sparkle, index) => {
        const stagger = 0.82 + index * 0.035;
        const x = Math.round(centerX + sparkle.x * radius * stagger);
        const y = Math.round(centerY + sparkle.y * radius * stagger);
        const alternate = (index + Math.floor(progress * 10)) % 2 === 0;

        ctx.fillStyle = sparkle.color;
        if (alternate) {
          ctx.fillRect(x - 2, y, 5, 1);
          ctx.fillRect(x, y - 2, 1, 5);
          ctx.fillStyle = COLORS.white;
          ctx.fillRect(x, y, 1, 1);
        } else {
          ctx.fillRect(x - 1, y - 1, 3, 3);
          ctx.fillStyle = COLORS.white;
          ctx.fillRect(x, y, 1, 1);
        }
      });

      ctx.restore();
    }

    function drawWrongCatchBubbles() {
      if (frog.wrongCatchBubbleTimer <= 0) return;

      const progress = clamp(
        1 - frog.wrongCatchBubbleTimer / CONFIG.wrongCatchBubbleDuration,
        0,
        1
      );
      const centerX = frog.x + frog.w / 2;
      const centerY = frog.y + 7;
      const bubbles = [
        { offset: 0.00, side: -1, size: 7 },
        { offset: 0.10, side:  1, size: 7 },
        { offset: 0.24, side: -1, size: 6 },
        { offset: 0.36, side:  1, size: 5 },
        { offset: 0.49, side: -1, size: 4 }
      ];

      ctx.save();
      bubbles.forEach((bubble, index) => {
        const local = clamp((progress - bubble.offset) / (1 - bubble.offset), 0, 1);
        if (local <= 0 || local >= 1) return;

        const alpha = Math.sin(local * Math.PI) * 0.98;
        const sway = Math.sin(local * Math.PI * 3 + index * 0.8) * 3;
        const x = Math.round(centerX + bubble.side * (15 + index * 3) + sway);
        const y = Math.round(centerY - local * (21 + index * 3));
        const size = bubble.size;
        const half = Math.floor(size / 2);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = COLORS.stinkDark;
        ctx.fillRect(x - half + 1, y - half, size - 2, size);
        ctx.fillRect(x - half, y - half + 1, size, size - 2);
        ctx.fillStyle = COLORS.stinkLight;
        ctx.fillRect(x - half + 2, y - half + 2, Math.max(1, size - 4), Math.max(1, size - 4));
        ctx.fillStyle = COLORS.stinkMid;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      });

      // Wavy odor marks make the puffs unmistakably read as a wrong answer.
      ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.90;
      ctx.fillStyle = COLORS.stinkDark;
      const waveY = Math.round(centerY - 7 - progress * 11);
      ctx.fillRect(Math.round(centerX - 7), waveY, 3, 1);
      ctx.fillRect(Math.round(centerX - 5), waveY - 3, 3, 1);
      ctx.fillRect(Math.round(centerX + 3), waveY - 1, 3, 1);
      ctx.fillRect(Math.round(centerX + 5), waveY - 4, 3, 1);
      ctx.fillStyle = COLORS.stinkLight;
      ctx.fillRect(Math.round(centerX - 4), waveY - 2, 1, 1);
      ctx.fillRect(Math.round(centerX + 4), waveY - 3, 1, 1);
      ctx.restore();
    }

    function drawVictoryFrog() {
      const palette = getFrogPalette();
      const cycle = (frog.danceTime * 1.65) % 1;
      const jumpCurve = Math.max(0, Math.sin(cycle * Math.PI));
      const lift = Math.round(Math.pow(jumpCurve, 0.82) * 10);
      const airborne = lift > 1;
      const nearLanding = cycle < 0.08 || cycle > 0.92;
      const scaleX = nearLanding ? 1.10 : airborne ? 0.96 : 1;
      const scaleY = nearLanding ? 0.90 : airborne ? 1.05 : 1;
      const centerX = Math.round(frog.x + frog.w / 2);
      const groundY = Math.round(frog.y + frog.h);
      const baseY = groundY - lift;
      const armBeat = Math.sin(frog.danceTime * 13) >= 0;

      // Keep one stable shadow throughout the victory hop so it never blinks at landing.
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(centerX - 7, groundY + 1, 14, 2);
      ctx.restore();

      ctx.save();
      ctx.translate(centerX, baseY);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-12, -16);

      // Front-facing arms. They pop upward while the frog is airborne.
      ctx.fillStyle = palette.dark;
      if (airborne) {
        ctx.fillRect(-1, armBeat ? 3 : 5, 6, 3);
        ctx.fillRect(19, armBeat ? 5 : 3, 6, 3);
        ctx.fillStyle = palette.arms;
        ctx.fillRect(0, armBeat ? 3 : 5, 4, 1);
        ctx.fillRect(20, armBeat ? 5 : 3, 4, 1);
      } else {
        ctx.fillRect(0, 7, 5, 3);
        ctx.fillRect(19, 7, 5, 3);
        ctx.fillStyle = palette.arms;
        ctx.fillRect(1, 7, 3, 1);
        ctx.fillRect(20, 7, 3, 1);
      }

      // Feet spread on landing and tuck inward during each happy hop.
      ctx.fillStyle = palette.dark;
      if (airborne) {
        ctx.fillRect(4, 12, 7, 4);
        ctx.fillRect(13, 12, 7, 4);
        ctx.fillStyle = palette.feet;
        ctx.fillRect(5, 12, 5, 2);
        ctx.fillRect(14, 12, 5, 2);
      } else {
        ctx.fillRect(0, 12, 9, 4);
        ctx.fillRect(15, 12, 9, 4);
        ctx.fillStyle = palette.feet;
        ctx.fillRect(1, 12, 7, 2);
        ctx.fillRect(16, 12, 7, 2);
      }

      // Symmetrical front-facing body and eye bumps.
      ctx.fillStyle = palette.dark;
      ctx.fillRect(3, 4, 18, 10);
      ctx.fillRect(6, 1, 12, 5);
      ctx.fillRect(3, 0, 6, 5);
      ctx.fillRect(15, 0, 6, 5);

      ctx.fillStyle = palette.mid;
      ctx.fillRect(4, 5, 16, 8);
      ctx.fillRect(7, 2, 10, 4);
      ctx.fillStyle = palette.crest;
      ctx.fillRect(4, 1, 4, 4);
      ctx.fillRect(16, 1, 4, 4);
      ctx.fillStyle = getFrogAccentHighlight(palette);
      ctx.fillRect(5, 5, 14, 2);
      ctx.fillRect(8, 2, 8, 2);
      ctx.fillStyle = palette.belly;
      ctx.fillRect(7, 8, 10, 5);

      // Two eyes and a broad little smile face the player directly.
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(5, 1, 3, 3);
      ctx.fillRect(16, 1, 3, 3);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(6, 2, 1, 2);
      ctx.fillRect(17, 2, 1, 2);
      ctx.fillRect(9, 6, 2, 1);
      ctx.fillRect(13, 6, 2, 1);
      ctx.fillRect(10, 7, 4, 1);
      ctx.fillStyle = getSelectedSkin().tongue;
      ctx.fillRect(11, 8, 2, 1);

      ctx.restore();
      if (palette.hat && palette.hat !== "none") {
        ctx.save();ctx.translate(centerX, baseY);ctx.scale(scaleX, scaleY);
        if (hatUsesEyeOverlay(palette.hat)) {
          drawFrontEyesOverHat(0, -16, palette, 1);
          drawPixelFrogHat(0, -15, palette.hat, 1, 1, {...palette,frontFacing:true});
        } else {
          drawPixelFrogHat(0, -16, palette.hat, 1, 1, {...palette,frontFacing:true});
          drawFrontEyesOverHat(0, -16, palette, 1);
        }
        ctx.restore();
      }

      // Pixel confetti alternates around the front-facing hops.
      const twinkle = Math.floor(frog.danceTime * 7) % 2;
      ctx.fillStyle = twinkle ? COLORS.flyYellow : COLORS.white;
      ctx.fillRect(centerX - 17, baseY - 21, 2, 2);
      ctx.fillRect(centerX + 15, baseY - 18, 2, 2);
      ctx.fillStyle = getSelectedSkin().light;
      ctx.fillRect(centerX - 16, baseY - 24, 1, 6);
      ctx.fillRect(centerX + 16, baseY - 21, 1, 6);
    }

    function drawGameplayFrogSpriteLocal(palette, airborne = false, blinking = false) {
      const feet = palette.feet || palette.light;
      const arms = palette.arms || palette.accents || palette.light;
      const crest = palette.crest || palette.bump || palette.eyeBump || palette.light;

      ctx.fillStyle = palette.dark;
      if (airborne) {
        ctx.fillRect(0, 9, 8, 4);
        ctx.fillRect(15, 7, 8, 4);
        ctx.fillStyle = feet;
        ctx.fillRect(1, 8, 7, 3);
        ctx.fillStyle = arms;
        ctx.fillRect(15, 8, 7, 2);
      } else {
        ctx.fillRect(0, 10, 8, 4);
        ctx.fillRect(14, 10, 8, 4);
        ctx.fillStyle = feet;
        ctx.fillRect(1, 10, 6, 2);
        ctx.fillRect(15, 10, 6, 2);
        ctx.fillStyle = arms;
        ctx.fillRect(17, 7, 4, 2);
      }

      ctx.fillStyle = palette.dark;
      ctx.fillRect(3, 5, 17, 8);
      ctx.fillRect(6, 2, 13, 4);
      ctx.fillRect(15, 0, 5, 5);
      ctx.fillStyle = palette.mid;
      ctx.fillRect(4, 6, 15, 6);
      ctx.fillRect(7, 3, 11, 4);
      ctx.fillStyle = crest;
      ctx.fillRect(16, 1, 3, 4);
      ctx.fillStyle = getFrogAccentHighlight(palette);
      ctx.fillRect(5, 6, 10, 2);
      ctx.fillRect(8, 3, 7, 2);
      ctx.fillStyle = palette.belly;
      ctx.fillRect(10, 9, 8, 3);

      if (palette.hat && palette.hat !== "none") {
        if (hatUsesEyeOverlay(palette.hat)) {
          ctx.fillStyle = COLORS.white;
          ctx.fillRect(16, 1, 3, 3);
          ctx.fillStyle = COLORS.ink;
          if (!blinking) ctx.fillRect(18, 2, 1, 2);
          else ctx.fillRect(16, 3, 3, 1);
          drawPixelFrogHat(11, 1, palette.hat, 1, 1, palette);
        } else {
          drawPixelFrogHat(11, 0, palette.hat, 1, 1, palette);
          drawSideEyeOverHat(11, 0, palette, 1, blinking, 1, 5);
        }
      } else {
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(16, 1, 3, 3);
        ctx.fillStyle = COLORS.ink;
        if (!blinking) ctx.fillRect(18, 2, 1, 2);
        else ctx.fillRect(16, 3, 3, 1);
      }
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(18, 6, 3, 1);
    }

    function drawFrog() {
      if(drawSandboxAnimationPreview())return;
      const dancing = game.state === "won" && frog.grounded;
      if (dancing) {
        drawVictoryFrog();
        return;
      }

      const palette = getFrogPalette();
      const airborne = !frog.grounded;
      const chargeSquash = frog.charging ? 1 + frog.charge * 0.25 : 1;
      const landSquash = 1 + frog.landingSquash * 0.20;
      const sx = chargeSquash * landSquash;
      const sy = 1 / Math.sqrt(sx);
      const baseX = Math.round(frog.x + frog.w / 2);
      const baseY = Math.round(frog.y + frog.h);

      ctx.save();
      ctx.translate(baseX, baseY);
      ctx.scale(frog.dir, 1);
      ctx.scale(sx, sy);
      ctx.translate(-11, -14);
      drawGameplayFrogSpriteLocal(palette, airborne, frog.blinking);
      ctx.restore();
    }

    function drawOffscreenFrogIndicator() {
      if (
        frog.y + frog.h >= 0 ||
        !["playing", "paused", "countdown"].includes(game.state)
      ) return;

      const centerX = Math.round(clamp(frog.x + frog.w / 2, 12, W - 12));
      const overlapsLeftHud = centerX < 92;
      const overlapsRightHud = centerX > W - 72;
      const top = overlapsLeftHud || overlapsRightHud ? 30 : 4;
      const pulse = 0.88 + Math.sin(game.visualTime * 8) * 0.12;

      ctx.save();
      ctx.globalAlpha = pulse;

      // Pixel bubble.
      ctx.fillStyle = "rgba(38,54,61,0.45)";
      ctx.fillRect(centerX - 7, top + 2, 16, 14);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(centerX - 7, top + 1, 14, 15);
      ctx.fillRect(centerX - 9, top + 4, 18, 9);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(centerX - 5, top + 3, 10, 11);
      ctx.fillRect(centerX - 7, top + 5, 14, 7);

      // Up arrow inside the bubble.
      ctx.fillStyle = getSelectedSkin().dark;
      ctx.fillRect(centerX - 1, top + 6, 3, 6);
      ctx.fillRect(centerX - 4, top + 6, 9, 2);
      ctx.fillRect(centerX - 3, top + 4, 7, 2);
      ctx.fillRect(centerX - 2, top + 3, 5, 2);
      ctx.fillStyle = getSelectedSkin().light;
      ctx.fillRect(centerX, top + 5, 1, 6);
      ctx.fillRect(centerX - 2, top + 6, 5, 1);

      ctx.restore();
    }

    function drawSpeechBubble() {
      if (frog.firstJumpMade || game.state !== "playing" || (game.sandboxMode && sandboxPreview.mode !== "play")) return;

      const x = 10;
      const y = 126;
      const w = 126;
      const h = 42;
      const bubbleRect = { x, y, w, h: h + 14 };
      const flyBehind = flies.some((currentFly) =>
        currentFly.state === "active" &&
        currentFly.baseX >= x - 8 && currentFly.baseX <= x + w + 8 &&
        currentFly.baseY >= y - 8 && currentFly.baseY <= y + h + 14
      );
      const jumpPreviewBehind = frog.charging && previewPathOverlapsRect(getPreviewPoints(), bubbleRect, 5);

      ctx.save();
      ctx.globalAlpha = flyBehind || jumpPreviewBehind ? 0.25 : 1;
      ctx.fillStyle = "rgba(38,54,61,0.42)";
      ctx.fillRect(x + 4, y + 4, w, h);
      ctx.fillRect(x + 56, y + h + 4, 12, 8);

      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x + 3, y, w - 6, h);
      ctx.fillRect(x, y + 4, w, h - 8);
      ctx.fillRect(x + 56, y + h, 12, 7);
      ctx.fillRect(x + 59, y + h + 7, 6, 5);

      ctx.fillStyle = COLORS.white;
      ctx.fillRect(x + 4, y + 2, w - 8, h - 4);
      ctx.fillRect(x + 2, y + 6, w - 4, h - 12);
      ctx.fillRect(x + 58, y + h - 1, 8, 7);
      ctx.fillRect(x + 60, y + h + 6, 4, 3);

      const mobileInstructions = isRibbitMobileMode();
      drawBitmapText(mobileInstructions ? "HOLD METER TO CHARGE" : "HOLD SPACE TO CHARGE", x + w / 2, y + 10, mobileInstructions ? 0.68 : 0.78, "center", "#4c555a");
      drawBitmapText(mobileInstructions ? "RELEASE TO JUMP" : "RELEASE TO JUMP", x + w / 2, y + 27, 0.92, "center", "#4c555a");
      ctx.restore();
    }

    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remaining = seconds - minutes * 60;
      return `${String(minutes).padStart(2, "0")}:${remaining.toFixed(1).padStart(4, "0")}`;
    }

    function drawHudPausePlaySprite(rect, paused = false, palette = getSelectedSkin()) {
      if (!rect) return;
      const x = Math.round(rect.x), y = Math.round(rect.y), w = Math.round(rect.w), h = Math.round(rect.h);
      // Match the original fixed mint pause icon across ALL frog palettes.
      // Only the glyph alternates between pause and play.
      ctx.save();
      ctx.fillStyle = "rgba(30,49,55,0.25)";
      ctx.fillRect(x + 1, y + 2, w, h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#b8f5dc";
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = "#e3fff4";
      ctx.fillRect(x + 3, y + 2, w - 6, 2);
      ctx.fillStyle = "#215465";
      if (paused) {
        // The play triangle takes up exactly the pause bars' footprint.
        ctx.fillRect(x + 9, y + 5, 3, 10);
        ctx.fillRect(x + 12, y + 7, 3, 6);
        ctx.fillRect(x + 15, y + 8, 2, 4);
        ctx.fillRect(x + 17, y + 9, 2, 2);
      } else {
        ctx.fillRect(x + 8, y + 5, 4, 10);
        ctx.fillRect(x + 15, y + 5, 4, 10);
      }
      ctx.restore();
    }

    function drawHud() {
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(0, CONFIG.playBottom, W, 3);
      ctx.fillStyle = COLORS.panel;
      ctx.fillRect(0, CONFIG.playBottom + 3, W, H - CONFIG.playBottom - 3);
      ctx.fillStyle = COLORS.panelLight;
      ctx.fillRect(0, CONFIG.playBottom + 3, W, 2);

      // Jump meter.
      const meterX = 16;
      const meterY = 241;
      const meterW = 132;
      const meterH = 18;
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(meterX - 2, meterY - 2, meterW + 4, meterH + 4);
      ctx.fillStyle = getSelectedSkin().belly;
      ctx.fillRect(meterX, meterY, meterW, meterH);
      ctx.fillStyle = getSelectedSkin().belly;
      ctx.fillRect(meterX + 2, meterY + 2, meterW - 4, meterH - 4);

      const fill = frog.charging ? frog.charge : 0;
      const fillW = Math.max(0, Math.floor((meterW - 6) * fill));
      if (fillW > 0) {
        const meterGradient = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
        meterGradient.addColorStop(0, getSelectedSkin().light);
        meterGradient.addColorStop(0.68, getSelectedSkin().mid);
        meterGradient.addColorStop(1, getSelectedSkin().dark);
        ctx.fillStyle = meterGradient;
        ctx.fillRect(meterX + 3, meterY + 3, fillW, meterH - 6);
      }
      drawBitmapText("JUMP", meterX + meterW / 2, meterY + 5, 1, "center", COLORS.white, COLORS.ink);

      // The language target now occupies the center of the gray footer.
      drawVocabularyPrompt();
      if (game.sandboxMode) {
        drawBitmapText(isRibbitMobileMode() ? "TAP PREVIEW TO CHANGE" : "SHIFT: WIN / LOSE / PLAY", 306, 240, 0.72, "center", "#d9edf2");
        drawBitmapText(sandboxPreview.mode === "play" ? "TEST YOUR TONGUE COLOR" : sandboxPreview.mode === "win" ? "VICTORY PREVIEW" : "LOSING PREVIEW", 306, 252, 0.65, "center", getSelectedSkin().light);
      }

      if (!game.sandboxMode) {
        // Timer, current-round jumps, and best time.
        drawPixelText("TIME", 329, 235, 7, "left", "#cdeff5");
        drawPixelText(formatTime(getTimerTime()), 463, 234, 10, "right", COLORS.white);
        drawPixelText("JUMPS", 329, 247, 7, "left", "#cdeff5");
        drawPixelText(String(game.jumps), 463, 247, 8, "right", getSelectedSkin().light);
        drawPixelText("BEST", 329, 259, 7, "left", "#cdeff5");
        const bestTimeLabel = game.bestTime === null ? "--:--.-" : formatTime(game.bestTime);
        const bestJumpLabel = game.bestJumps === null ? "--" : String(game.bestJumps);
        drawMiniStopwatchIcon(377, 263, getSelectedSkin(), 0.48);
        drawBitmapText(bestTimeLabel, 385, 258, 0.66, "left", "#ffe27a");
        drawBitmapText("•", 424, 259, 0.62, "center", "#ffe27a");
        drawTrampolineIcon(438, 263, getSelectedSkin(), 0.43);
        drawBitmapText(bestJumpLabel, 463, 258, 0.68, "right", "#ffe27a");
      }

      if (game.muted) drawPixelText("MUTED", 82, 232, 7, "center", "#ffadad");
    }

    function drawVocabularyPrompt() {
      if (!["playing", "paused", "countdown"].includes(game.state)) return;
      if (game.sandboxMode || game.winPending || !Number.isInteger(game.targetVocabIndex)) return;

      const prompt = normalizeVocabularyCellText(getLocalizedClueTerm(VOCABULARY[game.targetVocabIndex]) || "", 80);
      const left = 154;
      const top = 234;
      const width = 172;
      const height = 33;
      const layout = layoutBitmapText(prompt, width - 12, { maxScale: 0.92, minScale: 0.50, maxLines: 2 });

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

      const lineHeight = Math.max(6, Math.ceil(8 * layout.scale + 1));
      const totalHeight = layout.lines.length * lineHeight - 1;
      const promptTop = Math.round(top + 15 + Math.max(0, (height - 17 - totalHeight) / 2));
      // Keep the prompt on a single pixel-aligned pass as well; duplicate fractional
      // rendering can shimmer when a high-DPI canvas is rescaled by the browser.
      drawBitmapTextLayout(layout, W / 2, promptTop, "center", "#17495a", null, 1);
    }

    function drawTopHud() {
      if (game.mode === "pvp") return;
      const scoreBoxX = 8;
      const scoreBoxW = 76;
      const skin = getSelectedSkin();

      ctx.fillStyle = "rgba(38,54,61,0.70)";
      ctx.fillRect(scoreBoxX, 7, scoreBoxW, 19);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(scoreBoxX + 1, 8, scoreBoxW - 2, 17);
      ctx.fillStyle = skin.belly;
      ctx.fillRect(scoreBoxX + 3, 10, scoreBoxW - 6, 13);

      if (game.sandboxMode) {
        ctx.save();
        ctx.translate(22, 17);
        ctx.rotate(-0.45);
        ctx.fillStyle = skin.dark; ctx.fillRect(-1, -7, 3, 10); ctx.fillRect(-4, -8, 9, 3);
        ctx.fillStyle = skin.mid; ctx.fillRect(-5, 3, 11, 4);
        ctx.restore();
        drawBitmapText("SANDBOX", 57, 15, 0.72, "center", skin.dark);
      } else {
        drawFlyAt(22, 17, 0.75);
        const tutorialTarget = Number(game.tutorialDisplayCatchTarget);
        const target = game.tutorialActive && Number.isFinite(tutorialTarget)
          ? Math.max(0, Math.floor(tutorialTarget))
          : getSoloTargetScore();
        const scoreLabel = isSoloEndlessMode() || (game.tutorialActive && target <= 0)
          ? `${game.score}`
          : `${game.score} / ${target}`;
        drawBitmapText(scoreLabel, 55, 15, 1, "center", skin.dark);
        ctx.save();
        ctx.globalAlpha = 0.24;
        ctx.translate(0.5, 0);
        drawBitmapText(scoreLabel, 55, 15, 1, "center", skin.dark);
        ctx.restore();
      }

      if (!game.sandboxMode && isSoloTimerActive()) {
        const urgentClock = game.soloTimeRemaining > 0 && game.soloTimeRemaining <= 5;
        if (urgentClock) {
          const pulse = 0.68 + 0.22 * Math.sin(game.visualTime * 13);
          ctx.fillStyle = `rgba(155,27,38,${pulse})`;
          ctx.fillRect(W / 2 - 50, 5, 100, 17);
          ctx.fillStyle = "#ff6875";
          ctx.fillRect(W / 2 - 48, 7, 96, 2);
        } else {
          ctx.fillStyle = "rgba(38,54,61,0.68)";
          ctx.fillRect(W / 2 - 48, 7, 96, 13);
        }
        const clockLabel = isSoloEndlessMode()
          ? `ENDLESS ${Math.ceil(game.soloTimeRemaining)} SEC`
          : `${Math.ceil(game.soloTimeRemaining)} SEC`;
        drawBitmapText(clockLabel, W / 2, 10, 0.68, "center", urgentClock ? "#ffffff" : "#d9edf2", urgentClock ? "#65111b" : null);
      }

      const pause = HUD_UI.pauseButton;
      drawHudPausePlaySprite(pause, game.state === "paused", getSelectedSkin());
    }
