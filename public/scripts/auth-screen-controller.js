"use strict";

/**
 * Owns the boundary between the authentication screen and the game runtime.
 * No gameplay module manipulates auth visibility or document navigation directly.
 */
class AuthScreenController {
  constructor() {
    this.body = document.body;
    this.gameFrame = document.getElementById("game-frame");
    this.removeTransientSignOutMarker();
  }

  setLocked(locked) {
    const isLocked = Boolean(locked);
    this.body.classList.toggle("ribbit-auth-locked", isLocked);
    if (!this.gameFrame) return;
    if (isLocked) {
      this.gameFrame.setAttribute("inert", "");
      this.gameFrame.setAttribute("aria-hidden", "true");
      try { window.RibbitRaceSuspendForLogin?.(); }
      catch (error) { console.warn("Friends login suspend skipped", error); }
      if (this.gameFrame.contains(document.activeElement)) {
        try { document.activeElement?.blur?.(); } catch (_) {}
      }
    } else {
      this.gameFrame.removeAttribute("inert");
      this.gameFrame.removeAttribute("aria-hidden");
    }
  }

  reloadToInitialLogin() {
    const target = new URL(window.location.href);
    target.hash = "";
    target.search = "";
    target.searchParams.set("signedOut", "1");
    window.location.replace(target.href);
  }

  removeTransientSignOutMarker() {
    const current = new URL(window.location.href);
    if (!current.searchParams.has("signedOut")) return;
    current.searchParams.delete("signedOut");
    const clean = `${current.pathname}${current.search}${current.hash}`;
    window.history.replaceState(null, "", clean || "/");
  }
}

window.AuthScreenController = AuthScreenController;
window.RibbitAuthScreen = new AuthScreenController();
