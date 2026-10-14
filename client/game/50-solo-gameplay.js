    function resetGame(startImmediately = false) {
      clearSoloPhysicalInputState(false);
      clearPvpPhysicalShiftState(false);
      applyPendingVocabulary();
      saveStatsProfile();
      const level = applySelectedLevel();
      game.worldTime = 0;
      resetMovingPlatforms();
      syncTimeOfDayChrome();
      frog.x = level.startX + CONFIG.initialFrogOffsetX;
      frog.y = CONFIG.groundY - frog.h;
      frog.vx = 0;
      frog.vy = 0;
      frog.dir = 1;
      frog.grounded = true;
      frog.charging = false;
      frog.charge = 0.08;
      frog.chargeDirection = 1;
      frog.firstJumpMade = false;
      frog.landingSquash = 0;
      frog.blinkTimer = 1.8;
      frog.blinking = false;
      frog.chargeHoldTime = 0;
      frog.departurePlatform = null;
      frog.dropThroughPlatform = null;
      frog.danceTime = 0;
      frog.catchSparkleTimer = 0;
      frog.wrongCatchBubbleTimer = 0;
      clearFrogAfterimages(frog);

      flies.length = 0;
      nextFlyId = 1;
      game.completedVocabIndices = new Set();
      game.promptSerial = 1;

      tongue.active = false;
      tongue.elapsed = 0;
      tongue.targetFlyId = null;
      tongue.captured = false;

      game.score = 0;
      game.jumps = 0;
      game.elapsed = 0;
      game.finishTime = null;
      game.soloCriticalCatchActive = false;
      game.soloCriticalCatchElapsed = 0;
      game.soloCriticalCatchFlyVisual = null;
      game.soloCriticalCatchX = W / 2;
      game.soloCriticalCatchY = CONFIG.groundY / 2;
      game.soloTimeRemaining = Number(game.soloTimeLimitSeconds) > 0 ? game.soloTimeLimitSeconds : 0;
      game.soloTimedOut = false;
      game.bufferedDropCatchArmed = false;
      game.soloLastUrgentSecond = null;
      game.roundAirTime = 0;
      game.currentJumpAirTime = 0;
      game.currentJumpCorrectCatches = 0;
      game.currentJumpDistancePx = 0;
      game.currentJumpLastCorrectCatchAt = null;
      game.currentJumpWentAboveMap = false;
      game.jumpAchievementActive = false;
      game.roundPlumQualified = false;
      game.roundForestQualified = false;
      game.roundBlossomQualified = false;
      game.currentJumpPower = 0;
      game.currentJumpMaxPowerQualified = false;
      game.bonusFlyCaught = false;
      game.bonusFlyCount = 0;
      game.roundUnlockedSkinIds = [];
      game.roundUnlockedHatIds = [];
      game.roundUnlockedLevelId = null;
      game.roundUnlockedAchievementIds = [];
      game.roundLeaderboardRecordNotices = [];
      game.roundTimeSelectUnlocked = false;
      game.roundCustomColorUnlocked = false;
      game.victoryMessage = "";
      game.achievementToastSkinId = null;
      game.achievementToastAchievementId = null;
      game.achievementToastPvpPlayerIndex = null;
      game.achievementToastText = "";
      game.achievementToastTimer = 0;
      game.achievementToastKey = "";
      game.achievementToastQueue = [];
      game.bestTime = readBestTime(level.id);
      game.bestJumps = readFewestJumps(level.id);
      game.bestEndlessFlies = readBestEndlessFlies(level.id);

      // Assign the opening flies from a freshly shuffled vocabulary deck.
      // The target is selected independently from those opening tickets, so
      // its matching fly may be the first one shown or may arrive later.
      const openingVocabulary = shuffledVocabularyIndices()
        .slice(0, CONFIG.maxFlies);
      game.spawnQueue = openingVocabulary.map((vocabIndex, index) => ({
        dueAt: index === 0
          ? 0
          : index * CONFIG.secondFlySpawnDelay + STEP,
        source: "initial",
        vocabIndex
      }));
      game.targetVocabIndex = openingVocabulary[
        Math.floor(Math.random() * openingVocabulary.length)
      ];

      game.messageTimer = 0;
      game.buttonHeld = false;
      game.airborneTapPressAt = -Infinity;
      game.platformDropBufferUntil = -Infinity;
      game.lastFlySpawnIndex = -1;
      game.lastFlySpawnTime = -Infinity;
      game.winPending = false;
      game.volumeDragging = false;
      game.volumePointerId = null;
      game.countdownNumber = 0;
      game.countdownTimer = 0;
      game.victorySelection = "replay";
      game.pauseSelection = "continue";
      game.winInputLock = 0;
      game.newBestTime = false;
      game.newFewestJumps = false;
      game.newEndlessBest = false;
      game.state = startImmediately ? "playing" : "title";
    }

    function startCharge() {
      if (game.state !== "playing" || !frog.grounded || frog.charging) return;
      frog.charging = true;
      // Begin low, then rise. Holding long enough reverses the arc over and over.
      frog.charge = 0.04;
      frog.chargeDirection = 1;
      frog.chargeHoldTime = 0;

      // Treat the entire charge-and-jump action as one achievement window.
      // This prevents a fly caught while charging from being discarded when
      // the frog takes off, which was the cause of some missed Plum unlocks.
      if (!game.jumpAchievementActive) {
        game.currentJumpAirTime = 0;
        game.currentJumpCorrectCatches = 0;
        game.currentJumpLastCorrectCatchAt = null;
        game.currentJumpWentAboveMap = false;
        game.currentJumpPower = 0;
        game.currentJumpMaxPowerQualified = false;
        game.jumpAchievementActive = true;
      }

      tone(95, 0.035, 0.012, 8);
    }

    function getStandingPlatform() {
      return platforms.find((platform) =>
        Math.abs(frog.y + frog.h - platform.y) <= 1.5 &&
        horizontalOverlap(frog.x, frog.w, platform)
      ) || null;
    }

    function getJumpVelocity(power, quickPlatformDrop = false) {
      const shaped = clamp(power, 0, 1);
      return {
        vx: frog.dir * lerp(CONFIG.minimumJumpX, CONFIG.maximumJumpX, shaped),
        vy: quickPlatformDrop
          ? CONFIG.platformDropVelocityY
          : -lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, shaped)
      };
    }

    function launchJump() {
      if (!frog.charging || !frog.grounded || game.state !== "playing") return;

      const power = clamp(frog.charge, 0, 1);
      const standingPlatform = getStandingPlatform();
      const quickPlatformDrop = Boolean(
        standingPlatform &&
        !standingPlatform.ground &&
        frog.chargeHoldTime < CONFIG.platformDropHoldThreshold
      );
      const velocity = getJumpVelocity(power, quickPlatformDrop);
      game.currentJumpWentAboveMap = false;
      game.currentJumpPower = power;
      game.currentJumpMaxPowerQualified = power >= 0.95;
      game.currentJumpDistancePx = 0;
      // A Player Stats perfect jump requires release on the exact maximum-charge frame.
      if (power === 1) {
        statsProfile.perfectJumps += 1;
        saveStatsProfile();
      }

      frog.departurePlatform = quickPlatformDrop ? null : standingPlatform;
      frog.dropThroughPlatform = quickPlatformDrop ? standingPlatform : null;
      frog.vx = velocity.vx;
      frog.vy = velocity.vy;
      frog.grounded = false;
      frog.charging = false;
      frog.firstJumpMade = true;
      frog.landingSquash = 0;
      game.jumps += 1;
      game.totalJumps += 1;
      saveTotalJumpCount(game.totalJumps);
      // Achievement counting already began with the charge. Preserve any
      // correct fly caught before takeoff and continue counting until landing.
      game.jumpAchievementActive = true;
      beginHighPowerJumpStreak(frog, power, quickPlatformDrop);
      playJumpSound(power);
    }

    function pressMainButton() {
      if (game.state === "countdown") return;
      ensureAudio();

      if (game.state === "paused") {
        activatePauseSelection();
        return;
      }

      if (game.state === "setup") {
        if (game.setupSkinFocusId === "custom") {
          openCustomColorMenu();
        } else {
          openMainMenu();
        }
        return;
      }

      if (game.state === "custom") {
        activateCustomColorSelection();
        return;
      }

      if (game.state === "achievements") {
        activateAchievementSelection();
        return;
      }

      if (game.state === "stats") {
        activateStatsSelection();
        return;
      }

      if (game.state === "soloSettings") {
        activateSoloSettingsSelection();
        return;
      }

      if (game.state === "title") {
        activateHomeSelection();
        return;
      }

      if (game.state === "won") {
        // Briefly ignore Space after the result panel appears so habitual input
        // cannot immediately skip the player's time and jump statistics.
        activateVictorySelection();
        return;
      }

      if (game.buttonHeld) return;
      game.buttonHeld = true;

      if (game.state === "playing") {
        if (frog.grounded) startCharge();
        else game.airborneTapPressAt = game.elapsed;
      }
    }

    function releaseMainButton() {
      if (!game.buttonHeld) return;
      game.buttonHeld = false;
      if (game.state === "playing") {
        if (!frog.grounded && !frog.charging) {
          const heldFor = game.elapsed - game.airborneTapPressAt;
          if (heldFor >= 0 && heldFor <= 0.25) game.platformDropBufferUntil = game.elapsed + 0.25;
          game.airborneTapPressAt = -Infinity;
        }
        launchJump();
      }
    }

    function shuffledVocabularyIndices(excluded = new Set()) {
      const indices = VOCABULARY
        .map((_, index) => index)
        .filter((index) => !excluded.has(index) && !game.completedVocabIndices.has(index));

      // Fisher-Yates keeps the fly order genuinely shuffled rather than tied
      // to the order of the editable vocabulary list above.
      for (let index = indices.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
      }
      return indices;
    }

    function getReservedVocabIndices() {
      const reserved = new Set(flies.map((currentFly) => currentFly.vocabIndex));
      for (const ticket of game.spawnQueue) {
        if (Number.isInteger(ticket.vocabIndex)) reserved.add(ticket.vocabIndex);
      }
      return reserved;
    }

    function chooseUnusedVocabularyIndex(excluded = new Set()) {
      let choices = shuffledVocabularyIndices(excluded);

      if (!choices.length) {
        choices = VOCABULARY
          .map((_, index) => index)
          .filter((index) => !excluded.has(index));
        for (let index = choices.length - 1; index > 0; index -= 1) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          [choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]];
        }
      }

      if (!choices.length) choices = shuffledVocabularyIndices();
      if (!choices.length) choices = VOCABULARY.map((_, index) => index);
      return choices[0];
    }

    function getLiveOrQueuedVocabularyIndices(includePending = true) {
      const candidates = flies
        .map((currentFly) => currentFly.vocabIndex)
        .filter((index) => Number.isInteger(index));

      if (includePending) {
        for (const ticket of game.spawnQueue) {
          if (Number.isInteger(ticket.vocabIndex)) candidates.push(ticket.vocabIndex);
        }
      }

      return [...new Set(candidates)];
    }

    function getFlySpawnMinimumSpacing() {
      return game.mode === "pvp" ? CONFIG.pvpFlySpawnMinimumSpacing : CONFIG.flySpawnMinimumSpacing;
    }

    function ensureTargetVocabularyAvailable(vocabIndex = game.targetVocabIndex) {
      if (!Number.isInteger(vocabIndex) || !VOCABULARY[vocabIndex]) return false;

      const alreadyAvailable = flies.some((currentFly) => currentFly.vocabIndex === vocabIndex) ||
        game.spawnQueue.some((ticket) => ticket.vocabIndex === vocabIndex);
      if (alreadyAvailable) return true;

      // A target must always have a matching fly either live or scheduled.
      // This guard is especially important in First to 10 rounds, where both
      // players can collectively use every vocabulary item before the round ends.
      const spacingReadyAt = Number.isFinite(game.lastFlySpawnTime)
        ? game.lastFlySpawnTime + getFlySpawnMinimumSpacing()
        : game.elapsed;
      game.spawnQueue.push({
        dueAt: Math.max(game.elapsed, spacingReadyAt),
        source: "target-guard",
        vocabIndex
      });
      game.spawnQueue.sort((a, b) => a.dueAt - b.dueAt);
      return true;
    }

    function chooseNextVocabularyTarget(includePending = true) {
      if(OnlineVersus.isHostActive())OnlineVersus.preparePromptPlan();
      // A rejected fly stays immune only for the exact prompt on which it was
      // rejected. The next prompt immediately unlocks it, even if the frog has
      // not moved away from the fly's fixed catch point.
      game.promptSerial += 1;
      for (const currentFly of flies) currentFly.touchLocked = false;
      if(OnlineVersus.choosePlannedTarget())return;

      const availableCandidates = getLiveOrQueuedVocabularyIndices(includePending);
      let candidateIndices = availableCandidates.filter(
        (index) => !game.completedVocabIndices.has(index)
      );

      // First to 10 can require more than the 14 unique vocabulary entries
      // because both players' catches share the same vocabulary deck. Once the
      // full deck has been used, begin a fresh cycle and choose only from flies
      // that are already live or waiting in the spawn queue.
      if (
        !candidateIndices.length &&
        game.completedVocabIndices.size >= VOCABULARY.length
      ) {
        game.completedVocabIndices.clear();
        candidateIndices = availableCandidates.slice();
      }

      if (candidateIndices.length) {
        game.targetVocabIndex = candidateIndices[
          Math.floor(Math.random() * candidateIndices.length)
        ];
        ensureTargetVocabularyAvailable(game.targetVocabIndex);
        return;
      }

      // If no eligible fly currently exists, choose a new term and explicitly
      // reserve a matching spawn ticket. This prevents an orphan prompt such as
      // HELLO appearing without any HOLA fly scheduled to enter the stage.
      const reserved = getReservedVocabIndices();
      game.targetVocabIndex = chooseUnusedVocabularyIndex(reserved);
      ensureTargetVocabularyAvailable(game.targetVocabIndex);
    }

    function flyIsBlockedForCurrentPrompt(currentFly) {
      return currentFly.blockedPromptSerial === game.promptSerial;
    }

    function flyMatchesPrompt(currentFly) {
      return currentFly.vocabIndex === game.targetVocabIndex;
    }

    function spawnFly(spawnTicket = null) {
      if (game.sandboxMode || flies.length >= CONFIG.maxFlies || (!isSoloEndlessMode() && game.score >= getSoloTargetScore())) return false;
      if (game.elapsed - game.lastFlySpawnTime < getFlySpawnMinimumSpacing()) return false;

      const occupiedSpawnIndices = new Set(flies.map((currentFly) => currentFly.spawnIndex));
      let choices = flySpawns
        .map((_, index) => index)
        .filter((index) => !occupiedSpawnIndices.has(index) && index !== game.lastFlySpawnIndex);

      if (!choices.length) {
        choices = flySpawns
          .map((_, index) => index)
          .filter((index) => !occupiedSpawnIndices.has(index));
      }

      if (!choices.length) return false;

      const index = choices[Math.floor(Math.random() * choices.length)];
      const spawn = flySpawns[index];
      const vocabIndex = Number.isInteger(spawnTicket?.vocabIndex)
        ? spawnTicket.vocabIndex
        : chooseUnusedVocabularyIndex(getReservedVocabIndices());
      flies.push({
        id: nextFlyId++,
        baseX: spawn.x,
        baseY: spawn.y,
        x: spawn.x,
        y: spawn.y,
        phase: Math.random() * Math.PI * 2,
        spawnIndex: index,
        spawnAge: 0,
        vocabIndex,
        state: "active",
        touchLocked: false,
        blockedPromptSerial: -1,
        pvpBlockedPromptSerials: [-1, -1],
        pvpPursuers: [false, false],
        pvpPursuitTimes: [null, null],
        pvpPursuitPromptSerial: -1,
        spitElapsed: 0,
        spitDelay: 0,
        spitDuration: 0.34,
        spitStarted: false,
        spitOwnerIndex: null,
        spitStartX: spawn.x,
        spitStartY: spawn.y,
        returnX: spawn.x,
        returnY: spawn.y
      });
      game.lastFlySpawnIndex = index;
      game.lastFlySpawnTime = game.elapsed;
      if (game.mode !== "pvp") playFlySpawnSound();
      return true;
    }

    function getFrogMouth() {
      return {
        x: frog.dir > 0 ? frog.x + frog.w - 2 : frog.x + 2,
        y: frog.y + 5
      };
    }

    function completeWin() {
      if (game.state === "won") return;

      const endlessMode = isSoloEndlessMode();
      const targetScore = getSoloTargetScore();
      const completedTarget = endlessMode || game.score >= targetScore;
      const standardRecordEligible = !endlessMode && targetScore === 5 && completedTarget;
      const nextLevelId = standardRecordEligible ? getNextLevelId(game.selectedLevelId) : null;
      const nextLevelWasLocked = nextLevelId ? !isLevelUnlocked(nextLevelId) : false;

      game.winPending = false;
      game.buttonHeld = false;
      frog.charging = false;
      game.state = "won";
      clearFrogAfterimages(frog);
      frog.danceTime = 0;
      game.victorySelection = "replay";
      game.victoryMouseMode = false;
      game.victoryHoveredSelection = null;
      game.victoryPressedSelection = null;
      game.victoryNoticePage = 0;
      game.victoryAchievementHoverId = null;
      game.victoryNoticeHoverKey = null;
      game.winInputLock = CONFIG.winDanceRevealDelay + 0.5;
      const wonTime = getTimerTime();

      if (standardRecordEligible) {
        const previousTimeBest = readBestTimeForTimeOfDay(game.selectedLevelId, game.timeOfDay);
        if (previousTimeBest === null || wonTime < previousTimeBest) saveBestTimeForTimeOfDay(wonTime, game.selectedLevelId, game.timeOfDay);
        const previousBest = game.bestTime;
        game.newBestTime = previousBest === null || wonTime < previousBest;
        if (game.newBestTime) { game.bestTime = wonTime; saveBestTime(wonTime, game.selectedLevelId); }
        const previousFewestJumps = readFewestJumps(game.selectedLevelId);
        game.newFewestJumps = previousFewestJumps === null || game.jumps < previousFewestJumps;
        if (game.newFewestJumps) { game.bestJumps = game.jumps; saveFewestJumps(game.jumps, game.selectedLevelId); }
        else game.bestJumps = previousFewestJumps;
        refreshPersistentLevelUnlocks();
        if (nextLevelId && nextLevelWasLocked && isLevelUnlocked(nextLevelId)) {
          game.roundUnlockedLevelId = nextLevelId;
          markAchievementEarned(`level-${nextLevelId}`, false);
        }
        statsProfile.maxFinalScore = Math.max(statsProfile.maxFinalScore, game.score);
        evaluateCompletedRoundGeneralAchievements(wonTime);
        evaluateCompletedRoundFrogAchievements(wonTime);
        if (allLevelsCompletedWithin(CONFIG.levelUnlockTimeTarget)) grantCustomColorAchievement();
        statsProfile.totalWins += 1;
        if (game.bonusFlyCaught) statsProfile.bonusFinishes += 1;
        game.victoryMessage = chooseVictoryMessage(game.selectedLevelId);
      } else if (endlessMode) {
        game.newBestTime = false;
        game.newFewestJumps = false;
        if (game.score >= 20) markAchievementEarned("solo-endless-20", true);
        const previousEndlessBest = readBestEndlessFlies(game.selectedLevelId);
        game.newEndlessBest = isSoloEndlessLeaderboardEligible() && game.score > 0 && (previousEndlessBest === null || game.score > previousEndlessBest);
        if (game.newEndlessBest) saveBestEndlessFlies(game.score, game.selectedLevelId);
        game.bestEndlessFlies = game.newEndlessBest ? game.score : previousEndlessBest;
        const flyWord = game.score === 1 ? "FLY" : "FLIES";
        const duration = Number(game.soloTimeLimitSeconds) || Math.round(game.elapsed);
        game.victoryMessage = `${game.score} ${flyWord} IN ${duration} SECONDS!`;
      } else {
        game.newBestTime = false;
        game.newFewestJumps = false;
        game.newEndlessBest = false;
        const targetText = targetScore === 10 ? "10-FLY MODE" : "TIMED RUN";
        game.victoryMessage = completedTarget ? `${targetText} COMPLETE!` : `${game.score} / ${targetScore} FLIES CAUGHT`;
      }

      statsProfile.longestAirTime = Math.max(statsProfile.longestAirTime, game.currentJumpAirTime);
      statsProfile.maxFliesOneJump = Math.max(statsProfile.maxFliesOneJump, game.currentJumpCorrectCatches);
      saveStatsProfile();
      playWinSound();
    }


    function scheduleFlyReplacementFromCatch() {
      const versus = game.mode === "pvp";
      const dueTime = game.elapsed + (versus ? CONFIG.pvpFlyRespawnDelay : CONFIG.flyRespawnDelay);

      // Solo deliberately slows remaining opening spawns after an early catch.
      // Versus must NOT: doing this to the shared queue could delay its third
      // and fourth opening flies until 5-8 seconds into a competitive round.
      if (!versus) {
        let nextInitialDue = dueTime;
        const pendingInitialTickets = game.spawnQueue
          .filter((ticket) => ticket.source === "initial")
          .sort((a, b) => a.dueAt - b.dueAt);

        for (const ticket of pendingInitialTickets) {
          ticket.dueAt = Math.max(ticket.dueAt, nextInitialDue);
          nextInitialDue = ticket.dueAt + CONFIG.secondFlySpawnDelay;
        }
      }

      // This ticket belongs only to this catch. Later fly spawns and later
      // catches never restart its countdown. Its vocabulary is reserved now,
      // independently of the target prompt, so it can become a future answer
      // before the fly itself has appeared.
      const vocabIndex = chooseUnusedVocabularyIndex(getReservedVocabIndices());
      game.spawnQueue.push({
        dueAt: dueTime,
        source: "replacement",
        vocabIndex
      });
      game.spawnQueue.sort((a, b) => a.dueAt - b.dueAt);
    }

    function recordFlyEaten(countsTowardProgress = true) {
      if (!countsTowardProgress) return;
      game.totalFliesEaten += 1;
      saveTotalFlyCount(game.totalFliesEaten);
      if (game.totalFliesEaten >= CONFIG.timeSelectFlyTarget) {
        grantTimeSelectAchievement();
        markAchievementEarned("time-select", true);
      }
      if (game.totalFliesEaten >= CONFIG.emberFlyTarget) {
        markAchievementEarned("fly-feast", true);
      }
      evaluateCustomFrogSlotUnlocks(true);
    }

    function completeBonusCatch(targetFly) {
      if (
        game.state !== "playing" ||
        isSoloEndlessMode() ||
        !game.winPending ||
        game.score < getSoloTargetScore() ||
        game.score >= getSoloTargetScore() + 1 ||
        !targetFly ||
        targetFly.state !== "active"
      ) return false;

      const index = flies.findIndex((currentFly) => currentFly.id === targetFly.id);
      if (index < 0) return false;

      flies.splice(index, 1);
      game.bonusFlyCaught = true;
      game.bonusFlyCount += 1;
      game.score += 1;
      if (game.jumpAchievementActive) {
        game.currentJumpCorrectCatches += 1;
        statsProfile.maxFliesOneJump = Math.max(
          statsProfile.maxFliesOneJump,
          game.currentJumpCorrectCatches
        );
        if (game.currentJumpCorrectCatches >= 2) {
          markAchievementEarned("double-dinner", true);
          if (game.selectedLevelId === "swamp") game.roundPlumQualified = true;
        }
        if (game.currentJumpWentAboveMap) markAchievementEarned("sky-snack", true);
      }
      if (targetFly.spawnAge <= CONFIG.forestSpawnCatchWindow) {
        markAchievementEarned("fresh-catch", true);
        if (game.selectedLevelId === "jungle") game.roundForestQualified = true;
      }
      recordFlyEaten();
      if (
        game.jumpAchievementActive &&
        game.selectedLevelId === "garden" &&
        game.currentJumpWentAboveMap &&
        !frog.grounded
      ) {
        game.roundBlossomQualified = true;
      }
      frog.wrongCatchBubbleTimer = 0;
      frog.catchSparkleTimer = CONFIG.catchSparkleDuration;
      playCorrectFlySound();
      return true;
    }

    function completeCorrectCatch(targetFly) {
      const index = flies.findIndex((currentFly) => currentFly.id === targetFly.id);
      if (index < 0 || game.state !== "playing") return false;
      if (shouldStartSoloCriticalCatch(targetFly)) startSoloCriticalCatch(targetFly);

      flies.splice(index, 1);
      if (tongue.targetFlyId === targetFly.id) tongue.captured = true;

      game.completedVocabIndices.add(targetFly.vocabIndex);
      game.score += 1;
      if (game.bufferedDropCatchArmed) {
        markAchievementEarned("buffered-drop-catch", true);
        game.bufferedDropCatchArmed = false;
      }
      recordFlyEaten();
      frog.wrongCatchBubbleTimer = 0;
      frog.catchSparkleTimer = CONFIG.catchSparkleDuration;
      recordCorrectCatchForAchievements(targetFly);
      playCorrectFlySound();

      if (!game.winPending && !isSoloEndlessMode() && game.score >= getSoloTargetScore()) {
        // Keep the current jump alive. The timer is frozen immediately, but we
        // stop presenting a new vocabulary target while the frog finishes the
        // landing, so the footer does not flash a fresh word after the fifth catch.
        game.finishTime = game.elapsed;
        game.winPending = true;
        game.targetVocabIndex = null;
      } else if (!game.winPending) {
        scheduleFlyReplacementFromCatch();
        chooseNextVocabularyTarget(true);
      }

      return true;
    }

    function beginWrongCatch(targetFly, caughtByTongue = false) {
      if (targetFly.state !== "active" || game.state !== "playing") return false;

      const mouth = getFrogMouth();
      // The buzz is visual only. Its catch point, label, and return location
      // stay fixed at the authored base position.
      targetFly.returnX = targetFly.baseX;
      targetFly.returnY = targetFly.baseY;
      targetFly.state = "spitting";
      targetFly.touchLocked = true;
      targetFly.blockedPromptSerial = game.promptSerial;
      targetFly.spitElapsed = 0;
      targetFly.spitDelay = caughtByTongue
        ? Math.max(0.08, tongue.duration - tongue.elapsed + 0.03)
        : 0.07;
      targetFly.spitDuration = 0.34;
      targetFly.spitStarted = false;
      targetFly.spitStartX = mouth.x;
      targetFly.spitStartY = mouth.y;
      targetFly.x = mouth.x;
      targetFly.y = mouth.y;

      if (tongue.targetFlyId === targetFly.id) {
        const chainTarget = findTongueChainFollowup(mouth.x, mouth.y, targetFly.baseX, targetFly.baseY, targetFly.id);
        tongue.captured = true;
        tongue.chainNextFlyId = chainTarget ? chainTarget.id : null;
      }
      frog.catchSparkleTimer = 0;
      frog.wrongCatchBubbleTimer = CONFIG.wrongCatchBubbleDuration;
      statsProfile.wrongFlies += 1;
      saveStatsProfile();
      playWrongFlySound(targetFly.spitDelay);
      return true;
    }

    function attemptFlyCatch(targetFly, source = "body") {
      if (!targetFly || targetFly.state !== "active") return false;

      if (game.winPending) {
        if (isSoloEndlessMode()) return false;
        // The jump remains live after the fifth match. A tongue already in
        // motion—or a new tongue target reached before landing—may collect the
        // one optional sixth fly, producing a legitimate 6 / 5 finish.
        return completeBonusCatch(targetFly);
      }

      if (targetFly.touchLocked || flyIsBlockedForCurrentPrompt(targetFly)) return false;
      if (flyMatchesPrompt(targetFly)) return completeCorrectCatch(targetFly);
      return beginWrongCatch(targetFly, source === "tongue");
    }

    function beginTongueCatch(targetFly) {
      if (shouldStartSoloCriticalCatch(targetFly)) startSoloCriticalCatch(targetFly);
      tongue.active = true;
      tongue.elapsed = 0;
      tongue.targetFlyId = targetFly.id;
      tongue.targetX = targetFly.baseX;
      tongue.targetY = targetFly.baseY;
      tongue.captured = false;
      tongue.chainNextFlyId = null;
      tone(330, 0.055, 0.018, 90);
    }

    function findTongueChainFollowup(startX, startY, endX, endY, excludedId = null) {
      let best = null;
      let bestScore = Infinity;
      const dx = endX - startX;
      const dy = endY - startY;
      const lengthSq = dx * dx + dy * dy || 1;
      for (const fly of flies) {
        if (!fly || fly.id === excludedId || fly.state !== "active" || !flyMatchesPrompt(fly) || fly.touchLocked || flyIsBlockedForCurrentPrompt(fly)) continue;
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

    function updateTongue(dt) {
      if(game.sandboxMode){updateSandboxTongueTest(dt);return;}
      if (!tongue.active) return;

      tongue.elapsed += dt;
      const progress = tongue.elapsed / tongue.duration;

      // Once the tongue animation begins, the selected fly is guaranteed to
      // be caught at the same point in the existing animation. The visual
      // tongue is still clamped in front of the frog when the frog passes it.
      if (!tongue.captured && progress >= 0.46) {
        const targetFly = flies.find((currentFly) => currentFly.id === tongue.targetFlyId);
        tongue.captured = true;
        if (targetFly) attemptFlyCatch(targetFly, "tongue");
      }

      if (progress >= 1) {
        const nextFly = tongue.chainNextFlyId ? flies.find((currentFly) => currentFly.id === tongue.chainNextFlyId) : null;
        tongue.active = false;
        tongue.targetFlyId = null;
        tongue.chainNextFlyId = null;
        if (nextFly && nextFly.state === "active") {
          beginTongueCatch(nextFly);
        }
      }
    }

    function frogTouchesFly(currentFly) {
      // Collision uses the fixed base point; only the rendered fly jitters.
      const flyLeft = currentFly.baseX - 6;
      const flyRight = currentFly.baseX + 7;
      const flyTop = currentFly.baseY - 5;
      const flyBottom = currentFly.baseY + 7;

      return (
        frog.x + frog.w >= flyLeft &&
        frog.x <= flyRight &&
        frog.y + frog.h >= flyTop &&
        frog.y <= flyBottom
      );
    }

    function animateFlies(dt) {
      for (const currentFly of flies) {
        currentFly.spawnAge += dt;

        if (currentFly.state === "spitting") {
          currentFly.spitElapsed += dt;

          if (currentFly.spitElapsed < currentFly.spitDelay) {
            const mouth = game.mode === "pvp" && Number.isInteger(currentFly.spitOwnerIndex)
              ? getPvpMouth(pvpPlayers[currentFly.spitOwnerIndex])
              : getFrogMouth();
            currentFly.x = mouth.x;
            currentFly.y = mouth.y;
            continue;
          }

          if (!currentFly.spitStarted) {
            const mouth = game.mode === "pvp" && Number.isInteger(currentFly.spitOwnerIndex)
              ? getPvpMouth(pvpPlayers[currentFly.spitOwnerIndex])
              : getFrogMouth();
            currentFly.spitStarted = true;
            currentFly.spitStartX = mouth.x;
            currentFly.spitStartY = mouth.y;
          }

          const travelTime = currentFly.spitElapsed - currentFly.spitDelay;
          const progress = clamp(travelTime / currentFly.spitDuration, 0, 1);
          const eased = easeOutCubic(progress);
          currentFly.x = lerp(currentFly.spitStartX, currentFly.returnX, eased);
          currentFly.y = lerp(currentFly.spitStartY, currentFly.returnY, eased) -
            Math.sin(progress * Math.PI) * 9;

          if (progress >= 1) {
            currentFly.state = "active";
            currentFly.baseX = currentFly.returnX;
            currentFly.baseY = currentFly.returnY;
            currentFly.x = currentFly.returnX;
            currentFly.y = currentFly.returnY;
            currentFly.phase = 0;
            currentFly.spitElapsed = 0;
            currentFly.spitStarted = false;
            currentFly.spitOwnerIndex = null;
            if (game.mode === "pvp") currentFly.touchLocked = false;
          }
          continue;
        }

        currentFly.phase += dt * 7.5;
        currentFly.x = currentFly.baseX + Math.sin(currentFly.phase * 0.71) * 2;
        currentFly.y = currentFly.baseY + Math.sin(currentFly.phase) * 3;

        // A wrong answer cannot be caught repeatedly while the frog is still
        // overlapping the exact spot where it was returned.
        if (currentFly.touchLocked && !frogTouchesFly(currentFly)) {
          currentFly.touchLocked = false;
        }
      }
    }

    function updateFlies(dt) {
      if(game.sandboxMode){updateSandboxFlyTest(dt);return;}
      animateFlies(dt);

      // During normal play, the tongue owns the catch while it is animating.
      // After the fifth answer, however, body contact must still be checked so
      // the frog can land on one last visible fly and finish with a 6 / 5 score.
      if (tongue.active && !game.winPending) return;

      // Direct body contact still catches a fly. Wrong translations are
      // swallowed briefly, then spat back to the exact point where they were hit.
      const touchedFly = flies.find((currentFly) =>
        currentFly.state === "active" &&
        (
          game.winPending ||
          (!currentFly.touchLocked && !flyIsBlockedForCurrentPrompt(currentFly))
        ) &&
        frogTouchesFly(currentFly)
      );
      if (touchedFly) {
        attemptFlyCatch(touchedFly, "body");
        return;
      }

      const bonusTongueAvailable = game.winPending && !isSoloEndlessMode() &&
        game.score < getSoloTargetScore() + 1 && game.bonusFlyCount < 1;
      if (game.winPending && !bonusTongueAvailable) return;

      const mouth = getFrogMouth();
      let nearestFly = null;
      let nearestDistance = Infinity;

      for (const currentFly of flies) {
        if (
          currentFly.state !== "active" ||
          currentFly.touchLocked ||
          (!bonusTongueAvailable && flyIsBlockedForCurrentPrompt(currentFly))
        ) continue;

        const dx = currentFly.baseX - mouth.x;
        const dy = currentFly.baseY - mouth.y;
        const flyIsInFront = dx * frog.dir >= 0;

        if (
          flyIsInFront &&
          Math.abs(dx) <= CONFIG.tongueReach &&
          Math.abs(dy) <= CONFIG.tongueVerticalTolerance
        ) {
          const distance = Math.abs(dx) + Math.abs(dy) * 0.35;
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestFly = currentFly;
          }
        }
      }

      if (nearestFly) beginTongueCatch(nearestFly);
    }

    function horizontalOverlap(x, width, platform) {
      return x + width > platform.x + 2 && x < platform.x + platform.w - 2;
    }

    function updateFrog(dt) {
      frog.catchSparkleTimer = Math.max(0, frog.catchSparkleTimer - dt);
      frog.wrongCatchBubbleTimer = Math.max(0, frog.wrongCatchBubbleTimer - dt);
      frog.landingSquash = Math.max(0, frog.landingSquash - dt * 4.5);

      frog.blinkTimer -= dt;
      if (frog.blinkTimer <= 0) {
        frog.blinking = true;
        frog.blinkTimer = 0.12;
      } else if (frog.blinking && frog.blinkTimer <= 0.04) {
        frog.blinking = false;
        frog.blinkTimer = 1.6 + Math.random() * 2.5;
      }

      if (frog.charging) {
        frog.chargeHoldTime += dt;
        const rate = 1 / CONFIG.chargeSecondsOneWay;
        frog.charge += frog.chargeDirection * rate * dt;

        if (frog.charge >= 1) {
          frog.charge = 1;
          frog.chargeDirection = -1;
          tone(150, 0.035, 0.009, -10);
        } else if (frog.charge <= 0.04) {
          frog.charge = 0.04;
          frog.chargeDirection = 1;
          tone(105, 0.035, 0.008, 10);
        }
      }

      if (frog.grounded) {
        frog.vx = 0;
        frog.vy = 0;
        if (game.buttonHeld && !frog.charging && !game.jumpAchievementActive) startCharge();
        return;
      }

      game.currentJumpAirTime += dt;
      game.roundAirTime += dt;

      const previousX = frog.x;
      const previousY = frog.y;
      const previousBottom = previousY + frog.h;

      frog.vy += CONFIG.gravity * dt;
      frog.x += frog.vx * dt;
      frog.y += frog.vy * dt;
      const jumpTravel = Math.hypot(frog.x - previousX, frog.y - previousY);
      statsProfile.distanceJumpedPx += jumpTravel;
      game.currentJumpDistancePx += jumpTravel;

      if (frog.y + frog.h < 0) {
        game.currentJumpWentAboveMap = true;
      }

      if (frog.departurePlatform) {
        const departure = frog.departurePlatform;
        const currentBottom = frog.y + frog.h;
        if (
          frog.vy >= 0 ||
          currentBottom < departure.y - 2 ||
          currentBottom > departure.y + departure.h + 2 ||
          !horizontalOverlap(frog.x, frog.w, departure)
        ) {
          frog.departurePlatform = null;
        }
      }

      if (frog.dropThroughPlatform) {
        const dropPlatform = frog.dropThroughPlatform;
        if (
          frog.y > dropPlatform.y + dropPlatform.h + 2 ||
          !horizontalOverlap(frog.x, frog.w, dropPlatform)
        ) {
          frog.dropThroughPlatform = null;
        }
      }

      let bounced = false;
      if (frog.x <= 0) {
        frog.x = 0;
        frog.vx = Math.abs(frog.vx);
        frog.dir = 1;
        bounced = true;
      } else if (frog.x + frog.w >= W) {
        frog.x = W - frog.w;
        frog.vx = -Math.abs(frog.vx);
        frog.dir = -1;
        bounced = true;
      }

      if (bounced && game.elapsed - game.lastWallSound > 0.08) {
        game.lastWallSound = game.elapsed;
        statsProfile.wallBounces += 1;
        tone(115, 0.055, 0.025, -28);
      }

      if (frog.vy >= 0) {
        const currentBottom = frog.y + frog.h;
        let landing = null;

        for (const platform of platforms) {
          if (platform === frog.departurePlatform || platform === frog.dropThroughPlatform) continue;
          if (
            previousBottom <= platform.y + 1.5 &&
            currentBottom >= platform.y &&
            horizontalOverlap(frog.x, frog.w, platform)
          ) {
            if (!landing || platform.y < landing.y) landing = platform;
          }
        }

        if (landing) {
          const bufferedDrop = !landing.ground && game.elapsed <= game.platformDropBufferUntil;
          if (bufferedDrop) {
            game.bufferedDropCatchArmed = true;
            frog.y = landing.y - frog.h + 2;
            frog.vy = CONFIG.platformDropVelocityY;
            frog.grounded = false;
            frog.departurePlatform = null;
            frog.dropThroughPlatform = landing;
            frog.landingSquash = 0;
            game.platformDropBufferUntil = -Infinity;
            tone(116, 0.045, 0.014, -35);
          } else {
            game.bufferedDropCatchArmed = false;
            frog.y = landing.y - frog.h;
            frog.vx = 0;
            frog.vy = 0;
            frog.grounded = true;
            frog.departurePlatform = null;
            frog.dropThroughPlatform = null;
            frog.landingSquash = 1;
            game.platformDropBufferUntil = -Infinity;
            tone(88, 0.045, 0.018, -16);
          }
        }
      }

      // Safety reset in case the page is modified and a platform gap is added later.
      if (frog.y > CONFIG.playBottom + 80) {
        frog.x = (LEVELS[game.selectedLevelId] || LEVELS.park).startX + CONFIG.initialFrogOffsetX;
        frog.y = CONFIG.groundY - frog.h;
        frog.vx = 0;
        frog.vy = 0;
        frog.dir = 1;
        frog.grounded = true;
        frog.departurePlatform = null;
        frog.dropThroughPlatform = null;
        statsProfile.longestAirTime = Math.max(statsProfile.longestAirTime, game.currentJumpAirTime);
        statsProfile.maxFliesOneJump = Math.max(statsProfile.maxFliesOneJump, game.currentJumpCorrectCatches);
        saveStatsProfile();
        game.currentJumpAirTime = 0;
        game.currentJumpCorrectCatches = 0;
        game.currentJumpDistancePx = 0;
        game.currentJumpLastCorrectCatchAt = null;
        game.currentJumpWentAboveMap = false;
        game.currentJumpPower = 0;
        game.currentJumpMaxPowerQualified = false;
        game.jumpAchievementActive = false;
      }
    }

    function updateResumeCountdown(dt) {
      game.countdownTimer -= dt;
      // Treat sub-microsecond floating-point residue as zero so every
      // displayed number lasts exactly 0.75 seconds at the 120 Hz game step.
      while (game.countdownTimer <= 1e-7 && game.state === "countdown") {
        if (game.countdownNumber > 1) {
          game.countdownNumber -= 1;
          game.countdownTimer += CONFIG.resumeCountdownStepDuration;
          playCountdownSound(game.countdownNumber);
        } else {
          game.countdownNumber = 0;
          game.countdownTimer = 0;
          game.state = "playing";
          if (game.resumeChargeAfterCountdown) restorePauseChargeSnapshot();
          playCountdownGoSound();
        }
      }
    }

    function startResumeCountdown(preserveCharge = false) {
      if (!preserveCharge) {
        clearSoloPhysicalInputState(false);
        clearPvpPhysicalShiftState(false);
      }
      game.pauseHoveredSelection = null;
      game.pausePressedSelection = null;
      game.pausePointerId = null;
      game.pauseHelpOpen = false;
      game.pauseFocusVisible = true;
      game.volumeDragging = false;
      game.volumePointerId = null;
      if (!preserveCharge) {
        game.buttonHeld = false;
        frog.charging = false;
        if (game.mode === "pvp") {
          pvpPlayers.forEach((player) => { player.inputHeld = false; player.charging = false; });
        }
      }
      game.countdownNumber = 3;
      game.countdownTimer = CONFIG.resumeCountdownStepDuration;
      game.state = "countdown";
      // Seed the replay BEFORE the first countdown tone, not the first jump.
      window.RibbitEngineReplay?.captureCountdownStart?.(performance.now());
      if(!OnlineVersus.isActive())playCountdownSound(3);
    }

    function startNewGameCountdown() {
      clearSoloPhysicalInputState(false);
      clearPvpPhysicalShiftState(false);
      game.mode = "solo";
      const randomRun = game.soloRandomLevelMode;
      const previousStartedTime = game.lastStartedTimeOfDay;
      if (randomRun) {
        const randomLevelId = ensureSoloRandomPreview();
        if (!selectLevel(randomLevelId, false)) return false;
        game.soloLastRandomLevelId = randomLevelId;
        game.soloRandomPreviewLevelId = null;
      }
      if (!isLevelUnlocked(game.selectedLevelId)) {
        playLockedSkinSound();
        return false;
      }
      if (game.timeOfDayLock) {
        game.timeOfDay = game.timeOfDayLock;
      } else if (
        previousStartedTime &&
        (randomRun || game.lastStartedLevelId === game.selectedLevelId)
      ) {
        game.timeOfDay = nextTimeOfDay(previousStartedTime);
      }

      game.lastStartedLevelId = game.selectedLevelId;
      game.lastStartedTimeOfDay = game.timeOfDay;
      if (game.timeOfDay === "night") {
        if (game.moonSequenceStarted) game.moonPhaseIndex = (game.moonPhaseIndex + 1) % MOON_PHASES.length;
        else game.moonSequenceStarted = true;
      }
      syncTimeOfDayChrome();
      resetGame(false);
      startResumeCountdown();
      return true;
    }

    function returnToHomeScreen(playFeedback = true) {
      if (OnlineVersus.isActive()) {
        OnlineVersus.leaveRoom();
        return;
      }
      game.mode = "solo";
      resetGame(false);
      openMainMenu(false);
      game.buttonHeld = false;
      game.volumeDragging = false;
      game.volumePointerId = null;
      game.hoveredLevelId = null;
      game.timeButtonHovered = false;
      game.achievementButtonHovered = false;
      game.statsButtonHovered = false;
      game.customizeButtonHovered = false;
      game.pvpButtonHovered = false;
      game.randomButtonHovered = false;
      game.homeHoverSelection = null;
      game.homeFocusVisible = false;
      if (game.soloRandomLevelMode) {
        game.homeSelection = "random";
        ensureSoloRandomPreview(true);
      } else {
        game.homeSelection = game.selectedLevelId;
      }
      frog.charging = false;
      if (playFeedback) {
        tone(420, 0.055, 0.015, -85);
        tone(280, 0.065, 0.012, -55, 0.045);
      }
    }

    function update(dt) {
      if (game.state !== "paused" && game.state !== "countdown") game.visualTime += dt;
      game.achievementToastTimer = Math.max(0, game.achievementToastTimer - dt);
      if (game.achievementToastTimer <= 0) {
        game.achievementToastSkinId = null;
        game.achievementToastAchievementId = null;
        game.achievementToastPvpPlayerIndex = null;
        game.achievementToastText = "";
        game.achievementToastKey = "";
        startNextAchievementToast();
      }
      game.cheatToastTimer = Math.max(0, game.cheatToastTimer - dt);
      game.customHatTipTimer = Math.max(0, (game.customHatTipTimer || 0) - dt);
      if (OnlineVersus.isSpectating()) { OnlineVersus.updateSpectator(dt); return; }
      if (OnlineVersus.synchronizedCountdown(dt)) return;
      if (OnlineVersus.isGuestActive()) { OnlineVersus.updateGuest(dt); return; }

      if (game.state === "countdown") {
        updateResumeCountdown(dt);
        return;
      }
      if (game.state === "pvpCelebration") {
        updatePvpCelebration(dt);
        return;
      }
      if (game.state === "frogSandbox") {
        updateFrogSandbox(dt);
        return;
      }
      if (game.state === "pvpSuddenDeathAlert") {
        game.pvpSuddenDeathAlertTimer = Math.max(0, game.pvpSuddenDeathAlertTimer - dt);
        if (game.pvpSuddenDeathAlertTimer <= 0) startResumeCountdown();
        return;
      }
      if (game.state === "won") {
        if (game.mode === "pvp") {
          game.winInputLock = Math.max(0, game.winInputLock - dt);
          return;
        }
        frog.catchSparkleTimer = Math.max(0, frog.catchSparkleTimer - dt);
        frog.wrongCatchBubbleTimer = Math.max(0, frog.wrongCatchBubbleTimer - dt);
        game.winInputLock = Math.max(0, game.winInputLock - dt);
        animateFlies(dt);
        if (frog.grounded) frog.danceTime += dt;
        return;
      }
      if (game.state !== "playing") return;
      if (game.mode === "pvp") {
        if (OnlineVersus.isGuestActive()) {
          OnlineVersus.updateGuest(dt);
          return;
        }
        const pvpSimulationScale = updatePvpCriticalCatch(dt);
        updatePvp(dt * pvpSimulationScale);
        return;
      }

      if(game.sandboxMode&&sandboxPreview.mode!=="play"){animateFlies(dt);return;}
      const soloSimulationScale = updateSoloCriticalCatch(dt);
      const soloDt = dt * soloSimulationScale;
      game.elapsed += soloDt;
      game.worldTime += soloDt;
      game.messageTimer += soloDt;
      if (!game.sandboxMode && isSoloTimerActive() && !game.winPending) {
        game.soloTimeRemaining = Math.max(0, game.soloTimeLimitSeconds - game.elapsed);
        const urgentSecond = game.soloTimeRemaining > 0 ? Math.ceil(game.soloTimeRemaining) : 0;
        if (urgentSecond > 0 && urgentSecond <= 5 && urgentSecond !== game.soloLastUrgentSecond) {
          game.soloLastUrgentSecond = urgentSecond;
          playUrgentClockTick(urgentSecond);
        }
      }

      updateMovingPlatforms();
      updateFrog(soloDt);
      updateFrogAfterimages(frog, soloDt, getFrogPalette(), true);
      updateFlies(soloDt);
      updateTongue(soloDt);

      if (frog.grounded && game.jumpAchievementActive && !tongue.active) {
        evaluateLandingFrogAchievements();
      }

      if (!game.sandboxMode && !game.winPending && (isSoloEndlessMode() || game.score < getSoloTargetScore())) {
        // Process every ticket whose own catch- or opening-based countdown has
        // finished. Spawning one fly never changes another ticket's due time.
        while (
          flies.length < CONFIG.maxFlies &&
          game.spawnQueue.length > 0 &&
          game.spawnQueue[0].dueAt <= game.elapsed
        ) {
          const spawnTicket = game.spawnQueue[0];
          if (!spawnFly(spawnTicket)) break;
          game.spawnQueue.shift();
        }
      }

      if (!game.sandboxMode && isSoloTimerActive() && !game.winPending && game.elapsed >= game.soloTimeLimitSeconds) {
        const releasingFinalCharge = isSoloEndlessMode() && frog.grounded && frog.charging;
        game.elapsed = game.soloTimeLimitSeconds;
        game.finishTime = game.soloTimeLimitSeconds;
        game.soloTimeRemaining = 0;
        if (releasingFinalCharge) launchJump();
        game.soloTimedOut = true;
        game.winPending = true;
        game.targetVocabIndex = null;
        game.buttonHeld = false;
        frog.charging = false;
        // Allow the final airborne jump and landing catch to resolve exactly
        // like the five-fly mode instead of freezing midair.
      }

      if (game.winPending && frog.grounded && !tongue.active && !game.soloCriticalCatchActive) {
        const landingBonusFly = flies.find((currentFly) =>
          currentFly.state === "active" && frogTouchesFly(currentFly)
        );
        if (landingBonusFly) completeBonusCatch(landingBonusFly);
        completeWin();
      }
    }
