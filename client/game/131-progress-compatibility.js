// Hat progress compatibility bridge for old and new save formats.
(() => {
  "use strict";
  function localProgress(){try{return JSON.parse(localStorage.getItem("ribbitRaceHatProgressV2")||"{}")||{};}catch(_){return {};}}
  function skinFromArgs(args){
    const known=["azure","crimson","plum","forest","violet","silver","blossom","ember"];
    for(const arg of args){
      if(typeof arg==="string"&&known.includes(arg.toLowerCase()))return arg.toLowerCase();
      if(arg&&typeof arg==="object"){
        for(const key of ["skinId","skin","frog","frogId","requiredSkin"]){const value=String(arg[key]||"").toLowerCase();if(known.includes(value))return value;}
        const text=JSON.stringify(arg).toLowerCase();const found=known.find(id=>text.includes(id));if(found)return found;
      }
    }
    return String(game.skinId||"azure").toLowerCase();
  }
  function mergeProgress(value,args){
    const progress=localProgress();const skin=skinFromArgs(args);const local=Math.max(0,Number(progress.bySkin?.[skin])||0);
    if(typeof value==="number")return Math.max(value,local);
    if(value&&typeof value==="object"){
      const clone={...value};
      for(const key of ["current","progress","count","value","earned"]){if(Number.isFinite(Number(clone[key])))clone[key]=Math.max(Number(clone[key]),local);}
      return clone;
    }
    return value;
  }
  if(typeof getHatRequirementProgress==="function"){
    const prior=getHatRequirementProgress;getHatRequirementProgress=function(...args){return mergeProgress(prior.apply(this,args),args);};
  }
  if(typeof getHatUnlockProgress==="function"){
    const prior=getHatUnlockProgress;getHatUnlockProgress=function(...args){return mergeProgress(prior.apply(this,args),args);};
  }
  if(typeof getCustomHatProgress==="function"){
    const prior=getCustomHatProgress;getCustomHatProgress=function(...args){return mergeProgress(prior.apply(this,args),args);};
  }
  if(typeof getSkinFlyCount==="function"){
    const prior=getSkinFlyCount;getSkinFlyCount=function(...args){return mergeProgress(prior.apply(this,args),args);};
  }
  if(typeof getFrogSkinFlyCount==="function"){
    const prior=getFrogSkinFlyCount;getFrogSkinFlyCount=function(...args){return mergeProgress(prior.apply(this,args),args);};
  }
  if(typeof drawHatProgressBar==="function"){
    const prior=drawHatProgressBar;drawHatProgressBar=function(hat,...rest){
      try{if(hat?.id==="ember"||hat?.skinId==="ember"){if(isFrogSkinUnlocked?.("ember"))return;}}catch(_){ }
      return prior.call(this,hat,...rest);
    };
  }
})();

// Merge locally archived online replays into Frog Tags history.
(() => {
  "use strict";
  function localGames(name){try{const all=JSON.parse(localStorage.getItem("ribbitRaceOnlineHistoryV2")||"{}");return Array.isArray(all[name])?all[name]:[];}catch(_){return [];}}
  try{
    const tags=window.RibbitFrogTags;
    if(tags&&typeof tags.against==="function"&&!tags.__polish8Merged){
      const original=tags.against.bind(tags);
      const replacement=function(name){
        const base=original(name)||[];const extra=localGames(name);const seen=new Set();
        return [...extra,...base].filter(game=>{const key=String(game.replayId||game.id||`${game.at}:${game.won}`);if(seen.has(key))return false;seen.add(key);return true;});
      };
      try{tags.against=replacement;tags.__polish8Merged=true;}catch(_){ }
    }
  }catch(_){ }
})();

// Live Top Hat requirement bridge (Azure catches are tracked immediately).
(() => {
  "use strict";
  const TOP_HAT_ID = 'top-hat';
  function azureCount(){
    try{const p=JSON.parse(localStorage.getItem("ribbitRaceHatProgressV2")||"{}");return Math.max(0,Number(p.bySkin?.azure)||0);}catch(_){return 0;}
  }
  function override(id,base){return String(id||"").toLowerCase()===String(TOP_HAT_ID).toLowerCase()&&azureCount()>=75?true:base;}
  if(typeof isHatUnlocked==="function"){const prior=isHatUnlocked;isHatUnlocked=function(id,...rest){return override(id,prior.call(this,id,...rest));};}
  if(typeof isFrogHatUnlocked==="function"){const prior=isFrogHatUnlocked;isFrogHatUnlocked=function(id,...rest){return override(id,prior.call(this,id,...rest));};}
  if(typeof isCustomHatUnlocked==="function"){const prior=isCustomHatUnlocked;isCustomHatUnlocked=function(id,...rest){return override(id,prior.call(this,id,...rest));};}
  let announced=false;
  window.addEventListener("rr-hat-progress",event=>{
    if(game.tutorialActive||window.RibbitRaceTutorialEngine?.active)return;
    if(event.detail?.skinId!=="azure"||Number(event.detail?.count)<75||announced)return;
    announced=true;
    try{
      if(typeof window.RibbitUnlockHatFromLiveProgress==="function")window.RibbitUnlockHatFromLiveProgress(TOP_HAT_ID,"TOP HAT");
      else if(typeof unlockHat==="function")unlockHat(TOP_HAT_ID);
    }catch(_){ }
  });
  window.RibbitTopHatProgress=Object.freeze({id:TOP_HAT_ID,current:azureCount,required:75});
})();

// Do not keep drawing Ember's total-flies progress after Ember is unlocked.
(() => {
  "use strict";
  function emberUnlocked(){try{return Boolean(isFrogSkinUnlocked?.("ember"));}catch(_){return false;}}
  function selectedEmber(args){
    try{
      if(String(game.setupSkinFocusId||game.skinId||"").toLowerCase()==="ember")return true;
      return args.some(arg=>String(arg?.id||arg?.skinId||arg||"").toLowerCase()==="ember");
    }catch(_){return false;}
  }
  if(typeof drawFrogSkinRequirement==="function"){
    const prior=drawFrogSkinRequirement;drawFrogSkinRequirement=function(...args){if(emberUnlocked()&&selectedEmber(args))return;return prior.apply(this,args);};
  }
  if(typeof drawSkinUnlockProgress==="function"){
    const prior=drawSkinUnlockProgress;drawSkinUnlockProgress=function(...args){if(emberUnlocked()&&selectedEmber(args))return;return prior.apply(this,args);};
  }
  if(typeof drawSetupUnlockProgress==="function"){
    const prior=drawSetupUnlockProgress;drawSetupUnlockProgress=function(...args){if(emberUnlocked()&&selectedEmber(args))return;return prior.apply(this,args);};
  }
})();
