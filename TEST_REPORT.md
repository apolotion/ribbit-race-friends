# Ribbit Race Friends 1.4.0 — test report

Overall: **FAIL**

## `node scripts/build-game.mjs`
Exit code: `1`
```text
client/game/10-core-config.js:263
    const FROG_UNLOCK_CHEAT = ;
                              ^

SyntaxError: Unexpected token ';'
    at new Script (node:vm:117:7)
    at GameBundleBuilder.readAndValidate (file:///mnt/data/ribbit_major_work/extract/scripts/build-game.mjs:26:5)
    at file:///mnt/data/ribbit_major_work/extract/scripts/build-game.mjs:33:20
    at Array.map (<anonymous>)
    at GameBundleBuilder.build (file:///mnt/data/ribbit_major_work/extract/scripts/build-game.mjs:31:51)
    at file:///mnt/data/ribbit_major_work/extract/scripts/build-game.mjs:52:40
    at ModuleJob.run (node:internal/modules/esm/module_job:274:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:644:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

Node.js v22.16.0
```

## `node scripts/check.mjs`
Exit code: `1`
```text
/mnt/data/ribbit_major_work/extract/public/scripts/game.bundle.js:268
    const FROG_UNLOCK_CHEAT = ;
                              ^

SyntaxError: Unexpected token ';'
    at checkSyntax (node:internal/main/check_syntax:74:5)

Node.js v22.16.0
```

## `node --test tests/*.test.mjs`
Exit code: `1`
```text
hat", false);
            } else if (pointInsideRect(point, SETUP_UI.customButton)) {
              focusSetupSkin("custom", false);
            } else if (pointInsideRect(point, SETUP_UI.backButton)) {
              focusSetupSkin("back", false);
            }
            return;
          }
    
          if (game.state === "achievements") {
            const index = getAchievementHoverIndexFromPoint(point);
            game.achievementHoveredIndex = Number.isInteger(index) ? index : null;
            if (Number.isInteger(index)) {
              game.achievementFocusArea = "item";
              game.achievementFocusIndex = index;
            } else if (pointInsideRect(point, getAchievementPageButtonHitRect(ACHIEVEMENTS_UI.pagePrevButton))) {
              game.achievementFocusArea = "pagePrev";
            } else if (pointInsideRect(point, getAchievementPageButtonHitRect(ACHIEVEMENTS_UI.pageNextButton))) {
              game.achievementFocusArea = "pageNext";
            } else if (pointInsideRect(point, ACHIEVEMENTS_UI.backButton)) {
              game.achievementFocusArea = "back";
            } else {
              game.achievementFocusArea = "item";
              game.achievementFocusIndex = getAchievementPageStart();
            }
            return;
          }
    
          if (game.state === "stats") {
            if (pointInsideRect(point, getStatsPageButtonHitRect(STATS_UI.pagePrevButton)) && game.statsPage > 0) {
              game.statsFocusArea = "pagePrev";
            } else if (pointInsideRect(point, getStatsPageButtonHitRect(STATS_UI.pageNextButton)) && game.statsPage < getStatsPageCount() - 1) {
              game.statsFocusArea = "pageNext";
            } else if (pointInsideRect(point, STATS_UI.backButton)) {
              game.statsFocusArea = "back";
            }
            return;
          }
    
          if (game.state === "soloSettings") {
            if (pointInsideRect(point, SOLO_SETTINGS_UI.endlessRow)) game.soloSettingsFocusIndex = 0;
            else if (pointInsideRect(point, SOLO_SETTINGS_UI.catchGoalRow)) game.soloSettingsFocusIndex = 1;
            else if (pointInsideRect(point, SOLO_SETTINGS_UI.timeLimitRow)) game.soloSettingsFocusIndex = 2;
            else if (pointInsideRect(point, SOLO_SETTINGS_UI.backButton)) game.soloSettingsFocusIndex = 3;
            return;
          }
    
          if (game.state === "title") {
            const hoveredButton = HOME_UI.levelButtons.find((button) => pointInsideRect(point, button));
            game.hoveredLevelId = hoveredButton?.id || null;
            game.randomButtonHovered = pointInsideRect(point, HOME_UI.randomButton);
            if (game.randomButtonHovered) ensureSoloRandomPreview();
            game.homeSettingsButtonHovered = pointInsideRect(point, HOME_UI.settingsButton);
            game.timeButtonHovered = pointInsideRect(point, HOME_UI.timeButton);
            const backHovered = pointInsideRect(point, HOME_UI.backButton);
            game.homeHoverSelection = backHovered ? "back" : null;
            const hoverKey = hoveredButton?.id || (game.randomButtonHovered ? "random" : game.homeSettingsButtonHovered ? "settings" : game.timeButtonHovered ? "time" : backHovered ? "back" : "");
            if (hoverKey !== (game.titleHoveredKey || "")) {
              game.titleHoveredKey = hoverKey;
              if (hoverKey) {
                ensureAudio();
                tone(505, 0.03, 0.008, 30);
              }
            }
            if (hoveredButton || game.randomButtonHovered || game.homeSettingsButtonHovered || game.timeButtonHovered || backHovered) {
              game.homeFocusVisible = false;
            }
            return;
          }
    
          if (game.state === "won") {
            if (game.mode === "pvp") {
              const pvpRects = getPvpVictoryButtonRects();
              const pageRects = getPvpVictoryAchievementPageButtonRects();
              const hoveredAchievementCard = getPvpVictoryAchievementCardLayout().find((card) => pointInsideRect(point, card));
              game.pvpVictoryAchievementHoverId = hoveredAchievementCard?.definition?.id || null;
              game.pvpVictoryMouseMode = true;
              game.pvpVictoryHoveredSelection = pointInsideRect(point, pvpRects.replayButton) ? "replay"
                : pointInsideRect(point, pvpRects.selectButton) ? "select"
                : pointInsideRect(point, pvpRects.homeButton) ? "home"
                : pointInsideRect(point, pageRects.prev) ? "ach-prev"
                : pointInsideRect(point, pageRects.next) ? "ach-next"
                : null;
              return;
            }
            const layout = getVictoryUnlockNoticeLayout();
            const hoveredNoticeCard = layout?.cards?.find((card) => pointInsideRect(point, card));
            game.victoryNoticeHoverKey = getVictoryNoticeKey(hoveredNoticeCard);
            game.victoryAchievementHoverId = hoveredNoticeCard?.type === "achievement" ? hoveredNoticeCard.achievementId : null;
            const buttonRects = getVictoryButtonRects(layout);
            game.victoryMouseMode = true;
            game.victoryHoveredSelection = pointInsideRect(point, buttonRects.replayButton) ? "replay"
              : pointInsideRect(point, buttonRects.homeButton) ? "home"
              : null;
            return;
          }
    
          if (!game.volumeDragging || event.pointerId !== game.volumePointerId) return;
          event.preventDefault();
          setVolumeFromPointer(point.x);
        });
    
        canvas.addEventListener("dblclick", (event) => {
          if (friendsGameInputLocked()) return;
          if (game.state !== "title") return;
          if (performance.now() < game.ignoreHomeDoubleClickUntil) return;
          event.preventDefault();
          const point = getCanvasPoint(event);
          const levelButton = HOME_UI.levelButtons.find((button) =>
            pointInsideRect(point, button)
          );
          if (!levelButton) {
            if (pointInsideRect(point, HOME_UI.randomButton)) {
              ensureAudio();
              game.soloRandomLevelMode = true;
              game.homeSelection = "random";
              ensureSoloRandomPreview();
              startNewGameCountdown();
            }
            return;
          }
          ensureAudio();
          game.soloRandomLevelMode = false;
          game.hoveredLevelId = levelButton.id;
          game.homeFocusVisible = false;
          game.homeSelection = levelButton.id;
          if (!selectLevel(levelButton.id, false)) {
            playLockedSkinSound();
            return;
          }
          startNewGameCountdown();
        });
    
    
        canvas.addEventListener("pointerup", (event) => {
          if (friendsGameInputLocked()) return;
          event.preventDefault();
          if (game.pvpVictoryPressedSelection && event.pointerId === game.pvpVictoryPointerId) {
            const point = getCanvasPoint(event);
            const rects = getPvpVictoryButtonRects();
            const pressed = game.pvpVictoryPressedSelection;
            const rect = pressed === "replay" ? rects.replayButton
              : pressed === "select" ? rects.selectButton
              : rects.homeButton;
            const activate = pointInsideRect(point, rect);
            game.pvpVictoryPressedSelection = null;
            game.pvpVictoryPointerId = null;
            if (activate) {
              selectVictoryOption(pressed, false, "mouse");
              activateVictorySelection();
            } else game.pvpVictoryHoveredSelection = null;
            return;
          }
          if (game.victoryPressedSelection && event.pointerId === game.victoryPointerId) {
            const point = getCanvasPoint(event);
            const layout = getVictoryUnlockNoticeLayout();
            const rects = getVictoryButtonRects(layout);
            const pressed = game.victoryPressedSelection;
            const rect = pressed === "replay" ? rects.replayButton : rects.homeButton;
            const activate = pointInsideRect(point, rect);
            game.victoryPressedSelection = null;
            game.victoryPointerId = null;
            if (activate) {
              selectVictoryOption(pressed, false, "mouse");
              activateVictorySelection();
            } else game.victoryHoveredSelection = null;
            return;
          }
          if (game.pausePressedSelection && event.pointerId === game.pausePointerId) {
            const point = getCanvasPoint(event);
            const pressed = game.pausePressedSelection;
            const rect = pressed === "continue" ? PAUSE_UI.continueButton
              : pressed === "restart" ? PAUSE_UI.restartButton
              : pressed === "home" ? PAUSE_UI.homeButton
              : pressed === "help" ? PAUSE_UI.helpButton
              : pressed === "help-close" ? PAUSE_UI.helpCloseButton
              : PAUSE_UI.muteButton;
            const activate = pointInsideRect(point, rect);
            game.pausePressedSelection = null;
            game.pausePointerId = null;
            game.pauseHoveredSelection = activate ? pressed : null;
            if (activate) {
              if (pressed === "mute") toggleMute();
              else if (pressed === "help") {
                game.pauseHelpOpen = !game.pauseHelpOpen;
                tone(game.pauseHelpOpen ? 430 : 305, 0.04, 0.010, 20);
              } else if (pressed === "help-close") {
                game.pauseHelpOpen = false;
                tone(305, 0.04, 0.010, -20);
              } else {
                selectPauseOption(pressed, false, false);
                activatePauseSelection();
              }
            }
            return;
          }
          if (game.customDraggingChannel && event.pointerId === game.customPointerId) {
            setCustomSliderFromPointer(game.customDraggingChannel, getCanvasPoint(event).x, false);
            commitCustomColorHistoryTransaction();
            game.customDraggingChannel = null;
            game.customPointerId = null;
            return;
          }
          if (game.volumeDragging && event.pointerId === game.volumePointerId) {
            setVolumeFromPointer(getCanvasPoint(event).x);
            game.volumeDragging = false;
            game.volumePointerId = null;
            return;
          }
          if (game.state === "frogSandbox") {
            releaseFrogSandboxAction();
            return;
          }
          releaseMainButton();
        });
    
        canvas.addEventListener("pointercancel", (event) => {
          if (event.pointerId === game.pvpVictoryPointerId) {
            game.pvpVictoryPressedSelection = null;
            game.pvpVictoryPointerId = null;
          }
          if (event.pointerId === game.victoryPointerId) {
            game.victoryPressedSelection = null;
            game.victoryPointerId = null;
            game.victoryHoveredSelection = null;
          }
          if (event.pointerId === game.pvpVictoryPointerId) {
            game.pvpVictoryPressedSelection = null;
            game.pvpVictoryPointerId = null;
            game.pvpVictoryHoveredSelection = null;
          }
          if (event.pointerId === game.pausePointerId) {
            game.pausePressedSelection = null;
            game.pausePointerId = null;
            game.pauseHoveredSelection = null;
          }
          if (event.pointerId === game.customPointerId) {
            commitCustomColorHistoryTransaction();
            game.customDraggingChannel = null;
            game.customPointerId = null;
          }
          if (event.pointerId === game.volumePointerId) {
            game.volumeDragging = false;
            game.volumePointerId = null;
          }
          releaseMainButton();
        });
        canvas.addEventListener("pointerleave", () => {
          if (game.state === "main") {
            game.mainHoveredSelection = null;
            game.achievementButtonHovered = false;
            game.statsButtonHovered = false;
            game.customizeButtonHovered = false;
            game.pvpButtonHovered = false;
            game.customHatPageHovered = null;
          } else if (game.state === "title") {
            game.hoveredLevelId = null;
            game.timeButtonHovered = false;
            game.homeSettingsButtonHovered = false;
            game.achievementButtonHovered = false;
            game.statsButtonHovered = false;
            game.customizeButtonHovered = false;
            game.pvpButtonHovered = false;
            game.randomButtonHovered = false;
            game.homeHoverSelection = null;
            game.titleHoveredKey = "";
          } else if (game.state === "soloSettings") {
            game.soloSettingsFocusIndex = Math.max(0, Math.min(1, game.soloSettingsFocusIndex));
          } else if (game.state === "achievements") {
            game.achievementHoveredIndex = null;
            game.achievementFocusArea = "item";
            game.achievementFocusIndex = getAchievementPageStart();
          } else if (game.state === "won") {
            game.victoryAchievementHoverId = null;
          game.victoryNoticeHoverKey = null;
            game.victoryHoveredSelection = null;
            game.victoryPressedSelection = null;
            game.victoryMouseMode = true;
            game.pvpVictoryHoveredSelection = null;
            game.pvpVictoryPressedSelection = null;
            game.pvpVictoryAchievementHoverId = null;
            if (game.mode === "pvp") game.pvpVictoryMouseMode = true;
          }
        });
        canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    
        document.addEventListener("visibilitychange", () => {
          if (!OnlineVersus.isActive() && document.hidden && (game.state === "playing" || game.state === "countdown")) {
            clearPvpPhysicalShiftState(true);
            clearSoloPhysicalInputState(true);
            frog.charging = false;
            game.buttonHeld = false;
            game.volumeDragging = false;
            game.volumePointerId = null;
            game.state = "paused";
          }
        });
    
        window.addEventListener("blur", () => {
          if(OnlineVersus.isActive())return;
          clearPvpPhysicalShiftState(true);
          clearSoloPhysicalInputState(true);
          game.volumeDragging = false;
          game.volumePointerId = null;
          commitCustomColorHistoryTransaction();
          game.customDraggingChannel = null;
          game.customPointerId = null;
          if (game.buttonHeld) releaseMainButton();
        });
    
        function runStartupStep(label, action, fallback = null) {
          try { return action(); }
          catch (error) {
            console.error(`Ribbit Race startup step failed: ${label}`, error);
            window.__RIBBIT_STARTUP_ERROR__ = { label, message: error?.message || String(error) };
            return fallback;
          }
        }
    
        game.state = "main";
        game.mainSelection = "solo";
        game.mainFocusVisible = false;
        game.soloRandomLevelMode = true;
        game.homeFocusVisible = false;
        game.homeSelection = "random";
        game.hoveredLevelId = null;
        runStartupStep("equipped hat validation", () => ensureValidEquippedHat());
        runStartupStep("frog achievements", () => evaluateStoredFrogAchievements());
        runStartupStep("general achievements", () => evaluateStoredGeneralAchievements());
        runStartupStep("custom slot unlocks", () => evaluateCustomFrogSlotUnlocks(false));
        const startupSkin = runStartupStep("saved frog skin", () => readFrogSkinId(), "azure") || "azure";
        runStartupStep("frog selection", () => selectFrogSkin(startupSkin, false), null);
        if (!FROG_SKINS[game.skinId] && game.skinId !== "custom") game.skinId = "azure";
        game.setupSkinFocusId = game.skinId;
        runStartupStep("moving platforms", () => resetMovingPlatforms());
        runStartupStep("random level preview", () => ensureSoloRandomPreview(true));
        runStartupStep("time chrome", () => syncTimeOfDayChrome());
        runStartupStep("initial canvas draw", () => drawScene());
        canvas.focus();
        window.__RIBBIT_GAME_READY__ = true;
        window.dispatchEvent(new CustomEvent("ribbit-race-ready"));
        requestAnimationFrame(frame);
    
    }
    
    "use strict";
    
    // Authentication is intentionally the final startup responsibility.
    RibbitCloud.bootstrap();
    
  operator: 'match'
  stack: |-
    TestContext.<anonymous> (file:///mnt/data/ribbit_major_work/extract/tests/friends-patch.test.mjs:316:10)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
    Test.postRun (node:internal/test_runner/test:1173:19)
    Test.run (node:internal/test_runner/test:1101:12)
    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  ...
# Subtest: version 1.3.0 remains in settings and moves into the How To Play book footer
ok 65 - version 1.3.0 remains in settings and moves into the How To Play book footer
  ---
  duration_ms: 1.522511
  type: 'test'
  ...
# Subtest: frog overlap axis is deterministic and cooldown separation removes intersections
ok 66 - frog overlap axis is deterministic and cooldown separation removes intersections
  ---
  duration_ms: 0.851107
  type: 'test'
  ...
# Subtest: overlap resolution maps horizontal contact to rebound and vertical contact to bonk
ok 67 - overlap resolution maps horizontal contact to rebound and vertical contact to bonk
  ---
  duration_ms: 0.685351
  type: 'test'
  ...
# Subtest: fast-moving frogs use swept collision detection instead of tunneling through
ok 68 - fast-moving frogs use swept collision detection instead of tunneling through
  ---
  duration_ms: 1.045258
  type: 'test'
  ...
# Subtest: Versus collision code cannot silently ignore overlapping frogs
ok 69 - Versus collision code cannot silently ignore overlapping frogs
  ---
  duration_ms: 1.109021
  type: 'test'
  ...
# Subtest: achievement toast becomes translucent when a fly or word plate is behind it
ok 70 - achievement toast becomes translucent when a fly or word plate is behind it
  ---
  duration_ms: 1.053197
  type: 'test'
  ...
# Subtest: jungle center trunk no longer draws the decorative snake
ok 71 - jungle center trunk no longer draws the decorative snake
  ---
  duration_ms: 1.297048
  type: 'test'
  ...
# Subtest: final-catch word plates stay in camera space and fade with their flies
ok 72 - final-catch word plates stay in camera space and fade with their flies
  ---
  duration_ms: 0.644051
  type: 'test'
  ...
# Subtest: PvP leaderboard uses singular grammar for exactly one win
ok 73 - PvP leaderboard uses singular grammar for exactly one win
  ---
  duration_ms: 0.087466
  type: 'test'
  ...
# Subtest: menu credit is Made by Nick on one shared baseline
ok 74 - menu credit is Made by Nick on one shared baseline
  ---
  duration_ms: 1.214339
  type: 'test'
  ...
# Subtest: fly-label sprite text is centered in physical pixels
ok 75 - fly-label sprite text is centered in physical pixels
  ---
  duration_ms: 0.809393
  type: 'test'
  ...
# Subtest: custom frog editor includes a large live preview and relocated controls
ok 76 - custom frog editor includes a large live preview and relocated controls
  ---
  duration_ms: 1.044079
  type: 'test'
  ...
# Subtest: sandbox flies begin with the normal Single Player spawn animation
ok 77 - sandbox flies begin with the normal Single Player spawn animation
  ---
  duration_ms: 1.192562
  type: 'test'
  ...
# Subtest: public legacy-key migration controls are retired
ok 78 - public legacy-key migration controls are retired
  ---
  duration_ms: 1.458912
  type: 'test'
  ...
1..78
# tests 78
# suites 0
# pass 74
# fail 4
# cancelled 0
# skipped 0
# todo 0
# duration_ms 304.19247
```

## Production validation still required
- No live Cloudflare deployment was performed.
- Browser MediaRecorder replay storage requires a production Worker test.
- Independent two-finger controls require a physical touchscreen test.
