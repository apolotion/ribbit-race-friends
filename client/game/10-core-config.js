
    // -----------------------------
    // Easy-to-edit game settings
    // -----------------------------
    const CONFIG = Object.freeze({
      targetScore: 5,
      soloEndlessSeconds: 60,
      maxFlies: 4,
      gravity: 820,
      minimumJumpX: 120,
      maximumJumpX: 235,
      minimumJumpY: 0,
      maximumJumpY: 463,
      chargeSecondsOneWay: 0.8333333333,
      tongueReach: 64,
      tongueVerticalTolerance: 18,
      flyRespawnDelay: 2.0,
      secondFlySpawnDelay: 2.0,
      flySpawnMinimumSpacing: 1.0,
      flySpawnEffectDuration: 0.58,
      flyGrowDuration: 0.42,
      catchSparkleDuration: 0.25,
      wrongCatchBubbleDuration: 0.65,
      resumeCountdownStepDuration: 0.75,
      lakePlatformPeriod: 6.9333333333,
      soundVolumeMultiplier: 3.0,
      platformDropHoldThreshold: 0.25,
      platformDropVelocityY: 42,
      winDanceRevealDelay: 1.2,
      initialFrogOffsetX: 36,
      violetPondJumpTarget: 10,
      silverRoundJumpTarget: 100,
      silverRoundTimeTarget: 45,
      levelUnlockTimeTarget: 30,
      forestSpawnCatchWindow: 1.0,
      timeSelectFlyTarget: 25,
      emberFlyTarget: 100,
      achievementToastDuration: 3.0,
      achievementToastObstructedOpacity: 0.62,
      achievementItemsPerPage: 3 * 5,
      victoryNoticesPerPage: 2,
      pvpTargetScore: 5,
      pvpBonkMinStunSeconds: 1.0,
      pvpBonkMaxStunSeconds: 5.0,
      pvpBonkGravity: 180,
      pvpBonkMaxFallSpeed: 125,
      pvpFootstoolMinBoost: 165,
      pvpFootstoolMaxBoost: 430,
      pvpFootstoolMinAirTime: 0.25,
      pvpBonkMaxDropDistance: 240,
      pvpCollisionCooldown: 0.16,
      pvpRoundsToWin: 1,
      pvpSuddenDeathTarget: 3,
      pvpCelebrationSeconds: 1.65,
      jumpStreakPowerThreshold: 0.75,
      jumpStreakEmissionSeconds: 0.24,
      jumpStreakLifetime: 0.32,
      jumpStreakSampleInterval: 0.04,
      jumpStreakMaxPoints: 6,
      playBottom: 229,
      groundY: 214
    });

    const canvas = document.getElementById("game");
    const gameFrame = document.getElementById("game-frame");
    const friendsGameInputLocked = () => window.RibbitFriendsGameInputLocked?.() === true;
    const RIBBIT_DISPLAY_VERSION = "VERSION 1.7.10";
    const RIBBIT_CREDIT_TEXT = "MADE BY NICK M.";
    const RIBBIT_CREDIT_Y = 228;
    const rgbValueEditor = document.getElementById("rgb-value-editor");
    const fullscreenButton = document.getElementById("fullscreen-button");
    const fullscreenFallback = document.getElementById("fullscreen-fallback");
    const fullscreenNewTabButton = document.getElementById("fullscreen-new-tab");
    const fullscreenFocusModeButton = document.getElementById("fullscreen-focus-mode");
    const fullscreenFallbackCloseButton = document.getElementById("fullscreen-fallback-close");

    function getFullscreenElement() {
      return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function syncFullscreenButton() {
      const active = Boolean(getFullscreenElement()) || gameFrame.classList.contains("ribbit-focus-mode");
      fullscreenButton?.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
      fullscreenButton?.setAttribute("title", active ? "Exit fullscreen" : "Fullscreen");
    }

    function showFullscreenFallback() {
      if (fullscreenFallback) fullscreenFallback.hidden = false;
    }

    function hideFullscreenFallback() {
      if (fullscreenFallback) fullscreenFallback.hidden = true;
      canvas.focus({ preventScroll: true });
    }

    function setRibbitFocusMode(active) {
      gameFrame.classList.toggle("ribbit-focus-mode", Boolean(active));
      document.body.classList.toggle("ribbit-focus-active", Boolean(active));
      syncFullscreenButton();
      canvas.focus({ preventScroll: true });
    }

    async function toggleRibbitFullscreen() {
      hideFullscreenFallback();
      const native = getFullscreenElement();
      if (native) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) {
          await exit.call(document);
          return;
        }
      }
      if (gameFrame.classList.contains("ribbit-focus-mode")) {
        setRibbitFocusMode(false);
        return;
      }
      const fullscreenTarget = gameFrame.requestFullscreen || gameFrame.webkitRequestFullscreen ? gameFrame : canvas;
      const requestFullscreen = fullscreenTarget.requestFullscreen || fullscreenTarget.webkitRequestFullscreen;
      if (requestFullscreen) {
        try {
          await requestFullscreen.call(fullscreenTarget);
          setRibbitFocusMode(false);
          syncFullscreenButton();
          return;
        } catch (error) {
          console.warn("Native fullscreen unavailable; falling back to focus mode.", error);
        }
      }
      setRibbitFocusMode(true);
      showFullscreenFallback();
    }

    fullscreenButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleRibbitFullscreen();
    });
    fullscreenFallbackCloseButton?.addEventListener("click", hideFullscreenFallback);
    fullscreenFocusModeButton?.addEventListener("click", () => {
      fullscreenFallback.hidden = true;
      setRibbitFocusMode(true);
    });
    fullscreenNewTabButton?.addEventListener("click", () => {
      const opened = window.open(window.location.href, "_blank");
      if (opened) opened.opener = null;
      else {
        setRibbitFocusMode(true);
      }
      fullscreenFallback.hidden = true;
    });
    document.addEventListener("fullscreenchange", () => { syncFullscreenButton(); canvas.focus({ preventScroll: true }); });
    document.addEventListener("webkitfullscreenchange", () => { syncFullscreenButton(); canvas.focus({ preventScroll: true }); });

    // Preserve the original 480×270 logical grid. Coarse-touch devices render
    // at 960×540 to reduce Safari's per-frame pixel workload; desktop remains
    // at the original 1920×1080 backing resolution.
    const W = 480;
    const H = 270;
    const RIBBIT_COARSE_TOUCH_DEVICE = Boolean(
      navigator.maxTouchPoints > 0 && window.matchMedia?.("(pointer: coarse)")?.matches
    );
    const RIBBIT_MOBILE_MODE_STORAGE_KEY = "rrFriendsMobileModeV1";
    function isRibbitMobileMode() {
      try { return localStorage.getItem(RIBBIT_MOBILE_MODE_STORAGE_KEY) === "1"; }
      catch (_) { return false; }
    }
    function setRibbitMobileMode(enabled) {
      try { localStorage.setItem(RIBBIT_MOBILE_MODE_STORAGE_KEY, enabled ? "1" : "0"); }
      catch (_) {}
      document.body.classList.toggle("rr-mobile-enabled", Boolean(enabled));
      window.dispatchEvent(new CustomEvent("ribbit-mobile-mode-changed", { detail: { enabled: Boolean(enabled) } }));
    }
    const RENDER_SCALE = RIBBIT_COARSE_TOUCH_DEVICE ? 2 : 4;
    canvas.width = W * RENDER_SCALE;
    canvas.height = H * RENDER_SCALE;

    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const STEP = 1 / 120;

    const COLORS = Object.freeze({
      skyTop: "#71c6f2",
      skyBottom: "#91e5f6",
      cloud: "#eef8ff",
      cloudShade: "#c8f5fa",
      skyline: "#70b8df",
      hillDark: "#2d9b38",
      hillMid: "#55c947",
      hillLight: "#93ed58",
      grassDark: "#258b28",
      grass: "#75e237",
      grassLight: "#b6f45c",
      dirtDark: "#9b531e",
      dirt: "#f0a039",
      dirtLight: "#ffc055",
      ink: "#26363d",
      panel: "#3c3f42",
      panelLight: "#55595c",
      white: "#ffffff",
      accentBlue: "#0f9fbb",
      accentBlueLight: "#5ce5e8",
      accentBlueDark: "#07516a",
      hotPink: "#ff4f9a",
      hotPinkLight: "#ff9fc8",
      hotPinkDark: "#a81758",
      red: "#f33c2f",
      redDark: "#a51f1c",
      frogDark: "#07516a",
      frogMid: "#0f9fbb",
      frogLight: "#5ce5e8",
      frogBelly: "#b8f5dc",
      tongue: "#ff6478",
      tongueDark: "#b62d4b",
      flyBlack: "#132831",
      flyBlue: "#4ca9ff",
      flyYellow: "#ffd83d",
      stinkDark: "#35452f",
      stinkMid: "#91aa58",
      stinkLight: "#edf2a7"
    });

    // Eight original frog colorways inspired by the supplied ninja-frog palette
    // reference. Each palette is a complete interface theme as well as a frog
    // recolor; all artwork remains original.
    const FROG_SKIN_ORDER = Object.freeze([
      "azure", "crimson", "plum", "forest",
      "violet", "silver", "blossom", "ember"
    ]);
    const PVP_FROG_SKIN_ORDER = Object.freeze([...FROG_SKIN_ORDER, "custom1", "custom2", "custom3"]);

    const FROG_SKINS = Object.freeze({
      azure: Object.freeze({
        id: "azure", name: "AZURE",
        dark: "#07516a", mid: "#0f9fbb", light: "#5ce5e8", belly: "#b8f5dc",
        tongue: "#ff6478", tongueDark: "#b62d4b"
      }),
      crimson: Object.freeze({
        id: "crimson", name: "CRIMSON",
        dark: "#6b1624", mid: "#b72e3e", light: "#ef7582", belly: "#f8c7cc",
        tongue: "#f08a9a", tongueDark: "#913344"
      }),
      blossom: Object.freeze({
        id: "blossom", name: "BLOSSOM",
        dark: "#84365c", mid: "#d15d8d", light: "#f5a8c6", belly: "#ffe2ec",
        tongue: "#ffbad2", tongueDark: "#a65075"
      }),
      ember: Object.freeze({
        id: "ember", name: "EMBER",
        dark: "#22282d", mid: "#444b50", light: "#f39a46", belly: "#ffe0a3",
        tongue: "#ffb14f", tongueDark: "#a65b20"
      }),
      plum: Object.freeze({
        id: "plum", name: "PLUM",
        dark: "#4a2364", mid: "#7d3fa5", light: "#b9d85b", belly: "#e7f6b8",
        tongue: "#c9e56a", tongueDark: "#718e2d"
      }),
      forest: Object.freeze({
        id: "forest", name: "FOREST",
        dark: "#173f2c", mid: "#307545", light: "#d4dc48", belly: "#f3f4ad",
        tongue: "#e8e45a", tongueDark: "#85842c"
      }),
      silver: Object.freeze({
        id: "silver", name: "SILVER",
        dark: "#4a5059", mid: "#919ba5", light: "#e6e9ec", belly: "#ffffff",
        tongue: "#f2f4f7", tongueDark: "#8a929b"
      }),
      violet: Object.freeze({
        id: "violet", name: "VIOLET",
        dark: "#39204f", mid: "#6d3a8e", light: "#d657bc", belly: "#f6b1dc",
        tongue: "#f184cf", tongueDark: "#8d3b78"
      })
    });

    const DEFAULT_UNLOCKED_FROG_SKINS = Object.freeze(["azure"]);
    const FROG_UNLOCK_CHEAT = "";
    const PLAYTEST_TOGGLE_CODE = "playtest";
    const HATS_TEST_TOGGLE_CODE = "hatstest";
    const HIDDEN_CODE_BUFFER_LENGTH = Math.max(PLAYTEST_TOGGLE_CODE.length, HATS_TEST_TOGGLE_CODE.length);
    let playtestModeActive = false;
    let playtestSnapshot = null;

    function isPlaytestModeActive() {
      return playtestModeActive;
    }

    const FROG_SKIN_ACHIEVEMENTS = Object.freeze({
      azure: Object.freeze({ lines: ["STARTER FROG"] }),
      crimson: Object.freeze({ lines: ["BEAT PARK", "IN 25 SECONDS OR LESS"] }),
      plum: Object.freeze({ lines: ["CATCH 2 FLIES IN ONE JUMP", "ON SWAMP"] }),
      forest: Object.freeze({ lines: ["CATCH A FLY WITHIN 1 SECOND", "OF IT SPAWNING IN JUNGLE"] }),
      violet: Object.freeze({ lines: ["BEAT POND", "IN 10 JUMPS OR FEWER"] }),
      silver: Object.freeze({ lines: ["JUMP 100 TIMES IN ONE LAKE RUN", "FINISH IN 45 SECONDS OR LESS"] }),
      blossom: Object.freeze({ lines: ["JUMP ABOVE THE MAP ON GARDEN", "CATCH A FLY BEFORE LANDING"] }),
      ember: Object.freeze({ lines: ["EAT 100 FLIES IN TOTAL"] })
    });
    const ACHIEVEMENTS = Object.freeze([
      Object.freeze({ id: "crimson", name: "QUICK CROAK", icon: "stopwatch", kind: "frog", target: "crimson", lines: ["BEAT ANY LEVEL", "IN 25 SECONDS OR LESS"] }),
      Object.freeze({ id: "plum", name: "DOUBLE DINNER", icon: "doubleFly", kind: "frog", target: "plum", lines: ["CATCH 2 CORRECT FLIES", "IN ONE JUMP"] }),
      Object.freeze({ id: "forest", name: "FRESH CATCH", icon: "sparkFly", kind: "frog", target: "forest", lines: ["CATCH A FLY WITHIN 1 SECOND", "OF IT SPAWNING"] }),
      Object.freeze({ id: "violet", name: "POND HOP", icon: "footprints", kind: "frog", target: "violet", lines: ["BEAT POND", "IN 10 JUMPS OR FEWER"] }),
      Object.freeze({ id: "silver", name: "CENTURY HOP", icon: "jump", kind: "frog", target: "silver", lines: ["JUMP 100 TIMES IN ONE RUN", "AND FINISH IN 45 SECONDS OR LESS"] }),
      Object.freeze({ id: "blossom", name: "SKY SNACK", icon: "skyFly", kind: "frog", target: "blossom", lines: ["JUMP ABOVE THE MAP", "AND CATCH A FLY BEFORE LANDING"] }),
      Object.freeze({ id: "ember", name: "FLY FEAST", icon: "feast", kind: "frog", target: "ember", lines: ["EAT 100 FLIES", "IN TOTAL"] }),
      Object.freeze({ id: "speed15", name: "FLASH FINISH", icon: "speed-run", kind: "general", target: null, lines: ["BEAT ANY LEVEL", "IN LESS THAN 15 SECONDS"] }),
      Object.freeze({ id: "swampLevel", name: "PARK PASS", icon: "gate", kind: "level", target: "swamp", lines: ["BEAT PARK IN 30 SECONDS", "OR LESS"] }),
      Object.freeze({ id: "jungleLevel", name: "MARSH MARCH", icon: "vine", kind: "level", target: "jungle", lines: ["BEAT SWAMP IN 30 SECONDS", "OR LESS"] }),
      Object.freeze({ id: "pondLevel", name: "CANOPY CLEAR", icon: "jungle", kind: "level", target: "pond", lines: ["BEAT JUNGLE IN 30 SECONDS", "OR LESS"] }),
      Object.freeze({ id: "lakeLevel", name: "POND PASS", icon: "lily", kind: "level", target: "lake", lines: ["BEAT POND IN 30 SECONDS", "OR LESS"] }),
      Object.freeze({ id: "gardenLevel", name: "LAKE LEAP", icon: "boat", kind: "level", target: "garden", lines: ["BEAT LAKE IN 30 SECONDS", "OR LESS"] }),
      Object.freeze({ id: "timeSelect", name: "TIME FLIES", icon: "moonSun", kind: "time", target: "time", lines: ["EAT 25 FLIES", "IN TOTAL"] }),
      Object.freeze({ id: "customColor", name: "TRUE COLORS", icon: "palette", kind: "custom", target: "custom", lines: ["COMPLETE EVERY LEVEL", "IN 30 SECONDS OR LESS"] })
    ]);

    // Achievement-rule updates are additive only: an earned frog is never revoked
    // by a later patch. Unknown legacy IDs remain in storage in case a future build
    // reintroduces them.
    const FROG_ACHIEVEMENT_RULES_VERSION = 10;

    function readUnlockedFrogSkinIds() {
      const unlocked = new Set(DEFAULT_UNLOCKED_FROG_SKINS);
      try {
        const stored = JSON.parse(localStorage.getItem("ribbitRaceUnlockedFrogSkins") || "[]");
        if (Array.isArray(stored)) {
          for (const id of stored) if (FROG_SKINS[id]) unlocked.add(id);
        }
        localStorage.setItem("ribbitRaceAchievementRulesVersion", String(FROG_ACHIEVEMENT_RULES_VERSION));
      } catch (_) {
        // Corrupt or blocked storage falls back to the starter frog.
      }
      return unlocked;
    }

    const unlockedFrogSkinIds = readUnlockedFrogSkinIds();

    function saveUnlockedFrogSkinIds() {
      try {
        let preserved = [];
        try {
          const stored = JSON.parse(localStorage.getItem("ribbitRaceUnlockedFrogSkins") || "[]");
          if (Array.isArray(stored)) preserved = stored.map(String);
        } catch (_) {}
        localStorage.setItem(
          "ribbitRaceUnlockedFrogSkins",
          JSON.stringify([...new Set(preserved.concat([...unlockedFrogSkinIds]))])
        );
      } catch (_) {
        // Unlocks remain active for the current session when storage is blocked.
      }
    }

    function isFrogSkinUnlocked(id) {
      return isPlaytestModeActive() || DEFAULT_UNLOCKED_FROG_SKINS.includes(id) || unlockedFrogSkinIds.has(id);
    }

    function readTotalJumpCount() {
      try {
        const value = Number(localStorage.getItem("ribbitRaceTotalJumps"));
        return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
      } catch (_) {
        return 0;
      }
    }

    function saveTotalJumpCount(value) {
      try {
        localStorage.setItem("ribbitRaceTotalJumps", String(Math.max(0, Math.floor(value))));
      } catch (_) {
        // The counter still works for this session when storage is unavailable.
      }
    }

    function readTotalFlyCount() {
      try {
        const value = Number(localStorage.getItem("ribbitRaceTotalFliesEaten"));
        return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
      } catch (_) {
        return 0;
      }
    }

    function saveTotalFlyCount(value) {
      try {
        localStorage.setItem(
          "ribbitRaceTotalFliesEaten",
          String(Math.max(0, Math.floor(value)))
        );
      } catch (_) {
        // The counter still works for this session when storage is unavailable.
      }
    }

    const STATS_STORAGE_KEY = "ribbitRaceStatsV1";
    const PVP_MATCH_WINS_STORAGE_KEY = "ribbitRacePvpMatchWins";
    const SOLO_ENDLESS_STORAGE_KEY = "ribbitRaceSoloEndlessModeV1";
    const SOLO_CATCH_GOAL_STORAGE_KEY = "ribbitRaceSoloCatchGoalV1";
    const SOLO_TIME_LIMIT_STORAGE_KEY = "ribbitRaceSoloTimeLimitV1";
    const PVP_UNPAUSE_COUNTDOWN_STORAGE_KEY = "ribbitRacePvpUnpauseCountdownV1";

    function readSoloEndlessMode() {
      try {
        return localStorage.getItem(SOLO_ENDLESS_STORAGE_KEY) === "1";
      } catch (_) {
        return false;
      }
    }

    function saveSoloEndlessMode(enabled) {
      try {
        localStorage.setItem(SOLO_ENDLESS_STORAGE_KEY, enabled ? "1" : "0");
      } catch (_) {
        // The selection remains active for the current session if storage is blocked.
      }
    }

    function readSoloCatchGoal() {
      try {
        return Number(localStorage.getItem(SOLO_CATCH_GOAL_STORAGE_KEY)) === 10 ? 10 : 5;
      } catch (_) {
        return 5;
      }
    }

    function saveSoloCatchGoal(value) {
      try {
        localStorage.setItem(SOLO_CATCH_GOAL_STORAGE_KEY, String(value === 10 ? 10 : 5));
      } catch (_) {}
    }

    function readSoloTimeLimit() {
      try {
        const stored = localStorage.getItem(SOLO_TIME_LIMIT_STORAGE_KEY);
        if (stored === null) return readSoloEndlessMode() ? CONFIG.soloEndlessSeconds : 0;
        const value = Number(stored);
        return [0, 30, 60, 90].includes(value) ? value : (readSoloEndlessMode() ? CONFIG.soloEndlessSeconds : 0);
      } catch (_) {
        return readSoloEndlessMode() ? CONFIG.soloEndlessSeconds : 0;
      }
    }

    function saveSoloTimeLimit(value) {
      try {
        const normalized = [0, 30, 60, 90].includes(Number(value)) ? Number(value) : 60;
        localStorage.setItem(SOLO_TIME_LIMIT_STORAGE_KEY, String(normalized));
      } catch (_) {}
    }

    function readPvpUnpauseCountdown() {
      try {
        const stored = localStorage.getItem(PVP_UNPAUSE_COUNTDOWN_STORAGE_KEY);
        return stored === null ? true : stored === "1";
      } catch (_) {
        return true;
      }
    }

    function savePvpUnpauseCountdown(enabled) {
      try {
        localStorage.setItem(PVP_UNPAUSE_COUNTDOWN_STORAGE_KEY, enabled ? "1" : "0");
      } catch (_) {
        // The selection remains active for the current session if storage is blocked.
      }
    }

    const DEFAULT_STATS_PROFILE = Object.freeze({
      distanceJumpedPx: 0,
      perfectJumps: 0,
      maxFliesOneJump: 0,
      totalWins: 0,
      longestAirTime: 0,
      wrongFlies: 0,
      wallBounces: 0,
      bonusFinishes: 0,
      maxFinalScore: 0,
      pvpBonksDealt: 0,
      pvpTimesBonked: 0,
      pvpBounces: 0,
      pvpMatchWins: 0
    });

    function readStatsProfile() {
      try {
        const stored = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || "{}");
        const result = {};
        for (const [key, fallback] of Object.entries(DEFAULT_STATS_PROFILE)) {
          const value = Number(stored[key]);
          result[key] = Number.isFinite(value) && value >= 0 ? value : fallback;
        }
        result.perfectJumps = Math.floor(result.perfectJumps);
        result.maxFliesOneJump = Math.floor(result.maxFliesOneJump);
        result.totalWins = Math.floor(result.totalWins);
        result.wrongFlies = Math.floor(result.wrongFlies);
        result.wallBounces = Math.floor(result.wallBounces);
        result.bonusFinishes = Math.floor(result.bonusFinishes);
        result.maxFinalScore = Math.floor(result.maxFinalScore);
        result.pvpBonksDealt = Math.floor(result.pvpBonksDealt);
        result.pvpTimesBonked = Math.floor(result.pvpTimesBonked);
        result.pvpBounces = Math.floor(result.pvpBounces);
        const dedicatedPvpWins = Number(localStorage.getItem(PVP_MATCH_WINS_STORAGE_KEY));
        result.pvpMatchWins = Math.floor(Math.max(
          result.pvpMatchWins,
          Number.isFinite(dedicatedPvpWins) && dedicatedPvpWins >= 0 ? dedicatedPvpWins : 0
        ));
        return result;
      } catch (_) {
        return { ...DEFAULT_STATS_PROFILE };
      }
    }

    let statsProfile = readStatsProfile();

    function saveStatsProfile() {
      try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(statsProfile));
      } catch (_) {
        // Statistics remain available for the current session if storage is blocked.
      }
    }

    function savePvpMatchWinsForLeaderboard() {
      try {
        localStorage.setItem(
          PVP_MATCH_WINS_STORAGE_KEY,
          String(Math.max(0, Math.floor(Number(statsProfile.pvpMatchWins) || 0)))
        );
      } catch (_) {
        // The current session still retains the match-win total if storage is blocked.
      }
    }

    function getFastestCompletionTime() {
      const records = LEVEL_ORDER
        .map((levelId) => readBestTime(levelId))
        .filter((value) => Number.isFinite(value) && value > 0);
      return records.length ? Math.min(...records) : null;
    }

    function formatStatDistance(pixelDistance) {
      const screens = Math.max(0, Number(pixelDistance) || 0) / W;
      return `${screens.toFixed(screens >= 100 ? 0 : 1)} SCREENS`;
    }

    const CUSTOM_FROG_COLOR_OPTIONS = Object.freeze([
      Object.freeze({ id: "cyan",   name: "CYAN",   hex: "#0f9fbb" }),
      Object.freeze({ id: "red",    name: "RED",    hex: "#c23a4b" }),
      Object.freeze({ id: "purple", name: "PURPLE", hex: "#7d3fa5" }),
      Object.freeze({ id: "green",  name: "GREEN",  hex: "#3a8b50" }),
      Object.freeze({ id: "violet", name: "VIOLET", hex: "#9b4fb8" }),
      Object.freeze({ id: "silver", name: "SILVER", hex: "#aeb7c0" }),
      Object.freeze({ id: "pink",   name: "PINK",   hex: "#df6fa2" }),
      Object.freeze({ id: "orange", name: "ORANGE", hex: "#ef9141" })
    ]);

    function normalizeHexColor(value, fallback) {
      const text = String(value || "").trim();
      return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
    }

    function hexToRgb(value, fallback = "#000000") {
      const hex = normalizeHexColor(value, fallback).slice(1);
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }

    function rgbToHex(red, green, blue) {
      const channel = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
      return `#${channel(red)}${channel(green)}${channel(blue)}`;
    }

    function mixHexColors(first, second, amount) {
      const a = normalizeHexColor(first, "#0f9fbb").slice(1);
      const b = normalizeHexColor(second, "#ffffff").slice(1);
      const t = clamp(amount, 0, 1);
      const parts = [0, 2, 4].map((offset) => {
        const start = parseInt(a.slice(offset, offset + 2), 16);
        const end = parseInt(b.slice(offset, offset + 2), 16);
        return Math.round(lerp(start, end, t)).toString(16).padStart(2, "0");
      });
      return `#${parts.join("")}`;
    }

    function normalizeCustomPalette(value, fallback = null) {
      const base = fallback || { body: "#0f9fbb", belly: "#b8f5dc", accents: "#5ce5e8" };
      const source = value && typeof value === "object" ? value : {};
      const storedAccents = source.accents || source.arms || source.fin || source.bump || source.eyeBump || source.crest || source.feet;
      return {
        body: normalizeHexColor(source.body, base.body),
        belly: normalizeHexColor(source.belly, base.belly),
        accents: normalizeHexColor(storedAccents, base.accents)
      };
    }

    function readCustomFrogSlots() {
      const defaults = [
        { body: "#0f9fbb", belly: "#b8f5dc", accents: "#5ce5e8" },
        { body: "#7d3fa5", belly: "#f0c0dd", accents: "#c993ec" },
        { body: "#3a8b50", belly: "#d9efac", accents: "#93d16c" }
      ];
      try {
        const storedSlots = JSON.parse(localStorage.getItem("ribbitRaceCustomFrogSlots") || "null");
        if (Array.isArray(storedSlots)) {
          return defaults.map((fallback, index) => normalizeCustomPalette(storedSlots[index], fallback));
        }
        const legacy = JSON.parse(localStorage.getItem("ribbitRaceCustomFrogColors") || "{}");
        defaults[0] = normalizeCustomPalette(legacy, defaults[0]);
      } catch (_) {
        // Defaults remain available when storage is unavailable or malformed.
      }
      return defaults;
    }

    function readActiveCustomSlotIndex() {
      try {
        return clamp(Number(localStorage.getItem("ribbitRaceCustomFrogActiveSlot")) || 0, 0, 2);
      } catch (_) {
        return 0;
      }
    }

    const CUSTOM_FROG_SLOT_COUNT = 3;
    const DEFAULT_CUSTOM_FROG_COLORS = Object.freeze({ body: "#0f9fbb", belly: "#b8f5dc", accents: "#5ce5e8" });
    let customFrogSlots = readCustomFrogSlots();
    let activeCustomFrogSlotIndex = readActiveCustomSlotIndex();
    let customFrogColors = { ...customFrogSlots[activeCustomFrogSlotIndex] };

    const CUSTOM_HAT_OPTIONS = Object.freeze([
      Object.freeze({ id: "none", name: "NO HAT" }),
      Object.freeze({ id: "top-hat", name: "TOP" }),
      Object.freeze({ id: "crown", name: "CROWN" }),
      Object.freeze({ id: "party-hat", name: "PARTY" }),
      Object.freeze({ id: "hard-hat", name: "MINER'S HELMET" }),
      Object.freeze({ id: "viking", name: "VIKING" }),
      Object.freeze({ id: "straw-hat", name: "STRAW" }),
      Object.freeze({ id: "beanie", name: "BEANIE" }),
      Object.freeze({ id: "santa-hat", name: "SANTA" }),
      Object.freeze({ id: "fedora", name: "FEDORA" }),
      Object.freeze({ id: "taco-hat", name: "TACO" }),
      Object.freeze({ id: "baseball-cap", name: "BASEBALL CAP" }),
      Object.freeze({ id: "wizard-hat", name: "WIZARD" }),
      Object.freeze({ id: "milkman", name: "MILKMAN" }),
      Object.freeze({ id: "headphones", name: "HEADPHONES" }),
      Object.freeze({ id: "summer-shades", name: "SUMMER SHADES" }),
      Object.freeze({ id: "deal-with-it", name: "SWAG" }),
      Object.freeze({ id: "mohawk", name: "MOHAWK" }),
      Object.freeze({ id: "bucket", name: "BUCKET" }),
      Object.freeze({ id: "beret", name: "BERET" }),
      Object.freeze({ id: "jester-hat", name: "JESTER" }),
      Object.freeze({ id: "hat-of-cards", name: "HAT OF CARDS" }),
      Object.freeze({ id: "candle-hat", name: "CANDLE" }),
      Object.freeze({ id: "headband", name: "HEADBAND" }),
      Object.freeze({ id: "plunger", name: "PLUNGER" }),
      Object.freeze({ id: "traffic-cone", name: "TRAFFIC CONE" }),
      Object.freeze({ id: "sombrero", name: "SOMBRERO" }),
      Object.freeze({ id: "flamboyant-flamenco", name: "FLAMBOYANT FLAMENCO" }),
      Object.freeze({ id: "pirate-hat", name: "PIRATE" }),
      Object.freeze({ id: "hustlers-hallmark", name: "HUSTLER'S HALLMARK" }),
      Object.freeze({ id: "cowboy-hat", name: "COWBOY" }),
      Object.freeze({ id: "the-danger", name: "THE DANGER" }),
      Object.freeze({ id: "charmers-chapeau", name: "CHARMER'S CHAPEAU" }),
      Object.freeze({ id: "fez", name: "FEZ" }),
      Object.freeze({ id: "flower", name: "FLOWER" }),
      Object.freeze({ id: "afro", name: "AFRO" }),
      Object.freeze({ id: "bunny-ears", name: "BUNNY EARS" }),
      Object.freeze({ id: "bowler-hat", name: "BOWLER" }),
      Object.freeze({ id: "police-hat", name: "POLICE" }),
      Object.freeze({ id: "fireman-hat", name: "FIREMAN" }),
      Object.freeze({ id: "nurse-hat", name: "NURSE" }),
      Object.freeze({ id: "pink-bow", name: "PINK BOW" }),
      Object.freeze({ id: "sleeping-hat", name: "NIGHT CAP" }),
      Object.freeze({ id: "washington-wig", name: "WASHINGTON" }),
      Object.freeze({ id: "leaf-hat", name: "LEAF" }),
      Object.freeze({ id: "lily-pad-hat", name: "LILY PAD" })
    ]);

    // These asymmetric sprites were originally drawn facing the opposite way.
    // Flip only their artwork relative to the frog while preserving the frog's
    // own facing direction.
    const HAT_MODEL_FLIP_IDS = new Set([
      "the-danger",
      "fez",
      "charmers-chapeau",
      "flamboyant-flamenco",
      "santa-hat",
      "headband",
      "sleeping-hat",
      "washington-wig",
      "mohawk",
      "flower",
      "summer-shades",
      "deal-with-it"
    ]);

    function hatUsesEyeOverlay(hatId) {
      return hatId === "summer-shades" || hatId === "deal-with-it";
    }
    const CUSTOM_HATS_PER_PAGE = 8;
    const CUSTOM_HAT_PAGE_COUNT = Math.max(1, Math.ceil(CUSTOM_HAT_OPTIONS.length / CUSTOM_HATS_PER_PAGE));

    function getFilteredCustomHatOptions() {
      const normalized = String(game?.customHatSearchQuery || "").trim().toLowerCase();
      return CUSTOM_HAT_OPTIONS
        .map((hat, index) => ({ ...hat, index }))
        .filter((hat) => !normalized || (
          String(hat.name || "").toLowerCase().includes(normalized) ||
          String(hat.id || "").toLowerCase().includes(normalized)
        ));
    }

    function getCustomHatPageCount() {
      return Math.max(1, Math.ceil(getFilteredCustomHatOptions().length / CUSTOM_HATS_PER_PAGE));
    }

    const HAT_UNLOCK_REQUIREMENTS = Object.freeze({
      "none": { unlocked: () => true, lines: ["ALWAYS AVAILABLE", "NO REQUIREMENT"] },
      "party-hat": { lines: ["CATCH 50 FLIES", "AS PLUM"] },
      "top-hat": { lines: ["CATCH 75 FLIES", "AS AZURE"] },
      "crown": { lines: ["WIN 10 VERSUS MATCHES", "AFTER HATS UNLOCK"] },
      "hard-hat": { lines: ["WIN JUNGLE 3 TIMES", "AS FOREST"] },
      "viking": { lines: ["WIN 5 VERSUS MATCHES", "AS EMBER"] },
      "straw-hat": { lines: ["FINISH PARK UNDER 25 SEC", "AS FOREST"] }
    });

    function readProgressionUnlockedHatIds() {
      try {
        const parsed = JSON.parse(localStorage.getItem("ribbitRaceUnlockedHatsV2") || "[]");
        return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
      } catch (_) { return new Set(); }
    }

    function isHatUnlocked(hatId) {
      if (hatId === "none") return true;
      if (isPlaytestModeActive() || isCheatUnlockAllActive()) return true;
      return readProgressionUnlockedHatIds().has(String(hatId));
    }

    function getHatRequirementLines(hatId) {
      const external = window.RibbitHatProgress?.requirementLines?.(hatId);
      if (Array.isArray(external) && external.length) return external.slice(0, 2);
      const requirement = HAT_UNLOCK_REQUIREMENTS[hatId];
      return requirement ? requirement.lines.slice(0, 2) : ["COMPLETE ITS HAT CHALLENGE", "AFTER HATS UNLOCK"];
    }

    function ensureValidEquippedHat() {
      let changed = false;
      Object.keys(frogHatAssignments || {}).forEach((skinId) => {
        const hatId = getHatForFrogSkinId(skinId);
        if (hatId !== "none" && !isHatUnlocked(hatId)) {
          setHatForFrogSkinId(skinId, "none", false);
          changed = true;
        }
      });
      equippedFrogHatId = getHatForFrogSkinId(getStoredHatMigrationTarget());
      if (changed) saveFrogHatAssignments();
    }
    const CUSTOM_HAT_STORAGE_KEY = "ribbitRaceCustomFrogHatsV1";
    const FROG_HAT_ASSIGNMENTS_STORAGE_KEY = "ribbitRaceFrogHatAssignmentsV1";
    const EQUIPPED_HAT_STORAGE_KEY = "ribbitRaceEquippedHatV1"; // Legacy mirror for older builds.

    function normalizeFrogHatId(value) {
      const id = String(value || "none");
      return CUSTOM_HAT_OPTIONS.some((hat) => hat.id === id) ? id : "none";
    }

    function normalizeHatTargetSkinId(value, fallback = "azure") {
      const id = String(value || fallback).toLowerCase();
      if (id === "custom") return `custom${activeCustomFrogSlotIndex + 1}`;
      if (/^custom[1-3]$/.test(id)) return id;
      return FROG_SKINS[id] ? id : fallback;
    }

    function readCustomFrogHats() {
      const defaults = ["none", "none", "none"];
      try {
        const parsed = JSON.parse(localStorage.getItem(CUSTOM_HAT_STORAGE_KEY) || "null");
        if (Array.isArray(parsed)) return defaults.map((fallback,index) => normalizeFrogHatId(parsed[index] || fallback));
      } catch (_) {}
      return defaults;
    }
    let customFrogHats = readCustomFrogHats();

    function getStoredHatMigrationTarget() {
      try {
        const storedSkin = String(localStorage.getItem("ribbitRaceFrogSkin") || "azure").toLowerCase();
        return normalizeHatTargetSkinId(storedSkin, "azure");
      } catch (_) {
        return "azure";
      }
    }

    function readFrogHatAssignments() {
      const assignments = {};
      FROG_SKIN_ORDER.forEach((id) => { assignments[id] = "none"; });
      for (let index = 0; index < CUSTOM_FROG_SLOT_COUNT; index += 1) {
        assignments[`custom${index + 1}`] = normalizeFrogHatId(customFrogHats[index]);
      }
      try {
        const parsed = JSON.parse(localStorage.getItem(FROG_HAT_ASSIGNMENTS_STORAGE_KEY) || "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          Object.keys(assignments).forEach((id) => {
            if (Object.prototype.hasOwnProperty.call(parsed, id)) assignments[id] = normalizeFrogHatId(parsed[id]);
          });
        }
        // Migrate the old global hat onto the frog that was equipped when this
        // build first opens. Existing custom-slot hats remain authoritative.
        const legacyHat = normalizeFrogHatId(localStorage.getItem(EQUIPPED_HAT_STORAGE_KEY));
        const migrationTarget = getStoredHatMigrationTarget();
        if (legacyHat !== "none" && assignments[migrationTarget] === "none") assignments[migrationTarget] = legacyHat;
      } catch (_) {}
      for (let index = 0; index < CUSTOM_FROG_SLOT_COUNT; index += 1) {
        customFrogHats[index] = normalizeFrogHatId(assignments[`custom${index + 1}`]);
      }
      return assignments;
    }
    let frogHatAssignments = readFrogHatAssignments();
    let equippedFrogHatId = normalizeFrogHatId(frogHatAssignments[getStoredHatMigrationTarget()]);

    function getHatForFrogSkinId(skinId) {
      const target = normalizeHatTargetSkinId(skinId, "azure");
      const customMatch = target.match(/^custom([1-3])$/);
      if (customMatch) {
        const index = Number(customMatch[1]) - 1;
        return normalizeFrogHatId(customFrogHats[index] || frogHatAssignments[target]);
      }
      return normalizeFrogHatId(frogHatAssignments[target]);
    }

    function saveFrogHatAssignments() {
      try {
        for (let index = 0; index < CUSTOM_FROG_SLOT_COUNT; index += 1) {
          frogHatAssignments[`custom${index + 1}`] = normalizeFrogHatId(customFrogHats[index]);
        }
        localStorage.setItem(FROG_HAT_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(frogHatAssignments));
        localStorage.setItem(CUSTOM_HAT_STORAGE_KEY, JSON.stringify(customFrogHats));
        localStorage.setItem(EQUIPPED_HAT_STORAGE_KEY, normalizeFrogHatId(equippedFrogHatId));
      } catch (_) {}
    }

    function setHatForFrogSkinId(skinId, hatId, persist = true) {
      const target = normalizeHatTargetSkinId(skinId, "azure");
      const normalizedHat = normalizeFrogHatId(hatId);
      frogHatAssignments[target] = normalizedHat;
      const customMatch = target.match(/^custom([1-3])$/);
      if (customMatch) customFrogHats[Number(customMatch[1]) - 1] = normalizedHat;
      equippedFrogHatId = normalizedHat;
      if (persist) saveFrogHatAssignments();
      return normalizedHat;
    }

    function saveCustomFrogHats() {
      saveFrogHatAssignments();
    }

    // Compatibility accessors now mirror the currently equipped solo frog,
    // while rendering always asks for the specific frog's own assignment.
    function setEquippedFrogHat(id) {
      const target = typeof game === "object" && game
        ? normalizeHatTargetSkinId(game.skinId, "azure")
        : getStoredHatMigrationTarget();
      return setHatForFrogSkinId(target, id, true);
    }
    function getEquippedFrogHatId() {
      const target = typeof game === "object" && game
        ? normalizeHatTargetSkinId(game.skinId, "azure")
        : getStoredHatMigrationTarget();
      return getHatForFrogSkinId(target);
    }

    function isCustomHatSelectorUnlocked() {
      let hatsTest = false;
      try { hatsTest = localStorage.getItem("ribbitRaceHatsTestUnlockedV1") === "1"; } catch (_) {}
      return isPlaytestModeActive() || isCheatUnlockAllActive() || hatsTest || isCustomFrogSlotUnlocked(1);
    }
    function getCustomHatIdForSlot(index = activeCustomFrogSlotIndex) {
      const slotIndex = clamp(Math.round(Number(index)||0),0,CUSTOM_FROG_SLOT_COUNT-1);
      return getHatForFrogSkinId(`custom${slotIndex + 1}`);
    }


    function selectCustomFrogSlot(index, updateDraft = true, playFeedback = false) {
      const previous = activeCustomFrogSlotIndex;
      activeCustomFrogSlotIndex = clamp(Math.round(Number(index) || 0), 0, 2);
      customFrogColors = { ...customFrogSlots[activeCustomFrogSlotIndex] };
      if (updateDraft && typeof game !== "undefined") {
        game.customSlotIndex = activeCustomFrogSlotIndex;
        game.customDraftBody = customFrogColors.body;
        game.customDraftBelly = customFrogColors.belly;
        game.customDraftAccents = customFrogColors.accents;
        game.customHatId = getCustomHatIdForSlot(activeCustomFrogSlotIndex);
      }
      try { localStorage.setItem("ribbitRaceCustomFrogActiveSlot", String(activeCustomFrogSlotIndex)); } catch (_) {}
      if (playFeedback && previous !== activeCustomFrogSlotIndex) tone(390 + activeCustomFrogSlotIndex * 75, 0.045, 0.010, 35);
      return customFrogColors;
    }

    function saveCustomFrogColors() {
      customFrogSlots[activeCustomFrogSlotIndex] = normalizeCustomPalette(customFrogColors);
      try {
        localStorage.setItem("ribbitRaceCustomFrogSlots", JSON.stringify(customFrogSlots));
        localStorage.setItem("ribbitRaceCustomFrogActiveSlot", String(activeCustomFrogSlotIndex));
        // Keep the legacy key current for older embedded copies.
        localStorage.setItem("ribbitRaceCustomFrogColors", JSON.stringify(customFrogColors));
        saveCustomFrogHats();
      } catch (_) {
        // The custom palette remains active for this session if storage is blocked.
      }
    }

    function getFrogAccentHighlight(palette) {
      if (!palette) return "#dff8ff";
      return /^custom/.test(String(palette.id || ""))
        ? (palette.accents || palette.arms || palette.light)
        : palette.light;
    }

    function buildCustomSkinFromPalette(palette, slotIndex = activeCustomFrogSlotIndex) {
      const body = normalizeHexColor(palette && palette.body, "#0f9fbb");
      const belly = normalizeHexColor(palette && palette.belly, "#b8f5dc");
      const accents = normalizeHexColor(palette && palette.accents, "#5ce5e8");
      return {
        id: `custom${slotIndex + 1}`,
        name: `CUSTOM ${slotIndex + 1}`,
        dark: mixHexColors(body, "#07141a", 0.55),
        mid: body,
        light: mixHexColors(body, "#ffffff", 0.43),
        belly,
        accents,
        arms: accents,
        bump: accents,
        crest: accents,
        eyeBump: accents,
        feet: accents,
        tongue: mixHexColors(belly, "#ff6478", 0.50),
        tongueDark: mixHexColors(body, "#5d1830", 0.58),
        hat: getCustomHatIdForSlot(slotIndex)
      };
    }

    function getCustomFrogSkinForSlot(slotIndex) {
      const index = clamp(Math.round(Number(slotIndex) || 0), 0, 2);
      return buildCustomSkinFromPalette(customFrogSlots[index], index);
    }

    function getCustomFrogSkin() {
      return getCustomFrogSkinForSlot(activeCustomFrogSlotIndex);
    }

    function getDisplaySkinById(id, fallbackId = "azure") {
      const normalized = String(id || fallbackId).toLowerCase();
      const customMatch = normalized.match(/^custom([1-3])$/);
      if (normalized === "custom") {
        const target = `custom${activeCustomFrogSlotIndex + 1}`;
        return { ...getCustomFrogSkin(), hat: getHatForFrogSkinId(target) };
      }
      if (customMatch) return { ...getCustomFrogSkinForSlot(Number(customMatch[1]) - 1), hat: getHatForFrogSkinId(normalized) };
      const base = FROG_SKINS[normalized] || FROG_SKINS[fallbackId] || FROG_SKINS.azure;
      const target = FROG_SKINS[normalized] ? normalized : (FROG_SKINS[fallbackId] ? fallbackId : "azure");
      return { ...base, hat: getHatForFrogSkinId(target) };
    }

    function readCustomColorUnlocked() {
      const earned = allLevelsCompletedWithin(CONFIG.levelUnlockTimeTarget);
      try {
        const stored = localStorage.getItem("ribbitRaceCustomColorUnlocked") === "1";
        const cheatUnlocked = localStorage.getItem("ribbitRaceCheatUnlockAll") === "1";
        if (earned && !stored) localStorage.setItem("ribbitRaceCustomColorUnlocked", "1");
        return stored || earned || cheatUnlocked;
      } catch (_) {
        return earned;
      }
    }

    let customColorUnlocked = false;

    function isCustomColorUnlocked() {
      return isPlaytestModeActive() || customColorUnlocked || isCheatUnlockAllActive();
    }

    function grantCustomColorAchievement() {
      if (isCustomColorUnlocked()) {
        markAchievementEarned("custom-colors", false);
        return false;
      }
      customColorUnlocked = true;
      try {
        localStorage.setItem("ribbitRaceCustomColorUnlocked", "1");
      } catch (_) {
        // The unlock still applies for the current session when storage is blocked.
      }
      if (game.state === "playing" || game.state === "won") game.roundCustomColorUnlocked = true;
      markAchievementEarned("custom-colors", game.state === "playing");
      evaluateCustomFrogSlotUnlocks(game.state === "playing");
      tone(659, 0.08, 0.020, 110);
      tone(988, 0.12, 0.016, 135, 0.075);
      return true;
    }

    function allLevelsCompletedWithin(seconds = CONFIG.levelUnlockTimeTarget) {
      return LEVEL_ORDER.every((levelId) => {
        const best = readBestTime(levelId);
        return best !== null && timeAtOrUnder(best, seconds);
      });
    }

    const CUSTOM_FROG_SLOT_UNLOCK_STORAGE_KEY = "ribbitRaceCustomFrogSlotUnlocksV1";
    const CUSTOM_FROG_SLOT_TWO_JUMP_TARGET = 10;
    const CUSTOM_FROG_SLOT_THREE_JUMP_TARGET = 5;

    function readUnlockedCustomFrogSlotIndices() {
      const unlocked = new Set([0]);
      try {
        const stored = JSON.parse(localStorage.getItem(CUSTOM_FROG_SLOT_UNLOCK_STORAGE_KEY) || "[]");
        if (Array.isArray(stored)) {
          stored.forEach((value) => {
            const index = Math.round(Number(value));
            if (index >= 0 && index < CUSTOM_FROG_SLOT_COUNT) unlocked.add(index);
          });
        }
      } catch (_) {
        // Derived progress still unlocks slots if storage is unavailable.
      }
      return unlocked;
    }

    let unlockedCustomFrogSlotIndices = readUnlockedCustomFrogSlotIndices();

    function saveUnlockedCustomFrogSlotIndices() {
      try {
        localStorage.setItem(
          CUSTOM_FROG_SLOT_UNLOCK_STORAGE_KEY,
          JSON.stringify([...unlockedCustomFrogSlotIndices].sort((a, b) => a - b))
        );
      } catch (_) {
        // The unlock remains active for the current session when storage is blocked.
      }
    }

    function allLevelsCompletedWithinJumps(maxJumps = CUSTOM_FROG_SLOT_TWO_JUMP_TARGET) {
      return LEVEL_ORDER.every((levelId) => {
        const fewest = readFewestJumps(levelId);
        return fewest !== null && fewest <= maxJumps;
      });
    }

    function isCustomFrogSlotUnlocked(index) {
      const slotIndex = clamp(Math.round(Number(index) || 0), 0, CUSTOM_FROG_SLOT_COUNT - 1);
      if (isPlaytestModeActive() || isCheatUnlockAllActive()) return true;
      if (!isCustomColorUnlocked()) return false;
      if (slotIndex === 0) return true;
      if (unlockedCustomFrogSlotIndices.has(slotIndex)) return true;
      if (slotIndex === 1) return allLevelsCompletedWithinJumps(CUSTOM_FROG_SLOT_TWO_JUMP_TARGET);
      if (slotIndex === 2) return allLevelsCompletedWithinJumps(CUSTOM_FROG_SLOT_THREE_JUMP_TARGET);
      return false;
    }

    function getFirstUnlockedCustomFrogSlotIndex() {
      for (let index = 0; index < CUSTOM_FROG_SLOT_COUNT; index += 1) {
        if (isCustomFrogSlotUnlocked(index)) return index;
      }
      return 0;
    }

    function evaluateCustomFrogSlotUnlocks(notify = false) {
      if (!isCustomColorUnlocked()) return [];
      const newlyUnlocked = [];
      if (
        !unlockedCustomFrogSlotIndices.has(1) &&
        allLevelsCompletedWithinJumps(CUSTOM_FROG_SLOT_TWO_JUMP_TARGET)
      ) {
        unlockedCustomFrogSlotIndices.add(1);
        newlyUnlocked.push(1);
        markAchievementEarned("custom-slot-two", notify);
      }
      if (
        !unlockedCustomFrogSlotIndices.has(2) &&
        allLevelsCompletedWithinJumps(CUSTOM_FROG_SLOT_THREE_JUMP_TARGET)
      ) {
        unlockedCustomFrogSlotIndices.add(2);
        newlyUnlocked.push(2);
        markAchievementEarned("custom-slot-three", notify);
      }
      if (newlyUnlocked.length) saveUnlockedCustomFrogSlotIndices();
      return newlyUnlocked;
    }

    function readTimeSelectUnlocked() {
      const earnedByFlies = readTotalFlyCount() >= CONFIG.timeSelectFlyTarget;
      try {
        const stored = localStorage.getItem("ribbitRaceTimeSelectUnlocked") === "1";
        const cheatUnlocked = localStorage.getItem("ribbitRaceCheatUnlockAll") === "1";
        if (earnedByFlies && !stored) localStorage.setItem("ribbitRaceTimeSelectUnlocked", "1");
        return stored || earnedByFlies || cheatUnlocked;
      } catch (_) {
        return earnedByFlies;
      }
    }

    let timeSelectUnlocked = readTimeSelectUnlocked();

    function isTimeSelectUnlocked() {
      return isPlaytestModeActive() || timeSelectUnlocked;
    }

    function grantTimeSelectAchievement() {
      if (timeSelectUnlocked) {
        markAchievementEarned("time-select", false);
        return false;
      }
      timeSelectUnlocked = true;
      try {
        localStorage.setItem("ribbitRaceTimeSelectUnlocked", "1");
      } catch (_) {
        // The unlock still applies for the current session when storage is blocked.
      }
      if (game.state === "playing" || game.state === "won") {
        game.roundTimeSelectUnlocked = true;
        if (game.state === "playing") queueAchievementToast({ type: "generic", text: "TIME SELECT UNLOCKED!" });
      }
      markAchievementEarned("time-select", game.state === "playing");
      tone(587, 0.08, 0.021, 95);
      tone(880, 0.10, 0.017, 120, 0.070);
      return true;
    }

    function readFrogSkinId() {
      try {
        const stored = localStorage.getItem("ribbitRaceFrogSkin");
        if (stored === "custom" && isCustomColorUnlocked()) return "custom";
        return FROG_SKINS[stored] && isFrogSkinUnlocked(stored) ? stored : "azure";
      } catch (_) {
        return "azure";
      }
    }

    function saveFrogSkinId(id) {
      try {
        localStorage.setItem("ribbitRaceFrogSkin", id);
      } catch (_) {
        // Storage may be unavailable in embedded browsers; the current session still works.
      }
    }


    // Park is a true left/right mirror. Only the two center platforms share a
    // vertical column; every side platform has an exact opposite-side partner.
    const PARK_PLATFORMS = Object.freeze([
      { x: 0,   y: CONFIG.groundY, w: W,  h: 15, ground: true },
      { x: 36,  y: 169, w: 72, h: 12 },
      { x: 129, y: 126, w: 70, h: 12 },
      { x: 204, y: 176, w: 72, h: 12 },
      { x: 206, y: 70,  w: 68, h: 12 },
      { x: 281, y: 126, w: 70, h: 12 },
      { x: 372, y: 169, w: 72, h: 12 }
    ]);

    const PARK_FLY_SPAWNS = Object.freeze([
      { x: 75,  y: 69 },
      { x: 405, y: 69 },
      { x: 240, y: 39 },
      { x: 165, y: 108 },
      { x: 315, y: 108 },
      { x: 90,  y: 150 },
      { x: 390, y: 150 },
      { x: 240, y: 157 }
    ]);

    const LEVEL_ORDER = Object.freeze([
      "park", "swamp", "jungle", "pond", "lake", "garden"
    ]);

    const LEVEL_UNLOCK_STORAGE_KEY = "ribbitRaceUnlockedLevelsV1";

    function readUnlockedLevelIds() {
      const unlocked = new Set(["park"]);
      try {
        const stored = JSON.parse(localStorage.getItem(LEVEL_UNLOCK_STORAGE_KEY) || "[]");
        if (Array.isArray(stored)) {
          stored.map(String).forEach((id) => { if (LEVEL_ORDER.includes(id)) unlocked.add(id); });
        }
      } catch (_) {}
      for (let index = 1; index < LEVEL_ORDER.length; index += 1) {
        const previousBest = readBestTime(LEVEL_ORDER[index - 1]);
        if (previousBest !== null && timeAtOrUnder(previousBest, CONFIG.levelUnlockTimeTarget)) {
          unlocked.add(LEVEL_ORDER[index]);
        }
      }
      try { localStorage.setItem(LEVEL_UNLOCK_STORAGE_KEY, JSON.stringify([...unlocked])); } catch (_) {}
      return unlocked;
    }

    const unlockedLevelIds = readUnlockedLevelIds();

    function saveUnlockedLevelIds() {
      try {
        let preserved = [];
        try {
          const stored = JSON.parse(localStorage.getItem(LEVEL_UNLOCK_STORAGE_KEY) || "[]");
          if (Array.isArray(stored)) preserved = stored.map(String);
        } catch (_) {}
        localStorage.setItem(LEVEL_UNLOCK_STORAGE_KEY, JSON.stringify([...new Set(preserved.concat([...unlockedLevelIds]))]));
      } catch (_) {}
    }

    function refreshPersistentLevelUnlocks() {
      const newlyUnlocked = [];
      for (let index = 1; index < LEVEL_ORDER.length; index += 1) {
        const levelId = LEVEL_ORDER[index];
        if (unlockedLevelIds.has(levelId)) continue;
        const previousBest = readBestTime(LEVEL_ORDER[index - 1]);
        if (previousBest !== null && timeAtOrUnder(previousBest, CONFIG.levelUnlockTimeTarget)) {
          unlockedLevelIds.add(levelId);
          newlyUnlocked.push(levelId);
        }
      }
      if (newlyUnlocked.length) saveUnlockedLevelIds();
      return newlyUnlocked;
    }

    const PVP_STAGE_ORDER = Object.freeze([
      ...LEVEL_ORDER, "random"
    ]);

    const PVP_RANDOM_STAGE_PALETTE = Object.freeze({
      dark: "#4c3b67", mid: "#8061a7", light: "#d3c1ef"
    });
    const PVP_NEUTRAL_PALETTE = Object.freeze({
      dark: "#48555a", mid: "#7d8a90", light: "#d8e1e4", belly: "#edf2f3"
    });

    // LEVEL_ORDER must exist before evaluating the persistent custom-color unlock.
    customColorUnlocked = readCustomColorUnlocked();

    // Internal palette IDs map to the visible Morning → Evening → Night cycle.
    const TIME_OF_DAY_OPTIONS = Object.freeze(["afternoon", "morning", "night"]);
    const TIME_OF_DAY_CHROME = Object.freeze({
      morning: Object.freeze({ outer: "#b98786", frame: "#f0c2a7" }),
      afternoon: Object.freeze({ outer: "#5a95b8", frame: "#78cbf4" }),
      night: Object.freeze({ outer: "#111c34", frame: "#1d3550" })
    });
    const TIME_OF_DAY_LABELS = Object.freeze({
      afternoon: "MORNING",
      morning: "EVENING",
      night: "NIGHT"
    });
    const LEVEL_MENU_COLORS = Object.freeze({
      park: Object.freeze({ dark: "#246f2d", mid: "#55b943", light: "#a8eb63" }),
      swamp: Object.freeze({ dark: "#263c35", mid: "#557b5b", light: "#a8c879" }),
      jungle: Object.freeze({ dark: "#173b2d", mid: "#287247", light: "#68c56b" }),
      pond: Object.freeze({ dark: "#286f75", mid: "#61b9bd", light: "#b6eee1" }),
      lake: Object.freeze({ dark: "#245b7a", mid: "#4e9bc6", light: "#9ee0ef" }),
      garden: Object.freeze({ dark: "#704558", mid: "#b96f82", light: "#f0b5b9" })
    });

    let cheatUnlockAllActive = (() => {
      try {
        return localStorage.getItem("ribbitRaceCheatUnlockAll") === "1";
      } catch (_) {
        return false;
      }
    })();

    function isCheatUnlockAllActive() {
      return isPlaytestModeActive() || cheatUnlockAllActive;
    }

    function isLevelUnlocked(levelId) {
      const index = LEVEL_ORDER.indexOf(levelId);
      if (index < 0) return false;
      if (isCheatUnlockAllActive() || index === 0) return true;
      if (unlockedLevelIds.has(levelId)) return true;
      const previousBest = readBestTime(LEVEL_ORDER[index - 1]);
      if (previousBest !== null && timeAtOrUnder(previousBest, CONFIG.levelUnlockTimeTarget)) {
        unlockedLevelIds.add(levelId);
        saveUnlockedLevelIds();
        return true;
      }
      return false;
    }

    function getNextLevelId(levelId) {
      const index = LEVEL_ORDER.indexOf(levelId);
      return index >= 0 && index < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[index + 1] : null;
    }

    function randomTimeOfDay() {
      return TIME_OF_DAY_OPTIONS[Math.floor(Math.random() * TIME_OF_DAY_OPTIONS.length)];
    }

    const MOON_PHASES = Object.freeze([
      "full", "waningGibbous", "lastQuarter", "waningCrescent",
      "new", "waxingCrescent", "firstQuarter", "waxingGibbous"
    ]);

    function randomMoonPhaseIndex() {
      return Math.floor(Math.random() * MOON_PHASES.length);
    }

    function nextTimeOfDay(value) {
      const currentIndex = Math.max(0, TIME_OF_DAY_OPTIONS.indexOf(value));
      return TIME_OF_DAY_OPTIONS[(currentIndex + 1) % TIME_OF_DAY_OPTIONS.length];
    }

    function getTimeOfDayLabel(value = game.timeOfDay) {
      return TIME_OF_DAY_LABELS[value] || "MORNING";
    }

    // Sandbox geometry is initialized before LEVELS so the level registry can
    // reference it safely during startup.

    // Sandbox geometry must be initialized before LEVELS references it.
    // Keeping these declarations here prevents the temporal-dead-zone startup
    // error: "Cannot access 'SANDBOX_LEVEL' before initialization."

    const SANDBOX_GROUND_Y = CONFIG.groundY;
    const SANDBOX_STAGE_PLATFORMS = PARK_PLATFORMS;
    const SANDBOX_LEVEL = Object.freeze({
      id: "sandbox",
      name: "SANDBOX",
      theme: "park",
      platforms: SANDBOX_STAGE_PLATFORMS,
      flySpawns: Object.freeze([]),
      startX: 25,
      victoryLine: "SANDBOX"
    });

    const LEVELS = Object.freeze({
      park: Object.freeze({
        id: "park",
        name: "PARK",
        theme: "park",
        platforms: PARK_PLATFORMS,
        flySpawns: PARK_FLY_SPAWNS,
        startX: 25,
        victoryLine: "THE PARK IS SAFE... FOR NOW"
      }),
      sandbox: SANDBOX_LEVEL,
      swamp: Object.freeze({
        id: "swamp",
        name: "SWAMP",
        theme: "swamp",
        platforms: Object.freeze([
          { x: 0,   y: CONFIG.groundY, w: W,  h: 15, ground: true },
          { x: 36,  y: 126, w: 70, h: 12 },
          { x: 208, y: 70,  w: 68, h: 12 },
          { x: 374, y: 126, w: 70, h: 12 },
          { x: 127, y: 169, w: 70, h: 12 },
          { x: 283, y: 169, w: 70, h: 12 }
        ]),
        flySpawns: Object.freeze([
          { x: 76,  y: 105 }, { x: 404, y: 105 },
          { x: 242, y: 49 },
          { x: 161, y: 149 }, { x: 319, y: 149 },
          { x: 124, y: 82 },  { x: 358, y: 82 },
          { x: 240, y: 117 }
        ]),
        startX: 25,
        victoryLine: "THE SWAMP IS SAFE... FOR NOW"
      }),
      jungle: Object.freeze({
        id: "jungle",
        name: "JUNGLE",
        theme: "jungle",
        platforms: Object.freeze([
          { x: 0,   y: CONFIG.groundY, w: W,  h: 15, ground: true },
          { x: 36,  y: 126, w: 70, h: 12 },
          { x: 208, y: 70,  w: 68, h: 12 },
          { x: 374, y: 126, w: 70, h: 12 },
          { x: 127, y: 169, w: 70, h: 12 },
          { x: 283, y: 169, w: 70, h: 12 }
        ]),
        flySpawns: Object.freeze([
          { x: 76,  y: 105 }, { x: 404, y: 105 },
          { x: 242, y: 49 },
          { x: 161, y: 149 }, { x: 319, y: 149 },
          { x: 124, y: 82 },  { x: 358, y: 82 },
          { x: 240, y: 117 }
        ]),
        startX: 25,
        victoryLine: "THE JUNGLE IS SAFE... FOR NOW"
      }),
      pond: Object.freeze({
        id: "pond",
        name: "POND",
        theme: "pond",
        platforms: Object.freeze([
          { x: 0,   y: CONFIG.groundY, w: W,  h: 15, ground: true },
          { x: 38,  y: 180, w: 84, h: 12 },
          { x: 358, y: 180, w: 84, h: 12 },
          { x: 145, y: 151, w: 66, h: 12 },
          { x: 269, y: 151, w: 66, h: 12 },
          { x: 205, y: 184, w: 70, h: 12 },
          { x: 64,  y: 92,  w: 64, h: 12 },
          { x: 352, y: 92,  w: 64, h: 12 },
          { x: 196, y: 72,  w: 88, h: 12 }
        ]),
        flySpawns: Object.freeze([
          { x: 80,  y: 159 }, { x: 400, y: 159 },
          { x: 177, y: 130 }, { x: 303, y: 130 },
          { x: 92,  y: 71 },  { x: 388, y: 71 },
          { x: 151, y: 50 },  { x: 329, y: 50 },
          { x: 240, y: 112 }
        ]),
        startX: 25,
        victoryLine: "THE POND IS SAFE... FOR NOW"
      }),
      lake: Object.freeze({
        id: "lake",
        name: "LAKE",
        theme: "lake",
        platforms: Object.freeze([
          { x: 0,   y: CONFIG.groundY, w: W, h: 15, ground: true },
          { x: 28,  y: 72, w: 62, h: 12 },
          { x: 390, y: 72, w: 62, h: 12 },
          {
            x: 154, y: 154, w: 86, h: 12, moving: true,
            innerX: 154, outerX: 0, movementGroup: "lake"
          },
          {
            x: 240, y: 154, w: 86, h: 12, moving: true,
            innerX: 240, outerX: W - 86, movementGroup: "lake"
          }
        ]),
        flySpawns: Object.freeze([
          { x: 59,  y: 51 },  { x: 421, y: 51 },
          { x: 43,  y: 132 }, { x: 437, y: 132 },
          { x: 128, y: 131 }, { x: 352, y: 131 },
          { x: 202, y: 106 }, { x: 278, y: 106 },
          { x: 240, y: 45 }
        ]),
        startX: 25,
        victoryLine: "THE LAKE IS SAFE... FOR NOW"
      }),
      garden: Object.freeze({
        id: "garden",
        name: "GARDEN",
        theme: "garden",
        platforms: Object.freeze([
          { x: 0,   y: CONFIG.groundY, w: W, h: 15, ground: true },
          // Two side elevators rise and fall together on the Lake timing cycle.
          {
            x: 25, y: 178, w: 80, h: 12, moving: true,
            movementAxis: "y", innerY: 178, outerY: 112,
            movementGroup: "garden"
          },
          {
            x: 375, y: 178, w: 80, h: 12, moving: true,
            movementAxis: "y", innerY: 178, outerY: 112,
            movementGroup: "garden"
          },
          // These two middle platforms sit just above maximum ground-jump reach,
          // so the side elevators are the intended route upward.
          { x: 145, y: 80, w: 66, h: 12 },
          { x: 269, y: 80, w: 66, h: 12 }
        ]),
        flySpawns: Object.freeze([
          { x: 65,  y: 157 }, { x: 415, y: 157 },
          { x: 65,  y: 92 },  { x: 415, y: 92 },
          { x: 178, y: 59 },  { x: 302, y: 59 },
          { x: 240, y: 39 },  { x: 124, y: 112 },
          { x: 356, y: 112 }
        ]),
        startX: 25,
        victoryLine: "THE GARDEN IS SAFE... FOR NOW"
      })
    });

    const VICTORY_MESSAGES = Object.freeze({
      park: Object.freeze([
        "PARK PERFECT!",
        "THE PLAYGROUND CHEERS!",
        "PICNIC PATROL COMPLETE!",
        "THE PARK IS BUZZING!",
        "RIBBIT RULES THE PARK!",
        "A HOP IN THE PARK!",
        "FLY HUNT FINISHED!",
        "GREEN SPACE GREATNESS!"
      ]),
      swamp: Object.freeze([
        "BOG BOUNCE COMPLETE!",
        "THE SWAMP CROAKS FOR YOU!",
        "MUDDY MISSION COMPLETE!",
        "THE REEDS ARE CHEERING!",
        "SWAMP CHAMPION!",
        "FOG CLEARED!",
        "MARSH MASTER!",
        "LILY PADS APPROVE!"
      ]),
      jungle: Object.freeze([
        "CANOPY CONQUERED!",
        "THE VINES CHEER!",
        "JUNGLE JUMP MASTER!",
        "TROPICAL TRIUMPH!",
        "THE PALMS APPLAUD!",
        "WILDLY WELL DONE!",
        "RAINFOREST RULER!",
        "THE JUNGLE IS BUZZING!"
      ]),
      pond: Object.freeze([
        "POND PERFECT!",
        "LILY PAD LEGEND!",
        "RIPPLES OF VICTORY!",
        "THE POND CHEERS!",
        "SPLASHY SUCCESS!",
        "WATER WAY TO GO!",
        "POND PATROL COMPLETE!",
        "A FLYING FINISH!"
      ]),
      lake: Object.freeze([
        "LAKE LEGEND!",
        "RAFT ROUTE MASTERED!",
        "WAVES OF VICTORY!",
        "THE LAKE APPLAUDS!",
        "DOCKSIDE DOMINATION!",
        "SMOOTH SAILING!",
        "LAKESIDE LEAP COMPLETE!",
        "THE RAFTS SALUTE YOU!"
      ]),
      garden: Object.freeze([
        "GARDEN GREATNESS!",
        "THE FLOWERS CHEER!",
        "ELEVATOR EXPERT!",
        "BLOOMING BRILLIANT!",
        "THE TOWN IS BUZZING!",
        "GARDEN HOP MASTER!",
        "A PETAL PERFECT FINISH!",
        "THE PLAZA APPLAUDS!"
      ])
    });

    const lastVictoryMessageByLevel = Object.create(null);

    function chooseVictoryMessage(levelId) {
      const messages = VICTORY_MESSAGES[levelId] || VICTORY_MESSAGES.park;
      if (!messages.length) return "RIBBIT RACE COMPLETE!";
      let choice = messages[Math.floor(Math.random() * messages.length)];
      if (messages.length > 1 && choice === lastVictoryMessageByLevel[levelId]) {
        const currentIndex = messages.indexOf(choice);
        choice = messages[(currentIndex + 1 + Math.floor(Math.random() * (messages.length - 1))) % messages.length];
      }
      lastVictoryMessageByLevel[levelId] = choice;
      return choice;
    }


    const ACHIEVEMENT_DEFINITIONS = Object.freeze([
      Object.freeze({ id: "level-swamp", name: "PARK PASS", icon: "park", lines: ["BEAT PARK IN 30 SECONDS", "OR LESS TO UNLOCK SWAMP"], unlockType: "level", target: "swamp" }),
      Object.freeze({ id: "level-jungle", name: "MARSH MARCH", icon: "swamp", lines: ["BEAT SWAMP IN 30 SECONDS", "OR LESS TO UNLOCK JUNGLE"], unlockType: "level", target: "jungle" }),
      Object.freeze({ id: "level-pond", name: "CANOPY CLEAR", icon: "jungle", lines: ["BEAT JUNGLE IN 30 SECONDS", "OR LESS TO UNLOCK POND"], unlockType: "level", target: "pond" }),
      Object.freeze({ id: "level-lake", name: "POND PASS", icon: "pond", lines: ["BEAT POND IN 30 SECONDS", "OR LESS TO UNLOCK LAKE"], unlockType: "level", target: "lake" }),
      Object.freeze({ id: "level-garden", name: "LAKE LEAP", icon: "lake", lines: ["BEAT LAKE IN 30 SECONDS", "OR LESS TO UNLOCK GARDEN"], unlockType: "level", target: "garden" }),
      Object.freeze({ id: "tutorial-graduate", name: "RIBBIT READY", icon: "park", lines: ["COMPLETE THE", "PARK TUTORIAL"], unlockType: "general", target: null }),
      Object.freeze({ id: "quick-finish", name: "QUICK CROAK", icon: "stopwatch", lines: ["BEAT ANY LEVEL", "IN 25 SECONDS OR LESS"], unlockType: "general", target: null }),
      Object.freeze({ id: "double-dinner", name: "DOUBLE DINNER", icon: "double-fly", lines: ["CATCH 2 FLIES", "IN ONE JUMP"], unlockType: "general", target: null }),
      Object.freeze({ id: "fresh-catch", name: "FRESH CATCH", icon: "spark-fly", lines: ["CATCH A FLY WITHIN 1 SECOND", "OF IT SPAWNING"], unlockType: "general", target: null }),
      Object.freeze({ id: "few-hops", name: "POND HOP", icon: "footprints", lines: ["BEAT POND", "IN 10 JUMPS OR FEWER"], unlockType: "general", target: null }),
      Object.freeze({ id: "century-hop", name: "CENTURY HOP", icon: "jump-100", lines: ["JUMP 100 TIMES IN ONE ROUND", "FINISH IN 45 SECONDS OR LESS"], unlockType: "general", target: null }),
      Object.freeze({ id: "sky-snack", name: "SKY SNACK", icon: "sky-fly", lines: ["JUMP ABOVE THE MAP", "CATCH A FLY BEFORE LANDING"], unlockType: "general", target: null }),
      Object.freeze({ id: "fly-feast", name: "FLY FEAST", icon: "flies-100", lines: ["EAT 100 FLIES", "IN TOTAL"], unlockType: "general", target: null }),
      Object.freeze({ id: "flash-finish", name: "FLASH FINISH", icon: "speed-run", lines: ["BEAT ANY LEVEL", "IN LESS THAN 15 SECONDS"], unlockType: "general", target: null }),
      Object.freeze({ id: "bonus-six", name: "EXTRA HELPING", icon: "score-six", lines: ["FINISH A LEVEL", "WITH 6 / 5 FLIES"], unlockType: "general", target: null }),
      Object.freeze({ id: "bonus-seven", name: "SEVEN HEAVEN", icon: "score-seven", lines: ["FINISH A LEVEL", "WITH 7 / 5 FLIES"], unlockType: "general", target: null }),
      Object.freeze({ id: "time-select", name: "TIME FLIES", icon: "clock", lines: ["EAT 25 FLIES IN TOTAL", "TO CHANGE THE TIME OF DAY"], unlockType: "time", target: "time" }),
      Object.freeze({ id: "custom-colors", name: "TRUE COLORS", icon: "palette", lines: ["COMPLETE EVERY LEVEL", "IN 30 SECONDS OR LESS"], unlockType: "custom", target: "custom" }),
      Object.freeze({ id: "custom-slot-two", name: "TEN-JUMP TOUR", icon: "jump-100", lines: ["BEAT EVERY LEVEL", "IN 10 JUMPS OR FEWER"], unlockType: "custom", target: "custom2" }),
      Object.freeze({ id: "custom-slot-three", name: "FIVE-JUMP TOUR", icon: "footprints", lines: ["BEAT EVERY LEVEL", "IN 5 JUMPS OR FEWER"], unlockType: "custom", target: "custom3" }),
      Object.freeze({ id: "custom-created", name: "FROG DESIGNER", icon: "palette", lines: ["CREATE AND USE", "A CUSTOM FROG"], unlockType: "general", target: null }),
      Object.freeze({ id: "five-jump-finish", name: "FIVE-JUMP FEAST", icon: "footprints", lines: ["CATCH ALL 5 FLIES", "IN 5 JUMPS OR FEWER"], unlockType: "general", target: null }),
      Object.freeze({ id: "solo-endless-20", name: "ENDLESS APPETITE", icon: "flies-100", lines: ["CATCH 20 FLIES", "IN ONE SOLO ENDLESS RUN"], unlockType: "general", target: null }),
      Object.freeze({ id: "buffered-drop-catch", name: "DROP DELIVERY", icon: "bounce-fly", lines: ["BUFFER A PLATFORM DROP", "THEN CATCH A FLY"], unlockType: "general", target: null }),
      Object.freeze({ id: "pvp-sky-bonk", name: "SKY BONK", icon: "sky-bonk", lines: ["JUMP ABOVE THE MAP", "THEN STUN AN OPPONENT"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-max-bonk", name: "MAXIMUM BONK", icon: "bonk-max", lines: ["STUN AN OPPONENT", "FOR 5 SECONDS OR MORE"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-footstool", name: "BONK REBOUND", icon: "footstool", lines: ["BONK ANOTHER FROG", "AND REBOUND UPWARD"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-bounce-catch", name: "REBOUND CATCH", icon: "bounce-fly", lines: ["TOUCH MID-AIR AND REVERSE", "THEN CATCH A FLY"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-rebound-denial", name: "REBOUND DENIAL", icon: "bounce-fly", lines: ["USE A REBOUND TO BLOCK", "A LAST-SECOND CATCH"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-shutout", name: "FIVE-NOTHING", icon: "pvp-shutout", lines: ["SET THE GOAL TO FIRST TO 5", "THEN WIN 5 TO 0"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "all-frog-colors", name: "RAINBOW POND", icon: "palette", lines: ["UNLOCK ALL FROG COLORS", "IN THE FROG MENU"], unlockType: "general", target: null }),
      Object.freeze({ id: "pvp-bonk-50", name: "BONK BRIGADE", icon: "footstool", lines: ["BONK ANOTHER FROG", "50 TIMES"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-fast-rebonk", name: "STUN LOCK", icon: "bonk-max", lines: ["BONK A FROG WITHIN 1 SECOND", "OF THEIR STUN ENDING"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-first-jump-bonk", name: "OPENING BONK", icon: "footstool", lines: ["BONK A FROG ON YOUR", "FIRST JUMP OF A VERSUS ROUND"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-photo-finish", name: "PHOTO FINISH", icon: "pvp-shutout", lines: ["WIN A VERSUS ROUND", "BY EXACTLY 1 POINT"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-contested-fly", name: "NOSE AHEAD", icon: "double-fly", lines: ["BOTH FROGS JUMP FOR ONE FLY", "PLAYER 1 WINS THE CONTEST"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-double-bonk", name: "BONK COMBO", icon: "footstool", lines: ["BONK THE OTHER FROG TWICE", "IN ONE JUMP"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-drop-bonk", name: "DROP BONK", icon: "bonk-max", lines: ["QUICK-DROP THROUGH A PLATFORM", "THEN FRESHLY BONK A FROG"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-buffered-drop-bonk", name: "BUFFERED BONK", icon: "bonk-max", lines: ["BUFFER A PLATFORM DROP", "THEN BONK A FROG"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-double-fly-jump", name: "DOUBLE VERSUS DINNER", icon: "double-fly", lines: ["CATCH 2 FLIES IN ONE JUMP", "DURING A VERSUS ROUND"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-close-call", name: "CLOSE CALL", icon: "bonk-max", lines: ["DROP THROUGH A PLATFORM TO", "NARROWLY AVOID BEING BONKED."], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-low-profile", name: "LOW PROFILE", icon: "footprints", lines: ["USE A LOW HOP BENEATH", "A FROG ON A PLATFORM"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-level9-bo3", name: "CPU CHAMP", icon: "pvp-shutout", lines: ["BEAT A LEVEL 9 CPU", "IN A BEST OF 3"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-wall-bonk", name: "WALL BONK", icon: "bounce-fly", lines: ["BOUNCE OFF A WALL", "THEN BONK AN OPPONENT"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-ten-bonks", name: "TEN BONKS", icon: "footstool", lines: ["BONK AN OPPONENT 10 TIMES", "IN ONE ROUND"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-self-bonk-three", name: "HIGH GROUND", icon: "bonk-max", lines: ["LET AN OPPONENT BONK THEMSELF", "ON YOU 3 TIMES"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-after-hours", name: "AFTER HOURS", icon: "clock", lines: ["WIN BY 1 WITH A CATCH", "1+ SECOND AFTER TIME EXPIRES"], unlockType: "pvp", target: null }),
      Object.freeze({ id: "pvp-sudden-victory", name: "SUDDEN VICTORY", icon: "pvp-shutout", lines: ["WIN A VERSUS ROUND", "IN SUDDEN DEATH"], unlockType: "pvp", target: null })
    ]);

    // PvP achievements use separate progress storage and in-match notifications,
    // and are also listed in the shared Achievements gallery.
    const PVP_ACHIEVEMENT_DEFINITIONS = Object.freeze([
      Object.freeze({ id: "pvp-sky-bonk", name: "SKY BONK", icon: "sky-bonk", lines: ["JUMP ABOVE THE MAP", "THEN STUN AN OPPONENT"] }),
      Object.freeze({ id: "pvp-max-bonk", name: "MAXIMUM BONK", icon: "bonk-max", lines: ["STUN AN OPPONENT", "FOR 5 SECONDS OR MORE"] }),
      Object.freeze({ id: "pvp-footstool", name: "BONK REBOUND", icon: "footstool", lines: ["BONK ANOTHER FROG", "AND REBOUND UPWARD"] }),
      Object.freeze({ id: "pvp-bounce-catch", name: "REBOUND CATCH", icon: "bounce-fly", lines: ["TOUCH MID-AIR AND REVERSE", "THEN CATCH A FLY"] }),
      Object.freeze({ id: "pvp-rebound-denial", name: "REBOUND DENIAL", icon: "bounce-fly", lines: ["USE A REBOUND TO BLOCK", "A LAST-SECOND CATCH"] }),
      Object.freeze({ id: "pvp-shutout", name: "FIVE-NOTHING", icon: "pvp-shutout", lines: ["SET THE GOAL TO FIRST TO 5", "THEN WIN 5 TO 0"] }),
      Object.freeze({ id: "pvp-bonk-50", name: "BONK BRIGADE", icon: "footstool", lines: ["BONK ANOTHER FROG", "50 TIMES"] }),
      Object.freeze({ id: "pvp-fast-rebonk", name: "STUN LOCK", icon: "bonk-max", lines: ["BONK A FROG WITHIN 1 SECOND", "OF THEIR STUN ENDING"] }),
      Object.freeze({ id: "pvp-first-jump-bonk", name: "OPENING BONK", icon: "footstool", lines: ["BONK A FROG ON YOUR", "FIRST JUMP OF A VERSUS ROUND"] }),
      Object.freeze({ id: "pvp-photo-finish", name: "PHOTO FINISH", icon: "pvp-shutout", lines: ["WIN A VERSUS ROUND", "BY EXACTLY 1 POINT"] }),
      Object.freeze({ id: "pvp-contested-fly", name: "NOSE AHEAD", icon: "double-fly", lines: ["BOTH FROGS JUMP FOR ONE FLY", "PLAYER 1 WINS THE CONTEST"] }),
      Object.freeze({ id: "pvp-double-bonk", name: "BONK COMBO", icon: "footstool", lines: ["BONK THE OTHER FROG TWICE", "IN ONE JUMP"] }),
      Object.freeze({ id: "pvp-drop-bonk", name: "DROP BONK", icon: "bonk-max", lines: ["QUICK-DROP THROUGH A PLATFORM", "THEN FRESHLY BONK A FROG"] }),
      Object.freeze({ id: "pvp-buffered-drop-bonk", name: "BUFFERED BONK", icon: "bonk-max", lines: ["BUFFER A PLATFORM DROP", "THEN BONK A FROG"] }),
      Object.freeze({ id: "pvp-double-fly-jump", name: "DOUBLE VERSUS DINNER", icon: "double-fly", lines: ["CATCH 2 FLIES IN ONE JUMP", "DURING A VERSUS ROUND"] }),
      Object.freeze({ id: "pvp-close-call", name: "CLOSE CALL", icon: "bonk-max", lines: ["DROP THROUGH A PLATFORM TO", "NARROWLY AVOID BEING BONKED."] }),
      Object.freeze({ id: "pvp-low-profile", name: "LOW PROFILE", icon: "footprints", lines: ["USE A LOW HOP BENEATH", "A FROG ON A PLATFORM"] }),
      Object.freeze({ id: "pvp-level9-bo3", name: "CPU CHAMP", icon: "pvp-shutout", lines: ["BEAT A LEVEL 9 CPU", "IN A BEST OF 3"] }),
      Object.freeze({ id: "pvp-wall-bonk", name: "WALL BONK", icon: "bounce-fly", lines: ["BOUNCE OFF A WALL", "THEN BONK AN OPPONENT"] }),
      Object.freeze({ id: "pvp-ten-bonks", name: "TEN BONKS", icon: "footstool", lines: ["BONK AN OPPONENT 10 TIMES", "IN ONE ROUND"] }),
      Object.freeze({ id: "pvp-self-bonk-three", name: "HIGH GROUND", icon: "bonk-max", lines: ["LET AN OPPONENT BONK THEMSELF", "ON YOU 3 TIMES"] }),
      Object.freeze({ id: "pvp-after-hours", name: "AFTER HOURS", icon: "clock", lines: ["WIN BY 1 WITH A CATCH", "1+ SECOND AFTER TIME EXPIRES"] }),
      Object.freeze({ id: "pvp-sudden-victory", name: "SUDDEN VICTORY", icon: "pvp-shutout", lines: ["WIN A VERSUS ROUND", "IN SUDDEN DEATH"] })
    ]);
    const PVP_ACHIEVEMENT_STORAGE_KEY = "ribbitRaceEarnedPvpAchievementsV1";
    const PVP_ACHIEVEMENT_ID_SET = new Set(PVP_ACHIEVEMENT_DEFINITIONS.map((item) => item.id));
    // The shared gallery list already contains both solo and 1V1 entries.
    const ACHIEVEMENT_DISPLAY_ORDER = Object.freeze([
      "level-swamp","level-jungle","level-pond","level-lake","level-garden","tutorial-graduate",
      "quick-finish","flash-finish","few-hops","double-dinner","fresh-catch","century-hop","sky-snack","fly-feast","five-jump-finish","solo-endless-20","buffered-drop-catch","bonus-six","bonus-seven",
      "time-select","custom-colors","custom-slot-two","custom-slot-three","custom-created","all-frog-colors",
      "pvp-footstool","pvp-bounce-catch","pvp-rebound-denial","pvp-wall-bonk","pvp-double-bonk","pvp-drop-bonk","pvp-buffered-drop-bonk","pvp-double-fly-jump","pvp-close-call","pvp-low-profile","pvp-first-jump-bonk","pvp-sky-bonk","pvp-max-bonk","pvp-ten-bonks","pvp-self-bonk-three","pvp-bonk-50","pvp-fast-rebonk","pvp-shutout","pvp-level9-bo3","pvp-photo-finish","pvp-contested-fly","pvp-after-hours","pvp-sudden-victory"
    ]);
    const MENU_ACHIEVEMENT_DEFINITIONS = Object.freeze(
      ACHIEVEMENT_DISPLAY_ORDER.map((id)=>ACHIEVEMENT_DEFINITIONS.find((item)=>item.id===id)).filter(Boolean)
    );

    function readEarnedPvpAchievementIds() {
      const earned = new Set();
      try {
        const stored = JSON.parse(localStorage.getItem(PVP_ACHIEVEMENT_STORAGE_KEY) || "[]");
        if (Array.isArray(stored)) {
          for (const id of stored) if (typeof id === "string" && id) earned.add(id);
        }
      } catch (_) {
        // Session-only PvP achievement state still works when storage is blocked.
      }
      return earned;
    }

    const earnedPvpAchievementIds = readEarnedPvpAchievementIds();

    function saveEarnedPvpAchievementIds() {
      try {
        localStorage.setItem(PVP_ACHIEVEMENT_STORAGE_KEY, JSON.stringify([...earnedPvpAchievementIds]));
      } catch (_) {
        // Session-only PvP achievement state still works when storage is blocked.
      }
    }

    const ACHIEVEMENT_STORAGE_KEY = "ribbitRaceEarnedAchievementsV1";
    const ACHIEVEMENT_ID_SET = new Set(ACHIEVEMENT_DEFINITIONS.map((item) => item.id));

    function readEarnedAchievementIds() {
      const earned = new Set();
      try {
        const stored = JSON.parse(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY) || "[]");
        if (Array.isArray(stored)) {
          for (const id of stored) if (typeof id === "string" && id) earned.add(id);
        }
      } catch (_) {
        // Invalid or blocked storage falls back to inferred accomplishments.
      }

      const frogMap = {
        "quick-finish": "crimson", "double-dinner": "plum", "fresh-catch": "forest",
        "few-hops": "violet", "century-hop": "silver", "sky-snack": "blossom",
        "fly-feast": "ember"
      };
      for (const [achievementId, frogId] of Object.entries(frogMap)) {
        if (isFrogSkinUnlocked(frogId)) earned.add(achievementId);
      }
      const levelMap = {
        "level-swamp": "swamp", "level-jungle": "jungle", "level-pond": "pond",
        "level-lake": "lake", "level-garden": "garden"
      };
      for (const [achievementId, levelId] of Object.entries(levelMap)) {
        if (isLevelUnlocked(levelId)) earned.add(achievementId);
      }
      if (isTimeSelectUnlocked()) earned.add("time-select");
      if (isCustomColorUnlocked()) earned.add("custom-colors");
      if (isCustomFrogSlotUnlocked(1)) earned.add("custom-slot-two");
      if (isCustomFrogSlotUnlocked(2)) earned.add("custom-slot-three");
      if (LEVEL_ORDER.some((levelId) => {
        const fewest = readFewestJumps(levelId);
        return fewest !== null && fewest <= 5;
      })) earned.add("five-jump-finish");
      if (hasUnlockedAllStandardFrogSkins()) earned.add("all-frog-colors");
      const fastest = getFastestCompletionTime();
      if (fastest !== null && timeUnder(fastest, 15)) earned.add("flash-finish");
      if (statsProfile.maxFliesOneJump >= 2) earned.add("double-dinner");
      if (statsProfile.maxFinalScore >= 6) earned.add("bonus-six");
      if (statsProfile.maxFinalScore >= 7) earned.add("bonus-seven");
      if (readTotalFlyCount() >= CONFIG.emberFlyTarget) earned.add("fly-feast");

      try {
        localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify([...earned]));
      } catch (_) {
        // Session-only achievement state still works.
      }
      return earned;
    }

    const earnedAchievementIds = readEarnedAchievementIds();

    function saveEarnedAchievementIds() {
      try {
        localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify([...earnedAchievementIds]));
      } catch (_) {
        // Achievement state remains available for the current session.
      }
    }

    function getAchievementDefinition(id) {
      return ACHIEVEMENT_DEFINITIONS.find((item) => item.id === id) ||
        PVP_ACHIEVEMENT_DEFINITIONS.find((item) => item.id === id) ||
        null;
    }

    function markAchievementEarned(id, notify = true) {
      // Solo achievements never progress during local 1V1 matches.
      if (game.mode === "pvp") return false;
      if (!ACHIEVEMENT_ID_SET.has(id) || earnedAchievementIds.has(id)) return false;
      earnedAchievementIds.add(id);
      saveEarnedAchievementIds();
      if ((game.state === "playing" || game.state === "won") && !game.roundUnlockedAchievementIds.includes(id)) {
        game.roundUnlockedAchievementIds.push(id);
      }
      if (notify && game.state === "playing") queueAchievementToast({ type: "achievement", achievementId: id });
      return true;
    }

    function hasRecentHumanPlayerMovement(playerIndex, windowSeconds = 10) {
      if (game.mode !== "pvp" || !Number.isInteger(playerIndex)) return false;
      const player = pvpPlayers[playerIndex];
      return Boolean(
        player &&
        player.humanInputCount > 0 &&
        Number.isFinite(player.lastHumanInputAt) &&
        game.pvpElapsed - player.lastHumanInputAt <= windowSeconds
      );
    }

    function hasRecentPlayerTwoMovement(windowSeconds = 10) {
      if (game.mode !== "pvp" || game.pvpCpuEnabled) return false;
      return hasRecentHumanPlayerMovement(1, windowSeconds);
    }

    function isAchievementEligibleHumanPvpIndex(playerIndex, verifiedInteraction = false) {
      if (!Number.isInteger(playerIndex) || playerIndex < 0 || playerIndex > 1) return false;
      if (game.pvpCpuEnabled) return playerIndex === 0;
      if (game.onlineMode || OnlineVersus.isActive()) {
        const localIndex = Number(OnlineVersus.localIndex());
        if (playerIndex !== localIndex) return false;
        // Network prediction alone cannot unlock a collision achievement. The
        // host-verified interaction path may bypass only the recency check.
        if (game.onlinePredicting && !verifiedInteraction) return false;
        return verifiedInteraction || hasRecentHumanPlayerMovement(playerIndex, 10);
      }
      // In local two-human Versus either side can earn the account achievement,
      // but the side must have actually participated recently.
      return verifiedInteraction || hasRecentHumanPlayerMovement(playerIndex, 10);
    }

    function markPvpAchievementEarned(id, playerIndex = null, notify = true, options = null) {
      if (typeof playerIndex === "boolean") {
        notify = playerIndex;
        playerIndex = null;
      }
      const verifiedInteraction = Boolean(options && options.verifiedInteraction);
      if (game.mode !== "pvp" || !PVP_ACHIEVEMENT_ID_SET.has(id) || earnedPvpAchievementIds.has(id)) return false;
      if (Number.isInteger(playerIndex) && !isAchievementEligibleHumanPvpIndex(playerIndex, verifiedInteraction)) return false;
      if (!Number.isInteger(playerIndex)) {
        const fallbackIndex = game.onlineMode || OnlineVersus.isActive() ? Number(OnlineVersus.localIndex()) : 0;
        if (!isAchievementEligibleHumanPvpIndex(fallbackIndex, verifiedInteraction)) return false;
        playerIndex = fallbackIndex;
      }
      earnedPvpAchievementIds.add(id);
      saveEarnedPvpAchievementIds();
      if (!Array.isArray(game.roundUnlockedPvpAchievementIds)) game.roundUnlockedPvpAchievementIds = [];
      if (!game.roundUnlockedPvpAchievementIds.includes(id)) game.roundUnlockedPvpAchievementIds.push(id);
      if (notify && ["playing", "pvpCelebration", "won"].includes(game.state)) {
        queueAchievementToast({
          type: "achievement",
          achievementId: id,
          pvpPlayerIndex: Number.isInteger(playerIndex) ? playerIndex : null
        });
      }
      return true;
    }

    function isAchievementUnlocked(definition) {
      if (!definition) return false;
      if (isPlaytestModeActive()) return true;
      if (PVP_ACHIEVEMENT_ID_SET.has(definition.id)) {
        return earnedPvpAchievementIds.has(definition.id);
      }
      return earnedAchievementIds.has(definition.id);
    }

    function getAchievementProgressText(definition) {
      if (!definition) return "";
      if (definition.id === "fly-feast") return `${Math.min(game.totalFliesEaten, CONFIG.emberFlyTarget)} / ${CONFIG.emberFlyTarget} FLIES`;
      if (definition.id === "time-select") return `${Math.min(game.totalFliesEaten, CONFIG.timeSelectFlyTarget)} / ${CONFIG.timeSelectFlyTarget} FLIES`;
      if (definition.id === "double-dinner") return `${Math.min(statsProfile.maxFliesOneJump, 2)} / 2 IN ONE JUMP`;
      if (definition.id === "pvp-bonk-50") return `${Math.min(Math.floor(statsProfile.pvpBonksDealt || 0), 50)} / 50 BONKS`;
      if (definition.id === "solo-endless-20") {
        const best = LEVEL_ORDER.map((levelId) => readBestEndlessFlies(levelId)).filter((value) => Number.isFinite(value));
        return `${Math.min(best.length ? Math.max(...best) : 0, 20)} / 20 FLIES`;
      }
      if (definition.id === "flash-finish" || definition.id === "quick-finish") {
        const best = getFastestCompletionTime();
        return best === null ? "" : `BEST ${formatTime(best)}`;
      }
      if (definition.id === "custom-colors") {
        const completed = LEVEL_ORDER.filter((levelId) => {
          const best = readBestTime(levelId);
          return best !== null && timeAtOrUnder(best, 30);
        }).length;
        return `${completed} / ${LEVEL_ORDER.length} LEVELS`;
      }
      if (definition.id === "custom-slot-two") {
        const completed = LEVEL_ORDER.filter((levelId) => {
          const fewest = readFewestJumps(levelId);
          return fewest !== null && fewest <= CUSTOM_FROG_SLOT_TWO_JUMP_TARGET;
        }).length;
        return `${completed} / ${LEVEL_ORDER.length} LEVELS`;
      }
      if (definition.id === "custom-slot-three") {
        const completed = LEVEL_ORDER.filter((levelId) => {
          const fewest = readFewestJumps(levelId);
          return fewest !== null && fewest <= CUSTOM_FROG_SLOT_THREE_JUMP_TARGET;
        }).length;
        return `${completed} / ${LEVEL_ORDER.length} LEVELS`;
      }
      if (definition.id === "five-jump-finish") {
        const best = LEVEL_ORDER
          .map((levelId) => readFewestJumps(levelId))
          .filter((value) => value !== null);
        return best.length ? `BEST ${Math.min(...best)} JUMPS` : "";
      }
      if (definition.id === "few-hops") {
        const best = readBestTime("pond");
        return best === null ? "" : `BEST ${formatTime(best)}`;
      }
      if (definition.unlockType === "level") {
        const index = LEVEL_ORDER.indexOf(definition.target);
        const previous = index > 0 ? LEVEL_ORDER[index - 1] : null;
        const best = previous ? readBestTime(previous) : null;
        return best === null ? "" : `BEST ${formatTime(best)}`;
      }
      return "";
    }
