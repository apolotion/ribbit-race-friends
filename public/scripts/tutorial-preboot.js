// First-paint tutorial handoff. Runs synchronously immediately after <body>.
(() => {
  "use strict";
  try {
    const requested = new URLSearchParams(location.search).get("tutorial") || "";
    const signupForced = sessionStorage.getItem('rrForceSoloTutorialAfterSignup') === '1';
    const forced = /^(?:solo|pvp)$/i.test(requested) || signupForced;
    const alreadyTrained = localStorage.getItem("rrFriendsEngineTutorialSoloSeenV8") === "true";
    if (!forced && alreadyTrained) document.body.classList.remove("rr-tutorial-pending");
  } catch (_) {}
})();
