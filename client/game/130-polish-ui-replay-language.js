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
    leaderboardStatsRow: null,
    leaderboardStatsHitRects: {},
    leaderboardStatsPage: 0,
    leaderboardDropdown: "",
    leaderboardHitRects: {},
    leaderboardHoverKey: "",
    previousState: "achievements",
    mainHoverKey: "",
    onlineHoverKey: "",
    worldRecordHovered: false,
    priorCriticalCatch: false,
    previousRoundState: "",
    lastArchivedRoundKey: "",
    baseSkinIndex: 0,
    customBaseOpen: false,
    customToolHover: "",
    quickplayLeaving: false,
    profileSelection: 0,
    languageSelection: 0,
    deviceSelection: 0,
    priorMenuState: "main",
    replayStatus: "",
    replayDetail: "",
    flashcardIndex: 0,
    flashcardFace: "english",
    flashcardSelection: 1,
    flashcardHoverKey: "",
    flashcardOrder: [],
    flashcardShuffled: false,
    flashcardOnlyStarred: false,
    flashcardComplete: false,
    flashcardFlipAt: 0,
    flashcardFlipFrom: "english",
    flashcardFlipTo: "english",
    flashcardStars: [],
    flashcardSlideAt: 0,
    flashcardSlideFromIndex: 0,
    flashcardSlideFromFace: "english",
    flashcardSlideDirection: 0,
    pauseFullscreenHovered: false,
    flashcardHelpOpen: false,
    flashcardCompletionSelection: "all",
    languagePickerOpen: "",
    languagePickerSelection: 0,
    languagePickerHover: -1
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

  function safestNumber(value, fallback = null) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function safeCall(candidate, ...args) {
    try { return typeof candidate === "function" ? candidate(...args) : undefined; }
    catch (error) { console.warn("Ribbit polish helper recovered", error); return undefined; }
  }

  const PROFILE_MENU_ROWS = Object.freeze([
    Object.freeze({ id:"language", label:"LANGUAGE MODE" }),
    Object.freeze({ id:"flashcards", label:"FLASH CARDS" }),
    Object.freeze({ id:"vocabulary", label:"VOCAB LIST" }),
    Object.freeze({ id:"manage", label:"BACK UP / MANAGE SAVE" }),
    Object.freeze({ id:"signout", label:"SIGN OUT" }),
    Object.freeze({ id:"back", label:"BACK" })
  ]);
  const PROFILE_MENU_RECTS = Object.freeze(PROFILE_MENU_ROWS.map((row, index) => Object.freeze({
    ...row, x:91, y:78+index*30, w:298, h:26
  })));
  const LANGUAGE_MENU_ROWS = Object.freeze([
    Object.freeze({ id:"spoken", label:"I SPEAK..." }),
    Object.freeze({ id:"learning", label:"I'M LEARNING..." }),
    Object.freeze({ id:"back", label:"BACK" })
  ]);
  const LANGUAGE_MENU_RECTS = Object.freeze([
    Object.freeze({ ...LANGUAGE_MENU_ROWS[0], x:91, y:92, w:298, h:35 }),
    Object.freeze({ ...LANGUAGE_MENU_ROWS[1], x:91, y:154, w:298, h:35 }),
    Object.freeze({ ...LANGUAGE_MENU_ROWS[2], x:91, y:207, w:298, h:26 })
  ]);
  const LANGUAGE_SWAP_RECT = Object.freeze({x:227,y:129,w:26,h:23});
  // Add new supported languages here when their vocabulary/translations become available.
  const LANGUAGE_OPTIONS = Object.freeze([
    Object.freeze({code:"en", name:"ENGLISH"}),
    Object.freeze({code:"es", name:"ESPAÑOL"})
  ]);
  const LANGUAGE_PICKER_PANEL = Object.freeze({x:98,y:75,w:284,h:148});
  const LANGUAGE_PICKER_CLOSE = Object.freeze({x:351,y:81,w:22,h:21});
  function getLanguagePickerRects(){
    return LANGUAGE_OPTIONS.map((item,i)=>({...item,x:113,y:114+i*42,w:254,h:34}));
  }
  const FLASHCARD_COMPLETION_RECTS = Object.freeze({
    all:Object.freeze({id:"complete-all",x:90,y:105,w:300,h:31}),
    starred:Object.freeze({id:"complete-starred",x:90,y:144,w:300,h:31})
  });
  const FLASHCARD_BUTTON_RECTS = Object.freeze({
    previous:Object.freeze({id:"previous",x:76,y:187,w:54,h:23}),
    flip:Object.freeze({id:"flip",x:138,y:187,w:141,h:23}),
    next:Object.freeze({id:"next",x:287,y:187,w:54,h:23}),
    shuffle:Object.freeze({id:"shuffle",x:350,y:222,w:22,h:20}),
    starred:Object.freeze({id:"starred",x:76,y:215,w:145,h:19}),
    back:Object.freeze({id:"back",x:230,y:215,w:112,h:19}),
    help:Object.freeze({id:"help",x:380,y:222,w:22,h:20}),
    star:Object.freeze({id:"star",x:378,y:88,w:24,h:24})
  });
  const FLASHCARD_BUTTON_ORDER = Object.freeze(Object.values(FLASHCARD_BUTTON_RECTS));
  const FLASHCARD_STARS_KEY = "ribbitRaceFlashcardStarsV1";
  function flashcardKey(entry) {return `${String(entry?.english || "").trim()}|${String(entry?.spanish || "").trim()}`;}
  function readFlashcardStars() {
    try {const data=JSON.parse(localStorage.getItem(FLASHCARD_STARS_KEY)||"[]");return Array.isArray(data)?data:[];}
    catch(_){return [];}
  }
  function availableStarredFlashcardCount() {
    const marked=new Set(polish.flashcardStars);
    return getFlashcardVocabulary().filter(entry=>marked.has(flashcardKey(entry))).length;
  }
  function flashcardEntries() {
    const words = getFlashcardVocabulary();
    if(polish.flashcardOrder.length!==words.length && !polish.flashcardOnlyStarred){
      polish.flashcardOrder=words.map((_,i)=>i);
      polish.flashcardIndex=Math.min(polish.flashcardIndex,Math.max(0,words.length-1));
    }
    const order=polish.flashcardOrder.filter(index=>Number.isInteger(index)&&words[index]);
    return order.map(index=>({entry:words[index],index}));
  }
  function resetFlashcardFace() {
    polish.flashcardFace="english";polish.flashcardFlipAt=0;
    polish.flashcardFlipFrom="english";polish.flashcardFlipTo="english";
  }
  function moveToFlashcard(nextIndex, direction, count) {
    if (!count || polish.flashcardComplete) return;
    const current = Math.max(0, Math.min(count-1, polish.flashcardIndex));
    const destination = Math.max(0, Math.min(count-1, nextIndex));
    if (current === destination) return;
    // The old face slides out, while the next card always starts English-side up.
    polish.flashcardSlideFromIndex = current;
    polish.flashcardSlideFromFace = polish.flashcardFlipAt ? polish.flashcardFlipTo : polish.flashcardFace;
    polish.flashcardSlideDirection = direction < 0 ? -1 : 1;
    polish.flashcardSlideAt = performance.now();
    polish.flashcardIndex = destination;
    resetFlashcardFace();
  }
  function rebuildFlashcardDeck(starredOnly=false, shuffle=false) {
    const words=getFlashcardVocabulary();
    polish.flashcardOnlyStarred=starredOnly;
    const stars=new Set(polish.flashcardStars);
    const order=words.map((_,i)=>i).filter(i=>!starredOnly||stars.has(flashcardKey(words[i])));
    if(shuffle)for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    polish.flashcardOrder=order;polish.flashcardIndex=0;polish.flashcardComplete=false;
    polish.flashcardSlideAt=0; polish.flashcardSlideDirection=0;
    polish.flashcardCompletionSelection=starredOnly||!availableStarredFlashcardCount()?"all":"starred";
    resetFlashcardFace();
  }
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

  function getFlashcardVocabulary() {
    try {
      const cloud = typeof RibbitCloud !== "undefined" ? RibbitCloud : window.RibbitCloud;
      const entries = cloud?.getVocabulary?.() || [];
      return Array.isArray(entries) ? entries.filter((entry) => entry && entry.english && entry.spanish) : [];
    } catch (_) {
      return [];
    }
  }

  function getPauseFullscreenRect() {
    // This is the blue-square slot at the bottom-right of the How To Play card.
    // Both normal pause and Help share one hit target, beside the book icon.
    return PAUSE_FULLSCREEN_BUTTON;
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

    // Same 34px title bar/29px inner fill as the original RIBBIT RACE main menu.
    const header = { x:panel.x+14, y:panel.y+10, w:panel.w-28, h:34 };
    ctx.fillStyle = skin.dark;
    ctx.fillRect(header.x,header.y,header.w,header.h);
    ctx.fillStyle = skin.mid;
    ctx.fillRect(header.x+2,header.y+2,header.w-4,29);
    ctx.fillStyle = skin.light;
    ctx.fillRect(header.x+5,header.y+4,header.w-10,4);
    const titleScale = Math.min(1.55, (header.w-28)/Math.max(1,measureBitmapText(title,1)));
    drawBitmapText(title,W/2,header.y+Math.round((header.h-7*titleScale)/2),titleScale,"center",COLORS.white,skin.dark);
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

  function drawProfileOptionIcon(kind,cx,cy,color="#48555a") {
    const r=(x,y,w,h,c=color)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(cx+x),Math.round(cy+y),w,h);};
    if(kind==="language") {r(-6,-6,12,12);r(-4,-4,8,8,"#f7fdff");r(-1,-6,2,12);r(-6,-1,12,2);}
    else if(kind==="flashcards") {r(-7,-5,10,12);r(-5,-3,6,7,"#f7fdff");r(0,-7,7,11);r(2,-5,3,5,"#f7fdff");}
    else if(kind==="vocabulary") {r(-7,-7,14,14);r(-5,-5,10,3,"#f7fdff");r(-5,0,10,2,"#f7fdff");r(-5,4,7,2,"#f7fdff");}
    else if(kind==="manage") {r(-7,-6,14,12);r(-4,-5,8,4,"#f7fdff");r(-4,1,8,4,"#f7fdff");r(-1,2,3,3);}
    else if(kind==="signout") {r(-7,-6,8,12);r(-5,-4,4,8,"#f7fdff");r(0,-1,7,2);r(4,-4,3,3);r(4,1,3,3);}
    else {r(-1,-2,8,4);r(-3,-4,3,8);r(-6,-1,3,2);}
  }
  function languageName(code) { return LANGUAGE_OPTIONS.find(item=>item.code===code)?.name || "ENGLISH"; }
  function getSpokenLanguage() {
    try { return window.RibbitLanguagePreferences?.getSpoken?.() || localStorage.getItem("ribbitRaceSpokenLanguageV1") || (getLanguageMode()==="es-en"?"es":"en"); }
    catch (_) { return getLanguageMode()==="es-en" ? "es" : "en"; }
  }
  function getLearningLanguage() {
    try { return window.RibbitLanguagePreferences?.getLearning?.() || localStorage.getItem("ribbitRaceLearningLanguageV1") || (getLanguageMode()==="es-en"?"en":"es"); }
    catch (_) { return getLanguageMode()==="es-en" ? "en" : "es"; }
  }
  function drawPixelFlag(code, x, y, scale = 1) {
    const s = Math.max(1, Math.round(scale));
    const fill = (px, py, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x + px * s), Math.round(y + py * s), Math.round(w * s), Math.round(h * s)); };
    fill(0,0,24,14,"#000000");
    fill(1,1,22,12,"#ffffff");
    if (code === "es") {
      fill(1,1,22,3,"#c91111"); fill(1,4,22,6,"#f5c400"); fill(1,10,22,3,"#c91111");
      fill(7,4,6,6,"#ad7526"); fill(8,5,4,4,"#c99742");
      fill(6,5,1,4,"#9daab0"); fill(13,5,1,4,"#9daab0");
      fill(7,4,1,1,"#cf445a"); fill(12,4,1,1,"#cf445a"); fill(9,6,1,3,"#5346a8");
    } else {
      fill(1,1,22,12,"#ffffff");
      [1,3,5,7,9,11].forEach(row => fill(1,row,22,1,"#c73a4a"));
      fill(1,1,9,6,"#305ca8");
      for (let py = 0; py < 3; py++) for (let px = 0; px < 4; px++) fill(2 + px*2, 2 + py*2, 1, 1, "#ffffff");
    }
  }
  function drawLanguageValue(rect, code, selected) {
    const label=languageName(code);
    // Align the words and flag within the content below the accent stripe,
    // rather than centering against the row border.
    const centerY=rect.y+(rect.h+7)/2;
    drawBitmapText(label,rect.x+rect.w-45,Math.round(centerY-7*.43/2),.43,"right",selected?getSelectedSkin().dark:"#59666b");
    drawPixelFlag(code,rect.x+rect.w-34,Math.round(centerY-7),1);
  }
  function drawProfileMenu() {
    drawUtilityWindowFrame("ACCOUNT & LANGUAGE", "");
    drawBitmapText("PLAYER SETTINGS",W/2,53,.42,"center","#6a7478");
    const playerLabel = `PLAYER: ${accountDisplayName().toUpperCase()}`;
    const playerScale = Math.min(.50, 215/Math.max(1, measureBitmapText(playerLabel,1)));
    drawBitmapText(playerLabel,W/2,63,playerScale,"center","#48555a");
    const skin=getSelectedSkin();
    PROFILE_MENU_RECTS.forEach((rect,index)=>{
      const selected=index===polish.profileSelection;
      ctx.fillStyle="rgba(25,43,52,.20)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
      ctx.fillStyle=selected?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
      ctx.fillStyle=selected?mixHexColors(skin.belly,"#ffffff",.12):"#f7fdff";
      ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
      const stripes={language:skin.light,flashcards:"#f3d171",vocabulary:"#8bc6ee",manage:"#7ee0cf",signout:"#ed9eaa",back:"#f3c5ce"};
      ctx.fillStyle=stripes[rect.id];ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,2);
      drawProfileOptionIcon(rect.id,rect.x+21,rect.y+rect.h/2,selected?skin.dark:"#48555a");
      const labelScale=Math.min(.69,195/Math.max(1,measureBitmapText(rect.label,1)));
      const baseline=Math.round(rect.y+(rect.h-7*labelScale)/2);
      drawBitmapText(rect.label,rect.x+rect.w/2,baseline,labelScale,"center",selected?skin.dark:"#48555a");
      if(rect.id==="language") drawLanguageValue(rect, getLearningLanguage(), selected);
      else if(rect.id==="flashcards") drawBitmapText(`${getFlashcardVocabulary().length} CARDS`,rect.x+rect.w-9,baseline+1,.38,"right",selected?skin.dark:"#59666b");
      else if(rect.id==="vocabulary") drawBitmapText(`${getFlashcardVocabulary().length} WORDS`,rect.x+rect.w-9,baseline+1,.38,"right",selected?skin.dark:"#59666b");
    });
  }
  function drawLanguageSwapArrow(selected=false) {
    const rect=LANGUAGE_SWAP_RECT,skin=getSelectedSkin();
    ctx.fillStyle="rgba(25,43,52,.25)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
    ctx.fillStyle=selected?skin.dark:COLORS.ink;ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.fillStyle=selected?mixHexColors(skin.belly,"#ffffff",.10):"#f7fdff";
    ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
    // Two opposing arrows show the result before the swap is clicked.
    const color=selected?skin.dark:"#48555a";
    ctx.fillStyle=color;
    ctx.fillRect(rect.x+7,rect.y+7,11,2);ctx.fillRect(rect.x+15,rect.y+5,2,6);
    ctx.fillRect(rect.x+8,rect.y+14,11,2);ctx.fillRect(rect.x+8,rect.y+12,2,6);
  }
  function drawLanguagePicker() {
    const skin=getSelectedSkin(),panel=LANGUAGE_PICKER_PANEL;
    ctx.fillStyle="rgba(8,18,26,.68)";ctx.fillRect(38,15,404,228);
    ctx.fillStyle="rgba(8,18,26,.3)";ctx.fillRect(panel.x+4,panel.y+4,panel.w,panel.h);
    ctx.fillStyle=COLORS.ink;ctx.fillRect(panel.x,panel.y,panel.w,panel.h);
    ctx.fillStyle="#f7fdff";ctx.fillRect(panel.x+3,panel.y+3,panel.w-6,panel.h-6);
    ctx.fillStyle=skin.mid;ctx.fillRect(panel.x+5,panel.y+5,panel.w-10,30);
    ctx.fillStyle=skin.light;ctx.fillRect(panel.x+9,panel.y+8,panel.w-18,3);
    drawBitmapText(polish.languagePickerOpen==="spoken"?"I SPEAK...":"I'M LEARNING...",
      panel.x+panel.w/2,panel.y+14,.82,"center",COLORS.white,skin.dark);
    const close=LANGUAGE_PICKER_CLOSE;
    ctx.fillStyle=COLORS.ink;ctx.fillRect(close.x,close.y,close.w,close.h);
    ctx.fillStyle="#f7fdff";ctx.fillRect(close.x+2,close.y+2,close.w-4,close.h-4);
    ctx.fillStyle=skin.dark;
    for(let i=0;i<7;i++){ctx.fillRect(close.x+6+i,close.y+5+i,2,2);ctx.fillRect(close.x+12-i,close.y+5+i,2,2);}
    const current=polish.languagePickerOpen==="spoken"?getSpokenLanguage():getLearningLanguage();
    for(const [index,rect] of getLanguagePickerRects().entries()){
      const selected=index===polish.languagePickerSelection;
      ctx.fillStyle=selected?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
      ctx.fillStyle=selected?mixHexColors(skin.belly,"#ffffff",.12):"#f7fdff";
      ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
      ctx.fillStyle=selected?skin.light:"#b7c8cd";ctx.fillRect(rect.x+6,rect.y+5,rect.w-12,3);
      const textY=Math.round(rect.y+(rect.h+8)/2-7*.78/2);
      drawBitmapText(rect.name,rect.x+95,textY,.78,"center",selected?skin.dark:"#48555a");
      drawPixelFlag(rect.code,rect.x+15,rect.y+11,1);
      if(rect.code===current){
        // Pixel checkmark is drawn in primitives; the bitmap font has no glyph for ✓.
        ctx.fillStyle=skin.dark;
        ctx.fillRect(rect.x+rect.w-27,rect.y+18,4,3);
        ctx.fillRect(rect.x+rect.w-23,rect.y+21,4,3);
        ctx.fillRect(rect.x+rect.w-19,rect.y+18,4,3);
        ctx.fillRect(rect.x+rect.w-15,rect.y+15,4,3);
      }
    }
    drawBitmapText("MORE LANGUAGES COMING SOON",W/2,panel.y+132,.46,"center","#59666b");
  }
  function drawLanguageMenu() {
    drawUtilityWindowFrame("LANGUAGE MODE", "SET YOUR LANGUAGES");
    const skin=getSelectedSkin(),spoken=getSpokenLanguage(),learning=getLearningLanguage();
    LANGUAGE_MENU_RECTS.forEach((rect,index)=>{
      const selected=index===polish.languageSelection;
      ctx.fillStyle="rgba(25,43,52,.20)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
      ctx.fillStyle=selected?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
      ctx.fillStyle=selected?mixHexColors(skin.belly,"#ffffff",.12):"#f7fdff";
      ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
      const stripe=rect.id==="spoken"?"#f3d171":rect.id==="learning"?"#7ee0cf":"#b4c7ce";
      ctx.fillStyle=stripe;ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,2);
      const labelScale=Math.min(.69,190/Math.max(1,measureBitmapText(rect.label,1)));
      const innerCenter=rect.y+(rect.h+7)/2;
      drawBitmapText(rect.label,rect.x+rect.w/2,Math.round(innerCenter-7*labelScale/2),labelScale,"center",selected?skin.dark:"#48555a");
      if(rect.id==="spoken")drawLanguageValue(rect,spoken,selected);
      else if(rect.id==="learning")drawLanguageValue(rect,learning,selected);
    });
    drawLanguageSwapArrow(polish.languageSelection===-1);
    if(polish.languagePickerOpen)drawLanguagePicker();
  }

  function drawCardButton(rect,title,hint="",selected=false){
    const skin=getSelectedSkin();
    ctx.fillStyle="rgba(25,43,52,.19)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
    ctx.fillStyle=selected?COLORS.ink:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.fillStyle=selected?mixHexColors(skin.belly,"#ffffff",.16):"#f7fdff";
    ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
    if(selected){ctx.fillStyle=skin.light;ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,2);}
    const mid=rect.x+rect.w/2,cy=rect.y+rect.h/2;
    const ink=selected?skin.dark:"#48555a";
    if(title==="ICON_PREV"||title==="ICON_NEXT"){
      drawPagerArrowIcon(rect,title==="ICON_NEXT"?1:-1,ink);
      return;
    }
    if(title==="BACK"){
      drawProfileOptionIcon("back",rect.x+15,cy,ink);
      drawBitmapText("BACK",mid+5,rect.y+(rect.h-7*.56)/2,.56,"center",ink);
      return;
    }
    if(title==="ICON_SHUFFLE"){
      // Pixel shuffle arrows in a framed, highlighted main-menu-style icon button.
      const cx=Math.round(mid), y=Math.round(cy);
      ctx.fillStyle=ink;
      ctx.fillRect(cx-8,y-5,5,2); ctx.fillRect(cx-3,y-3,3,2); ctx.fillRect(cx,y-1,3,2); ctx.fillRect(cx+3,y+1,5,2);
      ctx.fillRect(cx+5,y-1,2,6); ctx.fillRect(cx-8,y+5,5,2); ctx.fillRect(cx-3,y+3,3,2);
      ctx.fillRect(cx,y+1,3,2); ctx.fillRect(cx+3,y-1,5,2); ctx.fillRect(cx+5,y-3,2,6);
      return;
    }
    const titleScale=Math.min(rect.h>20?.75:.55,(rect.w-10)/Math.max(1,measureBitmapText(title,1)));
    drawBitmapText(title,mid,rect.y+(rect.h-7*titleScale)/2,titleScale,"center",ink);
  }
  const flashcardStarSprite = new Image();
  flashcardStarSprite.src = "/icons/flashcard-star.png";
  let flashcardStarOutlineCanvas = null;
  function getFlashcardStarGraphic(isStarred=false){
    if(isStarred || !flashcardStarSprite.complete || !flashcardStarSprite.naturalWidth) return flashcardStarSprite;
    if(!flashcardStarOutlineCanvas){
      const canvas=document.createElement("canvas");
      canvas.width=flashcardStarSprite.naturalWidth||22;
      canvas.height=flashcardStarSprite.naturalHeight||22;
      const ictx=canvas.getContext("2d",{willReadFrequently:true});
      ictx.imageSmoothingEnabled=false;
      ictx.drawImage(flashcardStarSprite,0,0);
      const image=ictx.getImageData(0,0,canvas.width,canvas.height);
      const data=image.data;
      for(let i=0;i<data.length;i+=4){
        const alpha=data[i+3];
        if(!alpha) continue;
        const red=data[i], green=data[i+1], blue=data[i+2];
        const isOutline=red<24&&green<24&&blue<24;
        if(!isOutline){ data[i]=255; data[i+1]=255; data[i+2]=255; }
      }
      ictx.putImageData(image,0,0);
      flashcardStarOutlineCanvas=canvas;
    }
    return flashcardStarOutlineCanvas;
  }
  function drawFlashcardStar(cx,cy,isStarred=false){
    const width=22,height=22;
    const x=Math.round(cx-width/2),y=Math.round(cy-height/2);
    ctx.save();
    ctx.globalAlpha=1;
    if(flashcardStarSprite.complete&&flashcardStarSprite.naturalWidth){
      ctx.imageSmoothingEnabled=false;
      // Use the user's exact pixel star; only the inner fill changes from white to gold when starred.
      if(isStarred) ctx.drawImage(flashcardStarSprite,x,y,width,height);
      else ctx.drawImage(getFlashcardStarGraphic(false),x,y,width,height);
    }else{
      ctx.fillStyle=isStarred?"#f5cf21":"#ffffff";
      ctx.fillRect(x+9,y+2,4,15); ctx.fillRect(x+3,y+9,16,4);
      ctx.fillRect(x+5,y+6,12,10);
      ctx.fillStyle="#1e2124";
      ctx.fillRect(x+10,y,2,2); ctx.fillRect(x+1,y+9,3,2);
      ctx.fillRect(x+18,y+9,3,2); ctx.fillRect(x+4,y+18,3,2); ctx.fillRect(x+16,y+18,3,2);
    }
    ctx.restore();
  }
  function drawFlashcardHelpPanel(){
    const panel={x:92,y:94,w:296,h:124};
    const skin=getSelectedSkin();
    ctx.fillStyle="rgba(9,22,28,.58)";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(25,43,52,.28)";ctx.fillRect(panel.x+4,panel.y+4,panel.w,panel.h);
    ctx.fillStyle=COLORS.ink;ctx.fillRect(panel.x,panel.y,panel.w,panel.h);
    ctx.fillStyle="#f7fdff";ctx.fillRect(panel.x+3,panel.y+3,panel.w-6,panel.h-6);
    ctx.fillStyle=skin.mid;ctx.fillRect(panel.x+4,panel.y+4,panel.w-8,22);
    ctx.fillStyle=skin.light;ctx.fillRect(panel.x+6,panel.y+6,panel.w-12,2);
    drawBitmapText("FLASH CARD HOTKEYS",panel.x+panel.w/2,panel.y+9,.84,"center",COLORS.white,skin.dark);
    const close={x:panel.x+panel.w-24,y:panel.y+4,w:20,h:20};
    ctx.fillStyle=COLORS.ink;ctx.fillRect(close.x,close.y,close.w,close.h);
    ctx.fillStyle="#f7fdff";ctx.fillRect(close.x+2,close.y+2,close.w-4,close.h-4);
    ctx.fillStyle="#48555a";
    for(let i=0;i<7;i++){ctx.fillRect(close.x+5+i,close.y+5+i,2,2);ctx.fillRect(close.x+11-i,close.y+5+i,2,2);}
    const rows=[
      ["LEFT / A","PREVIOUS CARD"],["SPACE / ENTER","FLIP / NEXT STEPS"],["RIGHT / D","NEXT CARD"],
      ["S / ?","STAR OR UNSTAR CARD"],["H","SHUFFLE DECK"],["V","SHOW STARRED / ALL CARDS"],["BACKSPACE / ESC","BACK"]
    ];
    rows.forEach((row,index)=>{const y=panel.y+35+index*12;drawBitmapText(row[0],panel.x+18,y,.50,"left",skin.dark);drawBitmapText(row[1],panel.x+148,y,.50,"left","#59666b");});
  }
  function drawFlashcardsMenu() {
    drawUtilityWindowFrame("FLASH CARDS", "STUDY YOUR VOCAB SETS");
    const skin=getSelectedSkin(), deck=flashcardEntries(), count=deck.length;
    if(count)polish.flashcardIndex=Math.min(Math.max(0,polish.flashcardIndex),count-1);
    const prefix=polish.flashcardOnlyStarred?"STARRED TERMS":"FRIENDS VOCAB";
    drawBitmapText(`${prefix}  •  ${count} CARDS`,W/2,68,.48,"center","#48555a");
    const card={x:73,y:79,w:334,h:104};
    ctx.fillStyle="rgba(25,43,52,.15)";ctx.fillRect(card.x+3,card.y+3,card.w,card.h);
    ctx.fillStyle=COLORS.ink;ctx.fillRect(card.x,card.y,card.w,card.h);

    const drawCardFace=(index,face,offsetX=0,flipScale=1)=>{
      const pair=deck[index],entry=pair?.entry;
      const currentKey=flashcardKey(entry);
      const starred=Boolean(entry&&polish.flashcardStars.includes(currentKey));
      const secondary=face!=="english";
      ctx.save();
      // Sliding/clipping is confined to the card; no text or star leaks out.
      ctx.beginPath();ctx.rect(card.x+3,card.y+3,card.w-6,card.h-6);ctx.clip();
      ctx.translate(offsetX,0);
      ctx.translate(card.x+card.w/2,0);ctx.scale(flipScale,1);ctx.translate(-(card.x+card.w/2),0);
      ctx.fillStyle=secondary?mixHexColors(skin.mid,"#ffffff",.26):mixHexColors(skin.belly,"#ffffff",.18);
      ctx.fillRect(card.x+3,card.y+3,card.w-6,card.h-6);
      if(entry){
        const label=secondary?"ESPAÑOL":"ENGLISH";
        const value=String(secondary?entry.spanish||"":entry.english||"").trim().toUpperCase();
        const fit=Math.min(1.20,(card.w-36)/Math.max(1,measureBitmapText(value,1)));
        drawBitmapText(`${index+1} / ${count}`,card.x+14,card.y+85,.53,"left",skin.dark);
        drawBitmapText(label,W/2,card.y+85,.70,"center",skin.dark);
        ctx.save();ctx.beginPath();ctx.rect(card.x+12,card.y+30,card.w-24,45);ctx.clip();
        drawBitmapText(value,W/2,card.y+46,fit,"center",COLORS.ink);ctx.restore();
        // Draw inside BOTH the slide and the flip transform, so the star follows the card.
        const starButton=FLASHCARD_BUTTON_RECTS.star;
        drawFlashcardStar(starButton.x+starButton.w/2,starButton.y+starButton.h/2,starred);
      }else{
        drawBitmapText("NO STARRED TERMS YET",W/2,card.y+42,.80,"center",skin.dark);
        drawBitmapText("PRESS BACK TO SEE ALL CARDS",W/2,card.y+69,.48,"center","#59666b");
      }
      ctx.restore();
    };

    const slideDuration=255;
    const slideT=polish.flashcardSlideAt?Math.min(1,(performance.now()-polish.flashcardSlideAt)/slideDuration):1;
    if(polish.flashcardSlideAt&&slideT>=1)polish.flashcardSlideAt=0;
    if(polish.flashcardComplete){
      ctx.fillStyle=mixHexColors(skin.belly,"#ffffff",.18);
      ctx.fillRect(card.x+3,card.y+3,card.w-6,card.h-6);
      const hasStarred=availableStarredFlashcardCount()>0&&!polish.flashcardOnlyStarred;
      drawBitmapText("NEXT STEPS",W/2,card.y+10,.81,"center",skin.dark);
      const options=hasStarred?["all","starred"]:["all"];
      const rects=hasStarred?FLASHCARD_COMPLETION_RECTS:{all:{...FLASHCARD_COMPLETION_RECTS.all,y:card.y+45}};
      for(const id of options){
        const rect=rects[id],chosen=polish.flashcardCompletionSelection===id;
        ctx.fillStyle=chosen?skin.dark:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
        ctx.fillStyle=chosen?mixHexColors(skin.belly,"#ffffff",.12):"#f7fdff";
        ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
        ctx.fillStyle=id==="starred"?"#7ee0cf":"#f3d171";
        ctx.fillRect(rect.x+5,rect.y+4,rect.w-10,2);
        drawBitmapText(id==="starred"?"STUDY STARRED TERMS":"RESTART ALL TERMS",rect.x+12,rect.y+9,.66,"left",chosen?skin.dark:"#48555a");
        drawBitmapText(id==="starred"?`${availableStarredFlashcardCount()} SAVED TERMS`:`ALL ${getFlashcardVocabulary().length} TERMS`,rect.x+12,rect.y+21,.40,"left","#59666b");
        if(chosen)drawBitmapText(">",rect.x+rect.w-15,rect.y+12,.65,"center",skin.dark);
      }
    }else if(polish.flashcardSlideAt){
      const ease=1-Math.pow(1-slideT,3);
      const direction=polish.flashcardSlideDirection;
      drawCardFace(polish.flashcardSlideFromIndex,polish.flashcardSlideFromFace,-direction*card.w*ease);
      drawCardFace(polish.flashcardIndex,"english",direction*card.w*(1-ease));
    }else{
      const flipT=polish.flashcardFlipAt?Math.min(1,(performance.now()-polish.flashcardFlipAt)/280):1;
      if(polish.flashcardFlipAt&&flipT>=1){polish.flashcardFace=polish.flashcardFlipTo;polish.flashcardFlipAt=0;}
      const face=polish.flashcardFlipAt&&flipT>=.5?polish.flashcardFlipTo:polish.flashcardFace;
      const scaleX=polish.flashcardFlipAt?Math.max(.05,Math.abs(Math.cos(Math.PI*flipT))):1;
      drawCardFace(polish.flashcardIndex,face,0,scaleX);
    }

    // Framed question-mark button matches the achievements/stats main-menu icon family.
    const h=FLASHCARD_BUTTON_RECTS.help,hcx=h.x+h.w/2,hcy=h.y+h.h/2;
    const selectedHelp=polish.flashcardHoverKey==="help",color=selectedHelp?skin.dark:"#48555a";
    ctx.fillStyle="rgba(25,43,52,.19)";ctx.fillRect(h.x+2,h.y+2,h.w,h.h);
    ctx.fillStyle=selectedHelp?COLORS.ink:"#9aa9ae";ctx.fillRect(h.x,h.y,h.w,h.h);
    ctx.fillStyle=selectedHelp?mixHexColors(skin.belly,"#ffffff",.16):"#f7fdff";
    ctx.fillRect(h.x+2,h.y+2,h.w-4,h.h-4);
    ctx.fillStyle=selectedHelp?skin.light:"#ffffff";ctx.fillRect(h.x+4,h.y+3,h.w-8,1);
    ctx.fillStyle=color;
    ctx.fillRect(hcx-3,hcy-6,6,2);ctx.fillRect(hcx+3,hcy-4,2,4);
    ctx.fillRect(hcx-3,hcy-2,2,2);ctx.fillRect(hcx-1,hcy,2,2);
    ctx.fillRect(hcx-1,hcy+4,2,2);ctx.fillRect(hcx-1,hcy+7,2,2);
    const selected=id=>polish.flashcardHoverKey===id;
    const buttons=[
      ["previous",polish.flashcardComplete?"ALL TERMS":"ICON_PREV",""],
      ["flip",polish.flashcardComplete?"CONTINUE":"FLIP CARD",""],
      ["next",polish.flashcardComplete?"CONTINUE":"ICON_NEXT",""],
      ["shuffle","ICON_SHUFFLE",""],
      ["starred",polish.flashcardOnlyStarred?"ALL CARDS":"STARRED TERMS",""],
      ["back","BACK",""]
    ];
    buttons.forEach(([id,title,hint])=>drawCardButton(FLASHCARD_BUTTON_RECTS[id],title,hint,selected(id)));
    if(polish.flashcardHelpOpen)drawFlashcardHelpPanel();
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

  function openProfileMenu() {
    polish.priorMenuState=game.state;
    polish.profileSelection=0;
    game.state="rrProfileMenu";
    try {
      const legacy = document.getElementById("cloud-account-panel");
      if (legacy) legacy.hidden = true;
      document.body.classList.remove("rr-account-modal-open");
    } catch (_) {}
    clearHeldInput();
    tone(520,.04,.009,25);
    safeCall(drawScene);
  }
  function openLanguageMenu() {
    polish.languageSelection=0;polish.languagePickerOpen="";
    game.state="rrLanguageMenu";clearHeldInput();tone(520,.04,.009,25);
  }
  function openFlashcardsMenu() {
    polish.flashcardStars=readFlashcardStars();
    polish.flashcardShuffled=false;
    rebuildFlashcardDeck(false,false);
    polish.flashcardSelection=1;polish.flashcardHoverKey="";polish.flashcardHelpOpen=false;
    game.state="rrFlashcards";clearHeldInput();tone(480,.04,.009,10);
    window.RibbitStudyUI?.openCards?.({ vocabularyProvider:getFlashcardVocabulary, account:accountDisplayName(),
      onExit:()=>{ game.state="rrProfileMenu";polish.profileSelection=1; clearHeldInput(); }});
  }
  function openVocabularyList() {
    game.state="rrVocabList";clearHeldInput();tone(510,.04,.009,20);
    window.RibbitStudyUI?.openList?.({ vocabularyProvider:getFlashcardVocabulary, account:accountDisplayName(),
      onExit:()=>{ game.state="rrProfileMenu";polish.profileSelection=2;clearHeldInput(); }});
  }
  function openDeviceMenu() { polish.priorMenuState=game.state; polish.deviceSelection=isRibbitMobileMode()?1:0; game.state="rrDeviceMenu"; clearHeldInput(); tone(480,.04,.009,20); }
  function closeUtilityMenu() { game.state="main"; game.mainFocusVisible=true; tone(330,.04,.009,-30); }
  window.RibbitRaceOpenProfileMenu=openProfileMenu;
  window.RibbitRaceOpenDeviceMenu=openDeviceMenu;

  function activateProfileRow(index=polish.profileSelection) {
    const row=PROFILE_MENU_ROWS[index] || PROFILE_MENU_ROWS[0];
    if(row.id==="language") openLanguageMenu();
    else if(row.id==="flashcards") openFlashcardsMenu();
    else if(row.id==="vocabulary") openVocabularyList();
    else if(row.id==="back") closeUtilityMenu();
    else {
      const id={manage:"friends-manage",signout:"cloud-sign-out"}[row.id];
      const button=id?document.getElementById(id):null;
      if(button){button.click(); if(row.id!=="manage") game.state="main";}
      else {game.cheatToastText="ACCOUNT ACTION UNAVAILABLE";game.cheatToastTimer=CONFIG.achievementToastDuration;}
    }
  }
  function setLanguagePreferences(spoken, learning) {
    try {
      const result = window.RibbitLanguagePreferences?.setLanguages?.(spoken, learning);
      if (result) return result;
    } catch (_) {}
    const normalizedSpoken = spoken === "es" ? "es" : "en";
    let normalizedLearning = learning === "en" ? "en" : "es";
    if (normalizedSpoken === normalizedLearning) normalizedLearning = normalizedSpoken === "en" ? "es" : "en";
    try {
      localStorage.setItem("ribbitRaceSpokenLanguageV1", normalizedSpoken);
      localStorage.setItem("ribbitRaceLearningLanguageV1", normalizedLearning);
    } catch (_) {}
    return { spoken: normalizedSpoken, learning: normalizedLearning, mode: setLanguageMode(normalizedSpoken === "es" && normalizedLearning === "en" ? "es-en" : "en-es") };
  }
  function swapLanguagePreferences() {
    const result = window.RibbitLanguagePreferences?.swapLanguages?.();
    if (result) return result;
    return setLanguagePreferences(getLearningLanguage(), getSpokenLanguage());
  }
  function openLanguagePicker(which){
    polish.languagePickerOpen=which;
    const code=which==="spoken"?getSpokenLanguage():getLearningLanguage();
    polish.languagePickerSelection=Math.max(0,LANGUAGE_OPTIONS.findIndex(item=>item.code===code));
    tone(520,.04,.009,20);
  }
  function selectLanguagePickerOption(index=polish.languagePickerSelection){
    const choice=LANGUAGE_OPTIONS[index];if(!choice)return;
    const spoken=getSpokenLanguage(), learning=getLearningLanguage();
    if(polish.languagePickerOpen==="spoken") {
      setLanguagePreferences(choice.code,choice.code===learning?spoken:learning);
    }else if(polish.languagePickerOpen==="learning"){
      setLanguagePreferences(choice.code===spoken?learning:spoken,choice.code);
    }
    polish.languagePickerOpen="";
    tone(620,.04,.01,20);
  }
  function activateLanguageRow(index=polish.languageSelection){
    if(polish.languagePickerOpen){selectLanguagePickerOption();return;}
    if(index===-1){swapLanguagePreferences();tone(640,.04,.009,25);return;}
    const row=LANGUAGE_MENU_ROWS[index]||LANGUAGE_MENU_ROWS[0];
    if(row.id==="spoken"||row.id==="learning")openLanguagePicker(row.id);
    else if(row.id==="back"){game.state="rrProfileMenu";tone(330,.04,.009,-30);}
  }
  function completeFlashcardSession(destination=polish.flashcardCompletionSelection){
    if(destination==="starred"&&!polish.flashcardOnlyStarred&&availableStarredFlashcardCount()){
      rebuildFlashcardDeck(true,false);
    }else{
      // After the starred subset finishes, Space/Next always returns to all terms.
      polish.flashcardShuffled=false;
      rebuildFlashcardDeck(false,false);
    }
  }

  function activateFlashcardButton(index = polish.flashcardSelection) {
    const deck=flashcardEntries(),count=deck.length;
    const action=FLASHCARD_BUTTON_ORDER[index]||FLASHCARD_BUTTON_RECTS.flip;
    const id=action.id;
    if(id==="back"){
      polish.flashcardHelpOpen=false;game.state="rrProfileMenu";tone(330,.04,.009,-30);return;
    }
    if(id==="help"){polish.flashcardHelpOpen=!polish.flashcardHelpOpen;tone(polish.flashcardHelpOpen?520:330,.03,.008,polish.flashcardHelpOpen?18:-12);return;}
    if(id==="shuffle"){
      polish.flashcardShuffled=true;rebuildFlashcardDeck(polish.flashcardOnlyStarred,true);
    }else if(id==="starred"){
      rebuildFlashcardDeck(!polish.flashcardOnlyStarred,false);
    }else if(id==="star"){
      if(polish.flashcardComplete||!count)return;
      const entry=deck[polish.flashcardIndex]?.entry,key=flashcardKey(entry);
      if(!entry)return;
      const marked=new Set(polish.flashcardStars);
      if(marked.has(key))marked.delete(key);else marked.add(key);
      polish.flashcardStars=[...marked];
      try{localStorage.setItem(FLASHCARD_STARS_KEY,JSON.stringify(polish.flashcardStars));}catch(_){}
      // Keep the original starred-session snapshot until it is complete.
      // An unstar changes the golden icon immediately, not the current deck.
    }else if(polish.flashcardComplete){
      if(id==="previous")completeFlashcardSession("all");
      else if(id==="flip"||id==="next")completeFlashcardSession();
    }else if(id==="flip"){
      if(!count)return;
      const now=performance.now();
      if(polish.flashcardFlipAt){polish.flashcardFace=polish.flashcardFlipTo;}
      polish.flashcardFlipFrom=polish.flashcardFace;
      polish.flashcardFlipTo=polish.flashcardFace==="english"?"spanish":"english";
      polish.flashcardFlipAt=now;
    }else if(id==="previous"){
      if(count)moveToFlashcard(polish.flashcardIndex-1,-1,count);
    }else if(id==="next"){
      if(count){
        if(polish.flashcardIndex>=count-1){
          if(polish.flashcardOnlyStarred){
            // Ending the starred pass immediately returns to the full deck.
            completeFlashcardSession("all");
          }else{
            polish.flashcardComplete=true;polish.flashcardSlideAt=0;
            polish.flashcardCompletionSelection=!availableStarredFlashcardCount()?"all":"starred";
            resetFlashcardFace();
          }
        }else moveToFlashcard(polish.flashcardIndex+1,1,count);
      }
    }
    tone(360,.03,.008,6);
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
    "FLASH CARDS": "TARJETAS",
    "FLIP CARD": "VOLTEAR",
    "PREVIOUS": "ANTERIOR",
    "NEXT": "SIGUIENTE",
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

  // Compact pixel-perfect laurel medal selected for the achievements/leaderboard button.
  // Embedded so the same sprite also renders in the standalone HTML build.
  const leaderboardMedalSprite = new Image();
  leaderboardMedalSprite.src = "/icons/leaderboard-trophy-wreath.png";
  function drawMiniMedalButton(rect, active = false) {
    const skin=getSelectedSkin();
    ctx.fillStyle="rgba(25,43,52,.20)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);
    ctx.fillStyle=active?skin.dark:COLORS.ink;ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.fillStyle=active?mixHexColors(skin.belly,"#ffffff",.16):"#f7fdff";
    ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
    if(leaderboardMedalSprite.complete&&leaderboardMedalSprite.naturalWidth){
      ctx.save();ctx.imageSmoothingEnabled=false;
      // Polish 53: align the *visible* trophy/wreath artwork, rather than the
      // transparent 26x23 asset bounds. The opaque area is x=1..23, y=3..19;
      // cropping that inset gives a centered 23x17 image in the 28x28 button.
      ctx.drawImage(leaderboardMedalSprite,1,3,23,17,
        rect.x+Math.round((rect.w-23)/2),rect.y+Math.round((rect.h-17)/2),23,17);
      ctx.restore();
    }else{
      // Fallback while the graphic loads.
      const cx=rect.x+rect.w/2,cy=rect.y+rect.h/2;
      ctx.fillStyle="#398350";
      for(let j=0;j<4;j++){ctx.fillRect(cx-9-j/2,cy-5+j*3,2,3);ctx.fillRect(cx+7+j/2,cy-5+j*3,2,3);}
      ctx.fillStyle="#b77b1d";ctx.fillRect(cx-4,cy-5,8,8);
      ctx.fillStyle="#f0ba2d";ctx.fillRect(cx-3,cy-4,6,6);
      ctx.fillStyle="#b77b1d";ctx.fillRect(cx-1,cy+3,2,5);ctx.fillRect(cx-5,cy+8,10,2);
    }
    if(active){ctx.fillStyle=skin.light;ctx.fillRect(rect.x+4,rect.y+3,rect.w-8,1);}
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
      const recordLevel = String(record.level || (level === "any" ? "all" : level)).toLowerCase();
      const serverReplay = (metric === "time" || metric === "jumps") &&
        Boolean(entry.replayAvailable?.[recordLevel]?.[metric]);
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
        replayId:record.replayId || (serverReplay ? `server:${recordLevel}:${metric}` : null),
        serverReplayAvailable:serverReplay,
        skinId:entry.skinId || entry.skin || entry.frogSkin || "azure",
        appearance:entry.appearance || entry.frogAppearance || entry.palette || null,
        isCurrent:Boolean(entry.isCurrent),
        sourceEntry:entry
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
    polish.leaderboardStatsRow = null;
    polish.leaderboardStatsHitRects = {};
    loadLeaderboard(true); // authoritative replay availability may have changed since last visit
    safeCall(tone, 540, .05, .012, 35);
  }

  window.addEventListener("ribbit-replay-uploaded", () => {
    polish.leaderboardRawPayload = null;
    if (game.state === "rrLeaderboard") loadLeaderboard(true);
  });

  function closeLeaderboard() {
    game.state = polish.previousState === "rrLeaderboard" ? "achievements" : (polish.previousState || "achievements");
    polish.leaderboardDropdown = "";
    polish.leaderboardStatsRow = null;
    polish.leaderboardStatsHitRects = {};
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

  function drawReplayIcon(cx, cy, active = false, palette = null) {
    const theme = palette || getSelectedSkin();
    const dark = theme.dark || (active ? getSelectedSkin().dark : "#26363d");
    const mid = active ? (theme.dark || getSelectedSkin().dark) : (theme.mid || theme.dark || "#8a98a0");
    const light = active ? mixHexColors(theme.belly || theme.mid || "#f7fdff", "#ffffff", .25) : "#f7fdff";
    const x = Math.round(cx), y = Math.round(cy);
    ctx.fillStyle = dark;
    ctx.fillRect(x-7, y-5, 14, 10);
    ctx.fillStyle = light;
    ctx.fillRect(x-5, y-3, 10, 6);
    ctx.fillStyle = dark;
    ctx.fillRect(x-2, y-2, 1, 4); ctx.fillRect(x-1, y-1, 1, 3); ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = mid;
    ctx.fillRect(x-1, y-2, 1, 4); ctx.fillRect(x, y-1, 1, 2); ctx.fillRect(x+1, y, 1, 1);
  }

  function bestRecordValue(entry, metric) {
    if (!entry || typeof entry !== "object") return null;
    const records = entry.records && typeof entry.records === "object" ? entry.records : null;
    if (!records) return safestNumber(entry[metric], null);
    const higherIsBetter = ["endless", "flies", "pvpwins"].includes(metric);
    let best = null;
    for (const record of Object.values(records)) {
      if (!record || typeof record !== "object") continue;
      const value = safestNumber(record[metric], null);
      if (value === null || value <= 0) continue;
      if (best === null || (higherIsBetter ? value > best : value < best)) best = value;
    }
    return best;
  }

  function leaderboardPlayerMetrics(row) {
    const entry = row?.sourceEntry || {};
    const stats = entry.stats && typeof entry.stats === "object" ? entry.stats : {};
    const format = (value, digits = 0) => {
      const n = Number(value);
      return value === undefined || value === null || !Number.isFinite(n) ? "—" : (digits ? n.toFixed(digits) : String(Math.floor(n)));
    };
    const records = entry.records && typeof entry.records === "object" ? entry.records : {};
    const bestTime = Object.values(records).reduce((result, record) => {
      const n = Number(record?.time);
      return Number.isFinite(n) && n > 0 && (result === null || n < result) ? n : result;
    }, null);
    return [
      { label:"TOTAL JUMPS", value:format(entry.totalJumps ?? stats.totalJumps), icon:"jump" },
      { label:"FLIES CAUGHT", value:format(entry.totalFlies ?? stats.totalFliesEaten), icon:"fly" },
      { label:"DISTANCE JUMPED", value:stats.distanceJumpedPx === undefined ? "—" : formatStatDistance(stats.distanceJumpedPx), icon:"distance" },
      { label:"PERFECT JUMPS", value:format(stats.perfectJumps), icon:"perfect" },
      { label:"BEST FLY COMBO", value:format(stats.maxFliesOneJump), icon:"combo" },
      { label:"LONGEST AIR TIME", value:stats.longestAirTime === undefined ? "—" : `${format(stats.longestAirTime,1)} SEC`, icon:"air" },
      { label:"FASTEST FINISH", value:bestTime === null ? "--:--.-" : formatTime(bestTime), icon:"clock" },
      { label:"LEVEL WINS", value:format(stats.totalWins), icon:"trophy" },
      { label:"WALL BOUNCES", value:format(stats.wallBounces), icon:"bounce" },
      { label:"FLIES SPAT BACK", value:format(stats.wrongFlies), icon:"spit" },
      { label:"PVP BONKS", value:format(stats.pvpBonksDealt), icon:"pvpBonk" },
      { label:"TIMES BONKED", value:format(stats.pvpTimesBonked), icon:"bonk-max" },
      { label:"PVP BOUNCES", value:format(stats.pvpBounces), icon:"bounce" },
      { label:"PVP MATCH WINS", value:format(entry.pvpMatchWins ?? stats.pvpMatchWins), icon:"trophy" }
    ];
  }

  function openLeaderboardStats(row) {
    polish.leaderboardStatsRow = row || null;
    polish.leaderboardStatsPage = 0;
    polish.leaderboardStatsHitRects = {};
    safeCall(tone, 520, .04, .011, 20);
  }

  function closeLeaderboardStats() {
    if (!polish.leaderboardStatsRow) return;
    polish.leaderboardStatsRow = null;
    polish.leaderboardStatsHitRects = {};
    safeCall(tone, 330, .04, .010, -25);
  }
  function resolvePlayerStatsRow(name, appearance=null, sourceEntry=null) {
    const matchName=String(name||"").trim().toLowerCase();
    let row=(polish.leaderboardEntries||[]).find(entry=>String(entry.name||"").trim().toLowerCase()===matchName)||null;
    if(!row){
      const payloadRows=normalizeLeaderboardRows(polish.leaderboardRawPayload||[]);
      row=payloadRows.find(entry=>String(entry.name||"").trim().toLowerCase()===matchName)||null;
    }
    if(row)return {...row,appearance:appearance||row.appearance||null};
    return {name:String(name||"FROG"),appearance:appearance||null,skinId:appearance?.skinId||appearance?.id||"azure",sourceEntry:sourceEntry||{stats:{}}};
  }
  window.RibbitRaceOpenPlayerStats=(row)=>openLeaderboardStats(row);
  window.RibbitRaceClosePlayerStats=()=>closeLeaderboardStats();
  window.RibbitRaceResolvePlayerStatsRow=resolvePlayerStatsRow;

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
    const color = active ? getSelectedSkin().dark : "#48555a";
    const x=Math.round(cx),y=Math.round(cy);
    ctx.fillStyle=color;
    ctx.fillRect(x-4,y-6,8,2);ctx.fillRect(x+4,y-4,2,3);
    ctx.fillRect(x+6,y-2,2,2);ctx.fillRect(x-7,y-3,2,7);
    ctx.fillRect(x-5,y+4,8,2);ctx.fillRect(x+3,y+2,2,2);
    ctx.fillRect(x+4,y-6,2,4);ctx.fillRect(x+2,y-3,5,2);
  }

  function drawLeaderboardDropdown(rect, label, value, open, key) {
    ctx.fillStyle = "rgba(25,43,52,.22)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = open ? getSelectedSkin().dark : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    const headerH = 5;
    ctx.fillStyle = open ? "#b3d6db" : "#dce5e8";
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, headerH);
    drawBitmapText(label, rect.x + 8, rect.y + 3, .30, "left", "#59666b");
    const isLevel = key === "level" && polish.leaderboardLevel !== "any";
    const textScale = Math.min(.54, (rect.w - 33) / Math.max(1, measureBitmapText(value, 1)));
    if (isLevel) drawLevelUnlockIcon(polish.leaderboardLevel, rect.x + 12, rect.y + 10, getSelectedSkin(), .43);
    drawBitmapText(value, rect.x + (isLevel ? 27 : 8), rect.y + 12, textScale, "left", "#26363d");
    ctx.fillStyle = "#26363d";
    const caretY = rect.y + Math.round(rect.h / 2) + 1;
    ctx.fillRect(rect.x + rect.w - 13, caretY - 2, 7, 2);
    ctx.fillRect(rect.x + rect.w - 12, caretY, 5, 2);
    ctx.fillRect(rect.x + rect.w - 11, caretY + 2, 3, 2);
    polish.leaderboardHitRects[key] = rect;
  }

  function drawLeaderboardScreen() {
    const skin = getSelectedSkin();
    // Redraw the background instead of inheriting the previous Achievements
    // frame; a partial canvas overlay left a harsh black shadow on the gradient.
    const backdrop = ctx.createLinearGradient(0, 0, 0, H);
    backdrop.addColorStop(0, skin.dark);
    backdrop.addColorStop(0.62, skin.mid);
    backdrop.addColorStop(1, skin.belly);
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, W, H);
    const metricDef = leaderboardMetricDefinition();
    const levelLabel = polish.leaderboardLevel === "any" ? "ANY LEVEL" : polish.leaderboardLevel.toUpperCase();
    polish.leaderboardHitRects = {};
    polish.leaderboardReplayRects = [];
    polish.leaderboardNameRects = [];

    const panel = { x: 20, y: 7, w: 440, h: 256 };
    // Soft inset shadow stays within the outer frame's silhouette.
    ctx.fillStyle = "rgba(12,26,33,0.12)";
    ctx.fillRect(panel.x + 3, panel.y + 5, panel.w - 6, panel.h - 8);
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
    drawBitmapText("LEADERBOARD", W / 2, panel.y + 18, 2, "center", COLORS.white, skin.dark);

    const refresh = { x: 29, y: 56, w: 22, h: 22 };
    const metricRect = { x: 64, y: 56, w: 164, h: 22 };
    const levelRect = { x: 252, y: 56, w: 164, h: 22 };
    ctx.fillStyle = "rgba(25,43,52,.24)"; ctx.fillRect(refresh.x + 2, refresh.y + 2, refresh.w, refresh.h);
    ctx.fillStyle = polish.leaderboardHoverKey === "refresh" ? skin.dark : COLORS.ink; ctx.fillRect(refresh.x, refresh.y, refresh.w, refresh.h);
    ctx.fillStyle = polish.leaderboardHoverKey === "refresh" ? mixHexColors(skin.belly, "#ffffff", .16) : "#f7fdff"; ctx.fillRect(refresh.x + 2, refresh.y + 2, refresh.w - 4, refresh.h - 4);
    drawLeaderboardRefreshIcon(refresh.x + refresh.w / 2, refresh.y + refresh.h / 2, polish.leaderboardHoverKey === "refresh");
    polish.leaderboardHitRects.refresh = refresh;
    drawLeaderboardDropdown(metricRect, "RANK BY", metricDef.label, polish.leaderboardDropdown === "metric", "metric");
    drawLeaderboardDropdown(levelRect, "LEVEL", ["flies", "pvpwins"].includes(polish.leaderboardMetric) ? "ALL LEVELS" : levelLabel, polish.leaderboardDropdown === "level", "level");

    const context = { x: 48, y: 85, w: 384, h: 20 };
    ctx.fillStyle = "rgba(25,43,52,0.25)"; ctx.fillRect(context.x + 2, context.y + 2, context.w, context.h);
    ctx.fillStyle = COLORS.ink; ctx.fillRect(context.x, context.y, context.w, context.h);
    ctx.fillStyle = "#eef3f4"; ctx.fillRect(context.x + 3, context.y + 3, context.w - 6, context.h - 6);
    const contextText = `ALL PLAYERS • ${metricDef.label} • ${["flies", "pvpwins"].includes(polish.leaderboardMetric) ? "ALL LEVELS" : levelLabel} • ${polish.leaderboardEntries.length} PLAYERS`;
    const contextScale = Math.min(.46, 360 / Math.max(1, measureBitmapText(contextText, 1)));
    drawBitmapText(contextText, W / 2, context.y + 7, contextScale, "center", "#59666b");

    const table = { x: 42, y: 111, w: 396, h: 103 };
    ctx.fillStyle = COLORS.ink; ctx.fillRect(table.x, table.y, table.w, table.h);
    // The unpopulated leaderboard stays light like the Achievement cards,
    // instead of showing a large opaque charcoal box against the gradient.
    ctx.fillStyle = "#f7fdff"; ctx.fillRect(table.x + 2, table.y + 18, table.w - 4, table.h - 20);
    ctx.fillStyle = skin.mid; ctx.fillRect(table.x + 2, table.y + 2, table.w - 4, 16);
    const columns = { rank: table.x + 20, name: table.x + 103, level: table.x + 223, result: table.x + 307, replay: table.x + 363 };
    drawBitmapText("RANK", columns.rank, table.y + 6, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("NAME", columns.name, table.y + 6, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("LEVEL", columns.level, table.y + 6, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("RESULT", columns.result, table.y + 6, .47, "center", COLORS.white, skin.dark);
    drawBitmapText("REPLAY", columns.replay, table.y + 6, .47, "center", COLORS.white, skin.dark);

    const perPage = 5;
    const pageCount = Math.max(1, Math.ceil(polish.leaderboardEntries.length / perPage));
    polish.leaderboardPage = clamp(polish.leaderboardPage, 0, pageCount - 1);
    const rows = polish.leaderboardEntries.slice(polish.leaderboardPage * perPage, polish.leaderboardPage * perPage + perPage);
    if (polish.leaderboardLoading) {
      drawBitmapText("LOADING RECORDS...", W / 2, 157, .72, "center", "#48555a");
    } else if (!rows.length) {
      drawBitmapText(polish.leaderboardError || "NO RECORDS YET", W / 2, 157, .72, "center", "#48555a");
    } else {
      rows.forEach((row, offset) => {
        const y = table.y + 18 + offset * 17;
        ctx.fillStyle = row.isCurrent ? "#b8f5dc" : (offset % 2 ? "#dfe5e7" : "#ffffff");
        ctx.fillRect(table.x + 2, y, table.w - 4, 17);
        ctx.fillStyle = "#d2dde0"; ctx.fillRect(table.x + 2, y + 16, table.w - 4, 1);
        drawBitmapText(String(row.rank || "—"), columns.rank, y + 6, .50, "center", "#26363d");
        const rowPalette = leaderboardFrogPalette(row);
        drawMiniFrogSwatchFacing(table.x + 48, y + 4, rowPalette, .43, 1);
        const nameRect = { x: table.x + 42, y: y + 1, w: 132, h: 15, row };
        const nameHover = polish.leaderboardHoverKey === `name:${offset}`;
        if (nameHover) {
          ctx.fillStyle = mixHexColors(rowPalette.belly || "#b8f5dc", "#ffffff", .22);
          ctx.fillRect(nameRect.x, nameRect.y, nameRect.w, nameRect.h);
          drawMiniFrogSwatchFacing(table.x + 48, y + 4, rowPalette, .43, 1);
        }
        const nameScale = Math.min(.50, 100 / Math.max(1, measureBitmapText(row.name.toUpperCase(), 1)));
        drawBitmapText(row.name.toUpperCase(), table.x + 66, y + 6, nameScale, "left", nameHover ? rowPalette.dark : "#26363d");
        polish.leaderboardNameRects.push(nameRect);
        if(String(row.level||"ALL").toLowerCase()!=="all") drawLevelUnlockIcon(String(row.level||"park").toLowerCase(), columns.level-13, y+3, skin, .42);
        drawBitmapText(row.level, columns.level+7, y + 6, .48, "center", "#26363d");
        drawBitmapText(formatLeaderboardValue(row), columns.result, y + 6, .50, "center", "#26363d");
        if (row.replayId) {
          const replayRect = { x: columns.replay - 13, y: y + 1, w: 26, h: 15, row };
          drawReplayIcon(replayRect.x + replayRect.w / 2, replayRect.y + replayRect.h / 2, polish.leaderboardHoverKey === `replay:${offset}`, rowPalette);
          polish.leaderboardReplayRects.push(replayRect);
        }
      });
    }

    // Match the Achievements screen: BACK centered, both pagination arrows
    // at the lower right, with the page count to their LEFT (never between).
    const prev = ACHIEVEMENTS_UI.pagePrevButton;
    const next = ACHIEVEMENTS_UI.pageNextButton;
    [
      { key: "prev", rect: prev, direction: -1 },
      { key: "next", rect: next, direction: 1 }
    ].forEach(({ key, rect, direction }) => {
      const active = polish.leaderboardHoverKey === key;
      ctx.fillStyle = "rgba(25,43,52,0.24)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
      ctx.fillStyle = active ? COLORS.ink : "#9aa9ae"; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = active ? skin.mid : "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      drawPagerArrowIcon(rect, direction, active ? COLORS.white : "#48555a");
      polish.leaderboardHitRects[key] = rect;
    });
    const pageLabelScale = .75;
    drawBitmapText(`${polish.leaderboardPage + 1}/${pageCount}`,
      prev.x - 8,
      prev.y + (prev.h - 7 * pageLabelScale) / 2,
      pageLabelScale, "right", "#617177");

    const back = ACHIEVEMENTS_UI.backButton;
    const backActive = polish.leaderboardHoverKey === "back";
    ctx.fillStyle = "rgba(25,43,52,0.28)"; ctx.fillRect(back.x + 2, back.y + 2, back.w, back.h);
    ctx.fillStyle = backActive ? COLORS.ink : "#93a2a7"; ctx.fillRect(back.x, back.y, back.w, back.h);
    ctx.fillStyle = backActive ? skin.mid : "#f7fdff"; ctx.fillRect(back.x + 2, back.y + 2, back.w - 4, back.h - 4);
    if (backActive) { ctx.fillStyle = skin.light; ctx.fillRect(back.x + 5, back.y + 4, back.w - 10, 3); }
    drawBitmapText("BACK", back.x + back.w / 2, back.y + (back.h - 7) / 2,
      1, "center", backActive ? COLORS.white : "#48555a", backActive ? skin.dark : null);
    polish.leaderboardHitRects.back = back;
    polish.leaderboardHitRects.metric = metricRect;
    polish.leaderboardHitRects.level = levelRect;

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
        if (entry !== "any") drawLevelUnlockIcon(entry, rect.x+7, rect.y+3, skin, .44);
        drawBitmapText(entry === "any" ? "ANY LEVEL" : entry.toUpperCase(), rect.x + (entry === "any" ? 7 : 25), rect.y + 6, .43, "left", "#26363d");
        polish.leaderboardHitRects[`level:${entry}`] = rect;
      });
    }

    drawLeaderboardStatsModal();
  }

  function drawLeaderboardStatsModal() {
    const row = polish.leaderboardStatsRow;
    if (!row) return;
    const skin = leaderboardFrogPalette(row);
    const panel = { x:20, y:7, w:440, h:256 };
    const close = { x:panel.x + panel.w - 32, y:panel.y + 9, w:20, h:20 };
    const back = STATS_UI.backButton;
    const prev = STATS_UI.pagePrevButton, next = STATS_UI.pageNextButton;
    polish.leaderboardStatsHitRects = { panel, close, back, prev, next };
    ctx.fillStyle="rgba(8,25,33,.66)";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(12,26,33,.22)";ctx.fillRect(panel.x+6,panel.y+7,panel.w-6,panel.h-7);
    ctx.fillStyle=COLORS.ink;
    ctx.fillRect(panel.x+4,panel.y,panel.w-8,panel.h);
    ctx.fillRect(panel.x,panel.y+4,panel.w,panel.h-8);
    ctx.fillStyle="#f7fdff";
    ctx.fillRect(panel.x+7,panel.y+4,panel.w-14,panel.h-8);
    ctx.fillRect(panel.x+4,panel.y+8,panel.w-8,panel.h-16);
    ctx.fillStyle=skin.dark;ctx.fillRect(panel.x+12,panel.y+9,panel.w-24,36);
    ctx.fillStyle=skin.mid;ctx.fillRect(panel.x+14,panel.y+11,panel.w-28,31);
    ctx.fillStyle=skin.light;ctx.fillRect(panel.x+17,panel.y+13,panel.w-34,4);
    const headerTop=panel.y+17,headerBottom=panel.y+42;
    const headerMid=Math.round((headerTop+headerBottom)/2);
    const frogScale=.72;
    drawMiniFrogSwatchFacing(panel.x+46,headerMid-9,skin,frogScale,1);
    const name = String(row.name || "FROG").toUpperCase();
    const textLeft=panel.x+84,textRight=close.x-6;
    const titleCenter=Math.round((textLeft+textRight)/2);
    const nameScale=Math.min(1.45,Math.max(.64,(textRight-textLeft-7)/Math.max(1,measureBitmapText(name,1))));
    drawBitmapText(name,titleCenter,Math.round(headerMid-7*nameScale/2),nameScale,"center",COLORS.white,skin.dark);
    ctx.fillStyle=COLORS.ink;ctx.fillRect(close.x,close.y,close.w,close.h);
    ctx.fillStyle="#f7fdff";ctx.fillRect(close.x+2,close.y+2,close.w-4,close.h-4);
    ctx.fillStyle="#48555a";
    for(let i=0;i<7;i++){
      ctx.fillRect(close.x+6+i,close.y+6+i,2,2);
      ctx.fillRect(close.x+12-i,close.y+6+i,2,2);
    }
    const allMetrics=leaderboardPlayerMetrics(row);
    const pageCount=Math.max(1,Math.ceil(allMetrics.length/STATS_UI.itemsPerPage));
    const page=Math.max(0,Math.min(polish.leaderboardStatsPage,pageCount-1));
    polish.leaderboardStatsPage=page;
    const metrics=allMetrics.slice(page*STATS_UI.itemsPerPage,(page+1)*STATS_UI.itemsPerPage);
    metrics.forEach((metric,index)=>{
      const column=index%STATS_UI.columns, rowIndex=Math.floor(index/STATS_UI.columns);
      const x=STATS_UI.startX+column*(STATS_UI.cardW+STATS_UI.gapX),y=STATS_UI.startY+rowIndex*(STATS_UI.cardH+STATS_UI.gapY);
      ctx.fillStyle="rgba(25,43,52,.22)";ctx.fillRect(x+2,y+2,STATS_UI.cardW,STATS_UI.cardH);
      ctx.fillStyle="#8fa6ac";ctx.fillRect(x,y,STATS_UI.cardW,STATS_UI.cardH);
      ctx.fillStyle="#f7fdff";ctx.fillRect(x+2,y+2,STATS_UI.cardW-4,STATS_UI.cardH-4);
      ctx.fillStyle=mixHexColors(skin.belly,"#ffffff",.25);ctx.fillRect(x+5,y+4,STATS_UI.cardW-10,3);
      drawStatsMetricIcon(metric.icon,x+30,y+STATS_UI.cardH/2,skin);
      drawBitmapText(metric.label,x+120,y+7,.82,"center","#59666b");
      drawBitmapText(metric.value,x+120,y+16,.90,"center",skin.dark);
    });
    if(pageCount>1){
      [{rect:prev,dir:-1},{rect:next,dir:1}].forEach(({rect,dir})=>{
        ctx.fillStyle="#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
        ctx.fillStyle="#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
        drawPagerArrowIcon(rect,dir,"#48555a");
      });
      drawBitmapText(`${page+1}/${pageCount}`,STATS_UI.pagePrevButton.x-8,STATS_UI.pagePrevButton.y+5,.75,"right","#617177");
    }
    ctx.fillStyle="#93a2a7";ctx.fillRect(back.x,back.y,back.w,back.h);
    ctx.fillStyle="#f7fdff";ctx.fillRect(back.x+2,back.y+2,back.w-4,back.h-4);
    drawBitmapText("BACK",back.x+back.w/2,back.y+6,.92,"center","#48555a");
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
        await window.RibbitRacePlayRecordReplay(row.replayUsername || row.name, level, metric, row.replayUid || "",row.date||null);
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
    // The help overlay must sit ABOVE and dim the fullscreen button.
    if (game.state !== "paused" || game.pauseHelpOpen) return;
    const rect = getPauseFullscreenRect();
    const active = !!polish.pauseFullscreenHovered;
    // No offset shadow: the fullscreen icon is a flush pixel button.
    ctx.fillStyle = active ? getSelectedSkin().dark : COLORS.ink; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = active ? mixHexColors(getSelectedSkin().belly, "#ffffff", .16) : "#f7fdff"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    if (active) { ctx.fillStyle = getSelectedSkin().light; ctx.fillRect(rect.x + 4, rect.y + 3, rect.w - 8, 2); }
    ctx.fillStyle = active ? getSelectedSkin().dark : "#48555a";
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
    // If the actual victory notice already displays WORLD RECORD, its own
    // hover tooltip takes precedence over the obsolete fixed-location badge.
    if (getVictoryUnlockNoticeLayout()?.cards?.some(card => card.type === "leaderboard")) return;
    const rect = { x:150, y:205, w:180, h:24 };
    ctx.fillStyle = "rgba(25,43,52,.28)"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
    ctx.fillStyle = "#805316"; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#ffe7a0"; ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    drawPixelTrophy(rect.x + 15, rect.y + 3, false, .78);
    drawBitmapText("NEW WORLD RECORD!", rect.x + 103, rect.y + 8, .72, "center", "#805316");
    if (polish.worldRecordHovered) {
      const priorMeta = window.RibbitGetWorldRecordDetail?.() || game.previousWorldRecord || game.worldRecordPrevious || game.worldRecordPrior || game.recordPrevious || game.previousRecord || {};
      const name = priorMeta.name || priorMeta.holder || priorMeta.displayName || game.previousWorldRecordHolder || "NO PREVIOUS HOLDER";
      const value = priorMeta.value ?? priorMeta.time ?? priorMeta.jumps ?? priorMeta.score ?? game.previousWorldRecordValue ?? "—";
      const rawDate = priorMeta.date || priorMeta.createdAt || game.previousWorldRecordDate;
      const date = rawDate ? String(rawDate) : "UNKNOWN DATE";
      drawSpeechBubble(rect, `PREVIOUS: ${name} • ${value} • ${date}`, { maxWidth:288, scale:.40, height:23 });
    }
  }

  function drawPvpPauseButtonPolish8() {
    if (game.mode !== "pvp" || !["playing","countdown","pvpCelebration"].includes(game.state)) return;
    if (isOnlineMenuVisible()) return;
    const rect = HUD_UI.pauseButton;
    const palette = getPvpSkinPalette(pvpPlayers[0]?.skinId, "azure", 0);
    const pauseOpacity = game.state === "paused" ? 0.92 : 0.66;
    ctx.save();
    ctx.globalAlpha *= pauseOpacity;
    for (const dx of [7, 15]) {
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(rect.x + dx - 1, rect.y + 4, 6, 14);
      ctx.fillStyle = palette.light;
      ctx.fillRect(rect.x + dx, rect.y + 5, 4, 12);
      ctx.fillStyle = palette.mid;
      ctx.fillRect(rect.x + dx, rect.y + 14, 4, 3);
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
    // Online set replays are archived in 110-online-mobile-polish.js only after
    // the full match resolves; do not create duplicate per-round history here.
    const onlineFinished = false;
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
      // First non-zoom simulation frame starts fully transparent, not suddenly
      // opaque. Every still-alive fly then returns over 0.42 seconds.
      game.flyLabelReturnAlpha = 0;
    } else if (!criticalCatchActive && game.state !== "paused" &&
        Number.isFinite(game.flyLabelReturnAlpha) && game.flyLabelReturnAlpha < 1) {
      game.flyLabelReturnAlpha = Math.min(1, game.flyLabelReturnAlpha + Math.max(0, dt) / 0.42);
    }
    polish.priorCriticalCatch = criticalCatchActive;
    archiveOnlineRound();
    polish.previousRoundState = game.state;
    return result;
  };

  const originalDrawScenePolish8 = drawScene;
  drawScene = function(...args) {
    if (game.state === "rrProfileMenu") { drawProfileMenu(); return; }
    if (game.state === "rrLanguageMenu") { drawLanguageMenu(); return; }
    if (game.state === "rrFlashcards") { drawFlashcardsMenu(); return; }
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
    // Pause/play buttons are drawn once inside each mode's native HUD.
    if(polish.leaderboardStatsRow && game.state !== "rrLeaderboard")drawLeaderboardStatsModal();
    return result;
  };

  function interactiveRectForPoint(point) {
    const insideAny = (items = []) => items.some((item) => item && pointIn(point, item));
    if(polish.leaderboardStatsRow && game.state !== "rrLeaderboard") return insideAny([...(Object.values(polish.leaderboardStatsHitRects||{}))]);
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
    if(game.state==="rrLanguageMenu")return insideAny(polish.languagePickerOpen?[LANGUAGE_PICKER_CLOSE,...getLanguagePickerRects()]:[...LANGUAGE_MENU_RECTS,LANGUAGE_SWAP_RECT]);
    if(game.state==="rrFlashcards")return insideAny([...FLASHCARD_BUTTON_ORDER,...(polish.flashcardComplete?Object.values(FLASHCARD_COMPLETION_RECTS):[])]);
    if (game.state === "rrDeviceMenu") return insideAny(Object.values(DEVICE_MENU_RECTS));
    if (game.state === "achievements") {
      return insideAny([LEADERBOARD_BUTTON, ACHIEVEMENTS_UI.backButton, ACHIEVEMENTS_UI.pagePrevButton, ACHIEVEMENTS_UI.pageNextButton]);
    }
    if (game.state === "stats") {
      return insideAny([STATS_UI.backButton, STATS_UI.pagePrevButton, STATS_UI.pageNextButton]);
    }
    if (game.state === "rrLeaderboard") {
      return insideAny([
        ...Object.values(polish.leaderboardHitRects || {}),
        ...Object.values(polish.leaderboardStatsHitRects || {}),
        ...polish.leaderboardReplayRects,
        ...polish.leaderboardNameRects
      ]);
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
        PAUSE_UI.homeButton, PAUSE_UI.helpButton, PAUSE_UI.helpCloseButton, getPauseFullscreenRect()]);
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
      if(polish.leaderboardStatsRow && game.state !== "rrLeaderboard"){event.preventDefault();event.stopImmediatePropagation();canvas.style.setProperty("cursor",interactiveRectForPoint(point)?"pointer":"default","important");return;}
      if (OnlineVersus?.isMenuVisible?.() && !OnlineVersus?.isActive?.()) return;
    } catch (_) {}
    polish.mainHoverKey = "";
    if (game.state === "rrProfileMenu") {
      const index = PROFILE_MENU_RECTS.findIndex((rect) => pointIn(point, rect));
      if (index >= 0) polish.profileSelection = index;
    } else if (game.state === "rrLanguageMenu") {
      if(polish.languagePickerOpen){
        const index=getLanguagePickerRects().findIndex(rect=>pointIn(point,rect));
        if(index>=0)polish.languagePickerSelection=index;
      }else if(pointIn(point,LANGUAGE_SWAP_RECT))polish.languageSelection=-1;
      else {const index=LANGUAGE_MENU_RECTS.findIndex(rect=>pointIn(point,rect));if(index>=0)polish.languageSelection=index;}
    } else if (game.state === "rrFlashcards") {
      const completion=polish.flashcardComplete&&Object.values(FLASHCARD_COMPLETION_RECTS).find(rect=>pointIn(point,rect));
      if(completion)polish.flashcardCompletionSelection=completion.id==="complete-starred"?"starred":"all";
      const hovered=FLASHCARD_BUTTON_ORDER.find(rect=>pointIn(point,rect));
      polish.flashcardHoverKey=hovered?.id||"";
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
      if (polish.leaderboardStatsRow) {
        if (pointIn(point, polish.leaderboardStatsHitRects.close)) polish.leaderboardHoverKey = "stats-close";
        else if (pointIn(point, polish.leaderboardStatsHitRects.back)) polish.leaderboardHoverKey = "stats-back";
      } else {
        for (const [key, rect] of Object.entries(polish.leaderboardHitRects || {})) {
          if (pointIn(point, rect)) { polish.leaderboardHoverKey = key; break; }
        }
        const nameIndex = polish.leaderboardNameRects.findIndex((item) => pointIn(point, item));
        if (nameIndex >= 0) polish.leaderboardHoverKey = `name:${nameIndex}`;
        const replayIndex = polish.leaderboardReplayRects.findIndex((item) => pointIn(point, item));
        if (replayIndex >= 0) polish.leaderboardHoverKey = `replay:${replayIndex}`;
      }
    }
    polish.worldRecordHovered = game.state === "won" && pointIn(point, { x:150, y:205, w:180, h:24 });
    polish.pauseFullscreenHovered = game.state === "paused" && pointIn(point, getPauseFullscreenRect());
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
    polish.pauseFullscreenHovered = false;
    polish.flashcardHoverKey = "";
    try { canvas.style.setProperty("cursor", "default", "important"); } catch (_) {}
  }, { capture:true, passive:true });

  canvas.addEventListener("pointerdown", (event) => {
    const point = getCanvasPoint(event);
    if (polish.leaderboardStatsRow && game.state !== "rrLeaderboard") {
      event.preventDefault();event.stopImmediatePropagation();
      const statsHits = polish.leaderboardStatsHitRects || {};
      const allMetrics = leaderboardPlayerMetrics(polish.leaderboardStatsRow);
      const pageCount = Math.max(1, Math.ceil(allMetrics.length / STATS_UI.itemsPerPage));
      if (pointIn(point, statsHits.close) || pointIn(point, statsHits.back) || !pointIn(point, statsHits.panel)) closeLeaderboardStats();
      else if (pointIn(point, statsHits.prev)) polish.leaderboardStatsPage = (polish.leaderboardStatsPage - 1 + pageCount) % pageCount;
      else if (pointIn(point, statsHits.next)) polish.leaderboardStatsPage = (polish.leaderboardStatsPage + 1) % pageCount;
      return;
    }
    if (game.state === "rrProfileMenu") {
      const index = PROFILE_MENU_RECTS.findIndex((rect) => pointIn(point, rect));
      if (index >= 0) { event.preventDefault(); event.stopImmediatePropagation(); polish.profileSelection=index; activateProfileRow(index); }
      return;
    }
    if(game.state==="rrLanguageMenu"){
      event.preventDefault();event.stopImmediatePropagation();
      if(polish.languagePickerOpen){
        if(pointIn(point,LANGUAGE_PICKER_CLOSE)){polish.languagePickerOpen="";return;}
        const index=getLanguagePickerRects().findIndex(rect=>pointIn(point,rect));
        if(index>=0){polish.languagePickerSelection=index;selectLanguagePickerOption(index);}
        else polish.languagePickerOpen="";
      }else if(pointIn(point,LANGUAGE_SWAP_RECT))activateLanguageRow(-1);
      else {const index=LANGUAGE_MENU_RECTS.findIndex(rect=>pointIn(point,rect));if(index>=0){polish.languageSelection=index;activateLanguageRow(index);}}
      return;
    }
    if(game.state==="rrFlashcards"){
      if(polish.flashcardComplete){
        const option=Object.values(FLASHCARD_COMPLETION_RECTS).find(rect=>pointIn(point,rect));
        if(option&&(option.id==="complete-all"||(!polish.flashcardOnlyStarred&&availableStarredFlashcardCount()))){
          event.preventDefault();event.stopImmediatePropagation();completeFlashcardSession(option.id==="complete-starred"?"starred":"all");return;
        }
      }
      const index=FLASHCARD_BUTTON_ORDER.findIndex(rect=>pointIn(point,rect));
      if(index>=0){event.preventDefault();event.stopImmediatePropagation();polish.flashcardSelection=index;activateFlashcardButton(index);}
      else if(polish.flashcardHelpOpen){event.preventDefault();event.stopImmediatePropagation();polish.flashcardHelpOpen=false;}
      return;
    }
    if (game.state === "rrDeviceMenu") {
      if (pointIn(point, DEVICE_MENU_RECTS.computer)) { event.preventDefault(); event.stopImmediatePropagation(); polish.deviceSelection=0; setCanvasMobileMode(false); }
      else if (pointIn(point, DEVICE_MENU_RECTS.mobile)) { event.preventDefault(); event.stopImmediatePropagation(); polish.deviceSelection=1; setCanvasMobileMode(true); }
      else if (pointIn(point, DEVICE_MENU_RECTS.back)) { event.preventDefault(); event.stopImmediatePropagation(); closeUtilityMenu(); }
      return;
    }
    if (game.state === "main" && pointIn(point, MAIN_PROFILE_BUTTON)) {
      event.preventDefault(); event.stopImmediatePropagation(); openProfileMenu(); return;
    }
    if (game.state === "main" && pointIn(point, MAIN_DEVICE_BUTTON)) {
      event.preventDefault(); event.stopImmediatePropagation(); openDeviceMenu(); return;
    }
    if (game.state === "achievements" && pointIn(point, LEADERBOARD_BUTTON)) {
      event.preventDefault(); event.stopImmediatePropagation(); openLeaderboard(); return;
    }
    if (game.state === "rrLeaderboard") {
      event.preventDefault(); event.stopImmediatePropagation();
      if (polish.leaderboardStatsRow) {
        const statsHits = polish.leaderboardStatsHitRects || {};
        if (pointIn(point, statsHits.close) || pointIn(point, statsHits.back) || !pointIn(point, statsHits.panel)) {
          closeLeaderboardStats();
        } else {
          const allMetrics = leaderboardPlayerMetrics(polish.leaderboardStatsRow);
          const pageCount = Math.max(1, Math.ceil(allMetrics.length / STATS_UI.itemsPerPage));
          if(pointIn(point,statsHits.prev)) polish.leaderboardStatsPage=(polish.leaderboardStatsPage-1+pageCount)%pageCount;
          else if(pointIn(point,statsHits.next)) polish.leaderboardStatsPage=(polish.leaderboardStatsPage+1)%pageCount;
        }
        return;
      }
      const hits = polish.leaderboardHitRects || {};
      if (pointIn(point, hits.close) || pointIn(point, hits.back)) { closeLeaderboard(); return; }
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
      if (name) { openLeaderboardStats(name.row); return; }
      const replay = polish.leaderboardReplayRects.find((item) => pointIn(point, item));
      if (replay) {
        if (replay.row.serverReplayAvailable || String(replay.row.replayId).startsWith("server:")) {
          playLeaderboardRecord(replay.row);
        } else if (replay.row.replayId) {
          playReplayById(replay.row.replayId, `${replay.row.name} • ${replay.row.metric}`);
        }
        return;
      }
      polish.leaderboardDropdown = "";
      return;
    }
    if (game.mode === "pvp" && ["playing","countdown","pvpCelebration"].includes(game.state) && pointIn(point, HUD_UI.pauseButton)) {
      event.preventDefault(); event.stopImmediatePropagation(); pauseGame(); return;
    }
    if (game.mode === "pvp" && game.state === "paused" && !game.onlineMode && !game.pauseHelpOpen && pointIn(point, HUD_UI.pauseButton)) {
      event.preventDefault(); event.stopImmediatePropagation(); resumePausedGame(); return;
    }
    if (game.state === "paused" && !game.pauseHelpOpen && pointIn(point, getPauseFullscreenRect())) {
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

  function closeDomReplayOverlay(){
    const overlay=document.getElementById("rr-replay-overlay");
    if(!overlay || overlay.hidden) return false;
    overlay.querySelector(".rr-replay-close")?.click?.();
    return true;
  }

  window.addEventListener("keydown", (event) => {
    if ((event.code === "Escape" || event.code === "Backspace") && closeDomReplayOverlay()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (polish.leaderboardStatsRow && game.state !== "rrLeaderboard") {
      const allMetrics = leaderboardPlayerMetrics(polish.leaderboardStatsRow);
      const pageCount = Math.max(1, Math.ceil(allMetrics.length / STATS_UI.itemsPerPage));
      if (["Escape","Backspace","ArrowLeft","ArrowRight","KeyA","KeyD"].includes(event.code)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if(["Escape","Backspace"].includes(event.code)) closeLeaderboardStats();
        else if(["ArrowLeft","KeyA"].includes(event.code)) polish.leaderboardStatsPage=(polish.leaderboardStatsPage-1+pageCount)%pageCount;
        else polish.leaderboardStatsPage=(polish.leaderboardStatsPage+1)%pageCount;
      }
      return;
    }
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
    if(game.state==="rrLanguageMenu"){
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyS","KeyA","KeyD","Enter","NumpadEnter","Space","Escape","Backspace"].includes(event.code)){
        event.preventDefault();event.stopImmediatePropagation();
        if(event.repeat&&!["ArrowUp","ArrowDown","KeyW","KeyS"].includes(event.code))return;
        if(polish.languagePickerOpen){
          if(["Escape","Backspace"].includes(event.code))polish.languagePickerOpen="";
          else if(["ArrowUp","KeyW","ArrowLeft","KeyA"].includes(event.code))polish.languagePickerSelection=(polish.languagePickerSelection-1+LANGUAGE_OPTIONS.length)%LANGUAGE_OPTIONS.length;
          else if(["ArrowDown","KeyS","ArrowRight","KeyD"].includes(event.code))polish.languagePickerSelection=(polish.languagePickerSelection+1)%LANGUAGE_OPTIONS.length;
          else if(["Enter","NumpadEnter","Space"].includes(event.code))selectLanguagePickerOption();
        }else if(["Escape","Backspace"].includes(event.code)){game.state="rrProfileMenu";tone(330,.04,.009,-30);}
        else if(["ArrowUp","KeyW"].includes(event.code))polish.languageSelection=(polish.languageSelection-1+LANGUAGE_MENU_ROWS.length)%LANGUAGE_MENU_ROWS.length;
        else if(["ArrowDown","KeyS"].includes(event.code))polish.languageSelection=(polish.languageSelection+1)%LANGUAGE_MENU_ROWS.length;
        else if(["ArrowLeft","ArrowRight","KeyA","KeyD"].includes(event.code))activateLanguageRow(-1);
        else activateLanguageRow();
      }
      return;
    }
    if (game.state === "rrFlashcards") {
      if (window.RibbitStudyUI?.isOpen?.()) return;
      const keys=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","KeyA","KeyD","KeyS","Slash","Space","Enter","NumpadEnter","KeyH","KeyV","KeyR","Escape","Backspace"];
      if(keys.includes(event.code)){
        event.preventDefault();event.stopImmediatePropagation();
        if(event.repeat&&!(["ArrowLeft","ArrowRight","KeyA","KeyD"].includes(event.code)))return;
        if(["Escape","Backspace"].includes(event.code)){if(polish.flashcardHelpOpen)polish.flashcardHelpOpen=false;else activateFlashcardButton(FLASHCARD_BUTTON_ORDER.findIndex(b=>b.id==="back"));}
        else if(["ArrowLeft","KeyA"].includes(event.code))activateFlashcardButton(0);
        else if(["ArrowRight","KeyD"].includes(event.code))activateFlashcardButton(2);
        else if(["Space","Enter","NumpadEnter"].includes(event.code))activateFlashcardButton(1);
        else if(polish.flashcardComplete&&["ArrowUp","ArrowDown"].includes(event.code)&&!polish.flashcardOnlyStarred&&availableStarredFlashcardCount()){
          polish.flashcardCompletionSelection=polish.flashcardCompletionSelection==="starred"?"all":"starred";
        }
        else if(["KeyS","Slash"].includes(event.code))activateFlashcardButton(FLASHCARD_BUTTON_ORDER.findIndex(b=>b.id==="star"));
        else if(event.code==="KeyH")activateFlashcardButton(FLASHCARD_BUTTON_ORDER.findIndex(b=>b.id==="shuffle"));
        else if(event.code==="KeyV")activateFlashcardButton(FLASHCARD_BUTTON_ORDER.findIndex(b=>b.id==="starred"));
        else if(event.code==="KeyR"&&polish.flashcardComplete)rebuildFlashcardDeck(polish.flashcardOnlyStarred,polish.flashcardShuffled);
        // Up/Down deliberately do nothing; they must not navigate buttons.
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
        if (polish.leaderboardStatsRow) {
          const allMetrics = leaderboardPlayerMetrics(polish.leaderboardStatsRow);
          const statsPageCount = Math.max(1, Math.ceil(allMetrics.length / STATS_UI.itemsPerPage));
          if(["ArrowLeft","ArrowRight","KeyA","KeyD"].includes(event.code))polish.leaderboardStatsPage=(["ArrowLeft","KeyA"].includes(event.code)?(polish.leaderboardStatsPage-1+statsPageCount):(polish.leaderboardStatsPage+1))%statsPageCount;
          else closeLeaderboardStats();
        } else if (event.code === "Escape" || event.code === "Backspace") closeLeaderboard();
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
      #rr170-account-icon, #rr170-device-icon, #rr170-pause { display:none !important; pointer-events:none !important; }
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
