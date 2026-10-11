    function resetPvpPlayer(player, x, dir) {
      player.x = x;
      player.y = CONFIG.groundY - player.h;
      player.previousX = player.x;
      player.previousY = player.y;
      player.vx = 0;
      player.vy = 0;
      player.dir = dir;
      player.grounded = true;
      player.charging = false;
      player.charge = 0.04;
      player.chargeDirection = 1;
      player.chargeHoldTime = 0;
      player.chargeFacingDir = dir;
      player.onlineLaunchSequence=0;player.onlineCollisionVersion=0;player.onlineInputLaunchSequence=0;
      player.inputHeld = false;
      player.departurePlatform = null;
      player.dropThroughPlatform = null;
      player.landingSquash = 0;
      player.bonkLandingPopTimer = 0;
      player.blinkTimer = 1.2 + player.index;
      player.blinking = false;
      clearFrogAfterimages(player);
      player.score = 0;
      player.bonked = false;
      player.stunTimer = 0;
      player.stunCountdownStarted = false;
      player.bonkStunDuration = CONFIG.pvpBonkMinStunSeconds;
      player.bonkedByPlayerIndex = null;
      player.pendingMaximumBonkDuration = 0;
      player.collisionCooldown = 0;
      player.airTime = 0;
      player.jumpStartY = player.y;
      player.highestY = player.y;
      player.lastLaunchPower = 0;
      player.firstJumpMade = false;
      player.landedThisFrame = false;
      player.bouncedOffOpponentThisJump = false;
      player.wentAboveMapThisJump = false;
      player.bonksThisJump = 0;
      player.correctCatchesThisJump = 0;
      player.oneJumpCatchEligible = false;
      player.oneJumpStartingFlyIds = null;
      player.lastOpponentBounceType = null;
      player.quickDropThisJump = false;
      player.airborneTapPressAt = -Infinity;
      player.platformDropBufferUntil = -Infinity;
      player.bufferedDropBonkArmed = false;
      player.wallBouncedThisJump = false;
      player.lowHopAvoidanceCandidate = false;
      player.wasBonkedThisJump = false;
      player.cpuHoldChargeTrap = false;
      player.cpuTrapIdleTime = 0;
      player.cpuTrapBailUntil = -Infinity;
      player.lastHumanInputAt = -Infinity;
      player.humanInputCount = 0;
      player.catchSparkleTimer = 0;
      player.wrongCatchBubbleTimer = 0;
      Object.assign(player.tongue, { active: false, elapsed: 0, targetFlyId: null, captured: false });
    }

    function resetPvpGame() {
      applyPendingVocabulary();
      clearPvpPhysicalShiftState(false);
      applySelectedLevel();
      resetMovingPlatforms();
      resetPvpPlayer(pvpPlayers[0], PVP_START_X[0], 1);
      resetPvpPlayer(pvpPlayers[1], PVP_START_X[1], -1);
      flies.length = 0;
      nextFlyId = 1;
      game.spawnQueue = [];
      game.completedVocabIndices = new Set();
      game.promptSerial = 1;
      game.targetVocabIndex = 0;
      game.lastFlySpawnIndex = -1;
      game.lastFlySpawnTime = -Infinity;
      game.score = 0;
      game.elapsed = 0;
      game.finishTime = null;
      game.pvpElapsed = 0;
      game.pvpFinalDisplayTime = null;
      game.pvpTimeRemaining = game.pvpTimeLimitSeconds > 0 ? game.pvpTimeLimitSeconds : 0;
      if (isPvpEndlessMode() && game.pvpTimeRemaining <= 0) game.pvpTimeRemaining = 30;
      game.pvpTimedOutcomePending = false;
      game.pvpTimerGraceActive = false;
      game.pvpTimerGraceEligible = [false, false];
      game.pvpTimerGracePromptSerial = -1;
      game.pvpLastUrgentSecond = null;
      game.pvpSuddenDeath = false;
      game.pvpSuddenDeathScores = [0, 0];
      game.pvpPreservedCharges = [null, null];
      game.worldTime = 0;
      game.winPending = false;
      game.pvpWinnerIndex = null;
      game.pvpWinPendingIndex = null;
      game.pvpRoundBonkCounts = [0, 0];
      game.pvpBonusEligible = false;
      game.pvpCelebrationTimer = 0;
      game.pvpCelebrationWinnerIndex = null;
      game.pvpImpactEffects = [];
      game.pvpCriticalCatchActive = false;
      game.pvpCriticalCatchPlayedThisRound=false;game.pvpCriticalCatchEventId="";
      game.pvpCriticalCatchElapsed = 0;
      game.pvpCriticalCatchCameraX = W / 2;
      game.pvpCriticalCatchCameraY = CONFIG.playBottom / 2;
      game.pvpCriticalCatchCameraZoom = 1;
      game.pvpCriticalCatchWinnerIndex = null;
      game.pvpCpuPlan = null;
      game.pvpCpuDecisionTimer = 0;
      game.pvpCpuEvasionCooldownFrames = 0;
      game.pvpVictoryAchievementHoverId = null;
      game.roundUnlockedPvpAchievementIds = [];
      game.winInputLock = 0;
      game.victorySelection = "replay";
      game.buttonHeld = false;
      const openingVocabulary = shuffledVocabularyIndices().slice(0, CONFIG.maxFlies);
      const openingTarget = openingVocabulary[Math.floor(Math.random() * openingVocabulary.length)];
      const orderedOpeningVocabulary = [openingTarget, ...openingVocabulary.filter((vocabIndex) => vocabIndex !== openingTarget)];
      game.spawnQueue = orderedOpeningVocabulary.map((vocabIndex, index) => ({ dueAt: index === 0 ? 0 : index * 1.05 + STEP, source: "initial", vocabIndex }));
      game.targetVocabIndex = openingTarget;
      if(OnlineVersus.isActive()){OnlineVersus.resetRoundState();OnlineVersus.preparePromptPlan();}
    }

    function continuePvpMatch() {
      if (OnlineVersus.isGuestActive()) {
        tone(220, 0.05, 0.010, -35);
        return false;
      }
      const resetMatch = game.pvpMatchWinnerIndex !== null;
      OnlineVersus.notifyNextRound(resetMatch);
      if (resetMatch) return OnlineVersus.hasRoom() ? true : startNewPvpCountdown(true);
      game.pvpRoundNumber += 1;
      return startNewPvpCountdown(false);
    }

    function startNewPvpCountdown(resetMatch = false) {
      clearSoloPhysicalInputState(false);
      clearPvpPhysicalShiftState(false);
      if (game.state === "pvpSetup") commitPvpPreviewSelections();
      if (resetMatch) {
        game.pvpRoundWins = [0, 0];
        game.pvpRoundNumber = 1;
        game.pvpMatchWinnerIndex = null;
        game.pvpLastRandomLevelId = null;
        game.pvpMatchBonkCounts = [0, 0];
        game.pvpSelfBonkCounts = [0, 0];
        capturePvpMatchAchievementContext();
      }
      const requestedStageId = OnlineVersus.isQuickplay() ? OnlineVersus.quickRoundStage(game.pvpRoundNumber) : (game.pvpSetupLevelId || game.selectedLevelId);
      const levelId = requestedStageId === "random" ? pickRandomPvpLevel(game.pvpLastRandomLevelId) : requestedStageId;
      if (requestedStageId === "random") { game.pvpLastRandomLevelId = levelId; game.pvpRandomPreviewLevelId = levelId; }
      game.selectedLevelId = levelId;
      applySelectedLevel();
      game.mode = "pvp";
      const selectedP1SkinId = normalizePvpSkinId(game.pvpSetupSkinIds[0], "azure");
      const selectedP2SkinId = normalizePvpSkinId(game.pvpSetupSkinIds[1], "crimson");
      pvpPlayers[0].skinId = game.onlineMode || isPvpSkinAvailable(selectedP1SkinId) ? selectedP1SkinId : "azure";
      pvpPlayers[1].skinId = game.onlineMode || isPvpSkinAvailable(selectedP2SkinId) ? selectedP2SkinId : "crimson";
      if (!OnlineVersus.isQuickplay() && pvpPlayers[0].skinId === pvpPlayers[1].skinId) {
        pvpPlayers[1].skinId = getFirstAvailablePvpSkin(pvpPlayers[0].skinId, "crimson");
        game.pvpSetupSkinIds[1] = pvpPlayers[1].skinId;
      }
      if (game.timeOfDayLock) game.timeOfDay = game.timeOfDayLock;
      else if (requestedStageId === "random") game.timeOfDay = randomTimeOfDay();
      else if (game.lastStartedLevelId === game.selectedLevelId && game.lastStartedTimeOfDay) game.timeOfDay = nextTimeOfDay(game.lastStartedTimeOfDay);
      else game.timeOfDay = randomTimeOfDay();
      game.lastStartedLevelId = game.selectedLevelId;
      game.lastStartedTimeOfDay = game.timeOfDay;
      if (game.timeOfDay === "night") {
        if (game.moonSequenceStarted) game.moonPhaseIndex = (game.moonPhaseIndex + 1) % MOON_PHASES.length;
        else game.moonSequenceStarted = true;
      }
      syncTimeOfDayChrome();
      resetPvpGame();
      game.pvpRoundAwardedToken = null;
      startResumeCountdown();
      return true;
    }

    function getPvpMouth(player) {
      return { x: player.dir > 0 ? player.x + player.w - 2 : player.x + 2, y: player.y + 5 };
    }

    function getPvpStandingPlatform(player) {
      return platforms.find((platform) =>
        Math.abs(player.y + player.h - platform.y) <= 1.5 &&
        horizontalOverlap(player.x, player.w, platform)
      ) || null;
    }

    function getPvpCpuIndex() {return game.onlineMode && (game.onlineCpuIndex===0||game.onlineCpuIndex===1)?game.onlineCpuIndex:1;}

    function isPvpPhysicalJumpHeld(playerIndex) {
      const networkHeld = OnlineVersus.isInputHeld(playerIndex);
      return networkHeld === null ? Boolean(pvpPhysicalInputsHeld?.[playerIndex]?.size) : networkHeld;
    }

    function predictPvpBonkWithin(attacker, target, horizonSeconds = 0.25) {
      if (!attacker || !target || attacker.grounded || attacker.bonked || attacker.stunTimer > 0) return false;
      const step = 0.025;
      let x = attacker.x;
      let y = attacker.y;
      let vx = attacker.vx;
      let vy = attacker.vy;
      for (let t = step; t <= horizonSeconds + 0.0001; t += step) {
        vy += CONFIG.gravity * step;
        x += vx * step;
        y += vy * step;
        if (x <= 0) { x = 0; vx = Math.abs(vx); }
        else if (x + attacker.w >= W) { x = W - attacker.w; vx = -Math.abs(vx); }
        const horizontalOverlapPredicted = x + attacker.w * 0.78 > target.x && x + attacker.w * 0.22 < target.x + target.w;
        const feetY = y + attacker.h;
        const headZoneTop = target.y - 5;
        const headZoneBottom = target.y + target.h * 0.58;
        if (horizontalOverlapPredicted && vy > -35 && feetY >= headZoneTop && feetY <= headZoneBottom) return true;
      }
      return false;
    }

    function getPvpLowHopAvoidanceCandidate(player, opponent, power, quickDrop) {
      if (!player || !opponent || quickDrop || !opponent.grounded || opponent.bonked || opponent.stunTimer > 0) return false;
      const opponentPlatform = getPvpStandingPlatform(opponent);
      if (!opponentPlatform || opponentPlatform.ground) return false;
      const playerCenterX = player.x + player.w / 2;
      const opponentCenterX = opponent.x + opponent.w / 2;
      const horizontalDistance = Math.abs(playerCenterX - opponentCenterX);
      const verticalGap = player.y - (opponent.y + opponent.h);
      if (verticalGap < 4 || verticalGap > 115 || horizontalDistance > Math.max(35, opponentPlatform.w * 0.48)) return false;
      const launchSpeedY = lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, clamp(power, 0, 1));
      const apexRise = launchSpeedY * launchSpeedY / (2 * CONFIG.gravity);
      const apexTopY = player.y - apexRise;
      const safeBelowOpponent = apexTopY > opponent.y + opponent.h + 2;
      return safeBelowOpponent && power <= 0.42;
    }

    function getPvpCpuSelfBonkTrapOpportunity(cpu, opponent, matchingFlyCount = 0) {
      if (!cpu || !opponent || !cpu.grounded || !opponent.grounded || !opponent.charging || opponent.bonked || opponent.stunTimer > 0) return 0;
      const cpuPlatform = getPvpStandingPlatform(cpu);
      if (!cpuPlatform || cpuPlatform.ground) return 0;
      const power = clamp(opponent.charge, 0.04, 1);
      let x = opponent.x;
      let y = opponent.y;
      let vx = opponent.dir * lerp(CONFIG.minimumJumpX, CONFIG.maximumJumpX, power);
      let vy = -lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, power);
      let bestFit = 0;
      let interceptTime = Infinity;
      const step = 0.025;
      for (let t = step; t <= 1.65; t += step) {
        vy += CONFIG.gravity * step;
        x += vx * step;
        y += vy * step;
        if (x <= 0) { x = 0; vx = Math.abs(vx); }
        else if (x + opponent.w >= W) { x = W - opponent.w; vx = -Math.abs(vx); }
        const horizontal = x + opponent.w * 0.82 > cpu.x && x + opponent.w * 0.18 < cpu.x + cpu.w;
        const risingIntoUnderside = vy < -15 && y <= cpu.y + cpu.h && y + opponent.h >= cpu.y + cpu.h * 0.35;
        if (horizontal && risingIntoUnderside) {
          const centerDistance = Math.abs((x + opponent.w / 2) - (cpu.x + cpu.w / 2));
          const fit = 1 - clamp(centerDistance / Math.max(24, cpuPlatform.w * 0.62), 0, 1);
          if (fit > bestFit) { bestFit = fit; interceptTime = t; }
        }
      }
      if (bestFit <= 0) return 0;
      const strategic = cpu.score > opponent.score || matchingFlyCount <= 0;
      const timing = 1 - clamp(Math.abs(interceptTime - 0.58) / 0.9, 0, 1);
      return clamp(bestFit * 0.62 + timing * 0.22 + (strategic ? 0.22 : 0), 0, 1);
    }

    function isPvpCpuHighGroundTrapStillActive(cpu, opponent) {
      if (!cpu || !opponent || !cpu.grounded || cpu.bonked || cpu.stunTimer > 0) return false;
      const platform = getPvpStandingPlatform(cpu);
      if (!platform || platform.ground) return false;
      const cpuCenterX = cpu.x + cpu.w / 2;
      const cpuCenterY = cpu.y + cpu.h / 2;
      const projectedOpponentCenterX = opponent.x + opponent.w / 2 + (opponent.grounded ? 0 : opponent.vx * 0.18);
      const opponentCenterY = opponent.y + opponent.h / 2;
      const horizontalAllowance = Math.max(38, platform.w * 0.58);
      const horizontallyUnder = Math.abs(projectedOpponentCenterX - cpuCenterX) <= horizontalAllowance;
      // Keep holding through the lower frog's ascent and contact frames. The
      // trap ends only after it leaves horizontally or clearly rises past the CPU.
      const belowOrOverlapping = opponentCenterY >= cpuCenterY - 4;
      const verticalDistance = opponentCenterY - cpuCenterY;
      return horizontallyUnder && belowOrOverlapping && verticalDistance <= 135;
    }

    function startPvpCharge(player) {
      if(OnlineVersus.isGuestActive()&&player.index===1&&OnlineVersus.predictionHolding())return;
      if (game.state !== "playing" || game.pvpTimerGraceActive || game.pvpTimedOutcomePending || !player.grounded || player.charging || player.stunTimer > 0 || player.bonked || game.pvpWinPendingIndex !== null) return;
      player.charging = true;
      player.charge = 0.04;
      player.chargeDirection = 1;
      player.chargeHoldTime = 0;
      player.chargeFacingDir = player.dir >= 0 ? 1 : -1;
      tone(player.index === 0 ? 105 : 120, 0.035, 0.010, 8);
    }

    function pressPvpButton(index, source = "human") {
      const player = pvpPlayers[index];
      if (!player || game.mode !== "pvp" || game.state !== "playing" || game.pvpTimerGraceActive || game.pvpTimedOutcomePending || player.inputHeld) return;
      if (source === "human" && index === getPvpCpuIndex() && game.pvpCpuEnabled) return;
      ensureAudio();
      player.inputHeld = true;
      if (!player.grounded) player.airborneTapPressAt = game.pvpElapsed;
      if (source === "human" || source === "online") {
        player.lastHumanInputAt = game.pvpElapsed;
        player.humanInputCount = (player.humanInputCount || 0) + 1;
      }
      if (player.grounded) startPvpCharge(player);
    }

    function releasePvpButton(index, source = "human") {
      const player = pvpPlayers[index];
      if (!player || !player.inputHeld) return;
      if (source === "human" && index === getPvpCpuIndex() && game.pvpCpuEnabled) return;
      if (game.pvpTimerGraceActive || game.pvpTimedOutcomePending) {
        const saved = Array.isArray(game.pvpPreservedCharges) ? game.pvpPreservedCharges[index] : null;
        if (saved?.charging) saved.releasedDuringGrace = true;
        player.inputHeld = false;
        player.charging = false;
        player.charge = 0.04;
        player.chargeDirection = 1;
        player.chargeHoldTime = 0;
        return;
      }
      if (source === "human" || source === "online") {
        player.lastHumanInputAt = game.pvpElapsed;
        player.humanInputCount = (player.humanInputCount || 0) + 1;
      }
      player.inputHeld = false;
      if (!player.grounded && !player.charging) {
        const heldFor = game.pvpElapsed - (Number(player.airborneTapPressAt) || -Infinity);
        if (heldFor >= 0 && heldFor <= 0.25) player.platformDropBufferUntil = game.pvpElapsed + 0.25;
        player.airborneTapPressAt = -Infinity;
        return;
      }
      if (!player.charging || !player.grounded || game.state !== "playing" || player.stunTimer > 0 || player.bonked) return;
      const power = clamp(player.charge, 0, 1);
      const standingPlatform = getPvpStandingPlatform(player);
      const isOpeningJump = !player.firstJumpMade;
      const quickDrop = Boolean(standingPlatform && !standingPlatform.ground && player.chargeHoldTime < CONFIG.platformDropHoldThreshold);
      const opponent = pvpPlayers[player.index === 0 ? 1 : 0];
      const closeCallDrop = Boolean(quickDrop && predictPvpBonkWithin(opponent, player, 0.25));
      const lowHopAvoidance = getPvpLowHopAvoidanceCandidate(player, opponent, power, quickDrop);
      const launchDirection = player.chargeFacingDir >= 0 ? 1 : -1;
      player.dir = launchDirection;
      const velocity = {
        vx: launchDirection * lerp(CONFIG.minimumJumpX, CONFIG.maximumJumpX, power),
        vy: quickDrop ? CONFIG.platformDropVelocityY : -lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, power)
      };
      player.departurePlatform = quickDrop ? null : standingPlatform;
      player.dropThroughPlatform = quickDrop ? standingPlatform : null;
      player.vx = velocity.vx;
      player.vy = velocity.vy;
      player.grounded = false;
      player.charging = false;
      player.landingSquash = 0;
      player.airTime = 0;
      player.jumpStartY = player.y;
      player.highestY = player.y;
      player.lastLaunchPower = power;
      player.firstJumpMade = true;
      player.openingJumpActive = isOpeningJump;
      player.bouncedOffOpponentThisJump = false;
      player.wentAboveMapThisJump = false;
      player.bonksThisJump = 0;
      player.correctCatchesThisJump = 0;
      player.oneJumpCatchEligible = !quickDrop;
      player.oneJumpStartingFlyIds = !quickDrop ? new Set(flies.filter((fly) => fly && fly.state === "active").map((fly) => fly.id)) : null;
      player.lastOpponentBounceType = null;
      player.quickDropThisJump = quickDrop;
      player.wallBouncedThisJump = false;
      player.lowHopAvoidanceCandidate = lowHopAvoidance;
      player.wasBonkedThisJump = false;
      if (closeCallDrop) markPvpAchievementEarned("pvp-close-call", player.index, true);
      if (isOpeningJump) player.hasRegisteredFirstJumpBonk = false;
      beginHighPowerJumpStreak(player, power, quickDrop);
      playJumpSound(power);
      OnlineVersus.rememberLaunch(player);
    }

    function getPvpPlatformMotionProgressAt(futureSeconds = 0) {
      const worldTime = game.worldTime + Math.max(0, Number(futureSeconds) || 0);
      const cycle = ((worldTime % CONFIG.lakePlatformPeriod) + CONFIG.lakePlatformPeriod) % CONFIG.lakePlatformPeriod / CONFIG.lakePlatformPeriod;
      return (1 - Math.cos(cycle * Math.PI * 2)) / 2;
    }

    function getPredictedPvpPlatformRect(platform, futureSeconds = 0) {
      if (!platform || !platform.moving) return platform;
      const progress = getPvpPlatformMotionProgressAt(futureSeconds);
      if (platform.movementAxis === "y") {
        return { ...platform, y: lerp(platform.innerY, platform.outerY, progress) };
      }
      return { ...platform, x: lerp(platform.innerX, platform.outerX, progress) };
    }

    function updatePvpMovingPlatforms() {
      const movingPlatforms = platforms.filter((platform) => platform.moving);
      if (!movingPlatforms.length) return;
      const progress = getPvpPlatformMotionProgressAt(0);
      const carriers = pvpPlayers.map((player) => movingPlatforms.find((platform) =>
        player.grounded && Math.abs(player.y + player.h - platform.y) <= 1.5 && horizontalOverlap(player.x, player.w, platform)
      ) || null);
      const deltas = new Map();
      for (const platform of movingPlatforms) {
        const px = platform.x, py = platform.y;
        if (platform.movementAxis === "y") platform.y = lerp(platform.innerY, platform.outerY, progress);
        else platform.x = lerp(platform.innerX, platform.outerX, progress);
        deltas.set(platform, { x: platform.x - px, y: platform.y - py });
      }
      pvpPlayers.forEach((player, index) => {
        const carrier = carriers[index];
        if (!carrier) return;
        const delta = deltas.get(carrier);
        player.x = clamp(player.x + delta.x, 0, W - player.w);
        player.y += delta.y;
      });
    }

    function emitPvpPlayerSfx(player, stampKey, minGapSeconds, callback) {
      if (typeof callback !== "function") return;
      const clock = Number.isFinite(game.worldTime) ? game.worldTime : (Number(game.pvpElapsed) || 0);
      if (Number.isFinite(player?.[stampKey]) && clock - player[stampKey] < minGapSeconds) return;
      if (player) player[stampKey] = clock;
      callback();
    }

    function updatePvpPlayer(player, dt) {
      player.landedThisFrame = false;
      player.previousX = player.x;
      player.previousY = player.y;
      player.catchSparkleTimer = Math.max(0, player.catchSparkleTimer - dt);
      player.wrongCatchBubbleTimer = Math.max(0, player.wrongCatchBubbleTimer - dt);
      player.landingSquash = Math.max(0, player.landingSquash - dt * 4.5);
      player.bonkLandingPopTimer = Math.max(0, (player.bonkLandingPopTimer || 0) - dt);
      player.collisionCooldown = Math.max(0, player.collisionCooldown - dt);
      player.blinkTimer -= dt;
      if (player.blinkTimer <= 0) {
        player.blinking = !player.blinking;
        player.blinkTimer = player.blinking ? 0.12 : 1.6 + Math.random() * 2.5;
      }

      if (player.stunTimer > 0 && player.stunCountdownStarted) {
        const prevStun = player.stunTimer;
        player.stunTimer = Math.max(0, player.stunTimer - dt);
        const heldThroughStun = player.index === getPvpCpuIndex() && game.pvpCpuEnabled
          ? player.inputHeld
          : isPvpPhysicalJumpHeld(player.index);
        player.inputHeld = heldThroughStun;
        if (prevStun > 0 && player.stunTimer === 0) {
          player.stunCountdownStarted = false;
          player.lastStunEndAt = game.pvpElapsed;
          if (heldThroughStun) startPvpCharge(player);
        }
        player.charging = player.stunTimer === 0 ? player.charging : false;
        player.vx = 0;
        player.vy = 0;
        player.grounded = true;
        player.openingJumpActive = false;
        return;
      }

      if (player.bonked) {
        // Falling/flip time is not part of the stun countdown.
        player.stunTimer = 0;
        player.stunCountdownStarted = false;
        player.charging = false;
        if (!(player.index === getPvpCpuIndex() && game.pvpCpuEnabled)) player.inputHeld = isPvpPhysicalJumpHeld(player.index);
        player.vx = 0;
        player.vy = Math.min(CONFIG.pvpBonkMaxFallSpeed, player.vy + CONFIG.pvpBonkGravity * dt);
        player.y += player.vy * dt;
        if (player.y + player.h >= CONFIG.groundY) {
          player.y = CONFIG.groundY - player.h;
          player.vy = 0;
          player.grounded = true;
          player.bonked = false;
          const appliedBonkDuration = clamp(player.bonkStunDuration, CONFIG.pvpBonkMinStunSeconds, CONFIG.pvpBonkMaxStunSeconds);
          player.stunTimer = appliedBonkDuration;
          player.stunCountdownStarted = true;
          awardMaximumBonkAchievement(player.bonkedByPlayerIndex, appliedBonkDuration, true);
          player.bonkStunDuration = CONFIG.pvpBonkMinStunSeconds;
          player.bonkedByPlayerIndex = null;
          player.pendingMaximumBonkDuration = 0;
          player.bonkLandingPopTimer = 0.18;
          player.landingSquash = Math.max(player.landingSquash, 1.15);
          const thudPalette = getPvpSkinPalette(player.skinId, player.index === 0 ? "azure" : "crimson", player.index);
          spawnPvpImpactEffect("thud", player.x + player.w / 2, CONFIG.groundY - 1, thudPalette);
          emitPvpPlayerSfx(player, 'lastBonkLandSfxAt', 0.12, () => {
            tone(72, 0.075, 0.026, -18);
            tone(108, 0.045, 0.014, -28, 0.025);
            playDazedSound(player.index);
          });
        }
        return;
      }

      if (player.charging) {
        player.chargeHoldTime += dt;
        // The CPU's high-ground trap uses the same oscillating charge meter as
        // every other jump. It may hold the input indefinitely, but it cannot
        // freeze or store the meter at maximum power.
        if (player.chargeDirection !== 1 && player.chargeDirection !== -1) {
          player.chargeDirection = player.charge >= 0.98 ? -1 : 1;
        }
        player.charge += player.chargeDirection * (1 / CONFIG.chargeSecondsOneWay) * dt;
        if (player.charge >= 1) { player.charge = 1; player.chargeDirection = -1; }
        else if (player.charge <= 0.04) { player.charge = 0.04; player.chargeDirection = 1; }
      }

      if (player.grounded) {
        player.vx = 0;
        player.vy = 0;
        if (player.inputHeld && !player.charging) startPvpCharge(player);
        return;
      }

      player.airTime += dt;
      player.highestY = Math.min(player.highestY, player.y);
      const previousBottom = player.y + player.h;
      player.vy += CONFIG.gravity * dt;
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      if (player.y + player.h < 0) player.wentAboveMapThisJump = true;

      if (player.departurePlatform) {
        const platform = player.departurePlatform;
        const bottom = player.y + player.h;
        if (player.vy >= 0 || bottom < platform.y - 2 || bottom > platform.y + platform.h + 2 || !horizontalOverlap(player.x, player.w, platform)) player.departurePlatform = null;
      }
      if (player.dropThroughPlatform) {
        const platform = player.dropThroughPlatform;
        if (player.y > platform.y + platform.h + 2 || !horizontalOverlap(player.x, player.w, platform)) player.dropThroughPlatform = null;
      }

      if (player.x <= 0) {
        player.x = 0; player.vx = Math.abs(player.vx); player.dir = 1; player.wallBouncedThisJump = true; emitPvpPlayerSfx(player, 'lastWallBounceSfxAt', 0.08, () => tone(115, 0.045, 0.018, -25));
      } else if (player.x + player.w >= W) {
        player.x = W - player.w; player.vx = -Math.abs(player.vx); player.dir = -1; player.wallBouncedThisJump = true; emitPvpPlayerSfx(player, 'lastWallBounceSfxAt', 0.08, () => tone(115, 0.045, 0.018, -25));
      }

      if (player.vy >= 0) {
        const bottom = player.y + player.h;
        let landing = null;
        for (const platform of platforms) {
          if (platform === player.departurePlatform || platform === player.dropThroughPlatform) continue;
          if (previousBottom <= platform.y + 1.5 && bottom >= platform.y && horizontalOverlap(player.x, player.w, platform)) {
            if (!landing || platform.y < landing.y) landing = platform;
          }
        }
        if (landing) {
          const bufferedDrop = !landing.ground && game.pvpElapsed <= player.platformDropBufferUntil;
          if (bufferedDrop) {
            player.y = landing.y - player.h + 2;
            player.vy = CONFIG.platformDropVelocityY;
            player.grounded = false;
            player.departurePlatform = null;
            player.dropThroughPlatform = landing;
            player.landingSquash = 0;
            player.platformDropBufferUntil = -Infinity;
            player.bufferedDropBonkArmed = true;
            player.correctCatchesThisJump = 0;
            player.oneJumpCatchEligible = false;
            player.oneJumpStartingFlyIds = null;
            tone(116, 0.045, 0.014, -35);
          } else {
            player.y = landing.y - player.h;
            player.vx = 0; player.vy = 0; player.grounded = true;
            player.landedThisFrame = true;
            player.airTime = 0;
            player.jumpStartY = player.y;
            player.highestY = player.y;
            player.lastLaunchPower = 0;
            player.bouncedOffOpponentThisJump = false;
            player.lastOpponentBounceType = null;
            player.wallBouncedThisJump = false;
            player.wentAboveMapThisJump = false;
            player.departurePlatform = null; player.dropThroughPlatform = null; player.landingSquash = 1;
            if (Math.abs(player.vy) > 130 || previousBottom < landing.y - 14) player.bonkLandingPopTimer = 0.10;
            player.platformDropBufferUntil = -Infinity;
            player.bufferedDropBonkArmed = false;
            player.oneJumpCatchEligible = false;
            player.oneJumpStartingFlyIds = null;
            if (player.lowHopAvoidanceCandidate && !player.wasBonkedThisJump) markPvpAchievementEarned("pvp-low-profile", player.index, true);
            player.lowHopAvoidanceCandidate = false;
            player.wasBonkedThisJump = false;
            player.openingJumpActive = false;
            emitPvpPlayerSfx(player, 'lastLandingSfxAt', 0.08, () => tone(88, 0.04, 0.014, -16));
            if (player.inputHeld || isPvpPhysicalJumpHeld(player.index)) { player.inputHeld = true; startPvpCharge(player); }
          }
        }
      }
      if (player.y > CONFIG.playBottom + 80) {
        player.x = PVP_START_X[player.index] ?? (player.index === 0 ? PVP_START_X[0] : PVP_START_X[1]);
        player.y = CONFIG.groundY - player.h;
        player.vx = player.vy = 0;
        player.dir = player.index === 0 ? 1 : -1;
        player.grounded = true;
        player.correctCatchesThisJump = 0;
        player.oneJumpCatchEligible = false;
        player.oneJumpStartingFlyIds = null;
      }
    }

    function spawnPvpImpactEffect(type, x, y, palette = null) {
      const duration = type === "bonk" ? 0.55 : type === "footstool" ? 0.48 : type === "thud" ? 0.32 : type === "bounce" ? 0.42 : 0.36;
      const effectPalette = palette || getSelectedSkin();
      game.pvpImpactEffects.push({
        type,
        x: clamp(Number(x) || 0, 0, W),
        y: clamp(Number(y) || 0, 0, CONFIG.playBottom),
        elapsed: 0,
        duration,
        palette: effectPalette,
        paletteA: effectPalette.primaryPalette || null,
        paletteB: effectPalette.secondaryPalette || null
      });
    }

    function updatePvpImpactEffects(dt) {
      game.pvpImpactEffects.forEach((effect)=>{ effect.elapsed += dt; });
      game.pvpImpactEffects = game.pvpImpactEffects.filter((effect)=>effect.elapsed < effect.duration);
    }

    function drawPvpImpactEffects() {
      for (const effect of game.pvpImpactEffects) {
        const progress = clamp(effect.elapsed / effect.duration, 0, 1);
        const fade = 1 - progress;
        const palette = effect.palette || getSelectedSkin();
        ctx.save();
        // Normally reset to world coordinates after sprite-local transforms.
        // During a final-catch zoom, preserve the active cinematic camera.
        if (!game.pvpCriticalCatchActive) ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
        ctx.globalAlpha = fade;
        if (effect.type === "thud") {
          const cx = Math.round(effect.x);
          const cy = Math.round(effect.y);
          ctx.globalAlpha = fade * 0.75;
          ctx.fillStyle = palette.dark || "#48555a";
          ctx.fillRect(cx - Math.round(6 + progress * 13), cy - 1, Math.round(12 + progress * 26), 2);
          ctx.fillStyle = palette.light || "#d8e1e4";
          for (let i = 0; i < 6; i += 1) {
            const direction = i < 3 ? -1 : 1;
            const distance = 4 + (i % 3) * 4 + progress * 10;
            ctx.fillRect(Math.round(cx + direction * distance), Math.round(cy - 2 - (i % 2) * 2 - progress * 3), 2, 2);
          }
        } else if (effect.type === "bonk") {
          const radius = 7 + progress * 14;
          for (let i=0;i<5;i++) {
            const angle = game.visualTime * 5 + i * Math.PI * 2 / 5;
            const x = Math.round(effect.x + Math.cos(angle) * radius);
            const y = Math.round(effect.y + Math.sin(angle) * radius * 0.55);
            ctx.fillStyle = i % 2 ? COLORS.flyYellow : COLORS.white;
            ctx.fillRect(x-2,y,5,2); ctx.fillRect(x,y-2,2,5);
            ctx.fillStyle = palette.dark; ctx.fillRect(x,y,1,1);
          }
        } else if (effect.type === "footstool") {
          const cx = Math.round(effect.x);
          const cy = Math.round(effect.y + progress * 2);
          const outerColor = palette.mid || palette.light || "#9f8cff";
          const innerColor = palette.light || palette.belly || "#d9ccff";
          [0, 5, 10].forEach((offset, index) => {
            const radius = 5 + progress * 18 + offset;
            const verticalRadius = Math.max(2, radius * 0.32);
            ctx.globalAlpha = fade * (1 - index * 0.18);
            ctx.fillStyle = index === 1 ? innerColor : outerColor;
            for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx += 1) {
              const ratio = dx / Math.max(1, radius);
              const y = Math.sqrt(Math.max(0, 1 - ratio * ratio)) * verticalRadius;
              const innerY = Math.max(0, y - (index === 0 ? 2 : 1));
              ctx.fillRect(cx + dx, Math.round(cy - y), 1, Math.max(1, Math.round(y - innerY)));
              ctx.fillRect(cx + dx, Math.round(cy + innerY), 1, Math.max(1, Math.round(y - innerY)));
            }
          });
          ctx.globalAlpha = fade;
          ctx.fillStyle = COLORS.white;
          ctx.fillRect(cx - 1, cy - 8 - Math.round(progress * 3), 3, 3);
        } else {
          const ringRadius = 7 + progress * 11;
          const cx = Math.round(effect.x);
          const cy = Math.round(effect.y);
          const paletteA = effect.paletteA || palette;
          const paletteB = effect.paletteB || palette;
          const outerColor = paletteA.mid || paletteA.light || "#9f8cff";
          const innerColor = paletteB.mid || paletteB.light || paletteB.belly || "#d9ccff";
          for (const ring of [0, 4]) {
            const radius = ringRadius + ring;
            const thickness = ring === 0 ? 2 : 1;
            ctx.fillStyle = ring === 0 ? outerColor : innerColor;
            for (let dx = -radius; dx <= radius; dx += 1) {
              const ratio = dx / Math.max(1, radius);
              const outerY = Math.sqrt(Math.max(0, 1 - ratio * ratio)) * (radius * 0.56);
              const innerY = Math.max(0, outerY - thickness);
              const topY = Math.round(cy - outerY);
              const bottomY = Math.round(cy + outerY);
              const topInner = Math.round(cy - innerY);
              const bottomInner = Math.round(cy + innerY);
              ctx.fillRect(cx + dx, topY, 1, Math.max(1, topInner - topY));
              ctx.fillRect(cx + dx, bottomInner, 1, Math.max(1, bottomY - bottomInner));
            }
          }
          ctx.fillStyle = COLORS.white;
          for (let dx = -ringRadius + 2; dx <= ringRadius - 2; dx += 2) {
            const ratio = dx / Math.max(1, ringRadius - 2);
            const y = Math.sqrt(Math.max(0, 1 - ratio * ratio)) * ((ringRadius - 2) * 0.40);
            ctx.fillRect(cx + dx, Math.round(cy - y), 1, 1);
            ctx.fillRect(cx + dx, Math.round(cy + y), 1, 1);
          }
        }
        ctx.restore();
      }
    }

    function playPvpDazedSound(stunDuration = 1) {
      const strength = clamp(stunDuration / CONFIG.pvpBonkMaxStunSeconds, 0.2, 1);
      tone(155 - strength * 30, 0.10, 0.018, -25);
      tone(118 - strength * 18, 0.13, 0.015, 18, 0.08);
      tone(92, 0.16, 0.012, -10, 0.18);
    }

    function getPvpOverlapMetrics(a, b) {
      const left = Math.max(a.x, b.x);
      const right = Math.min(a.x + a.w, b.x + b.w);
      const top = Math.max(a.y, b.y);
      const bottom = Math.min(a.y + a.h, b.y + b.h);
      const overlapX = right - left;
      const overlapY = bottom - top;
      if (!(overlapX > 0 && overlapY > 0)) return null;
      return {
        left, right, top, bottom, overlapX, overlapY,
        axis: overlapX <= overlapY ? "horizontal" : "vertical"
      };
    }

    function getPvpSweptCollisionMetrics(a, b) {
      const ax0 = Number.isFinite(a.previousX) ? a.previousX : a.x;
      const ay0 = Number.isFinite(a.previousY) ? a.previousY : a.y;
      const bx0 = Number.isFinite(b.previousX) ? b.previousX : b.x;
      const by0 = Number.isFinite(b.previousY) ? b.previousY : b.y;
      const relativeX = (a.x - ax0) - (b.x - bx0);
      const relativeY = (a.y - ay0) - (b.y - by0);
      if (Math.abs(relativeX) < 1e-9 && Math.abs(relativeY) < 1e-9) return null;

      const axisTimes = (aMin, aMax, bMin, bMax, velocity) => {
        if (Math.abs(velocity) < 1e-9) {
          if (aMax <= bMin || aMin >= bMax) return { entry: Infinity, exit: -Infinity };
          return { entry: -Infinity, exit: Infinity };
        }
        const first = (bMin - aMax) / velocity;
        const second = (bMax - aMin) / velocity;
        return { entry: Math.min(first, second), exit: Math.max(first, second) };
      };

      const xTimes = axisTimes(ax0, ax0 + a.w, bx0, bx0 + b.w, relativeX);
      const yTimes = axisTimes(ay0, ay0 + a.h, by0, by0 + b.h, relativeY);
      const entryTime = Math.max(xTimes.entry, yTimes.entry);
      const exitTime = Math.min(xTimes.exit, yTimes.exit);
      if (!(entryTime <= exitTime && entryTime >= 0 && entryTime <= 1)) return null;
      return {
        swept: true,
        time: entryTime,
        axis: xTimes.entry >= yTimes.entry ? "horizontal" : "vertical",
        aPreviousX: ax0,
        aPreviousY: ay0,
        bPreviousX: bx0,
        bPreviousY: by0
      };
    }

    function placePvpPlayersAtSweptContact(a, b, sweep) {
      if (!sweep) return null;
      const t = clamp(sweep.time, 0, 1);
      a.x = lerp(sweep.aPreviousX, a.x, t);
      a.y = lerp(sweep.aPreviousY, a.y, t);
      b.x = lerp(sweep.bPreviousX, b.x, t);
      b.y = lerp(sweep.bPreviousY, b.y, t);
      if (sweep.axis === "horizontal") {
        const aWasLeft = sweep.aPreviousX + a.w / 2 <= sweep.bPreviousX + b.w / 2;
        if (aWasLeft) a.x = b.x - a.w + 0.5;
        else b.x = a.x - b.w + 0.5;
      } else {
        const aWasAbove = sweep.aPreviousY + a.h / 2 <= sweep.bPreviousY + b.h / 2;
        if (aWasAbove) a.y = b.y - a.h + 0.5;
        else b.y = a.y - b.h + 0.5;
      }
      return getPvpOverlapMetrics(a, b);
    }

    function pvpBoxesOverlap(a, b) {
      return Boolean(getPvpOverlapMetrics(a, b));
    }

    function separatePvpPlayersAlongAxis(a, b, metrics = getPvpOverlapMetrics(a, b)) {
      if (!metrics) return false;
      if (metrics.axis === "horizontal") {
        const aCenter = a.x + a.w / 2;
        const bCenter = b.x + b.w / 2;
        const aIsLeft = aCenter <= bCenter;
        const separation = metrics.overlapX + 0.5;
        const aShare = separation / 2;
        const bShare = separation - aShare;
        if (aIsLeft) {
          a.x = clamp(a.x - aShare, 0, W - a.w);
          b.x = clamp(b.x + bShare, 0, W - b.w);
        } else {
          a.x = clamp(a.x + aShare, 0, W - a.w);
          b.x = clamp(b.x - bShare, 0, W - b.w);
        }
        // If one frog was against a wall, give the other frog the remaining
        // displacement so no overlap can survive the cooldown window.
        const remaining = getPvpOverlapMetrics(a, b);
        if (remaining?.axis === "horizontal") {
          const extra = remaining.overlapX + 0.5;
          if (aIsLeft) {
            const bRoom = Math.max(0, W - b.w - b.x);
            const moveB = Math.min(extra, bRoom);
            b.x += moveB;
            a.x = clamp(a.x - (extra - moveB), 0, W - a.w);
          } else {
            const aRoom = Math.max(0, W - a.w - a.x);
            const moveA = Math.min(extra, aRoom);
            a.x += moveA;
            b.x = clamp(b.x - (extra - moveA), 0, W - b.w);
          }
        }
      } else {
        const aCenter = a.y + a.h / 2;
        const bCenter = b.y + b.h / 2;
        const upper = aCenter <= bCenter ? a : b;
        const lower = upper === a ? b : a;
        upper.y = lower.y - upper.h - 0.5;
        if (upper.y < -upper.h) {
          upper.y = -upper.h;
          lower.y = Math.min(CONFIG.playBottom - lower.h, upper.y + upper.h + 0.5);
        }
      }
      return !getPvpOverlapMetrics(a, b);
    }

    function getPvpFootstoolStunDuration(stomper) {
      const dropDistance = Math.max(0, stomper.y - stomper.highestY);
      const normalized = clamp(dropDistance / CONFIG.pvpBonkMaxDropDistance, 0, 1);
      return lerp(CONFIG.pvpBonkMinStunSeconds, CONFIG.pvpBonkMaxStunSeconds, Math.pow(normalized, 0.82));
    }

    function isMaximumPvpBonkDuration(duration) {
      const applied = clamp(Number(duration) || 0, CONFIG.pvpBonkMinStunSeconds, CONFIG.pvpBonkMaxStunSeconds);
      // Two fixed-physics ticks of tolerance prevent floating-point rounding at
      // the exact maximum drop from turning a displayed five-second stun into
      // a missed achievement.
      return applied >= CONFIG.pvpBonkMaxStunSeconds - Math.max(STEP * 2, 0.02);
    }

    function awardMaximumBonkAchievement(attackerIndex, duration, notify = true) {
      if (!Number.isInteger(attackerIndex) || !isMaximumPvpBonkDuration(duration)) return false;
      return markPvpAchievementEarned("pvp-max-bonk", attackerIndex, notify, { verifiedInteraction: true });
    }

    function bonkPvpPlayer(victim, stomper) {
      if(game.onlineMode&&!game.onlinePredicting){victim.onlineCollisionVersion=(victim.onlineCollisionVersion||0)+1;stomper.onlineCollisionVersion=(stomper.onlineCollisionVersion||0)+1;}
      const previousStunEndAt = victim.lastStunEndAt;
      const upwardSpeed = clamp(Math.max(0, -victim.vy) / CONFIG.maximumJumpY, 0, 1);
      const stunDuration = clamp(
        getPvpFootstoolStunDuration(stomper),
        CONFIG.pvpBonkMinStunSeconds,
        CONFIG.pvpBonkMaxStunSeconds
      );
      victim.bonked = true;
      victim.wasBonkedThisJump = true;
      victim.lastStunEndAt = -Infinity;
      victim.stunTimer = 0;
      victim.stunCountdownStarted = false;
      victim.bonkStunDuration = stunDuration;
      victim.bonkedByPlayerIndex = stomper.index;
      victim.pendingMaximumBonkDuration = stunDuration;
      victim.grounded = false;
      victim.charging = false;
      victim.inputHeld = false;
      victim.vx = 0;
      victim.vy = 35;
      victim.departurePlatform = null;
      victim.dropThroughPlatform = null;
      stomper.grounded = false;
      stomper.charging = false;
      stomper.vy = -lerp(CONFIG.pvpFootstoolMinBoost, CONFIG.pvpFootstoolMaxBoost, upwardSpeed);
      stomper.y = Math.min(stomper.y, victim.y - stomper.h + 2);
      stomper.airTime = Math.max(stomper.airTime, CONFIG.pvpFootstoolMinAirTime);
      stomper.bouncedOffOpponentThisJump = true;
      stomper.lastOpponentBounceType = "bonk";
      beginHighPowerJumpStreak(stomper, 1, false);
      markPvpAchievementEarned("pvp-footstool", stomper.index, true);
      if (stomper.wentAboveMapThisJump) {
        markPvpAchievementEarned("pvp-sky-bonk", stomper.index, true);
      }
      awardMaximumBonkAchievement(stomper.index, stunDuration, true);
      victim.collisionCooldown = stomper.collisionCooldown = CONFIG.pvpCollisionCooldown;
      if (stomper.quickDropThisJump) markPvpAchievementEarned("pvp-drop-bonk", stomper.index, true);
      if (stomper.bufferedDropBonkArmed) {
        markPvpAchievementEarned("pvp-buffered-drop-bonk", stomper.index, true);
        stomper.bufferedDropBonkArmed = false;
      }
      recordPvpBonk(stomper.index, victim, { previousStunEndAt });
      spawnPvpImpactEffect("footstool", victim.x + victim.w / 2, victim.y + 2, getPvpSkinPalette(stomper.skinId, stomper.index === 0 ? "azure" : "crimson", stomper.index));
      playPvpDazedSound(stunDuration);
      tone(82, 0.09, 0.030, -30);
      tone(260 + upwardSpeed * 180, 0.08, 0.020, 90, 0.035);
    }

    // The rising frog is bonked when its head reaches the underside of a frog
    // standing on a platform. Keep the platform frog anchored so this contact
    // cannot degrade into the old one-pixel sideways shove.
    function bonkPvpPlayerFromBelow(stationary, hitter) {
      if(game.onlineMode&&!game.onlinePredicting){stationary.onlineCollisionVersion=(stationary.onlineCollisionVersion||0)+1;hitter.onlineCollisionVersion=(hitter.onlineCollisionVersion||0)+1;}
      const stationaryPlatform = getPvpStandingPlatform(stationary);
      const anchoredX = stationary.x;
      const anchoredY = stationaryPlatform ? stationaryPlatform.y - stationary.h : stationary.y;

      hitter.bonked = true;
      hitter.wasBonkedThisJump = true;
      hitter.lastStunEndAt = -Infinity;
      hitter.stunTimer = 0;
      hitter.stunCountdownStarted = false;
      hitter.bonkStunDuration = CONFIG.pvpBonkMinStunSeconds;
      hitter.grounded = false;
      hitter.charging = false;
      hitter.inputHeld = false;
      hitter.vx = 0;
      hitter.vy = 28;
      hitter.departurePlatform = null;
      hitter.dropThroughPlatform = null;

      stationary.x = stationaryPlatform
        ? clamp(anchoredX, stationaryPlatform.x, stationaryPlatform.x + stationaryPlatform.w - stationary.w)
        : anchoredX;
      stationary.y = anchoredY;
      stationary.vx = 0;
      stationary.vy = 0;
      stationary.grounded = true;
      // Place the bonked frog immediately beneath the platform frog's hurtbox.
      // The collision cooldown then prevents the same overlap becoming a push.
      hitter.y = Math.max(hitter.y, stationary.y + stationary.h - 1);
      stationary.collisionCooldown = hitter.collisionCooldown = CONFIG.pvpCollisionCooldown;

      if (stationaryPlatform && !stationaryPlatform.ground) {
        game.pvpSelfBonkCounts[stationary.index] = (game.pvpSelfBonkCounts[stationary.index] || 0) + 1;
        if (game.pvpSelfBonkCounts[stationary.index] >= 3) {
          markPvpAchievementEarned("pvp-self-bonk-three", stationary.index, true);
        }
      }
      if (stationary.index === getPvpCpuIndex() && game.pvpCpuEnabled) stationary.cpuSelfBonkBonusUntil = game.pvpElapsed + 0.85;
      recordPvpBonk(stationary.index, hitter);
      spawnPvpImpactEffect(
        "bonk",
        (stationary.x + stationary.w / 2 + hitter.x + hitter.w / 2) / 2,
        stationary.y + stationary.h,
        getPvpSkinPalette(stationary.skinId, stationary.index === 0 ? "azure" : "crimson", stationary.index)
      );
      playPvpDazedSound(CONFIG.pvpBonkMinStunSeconds);
      tone(76, 0.10, 0.030, -28);
      tone(220, 0.07, 0.018, 70, 0.035);
    }

    function getPvpCollisionImpactPoint(a, b) {
      const overlapLeft = Math.max(a.x, b.x);
      const overlapRight = Math.min(a.x + a.w, b.x + b.w);
      const overlapTop = Math.max(a.y, b.y);
      const overlapBottom = Math.min(a.y + a.h, b.y + b.h);
      const hasHorizontalOverlap = overlapRight >= overlapLeft;
      const hasVerticalOverlap = overlapBottom >= overlapTop;
      const x = hasHorizontalOverlap
        ? (overlapLeft + overlapRight) / 2
        : ((a.x + a.w / 2) + (b.x + b.w / 2)) / 2;
      const y = hasVerticalOverlap
        ? (overlapTop + overlapBottom) / 2
        : ((a.y + a.h / 2) + (b.y + b.h / 2)) / 2;
      return {
        x: clamp(x, 0, W),
        y: clamp(y, 0, CONFIG.playBottom)
      };
    }

    function canPvpVerticalContactBonk(top, bottom) {
      if (!top || !bottom) return false;
      const topFalling = Number(top.vy || 0) > 12;
      const bottomJumpingIntoTop = Number(bottom.vy || 0) < -24;
      return topFalling || bottomJumpingIntoTop;
    }

    function resolvePvpOverlapByAxis(a, b, metrics = getPvpOverlapMetrics(a, b)) {
      if (!metrics) return false;
      if (metrics.axis === "horizontal") {
        bouncePvpPlayersSideways(a, b, metrics);
        return "rebound";
      }
      const aCenterY = a.y + a.h / 2;
      const bCenterY = b.y + b.h / 2;
      const top = aCenterY <= bCenterY ? a : b;
      const bottom = top === a ? b : a;
      if (!canPvpVerticalContactBonk(top, bottom)) {
        bouncePvpPlayersSideways(a, b, metrics);
        return "rebound";
      }
      bonkPvpPlayer(bottom, top);
      return "bonk";
    }

    function bouncePvpPlayersSideways(a, b, overlapMetrics = getPvpOverlapMetrics(a, b)) {
      if(game.onlineMode&&!game.onlinePredicting){a.onlineCollisionVersion=(a.onlineCollisionVersion||0)+1;b.onlineCollisionVersion=(b.onlineCollisionVersion||0)+1;}
      const impactPoint = getPvpCollisionImpactPoint(a, b);
      const aThreatFly = getPvpImminentCatchFly(a);
      const bThreatFly = getPvpImminentCatchFly(b);
      const aCenterX = a.x + a.w / 2;
      const bCenterX = b.x + b.w / 2;
      const aIsLeft = aCenterX <= bCenterX;
      separatePvpPlayersAlongAxis(a, b, overlapMetrics);

      if (!a.grounded && !b.grounded) {
        const aSpeed = Math.max(CONFIG.minimumJumpX * 0.45, Math.abs(a.vx));
        const bSpeed = Math.max(CONFIG.minimumJumpX * 0.45, Math.abs(b.vx));
        a.vx = aIsLeft ? -aSpeed : aSpeed;
        b.vx = aIsLeft ? bSpeed : -bSpeed;
        a.dir = Math.sign(a.vx) || a.dir;
        b.dir = Math.sign(b.vx) || b.dir;
        a.bouncedOffOpponentThisJump = true;
        b.bouncedOffOpponentThisJump = true;
        a.lastOpponentBounceType = "rebound";
        b.lastOpponentBounceType = "rebound";
        recordPvpBounceStat(a.index);
        markPvpAchievementEarned("pvp-footstool", a.index, true);
      } else if (a.grounded && !b.grounded) {
        b.vx = aIsLeft ? Math.abs(b.vx || CONFIG.minimumJumpX) : -Math.abs(b.vx || CONFIG.minimumJumpX);
        b.dir = Math.sign(b.vx) || b.dir;
        b.bouncedOffOpponentThisJump = true;
        b.lastOpponentBounceType = "rebound";
        recordPvpBounceStat(b.index);
        markPvpAchievementEarned("pvp-footstool", b.index, true);
      } else if (!a.grounded && b.grounded) {
        a.vx = aIsLeft ? -Math.abs(a.vx || CONFIG.minimumJumpX) : Math.abs(a.vx || CONFIG.minimumJumpX);
        a.dir = Math.sign(a.vx) || a.dir;
        a.bouncedOffOpponentThisJump = true;
        a.lastOpponentBounceType = "rebound";
        recordPvpBounceStat(a.index);
        markPvpAchievementEarned("pvp-footstool", a.index, true);
      } else {
        const reboundSpeed = CONFIG.minimumJumpX * 0.55;
        a.grounded = false;
        b.grounded = false;
        a.charging = b.charging = false;
        a.vx = aIsLeft ? -reboundSpeed : reboundSpeed;
        b.vx = aIsLeft ? reboundSpeed : -reboundSpeed;
        a.vy = b.vy = -CONFIG.pvpFootstoolMinBoost * 0.28;
        a.dir = Math.sign(a.vx) || a.dir;
        b.dir = Math.sign(b.vx) || b.dir;
        a.bouncedOffOpponentThisJump = true;
        b.bouncedOffOpponentThisJump = true;
        a.lastOpponentBounceType = "rebound";
        b.lastOpponentBounceType = "rebound";
        recordPvpBounceStat(a.index);
        recordPvpBounceStat(b.index);
      }
      a.collisionCooldown = b.collisionCooldown = CONFIG.pvpCollisionCooldown;
      if (!aThreatFly && bThreatFly) markPvpAchievementEarned("pvp-rebound-denial", a.index, true);
      if (!bThreatFly && aThreatFly) markPvpAchievementEarned("pvp-rebound-denial", b.index, true);
      const bouncePaletteA = getPvpSkinPalette(a.skinId, a.index === 0 ? "azure" : "crimson", a.index);
      const bouncePaletteB = getPvpSkinPalette(b.skinId, b.index === 0 ? "azure" : "crimson", b.index);
      const bouncePalette = {
        ...buildMixedPalette(bouncePaletteA, bouncePaletteB),
        primaryPalette: bouncePaletteA,
        secondaryPalette: bouncePaletteB
      };
      spawnPvpImpactEffect("bounce", impactPoint.x, impactPoint.y, bouncePalette);
      tone(125, 0.045, 0.017, -18);
      tone(210, 0.025, 0.010, 24, 0.02);
    }
    function bouncePvpPlayerFromDisabled(active, disabled, overlapMetrics = getPvpOverlapMetrics(active, disabled)) {
      const impactPoint = getPvpCollisionImpactPoint(active, disabled);
      const activeCenter = active.x + active.w / 2;
      const disabledCenter = disabled.x + disabled.w / 2;
      const activeIsLeft = activeCenter <= disabledCenter;
      separatePvpPlayersAlongAxis(active, disabled, overlapMetrics);
      if (!active.grounded) {
        const speed = Math.max(CONFIG.minimumJumpX * 0.45, Math.abs(active.vx || CONFIG.minimumJumpX));
        active.vx = activeIsLeft ? -speed : speed;
        active.dir = Math.sign(active.vx) || active.dir;
        active.bouncedOffOpponentThisJump = true;
        active.lastOpponentBounceType = 'rebound';
        beginHighPowerJumpStreak(active, 1, false);
        recordPvpBounceStat(active.index);
        markPvpAchievementEarned("pvp-footstool", active.index, true);
      } else {
        const speed = CONFIG.minimumJumpX * 0.55;
        active.grounded = false;
        active.charging = false;
        active.vx = activeIsLeft ? -speed : speed;
        active.vy = -CONFIG.pvpFootstoolMinBoost * 0.28;
        active.dir = Math.sign(active.vx) || active.dir;
        active.bouncedOffOpponentThisJump = true;
        active.lastOpponentBounceType = "rebound";
        recordPvpBounceStat(active.index);
      }
      active.collisionCooldown = disabled.collisionCooldown = CONFIG.pvpCollisionCooldown;
      const bouncePaletteA = getPvpSkinPalette(active.skinId, active.index === 0 ? "azure" : "crimson", active.index);
      const bouncePaletteB = getPvpSkinPalette(disabled.skinId, disabled.index === 0 ? "azure" : "crimson", disabled.index);
      const bouncePalette = {
        ...buildMixedPalette(bouncePaletteA, bouncePaletteB),
        primaryPalette: bouncePaletteA,
        secondaryPalette: bouncePaletteB
      };
      spawnPvpImpactEffect("bounce", impactPoint.x, impactPoint.y, bouncePalette);
      tone(125, 0.045, 0.017, -18);
      tone(210, 0.025, 0.010, 24, 0.02);
    }

    function footstoolDisabledPvpPlayer(stomper, disabled) {
      const impactPoint = getPvpCollisionImpactPoint(stomper, disabled);
      stomper.grounded = false;
      stomper.charging = false;
      stomper.vy = -CONFIG.pvpFootstoolMinBoost;
      stomper.y = Math.min(stomper.y, disabled.y - stomper.h + 2);
      stomper.airTime = Math.max(stomper.airTime, CONFIG.pvpFootstoolMinAirTime);
      stomper.bouncedOffOpponentThisJump = true;
      stomper.lastOpponentBounceType = "bonk";
      beginHighPowerJumpStreak(stomper, 1, false);
      markPvpAchievementEarned("pvp-footstool", stomper.index, true);
      recordPvpBonk(stomper.index, disabled);
      stomper.collisionCooldown = disabled.collisionCooldown = CONFIG.pvpCollisionCooldown;
      const bouncePalette = buildMixedPalette(
        getPvpSkinPalette(stomper.skinId, stomper.index === 0 ? "azure" : "crimson", stomper.index),
        getPvpSkinPalette(disabled.skinId, disabled.index === 0 ? "azure" : "crimson", disabled.index)
      );
      spawnPvpImpactEffect("footstool", impactPoint.x, impactPoint.y, bouncePalette);
      tone(225, 0.07, 0.018, 70);
      return true;
    }

    function resolvePvpCollision() {
      const a = pvpPlayers[0];
      const b = pvpPlayers[1];
      let overlapMetrics = getPvpOverlapMetrics(a, b);
      if (!overlapMetrics) {
        const sweptCollision = getPvpSweptCollisionMetrics(a, b);
        if (!sweptCollision) return;
        overlapMetrics = placePvpPlayersAtSweptContact(a, b, sweptCollision);
        if (!overlapMetrics) return;
      }
      // A prior collision cooldown suppresses duplicate sounds/stats, but never
      // permits the frogs to remain embedded or phase through one another.
      if (a.collisionCooldown > 0 || b.collisionCooldown > 0) {
        separatePvpPlayersAlongAxis(a, b, overlapMetrics);
        return;
      }

      const aDisabled = a.bonked || a.stunTimer > 0;
      const bDisabled = b.bonked || b.stunTimer > 0;
      if (aDisabled || bDisabled) {
        if (aDisabled && bDisabled) {
          separatePvpPlayersAlongAxis(a, b, overlapMetrics);
          return;
        }
        const disabled = aDisabled ? a : b;
        const active = aDisabled ? b : a;
        if (overlapMetrics.axis === "horizontal") {
          bouncePvpPlayerFromDisabled(active, disabled, overlapMetrics);
          return;
        }
        const aCenterY = a.y + a.h / 2;
        const bCenterY = b.y + b.h / 2;
        const top = aCenterY <= bCenterY ? a : b;
        const bottom = top === a ? b : a;
        if (top === active && bottom === disabled) {
          footstoolDisabledPvpPlayer(active, disabled);
        } else {
          bonkPvpPlayer(active, disabled);
        }
        return;
      }

      const aCenterY = a.y + a.h / 2;
      const bCenterY = b.y + b.h / 2;
      const top = aCenterY <= bCenterY ? a : b;
      const bottom = top === a ? b : a;
      const verticalSeparation = Math.abs(aCenterY - bCenterY);

      if (a.grounded !== b.grounded) {
        const grounded = a.grounded ? a : b;
        const airborne = a.grounded ? b : a;
        const airborneCenterY = airborne.y + airborne.h / 2;
        const groundedCenterY = grounded.y + grounded.h / 2;
        const previousTop = Number.isFinite(airborne.previousY)
          ? airborne.previousY
          : airborne.y - airborne.vy * STEP;
        const previousBottom = previousTop + airborne.h;
        const currentBottom = airborne.y + airborne.h;
        const currentTop = airborne.y;
        const overlapLeft = Math.max(airborne.x, grounded.x);
        const overlapRight = Math.min(airborne.x + airborne.w, grounded.x + grounded.w);
        const overlapWidth = Math.max(0, overlapRight - overlapLeft);
        const verticalGap = Math.abs(airborneCenterY - groundedCenterY);
        const topAligned = Math.abs(airborne.y - grounded.y) <= grounded.h * 0.28;
        const sideContact = overlapWidth <= Math.max(4, airborne.w * 0.45);
        const similarHeightSideHit = (verticalGap <= 9.5 || topAligned) && sideContact;
        const horizontalFootOverlap = airborne.x + airborne.w * 0.78 > grounded.x && airborne.x + airborne.w * 0.22 < grounded.x + grounded.w;
        const descendingOrSettling = airborne.vy > 12 && currentBottom >= previousBottom;
        const feetCrossedHead = previousBottom <= grounded.y + grounded.h * 0.45 + 5 && currentBottom >= grounded.y - 5;
        const clearlyAbove = airborne.y + airborne.h * 0.72 <= grounded.y + grounded.h * 0.66;
        const airborneAbove = airborneCenterY < groundedCenterY - 1;
        const bonkFromAbove = horizontalFootOverlap && descendingOrSettling && (feetCrossedHead || clearlyAbove || airborneAbove);

        // Platform underbonks are top-edge versus bottom-edge contacts. Detect
        // the rising frog's head entering the lower hurtbox before side-rebound
        // or overlap-separation code gets a chance to nudge the platform frog.
        const groundedPlatform = getPvpStandingPlatform(grounded);
        const visiblyPlatformSupported = grounded.grounded && grounded.y + grounded.h < CONFIG.groundY - 1;
        const standingOnPlatform = Boolean((groundedPlatform && !groundedPlatform.ground) || visiblyPlatformSupported);
        const groundedBottom = grounded.y + grounded.h;
        const meaningfulUnderlap = overlapWidth >= Math.max(3, Math.min(airborne.w, grounded.w) * 0.16);
        const risingFromBelow =
          airborne.vy <= 14 &&
          (airborneCenterY >= groundedCenterY + 0.25 || previousTop >= groundedBottom - 4);
        const topCrossedUnderbelly = previousTop >= groundedBottom - 4 && currentTop <= groundedBottom + 4;
        const alreadyInsideLowerHurtbox =
          airborne.vy < 0 &&
          currentTop <= groundedBottom &&
          currentTop >= grounded.y + grounded.h * 0.16;
        const platformUnderbonk =
          standingOnPlatform &&
          meaningfulUnderlap &&
          risingFromBelow &&
          (topCrossedUnderbelly || alreadyInsideLowerHurtbox);

        if (platformUnderbonk) {
          bonkPvpPlayerFromBelow(grounded, airborne);
          return;
        }
        if (bonkFromAbove) {
          bonkPvpPlayer(grounded, airborne);
          return;
        }
        if (similarHeightSideHit) {
          bouncePvpPlayersSideways(grounded, airborne);
          return;
        }
        resolvePvpOverlapByAxis(a, b, overlapMetrics);
        return;
      }

      if (!a.grounded && !b.grounded) {
        const reboundVerticalTolerance = Math.max(9.5, Math.min(a.h, b.h) * 0.68);
        if (verticalSeparation <= reboundVerticalTolerance) {
          bouncePvpPlayersSideways(a, b);
          return;
        }
        const topFeetNearHead = top.y + top.h >= bottom.y - 4;
        if (topFeetNearHead && canPvpVerticalContactBonk(top, bottom)) {
          bonkPvpPlayer(bottom, top);
          return;
        }
        bouncePvpPlayersSideways(a, b, overlapMetrics);
        return;
      }

      if (a.grounded && b.grounded) {
        bouncePvpPlayersSideways(a, b, overlapMetrics);
        return;
      }

      resolvePvpOverlapByAxis(a, b, overlapMetrics);
    }

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
      ctx.globalAlpha = holdFade;
      ctx.fillStyle = "rgba(38,54,61,0.78)";
      ctx.fillRect(W / 2 - 74, 29, 148, 18);
      drawBitmapText("FINAL CATCH!", W / 2, 34, 1.08, "center", COLORS.white, COLORS.ink);
      ctx.restore();
    }

    function startPvpCriticalCatch(player, targetFly) {
      if (!player || game.pvpCriticalCatchActive || game.mode !== "pvp" || game.pvpCriticalCatchPlayedThisRound) return false;
      const criticalKey=`${game.pvpRoundNumber}:${game.pvpSuddenDeath?'sd':'normal'}:final`;
      if(!OnlineVersus.canStartCritical(criticalKey))return false;
      game.pvpCriticalCatchEventId=criticalKey;game.pvpCriticalCatchPlayedThisRound=true;
      game.pvpCriticalCatchActive = true;
      game.pvpCriticalCatchElapsed = 0;
      game.pvpCriticalCatchWinnerIndex = player.index;
      game.pvpCriticalCatchX = clamp(Number(targetFly?.baseX ?? targetFly?.x ?? (player.x + player.w / 2)), 24, W - 24);
      game.pvpCriticalCatchY = clamp(Number(targetFly?.baseY ?? targetFly?.y ?? (player.y + player.h / 2)), 28, CONFIG.playBottom - 24);
      game.pvpCriticalCatchCameraX = W / 2;
      game.pvpCriticalCatchCameraY = CONFIG.playBottom / 2;
      game.pvpCriticalCatchCameraZoom = 1;
      tone(92, 0.22, 0.032, -12);
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
      ctx.globalAlpha = holdFade;
      ctx.fillStyle = "rgba(38,54,61,0.78)";
      ctx.fillRect(W / 2 - 74, 29, 148, 18);
      drawBitmapText("FINAL CATCH!", W / 2, 34, 1.08, "center", COLORS.white, COLORS.ink);
      ctx.restore();
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
      if (reachedTarget || buzzerWinningCatch) startPvpCriticalCatch(player, targetFly);
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
      if (!player || !targetFly || game.mode !== "pvp" || game.pvpCriticalCatchActive) return false;
      if (!flyMatchesPrompt(targetFly)) return false;
      const otherPlayer = pvpPlayers[player.index === 0 ? 1 : 0];
      const target = getPvpTargetScore();
      const timedRoundInProgress = game.pvpTimeLimitSeconds > 0 && !game.pvpSuddenDeath;
      const reachedTarget = game.pvpSuddenDeath
        ? Number((game.pvpSuddenDeathScores[player.index] || 0) + 1) >= target
        : (!isPvpEndlessMode() && Number(player.score || 0) + 1 >= target);
      const buzzerWinningCatch = Boolean(
        game.pvpTimerGraceActive &&
        Number(player.score || 0) <= Number(otherPlayer?.score || 0) &&
        Number(player.score || 0) + 1 > Number(otherPlayer?.score || 0)
      );
      return reachedTarget || buzzerWinningCatch;
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
      if (shouldStartPvpCriticalCatch(player, targetFly)) startPvpCriticalCatch(player, targetFly);
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
        dueAt: game.elapsed + (index === 0 ? 0 : index * 1.05 + STEP),
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

    function getPvpCpuChargedPathThreat(cpu, opponent) {
      if (!cpu || !opponent || !opponent.grounded || !opponent.charging || opponent.bonked || opponent.stunTimer > 0) return 0;
      const power = clamp(opponent.charge, 0.04, 1);
      let x = opponent.x;
      let y = opponent.y;
      let vx = opponent.dir * lerp(CONFIG.minimumJumpX, CONFIG.maximumJumpX, power);
      let vy = -lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, power);
      let threat = 0;
      for (let t = 0.04; t <= 1.35; t += 0.04) {
        vy += CONFIG.gravity * 0.04;
        x += vx * 0.04;
        y += vy * 0.04;
        if (x <= 0) { x = 0; vx = Math.abs(vx); }
        else if (x + opponent.w >= W) { x = W - opponent.w; vx = -Math.abs(vx); }
        const overlap = x + opponent.w * 0.80 > cpu.x && x + opponent.w * 0.20 < cpu.x + cpu.w;
        const feet = y + opponent.h;
        const aboveHead = feet <= cpu.y + 8 && cpu.y - feet <= 84;
        if (overlap && aboveHead && vy > -30) {
          const proximity = 1 - clamp((cpu.y - feet) / 84, 0, 1);
          threat = Math.max(threat, 0.48 + proximity * 0.52);
        }
      }
      return clamp(threat, 0, 1);
    }

    function getPvpCpuBonkThreat(cpu, opponent) {
      if (!cpu || !opponent || opponent.bonked || opponent.stunTimer > 0) return 0;
      const cpuCenter = cpu.x + cpu.w / 2;
      const opponentCenter = opponent.x + opponent.w / 2;
      const horizontalDistance = Math.abs(opponentCenter - cpuCenter);
      const opponentBottom = opponent.y + opponent.h;
      const verticalGap = cpu.y - opponentBottom;
      const standingPlatform = opponent.grounded ? getPvpStandingPlatform(opponent) : null;
      const directlyAbovePlatform = Boolean(
        standingPlatform && !standingPlatform.ground &&
        verticalGap >= -5 && verticalGap <= 92 &&
        horizontalDistance <= Math.max(34, standingPlatform.w * 0.42)
      );
      const fallingAbove = Boolean(
        !opponent.grounded && opponent.vy > -20 &&
        verticalGap >= -8 && verticalGap <= 74 &&
        horizontalDistance <= 38 + Math.abs(opponent.vx) * 0.10
      );
      const chargedPathThreat = getPvpCpuChargedPathThreat(cpu, opponent);
      if (!directlyAbovePlatform && !fallingAbove) return chargedPathThreat;
      const verticalUrgency = 1 - clamp((verticalGap + 8) / 100, 0, 1);
      const horizontalUrgency = 1 - clamp(horizontalDistance / 58, 0, 1);
      return Math.max(chargedPathThreat, clamp(0.35 + verticalUrgency * 0.42 + horizontalUrgency * 0.38, 0, 1));
    }

    function getPvpCpuRebonkOpportunity(cpu, opponent) {
      if (!cpu || !opponent || opponent.bonked) return 0;
      const leavingStun = opponent.stunTimer > 0 && opponent.stunTimer <= 1.15;
      const justRecovered = opponent.stunTimer <= 0 && Number.isFinite(opponent.lastStunEndAt) && game.pvpElapsed - opponent.lastStunEndAt <= 0.75;
      if (!leavingStun && !justRecovered) return 0;
      const direction = cpu.dir >= 0 ? 1 : -1;
      const forwardDistance = (opponent.x + opponent.w / 2 - (cpu.x + cpu.w / 2)) * direction;
      if (forwardDistance < -10 || forwardDistance > 230) return 0;
      const distanceScore = 1 - clamp(Math.abs(forwardDistance - 76) / 170, 0, 1);
      const urgency = leavingStun ? 1 - clamp(opponent.stunTimer / 1.15, 0, 1) : 1;
      return clamp(0.52 + distanceScore * 0.34 + urgency * 0.28, 0, 1);
    }

    function getPvpCpuBonkOpportunity(cpu, opponent) {
      if (!cpu || !opponent || opponent.bonked) return 0;
      const rebonkOpportunity = getPvpCpuRebonkOpportunity(cpu, opponent);
      if (opponent.stunTimer > 1.15) return rebonkOpportunity;
      const direction = cpu.dir >= 0 ? 1 : -1;
      const forwardDistance = (opponent.x + opponent.w / 2 - (cpu.x + cpu.w / 2)) * direction;
      const verticalDifference = cpu.y - opponent.y;
      if (forwardDistance < -8 || forwardDistance > 210) return 0;
      const opponentStable = opponent.grounded || Math.abs(opponent.vy) < 85;
      if (!opponentStable) return 0.15;
      const distanceScore = 1 - clamp(Math.abs(forwardDistance - 82) / 150, 0, 1);
      const heightScore = 1 - clamp(Math.abs(verticalDifference) / 110, 0, 1);
      return Math.max(rebonkOpportunity, clamp(distanceScore * 0.68 + heightScore * 0.32, 0, 1));
    }

    function simulatePvpCpuJump(cpu, targetFly, opponent, direction, power, skill) {
      const step = 0.025;
      const maxTime = 1.85;
      let x = cpu.x;
      let y = cpu.y;
      let simDirection = direction >= 0 ? 1 : -1;
      let vx = simDirection * lerp(CONFIG.minimumJumpX, CONFIG.maximumJumpX, power);
      let vy = -lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, power);
      let previousBottom = y + cpu.h;
      let minFlyDistance = Infinity;
      let catchReward = 0;
      let bonkReward = 0;
      let predictedBonkTime = null;
      let bonkRiskPenalty = 0;
      let platformReward = 0;
      let reboundReward = 0;
      let predictedRebound = false;
      let wallPenalty = 0;
      let landedPlatform = null;
      let landedPlatformY = null;
      let elapsed = 0;
      const correctX = Number(targetFly?.baseX);
      const correctY = Number(targetFly?.baseY);
      const hasFly = Number.isFinite(correctX) && Number.isFinite(correctY);

      for (elapsed = step; elapsed <= maxTime; elapsed += step) {
        vy += CONFIG.gravity * step;
        x += vx * step;
        y += vy * step;
        if (x <= 0) {
          x = 0;
          vx = Math.abs(vx);
          simDirection = 1;
          wallPenalty += 18;
        } else if (x + cpu.w >= W) {
          x = W - cpu.w;
          vx = -Math.abs(vx);
          simDirection = -1;
          wallPenalty += 18;
        }

        const mouthX = simDirection > 0 ? x + cpu.w - 2 : x + 2;
        const mouthY = y + 5;
        if (hasFly) {
          const flyDx = correctX - mouthX;
          const flyDy = correctY - mouthY;
          const distance = Math.abs(flyDx) + Math.abs(flyDy) * 1.15;
          minFlyDistance = Math.min(minFlyDistance, distance);
          const inFront = flyDx * simDirection >= -3;
          if (inFront && Math.abs(flyDx) <= CONFIG.tongueReach && Math.abs(flyDy) <= CONFIG.tongueVerticalTolerance) {
            catchReward = Math.max(catchReward, 1280 - elapsed * 110 - distance * 4);
          } else if (Math.abs(flyDx) <= 8 && Math.abs(flyDy) <= 9) {
            catchReward = Math.max(catchReward, 900 - elapsed * 95 - distance * 3);
          }
        }

        if (opponent && elapsed >= CONFIG.pvpMinFootstoolAirTime) {
          const opponentX = clamp(opponent.x + (opponent.grounded ? 0 : opponent.vx * elapsed), 0, W - opponent.w);
          const opponentY = opponent.grounded
            ? opponent.y
            : opponent.y + opponent.vy * elapsed + 0.5 * CONFIG.gravity * elapsed * elapsed;
          const opponentVy = opponent.grounded ? 0 : opponent.vy + CONFIG.gravity * elapsed;
          const overlap = x + cpu.w * 0.78 > opponentX && x + cpu.w * 0.22 < opponentX + opponent.w;
          const aboveHead = y + cpu.h >= opponentY - 5 && y + cpu.h <= opponentY + opponent.h * 0.55;
          if (overlap && aboveHead && vy > 45) {
            const dropHeight = Math.max(0, cpu.jumpStartY - y);
            bonkReward = Math.max(bonkReward, 260 + skill * 620 + dropHeight * 1.4);
            if (!Number.isFinite(predictedBonkTime)) predictedBonkTime = elapsed;
          }

          const opponentBottom = opponentY + opponent.h;
          const cpuHead = y;
          const opponentAboveCpu = opponentBottom <= cpuHead + 8 && cpuHead - opponentBottom <= 72;
          if (overlap && opponentAboveCpu && opponentVy > 15) {
            const proximity = 1 - clamp((cpuHead - opponentBottom) / 72, 0, 1);
            bonkRiskPenalty = Math.max(bonkRiskPenalty, 420 + skill * 620 + proximity * 420);
          }

          // A side collision is a legal way for the CPU to reverse direction.
          // Simulating the rebound lets it intentionally intercept a fly behind it
          // or block the opponent rather than waiting for a wall.
          const centerSeparation = Math.abs((y + cpu.h / 2) - (opponentY + opponent.h / 2));
          const sideCollision = overlap && !aboveHead && centerSeparation < 8 && Math.abs(vx) > 30;
          if (sideCollision && !predictedRebound) {
            predictedRebound = true;
            vx = -vx;
            simDirection *= -1;
            x = clamp(x + simDirection * 3, 0, W - cpu.w);
            const targetWasBehind = hasFly && (correctX - (cpu.x + cpu.w / 2)) * direction < -8;
            const opponentBlocksFly = hasFly && Math.abs(opponentX - correctX) < Math.abs(x - correctX);
            reboundReward = 280 + skill * 360 + (targetWasBehind ? 900 : 0) + (opponentBlocksFly ? 260 : 0);
          }
        }

        const bottom = y + cpu.h;
        if (vy >= 0) {
          let landed = false;
          for (const platform of platforms) {
            if (!platform || platform.ground) continue;
            const predictedPlatform = getPredictedPvpPlatformRect(platform, elapsed);
            if (previousBottom > predictedPlatform.y + 2 || bottom < predictedPlatform.y) continue;
            if (x + cpu.w <= predictedPlatform.x || x >= predictedPlatform.x + predictedPlatform.w) continue;
            const targetHeightFit = hasFly ? Math.max(0, 150 - Math.abs(correctY - predictedPlatform.y)) * 0.22 : 0;
            const movementBonus = platform.moving ? 120 + skill * 110 : 0;
            platformReward = Math.max(platformReward, 32 + targetHeightFit + movementBonus);
            y = predictedPlatform.y - cpu.h;
            landedPlatform = platform;
            landedPlatformY = predictedPlatform.y;
            landed = true;
            break;
          }
          if (landed || bottom >= CONFIG.groundY) break;
        }
        previousBottom = bottom;
      }

      const approachReward = Number.isFinite(minFlyDistance) ? 520 / (1 + minFlyDistance * 0.08) : 0;
      const heightFitReward = hasFly ? Math.max(0, 100 - Math.abs((cpu.y - correctY) - power * 160) * 0.45) : 0;
      const chargeReward = 35 + power * 45; // Reward purposeful charge instead of random tapping.
      const noise = (Math.random() - 0.5) * lerp(240, 8, skill);
      return {
        direction,
        power,
        score: catchReward + approachReward + heightFitReward + chargeReward + bonkReward + platformReward + reboundReward - wallPenalty - bonkRiskPenalty + noise,
        targetFlyId: targetFly?.id ?? null,
        predictedCatch: catchReward > 0,
        predictedBonk: bonkReward > 0,
        predictedBonkTime,
        predictedRebound,
        predictedBonkRisk: bonkRiskPenalty > 0,
        landedPlatform,
        landedPlatformY,
        landedOnMovingPlatform: Boolean(landedPlatform?.moving),
        landedOnVerticalLift: Boolean(landedPlatform?.moving && landedPlatform.movementAxis === "y")
      };
    }

    function choosePvpCpuPlan(cpu) {
      const skill = clamp((game.pvpCpuDifficulty || 1) / 9, 1 / 9, 1);
      const opponent = pvpPlayers[1-getPvpCpuIndex()];
      const matchingFlies = flies.filter((fly) => fly && fly.state === "active" && flyMatchesPrompt(fly));
      const onScreenMatchingFlies = matchingFlies.filter((fly) => fly.baseX >= -8 && fly.baseX <= W + 8 && fly.baseY >= -8 && fly.baseY <= CONFIG.playBottom + 8);
      const centerX = cpu.x + cpu.w / 2;
      onScreenMatchingFlies.sort((a, b) => {
        const aDistance = Math.abs(a.baseX - centerX) + Math.abs(a.baseY - cpu.y) * 0.68;
        const bDistance = Math.abs(b.baseX - centerX) + Math.abs(b.baseY - cpu.y) * 0.68;
        return aDistance - bDistance;
      });
      const targetCount = skill < 0.35 ? 1 : skill < 0.72 ? Math.min(2, onScreenMatchingFlies.length) : Math.min(3, onScreenMatchingFlies.length);
      const candidates = onScreenMatchingFlies.slice(0, targetCount);
      const basePowerSets = skill < 0.25
        ? [0.30, 0.54, 0.82]
        : skill < 0.55
          ? [0.24, 0.38, 0.52, 0.66, 0.80, 0.94]
          : [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.0];
      let best = null;
      const lockedDirection = cpu.dir >= 0 ? 1 : -1;
      const overheadThreat = getPvpCpuBonkThreat(cpu, opponent);
      const bonkOpportunity = getPvpCpuBonkOpportunity(cpu, opponent);
      const rebonkOpportunity = getPvpCpuRebonkOpportunity(cpu, opponent);
      const selfBonkTrapOpportunity = getPvpCpuSelfBonkTrapOpportunity(cpu, opponent, onScreenMatchingFlies.length);

      if (selfBonkTrapOpportunity > 0.58 && game.pvpElapsed >= (Number(cpu.cpuTrapBailUntil) || -Infinity)) {
        return {
          direction: lockedDirection,
          power: 0.04,
          score: 12000 + selfBonkTrapOpportunity * 1400,
          targetFlyId: null,
          predictedCatch: false,
          predictedBonk: false,
          predictedRebound: false,
          predictedBonkRisk: false,
          waitForSelfBonk: true,
          reactionDelay: 0.04,
          releaseTolerance: 0.03
        };
      }

      // A re-bonk is only useful after the previous stun has actually ended.
      // Estimate charge time plus flight time, then delay the button press so
      // the CPU's feet arrive just after the recovery frame instead of landing
      // harmlessly on an opponent who is still stunned.
      const stunRemaining = Math.max(0, Number(opponent?.stunTimer) || 0);
      const justRecovered = Boolean(
        opponent && stunRemaining <= 0 && Number.isFinite(opponent.lastStunEndAt) &&
        game.pvpElapsed - opponent.lastStunEndAt <= 0.75
      );
      if (opponent && rebonkOpportunity > 0.12 && (stunRemaining > 0 || justRecovered)) {
        const rebonkPowers = skill < 0.45
          ? [0.38, 0.56, 0.74, 0.92]
          : [0.26, 0.34, 0.42, 0.50, 0.58, 0.66, 0.74, 0.82, 0.90, 1.0];
        for (const power of rebonkPowers) {
          const plan = simulatePvpCpuJump(cpu, null, opponent, lockedDirection, power, skill);
          if (!plan.predictedBonk || !Number.isFinite(plan.predictedBonkTime)) continue;
          const chargeTime = Math.max(0, power - 0.04) * CONFIG.chargeSecondsOneWay;
          const naturalContactTime = chargeTime + plan.predictedBonkTime;
          const desiredContactTime = stunRemaining > 0 ? stunRemaining + 0.045 : 0.055;
          const launchDelay = Math.max(0, desiredContactTime - naturalContactTime);
          const finalContactTime = naturalContactTime + launchDelay;
          const timingError = Math.abs(finalContactTime - desiredContactTime);
          plan.rebonkPlan = true;
          plan.rebonkLaunchDelay = launchDelay;
          plan.score += 5200 + skill * 1850 + rebonkOpportunity * 1100 - timingError * 2400;
          if (finalContactTime < stunRemaining + 0.025) plan.score -= 6500;
          if (!best || plan.score > best.score) best = plan;
        }
      }

      // Garden's upper fly row cannot be reached reliably from the ground.
      // If a high target is active, first route the CPU onto a side elevator,
      // then wait until that lift has carried it high enough to make the catch.
      const highGardenTarget = game.selectedLevelId === "garden"
        ? candidates.find((fly) => Number(fly.baseY) <= 100) || null
        : null;
      const cpuStandingPlatform = getPvpStandingPlatform(cpu);
      const cpuOnGardenLift = Boolean(
        highGardenTarget &&
        cpuStandingPlatform?.moving &&
        cpuStandingPlatform.movementAxis === "y"
      );

      if (cpuOnGardenLift) {
        const currentLift = getPredictedPvpPlatformRect(cpuStandingPlatform, 0.12);
        if (currentLift.y > 126) {
          return {
            direction: lockedDirection,
            power: 0.04,
            score: 9000,
            targetFlyId: highGardenTarget.id,
            predictedCatch: false,
            predictedBonk: false,
            predictedRebound: false,
            predictedBonkRisk: false,
            waitOnElevator: true,
            reactionDelay: 0.08,
            releaseTolerance: 0.03
          };
        }
      } else if (highGardenTarget) {
        const elevators = platforms.filter((platform) => platform?.moving && platform.movementAxis === "y");
        const elevatorPowers = skill < 0.45
          ? [0.32, 0.48, 0.64, 0.80]
          : [0.24, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84, 0.94];
        elevators.forEach((elevator, elevatorIndex) => {
          const predictedLift = getPredictedPvpPlatformRect(elevator, 0.72);
          const waypoint = {
            id: highGardenTarget.id,
            baseX: predictedLift.x + predictedLift.w / 2,
            baseY: predictedLift.y - 8
          };
          elevatorPowers.forEach((power) => {
            const plan = simulatePvpCpuJump(cpu, waypoint, opponent, lockedDirection, power, skill);
            plan.targetFlyId = highGardenTarget.id;
            plan.elevatorPlan = true;
            const liftCenter = predictedLift.x + predictedLift.w / 2;
            const forwardLift = (liftCenter - centerX) * lockedDirection >= -6;
            if (plan.landedOnVerticalLift) {
              plan.score += 2600 + skill * 1600 + (forwardLift ? 340 : 0) - elevatorIndex * 3;
            } else {
              plan.score -= 1100;
            }
            if (!best || plan.score > best.score) best = plan;
          });
        });
      }

      // When an opponent is poised above the CPU, test compact evasive hops
      // before ordinary fly routes. These hops move the CPU out from under the
      // threat without requiring it to turn around.
      if (overheadThreat > 0.12) {
        const defensiveTarget = candidates[0] || null;
        for (const power of [0.18, 0.22, 0.27, 0.33, 0.39]) {
          const plan = simulatePvpCpuJump(cpu, defensiveTarget, opponent, lockedDirection, power, skill);
          plan.defensiveHop = true;
          plan.score += overheadThreat * (1450 - power * 620);
          if (plan.predictedBonkRisk) plan.score -= 900;
          if (!best || plan.score > best.score) best = plan;
        }
      }

      // Evaluate deliberate footstool routes even when the best vocabulary fly
      // is elsewhere. A skilled CPU takes the bonk when the opponent is exposed.
      if (bonkOpportunity > 0.12 && (!opponent || opponent.stunTimer <= 0)) {
        const bonkPowers = skill < 0.45 ? [0.42, 0.62, 0.82] : [0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.0];
        for (const power of bonkPowers) {
          const plan = simulatePvpCpuJump(cpu, null, opponent, lockedDirection, power, skill);
          plan.bonkPlan = true;
          if (plan.predictedBonk) plan.score += 1250 + skill * 1150 + bonkOpportunity * 650 + rebonkOpportunity * 1550;
          else plan.score -= 420 + skill * 280;
          if (plan.predictedBonkRisk) plan.score -= 750;
          if (!best || plan.score > best.score) best = plan;
        }
      }

      const targetBehind = candidates.find((target) => (target.baseX - centerX) * lockedDirection < -8) || null;
      const playerFacingBehindTarget = Boolean(
        targetBehind && opponent &&
        (targetBehind.baseX - (opponent.x + opponent.w / 2)) * opponent.dir > 0
      );
      const needsRebound = Boolean(targetBehind) || (!candidates.length && opponent && !opponent.bonked && opponent.stunTimer <= 0);
      if (needsRebound && opponent) {
        const reboundPowers = skill < 0.45 ? [0.40, 0.62, 0.84] : [0.28,0.38,0.48,0.58,0.68,0.78,0.88,0.98];
        for (const power of reboundPowers) {
          const plan = simulatePvpCpuJump(cpu, targetBehind, opponent, lockedDirection, power, skill);
          plan.reboundPlan = true;
          plan.interceptPlayerForTurnaround = playerFacingBehindTarget;
          if (plan.predictedRebound) {
            plan.score += 1150 + skill * 1200 + (playerFacingBehindTarget ? 2600 + skill * 1400 : 0);
          } else {
            plan.score -= playerFacingBehindTarget ? 1250 : 520;
          }
          if (plan.predictedBonkRisk) plan.score -= 850;
          if (!best || plan.score > best.score) best = plan;
        }
      }

      for (const target of candidates) {
        const centerY = cpu.y + cpu.h / 2;
        const forwardDistance = (target.baseX - centerX) * lockedDirection;
        const verticalRise = Math.max(0, centerY - target.baseY);
        const estimatedHorizontalPower = clamp(Math.sqrt(Math.max(0, Math.abs(forwardDistance) - CONFIG.tongueReach * 0.45) / 255), 0.20, 1);
        const estimatedVerticalPower = clamp((verticalRise + 18) / 190, 0.22, 1);
        const estimatedPower = clamp(Math.max(estimatedHorizontalPower, estimatedVerticalPower), 0.22, 1);
        const adaptivePowers = skill >= 0.55
          ? [estimatedPower - 0.18, estimatedPower - 0.10, estimatedPower - 0.04, estimatedPower, estimatedPower + 0.05, estimatedPower + 0.12, estimatedPower + 0.20]
          : [];
        const powerSets = [...new Set([...basePowerSets, ...adaptivePowers]
          .map((value) => Math.round(clamp(value, 0.18, 1) * 100) / 100))];
        for (const power of powerSets) {
          const plan = simulatePvpCpuJump(cpu, target, opponent, lockedDirection, power, skill);
          const secondFlyBonus = onScreenMatchingFlies.some((other) => other.id !== target.id && Math.abs(other.baseX - target.baseX) <= 62 && Math.abs(other.baseY - target.baseY) <= 46) ? 165 + skill * 180 : 0;
          // Skilled CPUs strongly prefer a real catch trajectory over repeated tiny hops.
          if (plan.predictedBonk) plan.score += 420 + skill * 680 + bonkOpportunity * 280;
          if (plan.predictedCatch) plan.score += 420 + skill * 520 + secondFlyBonus;
          else plan.score -= skill * 520;
          plan.score -= Math.abs(power - estimatedPower) * lerp(20, 150, skill);
          if (power < estimatedPower * 0.72) plan.score -= lerp(35, 380, skill);
          if (!best || plan.score > best.score) best = plan;
        }
      }
      if (!best) {
        best = simulatePvpCpuJump(cpu, null, opponent, lockedDirection, skill < 0.45 ? 0.38 : 0.52, skill);
        best.score += 30;
      }
      const reaction = lerp(0.42, 0.035, skill);
      best.releaseTolerance = lerp(0.12, 0.025, skill);
      best.reactionDelay = best.rebonkPlan
        ? Math.max(0, Number(best.rebonkLaunchDelay) || 0)
        : reaction * (0.7 + Math.random() * 0.6);
      return best;
    }

    function shouldCpuUseHighGroundShortHop(cpu, opponent) {
      if (!cpu || !opponent || (game.pvpCpuDifficulty || 1) < 5 || !cpu.grounded || cpu.charging || cpu.bonked || cpu.stunTimer > 0) return false;
      const cpuPlatform = getPvpStandingPlatform(cpu);
      if (!cpuPlatform || cpuPlatform.ground) return false;
      if (!opponent.grounded || opponent.bonked || opponent.stunTimer > 0) return false;
      const horizontalDistance = Math.abs((opponent.x + opponent.w / 2) - (cpu.x + cpu.w / 2));
      const verticalGap = opponent.y - cpu.y;
      return verticalGap >= 10 && verticalGap <= 135 && horizontalDistance <= Math.max(18, cpuPlatform.w * 0.22);
    }

    function getCpuHighGroundShortHopPlan(cpu, opponent) {
      const cpuCenter = cpu.x + cpu.w / 2;
      const opponentCenter = opponent.x + opponent.w / 2;
      let direction = cpuCenter <= opponentCenter ? -1 : 1;
      if (cpu.x < 42) direction = 1;
      if (cpu.x + cpu.w > W - 42) direction = -1;
      const skill = clamp((game.pvpCpuDifficulty || 1) / 9, 1 / 9, 1);
      return { direction, power: lerp(0.24, 0.38, skill), releaseTolerance: 0.045, reactionDelay: 0, defensiveHop: true };
    }

    function updatePvpCpuInput(dt) {
      if (!game.pvpCpuEnabled || game.mode !== "pvp" || game.state !== "playing" || game.pvpTimerGraceActive || game.pvpTimedOutcomePending) return;
      const cpu = pvpPlayers[getPvpCpuIndex()];
      if (!cpu) return;
      game.pvpCpuEvasionCooldownFrames = Math.max(0, (game.pvpCpuEvasionCooldownFrames || 0) - 1);
      if (cpu.bonked || cpu.stunTimer > 0 || game.pvpWinPendingIndex !== null) {
        cpu.cpuHoldChargeTrap = false;
        cpu.inputHeld = false;
        cpu.charging = false;
        game.pvpCpuPlan = null;
        return;
      }

      game.pvpCpuDecisionTimer = Math.max(0, (game.pvpCpuDecisionTimer || 0) - dt);
      if (cpu.charging) {
        cpu.dir = cpu.chargeFacingDir >= 0 ? 1 : -1;
      }
      if (!cpu.grounded) return;

      const opponent = pvpPlayers[1-getPvpCpuIndex()];
      if (Number(cpu.cpuSelfBonkBonusUntil) > game.pvpElapsed) {
        const chaseDirection = opponent && (opponent.x + opponent.w / 2) >= (cpu.x + cpu.w / 2) ? 1 : -1;
        const actualDirection=cpu.dir>=0?1:-1;
        game.pvpCpuPlan = { direction: actualDirection, power: clamp(0.34 + (game.pvpCpuDifficulty || 1) * 0.02, 0.34, 0.52), releaseTolerance: 0.04, reactionDelay: 0 };
        pressPvpButton(cpu.index, "cpu");
        cpu.cpuSelfBonkBonusUntil = -Infinity;
        return;
      }
      if (shouldCpuUseHighGroundShortHop(cpu, opponent)) {
        const shortHopPlan = getCpuHighGroundShortHopPlan(cpu, opponent);
        shortHopPlan.direction=cpu.dir>=0?1:-1;
        game.pvpCpuPlan = shortHopPlan;
        pressPvpButton(cpu.index, "cpu");
        return;
      }
      const matchingFlyCount = flies.filter((fly) => fly && fly.state === "active" && flyMatchesPrompt(fly)).length;
      const selfBonkTrapOpportunity = getPvpCpuSelfBonkTrapOpportunity(cpu, opponent, matchingFlyCount);
      const trapCooldownActive = game.pvpElapsed < (Number(cpu.cpuTrapBailUntil) || -Infinity);
      const trapStillActive = !trapCooldownActive && (selfBonkTrapOpportunity > 0.58 || (
        cpu.cpuHoldChargeTrap && isPvpCpuHighGroundTrapStillActive(cpu, opponent)
      ));
      if (trapStillActive) {
        const playerClearlyIdle = Boolean(
          opponent && opponent.grounded && !opponent.charging && !opponent.inputHeld &&
          Math.abs(opponent.vx || 0) < 1 && game.pvpElapsed - (Number(opponent.lastHumanInputAt) || -Infinity) > 0.75
        );
        const cpuBehind = Number(cpu.score || 0) < Number(opponent?.score || 0);
        cpu.cpuTrapIdleTime = playerClearlyIdle ? (Number(cpu.cpuTrapIdleTime) || 0) + dt : 0;
        const idleLimit = cpuBehind ? 2.4 : 3.6;
        if (cpu.cpuTrapIdleTime >= idleLimit) {
          cpu.cpuTrapIdleTime = 0;
          cpu.cpuTrapBailUntil = game.pvpElapsed + 2.25;
          cpu.cpuHoldChargeTrap = false;
          game.pvpCpuPlan = null;
          game.pvpCpuDecisionTimer = 0.03;
          // Release the held meter into a real route rather than cancelling it,
          // so the CPU immediately abandons the camping position.
          if (cpu.charging) releasePvpButton(cpu.index, "cpu");
          else cpu.inputHeld = false;
          return;
        }
        const shouldChargeTrap = Boolean(
          cpu.charging || cpu.cpuHoldChargeTrap ||
          matchingFlyCount <= 0 || cpu.score >= opponent.score || selfBonkTrapOpportunity > 0.78
        );
        game.pvpCpuPlan = { waitForSelfBonk: true, holdChargeTrap: shouldChargeTrap, power: 1, releaseTolerance: 0.01 };
        game.pvpCpuDecisionTimer = 0.08;
        if (shouldChargeTrap) {
          cpu.cpuHoldChargeTrap = true;
          if (!cpu.charging) {
            pressPvpButton(cpu.index, "cpu");
          } else {
            cpu.inputHeld = true;
          }
        } else {
          cpu.cpuHoldChargeTrap = false;
          cpu.inputHeld = false;
        }
        return;
      }
      cpu.cpuTrapIdleTime = 0;
      if (cpu.cpuHoldChargeTrap) {
        // Once the lower frog leaves the trap, release the meter at its current
        // oscillating charge instead of cancelling the held input.
        cpu.cpuHoldChargeTrap = false;
        if (cpu.charging) {
          releasePvpButton(cpu.index, "cpu");
          game.pvpCpuPlan = null;
          game.pvpCpuDecisionTimer = 0.08;
          return;
        }
      }
      const immediateBonkThreat = getPvpCpuBonkThreat(cpu, opponent);
      const minimumEvasionChargeTime = STEP * 10;
      if (immediateBonkThreat > 0.18) {
        const cpuCenter = cpu.x + cpu.w / 2;
        const opponentCenter = opponent.x + opponent.w / 2;
        let escapeDirection = cpuCenter <= opponentCenter ? -1 : 1;
        if (escapeDirection < 0 && cpu.x < 42) escapeDirection = 1;
        if (escapeDirection > 0 && cpu.x + cpu.w > W - 42) escapeDirection = -1;
        if (cpu.charging) escapeDirection = cpu.chargeFacingDir >= 0 ? 1 : -1;
        const desiredPower = clamp(0.42 + immediateBonkThreat * 0.48, 0.46, 0.92);
        if (cpu.charging) {
          const reachedEscapePower = cpu.chargeDirection > 0
            ? cpu.charge >= desiredPower
            : cpu.charge <= desiredPower + 0.04;
          if (cpu.chargeHoldTime < minimumEvasionChargeTime || !reachedEscapePower) return;
          if (game.pvpCpuEvasionCooldownFrames <= 0) {
            releasePvpButton(cpu.index, "cpu");
            game.pvpCpuPlan = null;
            game.pvpCpuDecisionTimer = 0.06;
            game.pvpCpuEvasionCooldownFrames = 12;
          }
          return;
        }
        if (game.pvpCpuEvasionCooldownFrames > 0) {
          game.pvpCpuDecisionTimer = Math.max(game.pvpCpuDecisionTimer, STEP);
          return;
        }
        game.pvpCpuPlan = { defensiveHop: true, direction: escapeDirection, power: desiredPower, releaseTolerance: 0.035, reactionDelay: 0 };
        if (escapeDirection !== (cpu.dir >= 0 ? 1 : -1)) {
          game.pvpCpuDecisionTimer = 0.08;
          return;
        }
        pressPvpButton(cpu.index, "cpu");
        return;
      }

      if (!cpu.charging) {
        const planTargetAlive = Boolean(
          game.pvpCpuPlan && (
            game.pvpCpuPlan.waitOnElevator ||
            game.pvpCpuPlan.targetFlyId == null ||
            flies.some((fly) => fly.id === game.pvpCpuPlan.targetFlyId && fly.state === "active" && flyMatchesPrompt(fly))
          )
        );
        if (!planTargetAlive) game.pvpCpuPlan = null;
        if (!game.pvpCpuPlan && game.pvpCpuDecisionTimer <= 0) {
          game.pvpCpuPlan = choosePvpCpuPlan(cpu);
          game.pvpCpuDecisionTimer = game.pvpCpuPlan
            ? (immediateBonkThreat > 0.18 ? 0 : (cpu.firstJumpMade ? game.pvpCpuPlan.reactionDelay : 0))
            : 0.05;
        }
        if (game.pvpCpuPlan && game.pvpCpuDecisionTimer <= 0) {
          if (game.pvpCpuPlan.waitForSelfBonk) {
            game.pvpCpuPlan = null;
            game.pvpCpuDecisionTimer = 0.08;
            return;
          }
          if (game.pvpCpuPlan.waitOnElevator) {
            game.pvpCpuPlan = null;
            game.pvpCpuDecisionTimer = 0.08;
            return;
          }
          if (game.pvpCpuPlan.defensiveHop && game.pvpCpuEvasionCooldownFrames > 0) return;
          if (Number.isFinite(game.pvpCpuPlan.targetFlyId)) {
            const plannedFly = flies.find((fly) => fly.id === game.pvpCpuPlan.targetFlyId && fly.state === "active");
            if (plannedFly) registerPvpFlyPursuit(cpu, plannedFly);
          }
          const rawPlanDirection = Number(game.pvpCpuPlan.direction);
          const planDirection = rawPlanDirection < 0 ? -1 : rawPlanDirection > 0 ? 1 : (cpu.dir >= 0 ? 1 : -1);
          if (planDirection !== (cpu.dir >= 0 ? 1 : -1)) {
            game.pvpCpuPlan = null;
            game.pvpCpuDecisionTimer = 0.08;
            return;
          }
          pressPvpButton(cpu.index, "cpu");
        }
        return;
      }

      const plan = game.pvpCpuPlan;
      if (!plan) {
        if (cpu.cpuHoldChargeTrap) return;
        releasePvpButton(cpu.index, "cpu");
        return;
      }
      if (plan.holdChargeTrap || cpu.cpuHoldChargeTrap) {
        cpu.cpuHoldChargeTrap = true;
        cpu.inputHeld = true;
        return;
      }
      if (plan.defensiveHop && cpu.chargeHoldTime < minimumEvasionChargeTime) return;
      const reachedCharge = cpu.chargeDirection > 0
        ? cpu.charge >= plan.power - plan.releaseTolerance
        : cpu.charge <= plan.power + plan.releaseTolerance;
      const overheld = cpu.chargeHoldTime >= lerp(0.58, 1.18, clamp((game.pvpCpuDifficulty || 1) / 9, 0, 1));
      if (reachedCharge || overheld) {
        releasePvpButton(cpu.index, "cpu");
        if (plan.defensiveHop) game.pvpCpuEvasionCooldownFrames = 10;
        game.pvpCpuPlan = null;
        game.pvpCpuDecisionTimer = lerp(0.34, 0.05, clamp((game.pvpCpuDifficulty || 1) / 9, 0, 1));
      }
    }

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
          beginPvpTimerJumpGrace();
          if (!game.pvpTimerGraceActive) resolvePvpTimedOutcomeAfterJump();
        }
      }
      updatePvpMovingPlatforms();
      updatePvpImpactEffects(dt);
      if (game.pvpWinPendingIndex === null && !game.pvpTimerGraceActive && !game.pvpTimedOutcomePending) {
        ensureTargetVocabularyAvailable(game.targetVocabIndex);
        while (flies.length < CONFIG.maxFlies && game.spawnQueue.length && game.spawnQueue[0].dueAt <= game.elapsed) {
          const ticket = game.spawnQueue[0];
          if (!spawnFly(ticket)) break;
          game.spawnQueue.shift();
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
      const recoveryWindow = 0.22;
      const recovering = player.stunCountdownStarted && player.stunTimer > 0 && player.stunTimer <= recoveryWindow;
      const recoveryProgress = recovering ? clamp(1 - player.stunTimer / recoveryWindow, 0, 1) : 0;
      const upsideDown = player.bonked || player.stunTimer > 0;
      const sx = 1 + player.landingSquash * 0.18 + (player.charging ? player.charge * 0.20 : 0);
      const sy = 1 / Math.sqrt(sx);
      ctx.save();
      if (upsideDown) {
        // Rotate around the center of the collision box so the stunned frog
        // remains fully above the ground rather than being drawn underneath it.
        ctx.translate(baseX, Math.round(player.y + player.h / 2 - popOffset));
        ctx.rotate(recovering ? (1 - recoveryProgress) * Math.PI : Math.PI);
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
        const score = game.pvpSuddenDeath ? game.pvpSuddenDeathScores[player.index] : player.score;
        const scoreText = timedRound ? `${label} ${score}` : `${label} ${score} / ${target}`;
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
      const roundsToWin = getPvpRoundsToWin();
      for (let slot = 0; slot < roundsToWin; slot += 1) {
        drawPvpCrown(88 + slot * 12, 12, game.pvpRoundWins[0] > slot, p1Palette);
        drawPvpCrown(W - 100 - slot * 12, 12, game.pvpRoundWins[1] > slot, p2Palette);
      }

      drawVocabularyPrompt();
      const meterY = 247;
      const meterW = 112;
      const meterH = 12;
      const mobileHud = isRibbitMobileMode();
      [
        { player: pvpPlayers[0], x: 12, label: mobileHud
          ? (game.onlineMode ? (OnlineVersus.localIndex() === 0 ? "YOU - TAP METER" : "OPPONENT") : game.pvpCpuEnabled ? "TAP METER" : "P1 JUMP")
          : (game.onlineMode ? (OnlineVersus.localIndex() === 0 ? "YOU - SPACE" : "OPPONENT") : game.pvpCpuEnabled ? "SPACE" : "LEFT SHIFT"), palette: p1Palette },
        { player: pvpPlayers[1], x: W - 124, label: mobileHud
          ? (game.onlineMode ? (OnlineVersus.localIndex() === 1 ? "YOU - TAP METER" : "OPPONENT") : game.pvpCpuEnabled ? `CPU LV ${game.pvpCpuDifficulty}` : "P2 JUMP")
          : (game.onlineMode ? (OnlineVersus.localIndex() === 1 ? "YOU - SPACE" : "OPPONENT") : game.pvpCpuEnabled ? `CPU LV ${game.pvpCpuDifficulty}` : "RIGHT SHIFT"), palette: p2Palette }
      ].forEach(({ player, x, label, palette }) => {
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
      const clock = game.pvpSuddenDeath
        ? "SUDDEN DEATH"
        : game.pvpTimeLimitSeconds > 0
          ? `${Math.ceil(game.pvpTimeRemaining)} SEC`
          : formatTime(game.pvpElapsed);
      drawBitmapText(`ROUND ${game.pvpRoundNumber}  ${clock}`, W / 2, 10, 0.68, "center", urgentClock ? "#ffffff" : "#d9edf2", urgentClock ? "#65111b" : null);
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
      const r = { x: 130, y: 208, w: 160, h: 17 };
      const message = game.pvpCpuEnabled ? "CLICK TO ENABLE LOCAL PVP" : "LOCAL PVP ENABLED";
      ctx.save();
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(r.x + 2, r.y + 2, r.w, r.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      drawBitmapText(message, r.x + r.w / 2, r.y + 5, 0.50, "center", "#07516a");
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
      drawBitmapText(`PLAYER ${winner.index + 1}`, W / 2, panel.y + 16, 1.55, "center", COLORS.white, palette.dark);
      drawBitmapText(matchWon ? "WINS!" : `WINS ROUND ${game.pvpRoundNumber}!`, W / 2, panel.y + 30, 1.15, "center", COLORS.white, palette.dark);
      const badgeX = winner.index === 0 ? panel.x + 29 : panel.x + panel.w - 29;
      drawMiniFrogSwatchFacing(badgeX, panel.y + 23, palette, 0.82, winner.index === 1 ? -1 : 1);

      const p1X = 144;
      const p2X = 336;
      const p1Palette = getPvpSkinPalette(pvpPlayers[0].skinId, "azure", 0);
      const p2Palette = getPvpSkinPalette(pvpPlayers[1].skinId, "crimson", 1);
      const roundsToWin = getPvpRoundsToWin();
      const crownScale = 1.55;
      const crownStep = 19;
      const sideWidth = Math.round(11 * crownScale + Math.max(0, roundsToWin - 1) * crownStep);
      const crownGap = 36;
      const totalWidth = sideWidth * 2 + crownGap;
      const leftStart = Math.round(W / 2 - totalWidth / 2);
      const rightStart = Math.round(W / 2 + crownGap / 2);
      const crownY = panel.y + 60;
      for (let slot = 0; slot < roundsToWin; slot += 1) {
        drawPvpCrown(leftStart + slot * crownStep, crownY, game.pvpRoundWins[0] > slot, p1Palette, crownScale);
        drawPvpCrown(rightStart + slot * crownStep, crownY, game.pvpRoundWins[1] > slot, p2Palette, crownScale);
      }
      drawBitmapText("-", W / 2, crownY + 5, 1.25, "center", "#48555a");

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
      drawBitmapText(`PLAYER ${winnerIndex + 1}`, W / 2, 33, 1, "center", COLORS.white, winner.dark);
      drawBitmapText(`WINS ROUND ${game.pvpRoundNumber}!`, W / 2, 42, 1, "center", COLORS.white, winner.dark);
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
        drawFlyNameTag(fly);
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
      if (!['pvpCelebration', 'won'].includes(game.state)) pvpPlayers.forEach(p => drawEntity(p, drawPvpSpeechBubble));
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
      } else if (game.state === "paused") {
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
