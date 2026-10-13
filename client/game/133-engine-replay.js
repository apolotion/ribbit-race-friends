// Ribbit Race Friends — 60 Hz spectator replay engine.
// Preserves in-game frames, vocabulary signs, critical-catch cameras, synthesized
// sound cues and the entire victory dance. Older 1.7.32 frame records still play.
const RIBBIT_ENGINE_REPLAY_MIME = "application/vnd.ribbit-race.frames+json";
const RIBBIT_REPLAY_FPS = 60;
const RIBBIT_REPLAY_FRAME_INTERVAL = 1000/RIBBIT_REPLAY_FPS;
const RIBBIT_REPLAY_MAX_FRAMES = 12000;
const RIBBIT_REPLAY_DANCE_MILLIS = 3000;
const RIBBIT_REPLAY_RESULT_HOLD = 2400;
const RIBBIT_REPLAY_SNAPSHOT_FIELDS = [
  "x","y","w","h","vx","vy","dir","grounded","charging","charge","landingSquash",
  "blinkTimer","blinking","score","skinId","bonked","stunTimer","bonkLandingPopTimer",
  "collisionCooldown","firstJumpMade","airTime","catchSparkleTimer","wrongCatchBubbleTimer","danceTime",
  "jumpStreakTimer"
];
const RIBBIT_REPLAY_GAME_FIELDS = [
  "mode","state","selectedLevelId","timeOfDay","moonPhaseIndex","worldTime","visualTime",
  "score","jumps","elapsed","targetVocabIndex","skinId","pvpRoundNumber","pvpTimeRemaining",
  "pvpElapsed","pvpTimeLimitSeconds","pvpFirstTo","pvpRoundGoalMode","pvpBestOf",
  "pvpRoundWins","pvpSuddenDeath","onlineMode","pvpCpuEnabled","sandboxMode",
  "soloCriticalCatchActive","soloCriticalCatchElapsed","soloCriticalCatchDuration",
  "soloCriticalCatchX","soloCriticalCatchY","soloCriticalCatchScreenX","soloCriticalCatchScreenY",
  "pvpCriticalCatchActive","pvpCriticalCatchElapsed","pvpCriticalCatchDuration",
  "pvpCriticalCatchWinnerIndex","pvpCriticalCatchKind","pvpCriticalCatchX","pvpCriticalCatchY",
  "pvpCriticalCatchScreenX","pvpCriticalCatchScreenY","pvpCriticalCatchFlyVisual",
  "winPending","pvpWinPendingIndex","finishTime","soloTimeRemaining","soloTimeLimitSeconds","soloTimedOut",
  "pvpCelebrationWinnerIndex","pvpWinnerIndex","pvpMatchWinnerIndex","messageTimer",
  "tutorialActive","pvpImpactEffects","newBestTime","newFewestJumps"
];
let ribbitReplayCapture = null;
let ribbitReplayLastCapture = null;
let ribbitReplayView = null;
const ribbitReplayCompletionWaiters = [];

function captureRibbitReplayPlayer(player){
  if(!player)return null;
  const state={};
  for(const field of RIBBIT_REPLAY_SNAPSHOT_FIELDS){
    const value=player[field];
    if(["number","string","boolean"].includes(typeof value))state[field]=value;
  }
  if(player.tongue){
    const t=player.tongue;
    state.tongue={active:!!t.active,elapsed:Number(t.elapsed)||0,duration:Number(t.duration)||.24,
      targetX:Number(t.targetX)||0,targetY:Number(t.targetY)||0,
      targetFlyId:t.targetFlyId??null,captured:!!t.captured};
  }
  // Preserve the trails drawn behind charge-powered jumps and midair catches.
  if(Array.isArray(player.afterimages))state.afterimages=player.afterimages.slice(-20).map(image=>({...image}));
  return state;
}
function captureRibbitReplayFly(fly){
  return {
    id:fly.id,x:fly.x,y:fly.y,baseX:fly.baseX,baseY:fly.baseY,
    phase:fly.phase,spawnAge:fly.spawnAge,spawnIndex:fly.spawnIndex,
    vocabIndex:fly.vocabIndex,state:fly.state,touchLocked:fly.touchLocked,
    blockedPromptSerial:fly.blockedPromptSerial,pvpBlockedPromptSerials:fly.pvpBlockedPromptSerials
  };
}
function captureRibbitReplaySnapshot(now){
  const capture=ribbitReplayCapture;
  const mode=game.mode==="pvp"?"pvp":"solo";
  const visual={};
  for(const field of RIBBIT_REPLAY_GAME_FIELDS){
    const value=game[field];
    if(["number","string","boolean"].includes(typeof value) || value===null) visual[field]=value;
  }
  if(Array.isArray(game.pvpRoundWins))visual.pvpRoundWins=[...game.pvpRoundWins];
  if(game.pvpCriticalCatchFlyVisual)visual.pvpCriticalCatchFlyVisual={...game.pvpCriticalCatchFlyVisual};
  return {
    t:Math.max(0,Math.round(now-capture.startedAt-capture.pausedMillis)),
    clock:game.elapsed,world:game.worldTime,visual:game.visualTime,
    target:game.targetVocabIndex,score:game.score,jumps:game.jumps,
    round:game.pvpRoundNumber,roundTime:game.pvpTimeRemaining,
    roundWins:Array.isArray(game.pvpRoundWins)?[...game.pvpRoundWins]:[],
    pvpElapsed:game.pvpElapsed,phase:game.state,gameState:visual,
    player:captureRibbitReplayPlayer(frog),
    // Solo uses a SHARED tongue object, not frog.tongue (Versus has per-frog
    // tongues). Critical-catch replays need this for the visible tongue arc.
    tongue:{...tongue},
    players:mode==="pvp"?pvpPlayers.map(captureRibbitReplayPlayer):[],
    flies:flies.filter(fly=>fly&&fly.state!=="eaten").map(captureRibbitReplayFly)
  };
}
function finishRibbitReplayCapture(){
  if(!ribbitReplayCapture)return ribbitReplayLastCapture;
  if(ribbitReplayCapture.frames.length)ribbitReplayLastCapture=ribbitReplayCapture;
  ribbitReplayCapture=null;
  for(const resolve of ribbitReplayCompletionWaiters.splice(0))resolve();
  return ribbitReplayLastCapture;
}
function ribbitReplayCaptureTick(now=performance.now()){
  if(ribbitReplayView)return;
  const isSoloDance=!!(ribbitReplayCapture?.mode==="solo" && game.mode==="solo" && game.state==="won");
  const normalGame=game.state==="playing" && ["solo","pvp"].includes(game.mode) &&
    !tutorial.active && !game.tutorialActive && !game.sandboxMode && !OnlineVersus.isSpectating();
  if(!normalGame&&!isSoloDance){
    const betweenRounds=ribbitReplayCapture?.mode==="pvp" &&
      ["pvpCelebration","pvpSuddenDeathAlert"].includes(game.state);
    if(ribbitReplayCapture && (["paused","countdown"].includes(game.state)||betweenRounds)){
      if(!ribbitReplayCapture.pausedAt)ribbitReplayCapture.pausedAt=now;
    }else if(ribbitReplayCapture)finishRibbitReplayCapture();
    return;
  }
  if(ribbitReplayCapture?.pausedAt){
    ribbitReplayCapture.pausedMillis+=Math.max(0,now-ribbitReplayCapture.pausedAt);
    ribbitReplayCapture.pausedAt=0;
  }
  if(isSoloDance){
    if(!ribbitReplayCapture.victoryAt){
      ribbitReplayCapture.victoryAt=now;
      ribbitReplayCapture.final={
        time:Number(game.finishTime??game.elapsed)||0,
        jumps:Number(game.jumps)||0,
        score:Number(game.score)||0,
        danceMs:RIBBIT_REPLAY_DANCE_MILLIS
      };
    }
  }else{
    const mode=game.mode,level=String(game.selectedLevelId||"park").toLowerCase();
    const changed=!ribbitReplayCapture || ribbitReplayCapture.mode!==mode ||
      ribbitReplayCapture.level!==level ||
      (mode!=="pvp"&&Number(game.elapsed||0)<Number(ribbitReplayCapture.lastGameTime||0)-.15);
    if(changed){
      if(ribbitReplayCapture)finishRibbitReplayCapture();
      ribbitReplayCapture={
        v:2,kind:"ribbit-engine-frames",fps:RIBBIT_REPLAY_FPS,mode,level,
        timeOfDay:game.timeOfDay,moonPhaseIndex:game.moonPhaseIndex,skinId:game.skinId,
        pvpTimeLimitSeconds:game.pvpTimeLimitSeconds,pvpFirstTo:game.pvpFirstTo,
        pvpRoundGoalMode:game.pvpRoundGoalMode,pvpBestOf:game.pvpBestOf,
        vocab:VOCABULARY.map(e=>({english:e.english,spanish:e.spanish})),
        startedAt:now,lastAt:-Infinity,lastGameTime:0,pausedAt:0,pausedMillis:0,
        victoryAt:0,final:null,frames:[],sounds:[]
      };
    }
  }
  const capture=ribbitReplayCapture;
  if(now-capture.lastAt>=RIBBIT_REPLAY_FRAME_INTERVAL-.6 && capture.frames.length<RIBBIT_REPLAY_MAX_FRAMES){
    capture.lastAt=now;
    capture.lastGameTime=Number(game.elapsed)||0;
    capture.frames.push(captureRibbitReplaySnapshot(now));
  }
  if(isSoloDance && now-capture.victoryAt>=RIBBIT_REPLAY_DANCE_MILLIS){
    if(capture.frames.length && capture.frames.at(-1).phase!=="won")capture.frames.push(captureRibbitReplaySnapshot(now));
    finishRibbitReplayCapture();
  }
  if(capture.frames.length>=RIBBIT_REPLAY_MAX_FRAMES)finishRibbitReplayCapture();
}
// Every in-game sound is synthesized through tone(); capture its oscillator
// parameters rather than an unsynchronized microphone/browser video recording.
function ribbitReplayRecordTone(frequency,duration,volume,slide,delay){
  const capture=ribbitReplayCapture;
  if(!capture || capture.pausedAt || ribbitReplayView || capture.sounds.length>=10000)return;
  const at=performance.now()-capture.startedAt-capture.pausedMillis+Math.max(0,Number(delay)||0)*1000;
  const safe=[frequency,duration,volume,slide].every(value=>Number.isFinite(Number(value)));
  if(!safe||at<0)return;
  capture.sounds.push({t:Math.round(at),f:+frequency,d:+duration,v:+volume,s:+slide});
}
window.RibbitReplaySoundCapture=ribbitReplayRecordTone;
function ribbitReplayExportCurrent(){
  const capture=ribbitReplayCapture?.frames.length?ribbitReplayCapture:ribbitReplayLastCapture;
  if(!capture||capture.frames.length<2)return null;
  const frames=capture.frames;
  const duration=frames[frames.length-1].t+(capture.final?RIBBIT_REPLAY_RESULT_HOLD:0);
  return {
    version:1,kind:"ribbit-engine-frames",fps:capture.fps||13,
    mode:capture.mode,level:capture.level,timeOfDay:capture.timeOfDay,
    moonPhaseIndex:capture.moonPhaseIndex,skinId:capture.skinId,vocab:capture.vocab,
    pvpTimeLimitSeconds:capture.pvpTimeLimitSeconds,pvpFirstTo:capture.pvpFirstTo,
    pvpRoundGoalMode:capture.pvpRoundGoalMode,pvpBestOf:capture.pvpBestOf,
    duration,final:capture.final||undefined,
    sounds:[...(capture.sounds||[])].sort((a,b)=>a.t-b.t),frames
  };
}
function ribbitReplayWhenComplete(){
  if(!ribbitReplayCapture || ribbitReplayCapture.mode!=="solo" || game.state!=="won")return Promise.resolve();
  return new Promise(resolve=>{
    const done=()=>{clearTimeout(timeout);resolve();};
    ribbitReplayCompletionWaiters.push(done);
    const timeout=setTimeout(()=>{
      const index=ribbitReplayCompletionWaiters.indexOf(done);
      if(index>=0)ribbitReplayCompletionWaiters.splice(index,1);
      resolve();
    },4400);
  });
}
function validateRibbitReplayData(data){
  if(!data||data.kind!=="ribbit-engine-frames"||data.version!==1||
    !["solo","pvp"].includes(data.mode)||!LEVELS[String(data.level||"").toLowerCase()]||
    !Array.isArray(data.frames)||data.frames.length<2||data.frames.length>RIBBIT_REPLAY_MAX_FRAMES)return false;
  let last=-1;
  for(const frame of data.frames){
    if(!frame||!Number.isFinite(Number(frame.t))||frame.t<last||frame.t>3600000||
      !Array.isArray(frame.flies)||frame.flies.length>16||
      !frame.player||!Number.isFinite(frame.player.x)||!Number.isFinite(frame.player.y))return false;
    last=frame.t;
  }
  if(!Number.isFinite(data.duration)||data.duration<last||data.duration>3600000)return false;
  if(data.sounds && (!Array.isArray(data.sounds)||data.sounds.length>10000))return false;
  return true;
}

// The stage belongs to the canvas alone; the spectator toolbar is regular HTML
// OUTSIDE the canvas. This avoids the former top/bottom overlays hiding flies,
// fly labels, the Find the Match clue, and the bottom score panel.
let ribbitReplayControls=null;
function ribbitReplayCreateControls(){
  if(ribbitReplayControls)return ribbitReplayControls;
  const host=document.getElementById("game-frame");
  if(!host)return null;
  const header=document.createElement("header");
  header.id="rr-spectator-header";
  header.innerHTML='<span class="rr-spectator-caption"></span><span class="rr-spectator-badge">SPECTATOR REPLAY <small>60 FPS</small></span>';
  const footer=document.createElement("nav");
  footer.id="rr-spectator-toolbar";
  footer.setAttribute("aria-label","Replay playback controls");
  footer.innerHTML=`
    <button type="button" data-replay-action="play" aria-label="Pause or play">PAUSE</button>
    <button type="button" data-replay-action="speed" aria-label="Change playback speed">1X</button>
    <label class="rr-replay-progress" aria-label="Timeline">
      <input type="range" min="0" max="10000" step="1" value="0" aria-label="Seek replay timeline" />
    </label>
    <span class="rr-replay-time" aria-live="off">0:00 / 0:00</span>
    <button type="button" data-replay-action="fullscreen" title="Fullscreen (F)">⛶</button>
    <button type="button" data-replay-action="exit">EXIT</button>`;
  host.append(header,footer);
  const seek=footer.querySelector("input");
  const startScrub=event=>{
    const view=ribbitReplayView;if(!view?.data)return;
    event.stopPropagation();
    view.scrubbing=true;view.wasPaused=view.paused;view.paused=true;
    try{seek.setPointerCapture(event.pointerId);}catch(_){}
  };
  const endScrub=()=>{
    const view=ribbitReplayView;
    if(view?.scrubbing){view.scrubbing=false;view.paused=view.wasPaused;view.lastTick=performance.now();}
  };
  seek.addEventListener("pointerdown",startScrub);
  seek.addEventListener("pointerup",endScrub);
  seek.addEventListener("pointercancel",endScrub);
  window.addEventListener("pointerup",endScrub);
  seek.addEventListener("input",event=>{
    if(!ribbitReplayView?.data)return;
    ribbitReplaySeek((Number(event.target.value)/10000)*(ribbitReplayView.data.duration||0)/1000);
  });
  footer.addEventListener("click",event=>{
    const action=event.target.closest("button")?.dataset.replayAction;
    if(!action||!ribbitReplayView)return;
    event.stopPropagation();
    if(action==="exit")ribbitReplayClose();
    else if(action==="play")ribbitReplayView.paused=!ribbitReplayView.paused;
    else if(action==="speed"){
      const rates=[.25,.5,.75,1,1.25,1.5,1.75,2,4];
      const index=rates.findIndex(n=>n===ribbitReplayView.rate);
      ribbitReplayView.rate=rates[(index+1)%rates.length];
    }else if(action==="fullscreen")toggleRibbitFullscreen();
  });
  ribbitReplayControls={host,header,footer,seek,
    caption:header.querySelector(".rr-spectator-caption"),
    badge:header.querySelector(".rr-spectator-badge small"),
    play:footer.querySelector('[data-replay-action="play"]'),
    speed:footer.querySelector('[data-replay-action="speed"]'),
    time:footer.querySelector(".rr-replay-time")};
  return ribbitReplayControls;
}
function ribbitReplayShowControls(){
  const controls=ribbitReplayCreateControls();
  if(!controls)return;
  controls.host.classList.add("rr-replay-layout");
  controls.caption.textContent=ribbitReplayView?.caption||"REPLAY";
  controls.badge.textContent=ribbitReplayView?.data?.fps===60?"60 FPS":"ARCHIVED FRAMES";
  ribbitReplayUpdateControls();
}
function ribbitReplayUpdateControls(){
  const controls=ribbitReplayControls,view=ribbitReplayView;
  if(!controls||!view)return;
  const duration=view.data?.duration||0;
  const format=ms=>{
    const value=Math.max(0,Math.floor(ms/1000));
    return `${Math.floor(value/60)}:${String(value%60).padStart(2,"0")}`;
  };
  controls.play.textContent=view.paused?"PLAY":"PAUSE";
  controls.speed.textContent=`${view.rate}X`;
  controls.time.textContent=`${format(view.position)} / ${format(duration)}`;
  if(!view.scrubbing){
    const progress=duration?view.position/duration:0;
    controls.seek.value=String(Math.round(10000*progress));
    controls.seek.style.setProperty("--rr-replay-progress",`${(progress*100).toFixed(2)}%`);
  }
}
function ribbitReplayBegin(data,caption="REPLAY"){
  if(!validateRibbitReplayData(data))return ribbitReplayUnavailable("REPLAY UNAVAILABLE","THIS RECORD HAS NO PLAYABLE GAME-STATE DATA");
  if(ribbitReplayCapture)finishRibbitReplayCapture();
  ribbitReplayView={
    data,caption:String(caption||"REPLAY").toUpperCase().slice(0,65),
    position:0,lastTick:performance.now(),paused:false,rate:1,
    scrubbing:false,wasPaused:false,soundIndex:0,
    restore:{state:game.state,mode:game.mode},error:""
  };
  game.state="rrEngineReplay";
  document.body.classList.add("rr-engine-replay-active");
  ribbitReplayShowControls();
  clearHeldInput();
  return true;
}
function ribbitReplayUnavailable(title,reason){
  if(ribbitReplayCapture)finishRibbitReplayCapture();
  ribbitReplayView={
    data:null,caption:String(title).toUpperCase(),error:String(reason).toUpperCase(),
    position:0,lastTick:performance.now(),paused:true,rate:1,
    scrubbing:false,wasPaused:true,soundIndex:0,
    restore:{state:game.state,mode:game.mode}
  };
  game.state="rrEngineReplay";
  document.body.classList.add("rr-engine-replay-active");
  ribbitReplayShowControls();
  clearHeldInput();
  return false;
}
function ribbitReplayClose(){
  if(!ribbitReplayView)return false;
  const restore=ribbitReplayView.restore;
  ribbitReplayView=null;
  document.body.classList.remove("rr-engine-replay-active");
  ribbitReplayControls?.host?.classList.remove("rr-replay-layout");
  game.state=restore?.state||"main";
  game.mode=restore?.mode||"solo";
  clearHeldInput();
  return true;
}
function ribbitReplaySoundAtOrAfter(time,sounds){
  let lo=0,hi=sounds.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(sounds[mid].t<time)lo=mid+1;else hi=mid;}
  return lo;
}
function ribbitReplaySeek(seconds){
  if(!ribbitReplayView?.data)return;
  const view=ribbitReplayView;
  view.position=clamp(seconds*1000,0,view.data.duration||0);
  view.soundIndex=ribbitReplaySoundAtOrAfter(view.position+1,view.data.sounds||[]);
  view.lastTick=performance.now();
  ribbitReplayUpdateControls();
}
function ribbitReplayTick(now=performance.now()){
  if(!ribbitReplayView){ribbitReplayCaptureTick(now);return;}
  const view=ribbitReplayView,dt=Math.max(0,Math.min(now-view.lastTick,120));
  view.lastTick=now;
  if(view.data&&!view.paused&&!view.scrubbing){
    const prior=view.position;
    view.position=clamp(prior+dt*view.rate,0,view.data.duration);
    const sounds=view.data.sounds||[];
    while(view.soundIndex<sounds.length && sounds[view.soundIndex].t<=view.position){
      const sound=sounds[view.soundIndex++];
      if(sound.t<prior||sound.t>view.data.duration)continue;
      // Sound is not re-triggered by scrub, seeking, or frame-stepping.
      if(Number.isFinite(sound.f)&&sound.f>=45&&sound.f<=20000&&
        Number.isFinite(sound.d)&&sound.d>0&&sound.d<=3&&
        Number.isFinite(sound.v)&&sound.v>=0&&sound.v<=.5){
        tone(sound.f,sound.d,sound.v,Number(sound.s)||0);
      }
    }
    if(view.position>=view.data.duration)view.paused=true;
  }
  ribbitReplayUpdateControls();
}
function replayFrameAt(position,frames){
  let low=0,high=frames.length-1;
  while(low<high){const mid=(low+high+1)>>1;if(frames[mid].t<=position)low=mid;else high=mid-1;}
  const a=frames[low],b=frames[Math.min(low+1,frames.length-1)];
  const factor=clamp((position-a.t)/Math.max(1,b.t-a.t),0,1);
  const lerpPosition=(p,q)=>{
    if(!p)return p;
    const out={...p};
    if(q){out.x=p.x+(q.x-p.x)*factor;out.y=p.y+(q.y-p.y)*factor;}
    return out;
  };
  const alternate=new Map((b.flies||[]).map(f=>[f.id,f]));
  return {...a,player:lerpPosition(a.player,b.player),
    players:(a.players||[]).map((p,i)=>lerpPosition(p,b.players?.[i])),
    flies:(a.flies||[]).map(f=>{const next=alternate.get(f.id);return next?
      {...f,x:f.x+(next.x-f.x)*factor,y:f.y+(next.y-f.y)*factor}:f;})};
}
function paintRibbitReplayStage(){
  const view=ribbitReplayView,data=view?.data;
  if(!data){
    ctx.fillStyle="#102a39";ctx.fillRect(0,0,W,H);
    drawBitmapText("IN-GAME REPLAY",W/2,65,1.65,"center","#f7fdff");
    drawBitmapText(view?.caption||"REPLAY UNAVAILABLE",W/2,115,.77,"center","#eac873");
    drawBitmapText(view?.error||"PLAY A NEW ROUND TO SAVE A REPLAY",W/2,145,.55,"center","#f7fdff");
    return;
  }
  const state=replayFrameAt(view.position,data.frames);
  const gameOld={};for(const field of RIBBIT_REPLAY_GAME_FIELDS)gameOld[field]=game[field];
  const frogOld={...frog},tongueOld={...tongue};
  const tutorialOld={active:tutorial.active,completeScreen:tutorial.completeScreen,dialogueOpen:tutorial.dialogueOpen};
  const pvpOld=pvpPlayers.map(p=>({...p,tongue:{...p.tongue}}));
  const fliesOld=flies.slice();
  const platformsOld=platforms,flySpawnsOld=flySpawns,vocabularyOld=VOCABULARY;
  const labelsOld=window.RibbitRaceFinalCatchLabelsGone;
  const finalHold=!!data.final && view.position>=data.frames[data.frames.length-1].t;
  try{
    game.state=state.phase==="won"?"won":"playing";
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
    if(state.gameState)Object.assign(game,state.gameState);
    // Never enter pause/tutorial/save screens as a side effect of rendering.
    game.state=state.phase==="won"?"won":"playing";
    game.onlineMode=false;game.tutorialActive=false;game.sandboxMode=false;
    platforms=LEVELS[data.level].platforms;flySpawns=LEVELS[data.level].flySpawns;
    Object.assign(frog,state.player);
    Object.assign(tongue,state.tongue||state.player.tongue||{active:false});
    if(data.mode==="pvp")state.players.forEach((player,i)=>{
      if(pvpPlayers[i])Object.assign(pvpPlayers[i],player,{tongue:player.tongue||{active:false}});
    });
    flies.splice(0,flies.length,...state.flies.map(f=>({...f,spawnAge:f.spawnAge||5})));
    // The LIVE game may have hidden all final-catch labels after completing its
    // last round; archived flies still need their labels at every recorded frame.
    window.RibbitRaceFinalCatchLabelsGone=false;
    // Existing scene engine paints the original fly labels, HUD and slow-mo camera.
    ribbitReplayPreviousDrawScene();
    if(finalHold){
      const final=data.final,skin=getSelectedSkin();
      ctx.fillStyle="rgba(9,26,34,.82)";ctx.fillRect(103,84,274,78);
      ctx.fillStyle=COLORS.ink;ctx.fillRect(106,86,268,73);
      ctx.fillStyle="#f7fdff";ctx.fillRect(110,90,260,65);
      ctx.fillStyle=skin.mid;ctx.fillRect(112,92,256,22);
      ctx.fillStyle=skin.light;ctx.fillRect(116,95,248,3);
      drawBitmapText("REPLAY COMPLETE!",W/2,99,1.15,"center",COLORS.white,skin.dark);
      const fmt=typeof formatTime==="function"?formatTime(final.time):`${Number(final.time).toFixed(2)}S`;
      drawBitmapText(`FINAL TIME ${fmt}`,W/2,122,.86,"center","#34484f");
      drawBitmapText(`${final.jumps} JUMPS  •  ${final.score} FLIES`,W/2,140,.78,"center","#34484f");
    }
  }finally{
    Object.assign(game,gameOld);Object.assign(frog,frogOld);Object.assign(tongue,tongueOld);
    Object.assign(tutorial,tutorialOld);
    pvpOld.forEach((player,i)=>Object.assign(pvpPlayers[i],player));
    flies.splice(0,flies.length,...fliesOld);
    platforms=platformsOld;flySpawns=flySpawnsOld;VOCABULARY=vocabularyOld;
    window.RibbitRaceFinalCatchLabelsGone=labelsOld;
  }
}
// Replays suppress ONLY the standard win modal, so the frog remains visible
// and dances for all three recorded seconds. The replay's final stats follow it.
const ribbitReplayPreviousDrawVictoryScreen=drawVictoryScreen;
drawVictoryScreen=function(...args){
  if(ribbitReplayView?.data)return;
  return ribbitReplayPreviousDrawVictoryScreen.apply(this,args);
};
function paintRibbitReplayChrome(){ribbitReplayUpdateControls();}
function drawRibbitReplayView(){
  paintRibbitReplayStage();
  paintRibbitReplayChrome();
}
const ribbitReplayPreviousDrawScene=drawScene;
drawScene=function(...args){
  if(ribbitReplayView){drawRibbitReplayView();return;}
  return ribbitReplayPreviousDrawScene.apply(this,args);
};
function ribbitReplayAdjustRate(step){
  if(!ribbitReplayView)return;
  ribbitReplayView.rate=clamp(Math.round((ribbitReplayView.rate+step)*4)/4,.25,2);
}
function handleRibbitReplayKey(event){
  if(!ribbitReplayView)return;
  const key=event.code;
  const supported=["Escape","Backspace","Space","ArrowLeft","ArrowRight","ArrowUp","ArrowDown",
    "Equal","Minus","KeyF","KeyJ","KeyL","KeyR","Home","End","Comma","Period",
    ...Array.from({length:10},(_,i)=>`Digit${i}`),...Array.from({length:10},(_,i)=>`Numpad${i}`)];
  if(!supported.includes(key)){
    event.preventDefault();event.stopImmediatePropagation();return;
  }
  event.preventDefault();event.stopImmediatePropagation();
  if(event.repeat && !["ArrowLeft","ArrowRight","KeyJ","KeyL","Comma","Period"].includes(key))return;
  const view=ribbitReplayView;
  if(key==="Escape"||key==="Backspace")ribbitReplayClose();
  else if(key==="Space")view.paused=!view.paused;
  else if(key==="ArrowLeft")ribbitReplaySeek(view.position/1000-5);
  else if(key==="ArrowRight")ribbitReplaySeek(view.position/1000+5);
  else if(key==="KeyJ")ribbitReplaySeek(view.position/1000-10);
  else if(key==="KeyL")ribbitReplaySeek(view.position/1000+10);
  else if(key==="KeyF")toggleRibbitFullscreen();
  else if(key==="KeyR")view.rate=view.rate===4?1:4;
  else if(key==="Home")ribbitReplaySeek(0);
  else if(key==="End")ribbitReplaySeek(view.data?.duration/1000||0);
  else if(key==="Comma"&&event.shiftKey||key==="ArrowDown"||key==="Minus")ribbitReplayAdjustRate(-.25);
  else if(key==="Period"&&event.shiftKey||key==="ArrowUp"||key==="Equal")ribbitReplayAdjustRate(.25);
  else if(key==="Comma")ribbitReplaySeek((view.position+(1000/RIBBIT_REPLAY_FPS))/1000);
  else if(key==="Period")ribbitReplaySeek((view.position-(1000/RIBBIT_REPLAY_FPS))/1000);
  else if(/^Digit[0-9]$/.test(key)||/^Numpad[0-9]$/.test(key)){
    const tenth=Number(key.slice(-1));
    ribbitReplaySeek(tenth*(view.data?.duration||0)/10000);
  }
  ribbitReplayUpdateControls();
}
window.addEventListener("keydown",handleRibbitReplayKey,true);
canvas.addEventListener("pointerdown",event=>{
  if(!ribbitReplayView)return;
  // On the replay canvas all clicks are spectator-only; the toolbar owns input.
  event.preventDefault();event.stopImmediatePropagation();
},true);
window.RibbitEngineReplay=Object.freeze({
  mime:RIBBIT_ENGINE_REPLAY_MIME,fps:RIBBIT_REPLAY_FPS,
  tick:ribbitReplayTick,exportCurrent:ribbitReplayExportCurrent,
  finishCapture:finishRibbitReplayCapture,whenComplete:ribbitReplayWhenComplete,
  play:ribbitReplayBegin,close:ribbitReplayClose,
  seek:ribbitReplaySeek,unavailable:ribbitReplayUnavailable,
  active:()=>!!ribbitReplayView
});
