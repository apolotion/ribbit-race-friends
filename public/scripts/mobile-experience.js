"use strict";

(() => {
  const STORAGE_KEY = "rrFriendsMobileModeV1";
  const HELP_SEEN_KEY = "rrFriendsMobileInstallHelpSeenV1";
  const body = document.body;
  const dialog = document.getElementById("rr-mobile-dialog");
  const title = document.getElementById("rr-mobile-dialog-title");
  const message = document.getElementById("rr-mobile-dialog-message");
  const steps = document.getElementById("rr-mobile-dialog-steps");
  const confirmButton = document.getElementById("rr-mobile-dialog-confirm");
  const cancelButton = document.getElementById("rr-mobile-dialog-cancel");
  const loginHelpButton = document.getElementById("cloud-mobile-help");
  let pendingMode = null;

  function readEnabled() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; }
    catch (_) { return false; }
  }

  function isStandalone() {
    return Boolean(window.navigator.standalone || window.matchMedia?.("(display-mode: standalone)")?.matches);
  }

  function syncBody() {
    const enabled = readEnabled();
    body.classList.toggle("rr-mobile-enabled", enabled);
    body.classList.toggle("rr-standalone", isStandalone());
    return enabled;
  }

  function closeDialog() {
    if (dialog) dialog.hidden = true;
    pendingMode = null;
  }

  function setDialog({ heading, copy, showSteps = false, confirmLabel = "GOT IT", cancelLabel = "CLOSE", onConfirm = null }) {
    if (!dialog) return;
    title.textContent = heading;
    message.textContent = copy;
    steps.hidden = !showSteps;
    confirmButton.textContent = confirmLabel;
    cancelButton.textContent = cancelLabel;
    confirmButton.onclick = () => {
      const action = onConfirm;
      closeDialog();
      action?.();
    };
    cancelButton.onclick = closeDialog;
    dialog.hidden = false;
    confirmButton.focus({ preventScroll: true });
  }

  function showInstallHelp() {
    const standalone = isStandalone();
    setDialog({
      heading: standalone ? "MOBILE APP MODE IS READY" : "PLAYING ON IPHONE?",
      copy: standalone
        ? "Ribbit Race is already running from your Home Screen. Rotate your phone sideways for the largest play area."
        : "For the best full-screen experience, add Ribbit Race to your iPhone Home Screen.",
      showSteps: !standalone,
      confirmLabel: "GOT IT",
      cancelLabel: "CLOSE"
    });
    try { localStorage.setItem(HELP_SEEN_KEY, "1"); } catch (_) {}
  }

  function applyMode(enabled, showHelp = true) {
    try { localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0"); } catch (_) {}
    syncBody();
    window.dispatchEvent(new CustomEvent("ribbit-mobile-mode-changed", { detail: { enabled } }));
    if (enabled && showHelp) setTimeout(showInstallHelp, 80);
  }

  function requestToggle() {
    const next = !readEnabled();
    pendingMode = next;
    setDialog({
      heading: next ? "TURN ON MOBILE MODE?" : "TURN ON COMPUTER MODE?",
      copy: next
        ? "Mobile Mode replaces keyboard instructions with touch controls and adds hold-and-release jump meters."
        : "Computer Mode restores keyboard instructions and standard desktop controls.",
      showSteps: false,
      confirmLabel: next ? "TURN ON MOBILE MODE" : "TURN ON COMPUTER MODE",
      cancelLabel: "CANCEL",
      onConfirm: () => applyMode(next, next)
    });
  }


  function isGameCanvasTarget(target) {
    const canvas = document.getElementById("game");
    return Boolean(canvas && target === canvas);
  }

  function blockNativeCanvasGesture(event) {
    if (!readEnabled() || !isGameCanvasTarget(event.target)) return;
    event.preventDefault();
  }

  function openAccount() {
    const accountButton = document.getElementById("cloud-account-button");
    const accountPanel = document.getElementById("cloud-account-panel");
    if (!accountButton || !accountPanel) return;
    accountButton.click();
  }

  loginHelpButton?.addEventListener("click", (event) => {
    event.preventDefault();
    showInstallHelp();
  });
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (dialog?.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (event.key === "Escape") closeDialog();
  }, true);
  window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change", syncBody);

  // iPhone Safari otherwise displays its text-selection magnifier/callout after
  // a long hold. The game uses pointer events for its controls, so suppressing
  // the native touch gesture on the canvas does not remove Ribbit Race input.
  document.addEventListener("touchstart", blockNativeCanvasGesture, { capture: true, passive: false });
  document.addEventListener("touchmove", blockNativeCanvasGesture, { capture: true, passive: false });
  document.addEventListener("gesturestart", blockNativeCanvasGesture, { capture: true, passive: false });
  document.addEventListener("contextmenu", blockNativeCanvasGesture, { capture: true, passive: false });
  document.addEventListener("selectstart", blockNativeCanvasGesture, { capture: true, passive: false });
  document.addEventListener("dragstart", blockNativeCanvasGesture, { capture: true, passive: false });

  syncBody();

  window.RibbitMobileExperience = Object.freeze({
    enabled: readEnabled,
    isStandalone,
    requestToggle,
    setEnabled: applyMode,
    showInstallHelp,
    openAccount,
    sync: syncBody
  });
})();
