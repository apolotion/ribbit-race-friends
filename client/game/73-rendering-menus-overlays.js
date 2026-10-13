// Ribbit Race rendering responsibility: 73 rendering menus overlays
    function drawHomeLevelButton(button) {
      const unlocked = isLevelUnlocked(button.id);
      const selected = unlocked && !game.soloRandomLevelMode && game.selectedLevelId === button.id;
      const keyboardFocused = game.homeFocusVisible && game.homeSelection === button.id;
      const hovered = (game.hoveredLevelId === button.id || keyboardFocused) && !selected;
      const level = LEVELS[button.id];
      const palette = LEVEL_MENU_COLORS[button.id] || LEVEL_MENU_COLORS.park;

      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      ctx.fillStyle = selected || hovered ? COLORS.ink : "#8fa6ac";
      ctx.fillRect(button.x, button.y, button.w, button.h);

      if (!unlocked) {
        ctx.fillStyle = hovered ? "#b8c1c4" : "#d2dadd";
        ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
        ctx.fillStyle = hovered ? "#dfe6e8" : "#f0f4f5";
        ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, 4);
      } else if (selected) {
        ctx.fillStyle = palette.dark;
        ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
        ctx.fillStyle = palette.mid;
        ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, button.h - 8);
        ctx.fillStyle = palette.light;
        ctx.fillRect(button.x + 6, button.y + 5, button.w - 12, 3);
        if (keyboardFocused || game.hoveredLevelId === button.id) {
          ctx.fillStyle = COLORS.white;
          ctx.fillRect(button.x + 3, button.y + 3, 2, 2);
          ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2);
          ctx.fillRect(button.x + 3, button.y + button.h - 5, 2, 2);
          ctx.fillRect(button.x + button.w - 5, button.y + button.h - 5, 2, 2);
        }
      } else if (hovered) {
        ctx.fillStyle = "#f7fdff";
        ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
        ctx.fillStyle = palette.light;
        ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, 4);
        ctx.fillStyle = palette.mid;
        ctx.fillRect(button.x + 2, button.y + button.h - 3, button.w - 4, 1);
      } else {
        ctx.fillStyle = "#f7fdff";
        ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, 4);
      }

      const levelIconPalette = unlocked
        ? palette
        : { dark: "#667277", mid: "#a6b1b5", light: "#e1e7e9" };
      drawLevelUnlockIcon(button.id, button.x + 8, button.y + 3, levelIconPalette, 0.70);

      drawBitmapText(
        level.name,
        button.x + 61 - (unlocked ? 0 : 2),
        button.y + 8,
        1,
        "center",
        selected ? COLORS.white : unlocked ? "#34484f" : "#667277",
        selected ? palette.dark : null
      );

      if (!unlocked) drawMiniLockIcon(button.x + button.w - 13, button.y + 5, 0.65);
    }

    function drawMiniSun(centerX, centerY, evening = false) {
      const glow = evening ? "#ff9b55" : "#ffd84d";
      const core = evening ? "#ffcc72" : "#fff2a0";
      ctx.fillStyle = glow;
      ctx.fillRect(centerX - 1, centerY - 8, 3, 3);
      ctx.fillRect(centerX - 1, centerY + 6, 3, 3);
      ctx.fillRect(centerX - 8, centerY - 1, 3, 3);
      ctx.fillRect(centerX + 6, centerY - 1, 3, 3);
      ctx.fillRect(centerX - 6, centerY - 6, 2, 2);
      ctx.fillRect(centerX + 5, centerY - 6, 2, 2);
      ctx.fillRect(centerX - 6, centerY + 5, 2, 2);
      ctx.fillRect(centerX + 5, centerY + 5, 2, 2);
      ctx.fillStyle = glow;
      ctx.fillRect(centerX - 5, centerY - 5, 11, 11);
      ctx.fillRect(centerX - 7, centerY - 3, 15, 7);
      ctx.fillStyle = core;
      ctx.fillRect(centerX - 3, centerY - 4, 7, 8);
      ctx.fillRect(centerX - 4, centerY - 3, 9, 6);
      // Evening uses a darker orange palette without a horizon stripe.
    }

    function drawMiniMoon(centerX, centerY) {
      ctx.fillStyle = "#d5d9a2";
      ctx.fillRect(centerX - 5, centerY - 6, 10, 13);
      ctx.fillRect(centerX - 7, centerY - 4, 14, 9);
      ctx.fillStyle = "#fff6bd";
      ctx.fillRect(centerX - 4, centerY - 5, 8, 11);
      ctx.fillRect(centerX - 6, centerY - 3, 12, 7);
      ctx.fillStyle = "#35506b";
      ctx.fillRect(centerX + 1, centerY - 5, 6, 10);
      ctx.fillRect(centerX + 3, centerY - 3, 5, 6);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(centerX - 10, centerY - 6, 2, 2);
      ctx.fillRect(centerX + 9, centerY + 4, 2, 2);
    }

    function drawMiniClockIcon(centerX, centerY, palette = getSelectedSkin()) {
      const dark = palette.dark || COLORS.ink;
      const mid = palette.mid || "#7daab6";
      const light = palette.light || "#dff8ff";
      ctx.fillStyle = dark;
      ctx.fillRect(centerX - 7, centerY - 5, 14, 11);
      ctx.fillRect(centerX - 5, centerY - 7, 10, 15);
      ctx.fillStyle = light;
      ctx.fillRect(centerX - 5, centerY - 4, 10, 9);
      ctx.fillRect(centerX - 3, centerY - 5, 6, 11);
      ctx.fillStyle = mid;
      ctx.fillRect(centerX - 1, centerY - 3, 2, 5);
      ctx.fillRect(centerX, centerY + 1, 4, 2);
      ctx.fillStyle = dark;
      ctx.fillRect(centerX - 1, centerY, 2, 2);
    }

    function drawHomeTimeControls() {
      const button = HOME_UI.timeButton;
      const unlocked = isTimeSelectUnlocked();
      const mode = unlocked ? (game.timeOfDayLock || "random") : "locked";
      const active = unlocked && mode !== "random";
      const focused = game.homeFocusVisible && game.homeSelection === "time";
      const hovered = game.timeButtonHovered;
      const highlighted = focused || hovered;

      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      ctx.fillStyle = highlighted ? getSelectedSkin().dark : COLORS.ink;
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = unlocked
        ? (highlighted ? mixHexColors(getSelectedSkin().belly, "#ffffff", 0.18) : active ? "#e7fbff" : "#f7fdff")
        : (highlighted ? "#e4eaec" : "#d6dde0");
      ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
      if (focused) {
        ctx.fillStyle = getSelectedSkin().dark;
        ctx.fillRect(button.x + 3, button.y + 3, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2);
        ctx.fillRect(button.x + 3, button.y + button.h - 5, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + button.h - 5, 2, 2);
      }

      const iconX = button.x + button.w / 2;
      const iconY = button.y + button.h / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
      ctx.clip();
      if (!unlocked) {
        drawMiniLockIcon(iconX, button.y + 5, 0.86);
      } else if (mode === "afternoon") {
        drawMiniSun(iconX, iconY, false);
      } else if (mode === "morning") {
        drawMiniSun(iconX, iconY, true);
      } else if (mode === "night") {
        drawMiniMoon(iconX, iconY);
      } else {
        drawMiniClockIcon(iconX, iconY, getSelectedSkin());
      }
      ctx.restore();

    }

    function drawLockedTimeSelectTooltip() {
      const remaining = Math.max(0, CONFIG.timeSelectFlyTarget - game.totalFliesEaten);
      const noun = remaining === 1 ? "FLY" : "FLIES";
      const lineOne = `CATCH ${remaining} MORE ${noun}`;
      const lineTwo = "TO UNLOCK!";
      const anchorX = HOME_UI.timeButton.x + HOME_UI.timeButton.w / 2;
      const width = 126;
      const height = 31;
      const left = Math.round(clamp(anchorX - width / 2, 8, W - width));
      const boxCenterX = left + width / 2;
      const top = HOME_UI.timeButton.y - height - 10;

      ctx.fillStyle = "rgba(25,43,52,0.34)";
      ctx.fillRect(left + 3, top + 3, width, height);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(left + 2, top, width - 4, height);
      ctx.fillRect(left, top + 2, width, height - 4);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(left + 4, top + 2, width - 8, height - 4);
      ctx.fillStyle = mixHexColors(getSelectedSkin().belly, "#ffffff", 0.40);
      ctx.fillRect(left + 7, top + 5, width - 14, 3);

      // The card and pointer stay centered directly over the time-selector lock.
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(Math.round(anchorX - 4), top + height, 8, 5);
      ctx.fillRect(Math.round(anchorX - 2), top + height + 5, 4, 4);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(Math.round(anchorX - 2), top + height, 4, 5);

      drawBitmapText(lineOne, boxCenterX, top + 10, 0.85, "center", "#48555a");
      drawBitmapText(lineTwo, boxCenterX, top + 21, 1, "center", getSelectedSkin().dark);
    }

    function getLevelTooltipLayout(levelId, width, height) {
      const button = HOME_UI.levelButtons.find((item) => item.id === levelId);
      if (!button) return null;
      const anchorX = button.x + button.w / 2;
      // Top-row cards point downward into a bubble below; bottom-row cards point
      // upward into a bubble above. In both cases the card is centered on the option.
      const below = button.y < 120;
      const top = below ? button.y + button.h + 7 : button.y - height - 7;
      const left = Math.round(clamp(anchorX - width / 2, 8, W - width - 8));
      return { button, anchorX, left, top, width, height, below };
    }

    function drawLevelTooltipFrame(layout, palette) {
      const { anchorX, left, top, width, height, below } = layout;
      ctx.fillStyle = "rgba(25,43,52,0.34)";
      ctx.fillRect(left + 3, top + 3, width, height);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(left + 2, top, width - 4, height);
      ctx.fillRect(left, top + 2, width, height - 4);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(left + 4, top + 2, width - 8, height - 4);
      ctx.fillStyle = palette.light;
      ctx.fillRect(left + 7, top + 5, width - 14, 3);

      ctx.fillStyle = COLORS.ink;
      if (below) {
        ctx.fillRect(Math.round(anchorX - 4), top - 6, 8, 6);
        ctx.fillRect(Math.round(anchorX - 2), top - 9, 4, 3);
        ctx.fillStyle = "#f7fdff";
        ctx.fillRect(Math.round(anchorX - 2), top - 5, 4, 5);
      } else {
        const pointerY = top + height;
        ctx.fillRect(Math.round(anchorX - 4), pointerY, 8, 6);
        ctx.fillRect(Math.round(anchorX - 2), pointerY + 6, 4, 3);
        ctx.fillStyle = "#f7fdff";
        ctx.fillRect(Math.round(anchorX - 2), pointerY, 4, 5);
      }
    }

    function drawLockedLevelTooltip(levelId) {
      const index = LEVEL_ORDER.indexOf(levelId);
      if (index <= 0) return;
      const previous = LEVELS[LEVEL_ORDER[index - 1]];
      if (!previous) return;
      const lineOne = `BEAT ${previous.name} IN 30 SECONDS`;
      const lineTwo = "OR LESS TO UNLOCK!";
      const width = Math.max(174, Math.max(measureBitmapText(lineOne), measureBitmapText(lineTwo)) + 22);
      const height = 34;
      const layout = getLevelTooltipLayout(levelId, width, height);
      if (!layout) return;
      const palette = LEVEL_MENU_COLORS[levelId] || LEVEL_MENU_COLORS.park;
      drawLevelTooltipFrame(layout, palette);
      const centerX = layout.left + layout.width / 2;
      drawBitmapText(lineOne, centerX, layout.top + 10, 1, "center", "#48555a");
      drawBitmapText(lineTwo, centerX, layout.top + 21, 1, "center", palette.dark);
    }


    function drawMiniFlyIcon(centerX, centerY, scale = 1) {
      const s = scale;
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(Math.round(centerX - 6 * s), Math.round(centerY - 2 * s), Math.max(1, Math.round(4 * s)), Math.max(1, Math.round(3 * s)));
      ctx.fillRect(Math.round(centerX + 3 * s), Math.round(centerY - 2 * s), Math.max(1, Math.round(4 * s)), Math.max(1, Math.round(3 * s)));
      ctx.fillStyle = COLORS.flyBlack;
      ctx.fillRect(Math.round(centerX - 3 * s), Math.round(centerY - 4 * s), Math.max(1, Math.round(6 * s)), Math.max(1, Math.round(9 * s)));
      ctx.fillStyle = COLORS.flyYellow;
      ctx.fillRect(Math.round(centerX - 2 * s), Math.round(centerY - 4 * s), Math.max(1, Math.round(4 * s)), Math.max(1, Math.round(2 * s)));
      ctx.fillStyle = COLORS.flyBlue;
      ctx.fillRect(Math.round(centerX - 2 * s), Math.round(centerY), Math.max(1, Math.round(4 * s)), Math.max(1, Math.round(3 * s)));
    }

    function drawMiniStopwatchIcon(centerX, centerY, palette = getSelectedSkin(), scale = 1, monochrome = false) {
      const dark = monochrome ? "#465158" : (palette.dark || COLORS.ink);
      const mid = monochrome ? "#7f8a90" : (palette.mid || "#7daab6");
      const light = monochrome ? "#d8dfe2" : (palette.light || "#dff8ff");
      const rect = (dx, dy, w, h, color = dark) => {
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(centerX + dx * scale),
          Math.round(centerY + dy * scale),
          Math.max(1, Math.round(w * scale)),
          Math.max(1, Math.round(h * scale))
        );
      };
      rect(-2, -9, 4, 2);
      rect(3, -7, 3, 2);
      rect(-7, -6, 14, 13);
      rect(-5, -4, 10, 9, light);
      rect(-3, -2, 6, 5, mid);
      rect(-1, -3, 2, 5, dark);
      rect(0, 1, 4, 2, dark);
      rect(-4, 6, 8, 2, dark);
    }

    function drawTrampolineIcon(centerX, centerY, palette = getSelectedSkin(), scale = 1, monochrome = false) {
      const dark = monochrome ? "#465158" : (palette.dark || COLORS.ink);
      const mid = monochrome ? "#7f8a90" : (palette.mid || "#7daab6");
      const light = monochrome ? "#d8dfe2" : (palette.light || "#dff8ff");
      const rect = (dx, dy, w, h, color = dark) => {
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(centerX + dx * scale),
          Math.round(centerY + dy * scale),
          Math.max(1, Math.round(w * scale)),
          Math.max(1, Math.round(h * scale))
        );
      };
      // Rounded-looking pixel frame and springy mat.
      rect(-10, -3, 20, 3, dark);
      rect(-8, -4, 16, 2, light);
      rect(-7, -2, 14, 2, mid);
      rect(-9, 0, 3, 7, dark);
      rect(6, 0, 3, 7, dark);
      rect(-8, 6, 5, 2, dark);
      rect(3, 6, 5, 2, dark);
      rect(-6, 0, 2, 4, mid);
      rect(4, 0, 2, 4, mid);
    }

    function drawAchievementIcon(type, x, y, unlocked = true, scale = 1, paletteOverride = null) {
      const s = scale;
      const skin = paletteOverride || getSelectedSkin();
      const main = unlocked ? skin.mid : "#858f93";
      const light = unlocked ? skin.light : "#b8c1c4";
      const dark = unlocked ? skin.dark : "#596368";
      const wing = unlocked ? mixHexColors(skin.light, "#ffffff", 0.58) : "#d9dfe1";
      const belly = unlocked ? skin.belly : "#969fa3";
      const rect = (dx, dy, w, h, color = dark) => {
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(x + dx * s),
          Math.round(y + dy * s),
          Math.max(1, Math.round(w * s)),
          Math.max(1, Math.round(h * s))
        );
      };

      const drawThemedFly = (cx, cy, flyScale = 1) => {
        const k = flyScale;
        // Wings.
        rect(cx - 5 * k, cy - 3 * k, 4 * k, 3 * k, wing);
        rect(cx + 2 * k, cy - 3 * k, 4 * k, 3 * k, wing);
        rect(cx - 6 * k, cy - 1 * k, 4 * k, 2 * k, light);
        rect(cx + 3 * k, cy - 1 * k, 4 * k, 2 * k, light);
        // Body and themed bands.
        rect(cx - 3 * k, cy - 4 * k, 6 * k, 9 * k, dark);
        rect(cx - 2 * k, cy + 5 * k, 4 * k, 2 * k, dark);
        rect(cx - 2 * k, cy - 4 * k, 4 * k, 2 * k, belly);
        rect(cx - 2 * k, cy, 4 * k, 3 * k, main);
      };

      if (type === "stopwatch") {
        drawMiniStopwatchIcon(
          x + 8 * s,
          y + 8 * s,
          { dark, mid: main, light },
          0.72 * s,
          !unlocked
        );
      } else if (type === "clock") {
        rect(3,0,6,2); rect(0,3,12,10); rect(2,5,8,6,light); rect(6,6,1,4,dark); rect(6,9,3,1,dark);
      } else if (type === "double-fly") {
        drawThemedFly(5, 6, 0.90);
        drawThemedFly(13, 11, 0.90);
      } else if (type === "spark-fly") {
        drawThemedFly(9, 9, 1.10);
        rect(0,1,4,1,light); rect(1,0,1,4,light);
        rect(15,12,4,1,light); rect(16,11,1,4,light);
      } else if (type === "footprints") {
        rect(1,6,5,7); rect(10,1,5,7); rect(2,4,1,2,light); rect(4,4,1,2,light); rect(11,0,1,2,light); rect(13,0,1,2,light);
      } else if (type === "jump-100" || type === "leap-100" || type === "trampoline-100") {
        drawTrampolineIcon(
          x + 9 * s,
          y + 8 * s,
          { dark, mid: main, light },
          0.72 * s,
          !unlocked
        );
        drawBitmapText("100", x + 9*s, y + 13*s, 0.42*s, "center", dark);
      } else if (type === "lightning-clock" || type === "speed-run") {
        rect(1,1,8,8,dark); rect(3,3,4,4,light); rect(5,4,1,3,dark);
        rect(11,1,5,7,main); rect(9,7,5,3,main); rect(12,9,3,6,main);
      } else if (type === "sky-fly") {
        rect(7,1,2,10); rect(4,3,8,2); drawThemedFly(14, 11, 0.92);
      } else if (type === "flies-100") {
        drawThemedFly(5, 5, 0.82);
        drawThemedFly(13, 10, 0.82);
        drawBitmapText("100", x + 8*s, y + 13*s, 0.42*s, "center", dark);
      } else if (type === "score-six" || type === "score-seven") {
        drawThemedFly(5, 7, 0.82);
        drawBitmapText(type === "score-six" ? "6/5" : "7/5", x + 12*s, y + 11*s, 0.52*s, "center", dark);
      } else if (type === "sky-bonk") {
        // A frog dropping from above the stage into an impact burst.
        rect(5, 0, 10, 5, dark); rect(7, 1, 6, 3, main);
        rect(9, 5, 2, 5, light); rect(6, 8, 8, 2, light);
        rect(3, 12, 14, 5, dark); rect(5, 13, 10, 3, main);
        rect(0, 11, 4, 1, light); rect(1, 9, 1, 4, light);
        rect(16, 10, 4, 1, light); rect(18, 8, 1, 4, light);
      } else if (type === "bonk-max") {
        // Upside-down frog with impact stars.
        rect(3, 5, 13, 7, dark); rect(5, 6, 9, 4, main); rect(2, 3, 5, 3, light); rect(12, 3, 5, 3, light);
        rect(5, 11, 4, 3, dark); rect(11, 11, 4, 3, dark);
        rect(0, 1, 4, 1, light); rect(1, 0, 1, 4, light);
        rect(16, 0, 4, 1, light); rect(18, -1, 1, 4, light);
      } else if (type === "footstool") {
        // Two frogs stacked with a small upward bounce mark.
        rect(2, 10, 14, 5, dark); rect(4, 11, 10, 3, main);
        rect(5, 4, 11, 5, dark); rect(7, 5, 7, 3, light);
        rect(9, 0, 2, 4, light); rect(6, 1, 8, 1, light);
      } else if (type === "bounce-fly") {
        drawTrampolineIcon(x + 7*s, y + 10*s, { dark, mid: main, light }, 0.55*s, !unlocked);
        drawThemedFly(15, 5, 0.78);
      } else if (type === "pvp-shutout") {
        rect(0, 1, 5, 4, main); rect(1, 5, 3, 2, dark);
        drawBitmapText("5-0", x + 11*s, y + 7*s, 0.60*s, "center", dark);
      } else if (type === "palette") {
        rect(1,3,15,10); rect(3,5,11,6,light);
        rect(4,6,2,2,unlocked ? "#d85a72" : main);
        rect(8,6,2,2,unlocked ? "#5e9bd5" : main);
        rect(6,9,2,2,unlocked ? "#72b95e" : main);
      } else if (type === "park") {
        rect(7,4,2,10); rect(2,2,12,7,main); rect(4,1,8,4,light);
      } else if (type === "swamp") {
        rect(2,4,2,10); rect(8,2,2,12); rect(14,6,2,8); rect(1,2,4,4,main); rect(7,0,4,4,main); rect(13,4,4,4,main);
      } else if (type === "jungle") {
        rect(1,1,2,13); rect(14,0,2,14); rect(3,3,11,2,main); rect(5,7,9,2,main); rect(3,11,7,2,main);
      } else if (type === "pond") {
        rect(1,10,15,3); rect(3,5,11,6,main); rect(5,4,7,3,light);
      } else if (type === "lake") {
        rect(1,11,15,2); rect(4,7,10,4,main); rect(8,2,1,6,light); rect(9,3,5,3,light);
      }
    }

    function drawLevelUnlockIcon(levelId, x, y, palette, scale = 1) {
      const s = scale;
      const dark = palette.dark || "#354147";
      const mid = palette.mid || "#7d8a90";
      const light = palette.light || "#dfe7e9";
      const rect = (dx, dy, w, h, color = dark) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)));
      };

      if (levelId === "park") {
        rect(7, 4, 3, 13, "#7b5739");
        rect(2, 1, 13, 8, mid); rect(4, 0, 9, 5, light);
        rect(0, 16, 18, 2, dark);
      } else if (levelId === "swamp") {
        rect(2, 5, 2, 13, dark); rect(8, 2, 2, 16, dark); rect(14, 7, 2, 11, dark);
        rect(1, 2, 4, 5, mid); rect(7, 0, 4, 5, light); rect(13, 4, 4, 5, mid);
        rect(0, 17, 18, 2, dark);
      } else if (levelId === "jungle") {
        rect(2, 0, 3, 18, dark); rect(13, 0, 3, 18, dark);
        rect(5, 3, 9, 3, mid); rect(4, 8, 10, 3, light); rect(5, 13, 8, 3, mid);
      } else if (levelId === "pond") {
        rect(1, 13, 17, 3, dark); rect(3, 7, 13, 7, mid); rect(5, 5, 9, 4, light);
        rect(13, 2, 2, 5, dark); rect(12, 1, 4, 2, light);
      } else if (levelId === "lake") {
        rect(1, 14, 17, 2, dark); rect(4, 10, 11, 4, mid);
        rect(9, 2, 2, 9, dark); rect(11, 4, 6, 3, light); rect(11, 7, 4, 2, light);
      } else {
        rect(8, 7, 2, 11, dark); rect(3, 4, 12, 8, mid);
        rect(6, 1, 6, 6, light); rect(1, 7, 5, 4, light); rect(12, 7, 5, 4, light);
        rect(5, 13, 10, 3, dark);
      }
    }

    function drawHomeStatsButton() {
      const button = HOME_UI.statsButton;
      const focused = game.homeFocusVisible && game.homeSelection === "stats";
      const hovered = game.statsButtonHovered;
      const active = focused || hovered;
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      ctx.fillStyle = active ? getSelectedSkin().dark : COLORS.ink;
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = active
        ? mixHexColors(getSelectedSkin().belly, "#ffffff", 0.18)
        : "#f7fdff";
      ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);

      // Compact bar-chart icon, centered inside the square button.
      const baseX = Math.round(button.x + (button.w - 14) / 2);
      const baseY = Math.round(button.y + (button.h + 14) / 2);
      ctx.fillStyle = getSelectedSkin().dark;
      ctx.fillRect(baseX, baseY, 13, 2);
      ctx.fillRect(baseX + 1, baseY - 6, 3, 6);
      ctx.fillRect(baseX + 6, baseY - 10, 3, 10);
      ctx.fillRect(baseX + 11, baseY - 14, 3, 14);
      ctx.fillStyle = getSelectedSkin().light;
      ctx.fillRect(baseX + 2, baseY - 5, 1, 4);
      ctx.fillRect(baseX + 7, baseY - 9, 1, 8);
      ctx.fillRect(baseX + 12, baseY - 13, 1, 12);

      if (focused) {
        ctx.fillStyle = getSelectedSkin().dark;
        ctx.fillRect(button.x + 3, button.y + 3, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2);
        ctx.fillRect(button.x + 3, button.y + button.h - 5, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + button.h - 5, 2, 2);
      }
    }


    function drawHomeSettingsButton() {
      const button = HOME_UI.settingsButton;
      const focused = game.homeFocusVisible && game.homeSelection === "settings";
      const hovered = game.homeSettingsButtonHovered;
      const active = focused || hovered;
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      ctx.fillStyle = active ? getSelectedSkin().dark : COLORS.ink;
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = active
        ? mixHexColors(getSelectedSkin().belly, "#ffffff", 0.18)
        : "#f7fdff";
      ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
      drawMiniGearIcon(button.x + button.w / 2, button.y + button.h / 2, active ? getSelectedSkin().mid : "#48555a");
      if (focused) {
        ctx.fillStyle = getSelectedSkin().dark;
        ctx.fillRect(button.x + 3, button.y + 3, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2);
        ctx.fillRect(button.x + 3, button.y + button.h - 5, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + button.h - 5, 2, 2);
      }
    }


    function drawMiniTutorialBookIcon(cx, cy, color = "#48555a") {
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(cx - 7, cy - 6, 14, 12);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(cx - 5, cy - 4, 10, 8);
      ctx.fillStyle = color;
      ctx.fillRect(cx - 1, cy - 4, 2, 8);
      ctx.fillRect(cx - 4, cy - 2, 3, 1);
      ctx.fillRect(cx - 4, cy, 3, 1);
      ctx.fillRect(cx + 1, cy - 2, 3, 1);
      ctx.fillRect(cx + 1, cy, 3, 1);
      ctx.fillRect(cx - 5, cy + 4, 10, 1);
    }

    function drawHomeTutorialButton() {
      const button = HOME_UI.tutorialButton;
      const focused = game.homeFocusVisible && game.homeSelection === "tutorial";
      const hovered = game.homeTutorialButtonHovered;
      const active = focused || hovered;
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      ctx.fillStyle = active ? getSelectedSkin().dark : COLORS.ink;
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = active
        ? mixHexColors(getSelectedSkin().belly, "#ffffff", 0.18)
        : "#f7fdff";
      ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
      drawMiniTutorialBookIcon(button.x + button.w / 2, button.y + button.h / 2, active ? getSelectedSkin().mid : "#48555a");
      if (focused) {
        ctx.fillStyle = getSelectedSkin().dark;
        ctx.fillRect(button.x + 3, button.y + 3, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2);
        ctx.fillRect(button.x + 3, button.y + button.h - 5, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + button.h - 5, 2, 2);
      }
    }

    function drawSoloSettingsScreen() {
      const skin = getSelectedSkin();
      const previewLevelId = getHomePreviewLevelId();
      const previewLevel = LEVELS[previewLevelId] || LEVELS.park;
      const chrome = TIME_OF_DAY_CHROME[game.timeOfDay] || TIME_OF_DAY_CHROME.afternoon;
      ctx.fillStyle = chrome.outer;
      ctx.fillRect(0, 0, W, H);
      drawBackground(previewLevelId);
      for (const platform of previewLevel.platforms) drawPlatform(platform, previewLevelId);
      drawTimeOfDayWorldTint(previewLevelId);
      ctx.fillStyle = "rgba(18,33,41,0.18)";
      ctx.fillRect(0, 0, W, H);

      const panel = { x: 54, y: 19, w: 372, h: 228 };
      ctx.fillStyle = "rgba(12,26,33,0.34)"; ctx.fillRect(panel.x + 7, panel.y + 8, panel.w, panel.h);
      ctx.fillStyle = COLORS.ink; ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h); ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
      ctx.fillStyle = "#f7fdff"; ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8); ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);
      ctx.fillStyle = skin.dark; ctx.fillRect(panel.x + 12, panel.y + 10, panel.w - 24, 38);
      ctx.fillStyle = skin.mid; ctx.fillRect(panel.x + 14, panel.y + 12, panel.w - 28, 33);
      ctx.fillStyle = skin.light; ctx.fillRect(panel.x + 17, panel.y + 14, panel.w - 34, 4);
      drawBitmapText("SOLO SETTINGS", W / 2, panel.y + 20, 1.65, "center", COLORS.white, skin.dark);

      const rows = [SOLO_SETTINGS_UI.endlessRow, SOLO_SETTINGS_UI.catchGoalRow, SOLO_SETTINGS_UI.timeLimitRow];
      const labels = [
        ["MODE", game.soloEndlessMode ? "ENDLESS" : "STANDARD"],
        ["CATCH GOAL", game.soloEndlessMode ? "UNLIMITED" : `${game.soloCatchGoal === 10 ? 10 : 5} FLIES`],
        ["TIME LIMIT", Number(game.soloTimeLimitSeconds) > 0 ? `${game.soloTimeLimitSeconds} SEC` : "OFF"]
      ];
      rows.forEach((row, index) => {
        const focused = game.soloSettingsFocusIndex === index;
        ctx.fillStyle = "rgba(25,43,52,0.25)"; ctx.fillRect(row.x + 2, row.y + 2, row.w, row.h);
        ctx.fillStyle = focused ? COLORS.ink : "#9aa9ae"; ctx.fillRect(row.x, row.y, row.w, row.h);
        ctx.fillStyle = focused ? skin.mid : "#f7fdff"; ctx.fillRect(row.x + 2, row.y + 2, row.w - 4, row.h - 4);
        ctx.fillStyle = focused ? skin.light : "#ffffff"; ctx.fillRect(row.x + 5, row.y + 4, row.w - 10, 3);
        drawPagerArrowIcon({ x: row.x + 8, y: row.y + 5, w: 18, h: 18 }, -1, focused ? COLORS.white : "#48555a");
        drawPagerArrowIcon({ x: row.x + row.w - 26, y: row.y + 5, w: 18, h: 18 }, 1, focused ? COLORS.white : "#48555a");
        drawBitmapText(labels[index][0], row.x + 82, row.y + 9, 0.82, "center", focused ? COLORS.white : "#48555a", focused ? skin.dark : null);
        drawBitmapText(labels[index][1], row.x + 210, row.y + 9, 0.82, "center", focused ? COLORS.white : skin.dark, focused ? skin.dark : null);
      });
      if (!game.soloEndlessMode) {
        const note = game.soloCatchGoal === 10 ? "10-FLY MODE DOES NOT REPLACE 5-FLY RECORDS" : "STANDARD 5-FLY RECORDS ENABLED";
        drawBitmapText(note, W / 2, 190, 0.60, "center", "#59666b");
      }

      const back = SOLO_SETTINGS_UI.backButton;
      const backFocused = game.soloSettingsFocusIndex === 3;
      ctx.fillStyle = "rgba(25,43,52,0.28)"; ctx.fillRect(back.x + 2, back.y + 2, back.w, back.h);
      ctx.fillStyle = backFocused ? COLORS.ink : "#9aa9ae"; ctx.fillRect(back.x, back.y, back.w, back.h);
      ctx.fillStyle = backFocused ? "#7d8a90" : "#f7fdff"; ctx.fillRect(back.x + 2, back.y + 2, back.w - 4, back.h - 4);
      ctx.fillStyle = backFocused ? "#d8e1e4" : COLORS.white; ctx.fillRect(back.x + 5, back.y + 4, back.w - 10, 3);
      drawBitmapText("BACK", back.x + back.w / 2, back.y + 8, 1, "center", backFocused ? COLORS.white : "#48555a", backFocused ? COLORS.ink : null);
      drawVersionLabel(panel.x + panel.w - 12, panel.y + panel.h - 10, "right");
    }

    function drawStatsMetricIcon(type, centerX, centerY, skin) {
      const verticalOffsets = Object.freeze({
        jump: 0, fly: 0, distance: 0, perfect: 0, combo: 0,
        air: 0, clock: 0, trophy: 0, bounce: 0, spit: 0, pvpBonk: 0
      });
      centerY += verticalOffsets[type] || 0;
      const dark = "#465158";
      const mid = "#7f8a90";
      const light = "#cfd7da";
      const white = "#eef3f5";
      const rect = (x, y, w, h, color = dark) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(centerX + x), Math.round(centerY + y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
      };
      const monoFly = (ox, oy, scale = 1) => {
        rect(ox - 5*scale, oy - 3*scale, 4*scale, 3*scale, white);
        rect(ox + 2*scale, oy - 3*scale, 4*scale, 3*scale, white);
        rect(ox - 3*scale, oy - 4*scale, 6*scale, 9*scale, dark);
        rect(ox - 2*scale, oy - 4*scale, 4*scale, 2*scale, light);
        rect(ox - 2*scale, oy, 4*scale, 3*scale, mid);
      };

      if (type === "jump") {
        drawTrampolineIcon(centerX, centerY, { dark, mid, light }, 0.88, true);
      } else if (type === "fly" || type === "combo") {
        monoFly(type === "combo" ? -4 : 0, 0, 0.82);
        if (type === "combo") monoFly(5, 4, 0.72);
      } else if (type === "distance") {
        rect(-8,4,16,2); rect(-8,0,2,8); rect(6,0,2,8); rect(-6,1,4,2); rect(2,1,4,2); rect(-4,4,8,1,light);
      } else if (type === "perfect") {
        rect(-1,-8,3,16); rect(-8,-1,16,3); rect(-4,-4,9,9,light); rect(-2,-2,5,5,mid);
      } else if (type === "air") {
        rect(-8,5,16,2); rect(-9,0,3,2,light); rect(-4,-4,3,2,light); rect(2,-7,3,2,light); rect(7,-3,3,2,light);
      } else if (type === "clock") {
        rect(-7,-7,14,14); rect(-5,-5,10,10,light); rect(0,-4,2,5); rect(0,0,5,2);
      } else if (type === "trophy") {
        rect(-7,-5,14,10); rect(-9,-3,3,6); rect(7,-3,3,6); rect(-2,5,4,5); rect(-6,9,12,3);
        rect(-5,-4,10,7,mid); rect(-3,-3,4,2,light);
      } else if (type === "bounce") {
        rect(-8,-7,2,14); rect(6,-1,2,8); rect(-5,4,12,2); rect(-4,1,3,3,light); rect(0,-2,3,3,light);
      } else if (type === "spit") {
        rect(-8,-3,7,7); rect(-6,-1,4,3,mid); rect(1,-1,3,2,light); rect(5,-4,3,2,light); rect(6,3,3,2,light);
      } else if (type === "pvpBonk") {
        rect(-6,4,12,5,dark); rect(-4,5,8,3,mid);
        rect(-5,-3,4,4,light); rect(1,-3,4,4,light);
        rect(-9,0,3,1,light); rect(-8,-1,1,3,light);
        rect(6,0,3,1,light); rect(8,-1,1,3,light);
      }
    }

    function drawStatsScreen() {
      const skin = getSelectedSkin();
      const backdrop = ctx.createLinearGradient(0, 0, 0, H);
      backdrop.addColorStop(0, skin.dark);
      backdrop.addColorStop(0.62, skin.mid);
      backdrop.addColorStop(1, skin.belly);
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, W, H);

      const panel = { x: 20, y: 7, w: 440, h: 256 };
      ctx.fillStyle = "rgba(12,26,33,0.34)";
      ctx.fillRect(panel.x + 7, panel.y + 8, panel.w, panel.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h);
      ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8);
      ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);

      ctx.fillStyle = skin.dark;
      ctx.fillRect(panel.x + 12, panel.y + 9, panel.w - 24, 36);
      ctx.fillStyle = skin.mid;
      ctx.fillRect(panel.x + 14, panel.y + 11, panel.w - 28, 31);
      ctx.fillStyle = skin.light;
      ctx.fillRect(panel.x + 17, panel.y + 13, panel.w - 34, 4);
      drawBitmapText("PLAYER STATS", W / 2, panel.y + 18, 2, "center", COLORS.white, skin.dark);

      const allMetrics = getStatsMetrics();
      const statsPageCount = getStatsPageCount();
      game.statsPage = clamp(game.statsPage, 0, statsPageCount - 1);
      const statsStart = game.statsPage * STATS_UI.itemsPerPage;
      const metrics = allMetrics.slice(statsStart, statsStart + STATS_UI.itemsPerPage);
      metrics.forEach((metric, index) => {
        const column = index % STATS_UI.columns;
        const row = Math.floor(index / STATS_UI.columns);
        const x = STATS_UI.startX + column * (STATS_UI.cardW + STATS_UI.gapX);
        const y = STATS_UI.startY + row * (STATS_UI.cardH + STATS_UI.gapY);
        ctx.fillStyle = "rgba(25,43,52,0.25)";
        ctx.fillRect(x + 2, y + 2, STATS_UI.cardW, STATS_UI.cardH);
        ctx.fillStyle = "#8fa6ac";
        ctx.fillRect(x, y, STATS_UI.cardW, STATS_UI.cardH);
        ctx.fillStyle = "#f7fdff";
        ctx.fillRect(x + 2, y + 2, STATS_UI.cardW - 4, STATS_UI.cardH - 4);
        ctx.fillStyle = mixHexColors(skin.belly, "#ffffff", 0.25);
        ctx.fillRect(x + 5, y + 4, STATS_UI.cardW - 10, 3);

        const iconCenterX = x + 30;
        const textCenterX = x + 120;
        drawStatsMetricIcon(metric.icon, iconCenterX, y + STATS_UI.cardH / 2, skin);
        drawBitmapText(metric.label, textCenterX, y + 7, 0.82, "center", "#59666b");
        drawBitmapText(metric.value, textCenterX, y + 16, 0.90, "center", skin.dark);
      });

      if (statsPageCount > 1) {
        const pageButtons = [
          { area: "pagePrev", rect: STATS_UI.pagePrevButton, direction: -1, enabled: statsPageCount > 1 },
          { area: "pageNext", rect: STATS_UI.pageNextButton, direction: 1, enabled: statsPageCount > 1 }
        ];
        pageButtons.forEach((entry) => {
          const focused = game.statsFocusArea === entry.area;
          ctx.fillStyle = "rgba(25,43,52,0.24)";
          ctx.fillRect(entry.rect.x + 2, entry.rect.y + 2, entry.rect.w, entry.rect.h);
          ctx.fillStyle = focused ? COLORS.ink : "#9aa9ae";
          ctx.fillRect(entry.rect.x, entry.rect.y, entry.rect.w, entry.rect.h);
          ctx.fillStyle = entry.enabled ? (focused ? skin.mid : "#f7fdff") : "#d7dfe2";
          ctx.fillRect(entry.rect.x + 2, entry.rect.y + 2, entry.rect.w - 4, entry.rect.h - 4);
          drawPagerArrowIcon(entry.rect, entry.direction, entry.enabled ? (focused ? COLORS.white : "#48555a") : "#9aa3a7");
        });
        drawBitmapText(
          `${game.statsPage + 1}/${statsPageCount}`,
          STATS_UI.pagePrevButton.x - 8,
          STATS_UI.pagePrevButton.y + (STATS_UI.pagePrevButton.h - 7 * 0.75) / 2,
          0.75,
          "right",
          "#617177"
        );
      }

      const back = STATS_UI.backButton;
      const backSelected = game.statsFocusArea === "back";
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(back.x + 2, back.y + 2, back.w, back.h);
      ctx.fillStyle = backSelected ? COLORS.ink : "#93a2a7";
      ctx.fillRect(back.x, back.y, back.w, back.h);
      ctx.fillStyle = backSelected ? skin.mid : "#f7fdff";
      ctx.fillRect(back.x + 2, back.y + 2, back.w - 4, back.h - 4);
      if (backSelected) {
        ctx.fillStyle = skin.light;
        ctx.fillRect(back.x + 5, back.y + 4, back.w - 10, 3);
      }
      drawBitmapText("BACK TO MENU", back.x + back.w / 2, back.y + 7, 1, "center", backSelected ? COLORS.white : "#48555a", backSelected ? skin.dark : null);
    }

    function drawHomeAchievementsButton() {
      const button = HOME_UI.achievementsButton;
      const focused = game.homeFocusVisible && game.homeSelection === "achievements";
      const hovered = game.achievementButtonHovered;
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      ctx.fillStyle = focused || hovered ? getSelectedSkin().dark : COLORS.ink;
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = focused || hovered
        ? mixHexColors(getSelectedSkin().belly, "#ffffff", 0.18)
        : "#f7fdff";
      ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
      ctx.save();
      ctx.translate(button.x + button.w / 2, button.y + button.h / 2);
      ctx.scale(0.62, 0.62);
      drawPixelTrophy(0, -8, false);
      ctx.restore();
      if (focused) {
        ctx.fillStyle = getSelectedSkin().dark;
        ctx.fillRect(button.x + 3, button.y + 3, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2);
        ctx.fillRect(button.x + 3, button.y + button.h - 5, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + button.h - 5, 2, 2);
      }
    }

    function drawPagerArrowIcon(rect, direction, color) {
      const cx = Math.round(rect.x + rect.w / 2);
      const cy = Math.round(rect.y + rect.h / 2);
      ctx.save();
      ctx.translate(cx, cy);
      if (direction > 0) ctx.scale(-1, 1);
      ctx.fillStyle = color;
      // One left arrow; the right arrow is this exact shape mirrored.
      ctx.fillRect(-6, -1, 10, 3);
      ctx.fillRect(-5, -3, 4, 7);
      ctx.fillRect(-3, -5, 2, 11);
      ctx.restore();
    }


    function drawAchievementsScreen() {
      const skin = getSelectedSkin();
      const backdrop = ctx.createLinearGradient(0, 0, 0, H);
      backdrop.addColorStop(0, skin.dark);
      backdrop.addColorStop(0.62, skin.mid);
      backdrop.addColorStop(1, skin.belly);
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, W, H);

      const panel = { x: 20, y: 7, w: 440, h: 256 };
      ctx.fillStyle = "rgba(12,26,33,0.34)";
      ctx.fillRect(panel.x + 7, panel.y + 8, panel.w, panel.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h);
      ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8);
      ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);

      ctx.fillStyle = skin.dark;
      ctx.fillRect(panel.x + 12, panel.y + 9, panel.w - 24, 36);
      ctx.fillStyle = skin.mid;
      ctx.fillRect(panel.x + 14, panel.y + 11, panel.w - 28, 31);
      ctx.fillStyle = skin.light;
      ctx.fillRect(panel.x + 17, panel.y + 13, panel.w - 34, 4);
      drawBitmapText("ACHIEVEMENTS", W / 2, panel.y + 18, 2, "center", COLORS.white, skin.dark);

      const activeAchievementIndex = game.achievementHoveredIndex ?? null;
      const definition = activeAchievementIndex === null ? null : (MENU_ACHIEVEMENT_DEFINITIONS[activeAchievementIndex] || MENU_ACHIEVEMENT_DEFINITIONS[0]);
      const unlocked = definition ? isAchievementUnlocked(definition) : false;
      const detail = { x: 48, y: 54, w: 384, h: 40 };
      ctx.fillStyle = "rgba(25,43,52,0.25)";
      ctx.fillRect(detail.x + 2, detail.y + 2, detail.w, detail.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(detail.x, detail.y, detail.w, detail.h);
      ctx.fillStyle = definition ? (unlocked ? mixHexColors(skin.belly, skin.mid, 0.18) : "#eef3f4") : "#eef3f4";
      ctx.fillRect(detail.x + 3, detail.y + 3, detail.w - 6, detail.h - 6);
      if (definition) {
        drawAchievementIcon(definition.icon, detail.x + 10, detail.y + 8, unlocked, 1.24);
        drawBitmapText(definition.name, detail.x + 215, detail.y + 6, 1, "center", unlocked ? skin.dark : "#48555a");
        definition.lines.forEach((line, index) => drawBitmapText(line, detail.x + 215, detail.y + 17 + index * 8, 1, "center", "#59666b"));
        const progressText = getAchievementProgressText(definition);
        if (progressText) {
          drawBitmapText(progressText, detail.x + detail.w - 9, detail.y + 29, 1, "right", unlocked ? skin.dark : "#7c878b");
        }
        if (unlocked) drawMiniOpenLockIcon(detail.x + detail.w - 17, detail.y + 6, 0.80, skin);
        else drawMiniLockIcon(detail.x + detail.w - 17, detail.y + 7, 0.72);
      } else {
        drawBitmapText("SCROLL OVER ACHIEVEMENT TO VIEW!", detail.x + detail.w / 2, detail.y + 16, 1, "center", "#59666b");
        drawBitmapText("VERSUS AND SOLO ACHIEVEMENTS APPEAR HERE.", detail.x + detail.w / 2, detail.y + 25, 0.86, "center", skin.dark);
      }

      for (const index of getAchievementIndicesOnPage()) {
        const item = MENU_ACHIEVEMENT_DEFINITIONS[index];
        const rect = getAchievementButtonRect(index);
        const clicked = false;
        const previewed = game.achievementHoveredIndex === index;
        const earned = isAchievementUnlocked(item);
        ctx.fillStyle = "rgba(25,43,52,0.24)";
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
        const cardFrame = previewed ? COLORS.ink : clicked ? skin.dark : "#9aa9ae";
        const cardInset = previewed ? 4 : clicked ? 3 : 2;
        ctx.fillStyle = cardFrame;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = earned ? (clicked ? skin.mid : "#f7fdff") : "#d7dfe2";
        ctx.fillRect(rect.x + cardInset, rect.y + cardInset, rect.w - cardInset * 2, rect.h - cardInset * 2);
        if (earned) {
          ctx.fillStyle = clicked ? skin.light : mixHexColors(skin.light, "#ffffff", 0.45);
          ctx.fillRect(rect.x + cardInset + 3, rect.y + cardInset + 2, rect.w - cardInset * 2 - 6, 3);
        }
        const compactFlyIcon = ["double-fly", "spark-fly", "sky-fly", "flies-100", "score-six", "score-seven", "bounce-fly"].includes(item.icon);
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x + 3, rect.y + 3, 31, rect.h - 6);
        ctx.clip();
        drawAchievementIcon(
          item.icon,
          rect.x + 10,
          rect.y + (compactFlyIcon ? 7 : 6),
          earned,
          compactFlyIcon ? 0.60 : 0.86
        );
        ctx.restore();
        const achievementNameLeft = rect.x + 34;
        const achievementNameRight = rect.x + rect.w - 24;
        const achievementNameCenter = (achievementNameLeft + achievementNameRight) / 2;
        const achievementNameWidth = Math.max(1, measureBitmapText(item.name, 1));
        const achievementNameScale = clamp((achievementNameRight - achievementNameLeft) / achievementNameWidth, 0.56, 0.94);
        drawBitmapText(item.name, achievementNameCenter, rect.y + 7, achievementNameScale, "center", earned ? "#34484f" : "#697579", null);
        if (earned) drawMiniOpenLockIcon(rect.x + rect.w - 12, rect.y + 4, 0.60, skin);
        else drawMiniLockIcon(rect.x + rect.w - 12, rect.y + 5, 0.52);
        // The solid black frame above is the hover/keyboard indicator. The
        // colored card fill remains reserved for an explicitly clicked item.
      }

      const pageCount = getAchievementPageCount();
      if (pageCount > 1) {
        const pageButtons = [
          { area: "pagePrev", rect: ACHIEVEMENTS_UI.pagePrevButton, direction: -1, enabled: true },
          { area: "pageNext", rect: ACHIEVEMENTS_UI.pageNextButton, direction: 1, enabled: true }
        ];
        pageButtons.forEach((entry) => {
          const focused = game.achievementFocusArea === entry.area;
          ctx.fillStyle = "rgba(25,43,52,0.24)";
          ctx.fillRect(entry.rect.x + 2, entry.rect.y + 2, entry.rect.w, entry.rect.h);
          ctx.fillStyle = focused ? COLORS.ink : "#9aa9ae";
          ctx.fillRect(entry.rect.x, entry.rect.y, entry.rect.w, entry.rect.h);
          ctx.fillStyle = entry.enabled ? (focused ? skin.mid : "#f7fdff") : "#d7dfe2";
          ctx.fillRect(entry.rect.x + 2, entry.rect.y + 2, entry.rect.w - 4, entry.rect.h - 4);
          drawPagerArrowIcon(entry.rect, entry.direction, entry.enabled ? (focused ? COLORS.white : "#48555a") : "#9aa3a7");
        });
        const achievementPageLabelX = ACHIEVEMENTS_UI.pagePrevButton.x - 8;
        const achievementPageLabelY = ACHIEVEMENTS_UI.pagePrevButton.y +
          (ACHIEVEMENTS_UI.pagePrevButton.h - 7 * 0.75) / 2;
        drawBitmapText(
          `${game.achievementPage + 1}/${pageCount}`,
          achievementPageLabelX,
          achievementPageLabelY,
          0.75,
          "right",
          "#617177"
        );
      }

      const back = ACHIEVEMENTS_UI.backButton;
      const backSelected = game.achievementFocusArea === "back";
      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(back.x + 2, back.y + 2, back.w, back.h);
      ctx.fillStyle = backSelected ? COLORS.ink : "#93a2a7";
      ctx.fillRect(back.x, back.y, back.w, back.h);
      ctx.fillStyle = backSelected ? skin.mid : "#f7fdff";
      ctx.fillRect(back.x + 2, back.y + 2, back.w - 4, back.h - 4);
      if (backSelected) { ctx.fillStyle = skin.light; ctx.fillRect(back.x + 5, back.y + 4, back.w - 10, 3); }
      drawBitmapText("BACK TO MENU", back.x + back.w / 2, back.y + 7, 1, "center", backSelected ? COLORS.white : "#48555a", backSelected ? skin.dark : null);
    }

    function drawHomeRandomButton() {
      const button = HOME_UI.randomButton;
      const focused = game.homeFocusVisible && game.homeSelection === "random";
      // Random remains the active play mode, but its full-color highlight yields
      // to whichever control the player is currently browsing. This prevents
      // Random and Back/Time from appearing selected at the same time.
      const anotherControlHovered = Boolean(
        game.hoveredLevelId || game.achievementButtonHovered || game.statsButtonHovered ||
        game.homeTutorialButtonHovered || game.homeSettingsButtonHovered ||
        game.timeButtonHovered || game.homeHoverSelection === "back"
      );
      const active = game.soloRandomLevelMode && (!game.homeFocusVisible || focused) && !anotherControlHovered;
      const hovered = game.randomButtonHovered;
      const highlighted = focused || hovered || active;
      const palette = PVP_RANDOM_STAGE_PALETTE;
      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      ctx.fillStyle = highlighted ? COLORS.ink : "#8fa6ac";
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = active ? palette.mid : "#f7fdff";
      ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
      ctx.fillStyle = highlighted ? palette.light : COLORS.white;
      ctx.fillRect(button.x + 5, button.y + 4, button.w - 10, 3);
      drawRandomStageIcon(button.x + 12, button.y + 1, active ? palette : { dark: "#59666b", mid: "#9ba8ad", light: "#eef4f6" }, 0.52);
      drawBitmapText("RANDOM", button.x + 61, button.y + 6, 0.84, "center", active ? COLORS.white : "#34484f", active ? palette.dark : null);
      if (focused) {
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(button.x + 3, button.y + 3, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2);
        ctx.fillRect(button.x + 3, button.y + button.h - 5, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + button.h - 5, 2, 2);
      }
    }

    function drawHomeLevelRecordTooltip(levelId) {
      if (!LEVELS[levelId] || !isLevelUnlocked(levelId)) return;
      const bestTime = readBestTime(levelId);
      const fewestJumps = readFewestJumps(levelId);
      const bestEndless = readBestEndlessFlies(levelId);
      const width = 174;
      const height = 36;
      const layout = getLevelTooltipLayout(levelId, width, height);
      if (!layout) return;
      const palette = LEVEL_MENU_COLORS[levelId] || LEVEL_MENU_COLORS.park;
      drawLevelTooltipFrame(layout, palette);
      const centerX = layout.left + layout.width / 2;
      drawBitmapText("BEST", centerX, layout.top + 9, 0.80, "center", palette.dark);

      const recordY = layout.top + 24;
      if (game.soloEndlessMode) {
        drawMiniFlyIcon(centerX - 33, recordY + 2, 0.64);
        const endlessText = `${bestEndless === null ? "--" : bestEndless} FLIES • 60 SEC`;
        drawBitmapText(endlessText, centerX + 10, recordY - 3, 0.58, "center", "#48555a");
      } else {
        const timeText = bestTime === null ? "--:--.-" : formatTime(bestTime);
        const jumpText = fewestJumps === null ? "--" : String(fewestJumps);
        drawMiniStopwatchIcon(centerX - 55, recordY + 2, palette, 0.52);
        drawBitmapText(timeText, centerX - 44, recordY - 3, 0.68, "left", "#48555a");
        drawBitmapText("•", centerX + 2, recordY - 2, 0.64, "center", palette.dark);
        drawTrampolineIcon(centerX + 25, recordY + 2, palette, 0.46);
        drawBitmapText(jumpText, centerX + 56, recordY - 3, 0.70, "right", "#48555a");
      }
    }

    function getTwoFrameMenuBob(phase = 0) {
      return ((Math.floor((game.visualTime + phase) * 3) % 2) === 0) ? 0 : -2;
    }

    function drawMiniPainterPaletteIcon(centerX, centerY, scale = 1, palette = null) {
      const s = scale;
      const x = Math.round(centerX - 10 * s);
      const y = Math.round(centerY - 7 * s);
      const skin = palette || getSelectedSkin();
      const block = (dx, dy, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(x + dx * s), Math.round(y + dy * s),
          Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))
        );
      };
      block(3, 0, 13, 14, skin.dark);
      block(0, 3, 19, 8, skin.dark);
      block(3, 2, 12, 10, mixHexColors(skin.belly, "#ffffff", 0.12));
      block(2, 4, 15, 6, mixHexColors(skin.belly, "#ffffff", 0.12));
      block(13, 2, 4, 4, "#f7fdff");
      block(14, 3, 2, 2, skin.dark);
      block(4, 4, 3, 3, "#ef7582");
      block(8, 3, 3, 3, "#6dbde7");
      block(5, 8, 3, 3, "#f0c75a");
      block(10, 8, 3, 3, "#72bd68");
    }

    function drawMiniPaintSploshIcon(centerX, centerY, scale = 1, palette = null) {
      const s = scale;
      const skin = palette || getSelectedSkin();
      const x = Math.round(centerX);
      const y = Math.round(centerY);
      const block = (dx, dy, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)));
      };
      block(-7,-5,14,10,skin.dark); block(-9,-2,18,5,skin.dark); block(-4,-7,7,14,skin.dark);
      block(-6,-4,12,8,skin.mid); block(-8,-1,16,3,skin.mid); block(-3,-6,5,12,skin.light);
      block(-10,-6,3,3,"#ef7582"); block(7,-7,3,3,"#6dbde7"); block(8,5,2,2,"#f0c75a"); block(-9,6,2,2,"#72bd68");
      block(-1,-2,3,3,mixHexColors(skin.belly,"#ffffff",0.25));
    }

    function drawMiniPaintBrushIcon(centerX, centerY, scale = 1, active = false) {
      const s = scale;
      const x = Math.round(centerX - 9 * s);
      const y = Math.round(centerY - 8 * s);
      const ferrule = active ? getSelectedSkin().light : "#cfd8dc";
      const handle = active ? getSelectedSkin().dark : "#5b666b";
      const bristle = active ? "#ef7582" : "#8fa6ac";
      ctx.fillStyle = handle;
      ctx.fillRect(x + 10 * s, y + 1 * s, 4 * s, 13 * s);
      ctx.fillRect(x + 7 * s, y + 11 * s, 10 * s, 3 * s);
      ctx.fillStyle = ferrule;
      ctx.fillRect(x + 6 * s, y + 5 * s, 6 * s, 5 * s);
      ctx.fillStyle = bristle;
      ctx.fillRect(x + 3 * s, y + 2 * s, 7 * s, 5 * s);
      ctx.fillRect(x + 2 * s, y + 4 * s, 4 * s, 4 * s);
      if (active) {
        ctx.fillStyle = "#6dbde7";
        ctx.fillRect(x + 1 * s, y + 1 * s, 2 * s, 2 * s);
        ctx.fillRect(x + 16 * s, y + 12 * s, 2 * s, 2 * s);
      }
    }

    function drawMainOptionFrame(rect, active, accent) {
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = active ? COLORS.ink : "#8fa6ac";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.fillStyle = active ? accent : COLORS.white;
      ctx.fillRect(rect.x + 5, rect.y + 5, rect.w - 10, 4);
      if (active) {
        ctx.fillStyle = COLORS.white;
        [[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy]) =>
          ctx.fillRect(rect.x + dx, rect.y + dy, 2, 2)
        );
      }
    }

    function isMainOptionActive(id) {
      return (game.mainFocusVisible && game.mainSelection === id) || game.mainHoveredSelection === id;
    }

    function drawMainMenuScreen() {
      const previewLevelId = game.selectedLevelId || "park";
      const previewLevel = LEVELS[previewLevelId] || LEVELS.park;
      const chrome = TIME_OF_DAY_CHROME[game.timeOfDay] || TIME_OF_DAY_CHROME.afternoon;
      ctx.fillStyle = chrome.outer;
      ctx.fillRect(0, 0, W, H);
      drawBackground(previewLevelId);
      for (const platform of previewLevel.platforms) drawPlatform(platform, previewLevelId);
      drawTimeOfDayWorldTint(previewLevelId);
      ctx.fillStyle = "rgba(18,33,41,0.18)";
      ctx.fillRect(0, 0, W, H);

      const panel = { x: 38, y: 15, w: 404, h: 228 };
      ctx.fillStyle = "rgba(12,26,33,0.30)";
      ctx.fillRect(panel.x + 7, panel.y + 8, panel.w, panel.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h);
      ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8);
      ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);

      const skin = getSelectedSkin();
      ctx.fillStyle = skin.dark;
      ctx.fillRect(panel.x + 14, panel.y + 10, panel.w - 28, 34);
      ctx.fillStyle = skin.mid;
      ctx.fillRect(panel.x + 16, panel.y + 12, panel.w - 32, 29);
      ctx.fillStyle = skin.light;
      ctx.fillRect(panel.x + 19, panel.y + 14, panel.w - 38, 4);
      drawBitmapText("RIBBIT RACE", W / 2, panel.y + 20, 2, "center", COLORS.white, skin.dark);
      drawBitmapText("CHOOSE A MODE", W / 2, 66, 1, "center", "#59666b");

      const solo = MAIN_UI.soloButton;
      const soloActive = isMainOptionActive("solo");
      drawMainOptionFrame(solo, soloActive, skin.light);
      const soloBob = soloActive ? getTwoFrameMenuBob(0) : 0;
      const soloFlyBob = soloActive ? getTwoFrameMenuBob(0.55) : 0;
      drawMiniFrogSwatch(solo.x + 18, solo.y + 9 + soloBob, skin, 0.82);
      drawFlyAt(solo.x + solo.w - 20, solo.y + 16 + soloFlyBob, 0.62);
      drawBitmapText("SINGLE PLAYER", solo.x + solo.w / 2 + 2, solo.y + 10, 1, "center", "#34484f");

      const frogButton = MAIN_UI.frogButton;
      const frogActive = isMainOptionActive("frog");
      drawMainOptionFrame(frogButton, frogActive, skin.light);
      const frogIconBob = frogActive ? getTwoFrameMenuBob(0.18) : 0;
      drawMiniPainterPaletteIcon(frogButton.x + 20, frogButton.y + frogButton.h / 2 + frogIconBob, 0.88);
      drawMiniPaintBrushIcon(frogButton.x + frogButton.w - 20, frogButton.y + frogButton.h / 2 - frogIconBob, 0.82, frogActive);
      drawBitmapText("FROG COLOR", frogButton.x + frogButton.w / 2 + 4, frogButton.y + 10, 1, "center", "#34484f");

      const pvpButton = MAIN_UI.pvpButton;
      const pvpActive = isMainOptionActive("pvp");
      drawMainOptionFrame(pvpButton, pvpActive, "#ef7582");
      const pvpBob = pvpActive ? getTwoFrameMenuBob(0.35) : 0;
      drawMiniFrogSwatchFacing(pvpButton.x + 22, pvpButton.y + 9 + pvpBob, FROG_SKINS.azure, 0.78, 1);
      drawMiniFrogSwatchFacing(pvpButton.x + pvpButton.w - 22, pvpButton.y + 9 + pvpBob, FROG_SKINS.crimson, 0.78, -1);
      drawBitmapText("VERSUS", pvpButton.x + pvpButton.w / 2, pvpButton.y + 10, 1, "center", "#34484f");

      const drawSmallMainIconButton = (rect, id, drawer) => {
        const active = isMainOptionActive(id);
        if (active) {
          // A visible two-pixel themed halo makes keyboard focus on the player
          // and device icons read as clearly as Achievements and Stats.
          ctx.fillStyle = skin.light;
          ctx.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
          ctx.fillStyle = skin.mid;
          ctx.fillRect(rect.x - 1, rect.y - 1, rect.w + 2, rect.h + 2);
        }
        ctx.fillStyle = "rgba(25,43,52,0.28)";
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
        ctx.fillStyle = active ? skin.dark : COLORS.ink;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = active ? mixHexColors(skin.belly, "#ffffff", 0.18) : "#f7fdff";
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
        ctx.fillStyle = active ? skin.light : COLORS.white;
        ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 3);
        drawer(rect, active);
        if (active) {
          ctx.fillStyle = COLORS.white;
          [[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy]) =>
            ctx.fillRect(rect.x + dx, rect.y + dy, 2, 2)
          );
        }
      };

      drawSmallMainIconButton(MAIN_UI.profileButton, "profile", (rect, active) => {
        const color = active ? skin.dark : "#48555a";
        const cx = Math.round(rect.x + rect.w / 2);
        ctx.fillStyle = color;
        ctx.fillRect(cx - 3, rect.y + 5, 6, 6);
        ctx.fillRect(cx - 6, rect.y + 12, 12, 7);
        ctx.fillStyle = active ? skin.belly : "#f7fdff";
        ctx.fillRect(cx - 1, rect.y + 7, 2, 2);
        ctx.fillRect(cx - 4, rect.y + 14, 8, 2);
      });
      drawSmallMainIconButton(MAIN_UI.deviceButton, "device", (rect, active) => {
        const color = active ? skin.dark : "#48555a";
        ctx.fillStyle = color;
        ctx.fillRect(rect.x + 5, rect.y + 5, 14, 10);
        ctx.fillStyle = active ? skin.belly : "#f7fdff";
        ctx.fillRect(rect.x + 7, rect.y + 7, 10, 6);
        ctx.fillStyle = color;
        ctx.fillRect(rect.x + 10, rect.y + 15, 4, 3);
        ctx.fillRect(rect.x + 7, rect.y + 18, 10, 2);
      });

      drawSmallMainIconButton(MAIN_UI.achievementsButton, "achievements", (rect) => {
        ctx.save();
        ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
        ctx.scale(0.58, 0.58);
        drawPixelTrophy(0, -8, false);
        ctx.restore();
      });
      drawSmallMainIconButton(MAIN_UI.statsButton, "stats", (rect) => {
        const baseX = Math.round(rect.x + (rect.w - 14) / 2);
        const baseY = Math.round(rect.y + (rect.h + 14) / 2);
        ctx.fillStyle = skin.dark;
        ctx.fillRect(baseX, baseY, 13, 2);
        ctx.fillRect(baseX + 1, baseY - 6, 3, 6);
        ctx.fillRect(baseX + 6, baseY - 10, 3, 10);
        ctx.fillRect(baseX + 11, baseY - 14, 3, 14);
        ctx.fillStyle = skin.light;
        ctx.fillRect(baseX + 2, baseY - 5, 1, 4);
        ctx.fillRect(baseX + 7, baseY - 9, 1, 8);
        ctx.fillRect(baseX + 12, baseY - 13, 1, 12);
      });

      drawBitmapText(isRibbitMobileMode() ? "TAP A BUTTON TO SELECT" : "CLICK OR ARROWS • ENTER TO SELECT", W / 2, 202, 0.78, "center", "#48555a");
      drawBitmapText(RIBBIT_CREDIT_TEXT, W / 2, RIBBIT_CREDIT_Y, 1, "center", "#617177");
    }

    function drawStageBackButton() {
      const rect = HOME_UI.backButton;
      const skin = getSelectedSkin();
      const keyboardActive = game.homeFocusVisible && game.homeSelection === "back";
      const hovered = game.homeHoverSelection === "back";
      const highlighted = keyboardActive || hovered;
      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = highlighted ? COLORS.ink : "#9aa9ae";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = keyboardActive ? "#7d8a90" : "#f7fdff";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);

      // Mouse hover now receives the same bright themed streak used by the
      // other single-player menu buttons instead of remaining plain white.
      ctx.fillStyle = keyboardActive ? "#d8e1e4" : hovered ? skin.light : COLORS.white;
      ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 3);
      if (hovered && !keyboardActive) {
        ctx.fillStyle = skin.mid;
        ctx.fillRect(rect.x + 2, rect.y + rect.h - 3, rect.w - 4, 1);
      }

      drawMiniHouseIcon(rect.x + 9, rect.y + 5);
      drawBitmapText(
        "BACK",
        rect.x + rect.w / 2 + 8,
        rect.y + 8,
        1,
        "center",
        keyboardActive ? COLORS.white : hovered ? skin.dark : "#48555a",
        keyboardActive ? COLORS.ink : null
      );
      if (keyboardActive) {
        ctx.fillStyle = COLORS.white;
        [[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy]) => ctx.fillRect(rect.x + dx, rect.y + dy, 2, 2));
      }
    }

    function drawHomeScreen() {
      const previewLevelId = getHomePreviewLevelId();
      const previewLevel = LEVELS[previewLevelId] || LEVELS.park;
      const chrome = TIME_OF_DAY_CHROME[game.timeOfDay] || TIME_OF_DAY_CHROME.afternoon;
      ctx.fillStyle = chrome.outer;
      ctx.fillRect(0, 0, W, H);
      drawBackground(previewLevelId);
      for (const platform of previewLevel.platforms) drawPlatform(platform, previewLevelId);
      drawTimeOfDayWorldTint(previewLevelId);
      ctx.fillStyle = "rgba(18,33,41,0.12)";
      ctx.fillRect(0, 0, W, H);

      const panel = { x: 38, y: 15, w: 404, h: 228 };
      ctx.fillStyle = "rgba(12,26,33,0.28)";
      ctx.fillRect(panel.x + 7, panel.y + 8, panel.w, panel.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h);
      ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8);
      ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);

      const skin = getSelectedSkin();
      ctx.fillStyle = skin.dark;
      ctx.fillRect(panel.x + 14, panel.y + 10, panel.w - 28, 34);
      ctx.fillStyle = skin.mid;
      ctx.fillRect(panel.x + 16, panel.y + 12, panel.w - 32, 29);
      ctx.fillStyle = skin.light;
      ctx.fillRect(panel.x + 19, panel.y + 14, panel.w - 38, 4);
      drawBitmapText("RIBBIT RACE", W / 2, panel.y + 20, 2, "center", COLORS.white, skin.dark);
      drawBitmapText(
        game.soloEndlessMode ? `SINGLE PLAYER • ENDLESS ${game.soloTimeLimitSeconds} SEC` : `SINGLE PLAYER • ${game.soloCatchGoal} FLY MODE`,
        W / 2,
        66,
        0.90,
        "center",
        "#48555a"
      );

      const previewName = (LEVELS[previewLevelId] || LEVELS.park).name;
      const selectedName = game.soloRandomLevelMode ? "RANDOM" : (LEVELS[game.selectedLevelId] || LEVELS.park).name;
      drawBitmapText(
        previewLevelId === game.selectedLevelId && !game.soloRandomLevelMode
          ? `SELECTED: ${selectedName} • ${game.timeOfDayLock ? getTimeOfDayLabel() : "RANDOM"}`
          : `PREVIEW: ${previewName} • SELECTED: ${selectedName}`,
        W / 2, 76, 1, "center", "#617177"
      );
      drawBitmapText("CHOOSE A LEVEL", W / 2, 88, 1, "center", skin.dark);

      for (const button of HOME_UI.levelButtons) drawHomeLevelButton(button);
      drawHomeRandomButton();
      drawStageBackButton();
      drawHomeTutorialButton();
      drawHomeSettingsButton();
      drawHomeTimeControls();

      drawBitmapText(isRibbitMobileMode() ? "TAP A LEVEL TO PLAY" : "CLICK OR ARROWS • ENTER TO PLAY", W / 2, 210, 0.75, "center", "#48555a");
      drawBitmapText(RIBBIT_CREDIT_TEXT, W / 2, RIBBIT_CREDIT_Y, 1, "center", "#617177");

      const recordLevelId = game.hoveredLevelId || (game.homeFocusVisible && LEVELS[game.homeSelection] ? game.homeSelection : null);
      if (recordLevelId && isLevelUnlocked(recordLevelId)) drawHomeLevelRecordTooltip(recordLevelId);

      if (!isTimeSelectUnlocked() && (game.timeButtonHovered || (game.homeFocusVisible && game.homeSelection === "time"))) {
        drawLockedTimeSelectTooltip();
      } else {
        const lockedLevelId = game.hoveredLevelId || (game.homeFocusVisible && LEVELS[game.homeSelection] ? game.homeSelection : null);
        if (lockedLevelId && !isLevelUnlocked(lockedLevelId)) drawLockedLevelTooltip(lockedLevelId);
      }
    }

    function drawMiniHouseIcon(x, y) {
      ctx.fillStyle = "#354147";
      ctx.fillRect(x + 1, y + 5, 13, 9);
      ctx.fillRect(x + 3, y + 3, 9, 2);
      ctx.fillRect(x + 5, y + 1, 5, 2);
      ctx.fillStyle = "#aebbc0";
      ctx.fillRect(x + 3, y + 6, 9, 7);
      ctx.fillStyle = "#dfe8eb";
      ctx.fillRect(x + 4, y + 6, 7, 2);
      ctx.fillStyle = "#59676d";
      ctx.fillRect(x + 7, y + 9, 3, 4);
      ctx.fillStyle = "#eef4f6";
      ctx.fillRect(x + 4, y + 8, 2, 2);
    }

    function drawMiniPlayIcon(x, y, color = COLORS.white) {
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x, y, 10, 14);
      ctx.fillStyle = color;
      ctx.fillRect(x + 2, y + 2, 3, 10);
      ctx.fillRect(x + 5, y + 4, 3, 6);
      ctx.fillRect(x + 8, y + 6, 2, 2);
    }

    function drawMiniOutlinedPlayIcon(x, y, color = "#59676d", active = false) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 14, 1);
      ctx.fillRect(x, y + 13, 14, 1);
      ctx.fillRect(x, y, 1, 14);
      ctx.fillRect(x + 13, y, 1, 14);
      ctx.fillRect(x + 4, y + 3, 2, 8);
      ctx.fillRect(x + 6, y + 4, 2, 6);
      ctx.fillRect(x + 8, y + 5, 2, 4);
      ctx.fillRect(x + 10, y + 6, 2, 2);
      if (active) {
        ctx.fillRect(x - 2, y + 5, 1, 4);
        ctx.fillRect(x + 15, y + 5, 1, 4);
      }
    }

    function drawMiniGamepadIcon(x, y, color = "#59676d") {
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x + 3, y + 3, 16, 9);
      ctx.fillRect(x + 1, y + 6, 5, 7);
      ctx.fillRect(x + 16, y + 6, 5, 7);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(x + 5, y + 5, 12, 5);
      ctx.fillRect(x + 3, y + 7, 4, 4);
      ctx.fillRect(x + 15, y + 7, 4, 4);
      ctx.fillStyle = color;
      ctx.fillRect(x + 6, y + 7, 5, 2);
      ctx.fillRect(x + 7, y + 6, 2, 5);
      ctx.fillRect(x + 14, y + 6, 2, 2);
      ctx.fillRect(x + 17, y + 8, 2, 2);
      ctx.fillStyle = "#8aa0a8";
      ctx.fillRect(x + 10, y + 8, 3, 1);
    }

    function drawMiniRestartIcon(x, y, color = "#59676d") {
      ctx.fillStyle = color;
      ctx.fillRect(x + 4, y + 1, 7, 2);
      ctx.fillRect(x + 10, y + 2, 3, 2);
      ctx.fillRect(x + 12, y + 3, 2, 5);
      ctx.fillRect(x + 10, y + 2, 5, 2);
      ctx.fillRect(x + 12, y, 2, 5);
      ctx.fillRect(x + 3, y + 10, 8, 2);
      ctx.fillRect(x + 1, y + 7, 2, 5);
      ctx.fillRect(x + 2, y + 5, 2, 3);
      ctx.fillRect(x, y + 10, 5, 2);
      ctx.fillRect(x + 1, y + 9, 2, 5);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(x + 5, y + 4, 5, 5);
    }

    function drawMiniMuteIcon(x, y, muted = false) {
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x, y + 5, 4, 6);
      ctx.fillRect(x + 4, y + 3, 3, 10);
      ctx.fillStyle = muted ? "#b94d4d" : getSelectedSkin().mid;
      ctx.fillRect(x + 1, y + 6, 3, 4);
      ctx.fillRect(x + 4, y + 5, 2, 6);
      if (muted) {
        ctx.fillRect(x + 9, y + 4, 2, 9);
        ctx.fillRect(x + 7, y + 6, 6, 2);
      } else {
        ctx.fillStyle = getSelectedSkin().dark;
        ctx.fillRect(x + 8, y + 5, 2, 2);
        ctx.fillRect(x + 10, y + 3, 2, 6);
        ctx.fillRect(x + 8, y + 10, 2, 2);
      }
    }

    function drawSelectablePauseButton(rect, selected, hovered, pressed, palette, label, iconDrawer, textX) {
      const fullHighlight = selected || pressed;
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = fullHighlight ? COLORS.ink : "#8fa0a6";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      if (fullHighlight) {
        ctx.fillStyle = palette.dark;
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
        ctx.fillStyle = palette.mid;
        ctx.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
        ctx.fillStyle = palette.light;
        ctx.fillRect(rect.x + 6, rect.y + 5, rect.w - 12, 3);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(rect.x + 3, rect.y + 3, 2, 2);
        ctx.fillRect(rect.x + rect.w - 5, rect.y + 3, 2, 2);
        ctx.fillRect(rect.x + 3, rect.y + rect.h - 5, 2, 2);
        ctx.fillRect(rect.x + rect.w - 5, rect.y + rect.h - 5, 2, 2);
      } else {
        ctx.fillStyle = "#f3f7f8";
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
        ctx.fillStyle = hovered ? palette.light : "#ffffff";
        ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 3);
      }

      iconDrawer(fullHighlight);
      drawBitmapText(
        label,
        textX,
        rect.y + 7,
        1,
        "center",
        fullHighlight ? COLORS.white : "#48555a",
        fullHighlight ? palette.dark : null
      );
    }

    function drawVersionLabel(x, y, align = "right", color = "#68787e") {
      drawBitmapText(RIBBIT_DISPLAY_VERSION, x, y, 0.50, align, color);
    }

    function drawPauseControls() {
      const button = PAUSE_UI.muteButton;
      const track = PAUSE_UI.sliderTrack;
      const continueButton = PAUSE_UI.continueButton;
      const restartButton = PAUSE_UI.restartButton;
      const home = PAUSE_UI.homeButton;
      const skin = getSelectedSkin();

      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      const mutePressed = game.pausePressedSelection === "mute";
      const muteHovered = game.pauseHoveredSelection === "mute";
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = mutePressed ? skin.mid : game.muted ? "#f2b0aa" : skin.belly;
      ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
      if (muteHovered && !mutePressed) {
        ctx.fillStyle = skin.light;
        ctx.fillRect(button.x + 5, button.y + 4, button.w - 10, 3);
      }
      drawMiniMuteIcon(button.x + 9, button.y + 2, game.muted);
      drawBitmapText(
        game.muted ? "UNMUTE" : "MUTE SOUNDS",
        button.x + 69,
        button.y + 6,
        1,
        "center",
        game.muted ? COLORS.redDark : skin.dark
      );

      drawBitmapText("VOLUME", 274, track.y - 2, 1, "right", "#48555a");
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(track.x - 2, track.y - 2, track.w + 4, track.h + 4);
      ctx.fillStyle = game.muted ? "#b8d8df" : skin.belly;
      ctx.fillRect(track.x, track.y, track.w, track.h);

      const filledWidth = Math.round(track.w * game.volume);
      if (filledWidth > 0) {
        ctx.fillStyle = game.muted ? "#7b9198" : skin.mid;
        ctx.fillRect(track.x, track.y, filledWidth, track.h);
      }

      const knobX = Math.round(track.x + track.w * game.volume);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(knobX - 3, track.y - 4, 7, track.h + 8);
      ctx.fillStyle = game.muted ? "#c3c9cb" : skin.light;
      ctx.fillRect(knobX - 1, track.y - 2, 3, track.h + 4);

      const continueFull = (game.pauseFocusVisible && game.pauseSelection === "continue") || game.pausePressedSelection === "continue";
      drawSelectablePauseButton(
        continueButton,
        game.pauseFocusVisible && game.pauseSelection === "continue",
        game.pauseHoveredSelection === "continue",
        game.pausePressedSelection === "continue",
        { dark: skin.dark, mid: skin.mid, light: skin.light },
        "CONTINUE",
        (full) => drawMiniPlayIcon(continueButton.x + 8, continueButton.y + 3, full ? COLORS.white : skin.dark),
        continueButton.x + continueButton.w / 2 + 10
      );

      drawSelectablePauseButton(
        restartButton,
        game.pauseFocusVisible && game.pauseSelection === "restart",
        game.pauseHoveredSelection === "restart",
        game.pausePressedSelection === "restart",
        { dark: "#6b4c21", mid: "#b78634", light: "#f2cf70" },
        "RESTART",
        (full) => drawMiniRestartIcon(restartButton.x + 8, restartButton.y + 3, full ? COLORS.white : "#7a5a2a"),
        restartButton.x + restartButton.w / 2 + 10
      );

      drawSelectablePauseButton(
        home,
        game.pauseFocusVisible && game.pauseSelection === "home",
        game.pauseHoveredSelection === "home",
        game.pausePressedSelection === "home",
        { dark: "#4b565b", mid: "#7d8a90", light: "#d8e1e4" },
        "HOME MENU",
        () => drawMiniHouseIcon(home.x + 7, home.y + 3),
        home.x + home.w / 2 + 10
      );

      const help = PAUSE_UI.helpButton;
      const helpActive = game.pauseHoveredSelection === "help" || game.pausePressedSelection === "help" || game.pauseHelpOpen;
      const bookTheme = getPauseBookTheme(helpActive);
      // Pause utility icons sit flush inside the panel without external drop shadows.
      ctx.fillStyle = bookTheme.frame; ctx.fillRect(help.x, help.y, help.w, help.h);
      ctx.fillStyle = bookTheme.buttonFill; ctx.fillRect(help.x + 2, help.y + 2, help.w - 4, help.h - 4);
      drawMiniBookIcon(help.x + help.w / 2, help.y + help.h / 2, bookTheme);
      if (game.pauseHelpOpen) drawPauseHowToOverlay();
    }

    function getPauseBookTheme(active = false) {
      const skin = getSelectedSkin();
      return {
        frame: active ? skin.dark : mixHexColors(skin.dark, COLORS.ink, 0.30),
        buttonFill: active
          ? mixHexColors(skin.belly, "#ffffff", 0.08)
          : mixHexColors(skin.belly, "#ffffff", 0.38),
        cover: skin.dark,
        coverHighlight: skin.mid,
        page: mixHexColors(skin.belly, "#ffffff", active ? 0.30 : 0.54),
        pageLine: mixHexColors(skin.dark, skin.mid, 0.54),
        spine: skin.mid,
        bookmark: skin.light
      };
    }

    function drawMiniBookIcon(cx, cy, theme = getPauseBookTheme(false)) {
      // The instruction book now inherits the currently selected frog palette.
      // Covers, pages, spine, page lines and bookmark all remain readable across
      // the default and custom color themes.
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(cx - 8, cy - 7, 16, 14);
      ctx.fillStyle = theme.cover;
      ctx.fillRect(cx - 7, cy - 6, 7, 12);
      ctx.fillRect(cx + 1, cy - 6, 7, 12);
      ctx.fillStyle = theme.coverHighlight;
      ctx.fillRect(cx - 6, cy - 5, 1, 10);
      ctx.fillRect(cx + 6, cy - 5, 1, 10);
      ctx.fillStyle = theme.page;
      ctx.fillRect(cx - 5, cy - 5, 4, 10);
      ctx.fillRect(cx + 2, cy - 5, 4, 10);
      ctx.fillStyle = theme.pageLine;
      ctx.fillRect(cx - 5, cy - 2, 3, 1);
      ctx.fillRect(cx - 5, cy + 1, 3, 1);
      ctx.fillRect(cx + 3, cy - 2, 3, 1);
      ctx.fillRect(cx + 3, cy + 1, 3, 1);
      ctx.fillStyle = theme.spine;
      ctx.fillRect(cx - 1, cy - 6, 2, 12);
      ctx.fillStyle = theme.bookmark;
      ctx.fillRect(cx + 4, cy - 6, 2, 5);
      ctx.fillRect(cx + 5, cy - 1, 1, 2);
    }

    function drawPauseHowToOverlay() {
      const panel = { x: 76, y: 70, w: 312, h: 138 };
      const mobileHelp = isRibbitMobileMode();
      const lines = game.mode === "pvp"
        ? (game.pvpCpuEnabled ? [
            mobileHelp ? "HOLD THE JUMP METER, THEN RELEASE" : "HOLD SPACE TO JUMP",
            "THE CPU CONTROLS PLAYER 2",
            "CATCH THE FLY THAT MATCHES THE PROMPT",
            game.pvpRoundGoalMode === "endless" ? "ENDLESS: MOST FLIES BEFORE TIME ENDS" : "FIRST TO THE GOAL WINS THE ROUND",
            "BONK OR BOUNCE OFF THE OTHER FROG TO STUN THEM"
          ] : [
            mobileHelp ? "P1: HOLD THE LEFT JUMP METER" : "P1: HOLD LEFT SHIFT TO JUMP",
            mobileHelp ? "P2: HOLD THE RIGHT JUMP METER" : "P2: HOLD RIGHT SHIFT TO JUMP",
            "CATCH THE FLY THAT MATCHES THE PROMPT",
            game.pvpRoundGoalMode === "endless" ? "ENDLESS: MOST FLIES BEFORE TIME ENDS" : "FIRST TO THE GOAL WINS THE ROUND",
            "BONK OR BOUNCE OFF THE OTHER FROG TO STUN THEM"
          ])
        : [
            mobileHelp ? "HOLD THE JUMP METER, THEN RELEASE" : "HOLD SPACE, RELEASE TO JUMP",
            "CATCH THE FLY THAT MATCHES THE PROMPT",
            "GET 5 CORRECT FLIES TO FINISH THE LEVEL",
            "WRONG FLIES GET SPAT BACK OUT",
            mobileHelp ? "TAP THE JUMP METER BEFORE LANDING TO DROP" : "TAP JUST BEFORE LANDING TO DROP THROUGH"
          ];
      const bookTheme = getPauseBookTheme(true);
      const bookSkin = getSelectedSkin();
      ctx.fillStyle = "rgba(18,33,41,0.62)"; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = "rgba(25,43,52,0.30)"; ctx.fillRect(panel.x + 3, panel.y + 3, panel.w, panel.h);
      ctx.fillStyle = bookTheme.frame; ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
      ctx.fillStyle = mixHexColors(bookSkin.belly, "#ffffff", 0.62);
      ctx.fillRect(panel.x + 2, panel.y + 2, panel.w - 4, panel.h - 4);
      ctx.fillStyle = bookSkin.mid; ctx.fillRect(panel.x + 4, panel.y + 4, panel.w - 8, 22);
      ctx.fillStyle = bookSkin.light; ctx.fillRect(panel.x + 6, panel.y + 6, panel.w - 12, 2);
      drawBitmapText("HOW TO PLAY", panel.x + panel.w / 2, panel.y + 9, 1, "center", COLORS.white, bookSkin.dark);
      lines.forEach((line, index) => drawBitmapText(line, panel.x + panel.w / 2, panel.y + 38 + index * 16, 0.68, "center", bookSkin.dark));
      ctx.fillStyle = mixHexColors(bookSkin.dark, bookSkin.mid, 0.56);
      ctx.fillRect(panel.x + 18, panel.y + panel.h - 21, panel.w - 36, 1);
      drawVersionLabel(panel.x + panel.w / 2, panel.y + panel.h - 14, "center", bookSkin.dark);
      const close = PAUSE_UI.helpCloseButton;
      const closeActive = game.pauseHoveredSelection === "help-close" || game.pausePressedSelection === "help-close";
      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(close.x + 2, close.y + 2, close.w, close.h);
      ctx.fillStyle = closeActive ? getSelectedSkin().dark : COLORS.ink;
      ctx.fillRect(close.x, close.y, close.w, close.h);
      ctx.fillStyle = closeActive ? getSelectedSkin().belly : "#f7fdff";
      ctx.fillRect(close.x + 2, close.y + 2, close.w - 4, close.h - 4);
      ctx.fillStyle = closeActive ? getSelectedSkin().mid : "#48555a";
      for (let index = 0; index < 9; index += 1) {
        ctx.fillRect(close.x + 5 + index, close.y + 5 + index, 2, 2);
        ctx.fillRect(close.x + 12 - index, close.y + 5 + index, 2, 2);
      }
    }

    function drawResumeCountdown() {
      if(OnlineVersus.preparingStart())return;
      if (game.state !== "countdown" || game.countdownNumber < 1) return;

      const elapsedInStep = CONFIG.resumeCountdownStepDuration - game.countdownTimer;
      const progress = clamp(elapsedInStep / CONFIG.resumeCountdownStepDuration, 0, 1);
      const pop = 1 + Math.sin(progress * Math.PI) * 0.16;
      const fade = 1 - Math.pow(progress, 4) * 0.30;

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(W / 2, 103);
      ctx.scale(pop, pop);
      ctx.fillStyle = "rgba(38,54,61,0.34)";
      ctx.fillRect(-31, -31, 64, 64);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(-29, -33, 58, 66);
      ctx.fillRect(-33, -29, 66, 58);
      ctx.fillStyle = getSelectedSkin().belly;
      ctx.fillRect(-26, -30, 52, 60);
      ctx.fillRect(-30, -26, 60, 52);
      drawBitmapText(String(game.countdownNumber), 0, -24, 6, "center", getSelectedSkin().mid, COLORS.ink);
      ctx.restore();
    }

    function achievementToastHasFlyBehind(toastRect) {
      if (game.soloCriticalCatchActive || game.pvpCriticalCatchActive) return false;
      for (const currentFly of flies) {
        const flyRect = { x: currentFly.x - 8, y: currentFly.y - 8, w: 16, h: 16 };
        if (overlapArea(toastRect, flyRect) > 0) return true;
        const placement = flyLabelPlacementCache.get(flyLabelCacheKey(currentFly));
        if (placement?.rect && overlapArea(toastRect, placement.rect) > 0) return true;
      }
      return false;
    }

    function drawAchievementToast() {
      if (game.achievementToastTimer <= 0) return;
      const pvpToastPlayer = Number.isInteger(game.achievementToastPvpPlayerIndex)
        ? pvpPlayers[game.achievementToastPvpPlayerIndex]
        : null;
      const skin = game.achievementToastSkinId
        ? getDisplaySkinById(game.achievementToastSkinId, "azure")
        : pvpToastPlayer
          ? getPvpSkinPalette(pvpToastPlayer.skinId, pvpToastPlayer.index === 0 ? "azure" : "crimson")
          : getSelectedSkin();
      if (!skin) return;

      const definition = game.achievementToastAchievementId
        ? getAchievementDefinition(game.achievementToastAchievementId)
        : null;
      const genericText = game.achievementToastText || "";
      const worldRecordToast = /WORLD RECORD|FRIENDS LEADER|FIRST PLACE|#1/.test(genericText);
      const toastSkin = worldRecordToast
        ? { dark:"#805316", mid:"#e5a72d", light:"#ffe27a", belly:"#fff3a8" }
        : skin;
      const hatToast = game.achievementToastHatId
        ? CUSTOM_HAT_OPTIONS.find((item) => item.id === game.achievementToastHatId)
        : null;
      const width = definition || hatToast ? 208 : genericText ? Math.max(178, measureBitmapText(genericText, 1) + 42) : 178;
      const height = 29;
      const left = Math.round((W - width) / 2);
      const top = 31;
      const life = game.achievementToastTimer / CONFIG.achievementToastDuration;
      const fade = Math.min(1, life * 4, (1 - life) * 5 + 0.1);

      const toastRect = { x: left, y: top, w: width, h: height };
      const opacityCap = achievementToastHasFlyBehind(toastRect)
        ? CONFIG.achievementToastObstructedOpacity
        : 1;
      ctx.save();
      ctx.globalAlpha = clamp(fade, 0, opacityCap);
      ctx.fillStyle = "rgba(18,31,38,0.38)";
      ctx.fillRect(left + 3, top + 3, width, height);
      ctx.fillStyle = toastSkin.dark;
      ctx.fillRect(left, top, width, height);
      ctx.fillStyle = mixHexColors(toastSkin.belly, toastSkin.mid, 0.22);
      ctx.fillRect(left + 3, top + 3, width - 6, height - 6);
      ctx.fillStyle = toastSkin.mid;
      ctx.fillRect(left + 7, top + 7, 30, height - 14);

      if (game.achievementToastSkinId) {
        drawMiniFrogSwatch(left + 11, top + 9, skin, 0.8);
        drawBitmapText("FROG UNLOCKED!", left + 108, top + 5, 1, "center", skin.dark);
        drawBitmapText(`${skin.name} FROG`, left + 109, top + 16, 1, "center", skin.dark);
      } else if (definition) {
        drawAchievementIcon(definition.icon, left + 13, top + 8, true, 0.82, skin);
        drawBitmapText("ACHIEVEMENT!", left + 124, top + 5, 1, "center", skin.dark);
        drawBitmapText(definition.name, left + 124, top + 16, 1, "center", skin.dark);
      } else if (hatToast) {
        drawPixelFrogHat(left + 22, top + 16, hatToast.id, .92, 1, { ...skin, previewCenterHat:true });
        drawBitmapText("HAT UNLOCKED!", left + 126, top + 5, 1, "center", skin.dark);
        drawBitmapText(hatToast.name, left + 126, top + 16, .92, "center", skin.dark);
      } else {
        if (worldRecordToast) drawPixelTrophy(left + 18, top + 7, false, .92);
        else drawMiniSun(left + 18, top + 15, false);
        drawBitmapText(genericText, left + width / 2 + 10, top + 10, 1, "center", toastSkin.dark);
      }
      ctx.restore();
    }


    function drawVictoryScreen() {
      const skin = getSelectedSkin();
      const layout = getVictoryUnlockNoticeLayout();
      const buttonRects = getVictoryButtonRects(layout);
      const panel = getVictoryPanelRect(layout);
      const centerX = panel.x + panel.w / 2;
      const offsetY = panel.y - 8;

      // Keep the shadow within the centered panel's horizontal bounds so the
      // complete card does not appear shifted to one side.
      ctx.fillStyle = "rgba(12,26,33,0.38)";
      ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h);
      ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8);
      ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);

      // The complete screen keeps the equipped frog's theme, independent of
      // whichever frog or level happened to unlock.
      ctx.fillStyle = skin.dark;
      ctx.fillRect(panel.x + 12, panel.y + 9, panel.w - 24, 41);
      ctx.fillStyle = skin.mid;
      ctx.fillRect(panel.x + 14, panel.y + 11, panel.w - 28, 36);
      ctx.fillStyle = skin.light;
      ctx.fillRect(panel.x + 17, panel.y + 13, panel.w - 34, 4);
      const endlessMode = isSoloEndlessMode();
      drawBitmapText(endlessMode ? "ENDLESS MODE!" : "FIVE FLIES!", centerX, panel.y + 20, endlessMode ? 2.3 : 3, "center", COLORS.white, skin.dark);

      const finalTime = getTimerTime();
      if (endlessMode) {
        drawBitmapText(`CAUGHT ${game.score} FLIES  •  TIME ${formatTime(finalTime)}`, centerX, 61 + offsetY, 1, "center", "#48555a");
        const bestLabel = game.newEndlessBest
          ? "NEW ENDLESS RECORD!"
          : `BEST ${game.bestEndlessFlies === null ? "--" : game.bestEndlessFlies} FLIES ON ${LEVELS[game.selectedLevelId]?.name || "STAGE"}`;
        drawBitmapText(bestLabel, centerX, 77 + offsetY, 1, "center", skin.dark);
      } else {
        drawBitmapText(`TIME ${formatTime(finalTime)}  •  ${game.jumps} JUMPS`, centerX, 61 + offsetY, 1, "center", "#48555a");
        if (game.newBestTime) drawNewBestCelebration(77 + offsetY);
        else drawBitmapText(`BEST ${game.bestTime === null ? "--:--.-" : formatTime(game.bestTime)}`, centerX, 77 + offsetY, 1, "center", skin.dark);
      }
      drawBitmapText(game.victoryMessage || "RIBBIT RACE COMPLETE!", centerX, 95 + offsetY, 1, "center", "#59666b");

      drawVictoryUnlockNotice(layout);
      drawVictoryButtons(buttonRects);
    }


    function clearFrogAfterimages(entity) {
      if (!entity) return;
      if (!Array.isArray(entity.afterimages)) entity.afterimages = [];
      entity.afterimages.length = 0;
      entity.afterimageSampleTimer = 0;
      entity.jumpStreakTimer = 0;
    }

    function beginHighPowerJumpStreak(entity, power, quickDrop = false) {
      if (!entity) return;
      clearFrogAfterimages(entity);
      if (!quickDrop && Number(power) >= CONFIG.jumpStreakPowerThreshold) {
        entity.jumpStreakTimer = CONFIG.jumpStreakEmissionSeconds;
        entity.afterimageSampleTimer = 0;
      }
    }

    function updateFrogAfterimages(entity, dt, palette, enabled = true) {
      if (!entity) return;
      if (!Array.isArray(entity.afterimages)) entity.afterimages = [];
      entity.afterimageSampleTimer = Math.max(0, Number(entity.afterimageSampleTimer || 0) - dt);
      entity.jumpStreakTimer = Math.max(0, Number(entity.jumpStreakTimer || 0) - dt);

      for (const image of entity.afterimages) image.life -= dt;
      while (entity.afterimages.length && entity.afterimages[0].life <= 0) entity.afterimages.shift();

      const maySample = Boolean(
        enabled &&
        game.state === "playing" &&
        !entity.grounded &&
        !entity.bonked &&
        !(Number(entity.stunTimer) > 0) &&
        entity.jumpStreakTimer > 0 &&
        Number(entity.vy) < -18
      );
      if (!maySample || entity.afterimageSampleTimer > 0) return;

      entity.afterimages.push({
        x: entity.x + entity.w / 2,
        y: entity.y + entity.h / 2,
        life: CONFIG.jumpStreakLifetime,
        maxLife: CONFIG.jumpStreakLifetime,
        mid: palette?.mid || palette?.light || COLORS.accentBlue,
        light: palette?.light || palette?.belly || COLORS.accentBlueLight,
        peakFade: clamp(Math.abs(Number(entity.vy) || 0) / 220, 0.22, 1)
      });
      if (entity.afterimages.length > CONFIG.jumpStreakMaxPoints) entity.afterimages.shift();
      entity.afterimageSampleTimer = CONFIG.jumpStreakSampleInterval;
    }

    function drawFrogAfterimages(entity) {
      if (!entity || !Array.isArray(entity.afterimages) || !entity.afterimages.length) return;
      ctx.save();
      for (const image of entity.afterimages) {
        const alpha = clamp(image.life / Math.max(0.001, image.maxLife), 0, 1) * (image.peakFade ?? 1) * 0.60;
        const centerX = Math.round(image.x);
        const centerY = Math.round(image.y);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = image.light;
        ctx.fillRect(centerX - 5, centerY - 2, 10, 4);
        ctx.fillStyle = image.mid;
        ctx.fillRect(centerX - 3, centerY - 1, 6, 2);
      }
      ctx.restore();
    }

    function getShadowSurfaceY(centerX, frogBottomY) {
      let surfaceY = CONFIG.groundY;
      for (const platform of platforms) {
        if (platform.ground) continue;
        if (centerX >= platform.x && centerX <= platform.x + platform.w && platform.y >= frogBottomY - 1) {
          surfaceY = Math.min(surfaceY, platform.y);
        }
      }
      return surfaceY;
    }

    function drawAirShadowForEntity(entity, palette = null) {
      if (!entity || entity.grounded) return;
      const centerX = entity.x + entity.w / 2;
      const bottomY = entity.y + entity.h;
      const surfaceY = getShadowSurfaceY(centerX, bottomY);
      const height = Math.max(0, surfaceY - bottomY);
      const width = clamp(Math.round(13 - height / 28), 5, 13);
      const alpha = clamp(0.34 - height / 520, 0.09, 0.34);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = (palette && palette.dark) || COLORS.ink;
      ctx.fillRect(Math.round(centerX - width/2), Math.round(surfaceY + 1), width, 2);
      if (width >= 9) ctx.fillRect(Math.round(centerX - (width-4)/2), Math.round(surfaceY), width-4, 1);
      ctx.restore();
    }
