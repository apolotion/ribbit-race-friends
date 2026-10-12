    const soloFrozenWorldCanvas = document.createElement("canvas");
    soloFrozenWorldCanvas.width = canvas.width;
    soloFrozenWorldCanvas.height = canvas.height;
    const soloFrozenWorldContext = soloFrozenWorldCanvas.getContext("2d", { alpha: false });
    soloFrozenWorldContext.imageSmoothingEnabled = false;
    let soloFrozenWorldValid = false;

    function shouldFreezeSoloWorld() {
      return game.mode === "solo" && (game.state === "paused" || game.state === "countdown");
    }

    function clearSoloFrozenWorld() {
      soloFrozenWorldValid = false;
    }

    function captureSoloFrozenWorld() {
      soloFrozenWorldContext.save();
      soloFrozenWorldContext.setTransform(1, 0, 0, 1, 0, 0);
      soloFrozenWorldContext.drawImage(canvas, 0, 0);
      soloFrozenWorldContext.restore();
      soloFrozenWorldValid = true;
    }

    function paintSoloFrozenWorld() {
      if (!soloFrozenWorldValid) return false;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(soloFrozenWorldCanvas, 0, 0);
      ctx.restore();
      return true;
    }

    function drawSoloPauseOverlay() {
      drawOverlayPanel(
        "PAUSED",
        [
          "THE FROG IS TAKING A BREAK",
          isRibbitMobileMode() ? "HOLD THE JUMP METER TO JUMP" : "HOLD SPACE TO JUMP"
        ],
        "",
        true,
        {
          x: 75,
          y: 28,
          w: 330,
          h: 204,
          titleOffset: 17,
          lineStartOffset: 58,
          lineGap: 15,
          footerOffset: 169
        }
      );
      drawPauseControls();
      drawBitmapText(RIBBIT_CREDIT_TEXT, W / 2, 216, 1, "center", "#48555a");
    }

    function drawScene() {
      // Prune labels only when a fly actually leaves. Existing flies retain their
      // chosen word-plate rectangles across ordinary single-player animation frames.
      pruneFlyLabelPlacementCache();
      const freezeSoloWorld = shouldFreezeSoloWorld();
      if (!freezeSoloWorld) clearSoloFrozenWorld();
      if (OnlineVersus.isSpectating()) { OnlineVersus.drawSpectator(); return; }
      if (game.state === "onlineConnect") { OnlineVersus.drawEntry(); return; }
      if (game.state === "onlineSetup") { OnlineVersus.drawRoom(); return; }
      if (game.state === "main") { drawMainMenuScreen(); return; }
      if (game.state === "pvpSetup") { drawPvpSetupScreen(); return; }
      if (game.state === "pvpSettings") { drawPvpSettingsScreen(); return; }
      if (game.state === "soloSettings") { drawSoloSettingsScreen(); return; }
      if (game.state === "stats") {
        drawStatsScreen();
        return;
      }
      if (game.state === "achievements") {
        drawAchievementsScreen();
        return;
      }
      if (game.state === "custom") {
        drawCustomColorScreen();
        return;
      }
      if (game.state === "frogSandbox") {
        drawFrogSandboxScreen();
        return;
      }
      if (game.state === "setup") {
        drawSetupScreen();
        return;
      }
      if (game.state === "title") {
        drawHomeScreen();
        return;
      }
      if (game.mode === "pvp") {
        drawPvpScene();
        return;
      }

      // Pausing and the resume countdown intentionally freeze the world. Repaint
      // that exact backing bitmap instead of rebuilding fly signs every animation
      // frame; only the pause/countdown overlay remains live and interactive.
      if (freezeSoloWorld && paintSoloFrozenWorld()) {
        if (game.state === "paused") drawSoloPauseOverlay();
        else drawResumeCountdown();
        return;
      }

      const criticalCatch = game.soloCriticalCatchActive;
      ctx.save();
      if (criticalCatch) applySoloCriticalCatchCamera();
      drawBackground();
      for (const platform of platforms) drawPlatform(platform);
      drawTimeOfDayWorldTint();

      if (frog.charging && game.state === "playing") drawArcPreview();
      for (const currentFly of flies) {
        drawFlySpawnSparks(currentFly);
        drawFlyAt(currentFly.x, currentFly.y, getFlySpawnScale(currentFly));
        if (!window.RibbitRaceFinalCatchLabelsGone) { drawFlyNameTag(currentFly); }
      }
      drawFrogAfterimages(frog);
      drawAirShadowForEntity(frog, getFrogPalette());
      drawTongue();
      drawFrog();
      drawCatchSparkles();
      drawWrongCatchBubbles();
      drawSpeechBubble();
      ctx.restore();
      drawTopHud();
      drawOffscreenFrogIndicator();
      drawHud();
      if (game.state === "playing") drawAchievementToast();
      if (criticalCatch) drawSoloCriticalCatchOverlay();
      if (freezeSoloWorld) captureSoloFrozenWorld();

      if (game.state === "paused") {
        drawSoloPauseOverlay();
      } else if (game.state === "countdown") {
        drawResumeCountdown();
      } else if (game.state === "won" && frog.danceTime >= CONFIG.winDanceRevealDelay) {
        drawVictoryScreen();
      }
    }

    function drawPixelTrophy(centerX, topY, mirrored = false, scale = 1) {
      const goldDark = "#9a5b18";
      const goldMid = "#e5a72d";
      const goldLight = "#ffe27a";
      const baseDark = "#69431e";

      ctx.save();
      ctx.translate(Math.round(centerX), Math.round(topY));
      ctx.scale((mirrored ? -1 : 1) * scale, scale);

      // Handles and outline.
      ctx.fillStyle = goldDark;
      ctx.fillRect(-8, 2, 4, 7);
      ctx.fillRect(5, 2, 4, 7);
      ctx.fillRect(-10, 3, 3, 5);
      ctx.fillRect(8, 3, 3, 5);
      ctx.fillRect(-6, 0, 13, 11);

      // Cup body and shine.
      ctx.fillStyle = goldMid;
      ctx.fillRect(-5, 1, 11, 8);
      ctx.fillRect(-4, 8, 9, 3);
      ctx.fillStyle = goldLight;
      ctx.fillRect(-3, 1, 5, 2);
      ctx.fillRect(-4, 3, 3, 4);
      ctx.fillRect(-8, 4, 2, 3);
      ctx.fillRect(7, 4, 2, 3);

      // Stem and base.
      ctx.fillStyle = goldDark;
      ctx.fillRect(-1, 10, 3, 4);
      ctx.fillStyle = baseDark;
      ctx.fillRect(-5, 14, 11, 3);
      ctx.fillStyle = goldMid;
      ctx.fillRect(-4, 13, 9, 2);
      ctx.fillStyle = goldLight;
      ctx.fillRect(-3, 13, 4, 1);

      ctx.restore();
    }

    function drawNewBestCelebration(y = 88) {
      const gold = "#ffd75e";
      const goldShadow = "#9a5b18";
      drawPixelTrophy(178, y - 5, false);
      drawBitmapText("NEW BEST TIME!", W / 2, y, 1, "center", gold, goldShadow);
      drawPixelTrophy(302, y - 5, true);
      ctx.fillStyle = "#fff3a8";
      ctx.fillRect(163, y - 8, 3, 1);
      ctx.fillRect(164, y - 9, 1, 3);
      ctx.fillRect(314, y - 5, 3, 1);
      ctx.fillRect(315, y - 6, 1, 3);
    }

    function getVictoryNoticeKey(card) {
      if (!card) return "";
      if (card.type === "frog") return `frog:${card.frogId || ""}`;
      if (card.type === "achievement") return `achievement:${card.achievementId || ""}`;
      if (card.type === "level") return `level:${card.levelId || ""}`;
      if (card.type === "leaderboard") return `leaderboard:${card.record?.scope || "school"}:${card.record?.metric || ""}:${card.record?.level || "all"}:${card.record?.score || ""}`;
      return card.type || "";
    }

    function getVictoryNoticeRequirementLines(card) {
      if (!card) return [];
      if (card.type === "frog") return FROG_SKIN_ACHIEVEMENTS[card.frogId]?.lines || [];
      if (card.type === "achievement") return getAchievementDefinition(card.achievementId)?.lines || [];
      if (card.type === "level") return getAchievementDefinition(`level-${card.levelId}`)?.lines || [];
      if (card.type === "custom") return getAchievementDefinition("custom-colors")?.lines || [];
      if (card.type === "time") return getAchievementDefinition("time-select")?.lines || [];
      return [];
    }

    function getVictoryUnlockNoticeLayout() {
      const items = [];
      for (const frogId of game.roundUnlockedSkinIds.filter((id) => FROG_SKINS[id])) {
        items.push({ type: "frog", frogId, title: `${FROG_SKINS[frogId].name} FROG UNLOCKED`, subtitle: "CLICK TO EQUIP", palette: FROG_SKINS[frogId] });
      }
      if (game.roundCustomColorUnlocked) {
        items.push({ type: "custom", title: "CUSTOM COLORS UNLOCKED", subtitle: "CLICK TO CREATE", palette: getCustomFrogSkin() });
      }
      if (game.roundUnlockedLevelId && LEVELS[game.roundUnlockedLevelId]) {
        const levelId = game.roundUnlockedLevelId;
        items.push({ type: "level", levelId, title: `${LEVELS[levelId].name} LEVEL UNLOCKED`, subtitle: "CLICK TO PLAY", palette: LEVEL_MENU_COLORS[levelId] || LEVEL_MENU_COLORS.park });
      }
      if (game.roundTimeSelectUnlocked) {
        items.push({ type: "time", title: "TIME SELECT UNLOCKED", subtitle: "25-FLY GOAL COMPLETE", palette: getSelectedSkin() });
      }
      for (const achievementId of game.roundUnlockedAchievementIds) {
        const definition = getAchievementDefinition(achievementId);
        if (!definition) continue;
        items.push({ type: "achievement", achievementId, icon: definition.icon, title: definition.name, subtitle: "ACHIEVEMENT UNLOCKED", palette: getSelectedSkin() });
      }
      for (const record of game.roundLeaderboardRecordNotices || []) {
        const metricLabel = record.metric === "flies" ? "TOTAL FLIES" : record.metric === "endless" ? "ENDLESS FLIES" : record.metric === "pvpwins" ? "PVP WINS" : record.metric === "time" ? "TIME" : "JUMPS";
        const levelLabel = record.level && record.level !== "all" ? String(record.level).toUpperCase() : "FRIENDS";
        items.push({
          type: "leaderboard",
          title: (window.RibbitWorldRecordNotice?.prepare?.() ?? "WORLD RECORD"),
          subtitle: `${record.scope === "class" ? `${record.scopeLabel || "CLASS"} • ` : ""}${levelLabel} ${metricLabel}`,
          palette: { dark: "#9a5b18", mid: "#e5a72d", light: "#ffe27a", belly: "#fff3a8" },
          record
        });
      }
      if (!items.length) return null;

      const pageCount = Math.max(1, Math.ceil(items.length / CONFIG.victoryNoticesPerPage));
      game.victoryNoticePage = clamp(game.victoryNoticePage, 0, pageCount - 1);
      const pageStart = game.victoryNoticePage * CONFIG.victoryNoticesPerPage;
      const visibleItems = items.slice(pageStart, pageStart + CONFIG.victoryNoticesPerPage);
      const count = visibleItems.length;
      const columns = count === 1 ? 1 : 2;
      const cardW = count === 1 ? 272 : 192;
      const cardH = count <= 2 ? 44 : 35;
      const gapX = 8;
      const gapY = 4;
      const rows = Math.ceil(count / columns);
      const totalW = columns * cardW + (columns - 1) * gapX;
      const totalH = rows * cardH + (rows - 1) * gapY;
      const rawStartY = 108;
      const rawButtonY = Math.min(218, rawStartY + totalH + 8);
      const panelH = rawButtonY + 22 + 9 - 8;
      const panelY = Math.round((H - panelH) / 2);
      const offsetY = panelY - 8;
      const startX = Math.round((W - totalW) / 2);
      const startY = rawStartY + offsetY;
      const cards = visibleItems.map((item, index) => ({
        ...item,
        globalIndex: pageStart + index,
        x: startX + (index % columns) * (cardW + gapX),
        y: startY + Math.floor(index / columns) * (cardH + gapY),
        w: cardW,
        h: cardH
      }));
      const actions = cards
        .filter((card) => ["frog", "custom", "level"].includes(card.type))
        .map((card) => ({ type: card.type, frogId: card.frogId || null, levelId: card.levelId || null, x: card.x, y: card.y, w: card.w, h: card.h }));
      const panelX = Math.round((W - 412) / 2);
      const pageNextX = panelX + 382;
      const pagePrevX = pageNextX - 29;
      return {
        items, visibleItems, cards, actions, totalH, startY,
        buttonY: rawButtonY + offsetY, panelY, panelH, offsetY,
        pageCount, pageIndex: game.victoryNoticePage,
        pagePrevButton: {
          x: pagePrevX,
          y: rawButtonY + offsetY + 1,
          w: ACHIEVEMENTS_UI.pagePrevButton.w,
          h: ACHIEVEMENTS_UI.pagePrevButton.h
        },
        pageNextButton: {
          x: pageNextX,
          y: rawButtonY + offsetY + 1,
          w: ACHIEVEMENTS_UI.pageNextButton.w,
          h: ACHIEVEMENTS_UI.pageNextButton.h
        }
      };
    }

    function getVictoryButtonRects(layout = getVictoryUnlockNoticeLayout()) {
      const buttonW = 98;
      const buttonGap = 33;
      const startX = Math.round((W - (buttonW * 2 + buttonGap)) / 2);
      if (layout) {
        return {
          replayButton: { x: startX, y: layout.buttonY, w: buttonW, h: 22 },
          homeButton: { x: startX + buttonW + buttonGap, y: layout.buttonY, w: buttonW, h: 22 }
        };
      }
      const rawPanelH = 139;
      const panelY = Math.round((H - rawPanelH) / 2);
      const y = 116 + (panelY - 8);
      return {
        replayButton: { x: startX, y, w: buttonW, h: 22 },
        homeButton: { x: startX + buttonW + buttonGap, y, w: buttonW, h: 22 }
      };
    }

    function getVictoryPanelRect(layout = getVictoryUnlockNoticeLayout()) {
      const w = 412;
      if (layout) {
        return { x: Math.round((W - w) / 2), y: layout.panelY, w, h: layout.panelH };
      }
      const h = 139;
      return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h };
    }

    function drawVictoryUnlockNotice(layout = getVictoryUnlockNoticeLayout()) {
      if (!layout) return;
      const equipped = getSelectedSkin();

      for (const card of layout.cards) {
        const palette = card.palette || equipped;
        const compact = card.h < 34;
        const previewW = compact ? 38 : card.type === "frog" ? 52 : 44;
        const textX = card.x + previewW;
        const textW = card.w - previewW;

        // The surrounding card remains themed to the frog used for the round.
        ctx.fillStyle = "rgba(25,43,52,0.28)";
        ctx.fillRect(card.x + 2, card.y + 2, card.w, card.h);
        ctx.fillStyle = equipped.dark;
        ctx.fillRect(card.x, card.y, card.w, card.h);
        ctx.fillStyle = mixHexColors(equipped.belly, "#ffffff", 0.42);
        ctx.fillRect(card.x + 3, card.y + 3, card.w - 6, card.h - 6);

        // Only the unlock-specific image and text regions adopt the new palette.
        ctx.fillStyle = mixHexColors(palette.belly || palette.light, "#ffffff", 0.24);
        ctx.fillRect(card.x + 3, card.y + 3, previewW - 3, card.h - 6);
        ctx.fillStyle = palette.light || palette.mid;
        ctx.fillRect(card.x + 7, card.y + 6, previewW - 11, 3);
        ctx.fillStyle = palette.dark;
        ctx.fillRect(textX, card.y + 3, textW - 3, card.h - 6);
        ctx.fillStyle = mixHexColors(palette.belly || palette.light, palette.mid, 0.20);
        ctx.fillRect(textX + 3, card.y + 6, textW - 9, card.h - 12);

        // Large, readable unlock art in the neutral preview area.
        if (card.type === "frog") {
          const scale = card.h >= 42 ? 1.46 : card.h >= 35 ? 1.10 : 0.78;
          const frogWidth = 18 * scale;
          drawMiniFrogSwatch(
            Math.round(card.x + previewW / 2 - frogWidth / 2),
            Math.round(card.y + card.h / 2 - 7 * scale),
            getDisplaySkinById(card.frogId, "azure"),
            scale
          );
        } else if (card.type === "custom") {
          drawAchievementIcon("palette", card.x + 13, card.y + Math.max(7, (card.h - 15) / 2), true, compact ? 0.78 : 1.0);
        } else if (card.type === "level") {
          drawLevelUnlockIcon(
            card.levelId,
            card.x + 16,
            card.y + Math.max(7, (card.h - 18) / 2),
            palette,
            compact ? 0.82 : 1.05
          );
        } else if (card.type === "achievement") {
          drawAchievementIcon(card.icon, card.x + 12, card.y + Math.max(6, (card.h - 17) / 2), true, compact ? 0.78 : 1.0);
        } else if (card.type === "leaderboard") {
          drawPixelTrophy(card.x + Math.round(previewW / 2), card.y + Math.max(6, (card.h - 20) / 2), false, compact ? 0.72 : 0.92);
        } else {
          drawMiniSun(card.x + 21, card.y + card.h / 2, false);
        }

        const center = textX + textW / 2 - 2;
        const titleY = card.y + (compact ? 6 : 7);
        const subtitleY = card.y + (compact ? 17 : 23);
        drawBitmapText(card.title, center, titleY, 1, "center", COLORS.white, palette.dark);
        drawBitmapText(card.subtitle, center, subtitleY, 1, "center", palette.dark);
      }

      if (layout.pageCount > 1) {
        const skin = getSelectedSkin();
        const buttons = [
          { rect: layout.pagePrevButton, direction: -1, enabled: layout.pageIndex > 0 },
          { rect: layout.pageNextButton, direction: 1, enabled: layout.pageIndex < layout.pageCount - 1 }
        ];
        buttons.forEach(({ rect, direction, enabled }) => {
          ctx.fillStyle = "rgba(25,43,52,0.28)";
          ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
          ctx.fillStyle = COLORS.ink;
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
          ctx.fillStyle = enabled ? "#f7fdff" : "#d7dfe2";
          ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
          drawPagerArrowIcon(rect, direction, enabled ? skin.dark : "#9aa3a7");
        });
        const victoryPageLabelX = layout.pagePrevButton.x - 8;
        const victoryPageLabelY = layout.pagePrevButton.y +
          (layout.pagePrevButton.h - 7 * 0.72) / 2;
        drawBitmapText(
          `${layout.pageIndex + 1}/${layout.pageCount}`,
          victoryPageLabelX,
          victoryPageLabelY,
          0.72,
          "right",
          "#617177"
        );
      }

      if (game.victoryNoticeHoverKey) {
        const card = layout.cards.find((item) => getVictoryNoticeKey(item) === game.victoryNoticeHoverKey);
        const lines = getVictoryNoticeRequirementLines(card);
        if (card && lines.length) {
          const width = 224;
          const height = lines.length > 1 ? 31 : 25;
          const left = Math.round(clamp(card.x + card.w / 2 - width / 2, 12, W - width - 12));
          const top = Math.round(Math.max(layout.panelY + 51, card.y - height - 5));
          ctx.fillStyle = "rgba(25,43,52,0.35)";
          ctx.fillRect(left + 3, top + 3, width, height);
          ctx.fillStyle = COLORS.ink;
          ctx.fillRect(left, top, width, height);
          ctx.fillStyle = "#f7fdff";
          ctx.fillRect(left + 3, top + 3, width - 6, height - 6);
          ctx.fillStyle = getSelectedSkin().light;
          ctx.fillRect(left + 7, top + 6, width - 14, 3);
          const lineStart = lines.length > 1 ? top + 11 : top + 13;
          lines.forEach((line, index) => drawBitmapText(line, left + width / 2, lineStart + index * 8, 0.76, "center", "#59666b"));
        }
      }
    }

    function equipVictoryUnlockedFrog(action = null) {
      const layout = getVictoryUnlockNoticeLayout();
      if (!layout) return false;

      if (action?.type === "custom" && game.roundCustomColorUnlocked) {
        openCustomColorMenu(false);
      } else {
        const id = action?.frogId || layout.items.find((item) => item.type === "frog")?.frogId;
        if (id && FROG_SKINS[id]) {
          selectFrogSkin(id, false);
          game.setupSkinFocusId = id;
          openSetupMenu(false);
        } else if (game.roundCustomColorUnlocked) {
          openCustomColorMenu(false);
        } else {
          return false;
        }
      }

      tone(523, 0.08, 0.020, 105);
      tone(784, 0.10, 0.016, 120, 0.070);
      return true;
    }

    function activateVictoryUnlockAction(action) {
      if (!action || game.state !== "won") return false;
      if (action.type === "frog" || action.type === "custom") {
        return equipVictoryUnlockedFrog(action);
      }
      if (action.type === "level" && action.levelId && isLevelUnlocked(action.levelId)) {
        if (!selectLevel(action.levelId, false)) return false;
        game.homeSelection = action.levelId;
        tone(523, 0.07, 0.018, 95);
        tone(784, 0.09, 0.014, 110, 0.055);
        startNewGameCountdown();
        return true;
      }
      return false;
    }

    function drawVictoryButtons(buttonRects = getVictoryButtonRects(), options = {}) {
      const buttons = [
        {
          id: "replay",
          ...buttonRects.replayButton,
          label: options.replayLabel || "REPLAY",
          palette: [getSelectedSkin().dark, getSelectedSkin().mid, getSelectedSkin().light]
        },
        {
          id: "home",
          ...buttonRects.homeButton,
          label: options.homeLabel || "HOME",
          palette: [getSelectedSkin().dark, getSelectedSkin().mid, getSelectedSkin().light]
        }
      ];

      for (const button of buttons) {
        const hovered = game.victoryHoveredSelection === button.id;
        const pressed = game.victoryPressedSelection === button.id;
        const selected = hovered || pressed || (!game.victoryMouseMode && game.victorySelection === button.id);
        ctx.fillStyle = "rgba(25,43,52,0.30)";
        ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
        ctx.fillStyle = selected ? COLORS.ink : "#8fa6ac";
        ctx.fillRect(button.x, button.y, button.w, button.h);

        if (selected) {
          ctx.fillStyle = button.palette[0];
          ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
          ctx.fillStyle = button.palette[1];
          ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, button.h - 8);
          ctx.fillStyle = button.palette[2];
          ctx.fillRect(button.x + 6, button.y + 5, button.w - 12, 3);
          ctx.fillStyle = COLORS.white;
          ctx.fillRect(button.x + 3, button.y + 3, 2, 2);
          ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2);
          ctx.fillRect(button.x + 3, button.y + button.h - 5, 2, 2);
          ctx.fillRect(button.x + button.w - 5, button.y + button.h - 5, 2, 2);
        } else {
          ctx.fillStyle = "#f7fdff";
          ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
          ctx.fillStyle = COLORS.white;
          ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, 4);
        }

        drawBitmapText(
          button.label,
          button.x + button.w / 2,
          button.y + 8,
          1,
          "center",
          selected ? COLORS.white : "#34484f",
          selected ? button.palette[0] : null
        );
      }
    }

    function getCanvasPoint(event) {
      const rect = canvas.getBoundingClientRect();
      // In standalone/fullscreen mode Safari can letterbox the 16:9 canvas
      // inside a wider or taller CSS box. Map touches through the actual
      // rendered content rectangle rather than the outer element bounds.
      const scale = Math.min(rect.width / W, rect.height / H) || 1;
      const contentWidth = W * scale;
      const contentHeight = H * scale;
      const offsetX = (rect.width - contentWidth) / 2;
      const offsetY = (rect.height - contentHeight) / 2;
      return {
        x: (event.clientX - rect.left - offsetX) / scale,
        y: (event.clientY - rect.top - offsetY) / scale
      };
    }

    function pointInsideRect(point, rect) {
      return point.x >= rect.x && point.x <= rect.x + rect.w &&
        point.y >= rect.y && point.y <= rect.y + rect.h;
    }

    function pointInsideCpuDifficultyBox(point) {
      const rect = PVP_SETUP_UI.cpuDifficultyButton;
      return point.x >= rect.x
        && point.x <= rect.x + rect.w
        && point.y >= rect.y
        && point.y <= rect.y + rect.h;
    }

    function setVolumeFromPointer(pointX) {
      const track = PAUSE_UI.sliderTrack;
      game.volume = clamp((pointX - track.x) / track.w, 0, 1);
      game.muted = game.volume <= 0.001;
    }

    function pauseGame() {
      if (OnlineVersus.isActive()) {
        OnlineVersus.showExitMenu();
        return;
      }
      if (game.sandboxMode) {
        closeFrogSandbox();
        return;
      }
      if (game.state !== "playing" && game.state !== "countdown") return;
      capturePauseChargeSnapshot();
      game.volumeDragging = false;
      game.volumePointerId = null;
      game.countdownNumber = 0;
      game.countdownTimer = 0;
      game.pauseSelection = "continue";
      game.pauseFocusVisible = true;
      game.pauseHoveredSelection = null;
      game.pausePressedSelection = null;
      game.pausePointerId = null;
      game.pauseHelpOpen = false;
      game.state = "paused";
      tone(250, 0.05, 0.012, -45);
    }

    function togglePauseFromHud() {
      if (game.sandboxMode) {
        closeFrogSandbox();
        return;
      }
      if (game.state === "paused") {
        resumePausedGame();
      } else if (game.state === "playing" || game.state === "countdown") {
        pauseGame();
      }
    }

    let runtimeRecoveryCount = 0;

    function drawRuntimeRecoveryScreen(error) {
      ctx.fillStyle = "#10203a";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(72, 68, 336, 132);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(72, 68, 336, 8);
      drawBitmapText("RIBBIT RACE RECOVERED", W / 2, 92, 1.35, "center", "#17495a");
      drawBitmapText("YOUR CLOUD SAVE IS STILL SAFE", W / 2, 126, 0.82, "center", "#48555a");
      drawBitmapText("RETURNING TO THE MAIN MENU", W / 2, 147, 0.82, "center", "#48555a");
      const message = String(error?.message || "STARTUP ERROR").slice(0, 44).toUpperCase();
      drawBitmapText(message, W / 2, 174, 0.54, "center", "#7a3e4f");
    }

    function advanceOnlineSimulation(now){
      if(!OnlineVersus.checkDirectHealth()){lastFrameTime=now;accumulator=0;OnlineVersus.pumpTransport();return;}
      const elapsed=Math.max(0,(now-lastFrameTime)/1000);lastFrameTime=now;
      accumulator+=OnlineVersus.isActive()?elapsed:Math.min(.05,elapsed);
      const mobilePerformance = RIBBIT_COARSE_TOUCH_DEVICE || isRibbitMobileMode();
      const maxTicks = OnlineVersus.isActive()
        ? (mobilePerformance ? 24 : 480)
        : (mobilePerformance ? 8 : 12);
      let ticks=0;
      while(accumulator>=STEP&&ticks++<maxTicks){update(STEP);OnlineVersus.afterSimulationStep(STEP);accumulator-=STEP;}
      // Mobile Safari can create a runaway catch-up loop after a slow frame.
      // Keep at most two fixed steps of debt in Mobile Mode so the next frame
      // remains responsive rather than spending several seconds catching up.
      if (mobilePerformance && ticks >= maxTicks && accumulator >= STEP) {
        accumulator = Math.min(accumulator, STEP * 2);
      }
      // Desktop retains its full background scheduling debt for deterministic
      // peer simulation. Browser-frozen/sleeping devices remain a platform limit.
      OnlineVersus.pumpTransport();
    }
    function frame(now) {
      if (friendsGameInputLocked()) {
        lastFrameTime = now;
        accumulator = 0;
        requestAnimationFrame(frame);
        return;
      }
      try {
        advanceOnlineSimulation(now);
        drawScene();OnlineVersus.drawOnlineTooltip();OnlineVersus.drawQueueBadge();OnlineVersus.drawSyncLabel();OnlineVersus.drawExitMenu();
        positionRgbValueEditor();
        runtimeRecoveryCount = 0;
      } catch (error) {
        console.error("Ribbit Race frame recovered from an error", error);
        window.__RIBBIT_LAST_FRAME_ERROR__ = { message: error?.message || String(error), stack: error?.stack || "" };
        runtimeRecoveryCount += 1;
        accumulator = 0;
        if (game.mode === "pvp") {
          game.customHatOpen = false;
          game.pvpImpactEffects = [];
          pvpPlayers.forEach((player) => {
            if (!player) return;
            player.collisionCooldown = Math.max(player.collisionCooldown || 0, CONFIG.pvpCollisionCooldown);
          });
          if (runtimeRecoveryCount >= 3 && game.state === "playing" && !OnlineVersus.isActive()) {
            game.state = "paused";
            game.pauseSelection = "continue";
            game.pauseFocusVisible = true;
          }
        } else {
          game.state = "main";
          game.mode = "solo";
          game.mainSelection = "solo";
          game.customHatOpen = false;
          game.pauseHelpOpen = false;
          game.skinId = FROG_SKINS[game.skinId] ? game.skinId : "azure";
          frog.charging = false;
          game.buttonHeld = false;
        }
        try { drawScene(); }
        catch (_) { drawRuntimeRecoveryScreen(error); }
      }
      requestAnimationFrame(frame);
    }

    rgbValueEditor.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });

    rgbValueEditor.addEventListener("input", () => {
      if (!game.customEditingChannel) return;
      const numeric = Number(rgbValueEditor.value);
      if (Number.isFinite(numeric)) {
        setCustomRgbChannel(game.customEditingChannel, clamp(Math.round(numeric), 0, 255), game.customPart, false);
      }
    });

    rgbValueEditor.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        const redo = event.code === "KeyY" || (event.code === "KeyZ" && event.shiftKey);
        const undo = event.code === "KeyZ" && !event.shiftKey;
        if (undo || redo) {
          event.preventDefault();
          if (redo) redoCustomColorChange(true);
          else undoCustomColorChange(true);
          if (game.customEditingChannel) {
            rgbValueEditor.value = String(getCustomDraftRgb()[game.customEditingChannel]);
            rgbValueEditor.select();
          }
          return;
        }
      }
      if (!event.repeat) handleHiddenFrogUnlockCheat(event.key);
      const adjustment = event.code === "ArrowLeft" || event.code === "KeyA" ? -5
        : event.code === "ArrowRight" || event.code === "KeyD" ? 5
        : event.code === "ArrowUp" ? 1
        : event.code === "ArrowDown" ? -1
        : 0;
      if (adjustment && game.customEditingChannel) {
        event.preventDefault();
        const current = Number(rgbValueEditor.value);
        const next = clamp(Math.round((Number.isFinite(current) ? current : 0) + adjustment), 0, 255);
        rgbValueEditor.value = String(next);
        setCustomRgbChannel(game.customEditingChannel, next, game.customPart, false);
        rgbValueEditor.select();
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const channel = game.customEditingChannel;
        const index = CUSTOM_RGB_CHANNELS.indexOf(channel);
        const nextIndex = index + (event.shiftKey ? -1 : 1);
        commitRgbValueEditor(false);
        if (nextIndex >= 0 && nextIndex < CUSTOM_RGB_CHANNELS.length) {
          openRgbValueEditor(CUSTOM_RGB_CHANNELS[nextIndex]);
        } else {
          hideRgbValueEditor(false);
          game.customFocusArea = event.shiftKey ? game.customPart : "use";
          canvas.focus();
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        hideRgbValueEditor(true);
        canvas.focus();
      }
    });

    rgbValueEditor.addEventListener("blur", () => {
      if (!game.customEditingChannel) return;
      commitRgbValueEditor(false);
      hideRgbValueEditor(false);
    });

    window.addEventListener("resize", positionRgbValueEditor);

    const GAME_PAGE_SCROLL_KEYS = new Set([
      "Space",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown"
    ]);

    // Capture these keys before the browser or an embedding page can treat
    // them as scrolling commands. Numeric RGB editing is excluded so its native
    // arrow-key behavior remains available.
    document.addEventListener("keydown", (event) => {
      if (document.activeElement !== canvas) return;
      if (!GAME_PAGE_SCROLL_KEYS.has(event.code)) return;
      event.preventDefault();
    }, { capture: true, passive: false });

    const pvpPhysicalInputsHeld = [new Set(), new Set()];
    const soloPhysicalInputsHeld = new Set();

    function getPvpControlBinding(event) {
      if (!event) return null;
      const code = String(event.code || "");
      const key = String(event.key || "");
      const lowerKey = key.toLowerCase();
      const location = Number(event.location ?? 0);
      const leftLocation = typeof KeyboardEvent !== "undefined" ? KeyboardEvent.DOM_KEY_LOCATION_LEFT : 1;
      const rightLocation = typeof KeyboardEvent !== "undefined" ? KeyboardEvent.DOM_KEY_LOCATION_RIGHT : 2;
      if (key === "Shift") {
        if (location === leftLocation || location === 1) return { playerIndex: 0, controlId: "ShiftLeft" };
        if (location === rightLocation || location === 2) return { playerIndex: 1, controlId: "ShiftRight" };
        if (code === "ShiftLeft") return { playerIndex: 0, controlId: "ShiftLeft" };
        if (code === "ShiftRight") return { playerIndex: 1, controlId: "ShiftRight" };
        return null;
      }
      if (game.pvpCpuEnabled && (code === "Space" || key === " ")) {
        return { playerIndex: 0, controlId: "Space" };
      }
      if (code === "KeyZ" || (!code && lowerKey === "z")) {
        return { playerIndex: 0, controlId: code || "KeyZ" };
      }
      if (code === "Slash" || (!code && (key === "/" || key === "?"))) {
        return { playerIndex: 1, controlId: code || "Slash" };
      }
      if (code === "ShiftLeft") return { playerIndex: 0, controlId: "ShiftLeft" };
      if (code === "ShiftRight") return { playerIndex: 1, controlId: "ShiftRight" };
      return null;
    }

    function getSoloJumpControlId(event) {
      if (!event) return null;
      const code = String(event.code || "");
      if (["Space", "KeyW", "ArrowUp", "ShiftLeft", "ShiftRight"].includes(code)) return code;
      if (event.key === "Shift") {
        const location = Number(event.location ?? 0);
        if (location === 2) return "ShiftRight";
        if (location === 1) return "ShiftLeft";
        if (code === "ShiftRight") return "ShiftRight";
        if (code === "ShiftLeft") return "ShiftLeft";
        return null;
      }
      return null;
    }

    function clearPvpPhysicalShiftState(releasePlayers = false) {
      pvpPhysicalInputsHeld.forEach((held, index) => {
        if (releasePlayers && (held.size || pvpPlayers[index]?.inputHeld)) releasePvpButton(index, "system");
        held.clear();
      });
    }

    function clearSoloPhysicalInputState(releasePlayer = false) {
      if (releasePlayer && (soloPhysicalInputsHeld.size || game.buttonHeld)) releaseMainButton();
      soloPhysicalInputsHeld.clear();
    }

    window.RibbitRaceSuspendForLogin = () => {
      try { clearPvpPhysicalShiftState(true); } catch (_) {}
      try { clearSoloPhysicalInputState(true); } catch (_) {}
      try { if (game.buttonHeld) releaseMainButton(); } catch (_) {}
      frog.charging = false;
      game.buttonHeld = false;
      game.sandboxMode = false;
      game.pauseHelpOpen = false;
      game.customDraggingChannel = null;
      game.customPointerId = null;
      game.volumeDragging = false;
      game.volumePointerId = null;
      game.pausePressedSelection = null;
      game.pausePointerId = null;
      game.victoryPressedSelection = null;
      game.victoryPointerId = null;
      game.pvpVictoryPressedSelection = null;
      game.pvpVictoryPointerId = null;
      for (const player of pvpPlayers) { if (player) { player.inputHeld = false; player.charging = false; } }
      game.state = "friendsLogin";
      game.mode = "solo";
      accumulator = 0;
      lastFrameTime = performance.now();
      gameFrame.classList.remove("ribbit-focus-mode", "rr-queue-reserved");
      document.body.classList.remove("ribbit-focus-active");
      if (document.fullscreenElement) { try { document.exitFullscreen?.(); } catch (_) {} }
    };

    // Capture-phase handling avoids the browser collapsing both Shift keys into
    // one generic modifier. Sets also prevent releasing one assigned key from
    // releasing a frog while its alternate key is still held.
    function handlePhysicalJumpDown(event) {
      if (friendsGameInputLocked()) return;
      if (OnlineVersus.handleControlDown(event)) return;
      if (game.mode === "pvp" && game.state === "playing") {
        const binding = getPvpControlBinding(event);
        if (!binding) return;
        event.preventDefault();
        event.stopPropagation();
        if (binding.playerIndex === 1 && game.pvpCpuEnabled) {
          pvpPhysicalInputsHeld[1].clear();
          return;
        }
        const held = pvpPhysicalInputsHeld[binding.playerIndex];
        const wasEmpty = held.size === 0;
        held.add(binding.controlId);
        if (wasEmpty) pressPvpButton(binding.playerIndex);
        return;
      }
      if (game.mode === "solo" && game.state === "playing") {
        const controlId = getSoloJumpControlId(event);
        if (!controlId) return;
        event.preventDefault();
        event.stopPropagation();
        const wasEmpty = soloPhysicalInputsHeld.size === 0;
        soloPhysicalInputsHeld.add(controlId);
        if (wasEmpty) pressMainButton();
      }
    }

    function handlePhysicalJumpUp(event) {
      if (friendsGameInputLocked()) return;
      if (OnlineVersus.handleControlUp(event)) return;
      if (game.mode === "pvp") {
        const binding = getPvpControlBinding(event);
        if (binding) {
          event.preventDefault();
          event.stopPropagation();
          if (binding.playerIndex === 1 && game.pvpCpuEnabled) {
            pvpPhysicalInputsHeld[1].clear();
            return;
          }
          const held = pvpPhysicalInputsHeld[binding.playerIndex];
          held.delete(binding.controlId);
          if (held.size === 0) releasePvpButton(binding.playerIndex);
          return;
        }
      }
      if (game.mode === "solo") {
        const controlId = getSoloJumpControlId(event);
        if (controlId) {
          event.preventDefault();
          event.stopPropagation();
          soloPhysicalInputsHeld.delete(controlId);
          if (soloPhysicalInputsHeld.size === 0) releaseMainButton();
        }
      }
    }

    document.addEventListener("keydown", handlePhysicalJumpDown, { capture: true, passive: false });
    document.addEventListener("keyup", handlePhysicalJumpUp, { capture: true, passive: false });

    window.addEventListener("blur", () => {
      if(OnlineVersus.isActive())return;
      clearPvpPhysicalShiftState(true);
      clearSoloPhysicalInputState(true);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && !OnlineVersus.isActive()) {
        clearPvpPhysicalShiftState(true);
        clearSoloPhysicalInputState(true);
      }
    });

    function handleGameEscapeAction(backspaceMenuOnly = false) {
      if (OnlineVersus.hasRoom() && !OnlineVersus.isActive()) { OnlineVersus.closeOverlay(); return; }
      if (OnlineVersus.isOverlayOpen()) {
        OnlineVersus.closeOverlay();
        return;
      }
      const leaderboard = document.getElementById("leaderboard-overlay");
      if (!leaderboard?.hidden) {
        document.getElementById("leaderboard-close")?.click();
        return;
      }
      if (game.pauseHelpOpen) {
        game.pauseHelpOpen = false;
        return;
      }
      if (game.sandboxMode) {
        closeFrogSandbox();
        return;
      }
      if (backspaceMenuOnly && ["playing", "countdown", "paused", "won", "main"].includes(game.state)) return;
      if (game.state === "playing" || game.state === "countdown") pauseGame();
      else if (game.state === "paused") resumePausedGame();
      else if (game.state === "won") returnToHomeScreen();
      else if (game.state === "main") { /* root menu */ }
      else if (game.state === "title") openMainMenu();
      else if (game.state === "setup") openMainMenu();
      else if (game.state === "custom") openSetupMenu();
      else if (game.state === "frogSandbox") closeFrogSandbox();
      else if (game.state === "achievements") closeAchievementsMenu();
      else if (game.state === "stats") closeStatsMenu();
      else if (game.state === "soloSettings") closeSoloSettingsMenu();
      else if (game.state === "pvpSetup") closePvpSetupMenu();
      else if (game.state === "pvpSettings") closePvpSettingsMenu();
    }

    let focusEscapeTimer = null;
    let focusEscapeActive = false;
    let focusEscapeTriggered = false;
    const FOCUS_ESCAPE_HOLD_MS = 700;
    document.addEventListener("keydown", (event) => {
      if (friendsGameInputLocked()) return;
      if (event.code !== "Escape" || !gameFrame.classList.contains("ribbit-focus-mode")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat || focusEscapeActive) return;
      focusEscapeActive = true;
      focusEscapeTriggered = false;
      focusEscapeTimer = setTimeout(() => {
        focusEscapeTriggered = true;
        setRibbitFocusMode(false);
        tone(280, 0.08, 0.012, -40);
      }, FOCUS_ESCAPE_HOLD_MS);
    }, { capture: true, passive: false });
    document.addEventListener("keyup", (event) => {
      if (friendsGameInputLocked()) return;
      if (event.code !== "Escape" || !focusEscapeActive) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      clearTimeout(focusEscapeTimer);
      const wasHold = focusEscapeTriggered;
      focusEscapeTimer = null;
      focusEscapeActive = false;
      focusEscapeTriggered = false;
      if (!wasHold) handleGameEscapeAction(false);
    }, { capture: true, passive: false });

    window.addEventListener("keydown", (event) => {
      if (friendsGameInputLocked()) return;
      if (game.state === "custom" && (event.ctrlKey || event.metaKey) && !event.altKey) {
        const redo = event.code === "KeyY" || (event.code === "KeyZ" && event.shiftKey);
        const undo = event.code === "KeyZ" && !event.shiftKey;
        if (undo || redo) {
          event.preventDefault();
          if (redo) redoCustomColorChange(true);
          else undoCustomColorChange(true);
          return;
        }
      }
      if (document.activeElement === rgbValueEditor) return;
      if (event.code === "KeyP" && ["playing", "countdown", "paused"].includes(game.state)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) handleGameEscapeAction(false);
        return;
      }
      if (!event.repeat) {
        handleHiddenFrogUnlockCheat(event.key);
      }

      if (game.state === "frogSandbox") {
        if (event.code === "ArrowLeft" || event.code === "KeyA") { event.preventDefault(); sandboxFrog.dir = -1; return; }
        if (event.code === "ArrowRight" || event.code === "KeyD") { event.preventDefault(); sandboxFrog.dir = 1; return; }
        if (["Space", "ArrowUp", "KeyW", "KeyZ"].includes(event.code)) { event.preventDefault(); if (!event.repeat) pressFrogSandboxAction(); return; }
        if (event.code === "Enter" || event.code === "NumpadEnter") { event.preventDefault(); closeFrogSandbox(); return; }
      }

      if (game.state === "main") {
        if (event.code === "ArrowLeft" || event.code === "KeyA") { event.preventDefault(); moveMainSelection(-1, 0); return; }
        if (event.code === "ArrowRight" || event.code === "KeyD") { event.preventDefault(); moveMainSelection(1, 0); return; }
        if (event.code === "ArrowUp" || event.code === "KeyW") { event.preventDefault(); moveMainSelection(0, -1); return; }
        if (event.code === "ArrowDown" || event.code === "KeyS") { event.preventDefault(); moveMainSelection(0, 1); return; }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter" || event.code === "Space") {
          event.preventDefault(); activateMainSelection(); return;
        }
      }

      if (game.state === "soloSettings") {
        if (event.code === "ArrowUp" || event.code === "KeyW") { event.preventDefault(); moveSoloSettingsFocus(-1); return; }
        if (event.code === "ArrowDown" || event.code === "KeyS") { event.preventDefault(); moveSoloSettingsFocus(1); return; }
        if (event.code === "ArrowLeft" || event.code === "KeyA" || event.code === "ArrowRight" || event.code === "KeyD") {
          event.preventDefault();
          if (game.soloSettingsFocusIndex < 3) activateSoloSettingsSelection(event.code === "ArrowLeft" || event.code === "KeyA" ? -1 : 1);
          return;
        }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter" || event.code === "Space") {
          event.preventDefault(); activateSoloSettingsSelection(1); return;
        }
      }

      if (game.state === "pvpSettings") {
        if (event.code === "ArrowLeft" || event.code === "KeyA") { event.preventDefault(); movePvpSettingsFocus(-1, 0); return; }
        if (event.code === "ArrowRight" || event.code === "KeyD") { event.preventDefault(); movePvpSettingsFocus(1, 0); return; }
        if (event.code === "ArrowUp" || event.code === "KeyW") { event.preventDefault(); movePvpSettingsFocus(0, -1); return; }
        if (event.code === "ArrowDown" || event.code === "KeyS") { event.preventDefault(); movePvpSettingsFocus(0, 1); return; }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter" || event.code === "Space") { event.preventDefault(); activatePvpSettingsSelection(); return; }
      }

      if (game.state === "pvpSetup") {
        game.pvpSetupMouseMode=false;
        if ((event.code === "ArrowLeft" || event.code === "KeyA") && game.pvpSetupFocusArea === "cpuDifficulty") { event.preventDefault(); cyclePvpCpuDifficulty(-1); return; }
        if ((event.code === "ArrowRight" || event.code === "KeyD") && game.pvpSetupFocusArea === "cpuDifficulty") { event.preventDefault(); cyclePvpCpuDifficulty(1); return; }
        if (event.code === "ArrowLeft" || event.code === "KeyA") { event.preventDefault(); movePvpSetupFocus(-1, 0); return; }
        if (event.code === "ArrowRight" || event.code === "KeyD") { event.preventDefault(); movePvpSetupFocus(1, 0); return; }
        if (event.code === "ArrowUp" || event.code === "KeyW") { event.preventDefault(); movePvpSetupFocus(0, -1); return; }
        if (event.code === "ArrowDown" || event.code === "KeyS") { event.preventDefault(); movePvpSetupFocus(0, 1); return; }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter" || event.code === "Space") {
          event.preventDefault(); activatePvpSetupSelection(); return;
        }
      }

      if (game.customHatOpen && (game.state === "setup" || game.state === "custom")) {
        const columns = 4;
        const filtered = getFilteredCustomHatOptions();
        if (game.customHatSearchOpen) {
          if (event.code === "Escape") { event.preventDefault(); closeCustomHatSearch(); return; }
          if (event.code === "Enter" || event.code === "NumpadEnter") { event.preventDefault(); const hat = CUSTOM_HAT_OPTIONS[game.customHatFocusIndex] || filtered[0]; if (hat) applyHatSelectorChoice(hat.id, true); return; }
          if (event.code === "Backspace") { event.preventDefault(); game.customHatSearchQuery = String(game.customHatSearchQuery || "").slice(0, -1); syncCustomHatSearchResults(false); return; }
          if (event.code === "Space") { event.preventDefault(); game.customHatSearchQuery += " "; syncCustomHatSearchResults(false); return; }
          if (event.key && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            if (String(game.customHatSearchQuery || "").length < 18) {
              game.customHatSearchQuery += event.key;
              syncCustomHatSearchResults(false);
              tone(480, 0.015, 0.004, 10);
            }
            return;
          }
        }
        if (event.code === "Escape" || event.code === "Backspace") { event.preventDefault(); game.customHatOpen = false; closeCustomHatSearch(); return; }
        if (event.code === "Slash" || event.code === "KeyF") { event.preventDefault(); openCustomHatSearch(); return; }
        if (event.code === "Delete" || event.code === "KeyR") { event.preventDefault(); removeAllFrogHats(true); return; }
        if (event.code === "PageUp") { event.preventDefault(); setCustomHatPage(game.customHatPage - 1, true); tone(390,0.03,0.007,-30); return; }
        if (event.code === "PageDown") { event.preventDefault(); setCustomHatPage(game.customHatPage + 1, true); tone(510,0.03,0.007,30); return; }
        if (!filtered.length) return;
        const currentLocal = Math.max(0, filtered.findIndex((hat) => hat.index === game.customHatFocusIndex));
        const moveLocalFocus = (nextLocal) => {
          const wrapped = ((nextLocal % filtered.length) + filtered.length) % filtered.length;
          game.customHatFocusIndex = filtered[wrapped].index;
          syncCustomHatPageToFocus();
        };
        if (event.code === "ArrowLeft" || event.code === "KeyA") { event.preventDefault(); moveLocalFocus(currentLocal - 1); tone(420,0.03,0.007,-20); return; }
        if (event.code === "ArrowRight" || event.code === "KeyD") { event.preventDefault(); moveLocalFocus(currentLocal + 1); tone(480,0.03,0.007,20); return; }
        if (event.code === "ArrowUp" || event.code === "KeyW") { event.preventDefault(); moveLocalFocus(currentLocal - columns); tone(430,0.03,0.007,-20); return; }
        if (event.code === "ArrowDown" || event.code === "KeyS") { event.preventDefault(); moveLocalFocus(currentLocal + columns); tone(490,0.03,0.007,20); return; }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.code === "Space") {
          event.preventDefault();
          const hat = CUSTOM_HAT_OPTIONS[game.customHatFocusIndex] || filtered[0] || CUSTOM_HAT_OPTIONS[0];
          if (hat) applyHatSelectorChoice(hat.id, true);
          return;
        }
      }

      if (game.state === "setup") {
        if (event.code === "ArrowUp" || event.code === "KeyW") {
          event.preventDefault();
          moveSetupSkin(0, -1);
          return;
        }
        if (event.code === "ArrowDown" || event.code === "KeyS") {
          event.preventDefault();
          moveSetupSkin(0, 1);
          return;
        }
        if (event.code === "ArrowLeft" || event.code === "KeyA") {
          event.preventDefault();
          moveSetupSkin(-1, 0);
          return;
        }
        if (event.code === "ArrowRight" || event.code === "KeyD") {
          event.preventDefault();
          moveSetupSkin(1, 0);
          return;
        }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter" || event.code === "Space") {
          event.preventDefault();
          if (game.setupSkinFocusId === "back") openMainMenu();
          else if (game.setupSkinFocusId === "sandbox") openFrogSandbox();
          else if (game.setupSkinFocusId === "hat") openHatSelectorForCurrentFrog();
          else if (game.setupSkinFocusId === "custom") openCustomColorMenu();
          else if (isFrogSkinUnlocked(game.setupSkinFocusId)) {
            selectFrogSkin(game.setupSkinFocusId, true);
          } else playLockedSkinSound();
          return;
        }
      }


      if (game.state === "achievements") {
        if (event.code === "PageUp") { event.preventDefault(); setAchievementPage(game.achievementPage - 1); return; }
        if (event.code === "PageDown") { event.preventDefault(); setAchievementPage(game.achievementPage + 1); return; }
        if (event.code === "ArrowLeft" || event.code === "KeyA") { event.preventDefault(); moveAchievementFocus(-1, 0); return; }
        if (event.code === "ArrowRight" || event.code === "KeyD") { event.preventDefault(); moveAchievementFocus(1, 0); return; }
        if (event.code === "ArrowUp" || event.code === "KeyW") { event.preventDefault(); moveAchievementFocus(0, -1); return; }
        if (event.code === "ArrowDown" || event.code === "KeyS") { event.preventDefault(); moveAchievementFocus(0, 1); return; }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter" || event.code === "Space") {
          event.preventDefault(); activateAchievementSelection(); return;
        }
      }

      if (game.state === "stats") {
        if (event.code === "PageUp") { event.preventDefault(); setStatsPage(game.statsPage - 1); return; }
        if (event.code === "PageDown") { event.preventDefault(); setStatsPage(game.statsPage + 1); return; }
        if (event.code === "ArrowLeft" || event.code === "KeyA" || event.code === "ArrowUp" || event.code === "KeyW") {
          event.preventDefault(); moveStatsFocus(-1); return;
        }
        if (event.code === "ArrowRight" || event.code === "KeyD" || event.code === "ArrowDown" || event.code === "KeyS") {
          event.preventDefault(); moveStatsFocus(1); return;
        }
        if (
          event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter" ||
          event.code === "Space"
        ) {
          event.preventDefault(); activateStatsSelection(); return;
        }
      }

      if (game.state === "custom") {
        if (event.code === "ArrowLeft" || event.code === "KeyA") {
          event.preventDefault();
          moveCustomColorFocus(-1, 0);
          return;
        }
        if (event.code === "ArrowRight" || event.code === "KeyD") {
          event.preventDefault();
          moveCustomColorFocus(1, 0);
          return;
        }
        if (event.code === "ArrowUp" || event.code === "KeyW") {
          event.preventDefault();
          moveCustomColorFocus(0, -1);
          return;
        }
        if (event.code === "ArrowDown" || event.code === "KeyS") {
          event.preventDefault();
          moveCustomColorFocus(0, 1);
          return;
        }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter") {
          event.preventDefault();
          activateCustomColorSelection();
          return;
        }
      }

      if (game.state === "title") {
        if (event.code === "ArrowLeft" || event.code === "KeyA") {
          event.preventDefault();
          moveHomeSelection(-1, 0);
          return;
        }
        if (event.code === "ArrowRight" || event.code === "KeyD") {
          event.preventDefault();
          moveHomeSelection(1, 0);
          return;
        }
        if (event.code === "ArrowUp" || event.code === "KeyW") {
          event.preventDefault();
          moveHomeSelection(0, -1);
          return;
        }
        if (event.code === "ArrowDown" || event.code === "KeyS") {
          event.preventDefault();
          moveHomeSelection(0, 1);
          return;
        }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter" || event.code === "Space") {
          event.preventDefault();
          activateHomeSelection();
          return;
        }
        if (/^Digit[1-6]$/.test(event.code)) {
          event.preventDefault();
          focusHomeSelection(LEVEL_ORDER[Number(event.code.slice(-1)) - 1]);
          return;
        }
      }

      if (game.state === "paused") {
        if (event.code === "ArrowLeft" || event.code === "KeyA") {
          event.preventDefault();
          movePauseSelection("left");
          return;
        }
        if (event.code === "ArrowRight" || event.code === "KeyD") {
          event.preventDefault();
          movePauseSelection("right");
          return;
        }
        if (event.code === "ArrowUp" || event.code === "KeyW") {
          event.preventDefault();
          movePauseSelection("up");
          return;
        }
        if (event.code === "ArrowDown" || event.code === "KeyS") {
          event.preventDefault();
          movePauseSelection("down");
          return;
        }
        if (event.code === "KeyR") {
          event.preventDefault();
          restartCurrentLevel();
          return;
        }
        if (event.code === "KeyQ") {
          event.preventDefault();
          returnToHomeScreen();
          return;
        }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter" || event.code === "Space") {
          event.preventDefault();
          activatePauseSelection();
          return;
        }
      }

      if (game.state === "won") {
        if (event.code === "PageUp") {
          event.preventDefault();
          if (game.mode !== "pvp") {
            game.victoryNoticePage = Math.max(0, game.victoryNoticePage - 1);
            game.victoryAchievementHoverId = null;
      game.victoryNoticeHoverKey = null;
          }
          return;
        }
        if (event.code === "PageDown") {
          event.preventDefault();
          if (game.mode !== "pvp") {
            const layout = getVictoryUnlockNoticeLayout();
            game.victoryNoticePage = Math.min((layout?.pageCount || 1) - 1, game.victoryNoticePage + 1);
            game.victoryAchievementHoverId = null;
      game.victoryNoticeHoverKey = null;
          }
          return;
        }
        if (
          event.code === "ArrowLeft" || event.code === "ArrowRight" ||
          event.code === "KeyA" || event.code === "KeyD"
        ) {
          event.preventDefault();
          const options = game.mode === "pvp" ? ["replay", "select", "home"] : ["replay", "home"];
          const direction = (event.code === "ArrowRight" || event.code === "KeyD") ? 1 : -1;
          const currentIndex = Math.max(0, options.indexOf(game.victorySelection));
          selectVictoryOption(options[(currentIndex + direction + options.length) % options.length]);
          return;
        }
        if (event.code === "ArrowUp" || event.code === "KeyW") {
          event.preventDefault();
          selectVictoryOption("replay");
          return;
        }
        if (event.code === "ArrowDown" || event.code === "KeyS") {
          event.preventDefault();
          selectVictoryOption(game.mode === "pvp" ? (game.victorySelection === "select" ? "home" : "select") : "home");
          return;
        }
        if (event.code === "Enter" || event.code === "NumpadEnter" || event.key === "Enter" || event.code === "Space") {
          event.preventDefault();
          activateVictorySelection();
          return;
        }
        if (event.code === "KeyR") {
          event.preventDefault();
          if (game.mode === "pvp") continuePvpMatch();
          else startNewGameCountdown();
          return;
        }
      }

      if (event.code === "KeyR") {
        if (["playing","countdown"].includes(game.state)) {
          event.preventDefault();
          if (game.mode === "pvp") startNewPvpCountdown();
          else resetGame(true);
          return;
        }
      }

      if (event.code === "Escape" || event.code === "Backspace") {
        event.preventDefault();
        handleGameEscapeAction(event.code === "Backspace");
        return;
      }


      if (event.code === "KeyH" && game.state === "paused") {
        event.preventDefault();
        returnToHomeScreen();
        return;
      }

      if (event.code === "KeyM") {
        event.preventDefault();
        toggleMute();
      }
    }, { passive: false });

    // Gameplay jump releases are handled in capture phase above. Keep this
    // listener available for non-gameplay key-up behavior added by future menus.
    window.addEventListener("keyup", (event) => {
      if (friendsGameInputLocked()) return;
      if (game.state === "frogSandbox" && ["Space", "ArrowUp", "KeyW", "KeyZ"].includes(event.code)) {
        event.preventDefault();
        releaseFrogSandboxAction();
      }
    }, { passive: false });

    // Optional mouse/touch support keeps the same one-button rules.
    canvas.addEventListener("pointerdown", (event) => {
      if (friendsGameInputLocked()) return;
      event.preventDefault();
      canvas.setPointerCapture?.(event.pointerId);
      canvas.focus();

      if (game.state === "countdown") {
        const point = getCanvasPoint(event);
        if (game.mode === "solo" && pointInsideRect(point, HUD_UI.pauseButton)) togglePauseFromHud();
        return;
      }

      if (game.state === "frogSandbox") {
        const point = getCanvasPoint(event);
        ensureAudio();
        if (pointInsideRect(point, FROG_SANDBOX_UI.exitButton) || pointInsideRect(point, FROG_SANDBOX_UI.backButton)) closeFrogSandbox();
        else pressFrogSandboxAction();
        return;
      }

      if (game.state === "main") {
        const point = getCanvasPoint(event);
        ensureAudio();
        const entries = [
          ["solo", MAIN_UI.soloButton], ["frog", MAIN_UI.frogButton], ["pvp", MAIN_UI.pvpButton],
          ["achievements", MAIN_UI.achievementsButton], ["stats", MAIN_UI.statsButton]
        ];
        const hit = entries.find(([, rect]) => pointInsideRect(point, rect));
        if (hit) {
          game.mainSelection = hit[0];
          game.mainFocusVisible = true;
          activateMainSelection();
        }
        return;
      }

      if (game.state === "pvpSettings") {
        const point = getCanvasPoint(event);
        ensureAudio();
        const rowIndex = PVP_SETTINGS_UI.rows.findIndex((rect) => pointInsideRect(point, rect));
        if (rowIndex >= 0) {
          game.pvpSettingsFocusIndex = rowIndex;
          const rect = PVP_SETTINGS_UI.rows[rowIndex];
          cyclePvpSetting(["roundGoal","time","bestOf","unpause"][rowIndex],point.x<rect.x+rect.w/2?-1:1);
        } else if (pointInsideRect(point, PVP_SETTINGS_UI.backButton)) {
          game.pvpSettingsFocusIndex = 4;
          closePvpSettingsMenu();
        }
        return;
      }

      if (game.state === "pvpSetup") {
        const point = getCanvasPoint(event);
        game.pvpSetupMouseMode=true;
        ensureAudio();
        const levelIndex = PVP_SETUP_UI.levelButtons.findIndex((rect) => pointInsideRect(point, rect));
        if (levelIndex >= 0) {
          game.pvpSetupFocusArea = "level";
          selectPvpSetupLevel(levelIndex);
        } else if (pointInsideRect(point, PVP_SETUP_UI.vsButton)) {
          game.pvpSetupFocusArea = "vs";
          togglePvpCpuMode();
        } else if (game.pvpCpuEnabled && pointInsideCpuDifficultyBox(point)) {
          game.pvpSetupFocusArea = "cpuDifficulty";
          cyclePvpCpuDifficulty(point.x < PVP_SETUP_UI.cpuDifficultyButton.x + PVP_SETUP_UI.cpuDifficultyButton.w / 2 ? -1 : 1);
        } else if (pointInsideRect(point, PVP_SETUP_UI.p1Selector)) {
          const rect = PVP_SETUP_UI.p1Selector;
          game.pvpSetupFocusArea = "skin";
          game.pvpSetupPlayerIndex = 0;
          if (point.x < rect.x + rect.w * 0.37) movePvpSkinFocus(0, -1);
          else if (point.x > rect.x + rect.w * 0.63) movePvpSkinFocus(0, 1);
          else confirmPvpSkinSelection(0);
        } else if (pointInsideRect(point, PVP_SETUP_UI.p2Selector)) {
          const rect = PVP_SETUP_UI.p2Selector;
          game.pvpSetupFocusArea = "skin";
          game.pvpSetupPlayerIndex = 1;
          if (point.x < rect.x + rect.w * 0.37) movePvpSkinFocus(1, -1);
          else if (point.x > rect.x + rect.w * 0.63) movePvpSkinFocus(1, 1);
          else confirmPvpSkinSelection(1);
        } else if (pointInsideRect(point, PVP_SETUP_UI.wifiButton)) {
          game.pvpSetupFocusArea = "bottom";
          game.pvpSetupBottomSelection = "wifi";
          OnlineVersus.open();
        } else if (pointInsideRect(point, PVP_SETUP_UI.tutorialButton)) {
          game.pvpSetupFocusArea = "bottom";
          game.pvpSetupBottomSelection = "tutorial";
          ensureAudio();
          window.RibbitRaceTutorialEngine?.start?.("pvp");
        } else if (pointInsideRect(point, PVP_SETUP_UI.startButton)) {
          game.pvpSetupFocusArea = "bottom";
          game.pvpSetupBottomSelection = "start";
          if (!canStartPvpFromPreview()) playLockedSkinSound();
          else { commitPvpPreviewSelections(); startNewPvpCountdown(true); }
        } else if (pointInsideRect(point, PVP_SETUP_UI.backButton)) {
          game.pvpSetupFocusArea = "bottom";
          game.pvpSetupBottomSelection = "back";
          closePvpSetupMenu();
        } else if (pointInsideRect(point, PVP_SETUP_UI.settingsButton)) {
          game.pvpSetupFocusArea = "bottom";
          game.pvpSetupBottomSelection = "settings";
          openPvpSettingsMenu();
        } else if (pointInsideRect(point, PVP_SETUP_UI.timeButton)) {
          game.pvpSetupFocusArea = "bottom";
          game.pvpSetupBottomSelection = "time";
          if (isTimeSelectUnlocked()) cycleTimeOfDayMode();
          else playLockedSkinSound();
        }
        return;
      }

      if (game.customHatOpen && (game.state === "setup" || game.state === "custom")) {
        const point = getCanvasPoint(event);
        ensureAudio();
        const closeRect = { x:386, y:39, w:20, h:20 };
        const pageButtons = getCustomHatPageButtons();
        const chosen = getCustomHatOptionRects().find((option) => pointInsideRect(point, option));
        if (chosen) { game.customHatFocusIndex = chosen.index; applyHatSelectorChoice(chosen.id, true); }
        else if (pointInsideRect(point, pageButtons.removeAll)) { removeAllFrogHats(true); game.customHatRemoveAllHovered = true; }
        else if (pointInsideRect(point, pageButtons.search) || pointInsideRect(point, game.customHatSearchInputRect || {x:0,y:0,w:0,h:0})) { openCustomHatSearch(); }
        else if (pointInsideRect(point, pageButtons.prev)) { setCustomHatPage(game.customHatPage - 1, true); tone(390,0.04,0.009,-25); }
        else if (pointInsideRect(point, pageButtons.next)) { setCustomHatPage(game.customHatPage + 1, true); tone(510,0.04,0.009,25); }
        else if (pointInsideRect(point, closeRect)) { game.customHatOpen = false; closeCustomHatSearch(); tone(320,0.04,0.009,-25); }
        else { closeCustomHatSearch(); }
        return;
      }

      if (game.state === "setup") {
        const point = getCanvasPoint(event);
        const skinButton = SETUP_UI.skinButtons.find((button) => pointInsideRect(point, button));
        ensureAudio();
        if (skinButton) {
          focusSetupSkin(skinButton.id);
          if (isFrogSkinUnlocked(skinButton.id)) {
            selectFrogSkin(skinButton.id, true);
            game.ignoreHomeDoubleClickUntil = performance.now() + 500;
          } else {
            playLockedSkinSound();
          }
        } else if (pointInsideRect(point, SETUP_UI.sandboxButton)) {
          focusSetupSkin("sandbox");
          openFrogSandbox();
        } else if (pointInsideRect(point, SETUP_UI.hatButton)) {
          focusSetupSkin("hat");
          openHatSelectorForCurrentFrog();
        } else if (pointInsideRect(point, SETUP_UI.customButton)) {
          focusSetupSkin("custom");
          if (isCustomColorUnlocked()) openCustomColorMenu();
        } else if (pointInsideRect(point, SETUP_UI.backButton)) {
          openMainMenu();
        }
        return;
      }

      if (game.state === "custom") {
        const point = getCanvasPoint(event);
        ensureAudio();
        const valueSlider = CUSTOM_UI.sliders.find((item) => {
          const rect = getRgbValueRect(item);
          return rect && pointInsideRect(point, rect);
        });
        if (valueSlider) {
          openRgbValueEditor(valueSlider.channel);
          return;
        }

        const slotButton = CUSTOM_UI.slotButtons.find((item) => pointInsideRect(point, item));
        if (slotButton) {
          selectCustomSlot(slotButton.index);
          return;
        }
        const partButton = CUSTOM_UI.partButtons.find((item) => pointInsideRect(point, item));
        if (partButton) {
          hideRgbValueEditor(true);
          setCustomPart(partButton.id);
        } else {
          const slider = CUSTOM_UI.sliders.find((item) => pointInsideRect(point, {
            x: item.hitX, y: item.hitY, w: item.hitW, h: item.hitH
          }));
          if (slider) {
            hideRgbValueEditor(true);
            game.customFocusArea = slider.channel;
            game.customDraggingChannel = slider.channel;
            game.customPointerId = event.pointerId;
            beginCustomColorHistoryTransaction();
            setCustomSliderFromPointer(slider.channel, point.x, true);
          } else if (pointInsideRect(point, CUSTOM_UI.useButton)) {
            hideRgbValueEditor(true);
            game.customFocusArea = "use";
            activateCustomColorSelection();
          } else if (pointInsideRect(point, CUSTOM_UI.backButton)) {
            hideRgbValueEditor(true);
            game.customFocusArea = "back";
            activateCustomColorSelection();
          } else if (pointInsideRect(point, CUSTOM_UI.undoButton)) {
            hideRgbValueEditor(true);
            game.customFocusArea = "undo";
            undoCustomColorChange(true);
          } else if (pointInsideRect(point, CUSTOM_UI.redoButton)) {
            hideRgbValueEditor(true);
            game.customFocusArea = "redo";
            redoCustomColorChange(true);
          }
        }
        return;
      }

      if (game.state === "stats") {
        const point = getCanvasPoint(event);
        if (pointInsideRect(point, getStatsPageButtonHitRect(STATS_UI.pagePrevButton))) {
          game.statsFocusArea = "pagePrev";
          setStatsPage(game.statsPage - 1);
        } else if (pointInsideRect(point, getStatsPageButtonHitRect(STATS_UI.pageNextButton))) {
          game.statsFocusArea = "pageNext";
          setStatsPage(game.statsPage + 1);
        } else if (pointInsideRect(point, STATS_UI.backButton)) {
          game.statsFocusArea = "back";
          closeStatsMenu();
        }
        return;
      }

      if (game.state === "achievements") {
        const point = getCanvasPoint(event);
        if (pointInsideRect(point, getAchievementPageButtonHitRect(ACHIEVEMENTS_UI.pagePrevButton))) {
          setAchievementPage(game.achievementPage - 1);
        } else if (pointInsideRect(point, getAchievementPageButtonHitRect(ACHIEVEMENTS_UI.pageNextButton))) {
          setAchievementPage(game.achievementPage + 1);
        } else if (pointInsideRect(point, ACHIEVEMENTS_UI.backButton)) {
          game.achievementFocusArea = "back";
          closeAchievementsMenu();
        }
        return;
      }

      if (game.state === "title") {
        const point = getCanvasPoint(event);
        const levelButton = HOME_UI.levelButtons.find((button) => pointInsideRect(point, button));
        if (levelButton) {
          ensureAudio();
          game.soloRandomLevelMode = false;
          game.hoveredLevelId = levelButton.id;
          game.homeFocusVisible = false;
          game.homeSelection = levelButton.id;
          if (selectLevel(levelButton.id)) startNewGameCountdown();
        } else if (pointInsideRect(point, HOME_UI.randomButton)) {
          ensureAudio();
          game.soloRandomLevelMode = true;
          game.homeSelection = "random";
          game.homeFocusVisible = true;
          ensureSoloRandomPreview();
          tone(535, 0.045, 0.010, 35);
          startNewGameCountdown();
        } else if (pointInsideRect(point, HOME_UI.backButton)) {
          game.homeSelection = "back";
          openMainMenu();
        } else if (pointInsideRect(point, HOME_UI.tutorialButton)) {
          ensureAudio();
          game.homeSelection = "tutorial";
          window.RibbitRaceTutorialEngine?.start?.("solo");
        } else if (pointInsideRect(point, HOME_UI.settingsButton)) {
          game.homeSelection = "settings";
          openSoloSettingsMenu();
        } else if (pointInsideRect(point, HOME_UI.timeButton)) {
          ensureAudio();
          game.homeSelection = "time";
          cycleTimeOfDayMode();
        }
        return;
      }

      if (game.state === "soloSettings") {
        const point = getCanvasPoint(event);
        if (pointInsideRect(point, SOLO_SETTINGS_UI.endlessRow)) {
          game.soloSettingsFocusIndex = 0; toggleSoloEndlessMode();
        } else if (pointInsideRect(point, SOLO_SETTINGS_UI.catchGoalRow)) {
          game.soloSettingsFocusIndex = 1; activateSoloSettingsSelection(point.x < SOLO_SETTINGS_UI.catchGoalRow.x + SOLO_SETTINGS_UI.catchGoalRow.w / 2 ? -1 : 1);
        } else if (pointInsideRect(point, SOLO_SETTINGS_UI.timeLimitRow)) {
          game.soloSettingsFocusIndex = 2; activateSoloSettingsSelection(point.x < SOLO_SETTINGS_UI.timeLimitRow.x + SOLO_SETTINGS_UI.timeLimitRow.w / 2 ? -1 : 1);
        } else if (pointInsideRect(point, SOLO_SETTINGS_UI.backButton)) {
          game.soloSettingsFocusIndex = 3; closeSoloSettingsMenu();
        }
        return;
      }

      const point = getCanvasPoint(event);
      if (game.mode === "solo" && pointInsideRect(point, HUD_UI.pauseButton)) {
        togglePauseFromHud();
        return;
      }

      if (game.state === "paused") {
        const pressed = game.pauseHelpOpen && pointInsideRect(point, PAUSE_UI.helpCloseButton) ? "help-close"
          : pointInsideRect(point, PAUSE_UI.helpButton) ? "help"
          : pointInsideRect(point, PAUSE_UI.continueButton) ? "continue"
          : pointInsideRect(point, PAUSE_UI.restartButton) ? "restart"
          : pointInsideRect(point, PAUSE_UI.homeButton) ? "home"
          : pointInsideRect(point, PAUSE_UI.muteButton) ? "mute"
          : null;
        if (pressed) {
          ensureAudio();
          game.pausePressedSelection = pressed;
          game.pausePointerId = event.pointerId;
          game.pauseFocusVisible = false;
          game.pauseHoveredSelection = pressed;
        } else if (game.pauseHelpOpen && pointInsideRect(point, PAUSE_UI.helpCloseButton)) {
          game.pauseHelpOpen = false;
          tone(305, 0.04, 0.010, -20);
        } else if (pointInsideRect(point, PAUSE_UI.helpButton)) {
          game.pauseHelpOpen = !game.pauseHelpOpen;
          tone(game.pauseHelpOpen ? 430 : 305, 0.04, 0.010, 20);
        } else if (pointInsideRect(point, PAUSE_UI.sliderHit)) {
          game.volumeDragging = true;
          game.volumePointerId = event.pointerId;
          setVolumeFromPointer(point.x);
        }
        return;
      }

      if (game.state === "won") {
        if (game.mode === "pvp") {
          const pvpRects = getPvpVictoryButtonRects();
          const pageRects = getPvpVictoryAchievementPageButtonRects();
          const pageCount = getPvpVictoryAchievementPageCount();
          if (pageCount > 1 && pointInsideRect(point, pageRects.prev)) {
            game.pvpVictoryAchievementPage = ((game.pvpVictoryAchievementPage || 0) - 1 + pageCount) % pageCount;
            game.pvpVictoryAchievementHoverId = null;
            tone(420, 0.045, 0.010, -25);
            return;
          }
          if (pageCount > 1 && pointInsideRect(point, pageRects.next)) {
            game.pvpVictoryAchievementPage = ((game.pvpVictoryAchievementPage || 0) + 1) % pageCount;
            game.pvpVictoryAchievementHoverId = null;
            tone(610, 0.045, 0.010, 35);
            return;
          }
          const pressed = pointInsideRect(point, pvpRects.replayButton) ? "replay"
            : pointInsideRect(point, pvpRects.selectButton) ? "select"
            : pointInsideRect(point, pvpRects.homeButton) ? "home"
            : null;
          if (pressed) {
            game.pvpVictoryMouseMode = true;
            game.pvpVictoryPressedSelection = pressed;
            game.pvpVictoryPointerId = event.pointerId;
          }
          return;
        }
        const unlockNotice = getVictoryUnlockNoticeLayout();
        const buttonRects = getVictoryButtonRects(unlockNotice);
        if (unlockNotice?.pageCount > 1 && pointInsideRect(point, unlockNotice.pagePrevButton)) {
          game.victoryNoticePage = Math.max(0, game.victoryNoticePage - 1);
          game.victoryAchievementHoverId = null;
      game.victoryNoticeHoverKey = null;
          tone(420, 0.045, 0.010, -25);
          return;
        }
        if (unlockNotice?.pageCount > 1 && pointInsideRect(point, unlockNotice.pageNextButton)) {
          game.victoryNoticePage = Math.min(unlockNotice.pageCount - 1, game.victoryNoticePage + 1);
          game.victoryAchievementHoverId = null;
      game.victoryNoticeHoverKey = null;
          tone(610, 0.045, 0.010, 35);
          return;
        }
        const unlockAction = unlockNotice?.actions?.find((action) => pointInsideRect(point, action));
        if (unlockAction) {
          activateVictoryUnlockAction(unlockAction);
        } else {
          const pressed = pointInsideRect(point, buttonRects.replayButton) ? "replay"
            : pointInsideRect(point, buttonRects.homeButton) ? "home"
            : null;
          if (pressed) {
            game.victoryMouseMode = true;
            game.victoryPressedSelection = pressed;
            game.victoryPointerId = event.pointerId;
          }
        }
        return;
      }

      if (game.mode === "pvp") return;
      pressMainButton();
    });

    canvas.addEventListener("pointermove", (event) => {
      const point = getCanvasPoint(event);

      if((game.state==="custom"||game.state==="setup")&&game.customHatOpen){
        const point=getCanvasPoint(event);
        const option=getCustomHatOptionRects().find((item)=>pointInsideRect(point,item));
        const pageButtons=getCustomHatPageButtons();
        const nextHatHover=option?option.index:null;
        const nextHatId=option?option.id:null;
        if(nextHatHover!==game.customHatSuppressedRequirementIndex)game.customHatSuppressedRequirementIndex=null;
        if(nextHatId&&nextHatId!==game.customHatDismissedRequirementId)game.customHatDismissedRequirementId=null;
        game.customHatHoveredIndex=nextHatHover;
        game.customHatRemoveAllHovered=pointInsideRect(point,pageButtons.removeAll);
        game.customHatPageHovered=pointInsideRect(point,pageButtons.search)?"search":pointInsideRect(point,game.customHatSearchInputRect||{x:0,y:0,w:0,h:0})?"searchInput":pointInsideRect(point,pageButtons.prev)?"prev":pointInsideRect(point,pageButtons.next)?"next":null;
        return;
      }
      if (game.state === "custom") {
        const hoveredSlot = CUSTOM_UI.slotButtons.find((item) => pointInsideRect(point, item));
        game.customHoveredSlotIndex = hoveredSlot ? hoveredSlot.index : null;
      }

      if (
        game.state === "custom" &&
        game.customDraggingChannel &&
        event.pointerId === game.customPointerId
      ) {
        event.preventDefault();
        setCustomSliderFromPointer(game.customDraggingChannel, point.x, false);
        return;
      }

      if (game.state === "frogSandbox") {
        game.sandboxBackHovered = pointInsideRect(point, FROG_SANDBOX_UI.backButton) || pointInsideRect(point, FROG_SANDBOX_UI.exitButton);
        game.sandboxExitHovered = pointInsideRect(point, FROG_SANDBOX_UI.exitButton);
        return;
      }

      if (game.state === "main") {
        const entries = [
          ["solo", MAIN_UI.soloButton], ["frog", MAIN_UI.frogButton], ["pvp", MAIN_UI.pvpButton],
          ["achievements", MAIN_UI.achievementsButton], ["stats", MAIN_UI.statsButton]
        ];
        const hit = entries.find(([, rect]) => pointInsideRect(point, rect));
        game.mainHoveredSelection = hit ? hit[0] : null;
        if(game.mainHoveredSelection!==game.mainHoveredSoundKey){game.mainHoveredSoundKey=game.mainHoveredSelection||"";if(game.mainHoveredSelection){ensureAudio();tone(game.mainHoveredSelection==="pvp"?480:530,0.03,0.008,25);}}
        game.mainFocusVisible = false;
        game.achievementButtonHovered = game.mainHoveredSelection === "achievements";
        game.statsButtonHovered = game.mainHoveredSelection === "stats";
        game.customizeButtonHovered = game.mainHoveredSelection === "frog";
        game.pvpButtonHovered = game.mainHoveredSelection === "pvp";
        return;
      }

      if (game.state === "paused") {
        if (game.volumeDragging && event.pointerId === game.volumePointerId) {
          event.preventDefault();
          setVolumeFromPointer(point.x);
          return;
        }
        game.pauseFocusVisible = false;
        game.pauseHoveredSelection = game.pauseHelpOpen && pointInsideRect(point, PAUSE_UI.helpCloseButton) ? "help-close"
          : pointInsideRect(point, PAUSE_UI.helpButton) ? "help"
          : pointInsideRect(point, PAUSE_UI.continueButton) ? "continue"
          : pointInsideRect(point, PAUSE_UI.restartButton) ? "restart"
          : pointInsideRect(point, PAUSE_UI.homeButton) ? "home"
          : pointInsideRect(point, PAUSE_UI.muteButton) ? "mute"
          : null;
        return;
      }

      if (game.state === "pvpSettings") {
        const rowIndex=PVP_SETTINGS_UI.rows.findIndex((rect)=>pointInsideRect(point,rect));
        if(rowIndex>=0)game.pvpSettingsFocusIndex=rowIndex;else if(pointInsideRect(point,PVP_SETTINGS_UI.backButton))game.pvpSettingsFocusIndex=4;
        return;
      }
      if (game.state === "pvpSetup") {
        game.pvpSetupMouseMode=true;
        const levelIndex=PVP_SETUP_UI.levelButtons.findIndex((rect)=>pointInsideRect(point,rect));
        game.pvpTimeButtonHovered=pointInsideRect(point,PVP_SETUP_UI.timeButton);
        game.pvpSettingsButtonHovered=pointInsideRect(point,PVP_SETUP_UI.settingsButton);
        game.pvpWifiButtonHovered=pointInsideRect(point,PVP_SETUP_UI.wifiButton);
        game.pvpTutorialButtonHovered=pointInsideRect(point,PVP_SETUP_UI.tutorialButton);
        let hoverKey="";
        if(levelIndex>=0){game.pvpSetupFocusArea="level";game.pvpSetupLevelIndex=levelIndex;hoverKey=`level:${levelIndex}`;}
        else if(pointInsideRect(point,PVP_SETUP_UI.vsButton)){game.pvpSetupFocusArea="vs";hoverKey="vs";}
        else if(game.pvpCpuEnabled&&pointInsideCpuDifficultyBox(point)){game.pvpSetupFocusArea="cpuDifficulty";hoverKey="cpuDifficulty";}
        else if(pointInsideRect(point,PVP_SETUP_UI.p1Selector)){game.pvpSetupFocusArea="skin";game.pvpSetupPlayerIndex=0;hoverKey="p1";}
        else if(pointInsideRect(point,PVP_SETUP_UI.p2Selector)){game.pvpSetupFocusArea="skin";game.pvpSetupPlayerIndex=1;hoverKey="p2";}
        else if(pointInsideRect(point,PVP_SETUP_UI.wifiButton)){game.pvpSetupFocusArea="bottom";game.pvpSetupBottomSelection="wifi";hoverKey="wifi";}
        else if(pointInsideRect(point,PVP_SETUP_UI.tutorialButton)){game.pvpSetupFocusArea="bottom";game.pvpSetupBottomSelection="tutorial";hoverKey="tutorial";}
        else if(pointInsideRect(point,PVP_SETUP_UI.startButton)){game.pvpSetupFocusArea="bottom";game.pvpSetupBottomSelection="start";hoverKey="start";}
        else if(pointInsideRect(point,PVP_SETUP_UI.backButton)){game.pvpSetupFocusArea="bottom";game.pvpSetupBottomSelection="back";hoverKey="back";}
        else if(pointInsideRect(point,PVP_SETUP_UI.settingsButton)){game.pvpSetupFocusArea="bottom";game.pvpSetupBottomSelection="settings";hoverKey="settings";}
        else if(pointInsideRect(point,PVP_SETUP_UI.timeButton)){game.pvpSetupFocusArea="bottom";game.pvpSetupBottomSelection="time";hoverKey="time";}
        if(hoverKey!==game.pvpSetupHoveredKey){game.pvpSetupHoveredKey=hoverKey;if(hoverKey){ensureAudio();tone(hoverKey==="back"?340:500,0.03,0.008,hoverKey==="back"?-25:25);}}
        return;
      }

      if (game.state === "setup") {
        const skinButton = SETUP_UI.skinButtons.find((button) => pointInsideRect(point, button));
        if (skinButton) {
          focusSetupSkin(skinButton.id, false);
        } else if (pointInsideRect(point, SETUP_UI.sandboxButton)) {
          focusSetupSkin("sandbox", false);
        } else if (pointInsideRect(point, SETUP_UI.hatButton)) {
          focusSetupSkin("hat", false);
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
        game.homeTutorialButtonHovered = pointInsideRect(point, HOME_UI.tutorialButton);
        game.homeSettingsButtonHovered = pointInsideRect(point, HOME_UI.settingsButton);
        game.timeButtonHovered = pointInsideRect(point, HOME_UI.timeButton);
        const backHovered = pointInsideRect(point, HOME_UI.backButton);
        game.homeHoverSelection = backHovered ? "back" : null;
        const hoverKey = hoveredButton?.id || (game.randomButtonHovered ? "random" : game.homeTutorialButtonHovered ? "tutorial" : game.homeSettingsButtonHovered ? "settings" : game.timeButtonHovered ? "time" : backHovered ? "back" : "");
        if (hoverKey !== (game.titleHoveredKey || "")) {
          game.titleHoveredKey = hoverKey;
          if (hoverKey) {
            ensureAudio();
            tone(505, 0.03, 0.008, 30);
          }
        }
        if (hoveredButton || game.randomButtonHovered || game.homeTutorialButtonHovered || game.homeSettingsButtonHovered || game.timeButtonHovered || backHovered) {
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
