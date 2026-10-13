// Ribbit Race Friends — deterministic-looking in-engine spectator replays.
// A replay is an ordered timeline of compact *render state* samples: it draws
// the actual game scene with saved frog/fly positions, not a browser video.
// State is restored after each paint; playback cannot affect saves or records.
const RIBBIT_ENGINE_REPLAY_MIME = "application/vnd.ribbit-race.frames+json";
const RIBBIT_REPLAY_SNAPSHOT_FIELDS = [
  "x","y","vx","vy","dir","grounded","charging","charge","landingSquash",
  "blinkTimer","blinking","score","skinId","bonked","stunTimer","bonkLandingPopTimer",
  "collisionCooldown","firstJumpMade","airTime","catchSparkleTimer","wrongCatchBubbleTimer"
];
const RIBBIT_REPLAY_GAME_FIELDS = [
  "mode","state","selectedLevelId","timeOfDay","moonPhaseIndex","worldTime","visualTime",
  "score","jumps","elapsed","targetVocabIndex","skinId","pvpRoundNumber","pvpTimeRemaining",
  "pvpElapsed","pvpTimeLimitSeconds","pvpFirstTo","pvpRoundGoalMode","pvpBestOf",
  "pvpRoundWins","pvpSuddenDeath","onlineMode","pvpCpuEnabled","sandboxMode",
  "soloCriticalCatchActive","pvpCriticalCatchActive","winPending","pvpWinPendingIndex",
  "tutorialActive","pvpImpactEffects","messageTimer"
];
let ribbitReplayCapture = null;
let ribbitReplayLastCapture = null;
let ribbitReplayView = null;

function captureRibbitReplayPlayer(player) {
  if (!player) return null;
  const state = {};
  for (const field of RIBBIT_REPLAY_SNAPSHOT_FIELDS) {
    const value = player[field];
    if (["number","string","boolean"].includes(typeof value)) state[field] = value;
  }
  state.tongue = player.tongue ? {
    active: !!player.tongue.active,
    elapsed: Number(player.tongue.elapsed)||0,
    duration: Number(player.tongue.duration)||.24,
    targetX: Number(player.tongue.targetX)||0,
    targetY: Number(player.tongue.targetY)||0,
    targetFlyId:player.tongue.targetFlyId ?? null,
    captured:!!player.tongue.captured
  } : undefined;
  return state;
}
function captureRibbitReplayFly(fly) {
  return {
    id:fly.id, x:fly.x, y:fly.y, baseX:fly.baseX, baseY:fly.baseY,
    phase:fly.phase, spawnAge:fly.spawnAge, spawnIndex:fly.spawnIndex,
    vocabIndex:fly.vocabIndex, state:fly.state, touchLocked:fly.touchLocked,
    blockedPromptSerial:fly.blockedPromptSerial, pvpBlockedPromptSerials:fly.pvpBlockedPromptSerials
  };
}
function captureRibbitReplaySnapshot(now) {
  const mode = game.mode === "pvp" ? "pvp" : "solo";
  const capture = ribbitReplayCapture;
  return {
    t: Math.max(0, Math.round(now-capture.startedAt-capture.pausedMillis)),
    clock:game.elapsed, world:game.worldTime, visual:game.visualTime,
    target:game.targetVocabIndex, score:game.score, jumps:game.jumps,
    round:game.pvpRoundNumber, roundTime:game.pvpTimeRemaining,
    roundWins:Array.isArray(game.pvpRoundWins)?[...game.pvpRoundWins]:[],
    pvpElapsed:game.pvpElapsed,
    player:captureRibbitReplayPlayer(frog),
    players:mode === "pvp" ? pvpPlayers.map(captureRibbitReplayPlayer) : [],
    flies:flies.filter(fly=>fly && fly.state !== "eaten").map(captureRibbitReplayFly)
  };
}
function finishRibbitReplayCapture() {
  if (!ribbitReplayCapture) return ribbitReplayLastCapture;
  if (ribbitReplayCapture.frames.length) ribbitReplayLastCapture = ribbitReplayCapture;
  ribbitReplayCapture = null;
  return ribbitReplayLastCapture;
}
function ribbitReplayCaptureTick(now = performance.now()) {
  if (ribbitReplayView) return;
  const normalGame = game.state === "playing" && ["solo","pvp"].includes(game.mode) &&
    !tutorial.active && !game.tutorialActive && !game.sandboxMode &&
    !OnlineVersus.isSpectating();
  if (!normalGame) {
    // Preserve the same Versus replay through best-of-three round breaks.
    // We do not record UI-only celebration frames, but resume recording when
    // the next round begins instead of losing the earlier frog positions.
    const betweenRounds=ribbitReplayCapture?.mode==="pvp" &&
      ["pvpCelebration","pvpSuddenDeathAlert"].includes(game.state);
    if (ribbitReplayCapture && (["paused","countdown"].includes(game.state) || betweenRounds)) {
      if(!ribbitReplayCapture.pausedAt)ribbitReplayCapture.pausedAt=now;
    }else if(ribbitReplayCapture)finishRibbitReplayCapture();
    return;
  }
  if(ribbitReplayCapture?.pausedAt){
    ribbitReplayCapture.pausedMillis+=Math.max(0,now-ribbitReplayCapture.pausedAt);
    ribbitReplayCapture.pausedAt=0;
  }
  const mode = game.mode;
  const level = String(game.selectedLevelId||"park").toLowerCase();
  const changed = !ribbitReplayCapture || ribbitReplayCapture.mode !== mode ||
    ribbitReplayCapture.level !== level ||
    // Solo clock resets mark a new run; Versus round clocks may reset inside
    // one match and must not erase the preceding replay frames.
    (mode !== "pvp" && Number(game.elapsed||0) < Number(ribbitReplayCapture.lastGameTime||0)-.15);
  if (changed) {
    if(ribbitReplayCapture) finishRibbitReplayCapture();
    ribbitReplayCapture = {
      v:1,kind:"ribbit-engine-frames",mode,level,
      timeOfDay:game.timeOfDay,moonPhaseIndex:game.moonPhaseIndex,skinId:game.skinId,
      pvpTimeLimitSeconds:game.pvpTimeLimitSeconds,pvpFirstTo:game.pvpFirstTo,
      pvpRoundGoalMode:game.pvpRoundGoalMode,pvpBestOf:game.pvpBestOf,
      vocab:VOCABULARY.map(e=>({english:e.english,spanish:e.spanish})),
      startedAt:now,lastAt:-Infinity,lastGameTime:0,pausedAt:0,pausedMillis:0,frames:[]
    };
  }
  if(now-ribbitReplayCapture.lastAt<75 || ribbitReplayCapture.frames.length>=8500) return;
  ribbitReplayCapture.lastAt=now;
  ribbitReplayCapture.lastGameTime=Number(game.elapsed)||0;
  ribbitReplayCapture.frames.push(captureRibbitReplaySnapshot(now));
}
function ribbitReplayExportCurrent() {
  const capture = ribbitReplayCapture?.frames.length ? ribbitReplayCapture : ribbitReplayLastCapture;
  if (!capture || capture.frames.length<2) return null;
  const frames = capture.frames;
  return {
    version:1,kind:"ribbit-engine-frames",mode:capture.mode,level:capture.level,
    timeOfDay:capture.timeOfDay,moonPhaseIndex:capture.moonPhaseIndex,
    skinId:capture.skinId,vocab:capture.vocab,
    pvpTimeLimitSeconds:capture.pvpTimeLimitSeconds,pvpFirstTo:capture.pvpFirstTo,
    pvpRoundGoalMode:capture.pvpRoundGoalMode,pvpBestOf:capture.pvpBestOf,
    duration:frames[frames.length-1].t,frames
  };
}
function validateRibbitReplayData(data) {
  if(!data || data.kind!=="ribbit-engine-frames" || data.version!==1 ||
    !["solo","pvp"].includes(data.mode) || !LEVELS[String(data.level||"").toLowerCase()] ||
    !Array.isArray(data.frames) || data.frames.length<2 || data.frames.length>8500) return false;
  let last=-1;
  for(const frame of data.frames){
    if(!frame || !Number.isFinite(Number(frame.t)) || frame.t<last || frame.t>3600000 ||
      !Array.isArray(frame.flies) || frame.flies.length>16 ||
      !frame.player || !Number.isFinite(frame.player.x) || !Number.isFinite(frame.player.y)) return false;
    last=frame.t;
  }
  return true;
}
function ribbitReplayBegin(data, caption = "REPLAY") {
  if(!validateRibbitReplayData(data)) return ribbitReplayUnavailable("REPLAY UNAVAILABLE","THIS RECORD HAS NO PLAYABLE GAME-STATE DATA");
  ribbitReplayView = {
    data,caption:String(caption||"REPLAY").toUpperCase().slice(0,65),
    position:0,lastTick:performance.now(),paused:false,rate:1,
    restore:{state:game.state, mode:game.mode},error:""
  };
  game.state="rrEngineReplay";
  document.body.classList.add("rr-engine-replay-active");
  clearHeldInput();
  return true;
}
function ribbitReplayUnavailable(title, reason) {
  ribbitReplayView = {
    data:null,caption:String(title).toUpperCase(),error:String(reason).toUpperCase(),
    position:0,lastTick:performance.now(),paused:true,rate:1,
    restore:{state:game.state,mode:game.mode}
  };
  game.state="rrEngineReplay";
  document.body.classList.add("rr-engine-replay-active");
  clearHeldInput();
  return false;
}
function ribbitReplayClose() {
  if(!ribbitReplayView) return false;
  const restore=ribbitReplayView.restore;
  ribbitReplayView=null;
  document.body.classList.remove("rr-engine-replay-active");
  game.state=restore?.state||"main";
  game.mode=restore?.mode||"solo";
  clearHeldInput();
  return true;
}
function ribbitReplaySeek(seconds) {
  if(!ribbitReplayView?.data) return;
  ribbitReplayView.position=clamp(seconds*1000,0,ribbitReplayView.data.duration||0);
  ribbitReplayView.lastTick=performance.now();
}
function ribbitReplayTick(now=performance.now()){
  if(!ribbitReplayView){ribbitReplayCaptureTick(now);return;}
  const view=ribbitReplayView, dt=Math.max(0,Math.min(now-view.lastTick,120));
  view.lastTick=now;
  if(view.data && !view.paused){
    view.position=clamp(view.position+dt*view.rate,0,view.data.duration);
    if(view.position>=view.data.duration) view.paused=true;
  }
}
function replayFrameAt(position, frames) {
  let low=0,high=frames.length-1;
  while(low<high){const mid=(low+high+1)>>1;if(frames[mid].t<=position)low=mid;else high=mid-1;}
  const a=frames[low],b=frames[Math.min(low+1,frames.length-1)];
  const factor=clamp((position-a.t)/Math.max(1,b.t-a.t),0,1);
  const lerpPosition=(p,q)=>{if(!p)return p;const out={...p};if(q){out.x=p.x+(q.x-p.x)*factor;out.y=p.y+(q.y-p.y)*factor;}return out;};
  const alternate=new Map((b.flies||[]).map(f=>[f.id,f]));
  const result={...a,player:lerpPosition(a.player,b.player),players:(a.players||[]).map((p,i)=>lerpPosition(p,b.players?.[i])),
    flies:(a.flies||[]).map(f=>{const next=alternate.get(f.id);return next?{...f,x:f.x+(next.x-f.x)*factor,y:f.y+(next.y-f.y)*factor}:f;})};
  return result;
}
function paintRibbitReplayStage() {
  const view=ribbitReplayView, data=view?.data;
  if(!data) {
    ctx.fillStyle="#102a39";ctx.fillRect(0,0,W,H);
    drawBitmapText("IN-GAME REPLAY",W/2,65,1.65,"center","#f7fdff");
    drawBitmapText(view?.caption||"REPLAY UNAVAILABLE",W/2,115,.77,"center","#eac873");
    drawBitmapText(view?.error||"PLAY A NEW ROUND TO SAVE A REPLAY",W/2,145,.55,"center","#f7fdff");
    return;
  }
  const state=replayFrameAt(view.position,data.frames);
  const gameOld={};for(const field of RIBBIT_REPLAY_GAME_FIELDS)gameOld[field]=game[field];
  const frogOld={...frog};
  const tongueOld={...tongue};
  const tutorialOld={active:tutorial.active,completeScreen:tutorial.completeScreen,dialogueOpen:tutorial.dialogueOpen};
  const pvpOld=pvpPlayers.map(p=>({...p,tongue:{...p.tongue}}));
  const fliesOld=flies.slice();
  const platformsOld=platforms,flySpawnsOld=flySpawns,vocabularyOld=VOCABULARY;
  try {
    game.state="playing";
    game.mode=data.mode;game.selectedLevelId=data.level;game.timeOfDay=data.timeOfDay;
    game.moonPhaseIndex=data.moonPhaseIndex;game.skinId=data.skinId;
    game.worldTime=state.world;game.visualTime=state.visual;game.elapsed=state.clock;
    game.targetVocabIndex=state.target;game.score=state.score;game.jumps=state.jumps;
    game.pvpRoundNumber=state.round||1;game.pvpTimeRemaining=state.roundTime||0;
    game.pvpElapsed=state.pvpElapsed||0;game.onlineMode=false;game.sandboxMode=false;
    game.pvpRoundWins=state.roundWins||[0,0];
    game.pvpTimeLimitSeconds=data.pvpTimeLimitSeconds??60;
    game.pvpFirstTo=data.pvpFirstTo??5;
    game.pvpRoundGoalMode=data.pvpRoundGoalMode||"5flies";
    game.pvpBestOf=data.pvpBestOf??3;
    game.tutorialActive=false;game.soloCriticalCatchActive=false;game.pvpCriticalCatchActive=false;
    tutorial.active=false;tutorial.completeScreen=false;tutorial.dialogueOpen=false;
    game.winPending=false;game.pvpWinPendingIndex=null;game.pvpImpactEffects=[];
    if(data.vocab?.length)VOCABULARY=normalizeVocabularyEntries(data.vocab);
    platforms=LEVELS[data.level].platforms;flySpawns=LEVELS[data.level].flySpawns;
    Object.assign(frog,state.player);
    Object.assign(tongue,state.player.tongue||{active:false});
    if(data.mode==="pvp")state.players.forEach((player,i)=>{if(pvpPlayers[i])Object.assign(pvpPlayers[i],player,{tongue:player.tongue||{active:false}});});
    flies.splice(0,flies.length,...state.flies.map(f=>({...f,spawnAge:f.spawnAge||5})));
    // Existing stage renderer draws the real world, frogs, flies, label plates,
    // effects and HUD. No re-simulation and no saving occurs here.
    ribbitReplayPreviousDrawScene();
  } finally {
    Object.assign(game,gameOld);Object.assign(frog,frogOld);Object.assign(tongue,tongueOld);
    Object.assign(tutorial,tutorialOld);
    pvpOld.forEach((player,i)=>Object.assign(pvpPlayers[i],player));
    flies.splice(0,flies.length,...fliesOld);
    platforms=platformsOld;flySpawns=flySpawnsOld;VOCABULARY=vocabularyOld;
  }
}
function paintRibbitReplayChrome() {
  const view=ribbitReplayView, data=view.data;
  ctx.save();
  ctx.fillStyle="#071721";ctx.fillRect(0,0,W,22);
  drawBitmapText(view.caption,9,7,.55,"left","#ffffff");
  drawBitmapText("SPECTATOR REPLAY",W-10,7,.50,"right","#a9edff");
  ctx.fillStyle="#071721";ctx.fillRect(0,230,W,40);
  const y=238;
  ctx.fillStyle="#e8f4f7";ctx.fillRect(9,y,38,24);ctx.fillRect(52,y,37,24);
  ctx.fillStyle="#253b45";ctx.fillRect(11,y+2,34,20);ctx.fillRect(54,y+2,33,20);
  drawBitmapText(view.paused?"PLAY":"PAUSE",28,y+9,.49,"center","#ffffff");
  drawBitmapText(`${view.rate}X`,70,y+9,.54,"center","#ffffff");
  ctx.fillStyle="#536f77";ctx.fillRect(98,y+9,284,6);
  const progress=data?.duration?clamp(view.position/data.duration,0,1):0;
  ctx.fillStyle="#49dce9";ctx.fillRect(98,y+9,Math.round(progress*284),6);
  ctx.fillStyle="#f3f9fc";ctx.fillRect(97+Math.round(progress*284),y+7,3,10);
  ctx.fillStyle="#e8f4f7";ctx.fillRect(402,y,69,24);
  ctx.fillStyle="#253b45";ctx.fillRect(404,y+2,65,20);
  drawBitmapText("EXIT",436,y+9,.67,"center","#ffffff");
  const seconds=Math.floor(view.position/1000), total=Math.floor((data?.duration||0)/1000);
  drawBitmapText(`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")} / ${Math.floor(total/60)}:${String(total%60).padStart(2,"0")}`,W/2,224,.53,"center","#f7fdff","#182f3c");
  ctx.restore();
}
function drawRibbitReplayView(){
  paintRibbitReplayStage();
  paintRibbitReplayChrome();
}
const ribbitReplayPreviousDrawScene=drawScene;
drawScene=function(...args){
  if(ribbitReplayView){drawRibbitReplayView();return;}
  return ribbitReplayPreviousDrawScene.apply(this,args);
};
function handleRibbitReplayKey(event){
  if(!ribbitReplayView)return;
  const key=event.code;
  if(!["Escape","Backspace","Space","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Equal","Minus","KeyR","Home","End"].includes(key)){
    event.preventDefault();event.stopImmediatePropagation();return;
  }
  event.preventDefault();event.stopImmediatePropagation();
  if(event.repeat && !["ArrowLeft","ArrowRight"].includes(key))return;
  if(key==="Escape"||key==="Backspace")ribbitReplayClose();
  else if(key==="Space")ribbitReplayView.paused=!ribbitReplayView.paused;
  else if(key==="ArrowLeft")ribbitReplaySeek((ribbitReplayView.position/1000)-5);
  else if(key==="ArrowRight")ribbitReplaySeek((ribbitReplayView.position/1000)+5);
  else if(key==="KeyR"||key==="Home")ribbitReplaySeek(0);
  else if(key==="End")ribbitReplaySeek(ribbitReplayView.data?.duration/1000||0);
  else if(["ArrowUp","Equal"].includes(key))ribbitReplayView.rate=Math.min(4,ribbitReplayView.rate*2);
  else if(["ArrowDown","Minus"].includes(key))ribbitReplayView.rate=Math.max(.25,ribbitReplayView.rate/2);
}
window.addEventListener("keydown",handleRibbitReplayKey,true);
canvas.addEventListener("pointerdown",event=>{
  if(!ribbitReplayView)return;
  event.preventDefault();event.stopImmediatePropagation();
  const p=getCanvasPoint(event);
  if(p.y<235)return;
  if(p.x>=400)ribbitReplayClose();
  else if(p.x<50)ribbitReplayView.paused=!ribbitReplayView.paused;
  else if(p.x<91)ribbitReplayView.rate=ribbitReplayView.rate===1?2:ribbitReplayView.rate===2?4:ribbitReplayView.rate===4?.5:1;
  else if(p.x>=98&&p.x<=383)ribbitReplaySeek(((p.x-98)/284)*(ribbitReplayView.data?.duration||0)/1000);
},true);
window.RibbitEngineReplay=Object.freeze({
  mime:RIBBIT_ENGINE_REPLAY_MIME,
  tick:ribbitReplayTick,
  exportCurrent:ribbitReplayExportCurrent,
  finishCapture:finishRibbitReplayCapture,
  play:ribbitReplayBegin,
  close:ribbitReplayClose,
  unavailable:ribbitReplayUnavailable,
  active:()=>!!ribbitReplayView
});
