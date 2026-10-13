// Ribbit Race Friends 1.6.0 — canvas-native mobile controls and menu actions.
// This module intentionally owns touch routing so one pointer can never release
// another player's held jump button on a shared touchscreen.

const RR_MOBILE_MENU_UI = Object.freeze({
  avatar: Object.freeze({ x: 47, y: 211, w: 24, h: 24 }),
  device: Object.freeze({ x: 74, y: 211, w: 24, h: 24 })
});
const RR_MOBILE_SOLO_METER = Object.freeze({ x: 8, y: 234, w: 140, h: 32 });
const RR_MOBILE_PVP_METERS = Object.freeze([
  Object.freeze({ x: 8, y: 234, w: 136, h: 32 }),
  Object.freeze({ x: W - 144, y: 234, w: 108, h: 32 })
]);
const rrMobileHeldPointers = new Map();
let rrMobileMenuHover = null;

function rrMobileEnabled() {
  return isRibbitMobileMode();
}

function rrDrawFramedIconButton(rect, active, drawIcon) {
  const skin = getSelectedSkin();
  ctx.fillStyle = "rgba(25,43,52,0.28)";
  ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
  ctx.fillStyle = active ? skin.dark : COLORS.ink;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = active ? mixHexColors(skin.belly, "#ffffff", 0.18) : "#f7fdff";
  ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
  drawIcon(rect, skin, active);
  if (active) {
    ctx.fillStyle = COLORS.white;
    [[3,3],[rect.w-5,3],[3,rect.h-5],[rect.w-5,rect.h-5]].forEach(([dx,dy]) =>
      ctx.fillRect(rect.x + dx, rect.y + dy, 2, 2)
    );
  }
}

function rrDrawAvatarIcon(rect, skin) {
  const cx = Math.round(rect.x + rect.w / 2);
  ctx.fillStyle = skin.dark;
  ctx.fillRect(cx - 3, rect.y + 5, 6, 6);
  ctx.fillRect(cx - 7, rect.y + 12, 14, 7);
  ctx.fillStyle = skin.light;
  ctx.fillRect(cx - 1, rect.y + 6, 2, 2);
  ctx.fillRect(cx - 5, rect.y + 13, 10, 2);
}

function rrDrawDeviceIcon(rect, skin) {
  const mobile = rrMobileEnabled();
  ctx.fillStyle = skin.dark;
  if (mobile) {
    ctx.fillRect(rect.x + 8, rect.y + 4, 9, 16);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(rect.x + 10, rect.y + 6, 5, 10);
    ctx.fillStyle = skin.light;
    ctx.fillRect(rect.x + 11, rect.y + 17, 3, 1);
  } else {
    ctx.fillRect(rect.x + 4, rect.y + 6, 16, 11);
    ctx.fillRect(rect.x + 10, rect.y + 17, 4, 2);
    ctx.fillRect(rect.x + 7, rect.y + 19, 10, 2);
    ctx.fillStyle = "#f7fdff";
    ctx.fillRect(rect.x + 6, rect.y + 8, 12, 7);
    ctx.fillStyle = skin.light;
    ctx.fillRect(rect.x + 7, rect.y + 9, 10, 2);
  }
}

function rrDrawMobileMenuTooltip() {
  // Polish 13: the shared speech-bubble renderer owns these tooltips. Keeping
  // this legacy helper silent prevents a second blank white box from appearing.
  return;
}

const rrOriginalDrawMainMenuScreen = drawMainMenuScreen;
drawMainMenuScreen = function() {
  rrOriginalDrawMainMenuScreen();
  rrDrawFramedIconButton(RR_MOBILE_MENU_UI.avatar, rrMobileMenuHover === "avatar", rrDrawAvatarIcon);
  rrDrawFramedIconButton(RR_MOBILE_MENU_UI.device, rrMobileMenuHover === "device", rrDrawDeviceIcon);
  rrDrawMobileMenuTooltip();
};

function rrDrawMobileJumpMeter(rect, player, palette, label, interactive = true) {
  const held = Boolean(player?.charging || player?.inputHeld || (player === frog && game.buttonHeld));
  const fill = held ? clamp(Number(player?.charge) || 0, 0, 1) : 0;
  ctx.fillStyle = "rgba(25,43,52,0.35)";
  ctx.fillRect(rect.x + 2, rect.y + 2, rect.w, rect.h);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = palette.belly;
  ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
  const innerX = rect.x + 5, innerY = rect.y + 5, innerW = rect.w - 10, innerH = rect.h - 10;
  ctx.fillStyle = mixHexColors(palette.belly, "#ffffff", 0.16);
  ctx.fillRect(innerX, innerY, innerW, innerH);
  if (fill > 0) {
    const gradient = ctx.createLinearGradient(innerX, 0, innerX + innerW, 0);
    gradient.addColorStop(0, palette.light);
    gradient.addColorStop(0.68, palette.mid);
    gradient.addColorStop(1, palette.dark);
    ctx.fillStyle = gradient;
    ctx.fillRect(innerX, innerY, Math.max(1, Math.floor(innerW * fill)), innerH);
  }
  const text = held && interactive ? "RELEASE TO JUMP" : label;
  drawBitmapText(text, rect.x + rect.w / 2, rect.y + 11, text.length > 15 ? 0.62 : 0.78, "center", COLORS.white, COLORS.ink);
  if (interactive) {
    ctx.fillStyle = palette.light;
    ctx.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, 2);
  }
}

const rrOriginalDrawHud = drawHud;
drawHud = function() {
  rrOriginalDrawHud();
  if (!rrMobileEnabled()) return;
  rrDrawMobileJumpMeter(RR_MOBILE_SOLO_METER, frog, getSelectedSkin(), "HOLD TO CHARGE", true);
};

function rrDrawMobilePauseButton() {
      if (game.mode === "pvp") return;
  const pause = HUD_UI.pauseButton;
  const skin = game.mode === "pvp"
    ? getPvpSkinPalette(pvpPlayers[OnlineVersus.isActive() ? OnlineVersus.localIndex() : 0]?.skinId, "azure", 0)
    : getSelectedSkin();
  ctx.save();
  ctx.globalAlpha = game.state === "paused" ? 0.84 : 0.56;
  ctx.fillStyle = "rgba(38,54,61,0.45)";
  ctx.fillRect(pause.x + 2, pause.y + 2, pause.w, pause.h);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(pause.x, pause.y, pause.w, pause.h);
  ctx.fillStyle = skin.belly;
  ctx.fillRect(pause.x + 2, pause.y + 2, pause.w - 4, pause.h - 4);
  ctx.fillStyle = skin.dark;
  ctx.fillRect(pause.x + 7, pause.y + 5, 4, 9);
  ctx.fillRect(pause.x + 15, pause.y + 5, 4, 9);
  ctx.restore();
}

const rrOriginalDrawPvpHud = drawPvpHud;
drawPvpHud = function() {
  rrOriginalDrawPvpHud();
  if (!rrMobileEnabled()) return;
  const local = OnlineVersus.isActive() ? OnlineVersus.localIndex() : 0;
  for (let index = 0; index < 2; index += 1) {
    const palette = getPvpSkinPalette(pvpPlayers[index].skinId, index === 0 ? "azure" : "crimson", index);
    const interactive = OnlineVersus.isActive()
      ? index === local
      : game.pvpCpuEnabled ? index === 0 : true;
    const label = OnlineVersus.isActive()
      ? (interactive ? "HOLD TO CHARGE" : (window.RibbitOpponentName?.() || "OPPONENT"))
      : game.pvpCpuEnabled
        ? (index === 0 ? "HOLD TO CHARGE" : `CPU LV ${game.pvpCpuDifficulty}`)
        : `P${index + 1} JUMP`;
    rrDrawMobileJumpMeter(RR_MOBILE_PVP_METERS[index], pvpPlayers[index], palette, label, interactive);
  }
  rrDrawMobilePauseButton();
};

function rrStopMobilePointerEvent(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function rrBeginMobileJump(event, kind, index = 0) {
  rrMobileHeldPointers.set(event.pointerId, { kind, index });
  try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
  if (kind === "solo") pressMainButton();
  else if (kind === "online") OnlineVersus.handleControlDown({ code: "PointerJump", preventDefault(){}, stopPropagation(){} });
  else pressPvpButton(index, "human");
}

function rrReleaseMobileJump(event) {
  const held = rrMobileHeldPointers.get(event.pointerId);
  if (!held) return false;
  rrMobileHeldPointers.delete(event.pointerId);
  if (held.kind === "solo") releaseMainButton();
  else if (held.kind === "online") OnlineVersus.handleControlUp({ code: "PointerJump", preventDefault(){}, stopPropagation(){} });
  else releasePvpButton(held.index, "human");
  return true;
}

function rrReleaseAllMobilePointers() {
      if (game.mode === "pvp") return;
  for (const pointerId of [...rrMobileHeldPointers.keys()]) {
    rrReleaseMobileJump({ pointerId });
  }
  rrMobileHeldPointers.clear();
}

window.addEventListener("pointerdown", (event) => {
  if (friendsGameInputLocked() || event.target !== canvas) return;
  const point = getCanvasPoint(event);

  if (game.state === "main") {
    if (pointInsideRect(point, RR_MOBILE_MENU_UI.avatar)) {
      rrStopMobilePointerEvent(event);
      window.RibbitMobileExperience?.openAccount?.();
      return;
    }
    if (pointInsideRect(point, RR_MOBILE_MENU_UI.device)) {
      rrStopMobilePointerEvent(event);
      window.RibbitMobileExperience?.requestToggle?.();
      return;
    }
  }

  if (!rrMobileEnabled()) return;

  if ((game.state === "playing" || game.state === "countdown") && pointInsideRect(point, HUD_UI.pauseButton)) {
    rrStopMobilePointerEvent(event);
    pauseGame();
    return;
  }

  if (game.state !== "playing") return;

  if (game.mode === "solo") {
    rrStopMobilePointerEvent(event);
    if (pointInsideRect(point, RR_MOBILE_SOLO_METER)) rrBeginMobileJump(event, "solo", 0);
    return;
  }

  if (game.mode === "pvp") {
    rrStopMobilePointerEvent(event);
    if (OnlineVersus.isActive()) {
      const local = OnlineVersus.localIndex();
      if (pointInsideRect(point, RR_MOBILE_PVP_METERS[local])) rrBeginMobileJump(event, "online", local);
      return;
    }
    if (pointInsideRect(point, RR_MOBILE_PVP_METERS[0])) rrBeginMobileJump(event, "pvp", 0);
    else if (!game.pvpCpuEnabled && pointInsideRect(point, RR_MOBILE_PVP_METERS[1])) rrBeginMobileJump(event, "pvp", 1);
  }
}, { capture: true, passive: false });

window.addEventListener("pointermove", (event) => {
  if (event.target !== canvas || game.state !== "main") return;
  const point = getCanvasPoint(event);
  rrMobileMenuHover = pointInsideRect(point, RR_MOBILE_MENU_UI.avatar) ? "avatar"
    : pointInsideRect(point, RR_MOBILE_MENU_UI.device) ? "device" : null;
}, { capture: true, passive: true });
window.addEventListener("pointerleave", (event) => {
  if (event.target === canvas) rrMobileMenuHover = null;
}, { capture: true, passive: true });

window.addEventListener("pointerup", (event) => {
  if (!rrReleaseMobileJump(event)) return;
  rrStopMobilePointerEvent(event);
}, { capture: true, passive: false });
window.addEventListener("pointercancel", (event) => {
  if (!rrReleaseMobileJump(event)) return;
  rrStopMobilePointerEvent(event);
}, { capture: true, passive: false });
window.addEventListener("blur", rrReleaseAllMobilePointers);
window.addEventListener("ribbit-pvp-round-ended", rrReleaseAllMobilePointers);
window.addEventListener("ribbit-mobile-mode-changed", () => {
  rrReleaseAllMobilePointers();
  rrMobileMenuHover = null;
});

// Expose geometry to diagnostics and automated touch tests.
window.RibbitRaceMobileDiagnostics = () => ({
  enabled: rrMobileEnabled(),
  renderScale: RENDER_SCALE,
  soloMeter: { ...RR_MOBILE_SOLO_METER },
  pvpMeters: RR_MOBILE_PVP_METERS.map((rect) => ({ ...rect })),
  pauseButton: { ...HUD_UI.pauseButton },
  heldPointers: rrMobileHeldPointers.size
});
