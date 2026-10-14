// Ribbit Race Friends 1.6.0 — integrated extension layer
// Responsibilities: runtime bridge, deterministic PvP event telemetry, mobile
// input support hooks, palette operations, post-hat progression, and replay state.

const RIBBIT_FRIENDS_DISPLAY_VERSION = "1.7.39";
const RIBBIT_FRIENDS_BUILD = "2026.10.13-friends-polish-51";

function rr14Number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function rr14RectFromActor(actor) {
  if (!actor || typeof actor !== "object") return null;
  const x = rr14Number(actor.x, NaN), y = rr14Number(actor.y, NaN);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const width = Math.max(8, rr14Number(actor.width ?? actor.w ?? actor.hitW, 26));
  const height = Math.max(8, rr14Number(actor.height ?? actor.h ?? actor.hitH, 22));
  return { actor, x, y, width, height, cx: x + width / 2, cy: y + height / 2,
    vx: rr14Number(actor.vx), vy: rr14Number(actor.vy) };
}
function rr14FindFrogPair(args) {
  const direct = Array.from(args || []).map(rr14RectFromActor).filter(Boolean);
  if (direct.length >= 2) return direct.slice(0, 2);
  const candidates = [];
  const inspect = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) value.forEach(inspect);
    else { const rect = rr14RectFromActor(value); if (rect) candidates.push(rect); }
  };
  Array.from(args || []).forEach(inspect);
  return candidates.slice(0, 2);
}
function rr14Overlap(a, b) {
  if (!a || !b) return null;
  const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return x > 0 && y > 0 ? { x, y } : null;
}
function rr14ManualRebound(a, b, overlap) {
  const left = a.cx <= b.cx ? a : b, right = left === a ? b : a;
  const push = Math.max(0.5, overlap.x / 2 + 0.5);
  left.actor.x -= push; right.actor.x += push;
  const speed = Math.max(2.2, Math.abs(a.vx), Math.abs(b.vx), 2.8);
  left.actor.vx = -speed; right.actor.vx = speed;
  window.dispatchEvent(new CustomEvent("ribbit-pvp-event", {detail:{type:"rebound",human:true}}));
  return true;
}
function rr14ValidVerticalBonk(a, b) {
  const top = a.cy <= b.cy ? a : b, bottom = top === a ? b : a;
  // A bonk is valid only when the upper frog is falling, or the lower frog is
  // actively rising into it. Merely pressing jump while already overlapping
  // can no longer manufacture an instant bonk.
  return top.vy > 0.08 || bottom.vy < -0.08;
}

if (typeof resolvePvpCollision === "function") {
  const rr14OriginalCollision = resolvePvpCollision;
  resolvePvpCollision = function(...args) {
    const pair = rr14FindFrogPair(args);
    const overlap = pair.length === 2 ? rr14Overlap(pair[0], pair[1]) : null;
    if (overlap && overlap.y <= overlap.x && !rr14ValidVerticalBonk(pair[0], pair[1])) {
      return rr14ManualRebound(pair[0], pair[1], overlap);
    }
    const result = rr14OriginalCollision.apply(this, args);
    if (overlap) {
      const type = overlap.y <= overlap.x ? "bonk" : "rebound";
      window.dispatchEvent(new CustomEvent("ribbit-pvp-event", {detail:{type,human:true}}));
    }
    return result;
  };
}

function rr14StorageJson(key, fallback) {
  try { const parsed = JSON.parse(localStorage.getItem(key) || "null"); return parsed ?? fallback; } catch (_) { return fallback; }
}
function rr14SetStorageJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function rr14GameState() {
  try { return String(game?.state || ""); } catch (_) { return ""; }
}
function rr14CurrentLevel() {
  try {
    const allowed = new Set(["park","swamp","jungle","pond","lake","garden"]);
    for (const [key,value] of Object.entries(game || {})) {
      if (typeof value === "string" && allowed.has(value.toLowerCase()) && /level|stage|selected/i.test(key)) return value.toLowerCase();
    }
    return allowed.has(String(game?.levelId || "").toLowerCase()) ? String(game.levelId).toLowerCase() : "";
  } catch (_) { return ""; }
}
function rr14CurrentSkin() {
  try { return String(game?.skinId || game?.selectedSkinId || game?.setupSkinFocusId || "azure"); } catch (_) { return "azure"; }
}
function rr14FindNumeric(regex, fallback = 0) {
  try {
    for (const [key,value] of Object.entries(game || {})) if (regex.test(key) && Number.isFinite(Number(value))) return Number(value);
  } catch (_) {}
  return fallback;
}
function rr14Snapshot() {
  const state = rr14GameState();
  return {
    state,
    level: rr14CurrentLevel(),
    skin: (() => { try { return String(game?.skinId || rr14CurrentSkin() || "azure"); } catch (_) { return rr14CurrentSkin(); } })(),
    time: (() => { try { const value=Number(game?.finishTime ?? game?.elapsed ?? 0); return Number.isFinite(value)?value:0; } catch (_) { return rr14FindNumeric(/elapsed|playTime|levelTime|runTime/i, 0); } })(),
    jumps: Math.max(0, Math.floor(rr14FindNumeric(/^jumps$|jumpCount|levelJumps/i, 0))),
    score: rr14FindNumeric(/^score$|fliesCaught|correctFlies/i, 0),
    matchWinnerIndex: Math.floor(rr14FindNumeric(/pvpMatchWinner|matchWinnerIndex/i, -1)),
    ownPlayerIndex: Math.floor(rr14FindNumeric(/onlinePlayerIndex|localPlayerIndex|pvpLocalIndex/i, 0)),
    randomSelected: (() => { try { return /random/i.test(String(game?.requestedStage || game?.selectedLevel || game?.levelSelection || "")); } catch (_) { return false; } })(),
    mobile: localStorage.getItem("rrFriendsMobileModeV1") === "1",
    localVersus: (/pvp|versus/i.test(state) || Boolean(game?.pvpActive)) && !rr14OnlineActive(),
    onlineVersus: rr14OnlineActive() || /online|quick/i.test(state),
    twoHuman: (() => { try { return !(game?.pvpCpuEnabled ?? game?.pvpCpu ?? true); } catch (_) { return false; } })()
  };
}
function rr14SkinPalette(id) {
  try {
    const skin = FROG_SKINS?.[id];
    if (!skin) return null;
    const out = {};
    ["dark","mid","light","belly","accents","bump","crest","arms","feet","tongue","tongueDark"].forEach((k) => { if (typeof skin[k] === "string") out[k] = skin[k]; });
    return Object.keys(out).length ? out : null;
  } catch (_) { return null; }
}
function rr14ActiveCustomId() {
  const id = rr14CurrentSkin();
  return /^custom[1-3]$/.test(id) ? id : "custom1";
}
function rr14CommitRgbEditor() {
  const editor = document.getElementById("rgb-value-editor");
  if (editor && document.activeElement === editor) { editor.dispatchEvent(new Event("change",{bubbles:true})); editor.blur(); }
}
function rr14ApplyPalette(customId, palette) {
  if (!/^custom[1-3]$/.test(customId) || !palette) return false;
  rr14CommitRgbEditor();
  try {
    const skin = FROG_SKINS?.[customId];
    if (skin) Object.assign(skin, palette);
  } catch (_) {}
  // Update any recognized custom-color storage object/array without assuming a
  // single historical schema.
  for (let i=0;i<localStorage.length;i++) {
    const key=localStorage.key(i); if (!/custom.*frog.*(color|skin)|frog.*custom.*(color|skin)/i.test(key||"")) continue;
    let data; try { data=JSON.parse(localStorage.getItem(key)); } catch (_) { continue; }
    const slot=Number(customId.slice(-1))-1;
    if (Array.isArray(data)) { data[slot]={...(data[slot]||{}),...palette}; rr14SetStorageJson(key,data); }
    else if (data && typeof data === "object") { data[customId]={...(data[customId]||{}),...palette}; rr14SetStorageJson(key,data); }
  }
  try { selectFrogSkin(customId, false); } catch (_) {}
  try { window.RibbitRaceRefreshRuntimeFromStorage?.(); } catch (_) {}
  return true;
}

function rr14IsHumanPvpIndex(index) {
  const i = Number(index);
  try {
    const snap = rr14Snapshot();
    if (snap.onlineVersus) {
      const own = Number(game?.onlinePlayerIndex ?? game?.localPlayerIndex ?? game?.pvpLocalIndex);
      return Number.isFinite(own) ? i === own : true;
    }
    const cpu = Boolean(game?.pvpCpuEnabled ?? game?.pvpCpu ?? false);
    return cpu ? i === 0 : (i === 0 || i === 1);
  } catch (_) { return i === 0 || i === 1; }
}
function rr14PersistPreferredSkin(id) {
  if (!id || !/^(?:azure|crimson|plum|forest|violet|silver|blossom|ember|custom[1-3])$/.test(id)) return;
  localStorage.setItem("ribbitRaceSelectedSkinV1", id);
  for (let i=0;i<localStorage.length;i++) {
    const key=localStorage.key(i); if (/selected.*skin|equipped.*frog|frog.*selected/i.test(key||"")) {
      const old=localStorage.getItem(key); if (old && old.trim().startsWith("{")) continue; localStorage.setItem(key,id);
    }
  }
}
function rr14PreferSelectedSkin() {
  const preferred = localStorage.getItem("ribbitRaceSelectedSkinV1") || rr14CurrentSkin();
  rr14PersistPreferredSkin(preferred);
  try {
    if (Array.isArray(game?.pvpSkinIds)) game.pvpSkinIds[0] = preferred;
    if (Array.isArray(game?.versusSkinIds)) game.versusSkinIds[0] = preferred;
    if ("onlineSkinId" in (game||{})) game.onlineSkinId = preferred;
    if ("setupSkinFocusId" in (game||{})) game.setupSkinFocusId = preferred;
  } catch (_) {}
}

function rr14HatIds() {
  try {
    if (typeof CUSTOM_HAT_OPTIONS !== "undefined" && Array.isArray(CUSTOM_HAT_OPTIONS)) {
      return CUSTOM_HAT_OPTIONS.map((hat) => hat?.id).filter(Boolean);
    }
    const catalog = (typeof HAT_CATALOG !== "undefined" && HAT_CATALOG) ||
      (typeof HATS !== "undefined" && HATS) ||
      (typeof HAT_DEFS !== "undefined" && HAT_DEFS) ||
      (typeof FROG_HATS !== "undefined" && FROG_HATS) || null;
    if (Array.isArray(catalog)) return catalog.map(x => typeof x === "string" ? x : (x?.id || x?.key)).filter(Boolean);
    if (catalog && typeof catalog === "object") return Object.keys(catalog);
  } catch (_) {}
  return [];
}
function rr14OnlineActive() {
  try { return Boolean((typeof OnlineVersus !== "undefined") && (OnlineVersus.isActive?.() || OnlineVersus.isPlaying?.() || OnlineVersus.isSpectating?.())); } catch (_) { return false; }
}
window.RibbitRaceRuntimeBridge = Object.freeze({
  version: RIBBIT_FRIENDS_DISPLAY_VERSION,
  build: RIBBIT_FRIENDS_BUILD,
  snapshot: rr14Snapshot,
  state: rr14GameState,
  canvas: () => canvas,
  currentSkin: rr14CurrentSkin,
  currentLevel: rr14CurrentLevel,
  skinIds: () => { try { return Object.keys(FROG_SKINS || {}); } catch (_) { return []; } },
  hatIds: rr14HatIds,
  palette: rr14SkinPalette,
  activeCustomId: rr14ActiveCustomId,
  applyPalette: rr14ApplyPalette,
  commitRgbEditor: rr14CommitRgbEditor,
  preferSelectedSkin: rr14PreferSelectedSkin,
  isHumanPvpIndex: rr14IsHumanPvpIndex,
  persistPreferredSkin: rr14PersistPreferredSkin,
  dispatchKey(code, down) {
    window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", {code,key:code,bubbles:true,cancelable:true}));
  }
});

let rr14PreviousState = rr14GameState();
let rr14PreviousSnapshot = rr14Snapshot();
function rr14RuntimeMonitor() {
  const snap=rr14Snapshot();
  if (snap.state !== rr14PreviousState) {
    if (/versus|pvp|online|quick/i.test(snap.state)) rr14PreferSelectedSkin();
    if (/versus|pvp|online|quick/i.test(snap.state)) {
      try {
        const own = Array.isArray(game?.pvpSkinIds) ? game.pvpSkinIds[0] : (game?.onlineSkinId || rr14CurrentSkin());
        rr14PersistPreferredSkin(String(own || rr14CurrentSkin()));
      } catch (_) {}
    }
    if (/won|victory|complete/i.test(snap.state) && !/won|victory|complete/i.test(rr14PreviousState)) {
      if ((snap.localVersus || snap.onlineVersus) && (snap.matchWinnerIndex === 0 || snap.matchWinnerIndex === 1)) {
        window.dispatchEvent(new CustomEvent("ribbit-pvp-match-finished",{detail:{...snap,human:rr14IsHumanPvpIndex(snap.matchWinnerIndex),ownWon:snap.matchWinnerIndex===snap.ownPlayerIndex}}));
      } else {
        window.dispatchEvent(new CustomEvent("ribbit-solo-finished",{detail:snap}));
      }
    }
    rr14PreviousState=snap.state;
  }
  rr14PreviousSnapshot=snap;
  setTimeout(rr14RuntimeMonitor, 120);
}
setTimeout(rr14RuntimeMonitor, 120);
