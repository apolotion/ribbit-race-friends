// Ribbit Race Friends — online/replay/UI/language polish 8.
(() => {
  "use strict";
  if (window.__RIBBIT_POLISH_8__) return;
  window.__RIBBIT_POLISH_8__ = true;

  const polish = {
    leaderboardEntries: [],
    leaderboardLoading: false,
    leaderboardError: "",
    leaderboardMetric: "time",
    leaderboardLevel: "any",
    leaderboardPage: 0,
    leaderboardRawPayload: null,
    leaderboardReplayRects: [],
    leaderboardNameRects: [],
    leaderboardDropdown: "",
    leaderboardHitRects: {},
    leaderboardHoverKey: "",
    previousState: "achievements",
    mainHoverKey: "",
    onlineHoverKey: "",
    worldRecordHovered: false,
    labelFadeStartedAt: 0,
    priorCriticalCatch: false,
    previousRoundState: "",
    lastArchivedRoundKey: "",
    baseSkinIndex: 0,
    customBaseOpen: false,
    customToolHover: "",
    quickplayLeaving: false,
    profileSelection: 0,
    deviceSelection: 0,
    priorMenuState: "main",
    replayStatus: "",
    replayDetail: ""
  };

  const LANGUAGE_KEY = "ribbitRaceLanguageModeV1";
  const HAT_PROGRESS_KEY = "ribbitRaceHatProgressV2";
  const ONLINE_HISTORY_KEY = "ribbitRaceOnlineHistoryV2";
  const countedHatFlyObjects = new WeakSet();
  const LEADERBOARD_BUTTON = Object.freeze({ x: 416, y: 229, w: 28, h: 28 });
  const CUSTOM_RANDOM_BUTTON = Object.freeze({ x: 51, y: 67, w: 25, h: 22 });
  const CUSTOM_BASE_BUTTON = Object.freeze({ x: 159, y: 67, w: 25, h: 22 });
  const PAUSE_FULLSCREEN_BUTTON = Object.freeze({ x: 379, y: 198, w: 20, h: 20 });
  const MAIN_PROFILE_BUTTON = MAIN_UI.profileButton;
  const MAIN_DEVICE_BUTTON = MAIN_UI.deviceButton;

  function safeCall(candidate, ...args) {
    try { return typeof candidate === "function" ? candidate(...args) : undefined; }
    catch (error) { console.warn("Ribbit polish helper recovered", error); return undefined; }
  }

  const PROFILE_MENU_ROWS = Object.freeze([
    Object.freeze({ id:"language", label:"LANGUAGE MODE" }),
    Object.freeze({ id:"save", label:"SAVE NOW" }),
    Object.freeze({ id:"words", label:"REFRESH WORDS" }),
    Object.freeze({ id:"leaderboard", label:"LEADERBOARD" }),
    Object.freeze({ id:"manage", label:"BACK UP / MANAGE SAVE" }),
    Object.freeze({ id:"signout", label:"SIGN OUT" }),
    Object.freeze({ id:"back", label:"BACK" })
  ]);
  const PROFILE_MENU_RECTS = Object.freeze(PROFILE_MENU_ROWS.map((row, index) => Object.freeze({
    ...row, x:104, y:72 + index * 25, w:272, h:21
  })));
  const DEVICE_MENU_RECTS = Object.freeze({
    computer:Object.freeze({ x:75, y:91, w:150, h:86 }),
    mobile:Object.freeze({ x:255, y:91, w:150, h:86 }),
    back:Object.freeze({ x:180, y:214, w:120, h:23 })
  });

  function accountDisplayName() {
    try {
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      const profile = cloud?.getProfile?.() || cloud?.profile?.();
      return String(profile?.displayName || profile?.name || document.getElementById("cloud-account-name")?.textContent || "GUEST").trim() || "GUEST";
    } catch (_) { return "GUEST"; }
  }

  function drawUtilityWindowFrame(title, subtitle = "") {
    const skin = getSelectedSkin();
    const previewLevelId = game.selectedLevelId || "park";
    const previewLevel = LEVELS[previewLevelId] || LEVELS.park;
    const chrome = TIME_OF_DAY_CHROME[game.timeOfDay] || TIME_OF_DAY_CHROME.afternoon;

    // Reuse the same world-backed frame as the main menu so these screens feel
    // like nested Ribbit Race menus rather than unrelated full-screen forms.
    ctx.fillStyle = chrome.outer;
    ctx.fillRect(0, 0, W, H);
    try {
      drawBackground(previewLevelId);
      for (const platform of previewLevel.platforms) drawPlatform(platform, previewLevelId);
      drawTimeOfDayWorldTint(previewLevelId);
    } catch (_) {}
    ctx.fillStyle = "rgba(18,33,41,0.22)";
    ctx.fillRect(0, 0, W, H);

    const panel = { x:38, y:15, w:404, h:228 };
    ctx.fillStyle = "rgba(12,26,33,0.30)";
    ctx.fillRect(panel.x + 7, panel.y + 8, panel.w, panel.h);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(panel.x + 4, panel.y, panel.w - 8, panel.h);
    ctx.fillRect(panel.x, panel.y + 4, panel.w, panel.h - 8);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(panel.x + 7, panel.y + 4, panel.w - 14, panel.h - 8);
    ctx.fillRect(panel.x + 4, panel.y + 8, panel.w - 8, panel.h - 16);

    const header = { x:52, y:25, w:376, h:29 };
    ctx.fillStyle = skin.dark;
    ctx.fillRect(header.x, header.y, header.w, header.h);
    ctx.fillStyle = skin.mid;
    ctx.fillRect(header.x + 2, header.y + 2, header.w - 4, header.h - 4);
    ctx.fillStyle = skin.light;
    ctx.fillRect(header.x + 5, header.y + 4, header.w - 10, 3);
    const titleScale = Math.min(1.12, (header.w - 28) / Math.max(1, measureBitmapText(title, 1)));
    drawBitmapText(title, W / 2, header.y + 9, titleScale, "center", COLORS.white, skin.dark);
    if (subtitle) drawBitmapText(subtitle, W / 2, 58, .48, "center", "#59666b");
    return { panel, header };
  }

  function drawUtilityRow(rect, label, selected, value = "") {
    const skin = getSelectedSkin();
    ctx.fillStyle = "rgba(25,43,52,.20)"; ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
    ctx.fillStyle = selected ? COLORS.ink : "#9aa9ae"; ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.fillStyle = selected ? mixHexColors(skin.belly,"#ffffff",.12) : "#f7fdff"; ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
    ctx.fillStyle = selected ? skin.light : "#ffffff"; ctx.fillRect(rect.x+6,rect.y+4,rect.w-12,2);
    drawBitmapText(label,rect.x+12,rect.y+7,.58,"left",selected?skin.dark:"#34484f");
    if(value) drawBitmapText(value,rect.x+rect.w-10,rect.y+7,.52,"right",selected?skin.dark:"#59666b");
  }

  function drawProfileMenu() {
    drawUtilityWindowFrame("ACCOUNT & LANGUAGE", "PLAYER SETTINGS");
    const skin = getSelectedSkin();
    drawBitmapText(`PLAYER: ${accountDisplayName().toUpperCase()}`,W/2,62,.55,"center","#48555a");
    PROFILE_MENU_RECTS.forEach((rect,index) => {
      let value="";
      if(rect.id==="language") value=getLanguageMode()==="es-en"?"ESPAÑOL → ENGLISH":"ENGLISH → ESPAÑOL";
      drawUtilityRow(rect,rect.label,index===polish.profileSelection,value);
    });
    drawBitmapText("ARROWS TO BROWSE • ENTER TO SELECT",W/2,247,.48,"center","#617177");
  }

  function drawDeviceModeIcon(rect, mobile, selected) {
    const skin=getSelectedSkin();
    ctx.fillStyle="rgba(25,43,52,.22)";ctx.fillRect(rect.x+3,rect.y+3,rect.w,rect.h);
    ctx.fillStyle=selected?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.fillStyle=selected?mixHexColors(skin.belly,"#ffffff",.12):"#f7fdff";ctx.fillRect(rect.x+3,rect.y+3,rect.w-6,rect.h-6);
    ctx.fillStyle=selected?skin.light:"#ffffff";ctx.fillRect(rect.x+8,rect.y+7,rect.w-16,4);
    const cx=rect.x+rect.w/2,cy=rect.y+38;
    ctx.fillStyle=selected?skin.dark:"#48555a";
    if(mobile){ctx.fillRect(cx-13,cy-22,26,43);ctx.fillStyle=selected?skin.belly:"#f7fdff";ctx.fillRect(cx-9,cy-17,18,30);ctx.fillStyle=selected?skin.dark:"#48555a";ctx.fillRect(cx-3,cy+16,6,2);}
    else{ctx.fillRect(cx-28,cy-19,56,35);ctx.fillStyle=selected?skin.belly:"#f7fdff";ctx.fillRect(cx-23,cy-14,46,25);ctx.fillStyle=selected?skin.dark:"#48555a";ctx.fillRect(cx-5,cy+16,10,7);ctx.fillRect(cx-16,cy+23,32,4);}
    drawBitmapText(mobile?"MOBILE MODE":"COMPUTER MODE",cx,rect.y+67,.62,"center",selected?skin.dark:"#48555a");
  }

  function drawDeviceMenu() {
    drawUtilityWindowFrame("COMPUTER / MOBILE MODE", "CHOOSE AN INPUT STYLE");
    const selectedMode=isRibbitMobileMode()?1:0;
    drawDeviceModeIcon(DEVICE_MENU_RECTS.computer,false,polish.deviceSelection===0);
    drawDeviceModeIcon(DEVICE_MENU_RECTS.mobile,true,polish.deviceSelection===1);
    drawUtilityRow(DEVICE_MENU_RECTS.back,"BACK",polish.deviceSelection===2,"");
    drawBitmapText(`CURRENT: ${selectedMode?"MOBILE":"COMPUTER"}`,W/2,190,.58,"center","#48555a");
  }

  function openProfileMenu() { polish.priorMenuState=game.state; polish.profileSelection=0; game.state="rrProfileMenu"; clearHeldInput(); tone(520,.04,.009,25); }
  function openDeviceMenu() { polish.priorMenuState=game.state; polish.deviceSelection=isRibbitMobileMode()?1:0; game.state="rrDeviceMenu"; clearHeldInput(); tone(480,.04,.009,20); }
  function closeUtilityMenu() { game.state="main"; game.mainFocusVisible=true; tone(330,.04,.009,-30); }
  window.RibbitRaceOpenProfileMenu=openProfileMenu;
  window.RibbitRaceOpenDeviceMenu=openDeviceMenu;

  function activateProfileRow(index=polish.profileSelection) {
    const row=PROFILE_MENU_ROWS[index] || PROFILE_MENU_ROWS[0];
    if(row.id==="language") setLanguageMode(getLanguageMode()==="es-en"?"en-es":"es-en");
    else if(row.id==="leaderboard") { game.state="achievements"; openLeaderboard(); }
    else if(row.id==="back") closeUtilityMenu();
    else {
      const id={save:"cloud-save-now",words:"cloud-refresh-vocab",manage:"friends-manage",signout:"cloud-sign-out"}[row.id];
      const button=id?document.getElementById(id):null;
      if(button){button.click(); if(row.id!=="manage") game.state="main";}
      else {game.cheatToastText="ACCOUNT ACTION UNAVAILABLE";game.cheatToastTimer=CONFIG.achievementToastDuration;}
    }
  }

  function setCanvasMobileMode(enabled) {
    try { localStorage.setItem("ribbitRaceMobileModeV1",enabled?"true":"false"); } catch (_) {}
    try {
      if(typeof window.RibbitRaceSetMobileMode==="function") window.RibbitRaceSetMobileMode(Boolean(enabled));
      else window.dispatchEvent(new CustomEvent("ribbit:mobile-mode",{detail:{enabled:Boolean(enabled)}}));
    } catch (_) {}
    document.body.classList.toggle("rr-mobile-mode",Boolean(enabled));
    tone(enabled?620:420,.05,.010,enabled?35:-25);
  }

  function getLanguageMode() {
    try {
      return window.RibbitLanguagePreferences?.getMode?.() ||
        localStorage.getItem(LANGUAGE_KEY) || "en-es";
    } catch (_) { return "en-es"; }
  }

  function setLanguageMode(mode) {
    const normalized = mode === "es-en" ? "es-en" : "en-es";
    try { localStorage.setItem(LANGUAGE_KEY, normalized); } catch (_) {}
    try { window.RibbitLanguagePreferences?.setMode?.(normalized); } catch (_) {}
    try {
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      cloud?.queueSave?.({ ribbitRaceLanguageModeV1: normalized });
      cloud?.savePatch?.({ languageMode: normalized, ribbitRaceLanguageModeV1: normalized });
    } catch (_) {}
    return normalized;
  }

  const SPANISH_UI = Object.freeze({
    "RIBBIT RACE": "RIBBIT RACE",
    "CHOOSE A MODE": "ELIGE UN MODO",
    "SINGLE PLAYER": "UN JUGADOR",
    "VERSUS": "VERSUS",
    "FROG COLOR": "COLOR DE RANA",
    "ACHIEVEMENTS": "LOGROS",
    "STATS": "ESTADÍSTICAS",
    "BACK": "VOLVER",
    "HOME": "INICIO",
    "HOME MENU": "MENÚ PRINCIPAL",
    "CONTINUE": "CONTINUAR",
    "RESTART": "REINICIAR",
    "PAUSED": "PAUSA",
    "START": "EMPEZAR",
    "QUICKPLAY": "PARTIDA RÁPIDA",
    "HOST": "CREAR SALA",
    "JOIN": "UNIRSE",
    "SPECTATE": "OBSERVAR",
    "CUSTOMIZER": "PERSONALIZAR",
    "FROG TAGS": "PLACAS DE RANA",
    "FIND MATCH": "BUSCAR PARTIDA",
    "CANCEL": "CANCELAR",
    "READY": "LISTO",
    "LEAVE": "SALIR",
    "LEADERBOARD": "CLASIFICACIÓN",
    "PLAYER 1": "JUGADOR 1",
    "PLAYER 2": "JUGADOR 2",
    "CHOOSE YOUR FROG": "ELIGE TU RANA",
    "RANDOM": "ALEATORIO",
    "SETTINGS": "AJUSTES",
    "ACCOUNT & LANGUAGE": "CUENTA E IDIOMA",
    "COMPUTER / MOBILE MODE": "MODO COMPUTADORA / MÓVIL",
    "STATS & RECORDS": "ESTADÍSTICAS Y RÉCORDS",
    "WORLD RECORD": "RÉCORD MUNDIAL",
    "TUTORIAL COMPLETE!": "¡TUTORIAL COMPLETADO!"
  });

  const originalDrawBitmapTextPolish8 = drawBitmapText;
  drawBitmapText = function(text, ...args) {
    let rendered = text;
    if (getLanguageMode() === "es-en" && typeof text === "string") {
      rendered = SPANISH_UI[text] || text;
      for (const [english, spanish] of Object.entries(SPANISH_UI)) {
        if (rendered !== text) break;
        if (text.startsWith(`${english} •`)) rendered = `${spanish}${text.slice(english.length)}`;
      }
    }
    return originalDrawBitmapTextPolish8.call(this, rendered, ...args);
  };

  function withLocalizedVocabulary(index, operation, kind) {
    const entry = VOCABULARY?.[index];
    if (!entry || getLanguageMode() !== "es-en") return operation();
    const english = entry.english;
    const spanish = entry.spanish;
    try {
      if (kind === "fly") {
        try { entry.spanish = english; } catch (_) {}
      } else {
        try { entry.english = spanish; } catch (_) {}
      }
      return operation();
    } finally {
      try { entry.english = english; entry.spanish = spanish; } catch (_) {}
    }
  }

  const originalDrawFlyNameTagPolish8 = drawFlyNameTag;
  drawFlyNameTag = function(currentFly, ...rest) {
    if (window.RibbitRaceFinalCatchLabelsGone) return;
    return withLocalizedVocabulary(
      Number(currentFly?.vocabIndex),
      () => originalDrawFlyNameTagPolish8.call(this, currentFly, ...rest),
      "fly"
    );
  };

  const originalDrawVocabularyPromptPolish8 = drawVocabularyPrompt;
  drawVocabularyPrompt = function(...args) {
    return withLocalizedVocabulary(
      Number(game.targetVocabIndex),
      () => originalDrawVocabularyPromptPolish8.apply(this, args),
      "clue"
    );
  };

  function drawSpeechBubble(rect, message, options = {}) {
    if (!rect || !message) return;
    const maxWidth = options.maxWidth || 190;
    const scale = options.scale || 0.56;
    const textWidth = Math.min(maxWidth - 14, Math.max(54, measureBitmapText(message, scale)));
    const width = Math.ceil(textWidth + 14);
    const height = options.height || 21;
    const centerX = rect.x + rect.w / 2;
    const x = clamp(Math.round(centerX - width / 2), 4, W - width - 4);
    const y = clamp(Math.round(rect.y - height - 8), 4, H - height - 10);
    const pointerX = clamp(Math.round(centerX), x + 8, x + width - 8);
    ctx.save();
    ctx.fillStyle = "rgba(24,41,49,.28)";
    ctx.fillRect(x + 2, y + 2, width, height);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    ctx.fillStyle = getSelectedSkin().light;
    ctx.fillRect(x + 5, y + 4, width - 10, 2);
    drawBitmapText(message, x + width / 2, y + 8, scale, "center", "#111a1e");
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(pointerX - 4, y + height, 9, 2);
    ctx.fillRect(pointerX - 3, y + height + 2, 7, 2);
    ctx.fillRect(pointerX - 2, y + height + 4, 5, 2);
    ctx.fillRect(pointerX - 1, y + height + 6, 3, 1);
    ctx.restore();
  }

  function pointIn(point, rect) {
    return Boolean(point && rect && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h);
  }

  function drawMiniMedalButton(rect, active = false) {
    const skin = getSelectedSkin();
    ctx.fillStyle = "rgba(25,43,52,.28)";
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = active ? skin.dark : COLORS.ink;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = active ? mixHexColors(skin.belly, "#ffffff", .12) : "#f7fdff";
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.fillStyle = active ? skin.light : "#ffffff";
    ctx.fillRect(rect.x + 5, rect.y + 4, rect.w - 10, 2);

    const cx = Math.round(rect.x + rect.w / 2);
    const ribbonY = rect.y + 6;
    // Monochrome ribbons and medallion inherit the active frog palette.
    ctx.fillStyle = skin.dark;
    ctx.fillRect(cx - 7, ribbonY, 5, 9);
    ctx.fillRect(cx + 2, ribbonY, 5, 9);
    ctx.fillStyle = skin.mid;
    ctx.fillRect(cx - 6, ribbonY + 1, 3, 7);
    ctx.fillRect(cx + 3, ribbonY + 1, 3, 7);

    const medalY = rect.y + 14;
    ctx.fillStyle = skin.dark;
    ctx.fillRect(cx - 8, medalY + 2, 16, 8);
    ctx.fillRect(cx - 6, medalY, 12, 12);
    ctx.fillStyle = skin.mid;
    ctx.fillRect(cx - 6, medalY + 2, 12, 8);
    ctx.fillRect(cx - 4, medalY + 1, 8, 10);
    ctx.fillStyle = skin.light;
    ctx.fillRect(cx - 4, medalY + 2, 6, 4);
    ctx.fillStyle = mixHexColors(skin.belly, "#ffffff", .28);
    ctx.fillRect(cx - 3, medalY + 3, 2, 2);
    ctx.fillStyle = skin.dark;
    ctx.fillRect(cx - 1, medalY + 5, 3, 5);
    ctx.fillRect(cx - 3, medalY + 7, 7, 2);

    if (active) {
      ctx.fillStyle = skin.light;
      [[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy]) => ctx.fillRect(rect.x + dx, rect.y + dy, 2, 2));
    }
  }

  const LEADERBOARD_METRICS = Object.freeze([
    Object.freeze({ id:"time", label:"FASTEST TIME" }),
    Object.freeze({ id:"jumps", label:"FEWEST JUMPS" }),
    Object.freeze({ id:"endless", label:"60 SECOND ENDLESS" }),
    Object.freeze({ id:"flies", label:"MOST FLIES EATEN" }),
    Object.freeze({ id:"pvpwins", label:"MOST PVP WINS" })
  ]);
  const LEADERBOARD_LEVELS = Object.freeze(["any", "park", "swamp", "jungle", "pond", "lake", "garden"]);

  function leaderboardMetricDefinition(id = polish.leaderboardMetric) {
    return LEADERBOARD_METRICS.find((entry) => entry.id === id) || LEADERBOARD_METRICS[0];
  }

  function leaderboardSourceRows(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    for (const key of ["entries", "leaderboard", "rows", "records", "results", "data"]) {
      if (Array.isArray(payload[key])) return payload[key];
    }
    return [];
  }

  function leaderboardRecordForEntry(entry, metric, requestedLevel) {
    if (metric === "flies") {
      return {
        score:Number(entry.totalFlies ?? entry.flies ?? entry.value ?? entry.score) || 0,
        level:"ALL",
        date:entry.lastUpdated || entry.resultDate || entry.date || "",
        replayId:entry.replayId || entry.replay_id || null
      };
    }
    if (metric === "pvpwins") {
      return {
        score:Number(entry.pvpMatchWins ?? entry.wins ?? entry.value ?? entry.score) || 0,
        level:"ALL",
        date:entry.lastUpdated || entry.resultDate || entry.date || "",
        replayId:entry.replayId || entry.replay_id || null
      };
    }

    const records = entry?.records && typeof entry.records === "object" ? entry.records : null;
    if (!records) {
      const rowMetric = String(entry.metric || entry.category || metric).toLowerCase();
      const level = String(entry.level || entry.resultLevel || requestedLevel || "any").toLowerCase();
      if (rowMetric !== metric && !(metric === "pvpwins" && rowMetric === "wins")) return null;
      if (requestedLevel !== "any" && level !== requestedLevel) return null;
      return {
        score:entry.value ?? entry.time ?? entry.jumps ?? entry.score ?? entry.wins ?? null,
        level:level === "any" ? "ALL" : level,
        date:entry.date || entry.createdAt || entry.at || "",
        replayId:entry.replayId || entry.replay_id || entry.replay?.id || null
      };
    }

    const candidateLevels = requestedLevel === "any"
      ? ["park", "swamp", "jungle", "pond", "lake", "garden"]
      : [requestedLevel];
    const higherIsBetter = metric === "endless";
    let best = null;
    for (const levelId of candidateLevels) {
      const record = records[levelId] || {};
      const value = Number(record[metric]);
      if (!Number.isFinite(value) || value <= 0) continue;
      if (!best || (higherIsBetter ? value > best.score : value < best.score)) {
        best = {
          score:value,
          level:levelId,
          date:metric === "endless"
            ? (record.endlessDate || record.date || entry.lastUpdated || entry.resultDate || "")
            : (record.date || entry.lastUpdated || entry.resultDate || ""),
          replayId:record[`${metric}ReplayId`] || record.replayId || record.replay_id || entry.replayId || entry.replay_id || null
        };
      }
    }
    return best;
  }

  function normalizeLeaderboardRows(payload) {
    const metric = polish.leaderboardMetric;
    const level = polish.leaderboardLevel;
    const source = leaderboardSourceRows(payload);
    const higherIsBetter = ["endless", "flies", "pvpwins"].includes(metric);
    const rows = [];
    for (const entry of source) {
      const record = leaderboardRecordForEntry(entry, metric, level);
      if (!record || !Number.isFinite(Number(record.score)) || Number(record.score) <= 0) continue;
      rows.push({
        rank:0,
        name:String(entry.name || entry.displayName || entry.username || entry.player || "FROG"),
        replayUid:String(entry.uid || entry.userId || entry.accountId || ""),
        replayUsername:String(entry.username || entry.loginName || entry.name || entry.displayName || ""),
        classPeriod:String(entry.classPeriod || entry.period || ""),
        value:Number(record.score),
        metric,
        level:String(record.level || (level === "any" ? "ALL" : level)).toUpperCase(),
        date:String(record.date || ""),
        replayId:record.replayId || null,
        skinId:entry.skinId || entry.skin || entry.frogSkin || "azure",
        appearance:entry.appearance || entry.frogAppearance || entry.palette || null,
        isCurrent:Boolean(entry.isCurrent)
      });
    }
    rows.sort((a, b) => {
      if (a.value !== b.value) return higherIsBetter ? b.value - a.value : a.value - b.value;
      return a.name.localeCompare(b.name, undefined, { sensitivity:"base" });
    });
    let priorScore = null;
    let priorRank = 0;
    rows.forEach((row, index) => {
      if (priorScore !== null && row.value === priorScore) row.rank = priorRank;
      else { row.rank = index + 1; priorRank = row.rank; priorScore = row.value; }
    });
    return rows;
  }

  function rebuildLeaderboardRows() {
    polish.leaderboardEntries = normalizeLeaderboardRows(polish.leaderboardRawPayload || []);
    const pageCount = Math.max(1, Math.ceil(polish.leaderboardEntries.length / 5));
    polish.leaderboardPage = clamp(polish.leaderboardPage, 0, pageCount - 1);
  }

  async function loadLeaderboard(force = false) {
    polish.leaderboardLoading = true;
    polish.leaderboardError = "";
    try {
      let payload = !force ? polish.leaderboardRawPayload : null;
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      if (!payload) {
        for (const candidate of [
          () => cloud?.getLeaderboardData?.(force),
          () => cloud?.getLeaderboard?.(polish.leaderboardMetric),
          () => cloud?.loadLeaderboard?.(polish.leaderboardMetric),
          () => window.FriendsApiClient?.leaderboard?.(polish.leaderboardMetric)
        ]) {
          try {
            const value = await candidate();
            if (value && (Array.isArray(value) || typeof value === "object")) { payload = value; break; }
          } catch (_) {}
        }
      }
      if (!payload) {
        for (const path of ["/api/leaderboard?limit=100", "/api/records?limit=100"]) {
          try {
            const response = await fetch(path, { credentials:"include", cache:"no-store" });
            if (!response.ok) continue;
            payload = await response.json();
            if (payload) break;
          } catch (_) {}
        }
      }
      polish.leaderboardRawPayload = payload || [];
      rebuildLeaderboardRows();
      if (!polish.leaderboardEntries.length) polish.leaderboardError = "NO RECORDS YET";
    } catch (_) {
      polish.leaderboardError = "LEADERBOARD UNAVAILABLE";
      polish.leaderboardEntries = [];
    } finally {
      polish.leaderboardLoading = false;
    }
  }

  function openLeaderboard() {
    polish.previousState = game.state === "rrLeaderboard" ? "achievements" : game.state;
    game.state = "rrLeaderboard";
    polish.leaderboardPage = 0;
    polish.leaderboardDropdown = "";
    loadLeaderboard(false);
    safeCall(tone, 540, .05, .012, 35);
  }

  function closeLeaderboard() {
    game.state = polish.previousState === "rrLeaderboard" ? "achievements" : (polish.previousState || "achievements");
    polish.leaderboardDropdown = "";
    safeCall(tone, 330, .045, .010, -30);
  }

  function formatLeaderboardValue(row) {
    const numeric = Number(row?.value);
    if (!Number.isFinite(numeric)) return "—";
    if (row.metric === "time") {
      const minutes = Math.floor(numeric / 60);
      const seconds = (numeric - minutes * 60).toFixed(1).padStart(4, "0");
      return `${String(minutes).padStart(2, "0")}:${seconds}`;
    }
    if (row.metric === "jumps") return `${Math.floor(numeric)}`;
    return `${Math.floor(numeric)}`;
  }

  function formatLeaderboardDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
  }

  function drawReplayIcon(cx, cy, active = false) {
    ctx.fillStyle = active ? getSelectedSkin().dark : "#48555a";
    ctx.fillRect(cx - 7, cy - 6, 14, 12);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(cx - 5, cy - 4, 10, 8);
    ctx.fillStyle = active ? getSelectedSkin().mid : "#708086";
    ctx.fillRect(cx - 2, cy - 2, 3, 5);
    ctx.fillRect(cx + 1, cy - 1, 2, 3);
  }

  function leaderboardFrogPalette(row) {
    const appearance = row?.appearance;
    if (appearance && typeof appearance === "object" && appearance.dark && appearance.mid && appearance.light && appearance.belly) {
      return appearance;
    }
    try { return getPvpSkinPalette(row?.skinId || "azure", "azure"); }
    catch (_) { return FROG_SKINS[row?.skinId] || FROG_SKINS.azure; }
  }

  function drawLeaderboardArrow(cx, cy, direction = 1, active = false) {
    ctx.fillStyle = active ? getSelectedSkin().dark : "#48555a";
    if (direction > 0) {
      ctx.fillRect(cx - 4, cy - 1, 7, 3); ctx.fillRect(cx + 1, cy - 4, 3, 9); ctx.fillRect(cx + 4, cy - 2, 2, 5);
    } else {
      ctx.fillRect(cx - 3, cy - 1, 7, 3); ctx.fillRect(cx - 3, cy - 4, 3, 9); ctx.fillRect(cx - 6, cy - 2, 2, 5);
    }
  }

  function drawLeaderboardRefreshIcon(cx, cy, active = false) {
    const color = active ? getSelectedSkin().dark : "#26363d";
    ctx.fillStyle = color;
    // Pixel circular arrow—avoids unsupported Unicode glyphs rendering as ?.
    ctx.fillRect(cx - 5, cy - 5, 8, 2);
    ctx.fillRect(cx - 7, cy - 3, 2, 7);
    ctx.fillRect(cx - 5, cy + 4, 8, 2);
    ctx.fillRect(cx + 3, cy + 1, 2, 5);
    ctx.fillRect(cx + 2, cy - 6, 5, 2);
    ctx.fillRect(cx + 5, cy - 4, 2, 5);
    ctx.fillRect(cx + 3, cy - 4, 2, 2);
  }

  function drawLeaderboardDropdown(rect, label, value, open, key) {
    drawBitmapText(label, rect.x, rect.y - 11, .44, "left", "#48555a");
    ctx.fillStyle = "rgba(25,43,52,.22)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = open ? getSelectedSkin().dark : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    drawBitmapText(value, rect.x + 8, rect.y + 7, .54, "left", "#26363d");
    ctx.fillStyle = "#26363d";
    ctx.fillRect(rect.x + rect.w - 13, rect.y + 8, 7, 2);
    ctx.fillRect(rect.x + rect.w - 12, rect.y + 10, 5, 2);
    ctx.fillRect(rect.x + rect.w - 11, rect.y + 12, 3, 2);
    polish.leaderboardHitRects[key] = rect;
  }

  function drawLeaderboardScreen() {
    const skin = getSelectedSkin();
    const metricDef = leaderboardMetricDefinition();
    const levelLabel = polish.leaderboardLevel === "any" ? "ANY LEVEL" : polish.leaderboardLevel.toUpperCase();
    polish.leaderboardHitRects = {};
    polish.leaderboardReplayRects = [];
    polish.leaderboardNameRects = [];

    ctx.fillStyle = "#edf5f7"; ctx.fillRect(0, 0, W, H);
    // Achievement-menu-style pixel-rounded frame.
    ctx.fillStyle = "rgba(25,43,52,.26)"; ctx.fillRect(13, 10, W - 24, H - 14);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(8, 6, W - 16, H - 12);
    ctx.fillStyle = "#edf5f7";
    ctx.fillRect(8, 6, 6, 6); ctx.fillRect(W - 14, 6, 6, 6);
    ctx.fillRect(8, H - 12, 6, 6); ctx.fillRect(W - 14, H - 12, 6, 6);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(12, 10, W - 24, H - 20);
    ctx.fillStyle = "#edf5f7";
    ctx.fillRect(12, 10, 4, 4); ctx.fillRect(W - 16, 10, 4, 4);
    ctx.fillRect(12, H - 14, 4, 4); ctx.fillRect(W - 16, H - 14, 4, 4);

    const header = { x:20, y:14, w:440, h:38 };
    ctx.fillStyle = skin.dark; ctx.fillRect(header.x, header.y, header.w, header.h);
    ctx.fillStyle = skin.mid; ctx.fillRect(header.x + 3, header.y + 3, header.w - 6, header.h - 6);
    ctx.fillStyle = skin.light; ctx.fillRect(header.x + 7, header.y + 5, header.w - 14, 3);
    drawBitmapText("LEADERBOARD", W / 2, header.y + 11, 1.35, "center", COLORS.white, skin.dark);

    const close = { x:439, y:17, w:18, h:18 };
    ctx.fillStyle = COLORS.ink; ctx.fillRect(close.x, close.y, close.w, close.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(close.x + 2, close.y + 2, close.w - 4, close.h - 4);
    ctx.fillStyle = "#26363d";
    for (let i = 0; i < 6; i += 1) { ctx.fillRect(close.x + 5 + i, close.y + 5 + i, 2, 2); ctx.fillRect(close.x + 11 - i, close.y + 5 + i, 2, 2); }
    polish.leaderboardHitRects.close = close;

    const refresh = { x:13, y:72, w:22, h:22 };
    ctx.fillStyle = COLORS.ink; ctx.fillRect(refresh.x, refresh.y, refresh.w, refresh.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(refresh.x + 2, refresh.y + 2, refresh.w - 4, refresh.h - 4);
    drawLeaderboardRefreshIcon(refresh.x + refresh.w / 2, refresh.y + refresh.h / 2, polish.leaderboardHoverKey === "refresh");
    polish.leaderboardHitRects.refresh = refresh;

    const metricRect = { x:42, y:72, w:198, h:22 };
    const levelRect = { x:256, y:72, w:204, h:22 };
    drawLeaderboardDropdown(metricRect, "RANK BY", metricDef.label, polish.leaderboardDropdown === "metric", "metric");
    drawLeaderboardDropdown(levelRect, "LEVEL", ["flies", "pvpwins"].includes(polish.leaderboardMetric) ? "ALL LEVELS" : levelLabel, polish.leaderboardDropdown === "level", "level");

    const context = `ALL PLAYERS • ${metricDef.label} • ${["flies", "pvpwins"].includes(polish.leaderboardMetric) ? "ALL LEVELS" : levelLabel} • ${polish.leaderboardEntries.length} PLAYERS`;
    const contextScale = Math.min(.46, 440 / Math.max(1, measureBitmapText(context, 1)));
    drawBitmapText(context, W / 2, 101, contextScale, "center", "#59666b");

    const table = { x:13, y:110, w:447, h:104 };
    ctx.fillStyle = COLORS.ink; ctx.fillRect(table.x, table.y, table.w, table.h);
    ctx.fillStyle = skin.mid; ctx.fillRect(table.x + 2, table.y + 2, table.w - 4, 18);
    const columns = { rank:48, name:104, level:238, result:330, date:398, replay:444 };
    drawBitmapText("RANK", columns.rank, table.y + 7, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("NAME", columns.name, table.y + 7, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("LEVEL", columns.level, table.y + 7, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("RESULT", columns.result, table.y + 7, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("DATE", columns.date, table.y + 7, .47, "center", COLORS.white, skin.dark);

    const perPage = 5;
    const pageCount = Math.max(1, Math.ceil(polish.leaderboardEntries.length / perPage));
    polish.leaderboardPage = clamp(polish.leaderboardPage, 0, pageCount - 1);
    const rows = polish.leaderboardEntries.slice(polish.leaderboardPage * perPage, polish.leaderboardPage * perPage + perPage);
    if (polish.leaderboardLoading) {
      drawBitmapText("LOADING RECORDS...", W / 2, 159, .72, "center", "#48555a");
    } else if (!rows.length) {
      drawBitmapText(polish.leaderboardError || "NO RECORDS YET", W / 2, 159, .72, "center", "#48555a");
    } else {
      rows.forEach((row, offset) => {
        const y = table.y + 20 + offset * 16;
        ctx.fillStyle = row.isCurrent ? "#b8f5dc" : (offset % 2 ? "#dfe5e7" : "#ffffff");
        ctx.fillRect(table.x + 2, y, table.w - 4, 16);
        ctx.fillStyle = "#d2dde0"; ctx.fillRect(table.x + 2, y + 15, table.w - 4, 1);
        drawBitmapText(String(row.rank || "—"), columns.rank, y + 5, .50, "center", "#26363d");
        const rowPalette = leaderboardFrogPalette(row);
        drawMiniFrogSwatchFacing(77, y + 4, rowPalette, .43, 1);
        const nameRect = { x:70, y:y + 1, w:140, h:14, row };
        const nameHover = polish.leaderboardHoverKey === `name:${offset}`;
        if (nameHover) {
          ctx.fillStyle = mixHexColors(rowPalette.belly || "#b8f5dc", "#ffffff", .22);
          ctx.fillRect(nameRect.x, nameRect.y, nameRect.w, nameRect.h);
          drawMiniFrogSwatchFacing(77, y + 4, rowPalette, .43, 1);
        }
        const nameScale = Math.min(.50, 105 / Math.max(1, measureBitmapText(row.name.toUpperCase(), 1)));
        drawBitmapText(row.name.toUpperCase(), 89, y + 5, nameScale, "left", nameHover ? rowPalette.dark : "#26363d");
        polish.leaderboardNameRects.push(nameRect);
        drawBitmapText(row.level, columns.level, y + 5, .48, "center", "#26363d");
        drawBitmapText(formatLeaderboardValue(row), columns.result, y + 5, .50, "center", "#26363d");
        drawBitmapText(formatLeaderboardDate(row.date), columns.date, y + 5, .45, "center", "#26363d");
        if (row.replayId) {
          const replayRect = { x:432, y:y + 1, w:22, h:14, row };
          drawReplayIcon(replayRect.x + replayRect.w / 2, replayRect.y + replayRect.h / 2, polish.leaderboardHoverKey === `replay:${offset}`);
          polish.leaderboardReplayRects.push(replayRect);
        }
      });
    }

    const prev = { x:164, y:228, w:64, h:24 };
    const next = { x:252, y:228, w:64, h:24 };
    for (const [key, rect, label] of [["prev", prev, "PREVIOUS"], ["next", next, "NEXT"]]) {
      const active = polish.leaderboardHoverKey === key;
      ctx.fillStyle = active ? skin.dark : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = active ? skin.belly : "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      drawBitmapText(label, rect.x + rect.w / 2, rect.y + 8, .42, "center", active ? skin.dark : "#48555a");
      polish.leaderboardHitRects[key] = rect;
    }
    drawBitmapText(`${polish.leaderboardPage + 1} / ${pageCount}`, W / 2, 236, .55, "center", "#26363d");

    // Dropdown menus are drawn last so they sit over the table like the existing DOM leaderboard.
    if (polish.leaderboardDropdown === "metric") {
      const x = metricRect.x, y = metricRect.y + metricRect.h, w = metricRect.w, h = 17;
      LEADERBOARD_METRICS.forEach((entry, index) => {
        const rect = { x, y:y + index * h, w, h };
        ctx.fillStyle = COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = entry.id === polish.leaderboardMetric ? skin.belly : (index % 2 ? "#dce3e5" : "#ffffff"); ctx.fillRect(rect.x + 2, rect.y + 1, rect.w - 4, rect.h - 2);
        drawBitmapText(entry.label, rect.x + 7, rect.y + 5, .43, "left", "#26363d");
        polish.leaderboardHitRects[`metric:${entry.id}`] = rect;
      });
    } else if (polish.leaderboardDropdown === "level" && !["flies", "pvpwins"].includes(polish.leaderboardMetric)) {
      const x = levelRect.x, y = levelRect.y + levelRect.h, w = levelRect.w, h = 17;
      LEADERBOARD_LEVELS.forEach((entry, index) => {
        const rect = { x, y:y + index * h, w, h };
        ctx.fillStyle = COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = entry === polish.leaderboardLevel ? skin.belly : (index % 2 ? "#dce3e5" : "#ffffff"); ctx.fillRect(rect.x + 2, rect.y + 1, rect.w - 4, rect.h - 2);
        drawBitmapText(entry === "any" ? "ANY LEVEL" : entry.toUpperCase(), rect.x + 7, rect.y + 5, .43, "left", "#26363d");
        polish.leaderboardHitRects[`level:${entry}`] = rect;
      });
    }
  }

  async function playLeaderboardRecord(row) {
    if (!row) return false;
    const metric = String(row.metric || polish.leaderboardMetric || "time").toLowerCase();
    const level = String(row.level || polish.leaderboardLevel || "park").toLowerCase();
    if (!["time", "jumps"].includes(metric) || !level || level === "all" || level === "any") {
      game.cheatToastText = "REPLAY AVAILABLE FOR TIME AND JUMP RECORDS";
      game.cheatToastTimer = CONFIG.achievementToastDuration;
      return false;
    }
    try {
      if (typeof window.RibbitRacePlayRecordReplay === "function") {
        await window.RibbitRacePlayRecordReplay(row.replayUsername || row.name, level, metric, row.replayUid || "");
        return true;
      }
      const replayQuery = new URLSearchParams({
        username:String(row.replayUsername || row.name || ""),
        level,
        metric
      });
      if (row.replayUid) replayQuery.set("uid", String(row.replayUid));
      const response = await fetch(`/api/replays/get?${replayQuery.toString()}`, { credentials:"same-origin", cache:"no-store" });
      let payload = {};
      try { payload = await response.json(); } catch (_) {}
      if (!response.ok || !payload?.ok || !payload?.data) {
        const replayError = new Error(payload?.message || "Replay unavailable");
        replayError.status = response.status;
        throw replayError;
      }
      const blob = await (await fetch(`data:${payload.mime || "video/webm"};base64,${payload.data}`)).blob();
      const id = `record-${row.name}-${level}-${metric}-${Date.now()}`;
      await window.RibbitReplayStore?.put?.({ id, blob, at:Date.now(), type:blob.type });
      await window.RibbitRacePlayStoredReplay?.(id, `${row.name} • ${level.toUpperCase()} • ${metric === "time" ? "FASTEST TIME" : "FEWEST JUMPS"}`);
      return true;
    } catch (error) {
      game.cheatToastText = error?.status === 401
        ? "SIGN IN TO WATCH REPLAYS"
        : error?.status === 404
          ? "THIS RECORD HAS NO SAVED VIDEO"
          : "REPLAY WORKER ROUTE UNAVAILABLE";
      game.cheatToastTimer = CONFIG.achievementToastDuration;
      return false;
    }
  }

  async function playReplayById(replayId, title = "REPLAY") {
    if (!replayId) return false;
    try {
      document.querySelectorAll("video").forEach((video) => { if (/replay/i.test(video.closest("[class],[id]")?.textContent || "")) video.pause?.(); });
    } catch (_) {}
    for (const candidate of [
      () => typeof playStoredReplay === "function" ? playStoredReplay(replayId, title) : undefined,
      () => window.RibbitRacePlayStoredReplay?.(replayId, title),
      () => window.RibbitReplayArchive?.play?.(replayId, title),
      () => window.RibbitReplayPlayer?.play?.(replayId, title),
      () => window.RibbitRaceReplay?.play?.(replayId, title)
    ]) {
      try {
        const value = await candidate();
        if (value !== undefined && value !== false) return true;
      } catch (_) {}
    }
    window.dispatchEvent(new CustomEvent("ribbit-play-replay", { detail:{ replayId, title } }));
    return true;
  }
  window.RibbitRacePlayReplay = playReplayById;

  function repairReplayModal(root = document) {
    // Replays now use the dedicated video window owned by extended-features.js.
    // Never replace its <video> element with the legacy giant text button.
    return root;
  }


  function readHatProgress() {
    try { return JSON.parse(localStorage.getItem(HAT_PROGRESS_KEY) || "{}") || {}; }
    catch (_) { return {}; }
  }

  function saveHatProgress(progress) {
    try { localStorage.setItem(HAT_PROGRESS_KEY, JSON.stringify(progress)); } catch (_) {}
    try {
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      cloud?.queueSave?.({ ribbitRaceHatProgressV2: progress });
    } catch (_) {}
  }

  const PENDING_HAT_NOTICES_KEY = "ribbitRacePendingHatNoticesV1";

  function hatSelectorIsVisibleToPlayer() {
    try { return Boolean(isCustomHatSelectorUnlocked?.()); }
    catch (_) { return false; }
  }

  function readPendingHatNotices() {
    try {
      const value = JSON.parse(localStorage.getItem(PENDING_HAT_NOTICES_KEY) || "[]");
      return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
    } catch (_) { return []; }
  }

  function queueHiddenHatNotice(hatId) {
    const pending = readPendingHatNotices();
    const id = String(hatId || "");
    if (id && !pending.includes(id)) pending.push(id);
    try { localStorage.setItem(PENDING_HAT_NOTICES_KEY, JSON.stringify(pending)); } catch (_) {}
  }

  function flushPendingHatNotices() {
    if (!hatSelectorIsVisibleToPlayer()) return false;
    const pending = readPendingHatNotices();
    if (!pending.length) return false;
    try { localStorage.removeItem(PENDING_HAT_NOTICES_KEY); } catch (_) {}
    for (const hatId of pending) {
      registerRoundHatUnlock(hatId);
      try { window.dispatchEvent(new CustomEvent("ribbit-hat-unlocked", { detail:{ id:hatId, at:Date.now(), deferred:true } })); } catch (_) {}
      try { queueAchievementToast?.({ type:"hat", hatId }); } catch (_) {}
    }
    return true;
  }

  function registerRoundHatUnlock(hatId) {
    const id = String(hatId || "").trim();
    if (!id || id === "none") return false;
    if (!Array.isArray(game.roundUnlockedHatIds)) game.roundUnlockedHatIds = [];
    if (!game.roundUnlockedHatIds.includes(id) && (game.state === "playing" || game.state === "won")) {
      game.roundUnlockedHatIds.push(id);
      return true;
    }
    return false;
  }

  window.addEventListener("ribbit-hat-unlocked", (event) => {
    const id = String(event?.detail?.id || "");
    if (!id) return;
    if (!hatSelectorIsVisibleToPlayer()) { queueHiddenHatNotice(id); return; }
    registerRoundHatUnlock(id);
  });

  function unlockHatFromLiveProgress(hatId, displayName) {
    let unlocked = [];
    try {
      const parsed = JSON.parse(localStorage.getItem("ribbitRaceUnlockedHatsV2") || "[]");
      unlocked = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (_) {}
    if (unlocked.includes(hatId)) return false;
    unlocked.push(hatId);
    try { localStorage.setItem("ribbitRaceUnlockedHatsV2", JSON.stringify(unlocked)); } catch (_) {}
    try {
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      cloud?.queueSave?.({ ribbitRaceUnlockedHatsV2: unlocked });
    } catch (_) {}
    if (!hatSelectorIsVisibleToPlayer()) {
      // Progress and the unlock itself are saved immediately, but the player is
      // not told about hats before the Hat selector has actually been earned.
      queueHiddenHatNotice(hatId);
      return true;
    }
    registerRoundHatUnlock(hatId);
    try { window.dispatchEvent(new CustomEvent("ribbit-hat-unlocked", { detail:{ id:hatId, at:Date.now() } })); } catch (_) {}
    try { queueAchievementToast?.({ type:"hat", hatId }); } catch (_) {}
    try { tone(784, .08, .016, 100); tone(1047, .10, .012, 115, .06); } catch (_) {}
    return true;
  }

  window.RibbitUnlockHatFromLiveProgress = unlockHatFromLiveProgress;

  function recordHatCatch(skinIdOverride = null) {
    const skinId = String(skinIdOverride || game.skinId || "azure").toLowerCase();
    const progress = readHatProgress();
    progress.total = Math.max(0, Number(progress.total) || 0) + 1;
    progress.bySkin = progress.bySkin && typeof progress.bySkin === "object" ? progress.bySkin : {};
    progress.bySkin[skinId] = Math.max(0, Number(progress.bySkin[skinId]) || 0) + 1;
    saveHatProgress(progress);
    try { window.dispatchEvent(new CustomEvent("rr-hat-progress", { detail:{ skinId, count:progress.bySkin[skinId], total:progress.total } })); } catch (_) {}
    try {
      if (!statsProfile.fliesBySkin || typeof statsProfile.fliesBySkin !== "object") statsProfile.fliesBySkin = {};
      statsProfile.fliesBySkin[skinId] = Math.max(Number(statsProfile.fliesBySkin[skinId]) || 0, progress.bySkin[skinId]);
      statsProfile.totalFliesEaten = Math.max(Number(statsProfile.totalFliesEaten) || 0, progress.total);
      statsProfile[`${skinId}FliesCaught`] = Math.max(Number(statsProfile[`${skinId}FliesCaught`]) || 0, progress.bySkin[skinId]);
      statsProfile[`${skinId}FlyCount`] = Math.max(Number(statsProfile[`${skinId}FlyCount`]) || 0, progress.bySkin[skinId]);
      saveStatsProfile();
    } catch (_) {}

    if (skinId === "azure" && progress.bySkin.azure >= 75) unlockHatFromLiveProgress("top-hat", "TOP HAT");
    if (skinId === "plum" && progress.bySkin.plum >= 50) unlockHatFromLiveProgress("party-hat", "PARTY HAT");

    for (const fn of [
      typeof evaluateHatUnlocks === "function" ? evaluateHatUnlocks : null,
      typeof refreshHatUnlocks === "function" ? refreshHatUnlocks : null,
      typeof checkHatUnlocks === "function" ? checkHatUnlocks : null,
      typeof updateHatUnlocks === "function" ? updateHatUnlocks : null
    ]) safeCall(fn);
    try { if (game.customHatOpen) drawScene(); } catch (_) {}
    return progress.bySkin[skinId];
  }

  // Evaluate time-based hat challenges immediately at the real win boundary.
  // The page-side controller still owns the full catalog and persistent counters;
  // these direct checks guarantee that single-run hats cannot miss a qualifying
  // finish because a state-change monitor sampled the next screen late.
  const originalCompleteWinForHatChallenges = completeWin;
  completeWin = function(...args) {
    const levelId = String(game.selectedLevelId || "park").toLowerCase();
    const skinId = String(game.skinId || "azure").toLowerCase();
    const result = originalCompleteWinForHatChallenges.apply(this, args);
    const training = Boolean(game.tutorialActive || window.RibbitRaceTutorialEngine?.active || window.RibbitRaceTutorialEngine?.completeScreen);
    if (!training) {
      const seconds = Number(game.finishTime ?? (typeof getTimerTime === "function" ? getTimerTime() : game.elapsed));
      const snapshot = { level:levelId, skin:skinId, time:Number.isFinite(seconds) ? seconds : 0 };
      try { window.RibbitHatProgress?.evaluate?.(snapshot); } catch (_) {}
      if (snapshot.level === "park" && snapshot.skin === "forest" && snapshot.time > 0 && snapshot.time < 25) {
        unlockHatFromLiveProgress("straw-hat", "STRAW HAT");
      }
      if (snapshot.level === "pond" && snapshot.skin === "silver" && snapshot.time > 0 && snapshot.time < 30) {
        unlockHatFromLiveProgress("bunny-ears", "BUNNY EARS");
      }
      if (snapshot.level === "garden" && snapshot.skin === "blossom" && snapshot.time > 0 && snapshot.time < 30) {
        unlockHatFromLiveProgress("flower", "FLOWER");
      }
    }
    return result;
  };

  function shouldCountHatCatch(targetFly) {
    if (!targetFly || typeof targetFly !== "object") return false;
    if (countedHatFlyObjects.has(targetFly)) return false;
    if (targetFly.sandboxTest) return false;
    if (game.tutorialActive || window.RibbitRaceTutorialEngine?.active) return false;
    countedHatFlyObjects.add(targetFly);
    return true;
  }

  // Count at the actual successful catch functions. The old attemptFlyCatch
  // wrapper could miss catches when another wrapper returned early or when the
  // catch came from a bonus/tongue path.
  const originalCompleteCorrectCatchForHats = completeCorrectCatch;
  completeCorrectCatch = function(targetFly, ...rest) {
    const result = originalCompleteCorrectCatchForHats.call(this, targetFly, ...rest);
    if (result && shouldCountHatCatch(targetFly)) recordHatCatch(game.skinId);
    return result;
  };

  const originalCompleteBonusCatchForHats = completeBonusCatch;
  completeBonusCatch = function(targetFly, ...rest) {
    const result = originalCompleteBonusCatchForHats.call(this, targetFly, ...rest);
    if (result && shouldCountHatCatch(targetFly)) recordHatCatch(game.skinId);
    return result;
  };

  const originalCompletePvpCorrectCatchForHats = completePvpCorrectCatch;
  completePvpCorrectCatch = function(player, targetFly, ...rest) {
    const result = originalCompletePvpCorrectCatchForHats.call(this, player, targetFly, ...rest);
    const localIndex = game.onlineMode ? Number(OnlineVersus?.localIndex?.() || 0) : 0;
    const eligible = player && (game.onlineMode ? player.index === localIndex : (player.index === 0 || !game.pvpCpuEnabled));
    if (result && eligible && shouldCountHatCatch(targetFly)) recordHatCatch(player.skinId || game.pvpSetupSkinIds?.[player.index] || game.skinId);
    return result;
  };


  const originalAttemptFlyCatchPolish8 = attemptFlyCatch;
  attemptFlyCatch = function(targetFly, source = "body", ...rest) {
    return originalAttemptFlyCatchPolish8.call(this, targetFly, source, ...rest);
  };

  function clearPinnedHatRequirement() {
    for (const key of Object.keys(game)) {
      if (/hat/i.test(key) && /(pinned|requirement|tooltip|notice)/i.test(key)) {
        if (typeof game[key] === "boolean") game[key] = false;
        else if (typeof game[key] === "number") game[key] = 0;
        else game[key] = null;
      }
    }
  }

  function getBaseSkinIds() {
    return ["azure","crimson","plum","forest","violet","silver","blossom","ember"].filter((id) => FROG_SKINS?.[id]);
  }

  function applyCustomBaseSkin(skinId) {
    const skin = FROG_SKINS?.[skinId];
    if (!skin) return false;
    try {
      finalizeCustomEditorForHistory();
      beginCustomColorHistoryTransaction();
      const palette = normalizeCustomPalette({
        body: skin.mid,
        belly: skin.belly,
        accents: skin.accents || skin.light
      });
      game.customDraftBody = palette.body;
      game.customDraftBelly = palette.belly;
      game.customDraftAccents = palette.accents;
      polish.baseSkinIndex = Math.max(0, getBaseSkinIds().indexOf(skinId));
      commitCustomColorHistoryTransaction();
      requestCustomPreviewRender();
      try { tone(650, .05, .012, 65); } catch (_) {}
      return true;
    } catch (error) {
      console.warn("Could not apply custom frog base", error);
      return false;
    }
  }

  const CUSTOM_BASE_PANEL = Object.freeze({ x:104, y:64, w:272, h:132 });
  const CUSTOM_BASE_CLOSE = Object.freeze({ x:355, y:68, w:18, h:18 });

  function getCustomBaseOptionRects() {
    const ids = getBaseSkinIds();
    return ids.map((id, index) => ({
      id,
      x:116 + (index % 4) * 63,
      y:98 + Math.floor(index / 4) * 44,
      w:56,
      h:40
    }));
  }

  function hslColorToHex(h, s, l) {
    const hue=((Number(h)%360)+360)%360/360;
    const sat=clamp(Number(s),0,1), light=clamp(Number(l),0,1);
    if(sat===0){const v=Math.round(light*255);return rgbToHex(v,v,v);}
    const q=light<.5?light*(1+sat):light+sat-light*sat;
    const p=2*light-q;
    const channel=(t)=>{t=(t+1)%1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
    return rgbToHex(Math.round(channel(hue+1/3)*255),Math.round(channel(hue)*255),Math.round(channel(hue-1/3)*255));
  }

  function randomizeCustomPalette() {
    try {
      finalizeCustomEditorForHistory();
      beginCustomColorHistoryTransaction();
      const baseHue=Math.floor(Math.random()*360);
      const accentHue=(baseHue+70+Math.floor(Math.random()*100))%360;
      const bellyHue=(baseHue+20+Math.floor(Math.random()*36))%360;
      const palette=normalizeCustomPalette({
        body:hslColorToHex(baseHue,.58+Math.random()*.25,.34+Math.random()*.18),
        belly:hslColorToHex(bellyHue,.30+Math.random()*.25,.72+Math.random()*.16),
        accents:hslColorToHex(accentHue,.68+Math.random()*.25,.48+Math.random()*.20)
      });
      game.customDraftBody=palette.body;
      game.customDraftBelly=palette.belly;
      game.customDraftAccents=palette.accents;
      commitCustomColorHistoryTransaction();
      requestCustomPreviewRender();
      try{tone(680,.05,.012,72);}catch(_){}
      return true;
    } catch(error){console.warn("Could not randomize custom frog",error);return false;}
  }

  function drawCustomRandomButton() {
    if(game.state!=="custom") return;
    const rect=CUSTOM_RANDOM_BUTTON;
    const skin=getCustomDraftSkin();
    const active=polish.customToolHover==="random";
    ctx.fillStyle=active?skin.dark:COLORS.ink;ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.fillStyle=active?skin.belly:"#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
    ctx.fillStyle=active?skin.light:"#ffffff";ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,2);
    // Pixel die: show, don't tell.
    ctx.fillStyle=active?skin.dark:"#48555a";ctx.fillRect(rect.x+7,rect.y+7,11,10);
    ctx.fillStyle="#f7fdff";
    [[9,9],[15,9],[12,12],[9,15],[15,15]].forEach(([x,y])=>ctx.fillRect(rect.x+x,rect.y+y,2,2));
  }

  function drawCustomBaseButton() {
    if (game.state !== "custom") return;
    const rect = CUSTOM_BASE_BUTTON;
    const draftSkin = getCustomDraftSkin();
    ctx.fillStyle = "rgba(25,43,52,.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = polish.customBaseOpen ? draftSkin.dark : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = polish.customBaseOpen ? draftSkin.belly : "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    // Template icon: two stacked cards with a miniature frog on the front card.
    ctx.fillStyle = "#94a4a9"; ctx.fillRect(rect.x + 9, rect.y + 5, 10, 9);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(rect.x + 11, rect.y + 7, 6, 5);
    ctx.fillStyle = draftSkin.dark; ctx.fillRect(rect.x + 5, rect.y + 8, 11, 9);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(rect.x + 7, rect.y + 10, 7, 5);
    drawMiniFrogSwatchFacing(rect.x + 11, rect.y + 11, draftSkin, .30, 1);
    if (!polish.customBaseOpen) return;

    const panel = CUSTOM_BASE_PANEL;
    ctx.fillStyle = "rgba(25,43,52,.34)"; ctx.fillRect(panel.x + 4, panel.y + 4, panel.w, panel.h);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(panel.x + 3, panel.y + 3, panel.w - 6, panel.h - 6);
    // Let the selected custom palette streak span the full header. The close
    // control sits on top at the extreme corner instead of leaving a white gap.
    ctx.fillStyle = draftSkin.mid; ctx.fillRect(panel.x + 5, panel.y + 5, panel.w - 10, 24);
    ctx.fillStyle = draftSkin.light; ctx.fillRect(panel.x + 9, panel.y + 8, panel.w - 18, 3);
    drawBitmapText("CHOOSE BASE FROG", panel.x + panel.w / 2, panel.y + 10, .72, "center", COLORS.white, draftSkin.dark);

    ctx.fillStyle = COLORS.ink; ctx.fillRect(CUSTOM_BASE_CLOSE.x, CUSTOM_BASE_CLOSE.y, CUSTOM_BASE_CLOSE.w, CUSTOM_BASE_CLOSE.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(CUSTOM_BASE_CLOSE.x + 2, CUSTOM_BASE_CLOSE.y + 2, CUSTOM_BASE_CLOSE.w - 4, CUSTOM_BASE_CLOSE.h - 4);
    ctx.fillStyle = draftSkin.dark;
    for (let i = 0; i < 7; i += 1) {
      ctx.fillRect(CUSTOM_BASE_CLOSE.x + 5 + i, CUSTOM_BASE_CLOSE.y + 5 + i, 2, 2);
      ctx.fillRect(CUSTOM_BASE_CLOSE.x + 11 - i, CUSTOM_BASE_CLOSE.y + 5 + i, 2, 2);
    }

    const selectedId = getBaseSkinIds().find((id) => {
      const skin = FROG_SKINS[id];
      return normalizeHexColor(draftSkin.mid, "") === normalizeHexColor(skin.mid, "") &&
        normalizeHexColor(draftSkin.belly, "") === normalizeHexColor(skin.belly, "") &&
        normalizeHexColor(draftSkin.accents || draftSkin.light, "") === normalizeHexColor(skin.accents || skin.light, "");
    }) || "";
    for (const option of getCustomBaseOptionRects()) {
      const skin = FROG_SKINS[option.id];
      const selected = option.id === selectedId;
      ctx.fillStyle = selected ? COLORS.ink : "#9aa9ae";
      ctx.fillRect(option.x, option.y, option.w, option.h);
      ctx.fillStyle = selected ? mixHexColors(skin.belly, "#ffffff", .12) : "#f7fdff";
      ctx.fillRect(option.x + 2, option.y + 2, option.w - 4, option.h - 4);
      ctx.fillStyle = skin.light;
      ctx.fillRect(option.x + 5, option.y + 4, option.w - 10, 3);
      drawMiniFrogSwatchFacing(option.x + option.w / 2, option.y + 11, skin, .72, 1);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(option.x + 3, option.y + 27, option.w - 6, 10);
      const labelScale = Math.min(.40, (option.w - 8) / Math.max(1, measureBitmapText(skin.name || option.id.toUpperCase(), 1)));
      drawBitmapText((skin.name || option.id).toUpperCase(), option.x + option.w / 2, option.y + 29, labelScale, "center", skin.dark);
      if (selected) {
        ctx.fillStyle = skin.dark;
        ctx.fillRect(option.x + 3, option.y + 3, 2, 2);
        ctx.fillRect(option.x + option.w - 5, option.y + 3, 2, 2);
        ctx.fillRect(option.x + 3, option.y + option.h - 5, 2, 2);
        ctx.fillRect(option.x + option.w - 5, option.y + option.h - 5, 2, 2);
      }
    }
  }

  function drawCustomTooltips() {
    if(game.state!=="custom"||polish.customBaseOpen)return;
    const hover=polish.customToolHover;
    if(hover==="random")drawSpeechBubble(CUSTOM_RANDOM_BUTTON,"RANDOMIZE",{maxWidth:96,scale:.46});
    else if(hover==="base")drawSpeechBubble(CUSTOM_BASE_BUTTON,"CHOOSE TEMPLATE",{maxWidth:126,scale:.44});
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else (document.getElementById("game-frame") || canvas || document.documentElement).requestFullscreen?.();
    } catch (_) {}
  }

  function drawPauseFullscreenButton() {
    if (game.state !== "paused" || game.pauseHelpOpen) return;
    const rect = PAUSE_FULLSCREEN_BUTTON;
    ctx.fillStyle = COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.fillStyle = "#48555a";
    ctx.fillRect(rect.x + 5, rect.y + 5, 4, 2); ctx.fillRect(rect.x + 5, rect.y + 5, 2, 4);
    ctx.fillRect(rect.x + rect.w - 9, rect.y + 5, 4, 2); ctx.fillRect(rect.x + rect.w - 7, rect.y + 5, 2, 4);
    ctx.fillRect(rect.x + 5, rect.y + rect.h - 7, 4, 2); ctx.fillRect(rect.x + 5, rect.y + rect.h - 9, 2, 4);
    ctx.fillRect(rect.x + rect.w - 9, rect.y + rect.h - 7, 4, 2); ctx.fillRect(rect.x + rect.w - 7, rect.y + rect.h - 9, 2, 4);
  }

  function isOnlineMenuVisible() {
    try { return Boolean(OnlineVersus?.isMenuVisible?.() && !OnlineVersus?.isActive?.()); }
    catch (_) { return false; }
  }

  function selectedOnlinePalette() {
    try { return getPvpSetupPreviewPalette?.(0) || getSelectedSkin(); }
    catch (_) { return getSelectedSkin(); }
  }

  function drawOnlineUnifiedHeader() {
    if (!isOnlineMenuVisible()) return;
    const palette = selectedOnlinePalette();
    const title = (() => {
      try {
        if (OnlineVersus?.isQuickplayMenu?.()) return "QUICKPLAY";
        if (OnlineVersus?.isRoomMenu?.()) return "ONLINE ROOM";
      } catch (_) {}
      return "ONLINE";
    })();
    const panel = { x:40, y:8, w:400, h:42 };
    ctx.fillStyle = COLORS.ink; ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = palette.dark; ctx.fillRect(panel.x + 3, panel.y + 3, panel.w - 6, panel.h - 6);
    ctx.fillStyle = palette.mid; ctx.fillRect(panel.x + 5, panel.y + 5, panel.w - 10, panel.h - 10);
    ctx.fillStyle = palette.light; ctx.fillRect(panel.x + 8, panel.y + 7, panel.w - 16, 3);
    drawBitmapText(title, W / 2, panel.y + 14, 1.55, "center", COLORS.white, palette.dark);
  }

  function drawMainMenuTooltips() {
    if (game.state !== "main" || !polish.mainHoverKey) return;
    const lookup = {
      profile:[MAIN_PROFILE_BUTTON, "ACCOUNT & LANGUAGE"],
      device:[MAIN_DEVICE_BUTTON, "COMPUTER / MOBILE MODE"],
      achievements:[MAIN_UI.achievementsButton, "ACHIEVEMENTS"],
      stats:[MAIN_UI.statsButton, "STATS & RECORDS"]
    };
    const entry = lookup[polish.mainHoverKey];
    if (entry) drawSpeechBubble(entry[0], entry[1], { maxWidth:170, scale:.50 });
  }

  function drawAchievementLeaderboardButton() {
    if (game.state !== "achievements") return;
    drawMiniMedalButton(LEADERBOARD_BUTTON, polish.mainHoverKey === "leaderboard");
    if (polish.mainHoverKey === "leaderboard") drawSpeechBubble(LEADERBOARD_BUTTON, "LEADERBOARD", { maxWidth:116, scale:.50 });
  }

  function drawWorldRecordNotice() {
    if (game.state !== "won" || !(game.newWorldRecord || game.worldRecordNotice || game.roundWorldRecord)) return;
    const rect = { x:150, y:205, w:180, h:24 };
    ctx.fillStyle = "rgba(25,43,52,.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = "#805316"; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#ffe7a0"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    drawPixelTrophy(rect.x + 15, rect.y + 3, false, .78);
    drawBitmapText("NEW WORLD RECORD!", rect.x + 103, rect.y + 8, .72, "center", "#805316");
    if (polish.worldRecordHovered) {
      const previous = game.previousWorldRecord || game.worldRecordPrevious || game.worldRecordPrior || game.recordPrevious || game.previousRecord || {};
      const name = previous.name || previous.holder || previous.displayName || game.previousWorldRecordHolder || "NO PREVIOUS HOLDER";
      const value = previous.value ?? previous.time ?? previous.jumps ?? previous.score ?? game.previousWorldRecordValue ?? "—";
      const rawDate = previous.date || previous.createdAt || game.previousWorldRecordDate; const date = rawDate ? new Date(rawDate).toLocaleDateString() : "";
      drawSpeechBubble(rect, `PREVIOUS: ${name} • ${value}${date ? ` • ${date}` : ""}`, { maxWidth:260, scale:.43, height:23 });
    }
  }

  function drawPvpPauseButtonPolish8() {
    if (game.mode !== "pvp" || !["playing","countdown","pvpCelebration"].includes(game.state)) return;
    if (isOnlineMenuVisible()) return;
    const rect = HUD_UI.pauseButton;
    const paused = game.state === "paused";
    ctx.save(); ctx.globalAlpha = paused ? .84 : .58;
    ctx.fillStyle = "rgba(25,43,52,.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = paused ? getSelectedSkin().mid : getSelectedSkin().belly;
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.fillStyle = paused ? COLORS.white : getSelectedSkin().dark;
    if (paused) {
      ctx.fillRect(rect.x + 9, rect.y + 5, 3, 9);
      ctx.fillRect(rect.x + 12, rect.y + 7, 3, 5);
      ctx.fillRect(rect.x + 15, rect.y + 9, 2, 1);
    } else {
      ctx.fillRect(rect.x + 7, rect.y + 5, 4, 9);
      ctx.fillRect(rect.x + 15, rect.y + 5, 4, 9);
    }
    ctx.restore();
  }

  // Own exactly one contextual VS/CPU speech bubble. Local Versus (VS) offers a return
  // to CPU play; CPU mode offers a switch to Local Versus. Keeping this in the
  // core draw hook prevents the old generic helper from stacking a second box.
  const originalDrawPvpVsHoverTooltipPolish8 = typeof drawPvpVsHoverTooltip === "function" ? drawPvpVsHoverTooltip : null;
  drawPvpVsHoverTooltip = function() {
    if (OnlineVersus.isRoomMenu() || game.pvpSetupHoveredKey !== "vs") return;
    const message = game.pvpCpuEnabled
      ? "CLICK TO ENABLE LOCAL VERSUS"
      : "CLICK TO PLAY AGAINST CPU";
    const anchor = PVP_SETUP_UI.vsButton;
    const scale = .50;
    const width = Math.max(142, Math.min(196, measureBitmapText(message, scale) + 18));
    const height = 22;
    const centerX = anchor.x + anchor.w / 2;
    const x = clamp(Math.round(centerX - width / 2), 4, W - width - 4);
    const y = anchor.y - height - 10;
    ctx.save();
    ctx.fillStyle = "rgba(25,43,52,.30)"; ctx.fillRect(x + 2, y + 2, width, height);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    ctx.fillStyle = getSelectedSkin().light; ctx.fillRect(x + 5, y + 4, width - 10, 2);
    drawBitmapText(message, x + width / 2, y + 8, scale, "center", "#26363d");
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(Math.round(centerX) - 4, y + height, 9, 2);
    ctx.fillRect(Math.round(centerX) - 3, y + height + 2, 7, 2);
    ctx.fillRect(Math.round(centerX) - 2, y + height + 4, 5, 2);
    ctx.restore();
  };

  function immediateResetToStart() {
    try { flies.length = 0; } catch (_) {}
    try { game.spawnQueue.length = 0; } catch (_) {}
    try { tongue.active = false; tongue.targetFlyId = null; tongue.captured = false; } catch (_) {}
    try {
      if (game.mode === "pvp") {
        resetPvpGame();
        game.state = "playing";
      } else {
        resetGame(false);
        applySelectedLevel();
        Object.assign(frog, {
          x:Number(LEVELS?.[game.selectedLevelId]?.startX ?? 25) + Number(CONFIG.initialFrogOffsetX || 36),
          y:CONFIG.groundY - frog.h,
          vx:0, vy:0, grounded:true, charging:false, chargeHoldTime:0,
          departurePlatform:null, dropThroughPlatform:null
        });
        game.state = "playing";
      }
      clearHeldInput();
      startResumeCountdown(false);
    } catch (_) {}
  }

  function clearQuickplayAndHome() {
    polish.quickplayLeaving = true;
    try { OnlineVersus?.leaveRoom?.(); } catch (_) {}
    try { OnlineVersus?.cancelQuickplay?.(); } catch (_) {}
    try { OnlineVersus?.reset?.(); } catch (_) {}
    try { flies.length = 0; game.spawnQueue.length = 0; } catch (_) {}
    try { openMainMenu(false); } catch (_) { game.state = "main"; }
    setTimeout(() => { polish.quickplayLeaving = false; }, 250);
  }

  function archiveOnlineRound() {
    const significantSolo = game.mode === "solo" && game.state === "won" && Boolean(game.newBestTime || game.newFewestJumps || game.newEndlessBest || game.newWorldRecord);
    const onlineFinished = Boolean(game.onlineMode && ["won","pvpCelebration"].includes(game.state));
    if (!significantSolo && !onlineFinished) return;
    const key = `${game.pvpMatchId || game.onlineRoomCode || "online"}:${game.pvpRoundIndex || 0}:${game.pvpElapsed || game.elapsed || 0}`;
    if (polish.lastArchivedRoundKey === key) return;
    polish.lastArchivedRoundKey = key;
    let payload;
    for (const fn of [
      typeof finishReplayRecording === "function" ? finishReplayRecording : null,
      typeof finalizeReplayRecording === "function" ? finalizeReplayRecording : null,
      window.RibbitReplayRecorder?.finish
    ]) {
      try { if (fn) { payload = fn(); if (payload) break; } } catch (_) {}
    }
    const opponent = (() => {
      if (!onlineFinished) return "SOLO PERSONAL BEST";
      try {
        const local = Number(OnlineVersus?.localIndex?.() || 0);
        return String(pvpPlayers?.[1 - local]?.displayName || pvpPlayers?.[1 - local]?.name || OnlineVersus?.opponentName?.() || "ONLINE FROG");
      } catch (_) { return "ONLINE FROG"; }
    })();
    const metadata = { opponent, at:Date.now(), won:Boolean(onlineFinished && game.pvpMatchWinnerIndex === (OnlineVersus?.localIndex?.() || 0)), online:onlineFinished, significant:true, personalBest:significantSolo };
    const upload = async () => {
      let replayId = payload?.id || payload?.replayId || null;
      for (const fn of [
        window.RibbitReplayArchive?.save,
        window.RibbitReplayArchive?.upload,
        window.RibbitCloud?.uploadReplay,
        typeof uploadReplay === "function" ? uploadReplay : null
      ]) {
        try {
          if (!fn || replayId) continue;
          const response = await fn(payload, { ...metadata, significant:true, personalBest:true });
          replayId = response?.replayId || response?.id || replayId;
        } catch (_) {}
      }
      if (onlineFinished) {
        try {
          const history = JSON.parse(localStorage.getItem(ONLINE_HISTORY_KEY) || "{}");
          if (!Array.isArray(history[opponent])) history[opponent] = [];
          history[opponent].unshift({ ...metadata, replayId });
          history[opponent] = history[opponent].slice(0, 50);
          localStorage.setItem(ONLINE_HISTORY_KEY, JSON.stringify(history));
        } catch (_) {}
        try { window.RibbitFrogTags?.addGame?.(opponent, { ...metadata, replayId }); } catch (_) {}
      }
    };
    upload();
  }

  const originalActivatePauseSelectionPolish8 = activatePauseSelection;
  activatePauseSelection = function(...args) {
    if (game.onlineMode && game.state === "paused" && game.pauseSelection === "home") {
      clearQuickplayAndHome();
      return;
    }
    return originalActivatePauseSelectionPolish8.apply(this, args);
  };

  const originalUpdatePolish8 = update;
  update = function(dt, ...rest) {
    const result = originalUpdatePolish8.call(this, dt, ...rest);
    flushPendingHatNotices();
    const criticalCatchActive = Boolean(game.soloCriticalCatchActive || game.pvpCriticalCatchActive);
    if (polish.priorCriticalCatch && !criticalCatchActive) {
      polish.labelFadeStartedAt = performance.now();
      // The cinematic already faded the plates out. Keep them permanently gone
      // after this point so there is no one-frame post-zoom reappearance.
      window.RibbitRaceFinalCatchLabelsGone = true;
    }
    polish.priorCriticalCatch = criticalCatchActive;
    archiveOnlineRound();
    polish.previousRoundState = game.state;
    return result;
  };

  const originalDrawScenePolish8 = drawScene;
  drawScene = function(...args) {
    if (game.state === "rrProfileMenu") { drawProfileMenu(); return; }
    if (game.state === "rrDeviceMenu") { drawDeviceMenu(); return; }
    if (game.state === "rrLeaderboard") {
      drawLeaderboardScreen();
      return;
    }
    const result = originalDrawScenePolish8.apply(this, args);
    drawAchievementLeaderboardButton();
    drawMainMenuTooltips();
    // The core Online renderer owns its original split-color header and panel.
    drawCustomRandomButton();
    drawCustomBaseButton();
    drawCustomTooltips();
    drawPauseFullscreenButton();
    drawWorldRecordNotice();
    drawPvpPauseButtonPolish8();
    return result;
  };

  function interactiveRectForPoint(point) {
    const insideAny = (items = []) => items.some((item) => item && pointIn(point, item));
    if (game.state === "main") {
      return insideAny([MAIN_PROFILE_BUTTON, MAIN_DEVICE_BUTTON, MAIN_UI.soloButton, MAIN_UI.pvpButton,
        MAIN_UI.frogButton, MAIN_UI.achievementsButton, MAIN_UI.statsButton]);
    }
    if (game.state === "title") {
      return insideAny([...(HOME_UI.levelButtons || []), HOME_UI.randomButton, HOME_UI.backButton,
        HOME_UI.tutorialButton, HOME_UI.settingsButton, HOME_UI.timeButton]);
    }
    if (game.state === "setup") {
      return insideAny([...(SETUP_UI.skinButtons || []), SETUP_UI.sandboxButton, SETUP_UI.customButton,
        SETUP_UI.hatButton, SETUP_UI.backButton]);
    }
    if (game.state === "custom") {
      const sliders = (CUSTOM_UI.sliders || []).map((item) => ({ x:item.hitX, y:item.hitY, w:item.hitW, h:item.hitH }));
      return insideAny([...(CUSTOM_UI.slotButtons || []), ...(CUSTOM_UI.partButtons || []), ...sliders,
        CUSTOM_UI.useButton, CUSTOM_UI.backButton, CUSTOM_UI.undoButton, CUSTOM_UI.redoButton,
        CUSTOM_RANDOM_BUTTON, CUSTOM_BASE_BUTTON, polish.customBaseOpen ? CUSTOM_BASE_CLOSE : null,
        ...(polish.customBaseOpen ? getCustomBaseOptionRects() : [])]);
    }
    if (game.state === "rrProfileMenu") return insideAny(PROFILE_MENU_RECTS);
    if (game.state === "rrDeviceMenu") return insideAny(Object.values(DEVICE_MENU_RECTS));
    if (game.state === "achievements") {
      return insideAny([LEADERBOARD_BUTTON, ACHIEVEMENTS_UI.backButton, ACHIEVEMENTS_UI.pagePrevButton, ACHIEVEMENTS_UI.pageNextButton]);
    }
    if (game.state === "stats") {
      return insideAny([STATS_UI.backButton, STATS_UI.pagePrevButton, STATS_UI.pageNextButton]);
    }
    if (game.state === "rrLeaderboard") {
      return insideAny([...Object.values(polish.leaderboardHitRects || {}), ...polish.leaderboardReplayRects, ...polish.leaderboardNameRects]);
    }
    if (game.state === "pvpSetup") {
      return insideAny([...(PVP_SETUP_UI.levelButtons || []), PVP_SETUP_UI.p1Selector, PVP_SETUP_UI.p2Selector,
        PVP_SETUP_UI.vsButton, PVP_SETUP_UI.cpuDifficultyButton, PVP_SETUP_UI.wifiButton,
        PVP_SETUP_UI.tutorialButton, PVP_SETUP_UI.startButton, PVP_SETUP_UI.backButton,
        PVP_SETUP_UI.settingsButton, PVP_SETUP_UI.timeButton]);
    }
    if (game.state === "pvpSettings") {
      return insideAny([...(PVP_SETTINGS_UI.rows || []), PVP_SETTINGS_UI.backButton]);
    }
    if (game.state === "paused") {
      return insideAny([PAUSE_UI.muteButton, PAUSE_UI.sliderHit, PAUSE_UI.continueButton, PAUSE_UI.restartButton,
        PAUSE_UI.homeButton, PAUSE_UI.helpButton, PAUSE_UI.helpCloseButton, ...(game.pauseHelpOpen ? [] : [PAUSE_FULLSCREEN_BUTTON])]);
    }
    if (game.state === "won") {
      return insideAny([VICTORY_UI.replayButton, VICTORY_UI.homeButton, VICTORY_UI.pagePrevButton, VICTORY_UI.pageNextButton]);
    }
    if (["playing","countdown","pvpCelebration"].includes(game.state)) return pointIn(point, HUD_UI.pauseButton);
    return false;
  }

  canvas.addEventListener("pointermove", (event) => {
    const point = getCanvasPoint(event);
    try {
      if (OnlineVersus?.isMenuVisible?.() && !OnlineVersus?.isActive?.()) return;
    } catch (_) {}
    polish.mainHoverKey = "";
    if (game.state === "rrProfileMenu") {
      const index = PROFILE_MENU_RECTS.findIndex((rect) => pointIn(point, rect));
      if (index >= 0) polish.profileSelection = index;
    } else if (game.state === "rrDeviceMenu") {
      if (pointIn(point, DEVICE_MENU_RECTS.computer)) polish.deviceSelection = 0;
      else if (pointIn(point, DEVICE_MENU_RECTS.mobile)) polish.deviceSelection = 1;
      else if (pointIn(point, DEVICE_MENU_RECTS.back)) polish.deviceSelection = 2;
    } else if (game.state === "main") {
      if (pointIn(point, MAIN_PROFILE_BUTTON)) polish.mainHoverKey = "profile";
      else if (pointIn(point, MAIN_DEVICE_BUTTON)) polish.mainHoverKey = "device";
      else if (pointIn(point, MAIN_UI.achievementsButton)) polish.mainHoverKey = "achievements";
      else if (pointIn(point, MAIN_UI.statsButton)) polish.mainHoverKey = "stats";
    } else if (game.state === "achievements" && pointIn(point, LEADERBOARD_BUTTON)) {
      polish.mainHoverKey = "leaderboard";
    }
    polish.leaderboardHoverKey = "";
    if (game.state === "rrLeaderboard") {
      for (const [key, rect] of Object.entries(polish.leaderboardHitRects || {})) {
        if (pointIn(point, rect)) { polish.leaderboardHoverKey = key; break; }
      }
      const nameIndex = polish.leaderboardNameRects.findIndex((item) => pointIn(point, item));
      if (nameIndex >= 0) polish.leaderboardHoverKey = `name:${nameIndex}`;
      const replayIndex = polish.leaderboardReplayRects.findIndex((item) => pointIn(point, item));
      if (replayIndex >= 0) polish.leaderboardHoverKey = `replay:${replayIndex}`;
    }
    polish.worldRecordHovered = game.state === "won" && pointIn(point, { x:150, y:205, w:180, h:24 });
    polish.customToolHover = "";
    if(game.state === "custom" && !polish.customBaseOpen){
      if(pointIn(point,CUSTOM_RANDOM_BUTTON))polish.customToolHover="random";
      else if(pointIn(point,CUSTOM_BASE_BUTTON))polish.customToolHover="base";
    }
    try { canvas.style.setProperty("cursor", interactiveRectForPoint(point) ? "pointer" : "default", "important"); } catch (_) {}
  }, { capture:true, passive:true });

  canvas.addEventListener("pointerleave", () => {
    polish.mainHoverKey = "";
    polish.worldRecordHovered = false;
    try { canvas.style.setProperty("cursor", "default", "important"); } catch (_) {}
  }, { capture:true, passive:true });

  canvas.addEventListener("pointerdown", (event) => {
    const point = getCanvasPoint(event);
    if (game.state === "rrProfileMenu") {
      const index = PROFILE_MENU_RECTS.findIndex((rect) => pointIn(point, rect));
      if (index >= 0) { event.preventDefault(); event.stopImmediatePropagation(); polish.profileSelection=index; activateProfileRow(index); }
      return;
    }
    if (game.state === "rrDeviceMenu") {
      if (pointIn(point, DEVICE_MENU_RECTS.computer)) { event.preventDefault(); event.stopImmediatePropagation(); polish.deviceSelection=0; setCanvasMobileMode(false); }
      else if (pointIn(point, DEVICE_MENU_RECTS.mobile)) { event.preventDefault(); event.stopImmediatePropagation(); polish.deviceSelection=1; setCanvasMobileMode(true); }
      else if (pointIn(point, DEVICE_MENU_RECTS.back)) { event.preventDefault(); event.stopImmediatePropagation(); closeUtilityMenu(); }
      return;
    }
    if (game.state === "achievements" && pointIn(point, LEADERBOARD_BUTTON)) {
      event.preventDefault(); event.stopImmediatePropagation(); openLeaderboard(); return;
    }
    if (game.state === "rrLeaderboard") {
      event.preventDefault(); event.stopImmediatePropagation();
      const hits = polish.leaderboardHitRects || {};
      if (pointIn(point, hits.close)) { closeLeaderboard(); return; }
      if (pointIn(point, hits.refresh)) { polish.leaderboardRawPayload = null; loadLeaderboard(true); return; }
      if (pointIn(point, hits.metric)) {
        polish.leaderboardDropdown = polish.leaderboardDropdown === "metric" ? "" : "metric";
        return;
      }
      if (pointIn(point, hits.level) && !["flies", "pvpwins"].includes(polish.leaderboardMetric)) {
        polish.leaderboardDropdown = polish.leaderboardDropdown === "level" ? "" : "level";
        return;
      }
      for (const entry of LEADERBOARD_METRICS) {
        if (pointIn(point, hits[`metric:${entry.id}`])) {
          polish.leaderboardMetric = entry.id;
          if (["flies", "pvpwins"].includes(entry.id)) polish.leaderboardLevel = "any";
          polish.leaderboardPage = 0;
          polish.leaderboardDropdown = "";
          rebuildLeaderboardRows();
          return;
        }
      }
      for (const level of LEADERBOARD_LEVELS) {
        if (pointIn(point, hits[`level:${level}`])) {
          polish.leaderboardLevel = level;
          polish.leaderboardPage = 0;
          polish.leaderboardDropdown = "";
          rebuildLeaderboardRows();
          return;
        }
      }
      const pageCount = Math.max(1, Math.ceil(polish.leaderboardEntries.length / 5));
      if (pointIn(point, hits.prev)) { polish.leaderboardPage = (polish.leaderboardPage - 1 + pageCount) % pageCount; polish.leaderboardDropdown = ""; return; }
      if (pointIn(point, hits.next)) { polish.leaderboardPage = (polish.leaderboardPage + 1) % pageCount; polish.leaderboardDropdown = ""; return; }
      const name = polish.leaderboardNameRects.find((item) => pointIn(point, item));
      if (name) { playLeaderboardRecord(name.row); return; }
      const replay = polish.leaderboardReplayRects.find((item) => pointIn(point, item));
      if (replay) {
        if (replay.row.replayId) playReplayById(replay.row.replayId, `${replay.row.name} • ${replay.row.metric}`);
        else playLeaderboardRecord(replay.row);
        return;
      }
      polish.leaderboardDropdown = "";
      return;
    }
    if (game.mode === "pvp" && ["playing","countdown","pvpCelebration"].includes(game.state) && pointIn(point, HUD_UI.pauseButton)) {
      event.preventDefault(); event.stopImmediatePropagation(); pauseGame(); return;
    }
    if (game.state === "paused" && !game.pauseHelpOpen && pointIn(point, PAUSE_FULLSCREEN_BUTTON)) {
      event.preventDefault(); event.stopImmediatePropagation(); toggleFullscreen(); return;
    }
    if (game.state === "custom" && !polish.customBaseOpen && pointIn(point, CUSTOM_RANDOM_BUTTON)) {
      event.preventDefault(); event.stopImmediatePropagation(); randomizeCustomPalette(); return;
    }
    if (game.state === "custom" && pointIn(point, CUSTOM_BASE_BUTTON)) {
      event.preventDefault(); event.stopImmediatePropagation();
      polish.customBaseOpen = !polish.customBaseOpen;
      return;
    }
    if (game.state === "custom" && polish.customBaseOpen) {
      if (pointIn(point, CUSTOM_BASE_CLOSE)) {
        event.preventDefault(); event.stopImmediatePropagation();
        polish.customBaseOpen = false;
        return;
      }
      const option = getCustomBaseOptionRects().find((item) => pointIn(point, item));
      if (option) {
        event.preventDefault(); event.stopImmediatePropagation();
        applyCustomBaseSkin(option.id);
        polish.customBaseOpen = false;
        game.state = "custom";
        try { drawScene(); } catch (_) {}
        return;
      }
    }
    if (game.state === "paused" && game.onlineMode && pointIn(point, PAUSE_UI.homeButton)) {
      event.preventDefault(); event.stopImmediatePropagation(); clearQuickplayAndHome(); return;
    }
  }, { capture:true, passive:false });

  window.addEventListener("keydown", (event) => {
    if (game.state === "rrProfileMenu") {
      if (["ArrowUp","ArrowDown","KeyW","KeyS","Enter","NumpadEnter","Space","Escape","Backspace"].includes(event.code)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.repeat && !["ArrowUp","ArrowDown","KeyW","KeyS"].includes(event.code)) return;
        if (["Escape","Backspace"].includes(event.code)) closeUtilityMenu();
        else if (["ArrowUp","KeyW"].includes(event.code)) polish.profileSelection=(polish.profileSelection-1+PROFILE_MENU_ROWS.length)%PROFILE_MENU_ROWS.length;
        else if (["ArrowDown","KeyS"].includes(event.code)) polish.profileSelection=(polish.profileSelection+1)%PROFILE_MENU_ROWS.length;
        else activateProfileRow();
      }
      return;
    }
    if (game.state === "rrDeviceMenu") {
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","KeyA","KeyD","Enter","NumpadEnter","Space","Escape","Backspace"].includes(event.code)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (["Escape","Backspace"].includes(event.code)) closeUtilityMenu();
        else if (["ArrowLeft","KeyA"].includes(event.code)) polish.deviceSelection=(polish.deviceSelection-1+3)%3;
        else if (["ArrowRight","KeyD","ArrowDown","ArrowUp"].includes(event.code)) polish.deviceSelection=(polish.deviceSelection+1)%3;
        else if(polish.deviceSelection===0)setCanvasMobileMode(false);
        else if(polish.deviceSelection===1)setCanvasMobileMode(true);
        else closeUtilityMenu();
      }
      return;
    }
    if (game.state === "rrLeaderboard") {
      const pageCount=Math.max(1,Math.ceil(polish.leaderboardEntries.length/5));
      if (["Escape","Backspace","ArrowLeft","ArrowRight","KeyA","KeyD"].includes(event.code)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.code === "Escape" || event.code === "Backspace") closeLeaderboard();
        else if (["ArrowLeft","KeyA"].includes(event.code)) polish.leaderboardPage=(polish.leaderboardPage-1+pageCount)%pageCount;
        else polish.leaderboardPage=(polish.leaderboardPage+1)%pageCount;
      }
      return;
    }
  }, { capture:true, passive:false });

  window.addEventListener("paste", () => {
    const wasCustom = game.state === "custom";
    if (!wasCustom) return;
    setTimeout(() => { game.state = "custom"; safeCall(drawScene); }, 0);
  }, { capture:true });

  try {
    const style = document.createElement("style");
    style.textContent = `
      #fullscreen-button, #rr-fullscreen-button, .fullscreen-button, [data-action="fullscreen"] { display:none !important; }
      #cloud-leaderboard, #leaderboard-overlay, #rr-palette-tools, #rr-custom-top-hat,
      #rr170-account-icon, #rr170-device-icon, #cloud-account-panel { display:none !important; }
      #game, canvas { cursor:default; }
      button:not(:disabled), select:not(:disabled), [role="button"]:not([aria-disabled="true"]), a[href] { cursor:pointer !important; }
      .rr-replay-play-button { width:min(520px,90%); min-height:82px; margin:42px auto; display:block; border:6px solid #26363d; background:#f7fdff; color:#26363d; font:700 22px/1.2 monospace; cursor:pointer; }
      [class*="account"] button, [class*="profile"] button, [role="dialog"] button { color:#ffffff; text-shadow:0 1px #26363d; }
      [class*="account"] input, [class*="account"] select, [class*="profile"] input, [class*="profile"] select { color:#26363d !important; background:#ffffff !important; }
      .rr-language-field { display:grid; gap:5px; margin:8px 0; color:#26363d; font:700 13px/1.2 monospace; }
      .rr-language-field select { width:100%; min-height:38px; border:3px solid #26363d; padding:4px 8px; }
    `;
    document.head.appendChild(style);
  } catch (_) {}

  function syncLoadedFrogAppearance() {
    try {
      const stored = String(localStorage.getItem("ribbitRaceFrogSkin") || game.skinId || "azure").toLowerCase();
      const skinId = FROG_SKINS[stored] || /^custom[1-3]$/.test(stored) ? stored : "azure";
      game.skinId = skinId;
      game.setupSkinFocusId = skinId;
      if (frog) frog.skinId = skinId;
      if (Array.isArray(game.pvpSetupSkinIds)) game.pvpSetupSkinIds[0] = skinId;
      if (Array.isArray(pvpPlayers) && pvpPlayers[0] && game.mode !== "pvp") pvpPlayers[0].skinId = skinId;
    } catch (_) {}
  }
  window.addEventListener("rr-authenticated", () => {
    [0, 120, 420, 900].forEach((delay) => setTimeout(syncLoadedFrogAppearance, delay));
  });
  window.addEventListener("storage", (event) => { if (event.key === "ribbitRaceFrogSkin") syncLoadedFrogAppearance(); });
  setTimeout(syncLoadedFrogAppearance, 0);

  window.RibbitRaceOpenLeaderboard = openLeaderboard;
  window.RibbitRacePolish8 = Object.freeze({
    openLeaderboard,
    playReplay: playReplayById,
    getLanguageMode,
    setLanguageMode,
    recordHatCatch
  });
})();
