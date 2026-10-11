// First-paint tutorial handoff. Runs synchronously immediately after <body>.
(() => {
  "use strict";
  try {
    const requested = new URLSearchParams(location.search).get("tutorial") || "";
    const forced = /^(?:solo|pvp)$/i.test(requested);
    const alreadyTrained = localStorage.getItem("rrFriendsEngineTutorialSoloSeenV7") === "true";
    if (!forced && alreadyTrained) document.body.classList.remove("rr-tutorial-pending");
  } catch (_) {}
})();
