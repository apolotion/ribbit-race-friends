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
      this.pending=detail;this.showHitbox(detail);return "NEW WORLD RECORD";
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
    constructor(){this.enabled=localStorage.getItem("rrFriendsMobileModeV1")==="1";this.pointers=new Map();this.make();this.bind();requestAnimationFrame(()=>this.tick());}
    make(){
      this.toggle=document.createElement("button");this.toggle.id="rr-mobile-toggle";document.body.append(this.toggle);
      this.p1=this.pad("P1 JUMP","p1");this.p2=this.pad("P2 JUMP","p2");
      this.refreshToggle();
    }
    pad(label,side){const b=document.createElement("button");b.className=`rr-mobile-pad ${side}`;b.textContent=label;b.dataset.side=side;document.body.append(b);return b}
    refreshToggle(){this.toggle.textContent=`MOBILE MODE: ${this.enabled?"ON":"OFF"}`;this.toggle.classList.toggle("on",this.enabled)}
    bind(){
      this.toggle.addEventListener("click",()=>{this.enabled=!this.enabled;localStorage.setItem("rrFriendsMobileModeV1",this.enabled?"1":"0");this.refreshToggle()});
      [this.p1,this.p2].forEach((pad)=>{
        pad.addEventListener("pointerdown",e=>{e.preventDefault();pad.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,pad.dataset.side);this.send(pad.dataset.side,true);pad.classList.add("held")});
        const up=e=>{const side=this.pointers.get(e.pointerId);if(!side)return;this.pointers.delete(e.pointerId);this.send(side,false);pad.classList.remove("held")};
        pad.addEventListener("pointerup",up);pad.addEventListener("pointercancel",up);pad.addEventListener("lostpointercapture",up);
      });
    }
    send(side,down){const snap=bridge()?.snapshot?.()||{};let code="Space";if(snap.localVersus&&snap.twoHuman)code=side==="p1"?"ShiftLeft":"ShiftRight";bridge()?.dispatchKey?.(code,down)}
    tick(){
      const snap=bridge()?.snapshot?.()||{};const menu=/^(menu|main|title|modeSelect)$/i.test(snap.state||"")||/menu/i.test(snap.state||"");
      this.toggle.hidden=!menu;const playing=/playing|countdown|pvp|versus/i.test(snap.state||"")&&!/setup|menu|select/i.test(snap.state||"");
      this.p1.hidden=!(this.enabled&&playing);this.p2.hidden=!(this.enabled&&playing&&snap.localVersus&&snap.twoHuman);
      document.body.classList.toggle("rr-mobile-enabled",this.enabled);requestAnimationFrame(()=>this.tick());
    }
  }
  new MobileController();

  class ReplayController {
    constructor(){this.recorder=null;this.parts=[];this.run=null;this.installLeaderboard();window.addEventListener("ribbit-solo-finished",e=>this.finish(e.detail));requestAnimationFrame(()=>this.tick());}
    tick(){const snap=bridge()?.snapshot?.()||{};const single=/playing/i.test(snap.state||"")&&!snap.localVersus&&!snap.onlineVersus&&!/pvp|versus|online|quick/i.test(snap.state||"");if(single&&!this.recorder)this.start(snap);requestAnimationFrame(()=>this.tick())}
    start(snap){
      const canvas=bridge()?.canvas?.();if(!canvas?.captureStream||typeof MediaRecorder==="undefined")return;
      try{const stream=canvas.captureStream(20),type=MediaRecorder.isTypeSupported("video/webm;codecs=vp8")?"video/webm;codecs=vp8":"video/webm";this.parts=[];this.run={level:snap.level||"unknown",started:Date.now()};this.recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:420000});this.recorder.ondataavailable=e=>{if(e.data?.size)this.parts.push(e.data)};this.recorder.start(1000)}catch(_){this.recorder=null}
    }
    async finish(snap){
      const rec=this.recorder;if(!rec||!this.run)return;this.recorder=null;const run=this.run;this.run=null;
      const stopped=new Promise(resolve=>rec.addEventListener("stop",resolve,{once:true}));try{rec.stop()}catch(_){return}await stopped;
      const blob=new Blob(this.parts,{type:rec.mimeType||"video/webm"});this.parts=[];if(!blob.size||blob.size>2_800_000)return;
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]||"");reader.onerror=reject;reader.readAsDataURL(blob)});
      const username=(q("#cloud-account-name")?.textContent||q("#cloud-account-button")?.textContent||"").trim();if(!username||username==="GUEST")return;
      const payload={username,level:snap.level||run.level,time:Number(snap.time)||((Date.now()-run.started)/1000),jumps:Number(snap.jumps)||0,mime:blob.type,data};
      fetch("/api/replays/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)}).catch(()=>{});
    }
    installLeaderboard(){
      document.addEventListener("click",e=>{const frog=e.target.closest?.(".rr-replay-frog"),row=e.target.closest?.("#leaderboard-body tr");if(!row||(!frog&&!e.target.closest?.("td:nth-child(2)")))return;const metric=q("#leaderboard-metric")?.value;if(!["time","jumps"].includes(metric))return;const cells=row.querySelectorAll("td");const username=(cells[1]?.dataset.playerName||cells[1]?.textContent||"").replace("🐸","").trim(),level=(cells[3]?.textContent||q("#leaderboard-level")?.value||"").trim().toLowerCase();if(username)this.play(username,level,metric)});
      const decorate=()=>{const metric=q("#leaderboard-metric")?.value;if(!["time","jumps"].includes(metric))return;qa("#leaderboard-body tr").forEach(row=>{const cell=row.querySelector("td:nth-child(2)");if(!cell||cell.querySelector(".rr-replay-frog"))return;cell.dataset.playerName=cell.textContent.trim();const b=document.createElement("button");b.className="rr-replay-frog";b.type="button";b.title="Watch this record run";b.textContent="🐸";cell.prepend(b)})};
      new MutationObserver(decorate).observe(document.body,{subtree:true,childList:true});document.addEventListener("change",decorate);setTimeout(decorate,0);
      const style=document.createElement("style");style.textContent="#leaderboard-body tr{cursor:pointer}#leaderboard-body tr:hover{outline:3px solid #5ce5e8;outline-offset:-3px}";document.head.append(style);
    }
    async play(username,level,metric){
      try{const r=await fetch(`/api/replays/get?username=${encodeURIComponent(username)}&level=${encodeURIComponent(level)}&metric=${encodeURIComponent(metric)}`);const j=await r.json();if(!r.ok||!j.ok||!j.data){toast("REPLAY NOT AVAILABLE","This record was made before replay capture was enabled.");return}let overlay=q("#rr-replay-overlay");if(!overlay){overlay=document.createElement("div");overlay.id="rr-replay-overlay";overlay.innerHTML='<div><button aria-label="Close">×</button><h2>WORLD RECORD REPLAY</h2><video controls autoplay playsinline></video><p></p></div>';document.body.append(overlay);q("button",overlay).onclick=()=>{q("video",overlay).pause();overlay.hidden=true}}q("p",overlay).textContent=`${username} • ${level.toUpperCase()} • ${metric==="time"?"FASTEST TIME":"FEWEST JUMPS"}`;q("video",overlay).src=`data:${j.mime||"video/webm"};base64,${j.data}`;overlay.hidden=false}catch(_){toast("REPLAY UNAVAILABLE","The replay server could not be reached.")}}
  }
  new ReplayController();

  class PaletteController {
    constructor(){this.clip=json("rrFrogPaletteClipboardV1",null);this.panel=null;this.make();this.bind();requestAnimationFrame(()=>this.tick())}
    make(){this.hatIcon=document.createElement("div");this.hatIcon.id="rr-custom-top-hat";this.hatIcon.setAttribute("aria-label","Top hat");document.body.append(this.hatIcon);this.panel=document.createElement("section");this.panel.id="rr-palette-tools";this.panel.innerHTML='<strong>BASE PALETTE</strong><div class="skins"></div><div class="actions"><button data-a="copy">COPY PALETTE</button><button data-a="paste">PASTE PALETTE</button></div><small>Right-click or ⌘/Ctrl+C to copy • ⌘/Ctrl+V to paste</small>';document.body.append(this.panel);this.renderSkins()}
    renderSkins(){const wrap=q(".skins",this.panel);wrap.textContent="";(bridge()?.skinIds?.()||[]).filter(id=>!/^custom/.test(id)).forEach(id=>{const b=document.createElement("button");b.textContent=id.toUpperCase();b.dataset.skin=id;b.onclick=()=>this.apply(id);wrap.append(b)})}
    copy(){const id=bridge()?.currentSkin?.();const palette=bridge()?.palette?.(id);if(!palette)return toast("PALETTE NOT COPIED","Choose a frog palette first.");this.clip={source:id,palette};setJson("rrFrogPaletteClipboardV1",this.clip);toast("PALETTE COPIED",id.toUpperCase())}
    paste(){if(!this.clip?.palette)return toast("NO PALETTE COPIED");bridge()?.commitRgbEditor?.();const id=bridge()?.activeCustomId?.();if(bridge()?.applyPalette?.(id,this.clip.palette))toast("PALETTE PASTED",id.toUpperCase())}
    apply(id){const p=bridge()?.palette?.(id);if(p){this.clip={source:id,palette:p};setJson("rrFrogPaletteClipboardV1",this.clip);this.paste()}}
    bind(){q('[data-a="copy"]',this.panel).onclick=()=>this.copy();q('[data-a="paste"]',this.panel).onclick=()=>this.paste();document.addEventListener("contextmenu",e=>{if(e.target.closest?.("#game-frame,canvas")){const s=bridge()?.state?.()||"";if(/custom|color/i.test(s)){e.preventDefault();this.copy()}}});document.addEventListener("keydown",e=>{const s=bridge()?.state?.()||"";if(!/custom|color/i.test(s)||!(e.metaKey||e.ctrlKey))return;if(e.key.toLowerCase()==="c"){e.preventDefault();this.copy()}if(e.key.toLowerCase()==="v"){e.preventDefault();this.paste()}});document.addEventListener("pointerdown",()=>bridge()?.commitRgbEditor?.(),true)}
    tick(){const s=bridge()?.state?.()||"";this.panel.hidden=!/custom|color/i.test(s);this.hatIcon.hidden=this.panel.hidden;requestAnimationFrame(()=>this.tick())}
  }
  new PaletteController();

  class HatProgressController {
    constructor(){this.key="ribbitRaceHatProgressV2";this.unlockedKey="ribbitRaceUnlockedHatsV2";this.progress=json(this.key,null);this.unlocked=new Set(json(this.unlockedKey,["none"]));this.last=bridge()?.snapshot?.()||{};window.addEventListener("ribbit-pvp-event",e=>this.event(e.detail));window.addEventListener("ribbit-solo-finished",e=>this.finished(e.detail));window.addEventListener("ribbit-pvp-match-finished",e=>this.matchFinished(e.detail));requestAnimationFrame(()=>this.tick())}
    featureUnlocked(){return Object.keys(localStorage).some(k=>/hat.*unlock|unlock.*hat/i.test(k)&&/true|1|unlocked/i.test(localStorage.getItem(k)||""))||/hat/i.test(bridge()?.state?.()||"")}
    initialize(){if(this.progress)return;this.progress={startedAt:Date.now(),fliesBase:this.stat(/total.*flies|flies.*total/i),winsBase:this.stat(/pvp.*win|versus.*win/i),jumpsBase:this.stat(/total.*jump|jumps.*total/i),counters:{rebounds:0,bonks:0,onlineWins:0,randomWins:0},levelWins:{},achievementsBase:this.stat(/achievement/i)};setJson(this.key,this.progress);toast("HATS UNLOCKED","Each hat now has a thematic challenge.",6500)}
    stat(rx){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!rx.test(k||""))continue;const n=Number(localStorage.getItem(k));if(Number.isFinite(n))return n;try{const o=JSON.parse(localStorage.getItem(k));for(const [a,v] of Object.entries(o||{}))if(rx.test(a)&&Number.isFinite(Number(v)))return Number(v)}catch(_){}}return 0}
    event(d={}){if(!this.progress)return;if(d.type==="rebound")this.progress.counters.rebounds++;if(d.type==="bonk")this.progress.counters.bonks++;setJson(this.key,this.progress);this.evaluate()}
    finished(d={}){if(!this.progress)return;const level=d.level||"unknown";this.progress.levelWins[level]=(this.progress.levelWins[level]||0)+1;if(d.randomSelected)this.progress.counters.randomWins++;setJson(this.key,this.progress);this.evaluate(d)}
    matchFinished(d={}){if(!this.progress||!d.human)return;if(d.onlineVersus&&d.ownWon)this.progress.counters.onlineWins++;setJson(this.key,this.progress);this.evaluate(d)}
    requirements(id,snap={}){const n=String(id).toLowerCase();const flies=this.stat(/total.*flies|flies.*total/i)-this.progress.fliesBase,wins=this.stat(/pvp.*win|versus.*win/i)-this.progress.winsBase,jumps=this.stat(/total.*jump|jumps.*total/i)-this.progress.jumpsBase,ach=this.stat(/achievement/i)-this.progress.achievementsBase,c=this.progress.counters,L=this.progress.levelWins;if(/flower|blossom|bloom/.test(n))return {ok:snap.level==="garden"&&snap.time>0&&snap.time<30&&/blossom|bloom/.test(snap.skin||""),text:"Finish Garden under 30 seconds as Bloom"};if(/bunny|rabbit|ear/.test(n))return {ok:c.rebounds>=10,text:`Rebound from a human frog 10 times (${c.rebounds}/10)`};if(/crown/.test(n))return {ok:wins>=10,text:`Win 10 individual Versus games (${Math.max(0,wins)}/10)`};if(/top|academic|grad/.test(n))return {ok:flies>=75,text:`Catch 75 flies after Hats unlock (${Math.max(0,flies)}/75)`};if(/party/.test(n))return {ok:ach>=5,text:`Earn 5 achievements after Hats unlock (${Math.max(0,ach)}/5)`};if(/straw|sun/.test(n))return {ok:snap.level==="park"&&snap.time>0&&snap.time<25,text:"Finish Park under 25 seconds"};if(/pirate/.test(n))return {ok:c.onlineWins>=5,text:`Win 5 online matches (${c.onlineWins}/5)`};if(/wizard|magic/.test(n))return {ok:c.randomWins>=3,text:`Win 3 Random runs (${c.randomWins}/3)`};if(/cowboy/.test(n))return {ok:jumps>=25,text:`Complete 25 jumps after Hats unlock (${Math.max(0,jumps)}/25)`};if(/horn|devil/.test(n))return {ok:c.bonks>=10,text:`Bonk a human frog 10 times (${c.bonks}/10)`};if(/chef|cook/.test(n))return {ok:flies>=100,text:`Catch 100 flies after Hats unlock (${Math.max(0,flies)}/100)`};if(/antenna|bug|fly/.test(n))return {ok:flies>=150,text:`Catch 150 flies after Hats unlock (${Math.max(0,flies)}/150)`};if(/halo|angel/.test(n))return {ok:Object.keys(L).length>=6,text:`Win on all 6 levels after Hats unlock (${Object.keys(L).length}/6)`};if(/baseball|cap/.test(n))return {ok:(L.park||0)>=5,text:`Win Park 5 times after Hats unlock (${L.park||0}/5)`};if(/sombrero/.test(n))return {ok:(L.garden||0)>=5,text:`Win Garden 5 times after Hats unlock (${L.garden||0}/5)`};if(/santa|winter/.test(n))return {ok:(L.lake||0)>=5,text:`Win Lake 5 times after Hats unlock (${L.lake||0}/5)`};if(/witch/.test(n))return {ok:c.randomWins>=3,text:`Win 3 Random runs (${c.randomWins}/3)`};if(/glasses|nerd|scholar/.test(n))return {ok:ach>=5,text:`Earn 5 achievements after Hats unlock (${Math.max(0,ach)}/5)`};if(/bow|ribbon/.test(n))return {ok:(L.pond||0)>=3,text:`Win Pond 3 times after Hats unlock (${L.pond||0}/3)`};if(/propeller|pilot/.test(n))return {ok:jumps>=50,text:`Complete 50 jumps after Hats unlock (${Math.max(0,jumps)}/50)`};return {ok:flies>=40,text:`Catch 40 flies after Hats unlock (${Math.max(0,flies)}/40)`}}
    ids(){const fromBridge=bridge()?.hatIds?.()||[];const assigned=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!/hat/i.test(k||""))continue;try{const v=JSON.parse(localStorage.getItem(k));const add=x=>{if(typeof x==="string")assigned.push(x);else if(Array.isArray(x))x.forEach(add);else if(x&&typeof x==="object")Object.values(x).forEach(add)};add(v)}catch(_){}}return [...new Set(["flower","bunny-ears","crown","top-hat","party-hat","straw-hat","pirate","wizard","cowboy",...assigned].filter(x=>x&&x!=="none"))]}
    unlock(id){if(this.unlocked.has(id))return;this.unlocked.add(id);setJson(this.unlockedKey,[...this.unlocked]);toast("HAT UNLOCKED",String(id).replace(/[-_]/g," ").toUpperCase(),6500)}
    sanitizeAssignments(){
      for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!/hat.*assign|custom.*frog.*hat/i.test(key||""))continue;let data;try{data=JSON.parse(localStorage.getItem(key))}catch(_){continue}let changed=false;const clean=x=>{if(typeof x==="string"&&x!=="none"&&!this.unlocked.has(x)){changed=true;return "none"}if(Array.isArray(x))return x.map(clean);if(x&&typeof x==="object"){for(const k of Object.keys(x))x[k]=clean(x[k]);}return x};data=clean(data);if(changed)setJson(key,data)}
    }
    unlockCustom3(){
      localStorage.setItem("ribbitRaceCustom3UnlockedV2","true");
      for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!/custom.*unlock|unlock.*custom/i.test(key||""))continue;let data;try{data=JSON.parse(localStorage.getItem(key))}catch(_){continue}if(Array.isArray(data)&&!data.includes("custom3")){data.push("custom3");setJson(key,data)}else if(data&&typeof data==="object"){data.custom3=true;setJson(key,data)}}
    }
    evaluate(snap=bridge()?.snapshot?.()||{}){for(const id of this.ids()){if(this.unlocked.has(id))continue;if(this.requirements(id,snap).ok)this.unlock(id)}this.custom3()}
    custom3(){const flies=this.stat(/total.*flies|flies.*total/i)-this.progress.fliesBase,wins=this.stat(/pvp.*win|versus.*win/i)-this.progress.winsBase,levels=Object.keys(this.progress.levelWins).length;if(flies>=100&&wins>=3&&levels>=3)this.unlockCustom3()}
    tick(){if(this.featureUnlocked())this.initialize();if(this.progress){this.evaluate();this.sanitizeAssignments();}this.last=bridge()?.snapshot?.()||{};requestAnimationFrame(()=>this.tick())}
  }
  new HatProgressController();
})();
