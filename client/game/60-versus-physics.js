// Ribbit Race Versus responsibility: 60 versus physics
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
      player.recoveryFlipTimer = 0;
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
      game.pvpTimeExpiredAt = null;
      game.pvpTimeExpiredRealAt = null;
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
      game.pvpCriticalCatchKind = "";
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
      game.spawnQueue = orderedOpeningVocabulary.map((vocabIndex, index) => ({ dueAt: index === 0 ? 0 : index * CONFIG.pvpOpeningFlyInterval + STEP, source: "initial", vocabIndex }));
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
      let hasMovingPlatform = false;
      let playerOneCarrier = null;
      let playerTwoCarrier = null;
      const playerOne = pvpPlayers[0];
      const playerTwo = pvpPlayers[1];

      for (const platform of platforms) {
        if (!platform.moving) continue;
        hasMovingPlatform = true;
        if (!playerOneCarrier && playerOne?.grounded &&
            Math.abs(playerOne.y + playerOne.h - platform.y) <= 1.5 &&
            horizontalOverlap(playerOne.x, playerOne.w, platform)) {
          playerOneCarrier = platform;
        }
        if (!playerTwoCarrier && playerTwo?.grounded &&
            Math.abs(playerTwo.y + playerTwo.h - platform.y) <= 1.5 &&
            horizontalOverlap(playerTwo.x, playerTwo.w, platform)) {
          playerTwoCarrier = platform;
        }
      }
      if (!hasMovingPlatform) return;

      const progress = getPvpPlatformMotionProgressAt(0);
      let playerOneDeltaX = 0, playerOneDeltaY = 0;
      let playerTwoDeltaX = 0, playerTwoDeltaY = 0;

      for (const platform of platforms) {
        if (!platform.moving) continue;
        const previousX = platform.x;
        const previousY = platform.y;
        if (platform.movementAxis === "y") {
          platform.y = lerp(platform.innerY, platform.outerY, progress);
        } else {
          platform.x = lerp(platform.innerX, platform.outerX, progress);
        }
        const deltaX = platform.x - previousX;
        const deltaY = platform.y - previousY;
        if (platform === playerOneCarrier) {
          playerOneDeltaX = deltaX;
          playerOneDeltaY = deltaY;
        }
        if (platform === playerTwoCarrier) {
          playerTwoDeltaX = deltaX;
          playerTwoDeltaY = deltaY;
        }
      }

      if (playerOneCarrier && playerOne) {
        playerOne.x = clamp(playerOne.x + playerOneDeltaX, 0, W - playerOne.w);
        playerOne.y += playerOneDeltaY;
      }
      if (playerTwoCarrier && playerTwo) {
        playerTwo.x = clamp(playerTwo.x + playerTwoDeltaX, 0, W - playerTwo.w);
        playerTwo.y += playerTwoDeltaY;
      }
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
      player.recoveryFlipTimer = Math.max(0, (player.recoveryFlipTimer || 0) - dt);
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
        // Floating-point residue after exactly five seconds must not add
        // another simulation frame to the stun or skip the recovery animation.
        if (prevStun > 0 && player.stunTimer <= 1e-8) {
          player.stunTimer = 0;
          player.stunCountdownStarted = false;
          player.lastStunEndAt = game.pvpElapsed;
          player.recoveryFlipTimer = .24;
          player.landingSquash = 0;
          player.bonkLandingPopTimer = 0;
          if (heldThroughStun) startPvpCharge(player);
        }
        player.charging = player.stunTimer === 0 ? player.charging : false;
        player.vx = 0;
        player.vy = 0;
        // Stun recovery occurs ON the ground. The previous code flipped
        // grounded=true without correcting a platform-height Y value.
        player.y = CONFIG.groundY - player.h;
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
          if (window.RibbitRaceTutorialShouldIgnorePvpPlatform?.(player, platform)) continue;
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
      const effects = game.pvpImpactEffects;
      let writeIndex = 0;
      for (let readIndex = 0; readIndex < effects.length; readIndex += 1) {
        const effect = effects[readIndex];
        effect.elapsed += dt;
        if (effect.elapsed < effect.duration) effects[writeIndex++] = effect;
      }
      effects.length = writeIndex;
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
      if (dropDistance >= CONFIG.pvpBonkMaxDropDistance - 0.1) return CONFIG.pvpBonkMaxStunSeconds;
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
      // A fresh bonk cancels any previous flip-back. The victim gets exactly
      // one new upright recovery, AFTER the next stun expires.
      victim.recoveryFlipTimer = 0;
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
