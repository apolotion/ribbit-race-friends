"use strict";
(() => {
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const json=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||"null")??f}catch(_){return f}};
  const setJson=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const bridge=()=>window.RibbitRaceRuntimeBridge;
  function toast(title,detail="",duration=4500){
    let el=q("#rr14-toast"); if(!el){el=document.createElement("div");el.id="rr14-toast";document.body.append(el)}
    el.innerHTML=`<strong>${title}</strong>${detail?`<span>${detail}</span>`:""}`; el.classList.add("show");
    clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove("show"),duration);
  }

  class WorldRecordNoticeController {
    constructor(){this.pending=null;this.hit=null;this.seen=json("rrWorldRecordFirstPlaceSeenV1",{});
      const legacy=json("ribbitRaceLeaderboardFirstPlaceNoticesV1",{});
      for(const key of ["pvpwins","flies"]) if(legacy?.[key]||legacy?.notified?.[key]) this.seen[key]=true;
      setJson("rrWorldRecordFirstPlaceSeenV1",this.seen);this.install();}
    infer(){
      const metric=q("#leaderboard-metric")?.value||"time"; const level=bridge()?.snapshot?.().level||q("#leaderboard-level")?.value||"";
      const names={time:"Fastest time",jumps:"Fewest jumps",pvpwins:"Most PvP wins",flies:"Most flies eaten"};
      return {metric,level,label:`${names[metric]||"Leaderboard record"}${level&&level!=="any"?` — ${level.toUpperCase()}`:""}`};
    }
    prepare(){
      const detail=this.infer();
      if((detail.metric==="pvpwins"||detail.metric==="flies")&&this.seen[detail.metric]) return "";
      if(detail.metric==="pvpwins"||detail.metric==="flies"){this.seen[detail.metric]=true;setJson("rrWorldRecordFirstPlaceSeenV1",this.seen)}
      this.pending=detail;this.showHitbox(detail);return "WORLD RECORD";
    }
    showHitbox(detail){
      if(!this.hit){this.hit=document.createElement("div");this.hit.id="rr-world-record-hit";this.hit.innerHTML='<span></span>';document.body.append(this.hit)}
      q("span",this.hit).textContent=detail.label;this.hit.classList.add("show");clearTimeout(this.hit._timer);this.hit._timer=setTimeout(()=>this.hit.classList.remove("show"),6500);
    }
    markCurrentFirstPlace(){
      const metric=q("#leaderboard-metric")?.value;if(!["pvpwins","flies"].includes(metric))return;
      const current=q("#leaderboard-body tr.current-player")||qa("#leaderboard-body tr").find(r=>/\bNick\b/i.test(r.textContent||""));
      if(current&&Number(current.querySelector("td")?.textContent?.trim())===1){this.seen[metric]=true;setJson("rrWorldRecordFirstPlaceSeenV1",this.seen)}
    }
    install(){window.RibbitWorldRecordNotice=this;new MutationObserver(()=>this.markCurrentFirstPlace()).observe(document.body,{subtree:true,childList:true});document.addEventListener("change",()=>this.markCurrentFirstPlace());}
  }
  new WorldRecordNoticeController();

  class MobileController {
    constructor() {
      // Canvas-native Mobile Mode is owned by client/game/100-mobile-experience.js.
      // This compatibility controller only keeps the body class synchronized.
      this.sync = () => document.body.classList.toggle(
        "rr-mobile-enabled",
        window.RibbitMobileExperience?.enabled?.() === true
      );
      this.sync();
      window.addEventListener("ribbit-mobile-mode-changed", this.sync);
    }
  }
  new MobileController();

  class ReplayController {
    constructor(){this.recorder=null;this.parts=[];this.run=null;this.installLeaderboard();window.addEventListener("ribbit-solo-finished",e=>this.finish(e.detail));setTimeout(()=>this.tick(),250);}
    tick(){const snap=bridge()?.snapshot?.()||{};const mobile=window.RibbitMobileExperience?.enabled?.()||window.matchMedia?.("(pointer: coarse)")?.matches;if(mobile&&this.recorder){try{this.recorder.stop()}catch(_){}this.recorder=null;this.parts=[];this.run=null;}const single=!mobile&&/playing/i.test(snap.state||"")&&!snap.localVersus&&!snap.onlineVersus&&!/pvp|versus|online|quick/i.test(snap.state||"");if(single&&!this.recorder)this.start(snap);setTimeout(()=>this.tick(),250)}
    start(snap){
      const canvas=bridge()?.canvas?.();if(!canvas?.captureStream||typeof MediaRecorder==="undefined")return;
      try{const stream=canvas.captureStream(20),type=MediaRecorder.isTypeSupported("video/webm;codecs=vp8")?"video/webm;codecs=vp8":"video/webm";this.parts=[];this.run={level:snap.level||"unknown",started:Date.now()};this.recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:420000});this.recorder.ondataavailable=e=>{if(e.data?.size)this.parts.push(e.data)};this.recorder.start(1000)}catch(_){this.recorder=null}
    }
    async finish(snap){
      const rec=this.recorder;if(!rec||!this.run)return;this.recorder=null;const run=this.run;this.run=null;
      const stopped=new Promise(resolve=>rec.addEventListener("stop",resolve,{once:true}));try{rec.stop()}catch(_){return}await stopped;
      const blob=new Blob(this.parts,{type:rec.mimeType||"video/webm"});this.parts=[];if(!blob.size||blob.size>2_800_000)return;
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]||"");reader.onerror=reject;reader.readAsDataURL(blob)});
      // The Worker binds a replay to the authenticated session. Do not depend
      // on account-name text being present in the DOM; that prevented valid PBs
      // from uploading on the canvas-native account UI.
      const payload={level:snap.level||run.level,time:Number(snap.time)||((Date.now()-run.started)/1000),jumps:Number(snap.jumps)||0,mime:blob.type,data};
      fetch("/api/replays/submit",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify(payload)})
        .then(async response=>{let detail={};try{detail=await response.json()}catch(_){};
          if(response.ok&&detail.ok){window.dispatchEvent(new CustomEvent("ribbit-replay-uploaded",{detail:{level:payload.level,stored:detail.stored||[]}}));}
          else console.warn("Replay PB upload skipped:",detail.message||response.status)})
        .catch(error=>console.warn("Replay PB upload unavailable:",error));
    }
    installLeaderboard(){
      document.addEventListener("click",e=>{const frog=e.target.closest?.(".rr-replay-frog"),row=e.target.closest?.("#leaderboard-body tr");if(!row||(!frog&&!e.target.closest?.("td:nth-child(2)")))return;const metric=q("#leaderboard-metric")?.value;if(!["time","jumps"].includes(metric))return;const cells=row.querySelectorAll("td");const username=(cells[1]?.dataset.playerName||cells[1]?.textContent||"").replace("🐸","").trim(),level=(cells[3]?.textContent||q("#leaderboard-level")?.value||"").trim().toLowerCase();if(username)this.play(username,level,metric)});
      const decorate=()=>{const metric=q("#leaderboard-metric")?.value;if(!["time","jumps"].includes(metric))return;qa("#leaderboard-body tr").forEach(row=>{const cell=row.querySelector("td:nth-child(2)");if(!cell||cell.querySelector(".rr-replay-frog"))return;cell.dataset.playerName=cell.textContent.trim();const b=document.createElement("button");b.className="rr-replay-frog";b.type="button";b.title="Watch this record run";b.textContent="🐸";cell.prepend(b)})};
      new MutationObserver(decorate).observe(document.body,{subtree:true,childList:true});document.addEventListener("change",decorate);setTimeout(decorate,0);
      const style=document.createElement("style");style.textContent="#leaderboard-body tr{cursor:pointer}#leaderboard-body tr:hover{outline:3px solid #5ce5e8;outline-offset:-3px}";document.head.append(style);
    }
    ensureReplayOverlay(){
      let overlay=q("#rr-replay-overlay");
      if(overlay)return overlay;
      overlay=document.createElement("section");
      overlay.id="rr-replay-overlay";
      overlay.hidden=true;
      overlay.setAttribute("role","dialog");
      overlay.setAttribute("aria-modal","true");
      overlay.innerHTML=`<div class="rr-replay-window">
        <header><span class="rr-replay-title">PERSONAL BEST REPLAY</span><button class="rr-replay-close" type="button" aria-label="Close replay">×</button></header>
        <div class="rr-replay-stage"><video controls playsinline preload="metadata"></video><div class="rr-replay-message" hidden></div></div>
        <footer><span class="rr-replay-caption"></span><button class="rr-replay-again" type="button">PLAY FROM START</button></footer>
      </div>`;
      document.body.append(overlay);
      const video=q("video",overlay);
      const close=()=>{try{video.pause()}catch(_){}if(overlay._objectUrl){URL.revokeObjectURL(overlay._objectUrl);overlay._objectUrl="";}overlay.hidden=true;};
      q(".rr-replay-close",overlay).onclick=close;
      q(".rr-replay-again",overlay).onclick=()=>{video.currentTime=0;video.play().catch(()=>{});};
      video.addEventListener("error",()=>{
        const message=q(".rr-replay-message",overlay);
        message.hidden=false;
        message.innerHTML='<strong>REPLAY COULD NOT LOAD</strong><span>This saved video could not be decoded by the browser. Set a new PB after updating to this build and try again.</span>';
        q(".rr-replay-again",overlay).hidden=true;
      });
      overlay.addEventListener("pointerdown",event=>{if(event.target===overlay)close();});
      document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!overlay.hidden){event.preventDefault();close();}});
      return overlay;
    }
    showReplayMessage(title,detail){
      const overlay=this.ensureReplayOverlay(),video=q("video",overlay),message=q(".rr-replay-message",overlay);
      try{video.pause()}catch(_){}video.removeAttribute("src");video.load();
      message.hidden=false;message.innerHTML=`<strong>${title}</strong><span>${detail}</span>`;
      q(".rr-replay-caption",overlay).textContent="";q(".rr-replay-again",overlay).hidden=true;overlay.hidden=false;
    }
    async play(username,level,metric,uid=""){
      const overlay=this.ensureReplayOverlay(),video=q("video",overlay),message=q(".rr-replay-message",overlay);
      message.hidden=false;message.innerHTML='<strong>LOADING REPLAY…</strong><span>Fetching the saved personal-best video.</span>';
      q(".rr-replay-caption",overlay).textContent=`${username} • ${level.toUpperCase()} • ${metric==="time"?"FASTEST TIME":"FEWEST JUMPS"}`;
      q(".rr-replay-again",overlay).hidden=true;overlay.hidden=false;
      try{
        const params=new URLSearchParams({username:String(username||""),level:String(level||""),metric:String(metric||"")});
        if(uid)params.set("uid",String(uid));
        const r=await fetch(`/api/replays/get?${params.toString()}`,{credentials:"same-origin",cache:"no-store"});
        let j={};try{j=await r.json()}catch(_){ }
        if(!r.ok||!j.ok||!j.data){
          const detail=r.status===401?"Sign in to the same Friends account used by the game.":r.status===404?"This record predates replay capture, or its PB video was never uploaded.":j.message||`The Worker returned HTTP ${r.status}.`;
          this.showReplayMessage(r.status===404?"NO VIDEO FOR THIS PB":"REPLAY SERVICE ERROR",detail);return false;
        }
        const binary=atob(String(j.data||"")),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
        const blob=new Blob([bytes],{type:j.mime||"video/webm"});
        if(overlay._objectUrl)URL.revokeObjectURL(overlay._objectUrl);
        overlay._objectUrl=URL.createObjectURL(blob);video.src=overlay._objectUrl;video.load();message.hidden=true;q(".rr-replay-again",overlay).hidden=false;
        await video.play().catch(()=>{});return true;
      }catch(error){
        let health=null;try{const response=await fetch("/api/replays/health",{credentials:"same-origin",cache:"no-store"});health=await response.json();}catch(_){ }
        // A separate video server is not required. Replays live in the same
        // FriendsHub Durable Object as accounts and saves, on the game domain.
        const detail=health?.ok
          ? "The replay service is online, but this video could not be downloaded. The player may need to set a new PB after this build is deployed."
          : "Deploy the complete Worker project—not only the public folder—on this same game domain. A separate video server is not required.";
        this.showReplayMessage("REPLAY SERVER UNREACHABLE",detail);console.warn("Replay fetch failed",error);return false;
      }
    }
  }
  const replayController = new ReplayController();
  // Canvas-native leaderboard rows call this bridge directly. The server keeps
  // the current PB recording for each player, level, and ranked metric.
  window.RibbitRacePlayRecordReplay = (username, level, metric, uid = "") =>
    replayController.play(String(username || ""), String(level || "").toLowerCase(), String(metric || "time").toLowerCase(), String(uid || ""));

  class PaletteController {
    constructor(){this.clip=json("rrFrogPaletteClipboardV1",null);this.panel=null;this.make();this.bind();setTimeout(()=>this.tick(),250)}
    make(){this.hatIcon=document.createElement("div");this.hatIcon.id="rr-custom-top-hat";this.hatIcon.setAttribute("aria-label","Top hat");document.body.append(this.hatIcon);this.panel=document.createElement("section");this.panel.id="rr-palette-tools";this.panel.innerHTML='<strong>BASE PALETTE</strong><div class="skins"></div><div class="actions"><button data-a="copy">COPY PALETTE</button><button data-a="paste">PASTE PALETTE</button></div><small>Right-click or ⌘/Ctrl+C to copy • ⌘/Ctrl+V to paste</small>';document.body.append(this.panel);this.renderSkins()}
    renderSkins(){const wrap=q(".skins",this.panel);wrap.textContent="";(bridge()?.skinIds?.()||[]).filter(id=>!/^custom/.test(id)).forEach(id=>{const b=document.createElement("button");b.textContent=id.toUpperCase();b.dataset.skin=id;b.onclick=()=>this.apply(id);wrap.append(b)})}
    copy(){const id=bridge()?.currentSkin?.();const palette=bridge()?.palette?.(id);if(!palette)return toast("PALETTE NOT COPIED","Choose a frog palette first.");this.clip={source:id,palette};setJson("rrFrogPaletteClipboardV1",this.clip);toast("PALETTE COPIED",id.toUpperCase())}
    paste(){if(!this.clip?.palette)return toast("NO PALETTE COPIED");bridge()?.commitRgbEditor?.();const id=bridge()?.activeCustomId?.();if(bridge()?.applyPalette?.(id,this.clip.palette))toast("PALETTE PASTED",id.toUpperCase())}
    apply(id){const p=bridge()?.palette?.(id);if(p){this.clip={source:id,palette:p};setJson("rrFrogPaletteClipboardV1",this.clip);this.paste()}}
    bind(){q('[data-a="copy"]',this.panel).onclick=()=>this.copy();q('[data-a="paste"]',this.panel).onclick=()=>this.paste();document.addEventListener("contextmenu",e=>{if(e.target.closest?.("#game-frame,canvas")){const s=bridge()?.state?.()||"";if(/custom|color/i.test(s)){e.preventDefault();this.copy()}}});document.addEventListener("keydown",e=>{const s=bridge()?.state?.()||"";if(!/custom|color/i.test(s)||!(e.metaKey||e.ctrlKey))return;if(e.key.toLowerCase()==="c"){e.preventDefault();this.copy()}if(e.key.toLowerCase()==="v"){e.preventDefault();this.paste()}});document.addEventListener("pointerdown",()=>bridge()?.commitRgbEditor?.(),true)}
    tick(){const s=bridge()?.state?.()||"";this.panel.hidden=!/custom|color/i.test(s);this.hatIcon.hidden=this.panel.hidden;setTimeout(()=>this.tick(),250)}
  }
  new PaletteController();

  class HatProgressController {
    constructor(){
      this.key="ribbitRaceHatProgressV3";
      this.unlockedKey="ribbitRaceUnlockedHatsV2";
      this.progress=json(this.key,null);
      this.unlocked=new Set(json(this.unlockedKey,["none"]));
      this.lastSnapshot=bridge()?.snapshot?.()||{};
      this.lastFlies=this.stat(/total.*flies|flies.*total/i);
      this.lastJumps=this.stat(/total.*jump|jumps.*total/i);
      window.addEventListener("ribbit-pvp-event",e=>this.event(e.detail));
      window.addEventListener("ribbit-solo-finished",e=>this.finished(e.detail));
      window.addEventListener("ribbit-pvp-match-finished",e=>this.matchFinished(e.detail));
      window.addEventListener("ribbit-hats-test-enabled",()=>{this.initialize();});
      // The game engine emits an absolute per-skin count immediately after a
      // valid catch. Consume it directly so the hat menu updates in the same
      // frame instead of waiting for an unrelated aggregate localStorage stat.
      window.addEventListener("rr-hat-progress",e=>this.externalCatch(e.detail||{}));
      window.RibbitHatProgress=this;
      this.syncEngineCounts();
      setTimeout(()=>this.tick(),500);
    }
    featureUnlocked(){
      if(localStorage.getItem("ribbitRaceHatsTestUnlockedV1")==="1")return true;
      return Object.keys(localStorage).some(k=>/hat.*unlock|unlock.*hat/i.test(k)&&/true|1|unlocked/i.test(localStorage.getItem(k)||""))||/hat/i.test(bridge()?.state?.()||"");
    }
    initialize(){
      if(this.progress)return;
      this.progress={startedAt:Date.now(),activityCount:0,fliesBase:this.stat(/total.*flies|flies.*total/i),winsBase:this.stat(/pvp.*win|versus.*win/i),jumpsBase:this.stat(/total.*jump|jumps.*total/i),achievementsBase:this.stat(/achievement/i),counters:{versusWins:0,randomWins:0,cpuWins:0},levelWins:{},skinLevelWins:{},skinFlies:{},skinJumps:{},skinVersusWins:{}};
      setJson(this.key,this.progress);
      // Silent initialization: the achievements menu already communicates hat progress. No popup toast. 
    }
    stat(rx){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!rx.test(k||""))continue;const n=Number(localStorage.getItem(k));if(Number.isFinite(n))return n;try{const o=JSON.parse(localStorage.getItem(k));for(const [a,v] of Object.entries(o||{}))if(rx.test(a)&&Number.isFinite(Number(v)))return Number(v)}catch(_){}}return 0}
    add(map,key,amount=1){map[key]=(Number(map[key])||0)+amount}
    engineProgress(){try{return json("ribbitRaceHatProgressV2",{})||{};}catch(_){return {};}}
    syncEngineCounts(){
      if(!this.progress)return false;
      const source=this.engineProgress(),bySkin=source.bySkin&&typeof source.bySkin==="object"?source.bySkin:{};
      this.progress.skinFlies ||= {};
      let changed=false;
      for(const [skin,count] of Object.entries(bySkin)){
        const next=Math.max(0,Number(count)||0);
        if(next>Number(this.progress.skinFlies[skin]||0)){this.progress.skinFlies[skin]=next;changed=true;}
      }
      if(changed){setJson(this.key,this.progress);this.evaluate(bridge()?.snapshot?.()||{});}
      return changed;
    }
    externalCatch(detail={}){
      if(!this.progress&&this.featureUnlocked())this.initialize();
      if(!this.progress)return;
      const skin=String(detail.skinId||bridge()?.currentSkin?.()||"azure").toLowerCase();
      const absolute=Math.max(0,Number(detail.count)||0);
      this.progress.skinFlies ||= {};
      this.progress.skinFlies[skin]=Math.max(Number(this.progress.skinFlies[skin])||0,absolute);
      this.progress.activityCount=Math.max(1,Number(this.progress.activityCount)||0)+1;
      setJson(this.key,this.progress);
      this.evaluate(bridge()?.snapshot?.()||{});
    }
    event(){/* Opponent-specific events intentionally do not unlock hats. */}
    finished(d={}){if(!this.progress)this.initialize();if(!this.progress)return;const level=String(d.level||"unknown").toLowerCase(),skin=String(d.skin||"azure").toLowerCase();this.progress.activityCount=(this.progress.activityCount||0)+1;this.add(this.progress.levelWins,level);this.progress.skinLevelWins[skin] ||= {};this.add(this.progress.skinLevelWins[skin],level);if(d.randomSelected)this.progress.counters.randomWins++;setJson(this.key,this.progress);this.evaluate({...d,level,skin,time:Number(d.time)||0})}
    matchFinished(d={}){if(!d.ownWon)return;if(!this.progress)this.initialize();if(!this.progress)return;const skin=String(d.skin||bridge()?.currentSkin?.()||"azure").toLowerCase();this.progress.activityCount=(this.progress.activityCount||0)+1;this.progress.counters.versusWins++;if(!d.onlineVersus)this.progress.counters.cpuWins++;this.add(this.progress.skinVersusWins,skin);setJson(this.key,this.progress);this.evaluate({...d,skin})}
    updateDeltas(){if(!this.progress)return;const snap=bridge()?.snapshot?.()||{},skin=snap.skin||"azure";const flies=this.stat(/total.*flies|flies.*total/i),jumps=this.stat(/total.*jump|jumps.*total/i);let changed=false;if(flies>this.lastFlies){this.add(this.progress.skinFlies,skin,flies-this.lastFlies);changed=true}if(jumps>this.lastJumps){this.add(this.progress.skinJumps,skin,jumps-this.lastJumps);changed=true}this.lastFlies=flies;this.lastJumps=jumps;if(changed){this.progress.activityCount=(this.progress.activityCount||0)+1;setJson(this.key,this.progress);this.evaluate(snap)}}
    requirements(id,snap=bridge()?.snapshot?.()||{}){
      const n=String(id).toLowerCase(),P=this.progress||{},SL=P.skinLevelWins||{},SF=P.skinFlies||{},SJ=P.skinJumps||{},SV=P.skinVersusWins||{},C=P.counters||{};
      const skinWins=(skin,level)=>Number(SL?.[skin]?.[level]||0);
      if(/flower/.test(n))return {ok:snap.level==="garden"&&snap.time>0&&snap.time<30&&/blossom/.test(snap.skin||""),text:"Finish Garden under 30 seconds as Blossom"};
      if(/bunny/.test(n))return {ok:snap.level==="pond"&&snap.time>0&&snap.time<30&&/silver/.test(snap.skin||""),text:"Finish Pond under 30 seconds as Silver"};
      if(/crown/.test(n))return {ok:(C.versusWins||0)>=10,text:`Win 10 Versus matches (${C.versusWins||0}/10)`};
      if(/top-hat/.test(n))return {ok:(SF.azure||0)>=75,text:`Catch 75 flies as Azure (${SF.azure||0}/75)`};
      if(/party/.test(n))return {ok:(SF.plum||0)>=50,text:`Catch 50 flies as Plum (${SF.plum||0}/50)`};
      if(/straw/.test(n))return {ok:snap.level==="park"&&snap.time>0&&snap.time<25&&/forest/.test(snap.skin||""),text:"Finish Park under 25 seconds as Forest"};
      if(/pirate/.test(n))return {ok:skinWins("azure","lake")>=3,text:`Win Lake 3 times as Azure (${skinWins("azure","lake")}/3)`};
      if(/wizard|witch/.test(n))return {ok:(C.randomWins||0)>=3&&Object.keys(SL.violet||{}).length>=1,text:`Win 3 Random runs and one level as Violet (${C.randomWins||0}/3)`};
      if(/cowboy/.test(n))return {ok:(SJ.ember||0)>=50,text:`Complete 50 jumps as Ember (${SJ.ember||0}/50)`};
      if(/viking|horn|danger/.test(n))return {ok:(SV.ember||0)>=5,text:`Win 5 Versus matches as Ember (${SV.ember||0}/5)`};
      if(/chef|cook|taco/.test(n))return {ok:(SF.crimson||0)>=100,text:`Catch 100 flies as Crimson (${SF.crimson||0}/100)`};
      if(/antenna|bug|leaf|lily/.test(n))return {ok:(SF.forest||0)>=125,text:`Catch 125 flies as Forest (${SF.forest||0}/125)`};
      if(/halo|angel|nurse/.test(n))return {ok:Object.keys(SL.silver||{}).length>=6,text:`Win all 6 levels as Silver (${Object.keys(SL.silver||{}).length}/6)`};
      if(/baseball|cap/.test(n))return {ok:skinWins("azure","park")>=5,text:`Win Park 5 times as Azure (${skinWins("azure","park")}/5)`};
      if(/sombrero|flamenco/.test(n))return {ok:skinWins("crimson","garden")>=5,text:`Win Garden 5 times as Crimson (${skinWins("crimson","garden")}/5)`};
      if(/santa|beanie|sleep/.test(n))return {ok:skinWins("silver","lake")>=5,text:`Win Lake 5 times as Silver (${skinWins("silver","lake")}/5)`};
      if(/bow|ribbon|beret/.test(n))return {ok:skinWins("blossom","pond")>=3,text:`Win Pond 3 times as Blossom (${skinWins("blossom","pond")}/3)`};
      if(/propeller|headphone|headband/.test(n))return {ok:(SJ.violet||0)>=100,text:`Complete 100 jumps as Violet (${SJ.violet||0}/100)`};
      if(/hard-hat|miner|fireman|police/.test(n))return {ok:skinWins("forest","jungle")>=3,text:`Win Jungle 3 times as Forest (${skinWins("forest","jungle")}/3)`};
      return {ok:(SF.azure||0)>=40,text:`Catch 40 flies as Azure (${SF.azure||0}/40)`};
    }
    requirementLines(id){const t=(this.requirements(id).text||"Complete its hat challenge").toUpperCase();const words=t.split(/\s+/);let a="",b="";for(const word of words){if(!b&&(a+" "+word).trim().length<=29)a=(a+" "+word).trim();else b=(b+" "+word).trim();}return [a,b||"AFTER HATS UNLOCK"]}
    ids(){return [...new Set([...(bridge()?.hatIds?.()||[]),"flower","bunny-ears","crown","top-hat","party-hat","straw-hat","pirate-hat","wizard-hat","cowboy-hat"].filter(x=>x&&x!=="none"))]}
    unlock(id){if(this.unlocked.has(id))return false;this.unlocked.add(id);setJson(this.unlockedKey,[...this.unlocked]);/* Hat unlocks must be completely silent. */window.dispatchEvent(new CustomEvent("ribbit-hat-unlocked",{detail:{id,at:Date.now()}}));return true}
    sanitizeAssignments(){for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!/hat.*assign|custom.*frog.*hat/i.test(key||""))continue;let data;try{data=JSON.parse(localStorage.getItem(key))}catch(_){continue}let changed=false;const clean=x=>{if(typeof x==="string"&&x!=="none"&&!this.unlocked.has(x)){changed=true;return "none"}if(Array.isArray(x))return x.map(clean);if(x&&typeof x==="object")for(const k of Object.keys(x))x[k]=clean(x[k]);return x};data=clean(data);if(changed)setJson(key,data)}}
    unlockCustom3(){localStorage.setItem("ribbitRaceCustom3UnlockedV2","true")}
    evaluate(snap=bridge()?.snapshot?.()||{}){if(!this.progress||(this.progress.activityCount||0)<=0)return;for(const id of this.ids()){if(!this.unlocked.has(id)&&this.requirements(id,snap).ok)this.unlock(id)}this.custom3()}
    custom3(){const flies=this.stat(/total.*flies|flies.*total/i)-this.progress.fliesBase,wins=(this.progress.counters?.versusWins||0),levels=Object.keys(this.progress.levelWins||{}).length;if(flies>=100&&wins>=3&&levels>=3)this.unlockCustom3()}
    tick(){if(this.featureUnlocked())this.initialize();if(this.progress){this.syncEngineCounts();this.updateDeltas();this.sanitizeAssignments();setJson(this.key,this.progress)}this.lastSnapshot=bridge()?.snapshot?.()||{};setTimeout(()=>this.tick(),750)}
  }
  new HatProgressController();
})();
