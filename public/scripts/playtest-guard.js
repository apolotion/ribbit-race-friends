"use strict";
(() => {
  const RECOVERY = "rrFriendsPlaytestRecoveryV3";
  const MARKER = "rrFriendsPlaytestActiveV3";
  const isGameKey = (key) => /^(?:ribbitRace|oneButtonFrog)/.test(String(key || ""));
  function snapshotStorage() {
    const values = {};
    for (let i=0;i<localStorage.length;i++) {
      const key=localStorage.key(i); if (isGameKey(key)) values[key]=localStorage.getItem(key);
    }
    return {at:Date.now(),values};
  }
  function restore(snapshot) {
    if (!snapshot || !snapshot.values) return false;
    const remove=[];
    for (let i=0;i<localStorage.length;i++) { const key=localStorage.key(i); if (isGameKey(key) && !(key in snapshot.values)) remove.push(key); }
    remove.forEach((key)=>localStorage.removeItem(key));
    Object.entries(snapshot.values).forEach(([key,value])=>localStorage.setItem(key,value));
    localStorage.removeItem(RECOVERY); localStorage.removeItem(MARKER);
    return true;
  }
  function loadRecovery() { try { return JSON.parse(localStorage.getItem(RECOVERY)||"null"); } catch (_) { return null; } }
  // A tab that vanished during playtest restores the last real save before any
  // game/cloud module is allowed to read temporary unlocks.
  if (localStorage.getItem(MARKER)==="1") restore(loadRecovery());
  let typed="";
  window.addEventListener("keydown",(event)=>{
    if (event.metaKey||event.ctrlKey||event.altKey) return;
    if (event.key.length===1) typed=(typed+event.key.toLowerCase()).slice(-16);
    if (typed.endsWith("playtest") && localStorage.getItem(MARKER)!=="1") {
      localStorage.setItem(RECOVERY,JSON.stringify(snapshotStorage()));
      localStorage.setItem(MARKER,"1");
    }
  },true);
  const rollback=()=>{ if(localStorage.getItem(MARKER)==="1") restore(loadRecovery()); };
  window.addEventListener("pagehide",rollback,{capture:true});
  window.addEventListener("beforeunload",rollback,{capture:true});
  window.RibbitPlaytestGuard=Object.freeze({
    begin(){ if(localStorage.getItem(MARKER)!=="1"){localStorage.setItem(RECOVERY,JSON.stringify(snapshotStorage()));localStorage.setItem(MARKER,"1");}},
    rollback,
    finish(){ rollback(); },
    active(){ return localStorage.getItem(MARKER)==="1"; }
  });
})();
