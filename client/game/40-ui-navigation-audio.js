    window.RibbitRaceOpenOnlineVersus = () => OnlineVersus.open();
    window.RibbitRaceOnlineDiagnostics = () => OnlineVersus.diagnostic();

    function isVocabularyRoundActive() {
      return ["playing", "countdown", "paused", "pvpCelebration", "won"].includes(game.state);
    }

    function applyVocabularyEntries(entries, deferIfActive = true) {
      const normalized = normalizeVocabularyEntries(entries);
      if (deferIfActive && isVocabularyRoundActive()) {
        pendingVocabularyEntries = normalized;
        return false;
      }
      VOCABULARY = normalized;
      pendingVocabularyEntries = null;
      game.completedVocabIndices = new Set();
      game.targetVocabIndex = Math.min(game.targetVocabIndex, VOCABULARY.length - 1);
      return true;
    }

    function applyPendingVocabulary() {
      if (!pendingVocabularyEntries) return false;
      return applyVocabularyEntries(pendingVocabularyEntries, false);
    }

    window.RibbitRaceQueueVocabulary = (entries) => applyVocabularyEntries(entries, true);

    const MAIN_UI = Object.freeze({
      soloButton: Object.freeze({ id: "solo", x: 140, y: 80, w: 200, h: 30 }),
      pvpButton: Object.freeze({ id: "pvp", x: 140, y: 115, w: 200, h: 30 }),
      frogButton: Object.freeze({ id: "frog", x: 140, y: 150, w: 200, h: 30 }),
      profileButton: Object.freeze({ id: "profile", x: 47, y: 211, w: 24, h: 24 }),
      deviceButton: Object.freeze({ id: "device", x: 71, y: 211, w: 24, h: 24 }),
      achievementsButton: Object.freeze({ id: "achievements", x: 385, y: 211, w: 24, h: 24 }),
      statsButton: Object.freeze({ id: "stats", x: 409, y: 211, w: 24, h: 24 })
    });

    const MAIN_SELECTION_GRID = Object.freeze([
      Object.freeze(["solo"]),
      Object.freeze(["pvp"]),
      Object.freeze(["frog"]),
      Object.freeze(["profile", "device", "achievements", "stats"])
    ]);

    const HOME_UI = Object.freeze({
      playButton: Object.freeze({ x: 180, y: 176, w: 120, h: 27 }), // retained for old saves; no longer rendered
      pvpButton: Object.freeze({ x: 288, y: 176, w: 120, h: 27 }), // legacy geometry
      customizeButton: Object.freeze({ x: 72, y: 176, w: 120, h: 27 }), // legacy geometry
      randomButton: Object.freeze({ id: "random", x: 188, y: 154, w: 104, h: 17 }),
      backButton: Object.freeze({ id: "back", x: 180, y: 181, w: 120, h: 24 }),
      settingsButton: Object.freeze({ id: "settings", x: 358, y: 211, w: 24, h: 24 }),
      tutorialButton: Object.freeze({ id: "tutorial", x: 382, y: 211, w: 24, h: 24 }),
      levelButtons: Object.freeze([
        Object.freeze({ id: "park",   x: 72,  y: 101, w: 104, h: 21 }),
        Object.freeze({ id: "swamp",  x: 188, y: 101, w: 104, h: 21 }),
        Object.freeze({ id: "jungle", x: 304, y: 101, w: 104, h: 21 }),
        Object.freeze({ id: "pond",   x: 72,  y: 130, w: 104, h: 21 }),
        Object.freeze({ id: "lake",   x: 188, y: 130, w: 104, h: 21 }),
        Object.freeze({ id: "garden", x: 304, y: 130, w: 104, h: 21 })
      ]),
      timeButton: Object.freeze({ x: 406, y: 211, w: 24, h: 24 })
    });

    const SOLO_SETTINGS_UI = Object.freeze({
      endlessRow: Object.freeze({ x: 94, y: 78, w: 292, h: 30 }),
      catchGoalRow: Object.freeze({ x: 94, y: 115, w: 292, h: 30 }),
      timeLimitRow: Object.freeze({ x: 94, y: 152, w: 292, h: 30 }),
      backButton: Object.freeze({ x: 172, y: 211, w: 136, h: 24 })
    });

    const HOME_SELECTION_GRID = Object.freeze([
      Object.freeze(["park", "swamp", "jungle"]),
      Object.freeze(["pond", "lake", "garden"]),
      Object.freeze(["random"]),
      Object.freeze(["back", "settings", "tutorial", "time"])
    ]);

    const SETUP_UI = Object.freeze({
      backButton: Object.freeze({ x: 174, y: 211, w: 132, h: 25 }),
      sandboxButton: Object.freeze({ id: "sandbox", x: 355, y: 211, w: 24, h: 24 }),
      customButton: Object.freeze({ id: "custom", x: 382, y: 211, w: 24, h: 24 }),
      hatButton: Object.freeze({ id: "hat", x: 409, y: 211, w: 24, h: 24 }),
      skinButtons: Object.freeze([
        Object.freeze({ id: "azure",   x: 42,  y: 136, w: 91, h: 25 }),
        Object.freeze({ id: "crimson", x: 143, y: 136, w: 91, h: 25 }),
        Object.freeze({ id: "plum",    x: 244, y: 136, w: 91, h: 25 }),
        Object.freeze({ id: "forest",  x: 345, y: 136, w: 91, h: 25 }),
        Object.freeze({ id: "violet",  x: 42,  y: 170, w: 91, h: 25 }),
        Object.freeze({ id: "silver",  x: 143, y: 170, w: 91, h: 25 }),
        Object.freeze({ id: "blossom", x: 244, y: 170, w: 91, h: 25 }),
        Object.freeze({ id: "ember",   x: 345, y: 170, w: 91, h: 25 })
      ])
    });

    const CUSTOM_UI = Object.freeze({
      // The editor mirrors the main Frog Color screen: a large live frog preview
      // stays on the left while color controls remain grouped on the right.
      preview: Object.freeze({ x: 44, y: 52, w: 146, h: 148 }),
      slotButtons: Object.freeze([
        Object.freeze({ index: 0, x: 51, y: 170, w: 38, h: 27 }),
        Object.freeze({ index: 1, x: 98, y: 170, w: 38, h: 27 }),
        Object.freeze({ index: 2, x: 145, y: 170, w: 38, h: 27 })
      ]),
      partButtons: Object.freeze([
        Object.freeze({ id: "body", label: "BODY", x: 202, y: 58, w: 68, h: 24 }),
        Object.freeze({ id: "belly", label: "BELLY", x: 276, y: 58, w: 68, h: 24 }),
        Object.freeze({ id: "accents", label: "ACCENTS", x: 350, y: 58, w: 78, h: 24 })
      ]),
      sliders: Object.freeze([
        Object.freeze({ channel: "r", label: "R", x: 239, y: 110, w: 142, h: 8, hitX: 216, hitY: 100, hitW: 211, hitH: 24 }),
        Object.freeze({ channel: "g", label: "G", x: 239, y: 145, w: 142, h: 8, hitX: 216, hitY: 135, hitW: 211, hitH: 24 }),
        Object.freeze({ channel: "b", label: "B", x: 239, y: 180, w: 142, h: 8, hitX: 216, hitY: 170, hitW: 211, hitH: 24 })
      ]),
      useButton: Object.freeze({ x: 46, y: 219, w: 118, h: 24 }),
      backButton: Object.freeze({ x: 172, y: 219, w: 92, h: 24 }),
      undoButton: Object.freeze({ x: 274, y: 219, w: 36, h: 24 }),
      redoButton: Object.freeze({ x: 318, y: 219, w: 36, h: 24 })
    });

    const ACHIEVEMENT_UI = Object.freeze({
      backButton: Object.freeze({ x: 185, y: 232, w: 110, h: 22 }),
      cardColumns: 5,
      cardWidth: 84,
      cardHeight: 29,
      cardGapX: 7,
      cardGapY: 7,
      startX: 16,
      startY: 118
    });

    const HUD_UI = Object.freeze({
      pauseButton: Object.freeze({ x: W - 34, y: 7, w: 26, h: 19 })
    });

    const PAUSE_UI = Object.freeze({
      muteButton: { x: 94, y: 132, w: 110, h: 18 },
      sliderTrack: { x: 285, y: 137, w: 90, h: 8 },
      sliderHit: { x: 264, y: 128, w: 121, h: 28 },
      continueButton: { x: 105, y: 163, w: 130, h: 20 },
      restartButton: { x: 245, y: 163, w: 130, h: 20 },
      homeButton: { x: 176, y: 190, w: 128, h: 20 },
      helpButton: { x: 353, y: 198, w: 20, h: 20 },
      helpCloseButton: { x: 366, y: 73, w: 19, h: 19 }
    });

    const VICTORY_UI = Object.freeze({
      replayButton: Object.freeze({ x: 126, y: 235, w: 98, h: 22 }),
      homeButton: Object.freeze({ x: 257, y: 235, w: 98, h: 22 }),
      pagePrevButton: Object.freeze({ x: 359, y: 235, w: 20, h: 20 }),
      pageNextButton: Object.freeze({ x: 415, y: 235, w: 20, h: 20 })
    });



    const PVP_SETUP_UI = Object.freeze({
      levelButtons: Object.freeze([
        Object.freeze({ id: "park",   x: 72,  y: 78,  w: 104, h: 21 }),
        Object.freeze({ id: "swamp",  x: 188, y: 78,  w: 104, h: 21 }),
        Object.freeze({ id: "jungle", x: 304, y: 78,  w: 104, h: 21 }),
        Object.freeze({ id: "pond",   x: 72,  y: 105, w: 104, h: 21 }),
        Object.freeze({ id: "lake",   x: 188, y: 105, w: 104, h: 21 }),
        Object.freeze({ id: "garden", x: 304, y: 105, w: 104, h: 21 }),
        Object.freeze({ id: "random", x: 188, y: 132, w: 104, h: 21 })
      ]),
      playerOneSkinButtons: Object.freeze([Object.freeze({ id: "p1", x: 112, y: 160, w: 84, h: 48 })]),
      playerTwoSkinButtons: Object.freeze([Object.freeze({ id: "p2", x: 284, y: 160, w: 84, h: 48 })]),
      p1Selector: Object.freeze({ x: 112, y: 160, w: 84, h: 48 }),
      p2Selector: Object.freeze({ x: 284, y: 160, w: 84, h: 48 }),
      vsButton: Object.freeze({ x: 223, y: 174, w: 34, h: 21 }),
      cpuDifficultyButton: Object.freeze({ x: 284, y: 210, w: 84, h: 15 }),
      wifiButton: Object.freeze({ x: 34, y: 225, w: 24, h: 24 }),
      tutorialButton: Object.freeze({ x: 58, y: 225, w: 24, h: 24 }),
      startButton: Object.freeze({ x: 132, y: 228, w: 100, h: 23 }),
      backButton: Object.freeze({ x: 248, y: 228, w: 100, h: 23 }),
      settingsButton: Object.freeze({ x: 398, y: 225, w: 24, h: 24 }),
      timeButton: Object.freeze({ x: 422, y: 225, w: 24, h: 24 })
    });

    const PVP_SETTINGS_UI = Object.freeze({
      rows: Object.freeze([
        Object.freeze({ id: "time", x: 91, y: 78, w: 298, h: 26 }),
        Object.freeze({ id: "roundGoal", x: 91, y: 109, w: 298, h: 26 }),
        Object.freeze({ id: "bestOf", x: 91, y: 140, w: 298, h: 26 }),
        Object.freeze({ id: "unpause", x: 91, y: 171, w: 298, h: 26 })
      ]),
      backButton: Object.freeze({ x: 190, y: 218, w: 100, h: 20 })
    });

    const ACHIEVEMENTS_UI = Object.freeze({
      backButton: Object.freeze({ x: 180, y: 238, w: 120, h: 20 }),
      pagePrevButton: Object.freeze({ x: 344, y: 232, w: 20, h: 20 }),
      pageNextButton: Object.freeze({ x: 370, y: 232, w: 20, h: 20 }),
      columns: 3,
      startX: 34,
      startY: 101,
      buttonW: 132,
      buttonH: 21,
      gapX: 9,
      gapY: 5
    });

    const STATS_UI = Object.freeze({
      backButton: Object.freeze({ x: 180, y: 238, w: 120, h: 20 }),
      pagePrevButton: Object.freeze({ x: 401, y: 232, w: 20, h: 20 }),
      pageNextButton: Object.freeze({ x: 427, y: 232, w: 20, h: 20 }),
      columns: 2,
      itemsPerPage: 10,
      startX: 45,
      startY: 66,
      cardW: 188,
      cardH: 27,
      gapX: 14,
      gapY: 5
    });

    function getStatsPageCount() {
      return Math.max(1, Math.ceil(getStatsMetrics().length / STATS_UI.itemsPerPage));
    }

    function setStatsPage(page, playFeedback = true) {
      const count = getStatsPageCount();
      const next = ((Math.floor(Number(page) || 0) % count) + count) % count;
      if (next === game.statsPage) return false;
      game.statsPage = next;
      if (playFeedback) tone(next > 0 ? 505 : 390, 0.035, 0.008, next > 0 ? 25 : -25);
      return true;
    }

    function getStatsPageButtonHitRect(rect) {
      return { x: rect.x - 3, y: rect.y - 3, w: rect.w + 6, h: rect.h + 6 };
    }

    function getAvailableStatsFocusAreas() {
      const areas = ["back"];
      if (getStatsPageCount() > 1) areas.push("pagePrev", "pageNext");
      return areas;
    }

    function moveStatsFocus(direction) {
      const areas = getAvailableStatsFocusAreas();
      let index = Math.max(0, areas.indexOf(game.statsFocusArea));
      index = (index + direction + areas.length) % areas.length;
      game.statsFocusArea = areas[index];
      tone(game.statsFocusArea === "back" ? 340 : 480, 0.035, 0.008, direction > 0 ? 20 : -20);
    }

    function activateStatsSelection() {
      if (game.statsFocusArea === "pagePrev") {
        setStatsPage(game.statsPage - 1);
      } else if (game.statsFocusArea === "pageNext") {
        setStatsPage(game.statsPage + 1);
      } else {
        closeStatsMenu();
      }
    }

    function getAchievementPageCount() {
      return Math.max(1, Math.ceil(MENU_ACHIEVEMENT_DEFINITIONS.length / CONFIG.achievementItemsPerPage));
    }

    function getAchievementPageStart(page = game.achievementPage) {
      return clamp(page, 0, getAchievementPageCount() - 1) * CONFIG.achievementItemsPerPage;
    }

    function getAchievementIndicesOnPage(page = game.achievementPage) {
      const start = getAchievementPageStart(page);
      return MENU_ACHIEVEMENT_DEFINITIONS
        .slice(start, start + CONFIG.achievementItemsPerPage)
        .map((_, localIndex) => start + localIndex);
    }

    function getAchievementButtonRect(index) {
      const pageStart = getAchievementPageStart();
      const localIndex = index - pageStart;
      if (localIndex < 0 || localIndex >= CONFIG.achievementItemsPerPage) {
        return { x: -1000, y: -1000, w: 0, h: 0 };
      }
      const column = localIndex % ACHIEVEMENTS_UI.columns;
      const row = Math.floor(localIndex / ACHIEVEMENTS_UI.columns);
      return {
        x: ACHIEVEMENTS_UI.startX + column * (ACHIEVEMENTS_UI.buttonW + ACHIEVEMENTS_UI.gapX),
        y: ACHIEVEMENTS_UI.startY + row * (ACHIEVEMENTS_UI.buttonH + ACHIEVEMENTS_UI.gapY),
        w: ACHIEVEMENTS_UI.buttonW,
        h: ACHIEVEMENTS_UI.buttonH
      };
    }

    function getAchievementGridRect(page = game.achievementPage) {
      const indices = getAchievementIndicesOnPage(page);
      const rows = Math.max(1, Math.ceil(indices.length / ACHIEVEMENTS_UI.columns));
      return {
        x: ACHIEVEMENTS_UI.startX,
        y: ACHIEVEMENTS_UI.startY,
        w: ACHIEVEMENTS_UI.columns * ACHIEVEMENTS_UI.buttonW + (ACHIEVEMENTS_UI.columns - 1) * ACHIEVEMENTS_UI.gapX,
        h: rows * ACHIEVEMENTS_UI.buttonH + Math.max(0, rows - 1) * ACHIEVEMENTS_UI.gapY
      };
    }

    function getAchievementHoverIndexFromPoint(point) {
      const indices = getAchievementIndicesOnPage();
      if (!indices.length) return null;
      let best = null;
      let bestDistance = Infinity;
      for (const index of indices) {
        const rect = getAchievementButtonRect(index);
        const expanded = {
          x: rect.x - ACHIEVEMENTS_UI.gapX / 2,
          y: rect.y - ACHIEVEMENTS_UI.gapY / 2,
          w: rect.w + ACHIEVEMENTS_UI.gapX,
          h: rect.h + ACHIEVEMENTS_UI.gapY
        };
        if (!pointInsideRect(point, expanded)) continue;
        const dx = point.x - (rect.x + rect.w / 2);
        const dy = point.y - (rect.y + rect.h / 2);
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) { bestDistance = distance; best = index; }
      }
      return best;
    }

    function getAchievementPageButtonHitRect(buttonRect) {
      return { x: buttonRect.x - 8, y: buttonRect.y - 6, w: buttonRect.w + 16, h: buttonRect.h + 12 };
    }

    function setAchievementPage(page, playFeedback = true) {
      const count = getAchievementPageCount();
      const next = ((Math.round(Number(page) || 0) % count) + count) % count;
      if (next === game.achievementPage) return false;
      const direction = next > game.achievementPage ? 1 : -1;
      game.achievementPage = next;
      const indices = getAchievementIndicesOnPage(next);
      game.achievementFocusArea = "item";
      game.achievementFocusIndex = indices[0] ?? 0;
      game.achievementHoveredIndex = null;
      if (playFeedback) tone(direction > 0 ? 610 : 420, 0.045, 0.010, direction > 0 ? 45 : -35);
      return true;
    }

    function getAchievementToastKey(entry) {
      if (!entry) return "";
      if (entry.type === "frog") return `frog:${entry.skinId || ""}`;
      if (entry.type === "achievement") return `achievement:${entry.achievementId || ""}`;
      if (entry.type === "hat") return `hat:${entry.hatId || ""}`;
      return `generic:${entry.text || ""}`;
    }

    function startNextAchievementToast() {
      if (game.achievementToastTimer > 0 || !game.achievementToastQueue.length) return;
      const entry = game.achievementToastQueue.shift();
      game.achievementToastSkinId = entry.type === "frog" ? entry.skinId : null;
      game.achievementToastAchievementId = entry.type === "achievement" ? entry.achievementId : null;
      game.achievementToastHatId = entry.type === "hat" ? entry.hatId : null;
      game.achievementToastPvpPlayerIndex = entry.type === "achievement" && Number.isInteger(entry.pvpPlayerIndex)
        ? entry.pvpPlayerIndex
        : null;
      game.achievementToastText = entry.type === "generic" ? entry.text : "";
      game.achievementToastKey = getAchievementToastKey(entry);
      game.achievementToastTimer = CONFIG.achievementToastDuration;
    }

    function queueAchievementToast(entry) {
      const key = getAchievementToastKey(entry);
      if (!key || key === game.achievementToastKey) return;
      if (game.achievementToastQueue.some((queued) => getAchievementToastKey(queued) === key)) return;
      game.achievementToastQueue.push(entry);
      startNextAchievementToast();
    }

    window.RibbitRaceQueueLeaderboardRecordNotification = (record) => {
      if (!record) return;
      const metricLabel = record.metric === "flies" ? "TOTAL FLIES" : record.metric === "endless" ? "ENDLESS FLIES" : record.metric === "pvpwins" ? "PVP WINS" : record.metric === "time" ? "TIME" : "JUMPS";
      const levelLabel = record.level && record.level !== "all" ? `${String(record.level).toUpperCase()} ` : "";
      const key = `${record.scope || "school"}:${record.metric || ""}:${record.level || "all"}:${record.score || ""}`;
      if (game.mode === "solo" && game.state === "won") {
        if (!(game.roundLeaderboardRecordNotices || []).some((item) => item.key === key)) {
          game.roundLeaderboardRecordNotices.push({ ...record, key });
          const layout = getVictoryUnlockNoticeLayout();
          if (layout) game.victoryNoticePage = Math.max(0, layout.pageCount - 1);
        }
      } else {
        const scopeText = record.scope === "class" ? `${record.scopeLabel || "CLASS"} LEADER` : (window.RibbitWorldRecordNotice?.prepare?.() ?? "WORLD RECORD");
        queueAchievementToast({ type: "generic", text: `${scopeText}: ${levelLabel}${metricLabel}` });
      }
      tone(784, 0.09, 0.021, 95);
      tone(1047, 0.12, 0.017, 120, 0.075);
    };

    let audioContext = null;
    let lastFrameTime = performance.now();
    let accumulator = 0;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }
    function roundedDisplayTime(seconds) {
      const value = Number(seconds);
      if (!Number.isFinite(value)) return Infinity;
      return Number(value.toFixed(1));
    }

    function timeAtOrUnder(seconds, limit) {
      return roundedDisplayTime(seconds) <= limit;
    }

    function lerp(a, b, amount) {
      return a + (b - a) * amount;
    }

    function easeOutCubic(value) {
      return 1 - Math.pow(1 - value, 3);
    }
    function getDisplayedTimeValue(seconds) {
      return roundedDisplayTime(seconds);
    }

    function timeUnder(seconds, limit) {
      return getDisplayedTimeValue(seconds) < limit;
    }

    function getSelectedSkin() {
      if (game.skinId === "custom" && isCustomColorUnlocked()) return getCustomFrogSkin();
      return getDisplaySkinById(game.skinId, "azure");
    }

    function getSetupFocusedSkin() {
      if (game.setupSkinFocusId === "custom") return getCustomFrogSkin();
      if (["back", "hat", "sandbox"].includes(game.setupSkinFocusId)) return getSelectedSkin();
      return getDisplaySkinById(game.setupSkinFocusId, game.skinId || "azure");
    }

    function playLockedSkinSound() {
      tone(210, 0.07, 0.018, -60);
      tone(130, 0.09, 0.014, -35, 0.055);
    }

    function playFrogSelectedSound() {
      tone(523, 0.055, 0.016, 70);
      tone(784, 0.075, 0.013, 95, 0.045);
    }

    function drawMiniCheckmark(x, y, color = "#ffffff") {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y + 3), 2, 2);
      ctx.fillRect(Math.round(x + 2), Math.round(y + 5), 2, 2);
      ctx.fillRect(Math.round(x + 4), Math.round(y + 3), 2, 2);
      ctx.fillRect(Math.round(x + 6), Math.round(y + 1), 2, 2);
    }

    function selectFrogSkin(id, playFeedback = true) {
      const custom = id === "custom";
      if ((custom && !isCustomColorUnlocked()) || (!custom && (!FROG_SKINS[id] || !isFrogSkinUnlocked(id)))) {
        if (playFeedback) playLockedSkinSound();
        return false;
      }
      const changed = game.skinId !== id;
      game.skinId = id;
      game.setupSkinFocusId = id;
      game.hatTargetSkinId = normalizeHatTargetSkinId(id, "azure");
      game.customHatId = getHatForFrogSkinId(game.hatTargetSkinId);
      equippedFrogHatId = game.customHatId;
      saveFrogSkinId(id);
      saveFrogHatAssignments();
      if (playFeedback) playFrogSelectedSound();
      return true;
    }

    function focusSetupSkin(id, playFeedback = true) {
      if (id === "back" || id === "hat" || id === "sandbox") {
        const changed = game.setupSkinFocusId !== id;
        game.setupSkinFocusId = id;
        if (changed && playFeedback) tone(330, 0.045, 0.010, -35);
        return;
      }
      if (id === "custom") {
        const changed = game.setupSkinFocusId !== id;
        game.setupSkinFocusId = id;
        if (changed && playFeedback) {
          if (isCustomColorUnlocked()) tone(390, 0.05, 0.012, 70);
          else playLockedSkinSound();
        }
        return;
      }
      if (!FROG_SKINS[id]) return;
      const changed = game.setupSkinFocusId !== id;
      game.setupSkinFocusId = id;
      // Keyboard navigation previews colors without equipping them. This lets
      // players scroll to Back to Levels and leave with their prior skin intact.
      if (changed && playFeedback) {
        if (isFrogSkinUnlocked(id)) tone(390, 0.05, 0.012, 70);
        else playLockedSkinSound();
      }
    }

    function moveSetupSkin(columnDelta = 0, rowDelta = 0) {
      const focusId = game.setupSkinFocusId || game.skinId;
      const bottomActions = ["back", "sandbox", "custom", "hat"];
      if (bottomActions.includes(focusId)) {
        if (columnDelta) {
          const index = bottomActions.indexOf(focusId);
          focusSetupSkin(bottomActions[(index + columnDelta + bottomActions.length) % bottomActions.length]);
        }
        if (rowDelta < 0) {
          const target = focusId === "hat" ? "ember" : focusId === "custom" ? "blossom" : focusId === "sandbox" ? "violet" : "silver";
          focusSetupSkin(target);
        } else if (rowDelta > 0) {
          const target = focusId === "hat" ? "forest" : focusId === "custom" ? "plum" : focusId === "sandbox" ? "crimson" : "azure";
          focusSetupSkin(target);
        }
        return;
      }

      const columns = 4;
      const currentIndex = Math.max(0, FROG_SKIN_ORDER.indexOf(focusId));
      const currentColumn = currentIndex % columns;
      const currentRow = Math.floor(currentIndex / columns);
      if (rowDelta > 0 && currentRow === 1) {
        focusSetupSkin(currentColumn === 3 ? "hat" : currentColumn === 2 ? "custom" : currentColumn === 1 ? "sandbox" : "back");
        return;
      }
      if (rowDelta < 0 && currentRow === 0) {
        focusSetupSkin(currentColumn === 3 ? "hat" : currentColumn === 2 ? "custom" : currentColumn === 1 ? "sandbox" : "back");
        return;
      }
      const nextColumn = (currentColumn + columnDelta + columns) % columns;
      const nextRow = (currentRow + rowDelta + 2) % 2;
      focusSetupSkin(FROG_SKIN_ORDER[nextRow * columns + nextColumn]);
    }

    function unlockAllFrogSkinsByCheat() {
      cheatUnlockAllActive = true;
      for (const id of FROG_SKIN_ORDER) unlockedFrogSkinIds.add(id);
      saveUnlockedFrogSkinIds();
      for (const id of ACHIEVEMENT_ID_SET) earnedAchievementIds.add(id);
      saveEarnedAchievementIds();
      for (const id of PVP_ACHIEVEMENT_ID_SET) earnedPvpAchievementIds.add(id);
      saveEarnedPvpAchievementIds();
      timeSelectUnlocked = true;
      customColorUnlocked = true;
      try {
        localStorage.setItem("ribbitRaceCheatUnlockAll", "1");
        localStorage.setItem("ribbitRaceTimeSelectUnlocked", "1");
        localStorage.setItem("ribbitRaceCustomColorUnlocked", "1");
        localStorage.setItem(
          "ribbitRaceAchievementRulesVersion",
          String(FROG_ACHIEVEMENT_RULES_VERSION)
        );
      } catch (_) {
        // The cheat still applies to the current session if storage is blocked.
      }
      game.cheatBuffer = "";
      game.cheatToastText = "EVERYTHING UNLOCKED!";
      game.cheatToastTimer = CONFIG.achievementToastDuration;
      tone(523, 0.08, 0.022, 110);
      tone(784, 0.10, 0.019, 130, 0.070);
      tone(1047, 0.14, 0.016, 95, 0.150);
    }

    function restoreSetContents(targetSet, values) {
      targetSet.clear();
      for (const value of values || []) targetSet.add(value);
    }

    function refreshRuntimeProgressFromStorage() {
      const savedUnlocked = readUnlockedFrogSkinIds();
      restoreSetContents(unlockedFrogSkinIds, savedUnlocked);

      cheatUnlockAllActive = (() => {
        try { return localStorage.getItem("ribbitRaceCheatUnlockAll") === "1"; }
        catch (_) { return false; }
      })();
      timeSelectUnlocked = readTimeSelectUnlocked();
      customColorUnlocked = readCustomColorUnlocked();

      statsProfile = readStatsProfile();
      game.totalJumps = readTotalJumpCount();
      game.totalFliesEaten = readTotalFlyCount();

      customFrogSlots = readCustomFrogSlots();
      activeCustomFrogSlotIndex = readActiveCustomSlotIndex();
      customFrogHats = readCustomFrogHats();
      frogHatAssignments = readFrogHatAssignments();
      customFrogColors = { ...customFrogSlots[activeCustomFrogSlotIndex] };
      game.customSlotIndex = activeCustomFrogSlotIndex;
      game.customDraftBody = customFrogColors.body;
      game.customDraftBelly = customFrogColors.belly;
      game.customDraftAccents = customFrogColors.accents;
      game.customHatId = getCustomHatIdForSlot(activeCustomFrogSlotIndex);

      const savedPvpAchievements = readEarnedPvpAchievementIds();
      restoreSetContents(earnedPvpAchievementIds, savedPvpAchievements);
      const savedAchievements = readEarnedAchievementIds();
      restoreSetContents(earnedAchievementIds, savedAchievements);

      game.skinId = readFrogSkinId();
      game.setupSkinFocusId = game.skinId;
      game.bestTime = readBestTime(game.selectedLevelId);
      game.bestJumps = readFewestJumps(game.selectedLevelId);
    }

    window.RibbitRaceRefreshRuntimeFromStorage = () => {
      const safeRefreshStep = (label, action) => {
        try { return action(); }
        catch (error) {
          console.warn(`Ribbit Race cloud refresh skipped: ${label}`, error);
          return null;
        }
      };
      safeRefreshStep("RGB editor", () => hideRgbValueEditor(false));
      safeRefreshStep("PVP input state", () => clearPvpPhysicalShiftState(true));
      safeRefreshStep("solo input state", () => clearSoloPhysicalInputState(true));
      frog.charging = false;
      game.buttonHeld = false;
      safeRefreshStep("progress", () => refreshRuntimeProgressFromStorage());
      safeRefreshStep("equipped hat", () => ensureValidEquippedHat());
      safeRefreshStep("frog achievements", () => evaluateStoredFrogAchievements());
      safeRefreshStep("general achievements", () => evaluateStoredGeneralAchievements());
      safeRefreshStep("custom frog slots", () => evaluateCustomFrogSlotUnlocks(false));
      safeRefreshStep("frog skin", () => selectFrogSkin(readFrogSkinId(), false));
      safeRefreshStep("moving platforms", () => resetMovingPlatforms());
      safeRefreshStep("random preview", () => ensureSoloRandomPreview(true));
      safeRefreshStep("time chrome", () => syncTimeOfDayChrome());
      safeRefreshStep("main menu", () => openMainMenu(false));
      safeRefreshStep("canvas draw", () => drawScene());
      safeRefreshStep("canvas focus", () => canvas.focus());
    };

    function togglePlaytestMode() {
      if (!playtestModeActive) {
        playtestSnapshot = {
          saveData: RibbitCloud.beginPlaytestSession(),
          runtime: {
            skinId: game.skinId,
            selectedLevelId: game.selectedLevelId,
            soloRandomLevelMode: game.soloRandomLevelMode,
            timeOfDay: game.timeOfDay,
            timeOfDayLock: game.timeOfDayLock,
            moonPhaseIndex: game.moonPhaseIndex,
            pvpSetupSkinIds: [...game.pvpSetupSkinIds],
            pvpSetupSkinIndex: [...game.pvpSetupSkinIndex]
          }
        };
        playtestModeActive = true;
        game.cheatBuffer = "";
        game.cheatToastText = "PLAYTEST MODE ON • CLOUD SAVE PAUSED";
        game.cheatToastTimer = CONFIG.achievementToastDuration;
        tone(440, 0.08, 0.020, 100);
        tone(660, 0.10, 0.016, 110, 0.065);
        return;
      }

      const snapshot = playtestSnapshot;
      RibbitCloud.restorePlaytestSnapshot(snapshot?.saveData || {});
      playtestModeActive = false;
      refreshRuntimeProgressFromStorage();
      if (snapshot?.runtime) {
        game.selectedLevelId = snapshot.runtime.selectedLevelId || game.selectedLevelId;
        game.soloRandomLevelMode = Boolean(snapshot.runtime.soloRandomLevelMode);
        game.timeOfDay = snapshot.runtime.timeOfDay || game.timeOfDay;
        game.timeOfDayLock = snapshot.runtime.timeOfDayLock || null;
        game.moonPhaseIndex = Number.isInteger(snapshot.runtime.moonPhaseIndex)
          ? snapshot.runtime.moonPhaseIndex
          : game.moonPhaseIndex;
        game.pvpSetupSkinIds = Array.isArray(snapshot.runtime.pvpSetupSkinIds)
          ? [...snapshot.runtime.pvpSetupSkinIds]
          : ["azure", "crimson"];
        game.pvpSetupSkinIndex = Array.isArray(snapshot.runtime.pvpSetupSkinIndex)
          ? [...snapshot.runtime.pvpSetupSkinIndex]
          : [0, 1];
      }
      playtestSnapshot = null;
      RibbitCloud.endPlaytestSession();
      game.cheatBuffer = "";
      game.cheatToastText = "PLAYTEST MODE OFF • SAVE RESTORED";
      game.cheatToastTimer = CONFIG.achievementToastDuration;
      openMainMenu(false);
      tone(660, 0.08, 0.018, -90);
      tone(440, 0.10, 0.014, -70, 0.065);
    }

    function handleHiddenFrogUnlockCheat(key) {
      // "playtest" is a reversible non-saving preview. "hatstest" exposes
      // only the Hats option so its achievement requirements can be tested.
      if (typeof key !== "string") return;
      const character = key.toLowerCase();
      if (!/^[a-z]$/.test(character)) return;
      game.cheatBuffer = (game.cheatBuffer + character).slice(-HIDDEN_CODE_BUFFER_LENGTH);
      if (game.cheatBuffer.endsWith(PLAYTEST_TOGGLE_CODE)) {
        togglePlaytestMode();
        return;
      }
      if (game.cheatBuffer.endsWith(HATS_TEST_TOGGLE_CODE)) {
        try { localStorage.setItem("ribbitRaceHatsTestUnlockedV1", "1"); } catch (_) {}
        window.dispatchEvent(new CustomEvent("ribbit-hats-test-enabled"));
        game.cheatBuffer = "";
        game.cheatToastText = "HATS TEST MODE • OPTION UNLOCKED";
        game.cheatToastTimer = CONFIG.achievementToastDuration;
        tone(520, 0.07, 0.018, 70);
        tone(760, 0.10, 0.014, 90, 0.06);
        return;
      }
      if (game.cheatBuffer.endsWith(WORLD_RECORD_TEST_CODE)) {
        // Visual-only QA shortcut. It does not save, upload, or append a real
        // leaderboard record.
        game.cheatBuffer = "";
        queueAchievementToast({ type: "generic", text: "WORLD RECORD: PARK JUMPS" });
        tone(784, 0.09, 0.021, 95);
        tone(1047, 0.12, 0.017, 120, 0.075);
        return;
      }
      if (FROG_UNLOCK_CHEAT && game.cheatBuffer.endsWith(FROG_UNLOCK_CHEAT)) unlockAllFrogSkinsByCheat();
    }

    function openSetupMenu(playFeedback = true) {
      hideRgbValueEditor(true);
      game.state = "setup";
      game.customHatOpen = false;
      game.hatTargetSkinId = getCurrentHatTargetSkinId();
      game.customHatId = getHatForFrogSkinId(game.hatTargetSkinId);
      game.setupSkinFocusId = game.skinId;
      game.hoveredLevelId = null;
      game.timeButtonHovered = false;
      game.homeTutorialButtonHovered = false;
      game.homeSettingsButtonHovered = false;
      game.achievementButtonHovered = false;
      game.statsButtonHovered = false;
      game.customizeButtonHovered = false;
      game.pvpButtonHovered = false;
      game.homeHoverSelection = null;
      game.homeFocusVisible = false;
      game.homeSelection = game.selectedLevelId;
      game.buttonHeld = false;
      game.cheatBuffer = "";
      frog.charging = false;
      if (playFeedback) {
        tone(360, 0.055, 0.013, -45);
        tone(260, 0.055, 0.010, -30, 0.045);
      }
    }

    // ACCENTS controls the frog's eye bump, forward arm/fin, and feet together with one RGB palette.
    const CUSTOM_PART_ORDER = Object.freeze(["body", "belly", "accents"]);
    const CUSTOM_RGB_CHANNELS = Object.freeze(["r", "g", "b"]);

    function getCustomPartFallback(part) {
      if (part === "belly") return "#b8f5dc";
      if (part === "accents") return "#5ce5e8";
      return "#0f9fbb";
    }

    function getCustomDraftSkin() {
      const palette = {
        body: normalizeHexColor(game.customDraftBody, customFrogColors.body),
        belly: normalizeHexColor(game.customDraftBelly, customFrogColors.belly),
        accents: normalizeHexColor(game.customDraftAccents, customFrogColors.accents)
      };
      const skin = buildCustomSkinFromPalette(palette, game.customSlotIndex);
      return { ...skin, hat: game.customHatId || getCustomHatIdForSlot(game.customSlotIndex) };
    }

    function captureCustomColorSnapshot() {
      return {
        slotIndex: game.customSlotIndex,
        body: normalizeHexColor(game.customDraftBody, customFrogColors.body),
        belly: normalizeHexColor(game.customDraftBelly, customFrogColors.belly),
        accents: normalizeHexColor(game.customDraftAccents, customFrogColors.accents)
      };
    }

    function customColorSnapshotsEqual(a, b) {
      return Boolean(a && b)
        && a.slotIndex === b.slotIndex
        && a.body === b.body
        && a.belly === b.belly
        && a.accents === b.accents;
    }

    function requestCustomPreviewRender() {
      if (game.state !== "custom") return;
      requestAnimationFrame(() => {
        if (game.state === "custom") {
          drawScene();
          positionRgbValueEditor();
        }
      });
    }

    function resetCustomColorHistory() {
      game.customUndoStack = [];
      game.customRedoStack = [];
      game.customHistoryTransaction = null;
    }

    function beginCustomColorHistoryTransaction() {
      if (!game.customHistoryTransaction) game.customHistoryTransaction = captureCustomColorSnapshot();
    }

    function commitCustomColorHistoryTransaction() {
      const before = game.customHistoryTransaction;
      game.customHistoryTransaction = null;
      if (!before) return false;
      const after = captureCustomColorSnapshot();
      if (customColorSnapshotsEqual(before, after)) return false;
      game.customUndoStack.push(before);
      if (game.customUndoStack.length > 80) game.customUndoStack.shift();
      game.customRedoStack = [];
      return true;
    }

    function restoreCustomColorSnapshot(snapshot) {
      if (!snapshot) return false;
      game.customDraftBody = normalizeHexColor(snapshot.body, customFrogColors.body);
      game.customDraftBelly = normalizeHexColor(snapshot.belly, customFrogColors.belly);
      game.customDraftAccents = normalizeHexColor(snapshot.accents, customFrogColors.accents);
      requestCustomPreviewRender();
      if (game.customEditingChannel) {
        rgbValueEditor.value = String(getCustomDraftRgb()[game.customEditingChannel]);
        rgbValueEditor.select();
      }
      return true;
    }

    function finalizeCustomEditorForHistory() {
      if (!game.customEditingChannel) {
        commitCustomColorHistoryTransaction();
        return;
      }
      const parsed = clamp(Math.round(Number(rgbValueEditor.value) || 0), 0, 255);
      setCustomRgbChannel(game.customEditingChannel, parsed, game.customPart, false);
      rgbValueEditor.value = String(parsed);
      commitCustomColorHistoryTransaction();
    }

    function undoCustomColorChange(playFeedback = true) {
      finalizeCustomEditorForHistory();
      const previous = game.customUndoStack.pop();
      if (!previous) {
        if (playFeedback) playLockedSkinSound();
        return false;
      }
      game.customRedoStack.push(captureCustomColorSnapshot());
      restoreCustomColorSnapshot(previous);
      if (playFeedback) tone(350, 0.05, 0.010, -35);
      return true;
    }

    function redoCustomColorChange(playFeedback = true) {
      finalizeCustomEditorForHistory();
      const next = game.customRedoStack.pop();
      if (!next) {
        if (playFeedback) playLockedSkinSound();
        return false;
      }
      game.customUndoStack.push(captureCustomColorSnapshot());
      restoreCustomColorSnapshot(next);
      if (playFeedback) tone(500, 0.05, 0.010, 35);
      return true;
    }

    function getCustomDraftHex(part = game.customPart) {
      if (part === "belly") return game.customDraftBelly;
      if (part === "accents") return game.customDraftAccents;
      return game.customDraftBody;
    }

    function setCustomDraftHex(part, value) {
      const normalized = normalizeHexColor(value, getCustomPartFallback(part));
      if (part === "belly") game.customDraftBelly = normalized;
      else if (part === "accents") game.customDraftAccents = normalized;
      else game.customDraftBody = normalized;
    }

    function getCustomDraftRgb(part = game.customPart) {
      return hexToRgb(getCustomDraftHex(part), getCustomPartFallback(part));
    }

    function setCustomRgbChannel(channel, value, part = game.customPart, playFeedback = false) {
      const rgb = getCustomDraftRgb(part);
      if (!Object.prototype.hasOwnProperty.call(rgb, channel)) return;
      rgb[channel] = clamp(Math.round(Number(value) || 0), 0, 255);
      setCustomDraftHex(part, rgbToHex(rgb.r, rgb.g, rgb.b));
      requestCustomPreviewRender();
      if (playFeedback) tone(245 + rgb[channel] * 0.75, 0.025, 0.004, 18);
    }

    function setCustomPart(part, playFeedback = true) {
      if (!CUSTOM_PART_ORDER.includes(part)) return;
      hideRgbValueEditor(true);
      game.customLockedSlotIndex = null;
      const changed = game.customPart !== part;
      game.customPart = part;
      game.customFocusArea = part;
      if (changed && playFeedback) {
        const index = CUSTOM_PART_ORDER.indexOf(part);
        tone(400 + index * 65, 0.045, 0.010, 45);
      }
    }

    function openCustomColorMenu(playFeedback = true) {
      if (!isCustomColorUnlocked()) {
        playLockedSkinSound();
        return false;
      }
      hideRgbValueEditor(false);
      game.state = "custom";
      if (!isCustomFrogSlotUnlocked(activeCustomFrogSlotIndex)) {
        activeCustomFrogSlotIndex = getFirstUnlockedCustomFrogSlotIndex();
      }
      game.customSlotIndex = activeCustomFrogSlotIndex;
      selectCustomFrogSlot(game.customSlotIndex, true);
      game.customLockedSlotIndex = null;
      game.customHoveredSlotIndex = null;
      game.customHatId = getCustomHatIdForSlot(activeCustomFrogSlotIndex);
      game.customHatOpen = false;
      game.customHatFocusIndex = Math.max(0, CUSTOM_HAT_OPTIONS.findIndex((hat)=>hat.id===game.customHatId));
      game.customHatPage = getCustomHatPageForIndex(game.customHatFocusIndex);
      game.customHatHoveredIndex = null;
      game.customHatPageHovered = null;
      game.customHatTipTimer = 0;
      game.customPart = "body";
      game.customFocusArea = "body";
      game.customDraggingChannel = null;
      game.customPointerId = null;
      game.customEditingChannel = null;
      resetCustomColorHistory();
      game.buttonHeld = false;
      game.cheatBuffer = "";
      frog.charging = false;
      if (playFeedback) {
        tone(470, 0.055, 0.014, 85);
        tone(720, 0.070, 0.011, 95, 0.045);
      }
      return true;
    }

    function selectCustomSlot(index, playFeedback = true) {
      hideRgbValueEditor(true);
      const next = clamp(Math.round(Number(index) || 0), 0, CUSTOM_FROG_SLOT_COUNT - 1);
      evaluateCustomFrogSlotUnlocks(false);
      if (!isCustomFrogSlotUnlocked(next)) {
        game.customLockedSlotIndex = next;
        playLockedSkinSound();
        return false;
      }
      game.customLockedSlotIndex = null;
      game.customSlotIndex = next;
      selectCustomFrogSlot(next, true, playFeedback);
      game.hatTargetSkinId = `custom${next + 1}`;
      game.customHatId = getHatForFrogSkinId(game.hatTargetSkinId);
      resetCustomColorHistory();
      game.customFocusArea = `slot${next}`;
      requestCustomPreviewRender();
      return true;
    }

    function moveCustomColorFocus(horizontal = 0, vertical = 0) {
      hideRgbValueEditor(true);
      const area = game.customFocusArea;
      if (CUSTOM_PART_ORDER.includes(area)) {
        if (horizontal) {
          const index = CUSTOM_PART_ORDER.indexOf(area);
          setCustomPart(CUSTOM_PART_ORDER[(index + horizontal + CUSTOM_PART_ORDER.length) % CUSTOM_PART_ORDER.length]);
        }
        if (vertical > 0) game.customFocusArea = "r";
        else if (vertical < 0) game.customFocusArea = area === "accents" ? "back" : "use";
        return;
      }
      if (CUSTOM_RGB_CHANNELS.includes(area)) {
        if (horizontal) {
          beginCustomColorHistoryTransaction();
          const current = getCustomDraftRgb()[area];
          setCustomRgbChannel(area, current + horizontal * 5, game.customPart, true);
          commitCustomColorHistoryTransaction();
        }
        if (vertical) {
          const index = CUSTOM_RGB_CHANNELS.indexOf(area);
          if (vertical < 0) game.customFocusArea = index === 0 ? game.customPart : CUSTOM_RGB_CHANNELS[index - 1];
          else game.customFocusArea = index === CUSTOM_RGB_CHANNELS.length - 1 ? "use" : CUSTOM_RGB_CHANNELS[index + 1];
        }
        return;
      }
      if (["use", "back", "undo", "redo"].includes(area)) {
        const actions=["use","back","undo","redo"];
        if(horizontal){const index=actions.indexOf(area);game.customFocusArea=actions[(index+horizontal+actions.length)%actions.length];}
        if(vertical<0) game.customFocusArea="b";
        else if(vertical>0) game.customFocusArea=area==="back"?"belly":"body";
      }
    }

    function setCustomSliderFromPointer(channel, pointX, playFeedback = false) {
      const slider = CUSTOM_UI.sliders.find((item) => item.channel === channel);
      if (!slider) return;
      const value = clamp((pointX - slider.x) / slider.w, 0, 1) * 255;
      setCustomRgbChannel(channel, value, game.customPart, playFeedback);
    }

    function getRgbValueRect(sliderOrChannel) {
      const slider = typeof sliderOrChannel === "string"
        ? CUSTOM_UI.sliders.find((item) => item.channel === sliderOrChannel)
        : sliderOrChannel;
      if (!slider) return null;
      return { x: slider.x + slider.w + 8, y: slider.y - 5, w: 34, h: 18 };
    }

    function positionRgbValueEditor() {
      if (!game.customEditingChannel || rgbValueEditor.style.display === "none") return;
      const logicalRect = getRgbValueRect(game.customEditingChannel);
      if (!logicalRect) return;
      const canvasRect = canvas.getBoundingClientRect();
      const frameRect = gameFrame.getBoundingClientRect();
      const scaleX = canvasRect.width / W;
      const scaleY = canvasRect.height / H;
      rgbValueEditor.style.left = `${canvasRect.left - frameRect.left + logicalRect.x * scaleX}px`;
      rgbValueEditor.style.top = `${canvasRect.top - frameRect.top + logicalRect.y * scaleY}px`;
      rgbValueEditor.style.width = `${logicalRect.w * scaleX}px`;
      rgbValueEditor.style.height = `${logicalRect.h * scaleY}px`;
      rgbValueEditor.style.fontSize = `${Math.max(11, logicalRect.h * scaleY * 0.52)}px`;
    }

    function openRgbValueEditor(channel) {
      if (game.state !== "custom" || !CUSTOM_RGB_CHANNELS.includes(channel)) return;
      beginCustomColorHistoryTransaction();
      game.customEditingChannel = channel;
      game.customFocusArea = channel;
      rgbValueEditor.dataset.channel = channel;
      rgbValueEditor.value = String(getCustomDraftRgb()[channel]);
      rgbValueEditor.style.display = "block";
      positionRgbValueEditor();
      requestAnimationFrame(() => {
        rgbValueEditor.focus({ preventScroll: true });
        rgbValueEditor.select();
      });
    }

    function commitRgbValueEditor(advance = false) {
      const channel = game.customEditingChannel;
      if (!channel) return;
      const parsed = clamp(Math.round(Number(rgbValueEditor.value) || 0), 0, 255);
      setCustomRgbChannel(channel, parsed, game.customPart, false);
      rgbValueEditor.value = String(parsed);
      commitCustomColorHistoryTransaction();

      if (advance) {
        const index = CUSTOM_RGB_CHANNELS.indexOf(channel);
        if (index >= 0 && index < CUSTOM_RGB_CHANNELS.length - 1) {
          openRgbValueEditor(CUSTOM_RGB_CHANNELS[index + 1]);
          return;
        }
        hideRgbValueEditor(false);
        game.customFocusArea = "use";
      }
    }

    function hideRgbValueEditor(commit = true) {
      if (commit && game.customEditingChannel) {
        const parsed = clamp(Math.round(Number(rgbValueEditor.value) || 0), 0, 255);
        setCustomRgbChannel(game.customEditingChannel, parsed, game.customPart, false);
        commitCustomColorHistoryTransaction();
      }
      game.customEditingChannel = null;
      rgbValueEditor.dataset.channel = "";
      rgbValueEditor.style.display = "none";
    }

    function activateCustomColorSelection() {
      if (CUSTOM_PART_ORDER.includes(game.customFocusArea)) {
        setCustomPart(game.customFocusArea);
        game.customFocusArea = "r";
        return;
      }
      if (CUSTOM_RGB_CHANNELS.includes(game.customFocusArea)) {
        openRgbValueEditor(game.customFocusArea);
        return;
      }
      if (game.customFocusArea === "back") {
        hideRgbValueEditor(true);
        openSetupMenu();
        return;
      }
      if (game.customFocusArea === "undo") {
        undoCustomColorChange(true);
        return;
      }
      if (game.customFocusArea === "redo") {
        redoCustomColorChange(true);
        return;
      }
      if (game.customFocusArea === "use") {
        hideRgbValueEditor(true);
        customFrogColors = {
          body: normalizeHexColor(game.customDraftBody, customFrogColors.body),
          belly: normalizeHexColor(game.customDraftBelly, customFrogColors.belly),
          accents: normalizeHexColor(game.customDraftAccents, customFrogColors.accents)
        };
        activeCustomFrogSlotIndex = game.customSlotIndex;
        setHatForFrogSkinId(`custom${activeCustomFrogSlotIndex + 1}`, getCustomHatIdForSlot(activeCustomFrogSlotIndex), true);
        saveCustomFrogColors();
        markAchievementEarned("custom-created", true);
        selectFrogSkin("custom", false);
        game.setupSkinFocusId = "custom";
        openSetupMenu(false);
        tone(523, 0.08, 0.020, 105);
        tone(784, 0.10, 0.016, 120, 0.070);
      }
    }

    function openMainMenu(playFeedback = true) {
      applyPendingVocabulary();
      hideRgbValueEditor(true);
      game.state = "main";
      game.mode = "solo";
      game.mainSelection = game.mainSelection === "online" ? "pvp" : (game.mainSelection || "solo");
      game.mainFocusVisible = false;
      game.mainHoveredSelection = null;
      game.hoveredLevelId = null;
      game.timeButtonHovered = false;
      game.homeSettingsButtonHovered = false;
      game.achievementButtonHovered = false;
      game.statsButtonHovered = false;
      game.customizeButtonHovered = false;
      game.pvpButtonHovered = false;
      game.randomButtonHovered = false;
      game.homeHoverSelection = null;
      game.homeFocusVisible = false;
      game.buttonHeld = false;
      game.cheatBuffer = "";
      frog.charging = false;
      syncTimeOfDayChrome();
      if (playFeedback) {
        tone(430, 0.055, 0.014, 75);
        tone(640, 0.065, 0.011, 75, 0.045);
      }
    }

    function openSoloMenu(playFeedback = true) {
      applyPendingVocabulary();
      hideRgbValueEditor(true);
      game.state = "title";
      game.mode = "solo";
      game.hoveredLevelId = null;
      game.timeButtonHovered = false;
      game.homeSettingsButtonHovered = false;
      game.randomButtonHovered = false;
      game.homeHoverSelection = null;
      game.homeFocusVisible = false;
      game.homeSelection = game.soloRandomLevelMode ? "random" : game.selectedLevelId;
      if (game.soloRandomLevelMode) ensureSoloRandomPreview(true);
      game.buttonHeld = false;
      game.cheatBuffer = "";
      frog.charging = false;
      syncTimeOfDayChrome();
      if (playFeedback) {
        tone(500, 0.055, 0.014, 70);
        tone(690, 0.065, 0.011, 75, 0.045);
      }
    }

    function getTimerTime() {
      return game.finishTime === null ? game.elapsed : game.finishTime;
    }

    function syncTimeOfDayChrome() {
      const chrome = TIME_OF_DAY_CHROME[game.timeOfDay] || TIME_OF_DAY_CHROME.afternoon;
      document.body.style.background = chrome.outer;
      const frame = document.getElementById("game-frame");
      if (frame) frame.style.background = chrome.frame;
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) themeMeta.setAttribute("content", chrome.outer);
    }

    function resetMovingPlatforms() {
      for (const platform of platforms) {
        if (!platform.moving) continue;
        if (platform.movementAxis === "y") {
          platform.y = platform.innerY;
        } else {
          platform.x = platform.innerX;
        }
      }
    }

    function frogIsStandingOnPlatform(platform) {
      return Boolean(
        frog.grounded &&
        Math.abs(frog.y + frog.h - platform.y) <= 1.5 &&
        horizontalOverlap(frog.x, frog.w, platform)
      );
    }

    function updateMovingPlatforms() {
      const movingPlatforms = platforms.filter((platform) => platform.moving);
      if (!movingPlatforms.length) return;

      // Every moving platform uses the same smooth period. Lake rafts move
      // horizontally in sync; the two Garden elevators rise and fall vertically in sync.
      const cycle = (game.worldTime % CONFIG.lakePlatformPeriod) / CONFIG.lakePlatformPeriod;
      const outwardProgress = (1 - Math.cos(cycle * Math.PI * 2)) / 2;
      const carrier = movingPlatforms.find((platform) => frogIsStandingOnPlatform(platform)) || null;
      let carrierDeltaX = 0;
      let carrierDeltaY = 0;

      for (const platform of movingPlatforms) {
        const previousX = platform.x;
        const previousY = platform.y;

        if (platform.movementAxis === "y") {
          platform.y = lerp(platform.innerY, platform.outerY, outwardProgress);
        } else {
          platform.x = lerp(platform.innerX, platform.outerX, outwardProgress);
        }

        if (platform === carrier) {
          carrierDeltaX = platform.x - previousX;
          carrierDeltaY = platform.y - previousY;
        }
      }

      // Carry a grounded frog with either horizontal rafts or the vertical lift.
      if (carrier) {
        frog.x = clamp(frog.x + carrierDeltaX, 0, W - frog.w);
        frog.y += carrierDeltaY;
      }
    }

    function readBestTime(levelId = "park") {
      try {
        let value = Number(localStorage.getItem(`oneButtonFrogBest:${levelId}`));
        // Preserve the original Park record for returning players.
        if ((!Number.isFinite(value) || value <= 0) && levelId === "park") {
          value = Number(localStorage.getItem("oneButtonFrogBest"));
        }
        return Number.isFinite(value) && value > 0 ? value : null;
      } catch (_) {
        return null;
      }
    }

    function saveBestTime(value, levelId = "park") {
      try {
        localStorage.setItem(`oneButtonFrogBest:${levelId}`, String(value));
        if (levelId === "park") localStorage.setItem("oneButtonFrogBest", String(value));
        saveRecordDate(levelId);
      } catch (_) {
        // Local storage can be blocked in some embedded browsers; gameplay still works.
      }
    }

    function readFewestJumps(levelId = "park") {
      try {
        const raw = localStorage.getItem(`ribbitRaceFewestJumps:${levelId}`);
        if (raw === null || raw === "") return null;
        const value = Number(raw);
        return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
      } catch (_) {
        return null;
      }
    }

    function saveFewestJumps(value, levelId = "park") {
      try {
        localStorage.setItem(`ribbitRaceFewestJumps:${levelId}`, String(Math.max(0, Math.floor(value))));
        saveRecordDate(levelId);
      } catch (_) {
        // The run still completes normally when storage is unavailable.
      }
    }

    function readBestTimeForTimeOfDay(levelId, timeOfDay) {
      try {
        const value = Number(localStorage.getItem(`ribbitRaceBest:${levelId}:${timeOfDay}`));
        return Number.isFinite(value) && value > 0 ? value : null;
      } catch (_) {
        return null;
      }
    }

    function saveBestTimeForTimeOfDay(value, levelId, timeOfDay) {
      try {
        localStorage.setItem(`ribbitRaceBest:${levelId}:${timeOfDay}`, String(value));
      } catch (_) {
        // Time-specific records remain available for this session only when blocked.
      }
    }


    function saveRecordDate(levelId = "park") {
      try {
        const stamp = new Date().toISOString().slice(0, 10);
        localStorage.setItem(`ribbitRaceRecordDate:${levelId}`, stamp);
        localStorage.setItem("ribbitRaceRecordDate:last", stamp);
      } catch (_) {}
    }

    function readRecordDate(levelId = "park") {
      try {
        return localStorage.getItem(`ribbitRaceRecordDate:${levelId}`) || localStorage.getItem("ribbitRaceRecordDate:last") || "";
      } catch (_) {
        return "";
      }
    }

    function readBestEndlessFlies(levelId = "park") {
      try {
        const value = Number(localStorage.getItem(`ribbitRaceBestEndlessFlies:${levelId}`));
        return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
      } catch (_) {
        return null;
      }
    }

    function saveBestEndlessFlies(value, levelId = "park") {
      try {
        const score = Math.max(0, Math.floor(Number(value) || 0));
        if (score <= 0) return;
        localStorage.setItem(`ribbitRaceBestEndlessFlies:${levelId}`, String(score));
        localStorage.setItem(`ribbitRaceEndlessRecordDate:${levelId}`, new Date().toISOString().slice(0, 10));
      } catch (_) {
        // Endless records remain session-only when storage is unavailable.
      }
    }

    function grantFrogSkinAchievement(id, notify = false) {
      // Frog-skin achievements are solo challenges; PvP cannot unlock them.
      if (game.mode === "pvp") return false;
      if (!FROG_SKINS[id] || isFrogSkinUnlocked(id)) return false;
      unlockedFrogSkinIds.add(id);
      saveUnlockedFrogSkinIds();

      if (
        (game.state === "playing" || game.state === "won") &&
        !game.roundUnlockedSkinIds.includes(id)
      ) {
        game.roundUnlockedSkinIds.push(id);
      }

      if (notify && (game.state === "playing" || game.state === "won")) {
        queueAchievementToast({ type: "frog", skinId: id });
      }
      if (hasUnlockedAllStandardFrogSkins()) markAchievementEarned("all-frog-colors", notify);
      return true;
    }

    function evaluateStoredFrogAchievements() {
      const parkBest = readBestTime("park");
      const pondFewest = readFewestJumps("pond");
      if (parkBest !== null && timeAtOrUnder(parkBest, 25)) grantFrogSkinAchievement("crimson", false);
      if (pondFewest !== null && pondFewest <= CONFIG.violetPondJumpTarget) grantFrogSkinAchievement("violet", false);
      if (game.totalFliesEaten >= CONFIG.emberFlyTarget) grantFrogSkinAchievement("ember", false);
      if (allLevelsCompletedWithin(CONFIG.levelUnlockTimeTarget)) grantCustomColorAchievement();
      evaluateCustomFrogSlotUnlocks(false);
    }

    function evaluateStoredGeneralAchievements() {
      const fastest = getFastestCompletionTime();
      if (fastest !== null && timeAtOrUnder(fastest, 25)) markAchievementEarned("quick-finish", false);
      if (fastest !== null && timeUnder(fastest, 15)) markAchievementEarned("flash-finish", false);
      if (statsProfile.maxFliesOneJump >= 2) markAchievementEarned("double-dinner", false);
      const pondFewest = readFewestJumps("pond");
      if (pondFewest !== null && pondFewest <= CONFIG.violetPondJumpTarget) markAchievementEarned("few-hops", false);
      if (game.totalFliesEaten >= CONFIG.emberFlyTarget) markAchievementEarned("fly-feast", false);
      if (statsProfile.maxFinalScore >= 6) markAchievementEarned("bonus-six", false);
      if (statsProfile.maxFinalScore >= 7) markAchievementEarned("bonus-seven", false);
      if (isTimeSelectUnlocked()) markAchievementEarned("time-select", false);
      if (allLevelsCompletedWithin(CONFIG.levelUnlockTimeTarget)) markAchievementEarned("custom-colors", false);
      evaluateCustomFrogSlotUnlocks(false);
      if (hasUnlockedAllStandardFrogSkins()) markAchievementEarned("all-frog-colors", false);
      ["swamp", "jungle", "pond", "lake", "garden"].forEach((levelId) => {
        if (isLevelUnlocked(levelId)) markAchievementEarned(`level-${levelId}`, false);
      });
    }

    function evaluateCompletedRoundGeneralAchievements(wonTime) {
      if (timeAtOrUnder(wonTime, 25)) markAchievementEarned("quick-finish", false);
      if (timeUnder(wonTime, 15)) markAchievementEarned("flash-finish", false);
      if (game.selectedLevelId === "pond" && game.jumps <= CONFIG.violetPondJumpTarget) {
        markAchievementEarned("few-hops", false);
      }
      if (game.jumps >= CONFIG.silverRoundJumpTarget && timeAtOrUnder(wonTime, CONFIG.silverRoundTimeTarget)) {
        markAchievementEarned("century-hop", false);
      }
      if (game.totalFliesEaten >= CONFIG.emberFlyTarget) markAchievementEarned("fly-feast", false);
      if (game.score >= 6) markAchievementEarned("bonus-six", false);
      if (game.score >= 7) markAchievementEarned("bonus-seven", false);
      if (game.jumps <= 5) markAchievementEarned("five-jump-finish", false);
      if (allLevelsCompletedWithin(CONFIG.levelUnlockTimeTarget)) markAchievementEarned("custom-colors", false);
      evaluateCustomFrogSlotUnlocks(true);
      if (hasUnlockedAllStandardFrogSkins()) markAchievementEarned("all-frog-colors", false);
    }

    function evaluateCompletedRoundFrogAchievements(wonTime) {
      // Frog skins retain their stage-specific requirements.
      if (game.selectedLevelId === "park" && timeAtOrUnder(wonTime, 25)) grantFrogSkinAchievement("crimson", false);
      if (game.roundPlumQualified) grantFrogSkinAchievement("plum", false);
      if (game.roundForestQualified) grantFrogSkinAchievement("forest", false);
      if (game.selectedLevelId === "pond" && game.jumps <= CONFIG.violetPondJumpTarget) {
        grantFrogSkinAchievement("violet", false);
      }
      if (game.selectedLevelId === "lake" && game.jumps >= CONFIG.silverRoundJumpTarget && timeAtOrUnder(wonTime, CONFIG.silverRoundTimeTarget)) {
        grantFrogSkinAchievement("silver", false);
      }
      if (game.roundBlossomQualified) grantFrogSkinAchievement("blossom", false);
      if (game.totalFliesEaten >= CONFIG.emberFlyTarget) grantFrogSkinAchievement("ember", false);
      if (allLevelsCompletedWithin(CONFIG.levelUnlockTimeTarget)) grantCustomColorAchievement();
    }

    function recordCorrectCatchForAchievements(targetFly) {
      const freshCatch = Boolean(targetFly && targetFly.spawnAge <= CONFIG.forestSpawnCatchWindow);
      if (freshCatch) markAchievementEarned("fresh-catch", true);
      if (game.selectedLevelId === "jungle" && freshCatch) game.roundForestQualified = true;

      if (!game.jumpAchievementActive) return;
      game.currentJumpCorrectCatches += 1;
      game.currentJumpLastCorrectCatchAt = game.elapsed;
      statsProfile.maxFliesOneJump = Math.max(statsProfile.maxFliesOneJump, game.currentJumpCorrectCatches);

      if (game.currentJumpCorrectCatches >= 2) markAchievementEarned("double-dinner", true);
      if (game.selectedLevelId === "swamp" && game.currentJumpCorrectCatches >= 2) game.roundPlumQualified = true;

      if (!frog.grounded && game.currentJumpWentAboveMap) markAchievementEarned("sky-snack", true);
      if (game.selectedLevelId === "garden" && !frog.grounded && game.currentJumpWentAboveMap) game.roundBlossomQualified = true;
    }

    function evaluateLandingFrogAchievements() {
      statsProfile.longestAirTime = Math.max(
        statsProfile.longestAirTime,
        game.currentJumpAirTime
      );
      statsProfile.maxFliesOneJump = Math.max(
        statsProfile.maxFliesOneJump,
        game.currentJumpCorrectCatches
      );
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

    function applySelectedLevel() {
      const level = LEVELS[game.selectedLevelId] || LEVELS.park;
      platforms = level.platforms;
      flySpawns = level.flySpawns;
      return level;
    }

    function cycleTimeOfDayMode() {
      if (!isTimeSelectUnlocked()) {
        playLockedSkinSound();
        return;
      }

      const cycle = [null, "afternoon", "morning", "night"];
      const currentIndex = cycle.indexOf(game.timeOfDayLock);
      const nextMode = cycle[(currentIndex + 1) % cycle.length];

      game.timeOfDayLock = nextMode;
      if (nextMode) {
        game.timeOfDay = nextMode;
      } else {
        // Returning to Random creates a fresh preview. Its later replays then
        // advance Morning → Evening → Night instead of rolling again.
        game.timeOfDay = randomTimeOfDay();
        game.lastStartedLevelId = null;
        game.lastStartedTimeOfDay = null;
      }

      game.worldTime = 0;
      resetMovingPlatforms();
      syncTimeOfDayChrome();
      tone(nextMode ? 520 : 350, 0.055, 0.015, nextMode ? 75 : -55);
    }

    function selectLevel(levelId, playFeedback = true) {
      if (!LEVELS[levelId]) return false;
      if (!isLevelUnlocked(levelId)) {
        if (playFeedback) playLockedSkinSound();
        return false;
      }
      const previousLevelId = game.selectedLevelId;
      const previousTimeOfDay = game.timeOfDay;

      game.selectedLevelId = levelId;
      if (game.state === "title") game.homeSelection = levelId;
      if (game.timeOfDayLock) {
        game.timeOfDay = game.timeOfDayLock;
      } else if (previousLevelId !== levelId) {
        game.timeOfDay = randomTimeOfDay();
      }

      const level = applySelectedLevel();
      game.bestTime = readBestTime(level.id);
      game.bestJumps = readFewestJumps(level.id);
      game.bestEndlessFlies = readBestEndlessFlies(level.id);
      game.lastFlySpawnIndex = -1;
      game.worldTime = 0;
      resetMovingPlatforms();
      syncTimeOfDayChrome();

      if (game.state === "title" || game.state === "setup") {
        frog.x = level.startX + CONFIG.initialFrogOffsetX;
        frog.y = CONFIG.groundY - frog.h;
        frog.vx = 0;
        frog.vy = 0;
        frog.dir = 1;
        frog.grounded = true;
        frog.charging = false;
        frog.departurePlatform = null;
        frog.dropThroughPlatform = null;
        flies.length = 0;
        game.spawnQueue = [];
        tongue.active = false;
      }

      const selectionChanged = previousLevelId !== levelId || previousTimeOfDay !== game.timeOfDay;
      if (playFeedback && selectionChanged) {
        tone(245, 0.045, 0.012, 55);
        tone(360, 0.045, 0.009, 35, 0.035);
      }
      return true;
    }

    function getUnlockedSoloLevelIds() {
      return LEVEL_ORDER.filter((levelId) => isLevelUnlocked(levelId));
    }

    function pickRandomSoloLevel(excludedId = null) {
      const unlocked = getUnlockedSoloLevelIds();
      const choices = unlocked.length > 1 && excludedId
        ? unlocked.filter((levelId) => levelId !== excludedId)
        : unlocked;
      return choices[Math.floor(Math.random() * choices.length)] || "park";
    }

    function ensureSoloRandomPreview(forceNew = false) {
      if (
        forceNew ||
        !game.soloRandomPreviewLevelId ||
        !isLevelUnlocked(game.soloRandomPreviewLevelId)
      ) {
        game.soloRandomPreviewLevelId = pickRandomSoloLevel(game.soloLastRandomLevelId);
      }
      return game.soloRandomPreviewLevelId;
    }

    function getMainSelectionRect(selection) {
      const map = {
        solo: MAIN_UI.soloButton,
        frog: MAIN_UI.frogButton,
        pvp: MAIN_UI.pvpButton,
        profile: MAIN_UI.profileButton,
        device: MAIN_UI.deviceButton,
        achievements: MAIN_UI.achievementsButton,
        stats: MAIN_UI.statsButton
      };
      return map[selection] || MAIN_UI.soloButton;
    }

    function getMainSelectionCoordinates(selection = game.mainSelection) {
      for (let row = 0; row < MAIN_SELECTION_GRID.length; row += 1) {
        const column = MAIN_SELECTION_GRID[row].indexOf(selection);
        if (column >= 0) return { row, column };
      }
      return { row: 0, column: 0 };
    }

    function focusMainSelection(selection, playFeedback = true) {
      if (!['solo','frog','pvp','profile','device','achievements','stats'].includes(selection)) return false;
      const changed = game.mainSelection !== selection;
      game.mainSelection = selection;
      game.mainFocusVisible = true;
      game.mainHoveredSelection = null;
      game.achievementButtonHovered = false;
      game.statsButtonHovered = false;
      game.customizeButtonHovered = false;
      game.pvpButtonHovered = false;
      if (changed && playFeedback) {
        const frequencies = { solo: 520, frog: 410, pvp: 455, profile: 505, device: 475, achievements: 560, stats: 515 };
        tone(frequencies[selection] || 430, 0.045, 0.010, 35);
      }
      return true;
    }

    function moveMainSelection(horizontal = 0, vertical = 0) {
      const current = getMainSelectionCoordinates();
      if (horizontal) {
        const rowItems = MAIN_SELECTION_GRID[current.row];
        const nextColumn = (current.column + horizontal + rowItems.length) % rowItems.length;
        focusMainSelection(rowItems[nextColumn]);
        return;
      }
      if (vertical) {
        const rowCount = MAIN_SELECTION_GRID.length;
        const targetRow = (current.row + vertical + rowCount) % rowCount;
        const currentRect = getMainSelectionRect(MAIN_SELECTION_GRID[current.row][current.column]);
        const currentX = currentRect.x + currentRect.w / 2;
        let best = MAIN_SELECTION_GRID[targetRow][0];
        let distance = Infinity;
        for (const candidate of MAIN_SELECTION_GRID[targetRow]) {
          const rect = getMainSelectionRect(candidate);
          const nextDistance = Math.abs(rect.x + rect.w / 2 - currentX);
          if (nextDistance < distance) { best = candidate; distance = nextDistance; }
        }
        focusMainSelection(best);
      }
    }

    function activateMainSelection() {
      const selection = game.mainSelection || 'solo';
      if (selection === 'solo') { openSoloMenu(); return; }
      if (selection === 'frog') { openSetupMenu(); return; }
      if (selection === 'pvp') { openPvpSetupMenu(); return; }
      if (selection === 'profile') { window.RibbitRaceOpenProfileMenu?.(); return; }
      if (selection === 'device') { window.RibbitRaceOpenDeviceMenu?.(); return; }
      if (selection === 'achievements') { openAchievementsMenu(); return; }
      if (selection === 'stats') { openStatsMenu(); }
    }

    function getHomeSelectionCenterX(selection) {
      if (LEVELS[selection]) {
        const button = HOME_UI.levelButtons.find((item) => item.id === selection);
        if (button) return button.x + button.w / 2;
      }
      const map = {
        random: HOME_UI.randomButton,
        back: HOME_UI.backButton,
        tutorial: HOME_UI.tutorialButton,
        settings: HOME_UI.settingsButton,
        time: HOME_UI.timeButton
      };
      const rect = map[selection];
      return rect ? rect.x + rect.w / 2 : W / 2;
    }

    function getHomeSelectionCoordinates(selection = game.homeSelection) {
      for (let row = 0; row < HOME_SELECTION_GRID.length; row += 1) {
        const column = HOME_SELECTION_GRID[row].indexOf(selection);
        if (column >= 0) return { row, column };
      }
      const fallback = LEVEL_ORDER.includes(game.selectedLevelId) ? game.selectedLevelId : "park";
      return getHomeSelectionCoordinates(fallback);
    }

    function focusHomeSelection(selection, playFeedback = true) {
      const valid = LEVELS[selection] || ["random", "back", "tutorial", "settings", "time"].includes(selection);
      if (!valid) return false;

      const changed = game.homeSelection !== selection;
      game.homeSelection = selection;
      game.homeFocusVisible = true;
      game.hoveredLevelId = null;
      game.randomButtonHovered = false;
      game.timeButtonHovered = false;
      game.homeSettingsButtonHovered = false;
      game.achievementButtonHovered = false;
      game.statsButtonHovered = false;
      game.customizeButtonHovered = false;
      game.pvpButtonHovered = false;

      if (selection === "random") {
        game.soloRandomLevelMode = true;
        ensureSoloRandomPreview();
        if (changed && playFeedback) tone(535, 0.045, 0.010, 35);
      } else if (LEVELS[selection]) {
        const wasRandomMode = game.soloRandomLevelMode;
        game.soloRandomLevelMode = false;
        if (isLevelUnlocked(selection)) {
          selectLevel(selection, playFeedback && changed && !wasRandomMode);
          if (wasRandomMode && changed && playFeedback) {
            tone(245, 0.045, 0.012, 55);
            tone(360, 0.045, 0.009, 35, 0.035);
          }
        }
      } else if (changed && playFeedback) {
        const frequency = selection === "back" ? 330
          : selection === "random" ? 535
          : selection === "tutorial" ? 490
          : 355;
        tone(frequency, 0.045, 0.010, 35);
      }
      return true;
    }

    function moveHomeSelection(horizontal = 0, vertical = 0) {
      const current = getHomeSelectionCoordinates();
      if (horizontal) {
        const rowItems = HOME_SELECTION_GRID[current.row];
        const nextColumn = (current.column + horizontal + rowItems.length) % rowItems.length;
        focusHomeSelection(rowItems[nextColumn]);
        return;
      }

      if (vertical) {
        const rowCount = HOME_SELECTION_GRID.length;
        const targetRow = (current.row + vertical + rowCount) % rowCount;
        const currentX = getHomeSelectionCenterX(HOME_SELECTION_GRID[current.row][current.column]);
        const candidates = HOME_SELECTION_GRID[targetRow];
        let best = candidates[0];
        let bestDistance = Infinity;
        for (const candidate of candidates) {
          const distance = Math.abs(getHomeSelectionCenterX(candidate) - currentX);
          if (distance < bestDistance) {
            best = candidate;
            bestDistance = distance;
          }
        }
        focusHomeSelection(best);
      }
    }

    function activateHomeSelection() {
      const selection = game.homeSelection || game.selectedLevelId;
      if (selection === "back") { openMainMenu(); return; }
      if (selection === "settings") { openSoloSettingsMenu(); return; }
      if (selection === "tutorial") { window.RibbitRaceTutorialEngine?.start?.("solo"); return; }
      if (selection === "time") { cycleTimeOfDayMode(); return; }
      if (selection === "random") {
        game.soloRandomLevelMode = true;
        ensureSoloRandomPreview();
        startNewGameCountdown();
        return;
      }
      if (LEVELS[selection]) {
        if (!isLevelUnlocked(selection)) { playLockedSkinSound(); return; }
        game.soloRandomLevelMode = false;
        selectLevel(selection, false);
        startNewGameCountdown();
      }
    }

    const PVP_LAST_SKINS_STORAGE_KEY = "ribbitRaceLastVersusFrogsV1";

    function readLastPvpSkinSelections() {
      try {
        const parsed = JSON.parse(localStorage.getItem(PVP_LAST_SKINS_STORAGE_KEY) || "null");
        if (!Array.isArray(parsed) || parsed.length < 2) return null;
        return [normalizePvpSkinId(parsed[0], "azure"), normalizePvpSkinId(parsed[1], "crimson")];
      } catch (_) { return null; }
    }

    function saveLastPvpSkinSelections(ids = game.pvpSetupSkinIds) {
      try {
        const normalized = [normalizePvpSkinId(ids?.[0], "azure"), normalizePvpSkinId(ids?.[1], "crimson")];
        localStorage.setItem(PVP_LAST_SKINS_STORAGE_KEY, JSON.stringify(normalized));
      } catch (_) {}
    }

    function isCustomPvpSkinId(skinId) {
      return /^custom[1-3]$/.test(String(skinId || "").toLowerCase());
    }

    function isPvpSkinAvailable(skinId) {
      const normalized = String(skinId || "").toLowerCase();
      if (normalized === "custom") return isCustomFrogSlotUnlocked(0);
      if (isCustomPvpSkinId(normalized)) return isCustomFrogSlotUnlocked(Number(normalized.slice(-1)) - 1);
      return normalized === "azure" || normalized === "crimson" || isFrogSkinUnlocked(normalized);
    }

    function normalizePvpSkinId(skinId, fallbackId = "azure") {
      const normalized = typeof skinId === "string" ? skinId.toLowerCase() : "";
      if (normalized === "custom") return "custom1";
      if (isCustomPvpSkinId(normalized)) return normalized;
      return FROG_SKINS[normalized] ? normalized : fallbackId;
    }

    function getPvpSetupPreviewSkinId(playerIndex) {
      const fallbackId = playerIndex === 0 ? "azure" : "crimson";
      const rawIndex = Number(game.pvpSetupSkinIndex?.[playerIndex]);
      if (Number.isInteger(rawIndex) && PVP_FROG_SKIN_ORDER[rawIndex]) return PVP_FROG_SKIN_ORDER[rawIndex];
      const selectedId = normalizePvpSkinId(game.pvpSetupSkinIds?.[playerIndex], fallbackId);
      const selectedIndex = Math.max(0, PVP_FROG_SKIN_ORDER.indexOf(selectedId));
      if (!Array.isArray(game.pvpSetupSkinIndex)) game.pvpSetupSkinIndex = [0, 1];
      game.pvpSetupSkinIndex[playerIndex] = selectedIndex;
      return selectedId;
    }

    function getPvpSkinPalette(skinId, fallbackId = "azure", playerIndexHint = null) {
      const fallback = FROG_SKINS[fallbackId] || FROG_SKINS.azure;
      const normalized = normalizePvpSkinId(skinId, fallback.id);
      const onlineOverride = game.onlineMode && Number.isInteger(playerIndexHint)
        ? window.RibbitOnlineAppearanceOverrides?.[playerIndexHint]
        : null;
      if (onlineOverride && typeof onlineOverride === "object") {
        return {
          id: onlineOverride.id || normalized,
          name: onlineOverride.name || String(normalized).toUpperCase(),
          dark: onlineOverride.dark || fallback.dark,
          mid: onlineOverride.mid || fallback.mid,
          light: onlineOverride.light || fallback.light,
          belly: onlineOverride.belly || fallback.belly,
          accents: onlineOverride.accents || onlineOverride.light || fallback.light,
          bump: onlineOverride.bump || onlineOverride.crest || onlineOverride.light || fallback.light,
          arms: onlineOverride.arms || onlineOverride.accents || onlineOverride.light || fallback.light,
          feet: onlineOverride.feet || onlineOverride.accents || onlineOverride.light || fallback.light,
          tongue: onlineOverride.tongue || fallback.tongue,
          tongueDark: onlineOverride.tongueDark || fallback.tongueDark,
          hat: onlineOverride.hat || "none"
        };
      }
      const customMatch = normalized.match(/^custom([1-3])$/);
      const skin = customMatch ? getCustomFrogSkinForSlot(Number(customMatch[1]) - 1) : (FROG_SKINS[normalized] || fallback);
      return {
        id: skin.id, name: skin.name,
        dark: skin.dark || fallback.dark,
        mid: skin.mid || fallback.mid,
        light: getFrogAccentHighlight(skin) || fallback.light,
        belly: skin.belly || fallback.belly,
        accents: skin.accents || skin.arms || skin.light || fallback.light,
        bump: skin.bump || skin.crest || skin.light || fallback.light,
        arms: skin.arms || skin.accents || skin.light || fallback.light,
        feet: skin.feet || skin.accents || skin.light || fallback.light,
        tongue: skin.tongue || fallback.tongue,
        tongueDark: skin.tongueDark || fallback.tongueDark,
        hat: getHatForFrogSkinId(normalized)
      };
    }

    function getPvpSetupPreviewPalette(playerIndex) {
      const id = getPvpSetupPreviewSkinId(playerIndex);
      return { ...getPvpSkinPalette(id, playerIndex === 0 ? "azure" : "crimson", playerIndex), previewHatYOffset: 1 };
    }

    function getPvpPreviewValidation() {
      const ids = [getPvpSetupPreviewSkinId(0), getPvpSetupPreviewSkinId(1)];
      const locked = ids.map((id, index) => OnlineVersus.hasRoom() && index !== OnlineVersus.localIndex() ? false : !isPvpSkinAvailable(id));
      const sameSkin = ids[0] === ids[1];
      return { ids, locked, sameSkin, invalid: sameSkin || locked[0] || locked[1] };
    }

    function canStartPvpFromPreview() {
      return !getPvpPreviewValidation().invalid;
    }

    function commitPvpPreviewSelections() {
      const candidateIds = [getPvpSetupPreviewSkinId(0), getPvpSetupPreviewSkinId(1)];
      const previousIds = [
        normalizePvpSkinId(game.pvpSetupSkinIds?.[0], "azure"),
        normalizePvpSkinId(game.pvpSetupSkinIds?.[1], "crimson")
      ];

      // Player 1's visible selector is authoritative. Previously, selecting the
      // skin currently assigned to Player 2 could silently reject Player 1 and
      // send Azure into the match. Keep Player 1's chosen preview and move
      // Player 2 to another available palette instead.
      const p1Candidate = candidateIds[0];
      const p1Id = isPvpSkinAvailable(p1Candidate)
        ? p1Candidate
        : (isPvpSkinAvailable(previousIds[0]) ? previousIds[0] : "azure");

      const p2Candidate = candidateIds[1];
      let p2Id = null;
      if (isPvpSkinAvailable(p2Candidate) && p2Candidate !== p1Id) {
        p2Id = p2Candidate;
      } else if (isPvpSkinAvailable(previousIds[1]) && previousIds[1] !== p1Id) {
        p2Id = previousIds[1];
      } else if (isPvpSkinAvailable(previousIds[0]) && previousIds[0] !== p1Id) {
        // This makes a direct Azure/Crimson swap work without forcing the user
        // to edit Player 2 before confirming Player 1.
        p2Id = previousIds[0];
      } else {
        p2Id = getFirstAvailablePvpSkin(p1Id, "crimson");
      }

      const nextIds = [p1Id, p2Id];
      game.pvpSetupSkinIds = nextIds;
      game.pvpSetupSkinIndex = nextIds.map((id) => Math.max(0, PVP_FROG_SKIN_ORDER.indexOf(id)));
      saveLastPvpSkinSelections(nextIds);
      return nextIds;
    }

    function getFirstAvailablePvpSkin(excludedId = null, preferredId = "azure") {
      if (preferredId !== excludedId && isPvpSkinAvailable(preferredId)) return preferredId;
      return PVP_FROG_SKIN_ORDER.find((id) => id !== excludedId && isPvpSkinAvailable(id)) || "azure";
    }

    function getUnlockedPvpLevelIds() {
      // All stages are available in local 1V1, regardless of solo progression.
      return [...LEVEL_ORDER];
    }

    function pickRandomPvpLevel(excludedId = null) {
      const unlocked = getUnlockedPvpLevelIds();
      const choices = unlocked.length > 1 && excludedId
        ? unlocked.filter((id) => id !== excludedId)
        : unlocked;
      return choices[Math.floor(Math.random() * choices.length)] || "park";
    }

    function refreshPvpRandomPreview() {
      game.pvpRandomPreviewLevelId = pickRandomPvpLevel(game.pvpRandomPreviewLevelId);
    }

    function getPvpSetupPreviewLevelId() {
      return game.pvpSetupLevelId === "random"
        ? (game.pvpRandomPreviewLevelId || "park")
        : (game.pvpSetupLevelId || "park");
    }

    function openPvpSetupMenu(playFeedback = true) {
      hideRgbValueEditor(true);
      game.mode = "solo";
      // Refresh achievement-backed unlocks before drawing the 1V1 selector.
      evaluateStoredFrogAchievements();
      game.state = "pvpSetup";
      if (!PVP_STAGE_ORDER.includes(game.pvpSetupLevelId)) game.pvpSetupLevelId = game.selectedLevelId || "park";
      if (game.pvpSetupLevelId === "random") refreshPvpRandomPreview();
      game.pvpSetupLevelIndex = Math.max(0, PVP_STAGE_ORDER.indexOf(game.pvpSetupLevelId));
      const persistedSkins = readLastPvpSkinSelections();
      const storedP1 = normalizePvpSkinId(persistedSkins?.[0] || game.pvpSetupSkinIds?.[0], "azure");
      const storedP2 = normalizePvpSkinId(persistedSkins?.[1] || game.pvpSetupSkinIds?.[1], "crimson");
      let p1 = isPvpSkinAvailable(storedP1) ? storedP1 : "azure";
      let p2 = isPvpSkinAvailable(storedP2) ? storedP2 : "crimson";
      if (p1 === p2) p2 = getFirstAvailablePvpSkin(p1, "crimson");
      game.pvpSetupSkinIds = [p1, p2];
      game.pvpSetupSkinIndex = [Math.max(0, PVP_FROG_SKIN_ORDER.indexOf(p1)), Math.max(0, PVP_FROG_SKIN_ORDER.indexOf(p2))];
      game.pvpSetupFocusArea = "level";
      game.pvpSetupPlayerIndex = 0;
      game.pvpSetupBottomSelection = "start";
      game.pvpRoundWins = [0, 0];
      game.pvpRoundNumber = 1;
      game.pvpMatchWinnerIndex = null;
      game.pvpMatchAchievementContext = null;
      game.pvpLastRandomLevelId = null;
      game.pvpTimeButtonHovered = false;
      game.pvpSettingsButtonHovered = false;
      game.pvpWifiButtonHovered = false;
      game.buttonHeld = false;
      game.cheatBuffer = "";
      frog.charging = false;
      if (playFeedback) { tone(392, 0.055, 0.013, 70); tone(587, 0.065, 0.010, 80, 0.045); }
    }

    function closePvpSetupMenu(playFeedback = true) {
      openMainMenu(false);
      game.mode = "solo";
      game.mainSelection = "pvp";
      game.mainFocusVisible = true;
      if (playFeedback) tone(330, 0.05, 0.012, -45);
    }

    function getPvpRoundsToWin() {
      return Math.floor(clamp(game.pvpBestOf || 3, 1, 5) / 2) + 1;
    }

    function capturePvpMatchAchievementContext() {
      game.pvpMatchAchievementContext = {
        online: Boolean(game.onlineMode),
        cpuEnabled: Boolean(game.pvpCpuEnabled),
        cpuDifficulty: Math.round(Number(game.pvpCpuDifficulty) || 0),
        bestOf: Math.round(Number(game.pvpBestOf) || 1)
      };
      return game.pvpMatchAchievementContext;
    }

    function getPvpMatchAchievementContext() {
      const stored = game.pvpMatchAchievementContext;
      if (stored && typeof stored === "object") return stored;
      return {
        online: Boolean(game.onlineMode),
        cpuEnabled: Boolean(game.pvpCpuEnabled),
        cpuDifficulty: Math.round(Number(game.pvpCpuDifficulty) || 0),
        bestOf: Math.round(Number(game.pvpBestOf) || 1)
      };
    }

    function awardCpuChampForCompletedMatch(notify = true) {
      if (game.mode !== "pvp" || game.pvpMatchWinnerIndex !== 0) return false;
      const context = getPvpMatchAchievementContext();
      const qualifies = !context.online && context.cpuEnabled && context.cpuDifficulty === 9 && context.bestOf === 3;
      if (!qualifies) return false;
      return markPvpAchievementEarned("pvp-level9-bo3", 0, notify, { verifiedInteraction: true });
    }

    function getPvpTargetScore() {
      return game.pvpSuddenDeath ? CONFIG.pvpSuddenDeathTarget : (game.pvpFirstTo || 5);
    }

    function isSoloEndlessMode() {
      return game.mode === "solo" && Boolean(game.soloEndlessMode);
    }

    function getSoloTargetScore() {
      return isSoloEndlessMode() ? Infinity : (game.soloCatchGoal === 10 ? 10 : 5);
    }

    function isSoloTimerActive() {
      return game.mode === "solo" && Number(game.soloTimeLimitSeconds) > 0;
    }

    function isSoloEndlessLeaderboardEligible() {
      return isSoloEndlessMode() && Number(game.soloTimeLimitSeconds) === 60;
    }

    function prepareSandboxRound() {
      game.sandboxMode = true;
      game.spawnQueue = [];
      flies.length = 0;
      game.targetVocabIndex = null;
      game.completedVocabIndices = new Set();
      game.winPending = false;
      game.soloTimedOut = false;
      game.soloTimeRemaining = 0;
      tongue.active=false;resetSandboxTestFlies();
    }

    function isPvpEndlessMode() {
      return game.pvpRoundGoalMode === "endless";
    }

    function togglePvpCpuMode(playFeedback = true) {
      game.pvpCpuEnabled = !game.pvpCpuEnabled;
      if (game.pvpCpuEnabled) game.pvpCpuDifficulty = clamp(game.pvpCpuDifficulty || 5, 1, 9);

      // CPU mode owns Player 2 completely. Clear any stale Right Shift or Slash
      // state so a key that was held before the toggle cannot block the CPU.
      pvpPhysicalInputsHeld[1].clear();
      const cpu = pvpPlayers[1];
      if (cpu) {
        cpu.inputHeld = false;
        cpu.charging = false;
      }
      game.pvpCpuPlan = null;
      game.pvpCpuDecisionTimer = 0;

      if (playFeedback) {
        tone(game.pvpCpuEnabled ? 620 : 360, 0.06, 0.014, game.pvpCpuEnabled ? 70 : -45);
        if (game.pvpCpuEnabled) tone(820,0.05,0.010,55,0.05);
      }
    }

    function cyclePvpCpuDifficulty(direction = 1) {
      game.pvpCpuDifficulty = ((clamp(game.pvpCpuDifficulty || 1,1,9)-1+direction+9)%9)+1;
      game.pvpCpuEnabled = true;
      tone(380 + game.pvpCpuDifficulty * 32,0.04,0.010,30);
    }

    function getPvpRoundGoalLabel() {
      if (isPvpEndlessMode()) return "ENDLESS";
      return `FIRST TO ${game.pvpFirstTo || 5}`;
    }

    function cyclePvpSetting(setting, direction = 1) {
      if (setting === "unpause") {
        game.pvpUnpauseCountdown = !game.pvpUnpauseCountdown;
        savePvpUnpauseCountdown(game.pvpUnpauseCountdown);
        tone(game.pvpUnpauseCountdown ? 560 : 340, 0.05, 0.012, game.pvpUnpauseCountdown ? 45 : -35);
        return;
      }
      if (setting === "roundGoal") {
        const current = isPvpEndlessMode() ? 2 : (game.pvpFirstTo >= 10 ? 1 : 0);
        const next = (current + direction + 3) % 3;
        if (next === 2) {
          game.pvpRoundGoalMode = "endless";
          if (!game.pvpTimeLimitSeconds || game.pvpTimeLimitSeconds <= 0) game.pvpTimeLimitSeconds = 30;
        } else {
          game.pvpRoundGoalMode = "firstto";
          game.pvpFirstTo = next === 1 ? 10 : 5;
        }
        tone(next === 2 ? 590 : next === 1 ? 520 : 450,0.045,0.010,35);
        return;
      }
      const values = setting === "time" ? (isPvpEndlessMode() ? [30,60,90] : [0,30,60,90]) : [1,3,5];
      const field = setting === "time" ? "pvpTimeLimitSeconds" : "pvpBestOf";
      const current = Math.max(0,values.indexOf(game[field]));
      game[field] = values[(current + direction + values.length) % values.length];
      tone(420 + values.indexOf(game[field]) * 70,0.045,0.010,35);
    }

    function hasUnlockedAllStandardFrogSkins() {
      return FROG_SKIN_ORDER.every((skinId) => skinId === "azure" || isFrogSkinUnlocked(skinId));
    }

    function recordPvpBonk(attackerIndex, victim, options = {}) {
      if (game.onlinePredicting) return;
      const index = clamp(Number(attackerIndex) || 0, 0, 1);
      const attacker = pvpPlayers[index];
      game.pvpBonkCounts[index] = (game.pvpBonkCounts[index] || 0) + 1;
      game.pvpRoundBonkCounts[index] = (game.pvpRoundBonkCounts[index] || 0) + 1;
      game.pvpMatchBonkCounts[index] = (game.pvpMatchBonkCounts[index] || 0) + 1;
      if (game.pvpRoundBonkCounts[index] >= 10) markPvpAchievementEarned("pvp-ten-bonks", index, true);
      if (attacker?.wallBouncedThisJump) markPvpAchievementEarned("pvp-wall-bonk", index, true);
      statsProfile.pvpBonksDealt += 1;
      if (victim) statsProfile.pvpTimesBonked += 1;
      if (attacker && (!attacker.grounded || attacker.airTime > 0)) {
        attacker.bonksThisJump = (attacker.bonksThisJump || 0) + 1;
        if (attacker.bonksThisJump >= 2) markPvpAchievementEarned("pvp-double-bonk", index, true);
      }
      if (attacker && attacker.openingJumpActive && !attacker.hasRegisteredFirstJumpBonk) {
        attacker.hasRegisteredFirstJumpBonk = true;
        attacker.openingJumpActive = false;
        markPvpAchievementEarned("pvp-first-jump-bonk", index, true);
      }
      if (game.pvpBonkCounts[index] >= 50) markPvpAchievementEarned("pvp-bonk-50", index, true);
      const priorStunEnd = Number(options.previousStunEndAt);
      if (Number.isFinite(priorStunEnd) && priorStunEnd > 0 && game.pvpElapsed - priorStunEnd <= 1.0 + STEP) {
        markPvpAchievementEarned("pvp-fast-rebonk", index, true);
      }
      saveStatsProfile();
    }

    function recordPvpBounceStat(playerIndex, amount = 1) {
      if (game.onlinePredicting) return;
      // The Friends account owns the active human frog, which may be Player 1
      // or Player 2 in Local/Online Versus. CPU and remote frogs never advance
      // the account's bounce statistics or achievement progress.
      if (isAchievementEligibleHumanPvpIndex(playerIndex)) {
        statsProfile.pvpBounces += Math.max(0, Math.floor(amount));
        saveStatsProfile();
      }
    }

    function openPvpSettingsMenu(playFeedback = true) {
      game.state = "pvpSettings";
      game.pvpSettingsFocusIndex = 0;
      if (playFeedback) tone(430, 0.055, 0.012, 70);
    }

    function closePvpSettingsMenu(playFeedback = true) {
      if (OnlineVersus.hasRoom() && !OnlineVersus.isActive()) { OnlineVersus.closeSettings(); return; }
      game.state = "pvpSetup";
      game.pvpSetupFocusArea = "bottom";
      game.pvpSetupBottomSelection = "settings";
      if (playFeedback) tone(330, 0.045, 0.010, -35);
    }

    function movePvpSettingsFocus(horizontal = 0, vertical = 0) {
      if (vertical) game.pvpSettingsFocusIndex = (game.pvpSettingsFocusIndex + vertical + 5) % 5;
      if (horizontal && game.pvpSettingsFocusIndex < 4) cyclePvpSetting(["roundGoal","time","bestOf","unpause"][game.pvpSettingsFocusIndex],horizontal);
    }

    function activatePvpSettingsSelection() {
      if (game.pvpSettingsFocusIndex === 4) closePvpSettingsMenu();
      else cyclePvpSetting(["roundGoal","time","bestOf","unpause"][game.pvpSettingsFocusIndex],1);
    }

    function movePvpSkinFocus(playerIndex, direction) {
      const current = game.pvpSetupSkinIndex[playerIndex] || 0;
      let next = current;
      for (let attempts = 0; attempts < PVP_FROG_SKIN_ORDER.length; attempts += 1) {
        next = (next + direction + PVP_FROG_SKIN_ORDER.length) % PVP_FROG_SKIN_ORDER.length;
        const candidate = PVP_FROG_SKIN_ORDER[next];
        if (!isCustomPvpSkinId(candidate) || isPvpSkinAvailable(candidate)) break;
      }
      game.pvpSetupSkinIndex[playerIndex] = next;
      const id = PVP_FROG_SKIN_ORDER[next];
      const conflict = id === game.pvpSetupSkinIds[1 - playerIndex];
      const available = isPvpSkinAvailable(id);
      game.pvpSetupConflictOwnerIndex = conflict ? playerIndex : (playerIndex === 0 ? 1 : 0);
      tone(available && !conflict ? (playerIndex === 0 ? 480 : 390) : 190, 0.04, 0.010, available && !conflict ? 30 : -35);
    }

    function confirmPvpSkinSelection(playerIndex) {
      const id = getPvpSetupPreviewSkinId(playerIndex);
      const index = Math.max(0, PVP_FROG_SKIN_ORDER.indexOf(id));
      const otherIndex = 1 - playerIndex;
      const otherId = normalizePvpSkinId(
        game.pvpSetupSkinIds[otherIndex],
        otherIndex === 0 ? "azure" : "crimson"
      );

      if (!isPvpSkinAvailable(id)) {
        playLockedSkinSound();
        return false;
      }

      if (id === otherId) {
        game.pvpSetupConflictOwnerIndex = playerIndex;
        playLockedSkinSound();
        return false;
      }

      game.pvpSetupConflictOwnerIndex = 1 - playerIndex;
      game.pvpSetupSkinIds[playerIndex] = id;
      game.pvpSetupSkinIndex[playerIndex] = index;
      saveLastPvpSkinSelections(game.pvpSetupSkinIds);
      tone(playerIndex === 0 ? 540 : 430, 0.055, 0.013, 65);
      return true;
    }

    function selectPvpSetupLevel(index, playFeedback = true) {
      const nextIndex = (index + PVP_STAGE_ORDER.length) % PVP_STAGE_ORDER.length;
      const levelId = PVP_STAGE_ORDER[nextIndex];
      game.pvpSetupLevelIndex = nextIndex;
      game.pvpSetupLevelId = levelId;
      if (levelId === "random") refreshPvpRandomPreview();
      if (playFeedback) tone(460, 0.04, 0.010, 30);
    }

    function movePvpSetupFocus(horizontal = 0, vertical = 0) {
      const area = game.pvpSetupFocusArea;
      if (area === "level") {
        let index = game.pvpSetupLevelIndex;
        if (horizontal) index = (index + horizontal + PVP_STAGE_ORDER.length) % PVP_STAGE_ORDER.length;
        else if (vertical < 0) {
          if (index <= 2) { game.pvpSetupFocusArea = "bottom"; game.pvpSetupBottomSelection = index === 2 ? "time" : index === 1 ? "settings" : "start"; return; }
          index = index >= 6 ? 4 : index - 3;
        } else if (vertical > 0) {
          if (index <= 2) index += 3;
          else if (index <= 5) index = 6;
          else { game.pvpSetupFocusArea = "skin"; game.pvpSetupPlayerIndex = 0; game.pvpSetupLevelIndex = Math.max(0, game.pvpSetupLevelIndex); return; }
        }
        selectPvpSetupLevel(index);
        return;
      }
      if (area === "skin") {
        if (horizontal) movePvpSkinFocus(game.pvpSetupPlayerIndex, horizontal);
        if (vertical < 0) {
          game.pvpSetupFocusArea = "level";
          game.pvpSetupLevelIndex = game.pvpSetupPlayerIndex === 0 ? 3 : 5;
        } else if (vertical > 0) {
          if (game.pvpCpuEnabled && game.pvpSetupPlayerIndex === 1) {
            game.pvpSetupFocusArea = "cpuDifficulty";
            tone(445, 0.04, 0.010, 25);
          } else {
            game.pvpSetupFocusArea = "bottom";
            game.pvpSetupBottomSelection = game.pvpSetupPlayerIndex === 0 ? "start" : "back";
            tone(game.pvpSetupPlayerIndex === 0 ? 485 : 365, 0.04, 0.010, 30);
          }
        }
        return;
      }
      if (area === "cpuDifficulty") {
        if (horizontal) cyclePvpCpuDifficulty(horizontal);
        if (vertical < 0) {
          game.pvpSetupFocusArea = "skin";
          game.pvpSetupPlayerIndex = 1;
          tone(445, 0.04, 0.010, 25);
        } else if (vertical > 0) {
          game.pvpSetupFocusArea = "bottom";
          game.pvpSetupBottomSelection = "back";
          tone(365, 0.04, 0.010, 25);
        }
        return;
      }
      if (area === "bottom") {
        const options = ["wifi", "tutorial", "start", "back", "settings", "time"];
        if (horizontal) {
          const current = Math.max(0, options.indexOf(game.pvpSetupBottomSelection));
          game.pvpSetupBottomSelection = options[(current + horizontal + options.length) % options.length];
          tone(430, 0.04, 0.010, 30);
        }
        if (vertical < 0) {
          if (game.pvpSetupBottomSelection === "wifi") {
            game.pvpSetupFocusArea = "level";
            game.pvpSetupLevelIndex = 0;
          } else if (game.pvpSetupBottomSelection === "start") {
            game.pvpSetupFocusArea = "skin";
            game.pvpSetupPlayerIndex = 0;
          } else if (game.pvpSetupBottomSelection === "back") {
            if (game.pvpCpuEnabled) game.pvpSetupFocusArea = "cpuDifficulty";
            else { game.pvpSetupFocusArea = "skin"; game.pvpSetupPlayerIndex = 1; }
          } else {
            game.pvpSetupFocusArea = "level";
            game.pvpSetupLevelIndex = game.pvpSetupBottomSelection === "time" ? 2 : 1;
          }
        } else if (vertical > 0) {
          game.pvpSetupFocusArea = "level";
          game.pvpSetupLevelIndex = game.pvpSetupBottomSelection === "time" ? 2 : game.pvpSetupBottomSelection === "settings" ? 1 : 0;
        }
      }
    }

    function activatePvpSetupSelection() {
      if (game.pvpSetupFocusArea === "bottom") {
        if (game.pvpSetupBottomSelection === "wifi") OnlineVersus.open();
        else if (game.pvpSetupBottomSelection === "tutorial") window.RibbitRaceTutorialEngine?.start?.("pvp");
        else if (game.pvpSetupBottomSelection === "back") closePvpSetupMenu();
        else if (game.pvpSetupBottomSelection === "time") {
          if (isTimeSelectUnlocked()) cycleTimeOfDayMode(); else playLockedSkinSound();
        } else if (game.pvpSetupBottomSelection === "settings") openPvpSettingsMenu();
        else {
          if (!canStartPvpFromPreview()) { playLockedSkinSound(); return; }
          commitPvpPreviewSelections();
          startNewPvpCountdown(true);
        }
        return;
      }
      if (game.pvpSetupFocusArea === "level") {
        game.pvpSetupLevelId = PVP_STAGE_ORDER[game.pvpSetupLevelIndex];
        if (game.pvpSetupLevelId === "random") refreshPvpRandomPreview();
        tone(520, 0.045, 0.010, 35);
        return;
      }
      if (game.pvpSetupFocusArea === "vs") {
        togglePvpCpuMode();
        return;
      }
      if (game.pvpSetupFocusArea === "cpuDifficulty") {
        cyclePvpCpuDifficulty(1);
        return;
      }
      const playerIndex = game.pvpSetupPlayerIndex;
      if (!confirmPvpSkinSelection(playerIndex)) return;
      if (playerIndex === 0) {
        game.pvpSetupPlayerIndex = 1;
        // Keep Player 2's preview synchronized with its actual selection rather
        // than resetting the preview to Azure every time Player 1 confirms.
        game.pvpSetupSkinIndex[1] = Math.max(
          0,
          PVP_FROG_SKIN_ORDER.indexOf(normalizePvpSkinId(game.pvpSetupSkinIds[1], "crimson"))
        );
      } else {
        game.pvpSetupFocusArea = "bottom";
        game.pvpSetupBottomSelection = "start";
      }
    }

    // Kept as a compatibility helper for any older call sites.
    function getHomePreviewLevelId() {
      if (game.hoveredLevelId && LEVELS[game.hoveredLevelId]) return game.hoveredLevelId;
      if (
        game.randomButtonHovered ||
        (game.homeFocusVisible && game.homeSelection === "random") ||
        game.soloRandomLevelMode
      ) {
        return ensureSoloRandomPreview();
      }
      if (game.homeFocusVisible && LEVELS[game.homeSelection]) return game.homeSelection;
      return game.selectedLevelId;
    }

    function selectVictoryOption(option, playFeedback = true, source = "keyboard") {
      const valid = ["replay", "select", "home"];
      if (!valid.includes(option)) return;
      const changed = game.victorySelection !== option;
      game.victorySelection = option;
      if (source !== "mouse") {
        game.victoryMouseMode = false;
        if (game.mode === "pvp") game.pvpVictoryMouseMode = false;
      }
      if (changed && playFeedback) {
        tone(option === "replay" ? 430 : option === "select" ? 380 : 330, 0.045, 0.012, 40);
      }
    }

    function activateVictorySelection() {
      if (game.state !== "won" || game.winInputLock > 0) return;
      if (game.mode === "pvp") {
        if (game.onlineMode) {
          if(OnlineVersus.quickVictoryAction(game.victorySelection))return;
          if (game.victorySelection === "replay") {
            if (game.pvpMatchWinnerIndex !== null) OnlineVersus.returnToLobby();
            else if (OnlineVersus.isHostActive()) continuePvpMatch();
            else tone(240, .04, .008, -20);
          } else if (game.victorySelection === "select") OnlineVersus.returnToLobby();
          else OnlineVersus.leaveRoom();
          return;
        }
        if (game.victorySelection === "replay") continuePvpMatch();
        else if (game.victorySelection === "select") openPvpSetupMenu();
        else openMainMenu();
      } else if (game.victorySelection === "home") {
        returnToHomeScreen();
      } else {
        startNewGameCountdown();
      }
    }


    function openSoloSettingsMenu(playFeedback = true) {
      game.state = "soloSettings";
      game.soloSettingsFocusIndex = 0;
      game.homeSettingsButtonHovered = false;
      game.buttonHeld = false;
      game.cheatBuffer = "";
      frog.charging = false;
      if (playFeedback) {
        tone(460, 0.05, 0.012, 35);
        tone(620, 0.06, 0.009, 45, 0.035);
      }
    }

    function closeSoloSettingsMenu(playFeedback = true) {
      openSoloMenu(false);
      game.homeSelection = "settings";
      game.homeFocusVisible = true;
      if (playFeedback) tone(330, 0.05, 0.012, -45);
    }

    function toggleSoloEndlessMode(playFeedback = true) {
      game.soloEndlessMode = !game.soloEndlessMode;
      if (game.soloEndlessMode && Number(game.soloTimeLimitSeconds) <= 0) game.soloTimeLimitSeconds = 60;
      saveSoloEndlessMode(game.soloEndlessMode);
      saveSoloTimeLimit(game.soloTimeLimitSeconds);
      if (playFeedback) {
        tone(game.soloEndlessMode ? 560 : 360, 0.05, 0.012, game.soloEndlessMode ? 30 : -25);
      }
    }

    function moveSoloSettingsFocus(direction = 0) {
      const optionCount = 4;
      game.soloSettingsFocusIndex = (Number(game.soloSettingsFocusIndex || 0) + direction + optionCount) % optionCount;
      tone(game.soloSettingsFocusIndex === 3 ? 340 : 470, 0.035, 0.008, direction >= 0 ? 25 : -20);
    }

    function activateSoloSettingsSelection(direction = 1) {
      if (game.soloSettingsFocusIndex === 0) {
        toggleSoloEndlessMode();
      } else if (game.soloSettingsFocusIndex === 1) {
        game.soloCatchGoal = game.soloCatchGoal === 10 ? 5 : 10;
        saveSoloCatchGoal(game.soloCatchGoal);
        tone(game.soloCatchGoal === 10 ? 610 : 430, 0.05, 0.012, 35);
      } else if (game.soloSettingsFocusIndex === 2) {
        const values = game.soloEndlessMode ? [30, 60, 90] : [0, 30, 60, 90];
        const current = Math.max(0, values.indexOf(Number(game.soloTimeLimitSeconds)));
        game.soloTimeLimitSeconds = values[(current + direction + values.length) % values.length];
        saveSoloTimeLimit(game.soloTimeLimitSeconds);
        tone(game.soloTimeLimitSeconds ? 520 + current * 35 : 350, 0.05, 0.012, 30);
      } else {
        closeSoloSettingsMenu();
      }
    }

    function openAchievementsMenu(playFeedback = true) {
      game.utilityReturnState = game.state === "title" ? "title" : "main";
      game.state = "achievements";
      const selected = Number.isInteger(game.achievementSelectionIndex)
        ? clamp(game.achievementSelectionIndex, 0, MENU_ACHIEVEMENT_DEFINITIONS.length - 1)
        : 0;
      game.achievementPage = Math.floor(selected / CONFIG.achievementItemsPerPage);
      game.achievementFocusArea = "item";
      game.achievementFocusIndex = selected;
      game.achievementHoveredIndex = null;
      game.buttonHeld = false;
      game.cheatBuffer = "";
      frog.charging = false;
      if (playFeedback) {
        tone(523, 0.055, 0.013, 70);
        tone(698, 0.065, 0.010, 75, 0.045);
      }
    }

    function closeAchievementsMenu(playFeedback = true) {
      game.achievementHoveredIndex = null;
      if (game.utilityReturnState === "title") {
        openSoloMenu(false);
        game.homeSelection = "achievements";
        game.homeFocusVisible = true;
      } else {
        openMainMenu(false);
        game.mainSelection = "achievements";
        game.mainFocusVisible = true;
      }
      if (playFeedback) tone(330, 0.05, 0.012, -45);
    }

    function moveAchievementFocus(horizontal = 0, vertical = 0) {
      const pageIndices = getAchievementIndicesOnPage();
      if (!pageIndices.length) return;
      const controls = ["back"];
      if (getAchievementPageCount() > 1) controls.push("pagePrev", "pageNext");
      controls.push("leaderboard");

      if (horizontal) {
        const sequence = [
          ...pageIndices.map((index) => ({ area:"item", index })),
          ...controls.map((area) => ({ area, index:null }))
        ];
        let at = sequence.findIndex((entry) => entry.area === game.achievementFocusArea &&
          (entry.area !== "item" || entry.index === game.achievementFocusIndex));
        if (at < 0) at = 0;
        const next = sequence[(at + horizontal + sequence.length) % sequence.length];
        game.achievementFocusArea = next.area;
        if (next.area === "item") {
          game.achievementFocusIndex = next.index;
          game.achievementHoveredIndex = next.index;
        } else game.achievementHoveredIndex = null;
        tone(next.area === "back" ? 340 : 470, 0.035, 0.008, horizontal > 0 ? 25 : -20);
        return;
      }

      if (game.achievementFocusArea !== "item") {
        game.achievementFocusArea = "item";
        game.achievementFocusIndex = vertical < 0 ? pageIndices[pageIndices.length - 1] : pageIndices[0];
        game.achievementHoveredIndex = game.achievementFocusIndex;
        tone(470, 0.035, 0.008, vertical > 0 ? 25 : -20);
        return;
      }

      let local = Math.max(0, pageIndices.indexOf(game.achievementFocusIndex));
      const columns = ACHIEVEMENTS_UI.columns;
      const row = Math.floor(local / columns);
      const column = local % columns;
      const maxRow = Math.floor((pageIndices.length - 1) / columns);
      if (vertical > 0 && row === maxRow) {
        const bottom = column === 0 ? "pagePrev" : column === 1 ? "back" : "pageNext";
        game.achievementFocusArea = getAchievementPageCount() > 1 ? bottom : (column === 2 ? "leaderboard" : "back");
        game.achievementHoveredIndex = null;
        return;
      }
      if (vertical < 0 && row === 0) {
        game.achievementFocusArea = column === 0 ? "leaderboard" : "back";
        game.achievementHoveredIndex = null;
        return;
      }
      const nextRow = (row + vertical + maxRow + 1) % (maxRow + 1);
      let nextLocal = nextRow * columns + column;
      if (nextLocal >= pageIndices.length) nextLocal = pageIndices.length - 1;
      game.achievementFocusIndex = pageIndices[nextLocal];
      game.achievementHoveredIndex = game.achievementFocusIndex;
      tone(470, 0.035, 0.008, vertical > 0 ? 25 : -20);
    }


    function activateAchievementSelection() {
      if (game.achievementFocusArea === "pagePrev") {
        setAchievementPage(game.achievementPage - 1);
      } else if (game.achievementFocusArea === "pageNext") {
        setAchievementPage(game.achievementPage + 1);
      } else if (game.achievementFocusArea === "leaderboard") {
        window.RibbitRaceOpenLeaderboard?.();
      } else if (game.achievementFocusArea === "back") {
        closeAchievementsMenu();
      }
    }


    function openStatsMenu(playFeedback = true) {
      hideRgbValueEditor(true);
      game.utilityReturnState = game.state === "title" ? "title" : "main";
      game.state = "stats";
      game.statsPage = clamp(game.statsPage, 0, getStatsPageCount() - 1);
      game.statsFocusArea = "back";
      game.buttonHeld = false;
      game.cheatBuffer = "";
      frog.charging = false;
      if (playFeedback) {
        tone(392, 0.055, 0.013, 65);
        tone(587, 0.065, 0.010, 75, 0.045);
      }
    }

    function closeStatsMenu(playFeedback = true) {
      if (game.utilityReturnState === "title") {
        openSoloMenu(false);
        game.homeSelection = "stats";
        game.homeFocusVisible = true;
      } else {
        openMainMenu(false);
        game.mainSelection = "stats";
        game.mainFocusVisible = true;
      }
      if (playFeedback) tone(330, 0.05, 0.012, -45);
    }

    function getStatsMetrics() {
      const fastest = getFastestCompletionTime();
      return [
        { label: "TOTAL JUMPS", value: String(game.totalJumps), icon: "jump" },
        { label: "FLIES CAUGHT", value: String(game.totalFliesEaten), icon: "fly" },
        { label: "DISTANCE JUMPED", value: formatStatDistance(statsProfile.distanceJumpedPx), icon: "distance" },
        { label: "PERFECT JUMPS", value: String(statsProfile.perfectJumps), icon: "perfect" },
        { label: "BEST FLY COMBO", value: String(statsProfile.maxFliesOneJump), icon: "combo" },
        { label: "LONGEST AIR TIME", value: `${statsProfile.longestAirTime.toFixed(1)} SEC`, icon: "air" },
        { label: "FASTEST FINISH", value: fastest === null ? "--:--.-" : formatTime(fastest), icon: "clock" },
        { label: "LEVEL WINS", value: String(statsProfile.totalWins), icon: "trophy" },
        { label: "WALL BOUNCES", value: String(statsProfile.wallBounces), icon: "bounce" },
        { label: "FLIES SPAT BACK", value: String(statsProfile.wrongFlies), icon: "spit" },
        { label: "PVP BONKS", value: String(statsProfile.pvpBonksDealt), icon: "pvpBonk" },
        { label: "TIMES BONKED", value: String(statsProfile.pvpTimesBonked), icon: "bonk-max" },
        { label: "PVP BOUNCES", value: String(statsProfile.pvpBounces), icon: "bounce" },
        { label: "PVP MATCH WINS", value: String(statsProfile.pvpMatchWins), icon: "trophy" }
      ];
    }

    const PAUSE_OPTION_ORDER = Object.freeze(["continue", "restart", "home"]);

    function selectPauseOption(option, playFeedback = true, focusVisible = true) {
      if (!PAUSE_OPTION_ORDER.includes(option)) return;
      const changed = game.pauseSelection !== option;
      game.pauseSelection = option;
      game.pauseFocusVisible = focusVisible;
      if (focusVisible) game.pauseHoveredSelection = null;
      if (changed && playFeedback) {
        const frequency = option === "continue" ? 430 : option === "restart" ? 365 : 300;
        tone(frequency, 0.045, 0.012, 35);
      }
    }

    function movePauseSelection(direction) {
      game.pauseFocusVisible = true;
      game.pauseHoveredSelection = null;
      game.pausePressedSelection = null;
      if (direction === "left") {
        selectPauseOption(game.pauseSelection === "home" ? "continue" : "continue");
      } else if (direction === "right") {
        selectPauseOption(game.pauseSelection === "home" ? "restart" : "restart");
      } else if (direction === "up") {
        if (game.pauseSelection === "home") selectPauseOption("continue");
        else selectPauseOption("home");
      } else if (direction === "down") {
        if (game.pauseSelection === "home") selectPauseOption("continue");
        else selectPauseOption("home");
      }
    }

    function restartCurrentLevel() {
      game.buttonHeld = false;
      frog.charging = false;
      if (game.mode === "pvp") {
        resetPvpGame();
        startResumeCountdown();
        return;
      }
      resetGame(false);
      if (game.sandboxMode) {
        prepareSandboxRound();
        game.state = "playing";
        return;
      }
      // Build the frozen countdown backing frame only after the reset has placed
      // the frog at the level start and removed the previous run's flies/tongue.
      clearSoloFrozenWorld();
      game.state = "playing";
      try { drawScene(); captureSoloFrozenWorld(); } catch (_) {}
      startResumeCountdown();
    }

    function capturePauseChargeSnapshot() {
      game.pauseChargeSnapshot = {
        solo: {
          charging: Boolean(frog.charging),
          charge: frog.charge,
          chargeDirection: frog.chargeDirection,
          chargeHoldTime: frog.chargeHoldTime,
          held: soloPhysicalInputsHeld.size > 0 || game.buttonHeld
        },
        pvp: pvpPlayers.map((player, index) => ({
          charging: Boolean(player.charging),
          charge: player.charge,
          chargeDirection: player.chargeDirection,
          chargeHoldTime: player.chargeHoldTime,
          chargeFacingDir: player.chargeFacingDir,
          held: index === getPvpCpuIndex() && game.pvpCpuEnabled ? Boolean(player.inputHeld) : isPvpPhysicalJumpHeld(index)
        }))
      };
    }

    function restorePauseChargeSnapshot() {
      const snapshot = game.pauseChargeSnapshot;
      game.pauseChargeSnapshot = null;
      game.resumeChargeAfterCountdown = false;
      if (!snapshot) return;
      if (game.mode === "pvp") {
        pvpPlayers.forEach((player, index) => {
          const saved = snapshot.pvp?.[index];
          if (!saved?.charging || !player.grounded || player.bonked || player.stunTimer > 0) return;
          player.charge = clamp(saved.charge, 0.04, 1);
          player.chargeDirection = saved.chargeDirection || 1;
          player.chargeHoldTime = Math.max(0, saved.chargeHoldTime || 0);
          player.chargeFacingDir = saved.chargeFacingDir >= 0 ? 1 : -1;
          player.dir = player.chargeFacingDir;
          player.charging = true;
          const heldNow = index === getPvpCpuIndex() && game.pvpCpuEnabled ? saved.held : isPvpPhysicalJumpHeld(index);
          player.inputHeld = heldNow;
          if (!heldNow) { player.inputHeld = true; releasePvpButton(index, "system"); }
        });
      } else if (snapshot.solo?.charging && frog.grounded) {
        frog.charge = clamp(snapshot.solo.charge, 0.04, 1);
        frog.chargeDirection = snapshot.solo.chargeDirection || 1;
        frog.chargeHoldTime = Math.max(0, snapshot.solo.chargeHoldTime || 0);
        frog.charging = true;
        const heldNow = soloPhysicalInputsHeld.size > 0;
        game.buttonHeld = heldNow;
        if (!heldNow) { game.buttonHeld = true; releaseMainButton(); }
      }
    }

    function resumePausedGame() {
      if (game.mode === "pvp" && !game.pvpUnpauseCountdown) {
        game.state = "playing";
        game.countdownNumber = 0;
        game.countdownTimer = 0;
        restorePauseChargeSnapshot();
        playCountdownGoSound();
      } else {
        game.resumeChargeAfterCountdown = true;
        startResumeCountdown(true);
      }
    }

    function activatePauseSelection() {
      if (game.state !== "paused") return;
      if (game.pauseSelection === "home") {
        if (game.sandboxMode) closeFrogSandbox();
        else returnToHomeScreen();
      } else if (game.pauseSelection === "restart") {
        restartCurrentLevel();
      } else {
        resumePausedGame();
      }
    }

    function ensureAudio() {
      if (!audioContext) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (AudioCtor) audioContext = new AudioCtor();
      }
      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }
    }

    function tone(frequency, duration = 0.08, volume = 0.035, slide = 0, delay = 0) {
      if (game.muted || game.volume <= 0.001) return;
      ensureAudio();
      if (!audioContext) return;

      const start = audioContext.currentTime + delay;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.linearRampToValueAtTime(Math.max(45, frequency + slide), start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        volume * game.volume * CONFIG.soundVolumeMultiplier,
        start + 0.008
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    }

    function playJumpSound(power) {
      tone(145 + power * 90, 0.10, 0.035, 75 + power * 90);
    }

    function playCorrectFlySound() {
      // Bright upward arpeggio: a distinct confirmation that the translation
      // was correct, separate from the tongue and fly-spawn sounds.
      tone(660, 0.07, 0.030, 115);
      tone(880, 0.08, 0.026, 135, 0.055);
      tone(1175, 0.10, 0.021, 110, 0.115);
    }

    function playWrongFlySound(delay = 0) {
      // A louder, more noticeable wrong-answer effect: an immediate swallow
      // gulp followed by a clear spit-out sequence when the fly is returned.
      tone(205, 0.08, 0.034, -65, 0);
      tone(132, 0.11, 0.028, -35, 0.045);
      tone(320, 0.09, 0.030, -145, delay);
      tone(205, 0.10, 0.025, -95, delay + 0.070);
      tone(120, 0.12, 0.020, -35, delay + 0.145);
    }

    function playDazedSound(playerIndex = 0) {
      const base = playerIndex === 0 ? 185 : 165;
      tone(base + 70, 0.10, 0.024, -105);
      tone(base, 0.11, 0.021, 85, 0.055);
      tone(base + 45, 0.12, 0.018, -80, 0.120);
      tone(82, 0.16, 0.016, -18, 0.040);
    }

    function playFlySpawnSound() {
      // A short one-time shimmer when a fly materializes. No looping or
      // continuous fly-in-play sound is used.
      tone(330, 0.07, 0.018, 210);
      tone(590, 0.08, 0.014, 120, 0.045);
    }

    function playCountdownSound(number) {
      const frequencies = { 3: 392, 2: 466, 1: 587 };
      const frequency = frequencies[number] || 392;
      tone(frequency, 0.10, 0.022, 34);
      tone(frequency / 2, 0.08, 0.010, 18, 0.018);
    }

    function playUrgentClockTick(second = 1) {
      const finalTick = Number(second) <= 1;
      if (finalTick) {
        tone(740, 0.13, 0.027, 90);
        tone(988, 0.15, 0.018, 100, 0.055);
      } else {
        tone(440, 0.082, 0.024, 0);
        tone(880, 0.034, 0.009, -15, 0.020);
      }
    }

    function playCountdownGoSound() {
      tone(784, 0.15, 0.026, 150);
      tone(1047, 0.18, 0.020, 145, 0.045);
      tone(1319, 0.20, 0.014, 70, 0.090);
    }

    function playWinSound() {
      // A compact 8-bit victory melody rather than a single notification chime.
      const melody = [
        [523, 0.11, 0.00],
        [659, 0.11, 0.13],
        [784, 0.13, 0.26],
        [1047, 0.18, 0.41],
        [880, 0.11, 0.62],
        [988, 0.11, 0.75],
        [1175, 0.12, 0.88],
        [1319, 0.28, 1.03]
      ];

      melody.forEach(([frequency, duration, delay], index) => {
        tone(frequency, duration, index === melody.length - 1 ? 0.025 : 0.019, 24, delay);
      });
      tone(262, 0.18, 0.011, 18, 0.00);
      tone(392, 0.18, 0.010, 18, 0.41);
      tone(523, 0.30, 0.012, 28, 1.03);
    }

    function toggleMute() {
      game.muted = !game.muted;
      if (!game.muted) {
        if (game.volume <= 0.001) game.volume = 0.5;
        tone(440, 0.06, 0.025, 80);
      }
    }
