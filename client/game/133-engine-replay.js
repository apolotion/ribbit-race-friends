// Ribbit Race Friends — 60 Hz spectator replay engine.
// Preserves in-game frames, vocabulary signs, critical-catch cameras, synthesized
// sound cues and the entire victory dance. Older 1.7.32 frame records still play.
const RIBBIT_ENGINE_REPLAY_MIME = "application/vnd.ribbit-race.frames+json";
const RIBBIT_REPLAY_FPS = 60;
const RIBBIT_REPLAY_FRAME_INTERVAL = 1000/RIBBIT_REPLAY_FPS;
const RIBBIT_REPLAY_COUNTDOWN_STEP_MS = 750;
const RIBBIT_REPLAY_MAX_FRAMES = 30000; // Full best-of sets at 60 Hz, including countdowns and result transitions.
const RIBBIT_REPLAY_DANCE_MILLIS = 3000; // recorded dance frames; the last second is generated for playback
const RIBBIT_REPLAY_SCORE_DELAY = 1000; // show the hopping frog alone for one second
const RIBBIT_REPLAY_SCORE_HOLD = 3000; // show the centered score while the frog keeps hopping
const RIBBIT_REPLAY_RESULT_HOLD = 1000; // one synthetic second after the recorded 3-second dance
const RIBBIT_REPLAY_SCHEMA_VERSION = 2; // v1 recordings from Polish 44–51 remain readable
const RIBBIT_REPLAY_SNAPSHOT_FIELDS = [
  "x","y","w","h","vx","vy","dir","grounded","charging","charge","landingSquash",
  "blinkTimer","blinking","score","skinId","bonked","stunTimer","bonkLandingPopTimer",
  "collisionCooldown","firstJumpMade","airTime","catchSparkleTimer","wrongCatchBubbleTimer","danceTime",
  "jumpStreakTimer","recoveryFlipTimer"
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
  "flyLabelReturnAlpha",
  "winPending","pvpWinPendingIndex","finishTime","soloTimeRemaining","soloTimeLimitSeconds","soloTimedOut",
  "pvpCelebrationWinnerIndex","pvpWinnerIndex","pvpMatchWinnerIndex","messageTimer",
  "tutorialActive","pvpImpactEffects","newBestTime","newFewestJumps",
  "countdownNumber","countdownTimer"
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
  if(game.soloCriticalCatchFlyVisual)visual.soloCriticalCatchFlyVisual={...game.soloCriticalCatchFlyVisual};
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
  const validRecording = ["solo","pvp"].includes(game.mode) && !tutorial.active &&
    !game.tutorialActive && !game.sandboxMode && !OnlineVersus.isSpectating();
  // A Versus SET spans several rounds. The old recorder stopped at the first
  // celebration and Frog Tags consequently saved only one round of a best-of.
  const continuingSet = ribbitReplayCapture?.mode === "pvp" && game.mode === "pvp";
  const initialCountdown = validRecording && game.state === "countdown" &&
    Number(game.countdownNumber ?? 3) > 0 &&
    !OnlineVersus.preparingStart?.() &&
    ((continuingSet && ribbitReplayCapture.frames.length > 0) ||
      !ribbitReplayCapture || ribbitReplayCapture.initialCountdownActive);
  // Do not infer new-game countdowns from elapsed time: online clients may
  // enter the synchronized 3-2-1 with an already-updated game clock.
  const setResult = validRecording && continuingSet &&
    ["pvpCelebration","won","pvpSuddenDeathAlert"].includes(game.state);
  const normalGame = validRecording && (game.state === "playing" || initialCountdown || setResult);
  if(!normalGame&&!isSoloDance){
    const betweenRounds=ribbitReplayCapture?.mode==="pvp" &&
      ["pvpCelebration","pvpSuddenDeathAlert","won","countdown"].includes(game.state);
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
        startT:Math.max(0,Math.round(now-ribbitReplayCapture.startedAt-ribbitReplayCapture.pausedMillis)),
        danceMs:RIBBIT_REPLAY_DANCE_MILLIS,
        scoreDelayMs:RIBBIT_REPLAY_SCORE_DELAY,
        scoreHoldMs:RIBBIT_REPLAY_SCORE_HOLD
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
        v:RIBBIT_REPLAY_SCHEMA_VERSION,kind:"ribbit-engine-frames",fps:RIBBIT_REPLAY_FPS,mode,level,recordedAt:Date.now(),
        recordedTimeZone:Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        timeOfDay:game.timeOfDay,moonPhaseIndex:game.moonPhaseIndex,skinId:game.skinId,
        pvpTimeLimitSeconds:game.pvpTimeLimitSeconds,pvpFirstTo:game.pvpFirstTo,
        pvpRoundGoalMode:game.pvpRoundGoalMode,pvpBestOf:game.pvpBestOf,
        // Freeze map geometry with the recording. Newer map revisions should
        // not move the platforms under an older recording's frog coordinates.
        stageLayout:{platforms:(LEVELS[level]?.platforms||[]).map(p=>({...p})),
          flySpawns:(LEVELS[level]?.flySpawns||[]).map(p=>({...p}))},
        vocab:VOCABULARY.map(e=>({english:e.english,spanish:e.spanish})),
        startedAt:now,lastAt:-Infinity,lastGameTime:0,pausedAt:0,pausedMillis:0,
        initialCountdownActive:initialCountdown,victoryAt:0,final:null,frames:[],sounds:[]
      };
    }
  }
  const capture=ribbitReplayCapture;
  if(capture && game.state === "playing") capture.initialCountdownActive = false;
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
// Called before the three-count sound, so the recording includes 3, 2, 1,
// then the game itself rather than beginning on the first Space release.
function ribbitReplayCaptureCountdownStart(now=performance.now()) {
  if (ribbitReplayView || ribbitReplayCapture || tutorial.active || game.tutorialActive ||
      OnlineVersus.isSpectating() || game.state !== "countdown" ||
      Number(game.countdownNumber ?? 3) < 1 || OnlineVersus.preparingStart?.()) return;
  ribbitReplayCaptureTick(now);
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
  const duration=capture.final
    ? Math.max(frames[frames.length-1].t,capture.final.startT+RIBBIT_REPLAY_SCORE_DELAY+RIBBIT_REPLAY_SCORE_HOLD)
    : frames[frames.length-1].t;
  return {
    version:RIBBIT_REPLAY_SCHEMA_VERSION,kind:"ribbit-engine-frames",fps:capture.fps||RIBBIT_REPLAY_FPS,
    compatibility:{frameSchema:RIBBIT_REPLAY_SCHEMA_VERSION,minimumPlayerVersion:1,recordedBy:"1.7.53"},
    mode:capture.mode,level:capture.level,recordedAt:capture.recordedAt,
    recordedTimeZone:capture.recordedTimeZone,timeOfDay:capture.timeOfDay,
    moonPhaseIndex:capture.moonPhaseIndex,skinId:capture.skinId,vocab:capture.vocab,
    stageLayout:capture.stageLayout,
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
// Permanent, additive schema adapters. Saved v1 payloads are never rewritten:
// they stay in IndexedDB / Cloudflare exactly as recorded, and are adapted only
// in memory when opened. Preserve these readers in later versions of the game.
function validateRibbitReplayData(data){
  if(!data || data.kind!=="ribbit-engine-frames" || ![1,2].includes(Number(data.version)) ||
    !["solo","pvp"].includes(data.mode) || !LEVELS[String(data.level||"").toLowerCase()] ||
    !Array.isArray(data.frames) || data.frames.length<2 || data.frames.length>RIBBIT_REPLAY_MAX_FRAMES)return false;
  let last=-1;
  for(const frame of data.frames){
    if(!frame || !Number.isFinite(Number(frame.t)) || frame.t<last || frame.t>3600000 ||
      !Array.isArray(frame.flies) || frame.flies.length>16 ||
      !frame.player || !Number.isFinite(frame.player.x) || !Number.isFinite(frame.player.y))return false;
    last=frame.t;
  }
  // Polish 44 saved v1 records without duration, fps, recordedAt, audio or a final card.
  // All of them are optional in the v1 adapter; v2 guarantees a duration.
  if(Number(data.version)>=2 && !Number.isFinite(data.duration))return false;
  if(data.duration!=null && (!Number.isFinite(data.duration) || data.duration<last || data.duration>3600000))return false;
  if(data.sounds && (!Array.isArray(data.sounds)||data.sounds.length>10000))return false;
  return true;
}
function ribbitReplayAdaptLegacy(data){
  if(!validateRibbitReplayData(data))return null;
  if(Number(data.version)===2)return data;
  const lastFrame=data.frames[data.frames.length-1];
  const playable={
    ...data, // retain the actual archived frames/positions/skin/vocabulary as-is
    level:String(data.level).toLowerCase(),
    version:1,legacySchema:1,
    fps:Number(data.fps)||13,
    duration:Math.max(lastFrame.t,Number(data.duration)||0),
    sounds:Array.isArray(data.sounds)?data.sounds:[],
    vocab:Array.isArray(data.vocab)?data.vocab:[],
    final:data.final||undefined
  };
  // v1 used a 3-second dance THEN a 2-second completion card. Present that
  // existing recording with the current 1+3 timing, leaving saved bytes alone.
  const timeline=ribbitReplayFinalTimeline(playable);
  if(timeline)playable.duration=Math.max(lastFrame.t,timeline.finishAt);
  return playable;
}
// A deterministic end-card timeline is stored with v2 replays. For archived
// Polish 45–51 clips, infer the win instant from the existing frames, adapting
// their old 3+2 second tail to the new 1+3 display without touching the source.
function ribbitReplayFinalTimeline(data){
  if(!data?.final || !Array.isArray(data.frames) || !data.frames.length)return null;
  const frames=data.frames;
  const winningFrame=frames.find(frame=>frame.phase==="won" || frame.gameState?.state==="won");
  const winAt=Number.isFinite(data.final.startT)?data.final.startT:
    (winningFrame?.t ?? frames[frames.length-1].t);
  const start=Math.max(0,winAt);
  const showAt=start+RIBBIT_REPLAY_SCORE_DELAY;
  const finishAt=start+RIBBIT_REPLAY_SCORE_DELAY+RIBBIT_REPLAY_SCORE_HOLD;
  return {start,showAt,finishAt};
}
// Preserve original archived data, but reconstruct the opening 3-2-1 when
// legacy/unexpectedly late captures start directly on the first play frame.
// These synthetic *playback-only* frames are explicitly marked, and can never
// overwrite a stored recording. Newly made recordings still use real counts.
function ribbitReplayEnsureCountdown(data) {
  if(!data?.frames?.length)return data;
  const first=data.frames[0], phase=first.phase||first.gameState?.state;
  const firstCount=Number(first.gameState?.countdownNumber||0);
  if(phase==='countdown'&&firstCount===3)return data;
  const missing=phase==='countdown' && firstCount>0 && firstCount<3 ? 3-firstCount : 3;
  const lead=missing*RIBBIT_REPLAY_COUNTDOWN_STEP_MS;
  const prefix=[];
  // Smooth playback-only countdown: use a stable frozen stage with 60 Hz
  // countdown frames rather than two widely spaced snapshots that the
  // replay interpolator could blend across at a digit/phase boundary.
  for(let i=0;i<missing;i++) {
    const number=3-i;
    for(let frame=0;frame<Math.ceil(RIBBIT_REPLAY_COUNTDOWN_STEP_MS/(1000/60));frame++) {
      const frameOffset=Math.min(RIBBIT_REPLAY_COUNTDOWN_STEP_MS-1,Math.round(frame*(1000/60)));
      prefix.push({...first,t:i*RIBBIT_REPLAY_COUNTDOWN_STEP_MS+frameOffset,
        phase:'countdown',flies:[],
        player:{...first.player,charging:false,vx:0,vy:0},
        players:(first.players||[]).map(player=>({...player,charging:false,vx:0,vy:0})),
        gameState:{...first.gameState,state:'countdown',countdownNumber:number,
          countdownTimer:Math.max(.001,(RIBBIT_REPLAY_COUNTDOWN_STEP_MS-frameOffset)/1000),
          soloCriticalCatchActive:false,pvpCriticalCatchActive:false}});
    }
  }
  const frames=data.frames.map(frame=>({...frame,t:frame.t-first.t+lead}));
  const sounds=(data.sounds||[]).map(sound=>({...sound,t:Math.max(lead,sound.t-first.t+lead)}));
  // Reconstruct only missing countdown ticks. The original sound track starts
  // at the same moment as its original visual after the inserted countdown.
  for(let i=0;i<missing;i++) {
    const number=3-i;
    sounds.push({t:i*RIBBIT_REPLAY_COUNTDOWN_STEP_MS,
      f:({3:392,2:466,1:587})[number],d:.1,v:.022,s:34});
  }
  sounds.sort((a,b)=>a.t-b.t);
  const final=data.final ? {...data.final,
    startT:Number.isFinite(data.final.startT)?data.final.startT-first.t+lead:data.final.startT} : undefined;
  return {...data,frames:[...prefix,...frames],sounds,final,
    duration:(data.duration||data.frames.at(-1).t)-first.t+lead,
    reconstructedCountdown:true};
}

// Merge historical round recordings into a single watchable set. New
// recordings are already one continuous 60 Hz set, so only legacy groups use
// this adapter. Frame/audio timestamps stay sorted and all source data stays
// unchanged (safe for rewatching and seeking).
function ribbitReplayCombineRounds(records){
  const valid=(records||[]).map(ribbitReplayAdaptLegacy).filter(Boolean);
  if(!valid.length)return null;
  if(valid.length===1)return valid[0];
  const first=valid[0];
  const frames=[],sounds=[];
  let offset=0;
  for(const item of valid){
    if(item.mode!==first.mode||item.level!==first.level)continue;
    const firstTime=item.frames[0].t;
    for(const frame of item.frames)frames.push({...frame,t:Math.round(offset+frame.t-firstTime)});
    for(const sound of item.sounds||[])sounds.push({...sound,t:Math.round(offset+Math.max(0,sound.t-firstTime))});
    offset=frames.at(-1).t+650;
  }
  if(frames.length<2)return null;
  // Playback validates the merged set with the same guards as single runs.
  return {...first,recordedAt:first.recordedAt||Date.now(),
    final:undefined,frames,sounds:sounds.sort((a,b)=>a.t-b.t),
    duration:frames.at(-1).t+1800,legacyCombinedRounds:valid.length};
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
  header.innerHTML='<span class="rr-spectator-title"><span class="rr-spectator-caption"></span><span class="rr-spectator-date"></span></span><span class="rr-spectator-badge">SPECTATOR REPLAY <small>60 FPS</small></span>';
  const footer=document.createElement("nav");
  footer.id="rr-spectator-toolbar";
  footer.setAttribute("aria-label","Replay playback controls");
  // SVG icons scale cleanly while preserving the game's square-button style;
  // they are true controls with accessible names, not decorative Unicode text.
  footer.innerHTML=`
    <button type="button" data-replay-action="previous" title="Previous Frog Tags set (Shift+B)" hidden>◀</button>
    <button type="button" data-replay-action="browse" title="Browse Frog Tags replays" hidden>REPLAYS</button>
    <button type="button" data-replay-action="next" title="Next Frog Tags set (Shift+N)" hidden>▶</button>
    <button type="button" data-replay-action="play" class="rr-replay-icon-button" aria-label="Pause playback" title="Pause/play (K)">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="25" height="25" fill="currentColor"><path class="rr-play-triangle" d="M7 4v16l13-8z" hidden/><path class="rr-play-bars" d="M5 4h5v16H5zm9 0h5v16h-5z"/><path class="rr-replay-arrow" d="M12 3a9 9 0 1 1-8.7 11.4h3.1A6 6 0 1 0 8.4 6.1L11 9H3V1l3.2 3.2A8.9 8.9 0 0 1 12 3z" hidden/></svg>
    </button>
    <div class="rr-replay-volume" title="Volume (M to mute, ↑/↓ for 5%)">
      <button type="button" class="rr-replay-volume-button" data-replay-action="mute" aria-label="Mute replay (M)" aria-pressed="false" title="Mute/unmute (M)">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter">
          <path d="M3 9h5l6-5v16l-6-5H3z"/>
          <path class="rr-speaker-normal" d="M17 8q4 4 0 8m2-11q7 7 0 14"/>
          <path class="rr-speaker-muted" d="M17 9l5 6m0-6l-5 6" hidden/>
        </svg>
      </button>
      <div class="rr-replay-volume-popover"><input type="range" min="0" max="100" step="1" value="100" aria-label="Replay volume" title="Drag to adjust volume" /><span class="rr-replay-volume-label">100%</span></div>
    </div>
    <label class="rr-replay-progress" aria-label="Timeline">
      <input type="range" min="0" max="10000" step="1" value="0" aria-label="Seek replay timeline" />
    </label>
    <span class="rr-replay-time" aria-live="off">0:00 / 0:00</span>
    <button type="button" data-replay-action="speed" class="rr-replay-speed" aria-label="Change playback speed" title="Playback speed (0.25x–4x)">
      <svg class="rr-stopwatch-frame" viewBox="0 0 64 64" width="54" height="54" aria-hidden="true" shape-rendering="crispEdges">
        <path d="M25 3h14v5H25zM22 0h20v4H22zM28 8h8v7h-8zM13 10h7v7h-7zM9 14h7v6H9z" fill="#18242a"/>
        <path d="M27 4h10v4H27zM29 8h6v5h-6zM12 12h7v5h-7z" fill="#748b90"/>
        <path d="M16 16h7v4h-7zM22 12h20v4H22zM42 16h7v4h-7zM49 20h5v5h-5zM54 25h4v14h-4zM49 39h5v6h-5zM43 45h6v5h-6zM20 46h23v4H20zM15 39h5v7h-5zM10 25h5v14h-5zM15 20h5v5h-5z" fill="#18242a"/>
        <path d="M22 16h20v3H22zM20 19h29v4H20zM16 23h37v4H16zM15 27h41v12H15zM20 39h34v5H20zM21 44h28v3H21zM23 47h20v2H23z" fill="none" stroke="#26383f" stroke-width="2"/>
        <path d="M23 18h19v3H23zM18 23h33v3H18zM15 28h41v10H15zM19 39h34v4H19zM24 44h24v3H24z" fill="#a7bec5"/>
        <path d="M25 20h15v2H25zM19 25h28v2H19zM16 29h38v3H16z" fill="#e0f3f7"/>
        <path d="M25 24h18v3H25zM21 27h28v16H21zM25 43h18v2H25z" fill="#12252d"/>
      </svg>
      <span class="rr-speed-value">1x</span>
    </button>
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
  const volume=footer.querySelector(".rr-replay-volume input");
  volume.addEventListener("input",event=>{
    if(!ribbitReplayView)return;
    ribbitReplayView.volume=clamp(Number(event.target.value)/100,0,1);
    if(ribbitReplayView.volume>0)ribbitReplayView.lastNonzeroVolume=ribbitReplayView.volume;
    ribbitReplayView.muted=ribbitReplayView.volume<=0;
    ribbitReplayUpdateControls();
  });
  volume.addEventListener("pointerdown",event=>event.stopPropagation());
  footer.addEventListener("click",event=>{
    const action=event.target.closest("button")?.dataset.replayAction;
    if(!action||!ribbitReplayView)return;
    event.stopPropagation();
    if(action==="exit")ribbitReplayClose();
    else if(action==="previous")ribbitReplayCollectionStep(-1);
    else if(action==="next")ribbitReplayCollectionStep(1);
    else if(action==="browse")ribbitReplayView.collection?.openBrowser?.();
    else if(action==="play")ribbitReplayTogglePlayback();
    else if(action==="mute")ribbitReplayToggleMute();
    else if(action==="speed"){
      const rates=[.25,.5,.75,1,1.25,1.5,1.75,2,4];
      const index=rates.findIndex(n=>n===ribbitReplayView.rate);
      ribbitReplayView.rate=rates[(index+1)%rates.length];
      // The stopwatch updates as soon as it is clicked, even on a paused
      // viewer where the animation loop may not paint another frame yet.
      ribbitReplayUpdateControls();
    }else if(action==="fullscreen")toggleRibbitFullscreen();
  });
  ribbitReplayControls={host,header,footer,seek,
    caption:header.querySelector(".rr-spectator-caption"),
    date:header.querySelector(".rr-spectator-date"),
    previous:footer.querySelector('[data-replay-action="previous"]'),
    next:footer.querySelector('[data-replay-action="next"]'),
    browse:footer.querySelector('[data-replay-action="browse"]'),
    badge:header.querySelector(".rr-spectator-badge small"),
    play:footer.querySelector('[data-replay-action="play"]'),
    speed:footer.querySelector('[data-replay-action="speed"]'),
    volumeButton:footer.querySelector('[data-replay-action="mute"]'),
    volume, volumeLabel:footer.querySelector(".rr-replay-volume-label"),
    time:footer.querySelector(".rr-replay-time")};
  return ribbitReplayControls;
}
function ribbitReplayShowControls(){
  const controls=ribbitReplayCreateControls();
  if(!controls)return;
  controls.host.classList.add("rr-replay-layout");
  controls.caption.textContent=ribbitReplayView?.caption||"REPLAY";
  const at=ribbitReplayView?.recordedAt??ribbitReplayView?.data?.recordedAt;
  const number=Number(at);
  const date=Number.isFinite(number)&&number>0
    ? new Date(number<10_000_000_000?number*1000:number) : new Date(at||"");
  let options={year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:true};
  // Display the clock time at the ORIGINAL recording location when saved,
  // not a potentially unrelated visitor's current timezone.
  if(ribbitReplayView?.recordedTimeZone)options.timeZone=ribbitReplayView.recordedTimeZone;
  try{
    controls.date.textContent=Number.isFinite(date.getTime())
      ? ` • ${date.toLocaleString(undefined,options)}` : "";
  }catch(_){delete options.timeZone;controls.date.textContent=Number.isFinite(date.getTime())
    ? ` • ${date.toLocaleString(undefined,options)}` : "";}
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
  const playState=view.data && view.position>=duration-1
    ? "replay" : view.paused ? "play" : "pause";
  controls.play.dataset.state=playState;
  controls.play.setAttribute("aria-label",`${playState.charAt(0).toUpperCase()}${playState.slice(1)} playback`);
  controls.play.title=playState==="replay"?"Watch again (K)":`${playState} (K)`;
  for(const [selector,kind] of [[".rr-play-triangle","play"],[".rr-play-bars","pause"],[".rr-replay-arrow","replay"]]) {
    const glyph=controls.play.querySelector(selector);
    // SVG paths do not consistently implement HTMLElement.hidden. Toggle the
    // attribute AND display style so only the intended icon can render.
    glyph.toggleAttribute("hidden",playState!==kind);
    glyph.style.display=playState===kind?"":"none";
  }
  controls.speed.querySelector(".rr-speed-value").textContent=`${view.spaceFastForwardHeld?2:view.rate}x`;
  const effectiveVolume=view.muted?0:view.volume;
  controls.volume.value=String(Math.round(view.volume*100));
  controls.volume.setAttribute("aria-valuetext",`${Math.round(effectiveVolume*100)} percent`);
  controls.volumeLabel.textContent=`${Math.round(effectiveVolume*100)}%`;
  controls.volumeButton.setAttribute("aria-pressed",String(!!view.muted));
  controls.volumeButton.setAttribute("aria-label",view.muted?"Unmute replay (M)":"Mute replay (M)");
  for(const [selector,show] of [[".rr-speaker-normal",!view.muted],[".rr-speaker-muted",!!view.muted]]){
    const glyph=controls.volumeButton.querySelector(selector);
    glyph.hidden=!show;glyph.style.display=show?"":"none";
  }
  controls.time.textContent=`${format(view.position)} / ${format(duration)}`;
  const collection=view.collection;
  controls.browse.hidden=!collection;
  controls.previous.hidden=!collection;
  controls.next.hidden=!collection;
  controls.previous.disabled=!collection||collection.index<=0;
  controls.next.disabled=!collection||collection.index>=collection.entries.length-1;
  if(!view.scrubbing){
    const progress=duration?view.position/duration:0;
    controls.seek.value=String(Math.round(10000*progress));
    controls.seek.style.setProperty("--rr-replay-progress",`${(progress*100).toFixed(2)}%`);
  }
}
function ribbitReplayToggleMute(){
  const view=ribbitReplayView;if(!view)return;
  if(view.muted){
    view.muted=false;
    if(view.volume<=0)view.volume=view.lastNonzeroVolume||1;
  }else{
    if(view.volume>0)view.lastNonzeroVolume=view.volume;
    view.muted=true;
  }
  ribbitReplayUpdateControls();
}
function ribbitReplayChangeVolume(delta){
  const view=ribbitReplayView;if(!view)return;
  const previous=view.muted?0:view.volume;
  const next=clamp(Math.round((previous+delta)*100)/100,0,1);
  view.volume=next;view.muted=next<=0;
  if(next>0)view.lastNonzeroVolume=next;
  ribbitReplayUpdateControls();
}
// World records are scoped to the recorded level. Never use the viewing
// player's local best as a substitute for the global leaderboard record.
function ribbitReplayExtractWorldRecords(payload,level){
  const source=Array.isArray(payload)?payload:
    ["entries","leaderboard","rows","records","results","data"].map(key=>payload?.[key]).find(Array.isArray)||[];
  const result={time:null,jumps:null};
  const consider=(metric,value)=>{
    const number=Number(value);
    if(Number.isFinite(number)&&number>0&&(result[metric]===null||number<result[metric]))result[metric]=number;
  };
  for(const entry of source){
    const record=entry?.records?.[level];
    if(record && typeof record==="object"){
      consider("time",record.time);consider("jumps",record.jumps);
      continue;
    }
    const rowLevel=String(entry?.level??entry?.resultLevel??"").toLowerCase();
    if(rowLevel!==level)continue;
    const metric=String(entry?.metric??entry?.category??"").toLowerCase();
    if(metric==="time")consider("time",entry.value??entry.time??entry.score);
    if(metric==="jumps")consider("jumps",entry.value??entry.jumps??entry.score);
  }
  return result;
}
async function ribbitReplayLoadWorldRecords(view){
  if(!view?.data || view.data.mode!=="solo")return;
  const cloud=typeof RibbitCloud!=="undefined"?RibbitCloud:window.RibbitCloud;
  let payload=null;
  try{payload=await cloud?.getLeaderboardData?.();}catch(_){}
  if(!payload?.entries?.length){
    try{
      const response=await fetch("/api/leaderboard?limit=100",{credentials:"include",cache:"no-store"});
      if(response.ok)payload=await response.json();
    }catch(_){}
  }
  if(ribbitReplayView!==view)return;
  view.worldRecords=ribbitReplayExtractWorldRecords(payload,String(view.data.level||"park").toLowerCase());
}
function ribbitReplayBegin(data,caption="REPLAY",options={}){
  const validated=ribbitReplayAdaptLegacy(data);
  if(!validated)return ribbitReplayUnavailable("REPLAY UNAVAILABLE","THIS RECORD HAS NO PLAYABLE GAME-STATE DATA");
  if(ribbitReplayCapture)finishRibbitReplayCapture();
  const playable=ribbitReplayEnsureCountdown(validated);
  const previousRestore=ribbitReplayView?.restore;
  ribbitReplayView={
    data:playable,caption:String(caption||"REPLAY").toUpperCase().slice(0,90),
    recordedAt:playable.recordedAt||options.recordedAt||null,
    recordedTimeZone:playable.recordedTimeZone||null,
    collection:options.collection||null,
    position:0,lastTick:performance.now(),paused:false,rate:1,
    scrubbing:false,wasPaused:false,soundIndex:0,
    volume:ribbitReplayView?.volume ?? 1,
    muted:ribbitReplayView?.muted ?? false,
    lastNonzeroVolume:ribbitReplayView?.lastNonzeroVolume ?? 1,
    spaceFastForwardHeld:false,spaceStartedPaused:false,
    worldRecords:{time:null,jumps:null},
    restore:previousRestore||{state:game.state,mode:game.mode},error:""
  };
  game.state="rrEngineReplay";
  document.body.classList.add("rr-engine-replay-active");
  ribbitReplayShowControls();
  ribbitReplayLoadWorldRecords(ribbitReplayView);
  clearHeldInput();
  return true;
}
function ribbitReplayUnavailable(title,reason){
  if(ribbitReplayCapture)finishRibbitReplayCapture();
  ribbitReplayView={
    data:null,caption:String(title).toUpperCase(),error:String(reason).toUpperCase(),
    position:0,lastTick:performance.now(),paused:true,rate:1,
    scrubbing:false,wasPaused:true,soundIndex:0,volume:1,
    restore:{state:game.state,mode:game.mode}
  };
  game.state="rrEngineReplay";
  document.body.classList.add("rr-engine-replay-active");
  ribbitReplayShowControls();
  clearHeldInput();
  return false;
}
function ribbitReplayCollectionStep(delta){
  const collection=ribbitReplayView?.collection;
  if(!collection?.entries?.length || typeof collection.playIndex!=="function")return false;
  const target=collection.index+delta;
  if(target<0||target>=collection.entries.length)return false;
  // Preserve the entire in-game viewer; switching resets its own timeline.
  collection.playIndex(target);
  return true;
}
function ribbitReplayClose(){
  if(!ribbitReplayView)return false;
  const restore=ribbitReplayView.restore;
  ribbitReplaySpaceRelease(true);
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
  view.soundIndex=ribbitReplaySoundAtOrAfter(view.position,view.data.sounds||[]);
  view.lastTick=performance.now();
  ribbitReplayUpdateControls();
}
function ribbitReplayTogglePlayback(){
  const view=ribbitReplayView;
  if(!view?.data)return;
  if(view.position>=view.data.duration-1){
    // A finished replay rewinds to the VERY FIRST 3-2-1 frame, restoring the
    // first countdown tone as well as the visuals for Space or the PLAY button.
    ribbitReplaySeek(0);
    view.rate=1;
    view.soundIndex=0;
    view.paused=false;
  }else view.paused=!view.paused;
  view.lastTick=performance.now();
  ribbitReplayUpdateControls();
}
function ribbitReplayTick(now=performance.now()){
  if(!ribbitReplayView){ribbitReplayCaptureTick(now);return;}
  const view=ribbitReplayView;
  // During the first second, Space behaves as a normal tap candidate. Only
  // AFTER a complete hold do we enter temporary 2x mode.
  if(Number.isFinite(view.spacePressAt) && !view.spaceFastForwardHeld &&
     now-view.spacePressAt>=RIBBIT_REPLAY_SPACE_HOLD_MS){
    view.spaceFastForwardHeld=true;
    view.lastTick=now;
  }
  const dt=Math.max(0,Math.min(now-view.lastTick,120));
  view.lastTick=now;
  // Space is a temporary 2x transport. When the replay was paused at keydown,
  // the playhead still scrubs forward silently and stays paused on release.
  const advancing=view.spaceFastForwardHeld||!view.paused;
  if(view.data&&advancing&&!view.scrubbing){
    const prior=view.position;
    const speed=view.spaceFastForwardHeld?2:view.rate;
    view.position=clamp(prior+dt*speed,0,view.data.duration);
    const sounds=view.data.sounds||[];
    while(view.soundIndex<sounds.length && sounds[view.soundIndex].t<=view.position){
      const sound=sounds[view.soundIndex++];
      if(sound.t<prior||sound.t>view.data.duration)continue;
      // Sound is not re-triggered by scrub, seeking, or frame-stepping.
      if(Number.isFinite(sound.f)&&sound.f>=45&&sound.f<=20000&&
        Number.isFinite(sound.d)&&sound.d>0&&sound.d<=3&&
        Number.isFinite(sound.v)&&sound.v>=0&&sound.v<=.5 &&
        view.volume>0&&!view.muted&&!(view.spaceFastForwardHeld&&view.spaceStartedPaused)){
        // Replay volume is independent of the currently loaded game save.
        // Restore its mute and volume preferences immediately after each tone.
        const formerVolume=game.volume,formerMute=game.muted;
        try{
          game.muted=false;game.volume=1;
          tone(sound.f,sound.d,sound.v*view.volume,Number(sound.s)||0);
        }finally{game.muted=formerMute;game.volume=formerVolume;}
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
  const aPhase=a.phase||a.gameState?.state;
  const bPhase=b.phase||b.gameState?.state;
  const stableCountdown=aPhase==="countdown" && bPhase==="countdown" &&
    Number(a.gameState?.countdownNumber)===Number(b.gameState?.countdownNumber);
  const factor=(aPhase!==bPhase || (aPhase==="countdown"&&!stableCountdown))
    ? 0 : clamp((position-a.t)/Math.max(1,b.t-a.t),0,1);
  const lerpPosition=(p,q)=>{
    if(!p)return p;
    const out={...p};
    if(q){
      out.x=p.x+(q.x-p.x)*factor;out.y=p.y+(q.y-p.y)*factor;
      if(p.tongue && q.tongue && p.tongue.active && q.tongue.active)
        out.tongue={...p.tongue,elapsed:p.tongue.elapsed+(q.tongue.elapsed-p.tongue.elapsed)*factor};
    }
    return out;
  };
  const alternate=new Map((b.flies||[]).map(f=>[f.id,f]));
  const soloTongue = a.tongue && b.tongue && a.tongue.active && b.tongue.active
    ? {...a.tongue,elapsed:a.tongue.elapsed+(b.tongue.elapsed-a.tongue.elapsed)*factor}
    : a.tongue;
  return {...a,phase:a.phase||a.gameState?.state||"playing",gameState:a.gameState||{},
    world:Number(a.world)+(Number(b.world||a.world)-Number(a.world))*factor,
    visual:Number(a.visual)+(Number(b.visual||a.visual)-Number(a.visual))*factor,
    tongue:soloTongue,player:lerpPosition(a.player,b.player),
    players:(a.players||[]).map((p,i)=>lerpPosition(p,b.players?.[i])),
    flies:(a.flies||[]).map(f=>{const next=alternate.get(f.id);return next?
      {...f,x:f.x+(next.x-f.x)*factor,y:f.y+(next.y-f.y)*factor}:f;})};
}
// Older recorded sets did not store the returning word-plate opacity. Infer
// it from the last recorded critical-catch frame, so seeking through a legacy
// zoom still produces a gradual fade-in rather than a sudden full-opacity pop.
function legacyReplayFlyLabelReturnAlpha(position, frames) {
  if (!Array.isArray(frames) || !frames.length) return 1;
  let low = 0, high = frames.length - 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (frames[middle].t <= position) low = middle;
    else high = middle - 1;
  }
  for (let index = low; index >= 0; index -= 1) {
    const frame = frames[index];
    if (position - frame.t > 520) break;
    if (frame.gameState?.soloCriticalCatchActive || frame.gameState?.pvpCriticalCatchActive) {
      const firstNonZoom = frames[index + 1]?.t ?? frame.t;
      return clamp((position - firstNonZoom) / 420, 0, 1);
    }
  }
  return 1;
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
  const gameOld={};for(const field of [...RIBBIT_REPLAY_GAME_FIELDS,"bestTime","bestJumps","newBestTime","newFewestJumps"])gameOld[field]=game[field];
  const frogOld={...frog},tongueOld={...tongue};
  const tutorialOld={active:tutorial.active,completeScreen:tutorial.completeScreen,dialogueOpen:tutorial.dialogueOpen};
  const pvpOld=pvpPlayers.map(p=>({...p,tongue:{...p.tongue}}));
  const fliesOld=flies.slice();
  const platformsOld=platforms,flySpawnsOld=flySpawns,vocabularyOld=VOCABULARY;
  const labelsOld=window.RibbitRaceFinalCatchLabelsGone;
  const clueOld=window.RibbitReplayClueBlank;
  const timeline=ribbitReplayFinalTimeline(data);
  const finalFrameTime=data.frames[data.frames.length-1].t;
  const finalHold=!!timeline && view.position>=timeline.showAt;
  const animatedTailSeconds=timeline ? Math.max(0,(view.position-finalFrameTime)/1000) : 0;
  const replaySceneState=(data.mode==="solo" && (state.phase==="won" || !!timeline && view.position>=timeline.start)) ||
    (data.mode==="pvp" && ["won","pvpCelebration"].includes(state.phase))
    ? state.phase==="pvpCelebration" ? "pvpCelebration" : "won" : "playing";
  try{
    game.state=replaySceneState;
    game.mode=data.mode;game.selectedLevelId=data.level;game.timeOfDay=data.timeOfDay;
    game.moonPhaseIndex=data.moonPhaseIndex;game.skinId=data.skinId;
    game.worldTime=state.world;game.visualTime=state.visual;game.elapsed=state.clock;
    game.targetVocabIndex=state.target;game.score=state.score;game.jumps=state.jumps;
    game.bestTime=view.worldRecords?.time??null;
    game.bestJumps=view.worldRecords?.jumps??null;
    game.newBestTime=false;game.newFewestJumps=false;
    game.pvpRoundNumber=state.round||1;game.pvpTimeRemaining=state.roundTime||0;
    game.pvpElapsed=state.pvpElapsed||0;game.onlineMode=false;game.sandboxMode=false;
    game.pvpRoundWins=state.roundWins||[0,0];
    game.pvpTimeLimitSeconds=data.pvpTimeLimitSeconds??60;
    game.pvpFirstTo=data.pvpFirstTo??5;
    game.pvpRoundGoalMode=data.pvpRoundGoalMode||"5flies";
    game.pvpBestOf=data.pvpBestOf??3;
    game.tutorialActive=false;game.soloCriticalCatchActive=false;game.pvpCriticalCatchActive=false;
    game.soloCriticalCatchFlyVisual=null;game.pvpCriticalCatchFlyVisual=null;
    tutorial.active=false;tutorial.completeScreen=false;tutorial.dialogueOpen=false;
    game.winPending=false;game.pvpWinPendingIndex=null;game.pvpImpactEffects=[];
    if(data.vocab?.length)VOCABULARY=normalizeVocabularyEntries(data.vocab);
    // Earlier replay versions did not record the fade state: show their terms
    // normally instead of borrowing opacity from the current live match.
    game.flyLabelReturnAlpha=1;
    if(state.gameState)Object.assign(game,state.gameState);
    // A replay never celebrates this player's personal previous best: show
    // authoritative world records (or -- when offline), not local save state.
    game.bestTime=view.worldRecords?.time??null;
    game.bestJumps=view.worldRecords?.jumps??null;
    game.newBestTime=false;game.newFewestJumps=false;
    if (!Number.isFinite(state.gameState?.flyLabelReturnAlpha) &&
        !game.pvpCriticalCatchActive && !game.soloCriticalCatchActive) {
      game.flyLabelReturnAlpha=legacyReplayFlyLabelReturnAlpha(view.position,data.frames);
    }
    // Never enter pause/tutorial/save screens as a side effect of rendering.
    game.state=replaySceneState;
    game.onlineMode=false;game.tutorialActive=false;game.sandboxMode=false;
    platforms=data.stageLayout?.platforms||LEVELS[data.level].platforms;
    flySpawns=data.stageLayout?.flySpawns||LEVELS[data.level].flySpawns;
    Object.assign(frog,state.player);
    if(animatedTailSeconds>0 && data.mode==="solo") {
      frog.danceTime=Math.max(0,Number(state.player?.danceTime)||0)+animatedTailSeconds;
      game.visualTime=(Number(state.visual)||0)+animatedTailSeconds;
      frog.grounded=true;
    }
    Object.assign(tongue,state.tongue||state.player.tongue||{active:false});
    if(data.mode==="pvp")state.players.forEach((player,i)=>{
      if(pvpPlayers[i])Object.assign(pvpPlayers[i],player,{tongue:player.tongue||{active:false}});
    });
    flies.splice(0,flies.length,...state.flies.map(f=>({...f,spawnAge:f.spawnAge||5})));
    // Legacy replay compatibility only: terms are now always eligible to draw,
    // with each frame's recorded opacity restored above.
    window.RibbitRaceFinalCatchLabelsGone=false;
    // Leave the Find the Match frame visible at the last replay frame.
    // Only its English clue becomes blank; older completed runs may have no
    // remaining live target, so the renderer must be allowed to draw anyway.
    window.RibbitReplayClueBlank=finalHold || view.position>=Math.max(0,data.duration-1);
    // Existing scene engine paints the original fly labels, HUD and slow-mo camera.
    ribbitReplayPreviousDrawScene();
    if (state.phase === "countdown") {
      // Gameplay state is deliberately rendered as playing for safety; the
      // recorded countdown must therefore be overlaid explicitly.
      game.state = "countdown";
      // Reconstruct timer from the digit's first frame instead of trusting
      // irregular / rounded capture tick intervals, eliminating pulse jitter.
      const sourceFrames=data.frames;
      let lo=0,hi=sourceFrames.length-1;
      while(lo<hi){const mid=(lo+hi+1)>>1;if(sourceFrames[mid].t<=view.position)lo=mid;else hi=mid-1;}
      const digit=Number(state.gameState?.countdownNumber)||3;
      let start=lo;
      while(start>0&&sourceFrames[start-1].phase==="countdown" &&
        Number(sourceFrames[start-1].gameState?.countdownNumber)===digit)start--;
      game.countdownNumber=digit;
      game.countdownTimer=Math.max(.001,(RIBBIT_REPLAY_COUNTDOWN_STEP_MS-Math.max(0,view.position-sourceFrames[start].t))/1000);
      drawResumeCountdown();
      game.state = "playing";
    }
    if(finalHold){
      // Stepped white end card, bold red banner, shine and charcoal border
      // like the normal FIVE FLIES screen. It is drawn OVER the LIVE hops.
      const final=data.final;
      const rect={w:402,h:128};
      rect.x=Math.round((W-rect.w)/2);
      // Center only within the level's PLAYFIELD. The bottom vocabulary
      // panel is HUD, not part of the gameplay area we want to cover.
      rect.y=Math.round((CONFIG.playBottom-rect.h)/2);
      ctx.fillStyle="rgba(11,32,40,.38)";
      ctx.fillRect(rect.x+5,rect.y+7,rect.w,rect.h);
      ctx.fillStyle=COLORS.ink;
      ctx.fillRect(rect.x+5,rect.y,rect.w-10,rect.h);
      ctx.fillRect(rect.x,rect.y+5,rect.w,rect.h-10);
      ctx.fillStyle="#f7fdff";
      ctx.fillRect(rect.x+10,rect.y+4,rect.w-20,rect.h-8);
      ctx.fillRect(rect.x+4,rect.y+10,rect.w-8,rect.h-20);
      ctx.fillStyle="#791c2b";
      ctx.fillRect(rect.x+12,rect.y+10,rect.w-24,46);
      ctx.fillStyle="#b22b40";
      ctx.fillRect(rect.x+15,rect.y+13,rect.w-30,40);
      ctx.fillStyle="#f57b91";
      ctx.fillRect(rect.x+21,rect.y+16,rect.w-42,4);
      drawBitmapText("LEVEL COMPLETE!",W/2,rect.y+29,1.7,"center",COLORS.white,"#711b29");
      const fmt=typeof formatTime==="function"?formatTime(final.time):`${Number(final.time).toFixed(2)}S`;
      drawBitmapText(`FINAL TIME ${fmt}`,W/2,rect.y+75,1.0,"center","#34484f");
      drawBitmapText(`${final.jumps} JUMPS  •  ${final.score} FLIES`,W/2,rect.y+101,.95,"center","#34484f");
    }
  }finally{
    Object.assign(game,gameOld);Object.assign(frog,frogOld);Object.assign(tongue,tongueOld);
    Object.assign(tutorial,tutorialOld);
    pvpOld.forEach((player,i)=>Object.assign(pvpPlayers[i],player));
    flies.splice(0,flies.length,...fliesOld);
    platforms=platformsOld;flySpawns=flySpawnsOld;VOCABULARY=vocabularyOld;
    window.RibbitRaceFinalCatchLabelsGone=labelsOld;
    window.RibbitReplayClueBlank=clueOld;
  }
}
// Replays suppress ONLY the standard win modal. Our centered score overlay
// appears one second into the dance, while the frog continues hopping below.
if (typeof drawHudPausePlaySprite === "function") {
const ribbitReplayOriginalHudPause=drawHudPausePlaySprite;
drawHudPausePlaySprite=function(rect,paused=false,palette=getSelectedSkin()){
  if(!ribbitReplayView)return ribbitReplayOriginalHudPause(rect,paused,palette);
  if(!rect)return;
  const x=Math.round(rect.x),y=Math.round(rect.y),w=Math.round(rect.w),h=Math.round(rect.h);
  const theme=palette||getSelectedSkin();
  ctx.save();
  ctx.fillStyle="rgba(30,49,55,0.25)";ctx.fillRect(x+1,y+2,w,h);
  ctx.fillStyle=COLORS.ink;ctx.fillRect(x,y,w,h);
  ctx.fillStyle=theme.belly;ctx.fillRect(x+2,y+2,w-4,h-4);
  ctx.fillStyle=theme.light;ctx.fillRect(x+3,y+2,w-6,2);
  ctx.fillStyle=theme.dark;
  // Thick, square pixel X with a one-pixel inset. It matches the pause/play
  // HUD's chunkier geometric sprite and never touches the button border.
  const iconSide=Math.max(7,Math.min(12,w-10,h-10));
  const step=Math.max(1,Math.floor(iconSide/5));
  const left=x+Math.floor((w-step*5)/2), top=y+Math.floor((h-step*5)/2);
  for(let i=0;i<5;i++){
    ctx.fillRect(left+i*step,top+i*step,step+1,step+1);
    ctx.fillRect(left+(4-i)*step,top+i*step,step+1,step+1);
  }
  ctx.restore();
};
}
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
// A short Space tap toggles play/pause. Holding it for >1 second activates
// 2x transport only for the duration of the hold (paused transport is silent).
const RIBBIT_REPLAY_SPACE_HOLD_MS = 1000;
function ribbitReplaySpacePress(event){
  const view=ribbitReplayView;
  if(!view?.data || Number.isFinite(view.spacePressAt))return;
  if(view.position>=view.data.duration-1){
    ribbitReplayTogglePlayback();
    view.spaceTapConsumed=true;
    return;
  }
  view.spacePressAt=performance.now();
  view.spaceTapConsumed=false;
  view.spaceFastForwardHeld=false;
  view.spaceStartedPaused=!!view.paused;
  view.lastTick=performance.now();
}
function ribbitReplaySpaceRelease(cancel=false){
  const view=ribbitReplayView;
  if(!view)return;
  if(!Number.isFinite(view.spacePressAt) && !view.spaceFastForwardHeld){view.spaceTapConsumed=false;return;}
  const heldLong=view.spaceFastForwardHeld || performance.now()-view.spacePressAt >= RIBBIT_REPLAY_SPACE_HOLD_MS;
  const shouldToggle=!cancel && !heldLong && !view.spaceTapConsumed;
  view.spacePressAt=null;
  view.spaceFastForwardHeld=false;
  view.spaceStartedPaused=false;
  view.spaceTapConsumed=false;
  view.lastTick=performance.now();
  if(shouldToggle)ribbitReplayTogglePlayback();
  else ribbitReplayUpdateControls();
}
function handleRibbitReplayKey(event){
  if(!ribbitReplayView || window.RibbitFrogTagReplayBrowser?.isOpen?.())return;
  const key=event.code;
  const supported=["Escape","Backspace","Space","ArrowLeft","ArrowRight","ArrowUp","ArrowDown",
    "Equal","Minus","KeyF","KeyJ","KeyL","KeyX","KeyZ","KeyN","KeyB","KeyR","KeyK","KeyM","Home","End","Comma","Period",
    ...Array.from({length:10},(_,i)=>`Digit${i}`),...Array.from({length:10},(_,i)=>`Numpad${i}`)];
  if(!supported.includes(key)){
    event.preventDefault();event.stopImmediatePropagation();return;
  }
  event.preventDefault();event.stopImmediatePropagation();
  if(key==="Space"){
    if(!event.repeat)ribbitReplaySpacePress(event);
    return;
  }
  if(event.repeat && !["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyJ","KeyL","KeyX","KeyZ","Comma","Period"].includes(key))return;
  const view=ribbitReplayView;
  if(key==="Escape"||key==="Backspace")ribbitReplayClose();
  else if(key==="KeyK")ribbitReplayTogglePlayback();
  else if(key==="KeyM")ribbitReplayToggleMute();
  else if(key==="ArrowUp")ribbitReplayChangeVolume(.05);
  else if(key==="ArrowDown")ribbitReplayChangeVolume(-.05);
  else if(key==="ArrowLeft")ribbitReplaySeek(view.position/1000-5);
  else if(key==="ArrowRight")ribbitReplaySeek(view.position/1000+5);
  else if(key==="KeyJ")ribbitReplaySeek(view.position/1000-10);
  else if(key==="KeyL"||key==="KeyX")ribbitReplaySeek(view.position/1000+10);
  else if(key==="KeyZ")ribbitReplaySeek(view.position/1000-10);
  else if(key==="KeyN"&&event.shiftKey)ribbitReplayCollectionStep(1);
  else if(key==="KeyB"&&event.shiftKey)ribbitReplayCollectionStep(-1);
  else if(key==="KeyF")toggleRibbitFullscreen();
  else if(key==="KeyR")view.rate=view.rate===4?1:4;
  else if(key==="Home")ribbitReplaySeek(0);
  else if(key==="End")ribbitReplaySeek(view.data?.duration/1000||0);
  else if((key==="Comma"&&event.shiftKey)||key==="Minus")ribbitReplayAdjustRate(-.25);
  else if((key==="Period"&&event.shiftKey)||key==="Equal")ribbitReplayAdjustRate(.25);
  else if(key==="Comma")ribbitReplaySeek((view.position-(1000/RIBBIT_REPLAY_FPS))/1000);
  else if(key==="Period")ribbitReplaySeek((view.position+(1000/RIBBIT_REPLAY_FPS))/1000);
  else if(/^Digit[0-9]$/.test(key)||/^Numpad[0-9]$/.test(key)){
    const tenth=Number(key.slice(-1));
    ribbitReplaySeek(tenth*(view.data?.duration||0)/10000);
  }
  ribbitReplayUpdateControls();
}
window.addEventListener("keydown",handleRibbitReplayKey,true);
window.addEventListener("keyup",event=>{
  if(!ribbitReplayView||event.code!=="Space")return;
  event.preventDefault();event.stopImmediatePropagation();
  ribbitReplaySpaceRelease();
},true);
window.addEventListener("blur",()=>ribbitReplaySpaceRelease(true));
canvas.addEventListener("pointerdown",event=>{
  if(!ribbitReplayView)return;
  event.preventDefault();event.stopImmediatePropagation();
  // Preserve the pause icon's native shape, but use it as an Exit X in replay.
  const point=getCanvasPoint(event);
  const rect=HUD_UI.pauseButton;
  if(point.x>=rect.x&&point.x<=rect.x+rect.w&&point.y>=rect.y&&point.y<=rect.y+rect.h){
    ribbitReplayClose();return;
  }
  // Clicking the gameplay scene pauses without accidentally resuming a paused
  // video; K or the transport button remains the explicit resume action.
  if(!ribbitReplayView.paused){ribbitReplayView.paused=true;ribbitReplayView.lastTick=performance.now();ribbitReplayUpdateControls();}
},true);
window.RibbitEngineReplay=Object.freeze({
  mime:RIBBIT_ENGINE_REPLAY_MIME,fps:RIBBIT_REPLAY_FPS,
  tick:ribbitReplayTick,captureCountdownStart:ribbitReplayCaptureCountdownStart,
  exportCurrent:ribbitReplayExportCurrent,
  finishCapture:finishRibbitReplayCapture,whenComplete:ribbitReplayWhenComplete,
  play:ribbitReplayBegin,close:ribbitReplayClose,
  nextReplay:()=>ribbitReplayCollectionStep(1),previousReplay:()=>ribbitReplayCollectionStep(-1),
  isPaused:()=>!!ribbitReplayView?.paused,
  setPaused:value=>{if(ribbitReplayView){ribbitReplayView.paused=!!value;ribbitReplayView.lastTick=performance.now();}},
  seek:ribbitReplaySeek,unavailable:ribbitReplayUnavailable,
  combineRounds:ribbitReplayCombineRounds,
  compatibleVersions:[1,2],adaptLegacy:ribbitReplayAdaptLegacy,
  active:()=>!!ribbitReplayView
});
