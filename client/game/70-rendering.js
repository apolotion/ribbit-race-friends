    function drawPixelText(text, x, y, size = 10, align = "left", color = COLORS.white) {
      ctx.font = `bold ${size}px "Courier New", monospace`;
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      ctx.fillStyle = COLORS.ink;
      ctx.fillText(text, x + 1, y + 1);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    }

    // A compact 5×7 bitmap alphabet keeps small HUD and pause text crisp
    // at the 1920×1080 backing resolution while matching the pixel-art UI.
    const BITMAP_GLYPHS = Object.freeze({
      "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
      "Á": ["00010", "00100", "01110", "10001", "11111", "10001", "10001", "10001"],
      "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
      "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
      "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
      "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
      "É": ["00010", "00100", "11111", "10000", "11110", "10000", "10000", "11111"],
      "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
      "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
      "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
      "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
      "Í": ["00010", "00100", "11111", "00100", "00100", "00100", "00100", "11111"],
      "J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
      "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
      "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
      "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
      "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
      "Ñ": ["01010", "00100", "11001", "10101", "10011", "10001", "10001", "10001"],
      "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
      "Ó": ["00010", "00100", "01110", "10001", "10001", "10001", "10001", "01110"],
      "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
      "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
      "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
      "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
      "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
      "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
      "Ú": ["00010", "00100", "10001", "10001", "10001", "10001", "10001", "01110"],
      "Ü": ["01010", "00000", "10001", "10001", "10001", "10001", "10001", "01110"],
      "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
      "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
      "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
      "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
      "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
      "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
      "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
      "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
      "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
      "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
      "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
      "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
      "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
      "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
      "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
      ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
      "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
      "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
      "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
      ".": ["00000", "00000", "00000", "00000", "00000", "00100", "00100"],
      ",": ["00000", "00000", "00000", "00000", "00100", "00100", "01000"],
      "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
      "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
      "¡": ["00100", "00000", "00100", "00100", "00100", "00100", "00100"],
      "'": ["00100", "00100", "00010", "00000", "00000", "00000", "00000"],
      "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
      "¿": ["00100", "00000", "00100", "01000", "10000", "10001", "01110"],
      "(": ["00110", "01000", "10000", "10000", "10000", "01000", "00110"],
      ")": ["01100", "00010", "00001", "00001", "00001", "00010", "01100"],
      "\"": ["01010", "01010", "00100", "00000", "00000", "00000", "00000"],
      ";": ["00000", "00100", "00100", "00000", "00100", "00100", "01000"],
      "=": ["00000", "11111", "00000", "11111", "00000", "00000", "00000"],
      "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
      "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"],
      "[": ["01110", "01000", "01000", "01000", "01000", "01000", "01110"],
      "]": ["01110", "00010", "00010", "00010", "00010", "00010", "01110"],
      "•": ["00000", "00000", "00000", "01110", "01110", "00000", "00000"]
    });

    function normalizeBitmapText(text) {
      let value = String(text ?? "");
      try { value = value.normalize("NFC"); } catch (_) {}
      return value
        .replace(/ /g, " ")
        .replace(/[​-‍⁠﻿]/g, "")
        .replace(/[\r\n\t]+/g, " ")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[–—]/g, "-")
        .replace(/…/g, "...")
        .replace(/\s+/g, " ");
    }

    function getBitmapGlyph(character) {
      const direct = BITMAP_GLYPHS[character];
      if (direct) return direct;
      let fallback = String(character || "");
      try { fallback = fallback.normalize("NFD"); } catch (_) {}
      fallback = fallback.replace(/[̀-ͯ]/g, "").toUpperCase();
      return BITMAP_GLYPHS[fallback] || BITMAP_GLYPHS["?"];
    }

    function measureBitmapText(text, scale = 1) {
      const value = normalizeBitmapText(text).toUpperCase();
      let width = 0;
      for (let index = 0; index < value.length; index += 1) {
        width += (value[index] === " " ? 3 : 5) * scale;
        if (index < value.length - 1) width += scale;
      }
      return width;
    }

    function drawBitmapTextToContext(targetContext, text, x, y, scale = 1, align = "left", color = COLORS.white, shadowColor = null) {
      const value = normalizeBitmapText(text).toUpperCase();
      const totalWidth = measureBitmapText(value, scale);
      let startX = x;
      if (align === "center") startX -= totalWidth / 2;
      if (align === "right") startX -= totalWidth;
      startX = Math.round(startX);
      const startY = Math.round(y);

      function drawLayer(offsetX, offsetY, fillStyle) {
        targetContext.fillStyle = fillStyle;
        let cursorX = startX;

        for (const character of value) {
          if (character === " ") {
            cursorX += 4 * scale;
            continue;
          }

          const glyph = getBitmapGlyph(character);
          const glyphYOffset = glyph.length > 7 ? -scale : 0;
          for (let row = 0; row < glyph.length; row += 1) {
            for (let column = 0; column < glyph[row].length; column += 1) {
              if (glyph[row][column] === "1") {
                targetContext.fillRect(
                  cursorX + column * scale + offsetX,
                  startY + glyphYOffset + row * scale + offsetY,
                  scale,
                  scale
                );
              }
            }
          }
          cursorX += 6 * scale;
        }
      }

      if (shadowColor) drawLayer(1, 1, shadowColor);
      drawLayer(0, 0, color);
    }

    function drawBitmapText(text, x, y, scale = 1, align = "left", color = COLORS.white, shadowColor = null) {
      drawBitmapTextToContext(ctx, text, x, y, scale, align, color, shadowColor);
    }

    function wrapBitmapTextAtScale(text, maximumWidth, scale = 1) {
      const value = normalizeBitmapText(text).trim();
      if (!value) return [""];
      const words = value.split(/\s+/).filter(Boolean);
      const lines = [];
      let line = "";

      const pushLongToken = (token) => {
        let chunk = "";
        for (const character of token) {
          const candidate = chunk + character;
          if (chunk && measureBitmapText(candidate, scale) > maximumWidth) {
            lines.push(chunk);
            chunk = character;
          } else {
            chunk = candidate;
          }
        }
        return chunk;
      };

      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (measureBitmapText(candidate, scale) <= maximumWidth) {
          line = candidate;
          continue;
        }
        if (line) {
          lines.push(line);
          line = "";
        }
        if (measureBitmapText(word, scale) <= maximumWidth) line = word;
        else line = pushLongToken(word);
      }
      if (line || !lines.length) lines.push(line);
      return lines;
    }

    function truncateBitmapLine(text, maximumWidth, scale) {
      const suffix = "...";
      let value = normalizeBitmapText(text).trimEnd();
      while (value && measureBitmapText(value + suffix, scale) > maximumWidth) value = value.slice(0, -1).trimEnd();
      return value ? value + suffix : suffix;
    }

    function layoutBitmapText(text, maximumWidth, options = {}) {
      const maxScale = Math.max(0.1, Number(options.maxScale) || 1);
      const minScale = Math.min(maxScale, Math.max(0.1, Number(options.minScale) || 0.52));
      const maxLines = Math.max(1, Math.floor(Number(options.maxLines) || 1));
      const normalized = normalizeBitmapText(text).trim();
      for (let scale = maxScale; scale >= minScale - 0.001; scale -= 0.04) {
        const roundedScale = Math.max(minScale, Math.round(scale * 100) / 100);
        const lines = wrapBitmapTextAtScale(normalized, maximumWidth, roundedScale);
        if (lines.length <= maxLines) return { lines, scale: roundedScale };
      }
      const lines = wrapBitmapTextAtScale(normalized, maximumWidth, minScale);
      if (lines.length > maxLines) {
        const retained = lines.slice(0, maxLines);
        retained[maxLines - 1] = truncateBitmapLine(
          [retained[maxLines - 1], ...lines.slice(maxLines)].filter(Boolean).join(" "),
          maximumWidth,
          minScale
        );
        return { lines: retained, scale: minScale };
      }
      return { lines, scale: minScale };
    }

    function drawBitmapTextLayoutToContext(targetContext, layout, x, y, align = "center", color = COLORS.white, shadowColor = null, lineGap = 1) {
      const lines = Array.isArray(layout?.lines) && layout.lines.length ? layout.lines : [""];
      const scale = Number(layout?.scale) || 1;
      const lineHeight = Math.max(1, Math.ceil(8 * scale + lineGap));
      lines.forEach((line, index) => drawBitmapTextToContext(targetContext, line, x, y + index * lineHeight, scale, align, color, shadowColor));
      return { lineHeight, totalHeight: lines.length * lineHeight - lineGap };
    }

    function drawBitmapTextLayout(layout, x, y, align = "center", color = COLORS.white, shadowColor = null, lineGap = 1) {
      return drawBitmapTextLayoutToContext(ctx, layout, x, y, align, color, shadowColor, lineGap);
    }

    // Fly labels use only quarter-step scales. At the 4× backing resolution these
    // become whole physical pixels (4, 3, or 2 pixels per bitmap cell), so the same
    // word cannot shimmer between fractional raster positions on later frames.
    function layoutStableFlyLabelText(text, maximumWidth = 120) {
      const normalized = normalizeBitmapText(text).trim();
      const scales = [1, 0.75, 0.5];
      for (const scale of scales) {
        const lines = wrapBitmapTextAtScale(normalized, maximumWidth, scale);
        if (lines.length <= 2) return { lines, scale };
      }
      const lines = wrapBitmapTextAtScale(normalized, maximumWidth, 0.5);
      const retained = lines.slice(0, 2);
      if (lines.length > 2) {
        retained[1] = truncateBitmapLine([retained[1], ...lines.slice(2)].filter(Boolean).join(" "), maximumWidth, 0.5);
      }
      return { lines: retained.length ? retained : [""], scale: 0.5 };
    }

    function drawCloud(x, y, scale = 1) {
      const s = scale;
      const variant = Math.abs(Math.floor(x * 0.19 + y * 0.31 + scale * 113)) % 6;
      const shapeSets = [
        [[0,6,48,12],[12,0,28,18],[37,8,13,10]],
        [[0,8,54,10],[7,3,19,14],[23,0,24,18],[44,6,14,12]],
        [[0,7,42,11],[9,1,20,16],[27,4,27,14],[49,9,10,8]],
        [[0,9,58,9],[5,5,17,12],[20,1,20,16],[37,3,16,14],[51,8,12,9]],
        [[0,6,44,13],[4,2,14,15],[17,0,23,18],[37,5,18,13]],
        [[0,9,51,10],[10,4,13,13],[20,1,18,16],[34,0,12,17],[44,6,14,12]]
      ];
      const shapes = shapeSets[variant];
      const cloudWidth = Math.max(...shapes.map((rect) => rect[0] + rect[2])) * s;
      const margin = cloudWidth + 14;
      const span = W + margin * 2;
      const speed = 1.65 + s * 1.10 + variant * 0.17;
      const elapsed = game.visualTime;
      const rawX = x + elapsed * speed;
      const animatedX = ((rawX + margin) % span + span) % span - margin;
      const animatedY = y + Math.sin(elapsed * (0.20 + variant * 0.018) + variant * 1.37) * (0.8 + variant % 3 * 0.35);
      const shadeOffsetX = (variant % 2 ? 5 : 8) * s;
      const shadeOffsetY = (variant % 3 ? 4 : 5) * s;

      ctx.fillStyle = COLORS.cloudShade;
      shapes.forEach(([rx, ry, rw, rh]) => {
        ctx.fillRect(
          Math.round(animatedX + rx * s + shadeOffsetX),
          Math.round(animatedY + ry * s + shadeOffsetY),
          Math.max(1, Math.round(rw * s)),
          Math.max(1, Math.round(rh * s))
        );
      });

      ctx.fillStyle = COLORS.cloud;
      shapes.forEach(([rx, ry, rw, rh]) => {
        ctx.fillRect(
          Math.round(animatedX + rx * s),
          Math.round(animatedY + ry * s),
          Math.max(1, Math.round(rw * s)),
          Math.max(1, Math.round(rh * s))
        );
      });

      if (variant === 1 || variant === 4) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(
          Math.round(animatedX + (variant === 1 ? 15 : 11) * s),
          Math.round(animatedY + 3 * s),
          Math.max(1, Math.round((variant === 1 ? 18 : 16) * s)),
          Math.max(1, Math.round(2 * s))
        );
      }
    }

    function drawParkKite() {
      const t = game.visualTime;
      const travelStart = -110;
      const travelEnd = W + 110;
      const travelDistance = travelEnd - travelStart;
      const x = travelStart + ((t * 17) % travelDistance);
      const y = 65 + Math.sin(t * 1.15) * 10 + Math.sin(t * 0.43) * 5;
      const bob = Math.sin(t * 2.2) * 2;
      const fadeIn = clamp((x - travelStart) / 42, 0, 1);
      const fadeOut = clamp((travelEnd - x) / 42, 0, 1);

      ctx.save();
      ctx.globalAlpha = Math.min(fadeIn, fadeOut);

      ctx.save();
      ctx.translate(Math.round(x), Math.round(y + bob));
      ctx.rotate(Math.sin(t * 0.9) * 0.16);
      ctx.fillStyle = "#8c3145";
      ctx.fillRect(-1, -8, 3, 17);
      ctx.fillRect(-8, -1, 17, 3);
      ctx.fillStyle = "#ef5b62";
      ctx.fillRect(-6, -5, 6, 6);
      ctx.fillStyle = "#ffd85a";
      ctx.fillRect(1, -5, 6, 6);
      ctx.fillStyle = "#4ca9ff";
      ctx.fillRect(-6, 2, 6, 5);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(1, 2, 6, 5);
      ctx.restore();

      ctx.strokeStyle = "rgba(50,64,70,0.70)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      for (let i = 1; i <= 6; i += 1) {
        ctx.lineTo(x - i * 9, y + 8 + i * 5 + Math.sin(t * 1.5 + i) * 3);
      }
      ctx.stroke();
      ctx.fillStyle = "#ef5b62";
      ctx.fillRect(Math.round(x - 26), Math.round(y + 20), 4, 3);
      ctx.fillRect(Math.round(x - 31), Math.round(y + 20), 4, 3);
      ctx.fillStyle = "#ffd85a";
      ctx.fillRect(Math.round(x - 47), Math.round(y + 31), 4, 3);
      ctx.fillRect(Math.round(x - 52), Math.round(y + 31), 4, 3);
      ctx.restore();
    }



    function drawParkBackground() {
      const [skyTop, skyBottom] = getTimeSkyColors("park");
      fillLevelSky(skyTop, skyBottom);
      drawTimeSkyDetails("park");

      // Austin-inspired skyline behind a dense urban playground park.
      const buildings = [
        [8, 94, 15, 29, "#728b95"], [30, 84, 18, 39, "#8b9ba2"],
        [54, 91, 15, 32, "#657e88"], [76, 73, 19, 50, "#82959e"],
        [102, 85, 16, 38, "#637d87"], [126, 59, 22, 64, "#77929d"],
        [156, 89, 15, 34, "#748790"], [178, 76, 18, 47, "#84949b"],
        [205, 49, 25, 74, "#698791"], [238, 80, 15, 43, "#78909a"],
        [260, 61, 20, 62, "#657f8b"], [283, 55, 20, 68, "#718a94"],
        [307, 76, 19, 47, "#8698a0"], [332, 65, 22, 58, "#6b858e"],
        [360, 86, 17, 37, "#87999f"], [385, 70, 20, 53, "#647e89"],
        [412, 84, 16, 39, "#85969d"], [438, 73, 23, 50, "#667f89"]
      ];
      buildings.forEach(([x, y, w, h, body], index) => {
        ctx.fillStyle = body;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = index % 2 ? "#dce7ea" : "#cfe0e5";
        ctx.fillRect(x + 2, y + 2, Math.max(2, w - 4), 3);
        ctx.fillStyle = "rgba(242,251,255,0.72)";
        for (let wx = x + 3; wx < x + w - 2; wx += 5) {
          for (let wy = y + 8; wy < y + h - 3; wy += 7) ctx.fillRect(wx, wy, 2, 3);
        }
      });

      // Landmark stepped glass towers use only block forms.
      ctx.fillStyle = "#6f909c";
      ctx.fillRect(165, 43, 18, 80);
      ctx.fillRect(169, 34, 11, 89);
      ctx.fillStyle = "#dcebee";
      for (let y = 40; y < 118; y += 6) ctx.fillRect(171, y, 7, 2);
      ctx.fillStyle = "#627d89";
      ctx.fillRect(270, 60, 10, 63);
      ctx.fillRect(280, 54, 12, 69);
      ctx.fillRect(292, 59, 11, 64);
      ctx.fillStyle = "#d8e8ec";
      ctx.fillRect(282, 58, 8, 60);
      for (let y = 65; y < 118; y += 7) ctx.fillRect(273, y, 26, 2);

      // Layered tree canopy hides the base of the skyline.
      ctx.fillStyle = "#477a4a";
      ctx.fillRect(0, 119, W, 26);
      const canopy = [
        [0,111,39,29], [34,103,45,38], [73,113,38,29], [106,99,50,44],
        [151,108,40,34], [185,101,45,41], [225,112,39,30], [258,100,49,43],
        [303,108,40,34], [338,98,49,45], [382,109,39,33], [417,101,55,42]
      ];
      canopy.forEach(([x,y,w,h],i) => {
        ctx.fillStyle = i % 3 === 0 ? "#4e8d51" : i % 3 === 1 ? "#5b995f" : "#6ca66b";
        ctx.fillRect(x,y,w,h);
        ctx.fillStyle = "#7ab574";
        ctx.fillRect(x + 6, y + 3, Math.max(5,w - 12), 5);
      });
      ctx.fillStyle = "#6f5843";
      [22,62,128,207,280,356,436].forEach(x => ctx.fillRect(x,128,4,28));

      // Keep the kite in front of both the skyline and the treetops.
      drawParkKite();

      ctx.fillStyle = "#8fc76e";
      ctx.fillRect(0,143,W,71);
      ctx.fillStyle = "#a7d67d";
      ctx.fillRect(0,146,W,12);

      // Winding pale paths through the park.
      const paths = [
        [0,185,70,18],[45,177,57,18],[82,166,54,17],[119,156,50,16],
        [153,152,49,16],[190,159,55,16],[230,169,65,17],[281,179,76,18],
        [337,172,55,17],[379,161,50,16],[416,152,64,16]
      ];
      paths.forEach(([x,y,w,h]) => {
        ctx.fillStyle = "#cfd2cf"; ctx.fillRect(x,y,w,h);
        ctx.fillStyle = "#eef0ed"; ctx.fillRect(x+2,y+2,Math.max(4,w-4),Math.max(3,h-7));
      });

      // Soft stepped shade structures replace sharp triangular sails.
      ctx.fillStyle = "#1e8ec4";
      ctx.fillRect(54,149,3,31); ctx.fillRect(92,150,3,30);
      ctx.fillRect(328,155,3,27); ctx.fillRect(367,150,3,32);
      function drawShadeCanopy(x, y, width, main, highlight) {
        ctx.fillStyle = main;
        ctx.fillRect(x + 3, y + 6, width - 6, 9);
        ctx.fillRect(x + 8, y + 3, width - 16, 5);
        ctx.fillRect(x + 14, y, width - 28, 4);
        ctx.fillStyle = highlight;
        ctx.fillRect(x + 10, y + 4, width - 20, 2);
      }
      drawShadeCanopy(39, 136, 66, "#49bce2", "#82e0ee");
      drawShadeCanopy(311, 139, 72, "#49bce2", "#82e0ee");

      // Playground and natural-play structures.
      ctx.fillStyle = "#28a3cf";
      ctx.fillRect(115,159,26,5); ctx.fillRect(119,148,3,18); ctx.fillRect(135,148,3,18); ctx.fillRect(122,143,13,6);
      ctx.fillStyle = "#e0a742"; ctx.fillRect(141,160,18,4); ctx.fillRect(151,151,3,14);
      ctx.fillStyle = "#73b8db"; ctx.fillRect(161,156,18,5); ctx.fillRect(165,149,3,13);
      ctx.fillStyle = "#2c819f"; ctx.fillRect(181,177,24,13);
      ctx.fillStyle = "#e7c95d"; ctx.fillRect(185,180,16,7);
      ctx.fillStyle = "#ae8956"; ctx.fillRect(212,173,38,15);
      ctx.fillStyle = "#d0a76b";
      ctx.fillRect(216,169,6,4); ctx.fillRect(225,165,7,8); ctx.fillRect(235,161,7,12); ctx.fillRect(244,168,4,5);
      ctx.fillStyle = "#9a744c"; ctx.fillRect(12,181,35,12);
      ctx.fillStyle = "#6fae5d";
      ctx.fillRect(255,154,24,9); ctx.fillRect(285,153,18,10); ctx.fillRect(393,177,25,10);
      ctx.fillStyle = "#4f8f4e";
      ctx.fillRect(259,151,16,4); ctx.fillRect(289,150,11,4); ctx.fillRect(398,174,16,4);

      ctx.fillStyle = "#55a9c8";
      ctx.fillRect(429,164,9,37); ctx.fillRect(421,193,17,8);
      ctx.fillStyle = "#84d4e5"; ctx.fillRect(431,165,3,31);

      ctx.fillStyle = "#7db45e"; ctx.fillRect(0,202,W,12);
      ctx.fillStyle = "#b89564"; ctx.fillRect(0,214,W,CONFIG.playBottom-214);
      ctx.fillStyle = "#d4ba8f"; ctx.fillRect(0,214,W,8);
      for (let x=0; x<W; x+=20) {
        ctx.fillStyle = x % 40 === 0 ? "#c5a478" : "#aa855a";
        ctx.fillRect(x+2,226+(x%3),11,3);
      }
    }


    function fillLevelSky(topColor, bottomColor) {
      const sky = ctx.createLinearGradient(0, 0, 0, CONFIG.playBottom);
      sky.addColorStop(0, topColor);
      sky.addColorStop(1, bottomColor);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, CONFIG.playBottom);
    }

    function drawPixelOrb(x, y, lightColor, midColor, shadowColor = null) {
      const left = Math.round(x - 12);
      const top = Math.round(y - 12);
      ctx.fillStyle = shadowColor || midColor;
      ctx.fillRect(left + 4, top, 16, 24);
      ctx.fillRect(left, top + 4, 24, 16);
      ctx.fillStyle = midColor;
      ctx.fillRect(left + 4, top + 2, 16, 20);
      ctx.fillRect(left + 2, top + 4, 20, 16);
      ctx.fillStyle = lightColor;
      ctx.fillRect(left + 6, top + 3, 10, 4);
      ctx.fillRect(left + 4, top + 7, 14, 7);
      ctx.fillRect(left + 7, top + 14, 9, 4);
    }

    function drawPixelStars(stars, color = "#dff8ff") {
      const elapsed = game.visualTime;
      ctx.save();
      stars.forEach(([x, y, size = 1], index) => {
        const speed = 1.7 + (index % 4) * 0.32;
        const phase = x * 0.081 + y * 0.137 + index * 0.71;
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * speed + phase);
        ctx.globalAlpha = 0.25 + pulse * 0.75;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);

        if (size > 1 || pulse > 0.84) {
          const glint = size > 1 ? size : 1;
          ctx.fillRect(x - 1, y + Math.floor(glint / 2), glint + 2, 1);
          ctx.fillRect(x + Math.floor(glint / 2), y - 1, 1, glint + 2);
        }
      });
      ctx.restore();
    }

    function drawDetailedFlower(x, baseY, color, phase, scale = 1) {
      const seconds = game.visualTime;
      const sway = Math.round(Math.sin(seconds * 1.35 + phase) * 2 * scale);
      const stemHeight = Math.round(18 * scale);
      ctx.fillStyle = "#2d7a3a";
      for (let dy = 0; dy < stemHeight; dy += 3) {
        const progress = dy / stemHeight;
        ctx.fillRect(Math.round(x + sway * progress), baseY - dy, Math.max(1, Math.round(scale)), 4);
      }
      const flowerX = x + sway;
      const flowerY = baseY - stemHeight;
      ctx.fillStyle = "#4b9f48";
      ctx.fillRect(Math.round(x - 4 * scale), Math.round(baseY - 8 * scale), Math.max(3, Math.round(5 * scale)), Math.max(2, Math.round(3 * scale)));
      ctx.fillRect(Math.round(x + 1 * scale), Math.round(baseY - 12 * scale), Math.max(3, Math.round(5 * scale)), Math.max(2, Math.round(3 * scale)));
      ctx.fillStyle = color;
      const petal = Math.max(2, Math.round(3 * scale));
      ctx.fillRect(Math.round(flowerX - 4 * scale), Math.round(flowerY - scale), petal, petal);
      ctx.fillRect(Math.round(flowerX + scale), Math.round(flowerY - scale), petal, petal);
      ctx.fillRect(Math.round(flowerX - scale), Math.round(flowerY - 4 * scale), petal, petal);
      ctx.fillRect(Math.round(flowerX - scale), Math.round(flowerY + scale), petal, petal);
      ctx.fillStyle = "#ffd34d";
      ctx.fillRect(Math.round(flowerX - scale), Math.round(flowerY - scale), Math.max(2, Math.round(3 * scale)), Math.max(2, Math.round(3 * scale)));
      ctx.fillStyle = "rgba(255,244,150,0.75)";
      ctx.fillRect(Math.round(flowerX + 4 * scale), Math.round(flowerY - 3 * scale), 1, 1);
    }



    function getTimeSkyColors(theme) {
      const palettes = {
        morning: {
          park: ["#f8c796", "#a7dff1"], swamp: ["#d8b18b", "#75a5a6"],
          jungle: ["#dda576", "#4f8b79"], pond: ["#ffd8a8", "#8fdef0"],
          lake: ["#f7c99b", "#addce9"], garden: ["#ffd1b2", "#b9e8f2"]
        },
        afternoon: {
          park: [COLORS.skyTop, COLORS.skyBottom], swamp: ["#4d8195", "#38656d"],
          jungle: ["#28707a", "#1f6552"], pond: ["#78c8ec", "#a3e7e8"],
          lake: ["#72c5f0", "#d6f0f4"], garden: ["#82c7e3", "#c9edf0"]
        },
        night: {
          park: ["#0f1938", "#2b4965"], swamp: ["#10162f", "#294254"],
          jungle: ["#07152d", "#12464b"], pond: ["#111c3b", "#31536a"],
          lake: ["#122143", "#375a72"], garden: ["#211a40", "#574d74"]
        }
      };
      return palettes[game.timeOfDay]?.[theme] || palettes.afternoon.park;
    }


    function drawPixelMoon(centerX, centerY, phaseIndex = game.moonPhaseIndex) {
      const phase = ((phaseIndex % 8) + 8) % 8;
      const radius = 11;
      const block = 2;
      const darkFace = "#5b6a6b";
      const litMid = "#d7db9a";
      const lit = "#fff6bd";

      ctx.fillStyle = "#485552";
      ctx.fillRect(centerX - 8, centerY - 12, 16, 24);
      ctx.fillRect(centerX - 12, centerY - 8, 24, 16);

      for (let py = -radius; py <= radius; py += block) {
        for (let px = -radius; px <= radius; px += block) {
          if (px * px + py * py > radius * radius) continue;
          const curve = 4.8 - (py * py) / 23;
          let illuminated = false;
          if (phase === 0) illuminated = false;
          else if (phase === 1) illuminated = px > curve;
          else if (phase === 2) illuminated = px >= 0;
          else if (phase === 3) illuminated = px > -curve;
          else if (phase === 4) illuminated = true;
          else if (phase === 5) illuminated = px < curve;
          else if (phase === 6) illuminated = px <= 0;
          else if (phase === 7) illuminated = px < -curve;
          ctx.fillStyle = illuminated ? (py < -2 ? lit : litMid) : darkFace;
          ctx.fillRect(Math.round(centerX + px), Math.round(centerY + py), block, block);
        }
      }

      if (phase !== 0) {
        ctx.fillStyle = "rgba(110,116,82,0.55)";
        ctx.fillRect(centerX - 5, centerY - 4, 3, 3);
        ctx.fillRect(centerX + 3, centerY + 2, 4, 3);
      }
    }

    function drawTimeSkyDetails(theme) {
      const time = game.timeOfDay;

      if (time === "night") {
        const starSets = {
          park: [[21,24],[48,45],[83,19,2],[126,34],[169,15],[205,42],[246,23],[292,48],[333,18],[365,39],[448,20],[466,52]],
          swamp: [[21,24],[48,45],[83,19,2],[126,34],[169,15],[205,42],[246,23],[292,48],[333,18],[365,39],[448,20],[466,52]],
          jungle: [[32,31],[71,16],[116,42],[165,22],[229,34],[275,14],[326,45],[383,20],[432,37],[465,13]],
          pond: [[24,18],[67,42],[104,23],[151,15],[205,38],[254,20],[318,43],[367,17],[422,35],[463,22]],
          lake: [[18,30],[59,17],[112,42],[158,23],[218,14],[276,37],[331,20],[384,45],[438,18],[469,31]],
          garden: [[27,20],[72,39],[121,16],[179,43],[224,24],[282,13],[337,38],[391,21],[446,44],[470,17]]
        };
        drawPixelStars(starSets[theme] || starSets.park, "#dff8ff");
        const moonX = theme === "jungle" ? 75 : 414;
        drawPixelMoon(moonX, 30, game.moonPhaseIndex);

        const nightClouds = {
          park: [[-18,18,0.70],[116,34,0.55],[264,17,0.62],[405,43,0.48]],
          swamp: [[-34,37,0.42],[158,23,0.46],[329,49,0.38],[445,16,0.36]],
          jungle: [[-26,42,0.36],[149,18,0.38],[310,45,0.34],[430,26,0.32]],
          pond: [[-20,24,0.57],[119,44,0.43],[287,19,0.50],[421,46,0.38]],
          lake: [[-25,29,0.62],[121,47,0.42],[274,20,0.52],[417,45,0.38]],
          garden: [[-18,21,0.58],[137,44,0.43],[294,18,0.50],[431,42,0.38]]
        };
        for (const cloud of nightClouds[theme] || nightClouds.park) drawCloud(...cloud);
        return;
      }

      const morning = time === "morning";
      const sunX = morning ? 61 : 408;
      const sunY = morning ? 29 : 27;
      drawPixelOrb(sunX, sunY, "#fff7ae", "#ffd66f", "#e7a85f");

      const cloudSets = {
        park: [[-16,15,1.20],[75,45,0.58],[125,27,0.95],[221,12,0.67],[278,13,1.05],[360,50,0.54],[421,29,0.90],[505,20,0.63]],
        swamp: [[-30,28,0.55],[93,46,0.42],[176,18,0.52],[292,43,0.40],[382,22,0.50],[498,49,0.36]],
        jungle: [[-25,36,0.48],[88,17,0.43],[173,45,0.36],[281,20,0.46],[377,48,0.34],[500,28,0.39]],
        pond: [[-28,43,0.48],[55,16,0.63],[117,22,0.86],[239,46,0.45],[309,34,0.72],[409,15,0.58]],
        lake: [[-30,46,0.48],[18,25,0.90],[202,17,0.70],[367,42,0.52]],
        garden: [[-31,45,0.47],[22,23,0.86],[223,38,0.62],[401,17,0.54]]
      };
      for (const cloud of cloudSets[theme] || cloudSets.park) drawCloud(...cloud);
    }

    function drawTimeOfDayWorldTint(levelId = game.selectedLevelId) {
      const theme = (LEVELS[levelId] || LEVELS.park).theme;
      ctx.save();
      if (game.timeOfDay === "night") {
        const alpha = theme === "swamp" || theme === "jungle" ? 0.12 : 0.34;
        ctx.fillStyle = `rgba(5,10,30,${alpha})`;
        ctx.fillRect(0, 0, W, CONFIG.playBottom);
      } else if (game.timeOfDay === "morning") {
        ctx.globalCompositeOperation = "screen";
        const alpha = theme === "swamp" || theme === "jungle" ? 0.18 : 0.07;
        ctx.fillStyle = `rgba(255,205,155,${alpha})`;
        ctx.fillRect(0, 0, W, CONFIG.playBottom);
      } else {
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(255,226,165,0.035)";
        ctx.fillRect(0, 0, W, CONFIG.playBottom);
      }
      ctx.restore();
    }

    function drawSwampBackground() {
      const [skyTop, skyBottom] = getTimeSkyColors("swamp");
      fillLevelSky(skyTop, skyBottom);
      drawTimeSkyDetails("swamp");
      const seconds = game.visualTime;

      // Distant cypress silhouettes and hanging moss.
      ctx.fillStyle = "#182b32";
      const trunks = [19, 94, 171, 287, 365, 455];
      for (const x of trunks) {
        ctx.fillRect(x, 83 + (x % 17), 7, 131);
        ctx.fillRect(x - 9, 102 + (x % 13), 25, 8);
        ctx.fillRect(x - 14, 118 + (x % 11), 35, 9);
        ctx.fillRect(x - 10, 132 + (x % 7), 28, 8);
      }
      ctx.fillStyle = "#203b38";
      for (let x = -10; x < W; x += 36) {
        const top = 142 + (x % 19);
        ctx.fillRect(x, top, 44, CONFIG.groundY - top);
        ctx.fillRect(x + 8, top - 8, 25, 12);
      }

      // Swamp water and low fog.
      ctx.fillStyle = "#1e5261";
      ctx.fillRect(0, 174, W, CONFIG.groundY - 174);
      ctx.fillStyle = "#2f6970";
      ctx.fillRect(0, 181, W, 4);
      ctx.fillRect(0, 198, W, 3);
      ctx.fillStyle = "#8bb2a7";
      for (let x = 8; x < W; x += 48) ctx.fillRect(x, 188 + (x % 3), 22, 1);
      ctx.fillStyle = "rgba(205,232,218,0.28)";
      ctx.fillRect(0, 159, W, 5);
      ctx.fillRect(54, 168, 145, 3);
      ctx.fillRect(278, 166, 166, 3);

      // Slow offset ripple bands keep the dark swamp water alive.
      ctx.save();
      ctx.globalAlpha = 0.42;
      for (let index = 0; index < 8; index += 1) {
        const width = 18 + (index % 3) * 8;
        const x = ((index * 71 + seconds * (5 + index % 2)) % (W + 50)) - 25;
        const y = 181 + (index % 4) * 7;
        ctx.fillStyle = index % 2 ? "#4d7e80" : "#8bb2a7";
        ctx.fillRect(Math.round(x), y, width, 1);
        ctx.fillRect(Math.round(x + width + 6), y + 2, Math.max(7, width - 9), 1);
      }
      ctx.restore();

      // Gently swaying reeds and cattails.
      const reeds = [8, 31, 68, 143, 260, 326, 438, 470];
      reeds.forEach((baseX, index) => {
        const sway = Math.round(Math.sin(seconds * 1.05 + index * 0.72) * 1.7);
        const stemTop = 180 + (index % 2) * 3;
        ctx.fillStyle = "#162f2b";
        for (let segment = 0; segment < 7; segment += 1) {
          const t = segment / 6;
          const offset = Math.round(sway * (1 - t));
          ctx.fillRect(baseX + offset, stemTop + 5 + segment * 4, 2, 5);
        }
        ctx.fillRect(baseX + 5 - sway, 191, 2, 23);
        ctx.fillStyle = "#6d4a2d";
        ctx.fillRect(baseX - 1 + sway, stemTop, 4, 8);
        ctx.fillStyle = "#9b7042";
        ctx.fillRect(baseX + sway, stemTop + 1, 2, 2);
      });

      // Fireflies glow only during Night mode.
      if (game.timeOfDay === "night") {
        const fireflies = [[41,139],[89,163],[176,146],[229,173],[305,151],[371,168],[423,137],[458,157]];
        fireflies.forEach(([x, y], index) => {
          const pulse = 0.5 + 0.5 * Math.sin(seconds * (2.1 + index * 0.08) + index * 1.37);
          const driftX = Math.round(Math.sin(seconds * 0.65 + index) * 3);
          const driftY = Math.round(Math.cos(seconds * 0.52 + index * 0.7) * 2);
          ctx.save();
          ctx.globalAlpha = 0.12 + pulse * 0.30;
          ctx.fillStyle = "#eaff69";
          ctx.fillRect(x + driftX - 2, y + driftY - 2, 5, 5);
          ctx.globalAlpha = 0.45 + pulse * 0.55;
          ctx.fillStyle = "#fff9a3";
          ctx.fillRect(x + driftX, y + driftY, 2, 2);
          ctx.restore();
        });
      }
    }

    function drawJungleBackground() {
      const [skyTop, skyBottom] = getTimeSkyColors("jungle");
      fillLevelSky(skyTop, skyBottom);
      drawTimeSkyDetails("jungle");
      const seconds = game.visualTime;

      ctx.fillStyle = "#173325";
      ctx.fillRect(0, 150, W, 64);
      ctx.fillStyle = "#0f241b";
      ctx.fillRect(0, 185, W, 29);

      const trunks = [18, 68, 118, 175, 228, 292, 346, 401, 444];
      const trunkTops = [22, 36, 18, 43, 28, 14, 40, 25, 34];
      const trunkBottom = 154;
      const branchMap = {
        68: [[-12, 54, 12, 3], [10, 82, 14, 3]],
        175: [[10, 46, 13, 3], [-10, 92, 10, 3]],
        292: [[-14, 60, 14, 3], [10, 98, 12, 3]],
        401: [[10, 57, 12, 3], [-11, 86, 11, 3]]
      };
      trunks.forEach((x, index) => {
        const top = trunkTops[index] ?? (28 + (x % 18));
        const height = Math.max(78, trunkBottom - top);
        ctx.fillStyle = "#2d2117";
        ctx.fillRect(x, top, 10, height);
        ctx.fillStyle = "#4b3a28";
        ctx.fillRect(x + 3, top, 2, height);
        ctx.fillStyle = "#6b5842";
        [16, 42, 68].forEach((offset) => {
          if (offset < height - 4) ctx.fillRect(x, top + offset, 10, 2);
        });
        const branches = branchMap[x] || [];
        branches.forEach(([dx, dy, w, h]) => {
          ctx.fillStyle = "#3f301f";
          ctx.fillRect(x + dx, top + dy, w, h);
          ctx.fillStyle = "#6b5842";
          ctx.fillRect(x + dx + (dx < 0 ? 0 : 1), top + dy, Math.max(4, w - 2), 1);
        });
      });

      // The center trunk is intentionally clear; no decorative snake is drawn.

      function bananaLeaf(x, y, w, h, colorA, colorB) {
        ctx.fillStyle = colorA;
        ctx.fillRect(x, y + 2, w, h - 4);
        ctx.fillRect(x + 2, y, w - 4, h);
        ctx.fillStyle = colorB;
        ctx.fillRect(x + Math.floor(w / 2) - 1, y + 1, 2, h - 2);
        ctx.fillRect(x + 4, y + 6, w - 8, 1);
        ctx.fillRect(x + 5, y + 11, w - 10, 1);
      }

      // Each canopy is calculated from its own trunk top. The leaf's center
      // vein overlaps the stem, so changing a tree's height can no longer leave
      // its leaves floating above or disconnected from the trunk.
      const canopyStyles = [
        { w: 28, h: 34, lift: 12, colorA: "#29a66a", colorB: "#1a6f4d" },
        { w: 31, h: 38, lift: 13, colorA: "#2ab26f", colorB: "#1a6f4d" },
        { w: 29, h: 35, lift: 12, colorA: "#2aa86c", colorB: "#176946" },
        { w: 32, h: 41, lift: 14, colorA: "#34ba72", colorB: "#1b7651" },
        { w: 31, h: 37, lift: 13, colorA: "#2aa569", colorB: "#196846" },
        { w: 30, h: 40, lift: 14, colorA: "#2bb06f", colorB: "#18704b" },
        { w: 32, h: 36, lift: 12, colorA: "#2aa769", colorB: "#196847" },
        { w: 33, h: 43, lift: 15, colorA: "#2ab56d", colorB: "#1a724d" },
        { w: 27, h: 33, lift: 11, colorA: "#85ca4b", colorB: "#5b8f2d" }
      ];
      trunks.forEach((trunkX, index) => {
        const top = trunkTops[index] ?? (28 + (trunkX % 18));
        const style = canopyStyles[index % canopyStyles.length];
        const trunkCenter = trunkX + 5;
        const leafX = Math.round(trunkCenter - style.w / 2);
        const leafY = top - style.lift;
        bananaLeaf(leafX, leafY, style.w, style.h, style.colorA, style.colorB);

        // A short collar covers the exact stem/canopy junction while preserving
        // the blocky pixel-art silhouette.
        ctx.fillStyle = style.colorB;
        ctx.fillRect(trunkX + 3, top - 2, 4, 8);
        ctx.fillStyle = style.colorA;
        ctx.fillRect(trunkX + 4, top - 1, 2, 5);
      });

      const bushes = [
        [0,126,58,26],[34,132,42,20],[72,124,56,28],[117,129,48,23],
        [156,121,62,31],[208,130,45,22],[246,123,57,29],[292,128,48,24],
        [330,120,60,32],[380,127,51,25],[419,123,55,29]
      ];
      for (const [x, y, w, h] of bushes) {
        ctx.fillStyle = "#0f3827";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#154b34";
        ctx.fillRect(x + 4, y - 5, w - 8, h - 5);
      }

      // A moving jungle river breaks up the grass and the narrower sandy bank.
      // The water also covers the lower trunk ends behind the bushes.
      ctx.fillStyle = "#426b48";
      ctx.fillRect(0, 146, W, 6);
      ctx.fillStyle = "#286f78";
      ctx.fillRect(0, 152, W, 31);
      ctx.fillStyle = "#3f9298";
      ctx.fillRect(0, 156, W, 21);
      ctx.fillStyle = "#69b9b2";
      ctx.fillRect(0, 160, W, 4);
      for (let row = 0; row < 5; row += 1) {
        const y = 158 + row * 5;
        const speed = 12 + row * 3;
        const offset = ((seconds * speed + row * 47) % 72) - 36;
        ctx.fillStyle = row % 2 ? "rgba(207,244,225,0.72)" : "rgba(133,211,202,0.76)";
        for (let x = offset - 72; x < W + 40; x += 72) {
          const width = 18 + (row % 3) * 8;
          ctx.fillRect(Math.round(x), y, width, 1);
          ctx.fillRect(Math.round(x + width + 5), y + 2, Math.max(6, width - 10), 1);
        }
      }
      // Sandy near bank is intentionally much narrower than the former road.
      ctx.fillStyle = "#a87945";
      ctx.fillRect(0, 183, W, 31);
      ctx.fillStyle = "#d1aa68";
      ctx.fillRect(0, 184, W, 21);
      ctx.fillStyle = "#e1c17e";
      ctx.fillRect(0, 185, W, 10);
      const jungleBankPatches = [
        [12,191,28,4],[58,202,41,5],[117,188,25,4],[166,205,39,5],
        [226,195,48,5],[296,207,34,4],[348,188,40,5],[410,201,52,5]
      ];
      jungleBankPatches.forEach(([x,y,w,h], index) => {
        ctx.fillStyle = index % 3 === 0 ? "#c49a5d" : index % 3 === 1 ? "#e8cc8f" : "#8f663e";
        ctx.fillRect(x, y, w, h);
      });
      ctx.fillStyle = "#765438";
      for (let x = 8; x < W; x += 43) ctx.fillRect(x, 209 + (x % 3), 8, 2);

      bananaLeaf(58, 76, 20, 28, "#b7d64d", "#79922e");
      bananaLeaf(351, 82, 22, 29, "#f3a540", "#b9691f");
      bananaLeaf(386, 79, 21, 30, "#d2e06a", "#849634");
      bananaLeaf(407, 85, 18, 24, "#b7d64d", "#75892e");

      // Vines are drawn in short swaying segments so their lower ends move more.
      const vines = [[45,0,54],[132,0,41],[208,0,66],[347,0,51],[444,0,71]];
      vines.forEach(([baseX, baseY, height], index) => {
        ctx.fillStyle = "#31745a";
        for (let y = 0; y < height; y += 3) {
          const leverage = y / height;
          const sway = Math.round(Math.sin(seconds * 0.95 + index * 1.15 + y * 0.045) * 3 * leverage);
          ctx.fillRect(baseX + sway, baseY + y, 2, 4);
          if (y === 12 || y === 27) ctx.fillRect(baseX + sway + 2, baseY + y, 5, 2);
        }
      });

    }

    function drawPondBackground() {
      const [skyTop, skyBottom] = getTimeSkyColors("pond");
      fillLevelSky(skyTop, skyBottom);
      drawTimeSkyDetails("pond");
      const seconds = game.visualTime;
      const fountainActivation = game.state === "countdown"
        ? 0
        : game.state === "playing"
          ? clamp(game.elapsed / 0.9, 0, 1)
          : 1;

      // Manicured estate lawn and a blocky lakeside house in the distance.
      ctx.fillStyle = "#7dbc64"; ctx.fillRect(0,116,W,54);
      ctx.fillStyle = "#9bd47b"; ctx.fillRect(0,121,W,12);
      const treeGroups = [[8,82,40,47],[58,88,36,42],[106,77,46,52],[154,87,38,43],[212,79,42,51]];
      const pondTreePalettes = [
        ["#3f7d4b", "#5f9c61", "#8ac07a"],
        ["#487f58", "#68a06b", "#94c58a"],
        ["#3d7460", "#5b9271", "#83b485"],
        ["#567d45", "#73a35c", "#9bc47b"],
        ["#416e51", "#5c8b63", "#81ae78"]
      ];
      treeGroups.forEach(([x,y,w,h],i)=>{
        const [darkLeaf, midLeaf, lightLeaf] = pondTreePalettes[i % pondTreePalettes.length];
        ctx.fillStyle = darkLeaf; ctx.fillRect(x,y,w,h);
        ctx.fillStyle = midLeaf; ctx.fillRect(x+3,y+3,Math.max(10,w-6),Math.max(8,h-8));
        ctx.fillStyle = lightLeaf; ctx.fillRect(x+5,y+4,Math.max(8,w-10),5);
        // Deterministic patches make neighboring trees feel distinct without
        // changing the established estate-pond composition.
        ctx.fillStyle = i % 2 ? darkLeaf : lightLeaf;
        ctx.fillRect(x + 4 + (i * 7) % Math.max(6,w-14), y + 13, Math.max(5,Math.floor(w*0.22)), 4);
        ctx.fillRect(x + Math.max(3,w - 14 - (i % 3) * 3), y + 24 + (i % 2) * 5, 8, 5);
        ctx.fillStyle = i % 3 === 0 ? "#719b68" : "#557f5c";
        ctx.fillRect(x + 9 + (i % 4) * 3, y + h - 13, Math.max(6,Math.floor(w*0.18)), 4);
        ctx.fillStyle = "#69543f"; ctx.fillRect(x+Math.floor(w/2)-2,y+h-2,4,18);
      });
      // Lakeside house with a more interesting pitched roof and no tree clipped behind it.
      ctx.fillStyle = "#d9c9a6"; ctx.fillRect(312,80,116,54);
      ctx.fillStyle = "#efe4c8"; ctx.fillRect(318,84,104,45);
      const roofSteps = [
        [309,74,122,5], [317,69,106,5], [326,64,88,5],
        [336,59,68,5], [346,54,48,5], [356,49,28,5]
      ];
      roofSteps.forEach(([x,y,w,h],index)=>{
        ctx.fillStyle = index % 2 ? "#825f45" : "#704d39";
        ctx.fillRect(x,y,w,h);
        ctx.fillStyle = "#a97a58";
        ctx.fillRect(x+4,y+1,Math.max(8,w-8),1);
      });
      // Continuous eave closes the one-pixel sky gap between the roof and wall.
      ctx.fillStyle = "#704d39"; ctx.fillRect(312,78,116,4);
      ctx.fillStyle = "#a97a58"; ctx.fillRect(316,78,108,1);
      // Small front-facing dormer to break up the silhouette.
      ctx.fillStyle = "#8d684f"; ctx.fillRect(360,72,22,10);
      ctx.fillStyle = "#efe4c8"; ctx.fillRect(365,75,12,6);
      ctx.fillStyle = "#6a5140"; ctx.fillRect(325,100,15,29); ctx.fillRect(398,100,14,29);
      ctx.fillStyle = "#dff4fb";
      for (let x=346;x<392;x+=14) {
        ctx.fillRect(x,86,9,10); ctx.fillRect(x,104,9,10);
        ctx.fillStyle = "#b7d4db"; ctx.fillRect(x+4,86,1,10); ctx.fillRect(x,90,9,1); ctx.fillRect(x+4,104,1,10); ctx.fillRect(x,108,9,1);
        ctx.fillStyle = "#dff4fb";
      }
      ctx.fillStyle = "#72513e"; ctx.fillRect(364,110,16,19);
      ctx.fillStyle = "#d7b789"; ctx.fillRect(367,113,10,16);
      ctx.fillStyle = "#8f6a4f"; ctx.fillRect(371,113,2,16); ctx.fillRect(367,120,10,1);
      ctx.fillStyle = "#f5dfb6"; ctx.fillRect(375,121,1,1);
      ctx.fillStyle = "#86634a"; ctx.fillRect(328,103,9,1); ctx.fillRect(401,103,8,1); ctx.fillRect(328,126,9,1); ctx.fillRect(401,126,8,1);

      // A more diagonal, curving gravel walk reads as a path rather than a straight-on stone block.
      const gravelPath = [
        [368,129,11,3], [366,132,14,3], [363,135,18,3],
        [358,138,22,4], [351,142,28,4], [344,146,34,4], [336,151,42,4]
      ];
      gravelPath.forEach(([x,y,w,h],index)=>{
        const bend = index % 2 ? 1 : 0;
        ctx.fillStyle = index % 2 ? "#cbb89a" : "#dfcfb6";
        ctx.fillRect(x + bend,y,w,h);
        ctx.fillStyle = index % 3 === 0 ? "#b7a085" : "#aa987f";
        ctx.fillRect(x + 2 + bend,y + h - 1,Math.max(8,w - 6),1);
        for(let pebbleX=x+3;pebbleX<x+w-2;pebbleX+=6 + (index % 2)){
          ctx.fillRect(pebbleX + ((pebbleX + index) % 3 === 0 ? 1 : 0),y+1+((pebbleX+index)%2),2,1);
          if ((pebbleX + index) % 4 === 0) ctx.fillRect(pebbleX + 2,y + Math.max(1,h-2),1,1);
        }
      });

      // Stone far bank.
      ctx.fillStyle = "#a08b73"; ctx.fillRect(0,151,W,16);
      ctx.fillStyle = "#c5b39c";
      for (let x=0;x<W;x+=28) { ctx.fillRect(x+2,151+(x%3),22,5); ctx.fillRect(x+8,159,17,4); }

      // Main water plane with layered reflections.
      ctx.fillStyle = "#4c96a2"; ctx.fillRect(0,165,W,49);
      ctx.fillStyle = "#75c5ca"; ctx.fillRect(0,169,W,5);
      ctx.fillStyle = "#a5e4df"; ctx.fillRect(0,190,W,3);
      ctx.fillStyle = "rgba(235,255,248,0.62)";
      for (let x=7;x<W;x+=47) ctx.fillRect(x,180+(x%5),25,1);

      // Large rounded shoreline rock in the highlighted water area.
      const rockBob = Math.sin(seconds * 1.15) * 1.6;
      const rockX = 344;
      const rockY = 181 + rockBob;
      ctx.save();
      ctx.translate(rockX, rockY);
      ctx.fillStyle = "#5e655f"; ctx.fillRect(-34, 7, 68, 18);
      ctx.fillStyle = "#737a75"; ctx.fillRect(-30, 2, 60, 19);
      ctx.fillStyle = "#868d87"; ctx.fillRect(-18, -4, 36, 12);
      ctx.fillStyle = "#9aa09b"; ctx.fillRect(-8, -6, 18, 7);
      ctx.fillStyle = "#4b524d"; ctx.fillRect(-5, 6, 5, 4); ctx.fillRect(8, 4, 4, 5);
      ctx.restore();
      ctx.fillStyle = "rgba(235,255,248,0.44)";
      ctx.fillRect(rockX - 30, 195 + Math.round(rockBob * 0.12), 60, 2);
      ctx.fillRect(rockX - 18, 199 + Math.round(rockBob * 0.08), 36, 1);

      // Animated fountain on the left. Each jet follows a short parabola:
      // it rises only slightly, travels outward, and then visibly falls into
      // the pond instead of forming an upward cone.
      const fountainX = 72;
      const nozzleY = 149;
      ctx.fillStyle = "#6d777c"; ctx.fillRect(fountainX - 3, 153, 6, 20);
      ctx.fillStyle = "#dffaff"; ctx.fillRect(fountainX - 4, nozzleY, 8, 8);
      const fountainStreams = [
        { direction: -1, distance: 52, lift: 10, fall: 33, speed: 0.42, phase: 0.00 },
        { direction: -1, distance: 38, lift: 14, fall: 31, speed: 0.48, phase: 0.21 },
        { direction: -1, distance: 25, lift: 17, fall: 29, speed: 0.54, phase: 0.43 },
        { direction:  1, distance: 25, lift: 17, fall: 29, speed: 0.54, phase: 0.12 },
        { direction:  1, distance: 38, lift: 14, fall: 31, speed: 0.48, phase: 0.34 },
        { direction:  1, distance: 52, lift: 10, fall: 33, speed: 0.42, phase: 0.56 }
      ];
      if (fountainActivation > 0) {
        ctx.save();
        ctx.globalAlpha = fountainActivation;
        fountainStreams.forEach((stream, streamIndex) => {
          for (let particle = 0; particle < 12; particle += 1) {
            const t = (particle / 12 + seconds * stream.speed + stream.phase) % 1;
            // As the round begins, water grows outward from the nozzle instead of popping on.
            if (t > fountainActivation) continue;
            const x = fountainX + stream.direction * (4 + stream.distance * t);
            const y = nozzleY - stream.lift * t + (stream.lift + stream.fall) * t * t;
            const sparkle = (particle + streamIndex) % 3 === 0;
            ctx.fillStyle = sparkle ? "rgba(245,255,255,0.94)" : "rgba(185,238,249,0.84)";
            ctx.fillRect(Math.round(x), Math.round(y), sparkle ? 2 : 1, 2);
          }
        });
        // A narrow center plume breaks into droplets and falls almost straight down.
        for (let particle = 0; particle < 9; particle += 1) {
          const t = (particle / 9 + seconds * 0.58) % 1;
          if (t > fountainActivation) continue;
          const x = fountainX + Math.sin(seconds * 2.1 + particle) * (1 + t * 2);
          const y = nozzleY - 20 * t + 39 * t * t;
          ctx.fillStyle = particle % 2 ? "rgba(220,249,255,0.90)" : "rgba(255,255,255,0.95)";
          ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
        }
        ctx.fillStyle = "rgba(230,255,255,0.74)";
        const rippleOffset = Math.round(Math.sin(seconds * 2.1) * 2);
        const wideRipple = Math.max(2, Math.round(76 * fountainActivation));
        const smallRipple = Math.max(2, Math.round(56 * fountainActivation));
        ctx.fillRect(Math.round(fountainX - wideRipple / 2 + rippleOffset), 171, wideRipple, 3);
        ctx.fillRect(Math.round(fountainX - smallRipple / 2 - rippleOffset), 175, smallRipple, 2);
        ctx.restore();
      }

      // Animated ripples across the water.
      ctx.save(); ctx.globalAlpha = 0.62;
      for (let index=0; index<10; index+=1) {
        const width=15+(index%4)*7;
        const x=((index*57+seconds*(6+index%3))%(W+46))-23;
        const y=177+(index%5)*7;
        ctx.fillStyle=index%2?"#bdeff0":"#efffff";
        ctx.fillRect(Math.round(x),y,width,1);
        ctx.fillRect(Math.round(x+5),y+2,Math.max(6,width-10),1);
      }
      ctx.restore();

      // Lily-pad clusters fill the foreground like the reference pond.
      const pads = [[16,196,13],[38,203,10],[58,194,11],[91,205,13],[118,198,9],[145,207,12],[174,195,10],[204,203,14],[238,194,10],[267,208,12],[302,198,11],[336,205,14],[371,194,10],[405,207,13],[438,199,10],[461,210,8]];
      pads.forEach(([x,y,w],i)=>{
        ctx.fillStyle=i%3===0?"#3b8a48":i%3===1?"#55a958":"#70b95d";
        ctx.fillRect(x,y,w,4); ctx.fillRect(x+2,y-2,Math.max(4,w-4),3);
        ctx.fillStyle="#9fcb70"; ctx.fillRect(x+3,y-1,Math.max(2,w-7),1);
        if(i%5===0){ctx.fillStyle="#df8fa2";ctx.fillRect(x+Math.floor(w/2)-2,y-5,4,3);ctx.fillStyle="#f8c5cf";ctx.fillRect(x+Math.floor(w/2)-1,y-6,2,2);}
      });


      // Swaying cattails retain the original pond identity.
      const cattailXs=[8,26,112,132,248,270,420,446,468];
      cattailXs.forEach((x,index)=>{
        const sway=Math.round(Math.sin(seconds*1.12+index*.76)*1.6);
        ctx.fillStyle="#347c43";
        for(let segment=0;segment<5;segment++){const leverage=1-segment/5;ctx.fillRect(x+Math.round(sway*leverage),151+segment*4,2,5);}
        ctx.fillRect(x+4-sway,155,2,16);
        ctx.fillStyle="#a56b34";ctx.fillRect(x-1+sway,145,4,7);
        ctx.fillStyle="#d09a52";ctx.fillRect(x+sway,146,2,2);
      });

      function drawDuck(x,y,direction,scale=1){
        ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(direction,1);
        ctx.fillStyle="#c88919";ctx.fillRect(-7*scale,-3*scale,13*scale,7*scale);
        ctx.fillStyle="#ffd84d";ctx.fillRect(-5*scale,-4*scale,10*scale,6*scale);ctx.fillRect(3*scale,-8*scale,6*scale,6*scale);
        ctx.fillStyle="#fff19a";ctx.fillRect(-3*scale,-3*scale,6*scale,2*scale);
        ctx.fillStyle="#ef8d35";ctx.fillRect(9*scale,-5*scale,4*scale,2*scale);
        ctx.fillStyle="#1d2a2b";ctx.fillRect(7*scale,-7*scale,1*scale,1*scale);ctx.restore();
        ctx.fillStyle="rgba(215,247,232,0.75)";ctx.fillRect(Math.round(x-10),Math.round(y+5),20,1);
      }
      const angleA=seconds*.31;const angleB=seconds*.25+2.7;
      const ax=176+Math.cos(angleA)*48, ay=186+Math.sin(angleA*2)*4, ad=-Math.sign(Math.sin(angleA)||1);
      drawDuck(ax,ay,ad,.74);drawDuck(ax-ad*15,ay+3,ad,.57);
      const bx=414+Math.cos(angleB)*25, by=187+Math.sin(angleB*2)*3, bd=-Math.sign(Math.sin(angleB)||1);
      drawDuck(bx,by,bd,.67);drawDuck(bx-bd*13,by+3,bd,.52);

      ctx.fillStyle="#c7ad86";ctx.fillRect(0,211,W,3);
      ctx.fillStyle="#b99569";ctx.fillRect(0,214,W,CONFIG.playBottom-214);
      for(let x=4;x<W;x+=17){ctx.fillStyle=x%34===0?"#cfb48c":"#a9845c";ctx.fillRect(x,221+(x%5),8,3);}
    }


    function drawLakeBackground() {
      const [skyTop, skyBottom] = getTimeSkyColors("lake");
      fillLevelSky(skyTop, skyBottom);
      drawTimeSkyDetails("lake");
      const seconds = game.visualTime;

      ctx.fillStyle = "#7ea7b6";
      const mountainSteps = [
        [0,148,42,66],[34,132,40,82],[65,115,45,99],[101,137,54,77],
        [146,128,51,86],[190,151,50,63],[231,136,55,78],[277,119,58,95],
        [326,143,54,71],[371,126,54,88],[416,147,64,67]
      ];
      for (const block of mountainSteps) ctx.fillRect(...block);
      ctx.fillStyle = "#a9c7cf";
      ctx.fillRect(0, 157, W, 57);
      for (let x = 0; x < W; x += 72) ctx.fillRect(x + 18, 144 - (x % 9), 44, 70);

      ctx.fillStyle = "#4aa9cc";
      ctx.fillRect(0, 165, W, 49);
      ctx.fillStyle = "#76cce0";
      ctx.fillRect(0, 171, W, 4);
      ctx.fillRect(0, 193, W, 3);
      ctx.fillStyle = "#c8f1f1";
      for (let x = 5; x < W; x += 44) ctx.fillRect(x, 182 + (x % 5), 25, 1);

      // Small animated ripples drift at different speeds across the water.
      for (let row = 0; row < 5; row += 1) {
        const y = 174 + row * 7;
        const speed = 9 + row * 2.5;
        const offset = ((seconds * speed + row * 57) % (W + 70)) - 35;
        ctx.fillStyle = row % 2 === 0 ? "rgba(210,247,247,0.78)" : "rgba(118,204,224,0.82)";
        for (let x = offset - 70; x < W + 40; x += 72) {
          const width = 13 + (row % 3) * 6;
          ctx.fillRect(Math.round(x), y + Math.round(Math.sin(seconds * 1.5 + row) * 1), width, 1);
          ctx.fillRect(Math.round(x + width + 5), y + 2, Math.max(5, width - 8), 1);
        }
      }

      function drawSailboat(baseX, baseY, scale, speed, phase, range, hull, sail) {
        const x = Math.round(baseX + Math.sin(seconds * speed + phase) * range);
        const y = Math.round(baseY + Math.sin(seconds * (speed * 2.8) + phase) * 1.5);
        const flap = Math.floor(seconds * (4.2 + speed) + phase) % 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = "#385a66";
        ctx.fillRect(0, -17, 2, 17);
        ctx.fillStyle = sail;
        ctx.fillRect(3, -15, 12, 2);
        ctx.fillRect(3, -13, 9, 2);
        ctx.fillRect(3, -11, 6, 2);
        ctx.fillStyle = "#f3b46e";
        ctx.fillRect(1, -17, flap ? 8 : 6, 2);
        ctx.fillRect(flap ? 6 : 5, -15, flap ? 3 : 2, 2);
        ctx.fillStyle = hull;
        ctx.fillRect(-7, 0, 21, 3);
        ctx.fillStyle = mixHexColors(hull, "#241c1a", 0.42);
        ctx.fillRect(-4, 3, 15, 2);
        ctx.restore();
      }

      // Three boats sway locally and at different rates, so the lake feels alive
      // without any one boat traversing the full stage.
      drawSailboat(270, 166, 1.00, 0.34, 0.0, 24, "#8b5b3d", "#f7f1df");
      drawSailboat(88, 184, 0.68, 0.23, 1.8, 11, "#76513a", "#fff3c9");
      drawSailboat(403, 178, 0.76, 0.41, 4.1, 14, "#70425b", "#dcefff");
    }


    function drawGardenBackground() {
      const [skyTop, skyBottom] = getTimeSkyColors("garden");
      fillLevelSky(skyTop, skyBottom);
      drawTimeSkyDetails("garden");
      const seconds = game.visualTime;

      ctx.fillStyle = "#c39d78";
      ctx.fillRect(0, 108, W, 22);
      ctx.fillStyle = "#e7c9aa";
      for (let x = 0; x < W; x += 24) ctx.fillRect(x, 111 + (x % 5), 18, 16);

      ctx.fillStyle = "#8fd39a";
      ctx.fillRect(0, 129, W, 40);
      ctx.fillStyle = "#71c17d";
      ctx.fillRect(0, 154, W, 15);

      ctx.fillStyle = "#6ab8df";
      ctx.fillRect(112, 120, 44, 94);
      ctx.fillRect(102, 164, 64, 50);
      ctx.fillStyle = "#9be1ef";
      ctx.fillRect(116, 120, 8, 94);
      ctx.fillRect(106, 167, 56, 4);
      ctx.fillRect(106, 191, 56, 3);

      ctx.fillStyle = "#d5c4aa";
      ctx.fillRect(176, 124, 118, 31);
      ctx.fillStyle = "#c3b095";
      ctx.fillRect(188, 132, 94, 14);
      ctx.fillStyle = "#9f7d5d";
      ctx.fillRect(96, 148, 150, 6);
      ctx.fillRect(104, 146, 10, 3);
      ctx.fillRect(230, 146, 10, 3);

      const houses = [
        [20,115,44,32,"#f4efd8","#97b7cf"],
        [164,105,34,30,"#e7d69d","#9a6c55"],
        [268,112,42,28,"#dfb582","#d76b55"],
        [386,106,52,31,"#c8d4de","#8da2b5"]
      ];
      for (const [x, y, w, h, body, roof] of houses) {
        ctx.fillStyle = body; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = roof; ctx.fillRect(x - 4, y - 5, w + 8, 6);
        ctx.fillStyle = "#6f4d3c"; ctx.fillRect(x + 6, y + h - 13, 8, 13);
        ctx.fillStyle = "#dff6ff"; ctx.fillRect(x + 20, y + 8, 10, 8);
      }

      const gardenTrees = [
        [74, 138, 18], [150, 128, 24], [332, 141, 16], [362, 124, 27], [452, 135, 20]
      ];
      for (const [x, trunkY, canopyLift] of gardenTrees) {
        ctx.fillStyle = "#80553a"; ctx.fillRect(x, trunkY, 4, 214 - trunkY);
        ctx.fillStyle = "#4a9f54"; ctx.fillRect(x - 10, trunkY - 11 - canopyLift * 0.08, 24, 14 + Math.round(canopyLift * 0.08));
        ctx.fillStyle = "#6ac76a"; ctx.fillRect(x - 8, trunkY - 15 - canopyLift * 0.18, 20, 9 + Math.round(canopyLift * 0.05));
      }

      ctx.fillStyle = "#56b64c";
      for (let x = -12; x < W; x += 38) {
        ctx.fillRect(x, 172 + (x % 6), 44, 42);
        ctx.fillStyle = "#8fe25e";
        ctx.fillRect(x + 8, 168 + (x % 6), 26, 10);
        ctx.fillStyle = "#56b64c";
      }

      // More detailed flowers sway gently in the wind.
      const flowerColors = ["#fff07a", "#ff8e9e", "#b895ff", "#ffffff", "#ffb65f"];
      const flowerTops = [];
      for (let x = 17, index = 0; x < W; x += 31, index += 1) {
        const sway = Math.round(Math.sin(seconds * 1.35 + index * 0.67) * 2.2);
        const topX = x + sway;
        const topY = 183 + (index % 5) * 2 - (index % 2 ? 3 : 0);
        flowerTops.push([topX, topY]);
        ctx.fillStyle = "#2d7a3a";
        ctx.fillRect(x, 197, 2, 17);
        ctx.fillRect(x + Math.round(sway * 0.45), 191, 2, 8);
        ctx.fillStyle = "#4da34a";
        ctx.fillRect(x - 3, 202, 4, 2);
        ctx.fillRect(x + 2, 198, 4, 2);
        const petal = flowerColors[index % flowerColors.length];
        ctx.fillStyle = petal;
        ctx.fillRect(topX - 4, topY - 1, 9, 3);
        ctx.fillRect(topX - 2, topY - 4, 5, 9);
        ctx.fillStyle = "#f5b72e";
        ctx.fillRect(topX, topY, 2, 2);
        ctx.fillStyle = mixHexColors(petal, "#ffffff", 0.55);
        ctx.fillRect(topX - 2, topY - 3, 2, 2);
      }

      // A lighter bee pass: only two bees are active, and each one fully exits
      // the screen before re-entering so they never pop in/out mid-map.
      const beeConfigs = [
        { speed: 30, phase: 0.0, hoverPhase: 0.0, yBase: 177 },
        { speed: 34, phase: 0.43, hoverPhase: 1.7, yBase: 184 }
      ];
      beeConfigs.forEach((bee, index) => {
        const beeHalfWidth = 5;
        const travel = ((seconds * bee.speed + bee.phase * 480) % (W + 110)) - 55;
        if (travel < -beeHalfWidth || travel > W + beeHalfWidth) return;
        const target = flowerTops[(index * 5 + Math.floor(seconds / 3.6)) % flowerTops.length];
        const onScreenBlend = clamp((travel + 8) / (W - 16), 0, 1);
        const scenicWeight = Math.sin(onScreenBlend * Math.PI);
        const hoverBlend = (0.38 + 0.32 * (0.5 + 0.5 * Math.sin(seconds * 0.7 + bee.hoverPhase))) * scenicWeight;
        const x = lerp(travel, target[0], hoverBlend);
        const y = bee.yBase + Math.sin(seconds * 2.3 + index * 0.9) * 6 - hoverBlend * 7;
        const wingBeat = Math.floor(seconds * 12 + index) % 2;
        ctx.fillStyle = "rgba(240,251,255,0.88)";
        ctx.fillRect(Math.round(x - 4), Math.round(y - 4 - wingBeat), 4, 3);
        ctx.fillRect(Math.round(x + 2), Math.round(y - 4 + wingBeat), 4, 3);
        ctx.fillStyle = "#3b2b1b";
        ctx.fillRect(Math.round(x - 3), Math.round(y - 1), 8, 5);
        ctx.fillStyle = "#f0c52f";
        ctx.fillRect(Math.round(x - 2), Math.round(y), 2, 4);
        ctx.fillRect(Math.round(x + 2), Math.round(y), 2, 4);
        ctx.fillStyle = "#1d2525";
        ctx.fillRect(Math.round(x + 5), Math.round(y), 2, 2);
      });
    }

    function drawBackground(levelId = game.selectedLevelId) {
      const theme = (LEVELS[levelId] || LEVELS.park).theme;
      if (theme === "swamp") {
        drawSwampBackground();
      } else if (theme === "jungle") {
        drawJungleBackground();
      } else if (theme === "pond") {
        drawPondBackground();
      } else if (theme === "lake") {
        drawLakeBackground();
      } else if (theme === "garden") {
        drawGardenBackground();
      } else {
        drawParkBackground();
      }
    }

    function drawParkPlatform(platform) {
      const x = Math.round(platform.x);
      const y = Math.round(platform.y);
      const w = Math.round(platform.w);
      const h = Math.round(platform.h);

      if (platform.ground) {
        ctx.fillStyle = COLORS.grassDark;
        ctx.fillRect(x, y, w, 4);
        ctx.fillStyle = COLORS.grass;
        ctx.fillRect(x, y, w, 2);
        ctx.fillStyle = COLORS.grassLight;
        ctx.fillRect(x, y, w, 1);

        ctx.fillStyle = COLORS.dirtDark;
        ctx.fillRect(x, y + 4, w, h - 4);
        ctx.fillStyle = COLORS.dirtLight;
        ctx.fillRect(x, y + 6, w, h - 6);

        for (let px = x; px < x + w; px += 10) {
          ctx.fillStyle = COLORS.grassDark;
          ctx.fillRect(px + 2, y + 3, 4, 3);
          ctx.fillStyle = COLORS.dirtDark;
          ctx.fillRect(px + 5, y + 6, 3, 3);
        }
        return;
      }

      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x + 3, y + 2, w - 6, h + 2);
      ctx.fillRect(x + 7, y + h + 1, w - 14, 2);

      ctx.fillStyle = COLORS.dirtDark;
      ctx.fillRect(x + 5, y + 4, w - 10, h - 1);
      ctx.fillStyle = COLORS.dirt;
      ctx.fillRect(x + 7, y + 5, w - 14, h - 4);
      ctx.fillStyle = COLORS.dirtLight;
      ctx.fillRect(x + 9, y + 6, w - 18, 2);

      ctx.fillStyle = COLORS.grassDark;
      ctx.fillRect(x + 2, y, w - 4, 5);
      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(x + 3, y, w - 6, 3);
      ctx.fillStyle = COLORS.grassLight;
      ctx.fillRect(x + 5, y, w - 10, 1);

      for (let px = x + 8; px < x + w - 8; px += 12) {
        ctx.fillStyle = COLORS.grassDark;
        ctx.fillRect(px, y + 3, 4, 4);
        ctx.fillStyle = COLORS.dirtDark;
        ctx.fillRect(px + 4, y + 5, 4, 4);
      }
    }


    function drawSwampPlatform(platform) {
      const x = Math.round(platform.x);
      const y = Math.round(platform.y);
      const w = Math.round(platform.w);
      const h = Math.round(platform.h);
      if (platform.ground) {
        ctx.fillStyle = "#183d35";
        ctx.fillRect(x, y, w, 4);
        ctx.fillStyle = "#4b8d49";
        ctx.fillRect(x, y, w, 2);
        ctx.fillStyle = "#8ab95e";
        ctx.fillRect(x, y, w, 1);
        ctx.fillStyle = "#332b28";
        ctx.fillRect(x, y + 4, w, h - 4);
        ctx.fillStyle = "#594234";
        ctx.fillRect(x, y + 7, w, h - 7);
        for (let px = x + 5; px < x + w; px += 18) {
          ctx.fillStyle = "#1d5b42";
          ctx.fillRect(px, y + 2, 7, 3);
          ctx.fillStyle = "#76604a";
          ctx.fillRect(px + 8, y + 8, 4, 2);
        }
        return;
      }
      ctx.fillStyle = "#122b2d";
      ctx.fillRect(x + 3, y + 2, w - 6, h + 3);
      ctx.fillStyle = "#5c3a2a";
      ctx.fillRect(x + 5, y + 4, w - 10, h - 1);
      ctx.fillStyle = "#8a5a32";
      ctx.fillRect(x + 8, y + 5, w - 16, 3);
      ctx.fillStyle = "#285e3c";
      ctx.fillRect(x + 2, y, w - 4, 5);
      ctx.fillStyle = "#5ca24c";
      ctx.fillRect(x + 5, y, w - 10, 3);
      ctx.fillStyle = "#a1c762";
      ctx.fillRect(x + 9, y, w - 18, 1);
      for (let px = x + 11; px < x + w - 7; px += 18) {
        ctx.fillStyle = "#1c4a36";
        ctx.fillRect(px, y + h, 2, 5 + (px % 4));
      }
    }

    function drawJunglePlatform(platform) {
      const x = Math.round(platform.x);
      const y = Math.round(platform.y);
      const w = Math.round(platform.w);
      const h = Math.round(platform.h);
      if (platform.ground) {
        ctx.fillStyle = "#0d3a30";
        ctx.fillRect(x, y, w, 5);
        ctx.fillStyle = "#2d7a45";
        ctx.fillRect(x, y, w, 3);
        ctx.fillStyle = "#75b955";
        ctx.fillRect(x, y, w, 1);
        ctx.fillStyle = "#3f2f29";
        ctx.fillRect(x, y + 5, w, h - 5);
        ctx.fillStyle = "#664632";
        ctx.fillRect(x, y + 8, w, h - 8);
        for (let px = x; px < x + w; px += 15) {
          ctx.fillStyle = "#1f5a39";
          ctx.fillRect(px + 2, y + 3, 9, 3);
        }
        return;
      }
      ctx.fillStyle = "#09272b";
      ctx.fillRect(x + 3, y + 2, w - 6, h + 3);
      ctx.fillStyle = "#563829";
      ctx.fillRect(x + 5, y + 4, w - 10, h);
      ctx.fillStyle = "#875a35";
      ctx.fillRect(x + 8, y + 5, w - 16, 3);
      ctx.fillStyle = "#14523b";
      ctx.fillRect(x + 2, y, w - 4, 5);
      ctx.fillStyle = "#2e8a4a";
      ctx.fillRect(x + 4, y, w - 8, 3);
      ctx.fillStyle = "#78c75b";
      ctx.fillRect(x + 8, y, w - 16, 1);
      for (let px = x + 7; px < x + w - 6; px += 13) {
        ctx.fillStyle = "#0f4b38";
        ctx.fillRect(px, y + h, 2, 6);
        ctx.fillRect(px + 2, y + h + 4, 4, 2);
      }
    }

    function drawPondPlatform(platform) {
      const x = Math.round(platform.x);
      const y = Math.round(platform.y);
      const w = Math.round(platform.w);
      const h = Math.round(platform.h);
      if (platform.ground) {
        ctx.fillStyle = "#286f68";
        ctx.fillRect(x, y, w, 4);
        ctx.fillStyle = "#54b7a1";
        ctx.fillRect(x, y, w, 2);
        ctx.fillStyle = "#b1ead0";
        ctx.fillRect(x, y, w, 1);
        ctx.fillStyle = "#7e5a35";
        ctx.fillRect(x, y + 4, w, h - 4);
        ctx.fillStyle = "#b57a43";
        ctx.fillRect(x, y + 7, w, h - 7);
        for (let px = x + 4; px < x + w; px += 20) {
          ctx.fillStyle = "#3a8d50";
          ctx.fillRect(px, y + 2, 10, 3);
        }
        return;
      }
      ctx.fillStyle = "#1d4850";
      ctx.fillRect(x + 4, y + 3, w - 8, 8);
      ctx.fillRect(x + 8, y + 1, w - 16, 12);
      ctx.fillStyle = "#247b48";
      ctx.fillRect(x + 3, y + 1, w - 6, 6);
      ctx.fillRect(x + 8, y, w - 16, 8);
      ctx.fillStyle = "#4fbd5d";
      ctx.fillRect(x + 7, y + 1, w - 18, 4);
      ctx.fillStyle = "#9adf72";
      ctx.fillRect(x + 11, y + 1, Math.max(8, Math.floor(w * 0.42)), 1);
      ctx.fillStyle = "#155c42";
      ctx.fillRect(x + Math.floor(w * 0.68), y + 1, 2, 5);
      ctx.fillRect(x + Math.floor(w * 0.68), y + 1, 9, 2);
      ctx.fillStyle = "#2b7655";
      ctx.fillRect(x + Math.floor(w / 2), y + 8, 2, h - 5);
    }

    function drawLakePlatform(platform) {
      const x = Math.round(platform.x);
      const y = Math.round(platform.y);
      const w = Math.round(platform.w);
      const h = Math.round(platform.h);
      if (platform.ground) {
        ctx.fillStyle = "#456b72";
        ctx.fillRect(x, y, w, 4);
        ctx.fillStyle = "#8bb7b4";
        ctx.fillRect(x, y, w, 2);
        ctx.fillStyle = "#d5e4cf";
        ctx.fillRect(x, y, w, 1);
        ctx.fillStyle = "#6f736f";
        ctx.fillRect(x, y + 4, w, h - 4);
        ctx.fillStyle = "#a8aaa1";
        ctx.fillRect(x, y + 7, w, h - 7);
        for (let px = x + 6; px < x + w; px += 17) {
          ctx.fillStyle = "#59646a";
          ctx.fillRect(px, y + 5, 7, 3);
        }
        return;
      }
      ctx.fillStyle = "#273b42";
      ctx.fillRect(x + 3, y + 2, w - 6, h + 2);
      ctx.fillStyle = "#74614a";
      ctx.fillRect(x + 4, y + 3, w - 8, h);
      ctx.fillStyle = "#b78b55";
      ctx.fillRect(x + 5, y + 2, w - 10, 7);
      ctx.fillStyle = "#dfb96f";
      ctx.fillRect(x + 7, y + 2, w - 14, 2);
      for (let px = x + 11; px < x + w - 7; px += 16) {
        ctx.fillStyle = "#765537";
        ctx.fillRect(px, y + 2, 2, 9);
      }
      ctx.fillStyle = "#334a51";
      ctx.fillRect(x + 8, y + h + 1, 3, 5);
      ctx.fillRect(x + w - 11, y + h + 1, 3, 5);
    }

    function drawGardenPlatform(platform) {
      const x = Math.round(platform.x);
      const y = Math.round(platform.y);
      const w = Math.round(platform.w);
      const h = Math.round(platform.h);
      if (platform.ground) {
        ctx.fillStyle = "#347b3c";
        ctx.fillRect(x, y, w, 4);
        ctx.fillStyle = "#6fc553";
        ctx.fillRect(x, y, w, 2);
        ctx.fillStyle = "#b9ea72";
        ctx.fillRect(x, y, w, 1);
        ctx.fillStyle = "#75452d";
        ctx.fillRect(x, y + 4, w, h - 4);
        ctx.fillStyle = "#ad6b3b";
        ctx.fillRect(x, y + 7, w, h - 7);
        for (let px = x + 8; px < x + w; px += 23) {
          ctx.fillStyle = "#4d963e";
          ctx.fillRect(px, y + 2, 8, 3);
        }
        return;
      }
      ctx.fillStyle = "#4d342b";
      ctx.fillRect(x + 3, y + 2, w - 6, h + 2);
      ctx.fillStyle = "#8f5432";
      ctx.fillRect(x + 5, y + 4, w - 10, h - 1);
      ctx.fillStyle = "#c27a43";
      ctx.fillRect(x + 7, y + 5, w - 14, 3);
      ctx.fillStyle = "#347b3c";
      ctx.fillRect(x + 2, y, w - 4, 5);
      ctx.fillStyle = "#70c653";
      ctx.fillRect(x + 4, y, w - 8, 3);
      ctx.fillStyle = "#b9ea72";
      ctx.fillRect(x + 7, y, w - 14, 1);
      const flowers = ["#fff07a", "#ff8e9e", "#b895ff"];
      for (let px = x + 12, i = 0; px < x + w - 8; px += 24, i += 1) {
        drawDetailedFlower(px, y, flowers[i % flowers.length], px * 0.09 + i, 0.46);
      }
    }

    function drawPlatform(platform, levelId = game.selectedLevelId) {
      const theme = (LEVELS[levelId] || LEVELS.park).theme;
      if (theme === "swamp") {
        drawSwampPlatform(platform);
      } else if (theme === "jungle") {
        drawJunglePlatform(platform);
      } else if (theme === "pond") {
        drawPondPlatform(platform);
      } else if (theme === "lake") {
        drawLakePlatform(platform);
      } else if (theme === "garden") {
        drawGardenPlatform(platform);
      } else {
        drawParkPlatform(platform);
      }
    }

    function drawFlyAt(x, y, scale = 1) {
      const px = Math.round(x);
      const py = Math.round(y);
      const s = scale;

      ctx.fillStyle = COLORS.white;
      ctx.fillRect(px - 5 * s, py - 3 * s, 4 * s, 3 * s);
      ctx.fillRect(px + 2 * s, py - 3 * s, 4 * s, 3 * s);
      ctx.fillStyle = "#d8f5ff";
      ctx.fillRect(px - 6 * s, py - 1 * s, 4 * s, 2 * s);
      ctx.fillRect(px + 3 * s, py - 1 * s, 4 * s, 2 * s);

      ctx.fillStyle = COLORS.flyBlack;
      ctx.fillRect(px - 3 * s, py - 4 * s, 6 * s, 9 * s);
      ctx.fillRect(px - 2 * s, py + 5 * s, 4 * s, 2 * s);
      ctx.fillStyle = COLORS.flyYellow;
      ctx.fillRect(px - 2 * s, py - 4 * s, 4 * s, 2 * s);
      ctx.fillStyle = COLORS.flyBlue;
      ctx.fillRect(px - 2 * s, py, 4 * s, 3 * s);
    }

    function getFlyLabelAnchor(currentFly) {
      if (currentFly.state === "spitting") {
        return { x: currentFly.returnX, y: currentFly.returnY };
      }
      return { x: currentFly.baseX, y: currentFly.baseY };
    }

    // Word plates must be visually stable. Each fly keeps one label rectangle and
    // one pre-rasterized label image for its lifetime in the current round. Every
    // plate is placed ABOVE its fly; new flies route around existing plates without
    // moving anything that is already visible.
    const flyLabelPlacementCache = new Map();
    const flyLabelSpriteCache = new Map();

    function flyLabelCacheKey(currentFly) {
      const id = Number(currentFly?.id) || 0;
      const vocab = Number(currentFly?.vocabIndex) || 0;
      if (game.mode === "pvp") {
        const round = Math.max(1, Number(game.pvpRoundNumber) || 1);
        const phase = game.pvpSuddenDeath ? "sd" : "normal";
        return `pvp:${round}:${phase}:${id}:${vocab}`;
      }
      return `solo:${id}:${vocab}`;
    }

    function pruneFlyLabelPlacementCache() {
      const live = new Set(flies.map((currentFly) => flyLabelCacheKey(currentFly)));
      for (const key of flyLabelPlacementCache.keys()) {
        if (!live.has(key)) flyLabelPlacementCache.delete(key);
      }
      for (const key of flyLabelSpriteCache.keys()) {
        if (!live.has(key)) flyLabelSpriteCache.delete(key);
      }
    }

    function overlapArea(first, second) {
      const width = Math.max(0, Math.min(first.x + first.w, second.x + second.w) - Math.max(first.x, second.x));
      const height = Math.max(0, Math.min(first.y + first.h, second.y + second.h) - Math.max(first.y, second.y));
      return width * height;
    }

    function getFlyLabelHudObstacles() {
      const obstacles = [
        { x: 3, y: 3, w: 92, h: 29 },
        { x: W - 95, y: 3, w: 92, h: 29 }
      ];
      if (game.mode === "pvp" || (game.mode === "solo" && Number(game.soloTimeLimitSeconds) > 0)) {
        obstacles.splice(1, 0, { x: W / 2 - 58, y: 3, w: 116, h: 25 });
      }
      return obstacles;
    }

    function chooseFlyLabelRect(currentFly, anchor, width, height) {
      // 1.5.0: the plate center remains locked directly above the fly's stable anchor.
      // It never shifts sideways to avoid the score, timer, pause button, or another
      // label. When two plates would overlap, only the vertical row may change.
      const cacheKey = flyLabelCacheKey(currentFly);
      const anchorX = Math.round(Number(anchor?.x ?? currentFly?.baseX ?? currentFly?.x) || 0);
      const anchorY = Math.round(Number(anchor?.y ?? currentFly?.baseY ?? currentFly?.y) || 0);
      const vocabIndex = Number(currentFly?.vocabIndex) || 0;
      const cached = flyLabelPlacementCache.get(cacheKey);
      if (cached && cached.vocabIndex === vocabIndex && cached.width === width && cached.height === height) {
        return cached.rect;
      }

      const centeredX = Math.round(anchorX - width / 2);
      const firstTop = Math.round(anchorY - height - 8);
      const stableLabelObstacles = [];
      for (const [otherKey, placement] of flyLabelPlacementCache.entries()) {
        if (otherKey === cacheKey || !placement?.rect) continue;
        stableLabelObstacles.push(placement.rect);
      }

      let chosen = null;
      for (let row = 0; row < 6; row += 1) {
        const candidate = {
          x: centeredX,
          y: Math.max(2, firstTop - row * (height + 4)),
          w: width,
          h: height
        };
        if (!stableLabelObstacles.some((other) => overlapArea(candidate, other) > 0)) {
          chosen = candidate;
          break;
        }
      }
      if (!chosen) chosen = { x: centeredX, y: Math.max(2, firstTop), w: width, h: height };

      const stableRect = Object.freeze(chosen);
      flyLabelPlacementCache.set(cacheKey, {
        vocabIndex,
        width,
        height,
        anchorX,
        anchorY,
        rect: stableRect
      });
      return stableRect;
    }

    function drawStableFlyLabelTextToSprite(targetContext, layout, width, textTop, lineHeight) {
      const lines = Array.isArray(layout?.lines) && layout.lines.length ? layout.lines : [""];
      const logicalScale = Number(layout?.scale) || 1;
      const cell = Math.max(1, Math.round(logicalScale * RENDER_SCALE));
      targetContext.save();
      targetContext.setTransform(1, 0, 0, 1, 0, 0);
      targetContext.fillStyle = "#34484f";
      lines.forEach((line, lineIndex) => {
        const value = normalizeBitmapText(line).toUpperCase();
        const visibleWidth = Math.round(measureBitmapText(value, logicalScale) * RENDER_SCALE);
        let cursorX = Math.round((width * RENDER_SCALE - visibleWidth) / 2);
        const lineY = Math.round((textTop + lineIndex * lineHeight) * RENDER_SCALE);
        for (const character of value) {
          if (character === " ") {
            cursorX += 4 * cell;
            continue;
          }
          const glyph = getBitmapGlyph(character);
          const glyphYOffset = glyph.length > 7 ? -cell : 0;
          for (let row = 0; row < glyph.length; row += 1) {
            for (let column = 0; column < glyph[row].length; column += 1) {
              if (glyph[row][column] !== "1") continue;
              targetContext.fillRect(
                cursorX + column * cell,
                lineY + glyphYOffset + row * cell,
                cell,
                cell
              );
            }
          }
          cursorX += 6 * cell;
        }
      });
      targetContext.restore();
    }

    function getFlyLabelSprite(currentFly, term, layout, width, height) {
      const cacheKey = flyLabelCacheKey(currentFly);
      const stripeColor = getSelectedSkin().mid;
      const signature = `${term}\u0000${layout.scale}\u0000${layout.lines.join("\u0001")}\u0000${width}x${height}\u0000${stripeColor}`;
      const cached = flyLabelSpriteCache.get(cacheKey);
      if (cached?.signature === signature) return cached.canvas;

      const sprite = document.createElement("canvas");
      sprite.width = width * RENDER_SCALE;
      sprite.height = height * RENDER_SCALE;
      const spriteContext = sprite.getContext("2d", { alpha: true });
      spriteContext.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      spriteContext.imageSmoothingEnabled = false;

      spriteContext.fillStyle = "rgba(38,54,61,0.28)";
      spriteContext.fillRect(2, 2, width - 2, height - 2);
      spriteContext.fillStyle = COLORS.ink;
      spriteContext.fillRect(0, 0, width, height);
      spriteContext.fillStyle = COLORS.white;
      spriteContext.fillRect(1, 1, width - 2, height - 2);
      spriteContext.fillStyle = stripeColor;
      spriteContext.fillRect(2, 2, width - 4, 2);

      const lineHeight = Math.max(7, Math.ceil(8 * layout.scale + 1));
      const textHeight = layout.lines.length * lineHeight - 1;
      const textTop = Math.round(5 + Math.max(0, (height - 7 - textHeight) / 2));
      drawStableFlyLabelTextToSprite(spriteContext, layout, width, textTop, lineHeight);

      flyLabelSpriteCache.set(cacheKey, { signature, canvas: sprite });
      return sprite;
    }

    function getCriticalCatchWordFade() {
      let progress = null;
      if (game.mode === "solo" && game.soloCriticalCatchActive) progress = getSoloCriticalCatchVisuals().progress;
      else if (game.mode === "pvp" && game.pvpCriticalCatchActive) progress = getPvpCriticalCatchVisuals().progress;
      if (progress === null) return 1;
      return 1 - clamp((progress - 0.08) / 0.52, 0, 1);
    }

    function drawFlyNameTag(currentFly) {
      if (game.sandboxMode || currentFly.sandboxTest) return;
      const term = normalizeVocabularyCellText(VOCABULARY[currentFly.vocabIndex]?.spanish || "?", 80);
      const anchor = getFlyLabelAnchor(currentFly);
      const layout = layoutStableFlyLabelText(term, 120);
      const widest = Math.max(...layout.lines.map((line) => measureBitmapText(line, layout.scale)), 0);
      const lineHeight = Math.max(7, Math.ceil(8 * layout.scale + 1));
      const width = Math.round(clamp(Math.max(32, widest + 10), 32, 132));
      const height = Math.round(Math.max(17, 8 + layout.lines.length * lineHeight));
      const rect = chooseFlyLabelRect(currentFly, anchor, width, height);
      const sprite = getFlyLabelSprite(currentFly, term, layout, width, height);
      const appear = clamp(currentFly.spawnAge / CONFIG.flyGrowDuration, 0, 1);
      const cinematic = game.soloCriticalCatchActive || game.pvpCriticalCatchActive;
      const alpha = appear * getCriticalCatchWordFade();
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = alpha;
      if (cinematic) {
        // During the final-catch camera move the plate stays in world space,
        // follows the fly's current bob/spit offset, and fades with the action.
        const currentX = Number.isFinite(Number(currentFly.x)) ? Number(currentFly.x) : anchor.x;
        const currentY = Number.isFinite(Number(currentFly.y)) ? Number(currentFly.y) : anchor.y;
        const drawX = rect.x + (currentX - anchor.x);
        const drawY = rect.y + (currentY - anchor.y);
        ctx.drawImage(sprite, drawX, drawY, width, height);
      } else {
        // Outside cinematics keep the existing physical-pixel lock for maximum
        // stability on high-DPI and scaled displays.
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(sprite, Math.round(rect.x * RENDER_SCALE), Math.round(rect.y * RENDER_SCALE));
      }
      ctx.restore();
    }

    function getFlySpawnScale(currentFly) {
      const progress = clamp(currentFly.spawnAge / CONFIG.flyGrowDuration, 0, 1);
      return lerp(0.16, 1, easeOutCubic(progress));
    }

    function drawFlySpawnSparks(currentFly) {
      if (currentFly.spawnAge >= CONFIG.flySpawnEffectDuration) return;

      const progress = clamp(currentFly.spawnAge / CONFIG.flySpawnEffectDuration, 0, 1);
      const radius = lerp(2, 14, easeOutCubic(progress));
      const fade = Math.pow(1 - progress, 1.15);
      const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [0.72, 0.72], [-0.72, 0.72], [0.72, -0.72], [-0.72, -0.72]
      ];

      ctx.save();
      ctx.globalAlpha = fade;

      directions.forEach(([dx, dy], index) => {
        const stagger = 0.80 + (index % 3) * 0.10;
        const x = Math.round(currentFly.x + dx * radius * stagger);
        const y = Math.round(currentFly.y + dy * radius * stagger);
        const horizontal = Math.abs(dx) > Math.abs(dy);

        ctx.fillStyle = index % 2 === 0 ? COLORS.white : COLORS.flyYellow;
        ctx.fillRect(x - 1, y - 1, horizontal ? 4 : 2, horizontal ? 2 : 4);
        ctx.fillStyle = COLORS.cloudShade;
        ctx.fillRect(x, y, 2, 2);
      });

      if (progress < 0.36) {
        const flashAlpha = 1 - progress / 0.36;
        ctx.globalAlpha = flashAlpha;
        const x = Math.round(currentFly.x);
        const y = Math.round(currentFly.y);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(x - 8, y - 1, 16, 3);
        ctx.fillRect(x - 1, y - 8, 3, 16);
        ctx.fillStyle = COLORS.flyYellow;
        ctx.fillRect(x - 4, y, 8, 1);
        ctx.fillRect(x, y - 4, 1, 8);
      }

      ctx.restore();
    }

    function getPreviewPoints() {
      if (!frog.charging || !frog.grounded) return [];

      // The preview always shows the normal jump arc. An immediate tap can
      // still drop through a platform, but the guide never snaps to a separate
      // downward path while the player is pressing the button.
      const velocity = getJumpVelocity(frog.charge, false);
      const apexTime = Math.max(0, -velocity.vy / CONFIG.gravity);
      const wallTime = velocity.vx > 0
        ? (W - frog.w - frog.x) / velocity.vx
        : frog.x / -velocity.vx;
      const endTime = Math.max(0, Math.min(apexTime, wallTime));

      if (endTime <= 0) return [];

      const points = [];
      const firstSampleTime = 0.045;
      const sampleInterval = 0.09;

      function addPoint(time) {
        const x = clamp(frog.x + velocity.vx * time, 0, W - frog.w);
        const y = frog.y + velocity.vy * time + 0.5 * CONFIG.gravity * time * time;
        points.push({ x: x + frog.w / 2, y: y + frog.h / 2 });
      }

      for (let time = firstSampleTime; time < endTime; time += sampleInterval) {
        addPoint(time);
      }

      addPoint(endTime);
      return points;
    }

    function drawArcPreview() {
      const points = getPreviewPoints();
      if (!points.length) return;

      ctx.save();
      points.forEach((point, index) => {
        if (point.y < -8 || point.y > CONFIG.playBottom) return;

        const progress = points.length <= 1 ? 0 : index / (points.length - 1);
        const fadeProgress = index < 3
          ? 0
          : (index - 2) / Math.max(1, points.length - 2);
        const alpha = 0.94 * Math.pow(1 - fadeProgress, 1.25);
        if (alpha <= 0.025) return;

        ctx.globalAlpha = alpha;
        const x = Math.round(point.x);
        const y = Math.round(point.y);
        const lateFade = progress > 0.72;

        ctx.fillStyle = getSelectedSkin().dark;
        ctx.fillRect(x - (lateFade ? 1 : 2), y - 1, lateFade ? 3 : 5, lateFade ? 2 : 4);
        ctx.fillStyle = getSelectedSkin().light;
        ctx.fillRect(x - 1, y - (lateFade ? 1 : 2), lateFade ? 2 : 4, lateFade ? 2 : 3);
      });
      ctx.restore();
    }

    function drawTongue() {
      if (!tongue.active) return;

      const mouth = getFrogMouth();
      const progress = clamp(tongue.elapsed / tongue.duration, 0, 1);
      const extension = Math.sin(progress * Math.PI);
      const rawEndX = lerp(mouth.x, tongue.targetX, extension);
      const endX = frog.dir > 0
        ? Math.max(mouth.x, rawEndX)
        : Math.min(mouth.x, rawEndX);
      const endY = lerp(mouth.y, tongue.targetY, extension);
      const dx = endX - mouth.x;
      const dy = endY - mouth.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const steps = Math.ceil(distance / 3);

      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = Math.round(lerp(mouth.x, endX, t));
        const y = Math.round(lerp(mouth.y, endY, t));
        ctx.fillStyle = getSelectedSkin().tongueDark;
        ctx.fillRect(x - 1, y, 3, 2);
        ctx.fillStyle = getSelectedSkin().tongue;
        ctx.fillRect(x, y - 1, 2, 2);
      }
    }

    function getFrogPalette() {
      const skin = getSelectedSkin();
      return {
        dark: skin.dark,
        mid: skin.mid,
        light: skin.light,
        belly: skin.belly,
        accents: skin.accents || skin.bump || skin.crest || skin.light,
        arms: skin.arms || skin.accents || skin.bump || skin.light,
        crest: skin.crest || skin.accents || skin.light,
        feet: skin.feet || skin.accents || skin.light,
        hat: skin.hat || "none"
      };
    }

    function drawCatchSparkles() {
      if (frog.catchSparkleTimer <= 0) return;

      const progress = clamp(
        1 - frog.catchSparkleTimer / CONFIG.catchSparkleDuration,
        0,
        1
      );
      const centerX = frog.x + frog.w / 2;
      const centerY = frog.y + frog.h / 2;
      const radius = lerp(8, 19, easeOutCubic(progress));
      const fade = Math.pow(1 - progress, 0.65);
      const sparkleDirections = [
        { x: -0.92, y: -0.58, color: COLORS.white },
        { x: -0.34, y: -1.00, color: COLORS.flyYellow },
        { x:  0.48, y: -0.88, color: getSelectedSkin().light },
        { x:  0.98, y: -0.22, color: COLORS.white },
        { x:  0.76, y:  0.66, color: COLORS.flyYellow },
        { x: -0.72, y:  0.70, color: getSelectedSkin().light }
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

    function drawWrongCatchBubbles() {
      if (frog.wrongCatchBubbleTimer <= 0) return;

      const progress = clamp(
        1 - frog.wrongCatchBubbleTimer / CONFIG.wrongCatchBubbleDuration,
        0,
        1
      );
      const centerX = frog.x + frog.w / 2;
      const centerY = frog.y + 7;
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

      // Wavy odor marks make the puffs unmistakably read as a wrong answer.
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

    function drawVictoryFrog() {
      const palette = getFrogPalette();
      const cycle = (frog.danceTime * 1.65) % 1;
      const jumpCurve = Math.max(0, Math.sin(cycle * Math.PI));
      const lift = Math.round(Math.pow(jumpCurve, 0.82) * 10);
      const airborne = lift > 1;
      const nearLanding = cycle < 0.08 || cycle > 0.92;
      const scaleX = nearLanding ? 1.10 : airborne ? 0.96 : 1;
      const scaleY = nearLanding ? 0.90 : airborne ? 1.05 : 1;
      const centerX = Math.round(frog.x + frog.w / 2);
      const groundY = Math.round(frog.y + frog.h);
      const baseY = groundY - lift;
      const armBeat = Math.sin(frog.danceTime * 13) >= 0;

      // Keep one stable shadow throughout the victory hop so it never blinks at landing.
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(centerX - 7, groundY + 1, 14, 2);
      ctx.restore();

      ctx.save();
      ctx.translate(centerX, baseY);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-12, -16);

      // Front-facing arms. They pop upward while the frog is airborne.
      ctx.fillStyle = palette.dark;
      if (airborne) {
        ctx.fillRect(-1, armBeat ? 3 : 5, 6, 3);
        ctx.fillRect(19, armBeat ? 5 : 3, 6, 3);
        ctx.fillStyle = palette.arms;
        ctx.fillRect(0, armBeat ? 3 : 5, 4, 1);
        ctx.fillRect(20, armBeat ? 5 : 3, 4, 1);
      } else {
        ctx.fillRect(0, 7, 5, 3);
        ctx.fillRect(19, 7, 5, 3);
        ctx.fillStyle = palette.arms;
        ctx.fillRect(1, 7, 3, 1);
        ctx.fillRect(20, 7, 3, 1);
      }

      // Feet spread on landing and tuck inward during each happy hop.
      ctx.fillStyle = palette.dark;
      if (airborne) {
        ctx.fillRect(4, 12, 7, 4);
        ctx.fillRect(13, 12, 7, 4);
        ctx.fillStyle = palette.feet;
        ctx.fillRect(5, 12, 5, 2);
        ctx.fillRect(14, 12, 5, 2);
      } else {
        ctx.fillRect(0, 12, 9, 4);
        ctx.fillRect(15, 12, 9, 4);
        ctx.fillStyle = palette.feet;
        ctx.fillRect(1, 12, 7, 2);
        ctx.fillRect(16, 12, 7, 2);
      }

      // Symmetrical front-facing body and eye bumps.
      ctx.fillStyle = palette.dark;
      ctx.fillRect(3, 4, 18, 10);
      ctx.fillRect(6, 1, 12, 5);
      ctx.fillRect(3, 0, 6, 5);
      ctx.fillRect(15, 0, 6, 5);

      ctx.fillStyle = palette.mid;
      ctx.fillRect(4, 5, 16, 8);
      ctx.fillRect(7, 2, 10, 4);
      ctx.fillStyle = palette.crest;
      ctx.fillRect(4, 1, 4, 4);
      ctx.fillRect(16, 1, 4, 4);
      ctx.fillStyle = getFrogAccentHighlight(palette);
      ctx.fillRect(5, 5, 14, 2);
      ctx.fillRect(8, 2, 8, 2);
      ctx.fillStyle = palette.belly;
      ctx.fillRect(7, 8, 10, 5);

      // Two eyes and a broad little smile face the player directly.
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(5, 1, 3, 3);
      ctx.fillRect(16, 1, 3, 3);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(6, 2, 1, 2);
      ctx.fillRect(17, 2, 1, 2);
      ctx.fillRect(9, 6, 2, 1);
      ctx.fillRect(13, 6, 2, 1);
      ctx.fillRect(10, 7, 4, 1);
      ctx.fillStyle = getSelectedSkin().tongue;
      ctx.fillRect(11, 8, 2, 1);

      ctx.restore();
      if (palette.hat && palette.hat !== "none") {
        ctx.save();ctx.translate(centerX, baseY);ctx.scale(scaleX, scaleY);
        if (hatUsesEyeOverlay(palette.hat)) {
          drawFrontEyesOverHat(0, -16, palette, 1);
          drawPixelFrogHat(0, -15, palette.hat, 1, 1, {...palette,frontFacing:true});
        } else {
          drawPixelFrogHat(0, -16, palette.hat, 1, 1, {...palette,frontFacing:true});
          drawFrontEyesOverHat(0, -16, palette, 1);
        }
        ctx.restore();
      }

      // Pixel confetti alternates around the front-facing hops.
      const twinkle = Math.floor(frog.danceTime * 7) % 2;
      ctx.fillStyle = twinkle ? COLORS.flyYellow : COLORS.white;
      ctx.fillRect(centerX - 17, baseY - 21, 2, 2);
      ctx.fillRect(centerX + 15, baseY - 18, 2, 2);
      ctx.fillStyle = getSelectedSkin().light;
      ctx.fillRect(centerX - 16, baseY - 24, 1, 6);
      ctx.fillRect(centerX + 16, baseY - 21, 1, 6);
    }

    function drawGameplayFrogSpriteLocal(palette, airborne = false, blinking = false) {
      const feet = palette.feet || palette.light;
      const arms = palette.arms || palette.accents || palette.light;
      const crest = palette.crest || palette.bump || palette.eyeBump || palette.light;

      ctx.fillStyle = palette.dark;
      if (airborne) {
        ctx.fillRect(0, 9, 8, 4);
        ctx.fillRect(15, 7, 8, 4);
        ctx.fillStyle = feet;
        ctx.fillRect(1, 8, 7, 3);
        ctx.fillStyle = arms;
        ctx.fillRect(15, 8, 7, 2);
      } else {
        ctx.fillRect(0, 10, 8, 4);
        ctx.fillRect(14, 10, 8, 4);
        ctx.fillStyle = feet;
        ctx.fillRect(1, 10, 6, 2);
        ctx.fillRect(15, 10, 6, 2);
        ctx.fillStyle = arms;
        ctx.fillRect(17, 7, 4, 2);
      }

      ctx.fillStyle = palette.dark;
      ctx.fillRect(3, 5, 17, 8);
      ctx.fillRect(6, 2, 13, 4);
      ctx.fillRect(15, 0, 5, 5);
      ctx.fillStyle = palette.mid;
      ctx.fillRect(4, 6, 15, 6);
      ctx.fillRect(7, 3, 11, 4);
      ctx.fillStyle = crest;
      ctx.fillRect(16, 1, 3, 4);
      ctx.fillStyle = getFrogAccentHighlight(palette);
      ctx.fillRect(5, 6, 10, 2);
      ctx.fillRect(8, 3, 7, 2);
      ctx.fillStyle = palette.belly;
      ctx.fillRect(10, 9, 8, 3);

      if (palette.hat && palette.hat !== "none") {
        if (hatUsesEyeOverlay(palette.hat)) {
          ctx.fillStyle = COLORS.white;
          ctx.fillRect(16, 1, 3, 3);
          ctx.fillStyle = COLORS.ink;
          if (!blinking) ctx.fillRect(18, 2, 1, 2);
          else ctx.fillRect(16, 3, 3, 1);
          drawPixelFrogHat(11, 1, palette.hat, 1, 1, palette);
        } else {
          drawPixelFrogHat(11, 0, palette.hat, 1, 1, palette);
          drawSideEyeOverHat(11, 0, palette, 1, blinking, 1, 5);
        }
      } else {
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(16, 1, 3, 3);
        ctx.fillStyle = COLORS.ink;
        if (!blinking) ctx.fillRect(18, 2, 1, 2);
        else ctx.fillRect(16, 3, 3, 1);
      }
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(18, 6, 3, 1);
    }

    function drawFrog() {
      if(drawSandboxAnimationPreview())return;
      const dancing = game.state === "won" && frog.grounded;
      if (dancing) {
        drawVictoryFrog();
        return;
      }

      const palette = getFrogPalette();
      const airborne = !frog.grounded;
      const chargeSquash = frog.charging ? 1 + frog.charge * 0.25 : 1;
      const landSquash = 1 + frog.landingSquash * 0.20;
      const sx = chargeSquash * landSquash;
      const sy = 1 / Math.sqrt(sx);
      const baseX = Math.round(frog.x + frog.w / 2);
      const baseY = Math.round(frog.y + frog.h);

      ctx.save();
      ctx.translate(baseX, baseY);
      ctx.scale(frog.dir, 1);
      ctx.scale(sx, sy);
      ctx.translate(-11, -14);
      drawGameplayFrogSpriteLocal(palette, airborne, frog.blinking);
      ctx.restore();
    }

    function drawOffscreenFrogIndicator() {
      if (
        frog.y + frog.h >= 0 ||
        !["playing", "paused", "countdown"].includes(game.state)
      ) return;

      const centerX = Math.round(clamp(frog.x + frog.w / 2, 12, W - 12));
      const overlapsLeftHud = centerX < 92;
      const overlapsRightHud = centerX > W - 72;
      const top = overlapsLeftHud || overlapsRightHud ? 30 : 4;
      const pulse = 0.88 + Math.sin(game.visualTime * 8) * 0.12;

      ctx.save();
      ctx.globalAlpha = pulse;

      // Pixel bubble.
      ctx.fillStyle = "rgba(38,54,61,0.45)";
      ctx.fillRect(centerX - 7, top + 2, 16, 14);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(centerX - 7, top + 1, 14, 15);
      ctx.fillRect(centerX - 9, top + 4, 18, 9);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(centerX - 5, top + 3, 10, 11);
      ctx.fillRect(centerX - 7, top + 5, 14, 7);

      // Up arrow inside the bubble.
      ctx.fillStyle = getSelectedSkin().dark;
      ctx.fillRect(centerX - 1, top + 6, 3, 6);
      ctx.fillRect(centerX - 4, top + 6, 9, 2);
      ctx.fillRect(centerX - 3, top + 4, 7, 2);
      ctx.fillRect(centerX - 2, top + 3, 5, 2);
      ctx.fillStyle = getSelectedSkin().light;
      ctx.fillRect(centerX, top + 5, 1, 6);
      ctx.fillRect(centerX - 2, top + 6, 5, 1);

      ctx.restore();
    }

    function drawSpeechBubble() {
      if (frog.firstJumpMade || game.state !== "playing" || (game.sandboxMode && sandboxPreview.mode !== "play")) return;

      const x = 10;
      const y = 126;
      const w = 126;
      const h = 42;
      const bubbleRect = { x, y, w, h: h + 14 };
      const flyBehind = flies.some((currentFly) =>
        currentFly.state === "active" &&
        currentFly.baseX >= x - 8 && currentFly.baseX <= x + w + 8 &&
        currentFly.baseY >= y - 8 && currentFly.baseY <= y + h + 14
      );
      const jumpPreviewBehind = frog.charging && previewPathOverlapsRect(getPreviewPoints(), bubbleRect, 5);

      ctx.save();
      ctx.globalAlpha = flyBehind || jumpPreviewBehind ? 0.25 : 1;
      ctx.fillStyle = "rgba(38,54,61,0.42)";
      ctx.fillRect(x + 4, y + 4, w, h);
      ctx.fillRect(x + 56, y + h + 4, 12, 8);

      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x + 3, y, w - 6, h);
      ctx.fillRect(x, y + 4, w, h - 8);
      ctx.fillRect(x + 56, y + h, 12, 7);
      ctx.fillRect(x + 59, y + h + 7, 6, 5);

      ctx.fillStyle = COLORS.white;
      ctx.fillRect(x + 4, y + 2, w - 8, h - 4);
      ctx.fillRect(x + 2, y + 6, w - 4, h - 12);
      ctx.fillRect(x + 58, y + h - 1, 8, 7);
      ctx.fillRect(x + 60, y + h + 6, 4, 3);

      const mobileInstructions = isRibbitMobileMode();
      drawBitmapText(mobileInstructions ? "HOLD METER TO CHARGE" : "HOLD SPACE TO CHARGE", x + w / 2, y + 10, mobileInstructions ? 0.68 : 0.78, "center", "#4c555a");
      drawBitmapText(mobileInstructions ? "RELEASE TO JUMP" : "RELEASE TO JUMP", x + w / 2, y + 27, 0.92, "center", "#4c555a");
      ctx.restore();
    }

    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remaining = seconds - minutes * 60;
      return `${String(minutes).padStart(2, "0")}:${remaining.toFixed(1).padStart(4, "0")}`;
    }

    function drawHud() {
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(0, CONFIG.playBottom, W, 3);
      ctx.fillStyle = COLORS.panel;
      ctx.fillRect(0, CONFIG.playBottom + 3, W, H - CONFIG.playBottom - 3);
      ctx.fillStyle = COLORS.panelLight;
      ctx.fillRect(0, CONFIG.playBottom + 3, W, 2);

      // Jump meter.
      const meterX = 16;
      const meterY = 241;
      const meterW = 132;
      const meterH = 18;
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(meterX - 2, meterY - 2, meterW + 4, meterH + 4);
      ctx.fillStyle = getSelectedSkin().belly;
      ctx.fillRect(meterX, meterY, meterW, meterH);
      ctx.fillStyle = getSelectedSkin().belly;
      ctx.fillRect(meterX + 2, meterY + 2, meterW - 4, meterH - 4);

      const fill = frog.charging ? frog.charge : 0;
      const fillW = Math.max(0, Math.floor((meterW - 6) * fill));
      if (fillW > 0) {
        const meterGradient = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
        meterGradient.addColorStop(0, getSelectedSkin().light);
        meterGradient.addColorStop(0.68, getSelectedSkin().mid);
        meterGradient.addColorStop(1, getSelectedSkin().dark);
        ctx.fillStyle = meterGradient;
        ctx.fillRect(meterX + 3, meterY + 3, fillW, meterH - 6);
      }
      drawBitmapText("JUMP", meterX + meterW / 2, meterY + 5, 1, "center", COLORS.white, COLORS.ink);

      // The language target now occupies the center of the gray footer.
      drawVocabularyPrompt();
      if (game.sandboxMode) {
        drawBitmapText(isRibbitMobileMode() ? "TAP PREVIEW TO CHANGE" : "SHIFT: WIN / LOSE / PLAY", 306, 240, 0.72, "center", "#d9edf2");
        drawBitmapText(sandboxPreview.mode === "play" ? "TEST YOUR TONGUE COLOR" : sandboxPreview.mode === "win" ? "VICTORY PREVIEW" : "LOSING PREVIEW", 306, 252, 0.65, "center", getSelectedSkin().light);
      }

      if (!game.sandboxMode) {
        // Timer, current-round jumps, and best time.
        drawPixelText("TIME", 329, 235, 7, "left", "#cdeff5");
        drawPixelText(formatTime(getTimerTime()), 463, 234, 10, "right", COLORS.white);
        drawPixelText("JUMPS", 329, 247, 7, "left", "#cdeff5");
        drawPixelText(String(game.jumps), 463, 247, 8, "right", getSelectedSkin().light);
        drawPixelText("BEST", 329, 259, 7, "left", "#cdeff5");
        const bestTimeLabel = game.bestTime === null ? "--:--.-" : formatTime(game.bestTime);
        const bestJumpLabel = game.bestJumps === null ? "--" : String(game.bestJumps);
        drawMiniStopwatchIcon(377, 263, getSelectedSkin(), 0.48);
        drawBitmapText(bestTimeLabel, 385, 258, 0.66, "left", "#ffe27a");
        drawBitmapText("•", 424, 259, 0.62, "center", "#ffe27a");
        drawTrampolineIcon(438, 263, getSelectedSkin(), 0.43);
        drawBitmapText(bestJumpLabel, 463, 258, 0.68, "right", "#ffe27a");
      }

      if (game.muted) drawPixelText("MUTED", 82, 232, 7, "center", "#ffadad");
    }

    function drawVocabularyPrompt() {
      if (!["playing", "paused", "countdown"].includes(game.state)) return;
      if (game.sandboxMode || game.winPending || !Number.isInteger(game.targetVocabIndex)) return;

      const prompt = normalizeVocabularyCellText(VOCABULARY[game.targetVocabIndex]?.english || "", 80);
      const left = 154;
      const top = 234;
      const width = 172;
      const height = 33;
      const layout = layoutBitmapText(prompt, width - 12, { maxScale: 0.92, minScale: 0.50, maxLines: 2 });

      ctx.fillStyle = "rgba(25,43,52,0.35)";
      ctx.fillRect(left + 2, top + 2, width, height);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(left, top, width, height);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(left + 2, top + 2, width - 4, height - 4);
      ctx.fillStyle = getSelectedSkin().mid;
      ctx.fillRect(left + 4, top + 4, width - 8, 8);
      drawBitmapText(
        "FIND THE MATCH",
        W / 2,
        top + 5,
        0.96,
        "center",
        COLORS.white,
        getSelectedSkin().dark
      );

      const lineHeight = Math.max(6, Math.ceil(8 * layout.scale + 1));
      const totalHeight = layout.lines.length * lineHeight - 1;
      const promptTop = Math.round(top + 15 + Math.max(0, (height - 17 - totalHeight) / 2));
      // Keep the prompt on a single pixel-aligned pass as well; duplicate fractional
      // rendering can shimmer when a high-DPI canvas is rescaled by the browser.
      drawBitmapTextLayout(layout, W / 2, promptTop, "center", "#17495a", null, 1);
    }

    function drawTopHud() {
      const scoreBoxX = 8;
      const scoreBoxW = 76;
      const skin = getSelectedSkin();

      ctx.fillStyle = "rgba(38,54,61,0.70)";
      ctx.fillRect(scoreBoxX, 7, scoreBoxW, 19);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(scoreBoxX + 1, 8, scoreBoxW - 2, 17);
      ctx.fillStyle = skin.belly;
      ctx.fillRect(scoreBoxX + 3, 10, scoreBoxW - 6, 13);

      if (game.sandboxMode) {
        ctx.save();
        ctx.translate(22, 17);
        ctx.rotate(-0.45);
        ctx.fillStyle = skin.dark; ctx.fillRect(-1, -7, 3, 10); ctx.fillRect(-4, -8, 9, 3);
        ctx.fillStyle = skin.mid; ctx.fillRect(-5, 3, 11, 4);
        ctx.restore();
        drawBitmapText("SANDBOX", 57, 15, 0.72, "center", skin.dark);
      } else {
        drawFlyAt(22, 17, 0.75);
        const target = getSoloTargetScore();
        const scoreLabel = isSoloEndlessMode() ? `${game.score}` : `${game.score} / ${target}`;
        drawBitmapText(scoreLabel, 55, 15, 1, "center", skin.dark);
        ctx.save();
        ctx.globalAlpha = 0.24;
        ctx.translate(0.5, 0);
        drawBitmapText(scoreLabel, 55, 15, 1, "center", skin.dark);
        ctx.restore();
      }

      if (!game.sandboxMode && isSoloTimerActive()) {
        const urgentClock = game.soloTimeRemaining > 0 && game.soloTimeRemaining <= 5;
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
        const clockLabel = isSoloEndlessMode()
          ? `ENDLESS ${Math.ceil(game.soloTimeRemaining)} SEC`
          : `${Math.ceil(game.soloTimeRemaining)} SEC`;
        drawBitmapText(clockLabel, W / 2, 10, 0.68, "center", urgentClock ? "#ffffff" : "#d9edf2", urgentClock ? "#65111b" : null);
      }

      const pause = HUD_UI.pauseButton;
      // Keep the control usable without hiding a centered fly label underneath it.
      // The paused state is slightly stronger because the world is already frozen.
      const pauseOpacity = game.state === "paused" ? 0.84 : game.sandboxMode ? 0.66 : 0.56;
      ctx.save();
      ctx.globalAlpha *= pauseOpacity;
      ctx.fillStyle = "rgba(38,54,61,0.45)";
      ctx.fillRect(pause.x + 2, pause.y + 2, pause.w, pause.h);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(pause.x, pause.y, pause.w, pause.h);
      ctx.fillStyle = game.state === "paused" ? getSelectedSkin().mid : getSelectedSkin().belly;
      ctx.fillRect(pause.x + 2, pause.y + 2, pause.w - 4, pause.h - 4);
      ctx.fillStyle = game.state === "paused" ? COLORS.white : getSelectedSkin().dark;

      if (game.sandboxMode) {
        ctx.fillRect(pause.x + 7, pause.y + 5, 3, 3);
        ctx.fillRect(pause.x + 10, pause.y + 8, 3, 3);
        ctx.fillRect(pause.x + 13, pause.y + 11, 3, 3);
        ctx.fillRect(pause.x + 16, pause.y + 5, 3, 3);
        ctx.fillRect(pause.x + 13, pause.y + 8, 3, 3);
        ctx.fillRect(pause.x + 10, pause.y + 11, 3, 3);
      } else if (game.state === "paused") {
        ctx.fillRect(pause.x + 9, pause.y + 5, 3, 9);
        ctx.fillRect(pause.x + 12, pause.y + 7, 3, 5);
        ctx.fillRect(pause.x + 15, pause.y + 9, 2, 1);
      } else {
        ctx.fillRect(pause.x + 7, pause.y + 5, 4, 9);
        ctx.fillRect(pause.x + 15, pause.y + 5, 4, 9);
      }
      ctx.restore();
    }

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
      if (!unlocked) drawMiniLockIcon(button.x + button.w / 2, button.y + 13, 0.55);
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

      if (displayFocusId === "ember") {
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
      ctx.translate(centerX, centerY);
      ctx.scale(direction < 0 ? 1 : -1, 1);
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
      if (!isHatUnlocked(normalizedHat)) { playLockedSkinSound(); return false; }
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
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(pointerX - 5, top - 7, 10, 4);
      ctx.fillRect(pointerX - 3, top - 3, 6, 4);
      ctx.fillStyle = "#f7fdff";
      ctx.fillRect(pointerX - 3, top - 5, 6, 4);
      ctx.fillRect(pointerX - 1, top - 7, 2, 3);
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
        if (focused && !unlocked) lockedFocusedOption=option;
        ctx.fillStyle=focused||selected?COLORS.ink:"#9aa9ae";ctx.fillRect(option.x,option.y,option.w,option.h);
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
      const close={x:386,y:39,w:20,h:20};
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
      else if (lockedFocusedOption) drawCustomRequirementTooltip(lockedFocusedOption,"STYLE LOCKED",getHatRequirementLines(lockedFocusedOption.id),skin,190);
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
          { area: "pagePrev", rect: STATS_UI.pagePrevButton, direction: -1, enabled: game.statsPage > 0 },
          { area: "pageNext", rect: STATS_UI.pageNextButton, direction: 1, enabled: game.statsPage < statsPageCount - 1 }
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
        game.homeSettingsButtonHovered || game.timeButtonHovered || game.homeHoverSelection === "back"
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
        ctx.fillStyle = "rgba(25,43,52,0.28)";
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
        ctx.fillStyle = active ? skin.dark : COLORS.ink;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = active ? mixHexColors(skin.belly, "#ffffff", 0.18) : "#f7fdff";
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
        drawer(rect, active);
        if (active) {
          ctx.fillStyle = COLORS.white;
          [[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy]) =>
            ctx.fillRect(rect.x + dx, rect.y + dy, 2, 2)
          );
        }
      };

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
      ctx.fillStyle = "rgba(25,43,52,0.28)"; ctx.fillRect(help.x + 2, help.y + 2, help.w, help.h);
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
      const width = definition ? 208 : genericText ? Math.max(178, measureBitmapText(genericText, 1) + 42) : 178;
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
      ctx.fillStyle = skin.dark;
      ctx.fillRect(left, top, width, height);
      ctx.fillStyle = mixHexColors(skin.belly, skin.mid, 0.22);
      ctx.fillRect(left + 3, top + 3, width - 6, height - 6);
      ctx.fillStyle = skin.mid;
      ctx.fillRect(left + 7, top + 7, 30, height - 14);

      if (game.achievementToastSkinId) {
        drawMiniFrogSwatch(left + 11, top + 9, skin, 0.8);
        drawBitmapText("FROG UNLOCKED!", left + 108, top + 5, 1, "center", skin.dark);
        drawBitmapText(`${skin.name} FROG`, left + 109, top + 16, 1, "center", skin.dark);
      } else if (definition) {
        drawAchievementIcon(definition.icon, left + 13, top + 8, true, 0.82, skin);
        drawBitmapText("ACHIEVEMENT!", left + 124, top + 5, 1, "center", skin.dark);
        drawBitmapText(definition.name, left + 124, top + 16, 1, "center", skin.dark);
      } else {
        if (/FRIENDS LEADER|FIRST PLACE|#1/.test(genericText)) drawPixelTrophy(left + 18, top + 8, false);
        else drawMiniSun(left + 18, top + 15, false);
        drawBitmapText(genericText, left + width / 2 + 10, top + 10, 1, "center", skin.dark);
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
