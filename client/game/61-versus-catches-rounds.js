// Ribbit Race Versus responsibility: 61 versus catches rounds
    function pvpPlayerTouchesFly(player, currentFly) {
      const left = currentFly.baseX - 6, right = currentFly.baseX + 7;
      const top = currentFly.baseY - 5, bottom = currentFly.baseY + 7;
      return player.x + player.w >= left && player.x <= right && player.y + player.h >= top && player.y <= bottom;
    }

    function pvpFlyBlockedForPlayer(currentFly, player) {
      if(OnlineVersus.wrongFlyBlocked(player,currentFly))return true;
      const blocks = Array.isArray(currentFly?.pvpBlockedPromptSerials)
        ? currentFly.pvpBlockedPromptSerials
        : [-1, -1];
      return blocks[player.index] === game.promptSerial;
    }

    function beginPvpWrongCatch(player, targetFly, byTongue = false) {
      if (!targetFly || targetFly.state !== "active" || pvpFlyBlockedForPlayer(targetFly, player)) return false;
      const mouth = getPvpMouth(player);
      if (!Array.isArray(targetFly.pvpBlockedPromptSerials)) targetFly.pvpBlockedPromptSerials = [-1, -1];
      targetFly.pvpBlockedPromptSerials[player.index] = game.promptSerial;
      targetFly.returnX = targetFly.baseX;
      targetFly.returnY = targetFly.baseY;
      targetFly.state = "spitting";
      targetFly.touchLocked = false;
      targetFly.spitElapsed = 0;
      targetFly.spitDelay = byTongue ? Math.max(0.08, player.tongue.duration - player.tongue.elapsed + 0.03) : 0.07;
      targetFly.spitDuration = 0.34;
      targetFly.spitStarted = false;
      targetFly.spitOwnerIndex = player.index;
      targetFly.spitStartX = mouth.x;
      targetFly.spitStartY = mouth.y;
      targetFly.x = mouth.x;
      targetFly.y = mouth.y;
      if (player.tongue.targetFlyId === targetFly.id) {
        const chainTarget = findPvpTongueChainFollowup(player, mouth.x, mouth.y, targetFly.baseX, targetFly.baseY, targetFly.id);
        player.tongue.captured = true;
        player.tongue.chainNextFlyId = chainTarget ? chainTarget.id : null;
      }
      player.wrongCatchBubbleTimer = CONFIG.wrongCatchBubbleDuration;
      // Versus mode keeps the visual spit-back feedback but omits the failed-catch sound.
      OnlineVersus.rememberWrongFly(player,targetFly);
      return true;
    }

    function registerPvpFlyPursuit(player, targetFly) {
      if (!player || !targetFly) return;
      if (targetFly.pvpPursuitPromptSerial !== game.promptSerial) {
        targetFly.pvpPursuitPromptSerial = game.promptSerial;
        targetFly.pvpPursuers = [false, false];
        targetFly.pvpPursuitTimes = [null, null];
      }
      if (!Array.isArray(targetFly.pvpPursuers)) targetFly.pvpPursuers = [false, false];
      if (!Array.isArray(targetFly.pvpPursuitTimes)) targetFly.pvpPursuitTimes = [null, null];
      targetFly.pvpPursuers[player.index] = true;
      // Store the moment this frog first committed to this fly for the current
      // vocabulary prompt. Repeated contact does not move the timestamp.
      if (!Number.isFinite(targetFly.pvpPursuitTimes[player.index])) {
        targetFly.pvpPursuitTimes[player.index] = game.pvpElapsed;
      }
    }

    function playerWonNoseAheadContest(playerIndex, targetFly) {
      const winner = pvpPlayers[playerIndex];
      const opponent = pvpPlayers[playerIndex === 0 ? 1 : 0];
      const p1 = pvpPlayers[0];
      const p2 = pvpPlayers[1];
      if (!winner || !opponent || !p1 || !p2 || winner.grounded || opponent.grounded) return false;
      const centerTowardFly = (player) => {
        const dx = targetFly.baseX - (player.x + player.w / 2);
        const tongueCommitted = player.tongue?.active && player.tongue.targetFlyId === targetFly.id;
        return tongueCommitted || dx * (player.vx || player.dir) >= 0;
      };
      if (!centerTowardFly(p1) || !centerTowardFly(p2)) return false;
      const bothTongues = p1.tongue?.active && p2.tongue?.active && p1.tongue.targetFlyId === targetFly.id && p2.tongue.targetFlyId === targetFly.id;
      const times = Array.isArray(targetFly?.pvpPursuitTimes) ? targetFly.pvpPursuitTimes : [null, null];
      const sharedPursuit = targetFly?.pvpPursuitPromptSerial === game.promptSerial && Number.isFinite(times[0]) && Number.isFinite(times[1]) && Math.abs(times[0] - times[1]) <= 0.5 + STEP * 0.5;
      return Boolean(bothTongues || sharedPursuit);
    }

    function shouldStartSoloCriticalCatch(targetFly) {
      if (
        !targetFly ||
        game.mode !== "solo" ||
        game.sandboxMode ||
        game.state !== "playing" ||
        game.soloCriticalCatchActive ||
        game.winPending ||
        isSoloEndlessMode() ||
        !flyMatchesPrompt(targetFly)
      ) return false;
      return Number(game.score || 0) + 1 >= getSoloTargetScore();
    }

    function startSoloCriticalCatch(targetFly) {
      if (!shouldStartSoloCriticalCatch(targetFly)) return false;
      game.soloCriticalCatchActive = true;
      game.soloCriticalCatchElapsed = 0;
      game.soloCriticalCatchX = clamp(Number(targetFly?.baseX ?? targetFly?.x ?? (frog.x + frog.w / 2)), 24, W - 24);
      game.soloCriticalCatchY = clamp(Number(targetFly?.baseY ?? targetFly?.y ?? (frog.y + frog.h / 2)), 28, CONFIG.playBottom - 24);
      // Low impact plus an upward sweep creates the whoosh into slow motion.
      tone(92, 0.22, 0.032, -12);
      tone(210, 0.08, 0.020, 210, 0.02);
      tone(380, 0.10, 0.022, 310, 0.035);
      tone(784, 0.16, 0.016, 260, 0.090);
      return true;
    }

    function updateSoloCriticalCatch(realDt) {
      if (!game.soloCriticalCatchActive) return 1;
      game.soloCriticalCatchElapsed += realDt;
      const progress = clamp(game.soloCriticalCatchElapsed / Math.max(0.001, game.soloCriticalCatchDuration), 0, 1);
      if (progress >= 1) {
        game.soloCriticalCatchActive = false;
        return 1;
      }
      // The returned value scales physics and the solo clock together.
      return progress < 0.18 ? 0.055 : progress < 0.72 ? 0.18 : 0.34;
    }

    function getSoloCriticalCatchVisuals() {
      const progress = clamp(game.soloCriticalCatchElapsed / Math.max(0.001, game.soloCriticalCatchDuration), 0, 1);
      const zoomIn = easeOutCubic(clamp(progress / 0.22, 0, 1));
      const zoomOut = progress < 0.74 ? 0 : easeOutCubic(clamp((progress - 0.74) / 0.26, 0, 1));
      const zoom = 1 + 0.68 * zoomIn * (1 - zoomOut);
      return { progress, zoom };
    }

    function getSoloCriticalCatchFocusPoint() {
      const mouth = getFrogMouth();
      if (tongue.active) {
        const progress = clamp(tongue.elapsed / Math.max(0.001, tongue.duration), 0, 1);
        const extension = Math.sin(progress * Math.PI);
        const rawEndX = lerp(mouth.x, tongue.targetX, extension);
        const endX = frog.dir > 0 ? Math.max(mouth.x, rawEndX) : Math.min(mouth.x, rawEndX);
        const endY = lerp(mouth.y, tongue.targetY, extension);
        return { x: endX, y: endY };
      }
      return {
        x: clamp(Number(game.soloCriticalCatchX) || mouth.x, 0, W),
        y: clamp(Number(game.soloCriticalCatchY) || mouth.y, 0, CONFIG.playBottom)
      };
    }

    function applySoloCriticalCatchCamera() {
      const { zoom } = getSoloCriticalCatchVisuals();
      const frogCenterX = frog.x + frog.w / 2;
      const frogCenterY = frog.y + frog.h / 2;
      const halfVisibleW = W / (2 * zoom);
      const halfVisibleH = CONFIG.playBottom / (2 * zoom);
      const focusX = clamp(frogCenterX, halfVisibleW, W - halfVisibleW);
      const focusY = clamp(frogCenterY, halfVisibleH, CONFIG.playBottom - halfVisibleH);
      game.soloCriticalCatchScreenX = W / 2 + (frogCenterX - focusX) * zoom;
      game.soloCriticalCatchScreenY = CONFIG.playBottom / 2 + (frogCenterY - focusY) * zoom;
      ctx.translate(W / 2, CONFIG.playBottom / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
    }

    function drawSoloCriticalCatchOverlay() {
      if (!game.soloCriticalCatchActive) return;
      const { progress } = getSoloCriticalCatchVisuals();
      const impactFade = 1 - clamp(progress / 0.28, 0, 1);
      const holdFade = 1 - clamp((progress - 0.64) / 0.36, 0, 1);
      ctx.save();
      ctx.fillStyle = `rgba(10,18,24,${0.22 * holdFade})`;
      ctx.fillRect(0, 0, W, CONFIG.playBottom);
      const cx = Number.isFinite(game.soloCriticalCatchScreenX) ? game.soloCriticalCatchScreenX : W / 2;
      const cy = Number.isFinite(game.soloCriticalCatchScreenY) ? game.soloCriticalCatchScreenY : CONFIG.playBottom / 2;
      ctx.globalAlpha = 0.78 * holdFade;
      ctx.fillStyle = COLORS.white;
      for (let i = 0; i < 14; i += 1) {
        const angle = i * Math.PI * 2 / 14 + 0.13;
        const inner = 42 + (i % 3) * 5;
        const outer = 92 + (i % 4) * 8;
        const x1 = cx + Math.cos(angle) * inner;
        const y1 = cy + Math.sin(angle) * inner * 0.62;
        const x2 = cx + Math.cos(angle) * outer;
        const y2 = cy + Math.sin(angle) * outer * 0.62;
        for (let step = 0; step < 8; step += 1) {
          const amount = step / 8;
          ctx.fillRect(Math.round(lerp(x1, x2, amount)), Math.round(lerp(y1, y2, amount)), 2, 1);
        }
      }
      if (impactFade > 0) {
        ctx.globalAlpha = impactFade * 0.42;
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(0, 0, W, CONFIG.playBottom);
      }
      // Authored practice scenes may reuse the camera without finishing a
      // level. Never borrow a stale Versus catch kind for the solo title.
      if (!window.RibbitTutorialShouldHideFinalCatchTitle?.()) {
        ctx.globalAlpha = holdFade;
        ctx.fillStyle = "rgba(38,54,61,0.78)";
        ctx.fillRect(W / 2 - 74, 29, 148, 18);
        drawBitmapText("FINAL CATCH!", W / 2, 34, 1.08, "center", COLORS.white, COLORS.ink);
      }
      ctx.restore();
    }

    function startPvpCriticalCatch(player, targetFly, kind = "final") {
      if (!player || game.pvpCriticalCatchActive || game.mode !== "pvp") return false;
      const lesson = typeof tutorial !== "undefined" && tutorial.active && tutorial.kind === "pvp" ? tutorialStep()?.setup : "";
      // Chapter 15's coach demonstration is at normal speed. The player is
      // the only one allowed the rebound/steal slow-motion celebration.
      if (["pvpDemoDinnerSteal", "pvpDinnerSteal"].includes(lesson) && player.index !== 0) return false;
      const normalizedKind = ["contest", "clutch", "technique"].includes(kind) ? kind : "final";
      if (normalizedKind === "final" && game.pvpCriticalCatchPlayedThisRound) return false;
      const criticalKey = normalizedKind !== "final"
        ? `${normalizedKind}:${game.pvpRoundNumber}:${game.promptSerial}:${targetFly?.id ?? "fly"}`
        : `${game.pvpRoundNumber}:${game.pvpSuddenDeath?'sd':'normal'}:final`;
      if(!OnlineVersus.canStartCritical(criticalKey))return false;
      game.pvpCriticalCatchEventId=criticalKey;
      if (normalizedKind === "final") game.pvpCriticalCatchPlayedThisRound=true;
      game.pvpCriticalCatchKind = normalizedKind;
      game.pvpCriticalCatchActive = true;
      game.pvpCriticalCatchElapsed = 0;
      game.pvpCriticalCatchWinnerIndex = player.index;
      game.pvpCriticalCatchFlyVisual = targetFly && {
        id:targetFly.id,
        x:Number(targetFly.x), y:Number(targetFly.y),
        baseX:Number(targetFly.baseX ?? targetFly.x), baseY:Number(targetFly.baseY ?? targetFly.y),
        vocabIndex:targetFly.vocabIndex, spawnAge:Math.max(CONFIG.flyGrowDuration, Number(targetFly.spawnAge)||0),
        state:"active", tutorialArmed:true, tutorialAuthored:!!targetFly.tutorialAuthored,
        phase:Number(targetFly.phase)||0, spawnIndex:targetFly.spawnIndex
      };
      game.pvpCriticalCatchX = clamp(Number(targetFly?.baseX ?? targetFly?.x ?? (player.x + player.w / 2)), 24, W - 24);
      game.pvpCriticalCatchY = clamp(Number(targetFly?.baseY ?? targetFly?.y ?? (player.y + player.h / 2)), 28, CONFIG.playBottom - 24);
      game.pvpCriticalCatchCameraX = W / 2;
      game.pvpCriticalCatchCameraY = CONFIG.playBottom / 2;
      game.pvpCriticalCatchCameraZoom = 1;
      tone(normalizedKind === "contest" ? 118 : 92, 0.22, 0.032, -12);
      tone(210, 0.08, 0.020, 210, 0.02);
      tone(380, 0.10, 0.022, 310, 0.035);
      tone(784, 0.16, 0.016, 260, 0.090);
      return true;
    }

    function updatePvpCriticalCatch(realDt) {
      if (!game.pvpCriticalCatchActive) return 1;
      game.pvpCriticalCatchElapsed += realDt;
      const progress = clamp(game.pvpCriticalCatchElapsed / Math.max(0.001, game.pvpCriticalCatchDuration), 0, 1);
      if (progress >= 1) {
        game.pvpCriticalCatchActive = false;
        game.pvpCriticalCatchFlyVisual = null;
        game.pvpCriticalCatchCameraX = W / 2;
        game.pvpCriticalCatchCameraY = CONFIG.playBottom / 2;
        game.pvpCriticalCatchCameraZoom = 1;
        return 1;
      }
      // Near-freeze on impact, then a restrained slow-motion follow-through.
      return progress < 0.18 ? 0.055 : progress < 0.72 ? 0.18 : 0.34;
    }

    function getPvpCriticalCatchVisuals() {
      const progress = clamp(game.pvpCriticalCatchElapsed / Math.max(0.001, game.pvpCriticalCatchDuration), 0, 1);
      const zoomIn = easeOutCubic(clamp(progress / 0.22, 0, 1));
      const zoomOut = progress < 0.74 ? 0 : easeOutCubic(clamp((progress - 0.74) / 0.26, 0, 1));
      const zoom = 1 + 0.68 * zoomIn * (1 - zoomOut);
      return { progress, zoom };
    }

    function getPvpCriticalCatchFocusPoint() {
      const winner = pvpPlayers[game.pvpCriticalCatchWinnerIndex];
      const mouth = winner ? getPvpMouth(winner) : { x: game.pvpCriticalCatchX, y: game.pvpCriticalCatchY };
      const t = winner?.tongue;
      if (t?.active) {
        const progress = clamp(t.elapsed / Math.max(0.001, t.duration), 0, 1);
        const extension = Math.sin(progress * Math.PI);
        const rawEndX = lerp(mouth.x, t.targetX, extension);
        const endX = winner.dir > 0 ? Math.max(mouth.x, rawEndX) : Math.min(mouth.x, rawEndX);
        const endY = lerp(mouth.y, t.targetY, extension);
        return { x: endX, y: endY };
      }
      return {
        x: clamp(Number(game.pvpCriticalCatchX) || mouth.x, 0, W),
        y: clamp(Number(game.pvpCriticalCatchY) || mouth.y, 0, CONFIG.playBottom)
      };
    }

    function applyPvpCriticalCatchCamera() {
      const { zoom, progress } = getPvpCriticalCatchVisuals();
      const entity = pvpPlayers[game.pvpCriticalCatchWinnerIndex];
      const winner = entity ? OnlineVersus.displayPlayer(entity) : null;
      const frogCenterX = winner ? winner.x + winner.w / 2 : game.pvpCriticalCatchX;
      const frogCenterY = winner ? winner.y + winner.h / 2 : game.pvpCriticalCatchY;
      const halfVisibleW = W / (2 * zoom);
      const halfVisibleH = CONFIG.playBottom / (2 * zoom);
      const targetFocusX = clamp(frogCenterX, halfVisibleW, W - halfVisibleW);
      const targetFocusY = clamp(frogCenterY, halfVisibleH, CONFIG.playBottom - halfVisibleH);
      if (!Number.isFinite(game.pvpCriticalCatchCameraX)) game.pvpCriticalCatchCameraX = targetFocusX;
      if (!Number.isFinite(game.pvpCriticalCatchCameraY)) game.pvpCriticalCatchCameraY = targetFocusY;
      if (!Number.isFinite(game.pvpCriticalCatchCameraZoom)) game.pvpCriticalCatchCameraZoom = 1;
      const blend = progress < 0.18 ? 0.18 : progress < 0.7 ? 0.3 : 0.22;
      game.pvpCriticalCatchCameraX = lerp(game.pvpCriticalCatchCameraX, targetFocusX, blend);
      game.pvpCriticalCatchCameraY = lerp(game.pvpCriticalCatchCameraY, targetFocusY, blend);
      game.pvpCriticalCatchCameraZoom = lerp(game.pvpCriticalCatchCameraZoom, zoom, blend);
      const focusX = game.pvpCriticalCatchCameraX;
      const focusY = game.pvpCriticalCatchCameraY;
      const liveZoom = game.pvpCriticalCatchCameraZoom;
      game.pvpCriticalCatchScreenX = W / 2 + (frogCenterX - focusX) * liveZoom;
      game.pvpCriticalCatchScreenY = CONFIG.playBottom / 2 + (frogCenterY - focusY) * liveZoom;
      ctx.translate(W / 2, CONFIG.playBottom / 2);
      ctx.scale(liveZoom, liveZoom);
      ctx.translate(-focusX, -focusY);
    }

    function drawPvpCriticalCatchOverlay() {
      if (!game.pvpCriticalCatchActive) return;
      const { progress } = getPvpCriticalCatchVisuals();
      const impactFade = 1 - clamp(progress / 0.28, 0, 1);
      const holdFade = 1 - clamp((progress - 0.64) / 0.36, 0, 1);
      ctx.save();
      ctx.fillStyle = `rgba(10,18,24,${0.22 * holdFade})`;
      ctx.fillRect(0, 0, W, CONFIG.playBottom);
      const cx = Number.isFinite(game.pvpCriticalCatchScreenX) ? game.pvpCriticalCatchScreenX : W / 2;
      const cy = Number.isFinite(game.pvpCriticalCatchScreenY) ? game.pvpCriticalCatchScreenY : CONFIG.playBottom / 2;
      ctx.globalAlpha = 0.78 * holdFade;
      ctx.fillStyle = COLORS.white;
      for (let i = 0; i < 14; i += 1) {
        const angle = i * Math.PI * 2 / 14 + 0.13;
        const inner = 42 + (i % 3) * 5;
        const outer = 92 + (i % 4) * 8;
        const x1 = cx + Math.cos(angle) * inner;
        const y1 = cy + Math.sin(angle) * inner * 0.62;
        const x2 = cx + Math.cos(angle) * outer;
        const y2 = cy + Math.sin(angle) * outer * 0.62;
        const steps = 8;
        for (let step = 0; step < steps; step += 1) {
          const t = step / steps;
          ctx.fillRect(Math.round(lerp(x1, x2, t)), Math.round(lerp(y1, y2, t)), 2, 1);
        }
      }
      if (impactFade > 0) {
        ctx.globalAlpha = impactFade * 0.42;
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(0, 0, W, CONFIG.playBottom);
      }
      const title = game.pvpCriticalCatchKind === "final" ? "FINAL CATCH!"
        : game.pvpCriticalCatchKind === "clutch" ? "CLUTCH CATCH!"
        : game.pvpCriticalCatchKind === "contest" ? "CLOSE CATCH!" : "";
      // Show genuine CLOSE CATCH in training, but never mislabel a solo
      // rebound-catch demonstration as a contest between both frogs.
      const silentTrainingCinematic = title !== "CLOSE CATCH!" && window.RibbitTutorialShouldHidePvpCatchTitle?.() === true;
      if (title && !silentTrainingCinematic && (title !== "FINAL CATCH!" || !window.RibbitTutorialShouldHideFinalCatchTitle?.())) {
        ctx.globalAlpha = holdFade;
        ctx.fillStyle = "rgba(38,54,61,0.78)";
        ctx.fillRect(W / 2 - 74, 29, 148, 18);
        drawBitmapText(title, W / 2, 34, 1.08, "center", COLORS.white, COLORS.ink);
      }
      ctx.restore();
    }

    // A contested fly needs TWO nearby frogs actively closing in RIGHT NOW.
    // Historical pursuit flags and stationary contact cannot make a platform-
    // sitting Ember trigger CLOSE CATCH when only the player is moving.
    function pvpFrogActivelyPursuingFly(player, targetFly) {
      if (!player || !targetFly || player.bonked || Number(player.stunTimer || 0) > 0) return false;
      const mouth = getPvpMouth(player);
      const dx = Number(targetFly.baseX ?? targetFly.x) - mouth.x;
      const dy = Number(targetFly.baseY ?? targetFly.y) - mouth.y;
      if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) > 56) return false;
      const t = player.tongue;
      // Extending a tongue at this very fly is an active catch attempt, even
      // when a frog has planted its feet to aim.
      if (t?.active && t.targetFlyId === targetFly.id && !t.captured &&
          Number(t.elapsed || 0) < Number(t.duration || 0)) return true;
      const vx = Number(player.vx) || 0;
      const vy = Number(player.vy) || 0;
      if (Math.hypot(vx, vy) < 8) return false;
      // The velocity has to take the frog nearer the fly, not away from it.
      // A frog standing above a fly with vy=0 never qualifies.
      const toward = vx * dx + vy * dy;
      return toward > 5 * Math.max(1, Math.hypot(dx, dy));
    }

    function pvpFlyContestIsClose(player, targetFly) {
      if (!player || !targetFly || !flyMatchesPrompt(targetFly)) return false;
      const other = pvpPlayers[player.index === 0 ? 1 : 0];
      return pvpFrogActivelyPursuingFly(player, targetFly) &&
        pvpFrogActivelyPursuingFly(other, targetFly);
    }

    function getPvpCriticalCatchKind(player, targetFly) {
      if (!player || !targetFly || game.mode !== "pvp" || game.pvpCriticalCatchActive || !flyMatchesPrompt(targetFly)) return "";
      const otherPlayer = pvpPlayers[player.index === 0 ? 1 : 0];
      const target = getPvpTargetScore();
      const reachedTarget = game.pvpSuddenDeath
        ? Number((game.pvpSuddenDeathScores[player.index] || 0) + 1) >= target
        : (!isPvpEndlessMode() && Number(player.score || 0) + 1 >= target);
      const buzzerWinningCatch = Boolean(
        game.pvpTimerGraceActive &&
        Number(player.score || 0) <= Number(otherPlayer?.score || 0) &&
        Number(player.score || 0) + 1 > Number(otherPlayer?.score || 0)
      );
      const lastSecondCatch = Boolean(
        game.pvpTimeLimitSeconds > 0 && !game.pvpSuddenDeath &&
        Number(game.pvpTimeRemaining) > 0 && Number(game.pvpTimeRemaining) <= 1.0
      );
      // Only a score-goal finish (e.g. the fifth of five flies) is final.
      // A contested fly or a last-second catch still gets the same zoom and
      // slow motion, without claiming the level has ended.
      if (reachedTarget) return "final";
      if (pvpFlyContestIsClose(player, targetFly)) return "contest";
      if (lastSecondCatch) return "clutch";
      // The buzzer-grace catch is resolved as a regular contested catch; it
      // must not display CLUTCH unless it happened during the final second.
      return "";
    }

    function completePvpCorrectCatch(player, targetFly) {
      const onlineCatchSerial=game.promptSerial;
      const index = flies.findIndex((fly) => fly.id === targetFly.id);
      if (index < 0 || game.pvpWinPendingIndex !== null) return false;
      const otherPlayer = pvpPlayers[player.index === 0 ? 1 : 0];
      // If the other frog is actively touching or tonguing this same fly at
      // the catch moment, record that pursuit before the fly is removed.
      if (
        otherPlayer && (
          (otherPlayer.tongue?.active && otherPlayer.tongue.targetFlyId === targetFly.id) ||
          pvpPlayerTouchesFly(otherPlayer, targetFly)
        )
      ) {
        registerPvpFlyPursuit(otherPlayer, targetFly);
      }
      const noseAheadQualified = playerWonNoseAheadContest(player.index, targetFly);
      const criticalCatchKind = getPvpCriticalCatchKind(player, targetFly);
      const playerScoreBefore = Number(player.score || 0);
      const otherScoreBefore = Number(otherPlayer?.score || 0);
      flies.splice(index, 1);
      if (noseAheadQualified) markPvpAchievementEarned("pvp-contested-fly", player.index, true, { verifiedInteraction: true });
      if (player.tongue.targetFlyId === targetFly.id) player.tongue.captured = true;
      game.completedVocabIndices.add(targetFly.vocabIndex);
      player.score += 1;
      player.lastScoredCatchAt = game.pvpElapsed;
      if (game.pvpSuddenDeath) game.pvpSuddenDeathScores[player.index] += 1;
      player.catchSparkleTimer = CONFIG.catchSparkleDuration;
      if (!player.grounded) {
        if (player.oneJumpCatchEligible && player.oneJumpStartingFlyIds?.has(targetFly.id)) {
          player.correctCatchesThisJump = (player.correctCatchesThisJump || 0) + 1;
          player.oneJumpStartingFlyIds.delete(targetFly.id);
          if (player.correctCatchesThisJump >= 2) markPvpAchievementEarned("pvp-double-fly-jump", player.index, true);
        }
        if (player.bouncedOffOpponentThisJump && player.lastOpponentBounceType === "rebound") {
          markPvpAchievementEarned("pvp-bounce-catch", player.index, true);
        }
      }
      recordFlyEaten(game.onlineMode ? player.index === OnlineVersus.localIndex() : (player.index === 0 || !game.pvpCpuEnabled));
      playCorrectFlySound();
      const target = getPvpTargetScore();
      const timedRoundInProgress = game.pvpTimeLimitSeconds > 0 && !game.pvpSuddenDeath;
      const reachedTarget = game.pvpSuddenDeath
        ? game.pvpSuddenDeathScores[player.index] >= target
        : (!isPvpEndlessMode() && player.score >= target);
      const buzzerWinningCatch = Boolean(
        game.pvpTimerGraceActive &&
        playerScoreBefore <= otherScoreBefore &&
        Number(player.score || 0) > Number(otherPlayer?.score || 0)
      );
      if (criticalCatchKind) startPvpCriticalCatch(player, targetFly, criticalCatchKind);
      else if (reachedTarget) startPvpCriticalCatch(player, targetFly, "final");
      else if (buzzerWinningCatch && Number(game.pvpTimeRemaining) > 0 && Number(game.pvpTimeRemaining) <= 1)
        startPvpCriticalCatch(player, targetFly, "clutch");
      if (game.pvpTimerGraceActive) {
        game.targetVocabIndex = null;
        game.spawnQueue = [];
        cancelPvpChargedJumpsAtTimeLimit();
      } else if (reachedTarget) {
        game.pvpWinPendingIndex = player.index;
        game.pvpBonusEligible = game.pvpTimeLimitSeconds <= 0 && !game.pvpSuddenDeath && !player.grounded;
        game.targetVocabIndex = null;
        pvpPlayers.forEach((item) => { item.inputHeld = false; item.charging = false; });
      } else {
        scheduleFlyReplacementFromCatch();
        chooseNextVocabularyTarget(true);
      }
      OnlineVersus.authoritativeCatch(player,targetFly,onlineCatchSerial);
      return true;
    }

    function attemptPvpFlyCatch(player, targetFly, source = "body") {
      if(OnlineVersus.isGuestActive() && player?.index===1 && game.state==='playing') return OnlineVersus.predictCatch(player,targetFly,source);
      if (!targetFly || targetFly.state !== "active") return false;
      registerPvpFlyPursuit(player, targetFly);
      if (game.pvpWinPendingIndex !== null) {
        return source === "body" && player.index === game.pvpWinPendingIndex
          ? completePvpBonusCatch(player, targetFly)
          : false;
      }
      if (pvpFlyBlockedForPlayer(targetFly, player)) return false;
      if (flyMatchesPrompt(targetFly)) return completePvpCorrectCatch(player, targetFly);
      return beginPvpWrongCatch(player, targetFly, source === "tongue");
    }

    function shouldStartPvpCriticalCatch(player, targetFly) {
      return Boolean(getPvpCriticalCatchKind(player, targetFly));
    }

    function beginPvpTongue(player, targetFly) {
      if(!targetFly||player.tongue.active)return false;
      if(!OnlineVersus.beginTongueAction(player,targetFly))return false;
      registerPvpFlyPursuit(player, targetFly);
      const t = player.tongue;
      t.active = true; t.elapsed = 0; t.targetFlyId = targetFly.id;
      t.targetX = targetFly.baseX; t.targetY = targetFly.baseY; t.captured = false;
      t.chainNextFlyId = null;
      OnlineVersus.rememberTongueContact(player);
      const criticalKind = getPvpCriticalCatchKind(player, targetFly);
      const tutorialSetup = tutorial.active && tutorial.kind === "pvp" ? tutorialStep()?.setup : "";
      const techniqueCatch = ["pvpDemoReboundCatch", "pvpReboundCatch", "pvpDemoDinnerSteal", "pvpDinnerSteal"].includes(tutorialSetup) &&
        player.bouncedOffOpponentThisJump && !player.grounded && flyMatchesPrompt(targetFly);
      // Trigger the zoom on real normal-range tongue launch (not after the
      // fly disappears). Let the fly travel toward the mouth in the cinematic.
      if (techniqueCatch && !game.pvpCriticalCatchActive) startPvpCriticalCatch(player, targetFly, "technique");
      else if (criticalKind) startPvpCriticalCatch(player, targetFly, criticalKind);
      tone(player.index === 0 ? 330 : 300, 0.05, 0.015, 80);
    }

    function findPvpTongueChainFollowup(player, startX, startY, endX, endY, excludedId = null) {
      let best = null;
      let bestScore = Infinity;
      const dx = endX - startX;
      const dy = endY - startY;
      const lengthSq = dx * dx + dy * dy || 1;
      for (const fly of flies) {
        if (!fly || fly.id === excludedId || fly.state !== "active" || !flyMatchesPrompt(fly) || pvpFlyBlockedForPlayer(fly, player)) continue;
        const fx = fly.baseX;
        const fy = fly.baseY;
        const t = ((fx - startX) * dx + (fy - startY) * dy) / lengthSq;
        if (t < -0.05 || t > 1.25) continue;
        const projX = startX + dx * t;
        const projY = startY + dy * t;
        const dist = Math.hypot(fx - projX, fy - projY);
        if (dist > 16) continue;
        const score = dist + Math.abs(t - 1) * 20;
        if (score < bestScore) {
          bestScore = score;
          best = fly;
        }
      }
      return best;
    }

    function updatePvpTongue(player, dt) {
      const t = player.tongue;
      if (!t.active) return;
      t.elapsed += dt;
      const progress = t.elapsed / t.duration;
      if (!t.captured && progress >= 0.46) {
        const target = flies.find((fly) => fly.id === t.targetFlyId);
        t.captured = true;
        if (target) attemptPvpFlyCatch(player, target, "tongue");
      }
      if (progress >= 1) {
        OnlineVersus.finishTongueAction(player);
        const nextFly = t.chainNextFlyId ? flies.find((fly) => fly.id === t.chainNextFlyId) : null;
        t.active = false;
        t.targetFlyId = null;
        t.chainNextFlyId = null;
        if (nextFly && nextFly.state === "active") beginPvpTongue(player, nextFly);
      }
    }

    function completePvpBonusCatch(player, targetFly) {
      const baseTarget = game.pvpFirstTo || 5;
      if (isPvpEndlessMode() || game.pvpSuddenDeath || game.pvpWinPendingIndex !== player.index || !game.pvpBonusEligible || player.score >= baseTarget + 1 || !targetFly || targetFly.state !== "active") return false;
      const index = flies.findIndex((fly) => fly.id === targetFly.id);
      if (index < 0) return false;
      flies.splice(index, 1);
      player.score += 1;
      player.lastScoredCatchAt = game.pvpElapsed;
      player.catchSparkleTimer = CONFIG.catchSparkleDuration;
      if (!player.grounded) {
        if (player.oneJumpCatchEligible && player.oneJumpStartingFlyIds?.has(targetFly.id)) {
          player.correctCatchesThisJump = (player.correctCatchesThisJump || 0) + 1;
          player.oneJumpStartingFlyIds.delete(targetFly.id);
          if (player.correctCatchesThisJump >= 2) markPvpAchievementEarned("pvp-double-fly-jump", player.index, true);
        }
        if (player.bouncedOffOpponentThisJump && player.lastOpponentBounceType === "rebound") {
          markPvpAchievementEarned("pvp-bounce-catch", player.index, true);
        }
      }
      game.pvpBonusEligible = false;
      recordFlyEaten(game.onlineMode ? player.index === OnlineVersus.localIndex() : (player.index === 0 || !game.pvpCpuEnabled));
      playCorrectFlySound();
      return true;
    }


    function updatePvpFlies(dt) {
      animateFlies(dt);

      if (game.pvpWinPendingIndex !== null) {
        const winner = pvpPlayers[game.pvpWinPendingIndex];
        const stillCompletingFinalJump = winner && (!winner.grounded || winner.landedThisFrame);
        if (
          game.pvpBonusEligible && stillCompletingFinalJump &&
          winner && !winner.bonked && winner.stunTimer <= 0 && !winner.tongue.active
        ) {
          const bonusFly = flies.find((fly) =>
            fly.state === "active" && pvpPlayerTouchesFly(winner, fly)
          );
          if (bonusFly) completePvpBonusCatch(winner, bonusFly);
        }
        pvpPlayers.forEach((player) => updatePvpTongue(player, dt));
        return;
      }

      for (const player of pvpPlayers) {
        if (!pvpTimerGracePlayerCanCatch(player)) continue;
        if (player.bonked || player.stunTimer > 0 || player.tongue.active) continue;
        const touched = flies.find((fly) =>
          fly.state === "active" &&
          !pvpFlyBlockedForPlayer(fly, player) &&
          pvpPlayerTouchesFly(player, fly)
        );
        if (touched) {
          attemptPvpFlyCatch(player, touched, "body");
          continue;
        }
        const mouth = getPvpMouth(player);
        let nearest = null;
        let nearestDistance = Infinity;
        for (const fly of flies) {
          if (fly.state !== "active" || pvpFlyBlockedForPlayer(fly, player)) continue;
          const dx = fly.baseX - mouth.x;
          const dy = fly.baseY - mouth.y;
          if (dx * player.dir >= 0 && Math.abs(dx) <= CONFIG.tongueReach && Math.abs(dy) <= CONFIG.tongueVerticalTolerance) {
            const distance = Math.abs(dx) + Math.abs(dy) * 0.35;
            if (distance < nearestDistance) {
              nearest = fly;
              nearestDistance = distance;
            }
          }
        }
        if (nearest) beginPvpTongue(player, nearest);
      }
      pvpPlayers.forEach((player) => updatePvpTongue(player, dt));
    }


    function completePvpWin(index) {
      if (game.mode !== "pvp" || game.state === "won" || game.state === "pvpCelebration") return;
      const roundAwardToken = `${game.pvpRoundNumber}:${game.pvpSuddenDeath ? "sudden" : "normal"}`;
      if (game.pvpRoundAwardedToken === roundAwardToken) return;
      game.pvpRoundAwardedToken = roundAwardToken;
      game.pvpWinnerIndex = index;
      game.pvpWinPendingIndex = null;
      game.pvpTimedOutcomePending = false;
      game.pvpTimerGraceActive = false;
      game.pvpTimerGraceEligible = [false, false];
      game.pvpTimerGracePromptSerial = -1;
      game.pvpBonusEligible = false;
      const losingPlayer = pvpPlayers[index === 0 ? 1 : 0];
      const winningPlayer = pvpPlayers[index];
      if (!isPvpEndlessMode() && Number(game.pvpFirstTo) === 5 && winningPlayer && losingPlayer && winningPlayer.score === 5 && losingPlayer.score === 0) {
        markPvpAchievementEarned("pvp-shutout", index, true);
      }
      if (winningPlayer && losingPlayer && winningPlayer.score === losingPlayer.score + 1) {
        markPvpAchievementEarned("pvp-photo-finish", index, true);
      }
      if (game.pvpSuddenDeath) {
        markPvpAchievementEarned("pvp-sudden-victory", index, true);
      }
      if (
        game.pvpTimeLimitSeconds > 0 && !game.pvpSuddenDeath && winningPlayer && losingPlayer &&
        Number.isFinite(game.pvpTimeExpiredAt) && Number.isFinite(winningPlayer.lastScoredCatchAt) &&
        (winningPlayer.lastScoredCatchAt - game.pvpTimeExpiredAt) > 1 && winningPlayer.score === losingPlayer.score + 1
      ) {
        markPvpAchievementEarned("pvp-after-hours", index, true);
      }
      const roundsToWin = getPvpRoundsToWin();
      game.pvpRoundWins[index] = Math.min(roundsToWin, (game.pvpRoundWins[index] || 0) + 1);
      game.pvpMatchWinnerIndex = game.pvpRoundWins[index] >= roundsToWin ? index : null;
      awardCpuChampForCompletedMatch(true);
      if (!game.onlineMode && game.pvpMatchWinnerIndex !== null && rr14IsHumanPvpIndex(game.pvpMatchWinnerIndex) && (game.pvpCpuEnabled || hasRecentPlayerTwoMovement(10))) {
        statsProfile.pvpMatchWins += 1;
        saveStatsProfile();
        savePvpMatchWinsForLeaderboard();
        // A completed CPU match is a leaderboard event. Push it to the cloud
        // immediately instead of waiting for the ordinary autosave interval.
        setTimeout(() => {
          try { RibbitCloud.flushSave(true); } catch (_) {}
        }, 80);
      }
      if (game.onlineMode && game.pvpMatchWinnerIndex !== null) {
        OnlineVersus.handleHostRoundCompletion(index, game.pvpMatchWinnerIndex);
      }
      game.pvpCriticalCatchActive = false;
      game.pvpCriticalCatchElapsed = 0;
      game.pvpCriticalCatchCameraX = W / 2;
      game.pvpCriticalCatchCameraY = CONFIG.playBottom / 2;
      game.pvpCriticalCatchCameraZoom = 1;
      game.pvpCriticalCatchWinnerIndex = null;
      game.pvpCriticalCatchKind = "";
      game.pvpCelebrationWinnerIndex = index;
      pvpPlayers.forEach(clearFrogAfterimages);
      game.pvpCelebrationTimer = CONFIG.pvpCelebrationSeconds;
      // A round result is its own state. Clear every pause pointer/selection so
      // a touch released on the same frame cannot replace the result with the
      // pause overlay or award the round a second time.
      game.pauseHelpOpen = false;
      game.pauseHoveredSelection = null;
      game.pausePressedSelection = null;
      game.pausePointerId = null;
      game.volumeDragging = false;
      game.volumePointerId = null;
      game.state = "pvpCelebration";
      window.dispatchEvent(new CustomEvent("ribbit-pvp-round-ended", {
        detail: { winnerIndex: index, matchWinnerIndex: game.pvpMatchWinnerIndex, roundNumber: game.pvpRoundNumber }
      }));
      game.victorySelection = "replay";
      game.pvpVictoryMouseMode = false;
      game.pvpVictoryHoveredSelection = null;
      game.pvpVictoryPressedSelection = null;
      game.pvpVictoryAchievementPage = 0;
      game.pvpVictoryAchievementPage = 0;
      game.pvpVictoryAchievementHoverId = null;
      pvpPlayers.forEach((player) => {
        player.inputHeld = false;
        player.charging = false;
        player.vx = 0;
        player.vy = 0;
        player.tongue.active = false;
        player.bonked = false;
        player.stunTimer = 0;
        // Preserve the frog's actual end-of-round position. If the winner
        // landed on a platform, the celebration now happens on that platform
        // instead of teleporting the frog down to ground level.
      });
      playWinSound();
    }


    function updatePvpCelebration(dt) {
      game.pvpCelebrationTimer = Math.max(0, game.pvpCelebrationTimer - dt);
      if (game.pvpCelebrationTimer <= 0) {
        awardCpuChampForCompletedMatch(false);
        game.state = "won";
        game.winInputLock = 0.5;
      }
    }

    function beginPvpSuddenDeath() {
      game.pvpCriticalCatchActive = false;
      game.pvpCriticalCatchPlayedThisRound=false;game.pvpCriticalCatchEventId="";
      game.pvpCriticalCatchElapsed = 0;
      game.pvpCriticalCatchCameraX = W / 2;
      game.pvpCriticalCatchCameraY = CONFIG.playBottom / 2;
      game.pvpCriticalCatchCameraZoom = 1;
      game.pvpCriticalCatchWinnerIndex = null;
      game.pvpCriticalCatchKind = "";
      game.pvpSuddenDeath = true;
      game.pvpSuddenDeathScores = [0, 0];
      game.pvpWinPendingIndex = null;
      game.pvpTimedOutcomePending = false;
      game.pvpTimerGraceActive = false;
      game.pvpTimerGraceEligible = [false, false];
      game.pvpTimeRemaining = 0;
      game.pvpLastUrgentSecond = null;
      resetPvpPlayer(pvpPlayers[0], PVP_START_X[0], 1);
      resetPvpPlayer(pvpPlayers[1], PVP_START_X[1], -1);
      flies.length = 0;
      nextFlyId = 1;
      game.completedVocabIndices = new Set();
      game.promptSerial += 1;
      const openingVocabulary = shuffledVocabularyIndices().slice(0, CONFIG.maxFlies);
      const openingTarget = openingVocabulary[Math.floor(Math.random() * openingVocabulary.length)];
      const ordered = [openingTarget, ...openingVocabulary.filter((value) => value !== openingTarget)];
      game.spawnQueue = ordered.map((vocabIndex, index) => ({
        dueAt: game.elapsed + (index === 0 ? 0 : index * CONFIG.pvpOpeningFlyInterval + STEP),
        source: "sudden",
        vocabIndex
      }));
      game.targetVocabIndex = openingTarget;
      game.pvpPreservedCharges = [null, null];
      game.pvpSuddenDeathAlertTimer = 1.15;
      game.state = "pvpSuddenDeathAlert";
      tone(185, 0.14, 0.026, -25);
      tone(370, 0.18, 0.021, 70, 0.12);
    }


    function preservePvpChargedJumpsAtTimeLimit() {
      game.pvpPreservedCharges = pvpPlayers.map((player, index) => ({
        charging: Boolean(player.charging),
        inputHeld: Boolean(player.inputHeld || isPvpPhysicalJumpHeld(index)),
        charge: clamp(player.charge, 0.04, 1),
        chargeDirection: player.chargeDirection || 1,
        chargeHoldTime: Math.max(0, player.chargeHoldTime || 0),
        chargeFacingDir: player.chargeFacingDir >= 0 ? 1 : -1,
        releasedDuringGrace: false
      }));
    }

    function cancelPvpChargedJumpsAtTimeLimit(clearPreserved = false) {
      game.pvpCpuPlan = null;
      game.pvpCpuDecisionTimer = 0;
      pvpPlayers.forEach((player) => {
        player.inputHeld = false;
        player.charging = false;
        player.charge = 0.04;
        player.chargeDirection = 1;
        player.chargeHoldTime = 0;
      });
      if (clearPreserved) game.pvpPreservedCharges = [null, null];
    }

    function restorePvpChargedJumpsForSuddenDeath() {
      const preserved = Array.isArray(game.pvpPreservedCharges) ? game.pvpPreservedCharges : [null, null];
      pvpPlayers.forEach((player, index) => {
        const saved = preserved[index];
        if (!saved?.charging || !player.grounded || player.bonked || player.stunTimer > 0) return;
        player.charge = clamp(saved.charge, 0.04, 1);
        player.chargeDirection = saved.chargeDirection || 1;
        player.chargeHoldTime = Math.max(0, saved.chargeHoldTime || 0);
        player.chargeFacingDir = saved.chargeFacingDir >= 0 ? 1 : -1;
        player.dir = player.chargeFacingDir;
        player.charging = true;
        const stillHeld = index === getPvpCpuIndex() && game.pvpCpuEnabled
          ? saved.inputHeld
          : isPvpPhysicalJumpHeld(index);
        player.inputHeld = stillHeld || saved.releasedDuringGrace;
        if (saved.releasedDuringGrace) {
          // Launch immediately at the preserved charge when the player released
          // during the final-jump grace window.
          releasePvpButton(index, index === getPvpCpuIndex() && game.pvpCpuEnabled ? "cpu" : "system");
        }
      });
      game.pvpPreservedCharges = [null, null];
    }

    function beginPvpTimerJumpGrace() {
      // A grounded frog holding a charge automatically releases at the buzzer,
      // then receives the same final-jump grace as an already-airborne frog.
      pvpPlayers.forEach((player, index) => {
        if (player && player.grounded && player.charging && !player.bonked && player.stunTimer <= 0) {
          player.inputHeld = true;
          releasePvpButton(index, "system");
        }
      });
      const eligible = pvpPlayers.map((player) => Boolean(
        player && (!player.grounded || player.landedThisFrame || player.tongue.active)
      ));
      game.pvpTimerGraceEligible = eligible;
      game.pvpTimerGracePromptSerial = game.promptSerial;
      game.pvpTimerGraceActive = eligible.some(Boolean);
      game.pvpTimedOutcomePending = true;
      game.spawnQueue = [];
      preservePvpChargedJumpsAtTimeLimit();
      cancelPvpChargedJumpsAtTimeLimit(false);
      pvpPlayers.forEach((player, index) => {
        if (!eligible[index] && player?.tongue) {
          player.tongue.active = false;
          player.tongue.targetFlyId = null;
          player.tongue.captured = false;
        }
      });
    }

    function pvpTimerGracePlayerCanCatch(player) {
      if (!game.pvpTimerGraceActive) return true;
      if (!player || !game.pvpTimerGraceEligible[player.index]) return false;
      return !player.grounded || player.landedThisFrame || player.tongue.active;
    }

    function pvpTimerGraceHasFinished() {
      if (!game.pvpTimerGraceActive) return true;
      return pvpPlayers.every((player, index) => {
        if (!game.pvpTimerGraceEligible[index]) return true;
        return player.grounded && !player.landedThisFrame && !player.tongue.active;
      });
    }

    function resolvePvpTimedOutcomeAfterJump() {
      game.pvpTimerGraceActive = false;
      game.pvpTimerGraceEligible = [false, false];
      game.pvpTimerGracePromptSerial = -1;
      game.pvpTimedOutcomePending = false;

      if (pvpPlayers[0].score === pvpPlayers[1].score) {
        beginPvpSuddenDeath();
        return;
      }

      cancelPvpChargedJumpsAtTimeLimit(true);
      const winnerIndex = pvpPlayers[0].score > pvpPlayers[1].score ? 0 : 1;
      game.targetVocabIndex = null;
      game.spawnQueue = [];
      pvpPlayers.forEach((player) => {
        player.tongue.active = false;
        player.tongue.targetFlyId = null;
        player.vx = 0;
        player.vy = 0;
      });
      completePvpWin(winnerIndex);
    }
