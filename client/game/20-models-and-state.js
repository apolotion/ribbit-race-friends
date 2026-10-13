    let platforms = LEVELS.park.platforms;
    let flySpawns = LEVELS.park.flySpawns;

    const FALLBACK_VOCABULARY = Object.freeze([{"english":"To be","spanish":"Ser, Estar"},{"english":"To go","spanish":"Ir"},{"english":"To do","spanish":"Hacer"},{"english":"To have","spanish":"Tener"},{"english":"To speak","spanish":"Hablar"},{"english":"Good","spanish":"Bueno"},{"english":"Big","spanish":"Grande"},{"english":"Easy","spanish":"Fácil"},{"english":"Fast","spanish":"Rápido"},{"english":"New","spanish":"Nuevo"},{"english":"Student","spanish":"Estudiante"},{"english":"Book","spanish":"Libro"},{"english":"University","spanish":"Universidad"},{"english":"School","spanish":"Escuela"},{"english":"Country","spanish":"País"}]);

    function normalizeVocabularyEntries(entries) {
      const cleaned = [];
      const seen = new Set();
      if (Array.isArray(entries)) {
        entries.forEach((entry) => {
          const english = normalizeVocabularyCellText(entry && entry.english, 80);
          const spanish = normalizeVocabularyCellText(entry && entry.spanish, 80);
          if (!english || !spanish) return;
          const key = `${english.toLocaleLowerCase()}\u0000${spanish.toLocaleLowerCase()}`;
          if (seen.has(key)) return;
          seen.add(key);
          cleaned.push(Object.freeze({ english, spanish }));
        });
      }
      const source = cleaned.length >= 4 ? cleaned : FALLBACK_VOCABULARY;
      return Object.freeze(Array.from(source));
    }

    let VOCABULARY = normalizeVocabularyEntries(RibbitCloud.getVocabulary());
    let pendingVocabularyEntries = null;


    const frog = {
      // Matches the speech-bubble pointer center before the first jump.
      x: 25 + CONFIG.initialFrogOffsetX,
      y: CONFIG.groundY - 14,
      w: 22,
      h: 14,
      vx: 0,
      vy: 0,
      dir: 1,
      grounded: true,
      charging: false,
      charge: 0.08,
      chargeDirection: 1,
      firstJumpMade: false,
      landingSquash: 0,
      blinkTimer: 1.8,
      blinking: false,
      chargeHoldTime: 0,
      departurePlatform: null,
      dropThroughPlatform: null,
      danceTime: 0,
      catchSparkleTimer: 0,
      wrongCatchBubbleTimer: 0,
      afterimages: [],
      afterimageSampleTimer: 0,
      jumpStreakTimer: 0
    };

    const flies = [];
    let nextFlyId = 1;

    const tongue = {
      active: false,
      elapsed: 0,
      duration: 0.24,
      targetFlyId: null,
      targetX: 0,
      targetY: 0,
      captured: false
    };

    function createPvpPlayer(index, skinId, x, dir) {
      return {
        index, skinId, x, y: CONFIG.groundY - 14, w: 22, h: 14,
        vx: 0, vy: 0, dir, grounded: true,
        charging: false, charge: 0.04, chargeDirection: 1, chargeHoldTime: 0, chargeFacingDir: dir,
        inputHeld: false, departurePlatform: null, dropThroughPlatform: null,
        landingSquash: 0, bonkLandingPopTimer: 0, blinkTimer: 1.2 + index, blinking: false,
        score: 0, bonked: false, stunTimer: 0, stunCountdownStarted: false,
        bonkStunDuration: CONFIG.pvpBonkMinStunSeconds,
        bonkedByPlayerIndex: null, pendingMaximumBonkDuration: 0,
        collisionCooldown: 0, airTime: 0, jumpStartY: CONFIG.groundY - 14,
        highestY: CONFIG.groundY - 14, lastLaunchPower: 0, firstJumpMade: false,
        landedThisFrame: false, bouncedOffOpponentThisJump: false,
        wentAboveMapThisJump: false, lastStunEndAt: -Infinity,
        bonksThisJump: 0, quickDropThisJump: false, wallBouncedThisJump: false, hasRegisteredFirstJumpBonk: false,
        openingJumpActive: false, lowHopAvoidanceCandidate: false, wasBonkedThisJump: false,
        correctCatchesThisJump: 0, oneJumpCatchEligible: false, oneJumpStartingFlyIds: null, lastOpponentBounceType: null,
        airborneTapPressAt: -Infinity, platformDropBufferUntil: -Infinity, bufferedDropBonkArmed: false,
        cpuHoldChargeTrap: false, cpuTrapIdleTime: 0, cpuTrapBailUntil: -Infinity, cpuSelfBonkBonusUntil: -Infinity,
        lastHumanInputAt: -Infinity, humanInputCount: 0,
        catchSparkleTimer: 0, wrongCatchBubbleTimer: 0,
        afterimages: [], afterimageSampleTimer: 0, jumpStreakTimer: 0,
        tongue: { active: false, elapsed: 0, duration: 0.24, targetFlyId: null, targetX: 0, targetY: 0, captured: false }
      };
    }

    const PVP_START_X = Object.freeze([61, W - 83]);
    const pvpPlayers = [
      createPvpPlayer(0, "azure", PVP_START_X[0], 1),
      createPvpPlayer(1, "crimson", PVP_START_X[1], -1)
    ];

    const SANDBOX_PANEL = Object.freeze({ x: 28, y: 8, w: 424, h: 254 });
    const FROG_SANDBOX_UI = Object.freeze({
      exitButton: Object.freeze({ x: SANDBOX_PANEL.x + SANDBOX_PANEL.w - 30, y: SANDBOX_PANEL.y + 6, w: 20, h: 20 }),
      backButton: Object.freeze({ x: SANDBOX_PANEL.x + SANDBOX_PANEL.w - 30, y: SANDBOX_PANEL.y + 6, w: 20, h: 20 }),
      view: Object.freeze({ x: SANDBOX_PANEL.x + 8, y: SANDBOX_PANEL.y + 42, w: SANDBOX_PANEL.w - 16, h: SANDBOX_PANEL.h - 52 })
    });
    const sandboxFrog = {
      x: 90, y: SANDBOX_GROUND_Y - 14, w: 22, h: 14, vx: 0, vy: 0, dir: 1,
      grounded: true, charging: false, charge: 0.04, chargeDirection: 1,
      landingSquash: 0
    };
    let sandboxActionHeld = false;

    const game = {
      state: "main", // main, setup, custom, achievements, stats, pvpSetup, pvpSettings, soloSettings, title, playing, paused, countdown, won
      mode: "solo", // solo or pvp
      tutorialActive: false,
      tutorialDisplayCatchTarget: null,
      score: 0,
      jumps: 0,
      elapsed: 0,
      finishTime: null,
      worldTime: 0,
      visualTime: 0,
      bestTime: readBestTime("park"),
      spawnQueue: [],
      messageTimer: 0,
      buttonHeld: false,
      airborneTapPressAt: -Infinity,
      platformDropBufferUntil: -Infinity,
      muted: false,
      volume: 1,
      volumeDragging: false,
      volumePointerId: null,
      winPending: false,
      lastWallSound: 0,
      lastFlySpawnIndex: -1,
      lastFlySpawnTime: -Infinity,
      targetVocabIndex: 0,
      promptSerial: 1,
      completedVocabIndices: new Set(),
      countdownNumber: 0,
      countdownTimer: 0,
      selectedLevelId: "park",
      skinId: readFrogSkinId(),
      setupSkinFocusId: null,
      sandboxBackHovered: false,
      timeOfDay: randomTimeOfDay(),
      timeOfDayLock: null,
      moonPhaseIndex: randomMoonPhaseIndex(),
      moonSequenceStarted: false,
      lastStartedLevelId: null,
      lastStartedTimeOfDay: null,
      hoveredLevelId: null,
      timeButtonHovered: false,
      homeTutorialButtonHovered: false,
      homeSettingsButtonHovered: false,
      achievementButtonHovered: false,
      statsButtonHovered: false,
      customizeButtonHovered: false,
      pvpButtonHovered: false,
      randomButtonHovered: false,
      lockedLevelTipId: null,
      lockedLevelTipUntil: 0,
      mainSelection: "solo",
      mainFocusVisible: false,
      mainHoveredSelection: null,
      mainHoveredSoundKey: "",
      homeFocusVisible: false,
      homeSelection: "random",
      soloRandomLevelMode: true,
      soloRandomPreviewLevelId: null,
      soloLastRandomLevelId: null,
      soloEndlessMode: readSoloEndlessMode(),
      soloCatchGoal: readSoloCatchGoal(),
      soloTimeLimitSeconds: readSoloTimeLimit(),
      soloTimeRemaining: 0,
      soloTimedOut: false,
      bufferedDropCatchArmed: false,
      sandboxMode: false,
      sandboxPreviousLevelId: "park",
      sandboxPreviousTimeOfDay: null,
      pauseChargeSnapshot: null,
      resumeChargeAfterCountdown: false,
      soloSettingsFocusIndex: 0,
      victorySelection: "replay",
      victoryHoveredSelection: null,
      victoryPressedSelection: null,
      victoryPointerId: null,
      victoryMouseMode: false,
      pauseSelection: "continue",
      pauseFocusVisible: true,
      pauseHoveredSelection: null,
      pausePressedSelection: null,
      pausePointerId: null,
      pauseHelpOpen: false,
      utilityReturnState: "main",
      winInputLock: 0,
      newBestTime: false,
      newFewestJumps: false,
      newEndlessBest: false,
      bestEndlessFlies: readBestEndlessFlies("park"),
      bestJumps: readFewestJumps("park"),
      totalJumps: readTotalJumpCount(),
      totalFliesEaten: readTotalFlyCount(),
      roundAirTime: 0,
      currentJumpAirTime: 0,
      currentJumpCorrectCatches: 0,
      currentJumpLastCorrectCatchAt: null,
      currentJumpWentAboveMap: false,
      jumpAchievementActive: false,
      roundPlumQualified: false,
      roundForestQualified: false,
      roundBlossomQualified: false,
      currentJumpPower: 0,
      currentJumpMaxPowerQualified: false,
      bonusFlyCaught: false,
      bonusFlyCount: 0,
      roundUnlockedSkinIds: [],
      roundUnlockedHatIds: [],
      roundUnlockedLevelId: null,
      roundUnlockedAchievementIds: [],
      roundUnlockedPvpAchievementIds: [],
      roundLeaderboardRecordNotices: [],
      roundTimeSelectUnlocked: false,
      roundCustomColorUnlocked: false,
      victoryMessage: "",
      achievementToastSkinId: null,
      achievementToastAchievementId: null,
      achievementToastHatId: null,
      achievementToastPvpPlayerIndex: null,
      achievementToastText: "",
      achievementToastTimer: 0,
      achievementToastKey: "",
      achievementToastQueue: [],
      cheatBuffer: "",
      cheatToastTimer: 0,
      cheatToastText: "",
      achievementSelectionIndex: 0,
      achievementHoveredIndex: null,
      achievementFocusIndex: 0,
      achievementFocusArea: "item",
      achievementPage: 0,
      victoryNoticePage: 0,
      victoryAchievementHoverId: null,
      victoryNoticeHoverKey: null,
      statsFocusArea: "back",
      statsPage: 0,
      currentJumpDistancePx: 0,
      customFocusArea: "body",
      customPart: "body",
      customDraftBody: customFrogColors.body,
      customDraftBelly: customFrogColors.belly,
      customDraftAccents: customFrogColors.accents,
      customHatId: getCustomHatIdForSlot(activeCustomFrogSlotIndex),
      customHatOpen: false,
      customHatFocusIndex: 0,
      customHatHoveredIndex: null,
      customHatPage: 0,
      customHatPageHovered: null,
      customHatSearchOpen: false,
      customHatSearchQuery: "",
      customHatSearchNoMatch: false,
      customHatRemoveAllHovered: false,
      customHatTipTimer: 0,
      hatTargetSkinId: null,
      customDraggingChannel: null,
      customPointerId: null,
      customEditingChannel: null,
      customUndoStack: [],
      customRedoStack: [],
      customHistoryTransaction: null,
      customLockedSlotIndex: null,
      customHoveredSlotIndex: null,
      ignoreHomeDoubleClickUntil: 0,
      pvpWinnerIndex: null,
      pvpWinPendingIndex: null,
      pvpElapsed: 0,
      pvpFinalDisplayTime: null,
      pvpSetupLevelId: "park",
      pvpRandomPreviewLevelId: "park",
      pvpLastRandomLevelId: null,
      pvpSetupSkinIds: ["azure", "crimson"],
      pvpSetupFocusArea: "level",
      pvpSetupLevelIndex: 0,
      pvpSetupPlayerIndex: 0,
      pvpSetupSkinIndex: [0, 1],
      pvpSetupBottomSelection: "start",
      pvpSetupConflictOwnerIndex: 1,
      pvpRoundWins: [0, 0],
      pvpRoundNumber: 1,
      pvpRoundAwardedToken: null,
      pvpMatchWinnerIndex: null,
      pvpMatchAchievementContext: null,
      pvpBonusEligible: false,
      pvpBestOf: 3,
      pvpFirstTo: 5,
      pvpTimeLimitSeconds: 60,
      pvpRoundGoalMode: "endless",
      pvpCpuEnabled: true,
      pvpCpuDifficulty: 5,
      pvpTimeRemaining: 0,
      pvpTimedOutcomePending: false,
      pvpTimerGraceActive: false,
      pvpTimerGraceEligible: [false, false],
      pvpTimerGracePromptSerial: -1,
      pvpLastUrgentSecond: null,
      pvpSuddenDeath: false,
      pvpSuddenDeathScores: [0, 0],
      pvpPreservedCharges: [null, null],
      pvpBonkCounts: [0, 0],
      pvpRoundBonkCounts: [0, 0],
      pvpMatchBonkCounts: [0, 0],
      pvpSelfBonkCounts: [0, 0],
      pvpImpactEffects: [],
      pvpCpuPlan: null,
      pvpCpuDecisionTimer: 0,
      pvpCpuEvasionCooldownFrames: 0,
      pvpSetupHoveredKey: "",
      pvpSetupMouseMode: false,
      pvpSettingsFocusIndex: 0,
      pvpCelebrationTimer: 0,
      pvpCelebrationWinnerIndex: null,
      pvpTimeButtonHovered: false,
      pvpSettingsButtonHovered: false,
      pvpWifiButtonHovered: false,
      pvpTutorialButtonHovered: false,
      pvpVictoryHoveredSelection: null,
      pvpVictoryPressedSelection: null,
      pvpVictoryPointerId: null,
      pvpVictoryMouseMode: false,
      pvpVictoryAchievementHoverId: null,
      pvpVictoryAchievementPage: 0,
      pvpTimeExpiredAt: null,
      pvpUnpauseCountdown: readPvpUnpauseCountdown(),
      soloLastUrgentSecond: null,
      soloCriticalCatchActive: false,
      soloCriticalCatchElapsed: 0,
      soloCriticalCatchDuration: 2.0,
      soloCriticalCatchX: W / 2,
      soloCriticalCatchY: CONFIG.groundY / 2,
      soloCriticalCatchScreenX: W / 2,
      soloCriticalCatchScreenY: CONFIG.playBottom / 2,
      pvpSuddenDeathAlertTimer: 0,
      pvpPauseChargeSnapshot: null,
      pvpCriticalCatchActive: false,
      pvpCriticalCatchKind: "",
      pvpCriticalCatchElapsed: 0,
      pvpCriticalCatchDuration: 2.0,
      pvpCriticalCatchX: W / 2,
      pvpCriticalCatchY: CONFIG.groundY / 2,
      pvpCriticalCatchScreenX: W / 2,
      pvpCriticalCatchScreenY: CONFIG.playBottom / 2,
      pvpCriticalCatchWinnerIndex: null,
      onlineMode: false,
      onlineRole: null
    };


    const sandboxPreview = {mode:"play",next:"win",flySlots:[],savedPose:null,spawnCycle:0};
    function resetSandboxTestFlies() {
      sandboxPreview.mode="play";sandboxPreview.next="win";sandboxPreview.savedPose=null;sandboxPreview.spawnCycle=0;
      sandboxPreview.flySlots=[{x:112,y:194},{x:168,y:104},{x:318,y:106},{x:393,y:147}].map(p=>({...p,due:0}));
      refillSandboxTestFlies();
    }
    function refillSandboxTestFlies() {
      if(!game.sandboxMode)return;
      sandboxPreview.flySlots.forEach((p,i)=>{
        if(game.elapsed<p.due||flies.some(f=>f.sandboxSlot===i))return;
        flies.push({id:nextFlyId++,sandboxTest:true,sandboxSlot:i,baseX:p.x,baseY:p.y,x:p.x,y:p.y,
          phase:i*1.2,spawnAge:0,vocabIndex:-1,state:"active",touchLocked:false,blockedPromptSerial:-1});
      });
    }
    function catchSandboxFly(f) {
      const index=flies.indexOf(f);if(index<0)return;
      flies.splice(index,1);
      const sourceSlot=sandboxPreview.flySlots[f.sandboxSlot];
      if(sourceSlot) sourceSlot.due=game.elapsed+99;
      const presets=[{x:112,y:194},{x:168,y:104},{x:318,y:106},{x:393,y:147},{x:240,y:66},{x:88,y:143},{x:390,y:106},{x:240,y:157}];
      const occupiedKeys=new Set(flies.map(v=>`${Math.round(v.baseX)}:${Math.round(v.baseY)}`));
      let options=presets.filter(p=>!occupiedKeys.has(`${p.x}:${p.y}`));
      if(!options.length) options=presets.slice();
      const choice=options[Math.floor(Math.random()*options.length)]||presets[0];
      if(sourceSlot){sourceSlot.x=choice.x;sourceSlot.y=choice.y;sourceSlot.due=game.elapsed+Number(CONFIG.flyRespawnDelay || 2.0);}
      frog.catchSparkleTimer=CONFIG.catchSparkleDuration;
      playCorrectFlySound();
    }
    function updateSandboxFlyTest(dt) {
      refillSandboxTestFlies();animateFlies(dt);
      if(tongue.active)return;
      const touched=flies.find(f=>frogTouchesFly(f));if(touched){catchSandboxFly(touched);return;}
      const mouth=getFrogMouth();
      const candidates=flies.filter(f=>(f.baseX-mouth.x)*frog.dir>=0&&Math.abs(f.baseX-mouth.x)<=CONFIG.tongueReach&&Math.abs(f.baseY-mouth.y)<=CONFIG.tongueVerticalTolerance);
      candidates.sort((a,b)=>Math.hypot(a.baseX-mouth.x,a.baseY-mouth.y)-Math.hypot(b.baseX-mouth.x,b.baseY-mouth.y));
      const f=candidates[0];if(!f)return;
      Object.assign(tongue,{active:true,elapsed:0,targetFlyId:f.id,targetX:f.baseX,targetY:f.baseY,captured:false,chainNextFlyId:null});
      tone(330,.05,.012,80);
    }
    function updateSandboxTongueTest(dt) {
      if(!tongue.active)return;
      tongue.elapsed+=dt;
      if(!tongue.captured&&tongue.elapsed>=tongue.duration*.46){
        tongue.captured=true;const f=flies.find(v=>v.id===tongue.targetFlyId);if(f)catchSandboxFly(f);
      }
      if(tongue.elapsed>=tongue.duration){tongue.active=false;tongue.targetFlyId=null;}
    }
    function cycleSandboxAnimation() {
      if(!game.sandboxMode)return;
      if(sandboxPreview.mode==="play"){
        sandboxPreview.savedPose={x:frog.x,y:frog.y,dir:frog.dir};
        sandboxPreview.mode="win";
      }else if(sandboxPreview.mode==="win")sandboxPreview.mode="lose";
      else {sandboxPreview.mode="play";if(sandboxPreview.savedPose)Object.assign(frog,sandboxPreview.savedPose);}
      game.buttonHeld=false;frog.charging=false;tongue.active=false;clearSoloPhysicalInputState(false);
      tone(410,.04,.009,60);
    }
    function drawSandboxAnimationPreview() {
      if(!game.sandboxMode||sandboxPreview.mode==="play")return false;
      const p={...frog,index:0,skinId:game.skinId};
      const x=clamp(frog.x+frog.w/2,32,W-32);
      const ground=Math.min(CONFIG.groundY,Math.max(42,frog.y+frog.h));
      if(sandboxPreview.mode==="win")drawPvpVictoryDanceFrogExact(x,ground,p,1);
      else drawPvpGameplaySadFrog(x,ground,p,1);
      return true;
    }
    document.addEventListener("keydown",event=>{
      if(friendsGameInputLocked()) return;
      if(game.sandboxMode&&sandboxPreview.mode!=="play"&&["Space","KeyW","ArrowUp","KeyZ"].includes(event.code)){
        event.preventDefault();event.stopImmediatePropagation();return;
      }
      if(!game.sandboxMode||!["ShiftLeft","ShiftRight"].includes(event.code))return;
      event.preventDefault();event.stopImmediatePropagation();
      // Shift previews are a grounded Sandbox tool. Airborne presses remain
      // ordinary player fidgets and cannot interrupt the active jump.
      if(!frog.grounded || frog.vy !== 0) return;
      if(!event.repeat)cycleSandboxAnimation();
    },{capture:true,passive:false});
    document.addEventListener("keyup",event=>{
      if(friendsGameInputLocked()) return;
      if(game.sandboxMode&&["ShiftLeft","ShiftRight"].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();}
    },{capture:true,passive:false});
