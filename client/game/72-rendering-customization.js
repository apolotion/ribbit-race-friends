// Ribbit Race rendering responsibility: 72 rendering customization
    function drawOverlayPanel(title, lines, footer, useCrispText = false, layout = {}) {
      const x = layout.x ?? 91;
      const y = layout.y ?? 53;
      const w = layout.w ?? 298;
      const h = layout.h ?? 135;
      const titleOffset = layout.titleOffset ?? (useCrispText ? 17 : 16);
      const lineStartOffset = layout.lineStartOffset ?? (useCrispText ? 57 : 55);
      const lineGap = layout.lineGap ?? (useCrispText ? 15 : 14);
      const footerOffset = layout.footerOffset ?? (useCrispText ? 113 : 111);

      ctx.fillStyle = "rgba(25,43,52,0.45)";
      ctx.fillRect(x + 6, y + 7, w, h);

      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x + 4, y, w - 8, h);
      ctx.fillRect(x, y + 4, w, h - 8);

      ctx.fillStyle = COLORS.white;
      ctx.fillRect(x + 7, y + 4, w - 14, h - 8);
      ctx.fillRect(x + 4, y + 8, w - 8, h - 16);

      ctx.fillStyle = getSelectedSkin().belly;
      ctx.fillRect(x + 10, y + 10, w - 20, 32);
      ctx.fillStyle = getSelectedSkin().mid;
      ctx.fillRect(x + 10, y + 39, w - 20, 3);

      if (useCrispText) {
        drawBitmapText(title, W / 2, y + titleOffset, 2, "center", getSelectedSkin().dark);
        lines.forEach((line, index) => {
          drawBitmapText(
            line,
            W / 2,
            y + lineStartOffset + index * lineGap,
            1,
            "center",
            "#48555a"
          );
        });
      } else {
        drawPixelText(title, W / 2, y + titleOffset, 16, "center", getSelectedSkin().dark);
        lines.forEach((line, index) => {
          drawPixelText(
            line,
            W / 2,
            y + lineStartOffset + index * lineGap,
            9,
            "center",
            "#48555a"
          );
        });
      }

      if (footer) {
        const pulse = 0.65 + Math.sin(game.visualTime * 4.5454545) * 0.25;
        ctx.save();
        ctx.globalAlpha = pulse;
        if (useCrispText) {
          drawBitmapText(footer, W / 2, y + footerOffset, 1, "center", getSelectedSkin().dark, COLORS.ink);
        } else {
          drawPixelText(footer, W / 2, y + footerOffset, 10, "center", getSelectedSkin().dark);
        }
        ctx.restore();
      }
    }

    function drawEmptyTopHatOutline(centerX, frogTopY, scale = 1, color = "#8b989d") {
      const s = Math.max(0.7, Number(scale) || 1);
      const px = Math.max(1, Math.round(s));
      const left = Math.round(centerX - 8 * s);
      const top = Math.round(frogTopY - 12 * s);
      const dot = (x, y, w = 1, h = 1) => {
        ctx.fillRect(
          Math.round(left + x * s),
          Math.round(top + y * s),
          Math.max(px, Math.round(w * s)),
          Math.max(px, Math.round(h * s))
        );
      };
      ctx.save();
      ctx.globalAlpha *= 0.72;
      ctx.fillStyle = color;
      // Dashed crown outline.
      [0, 3, 6, 9].forEach((x) => dot(4 + x, 1, 2, 1));
      [0, 3, 6].forEach((y) => { dot(3, 2 + y, 1, 2); dot(15, 2 + y, 1, 2); });
      [0, 3, 6, 9].forEach((x) => dot(4 + x, 10, 2, 1));
      // Dashed brim outline.
      [0, 3, 6, 9, 12, 15].forEach((x) => dot(0 + x, 12, 2, 1));
      dot(0, 13, 1, 2); dot(17, 13, 1, 2);
      [0, 3, 6, 9, 12, 15].forEach((x) => dot(0 + x, 15, 2, 1));
      ctx.restore();
    }

    function drawPixelFrogHat(centerX, frogTopY, hatId = "none", scale = 1, direction = 1, paletteTheme = null) {
      if (!hatId || hatId === "none") return;
      const s = scale * 0.84;
      const hatVerticalOffset = Object.freeze({
        "plunger": 0.15,
        "traffic-cone": 0.12,
        "wizard-hat": 0.08,
        "flamboyant-flamenco": 0.08,
        "spartan-helmet": 0.05,
        "top-hat": 0.05,
        "straw-hat": 0.05,
        "cowboy-hat": 0.05,
        "sombrero": 0.05,
        "modest-pile": 0.02,
        "the-danger": 0.02,
      });
      const forwardLocked = new Set(["fedora", "wizard-hat", "milkman"]);
      const extraDownPixels = Object.freeze({
        "party-hat": 1,
        "mohawk": 1,
        "pink-bow": 2,
        "baseball-cap": 1,
        "headband": 2,
        "flower": 5,
        "washington-wig": 2,
        "lily-pad-hat": 1,
        "summer-shades": 4,
        "deal-with-it": 4,
        "afro": 1
      });
      const lift = Object.prototype.hasOwnProperty.call(hatVerticalOffset, hatId) ? hatVerticalOffset[hatId] : 0;
      const frontFacing = Boolean(paletteTheme?.frontFacing);
      const modelDirection = frontFacing ? 1 : (HAT_MODEL_FLIP_IDS.has(hatId) ? -1 : 1);
      const forwardPixels = paletteTheme?.previewCenterHat ? 0 : (forwardLocked.has(hatId) ? 0 : 1);
      const downPixels = Object.prototype.hasOwnProperty.call(extraDownPixels, hatId) ? extraDownPixels[hatId] : 0;
      const previewCenterAdjustX = paletteTheme?.previewCenterHat ? -1 * scale : 0;
      const previewHeadbandLift = hatId === "headband" && paletteTheme?.previewHatRenderScreen ? -2 : 0;
      const themeDark = paletteTheme?.dark || "#1c2b31";
      const themeMid = paletteTheme?.mid || paletteTheme?.accents || paletteTheme?.light || "#e8e8e1";
      const themeLight = paletteTheme?.light || paletteTheme?.belly || themeMid;
      ctx.save();
      ctx.translate(
        Math.round(frontFacing ? centerX : centerX + scale + previewCenterAdjustX + forwardPixels * scale * (direction < 0 ? -1 : 1)),
        Math.round(frogTopY + scale - lift * scale + downPixels * scale + (Number(paletteTheme?.previewHatYOffset) || 0) * scale + previewHeadbandLift * scale)
      );
      ctx.scale((direction < 0 ? -1 : 1) * modelDirection, 1);
      const rect = (x, y, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(x * s),
          Math.round(y * s),
          Math.max(1, Math.round(w * s)),
          Math.max(1, Math.round(h * s))
        );
      };
      if (hatId === "top-hat") {
        rect(-7,-2,14,3,"#171d21");
        rect(-5,-8,10,7,"#20272b");
        rect(-4,-7,8,4,"#343e44");
        rect(-4,-4,8,2,"#b72e3e");
        rect(-3,-7,3,1,"#78848a");
      } else if (hatId === "crown") {
        // Matches the compact three-point crowns used by the PvP score display.
        rect(-7,-2,14,4,"#8b5311");
        rect(-6,-5,12,4,"#e1a225");
        rect(-7,-8,4,6,"#ffd85a");
        rect(-2,-10,4,8,"#ffd85a");
        rect(3,-8,4,6,"#ffd85a");
        rect(-5,-5,2,2,themeDark);
        rect(-1,-6,2,2,themeMid);
        rect(3,-5,2,2,themeLight);
        rect(-4,-8,1,2,"#fff2a0");
        rect(0,-10,1,2,"#fff2a0");
        rect(4,-8,1,2,"#fff2a0");
      } else if (hatId === "party-hat") {
        rect(-6,-2,12,2,"#4a2364");
        rect(-5,-4,10,3,"#d657bc");
        rect(-4,-6,8,3,"#ffd75e");
        rect(-3,-8,6,3,"#0f9fbb");
        rect(-2,-10,4,3,"#7d3fa5");
        rect(-1,-12,2,2,"#ffffff");
        rect(1,-6,2,2,"#f7fdff");
        const confettiColors = ["#ff6f79", "#5ce5e8", "#ffd75e", "#d657bc", "#ffffff"];
        for (let i = 0; i < 7; i += 1) {
          const phase = (game.visualTime * (0.82 + i * 0.04) + i * 0.17) % 1;
          const drift = Math.sin(game.visualTime * 3 + i * 1.9) * 2;
          ctx.globalAlpha = Math.pow(1 - phase, 1.25);
          rect(-11 + i * 3.4 + drift, -17 + phase * 18, i % 2 ? 1 : 2, i % 2 ? 2 : 1, confettiColors[i % confettiColors.length]);
        }
        ctx.globalAlpha = 1;
      } else if (hatId === "hard-hat") {
        rect(-7,-2,14,3,"#9b5c0c");
        rect(-6,-5,12,4,"#f1b62f");
        rect(-4,-8,8,4,"#ffd34c");
        rect(-1,-9,2,7,"#a96813");
        rect(-4,-7,3,1,"#fff0a8");
        rect(3,-9,2,2,"#fff8c8");
      } else if (hatId === "mario-hat") {
        rect(-7,-2,14,3,"#75101f");
        rect(-6,-6,12,5,"#d63242");
        rect(-3,-9,8,4,"#d63242");
        rect(-2,-6,5,4,"#ffffff");
        rect(-1,-5,1,2,"#d63242");
        rect(1,-5,1,2,"#d63242");
        rect(-5,-6,3,1,"#f16c78");
      } else if (hatId === "viking") {
        rect(-6,-2,12,3,"#59666b");
        rect(-5,-6,10,5,"#aeb8bd");
        rect(-1,-8,2,6,"#6e7980");
        rect(-8,-6,3,3,"#f1dfb0");
        rect(-10,-8,3,4,"#f1dfb0");
        rect(5,-6,3,3,"#f1dfb0");
        rect(8,-8,3,4,"#f1dfb0");
        rect(-4,-5,3,1,"#e7edf0");
      } else if (hatId === "straw-hat") {
        rect(-8,-2,16,3,"#9a651e");
        rect(-7,-4,14,3,"#e5b85c");
        rect(-4,-8,8,5,"#eecb78");
        rect(-4,-4,8,2,"#b72e3e");
        rect(-3,-7,3,1,"#fff0a8");
      } else if (hatId === "beanie") {
        rect(-7,-2,14,3,"#26343d"); rect(-6,-6,12,5,"#3d7ca6"); rect(-4,-8,8,3,"#70b8d4"); rect(-1,-10,3,3,"#e2f4f7");
      } else if (hatId === "santa-hat") {
        rect(-7,-2,14,3,"#f7f4e8"); rect(-6,-5,11,4,"#d63b46"); rect(-4,-8,8,4,"#e94d56"); rect(2,-10,4,4,"#e94d56"); rect(5,-11,3,3,"#ffffff");
      } else if (hatId === "fedora") {
        rect(-8,-2,16,3,"#4a3428"); rect(-5,-7,10,6,"#76523b"); rect(-4,-5,8,2,"#2f2724"); rect(-2,-8,5,2,"#9b7658");
      } else if (hatId === "taco-hat") {
        rect(-9,-2,18,3,"#7f5220"); rect(-8,-5,16,3,"#f1c46b"); rect(-6,-7,12,3,"#f8dc8c");
        rect(-5,-6,3,2,"#58a55b"); rect(-1,-6,3,2,"#d64d42"); rect(3,-6,2,2,"#7a3fa7"); rect(1,-5,3,1,"#7f5220");
      } else if (hatId === "baseball-cap") {
        // Houston-inspired navy, orange, and white; one-row slimmer with a longer brim.
        rect(-7,-2,12,2,"#002d62"); rect(-5,-6,10,4,"#eb6e1f"); rect(-2,-8,6,3,"#002d62"); rect(4,-3,7,2,"#002d62");
        rect(-1,-5,3,2,"#ffffff"); rect(0,-5,1,2,"#eb6e1f");
      } else if (hatId === "wizard-hat") {
        rect(-8,-2,16,3,"#342060"); rect(-5,-5,11,4,"#55328d"); rect(-3,-9,8,5,"#6940a5"); rect(0,-13,5,5,"#7d58bd"); rect(-2,-7,2,2,"#ffd75e"); rect(2,-5,2,2,"#e6f4ff");
      } else if (hatId === "milkman") {
        rect(-7,-2,14,3,"#37556b"); rect(-6,-6,12,5,"#eef5f2"); rect(-4,-8,8,3,"#ffffff"); rect(-5,-4,10,2,"#5c9ac0"); rect(5,-3,4,2,"#dce9ec");
      } else if (hatId === "headphones") {
        rect(-8,-5,2,7,"#1b2228"); rect(6,-5,2,7,"#1b2228");
        rect(-6,-8,12,2,"#46555f"); rect(-7,-4,4,5,"#58b6d8"); rect(3,-4,4,5,"#58b6d8");
        rect(-6,-3,2,3,"#8fe8ef"); rect(4,-3,2,3,"#8fe8ef");
      } else if (hatId === "summer-shades") {
        rect(-8,-4,4,1,"#f0c52d"); rect(-4,-5,8,2,"#f0c52d"); rect(4,-4,4,1,"#f0c52d");
        rect(-7,-3,5,4,"#2b3237"); rect(2,-3,5,4,"#2b3237"); rect(-1,-2,2,2,"#f0c52d");
        rect(-6,-2,3,1,"#dfe6ea"); rect(3,-2,3,1,"#dfe6ea");
      } else if (hatId === "deal-with-it") {
        rect(-8,-4,5,1,"#0f1318"); rect(-3,-5,6,2,"#0f1318"); rect(3,-4,5,1,"#0f1318");
        rect(-7,-3,5,4,"#0f1318"); rect(2,-3,5,4,"#0f1318"); rect(-1,-2,2,2,"#0f1318");
        rect(-5,-2,1,1,"#dfe6ea"); rect(4,-2,1,1,"#dfe6ea");
      } else if (hatId === "spartan-helmet") {
        rect(-7,-2,14,3,"#8b6a22"); rect(-6,-8,12,7,"#c99b32"); rect(-2,-9,4,8,"#4e3521"); rect(-1,-14,3,6,"#b52f38"); rect(2,-13,3,5,"#b52f38");
      } else if (hatId === "mohawk") {
        rect(-5,-2,10,2,"#242a2d"); rect(-2,-10,2,8,"#ed5b70"); rect(0,-12,2,10,"#db4058"); rect(2,-9,2,7,"#a9233c"); rect(4,-6,1,4,"#ed5b70");
      } else if (hatId === "bucket") {
        // Oversized, dented galvanized bucket inspired by the classic garden-zombie silhouette.
        rect(-8,-2,16,3,"#4c5559"); rect(-7,-10,14,9,"#899398"); rect(-6,-12,12,3,"#b9c0c3");
        rect(-5,-9,9,2,"#d5dadd"); rect(4,-10,2,8,"#626b70"); rect(-6,-5,2,2,"#a84a3f");
        rect(5,-11,2,2,"#e1e5e7"); rect(-8,-8,2,6,"#586267");
      } else if (hatId === "beret") {
        rect(-7,-2,14,3,"#3b1e32"); rect(-5,-6,11,5,"#8c335e"); rect(-2,-8,6,3,"#a54b73"); rect(1,-9,2,2,"#34202b");
      } else if (hatId === "jester-hat") {
        rect(-7,-2,14,3,"#3d2454"); rect(-6,-7,6,6,"#cf3c6b"); rect(0,-7,6,6,"#5d54c8"); rect(-7,-10,4,4,"#cf3c6b"); rect(3,-10,4,4,"#5d54c8"); rect(-8,-11,2,2,"#ffd75e"); rect(6,-11,2,2,"#ffd75e");
      } else if (hatId === "hat-of-cards") {
        rect(-8,-2,16,3,"#2b1d12"); rect(-6,-9,12,8,"#5a3d26"); rect(-5,-8,10,5,"#795333");
        rect(-2,-6,4,2,"#d7c56f"); rect(-2,-10,4,1,"#dfdfd7");
      } else if (hatId === "candle-hat") {
        const flicker = Math.floor((game.visualTime * 10) % 3);
        rect(-4,-2,8,3,"#82582c"); rect(-3,-8,6,6,"#f6ead2"); rect(-1,-12,2,5,"#8b5b3a");
        rect(-2,-15 + (flicker === 1 ? -1 : 0),4,4,"#ffb64a"); rect(-1,-14 + (flicker === 2 ? -1 : 0),2,2,"#fff3a4");
      } else if (hatId === "headband") {
        rect(-8,-1,16,3,"#10151a"); rect(-7,0,14,1,"#58626c"); rect(7,-1,5,2,"#10151a"); rect(10,1,3,1,"#2d343c");
      } else if (hatId === "plunger") {
        rect(-6,-2,12,3,"#8c2f25"); rect(-4,-5,8,4,"#d0523c"); rect(-1,-13,3,9,"#8b6642"); rect(0,-15,2,3,"#b18a5c");
      } else if (hatId === "traffic-cone") {
        rect(-8,-2,16,3,"#66391c"); rect(-6,-5,12,4,"#f36b2b"); rect(-4,-9,8,5,"#ff7e35"); rect(-2,-13,4,5,"#f78a43"); rect(-5,-6,10,2,"#f7f3e5");
      } else if (hatId === "sombrero") {
        rect(-11,-2,22,3,"#8d5b19"); rect(-9,-4,18,3,"#d69b32"); rect(-5,-8,10,5,"#e8bb4d"); rect(-3,-10,6,3,"#f2ce67"); rect(-8,-3,3,1,"#c54843"); rect(5,-3,3,1,"#3d8fc5");
      } else if (hatId === "flamboyant-flamenco") {
        rect(-8,-2,16,3,"#381d2d"); rect(-6,-6,12,5,"#7a294e"); rect(-4,-8,8,3,"#a53b67"); rect(3,-13,3,7,"#e63d6a"); rect(5,-16,3,5,"#f36d8a"); rect(7,-18,2,4,"#ffd5df");

      } else if (hatId === "pirate-hat") {
        rect(-9,-2,18,3,"#171b20"); rect(-7,-6,14,5,"#24282e"); rect(-4,-9,8,4,"#2f3338"); rect(-1,-6,2,3,"#f5f2e7"); rect(-3,-5,6,1,"#f5f2e7");
      } else if (hatId === "hustlers-hallmark") {
        rect(-8,-2,16,3,"#65131f"); rect(-6,-8,12,7,"#bd2d3e"); rect(-5,-5,10,2,"#65131f"); rect(-3,-9,6,2,"#ef7180");
      } else if (hatId === "cowboy-hat") {
        rect(-10,-2,20,3,"#6d462a"); rect(-7,-5,14,4,"#9b6840"); rect(-5,-9,10,5,"#b27d50"); rect(-4,-5,8,2,"#4c3021");
      } else if (hatId === "the-danger") {
        rect(-8,-2,16,3,"#162229"); rect(-6,-7,12,6,"#273943"); rect(-4,-9,8,3,"#344a56"); rect(-5,-4,10,2,"#d44d42"); rect(4,-9,3,7,"#dfdfd7");
      } else if (hatId === "charmers-chapeau") {
        rect(-9,-2,18,3,"#3e2b49"); rect(-6,-7,12,6,"#7c4d8e"); rect(-5,-5,10,2,"#d7b44b"); rect(3,-12,3,6,"#5da75f"); rect(5,-14,3,4,"#79c774");
      } else if (hatId === "fez") {
        rect(-6,-2,12,3,"#6e1f2a"); rect(-5,-8,10,7,"#b32f43"); rect(-4,-9,8,2,"#d74858"); rect(4,-10,2,7,"#20282d"); rect(5,-11,3,2,"#20282d");
      } else if (hatId === "flower") {
        rect(-5,-4,2,5,"#4c9c57"); rect(-4,-8,5,5,"#e33d50"); rect(0,-9,5,5,"#ef5664");
        rect(-2,-11,4,4,"#f06b75"); rect(1,-6,4,4,"#c9263e"); rect(1,-8,2,6,"#ffd45d"); rect(2,-10,2,2,"#fff0a0");
      } else if (hatId === "afro") {
        rect(-8,-4,16,4,"#2d1a11"); rect(-9,-8,18,5,"#382015"); rect(-8,-12,16,5,"#44281a");
        rect(-5,-14,10,3,"#52311f"); rect(-2,-15,4,2,"#6a4026");
      } else if (hatId === "bunny-ears") {
        rect(-6,-2,12,3,"#d78cb8"); rect(-5,-12,3,11,"#ffffff"); rect(2,-12,3,11,"#ffffff");
        rect(-5,-3,3,2,"#ffffff"); rect(2,-3,3,2,"#ffffff"); rect(-4,-10,1,7,"#f4a2c4"); rect(3,-10,1,7,"#f4a2c4");
      } else if (hatId === "bowler-hat") {
        rect(-8,-2,16,3,"#232b31"); rect(-6,-7,12,6,"#38434a"); rect(-4,-9,8,3,"#54616a");
      } else if (hatId === "police-hat") {
        rect(-8,-2,16,3,"#162942"); rect(-6,-7,12,6,"#21456f"); rect(-3,-9,6,3,"#34659c"); rect(-2,-5,4,2,"#ffd45d");
      } else if (hatId === "fireman-hat") {
        rect(-8,-2,16,3,"#4a1d20"); rect(-6,-7,12,6,"#bf2f33"); rect(-4,-9,8,3,"#df5156"); rect(-2,-5,4,2,"#f0e8d2");
      } else if (hatId === "nurse-hat") {
        rect(-7,-2,14,3,"#d8dde2"); rect(-5,-7,10,5,"#ffffff"); rect(-1,-6,2,3,"#ef5f7a"); rect(-4,-5,9,1,"#ef5f7a"); rect(-1,-7,2,5,"#ef5f7a");
      } else if (hatId === "pokemon-hat") {
        rect(-8,-2,12,3,"#164a8d"); rect(-6,-6,10,5,"#efefef"); rect(-6,-9,10,4,"#e04152"); rect(3,-3,6,2,"#164a8d"); rect(-1,-5,2,2,"#242a2d");
      } else if (hatId === "pink-bow") {
        rect(-6,-6,4,4,"#f38bc0"); rect(2,-6,4,4,"#f38bc0"); rect(-1,-5,2,3,"#ffd6ea"); rect(-7,-5,2,2,"#f6b0d1"); rect(5,-5,2,2,"#f6b0d1");
      } else if (hatId === "sleeping-hat") {
        rect(-8,-2,16,3,"#ffffff"); rect(-7,-6,11,5,"#5d71cc"); rect(-4,-9,8,4,"#7f93ec"); rect(2,-12,4,4,"#7f93ec"); rect(5,-13,3,3,"#ffffff");
      } else if (hatId === "washington-wig") {
        // White and warm-white curls only; the old gray base is transparent.
        rect(-6,-8,12,7,"#f4f3eb"); rect(-4,-10,8,3,"#ffffff");
        rect(-9,-7,4,7,"#f4f3eb"); rect(5,-7,4,7,"#f4f3eb"); rect(-10,-5,3,3,"#ffffff"); rect(7,-5,3,3,"#ffffff");
        rect(-9,-1,3,3,"#ffffff"); rect(6,-1,3,3,"#ffffff"); rect(7,1,4,2,"#f4f3eb"); rect(9,2,2,3,"#ffffff");
      } else if (hatId === "leaf-hat") {
        rect(-6,-2,12,3,"#d46d6d"); rect(-4,-7,8,5,"#f2e5dc"); rect(-1,-9,2,2,"#d46d6d"); rect(3,-10,4,2,"#68b458"); rect(5,-12,2,2,"#84d16f");
      } else if (hatId === "lily-pad-hat") {
        rect(-8,-3,16,4,"#407a3f"); rect(-6,-5,12,3,"#5ea95b"); rect(0,-5,2,3,"#6fc86b"); rect(2,-4,4,1,"#2a5b2d"); rect(-1,-3,1,4,"#f39ac5"); rect(-2,-4,3,2,"#f7c4db");
      }
      const effectPhase = game.visualTime || 0;
      const fxRect = (x, y, w, h, color, alpha = 1) => { const prev = ctx.globalAlpha; ctx.globalAlpha = prev * alpha; rect(x, y, w, h, color); ctx.globalAlpha = prev; };
      if (hatId === "wizard-hat") {
        const orbit = effectPhase * 2.3;
        fxRect(Math.sin(orbit) * 7 - 1, -12 + Math.cos(orbit) * 3, 2, 2, "#6bbcff");
        fxRect(Math.sin(orbit + 2.1) * 7 - 1, -12 + Math.cos(orbit + 2.1) * 3, 3, 3, "#9ddf7c");
        fxRect(Math.sin(orbit + 4.2) * 7 - 1, -12 + Math.cos(orbit + 4.2) * 3, 2, 2, "#ffcc6f");
      } else if (hatId === "crown") {
        const sparkleCycle = (effectPhase % 5) / 5;
        if (sparkleCycle < 0.12) {
          const sparkSpots = [[-4,-9],[0,-11],[4,-9]];
          const spot = sparkSpots[Math.floor(effectPhase / 5) % sparkSpots.length];
          fxRect(spot[0], spot[1]-1, 1, 4, "#fff7c8", 0.95);
          fxRect(spot[0]-1, spot[1], 3, 1, "#fff7c8", 0.95);
        }
      } else if (hatId === "hard-hat") {
        const beamAlpha = 0.18 + Math.sin(effectPhase * 2.2) * 0.03;
        fxRect(5, -8, 4, 2, "#fff4a6", 0.55);
        fxRect(8, -8, 6, 3, "#fff0a0", beamAlpha);
        fxRect(13, -9, 7, 4, "#fff0a0", beamAlpha * 0.75);
        fxRect(20, -10, 8, 5, "#fff0a0", beamAlpha * 0.5);
      } else if (hatId === "lily-pad-hat") {
        for (let i = 0; i < 4; i += 1) {
          const bob = ((effectPhase * (1.1 + i * 0.08) + i * 0.22) % 1);
          const bubbleX = -7 + i * 5 + Math.sin(effectPhase * 2.4 + i) * 1.4;
          const bubbleSize = i % 2 === 0 ? 2 : 3;
          fxRect(bubbleX, -12 - bob * 6, bubbleSize, bubbleSize, "#d6fbff", 0.95 - bob * 0.5);
        }
      } else if (hatId === "washington-wig") {
        for (let i = 0; i < 3; i += 1) {
          const orbit = effectPhase * 1.65 + i * 2.05;
          const floatX = Math.sin(orbit) * 8;
          const floatY = -12 + Math.cos(orbit * 0.9) * 4;
          fxRect(floatX - 2, floatY - 2, 5, 3, "#79b45e", 0.92);
          fxRect(floatX - 1, floatY - 1, 3, 1, "#f7fdff", 0.96);
        }
      } else if (hatId === "hat-of-cards") {
        for (let i = 0; i < 3; i += 1) {
          const orbit = effectPhase * 1.9 + i * 2.1;
          const cx = Math.sin(orbit) * 8;
          const cy = -10 + Math.cos(orbit * 0.9) * 5;
          fxRect(cx - 2, cy - 3, 4, 6, "#fff8f0", 0.9);
          fxRect(cx - 1, cy - 2, 2, 2, i % 2 === 0 ? "#d63b46" : "#1d2228", 0.95);
        }
      } else if (hatId === "jester-hat") {
        const confettiColors = ["#cf3c6b", "#5d54c8", "#ffd75e", "#ffffff", "#7de6ff"];
        for (let i = 0; i < 7; i += 1) {
          const phase = (effectPhase * (0.86 + i * 0.05) + i * 0.16) % 1;
          const drift = Math.sin(effectPhase * 3.2 + i * 1.7) * 2.3;
          fxRect(-11 + i * 3.2 + drift, -17 + phase * 18, i % 2 ? 1 : 2, i % 2 ? 2 : 1, confettiColors[i % confettiColors.length], Math.pow(1 - phase, 1.15));
        }
      } else if (hatId === "santa-hat") {
        for (let i = 0; i < 6; i += 1) {
          const orbit = effectPhase * 1.5 + i * 1.05;
          fxRect(Math.sin(orbit) * 7, -10 + Math.cos(orbit * 1.15) * 5, 2, 2, "#ffffff", 0.78);
        }
        fxRect(-2, -9 + Math.sin(effectPhase * 2.4) * 1.2, 4, 4, "#e6f6ff", 0.34);
      } else if (hatId === "sleeping-hat") {
        const drawZ = (zx, zy, alpha=1) => {
          fxRect(zx, zy, 3, 1, "#ffffff", alpha);
          fxRect(zx + 2, zy + 1, 1, 1, "#ffffff", alpha);
          fxRect(zx + 1, zy + 2, 1, 1, "#ffffff", alpha);
          fxRect(zx, zy + 3, 3, 1, "#ffffff", alpha);
        };
        const z1 = (effectPhase * 0.7) % 1;
        const z2 = (effectPhase * 0.7 + 0.42) % 1;
        drawZ(7 + Math.round(Math.sin(effectPhase * 1.2)), -17 - z1 * 7, 0.95 - z1 * 0.45);
        drawZ(11 + Math.round(Math.sin(effectPhase * 1.0)), -22 - z2 * 7, 0.78 - z2 * 0.36);
      } else if (hatId === "nurse-hat") {
        for (let i = 0; i < 3; i += 1) {
          const phase = (effectPhase * 0.55 + i * 0.28) % 1;
          const px = -7 + i * 7 + Math.sin(effectPhase * 1.8 + i) * 1.5;
          const py = -15 - phase * 6;
          const alpha = 0.92 - phase * 0.5;
          fxRect(px, py + 1, 3, 1, "#f06f92", alpha);
          fxRect(px + 1, py, 1, 3, "#f06f92", alpha);
        }
      } else if (hatId === "pink-bow") {
        for (let i = 0; i < 2; i += 1) {
          const phase = (effectPhase * 0.62 + i * 0.45) % 1;
          const hx = -6 + i * 12 + Math.sin(effectPhase * 2 + i) * 1.5;
          const hy = -14 - phase * 5;
          const alpha = 0.88 - phase * 0.45;
          fxRect(hx, hy, 1, 1, "#ff9dc6", alpha);
          fxRect(hx + 2, hy, 1, 1, "#ff9dc6", alpha);
          fxRect(hx - 1, hy + 1, 5, 1, "#ff9dc6", alpha);
          fxRect(hx, hy + 2, 3, 1, "#ff9dc6", alpha);
          fxRect(hx + 1, hy + 3, 1, 1, "#ff9dc6", alpha);
        }
      } else if (hatId === "fez") {
        for (let i = 0; i < 5; i += 1) {
          const phase = (effectPhase * (0.35 + i * 0.04) + i * 0.19) % 1;
          fxRect(-8 + i * 4 + Math.sin(effectPhase * 1.5 + i) * 1.2, -11 + phase * 5, 1, 1, "#d7c28f", 0.65 - phase * 0.3);
        }
      } else if (hatId === "headphones") {
        for (let i = 0; i < 3; i += 1) {
          const phase = (effectPhase * 0.7 + i * 0.27) % 1;
          const nx = 6 + i * 3;
          const ny = -15 - phase * 7;
          const alpha = 0.85 - phase * 0.35;
          fxRect(nx, ny, 1, 3, "#8fe8ef", alpha);
          fxRect(nx + 1, ny - 1, 2, 1, "#8fe8ef", alpha);
          fxRect(nx + 3, ny - 2, 1, 1, "#8fe8ef", alpha);
        }
      } else if (hatId === "charmers-chapeau") {
        const confettiColors = ["#9d6cff", "#57c86d", "#d8c0ff", "#d7ffb8"];
        for (let i = 0; i < 6; i += 1) {
          const phase = (effectPhase * (0.78 + i * 0.05) + i * 0.18) % 1;
          const drift = Math.sin(effectPhase * 2.7 + i) * 2;
          fxRect(-9 + i * 3.6 + drift, -18 + phase * 16, i % 2 ? 1 : 2, i % 2 ? 2 : 1, confettiColors[i % confettiColors.length], Math.pow(1 - phase, 1.18));
        }
      }
      ctx.restore();
    }

    function drawSideEyeOverHat(centerX, frogTopY, palette, direction = 1, blinking = false, scale = 1, eyeOffset = 5) {
      const s = scale;
      const housingX = Math.round((eyeOffset - 1) * s);
      const housingY = Math.round(0 * s);
      const housingW = Math.max(1, Math.round(5 * s));
      const housingH = Math.max(1, Math.round(5 * s));
      ctx.save();
      ctx.translate(Math.round(centerX), Math.round(frogTopY));
      ctx.scale(direction < 0 ? -1 : 1, 1);
      // Redraw the complete dark eye housing above the hat, not only the white
      // eye, so the sprite keeps its original outlined silhouette.
      ctx.fillStyle = palette.dark;
      ctx.fillRect(housingX, housingY, housingW, housingH);
      ctx.fillStyle = palette.bump || palette.crest || palette.accents || palette.light;
      ctx.fillRect(Math.round(eyeOffset * s), Math.round(1 * s), Math.max(1, Math.round(3 * s)), Math.max(1, Math.round(4 * s)));
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(Math.round(eyeOffset * s), Math.round(1 * s), Math.max(1, Math.round(3 * s)), Math.max(1, Math.round(3 * s)));
      ctx.fillStyle = COLORS.ink;
      if (blinking) {
        ctx.fillRect(Math.round(eyeOffset * s), Math.round(3 * s), Math.max(1, Math.round(3 * s)), Math.max(1, Math.round(1 * s)));
      } else {
        ctx.fillRect(Math.round((eyeOffset + 2) * s), Math.round(2 * s), Math.max(1, Math.round(1 * s)), Math.max(1, Math.round(2 * s)));
      }
      ctx.restore();
    }

    function drawFrontEyesOverHat(centerX, frogTopY, palette, scale = 1) {
      const s = scale;
      const positions = [-7, 4];
      positions.forEach((offset) => {
        ctx.fillStyle = palette.dark;
        ctx.fillRect(Math.round(centerX + (offset - 1) * s), Math.round(frogTopY), Math.max(1, Math.round(5 * s)), Math.max(1, Math.round(5 * s)));
        ctx.fillStyle = palette.bump || palette.crest || palette.accents || palette.light;
        ctx.fillRect(Math.round(centerX + offset * s), Math.round(frogTopY + 1 * s), Math.max(1, Math.round(3 * s)), Math.max(1, Math.round(4 * s)));
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(Math.round(centerX + offset * s), Math.round(frogTopY + 1 * s), Math.max(1, Math.round(3 * s)), Math.max(1, Math.round(3 * s)));
      });
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(Math.round(centerX - 6 * s), Math.round(frogTopY + 2 * s), Math.max(1, Math.round(1 * s)), Math.max(1, Math.round(2 * s)));
      ctx.fillRect(Math.round(centerX + 5 * s), Math.round(frogTopY + 2 * s), Math.max(1, Math.round(1 * s)), Math.max(1, Math.round(2 * s)));
    }

    function drawMiniFrogEyeExact(x, y, skin, scale = 1, blinking = false) {
      const s = scale;
      const eyeBump = skin.bump || skin.crest || skin.light;
      ctx.fillStyle = skin.dark;
      ctx.fillRect(Math.round(x + 10 * s), Math.round(y), Math.max(1, Math.round(5 * s)), Math.max(1, Math.round(5 * s)));
      ctx.fillStyle = eyeBump;
      ctx.fillRect(Math.round(x + 11 * s), Math.round(y + 1 * s), Math.max(1, Math.round(3 * s)), Math.max(1, Math.round(4 * s)));
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(Math.round(x + 11 * s), Math.round(y + 1 * s), Math.max(1, Math.round(3 * s)), Math.max(1, Math.round(3 * s)));
      ctx.fillStyle = COLORS.ink;
      if (blinking) {
        ctx.fillRect(Math.round(x + 11 * s), Math.round(y + 3 * s), Math.max(1, Math.round(3 * s)), Math.max(1, Math.round(1 * s)));
      } else {
        ctx.fillRect(Math.round(x + 13 * s), Math.round(y + 2 * s), Math.max(1, Math.round(1 * s)), Math.max(1, Math.round(2 * s)));
      }
    }

    function drawMiniFrogSwatch(x, y, skin, scale = 1) {
      // Menu frogs are the grounded gameplay sprite itself, not a separate model.
      const gameplayPalette = {
        ...skin,
        previewHatYOffset: 0,
        previewHatRenderScreen: false
      };
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      ctx.scale(scale, scale);
      drawGameplayFrogSpriteLocal(gameplayPalette, false, false);
      ctx.restore();
    }

    function drawMiniFrogSwatchFacing(centerX, y, skin, scale = 1, direction = 1) {
      const gameplayPalette = {
        ...skin,
        previewHatYOffset: 0,
        previewHatRenderScreen: false
      };
      ctx.save();
      ctx.translate(Math.round(centerX), Math.round(y));
      ctx.scale((direction < 0 ? -1 : 1) * scale, scale);
      ctx.translate(-11, 0);
      drawGameplayFrogSpriteLocal(gameplayPalette, false, false);
      ctx.restore();
    }

    function drawMiniLockIcon(centerX, topY, scale = 1) {
      const s = scale;
      ctx.fillStyle = "#4f5b60";
      ctx.fillRect(centerX - 4 * s, topY + 5 * s, 9 * s, 7 * s);
      ctx.fillRect(centerX - 3 * s, topY + 2 * s, 7 * s, 5 * s);
      ctx.fillStyle = "#dfe7e9";
      ctx.fillRect(centerX - 2 * s, topY + 3 * s, 5 * s, 3 * s);
      ctx.fillStyle = "#7d8a90";
      ctx.fillRect(centerX - 2 * s, topY + 7 * s, 5 * s, 3 * s);
      ctx.fillStyle = "#354147";
      ctx.fillRect(centerX, topY + 8 * s, 1 * s, 2 * s);
    }

    function drawMiniOpenLockIcon(centerX, topY, scale = 1, palette = null) {
      const s = scale;
      const skin = palette || getSelectedSkin();
      const dark = skin.dark || "#4f5b60";
      const mid = skin.mid || "#7d8a90";
      const light = skin.light || "#dfe7e9";

      // Body.
      ctx.fillStyle = dark;
      ctx.fillRect(centerX - 4 * s, topY + 6 * s, 9 * s, 6 * s);
      ctx.fillStyle = light;
      ctx.fillRect(centerX - 2 * s, topY + 7 * s, 5 * s, 2 * s);
      ctx.fillStyle = mid;
      ctx.fillRect(centerX - 2 * s, topY + 9 * s, 5 * s, 2 * s);
      ctx.fillStyle = dark;
      ctx.fillRect(centerX, topY + 9 * s, 1 * s, 2 * s);

      // Open shackle: the right stem ends well above the body, leaving a clear gap.
      ctx.fillStyle = dark;
      ctx.fillRect(centerX - 3 * s, topY + 2 * s, 2 * s, 5 * s);
      ctx.fillRect(centerX - 2 * s, topY + 1 * s, 7 * s, 2 * s);
      ctx.fillRect(centerX + 4 * s, topY + 1 * s, 2 * s, 3 * s);
      ctx.fillStyle = light;
      ctx.fillRect(centerX - 1 * s, topY + 2 * s, 4 * s, 1 * s);
    }

    function drawSetupSkinButton(button) {
      const skin = getDisplaySkinById(button.id, "azure");
      const focused = (game.setupSkinFocusId || game.skinId) === button.id;
      const unlocked = isFrogSkinUnlocked(button.id);

      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      ctx.fillStyle = focused ? COLORS.ink : "#8fa6ac";
      ctx.fillRect(button.x, button.y, button.w, button.h);

      if (!unlocked) {
        ctx.fillStyle = focused ? "#909ca1" : "#cbd4d7";
        ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
        ctx.fillStyle = focused ? "#b7c1c5" : "#edf2f4";
        ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, 4);
      } else if (focused) {
        ctx.fillStyle = skin.dark;
        ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
        ctx.fillStyle = skin.mid;
        ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, button.h - 8);
        ctx.fillStyle = skin.light;
        ctx.fillRect(button.x + 6, button.y + 5, button.w - 12, 3);
      } else {
        ctx.fillStyle = "#f7fdff";
        ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
        ctx.fillStyle = skin.light;
        ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, 4);
      }

      const idleBob = focused && unlocked
        ? getTwoFrameMenuBob(FROG_SKIN_ORDER.indexOf(button.id) * 0.13)
        : 0;
      ctx.save();
      if (!unlocked) ctx.globalAlpha = 0.34;
      drawMiniFrogSwatchFacing(button.x + 17, button.y + 11 + idleBob, { ...skin, previewHatYOffset: 1 }, 0.75, 1);
      ctx.restore();

      drawBitmapText(
        skin.name,
        button.x + 53,
        button.y + 9,
        1,
        "center",
        focused && unlocked ? COLORS.white : unlocked ? "#34484f" : "#5c686d",
        focused && unlocked ? skin.dark : null
      );

      if (!unlocked) {
        drawMiniLockIcon(button.x + 80, button.y + 6, 0.75);
      } else if (game.skinId === button.id) {
        drawMiniCheckmark(button.x + button.w - 13, button.y + button.h - 11, focused ? COLORS.white : skin.dark);
      }

    }

    function drawSetupCustomButton() {
      const button = SETUP_UI.customButton;
      const focused = game.setupSkinFocusId === "custom";
      const unlocked = isCustomColorUnlocked();
      const skin = getCustomFrogSkin();
      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      ctx.fillStyle = focused ? COLORS.ink : "#8fa6ac";
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = unlocked ? (focused ? skin.belly : "#f7fdff") : "#cbd4d7";
      ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
      ctx.fillStyle = unlocked ? skin.light : "#edf2f4";
      ctx.fillRect(button.x + 5, button.y + 4, button.w - 10, 3);
      ctx.save();
      if (!unlocked) ctx.globalAlpha = 0.30;
      drawMiniPainterPaletteIcon(button.x + button.w / 2, button.y + button.h / 2 + (focused && unlocked ? getTwoFrameMenuBob(0.35) : 0), 0.48, skin);
      ctx.restore();
      if (!unlocked) drawMiniLockIcon(button.x + button.w / 2, button.y + 6, 0.72);
      if (focused) {
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(button.x + 3, button.y + 3, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2);
      }
    }

    function drawSetupSandboxButton() {
      const button = SETUP_UI.sandboxButton;
      const focused = game.setupSkinFocusId === "sandbox";
      const skin = getSelectedSkin();
      ctx.fillStyle = "rgba(25,43,52,0.28)"; ctx.fillRect(button.x + 2, button.y + 2, button.w, button.h);
      ctx.fillStyle = focused ? COLORS.ink : "#8fa6ac"; ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = focused ? skin.belly : "#f7fdff"; ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
      ctx.fillStyle = skin.light; ctx.fillRect(button.x + 5, button.y + 4, button.w - 10, 3);
      const cx = Math.round(button.x + button.w / 2);
      const cy = Math.round(button.y + button.h / 2);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.48); ctx.scale(0.86,0.86);
      ctx.fillStyle = skin.dark; ctx.fillRect(-1, -8, 3, 12); ctx.fillRect(-4, -9, 9, 3);
      ctx.fillStyle = skin.mid; ctx.fillRect(-5, 3, 11, 5); ctx.fillRect(-3, 7, 7, 2);
      ctx.fillStyle = skin.light; ctx.fillRect(-3, 4, 6, 1);
      ctx.restore();
      if (focused) { ctx.fillStyle = COLORS.white; ctx.fillRect(button.x + 3, button.y + 3, 2, 2); ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2); }
    }

    function resetFrogSandbox() {
      sandboxFrog.x = SANDBOX_LEVEL.startX;
      sandboxFrog.y = SANDBOX_GROUND_Y - sandboxFrog.h;
      sandboxFrog.vx = 0;
      sandboxFrog.vy = 0;
      sandboxFrog.dir = 1;
      sandboxFrog.grounded = true;
      sandboxFrog.charging = false;
      sandboxFrog.charge = 0.04;
      sandboxFrog.chargeDirection = 1;
      sandboxFrog.landingSquash = 0;
      sandboxActionHeld = false;
    }

    function openFrogSandbox(playFeedback = true) {
      game.sandboxPreviousLevelId = game.selectedLevelId || "park";
      game.sandboxPreviousTimeOfDay = game.timeOfDay;
      game.sandboxMode = true;
      game.mode = "solo";
      game.selectedLevelId = "sandbox";
      applySelectedLevel();
      resetMovingPlatforms();
      resetGame(true);
      prepareSandboxRound();
      game.state = "playing";
      if (playFeedback) {
        tone(455, 0.055, 0.014, 65);
        tone(690, 0.075, 0.011, 85, 0.045);
      }
    }

    function closeFrogSandbox(playFeedback = true) {
      sandboxPreview.mode="play";flies.length=0;tongue.active=false;
      game.sandboxMode = false;
      game.selectedLevelId = LEVELS[game.sandboxPreviousLevelId] ? game.sandboxPreviousLevelId : "park";
      if (game.sandboxPreviousTimeOfDay) game.timeOfDay = game.sandboxPreviousTimeOfDay;
      applySelectedLevel();
      openSetupMenu(false);
      game.setupSkinFocusId = "sandbox";
      if (playFeedback) tone(330, 0.05, 0.012, -45);
    }

    function pressFrogSandboxAction() {
      if (sandboxActionHeld || game.state !== "frogSandbox") return;
      sandboxActionHeld = true;
      if (sandboxFrog.grounded) {
        sandboxFrog.charging = true;
        sandboxFrog.charge = 0.04;
        sandboxFrog.chargeDirection = 1;
        tone(95, 0.035, 0.010, 8);
      }
    }

    function releaseFrogSandboxAction() {
      if (!sandboxActionHeld) return;
      sandboxActionHeld = false;
      if (!sandboxFrog.charging || !sandboxFrog.grounded) return;
      const power = clamp(sandboxFrog.charge, 0, 1);
      sandboxFrog.vx = sandboxFrog.dir * lerp(CONFIG.minimumJumpX, CONFIG.maximumJumpX, power);
      sandboxFrog.vy = -lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, power);
      sandboxFrog.grounded = false;
      sandboxFrog.charging = false;
      sandboxFrog.landingSquash = 0;
      playJumpSound(power);
    }

    function updateFrogSandbox(dt) {
      sandboxFrog.landingSquash = Math.max(0, sandboxFrog.landingSquash - dt * 4.5);
      if (sandboxFrog.charging) {
        sandboxFrog.charge += sandboxFrog.chargeDirection * dt / CONFIG.chargeSecondsOneWay;
        if (sandboxFrog.charge >= 1) { sandboxFrog.charge = 1; sandboxFrog.chargeDirection = -1; }
        else if (sandboxFrog.charge <= 0.04) { sandboxFrog.charge = 0.04; sandboxFrog.chargeDirection = 1; }
      }
      if (sandboxFrog.grounded) return;
      const previousBottom = sandboxFrog.y + sandboxFrog.h;
      sandboxFrog.vy += CONFIG.gravity * dt;
      sandboxFrog.x += sandboxFrog.vx * dt;
      sandboxFrog.y += sandboxFrog.vy * dt;
      if (sandboxFrog.x <= 34) { sandboxFrog.x = 34; sandboxFrog.vx = Math.abs(sandboxFrog.vx); sandboxFrog.dir = 1; }
      else if (sandboxFrog.x + sandboxFrog.w >= W - 34) { sandboxFrog.x = W - 34 - sandboxFrog.w; sandboxFrog.vx = -Math.abs(sandboxFrog.vx); sandboxFrog.dir = -1; }

      if (sandboxFrog.vy >= 0) {
        const currentBottom = sandboxFrog.y + sandboxFrog.h;
        let landing = null;
        for (const platform of SANDBOX_STAGE_PLATFORMS) {
          if (
            previousBottom <= platform.y + 1.5 &&
            currentBottom >= platform.y &&
            horizontalOverlap(sandboxFrog.x, sandboxFrog.w, platform)
          ) {
            if (!landing || platform.y < landing.y) landing = platform;
          }
        }
        if (landing) {
          sandboxFrog.y = landing.y - sandboxFrog.h;
          sandboxFrog.vx = 0;
          sandboxFrog.vy = 0;
          sandboxFrog.grounded = true;
          sandboxFrog.landingSquash = 1;
          tone(88, 0.04, 0.014, -15);
        }
      }

      if (sandboxFrog.y > CONFIG.playBottom + 40) resetFrogSandbox();
    }

    function drawSandboxStageBackdrop() {
      drawBackground("park");
      for (const platform of PARK_PLATFORMS) drawPlatform(platform, "park");
      drawTimeOfDayWorldTint("park");
      ctx.fillStyle = "rgba(18,33,41,0.10)";
      ctx.fillRect(0, 0, W, CONFIG.playBottom);
    }

    function drawFrogSandboxScreen() {
      const panel = SANDBOX_PANEL;
      const view = FROG_SANDBOX_UI.view;
      ctx.fillStyle = "rgba(18,33,41,0.18)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(12,26,33,0.35)"; ctx.fillRect(panel.x + 7, panel.y + 8, panel.w, panel.h);
      ctx.fillStyle = COLORS.ink; ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h); ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
      ctx.fillStyle = "#f7fdff"; ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8); ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);
      ctx.fillStyle = PVP_NEUTRAL_PALETTE.dark; ctx.fillRect(panel.x + 12, panel.y + 9, panel.w - 24, 28);
      ctx.fillStyle = PVP_NEUTRAL_PALETTE.mid; ctx.fillRect(panel.x + 14, panel.y + 11, panel.w - 28, 24);
      ctx.fillStyle = PVP_NEUTRAL_PALETTE.light; ctx.fillRect(panel.x + 17, panel.y + 13, panel.w - 34, 4);
      drawBitmapText("FROG SANDBOX", W / 2, panel.y + 15, 1.15, "center", COLORS.white, PVP_NEUTRAL_PALETTE.dark);
      const close = FROG_SANDBOX_UI.exitButton;
      ctx.fillStyle = COLORS.ink; ctx.fillRect(close.x, close.y, close.w, close.h);
      ctx.fillStyle = "#f7fdff"; ctx.fillRect(close.x + 2, close.y + 2, close.w - 4, close.h - 4);
      ctx.fillStyle = PVP_NEUTRAL_PALETTE.dark;
      for (let i = 0; i < 8; i += 1) { ctx.fillRect(close.x + 5 + i, close.y + 5 + i, 1, 1); ctx.fillRect(close.x + 13 - i, close.y + 5 + i, 1, 1); }
      ctx.fillStyle = COLORS.ink; ctx.fillRect(view.x, view.y, view.w, view.h);
      ctx.fillStyle = "#f7fdff"; ctx.fillRect(view.x + 2, view.y + 2, view.w - 4, view.h - 4);
      ctx.save();
      ctx.beginPath(); ctx.rect(view.x + 2, view.y + 2, view.w - 4, view.h - 4); ctx.clip();
      ctx.translate(view.x + 2, view.y + 2);
      ctx.scale((view.w - 4) / W, (view.h - 4) / CONFIG.playBottom);
      drawSandboxStageBackdrop();
      const skin = getSelectedSkin();
      const sx = 1 + sandboxFrog.landingSquash * 0.15 + (sandboxFrog.charging ? sandboxFrog.charge * 0.12 : 0);
      ctx.save();
      ctx.translate(sandboxFrog.x + sandboxFrog.w / 2, sandboxFrog.y + sandboxFrog.h);
      ctx.scale(sx, 1 / Math.sqrt(sx));
      drawMiniFrogSwatchFacing(0, -14, skin, 1.55, sandboxFrog.dir);
      ctx.restore();
      if (sandboxFrog.charging) {
        const vx = sandboxFrog.dir * lerp(CONFIG.minimumJumpX, CONFIG.maximumJumpX, sandboxFrog.charge);
        const vy = -lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, sandboxFrog.charge);
        ctx.save();
        for (let t = 0.08; t <= Math.max(0.08, -vy / CONFIG.gravity); t += 0.11) {
          const px = sandboxFrog.x + sandboxFrog.w / 2 + vx * t;
          const py = sandboxFrog.y + sandboxFrog.h / 2 + vy * t + 0.5 * CONFIG.gravity * t * t;
          if (px < 0 || px > W || py < 0 || py > SANDBOX_GROUND_Y) continue;
          ctx.globalAlpha = clamp(1 - t * 0.75, 0.18, 0.9);
          ctx.fillStyle = skin.light;
          ctx.fillRect(Math.round(px - 1), Math.round(py - 1), 3, 3);
        }
        ctx.restore();
      }
      ctx.restore();
      drawBitmapText("A/D FACE • HOLD JUMP • RELEASE TO LEAP • ESC TO EXIT", W / 2, panel.y + panel.h - 18, 0.62, "center", "#58666b");
    }

    function drawSetupScreen() {
      const focusId = game.setupSkinFocusId || game.skinId;
      const displayFocusId = (focusId === "hat" || focusId === "sandbox") ? game.skinId : focusId;
      const skin = getSetupFocusedSkin();
      const unlocked = displayFocusId === "back"
        ? true
        : displayFocusId === "custom" ? isCustomColorUnlocked() : isFrogSkinUnlocked(displayFocusId);
      const achievement = focusId === "hat" || focusId === "sandbox" || displayFocusId === "back"
        ? { lines: [] }
        : displayFocusId === "custom"
          ? { lines: focusId === "custom" ? ["COMPLETE EVERY LEVEL", "IN 30 SECONDS OR LESS"] : [] }
          : (FROG_SKIN_ACHIEVEMENTS[displayFocusId] || { lines: [] });

      // A separate skin-themed backdrop makes customization feel like its own
      // menu rather than a second level-select screen.
      const backdrop = ctx.createLinearGradient(0, 0, 0, H);
      backdrop.addColorStop(0, skin.dark);
      backdrop.addColorStop(0.58, skin.mid);
      backdrop.addColorStop(1, skin.belly);
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = unlocked ? 0.15 : 0.10;
      ctx.fillStyle = skin.light;
      for (let x = -18; x < W; x += 56) {
        const cloudY = 30 + ((x + 18) % 21);
        ctx.fillRect(x, cloudY + 7, 40, 8);
        ctx.fillRect(x + 8, cloudY, 24, 18);
      }
      ctx.fillStyle = skin.dark;
      for (let x = 4; x < W; x += 50) {
        const hillY = 222 - (x % 15);
        ctx.fillRect(x, hillY, 38, H - hillY);
        ctx.fillRect(x + 8, hillY - 10, 22, 13);
      }
      ctx.restore();

      const panel = { x: 28, y: 10, w: 424, h: 250 };
      ctx.fillStyle = "rgba(12,26,33,0.34)";
      ctx.fillRect(panel.x + 7, panel.y + 8, panel.w, panel.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h);
      ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8);
      ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);

      ctx.fillStyle = skin.dark;
      ctx.fillRect(panel.x + 12, panel.y + 9, panel.w - 24, 39);
      ctx.fillStyle = skin.mid;
      ctx.fillRect(panel.x + 14, panel.y + 11, panel.w - 28, 34);
      ctx.fillStyle = skin.light;
      ctx.fillRect(panel.x + 17, panel.y + 13, panel.w - 34, 4);
      drawBitmapText("RIBBIT RACE", W / 2, panel.y + 17, 2, "center", COLORS.white, skin.dark);
      drawBitmapText("FROG COLOR", W / 2, panel.y + 37, 1, "center", COLORS.white, skin.dark);

      // Preview the focused color even when it is still locked. The lock icon
      // carries the state by itself, so no separate LOCKED label consumes space.
      // It sits below the title plaque instead of crowding the FROG COLOR label.
      ctx.fillStyle = "rgba(25,43,52,0.20)";
      ctx.fillRect(202, 59, 76, 34);
      ctx.fillStyle = unlocked ? skin.belly : "#d1d9dc";
      ctx.fillRect(204, 61, 72, 30);
      ctx.fillStyle = unlocked ? skin.light : "#aeb9bd";
      ctx.fillRect(207, 64, 66, 3);
      const previewBob = unlocked ? getTwoFrameMenuBob(0.08) : 0;
      ctx.save();
      if (!unlocked) ctx.globalAlpha = 0.38;
      drawMiniFrogSwatchFacing(240, 74 + previewBob, { ...skin, previewHatYOffset: 1, previewHatRenderScreen: true }, 1.35, 1);
      ctx.restore();
      if (!unlocked) drawMiniLockIcon(240, 72, 1.0);

      drawBitmapText(displayFocusId === "custom" ? "CUSTOM FROG" : `${skin.name} FROG`, W / 2, 99, 1, "center", skin.dark);
      const achievementStartY = 112;
      achievement.lines.forEach((line, index) => {
        drawBitmapText(line, W / 2, achievementStartY + index * 8, 1, "center", "#59666b");
      });

      if (displayFocusId === "ember" && !isFrogSkinUnlocked("ember")) {
        const progressX = 169;
        const progressY = 131;
        const progressW = 142;
        const progressH = 5;
        const progress = clamp(game.totalFliesEaten / CONFIG.emberFlyTarget, 0, 1);
        ctx.fillStyle = COLORS.ink;
        ctx.fillRect(progressX, progressY, progressW, progressH);
        ctx.fillStyle = "#dbe5e8";
        ctx.fillRect(progressX + 2, progressY + 2, progressW - 4, progressH - 4);
        if (progress > 0) {
          ctx.fillStyle = skin.mid;
          ctx.fillRect(
            progressX + 2,
            progressY + 2,
            Math.max(1, Math.floor((progressW - 4) * progress)),
            progressH - 4
          );
        }
        drawBitmapText(
          `${Math.min(game.totalFliesEaten, CONFIG.emberFlyTarget)} / ${CONFIG.emberFlyTarget}`,
          W / 2,
          123,
          1,
          "center",
          progress >= 0.52 ? COLORS.white : skin.dark,
          progress >= 0.52 ? skin.dark : null
        );
      }

      for (const button of SETUP_UI.skinButtons) drawSetupSkinButton(button);
      drawSetupSandboxButton();
      drawSetupHatButton();
      drawSetupCustomButton();

      const button = SETUP_UI.backButton;
      const backFocused = focusId === "back";
      ctx.fillStyle = "rgba(25,43,52,0.32)";
      ctx.fillRect(button.x + 3, button.y + 3, button.w, button.h);
      ctx.fillStyle = backFocused ? COLORS.ink : "#8fa6ac";
      ctx.fillRect(button.x, button.y, button.w, button.h);
      if (backFocused) {
        ctx.fillStyle = getSelectedSkin().dark;
        ctx.fillRect(button.x + 3, button.y + 3, button.w - 6, button.h - 6);
        ctx.fillStyle = getSelectedSkin().mid;
        ctx.fillRect(button.x + 5, button.y + 5, button.w - 10, button.h - 10);
        ctx.fillStyle = getSelectedSkin().light;
        ctx.fillRect(button.x + 7, button.y + 6, button.w - 14, 4);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(button.x + 3, button.y + 3, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + 3, 2, 2);
        ctx.fillRect(button.x + 3, button.y + button.h - 5, 2, 2);
        ctx.fillRect(button.x + button.w - 5, button.y + button.h - 5, 2, 2);
      } else {
        ctx.fillStyle = "#f7fdff";
        ctx.fillRect(button.x + 2, button.y + 2, button.w - 4, button.h - 4);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(button.x + 5, button.y + 4, button.w - 10, 3);
      }
      drawMiniHouseIcon(button.x + 8, button.y + 4);
      drawBitmapText(
        "BACK TO MENU",
        button.x + button.w / 2 + 9,
        button.y + 8,
        1,
        "center",
        backFocused ? COLORS.white : "#48555a",
        backFocused ? COLORS.ink : null
      );

      if (!isCustomHatSelectorUnlocked() && (focusId === "hat" || game.customHatTipTimer > 0)) {
        const remaining = countLevelsAboveJumpTarget(CUSTOM_FROG_SLOT_TWO_JUMP_TARGET);
        drawCustomHatUnlockTooltip(SETUP_UI.hatButton, remaining, getSelectedSkin());
      }
      if (game.cheatToastTimer > 0) {
        const pulse = 0.78 + Math.sin(game.visualTime * 8.3333333) * 0.18;
        ctx.save();
        ctx.globalAlpha = pulse;
        drawBitmapText(game.cheatToastText || "EVERYTHING UNLOCKED!", W / 2, 244, 0.82, "center", getSelectedSkin().dark);
        ctx.restore();
      } else {
        drawBitmapText(isRibbitMobileMode() ? "TAP A BUTTON TO SELECT" : "CLICK OR ARROWS • ENTER TO SELECT", W / 2, 244, 1, "center", "#617177");
      }

      // The modal is deliberately last so the footer and any unlock text cannot
      // draw over its page controls or final row of hats.
      if (game.customHatOpen) drawCustomHatSelector(getSelectedSkin());
    }

    function drawCustomPartButton(rect, label, color, focused, active) {
      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = focused ? COLORS.ink : "#8fa6ac";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = active ? color : "#f7fdff";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.fillStyle = active ? mixHexColors(color, "#ffffff", 0.52) : "#ffffff";
      ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 3);
      drawBitmapText(
        label,
        rect.x + rect.w / 2,
        rect.y + 7,
        1,
        "center",
        active ? COLORS.white : "#48555a",
        active ? mixHexColors(color, "#07141a", 0.58) : null
      );
      if (focused) {
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(rect.x + 3, rect.y + 3, 2, 2);
        ctx.fillRect(rect.x + rect.w - 5, rect.y + 3, 2, 2);
        ctx.fillRect(rect.x + 3, rect.y + rect.h - 5, 2, 2);
        ctx.fillRect(rect.x + rect.w - 5, rect.y + rect.h - 5, 2, 2);
      }
    }

    function drawRgbSlider(slider, rgb, focused) {
      const channel = slider.channel;
      const value = rgb[channel];
      const start = { ...rgb, [channel]: 0 };
      const end = { ...rgb, [channel]: 255 };
      const gradient = ctx.createLinearGradient(slider.x, 0, slider.x + slider.w, 0);
      gradient.addColorStop(0, rgbToHex(start.r, start.g, start.b));
      gradient.addColorStop(1, rgbToHex(end.r, end.g, end.b));

      drawBitmapText(slider.label, slider.x - 22, slider.y, 1, "center", focused ? getCustomDraftSkin().dark : "#48555a");
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(slider.x - 2, slider.y - 2, slider.w + 4, slider.h + 4);
      ctx.fillStyle = gradient;
      ctx.fillRect(slider.x, slider.y, slider.w, slider.h);

      const knobX = Math.round(slider.x + slider.w * (value / 255));
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(knobX - 3, slider.y - 4, 7, slider.h + 8);
      ctx.fillStyle = focused ? COLORS.white : "#e9f1f3";
      ctx.fillRect(knobX - 1, slider.y - 2, 3, slider.h + 4);

      const valueRect = getRgbValueRect(slider);
      const editing = game.customEditingChannel === channel;
      ctx.fillStyle = editing || focused ? COLORS.ink : "#93a5aa";
      ctx.fillRect(valueRect.x, valueRect.y, valueRect.w, valueRect.h);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(valueRect.x + 2, valueRect.y + 2, valueRect.w - 4, valueRect.h - 4);
      if (!editing) {
        drawBitmapText(String(value), valueRect.x + valueRect.w / 2, valueRect.y + 6, 1, "center", "#48555a");
      }

      if (focused) {
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(slider.x - 2, slider.y - 2, 2, 2);
        ctx.fillRect(slider.x + slider.w, slider.y - 2, 2, 2);
      }
    }

    function drawCustomColorActionButton(rect, label, focused, palette) {
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = focused ? COLORS.ink : "#8fa6ac";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      if (focused) {
        ctx.fillStyle = palette.dark;
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
        ctx.fillStyle = palette.mid;
        ctx.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
        ctx.fillStyle = palette.light;
        ctx.fillRect(rect.x + 6, rect.y + 5, rect.w - 12, 3);
      } else {
        ctx.fillStyle = "#f7fdff";
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
        ctx.fillStyle = palette.light;
        ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 3);
      }
      drawBitmapText(label, rect.x + rect.w / 2, rect.y + 7, 1, "center", focused ? COLORS.white : palette.dark, focused ? COLORS.ink : null);
    }

    function drawCustomHistoryButton(rect, direction, focused, enabled, palette) {
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = focused ? COLORS.ink : "#8fa6ac";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = enabled ? (focused ? palette.belly : "#f7fdff") : "#d6dde0";
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.fillStyle = enabled ? palette.light : "#edf2f4";
      ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 3);

      const centerX = rect.x + Math.floor(rect.w / 2);
      const centerY = rect.y + 12;
      const dark = enabled ? (focused ? COLORS.white : "#245fae") : "#879499";
      const light = enabled ? (focused ? palette.light : "#5f9bf0") : "#aeb8bc";
      const pixel = (x, y, w, h, color = dark) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

      ctx.save();
      ctx.translate(centerX, centerY + 1);
      // The original arrow is preserved, but scaled to 72% so its head and tail
      // remain fully inside the history button instead of protruding past it.
      ctx.scale(direction < 0 ? 0.72 : -0.72, 0.72);
      // Thicker undo arrow with a more open tail-to-head gap so the icon reads clearly.
      pixel(-6, -8, 10, 3);
      pixel(2, -5, 4, 3);
      pixel(5, -2, 3, 8);
      pixel(2, 5, 4, 3);
      pixel(-6, 8, 10, 3);
      pixel(-10, 5, 6, 3);
      pixel(-12, 2, 3, 6);
      pixel(-11, -1, 4, 3);
      pixel(-13, -4, 4, 3);
      pixel(-12, -7, 7, 3);
      pixel(-10, -10, 4, 3);
      pixel(-8, -13, 3, 3);
      pixel(-4, -7, 6, 1, light);
      pixel(5, -1, 1, 5, light);
      pixel(-4, 8, 6, 1, light);
      ctx.restore();

      if (focused) {
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(rect.x + 3, rect.y + 3, 2, 2);
        ctx.fillRect(rect.x + rect.w - 5, rect.y + 3, 2, 2);
      }
    }

    function getCurrentHatTargetSkinId() {
      return normalizeHatTargetSkinId(game.skinId, "azure");
    }

    function openHatSelectorForCurrentFrog(playFeedback = true) {
      if (!isCustomHatSelectorUnlocked()) {
        game.customHatTipTimer = 3;
        playLockedSkinSound();
        return false;
      }
      const target = getCurrentHatTargetSkinId();
      game.hatTargetSkinId = target;
      game.customHatId = getHatForFrogSkinId(target);
      game.customHatOpen = true;
      game.customHatSearchOpen = false;
      game.customHatSearchQuery = "";
      game.customHatSearchNoMatch = false;
      game.customHatFocusIndex = Math.max(0, CUSTOM_HAT_OPTIONS.findIndex((hat) => hat.id === game.customHatId));
      game.customHatPage = getCustomHatPageForIndex(game.customHatFocusIndex);
      game.customHatHoveredIndex = null;
      game.customHatPageHovered = null;
      game.customHatSuppressedRequirementIndex = null;
      if (playFeedback) tone(610, 0.05, 0.012, 50);
      return true;
    }

    function removeAllFrogHats(playFeedback = true) {
      FROG_SKIN_ORDER.forEach((skinId) => { frogHatAssignments[skinId] = "none"; });
      for (let index = 0; index < CUSTOM_FROG_SLOT_COUNT; index += 1) {
        frogHatAssignments[`custom${index + 1}`] = "none";
        customFrogHats[index] = "none";
      }
      equippedFrogHatId = "none";
      game.customHatId = "none";
      saveFrogHatAssignments();
      if (playFeedback) {
        tone(420, 0.06, 0.014, -80);
        tone(260, 0.08, 0.011, -55, 0.045);
      }
      return true;
    }

    function applyHatSelectorChoice(hatId, close = true) {
      const normalizedHat = normalizeFrogHatId(hatId);
      if (!isHatUnlocked(normalizedHat)) {
        const lockedIndex = CUSTOM_HAT_OPTIONS.findIndex((hat) => hat.id === normalizedHat);
        game.customHatFocusIndex = Math.max(0, lockedIndex);
        game.customHatHoveredIndex = Math.max(0, lockedIndex);
        game.customHatSuppressedRequirementIndex = null;
        game.customHatDismissedRequirementId = null;
        // Locked hats remain informational: keep the requirement visible and
        // acknowledge the click only with the normal dud sound.
        playLockedSkinSound();
        return false;
      }
      game.customHatSuppressedRequirementIndex = null;
      game.customHatDismissedRequirementId = null;
      const target = normalizeHatTargetSkinId(game.hatTargetSkinId || getCurrentHatTargetSkinId(), "azure");
      game.customHatId = setHatForFrogSkinId(target, normalizedHat, true);
      if (target.startsWith("custom")) {
        const slotIndex = Number(target.slice(-1)) - 1;
        if (slotIndex === activeCustomFrogSlotIndex) customFrogColors = { ...customFrogSlots[slotIndex] };
      }
      if (close) { game.customHatOpen = false; game.customHatSearchOpen = false; }
      tone(720, 0.06, 0.014, 80);
      return true;
    }

    function getCustomHatPageForIndex(index) {
      const filtered = getFilteredCustomHatOptions();
      const localIndex = Math.max(0, filtered.findIndex((hat) => hat.index === index || hat.id === (CUSTOM_HAT_OPTIONS[index] && CUSTOM_HAT_OPTIONS[index].id)));
      return clamp(Math.floor(localIndex / CUSTOM_HATS_PER_PAGE), 0, getCustomHatPageCount() - 1);
    }

    function ensureCustomHatFocusVisible() {
      const filtered = getFilteredCustomHatOptions();
      if (!filtered.length) {
        game.customHatHoveredIndex = null;
        return false;
      }
      const visibleIndex = filtered.findIndex((hat) => hat.index === game.customHatFocusIndex);
      if (visibleIndex < 0) {
        game.customHatFocusIndex = filtered[0].index;
        game.customHatHoveredIndex = filtered[0].index;
      }
      game.customHatPage = clamp(game.customHatPage, 0, getCustomHatPageCount() - 1);
      const pageStart = game.customHatPage * CUSTOM_HATS_PER_PAGE;
      const pageEnd = pageStart + CUSTOM_HATS_PER_PAGE;
      const currentLocalIndex = filtered.findIndex((hat) => hat.index === game.customHatFocusIndex);
      if (currentLocalIndex < pageStart || currentLocalIndex >= pageEnd) {
        game.customHatPage = Math.floor(currentLocalIndex / CUSTOM_HATS_PER_PAGE);
      }
      return true;
    }

    function syncCustomHatPageToFocus() {
      ensureCustomHatFocusVisible();
      game.customHatPage = getCustomHatPageForIndex(game.customHatFocusIndex);
    }

    function setCustomHatPage(page, focusFirst = true) {
      const pageCount = getCustomHatPageCount();
      game.customHatPage = ((Math.round(Number(page) || 0) % pageCount) + pageCount) % pageCount;
      const filtered = getFilteredCustomHatOptions();
      if (focusFirst && filtered.length) {
        const localIndex = Math.min(filtered.length - 1, game.customHatPage * CUSTOM_HATS_PER_PAGE);
        game.customHatFocusIndex = filtered[localIndex].index;
      }
      game.customHatHoveredIndex = null;
      game.customHatPageHovered = null;
    }

    function getCustomHatPageButtons() {
      return {
        removeAll: { x: 84, y: 220, w: 132, h: 18 },
        search: { x: 221, y: 220, w: 22, h: 18 },
        prev: { x: 353, y: 220, w: 22, h: 18 },
        next: { x: 381, y: 220, w: 22, h: 18 }
      };
    }

    function closeCustomHatSearch() {
      game.customHatSearchOpen = false;
      game.customHatSearchNoMatch = false;
    }

    function syncCustomHatSearchResults(confirmSound = false) {
      const filtered = getFilteredCustomHatOptions();
      game.customHatSearchNoMatch = filtered.length === 0 && String(game.customHatSearchQuery || "").trim().length > 0;
      if (filtered.length) {
        const visible = filtered.some((hat) => hat.index === game.customHatFocusIndex);
        if (!visible) game.customHatFocusIndex = filtered[0].index;
        syncCustomHatPageToFocus();
        if (confirmSound) tone(560, 0.05, 0.012, 18);
        return true;
      }
      if (confirmSound) tone(210, 0.05, 0.012, -25);
      return false;
    }

    function commitCustomHatSearch(confirmSound = true) {
      const synced = syncCustomHatSearchResults(confirmSound);
      if (synced) game.customHatHoveredIndex = game.customHatFocusIndex;
      return synced;
    }

    function openCustomHatSearch() {
      game.customHatSearchOpen = true;
      game.customHatSearchNoMatch = false;
      tone(500, 0.03, 0.008, 12);
      return true;
    }

    function getCustomHatOptionRects() {
      ensureCustomHatFocusVisible();
      const filtered = getFilteredCustomHatOptions();
      const startIndex = game.customHatPage * CUSTOM_HATS_PER_PAGE;
      return filtered.slice(startIndex, startIndex + CUSTOM_HATS_PER_PAGE).map((hat, localIndex) => ({
        ...hat,
        x:84+(localIndex%4)*79,
        y:88+Math.floor(localIndex/4)*55,
        w:72,
        h:46
      }));
    }

    function countLevelsAboveJumpTarget(target) {
      return LEVEL_ORDER.filter((levelId) => {
        const fewest = readFewestJumps(levelId);
        return fewest === null || fewest > target;
      }).length;
    }

    function drawAchievementHoverTooltip(anchorRect, lines, bounds = { x: 0, y: 0, w: W, h: H }, palette = PVP_NEUTRAL_PALETTE) {
      const textLines = (Array.isArray(lines) ? lines : []).slice(0, 2).map((line) => String(line));
      if (!textLines.length) return;
      const measured = textLines.map((line) => measureBitmapText(line, 1));
      const width = clamp(Math.max(172, ...measured.map((value) => Math.ceil(value * 0.58) + 28)), 172, 224);
      const height = textLines.length > 1 ? 36 : 28;
      const preferAbove = anchorRect.y - height - 11 >= bounds.y + 4;
      const left = clamp(Math.round(anchorRect.x + anchorRect.w / 2 - width / 2), bounds.x + 6, bounds.x + bounds.w - width - 6);
      const top = preferAbove ? Math.round(anchorRect.y - height - 10) : Math.round(anchorRect.y + anchorRect.h + 10);
      const pointerX = clamp(Math.round(anchorRect.x + anchorRect.w / 2), left + 14, left + width - 14);
      ctx.fillStyle = "rgba(25,43,52,0.28)";
      ctx.fillRect(left + 3, top + 3, width, height);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(left, top, width, height);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(left + 2, top + 2, width - 4, height - 4);
      if (preferAbove) {
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(pointerX - 3, top + height - 1, 6, 4);
        ctx.fillRect(pointerX - 1, top + height + 3, 2, 2);
        ctx.fillStyle = COLORS.ink;
        ctx.fillRect(pointerX - 5, top + height - 1, 10, 4);
        ctx.fillRect(pointerX - 3, top + height + 3, 6, 4);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(pointerX - 3, top + height - 1, 6, 4);
      } else {
        ctx.fillStyle = COLORS.ink;
        ctx.fillRect(pointerX - 5, top - 7, 10, 4);
        ctx.fillRect(pointerX - 3, top - 3, 6, 4);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(pointerX - 3, top - 5, 6, 4);
        ctx.fillRect(pointerX - 1, top - 1, 2, 2);
      }
      const centerX = left + width / 2;
      textLines.forEach((line, lineIndex) => {
        const lineY = top + (textLines.length === 1 ? 10 : 6 + lineIndex * 10);
        drawBitmapText(line, centerX, lineY, 0.58, "center", "#4c555a");
      });
    }

    function drawCustomRequirementTooltip(anchorRect, title, lines, palette = getCustomDraftSkin(), width = 238) {
      const height = 43;
      const left = clamp(Math.round(anchorRect.x + anchorRect.w / 2 - width / 2), 8, W - width - 8);
      const top = Math.round(anchorRect.y + anchorRect.h + 7);
      const pointerX = clamp(Math.round(anchorRect.x + anchorRect.w / 2), left + 14, left + width - 14);
      // Match the compact speech-bubble pointer used throughout the menus.
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(pointerX - 4, top - 7, 9, 2);
      ctx.fillRect(pointerX - 3, top - 5, 7, 2);
      ctx.fillRect(pointerX - 2, top - 3, 5, 2);
      ctx.fillRect(pointerX - 1, top - 1, 3, 1);
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(left + 3, top + 3, width, height);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(left, top, width, height);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(left + 2, top + 2, width - 4, height - 4);
      ctx.fillStyle = palette.light;
      ctx.fillRect(left + 5, top + 4, width - 10, 3);
      drawMiniLockIcon(left + 14, top + 12, 0.74);
      drawBitmapText(title, left + width / 2 + 6, top + 8, 0.78, "center", palette.dark);
      lines.forEach((line, index) => drawBitmapText(line, left + width / 2, top + 23 + index * 9, 0.62, "center", "#48555a"));
    }

    function drawCustomHatUnlockTooltip(anchorRect, remaining, palette = getCustomDraftSkin()) {
      const width = 180;
      const height = 34;
      const left = clamp(Math.round(anchorRect.x + anchorRect.w / 2 - width / 2), 8, W - width - 8);
      const top = anchorRect.y - height - 7;
      const pointerX = clamp(Math.round(anchorRect.x + anchorRect.w / 2), left + 12, left + width - 12);
      ctx.fillStyle = "rgba(25,43,52,0.30)";
      ctx.fillRect(left + 3, top + 3, width, height);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(left, top, width, height);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(left + 2, top + 2, width - 4, height - 4);
      ctx.fillStyle = palette.light;
      ctx.fillRect(left + 5, top + 4, width - 10, 3);
      drawMiniLockIcon(left + 13, top + 10, 0.68);
      drawBitmapText(`BEAT ${remaining} MORE ${remaining === 1 ? "LEVEL" : "LEVELS"}`, left + width / 2 + 7, top + 8, 0.60, "center", palette.dark);
      drawBitmapText("IN 10 JUMPS OR FEWER", left + width / 2, top + 22, 0.62, "center", "#48555a");
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(pointerX - 4, top + height, 8, 3);
      ctx.fillRect(pointerX - 2, top + height + 3, 4, 3);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(pointerX - 2, top + height - 1, 4, 3);
    }

    function drawSetupHatButton() {
      const rect = SETUP_UI.hatButton;
      const skin = getSelectedSkin();
      const unlocked = isCustomHatSelectorUnlocked();
      const focused = game.setupSkinFocusId === "hat";
      const hatId = getHatForFrogSkinId(getCurrentHatTargetSkinId());
      ctx.fillStyle = "rgba(25,43,52,0.30)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = focused ? COLORS.ink : "#8fa6ac"; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = unlocked ? (focused ? skin.belly : "#f7fdff") : "#d6dde0"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.fillStyle = unlocked ? skin.light : "#edf2f4"; ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 3);
      if (!unlocked) {
        drawMiniLockIcon(rect.x + rect.w / 2, rect.y + 6, 0.72);
      } else if (hatId === "none") {
        drawEmptyTopHatOutline(rect.x + rect.w / 2, rect.y + 17, 0.62, "#8b989d");
      } else {
        drawPixelFrogHat(rect.x + rect.w / 2, rect.y + 15, hatId, 0.78, 1, skin);
      }
      if (focused) {
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(rect.x + 3, rect.y + 3, 2, 2);
        ctx.fillRect(rect.x + rect.w - 5, rect.y + 3, 2, 2);
      }
    }

    function drawMagnifierButtonIcon(rect, color = "#48555a") {
      const cx = rect.x + rect.w / 2 - 1;
      const cy = rect.y + rect.h / 2 - 1;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(cx - 4), Math.round(cy - 3), 8, 2);
      ctx.fillRect(Math.round(cx - 5), Math.round(cy - 2), 2, 6);
      ctx.fillRect(Math.round(cx + 3), Math.round(cy - 2), 2, 6);
      ctx.fillRect(Math.round(cx - 3), Math.round(cy + 3), 6, 2);
      ctx.fillRect(Math.round(cx + 4), Math.round(cy + 4), 2, 2);
      ctx.fillRect(Math.round(cx + 5), Math.round(cy + 5), 2, 2);
    }

    function drawCustomHatSearchOverlay(panel, skin) {
      const pages = getCustomHatPageButtons();
      const searchButton = pages.search;
      const searchBar = { x: searchButton.x + searchButton.w + 4, y: 220, w: 66, h: 18 };
      const focused = game.customHatSearchOpen;
      const hovered = game.customHatPageHovered === "search" || game.customHatPageHovered === "searchInput" || focused;
      game.customHatSearchInputRect = searchBar;
      ctx.fillStyle = hovered ? COLORS.ink : "#91a2a8"; ctx.fillRect(searchButton.x, searchButton.y, searchButton.w, searchButton.h);
      ctx.fillStyle = focused ? skin.belly : "#f7fdff"; ctx.fillRect(searchButton.x+2, searchButton.y+2, searchButton.w-4, searchButton.h-4);
      ctx.fillStyle = focused ? skin.light : "#ffffff"; ctx.fillRect(searchButton.x+5, searchButton.y+4, searchButton.w-10, 2);
      drawMagnifierButtonIcon(searchButton, focused ? skin.dark : "#48555a");
      ctx.fillStyle = hovered ? COLORS.ink : "#91a2a8"; ctx.fillRect(searchBar.x, searchBar.y, searchBar.w, searchBar.h);
      ctx.fillStyle = focused ? skin.belly : "#f7fdff"; ctx.fillRect(searchBar.x+2, searchBar.y+2, searchBar.w-4, searchBar.h-4);
      ctx.fillStyle = focused ? skin.light : "#ffffff"; ctx.fillRect(searchBar.x+5, searchBar.y+4, searchBar.w-10, 2);
      const placeholder = String(game.customHatSearchQuery || "").trim().length ? String(game.customHatSearchQuery || "").toUpperCase() : "SEARCH";
      drawBitmapText(placeholder, searchBar.x + 6, searchBar.y + 5, 0.56, "left", String(game.customHatSearchQuery || "").trim().length ? skin.dark : "#7c8a8f");
      if (focused && Math.floor(game.visualTime * 2) % 2 === 0 && String(game.customHatSearchQuery || "").length < 18) {
        const textWidth = Math.max(0, String(game.customHatSearchQuery || "").length * 5.2);
        ctx.fillStyle = skin.dark;
        ctx.fillRect(searchBar.x + 7 + textWidth, searchBar.y + 4, 2, 9);
      }
      drawBitmapText(`${Math.min(getCustomHatPageCount(), (game.customHatPage || 0) + 1)}/${getCustomHatPageCount()}`, searchBar.x + searchBar.w + 19, pages.prev.y + 5, 0.56, "center", "#617177");
    }

    function drawCustomHatSelector(skin) {
      const panel={x:70,y:36,w:340,h:211};
      ctx.fillStyle="rgba(18,33,41,0.68)";ctx.fillRect(0,0,W,H);
      ctx.fillStyle="rgba(25,43,52,0.30)";ctx.fillRect(panel.x+4,panel.y+4,panel.w,panel.h);
      ctx.fillStyle=COLORS.ink;ctx.fillRect(panel.x,panel.y,panel.w,panel.h);
      ctx.fillStyle="#f7fdff";ctx.fillRect(panel.x+3,panel.y+3,panel.w-6,panel.h-6);
      ctx.fillStyle=skin.mid;ctx.fillRect(panel.x+4,panel.y+4,panel.w-8,27);
      ctx.fillStyle=skin.light;ctx.fillRect(panel.x+7,panel.y+7,panel.w-14,3);
      drawBitmapText("CHOOSE STYLE",panel.x+panel.w/2,panel.y+10,1.15,"center",COLORS.white,skin.dark);
      const filteredHats = getFilteredCustomHatOptions();
      const focusedHat = CUSTOM_HAT_OPTIONS[game.customHatHoveredIndex ?? game.customHatFocusIndex] || filteredHats[0] || CUSTOM_HAT_OPTIONS[0];
      drawBitmapText(focusedHat.name,panel.x+panel.w/2,panel.y+36,0.54,"center",skin.dark);
      let lockedFocusedOption=null;
      getCustomHatOptionRects().forEach((option)=>{
        const selected=(game.customHatId||"none")===option.id;
        const focused=game.customHatFocusIndex===option.index||game.customHatHoveredIndex===option.index;
        const unlocked=isHatUnlocked(option.id);
        const lockedHovered=game.customHatHoveredIndex===option.index && !unlocked;
        if (lockedHovered) lockedFocusedOption=option;
        // Locked hats are informational hover targets, not selectable buttons.
        // A click never leaves a black focus border behind.
        ctx.fillStyle=((focused&&unlocked)||selected)?COLORS.ink:"#9aa9ae";ctx.fillRect(option.x,option.y,option.w,option.h);
        ctx.fillStyle=!unlocked?"#d5dde0":selected?skin.belly:focused?"#e7f8fb":"#f7fdff";ctx.fillRect(option.x+2,option.y+2,option.w-4,option.h-4);
        ctx.fillStyle=!unlocked?"#eef3f5":selected?skin.light:"#ffffff";ctx.fillRect(option.x+5,option.y+4,option.w-10,3);
        ctx.save(); if(!unlocked) ctx.globalAlpha=0.33;
        const selectorLift = ({ "headband":2, "flower":1, "washington-wig":2, "pink-bow":0, "party-hat":1, "mohawk":1, "baseball-cap":1 }[option.id] || 0);
        if (option.id === "none") {
          drawEmptyTopHatOutline(option.x + option.w / 2, option.y + 29, 0.68, "#8b989d");
        } else {
          drawPixelFrogHat(option.x+option.w/2,option.y+25-selectorLift,option.id,1.05,1,{...skin,previewCenterHat:true});
        }
        ctx.restore();
        const shortLabel=option.name.length>13?option.name.split(" ")[0]:option.name;
        drawBitmapText(shortLabel,option.x+option.w/2,option.y+35,0.43,"center",!unlocked?"#6d7a80":skin.dark);
        if(!unlocked) drawMiniLockIcon(option.x+option.w-10,option.y+6,0.62);
      });
      const close={x:386,y:40,w:20,h:20};
      ctx.fillStyle=COLORS.ink;ctx.fillRect(close.x,close.y,close.w,close.h);
      ctx.fillStyle="#f7fdff";ctx.fillRect(close.x+2,close.y+2,close.w-4,close.h-4);
      ctx.fillStyle=skin.dark;
      for(let i=0;i<9;i++){ctx.fillRect(close.x+5+i,close.y+5+i,2,2);ctx.fillRect(close.x+13-i,close.y+5+i,2,2);}
      const pages=getCustomHatPageButtons();
      const removeHovered = game.customHatRemoveAllHovered;
      ctx.fillStyle = removeHovered ? COLORS.ink : "#91a2a8"; ctx.fillRect(pages.removeAll.x, pages.removeAll.y, pages.removeAll.w, pages.removeAll.h);
      ctx.fillStyle = removeHovered ? skin.belly : "#f7fdff"; ctx.fillRect(pages.removeAll.x+2,pages.removeAll.y+2,pages.removeAll.w-4,pages.removeAll.h-4);
      ctx.fillStyle = removeHovered ? skin.light : "#ffffff"; ctx.fillRect(pages.removeAll.x+5,pages.removeAll.y+4,pages.removeAll.w-10,2);
      drawBitmapText("UNEQUIP ALL", pages.removeAll.x + pages.removeAll.w/2, pages.removeAll.y+6, 0.60, "center", removeHovered ? skin.dark : "#48555a");
      drawCustomHatSearchOverlay(panel, skin);
      const drawPageArrow=(rect,direction,hovered)=>{
        ctx.fillStyle=hovered?COLORS.ink:"#91a2a8";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
        ctx.fillStyle=hovered?skin.belly:"#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
        ctx.fillStyle=hovered?skin.light:"#ffffff";ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,2);
        drawPagerArrowIcon(rect,direction,hovered?skin.dark:"#48555a");
      };
      drawPageArrow(pages.prev,-1,game.customHatPageHovered==="prev");
      drawPageArrow(pages.next,1,game.customHatPageHovered==="next");
      if (!filteredHats.length) drawBitmapText("NO MATCHING HATS", panel.x + panel.w / 2, panel.y + 93, 0.78, "center", "#8a3243");
      else if (lockedFocusedOption) drawCustomRequirementTooltip(lockedFocusedOption,"",getHatRequirementLines(lockedFocusedOption.id),skin,190);
    
      // POLISH19_HAT_INFO_BAND
      try {
        const chosen = typeof getSelectedHat === "function" ? getSelectedHat() : null;
        const unlockText = chosen?.unlockText || chosen?.description || chosen?.requirementText || "";
        if (unlockText) drawBitmapText(String(unlockText).toUpperCase(), W / 2, 61, Math.min(.42, 330 / Math.max(1, measureBitmapText(String(unlockText).toUpperCase(), 1))), "center", "#48555a");
      } catch (_) {}
}

    function drawCustomColorScreen() {
      ensureValidEquippedHat();
      const skin = getCustomDraftSkin();
      const backdrop = ctx.createLinearGradient(0, 0, 0, H);
      backdrop.addColorStop(0, skin.dark);
      backdrop.addColorStop(0.55, skin.mid);
      backdrop.addColorStop(1, skin.belly);
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, W, H);

      const panel = { x: 28, y: 10, w: 424, h: 250 };
      ctx.fillStyle = "rgba(12,26,33,0.34)";
      ctx.fillRect(panel.x + 7, panel.y + 8, panel.w, panel.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h);
      ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8);
      ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);

      ctx.fillStyle = skin.dark;
      ctx.fillRect(panel.x + 12, panel.y + 9, panel.w - 24, 34);
      ctx.fillStyle = skin.mid;
      ctx.fillRect(panel.x + 14, panel.y + 11, panel.w - 28, 29);
      ctx.fillStyle = skin.light;
      ctx.fillRect(panel.x + 17, panel.y + 13, panel.w - 34, 4);
      drawBitmapText("CUSTOM FROG", W / 2, panel.y + 16, 2, "center", COLORS.white, skin.dark);

      // Large live preview modeled after the main Frog Color selector.
      const preview = CUSTOM_UI.preview;
      ctx.fillStyle = "rgba(25,43,52,0.24)";
      ctx.fillRect(preview.x + 4, preview.y + 4, preview.w, preview.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(preview.x, preview.y, preview.w, preview.h);
      ctx.fillStyle = mixHexColors(skin.belly, "#ffffff", 0.12);
      ctx.fillRect(preview.x + 3, preview.y + 3, preview.w - 6, preview.h - 6);
      ctx.fillStyle = skin.light;
      ctx.fillRect(preview.x + 7, preview.y + 7, preview.w - 14, 4);
      ctx.save();
      drawMiniFrogSwatchFacing(
        preview.x + preview.w / 2,
        preview.y + 52 + getTwoFrameMenuBob(0.08),
        { ...skin, previewHatYOffset: 1, previewHatRenderScreen: true },
        2.35,
        1
      );
      ctx.restore();
      drawBitmapText(`CUSTOM ${game.customSlotIndex + 1}`, preview.x + preview.w / 2, preview.y + 90, 0.82, "center", skin.dark);
      drawBitmapText("LIVE PREVIEW", preview.x + preview.w / 2, preview.y + 103, 0.58, "center", "#617177");

      CUSTOM_UI.slotButtons.forEach((slotButton) => {
        const unlocked = isCustomFrogSlotUnlocked(slotButton.index);
        const selected = unlocked && game.customSlotIndex === slotButton.index;
        const slotSkin = selected ? skin : getCustomFrogSkinForSlot(slotButton.index);
        ctx.fillStyle = "rgba(25,43,52,0.20)";
        ctx.fillRect(slotButton.x + 2, slotButton.y + 2, slotButton.w, slotButton.h);
        ctx.fillStyle = selected ? COLORS.ink : "#9aa9ae";
        ctx.fillRect(slotButton.x, slotButton.y, slotButton.w, slotButton.h);
        ctx.fillStyle = unlocked ? slotSkin.belly : "#d3dadd";
        ctx.fillRect(slotButton.x + 2, slotButton.y + 2, slotButton.w - 4, slotButton.h - 4);
        ctx.fillStyle = unlocked ? slotSkin.light : "#eef2f3";
        ctx.fillRect(slotButton.x + 5, slotButton.y + 4, slotButton.w - 10, 3);
        ctx.save();
        if (!unlocked) ctx.globalAlpha = 0.26;
        drawMiniFrogSwatchFacing(slotButton.x + slotButton.w / 2, slotButton.y + 8, { ...slotSkin, previewHatYOffset: 1 }, 0.66, 1);
        ctx.restore();
        drawBitmapText(String(slotButton.index + 1), slotButton.x + slotButton.w / 2, slotButton.y + 17, 0.50, "center", unlocked ? slotSkin.dark : "#7b878b");
        if (!unlocked) drawMiniLockIcon(slotButton.x + slotButton.w - 9, slotButton.y + 5, 0.60);
      });

      const [bodyButton, bellyButton, accentsButton] = CUSTOM_UI.partButtons;
      drawCustomPartButton(bodyButton, "BODY", game.customDraftBody, game.customFocusArea === "body", game.customPart === "body");
      drawCustomPartButton(bellyButton, "BELLY", game.customDraftBelly, game.customFocusArea === "belly", game.customPart === "belly");
      drawCustomPartButton(accentsButton, "ACCENTS", game.customDraftAccents, game.customFocusArea === "accents", game.customPart === "accents");
      const rgb = getCustomDraftRgb();
      for (const slider of CUSTOM_UI.sliders) drawRgbSlider(slider, rgb, game.customFocusArea === slider.channel);
      drawCustomColorActionButton(CUSTOM_UI.useButton, "USE CUSTOM", game.customFocusArea === "use", skin);
      drawCustomColorActionButton(CUSTOM_UI.backButton, "BACK", game.customFocusArea === "back", { dark: "#4b565b", mid: "#7d8a90", light: "#d8e1e4" });
      drawCustomHistoryButton(CUSTOM_UI.undoButton, -1, game.customFocusArea === "undo", game.customUndoStack.length > 0 || Boolean(game.customHistoryTransaction), skin);
      drawCustomHistoryButton(CUSTOM_UI.redoButton, 1, game.customFocusArea === "redo", game.customRedoStack.length > 0, skin);
      drawBitmapText("SELECT A PART • ADJUST R G B • SAVE YOUR FROG", W / 2, 250, 0.58, "center", "#617177");
      const hoveredLockedSlot = Number.isInteger(game.customHoveredSlotIndex) && !isCustomFrogSlotUnlocked(game.customHoveredSlotIndex)
        ? game.customHoveredSlotIndex
        : null;
      const lockedSlot = hoveredLockedSlot ?? game.customLockedSlotIndex;
      if (Number.isInteger(lockedSlot)) {
        const target = lockedSlot === 1 ? CUSTOM_FROG_SLOT_TWO_JUMP_TARGET : CUSTOM_FROG_SLOT_THREE_JUMP_TARGET;
        const remaining = countLevelsAboveJumpTarget(target);
        const slotRect = CUSTOM_UI.slotButtons[lockedSlot];
        drawCustomRequirementTooltip(
          slotRect,
          `CUSTOM ${lockedSlot + 1} LOCKED`,
          [`BEAT ${remaining} MORE ${remaining === 1 ? "LEVEL" : "LEVELS"}`, `IN ${target} JUMPS OR FEWER`],
          skin
        );
      }
    }
