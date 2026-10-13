// Polish 19 cross-screen integration layer.
(() => {
  "use strict";
  if (window.__RIBBIT_POLISH_19__) return;
  window.__RIBBIT_POLISH_19__ = true;
  const engine=()=>window.RibbitRaceTutorialEngine;
  const P19={pausePreview:null,pauseRects:{left:null,right:null},mouseJump:false,skipBuffer:"",skipAt:0};
  function inside(p,r){return !!(p&&r&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h);}
  function scrollArrow(rect,dir,active=false){
    const skin=getSelectedSkin();ctx.fillStyle="rgba(25,43,52,.25)";ctx.fillRect(rect.x+2,rect.y+2,rect.w,rect.h);ctx.fillStyle=active?skin.dark:"#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);ctx.fillStyle=active?skin.belly:"#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);ctx.fillStyle=active?skin.dark:"#48555a";
    const cx=rect.x+rect.w/2,cy=rect.y+rect.h/2; if(dir<0){ctx.fillRect(cx-6,cy-1,10,3);ctx.fillRect(cx-6,cy-4,3,9);ctx.fillRect(cx-8,cy-2,2,5);}else{ctx.fillRect(cx-4,cy-1,10,3);ctx.fillRect(cx+3,cy-4,3,9);ctx.fillRect(cx+6,cy-2,2,5);}
  }
  // Tutorial HUD: denominator follows the current authored fly objective.
  const priorDrawSoloHudP19=typeof drawSoloHud==="function"?drawSoloHud:null;
  if(priorDrawSoloHudP19){drawSoloHud=function(...args){const e=engine();if(e?.active&&game.mode==="solo"){const old=game.soloCatchGoal;const goal=Number(e.sceneFlyGoal||0);if(goal>0)game.soloCatchGoal=goal;const result=priorDrawSoloHudP19.apply(this,args);game.soloCatchGoal=old;return result;}return priorDrawSoloHudP19.apply(this,args);};}
  // Chapter previewing is owned by the pause overlay above. Arrow presses only
  // update the preview; resumePausedGame applies the selected chapter.
  // Keep Fullscreen present but dimmed while the book is open.
  const priorDrawSceneP19=drawScene;
  drawScene=function(...args){const result=priorDrawSceneP19.apply(this,args);if(game.state==="paused"&&game.pauseHelpOpen){const r={x:448,y:238,w:22,h:22};ctx.save();ctx.globalAlpha=.28;ctx.fillStyle=COLORS.ink;ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle="#f7fdff";ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);ctx.fillStyle="#48555a";ctx.fillRect(r.x+5,r.y+5,4,2);ctx.fillRect(r.x+5,r.y+5,2,4);ctx.fillRect(r.x+r.w-9,r.y+5,4,2);ctx.fillRect(r.x+r.w-7,r.y+5,2,4);ctx.fillRect(r.x+5,r.y+r.h-7,4,2);ctx.fillRect(r.x+5,r.y+r.h-9,2,4);ctx.fillRect(r.x+r.w-9,r.y+r.h-7,4,2);ctx.fillRect(r.x+r.w-7,r.y+r.h-9,2,4);ctx.restore();}return result;};
  // Mouse press/release can jump on desktop. W and Right Shift also control P1 when no local P2 exists.
  function p1Only(){return game.mode!=="pvp"||!game.pvpHuman2||game.onlineMode;}
  function livePlay(){return game.state==="playing"&&!game.pauseHelpOpen&&!friendsGameInputLocked?.();}
  canvas.addEventListener("pointerdown",ev=>{if(ev.pointerType!=="mouse"||!livePlay()||!p1Only())return;const p=getCanvasPoint(ev);if(pointInsideRect(p,HUD_UI.pauseButton))return;P19.mouseJump=true;if(game.mode==="pvp")pressPvpButton(0);else pressMainButton();},{passive:true});
  window.addEventListener("pointerup",ev=>{if(!P19.mouseJump)return;P19.mouseJump=false;if(game.mode==="pvp")releasePvpButton(0);else releaseMainButton();},{passive:true});
  window.addEventListener("keydown",ev=>{if(!["KeyW","ShiftRight"].includes(ev.code)||ev.repeat||!livePlay()||!p1Only())return;ev.preventDefault();if(game.mode==="pvp")pressPvpButton(0);else pressMainButton();},{capture:true});
  window.addEventListener("keyup",ev=>{if(!["KeyW","ShiftRight"].includes(ev.code)||!p1Only())return;ev.preventDefault();if(game.mode==="pvp")releasePvpButton(0);else releaseMainButton();},{capture:true});
  // Sudden-death flies never start appearing behind the countdown.
  const priorUpdateP19=update;update=function(dt,...rest){
    const e=engine(),pvpTraining=!!(e?.active&&e.kindPolish19==="pvp"),setup=String(e?.polish19Setup||"").toLowerCase(),title=String(e?.stepTitlePolish19||"").toLowerCase();
    if(game.mode==="pvp"&&game.state==="countdown"){flies.length=0;if(game.spawnQueue)game.spawnQueue.length=0;}
    const finalRace=pvpTraining&&(/final|race|match/.test(setup+" "+title));
    if(finalRace){game.pvpCpuEnabled=true;game.pvpCpuDifficulty=5;game.pvpCpuLevel=5;if(pvpPlayers?.[1]){pvpPlayers[1].cpu=true;pvpPlayers[1].cpuLevel=5;pvpPlayers[1].inputHeld=false;}}
    const before=pvpTraining&&e.dialogueOpen?(pvpPlayers||[]).map(p=>Number(p.stunTimer||0)):null;
    const result=priorUpdateP19.call(this,dt,...rest);
    if(before){(pvpPlayers||[]).forEach((p,i)=>{if(before[i]>0){p.stunTimer=Math.max(0,Math.min(Number(p.stunTimer||before[i]),before[i])-Math.max(0,dt));if(p.stunTimer<=0){p.bonked=false;p.stunned=false;}}});}
    return result;
  };
  // PvP tutorial prompt/HUD refinements.
  if(typeof drawPvpHud==="function"){const priorHud19=drawPvpHud;drawPvpHud=function(...args){const e=engine(),active=!!(e?.active&&e.kindPolish19==="pvp");if(!active)return priorHud19.apply(this,args);const oldMode=game.pvpRoundGoalMode,oldFirst=game.pvpFirstTo,oldTarget=game.pvpRoundTarget;game.pvpRoundGoalMode="endless";game.pvpFirstTo=0;game.pvpRoundTarget=0;const out=priorHud19.apply(this,args);game.pvpRoundGoalMode=oldMode;game.pvpFirstTo=oldFirst;game.pvpRoundTarget=oldTarget;return out;};}
  const priorDrawScenePrompt19=drawScene;drawScene=function(...args){const out=priorDrawScenePrompt19.apply(this,args),e=engine();if(e?.active&&e.kindPolish19==="pvp"&&flies.length===0&&!/final|race|match/i.test(String(e.stepTitlePolish19||""))){try{drawBlankTutorialVocabularyPrompt();}catch(_){ctx.fillStyle="#f7fdff";ctx.fillRect(158,246,164,17);}}return out;};
  // Do not draw FINAL CATCH title during tutorial cinematics except the final normal-round fly.
  window.RibbitTutorialShouldHideFinalCatchTitle=()=>{const e=engine();return !!(e?.active&&e.polish19Setup!=="normalRound");};
})();


// Polish 19 custom-frog visual and hover refinements.
(() => {
  "use strict";
  if (window.__RIBBIT_POLISH19_CUSTOM__) return;
  window.__RIBBIT_POLISH19_CUSTOM__=true;
  window.drawPolish19RandomDie=function(cx,cy,active=false){
    const edge=active?getSelectedSkin().dark:"#1b1b1b",face="#f7fdff",shade="#d7d7d7",pip="#111";
    ctx.save();ctx.fillStyle=edge;ctx.fillRect(cx-9,cy-9,18,18);ctx.fillStyle=face;ctx.fillRect(cx-7,cy-7,12,12);ctx.fillStyle=shade;ctx.fillRect(cx+5,cy-5,2,12);ctx.fillRect(cx-5,cy+5,10,2);ctx.fillStyle="#ef1818";ctx.fillRect(cx-1,cy-5,4,3);ctx.fillStyle=pip;[[cx-4,cy-3],[cx+2,cy+1],[cx-4,cy+3]].forEach(([x,y])=>ctx.fillRect(x,y,3,3));ctx.fillStyle="#777";ctx.fillRect(cx-3,cy-2,1,1);ctx.fillRect(cx+3,cy+2,1,1);ctx.restore();
  };
  canvas.addEventListener("pointerleave",()=>{try{window.RibbitCustomBaseRestoreSelected?.();}catch(_){ }},{passive:true});
})();
