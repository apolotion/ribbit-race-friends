// Ribbit Race Versus responsibility: 63 versus rendering ui
    function updatePvp(dt) {
      const clockDt = game.pvpCriticalCatchActive ? 0 : dt;
      game.elapsed += clockDt;
      game.pvpElapsed += clockDt;
      game.worldTime += dt;
      if (game.pvpTimeLimitSeconds > 0 && !game.pvpSuddenDeath && game.pvpWinPendingIndex === null && !game.pvpTimerGraceActive && !game.pvpTimedOutcomePending) {
        game.pvpTimeRemaining = Math.max(0, game.pvpTimeRemaining - clockDt);
        const urgentSecond = game.pvpTimeRemaining > 0 ? Math.ceil(game.pvpTimeRemaining) : 0;
        if (urgentSecond > 0 && urgentSecond <= 5 && urgentSecond !== game.pvpLastUrgentSecond) {
          game.pvpLastUrgentSecond = urgentSecond;
          playUrgentClockTick(urgentSecond);
        }
        if (game.pvpTimeRemaining <= 0) {
          game.pvpLastUrgentSecond = 0;
          if (!Number.isFinite(game.pvpFinalDisplayTime)) {
            game.pvpFinalDisplayTime = game.pvpTimeLimitSeconds;
          }
          if (!Number.isFinite(game.pvpTimeExpiredAt)) game.pvpTimeExpiredAt = game.pvpElapsed;
          // A monotonic timestamp guards the result even if in-game time stops
          // advancing due to a cinematic, bonk, or lingering jump charge.
          if (!Number.isFinite(game.pvpTimeExpiredRealAt)) game.pvpTimeExpiredRealAt = performance.now();
          beginPvpTimerJumpGrace();
          if (!game.pvpTimerGraceActive) resolvePvpTimedOutcomeAfterJump();
        }
      }
      updatePvpMovingPlatforms();
      updatePvpImpactEffects(dt);
      if (game.pvpWinPendingIndex === null && !game.pvpTimerGraceActive && !game.pvpTimedOutcomePending) {
        // Solo and local Versus use the same four-fly pool. A past tutorial
        // or one-off catch must not strand local Versus with a single target.
        // Respect already-scheduled spawn tickets and avoid touching the
        // authoritative online room or individual lesson fly setups.
        const authoredTraining = tutorial.active && tutorial.kind === "pvp" &&
          tutorialStep()?.setup !== "pvpFinalMatch";
        if (!game.onlineMode && !authoredTraining && !game.sandboxMode && !game.pvpSuddenDeath) {
          const liveCount = flies.filter((fly) => fly && fly.state !== "eaten").length;
          const missing = Math.max(0, CONFIG.maxFlies - liveCount - game.spawnQueue.length);
          if (missing) {
            const reserved = getReservedVocabIndices();
            const selected = new Set(reserved);
            const vocabPool = shuffledVocabularyIndices().filter((index) => !selected.has(index));
            let latestDue = game.spawnQueue.reduce((last, ticket) => Math.max(last, Number(ticket.dueAt) || 0), game.elapsed);
            for (let count = 0; count < missing; count += 1) {
              const vocabIndex = vocabPool[count] ?? chooseUnusedVocabularyIndex([...selected]);
              selected.add(vocabIndex);
              latestDue = Math.max(game.elapsed + STEP, latestDue + CONFIG.flySpawnMinimumSpacing);
              game.spawnQueue.push({ dueAt: latestDue, source: "pvp-fill", vocabIndex });
            }
            game.spawnQueue.sort((a, b) => a.dueAt - b.dueAt);
          }
        }
        ensureTargetVocabularyAvailable(game.targetVocabIndex);
        while (flies.length < CONFIG.maxFlies && game.spawnQueue.length && game.spawnQueue[0].dueAt <= game.elapsed) {
          const ticket = game.spawnQueue[0];
          if (!spawnFly(ticket)) break;
          game.spawnQueue.shift();
        }
      }
      if (tutorial.active && tutorial.kind === "pvp" && tutorialStep()?.setup === "pvpFinalMatch" &&
          game.state === "playing" && !game.pvpTimedOutcomePending && !game.pvpCriticalCatchActive) {
        const activeFlyPool = flies.filter((fly) => fly?.state === "active" && Number.isInteger(fly.vocabIndex));
        // Never display EASY (or any clue) with four unrelated flies onscreen.
        // If the next matching fly is queued, first target one already alive.
        if (activeFlyPool.length && !activeFlyPool.some((fly) => fly.vocabIndex === game.targetVocabIndex)) {
          game.targetVocabIndex = activeFlyPool[0].vocabIndex;
          game.promptSerial += 1;
          game.completedVocabIndices.delete(game.targetVocabIndex);
        }
      }
      updatePvpCpuInput(dt);
      pvpPlayers.forEach((player) => updatePvpPlayer(player, dt));
      resolvePvpCollision();
      pvpPlayers.forEach((player) => updateFrogAfterimages(
        player,
        dt,
        getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index),
        true
      ));
      updatePvpFlies(dt);
      const finalTutor = tutorial.active && tutorial.kind === "pvp" && tutorialStep()?.setup === "pvpFinalMatch";
      // Time-limit grace is for the last airborne catch, not unlimited play.
      // A bonked or endlessly charging frog must never strand the real 30-sec
      // final match with the clock showing zero (observed in captured video).
      if (finalTutor && game.state === "playing" && game.pvpTimedOutcomePending &&
          !game.pvpCriticalCatchActive && game.pvpTimeRemaining <= 0 &&
          (!game.pvpTimerGraceActive ||
           (Number.isFinite(game.pvpTimeExpiredRealAt) &&
            performance.now() - game.pvpTimeExpiredRealAt >= 2000) ||
           (Number.isFinite(game.pvpTimeExpiredAt) &&
            game.pvpElapsed - game.pvpTimeExpiredAt >= 2))) {
        // One grace-period outcome, never an endless zero-second match.
        resolvePvpTimedOutcomeAfterJump();
        return;
      }
      if (!game.pvpCriticalCatchActive && game.pvpTimerGraceActive && pvpTimerGraceHasFinished()) {
        resolvePvpTimedOutcomeAfterJump();
        return;
      }
      if (game.pvpWinPendingIndex !== null) {
        const winner = pvpPlayers[game.pvpWinPendingIndex];
        if (winner && winner.grounded && !winner.tongue.active && !game.pvpTimedOutcomePending && !game.pvpSuddenDeath && winner.score < (game.pvpFirstTo || 5) + 1) {
          const landingBonus = flies.find((fly) => fly.state === "active" && pvpPlayerTouchesFly(winner, fly));
          if (landingBonus) completePvpBonusCatch(winner, landingBonus);
        }
        const everyoneSettled = pvpPlayers.every((player) => player && player.grounded && !player.tongue.active && !player.landedThisFrame);
        if (!game.pvpCriticalCatchActive && winner && everyoneSettled) {
          pvpPlayers.forEach((player) => {
            player.inputHeld = false;
            player.charging = false;
            player.vx = 0;
            player.vy = 0;
            player.tongue.active = false;
          });
          completePvpWin(winner.index);
        }
      }
    }

    function getPvpPreviewPoints(player) {
      if (!player.charging || !player.grounded) return [];
      const power = clamp(player.charge, 0, 1);
      const vx = player.dir * lerp(CONFIG.minimumJumpX, CONFIG.maximumJumpX, power);
      const vy = -lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, power);
      const apexTime = Math.max(0, -vy / CONFIG.gravity);
      const wallTime = vx > 0 ? (W - player.w - player.x) / vx : player.x / -vx;
      const endTime = Math.max(0, Math.min(apexTime, wallTime));
      const points = [];
      for (let t = 0.045; t < endTime; t += 0.09) {
        points.push({ x: clamp(player.x + vx * t, 0, W - player.w) + player.w / 2,
          y: player.y + vy * t + 0.5 * CONFIG.gravity * t * t + player.h / 2 });
      }
      if (endTime > 0) points.push({ x: clamp(player.x + vx * endTime, 0, W - player.w) + player.w / 2,
        y: player.y + vy * endTime + 0.5 * CONFIG.gravity * endTime * endTime + player.h / 2 });
      return points;
    }

    function drawPvpArcPreview(player) {
      const points = getPvpPreviewPoints(player);
      const palette = getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index);
      ctx.save();
      points.forEach((point, index) => {
        if (point.y < -8 || point.y > CONFIG.playBottom) return;
        const fadeProgress = index < 3 ? 0 : (index - 2) / Math.max(1, points.length - 2);
        const alpha = 0.92 * Math.pow(1 - fadeProgress, 1.25);
        if (alpha <= 0.025) return;
        ctx.globalAlpha = alpha;
        const x = Math.round(point.x), y = Math.round(point.y);
        ctx.fillStyle = palette.dark; ctx.fillRect(x - 2, y - 1, 5, 4);
        ctx.fillStyle = palette.light; ctx.fillRect(x - 1, y - 2, 4, 3);
      });
      ctx.restore();
    }

    function drawPvpTongue(player) {
      const t = player.tongue;
      if (!t.active) return;
      const mouth = getPvpMouth(player);
      const progress = clamp(t.elapsed / t.duration, 0, 1);
      const extension = Math.sin(progress * Math.PI);
      const rawEndX = lerp(mouth.x, t.targetX, extension);
      const endX = player.dir > 0 ? Math.max(mouth.x, rawEndX) : Math.min(mouth.x, rawEndX);
      const endY = lerp(mouth.y, t.targetY, extension);
      const steps = Math.ceil(Math.max(1, Math.hypot(endX - mouth.x, endY - mouth.y)) / 3);
      const palette = getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index);
      for (let i = 0; i <= steps; i += 1) {
        const amount = i / steps;
        const x = Math.round(lerp(mouth.x, endX, amount));
        const y = Math.round(lerp(mouth.y, endY, amount));
        ctx.fillStyle = palette.tongueDark; ctx.fillRect(x - 1, y, 3, 2);
        ctx.fillStyle = palette.tongue; ctx.fillRect(x, y - 1, 2, 2);
      }
    }

    function drawPvpCatchSparkles(player, palette) {
      if (!player || player.catchSparkleTimer <= 0) return;

      const progress = clamp(
        1 - player.catchSparkleTimer / CONFIG.catchSparkleDuration,
        0,
        1
      );
      const centerX = player.x + player.w / 2;
      const centerY = player.y + player.h / 2;
      const radius = lerp(8, 19, easeOutCubic(progress));
      const fade = Math.pow(1 - progress, 0.65);
      const sparkleDirections = [
        { x: -0.92, y: -0.58, color: COLORS.white },
        { x: -0.34, y: -1.00, color: COLORS.flyYellow },
        { x:  0.48, y: -0.88, color: palette.light },
        { x:  0.98, y: -0.22, color: COLORS.white },
        { x:  0.76, y:  0.66, color: COLORS.flyYellow },
        { x: -0.72, y:  0.70, color: palette.light }
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

    function drawPvpWrongCatchBubbles(player) {
      if (!player || player.wrongCatchBubbleTimer <= 0) return;

      const progress = clamp(
        1 - player.wrongCatchBubbleTimer / CONFIG.wrongCatchBubbleDuration,
        0,
        1
      );
      const centerX = player.x + player.w / 2;
      const centerY = player.y + 7;
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

      // Match the single-player wrong-answer odor waves exactly.
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

    function drawPvpPlayer(player) {
      const palette = getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index);
      const baseX = Math.round(player.x + player.w / 2);
      const popDuration = 0.18;
      const popProgress = clamp(1 - (player.bonkLandingPopTimer || 0) / popDuration, 0, 1);
      const popOffset = player.bonkLandingPopTimer > 0 ? Math.round(Math.sin(popProgress * Math.PI) * 3) : 0;
      const baseY = Math.round(player.y + player.h - popOffset);
      // Never start rotating during the stun. The former last-.22s rotation
      // restarted at the stun end when recoveryFlipTimer was set, showing two
      // full rotations (and occasionally a visible inverted snap).
      const recoveringFlip = (player.recoveryFlipTimer || 0) > 0;
      const recoveryProgress = recoveringFlip ? clamp(1 - player.recoveryFlipTimer / .24, 0, 1) : 0;
      const upsideDown = player.bonked || player.stunTimer > 0 || recoveringFlip;
      const sx = 1 + player.landingSquash * 0.18 + (player.charging ? player.charge * 0.20 : 0);
      const sy = 1 / Math.sqrt(sx);
      ctx.save();
      if (upsideDown) {
        // Rotate around the center of the collision box so the stunned frog
        // remains fully above the ground rather than being drawn underneath it.
        ctx.translate(baseX, Math.round(player.y + player.h / 2 - popOffset));
        ctx.rotate(recoveringFlip ? (1 - recoveryProgress) * Math.PI : Math.PI);
        ctx.scale(player.dir, 1);
        ctx.scale(sx, sy);
        ctx.translate(-11, -7);
      } else {
        ctx.translate(baseX, baseY);
        ctx.scale(player.dir, 1);
        ctx.scale(sx, sy);
        ctx.translate(-11, -14);
      }
      const airborne = !player.grounded;
      ctx.fillStyle = palette.dark;
      if (airborne) { ctx.fillRect(0, 9, 8, 4); ctx.fillRect(15, 7, 8, 4); }
      else { ctx.fillRect(0, 10, 8, 4); ctx.fillRect(14, 10, 8, 4); }
      ctx.fillStyle = palette.feet || palette.accents || palette.light;
      if (airborne) { ctx.fillRect(1, 9, 6, 2); }
      else { ctx.fillRect(1, 10, 6, 2); ctx.fillRect(15, 10, 6, 2); }
      ctx.fillStyle = palette.arms || palette.accents || palette.light;
      if (airborne) ctx.fillRect(16, 8, 6, 2);
      else ctx.fillRect(17, 7, 4, 2);
      ctx.fillStyle = palette.dark;
      ctx.fillRect(3, 5, 17, 8); ctx.fillRect(6, 2, 13, 4); ctx.fillRect(15, 0, 5, 5);
      ctx.fillStyle = palette.mid;
      ctx.fillRect(4, 6, 15, 6); ctx.fillRect(7, 3, 11, 4);
      ctx.fillStyle = palette.bump || palette.crest || palette.accents || palette.light; ctx.fillRect(16, 1, 3, 4);
      ctx.fillStyle = getFrogAccentHighlight(palette); ctx.fillRect(5, 6, 10, 2); ctx.fillRect(8, 3, 7, 2);
      ctx.fillStyle = palette.belly; ctx.fillRect(10, 9, 8, 3);
      if (palette.hat && palette.hat !== "none") {
        if (hatUsesEyeOverlay(palette.hat)) {
          ctx.fillStyle = COLORS.white; ctx.fillRect(16, 1, 3, 3);
          ctx.fillStyle = COLORS.ink; if (!(player.blinking || upsideDown)) ctx.fillRect(18, 2, 1, 2); else ctx.fillRect(16, 3, 3, 1);
          drawPixelFrogHat(11, 1, palette.hat, 1, 1, palette);
        } else {
          drawPixelFrogHat(11, 0, palette.hat, 1, 1, palette);
          drawSideEyeOverHat(11, 0, palette, 1, player.blinking || upsideDown, 1, 5);
        }
      } else {
        ctx.fillStyle = COLORS.white; ctx.fillRect(16, 1, 3, 3);
        ctx.fillStyle = COLORS.ink;
        if (!(player.blinking || upsideDown)) ctx.fillRect(18, 2, 1, 2); else ctx.fillRect(16, 3, 3, 1);
      }
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(18, 6, 3, 1);
      ctx.restore();

      drawPvpCatchSparkles(player, palette);
      drawPvpWrongCatchBubbles(player);
      if (player.stunCountdownStarted && player.stunTimer > 0) {
        const spin = game.visualTime * 4 + player.index * Math.PI;
        ctx.fillStyle = COLORS.flyYellow;
        for (let i = 0; i < 3; i += 1) {
          const angle = spin + i * Math.PI * 2 / 3;
          ctx.fillRect(Math.round(baseX + Math.cos(angle) * 12), Math.round(player.y - 7 + Math.sin(angle) * 4), 2, 2);
        }
        drawBitmapText(String(Math.max(1, Math.ceil(player.stunTimer))), baseX, player.y - 16, 1, "center", palette.dark, COLORS.white);
      }
    }

    function drawPvpCrown(x, y, earned, palette, scale = 1) {
      const s = scale;
      const px = (value) => Math.round(value * s);
      const dark = earned ? "#8b5311" : "#293036";
      const mid = earned ? "#e1a225" : "#4b5459";
      const light = earned ? "#ffd85a" : "#737d82";
      const jewelA = palette?.dark || "#fff0a0";
      const jewelB = palette?.mid || palette?.light || "#fff7cf";
      const jewelC = palette?.light || jewelB;
      ctx.fillStyle = dark;
      ctx.fillRect(Math.round(x + 1*s), Math.round(y + 2*s), px(9), px(6));
      ctx.fillRect(Math.round(x), Math.round(y), px(3), px(4));
      ctx.fillRect(Math.round(x + 4*s), Math.round(y - 1*s), px(3), px(5));
      ctx.fillRect(Math.round(x + 8*s), Math.round(y), px(3), px(4));
      ctx.fillStyle = mid;
      ctx.fillRect(Math.round(x + 2*s), Math.round(y + 2*s), px(7), px(4));
      ctx.fillRect(Math.round(x + 1*s), Math.round(y + 1*s), px(2), px(2));
      ctx.fillRect(Math.round(x + 5*s), Math.round(y), px(2), px(3));
      ctx.fillRect(Math.round(x + 8*s), Math.round(y + 1*s), px(2), px(2));
      ctx.fillStyle = light;
      ctx.fillRect(Math.round(x + 3*s), Math.round(y + 2*s), px(5), px(2));
      if (earned) {
        ctx.fillStyle = jewelA;
        ctx.fillRect(Math.round(x + 1*s), Math.round(y + 1*s), Math.max(1, px(1)), Math.max(1, px(1)));
        ctx.fillStyle = jewelB;
        ctx.fillRect(Math.round(x + 5*s), Math.round(y + 0*s), Math.max(1, px(1)), Math.max(1, px(1)));
        ctx.fillStyle = jewelC;
        ctx.fillRect(Math.round(x + 8*s), Math.round(y + 1*s), Math.max(1, px(1)), Math.max(1, px(1)));
      }
    }

    function previewPathOverlapsRect(points, rect, padding = 5) {
      if (!Array.isArray(points) || !points.length || !rect) return false;
      return points.some((point) =>
        point.x >= rect.x - padding && point.x <= rect.x + rect.w + padding &&
        point.y >= rect.y - padding && point.y <= rect.y + rect.h + padding
      );
    }


    function buildMixedPalette(primary, secondary) {
      const a = primary || getSelectedSkin();
      const b = secondary || a;
      return {
        dark: mixHexColors(a.dark || a.mid || "#6b6bb3", b.dark || b.mid || "#8863a8", 0.5),
        mid: mixHexColors(a.mid || a.light || "#9372d4", b.mid || b.light || "#aa83d6", 0.5),
        light: mixHexColors(a.light || a.belly || "#cbb6ff", b.light || b.belly || "#dbc6ff", 0.5),
        belly: mixHexColors(a.belly || a.light || "#efe6ff", b.belly || b.light || "#f6eeff", 0.5),
        accents: mixHexColors(a.accents || a.light || "#cbb6ff", b.accents || b.light || "#dbc6ff", 0.5)
      };
    }

    function getPvpImminentCatchFly(player) {
      if (!player) return null;
      if (player.tongue?.active) {
        const chained = flies.find((fly) => fly.id === player.tongue.targetFlyId && fly.state === "active" && flyMatchesPrompt(fly));
        if (chained) return chained;
      }
      const mouth = getPvpMouth(player);
      let best = null;
      let bestDist = Infinity;
      for (const fly of flies) {
        if (!fly || fly.state !== "active" || !flyMatchesPrompt(fly) || pvpFlyBlockedForPlayer(fly, player)) continue;
        const dist = Math.hypot((fly.x || fly.baseX) - mouth.x, (fly.y || fly.baseY) - mouth.y);
        const bodyDist = Math.hypot((fly.x || fly.baseX) - (player.x + player.w / 2), (fly.y || fly.baseY) - (player.y + player.h / 2));
        if (dist <= 30 || bodyDist <= 26 || pvpPlayerTouchesFly(player, fly)) {
          if (bodyDist < bestDist) {
            bestDist = bodyDist;
            best = fly;
          }
        }
      }
      return best;
    }

    function drawPvpOffscreenIndicator(player) {
      if (!player || player.y + player.h >= 0 || !["playing", "paused", "countdown"].includes(game.state)) return;
      const centerX = Math.round(clamp(player.x + player.w / 2, 12, W - 12));
      const overlapsLeftHud = centerX < 92;
      const overlapsRightHud = centerX > W - 72;
      const top = overlapsLeftHud || overlapsRightHud ? 30 : 4;
      const pulse = 0.88 + Math.sin(game.visualTime * 8) * 0.12;
      const palette = getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index);

      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "rgba(38,54,61,0.45)";
      ctx.fillRect(centerX - 7, top + 2, 16, 14);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(centerX - 7, top + 1, 14, 15);
      ctx.fillRect(centerX - 9, top + 4, 18, 9);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(centerX - 5, top + 3, 10, 11);
      ctx.fillRect(centerX - 7, top + 5, 14, 7);
      ctx.fillStyle = palette.dark;
      ctx.fillRect(centerX - 1, top + 6, 3, 6);
      ctx.fillRect(centerX - 4, top + 6, 9, 2);
      ctx.fillRect(centerX - 3, top + 4, 7, 2);
      ctx.fillRect(centerX - 2, top + 3, 5, 2);
      ctx.fillStyle = palette.light;
      ctx.fillRect(centerX, top + 5, 1, 6);
      ctx.fillRect(centerX - 2, top + 6, 5, 1);
      ctx.restore();
    }

    function drawPvpSpeechBubble(player) {
      if (OnlineVersus.isActive() && player.index !== OnlineVersus.localIndex()) return;
      if (player.firstJumpMade || game.state !== "playing") return;
      if (game.pvpCpuEnabled && player.index === 1) return;
      const x = player.index === 0 ? 10 : W - 136;
      const y = 126;
      const w = 126;
      const h = 42;
      const bubbleRect = { x, y, w, h: h + 14 };
      const flyBehind = flies.some((currentFly) =>
        currentFly.state === "active" &&
        currentFly.baseX >= x - 8 && currentFly.baseX <= x + w + 8 &&
        currentFly.baseY >= y - 8 && currentFly.baseY <= y + h + 14
      );
      const jumpPreviewBehind = player.charging && previewPathOverlapsRect(getPvpPreviewPoints(player), bubbleRect, 5);
      const opponent = pvpPlayers[player.index === 0 ? 1 : 0];
      const opponentBehind = Boolean(opponent &&
        opponent.x + opponent.w >= bubbleRect.x && opponent.x <= bubbleRect.x + bubbleRect.w &&
        opponent.y + opponent.h >= bubbleRect.y && opponent.y <= bubbleRect.y + bubbleRect.h);

      ctx.save();
      ctx.globalAlpha = flyBehind || jumpPreviewBehind || opponentBehind ? 0.25 : 1;
      ctx.fillStyle = "rgba(38,54,61,0.42)";
      ctx.fillRect(x + 4, y + 4, w, h);
      const pointerX = player.index === 0 ? x + 56 : x + w - 68;
      ctx.fillRect(pointerX, y + h + 4, 12, 8);

      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x + 3, y, w - 6, h);
      ctx.fillRect(x, y + 4, w, h - 8);
      ctx.fillRect(pointerX, y + h, 12, 7);
      ctx.fillRect(pointerX + 3, y + h + 7, 6, 5);

      ctx.fillStyle = COLORS.white;
      ctx.fillRect(x + 4, y + 2, w - 8, h - 4);
      ctx.fillRect(x + 2, y + 6, w - 4, h - 12);
      ctx.fillRect(pointerX + 2, y + h - 1, 8, 7);
      ctx.fillRect(pointerX + 4, y + h + 6, 4, 3);

      const mobileInstructions = isRibbitMobileMode();
      const keyLabel = game.onlineMode || game.pvpCpuEnabled
        ? "SPACE"
        : (player.index === 0 ? "LEFT SHIFT" : "RIGHT SHIFT");
      const mobileLabel = game.onlineMode || game.pvpCpuEnabled
        ? "HOLD JUMP METER"
        : `HOLD P${player.index + 1} JUMP BUTTON`;
      drawBitmapText(mobileInstructions ? mobileLabel : `HOLD ${keyLabel} TO CHARGE`, x + w / 2, y + 10, mobileInstructions ? 0.72 : 0.78, "center", "#4c555a");
      drawBitmapText("RELEASE TO JUMP", x + w / 2, y + 27, 0.92, "center", "#4c555a");
      ctx.restore();
    }



    function drawMirroredMiniFrogSwatch(rightX, y, skin, scale) {
      ctx.save();
      ctx.translate(rightX, 0);
      ctx.scale(-1, 1);
      drawMiniFrogSwatch(0, y, skin, scale);
      ctx.restore();
    }

    function drawPvpHud() {
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(0, CONFIG.playBottom, W, 3);
      ctx.fillStyle = COLORS.panel;
      ctx.fillRect(0, CONFIG.playBottom + 3, W, H - CONFIG.playBottom - 3);
      ctx.fillStyle = COLORS.panelLight;
      ctx.fillRect(0, CONFIG.playBottom + 3, W, 2);

      const target = getPvpTargetScore();
      const timedRound = game.pvpTimeLimitSeconds > 0 && !game.pvpSuddenDeath;
      const tutorialPvp = Boolean(game.tutorialActive && window.RibbitRaceTutorialEngine?.active && window.RibbitRaceTutorialEngine?.kind === "pvp");
      const tutorialFinalMatch = tutorialPvp && window.RibbitRaceTutorialEngine?.setup === "pvpFinalMatch";
      const boxes = [
        { player: pvpPlayers[0], x: 8, label: "P1", mirror: false },
        { player: pvpPlayers[1], x: W - 84, label: game.pvpCpuEnabled ? "CPU" : "P2", mirror: true }
      ];
      boxes.forEach(({ player, x, label, mirror }) => {
        const palette = getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index);
        ctx.fillStyle = COLORS.ink;
        ctx.fillRect(x, 7, 76, 20);
        ctx.fillStyle = palette.belly;
        ctx.fillRect(x + 2, 9, 72, 16);
        ctx.fillStyle = palette.light;
        ctx.fillRect(x + 4, 11, 68, 3);
        const rawScore = game.pvpSuddenDeath ? game.pvpSuddenDeathScores[player.index] : player.score;
        const score = tutorialPvp && !tutorialFinalMatch ? 0 : rawScore;
        const scoreText = tutorialPvp && !tutorialFinalMatch
          ? `${label} ${score}`
          : timedRound ? `${label} ${score}` : `${label} ${score} / ${target}`;
        if (mirror) {
          drawMirroredMiniFrogSwatch(x + 70, 13, palette, 0.55);
          drawBitmapText(scoreText, x + 30, 14, 1, "center", palette.dark);
        } else {
          drawMiniFrogSwatch(x + 7, 13, palette, 0.55);
          drawBitmapText(scoreText, x + 47, 14, 1, "center", palette.dark);
        }
      });

      const p1Palette = getPvpSkinPalette(pvpPlayers[0].skinId, "azure", 0);
      const p2Palette = getPvpSkinPalette(pvpPlayers[1].skinId, "crimson", 1);
      // Round-win crowns are irrelevant in tutorial lessons, even in the
      // final single-round race. This does not affect Ember's crown hat.
      if (!tutorialPvp) {
        const roundsToWin = getPvpRoundsToWin();
        for (let slot = 0; slot < roundsToWin; slot += 1) {
          drawPvpCrown(88 + slot * 12, 12, game.pvpRoundWins[0] > slot, p1Palette);
          drawPvpCrown(W - 100 - slot * 12, 12, game.pvpRoundWins[1] > slot, p2Palette);
        }
      }

      if (["playing", "countdown", "paused", "pvpCelebration"].includes(game.state)) {
        const pauseSkin = getPvpSkinPalette(pvpPlayers[0].skinId, "azure", 0);
        drawHudPausePlaySprite(HUD_UI.pauseButton, game.state === "paused", pauseSkin);
      }

      drawVocabularyPrompt();
      const meterY = 247;
      const meterW = 112;
      const meterH = 12;
      const mobileHud = isRibbitMobileMode();
      [
        { player: pvpPlayers[0], x: 12, label: mobileHud
          ? (game.onlineMode ? (OnlineVersus.localIndex() === 0 ? "YOU - TAP METER" : (window.RibbitOpponentName?.() || "OPPONENT")) : game.pvpCpuEnabled ? "TAP METER" : "P1 JUMP")
          : (game.onlineMode ? (OnlineVersus.localIndex() === 0 ? "YOU - SPACE" : (window.RibbitOpponentName?.() || "OPPONENT")) : game.pvpCpuEnabled ? "SPACE" : "LEFT SHIFT"), palette: p1Palette },
        { player: pvpPlayers[1], x: W - 124, label: tutorialFinalMatch ? "EMBER" : mobileHud
          ? (game.onlineMode ? (OnlineVersus.localIndex() === 1 ? "YOU - TAP METER" : (window.RibbitOpponentName?.() || "OPPONENT")) : game.pvpCpuEnabled ? `CPU LV ${game.pvpCpuDifficulty}` : "P2 JUMP")
          : (game.onlineMode ? (OnlineVersus.localIndex() === 1 ? "YOU - SPACE" : (window.RibbitOpponentName?.() || "OPPONENT")) : game.pvpCpuEnabled ? `CPU LV ${game.pvpCpuDifficulty}` : "RIGHT SHIFT"), palette: p2Palette }
      ].forEach(({ player, x, label, palette }) => {
        const meterW = 112;
        ctx.fillStyle = COLORS.ink;
        ctx.fillRect(x - 2, meterY - 2, meterW + 4, meterH + 4);
        ctx.fillStyle = palette.belly;
        ctx.fillRect(x, meterY, meterW, meterH);
        const fill = player.charging ? player.charge : 0;
        if (fill > 0) {
          const gradient = ctx.createLinearGradient(x, 0, x + meterW, 0);
          gradient.addColorStop(0, palette.light);
          gradient.addColorStop(0.68, palette.mid);
          gradient.addColorStop(1, palette.dark);
          ctx.fillStyle = gradient;
          ctx.fillRect(x + 2, meterY + 2, Math.floor((meterW - 4) * fill), meterH - 4);
        }
        drawBitmapText(label, x + meterW / 2, meterY + 3, 0.62, "center", COLORS.white, COLORS.ink);
      });

      const urgentClock = !game.pvpSuddenDeath && game.pvpTimeLimitSeconds > 0 && game.pvpTimeRemaining > 0 && game.pvpTimeRemaining <= 5;
      const clock = game.pvpSuddenDeath
        ? "SUDDEN DEATH"
        : game.pvpTimeLimitSeconds > 0
          ? `${Math.ceil(game.pvpTimeRemaining)} SEC`
          : formatTime(game.pvpElapsed);
      // Tutorial lessons replace the timer with WATCH EMBER / YOUR TURN. Leave
      // the entire timer footprint transparent until the final 30-second match.
      if (!tutorialPvp || tutorialFinalMatch) {
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
        drawBitmapText(`ROUND ${game.pvpRoundNumber}  ${clock}`, W / 2, 10, 0.68, "center", urgentClock ? "#ffffff" : "#d9edf2", urgentClock ? "#65111b" : null);
      }
    }

    function getPvpRoundAchievementDefinitions() {
      const ids = Array.isArray(game.roundUnlockedPvpAchievementIds) ? game.roundUnlockedPvpAchievementIds : [];
      return ids.map((id) => getAchievementDefinition(id)).filter(Boolean);
    }

    function getPvpVictoryAchievementPageCount() {
      return Math.max(1, Math.ceil(getPvpRoundAchievementDefinitions().length / 2));
    }

    function clampPvpVictoryAchievementPage() {
      game.pvpVictoryAchievementPage = clamp(game.pvpVictoryAchievementPage || 0, 0, getPvpVictoryAchievementPageCount() - 1);
      return game.pvpVictoryAchievementPage;
    }

    function getPvpVictoryAchievementPageButtonRects() {
      return {
        // Keep the pager in the open strip between the achievement cards
        // (ending at y=191) and the result-menu buttons (starting at y=216).
        prev: { x: 48, y: 194, w: 20, h: 20 },
        next: { x: W - 68, y: 194, w: 20, h: 20 }
      };
    }

    function getPvpVictoryAchievementCardLayout() {
      const all = getPvpRoundAchievementDefinitions();
      clampPvpVictoryAchievementPage();
      const page = game.pvpVictoryAchievementPage || 0;
      const visible = all.slice(page * 2, page * 2 + 2);
      if (!visible.length) return [];
      const gap = 12;
      const cardY = 149;
      const cardH = 42;
      const cardW = visible.length === 1 ? 260 : 174;
      const totalCardsW = visible.length * cardW + Math.max(0, visible.length - 1) * gap;
      const startX = Math.round(W / 2 - totalCardsW / 2);
      return visible.map((definition, index) => ({ definition, x: startX + index * (cardW + gap), y: cardY, w: cardW, h: cardH }));
    }

    function getPvpVictoryButtonRects() {
      const hasAchievements = getPvpRoundAchievementDefinitions().length > 0;
      const y = OnlineVersus.isQuickplay() ? (hasAchievements ? 214 : 168) : (hasAchievements ? 216 : 174);
      return {
        replayButton: { x: 77, y, w: 98, h: 22 },
        selectButton: { x: 191, y, w: 98, h: 22 },
        homeButton: { x: 305, y, w: 98, h: 22 }
      };
    }

    function drawPvpSetupSkinButton(rect, playerIndex) {
      const validation = getPvpPreviewValidation();
      const id = validation.ids[playerIndex];
      const palette = getPvpSetupPreviewPalette(playerIndex);
      const focused = game.pvpSetupFocusArea === "skin" && game.pvpSetupPlayerIndex === playerIndex;
      const locked = validation.locked[playerIndex];
      const conflict = validation.sameSkin;
      const conflictOwner = Number.isInteger(game.pvpSetupConflictOwnerIndex) ? game.pvpSetupConflictOwnerIndex : 1;
      const showConflictX = conflict && playerIndex === conflictOwner;
      const invalid = locked || showConflictX;
      const selected = game.pvpSetupSkinIds[playerIndex] === id;
      const direction = playerIndex === 0 ? 1 : -1;
      const idleBob = (focused || selected) ? getTwoFrameMenuBob(0) : 0;
      ctx.fillStyle = "rgba(25,43,52,0.25)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      const frameColor = focused ? COLORS.ink : selected ? palette.dark : "#9aa9ae";
      const inset = focused ? 4 : selected ? 3 : 2;
      ctx.fillStyle = frameColor; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = locked ? "#d3dadd" : (focused ? mixHexColors(palette.belly, palette.mid, 0.08) : palette.belly);
      ctx.fillRect(rect.x + inset, rect.y + inset, rect.w - inset * 2, rect.h - inset * 2);
      ctx.fillStyle = locked ? "#bac5c9" : palette.light;
      ctx.fillRect(rect.x + inset + 3, rect.y + inset + 2, rect.w - inset * 2 - 6, 3);
      if (!OnlineVersus.isRoomMenu() || playerIndex === OnlineVersus.localIndex()) {
        drawPagerArrowIcon({ x: rect.x + 3, y: rect.y + 12, w: 15, h: 20 }, -1, "#48555a");
        drawPagerArrowIcon({ x: rect.x + rect.w - 18, y: rect.y + 12, w: 15, h: 20 }, 1, "#48555a");
      }
      const previewScale = 1.35;
      const previewTop = rect.y + 15 + idleBob;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.clip();
      if (locked) ctx.globalAlpha = 0.34;
      drawMiniFrogSwatchFacing(rect.x + rect.w / 2, previewTop, { ...palette, previewHatYOffset: 1 }, previewScale, direction);
      ctx.restore();
      const selectorLabel = OnlineVersus.isRoomMenu()
        ? OnlineVersus.roomPlayerLabel(playerIndex)
        : /^custom[1-3]$/.test(id)
          ? `CUSTOM ${Number(id.slice(-1))}`
          : (palette.name || String(id).toUpperCase());
      const selectorLabelScale = 0.78;
      drawBitmapText(selectorLabel, rect.x + rect.w / 2, rect.y + rect.h - 9, selectorLabelScale, "center", locked ? "#637074" : palette.dark);
      if (invalid) {
        const xColor = locked ? "#777f84" : "#7a2634";
        ctx.save(); ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2 - 1); ctx.rotate(Math.PI / 4); ctx.fillStyle = xColor;
        const thickness = 7;
        ctx.fillRect(-20, -Math.floor(thickness / 2), 40, thickness);
        ctx.rotate(Math.PI / 2); ctx.fillRect(-20, -Math.floor(thickness / 2), 40, thickness); ctx.restore();
        if (locked) drawMiniLockIcon(rect.x + rect.w - 11, rect.y + 5, 0.68);
      }
    }

    function drawPvpSetupActionButton(rect, label, selected, palette, iconDrawer = null) {
      if(OnlineVersus.isMenuVisible())return OnlineVersus.drawOnlineLegacyAction(rect,label,selected,palette);
      const hoverOnly = selected && game.pvpSetupMouseMode;
      const strong = selected && !hoverOnly;
      const neutral = { dark: "#48555a", mid: "#d0d5d7", light: "#f2f5f6" };
      ctx.fillStyle="rgba(25,43,52,0.28)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
      ctx.fillStyle=selected?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
      ctx.fillStyle=strong?neutral.mid:"#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
      ctx.fillStyle=selected?neutral.light:"#ffffff";ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,3);
      if(iconDrawer) iconDrawer(strong);
      drawBitmapText(label,rect.x+rect.w/2+(iconDrawer?9:0),rect.y+8,1,"center",strong?COLORS.white:"#48555a",strong?neutral.dark:null);
    }

    function drawPvpVsIcon(centerX, centerY, p1Palette, p2Palette) {
      const rect = PVP_SETUP_UI.vsButton;
      const focused = game.pvpSetupFocusArea === "vs";
      const active = game.pvpCpuEnabled;
      const leftPalette = p1Palette || PVP_NEUTRAL_PALETTE;
      const rightPalette = p2Palette || PVP_NEUTRAL_PALETTE;
      const label = active ? "CPU" : "VS";
      ctx.fillStyle="rgba(25,43,52,0.28)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
      ctx.fillStyle=focused?COLORS.ink:"#7f9096";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
      const innerX = rect.x + 2, innerY = rect.y + 2, innerW = rect.w - 4, innerH = rect.h - 4;
      const splitX = Math.floor(innerW / 2);
      ctx.fillStyle = leftPalette.mid; ctx.fillRect(innerX, innerY, splitX, innerH);
      ctx.fillStyle = rightPalette.mid; ctx.fillRect(innerX + splitX, innerY, innerW - splitX, innerH);
      ctx.fillStyle = leftPalette.light; ctx.fillRect(innerX + 3, innerY + 2, splitX - 4, 2);
      ctx.fillStyle = rightPalette.light; ctx.fillRect(innerX + splitX + 1, innerY + 2, innerW - splitX - 4, 2);
      drawBitmapText(label,centerX,rect.y+7,1,"center",COLORS.white,COLORS.ink);
      if(focused){ctx.fillStyle=COLORS.white;[[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy])=>ctx.fillRect(rect.x+dx,rect.y+dy,2,2));}
    }

    function drawPvpVsHoverTooltip() {
      if (OnlineVersus.isRoomMenu() || game.pvpSetupHoveredKey !== "vs") return;
      const message = game.pvpCpuEnabled
        ? "CLICK TO ENABLE LOCAL VERSUS"
        : "CLICK TO PLAY AGAINST CPU";
      const anchor = PVP_SETUP_UI.vsButton;
      const width = Math.max(142, Math.min(196, measureBitmapText(message, .50) + 18));
      const height = 22;
      const centerX = anchor.x + anchor.w / 2;
      const x = Math.round(centerX - width / 2);
      const y = anchor.y - height - 10;
      ctx.save();
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(x + 2, y + 2, width, height);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
      ctx.fillStyle = getSelectedSkin().light;
      ctx.fillRect(x + 5, y + 4, width - 10, 2);
      drawBitmapText(message, x + width / 2, y + 8, 0.50, "center", "#26363d");
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(Math.round(centerX) - 4, y + height, 9, 2);
      ctx.fillRect(Math.round(centerX) - 3, y + height + 2, 7, 2);
      ctx.fillRect(Math.round(centerX) - 2, y + height + 4, 5, 2);
      ctx.restore();
    }

    function drawPvpCpuDifficultyControl() {
      if(!game.pvpCpuEnabled) return;
      const rect=PVP_SETUP_UI.cpuDifficultyButton;
      const focused=game.pvpSetupFocusArea==="cpuDifficulty";
      const palette=PVP_NEUTRAL_PALETTE;
      ctx.fillStyle="rgba(25,43,52,0.28)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
      ctx.fillStyle=focused?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
      ctx.fillStyle=focused?mixHexColors(palette.belly,"#ffffff",0.12):"#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
      drawPagerArrowIcon({x:rect.x+2,y:rect.y,w:16,h:rect.h},-1,"#48555a");
      drawPagerArrowIcon({x:rect.x+rect.w-18,y:rect.y,w:16,h:rect.h},1,"#48555a");
      drawBitmapText(`CPU LV ${game.pvpCpuDifficulty}`,rect.x+rect.w/2,rect.y+4,0.62,"center",palette.dark);
    }

    function drawRandomStageIcon(centerX, topY, palette, scale = 1) {
      const s = scale;
      ctx.fillStyle = palette.dark;
      ctx.fillRect(centerX - 7 * s, topY + 1 * s, 14 * s, 14 * s);
      ctx.fillStyle = palette.light;
      ctx.fillRect(centerX - 5 * s, topY + 3 * s, 10 * s, 10 * s);
      ctx.fillStyle = palette.dark;
      [[-2,-2],[2,2],[-2,2],[2,-2],[0,0]].forEach(([dx,dy], index) => {
        if (index > 2) return;
        ctx.fillRect(centerX + dx * s - s, topY + 8 * s + dy * s - s, 2 * s, 2 * s);
      });
    }

    function drawMiniGearIcon(cx, cy, color = "#48555a") {
      ctx.fillStyle = color;
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      ctx.fillRect(cx - 7, cy - 2, 14, 4);
      ctx.fillRect(cx - 2, cy - 7, 4, 14);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
    }

    function drawMiniWifiIcon(cx, cy, color = "#48555a") {
      ctx.fillStyle = color;
      ctx.fillRect(cx - 5, cy - 7, 10, 2);
      ctx.fillRect(cx - 8, cy - 5, 3, 2);
      ctx.fillRect(cx + 5, cy - 5, 3, 2);
      ctx.fillRect(cx - 3, cy - 3, 6, 2);
      ctx.fillRect(cx - 5, cy - 1, 3, 2);
      ctx.fillRect(cx + 2, cy - 1, 3, 2);
      ctx.fillRect(cx - 1, cy + 2, 2, 2);
      ctx.fillRect(cx - 2, cy + 4, 4, 3);
    }

    function drawPvpSetupWifiButton() {
      const rect = PVP_SETUP_UI.wifiButton;
      const focused = (game.pvpSetupFocusArea === "bottom" && game.pvpSetupBottomSelection === "wifi") || game.pvpWifiButtonHovered;
      const palette = { dark: "#07516a", mid: "#0f9fbb", light: "#5ce5e8", belly: "#b8f5dc" };
      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = focused ? palette.dark : COLORS.ink;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = focused ? palette.belly : "#f7fdff";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.fillStyle = focused ? palette.light : "#ffffff";
      ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 2);
      drawMiniWifiIcon(rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, focused ? palette.mid : "#48555a");
      if (focused) {
        ctx.fillStyle = COLORS.white;
        [[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy]) => ctx.fillRect(rect.x + dx, rect.y + dy, 2, 2));
      }
    }


    function drawPvpSetupTutorialButton() {
      if (OnlineVersus.isRoomMenu()) return;
      const rect = PVP_SETUP_UI.tutorialButton;
      const focused = (game.pvpSetupFocusArea === "bottom" && game.pvpSetupBottomSelection === "tutorial") || game.pvpTutorialButtonHovered;
      const palette = { dark: "#5d5114", mid: "#d3b64f", light: "#f4e08e", belly: "#fff6d7" };
      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = focused ? palette.dark : COLORS.ink;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = focused ? palette.belly : "#f7fdff";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.fillStyle = focused ? palette.light : "#ffffff";
      ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 2);
      drawMiniTutorialBookIcon(rect.x + rect.w / 2, rect.y + rect.h / 2, focused ? palette.mid : "#48555a");
      if (focused) {
        ctx.fillStyle = COLORS.white;
        [[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy]) => ctx.fillRect(rect.x + dx, rect.y + dy, 2, 2));
      }
    }

    function drawPvpSetupSettingsButton() {
      const rect = PVP_SETUP_UI.settingsButton;
      const focused = game.pvpSetupFocusArea === "bottom" && game.pvpSetupBottomSelection === "settings";
      ctx.fillStyle = "rgba(25,43,52,0.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = focused ? PVP_NEUTRAL_PALETTE.dark : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = focused ? PVP_NEUTRAL_PALETTE.belly : "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      drawMiniGearIcon(rect.x + rect.w / 2, rect.y + rect.h / 2, focused ? PVP_NEUTRAL_PALETTE.mid : "#48555a");
    }

    function drawPvpSettingsScreen() {
      const skin = PVP_NEUTRAL_PALETTE;
      const chrome = TIME_OF_DAY_CHROME[game.timeOfDay] || TIME_OF_DAY_CHROME.afternoon;
      ctx.fillStyle = chrome.outer; ctx.fillRect(0,0,W,H);
      drawBackground(getPvpSetupPreviewLevelId());
      ctx.fillStyle = "rgba(18,33,41,0.28)"; ctx.fillRect(0,0,W,H);
      const panel={x:58,y:24,w:364,h:222};
      ctx.fillStyle="rgba(12,26,33,0.35)";ctx.fillRect(panel.x+7,panel.y+8,panel.w,panel.h);
      ctx.fillStyle=COLORS.ink;ctx.fillRect(panel.x+4,panel.y,panel.w-8,panel.h);ctx.fillRect(panel.x,panel.y+4,panel.w,panel.h-8);
      ctx.fillStyle="#f7fdff";ctx.fillRect(panel.x+7,panel.y+4,panel.w-14,panel.h-8);ctx.fillRect(panel.x+4,panel.y+8,panel.w-8,panel.h-16);
      ctx.fillStyle=skin.dark;ctx.fillRect(panel.x+12,panel.y+10,panel.w-24,38);ctx.fillStyle=skin.mid;ctx.fillRect(panel.x+14,panel.y+12,panel.w-28,33);ctx.fillStyle=skin.light;ctx.fillRect(panel.x+17,panel.y+14,panel.w-34,4);
      drawBitmapText("VERSUS SETTINGS",W/2,panel.y+20,1.65,"center",COLORS.white,skin.dark);
      const labels=[
        ["ROUND GOAL", getPvpRoundGoalLabel()],
        ["TIME LIMIT", game.pvpTimeLimitSeconds ? `${game.pvpTimeLimitSeconds} SEC` : "OFF"],
        ["MATCH", `BEST OF ${game.pvpBestOf}`],
        ["UNPAUSE", game.pvpUnpauseCountdown ? "3-2-1" : "INSTANT"]
      ];
      PVP_SETTINGS_UI.rows.forEach((rect,index)=>{
        const focused=game.pvpSettingsFocusIndex===index;
        ctx.fillStyle="rgba(25,43,52,0.25)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
        ctx.fillStyle=focused?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
        ctx.fillStyle=focused?skin.mid:"#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
        ctx.fillStyle=focused?skin.light:"#ffffff";ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,3);
        drawPagerArrowIcon({x:rect.x+8,y:rect.y+6,w:18,h:18},-1,focused?COLORS.white:"#48555a");
        drawPagerArrowIcon({x:rect.x+rect.w-26,y:rect.y+6,w:18,h:18},1,focused?COLORS.white:"#48555a");
        drawBitmapText(labels[index][0],rect.x+85,rect.y+8,0.82,"center",focused?COLORS.white:"#48555a",focused?skin.dark:null);
        drawBitmapText(labels[index][1],rect.x+210,rect.y+8,0.82,"center",focused?COLORS.white:skin.dark,focused?skin.dark:null);
      });
      if (isPvpEndlessMode()) {
        drawBitmapText("MOST FLIES BEFORE TIME EXPIRES WINS", W / 2, 204, 0.66, "center", "#59666b");
      } else if (game.pvpTimeLimitSeconds > 0) {
        drawBitmapText("TIME LIMIT ACTIVE • TIES GO TO SUDDEN DEATH", W / 2, 204, 0.66, "center", "#59666b");
      } else {
        drawBitmapText(`ROUND ENDS AT ${game.pvpFirstTo} CATCHES`, W / 2, 204, 0.66, "center", "#59666b");
      }
      drawPvpSetupActionButton(PVP_SETTINGS_UI.backButton,"BACK",game.pvpSettingsFocusIndex===4,{dark:"#48555a",mid:"#7d8a90",light:"#d8e1e4"});
      drawVersionLabel(panel.x + panel.w - 12, panel.y + panel.h - 10, "right");
    }

    function drawPvpSetupTimeButton() {
      const rect = PVP_SETUP_UI.timeButton;
      const focused = game.pvpSetupFocusArea === "bottom" && game.pvpSetupBottomSelection === "time";
      const unlocked = isTimeSelectUnlocked();
      const mode = unlocked ? (game.timeOfDayLock || "random") : "locked";
      ctx.fillStyle = "rgba(25,43,52,0.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = focused ? PVP_NEUTRAL_PALETTE.dark : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = unlocked ? "#f7fdff" : "#d6dde0"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      const cx=rect.x+rect.w/2, cy=rect.y+rect.h/2;
      ctx.save();ctx.beginPath();ctx.rect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);ctx.clip();
      if (!unlocked) drawMiniLockIcon(cx,rect.y+5,0.82);
      else if(mode==="afternoon")drawMiniSun(cx,cy,false);else if(mode==="morning")drawMiniSun(cx,cy,true);else if(mode==="night")drawMiniMoon(cx,cy);else drawMiniClockIcon(cx,cy,PVP_NEUTRAL_PALETTE);
      ctx.restore();
      if(focused){ctx.fillStyle=PVP_NEUTRAL_PALETTE.light;[[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy])=>ctx.fillRect(rect.x+dx,rect.y+dy,2,2));}
      if(!unlocked && (focused || game.pvpTimeButtonHovered)) {
        const remaining=Math.max(0,CONFIG.timeSelectFlyTarget-game.totalFliesEaten);
        const tip={x:252,y:201,w:182,h:24};
        ctx.fillStyle="rgba(25,43,52,.30)";ctx.fillRect(tip.x+2,tip.y+2,tip.w,tip.h);ctx.fillStyle=COLORS.ink;ctx.fillRect(tip.x,tip.y,tip.w,tip.h);ctx.fillStyle="#f7fdff";ctx.fillRect(tip.x+2,tip.y+2,tip.w-4,tip.h-4);
        drawBitmapText(`CATCH ${remaining} MORE ${remaining===1?"FLY":"FLIES"} TO UNLOCK!`,tip.x+tip.w/2,tip.y+8,0.72,"center","#48555a");
      }
    }

    function drawPvpSetupScreen() {
      const online = OnlineVersus.isRoomMenu();
      const previewLevelId=getPvpSetupPreviewLevelId();const level=LEVELS[previewLevelId]||LEVELS.park;const chrome=TIME_OF_DAY_CHROME[game.timeOfDay]||TIME_OF_DAY_CHROME.afternoon;
      ctx.fillStyle=chrome.outer;ctx.fillRect(0,0,W,H);drawBackground(previewLevelId);for(const platform of level.platforms)drawPlatform(platform,previewLevelId);drawTimeOfDayWorldTint(previewLevelId);ctx.fillStyle="rgba(18,33,41,.23)";ctx.fillRect(0,0,W,H);
      const panel={x:28,y:8,w:424,h:254};ctx.fillStyle="rgba(12,26,33,.34)";ctx.fillRect(panel.x+7,panel.y+8,panel.w,panel.h);ctx.fillStyle=COLORS.ink;ctx.fillRect(panel.x+4,panel.y,panel.w-8,panel.h);ctx.fillRect(panel.x,panel.y+4,panel.w,panel.h-8);ctx.fillStyle="#f7fdff";ctx.fillRect(panel.x+7,panel.y+4,panel.w-14,panel.h-8);ctx.fillRect(panel.x+4,panel.y+8,panel.w-8,panel.h-16);
      const p1Palette = getPvpSetupPreviewPalette(0);
      const p2Palette = getPvpSetupPreviewPalette(1);
      const previewValidation = getPvpPreviewValidation();
      ctx.fillStyle=p1Palette.dark;ctx.fillRect(panel.x+12,panel.y+9,(panel.w-24)/2,40);ctx.fillStyle=p2Palette.dark;ctx.fillRect(W/2,panel.y+9,(panel.w-24)/2,40);ctx.fillStyle=p1Palette.mid;ctx.fillRect(panel.x+14,panel.y+11,(panel.w-28)/2,35);ctx.fillStyle=p2Palette.mid;ctx.fillRect(W/2,panel.y+11,(panel.w-28)/2,35);ctx.fillStyle=p1Palette.light;ctx.fillRect(panel.x+17,panel.y+13,(panel.w-34)/2,4);ctx.fillStyle=p2Palette.light;ctx.fillRect(W/2,panel.y+13,(panel.w-34)/2,4);drawBitmapText(online ? "ONLINE" : "VERSUS",W/2,panel.y+19,1.75,"center",COLORS.white,COLORS.ink);
      if (online) drawBitmapText(`ROOM ID: ${OnlineVersus.roomCode()}`, W/2, panel.y+36, .76, "center", COLORS.white, COLORS.ink);
      const timeLabel=game.timeOfDayLock?getTimeOfDayLabel():"RANDOM TIME";
      const subheading = online ? OnlineVersus.statusText() : `CHOOSE A STAGE • ${timeLabel}`;
      const subscale = Math.min(.82, 384 / Math.max(1, measureBitmapText(subheading, 1)));
      drawBitmapText(subheading,W/2,62,subscale,"center","#59666b");
      PVP_SETUP_UI.levelButtons.forEach((rect,index)=>{
        const id=rect.id;
        const random=id==="random";
        const palette=random?PVP_RANDOM_STAGE_PALETTE:(LEVEL_MENU_COLORS[id]||LEVEL_MENU_COLORS.park);
        const selected=game.pvpSetupLevelId===id;
        const focused=game.pvpSetupFocusArea==="level"&&game.pvpSetupLevelIndex===index;
        ctx.fillStyle="rgba(25,43,52,.25)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
        ctx.fillStyle=selected||focused?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
        if(selected){
          ctx.fillStyle=palette.mid;ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
          ctx.fillStyle=palette.light;ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,3);
        }else if(focused){
          ctx.fillStyle="#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
          ctx.fillStyle=palette.light;ctx.fillRect(rect.x+4,rect.y+4,rect.w-8,4);
          ctx.fillStyle=palette.mid;ctx.fillRect(rect.x+2,rect.y+rect.h-3,rect.w-4,1);
        }else{
          ctx.fillStyle="#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
          ctx.fillStyle="#ffffff";ctx.fillRect(rect.x+4,rect.y+4,rect.w-8,4);
        }
        if(random)drawRandomStageIcon(rect.x+12,rect.y+4,palette,.58);else drawLevelUnlockIcon(id,rect.x+10,rect.y+6,palette,.56);
        drawBitmapText(random?"RANDOM":LEVELS[id].name,rect.x+59,rect.y+8,.90,"center",selected?COLORS.white:"#34484f",selected?palette.dark:null);
      });
      drawPvpSetupSkinButton(PVP_SETUP_UI.p1Selector,0);drawPvpSetupSkinButton(PVP_SETUP_UI.p2Selector,1);
      if (online) { OnlineVersus.drawRoomMiddle(); OnlineVersus.drawReadyBars(); }
      else { drawPvpVsIcon(W / 2, 184, p1Palette, p2Palette); drawPvpCpuDifficultyControl(); drawPvpVsHoverTooltip(); }
      const bottomFocused=game.pvpSetupFocusArea==="bottom";
      drawPvpSetupActionButton(
        PVP_SETUP_UI.startButton,
        online ? (!OnlineVersus.directReady() ? "CHECKING LINK" : OnlineVersus.localReady() ? "UNREADY" : "READY") : "START",
        bottomFocused&&game.pvpSetupBottomSelection==="start",
        previewValidation.invalid ? { dark: "#6d777c", mid: "#cfd6d9", light: "#f1f4f5" } : p1Palette,
        (selected) => drawMiniPlayIcon(PVP_SETUP_UI.startButton.x + 8, PVP_SETUP_UI.startButton.y + 4, selected ? COLORS.white : (previewValidation.invalid ? "#6d777c" : PVP_NEUTRAL_PALETTE.dark))
      );
      drawPvpSetupActionButton(
        PVP_SETUP_UI.backButton,
        online ? "LEAVE" : "BACK",
        bottomFocused&&game.pvpSetupBottomSelection==="back",
        {dark:"#48555a",mid:"#7d8a90",light:"#d8e1e4"},
        () => drawMiniHouseIcon(PVP_SETUP_UI.backButton.x + 7, PVP_SETUP_UI.backButton.y + 4)
      );
      drawPvpSetupWifiButton();
      drawPvpSetupTutorialButton();
      if (!online || OnlineVersus.isHost()) { drawPvpSetupSettingsButton();drawPvpSetupTimeButton(); }
    }


    function drawPvpHappyDanceFrog(centerX, groundY, player, scale = 1) {
      const palette = getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index);
      const cycle = (game.visualTime * 1.8 + player.index * 0.18) % 1;
      const lift = Math.round(Math.max(0, Math.sin(cycle * Math.PI)) * 10 * scale);
      const y = groundY - 14 * scale - lift;
      ctx.save(); ctx.globalAlpha = 0.30; ctx.fillStyle = COLORS.ink;
      ctx.fillRect(Math.round(centerX - 8 * scale), Math.round(groundY + 1), Math.max(2, Math.round(16 * scale)), Math.max(1, Math.round(2 * scale))); ctx.restore();
      drawMiniFrogSwatchFacing(centerX, y, palette, scale, player.index === 1 ? -1 : 1);
      const armY = Math.round(y + (lift > 2 ? 2 : 7));
      ctx.fillStyle = palette.dark;
      ctx.fillRect(Math.round(centerX - 13 * scale), armY, Math.max(2, Math.round(4 * scale)), Math.max(1, Math.round(2 * scale)));
      ctx.fillRect(Math.round(centerX + 9 * scale), armY, Math.max(2, Math.round(4 * scale)), Math.max(1, Math.round(2 * scale)));
      ctx.fillStyle = (Math.floor(game.visualTime * 8) + player.index) % 2 ? COLORS.flyYellow : palette.light;
      ctx.fillRect(Math.round(centerX - 17 * scale), Math.round(y - 4 * scale), 2, 2);
      ctx.fillRect(Math.round(centerX + 15 * scale), Math.round(y - 1 * scale), 2, 2);
    }

    function drawPvpVictoryDanceFrogExact(centerX, groundY, player, scale = 1) {
      const palette = getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index);
      const danceTime = game.visualTime;
      const cycle = (danceTime * 1.65) % 1;
      const jumpCurve = Math.max(0, Math.sin(cycle * Math.PI));
      const lift = Math.round(Math.pow(jumpCurve, 0.82) * 10 * scale);
      const airborne = lift > 1;
      const nearLanding = cycle < 0.08 || cycle > 0.92;
      const scaleX = (nearLanding ? 1.10 : airborne ? 0.96 : 1) * scale;
      const scaleY = (nearLanding ? 0.90 : airborne ? 1.05 : 1) * scale;
      const baseY = groundY - lift;
      const armBeat = Math.sin(danceTime * 13) >= 0;

      ctx.save();
      ctx.globalAlpha = 0.30;
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(Math.round(centerX - 8 * scale), Math.round(groundY + scale), Math.round(16 * scale), Math.max(1, Math.round(2 * scale)));
      ctx.restore();

      ctx.save();
      ctx.translate(centerX, baseY);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-12, -16);
      ctx.fillStyle = palette.dark;
      if (airborne) {
        ctx.fillRect(-1, armBeat ? 3 : 5, 6, 3); ctx.fillRect(19, armBeat ? 5 : 3, 6, 3);
        ctx.fillStyle = palette.arms || palette.light;
        ctx.fillRect(0, armBeat ? 3 : 5, 4, 1); ctx.fillRect(20, armBeat ? 5 : 3, 4, 1);
      } else {
        ctx.fillRect(0, 7, 5, 3); ctx.fillRect(19, 7, 5, 3);
        ctx.fillStyle = palette.arms || palette.light;
        ctx.fillRect(1, 7, 3, 1); ctx.fillRect(20, 7, 3, 1);
      }
      ctx.fillStyle = palette.dark;
      if (airborne) {
        ctx.fillRect(4, 12, 7, 4); ctx.fillRect(13, 12, 7, 4);
        ctx.fillStyle = palette.feet || palette.light;
        ctx.fillRect(5, 12, 5, 2); ctx.fillRect(14, 12, 5, 2);
      } else {
        ctx.fillRect(0, 12, 9, 4); ctx.fillRect(15, 12, 9, 4);
        ctx.fillStyle = palette.feet || palette.light;
        ctx.fillRect(1, 12, 7, 2); ctx.fillRect(16, 12, 7, 2);
      }
      ctx.fillStyle = palette.dark;
      ctx.fillRect(3, 4, 18, 10); ctx.fillRect(6, 1, 12, 5); ctx.fillRect(3, 0, 6, 5); ctx.fillRect(15, 0, 6, 5);
      ctx.fillStyle = palette.mid;
      ctx.fillRect(4, 5, 16, 8); ctx.fillRect(7, 2, 10, 4);
      ctx.fillStyle = palette.crest || palette.bump || palette.light;
      ctx.fillRect(4, 1, 4, 4); ctx.fillRect(16, 1, 4, 4);
      ctx.fillStyle = getFrogAccentHighlight(palette);
      ctx.fillRect(5, 5, 14, 2); ctx.fillRect(8, 2, 8, 2);
      ctx.fillStyle = palette.belly;
      ctx.fillRect(7, 8, 10, 5);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(5, 1, 3, 3); ctx.fillRect(16, 1, 3, 3);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(6, 2, 1, 2); ctx.fillRect(17, 2, 1, 2); ctx.fillRect(9, 6, 2, 1); ctx.fillRect(13, 6, 2, 1); ctx.fillRect(10, 7, 4, 1);
      ctx.fillStyle = palette.tongue || COLORS.tongue;
      ctx.fillRect(11, 8, 2, 1);
      ctx.restore();
      if (palette.hat && palette.hat !== "none") {
        ctx.save();ctx.translate(centerX,baseY);ctx.scale(scaleX,scaleY);
        const front={...palette,frontFacing:true};
        if(hatUsesEyeOverlay(palette.hat))drawFrontEyesOverHat(0,-16,palette,1);
        drawPixelFrogHat(0,-15,palette.hat,1,1,front);
        if(!hatUsesEyeOverlay(palette.hat))drawFrontEyesOverHat(0,-16,palette,1);
        ctx.restore();
      }

      const twinkle = Math.floor(danceTime * 7) % 2;
      ctx.fillStyle = twinkle ? COLORS.flyYellow : COLORS.white;
      ctx.fillRect(Math.round(centerX - 17 * scale), Math.round(baseY - 21 * scale), Math.max(1, Math.round(2 * scale)), Math.max(1, Math.round(2 * scale)));
      ctx.fillRect(Math.round(centerX + 15 * scale), Math.round(baseY - 18 * scale), Math.max(1, Math.round(2 * scale)), Math.max(1, Math.round(2 * scale)));
      ctx.fillStyle = palette.light;
      ctx.fillRect(Math.round(centerX - 16 * scale), Math.round(baseY - 24 * scale), Math.max(1, Math.round(scale)), Math.max(2, Math.round(6 * scale)));
      ctx.fillRect(Math.round(centerX + 16 * scale), Math.round(baseY - 21 * scale), Math.max(1, Math.round(scale)), Math.max(2, Math.round(6 * scale)));
    }

    function drawPvpGameplaySadFrog(centerX, groundY, player, scale = 1) {
      // Gameplay-only loser animation: face the camera and clap for the winner.
      // The result-screen crying animation remains unchanged.
      const palette = getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index);
      const clapTogether = Math.floor(game.visualTime * 7.5 + player.index * 0.5) % 2 === 0;
      const topY = groundY - 16 * scale;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(Math.round(centerX - 8 * scale), Math.round(groundY + 1), Math.max(2, Math.round(16 * scale)), Math.max(1, Math.round(2 * scale)));
      ctx.restore();

      ctx.save();
      ctx.translate(centerX, groundY);
      ctx.scale(scale, scale);
      ctx.translate(-12, -16);
      ctx.fillStyle = palette.dark;
      ctx.fillRect(0, 12, 9, 4); ctx.fillRect(15, 12, 9, 4);
      ctx.fillStyle = palette.feet || palette.light;
      ctx.fillRect(1, 12, 7, 2); ctx.fillRect(16, 12, 7, 2);
      ctx.fillStyle = palette.dark;
      ctx.fillRect(3, 4, 18, 10); ctx.fillRect(6, 1, 12, 5); ctx.fillRect(3, 0, 6, 5); ctx.fillRect(15, 0, 6, 5);
      ctx.fillStyle = palette.mid;
      ctx.fillRect(4, 5, 16, 8); ctx.fillRect(7, 2, 10, 4);
      ctx.fillStyle = palette.crest || palette.bump || palette.light;
      ctx.fillRect(4, 1, 4, 4); ctx.fillRect(16, 1, 4, 4);
      ctx.fillStyle = getFrogAccentHighlight(palette);
      ctx.fillRect(5, 5, 14, 2); ctx.fillRect(8, 2, 8, 2);
      ctx.fillStyle = palette.belly;
      ctx.fillRect(7, 8, 10, 5);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(5, 1, 3, 3); ctx.fillRect(16, 1, 3, 3);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(6, 2, 1, 2); ctx.fillRect(17, 2, 1, 2);
      ctx.fillRect(9, 7, 6, 1);
      ctx.fillStyle = palette.dark;
      if (clapTogether) {
        ctx.fillRect(8, 8, 4, 3); ctx.fillRect(12, 8, 4, 3);
        ctx.fillStyle = palette.arms || palette.light;
        ctx.fillRect(9, 8, 3, 1); ctx.fillRect(12, 8, 3, 1);
      } else {
        ctx.fillRect(-1, 7, 6, 3); ctx.fillRect(19, 7, 6, 3);
        ctx.fillStyle = palette.arms || palette.light;
        ctx.fillRect(0, 7, 4, 1); ctx.fillRect(20, 7, 4, 1);
      }
      ctx.restore();

      if (palette.hat && palette.hat !== "none") {
        if (hatUsesEyeOverlay(palette.hat)) {
          drawFrontEyesOverHat(centerX, topY, palette, scale);
          drawPixelFrogHat(centerX, topY + scale, palette.hat, scale, 1, {...palette,frontFacing:true});
        } else {
          drawPixelFrogHat(centerX, topY + scale, palette.hat, scale, 1, {...palette,frontFacing:true});
          drawFrontEyesOverHat(centerX, topY, palette, scale);
        }
      }
    }

    function drawPvpSadCryingFrog(centerX, groundY, player, scale = 1) {
      const palette = getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index);
      const wobble = Math.sin(game.visualTime * 5 + player.index) * 1.3;
      const y = groundY - 14 * scale + 2 + Math.round(Math.abs(wobble));
      ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = COLORS.ink;
      ctx.fillRect(Math.round(centerX - 8 * scale), Math.round(groundY + 1), Math.max(2, Math.round(16 * scale)), Math.max(1, Math.round(2 * scale))); ctx.restore();
      drawMiniFrogSwatchFacing(centerX, y, palette, scale, player.index === 1 ? -1 : 1);
      const tearPhase = (game.visualTime * 1.7 + player.index * 0.4) % 1;
      ctx.fillStyle = "#7fdcff";
      ctx.fillRect(Math.round(centerX + (player.index === 1 ? -5 : 5) * scale), Math.round(y + 5 * scale + tearPhase * 8), 2, 3);
      if (tearPhase > 0.55) { ctx.fillStyle = "#bfefff"; ctx.fillRect(Math.round(centerX + (player.index === 1 ? -6 : 6) * scale), Math.round(groundY + 1), 4, 1); }
      ctx.fillStyle = palette.dark;
      ctx.fillRect(Math.round(centerX - 4 * scale), Math.round(y + 7 * scale), Math.max(2, Math.round(8 * scale)), 1);
    }

    function drawPvpVictoryButtons() {
      const rects = getPvpVictoryButtonRects();
      const winnerDecided = game.pvpMatchWinnerIndex !== null;
      if(OnlineVersus.isQuickplay()&&!winnerDecided){
        drawPvpSetupActionButton({x:130,y:rects.replayButton.y,w:220,h:22},OnlineVersus.quickSecondsLeft()>0?`NEXT ROUND IN ${OnlineVersus.quickSecondsLeft()}`:'NEXT ROUND STARTING',false,PVP_NEUTRAL_PALETTE);
        return;
      }
      const buttons = [
        {
          id: "replay",
          rect: rects.replayButton,
          label: winnerDecided ? "REMATCH" : OnlineVersus.isGuestActive() ? "WAITING" : "NEXT ROUND",
          palette: getPvpSkinPalette(pvpPlayers[game.pvpWinnerIndex ?? 0].skinId, game.pvpWinnerIndex === 1 ? "crimson" : "azure")
        },
        {
          id: "select",
          rect: rects.selectButton,
          label: "SELECT",
          palette: { dark: "#48555a", mid: "#7d8a90", light: "#d8e1e4" }
        },
        {
          id: "home",
          rect: rects.homeButton,
          label: "HOME",
          palette: { dark: "#48555a", mid: "#7d8a90", light: "#d8e1e4" }
        }
      ];
      buttons.forEach(({ id, rect, label, palette }) => {
        if(OnlineVersus.isQuickplay())label=OnlineVersus.quickVictoryLabel(id);
        const hovered = game.pvpVictoryHoveredSelection === id;
        const pressed = game.pvpVictoryPressedSelection === id;
        const selected = hovered || pressed || (!game.pvpVictoryMouseMode && game.victorySelection === id);
        const useStrongSelection = true;
        ctx.fillStyle = "rgba(25,43,52,0.28)";
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
        ctx.fillStyle = selected && useStrongSelection ? COLORS.ink : "#9aa9ae";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = selected && useStrongSelection ? palette.mid : "#f7fdff";
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
        ctx.fillStyle = selected && useStrongSelection ? palette.light : "#ffffff";
        ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 3);
        let labelOffset = 10;
        if (id === "replay") {
          if (winnerDecided) {
            drawMiniRestartIcon(rect.x + 8, rect.y + 4, selected ? COLORS.white : palette.dark);
          } else {
            drawMiniOutlinedPlayIcon(rect.x + 8, rect.y + 4, selected ? COLORS.white : palette.dark, selected);
          }
          labelOffset = 11;
        } else if (id === "select") {
          drawMiniGamepadIcon(rect.x + 5, rect.y + 4, selected ? COLORS.white : palette.dark);
          labelOffset = 12;
        } else {
          drawMiniHouseIcon(rect.x + 7, rect.y + 4);
        }
        drawBitmapText(label, rect.x + rect.w / 2 + labelOffset, rect.y + 8, 1, "center", selected && useStrongSelection ? COLORS.white : "#48555a", selected && useStrongSelection ? palette.dark : null);
      });
    }

    function drawPvpWinScreen() {
      const winner = pvpPlayers[game.pvpWinnerIndex ?? 0];
      const loser = pvpPlayers[winner.index === 0 ? 1 : 0];
      const palette = getPvpSkinPalette(winner.skinId, winner.index === 0 ? "azure" : "crimson", winner.index);
      const matchWon = game.pvpMatchWinnerIndex !== null;
      const earnedAchievements = getPvpRoundAchievementDefinitions();
      const hasAchievements = earnedAchievements.length > 0;
      const panel = hasAchievements
        ? { x: 30, y: 10, w: 420, h: 238 }
        : { x: 68, y: 38, w: 344, h: 168 };

      ctx.fillStyle = "rgba(12,26,33,0.38)";
      ctx.fillRect(panel.x + 5, panel.y + 7, panel.w, panel.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h);
      ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8);
      ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);

      ctx.fillStyle = palette.dark;
      ctx.fillRect(panel.x + 12, panel.y + 10, panel.w - 24, 40);
      ctx.fillStyle = palette.mid;
      ctx.fillRect(panel.x + 14, panel.y + 12, panel.w - 28, 35);
      ctx.fillStyle = palette.light;
      ctx.fillRect(panel.x + 17, panel.y + 14, panel.w - 34, 4);
      const finalTutorialMatch = tutorial.active && tutorial.kind === "pvp" && tutorialStep()?.setup === "pvpFinalMatch";
      if (finalTutorialMatch) {
        drawBitmapText(winner.index === 1 ? "EMBER WINS!" : "YOU WIN!", W / 2, panel.y + 22, 1.5, "center", COLORS.white, palette.dark);
      } else {
        drawBitmapText(`PLAYER ${winner.index + 1}`, W / 2, panel.y + 16, 1.55, "center", COLORS.white, palette.dark);
        drawBitmapText(matchWon ? "WINS!" : `WINS ROUND ${game.pvpRoundNumber}!`, W / 2, panel.y + 30, 1.15, "center", COLORS.white, palette.dark);
      }
      const badgeX = winner.index === 0 ? panel.x + 29 : panel.x + panel.w - 29;
      drawMiniFrogSwatchFacing(badgeX, panel.y + 23, palette, 0.82, winner.index === 1 ? -1 : 1);

      const p1X = 144;
      const p2X = 336;
      const p1Palette = getPvpSkinPalette(pvpPlayers[0].skinId, "azure", 0);
      const p2Palette = getPvpSkinPalette(pvpPlayers[1].skinId, "crimson", 1);
      const showRoundCrowns = !(tutorial.active && tutorial.kind === "pvp" && tutorialStep?.()?.setup !== "pvpFinalMatch");
      const roundsToWin = getPvpRoundsToWin();
      const crownScale = 1.55;
      const crownStep = 19;
      const sideWidth = Math.round(11 * crownScale + Math.max(0, roundsToWin - 1) * crownStep);
      const crownGap = 36;
      const totalWidth = sideWidth * 2 + crownGap;
      const leftStart = Math.round(W / 2 - totalWidth / 2);
      const rightStart = Math.round(W / 2 + crownGap / 2);
      const crownY = panel.y + 60;
      if (showRoundCrowns) {
        for (let slot = 0; slot < roundsToWin; slot += 1) {
          drawPvpCrown(leftStart + slot * crownStep, crownY, game.pvpRoundWins[0] > slot, p1Palette, crownScale);
          drawPvpCrown(rightStart + slot * crownStep, crownY, game.pvpRoundWins[1] > slot, p2Palette, crownScale);
        }
        drawBitmapText("-", W / 2, crownY + 5, 1.25, "center", "#48555a");
      }

      const frogGround = panel.y + 116;
      const resultFrogScale = 1.78;
      if (winner.index === 0) {
        drawPvpHappyDanceFrog(p1X, frogGround, pvpPlayers[0], resultFrogScale);
        drawPvpSadCryingFrog(p2X, frogGround, pvpPlayers[1], resultFrogScale);
      } else {
        drawPvpSadCryingFrog(p1X, frogGround, pvpPlayers[0], resultFrogScale);
        drawPvpHappyDanceFrog(p2X, frogGround, pvpPlayers[1], resultFrogScale);
      }
      drawBitmapText(`${pvpPlayers[0].score} - ${pvpPlayers[1].score}`, W / 2, panel.y + 88, 1.05, "center", "#48555a");
      const displayedRoundTime = Number.isFinite(game.pvpFinalDisplayTime)
        ? game.pvpFinalDisplayTime
        : game.pvpElapsed;
      drawBitmapText(`TIME ${formatTime(displayedRoundTime)}`, W / 2, panel.y + 103, 0.82, "center", palette.dark);
      if(OnlineVersus.isQuickplay()&&matchWon){
        const message=OnlineVersus.quickVictoryMessage();
        const scale=Math.min(.56,310/Math.max(1,measureBitmapText(message,1)));
        drawBitmapText(message,W/2,hasAchievements?238:194,scale,"center","#59666b");
      }

      if (hasAchievements) {
        const cards = getPvpVictoryAchievementCardLayout();
        const pageCount = getPvpVictoryAchievementPageCount();
        cards.forEach((card) => {
          const { definition, x, y: cardY, w: cardW, h: cardH } = card;
          const hovered = game.pvpVictoryAchievementHoverId === definition.id;
          ctx.fillStyle = "rgba(25,43,52,0.28)";
          ctx.fillRect(x + 2, cardY + 2, cardW, cardH);
          ctx.fillStyle = hovered ? palette.light : palette.dark;
          ctx.fillRect(x, cardY, cardW, cardH);
          ctx.fillStyle = hovered
            ? mixHexColors(palette.belly, "#ffffff", 0.52)
            : mixHexColors(palette.belly, "#ffffff", 0.36);
          ctx.fillRect(x + 3, cardY + 3, cardW - 6, cardH - 6);
          ctx.fillStyle = palette.light;
          ctx.fillRect(x + 6, cardY + 6, cardW - 12, 3);
          drawAchievementIcon(definition.icon, x + 10, cardY + 12, true, 0.82);
          const textCenter = x + 42 + (cardW - 45) / 2;
          const titleWidth = Math.max(1, measureBitmapText(definition.name, 1));
          const titleScale = clamp((cardW - 56) / titleWidth, 0.56, 0.94);
          drawBitmapText(definition.name, textCenter, cardY + 14, titleScale, "center", palette.dark);
          drawBitmapText("HOVER FOR DETAILS", textCenter, cardY + 26, 0.46, "center", "#48555a");
          if (hovered) {
            drawAchievementHoverTooltip(
              { x, y: cardY, w: cardW, h: cardH },
              Array.isArray(definition.lines) ? definition.lines.slice(0, 2) : [],
              { x: panel.x + 10, y: panel.y + 52, w: panel.w - 20, h: panel.h - 60 },
              palette
            );
          }
        });
        if (pageCount > 1) {
          const pageButtons = getPvpVictoryAchievementPageButtonRects();
          const prevActive = true;
          const nextActive = true;
          [ ["prev", prevActive], ["next", nextActive] ].forEach(([direction, active]) => {
            const rect = pageButtons[direction];
            ctx.fillStyle = "rgba(25,43,52,0.20)";
            ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
            ctx.fillStyle = active ? palette.dark : "#aeb8bc";
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.fillStyle = active ? "#f7fdff" : "#e6ecef";
            ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
            drawPagerArrowIcon(rect, direction === "prev" ? -1 : 1, active ? palette.dark : "#95a2a7");
          });
          drawBitmapText(`${(game.pvpVictoryAchievementPage || 0) + 1}/${pageCount}`, W / 2, panel.y + 191, 0.62, "center", "#617177");
        }
      }

      drawPvpVictoryButtons();
    }

    function drawPvpGameplayCelebrationFrogs() {
      const winnerIndex = game.pvpCelebrationWinnerIndex ?? game.pvpWinnerIndex ?? 0;
      pvpPlayers.forEach((player) => {
        const center = player.x + player.w / 2;
        const localGroundY = player.y + player.h;
        if (player.index === winnerIndex) {
          drawPvpVictoryDanceFrogExact(center, localGroundY, player, 1.0);
        } else {
          drawPvpGameplaySadFrog(center, localGroundY, player, 1.0);
        }
      });
    }

    function drawPvpRoundCelebration() {
      const winnerIndex = game.pvpCelebrationWinnerIndex ?? 0;
      drawPvpGameplayCelebrationFrogs();
      const winner = getPvpSkinPalette(pvpPlayers[winnerIndex].skinId, winnerIndex === 0 ? "azure" : "crimson", winnerIndex);
      ctx.fillStyle = "rgba(38,54,61,.72)";
      ctx.fillRect(W / 2 - 78, 31, 156, 20);
      const oneRoundCoachMatch = tutorial.active && tutorial.kind === "pvp" && tutorialStep()?.setup === "pvpFinalMatch";
      if (oneRoundCoachMatch) {
        drawBitmapText(winnerIndex === 1 ? "EMBER WINS!" : "YOU WIN!", W / 2, 37, 1.12, "center", COLORS.white, winner.dark);
      } else {
        drawBitmapText(`PLAYER ${winnerIndex + 1}`, W / 2, 33, 1, "center", COLORS.white, winner.dark);
        drawBitmapText(`WINS ROUND ${game.pvpRoundNumber}!`, W / 2, 42, 1, "center", COLORS.white, winner.dark);
      }
    }

    function drawPvpScene() {
      const criticalCatch = game.pvpCriticalCatchActive;
      const drawEntity = (player, renderer) => {
        ctx.save();
        if (OnlineVersus.isGuestActive() && game.state === "playing") {
          const correction=OnlineVersus.renderCorrection(player.index); ctx.translate(correction.x, correction.y);
        }
        renderer(OnlineVersus.displayPlayer(player)); ctx.restore();
      };
      ctx.save();
      if (criticalCatch) applyPvpCriticalCatchCamera();
      drawBackground();
      for (const platform of platforms) drawPlatform(platform);
      drawTimeOfDayWorldTint();
      pvpPlayers.forEach(p => drawEntity(p, drawPvpArcPreview));
      for (const fly of flies) {
        drawFlySpawnSparks(fly);
        drawFlyAt(fly.x, fly.y, getFlySpawnScale(fly));
        if (!window.RibbitRaceFinalCatchLabelsGone) { drawFlyNameTag(fly); }
      }
      // Keep an eaten fly visible while its real tongue retracts during the
      // tutorial slow-motion zoom. The body and word plate travel with it.
      if (criticalCatch && ((tutorial.active && tutorial.kind === "pvp") ||
          window.RibbitEngineReplay?.active?.())) {
        const ghost = game.pvpCriticalCatchFlyVisual;
        if (ghost && !flies.some((fly) => fly?.id === ghost.id)) {
          const catcher = pvpPlayers[game.pvpCriticalCatchWinnerIndex];
          const tongue = catcher?.tongue;
          if (tongue?.active) {
            const mouth = getPvpMouth(catcher);
            const progress = clamp(tongue.elapsed / Math.max(.001,tongue.duration), 0, 1);
            const drawProgress = clamp((progress - .46) / .54, 0, 1);
            ghost.x = lerp(ghost.baseX, mouth.x, drawProgress);
            ghost.y = lerp(ghost.baseY, mouth.y, drawProgress);
            drawFlyAt(ghost.x, ghost.y, 1);
          }
        }
      }
      pvpPlayers.forEach(p => drawEntity(p, drawFrogAfterimages));
      if (!["pvpCelebration", "won"].includes(game.state)) pvpPlayers.forEach((player)=>drawAirShadowForEntity(OnlineVersus.displayPlayer(player),getPvpSkinPalette(player.skinId,player.index===0?"azure":"crimson")));
      pvpPlayers.forEach(p => drawEntity(p, drawPvpTongue));
      if (game.state === "pvpCelebration") {
        drawPvpRoundCelebration();
      } else if (game.state === "won") {
        // Keep the live winner/loser animations moving behind the result panel.
        drawPvpGameplayCelebrationFrogs();
      } else {
        pvpPlayers.forEach(p => drawEntity(p, drawPvpPlayer));
      }
      if (!['pvpCelebration', 'won'].includes(game.state)) {
        pvpPlayers.forEach(drawPvpOffscreenIndicator);
        pvpPlayers.forEach(p => drawEntity(p, drawPvpSpeechBubble));
      }
      drawPvpImpactEffects();
      ctx.restore();
      drawPvpHud();
      OnlineVersus.drawHud();
      if (criticalCatch) drawPvpCriticalCatchOverlay();
      if (game.state === "pvpSuddenDeathAlert") {
        ctx.fillStyle = "rgba(18,33,41,0.62)";
        ctx.fillRect(0, 0, W, CONFIG.playBottom);
        const pulse = 0.78 + Math.sin(game.visualTime * 10) * 0.18;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "rgba(38,54,61,0.86)";
        ctx.fillRect(W / 2 - 112, 82, 224, 48);
        ctx.fillStyle = "#f7fdff";
        ctx.fillRect(W / 2 - 108, 86, 216, 40);
        drawBitmapText("SUDDEN DEATH", W / 2, 94, 1.65, "center", "#8d2434", "#f3a4af");
        drawBitmapText("FIRST TO 3 • NO TIMER", W / 2, 115, 0.82, "center", "#48555a");
        ctx.restore();
      } else if (game.state === "paused" && !tutorial.active) {
        drawOverlayPanel(
          "PAUSED",
          [`BEST OF ${game.pvpBestOf}`, isPvpEndlessMode() ? `${game.pvpTimeLimitSeconds} SECOND ENDLESS` : (game.pvpTimeLimitSeconds ? `${game.pvpTimeLimitSeconds} SECOND LIMIT` : `FIRST TO ${game.pvpFirstTo}`)],
          "",
          true,
          { x: 75, y: 28, w: 330, h: 204, titleOffset: 17, lineStartOffset: 58, lineGap: 15, footerOffset: 169 }
        );
        drawPauseControls();
      } else if (game.state === "countdown") {
        drawResumeCountdown();
      } else if (game.state === "won") {
        drawPvpWinScreen();
      }
      // PvP achievements are notification-only and never enter the solo menu.
      if (["playing", "pvpCelebration"].includes(game.state)) drawAchievementToast();
    }
