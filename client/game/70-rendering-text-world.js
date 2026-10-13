// Ribbit Race rendering responsibility: 70 rendering text world
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
      "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
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

    const BITMAP_TEXT_CACHE_LIMIT = 2048;
    const bitmapNormalizeCache = new Map();
    const bitmapMeasureCache = new Map();
    const bitmapGlyphPixelCache = new Map();

    function rememberBitmapCacheEntry(cache, key, value) {
      if (cache.size >= BITMAP_TEXT_CACHE_LIMIT && !cache.has(key)) {
        cache.delete(cache.keys().next().value);
      }
      cache.set(key, value);
      return value;
    }

    function normalizeBitmapText(text) {
      const source = String(text ?? "");
      const cached = bitmapNormalizeCache.get(source);
      if (cached !== undefined) return cached;

      let value = source;
      try { value = value.normalize("NFC"); } catch (_) {}
      value = value
        .replace(/ /g, " ")
        .replace(/[​-‍⁠﻿]/g, "")
        .replace(/[\r\n\t]+/g, " ")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[–—]/g, "-")
        .replace(/…/g, "...")
        .replace(/\s+/g, " ");

      return rememberBitmapCacheEntry(bitmapNormalizeCache, source, value);
    }

    function getBitmapGlyph(character) {
      const direct = BITMAP_GLYPHS[character];
      if (direct) return direct;
      let fallback = String(character || "");
      try { fallback = fallback.normalize("NFD"); } catch (_) {}
      fallback = fallback.replace(/[̀-ͯ]/g, "").toUpperCase();
      return BITMAP_GLYPHS[fallback] || BITMAP_GLYPHS["?"];
    }

    function getBitmapGlyphPixels(character) {
      const cached = bitmapGlyphPixelCache.get(character);
      if (cached) return cached;

      const glyph = getBitmapGlyph(character);
      const coordinates = [];
      for (let row = 0; row < glyph.length; row += 1) {
        const rowData = glyph[row];
        for (let column = 0; column < rowData.length; column += 1) {
          if (rowData.charCodeAt(column) === 49) coordinates.push(column, row);
        }
      }

      const compiled = Object.freeze({
        coordinates: Int8Array.from(coordinates),
        yOffsetRows: glyph.length > 7 ? -1 : 0
      });
      bitmapGlyphPixelCache.set(character, compiled);
      return compiled;
    }

    function measureNormalizedBitmapText(value, scale = 1) {
      let width = 0;
      for (let index = 0; index < value.length; index += 1) {
        width += (value[index] === " " ? 3 : 5) * scale;
        if (index < value.length - 1) width += scale;
      }
      return width;
    }

    function measureBitmapText(text, scale = 1) {
      const value = normalizeBitmapText(text).toUpperCase();
      const key = `${value}\u0000${scale}`;
      const cached = bitmapMeasureCache.get(key);
      if (cached !== undefined) return cached;
      return rememberBitmapCacheEntry(
        bitmapMeasureCache,
        key,
        measureNormalizedBitmapText(value, scale)
      );
    }

    function paintBitmapTextUncached(targetContext, text, x, y, scale = 1, align = "left", color = COLORS.white, shadowColor = null) {
      const value = normalizeBitmapText(text).toUpperCase();
      const totalWidth = measureNormalizedBitmapText(value, scale);
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

          const glyph = getBitmapGlyphPixels(character);
          const coordinates = glyph.coordinates;
          const glyphYOffset = glyph.yOffsetRows * scale;
          for (let index = 0; index < coordinates.length; index += 2) {
            targetContext.fillRect(
              cursorX + coordinates[index] * scale + offsetX,
              startY + glyphYOffset + coordinates[index + 1] * scale + offsetY,
              scale,
              scale
            );
          }
          cursorX += 6 * scale;
        }
      }

      if (shadowColor) drawLayer(1, 1, shadowColor);
      drawLayer(0, 0, color);
    }

    // Bounded backing-scale text cache. No renamed glyphs, altered spacing,
    // downsampling, physics changes or unbounded per-frame canvas allocation.
    const bitmapRunCache = new Map();
    const BITMAP_RUN_CACHE_BYTES = 6 * 1024 * 1024;
    let bitmapRunCacheBytes = 0;
    let bitmapRunCacheHits = 0;
    let bitmapRunCacheMisses = 0;
    function drawBitmapTextToContext(targetContext, text, x, y, scale = 1, align = "left", color = COLORS.white, shadowColor = null) {
      const value = normalizeBitmapText(text).toUpperCase();
      if (!value) return;
      const t = targetContext.getTransform();
      const resolution = t.a;
      // Scaling/rotating a frog, a flipped flash card or a cinematic must retain
      // the original renderer. The common HUD/menu path is axis-aligned.
      if (t.b || t.c || t.d !== resolution || resolution < 1 || resolution > 4 ||
          !Number.isInteger(resolution) || !Number.isInteger(t.e) || !Number.isInteger(t.f) ||
          targetContext.globalCompositeOperation !== "source-over" ||
          typeof color !== "string" || (shadowColor && typeof shadowColor !== "string")) {
        return paintBitmapTextUncached(targetContext, value, x, y, scale, align, color, shadowColor);
      }
      const key = JSON.stringify([value, scale, color, shadowColor, resolution]);
      let item = bitmapRunCache.get(key);
      if (!item) {
        const width = Math.ceil(measureNormalizedBitmapText(value, scale) + 4);
        const height = Math.ceil(8 * scale + 5);
        const bytes = width * height * resolution * resolution * 4;
        if (bytes > 262144 || scale <= 0) {
          return paintBitmapTextUncached(targetContext, value, x, y, scale, align, color, shadowColor);
        }
        while (bitmapRunCache.size && (bitmapRunCacheBytes + bytes > BITMAP_RUN_CACHE_BYTES || bitmapRunCache.size >= 256)) {
          const oldest = bitmapRunCache.keys().next().value;
          const removed = bitmapRunCache.get(oldest);
          bitmapRunCacheBytes -= removed.bytes;
          removed.image.width = 0; removed.image.height = 0;
          bitmapRunCache.delete(oldest);
        }
        const image = document.createElement("canvas");
        image.width = width * resolution; image.height = height * resolution;
        const surface = image.getContext("2d");
        surface.imageSmoothingEnabled = false;
        surface.setTransform(resolution, 0, 0, resolution, 0, 0);
        // Padding accommodates accented glyph ascenders and the one-pixel shadow.
        paintBitmapTextUncached(surface, value, 1, Math.ceil(scale) + 1, scale, "left", color, shadowColor);
        item = {image, bytes, width, height, padY:Math.ceil(scale) + 1};
        bitmapRunCache.set(key, item); bitmapRunCacheBytes += bytes; bitmapRunCacheMisses++;
      } else {
        bitmapRunCache.delete(key); bitmapRunCache.set(key, item); bitmapRunCacheHits++;
      }
      const width = measureNormalizedBitmapText(value, scale);
      const startX = Math.round(x - (align === "center" ? width / 2 : align === "right" ? width : 0));
      targetContext.drawImage(item.image, startX - 1, Math.round(y) - item.padY, item.width, item.height);
      targetContext.fillStyle = color;
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
    if (typeof window !== "undefined" && window.RibbitV160ShouldHideFlyLabels?.()) return;
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

      drawCachedParkScenery("back");
      // The kite stays animated between the skyline and the foreground.
      drawParkKite();
      drawCachedParkScenery("front");
    }

    // Both layers use integer-coordinate pixel art and take < 1 MiB together.
    // Moving clouds, sun, stars and the kite are deliberately NOT cached.
    const parkSceneryCache = new Map();
    function drawCachedParkScenery(layer) {
      let image = parkSceneryCache.get(layer);
      if (!image) {
        image = document.createElement("canvas");
        image.width = W;
        image.height = CONFIG.playBottom;
        const target = image.getContext("2d");
        target.imageSmoothingEnabled = false;
        if (layer === "back") drawParkBackScenery(target);
        else drawParkFrontScenery(target);
        parkSceneryCache.set(layer, image);
      }
      ctx.drawImage(image, 0, 0);
    }
    function drawParkBackScenery(ctx) {
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

    }
    function drawParkFrontScenery(ctx) {
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
