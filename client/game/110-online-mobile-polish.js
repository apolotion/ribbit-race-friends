
/* Ribbit Race Friends 1.6.0 — online/mobile polish layer.
 * Kept in the game bundle lexical scope so it can cooperate with the legacy engine
 * without exporting private simulation state globally.
 */
(() => {
  "use strict";
  const BUILD = "2026.10.13-friends-polish-62";
  const RR_V160_CANDIDATES = {"catchFly":["attemptFlyCatch","attemptPvpFlyCatch","catchSandboxFly","getPvpImminentCatchFly","recordFlyEaten","scheduleFlyReplacementFromCatch"],"jumpSound":["playJumpSound"],"beep":["playCountdownGoSound","playCountdownSound"],"replayUpload":["saveRecordDate"],"restart":["resetGame","resetPvpGame","resetPvpPlayer","resetRoundLifecycle","resetRoundNetwork","restartCurrentLevel"],"drop":[],"render":["drawPvpScene","drawScene"],"worldRecord":[],"fullscreen":["getFullscreenElement","hideFullscreenFallback","showFullscreenFallback","syncFullscreenButton","toggleRibbitFullscreen"],"onlineSubmit":[],"leaderboard":["isSoloEndlessLeaderboardEligible","savePvpMatchWinsForLeaderboard"]};
  const RR_V160_VARS = {"onlineSelect":[],"achievementSelect":["activeAchievementIndex","hoveredAchievementCard"],"backRect":[]};

  const VERSION = "1.7.50";
  const V = {
    menuTouch: new Map(), chargeTouch: new Map(), achievementPinned: -1,
    cpuTakeoverUntil: 0, cpuTakeoverStarted: 0, cpuSnapshot: null,
    remoteWasAirborne: false, lastCountdownSecond: -1,
    lastState: "", lastRoundKey: "", previousRecords: new Map(),
    onlineAppearance: null, replay: null, replayChunks: [], replayStartedAt: 0,
    guestSavePending: null, lastDropBuffer: new WeakMap(),
    worldRecordDetail: "", worldRecordMeta: null, worldRecordUntil: 0,
    longPressTimer: 0,
  };
  const get = (name) => { try { return eval(name); } catch (_) { return undefined; } };
  const set = (name, value) => { try { const __rrv=value; eval(name + " = __rrv"); return true; } catch (_) { return false; } };
  const first = (names, type) => { for (const n of names){ const v=get(n); if (!type || typeof v===type) return v; } return undefined; };
  const canvasEl = () => document.getElementById("game") || first(["canvas"]);
  const stateName = () => {
    const g=first(["game","gameState","state"]);
    if(typeof g==="string") return g;
    return String(g?.state ?? g?.mode ?? g?.screen ?? "");
  };
  const mobileOn = () => {
    const candidates=[get("mobileMode"),get("isMobileMode"),get("mobileControlsEnabled"),localStorage.getItem("ribbitRaceMobileModeV1")];
    return candidates.some(v=>v===true||v===1||v==="1"||v==="true"||v==="mobile");
  };
  const logicalPoint = (ev) => {
    if (typeof getCanvasPoint === "function") return getCanvasPoint(ev);
    const c=canvasEl();
    if(!c) return {x:0,y:0};
    const r=c.getBoundingClientRect(), aspect=16/9;
    let vw=r.width,vh=r.height,ox=0,oy=0;
    if(vw/vh>aspect){vw=vh*aspect;ox=(r.width-vw)/2;} else {vh=vw/aspect;oy=(r.height-vh)/2;}
    return {x:(ev.clientX-r.left-ox)/vw*480,y:(ev.clientY-r.top-oy)/vh*270};
  };
  const isTyping = () => {
    const a=document.activeElement; return !!a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  };
  const dispatchKey=(type,code,key=code)=>document.dispatchEvent(new KeyboardEvent(type,{key,code,bubbles:true,cancelable:true}));
  const activeGameplay = () => /playing|countdown|sudden|celebration|final|sandbox|paused/i.test(stateName());
  const jumpZone = (pt) => pt.y>=224 && (pt.x<=165 || pt.x>=315);

  // Touch menus activate on finger release. Gameplay meters retain hold/release behavior.
  const c=canvasEl();
  if(c){
    c.addEventListener("pointerdown",ev=>{
      if(ev.pointerType!=="touch" || !mobileOn()) return;
      const p=logicalPoint(ev);
      if(activeGameplay() && jumpZone(p)){
        const side=p.x<240?"p1":"p2";
        V.chargeTouch.set(ev.pointerId,side);
        dispatchKey("keydown",side==="p1"?"ShiftLeft":"ShiftRight",side==="p1"?"Shift":"Shift");
        return;
      }
      if(activeGameplay()) return;
      V.menuTouch.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
      // pointermove establishes the same hovered option as mouse mode.
      c.dispatchEvent(new PointerEvent("pointermove",{pointerId:900000+ev.pointerId,pointerType:"mouse",clientX:ev.clientX,clientY:ev.clientY,bubbles:true}));
      ev.preventDefault(); ev.stopImmediatePropagation();
    },true);
    c.addEventListener("pointerup",ev=>{
      if(ev.pointerType!=="touch" || !mobileOn()) return;
      const side=V.chargeTouch.get(ev.pointerId);
      if(side){
        dispatchKey("keyup",side==="p1"?"ShiftLeft":"ShiftRight","Shift");
        V.chargeTouch.delete(ev.pointerId); return;
      }
      const start=V.menuTouch.get(ev.pointerId); if(!start) return;
      V.menuTouch.delete(ev.pointerId);
      const dx=ev.clientX-start.x,dy=ev.clientY-start.y;
      if(dx*dx+dy*dy<900){
        const init={pointerId:900000+ev.pointerId,pointerType:"mouse",clientX:ev.clientX,clientY:ev.clientY,bubbles:true,cancelable:true,button:0,buttons:1};
        c.dispatchEvent(new PointerEvent("pointermove",init));
        c.dispatchEvent(new PointerEvent("pointerdown",init));
        c.dispatchEvent(new PointerEvent("pointerup",{...init,buttons:0}));
        c.dispatchEvent(new MouseEvent("click",{clientX:ev.clientX,clientY:ev.clientY,bubbles:true,cancelable:true,button:0}));
      }
      ev.preventDefault(); ev.stopImmediatePropagation();
    },true);
    c.addEventListener("pointercancel",ev=>{
      const side=V.chargeTouch.get(ev.pointerId); if(side) dispatchKey("keyup",side==="p1"?"ShiftLeft":"ShiftRight","Shift");
      V.chargeTouch.delete(ev.pointerId);V.menuTouch.delete(ev.pointerId);
    },true);
    // Safari callout/magnifier and drag suppression.
    for(const type of ["contextmenu","selectstart","dragstart","gesturestart","gesturechange","gestureend"]){
      c.addEventListener(type,e=>{if(mobileOn()){e.preventDefault();e.stopPropagation();}}, {capture:true,passive:false});
    }
  }

  // Unlock iOS WebAudio on the first trusted touch and restore audible remote events.
  const resumeAudio=()=>{
    const ac=first(["audioCtx","audioContext","soundContext"]);
    if(ac?.state==="suspended") ac.resume().catch(()=>{});
  };
  document.addEventListener("pointerdown",resumeAudio,{capture:true,passive:true,once:false});

  // Fullscreen shortcut outside typing fields.
  document.addEventListener("keydown",ev=>{
    if((ev.key==="f"||ev.key==="F")&&!isTyping()){
      ev.preventDefault(); const fn=first(["toggleFullscreen","requestGameFullscreen","enterFullscreen"],"function");
      if(fn) fn(); else document.getElementById("fullscreen-button")?.click();
    }
  },true);

  // Clear stale online hover state as soon as auth gate returns.
  window.addEventListener("rr-auth-gate-visible",()=>{
    for(const n of ["onlineHoverIndex","onlineMenuHover","menuHoverIndex","hoveredButton","tooltipText"]){set(n,-1);}
    c?.dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",bubbles:true}));
  });

  // Separate online appearance preference. Existing online builders can read this hook.
  const ONLINE_KEY="ribbitRaceOnlineAppearanceV1";
  try{V.onlineAppearance=JSON.parse(localStorage.getItem(ONLINE_KEY)||"null");}catch(_){}
  window.RibbitOnlineAppearance={
    get(){return V.onlineAppearance;},
    set(v){V.onlineAppearance=v;try{localStorage.setItem(ONLINE_KEY,JSON.stringify(v));}catch(_){}},
  };

  // Opponent name helper and disconnect CPU override.
  function onlineObj(){return first(["onlineSession","online","onlineState","pvpOnline"]);}
  function opponentName(){
    const o=onlineObj();
    if(V.cpuTakeoverUntil||o?.cpuIndex>=0||o?.takeover?.cpuIndex>=0) return "CPU";
    return String(o?.opponentName||o?.peerName||o?.remoteName||o?.guestName||o?.hostName||o?.players?.find?.(p=>!p.local)?.name||"OPPONENT").toUpperCase();
  }
  window.RibbitOpponentName=opponentName;

  // Retain public compatibility hooks, but never permanently suppress labels.
  // The engine now owns both the cinematic fade-out and post-zoom fade-in.
  window.RibbitV160ShouldHideFlyLabels=()=>false;
  window.RibbitV160ResetFinalCatchLabels=()=>{ game.flyLabelReturnAlpha=1; };
  window.RibbitV160FlyLabelAlpha=(base=1)=>base*getCriticalCatchWordFade();

  // World-record details are exposed to existing toast hover code.
  window.RibbitWorldRecordDetail=()=>V.worldRecordDetail;
  window.RibbitSetWorldRecordDetail=(d)=>{V.worldRecordDetail=String(d||"");V.worldRecordUntil=performance.now()+9000;};

  // Small pixel dog-tag icon used by Frog Tags.
  window.RibbitDrawFrogTagsIcon=(g,x,y,s=1,color="#48555a")=>{
    g.save();g.translate(x,y);g.scale(s,s);g.strokeStyle=color;g.fillStyle="#f7fdff";g.lineWidth=1;
    for(const ox of [0,8]){g.beginPath();g.roundRect(ox,2,7,11,2);g.fill();g.stroke();g.beginPath();g.arc(ox+3.5,4,1,0,Math.PI*2);g.stroke();}
    g.beginPath();g.moveTo(3.5,4);g.lineTo(11.5,4);g.stroke();g.restore();
  };

  // Generic dynamic tooltip sizing hook.
  window.RibbitTooltipBox=(g,text,cx,y,opts={})=>{
    const t=String(text||""); const size=opts.size||8;
    let w=Math.max(56,Math.min(310,t.length*size*.72+18));
    const x=Math.max(4,Math.min(480-w-4,cx-w/2));
    g.save();g.fillStyle=opts.fill||"#f7fdff";g.strokeStyle=opts.stroke||"#26363d";g.lineWidth=2;
    g.fillRect(x,y,w,18);g.strokeRect(x,y,w,18);g.fillStyle=opts.color||"#174f65";g.textAlign="center";g.textBaseline="middle";g.font=`${size}px Courier New`;g.fillText(t,x+w/2,y+9);g.restore();
    return {x,y,w,h:18};
  };

  // Replay recording: begin at run start, timesliced chunks, retain only qualifying records.
  window.RibbitRecordReplay={
    start(){
      if(mobileOn()) return false;
      const cv=canvasEl(); if(!cv?.captureStream||typeof MediaRecorder==="undefined") return false;
      this.discard();
      const choices=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
      const mime=choices.find(m=>MediaRecorder.isTypeSupported?.(m))||"";
      try{
        const stream=cv.captureStream(24);V.replayChunks=[];V.replay=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:2500000}:undefined);
        V.replay.ondataavailable=e=>{if(e.data?.size)V.replayChunks.push(e.data)};V.replay.start(500);V.replayStartedAt=performance.now();return true;
      }catch(_){this.discard();return false;}
    },
    async finish(qualifies){
      const rec=V.replay;if(!rec)return null;
      const done=new Promise(resolve=>{rec.onstop=()=>resolve();});
      if(rec.state!=="inactive")rec.stop();await done;
      const chunks=V.replayChunks.slice();const type=rec.mimeType||"video/webm";this.discard();
      if(!qualifies||!chunks.length)return null;
      return new Blob(chunks,{type});
    },
    discard(){try{if(V.replay&&V.replay.state!=="inactive")V.replay.stop()}catch(_){}V.replay=null;V.replayChunks=[];V.replayStartedAt=0;}
  };

  // Guest save linking hook: after a newly created account signs in, apply and save guest keys.
  window.RibbitApplyPendingGuestSave=()=>{
    const pending=window.RibbitGuestConversion?.takePending?.();if(!pending)return false;
    try{for(const [k,v] of Object.entries(pending))localStorage.setItem(k,v);window.RibbitGuestConversion.clear();return true;}catch(_){return false;}
  };

  // Persistent Frog Tags match archive in the normal cloud save namespace.
  const TAG_KEY="ribbitRaceFrogTagMatchesV1";
  function tagHistory(){try{const v=JSON.parse(localStorage.getItem(TAG_KEY)||"[]");return Array.isArray(v)?v:[]}catch(_){return[]}}
  window.RibbitFrogTags={
    list:tagHistory,
    add(match){
      const rows=tagHistory();
      const entry={...match,id:match.id||crypto.randomUUID?.()||String(Date.now()),at:match.at||Date.now()};
      // One Frog Tags row per completed SET. If an event fires twice, it must
      // not create a second copy of the same recorded encounter.
      const prior=rows.findIndex(row=>entry.replayId && row.replayId===entry.replayId);
      if(prior>=0)rows.splice(prior,1);
      rows.unshift(entry);
      try{localStorage.setItem(TAG_KEY,JSON.stringify(rows.slice(0,500)));window.dispatchEvent(new Event("rr-save-dirty"));}catch(_){}
    },
    against(name){return tagHistory().filter(r=>String(r.opponent||"").toLowerCase()===String(name||"").toLowerCase());}
  };

  // CPU takeover behaves as a three-second interruption, similar to Sudden Death.
  function detectTakeover(now){
    const o=onlineObj();const cpu=o?.cpuIndex>=0||o?.takeover?.cpuIndex>=0||o?.opponentCpu===true;
    if(cpu && !V.cpuTakeoverStarted){
      V.cpuTakeoverStarted=now;V.cpuTakeoverUntil=now+3000;
      const ps=first(["players","pvpPlayers"]);const g=first(["game","gameState"]);
      V.cpuSnapshot={players:Array.isArray(ps)?ps.map(p=>({p,x:p.x,y:p.y,vx:p.vx,vy:p.vy})):[],timer:g?.timer,timeLeft:g?.timeLeft};
    }
  }
  function freezeTakeover(now){
    if(!V.cpuTakeoverUntil||now>=V.cpuTakeoverUntil){if(V.cpuTakeoverUntil){V.cpuTakeoverUntil=0;V.cpuSnapshot=null;}return;}
    for(const s of V.cpuSnapshot?.players||[]){s.p.x=s.x;s.p.y=s.y;s.p.vx=0;s.p.vy=0;}
    const g=first(["game","gameState"]);if(g&&V.cpuSnapshot){if("timer" in g)g.timer=V.cpuSnapshot.timer;if("timeLeft" in g)g.timeLeft=V.cpuSnapshot.timeLeft;}
  }
  window.RibbitDrawCpuTakeover=(g)=>{
    if(!V.cpuTakeoverUntil)return false;const left=Math.max(0,V.cpuTakeoverUntil-performance.now());const count=Math.max(1,Math.ceil(left/1000));
    g.save();g.fillStyle="rgba(11,28,36,.72)";g.fillRect(0,0,480,270);g.fillStyle="#f7fdff";g.strokeStyle="#26363d";g.lineWidth=3;g.fillRect(75,78,330,114);g.strokeRect(75,78,330,114);
    g.fillStyle="#bd2942";g.fillRect(82,85,316,30);g.fillStyle="#fff";g.textAlign="center";g.textBaseline="middle";g.font="18px Courier New";g.fillText("PLAYER DISCONNECTED",240,100);
    g.fillStyle="#26363d";g.font="13px Courier New";g.fillText("CPU LEVEL 5 TAKES OVER",240,137);g.font="28px Courier New";g.fillText(String(count),240,170);g.restore();return true;
  };

  // Mobile/performance maintenance and event sounds.
  let last=performance.now();let lastBeep=-1;
  function tick(now){
    const st=stateName();
    if(st!==V.lastState){
      V.lastState=st;
    }
    detectTakeover(now);freezeTakeover(now);
    const o=onlineObj();
    const remote=o?.remotePlayer||o?.opponent||o?.players?.find?.(p=>!p.local);
    if(remote){
      const airborne=remote.grounded===false||Number(remote.vy)<-0.1;
      if(airborne&&!V.remoteWasAirborne){const fn=first(["playJumpSound","playSfxJump","soundJump"],"function");try{fn?.(remote)}catch(_){}}
      V.remoteWasAirborne=airborne;
    }
    const g=first(["game","gameState"]);const cd=Number(g?.countdown??g?.countdownSeconds??g?.startCountdown);
    if(Number.isFinite(cd)&&cd>0){const sec=Math.ceil(cd);if(sec!==lastBeep){lastBeep=sec;const fn=first(["playCountdownBeep","playBeep","countdownBeep"],"function");try{fn?.(sec)}catch(_){}}} else lastBeep=-1;
    // Cap runaway effect arrays on mobile and clear stale replay buffers between rounds.
    if(mobileOn()&&now-last>1000){
      last=now;
      for(const n of ["particles","effects","sparkles","confetti","dust","onlineSnapshots","replayFrames"]){const a=get(n);if(Array.isArray(a)&&a.length>400)a.splice(0,a.length-400);}
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Achievement mobile taps stay selected. Arrow touches use release activation above.
  c?.addEventListener("pointerup",ev=>{
    if(ev.pointerType!=="touch"||!/achievement/i.test(stateName()))return;
    const p=logicalPoint(ev);if(p.y<220){V.achievementPinned=Math.max(0,Math.floor((p.y-40)/36));set("achievementSelectedIndex",V.achievementPinned);set("achievementHoverIndex",V.achievementPinned);}
  },true);

  // Precharge during round countdown: held keys remain down until the player's finger lifts.
  // Existing gameplay begins charging on the first legal simulation tick.

  // Buffered platform drops: preserve horizontal velocity and do not increment jumps when the drop was queued in air.
  window.RibbitPlatformDropBuffer={
    mark(player,buffered){if(player)V.lastDropBuffer.set(player,{buffered:!!buffered,vx:Number(player.vx)||0,jumps:Number(player.jumps??player.jumpCount)||0,at:performance.now()});},
    applied(player){const r=player&&V.lastDropBuffer.get(player);if(!r)return;if(r.buffered&&performance.now()-r.at<500){player.vx=r.vx;if("jumps" in player)player.jumps=r.jumps;if("jumpCount" in player)player.jumpCount=r.jumps;}V.lastDropBuffer.delete(player);}
  };


  // --- Deep integration helpers discovered from the modular engine source. ---
  const functionByNames=(list)=>{for(const n of list||[]){const f=get(n);if(typeof f==="function")return {name:n,fn:f};}return null;};
  function callCandidate(list,argSets){
    for(const n of list||[]){const f=get(n);if(typeof f!=="function")continue;for(const args of argSets){try{return {name:n,value:f(...args)}}catch(_){}}}
    return null;
  }
  // Keep canvas hover selection synchronized with the actual cell under the pointer.
  const onlineMenuIndexForPoint=(p)=>{
    if(p.y<92||p.y>221)return -1;
    const col=p.x<240?0:1; const row=Math.max(0,Math.min(2,Math.floor((p.y-92)/43)));
    // Quickplay/Spectate, Host/Join, Customizer/Frog Tags.
    return row*2+col;
  };
  c?.addEventListener("pointermove",ev=>{
    if(!/online/i.test(stateName())||/playing|countdown/i.test(stateName()))return;
    const idx=onlineMenuIndexForPoint(logicalPoint(ev)); if(idx<0)return;
    for(const n of RR_V160_VARS.onlineSelect||[])set(n,idx);
  },true);
  c?.addEventListener("pointerup",ev=>{
    if(!/online/i.test(stateName())||/playing|countdown/i.test(stateName()))return;
    const idx=onlineMenuIndexForPoint(logicalPoint(ev));if(idx<0)return;
    for(const n of RR_V160_VARS.onlineSelect||[])set(n,idx);
  },true);

  // Final Catch tongue assist: a release near the final fly activates the normal catch path.
  let finalTongueRequested=false;
  document.addEventListener("keyup",ev=>{if(/Space|Shift|KeyW|ArrowUp/.test(ev.code||""))finalTongueRequested=true;},true);
  c?.addEventListener("pointerup",ev=>{if(mobileOn()&&jumpZone(logicalPoint(ev)))finalTongueRequested=true;},true);
  function finalCatchTongueAssist(){
    if(!finalTongueRequested||!/final/i.test(stateName()))return;finalTongueRequested=false;
    const ps=first(["players","pvpPlayers"]),fs=first(["flies","activeFlies","gameFlies"]);const p=Array.isArray(ps)?ps[0]:first(["player"]);
    if(!p||!Array.isArray(fs)||!fs.length)return;
    let best=null,bd=1e9;for(const f of fs){const dx=(Number(f.x)||0)-(Number(p.x)||0),dy=(Number(f.y)||0)-(Number(p.y)||0),d=Math.hypot(dx,dy);if(d<bd){bd=d;best=f;}}
    if(!best||bd>92)return;
    for(const k of Object.keys(p)){if(/tongue/i.test(k)&&typeof p[k]==="number")p[k]=Math.max(p[k],.22);if(/tongue/i.test(k)&&typeof p[k]==="boolean")p[k]=true;}
    callCandidate(RR_V160_CANDIDATES.catchFly,[[p,best,"tongue"],[best,p,"tongue"],[p,best],[best,p],[best]]);
  }

  // Start replay at run start; stop and keep only if the engine marks a personal or public record.
  let observedRun=false;
  function runLooksActive(){return /playing/i.test(stateName())&&!/online/i.test(stateName());}
  function qualifiesAsRecord(){
    const g=first(["game","gameState"]),p=first(["player"]);const bags=[g,p].filter(Boolean);
    return bags.some(o=>Object.entries(o).some(([k,v])=>/record|personalBest|newBest|world/i.test(k)&&v===true));
  }
  async function uploadReplayBlob(blob){
    if(!blob)return;
    const hit=functionByNames(RR_V160_CANDIDATES.replayUpload);if(hit){try{await hit.fn(blob,{source:"full-run",startedAt:V.replayStartedAt});return;}catch(_){}}
    window.dispatchEvent(new CustomEvent("rr-record-replay-ready",{detail:{blob,startedAt:V.replayStartedAt}}));
  }

  // Guest conversion applies pending guest storage immediately after account creation/login.
  window.addEventListener("rr-authenticated",()=>{
    if(!window.RibbitApplyPendingGuestSave?.())return;
    const cloud=first(["RibbitCloud"]);try{cloud?.flushSave?.(true)}catch(_){}
  });

  // Separate online appearance wins over offline selection in payloads.
  window.addEventListener("rr-online-customizer-save",ev=>window.RibbitOnlineAppearance.set(ev.detail));
  window.addEventListener("rr-online-payload",ev=>{const a=window.RibbitOnlineAppearance.get();if(a&&ev.detail){ev.detail.appearance=a;ev.detail.skinId=a.id||ev.detail.skinId;}});

  // Pause menu gets a real DOM fullscreen option that works with touch.
  const frame=document.getElementById("game-frame");
  const fsButton=document.createElement("button");fsButton.type="button";fsButton.id="rr-pause-fullscreen";fsButton.textContent="FULLSCREEN";
  Object.assign(fsButton.style,{position:"absolute",zIndex:"91",display:"none",left:"50%",top:"71%",transform:"translate(-50%,-50%)",minWidth:"170px",padding:"10px 14px",border:"4px solid #26363d",background:"#f7fdff",color:"#34484f",font:'700 14px "Courier New",monospace',boxShadow:"4px 4px #aebbc0",cursor:"pointer"});
  fsButton.addEventListener("click",()=>{const fn=functionByNames(RR_V160_CANDIDATES.fullscreen)?.fn;if(fn)fn();else document.getElementById("fullscreen-button")?.click();});
  frame?.appendChild(fsButton);

  // Wrap platform drop functions when possible.
  for(const n of RR_V160_CANDIDATES.drop||[]){
    const old=get(n);if(typeof old!=="function"||old.__rrv160)continue;
    const wrapped=function(...args){const p=args.find(a=>a&&typeof a==="object"&&(typeof a.vx==="number"||"grounded" in a));if(p)window.RibbitPlatformDropBuffer.mark(p,p.grounded===false);const result=old.apply(this,args);if(p)window.RibbitPlatformDropBuffer.applied(p);return result;};
    wrapped.__rrv160=true;set(n,wrapped);
  }

  // Immediate reset before countdown; wrap discovered reset/restart entry points.
  for(const n of RR_V160_CANDIDATES.restart||[]){
    const old=get(n);if(typeof old!=="function"||old.__rrv160)continue;
    const wrapped=function(...args){const result=old.apply(this,args);const ps=first(["players","pvpPlayers"]);if(Array.isArray(ps))for(const p of ps){if("vx" in p)p.vx=0;if("vy" in p)p.vy=0;}return result;};
    wrapped.__rrv160=true;set(n,wrapped);
  }

  // Enrich the existing per-frame monitor.
  const deepTick=async(now)=>{
    finalCatchTongueAssist();
    // Canvas pause chrome already has a working fullscreen icon. Do not
    // display this legacy DOM button on top of the tutorial/Versus panel.
    fsButton.style.display="none";
    const active=runLooksActive();
    if(active&&!observedRun)observedRun=true;
    if(!active&&observedRun)observedRun=false;
    // The shared engine-replay sampler runs inside the game RAF and supplies
    // state timelines for both solo PBs and online Frog Tags. Do not start a
    // parallel MediaRecorder or upload obsolete video blobs here.
    requestAnimationFrame(deepTick);
  };
  requestAnimationFrame(deepTick);


  // --- Replay archive, Frog Tags details, record baselines, and post-render UI. ---
  const ReplayDb={
    async db(){return await new Promise((resolve,reject)=>{const q=indexedDB.open("RibbitRaceReplaysV2",1);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains("replays"))d.createObjectStore("replays",{keyPath:"id"});};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});},
    async put(row){const d=await this.db();await new Promise((res,rej)=>{const t=d.transaction("replays","readwrite");t.objectStore("replays").put(row);t.oncomplete=res;t.onerror=()=>rej(t.error);});d.close();return row.id;},
    async get(id){const d=await this.db();const v=await new Promise((res,rej)=>{const q=d.transaction("replays").objectStore("replays").get(id);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});d.close();return v;},
    async del(id){const d=await this.db();await new Promise((res,rej)=>{const t=d.transaction("replays","readwrite");t.objectStore("replays").delete(id);t.oncomplete=res;t.onerror=()=>rej(t.error);});d.close();},
  };
  window.RibbitReplayStore=ReplayDb;
  // Local Frog Tags replays play on the game canvas; no separate video modal.
  async function playStoredReplay(id,caption){
    const row=await ReplayDb.get(id);
    if(row?.record?.kind==="ribbit-engine-frames") return window.RibbitEngineReplay?.play?.(row.record,caption||"FROG TAG REPLAY");
    window.RibbitEngineReplay?.unavailable?.("LEGACY VIDEO REPLAY","OLD FROG TAG VIDEOS CANNOT BE RECONSTRUCTED AS GAME-STAGE REPLAYS");
    return false;
  }
  window.RibbitRacePlayStoredReplay = playStoredReplay;

  window.RibbitPlayStoredReplay=playStoredReplay;

  function currentOnlineAppearance(){return window.RibbitOnlineAppearance.get()||first(["selectedFrogAppearance","selectedAppearance","currentFrogAppearance"])||null;}
  function remoteAppearance(){const o=onlineObj();return o?.opponentAppearance||o?.remoteAppearance||o?.players?.find?.(p=>!p.local)?.appearance||null;}
  function currentOnlineMatchId(){
    const o=onlineObj();
    return String(window.OnlineVersus?.diagnostic?.().matchId||o?.matchId||o?.roomCode||o?.id||"");
  }
  let onlineRecording=false,onlineRecordedMatch="",onlineRecordIdentity=null,onlineArchiveTimer=0;
  async function finishOnlineArchive(snapshot=onlineRecordIdentity){
    if(!onlineRecording)return;
    onlineRecording=false;
    clearTimeout(onlineArchiveTimer);onlineArchiveTimer=0;
    // Finish one continuous set capture, never the first round of a best-of.
    const record=window.RibbitEngineReplay?.exportCurrent?.();
    if(!record || record.kind!=="ribbit-engine-frames" || record.mode!=="pvp" || record.frames.length<2)return;
    window.RibbitEngineReplay?.finishCapture?.();
    const at=Date.now(),matchId=String(snapshot?.matchId||currentOnlineMatchId()||at);
    const id=`online-set-${matchId}-${at}`;
    record.recordedAt=snapshot?.at||record.recordedAt||at;
    try{
      await ReplayDb.put({id,record,at:record.recordedAt,type:"ribbit-engine-frames"});
      const tags={id:matchId,setId:matchId,replayId:id,scope:"set",
        at:record.recordedAt,opponent:snapshot?.opponent||opponentName(),
        opponentAppearance:snapshot?.opponentAppearance||remoteAppearance(),
        ownAppearance:snapshot?.ownAppearance||currentOnlineAppearance(),
        won:!!snapshot?.won,roundCount:Math.max(1,Number(snapshot?.roundCount)||1),
        score:snapshot?.score||null};
      window.RibbitFrogTags.add(tags);
    }catch(error){console.warn("Could not archive complete Frog Tags set",error);}
  }
  function captureOnlineResult(){
    if(!onlineRecording || !game.onlineMode || game.mode!=="pvp" ||
       game.pvpMatchWinnerIndex===null || game.pvpMatchWinnerIndex===undefined)return;
    onlineRecordIdentity={matchId:onlineRecordedMatch||currentOnlineMatchId(),
      opponent:window.OnlineVersus?.roomPlayerLabel?.(1-Number(window.OnlineVersus?.localIndex?.()||0))||opponentName(),
      opponentAppearance:remoteAppearance(),ownAppearance:currentOnlineAppearance(),
      at:Date.now(),won:game.pvpMatchWinnerIndex===Number(window.OnlineVersus?.localIndex?.()||0),
      roundCount:game.pvpRoundNumber,score:Array.isArray(game.pvpRoundWins)?[...game.pvpRoundWins]:null};
    if(!onlineArchiveTimer)onlineArchiveTimer=setTimeout(()=>finishOnlineArchive(),1600);
  }
  window.addEventListener("ribbit-pvp-round-ended",event=>{
    if(event.detail?.matchWinnerIndex!==null && event.detail?.matchWinnerIndex!==undefined)captureOnlineResult();
  });

  // Render a frog-sprite marker and disabled arrows over the old Frog Tags list.
  function drawMiniFrog(g,appearance,x,y){
    const draw=functionByNames([...(RR_V160_CANDIDATES.render||[]),"drawFrog","drawFrogSprite"])?.fn;
    if(draw){try{draw(g,{x,y,dir:1,appearance,skinId:appearance?.id||"azure",scale:.45},appearance);return;}catch(_){}}
    g.save();g.translate(x,y);g.fillStyle=appearance?.mid||"#0f9fbb";g.strokeStyle=appearance?.dark||"#07516a";g.lineWidth=2;g.fillRect(-8,-4,16,8);g.strokeRect(-8,-4,16,8);g.fillRect(4,-9,5,6);g.restore();
  }
  function drawFrogTagsPolish(g){
    // OnlineVersus now owns all Frog Tags row sprites and correctly aligned
    // arrow buttons; the old post-render overlay must not draw duplicates.
  }

  // Select a Frog Tags opponent to view every locally archived game against them.
  const tagModal=document.createElement("section");tagModal.hidden=true;tagModal.id="rr-v160-tag-games";Object.assign(tagModal.style,{position:"fixed",inset:"0",zIndex:"1550",display:"none",placeItems:"center",background:"rgba(7,25,34,.86)",padding:"20px"});
  document.body.appendChild(tagModal);
  function openTagGames(name){const localHistory=(()=>{try{return JSON.parse(localStorage.getItem("ribbitRaceOnlineHistoryV2")||"{}")[name]||[]}catch(_){return[]}})();const baseGames=window.RibbitFrogTags.against(name)||[];const seenGames=new Set();const games=[...localHistory,...baseGames].filter(g=>{const k=String(g.replayId||g.id||`${g.at}:${g.won}`);if(seenGames.has(k))return false;seenGames.add(k);return true;});tagModal.innerHTML='<div class="rrv-tag-card"><button class="rrv-tag-close">×</button><h2></h2><div class="rrv-tag-list"></div></div>';const card=tagModal.firstElementChild;Object.assign(card.style,{position:"relative",width:"min(760px,95vw)",maxHeight:"85vh",overflow:"auto",background:"#f7fdff",border:"6px solid #26363d",padding:"18px",color:"#26363d"});card.querySelector("h2").textContent=`FROG TAGS — ${name}`;const list=card.querySelector(".rrv-tag-list");for(const g of games){const b=document.createElement("button");b.type="button";b.textContent=`${new Date(g.at).toLocaleDateString()} — ${g.won?"WIN":"LOSS"} — PLAY REPLAY`;b.disabled=!g.replayId;b.title=g.replayId?"PLAY SAVED REPLAY":"REPLAY IS STILL UPLOADING";b.addEventListener("click",()=>playStoredReplay(g.replayId,`${name} • ${g.won?"WIN":"LOSS"}`));list.appendChild(b);}card.querySelector(".rrv-tag-close").onclick=()=>{tagModal.hidden=true;tagModal.style.display="none"};tagModal.hidden=false;tagModal.style.display="grid";}
  window.RibbitOpenFrogTagGames=openTagGames;
  c?.addEventListener("pointerup",ev=>{if(!/tag/i.test(stateName()))return;const p=logicalPoint(ev);if(p.y<88||p.y>210||p.x>=378)return;const rows=window.RibbitFrogTags.list();const names=[...new Set(rows.map(r=>r.opponent))];const idx=Math.floor((p.y-88)/22);if(names[idx])openTagGames(names[idx]);},true);

  // Capture leaderboard responses to show actual frog sprites and prior record details.
  const leaderCache=new Map();
  const cloud=first(["RibbitCloud"]);
  if(cloud&&typeof cloud==="object"){
    for(const key of Object.keys(cloud))if(/leaderboard/i.test(key)&&typeof cloud[key]==="function"&&!cloud[key].__rrv160){const old=cloud[key].bind(cloud);cloud[key]=async function(...args){const r=await old(...args);const metric=String(args[0]?.metric||args[0]?.rankBy||"default"),level=String(args[0]?.level||"any");const rows=r?.rows||r?.leaderboard||r?.results||[];leaderCache.set(metric+":"+level,rows);return r};cloud[key].__rrv160=true;}
  }
  function currentPlayerName(){return String(document.getElementById("cloud-account-button")?.textContent||"PLAYER").trim();}
  function formatPriorRecordValue(value, metric){
    const numeric=Number(value);
    if(!Number.isFinite(numeric)) return String(value ?? "—");
    if(/time/i.test(String(metric||""))){
      const minutes=Math.floor(numeric/60),seconds=(numeric-minutes*60).toFixed(1).padStart(4,"0");
      return `${String(minutes).padStart(2,"0")}:${seconds}`;
    }
    return String(Math.floor(numeric));
  }
  function formatPriorRecordDate(value){
    if(!value) return "UNKNOWN DATE";
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return String(value).slice(0,10);
    return `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
  }
  function setWorldRecordMeta(meta){V.worldRecordMeta=meta||null;window.RibbitRaceWorldRecordMeta=V.worldRecordMeta;return V.worldRecordMeta;}
  window.RibbitGetWorldRecordDetail=()=>V.worldRecordMeta;
  function setRecordPrior(metric,level){
    const rows=leaderCache.get(String(metric)+":"+String(level))||[];
    const current=currentPlayerName().toLowerCase();
    const prior=rows.find((row,index)=>{
      const name=String(row?.name||row?.username||"").toLowerCase();
      return name && !(index===0 && name===current);
    }) || rows[0];
    if(prior){
      const rawValue=prior.result??prior.value??prior.time??prior.jumps??"—";
      const displayValue=formatPriorRecordValue(rawValue, metric);
      const dateValue=prior.resultDate||prior.date||prior.updatedAt||prior.createdAt||prior.lastUpdated||"";
      const displayDate=formatPriorRecordDate(dateValue);
      setWorldRecordMeta({metric:String(metric||"TIME").toUpperCase(),level:String(level||"any").toUpperCase(),name:String(prior.name||prior.username||"PLAYER"),value:displayValue,rawValue,date:displayDate});
      window.RibbitSetWorldRecordDetail(`PREVIOUS: ${prior.name||prior.username||"PLAYER"} — ${displayValue} — ${displayDate}`);
    }else{
      setWorldRecordMeta({metric:String(metric||"TIME").toUpperCase(),level:String(level||"any").toUpperCase(),name:"",value:"—",rawValue:null,date:"UNKNOWN DATE"});
      window.RibbitSetWorldRecordDetail(`${String(metric).toUpperCase()} • ${String(level).toUpperCase()}`);
    }
  }
  for(const n of RR_V160_CANDIDATES.worldRecord||[]){const old=get(n);if(typeof old!=="function"||old.__rrv160)continue;const wrapped=function(...args){const info=args.find(a=>a&&typeof a==="object")||{};const metric=String(info.metric||info.category||info.rankBy||"");const level=String(info.level||info.stage||"any");const rows=leaderCache.get(metric+":"+level)||[];if(/pvp|flies/i.test(metric)&&rows[0]&&String(rows[0].name||rows[0].username).toLowerCase()===currentPlayerName().toLowerCase())return;setRecordPrior(metric,level);return old.apply(this,args)};wrapped.__rrv160=true;set(n,wrapped);}

  // Wrap render functions once: CPU transition, Frog Tags sprites, and record detail tooltip.
  for(const n of RR_V160_CANDIDATES.render||[]){const old=get(n);if(typeof old!=="function"||old.__rrv160)continue;const wrapped=function(...args){const r=old.apply(this,args);const g=args.find(a=>a&&typeof a.save==="function")||first(["ctx","context"]);if(g){drawFrogTagsPolish(g);window.RibbitDrawCpuTakeover(g);if(V.worldRecordDetail&&performance.now()<V.worldRecordUntil){const mouse=first(["mouse","pointer"]);if(mouse&&mouse.x!=null)window.RibbitTooltipBox(g,V.worldRecordDetail,240,33,{size:7});}}return r};wrapped.__rrv160=true;set(n,wrapped);break;}

  // Online recording state and match archive monitor.
  let priorOnlinePlaying=false;
  const archiveTick=()=>{
    const participating=!!game.onlineMode&&game.mode==="pvp" && !window.OnlineVersus?.isSpectating?.();
    const roundPlaying=participating && ["playing","countdown"].includes(game.state);
    if(roundPlaying&&!onlineRecording){
      onlineRecording=true;onlineRecordedMatch=currentOnlineMatchId();onlineRecordIdentity=null;
    }
    if(onlineRecording && participating && game.pvpMatchWinnerIndex!==null &&
      game.pvpMatchWinnerIndex!==undefined && !onlineArchiveTimer)captureOnlineResult();
    // Never finalize when a round celebrates or players wait for the next
    // round; those moments are part of the current best-of set.
    if(onlineRecording&&!participating){
      if(onlineRecordIdentity)finishOnlineArchive(onlineRecordIdentity);
      else {onlineRecording=false;window.RibbitEngineReplay?.finishCapture?.();}
    }
    priorOnlinePlaying=roundPlaying;
    requestAnimationFrame(archiveTick);
  };requestAnimationFrame(archiveTick);

  // Expose build for diagnostics.
  window.RibbitRaceV160={build:BUILD,version:VERSION,state:V,opponentName};
})();
