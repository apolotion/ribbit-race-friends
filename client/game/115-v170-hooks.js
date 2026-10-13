
// Ribbit Race Friends 1.7.14 — compatibility hooks, safety guards, and runtime polish.
// This module is bundled last so it can observe the established private game scope.
(() => {
  "use strict";

  const recentCatchKeys = new Map();
  const groundMemory = new WeakMap();
  let closeCallOwnerIndex = -1;
  let closeCallExpiresAt = 0;
  let lastRoundSignature = "";
  let spectatorSmoothedPlayers = null;

  function firstValue(...values) {
    for (const value of values) if (value !== undefined && value !== null) return value;
    return null;
  }

  function gameObject() {
    try {
      return firstValue(
        typeof game !== "undefined" ? game : null,
        typeof gameState !== "undefined" ? gameState : null,
        typeof state !== "undefined" && typeof state === "object" ? state : null,
        window.RibbitRaceGame || null
      );
    } catch (_) { return null; }
  }

  function playerArray() {
    const g = gameObject();
    try {
      const value = firstValue(
        typeof players !== "undefined" ? players : null,
        g && Array.isArray(g.players) ? g.players : null,
        typeof frogs !== "undefined" ? frogs : null
      );
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function flyArray() {
    const g = gameObject();
    try {
      const value = firstValue(
        typeof flies !== "undefined" ? flies : null,
        g && Array.isArray(g.flies) ? g.flies : null
      );
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function stateName() {
    const g = gameObject();
    return String(firstValue(
      g && g.state,
      g && g.screen,
      g && g.phase,
      typeof currentState !== "undefined" ? currentState : null,
      typeof screenState !== "undefined" ? screenState : null,
      ""
    ) || "");
  }

  function modeName() {
    const g = gameObject();
    return String(firstValue(
      g && g.mode,
      g && g.playMode,
      typeof currentMode !== "undefined" ? currentMode : null,
      ""
    ) || "");
  }

  function isMobileMode() {
    try {
      return Boolean(
        (typeof mobileMode !== "undefined" && mobileMode) ||
        gameObject()?.mobileMode ||
        localStorage.getItem("ribbitRaceMobileModeV1") === "true" ||
        document.body.classList.contains("rr-mobile-mode")
      );
    } catch (_) { return false; }
  }

  function isVersus() {
    const joined = `${stateName()} ${modeName()}`.toLowerCase();
    return /versus|pvp|online|quickplay|spectat/.test(joined) ||
      playerArray().length >= 2;
  }

  function isSpectator() {
    const g = gameObject();
    const joined = `${stateName()} ${modeName()} ${g?.onlineRole || ""}`.toLowerCase();
    return /spectat|replay/.test(joined);
  }

  function onlineObject() {
    try {
      return firstValue(
        typeof onlineSession !== "undefined" ? onlineSession : null,
        typeof online !== "undefined" && typeof online === "object" ? online : null,
        gameObject()?.online,
        window.RibbitRaceOnlineSession
      );
    } catch (_) { return null; }
  }

  function localPlayerIndex() {
    const o = onlineObject();
    if (o?.role === "guest" || o?.role === "player2") return 1;
    const g = gameObject();
    const idx = Number(firstValue(g?.activePlayerIndex, g?.localPlayerIndex, 0));
    return Number.isFinite(idx) ? Math.max(0, Math.min(1, idx)) : 0;
  }

  function playerName(index) {
    const g = gameObject();
    const o = onlineObject();
    const ps = playerArray();
    const p = ps[index] || {};
    return String(firstValue(
      p.displayName, p.name,
      index === 0 ? o?.hostName : o?.guestName,
      index === 0 ? g?.player1Name : g?.player2Name,
      index === localPlayerIndex() ? window.RibbitCloud?.getPlayerName?.() : null,
      index === 0 ? "PLAYER 1" : "PLAYER 2"
    ) || (index === 0 ? "PLAYER 1" : "PLAYER 2")).toUpperCase();
  }

  function opponentName() {
    const o = onlineObject();
    const g = gameObject();
    if (o?.cpuIndex >= 0 || g?.cpuTakeover || g?.opponentCpu) return "CPU";
    return playerName(localPlayerIndex() === 0 ? 1 : 0);
  }

  function pause() {
    try {
      if (typeof togglePause === "function") return togglePause();
      if (typeof pauseGame === "function") return pauseGame();
      if (typeof openPauseMenu === "function") return openPauseMenu();
      if (typeof setPaused === "function") return setPaused(true);
    } catch (_) {}
    const canvas = document.getElementById("game");
    canvas?.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", code:"Escape", bubbles:true}));
    window.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", code:"Escape", bubbles:true}));
  }

  function sendKey(code, down) {
    const key = code === "Space" ? " " : code;
    const event = new KeyboardEvent(down ? "keydown" : "keyup", {
      key, code, bubbles:true, cancelable:true
    });
    const canvas = document.getElementById("game");
    canvas?.dispatchEvent(event);
    window.dispatchEvent(event);
    document.dispatchEvent(event);
  }

  function charge(index, down) {
    if (index === 1) sendKey("ShiftRight", down);
    else if (isVersus() && playerArray().length > 1) sendKey("ShiftLeft", down);
    else sendKey("Space", down);
  }

  function activeHuman(index) {
    const ps = playerArray();
    const p = ps[index];
    if (!p) return false;
    return !p.cpu && !p.isCpu && p.control !== "cpu" && p.controller !== "cpu";
  }

  function markCloseCallCatch(index, wasNeckAndNeck) {
    if (!wasNeckAndNeck || index !== localPlayerIndex() || !activeHuman(index)) return;
    closeCallOwnerIndex = index;
    closeCallExpiresAt = performance.now() + 1500;
  }

  function closeCallEligible() {
    const g = gameObject();
    const winner = Number(firstValue(
      g?.pvpRoundWinnerIndex, g?.roundWinnerIndex, g?.winnerIndex, -1
    ));
    const catchIndex = Number(firstValue(
      g?.lastCatchPlayerIndex, g?.lastScoringPlayerIndex, closeCallOwnerIndex
    ));
    const local = localPlayerIndex();
    return performance.now() <= closeCallExpiresAt &&
      catchIndex === local && (winner < 0 || winner === local) && activeHuman(local);
  }

  function wrapAchievementFunction(name, getter, setter) {
    try {
      const original = getter();
      if (typeof original !== "function" || original.__rr170Wrapped) return;
      const wrapped = function(id, ...rest) {
        const key = String(id || "").toLowerCase();
        if (/close[- _]?call/.test(key) && !closeCallEligible()) return false;
        return original.call(this, id, ...rest);
      };
      wrapped.__rr170Wrapped = true;
      setter(wrapped);
    } catch (_) {}
  }

  wrapAchievementFunction("unlockAchievement",
    () => typeof unlockAchievement !== "undefined" ? unlockAchievement : null,
    value => { unlockAchievement = value; });
  wrapAchievementFunction("awardAchievement",
    () => typeof awardAchievement !== "undefined" ? awardAchievement : null,
    value => { awardAchievement = value; });
  wrapAchievementFunction("earnAchievement",
    () => typeof earnAchievement !== "undefined" ? earnAchievement : null,
    value => { earnAchievement = value; });

  function catchKey(fly) {
    const g = gameObject();
    return [
      firstValue(g?.roundKey, g?.round, g?.pvpRoundIndex, "round"),
      firstValue(fly?.id, fly?.flyId, fly?.serial, "fly"),
      firstValue(fly?.promptSerial, fly?.vocabIndex, fly?.wordIndex, "word")
    ].join(":");
  }

  function wrapCatchFunction(getter, setter) {
    try {
      const original = getter();
      if (typeof original !== "function" || original.__rr170Idempotent) return;
      const wrapped = function(...args) {
        const fly = args.find(v => v && typeof v === "object" &&
          ("flyId" in v || "vocabIndex" in v || "correct" in v || "wordIndex" in v));
        if (fly) {
          const key = catchKey(fly);
          const now = performance.now();
          if (recentCatchKeys.has(key) && now - recentCatchKeys.get(key) < 1200) return false;
          recentCatchKeys.set(key, now);
          setTimeout(() => recentCatchKeys.delete(key), 1800);
        }
        const result = original.apply(this, args);
        const index = Number(firstValue(
          args.find(v => Number.isInteger(v) && v >= 0 && v <= 1),
          fly?.caughtBy, fly?.playerIndex, gameObject()?.lastCatchPlayerIndex, -1
        ));
        const g = gameObject();
        const scores = firstValue(g?.pvpScores, g?.scores, []);
        const neck = Array.isArray(scores) && scores.length > 1 &&
          Math.abs(Number(scores[0]||0)-Number(scores[1]||0)) <= 1;
        if (index >= 0) markCloseCallCatch(index, neck);
        return result;
      };
      wrapped.__rr170Idempotent = true;
      setter(wrapped);
    } catch (_) {}
  }

  wrapCatchFunction(
    () => typeof catchFly !== "undefined" ? catchFly : null,
    v => { catchFly = v; });
  wrapCatchFunction(
    () => typeof handleFlyCatch !== "undefined" ? handleFlyCatch : null,
    v => { handleFlyCatch = v; });
  wrapCatchFunction(
    () => typeof resolveFlyCatch !== "undefined" ? resolveFlyCatch : null,
    v => { resolveFlyCatch = v; });
  wrapCatchFunction(
    () => typeof collectFly !== "undefined" ? collectFly : null,
    v => { collectFly = v; });

  wrapCatchFunction(
    () => typeof processFlyCatch !== "undefined" ? processFlyCatch : null,
    v => { processFlyCatch = v; });
  wrapCatchFunction(
    () => typeof onFlyCaught !== "undefined" ? onFlyCaught : null,
    v => { onFlyCaught = v; });
  wrapCatchFunction(
    () => typeof confirmCatch !== "undefined" ? confirmCatch : null,
    v => { confirmCatch = v; });
  wrapCatchFunction(
    () => typeof resolveCatchClaim !== "undefined" ? resolveCatchClaim : null,
    v => { resolveCatchClaim = v; });
  wrapCatchFunction(
    () => typeof scoreCatch !== "undefined" ? scoreCatch : null,
    v => { scoreCatch = v; });

  // Real-time hat evaluation. This supplements event-driven checks and prevents
  // completed challenges from waiting for a menu transition.
  setInterval(() => {
    if (document.hidden) return;
    try {
      if (typeof evaluateHatProgress === "function") evaluateHatProgress();
      if (typeof checkHatUnlocks === "function") checkHatUnlocks();
      if (typeof updateHatProgress === "function") updateHatProgress();
      if (typeof hatProgressController !== "undefined") {
        hatProgressController?.evaluate?.();
        hatProgressController?.update?.();
      }
    } catch (_) {}
  }, 650);


  function numericFrom(value) {
    const n=Number(value);
    return Number.isFinite(n)?n:0;
  }
  function recursiveMetric(value, path=[], out=[]) {
    if(value==null)return out;
    if(typeof value==="number"||typeof value==="string"){
      const joined=path.join(".").toLowerCase();
      if(/lake/.test(joined)&&/win|complete|victor/.test(joined)) out.push(numericFrom(value));
      return out;
    }
    if(Array.isArray(value)){value.forEach((v,i)=>recursiveMetric(v,path.concat(String(i)),out));return out;}
    if(typeof value==="object")for(const [k,v] of Object.entries(value))recursiveMetric(v,path.concat(k),out);
    return out;
  }
  function storageObjects() {
    const values=[];
    try {
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i),raw=localStorage.getItem(key);
        if(!/ribbitRace|oneButtonFrog/i.test(key||""))continue;
        try{values.push({key,value:JSON.parse(raw)});}catch(_){values.push({key,value:raw});}
      }
    } catch(_){}
    return values;
  }
  function hatsFeatureAvailable(values) {
    return values.some(({key,value}) =>
      /hats?Unlocked|hatFeature|hat.*available/i.test(key) &&
      (value===true||value==="true"||Number(value)>0||Array.isArray(value)||typeof value==="object"));
  }
  function lakeWins(values) {
    const candidates=[];
    for(const {key,value} of values){
      if(/lake/i.test(key)&&/win|complete|victor/i.test(key))candidates.push(numericFrom(value));
      recursiveMetric(value,[key],candidates);
    }
    return candidates.length?Math.max(...candidates):0;
  }
  const RR170_BEANIE_IDS=["BEANIE", "beanie"];
  function unlockBeanieFallback() {
    const values=storageObjects();
    if(!hatsFeatureAvailable(values)||lakeWins(values)<5)return;
    try {
      if(typeof unlockHat==="function"){for(const id of RR170_BEANIE_IDS)unlockHat(id);return;}
      if(typeof awardHat==="function"){for(const id of RR170_BEANIE_IDS)awardHat(id);return;}
      if(typeof unlockCosmetic==="function"){for(const id of RR170_BEANIE_IDS)unlockCosmetic(id);return;}
    } catch(_){}
    for(const {key,value} of values){
      if(!/hat/i.test(key)||!/unlock|owned|earned/i.test(key))continue;
      try{
        if(Array.isArray(value)){
          let changed=false;for(const id of RR170_BEANIE_IDS)if(!value.includes(id)){value.push(id);changed=true;}if(changed)localStorage.setItem(key,JSON.stringify(value));
          return;
        }
        if(value&&typeof value==="object"){
          let changed=false;for(const id of RR170_BEANIE_IDS)if(!value[id]){value[id]=true;changed=true;}if(changed)localStorage.setItem(key,JSON.stringify(value));
          return;
        }
      }catch(_){}
    }
  }
  setInterval(unlockBeanieFallback,850);

  // Guard a grounded, non-jumping frog from being launched upward when an
  // opponent is the frog that receives the bonk.
  function groundGuard() {
    const ps = playerArray();
    for (const p of ps) {
      if (!p || typeof p !== "object") continue;
      const grounded = Boolean(firstValue(p.grounded, p.onGround, p.onPlatform, false));
      const charging = Boolean(firstValue(p.charging, p.held, p.jumpHeld, false));
      const stunned = Number(firstValue(p.stunTimer, p.bonkTimer, p.bonkedTimer, 0)) > 0;
      const vyKey = "vy" in p ? "vy" : ("velocityY" in p ? "velocityY" : null);
      const yKey = "y" in p ? "y" : null;
      if (grounded && yKey) groundMemory.set(p, {y:p[yKey], at:performance.now()});
      const memory = groundMemory.get(p);
      if (grounded && !charging && !stunned && vyKey && Number(p[vyKey]) < -0.25) {
        const otherBonked = ps.some(o => o && o !== p &&
          Number(firstValue(o.stunTimer, o.bonkTimer, o.bonkedTimer, 0)) > 0);
        if (otherBonked) {
          p[vyKey] = 0;
          if (memory && performance.now() - memory.at < 250) p[yKey] = memory.y;
        }
      }
    }
    requestAnimationFrame(groundGuard);
  }
  requestAnimationFrame(groundGuard);

  // Smooth spectator positions and expose enough state for trajectory rendering.
  function spectatorSmoothing() {
    const o = onlineObject();
    const snap = firstValue(o?.latestSnapshot, o?.snapshot, gameObject()?.latestSnapshot);
    const incoming = snap?.players;
    if (isSpectator() && Array.isArray(incoming)) {
      if (!spectatorSmoothedPlayers || spectatorSmoothedPlayers.length !== incoming.length) {
        spectatorSmoothedPlayers = incoming.map(p => ({...p}));
      } else {
        incoming.forEach((p,i) => {
          const s = spectatorSmoothedPlayers[i];
          if (!s) return;
          for (const key of ["x","y","vx","vy","charge"]) {
            if (Number.isFinite(Number(p[key]))) {
              const alpha = key === "charge" ? .42 : .28;
              s[key] = Number(s[key] ?? p[key]) + (Number(p[key]) - Number(s[key] ?? p[key])) * alpha;
            }
          }
          Object.assign(s, p, {x:s.x, y:s.y, vx:s.vx, vy:s.vy, charge:s.charge});
        });
      }
      window.RibbitRaceSpectatorSmoothedPlayers = spectatorSmoothedPlayers;
    }
    requestAnimationFrame(spectatorSmoothing);
  }
  requestAnimationFrame(spectatorSmoothing);


  let rr170PreviousScores=null;
  function rr170ScoreWatcher(){
    const g=gameObject(),scores=firstValue(g?.pvpScores,g?.scores,g?.roundScores);
    if(Array.isArray(scores)&&scores.length>=2){
      const current=[Number(scores[0]||0),Number(scores[1]||0)];
      if(rr170PreviousScores){
        const changed=current[0]!==rr170PreviousScores[0]?0:(current[1]!==rr170PreviousScores[1]?1:-1);
        if(changed>=0){
          const neck=rr170PreviousScores[0]===rr170PreviousScores[1] ||
            Math.abs(rr170PreviousScores[0]-rr170PreviousScores[1])<=1;
          markCloseCallCatch(changed,neck);
        }
      }
      rr170PreviousScores=current;
    } else rr170PreviousScores=null;
    requestAnimationFrame(rr170ScoreWatcher);
  }
  requestAnimationFrame(rr170ScoreWatcher);

  // The Friends transport is a WebSocket (reliable ordered TCP/TLS).  The guest
  // display uses interpolation and short extrapolation so both sides look smooth
  // without pretending the transport is UDP or a true deterministic rollback engine.
  let rr170RemoteVisual=null,rr170RemoteTarget=null,rr170RemoteLast=performance.now();
  function rr170RemoteSmoothing(now){
    const o=onlineObject(),g=gameObject(),ps=playerArray();
    const role=String(o?.role||g?.onlineRole||"");
    const snapshot=firstValue(o?.latestSnapshot,o?.snapshot,g?.latestSnapshot);
    if(role==="guest"&&Array.isArray(snapshot?.players)&&ps[0]){
      const target=snapshot.players[0];
      if(Number.isFinite(+target.x)&&Number.isFinite(+target.y)){
        rr170RemoteTarget={x:+target.x,y:+target.y,vx:+target.vx||0,vy:+target.vy||0,at:now};
        if(!rr170RemoteVisual)rr170RemoteVisual={x:+target.x,y:+target.y};
      }
      if(rr170RemoteTarget&&rr170RemoteVisual){
        const dt=Math.min(.05,(now-rr170RemoteLast)/1000);
        const age=Math.min(.12,(now-rr170RemoteTarget.at)/1000);
        const tx=rr170RemoteTarget.x+rr170RemoteTarget.vx*age;
        const ty=rr170RemoteTarget.y+rr170RemoteTarget.vy*age;
        const alpha=1-Math.exp(-18*dt);
        rr170RemoteVisual.x+=(tx-rr170RemoteVisual.x)*alpha;
        rr170RemoteVisual.y+=(ty-rr170RemoteVisual.y)*alpha;
        ps[0].renderX=rr170RemoteVisual.x;ps[0].renderY=rr170RemoteVisual.y;
        // Guest-side host state is visual-only in the established authority model.
        ps[0].x=rr170RemoteVisual.x;ps[0].y=rr170RemoteVisual.y;
      }
    }else{rr170RemoteVisual=null;rr170RemoteTarget=null;}
    rr170RemoteLast=now;requestAnimationFrame(rr170RemoteSmoothing);
  }
  requestAnimationFrame(rr170RemoteSmoothing);

  // Final Catch labels stay gone after their fade completes. The old guard
  // watched a generic alpha that could reset to 1 on the first post-cinematic
  // frame, which caused every label to pop back in once. Track the actual
  // critical-catch lifecycle instead and keep the labels suppressed for the
  // remainder of the round.
  let finalCatchLabelsGone = false;
  let finalCatchWasActive = false;
  window.RibbitRaceResetFinalCatchLabels = () => {
    finalCatchLabelsGone = false;
    finalCatchWasActive = false;
    window.RibbitRaceFinalCatchLabelsGone = false;
    try { window.RibbitV160ResetFinalCatchLabels?.(); } catch (_) {}
  };
  function finalCatchGuard() {
    const g = gameObject();
    const state = stateName();
    const active = Boolean(firstValue(
      g?.soloCriticalCatchActive,
      g?.pvpCriticalCatchActive,
      g?.finalCatchActive,
      /final.?catch/i.test(state)
    ));
    const newRound = /main|title|setup|onlineconnect|countdown/i.test(state);
    if (newRound && !active) {
      finalCatchLabelsGone = false;
      finalCatchWasActive = false;
    }
    if (active) finalCatchWasActive = true;
    if (finalCatchWasActive && !active && !newRound) finalCatchLabelsGone = true;
    if (!newRound && window.RibbitRaceFinalCatchLabelsGone === true) finalCatchLabelsGone = true;
    window.RibbitRaceFinalCatchLabelsGone = finalCatchLabelsGone;
    requestAnimationFrame(finalCatchGuard);
  }
  requestAnimationFrame(finalCatchGuard);

  function resetToStart() {
    try {
      if (typeof restartLevel === "function") return restartLevel();
      if (typeof resetRound === "function") return resetRound(true);
      if (typeof startCurrentLevel === "function") return startCurrentLevel();
    } catch (_) {}
  }

  window.RibbitRaceV170 = Object.freeze({
    get game() { return gameObject(); },
    get players() { return playerArray(); },
    get flies() { return flyArray(); },
    get state() { return stateName(); },
    get mode() { return modeName(); },
    get mobile() { return isMobileMode(); },
    get versus() { return isVersus(); },
    get spectator() { return isSpectator(); },
    get localPlayerIndex() { return localPlayerIndex(); },
    get opponentName() { return opponentName(); },
    playerName,
    pause,
    charge,
    resetToStart,
    closeCallEligible,
    markCloseCallCatch,
    get smoothedSpectatorPlayers() { return spectatorSmoothedPlayers; }
  });
})();
