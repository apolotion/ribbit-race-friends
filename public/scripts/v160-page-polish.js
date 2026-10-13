(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let pendingGuestSave = null;
  function collectGuestSave() {
    const out = {};
    try {
      for (let i=0;i<localStorage.length;i++) {
        const k=localStorage.key(i); if (/^(ribbitRace|oneButtonFrog)/.test(k)) out[k]=localStorage.getItem(k);
      }
    } catch (_) {}
    return out;
  }
  function isGuest() {
    const b=$("cloud-account-button");
    return !!(b && /GUEST/i.test(b.textContent||""));
  }
  function markGuestUi() { document.body.classList.toggle("rr-guest-active", isGuest()); }
  const observer=new MutationObserver(markGuestUi);
  window.addEventListener("DOMContentLoaded",()=>{
    const b=$("cloud-account-button"); if(b) observer.observe(b,{attributes:true,childList:true,subtree:true});
    markGuestUi();
    const convert=$("guest-convert-account");
    if(convert) convert.addEventListener("click",()=>{
      pendingGuestSave=collectGuestSave();
      try { sessionStorage.setItem("rrPendingGuestSaveV1",JSON.stringify(pendingGuestSave)); } catch(_) {}
      const create=$("cloud-show-create"); if(create) create.click();
    });
    const gate=$("cloud-gate");
    if(gate) new MutationObserver(()=>{
      if(!gate.hidden){
        try { window.dispatchEvent(new CustomEvent("rr-auth-gate-visible")); } catch(_) {}
      }
    }).observe(gate,{attributes:true,attributeFilter:["hidden"]});
  });
  window.addEventListener("beforeunload",(e)=>{
    if(!isGuest()) return;
    try { sessionStorage.setItem("rrPendingGuestSaveV1",JSON.stringify(collectGuestSave())); } catch(_) {}
    e.preventDefault(); e.returnValue="";
  });
  window.RibbitGuestConversion = {
    takePending(){
      let v=pendingGuestSave;
      if(!v){try{v=JSON.parse(sessionStorage.getItem("rrPendingGuestSaveV1")||"null");}catch(_){}}
      return v||null;
    },
    clear(){pendingGuestSave=null;try{sessionStorage.removeItem("rrPendingGuestSaveV1");}catch(_){}}
  };
})();
