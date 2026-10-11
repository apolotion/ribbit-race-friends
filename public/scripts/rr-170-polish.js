
(() => {
  "use strict";

  const qs = (s, root=document) => root.querySelector(s);
  const gameFrame = () => qs("#game-frame") || qs("main");
  const gameCanvas = () => qs("#game");
  const root = document.createElement("div");
  root.id = "rr170-overlay-root";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, {once:true});
    else fn();
  }

  function hooks() { return window.RibbitRaceV170 || null; }
  function state() { return String(hooks()?.state || "").toLowerCase(); }
  function mode() { return String(hooks()?.mode || "").toLowerCase(); }
  function mobile() { return Boolean(hooks()?.mobile); }
  function playing() {
    const s = `${state()} ${mode()}`;
    return /playing|countdown|versus|pvp|online|quickplay|spectat|round/.test(s) &&
      !/menu|select|custom|achievement|leaderboard|tag/.test(s);
  }
  function versus() {
    return Boolean(hooks()?.versus) || /versus|pvp|online|quickplay|spectat/.test(`${state()} ${mode()}`);
  }
  function humanLocalVersus() {
    const ps = hooks()?.players || [];
    return versus() && ps.length >= 2 && ps.every(p => p && !p.cpu && !p.isCpu && p.control !== "cpu");
  }
  function achievementMenu() {
    return /achievement/.test(`${state()} ${mode()}`);
  }
  function hatMenu() {
    return /hat/.test(`${state()} ${mode()}`) && /menu|select|custom/.test(`${state()} ${mode()}`);
  }
  function soloSelect() {
    const joined = `${state()} ${mode()}`;
    return /solo|single/.test(joined) && /select|menu|level/.test(joined);
  }
  function versusSelect() {
    const joined = `${state()} ${mode()}`;
    return /versus|pvp/.test(joined) && /select|menu|setup/.test(joined);
  }

  function button(id, label, title) {
    const el = document.createElement("button");
    el.id = id;
    el.className = "rr170-button";
    el.type = "button";
    el.textContent = label;
    el.title = title || "";
    el.setAttribute("aria-label", title || label);
    return el;
  }

  function tooltipFor(el, text) {
    const tip = document.createElement("div");
    tip.className = "rr170-tooltip";
    tip.textContent = text;
    tip.hidden = true;
    root.appendChild(tip);
    const show = () => {
      const a = el.getBoundingClientRect();
      const b = gameFrame().getBoundingClientRect();
      tip.style.left = `${((a.left+a.width/2-b.left)/b.width)*100}%`;
      tip.style.top = `${Math.max(2, ((a.top-b.top)/b.height)*100 - 5)}%`;
      tip.hidden = false;
    };
    const hide = () => { tip.hidden = true; };
    el.addEventListener("pointerenter", show);
    el.addEventListener("pointerleave", hide);
    el.addEventListener("focus", show);
    el.addEventListener("blur", hide);
    return tip;
  }

  function activateOnRelease(el, action) {
    const active = new Set();
    el.addEventListener("pointerdown", event => {
      event.preventDefault();
      active.add(event.pointerId);
      el.setPointerCapture?.(event.pointerId);
      el.classList.add("rr170-selected");
    });
    const finish = event => {
      if (!active.has(event.pointerId)) return;
      event.preventDefault();
      active.delete(event.pointerId);
      el.classList.remove("rr170-selected");
      action(event);
    };
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", event => {
      active.delete(event.pointerId);
      el.classList.remove("rr170-selected");
    });
    el.addEventListener("click", event => {
      if (event.pointerType) return;
      action(event);
    });
  }

  function installAccountModal() {
    const panel = qs("#cloud-account-panel");
    if (!panel) return;
    const sync = () => document.body.classList.toggle("rr-account-modal-open", !panel.hidden);
    new MutationObserver(sync).observe(panel, {attributes:true, attributeFilter:["hidden"]});
    sync();

    // A centered close button makes the modal self-contained.
    if (!panel.querySelector(".rr170-account-close")) {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "rr170-account-close";
      close.textContent = "CLOSE";
      close.style.cssText = "width:100%;margin-top:10px;padding:8px;border:3px solid #26363d;background:#fff;font:700 14px 'Courier New',monospace";
      close.addEventListener("click", () => { panel.hidden = true; sync(); });
      panel.appendChild(close);
    }

    // Guest accounts can convert the in-memory save at any time.
    const guestButton = qs("#cloud-account-button");
    const isGuest = () => /guest/i.test(guestButton?.textContent || "") ||
      /guest/i.test(qs("#cloud-account-name")?.textContent || "");
    const ensureConvert = () => {
      let convert = panel.querySelector("#rr170-create-account-keep-save");
      if (isGuest()) {
        if (!convert) {
          convert = document.createElement("button");
          convert.id = "rr170-create-account-keep-save";
          convert.type = "button";
          convert.textContent = "CREATE ACCOUNT & KEEP SAVE";
          convert.style.cssText = "width:100%;margin-top:8px;padding:9px;border:3px solid #26363d;background:#b8f5dc;font:700 13px 'Courier New',monospace";
          convert.addEventListener("click", () => {
            try {
              const save = {};
              for (let i=0;i<localStorage.length;i++) {
                const key = localStorage.key(i);
                if (/^(ribbitRace|oneButtonFrog)/.test(key)) save[key] = localStorage.getItem(key);
              }
              sessionStorage.setItem("ribbitRacePendingGuestMigrationV1", JSON.stringify(save));
            } catch (_) {}
            panel.hidden = true;
            document.body.classList.remove("rr-account-modal-open");
            qs("#cloud-gate")?.removeAttribute("hidden");
            qs("#cloud-show-create")?.click();
          });
          panel.insertBefore(convert, panel.firstChild);
        }
      } else convert?.remove();
    };
    new MutationObserver(ensureConvert).observe(panel, {subtree:true, childList:true, characterData:true, attributes:true});
    ensureConvert();

    // Retain guest progress if they attempt to close before creating an account.
    window.addEventListener("beforeunload", event => {
      if (!isGuest()) return;
      try {
        const save = {};
        for (let i=0;i<localStorage.length;i++) {
          const key = localStorage.key(i);
          if (/^(ribbitRace|oneButtonFrog)/.test(key)) save[key] = localStorage.getItem(key);
        }
        sessionStorage.setItem("ribbitRacePendingGuestMigrationV1", JSON.stringify(save));
      } catch (_) {}
      event.preventDefault();
      event.returnValue = "";
    });
  }

  function installOverlayControls() {
    gameFrame()?.appendChild(root);

    const pause = button("rr170-pause", "Ⅱ", "PAUSE");
    pause.hidden = true;
    pause.addEventListener("click", () => hooks()?.pause?.());
    root.appendChild(pause);
    tooltipFor(pause, "PAUSE");

    const medal = button("rr170-achievement-leaderboard", "🏅", "OPEN LEADERBOARD");
    medal.hidden = true;
    activateOnRelease(medal, () => qs("#cloud-leaderboard")?.click());
    root.appendChild(medal);
    tooltipFor(medal, "OPEN LEADERBOARD");

    const hatHover = button("rr170-hat-hover-target", "", "STYLE LOCKED");
    hatHover.hidden = true;
    root.appendChild(hatHover);
    tooltipFor(hatHover, "STYLE LOCKED — COMPLETE THIS HAT'S CHALLENGE");

    // Entire bottom halves are live touch zones in two-player mobile Versus.
    const left = document.createElement("div");
    left.id = "rr170-touch-left";
    left.hidden = true;
    const right = document.createElement("div");
    right.id = "rr170-touch-right";
    right.hidden = true;
    root.append(left,right);

    const pointerOwners = new Map();
    const wireZone = (zone,index) => {
      zone.addEventListener("pointerdown", event => {
        if (!mobile() || !playing()) return;
        event.preventDefault();
        pointerOwners.set(event.pointerId,index);
        zone.setPointerCapture?.(event.pointerId);
        hooks()?.charge?.(index,true);
      });
      const release = event => {
        const owner = pointerOwners.get(event.pointerId);
        if (owner === undefined) return;
        event.preventDefault();
        pointerOwners.delete(event.pointerId);
        hooks()?.charge?.(owner,false);
      };
      zone.addEventListener("pointerup", release);
      zone.addEventListener("pointercancel", release);
      zone.addEventListener("lostpointercapture", release);
    };
    wireZone(left,0); wireZone(right,1);

    // Mobile vs CPU and Solo: holding almost anywhere in the game world charges.
    const canvas = gameCanvas();
    const screenOwners = new Set();
    canvas?.addEventListener("pointerdown", event => {
      if (!mobile() || !playing() || humanLocalVersus()) return;
      // Let explicit UI controls win.
      const r = canvas.getBoundingClientRect();
      const y = (event.clientY-r.top)/r.height;
      if (y < .84 && !versus()) {
        event.preventDefault();
        screenOwners.add(event.pointerId);
        canvas.setPointerCapture?.(event.pointerId);
        hooks()?.charge?.(0,true);
      } else if (versus() && y < .84) {
        event.preventDefault();
        screenOwners.add(event.pointerId);
        canvas.setPointerCapture?.(event.pointerId);
        hooks()?.charge?.(0,true);
      }
    }, {passive:false});
    const screenRelease = event => {
      if (!screenOwners.has(event.pointerId)) return;
      event.preventDefault();
      screenOwners.delete(event.pointerId);
      hooks()?.charge?.(0,false);
    };
    canvas?.addEventListener("pointerup", screenRelease, {passive:false});
    canvas?.addEventListener("pointercancel", screenRelease, {passive:false});

    // Prevent browser callouts/context menus.
    ["contextmenu","selectstart","dragstart","gesturestart","gesturechange","gestureend"].forEach(type => {
      canvas?.addEventListener(type, event => event.preventDefault(), {passive:false});
    });

    function update() {
      const isPlay = playing();
      const isVs = versus();
      pause.hidden = !(isPlay && isVs);
      pause.classList.toggle("rr170-versus", isVs);
      const inTutorial = tutorialActive();
      medal.hidden = inTutorial || !achievementMenu();
      hatHover.hidden = inTutorial || !hatMenu();
      const two = mobile() && isPlay && humanLocalVersus();
      left.hidden = !two; right.hidden = !two;
      document.body.classList.toggle("rr-mobile-mode", mobile());
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function installSpectatorPresentation() {
    let lastWinner = "";
    let overlay = null;
    function frame() {
      const h=hooks(), g=h?.game, spectator=h?.spectator;
      const onlineRound = /online|quickplay|spectat/.test(`${h?.state||""} ${h?.mode||""}`.toLowerCase());
      if (spectator || onlineRound) {
        // Remove the old delayed-replay footer if it is a DOM element.
        document.querySelectorAll("*").forEach(el => {
          if (el.children.length===0 && /DELAYED VIEW|LEFT SHIFT|RIGHT SHIFT/i.test(el.textContent||"")) {
            if (/DELAYED VIEW/.test(el.textContent||"")) el.style.display="none";
          }
        });
        const winnerIndex=Number(g?.pvpRoundWinnerIndex??g?.roundWinnerIndex??g?.winnerIndex??-1);
        const winner=String(g?.roundWinnerName || g?.winnerName || (winnerIndex>=0?h?.playerName?.(winnerIndex):""));
        const signature=`${g?.pvpRoundIndex||g?.round||""}:${winner}:${g?.pvpRoundWinnerIndex??""}`;
        if(winner && signature!==lastWinner){
          lastWinner=signature;
          overlay?.remove();
          overlay=document.createElement("div");
          overlay.className="rr170-round-overlay";
          const scores=g?.pvpRoundWins || g?.roundWins || [];
          overlay.innerHTML=`<strong>${winner.toUpperCase()} WINS ROUND</strong><br><span>${Number(scores[0]||0)} 👑 — 👑 ${Number(scores[1]||0)}</span>`;
          root.appendChild(overlay);
          setTimeout(()=>overlay?.remove(),3200);
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }


  function tutorialActive() {
    return Boolean(window.RibbitRaceTutorialEngine?.active);
  }

  function mainMenuActive() {
    if (tutorialActive()) return false;
    const joined = `${state()} ${mode()}`;
    return /menu|home|main/.test(joined) &&
      !/online|versus|pvp|single|solo|level|achievement|custom|tag|leader/.test(joined);
  }

  function installMainMenuIcons() {
    const account = button("rr170-account-icon", "", "ACCOUNT • SAVES • RECORDS");
    account.innerHTML = `<span><span class="rr170-avatar-head"></span><span class="rr170-avatar-body"></span></span>`;
    account.hidden = true;
    activateOnRelease(account, () => {
      const panel = qs("#cloud-account-panel");
      if (panel) {
        panel.hidden = false;
        document.body.classList.add("rr-account-modal-open");
      }
    });
    root.appendChild(account);
    tooltipFor(account, "ACCOUNT • SAVES • RECORDS");

    const device = button("rr170-device-icon", "", "SWITCH CONTROL MODE");
    device.innerHTML = `<span class="rr170-device-symbol">▣</span>`;
    device.hidden = true;
    activateOnRelease(device, () => {
      const enabling = !mobile();
      const accepted = window.confirm(enabling
        ? "TURN ON MOBILE MODE?\n\nUse touch controls and mobile instructions."
        : "TURN ON COMPUTER MODE?\n\nUse keyboard and mouse controls.");
      if (!accepted) return;
      try { localStorage.setItem("ribbitRaceMobileModeV1", enabling ? "true" : "false"); } catch (_) {}
      try {
        if (typeof window.RibbitRaceSetMobileMode === "function") window.RibbitRaceSetMobileMode(enabling);
        else window.dispatchEvent(new CustomEvent("ribbit:mobile-mode", {detail:{enabled:enabling}}));
      } catch (_) {}
      document.body.classList.toggle("rr-mobile-mode", enabling);
      if (enabling) {
        const mobileHelp = qs("#cloud-mobile-help") || qs('[id*="mobile"][id*="help"]');
        mobileHelp?.removeAttribute("hidden");
      }
      setTimeout(() => location.reload(), 80);
    });
    root.appendChild(device);
    const deviceTip = tooltipFor(device, "SWITCH TO MOBILE MODE");

    function update() {
      const show = mainMenuActive() && !tutorialActive();
      account.hidden = !show;
      device.hidden = !show;
      deviceTip.textContent = mobile() ? "SWITCH TO COMPUTER MODE" : "SWITCH TO MOBILE MODE";
      device.querySelector(".rr170-device-symbol").textContent = mobile() ? "▰" : "▣";
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function firstBootTutorial() {
    const gate=qs("#cloud-gate");
    const requested=(()=>{try{return new URLSearchParams(location.search).get("tutorial")||"";}catch(_){return "";}})();
    const forcedKind=/^pvp$/i.test(requested)?"pvp":/^solo$/i.test(requested)?"solo":"";
    let starting=false;
    let finished=false;

    const check=()=> {
      if(finished || starting) return;
      const engine=window.RibbitRaceTutorialEngine;
      const canvas=qs("#game");
      const gateOpen=gate && gate.hidden !== true;
      const gameReady=Boolean(engine && canvas && Number(canvas.width) > 0 && Number(canvas.height) > 0);
      if(gateOpen || !gameReady){setTimeout(check,250);return;}
      if(!forcedKind && engine.seen("solo")){finished=true;return;}

      starting=true;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        try {
          const started=engine.start(forcedKind||"solo");
          finished=Boolean(started || engine.active);
        } catch (error) {
          console.warn("Ribbit Race tutorial auto-start retry", error);
          finished=false;
        }
        starting=false;
        if(!finished)setTimeout(check,250);
      }));
    };

    window.addEventListener("rr-authenticated",()=>setTimeout(check,60));
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)setTimeout(check,60);});
    setTimeout(check,250);
  }

  ready(() => {
    installAccountModal();
    installOverlayControls();
    installMainMenuIcons();
    installSpectatorPresentation();
    firstBootTutorial();
  });
})();
