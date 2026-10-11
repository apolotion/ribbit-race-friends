
(() => {
  "use strict";

  const qs = (s, root=document) => root.querySelector(s);
  const gameFrame = () => qs("#game-frame") || qs("main");
  const gameCanvas = () => qs("#game");
  const root = document.createElement("div");
  root.id = "rr170-overlay-root";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, {once:true});
    else fn();
  }

  function hooks() { return window.RibbitRaceV170 || null; }
  function state() { return String(hooks()?.state || "").toLowerCase(); }
  function mode() { return String(hooks()?.mode || "").toLowerCase(); }
  function mobile() { return Boolean(hooks()?.mobile); }
  function playing() {
    const s = `${state()} ${mode()}`;
    return /playing|countdown|versus|pvp|online|quickplay|spectat|round/.test(s) &&
      !/menu|select|custom|achievement|leaderboard|tag/.test(s);
  }
  function versus() {
    return Boolean(hooks()?.versus) || /versus|pvp|online|quickplay|spectat/.test(`${state()} ${mode()}`);
  }
  function humanLocalVersus() {
    const ps = hooks()?.players || [];
    return versus() && ps.length >= 2 && ps.every(p => p && !p.cpu && !p.isCpu && p.control !== "cpu");
  }
  function achievementMenu() {
    return /achievement/.test(`${state()} ${mode()}`);
  }
  function hatMenu() {
    return /hat/.test(`${state()} ${mode()}`) && /menu|select|custom/.test(`${state()} ${mode()}`);
  }
  function soloSelect() {
    const joined = `${state()} ${mode()}`;
    return /solo|single/.test(joined) && /select|menu|level/.test(joined);
  }
  function versusSelect() {
    const joined = `${state()} ${mode()}`;
    return /versus|pvp/.test(joined) && /select|menu|setup/.test(joined);
  }

  function button(id, label, title) {
    const el = document.createElement("button");
    el.id = id;
    el.className = "rr170-button";
    el.type = "button";
    el.textContent = label;
    el.title = title || "";
    el.setAttribute("aria-label", title || label);
    return el;
  }

  function tooltipFor(el, text) {
    const tip = document.createElement("div");
    tip.className = "rr170-tooltip";
    tip.textContent = text;
    tip.hidden = true;
    root.appendChild(tip);
    const show = () => {
      const a = el.getBoundingClientRect();
      const b = gameFrame().getBoundingClientRect();
      tip.style.left = `${((a.left+a.width/2-b.left)/b.width)*100}%`;
      tip.style.top = `${Math.max(2, ((a.top-b.top)/b.height)*100 - 5)}%`;
      tip.hidden = false;
    };
    const hide = () => { tip.hidden = true; };
    el.addEventListener("pointerenter", show);
    el.addEventListener("pointerleave", hide);
    el.addEventListener("focus", show);
    el.addEventListener("blur", hide);
    return tip;
  }

  function activateOnRelease(el, action) {
    const active = new Set();
    el.addEventListener("pointerdown", event => {
      event.preventDefault();
      active.add(event.pointerId);
      el.setPointerCapture?.(event.pointerId);
      el.classList.add("rr170-selected");
    });
    const finish = event => {
      if (!active.has(event.pointerId)) return;
      event.preventDefault();
      active.delete(event.pointerId);
      el.classList.remove("rr170-selected");
      action(event);
    };
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", event => {
      active.delete(event.pointerId);
      el.classList.remove("rr170-selected");
    });
    el.addEventListener("click", event => {
      if (event.pointerType) return;
      action(event);
    });
  }

  function installAccountModal() {
    const panel = qs("#cloud-account-panel");
    if (!panel) return;
    const sync = () => document.body.classList.toggle("rr-account-modal-open", !panel.hidden);
    new MutationObserver(sync).observe(panel, {attributes:true, attributeFilter:["hidden"]});
    sync();

    // A centered close button makes the modal self-contained.
    if (!panel.querySelector(".rr170-account-close")) {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "rr170-account-close";
      close.textContent = "CLOSE";
      close.style.cssText = "width:100%;margin-top:10px;padding:8px;border:3px solid #26363d;background:#fff;font:700 14px 'Courier New',monospace";
      close.addEventListener("click", () => { panel.hidden = true; sync(); });
      panel.appendChild(close);
    }

    // Guest accounts can convert the in-memory save at any time.
    const guestButton = qs("#cloud-account-button");
    const isGuest = () => /guest/i.test(guestButton?.textContent || "") ||
      /guest/i.test(qs("#cloud-account-name")?.textContent || "");
    const ensureConvert = () => {
      let convert = panel.querySelector("#rr170-create-account-keep-save");
      if (isGuest()) {
        if (!convert) {
          convert = document.createElement("button");
          convert.id = "rr170-create-account-keep-save";
          convert.type = "button";
          convert.textContent = "CREATE ACCOUNT & KEEP SAVE";
          convert.style.cssText = "width:100%;margin-top:8px;padding:9px;border:3px solid #26363d;background:#b8f5dc;font:700 13px 'Courier New',monospace";
          convert.addEventListener("click", () => {
            try {
              const save = {};
              for (let i=0;i<localStorage.length;i++) {
                const key = localStorage.key(i);
                if (/^(ribbitRace|oneButtonFrog)/.test(key)) save[key] = localStorage.getItem(key);
              }
              sessionStorage.setItem("ribbitRacePendingGuestMigrationV1", JSON.stringify(save));
            } catch (_) {}
            panel.hidden = true;
            document.body.classList.remove("rr-account-modal-open");
            qs("#cloud-gate")?.removeAttribute("hidden");
            qs("#cloud-show-create")?.click();
          });
          panel.insertBefore(convert, panel.firstChild);
        }
      } else convert?.remove();
    };
    new MutationObserver(ensureConvert).observe(panel, {subtree:true, childList:true, characterData:true, attributes:true});
    ensureConvert();

    // Retain guest progress if they attempt to close before creating an account.
    window.addEventListener("beforeunload", event => {
      if (!isGuest()) return;
      try {
        const save = {};
        for (let i=0;i<localStorage.length;i++) {
          const key = localStorage.key(i);
          if (/^(ribbitRace|oneButtonFrog)/.test(key)) save[key] = localStorage.getItem(key);
        }
        sessionStorage.setItem("ribbitRacePendingGuestMigrationV1", JSON.stringify(save));
      } catch (_) {}
      event.preventDefault();
      event.returnValue = "";
    });
  }

  function installOverlayControls() {
    gameFrame()?.appendChild(root);

    const pause = button("rr170-pause", "Ⅱ", "PAUSE");
    pause.hidden = true;
    pause.addEventListener("click", () => hooks()?.pause?.());
    root.appendChild(pause);
    tooltipFor(pause, "PAUSE");

    const medal = button("rr170-achievement-leaderboard", "🏅", "OPEN LEADERBOARD");
    medal.hidden = true;
    activateOnRelease(medal, () => qs("#cloud-leaderboard")?.click());
    root.appendChild(medal);
    tooltipFor(medal, "OPEN LEADERBOARD");

    const hatHover = button("rr170-hat-hover-target", "", "STYLE LOCKED");
    hatHover.hidden = true;
    root.appendChild(hatHover);
    tooltipFor(hatHover, "STYLE LOCKED — COMPLETE THIS HAT'S CHALLENGE");

    const soloTutorial = button("rr170-solo-tutorial", "📖", "SINGLE PLAYER TUTORIAL");
    soloTutorial.hidden = true;
    activateOnRelease(soloTutorial, () => Tutorial.open("solo"));
    root.appendChild(soloTutorial);
    tooltipFor(soloTutorial, "SINGLE PLAYER TUTORIAL");

    const pvpTutorial = button("rr170-pvp-tutorial", "📖", "VERSUS TUTORIAL");
    pvpTutorial.hidden = true;
    activateOnRelease(pvpTutorial, () => Tutorial.open("pvp"));
    root.appendChild(pvpTutorial);
    tooltipFor(pvpTutorial, "VERSUS TUTORIAL");

    // Entire bottom halves are live touch zones in two-player mobile Versus.
    const left = document.createElement("div");
    left.id = "rr170-touch-left";
    left.hidden = true;
    const right = document.createElement("div");
    right.id = "rr170-touch-right";
    right.hidden = true;
    root.append(left,right);

    const pointerOwners = new Map();
    const wireZone = (zone,index) => {
      zone.addEventListener("pointerdown", event => {
        if (!mobile() || !playing()) return;
        event.preventDefault();
        pointerOwners.set(event.pointerId,index);
        zone.setPointerCapture?.(event.pointerId);
        hooks()?.charge?.(index,true);
      });
      const release = event => {
        const owner = pointerOwners.get(event.pointerId);
        if (owner === undefined) return;
        event.preventDefault();
        pointerOwners.delete(event.pointerId);
        hooks()?.charge?.(owner,false);
      };
      zone.addEventListener("pointerup", release);
      zone.addEventListener("pointercancel", release);
      zone.addEventListener("lostpointercapture", release);
    };
    wireZone(left,0); wireZone(right,1);

    // Mobile vs CPU and Solo: holding almost anywhere in the game world charges.
    const canvas = gameCanvas();
    const screenOwners = new Set();
    canvas?.addEventListener("pointerdown", event => {
      if (!mobile() || !playing() || humanLocalVersus()) return;
      // Let explicit UI controls win.
      const r = canvas.getBoundingClientRect();
      const y = (event.clientY-r.top)/r.height;
      if (y < .84 && !versus()) {
        event.preventDefault();
        screenOwners.add(event.pointerId);
        canvas.setPointerCapture?.(event.pointerId);
        hooks()?.charge?.(0,true);
      } else if (versus() && y < .84) {
        event.preventDefault();
        screenOwners.add(event.pointerId);
        canvas.setPointerCapture?.(event.pointerId);
        hooks()?.charge?.(0,true);
      }
    }, {passive:false});
    const screenRelease = event => {
      if (!screenOwners.has(event.pointerId)) return;
      event.preventDefault();
      screenOwners.delete(event.pointerId);
      hooks()?.charge?.(0,false);
    };
    canvas?.addEventListener("pointerup", screenRelease, {passive:false});
    canvas?.addEventListener("pointercancel", screenRelease, {passive:false});

    // Prevent browser callouts/context menus.
    ["contextmenu","selectstart","dragstart","gesturestart","gesturechange","gestureend"].forEach(type => {
      canvas?.addEventListener(type, event => event.preventDefault(), {passive:false});
    });

    function update() {
      const isPlay = playing();
      const isVs = versus();
      pause.hidden = !(isPlay && isVs);
      pause.classList.toggle("rr170-versus", isVs);
      medal.hidden = !achievementMenu();
      hatHover.hidden = !hatMenu();
      soloTutorial.hidden = !soloSelect();
      pvpTutorial.hidden = !versusSelect();
      const two = mobile() && isPlay && humanLocalVersus();
      left.hidden = !two; right.hidden = !two;
      document.body.classList.toggle("rr-mobile-mode", mobile());
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const Tutorial = (() => {
    const soloSteps = [
      ["WELCOME TO RIBBIT RACE", "Terms appear at the bottom. Match the English prompt to the Spanish word carried by a fly."],
      ["CHARGE YOUR JUMP", "Hold the jump control until the meter is full, then release. Reach the highlighted fly."],
      ["CATCHING FLIES", "You automatically catch a fly when your frog or tongue is close enough. Catch the fly at the edge of your jump range."],
      ["WRONG ANSWERS ARE SAFE", "Catch the wrong fly. Your frog spits it back out so you can try again."],
      ["TURN WITH WALLS", "Your frog only changes direction by hitting a wall. Jump around the wall to reach the fly behind you."],
      ["REBOUND CATCH", "Charge into the wall and rebound to catch the fly behind your frog in the same jump."],
      ["QUICK PLATFORM DROP", "While standing on a platform, tap the jump control quickly to drop through and catch the fly below."],
      ["BUFFER A PLATFORM DROP", "Charge a jump, then tap just before landing on a platform to carry the drop through it."],
      ["LINE UP TWO FLIES", "A good jump arc can catch more than one answer. Catch the two highlighted flies back-to-back."],
      ["CATCH ALL FIVE", "Finish a normal five-fly round. You are ready to race!"]
    ];
    const pvpSteps = [
      ["WELCOME TO VERSUS", "Versus uses the same charged jumps and matching-fly rules as Single Player."],
      ["BONK FROM ABOVE", "Land on the opponent while falling. They drop to the ground and are stunned."],
      ["SKY BONK", "The higher the bonk begins, the longer the opponent remains stunned."],
      ["WAIT FOR RECOVERY", "A stunned frog cannot be bonked again. Bonk once, wait for recovery, then bonk again."],
      ["CHARGE CHANGES BOUNCE", "Bonk just before the opponent releases a fully charged jump. Their stored force changes your bounce."],
      ["PLATFORM BLOCK", "Stand on a platform in the opponent's jump path so they collide underneath and become bonked."],
      ["LOW HOPS", "Use short hops near the ground to travel beneath a frog blocking a platform."],
      ["HORIZONTAL REBOUND", "Side-to-side collisions turn both frogs around instead of bonking."],
      ["OFFENSIVE REBOUND", "Rebound from the opponent to reverse direction and catch the fly behind you."],
      ["DEFENSIVE REBOUND", "Intercept the opponent horizontally to prevent their catch."],
      ["REBOUND STEAL", "Rebound, deny the opponent's catch, and take the fly yourself."]
    ];

    let shell, canvas, ctx, title, copy, progress, primary, back, close;
    let kind = "solo", index = 0, held = false, holdAt = 0, last = 0;
    let passed=false, wallTouched=false, lastHoldDuration=0, platformDrop=false, bufferedDrop=false, bonkCount=0, reboundCount=0, rivalStun=0;
    const sim = {frog:{x:80,y:190,vx:38,vy:0,dir:1,grounded:true}, rival:{x:350,y:190,vx:-28,vy:0,dir:-1,grounded:true}, flies:[], caught:0, wrong:false};

    function create() {
      shell = document.createElement("section");
      shell.id = "rr170-tutorial-shell";
      shell.hidden = true;
      shell.innerHTML = `
        <div class="rr170-tutorial-card">
          <h2 class="rr170-tutorial-title"></h2>
          <div class="rr170-tutorial-canvas-wrap"><canvas id="rr170-tutorial-canvas" width="960" height="540"></canvas></div>
          <div class="rr170-tutorial-copy"></div>
          <div class="rr170-tutorial-actions">
            <button type="button" data-action="back">BACK</button>
            <button type="button" class="primary" data-action="primary">TRY IT / NEXT</button>
            <button type="button" data-action="close">EXIT TUTORIAL</button>
          </div>
        </div>`;
      document.body.appendChild(shell);
      canvas = qs("#rr170-tutorial-canvas", shell);
      ctx = canvas.getContext("2d");
      title = qs(".rr170-tutorial-title", shell);
      copy = qs(".rr170-tutorial-copy", shell);
      primary = qs('[data-action="primary"]', shell);
      back = qs('[data-action="back"]', shell);
      close = qs('[data-action="close"]', shell);
      primary.addEventListener("click", next);
      back.addEventListener("click", prev);
      close.addEventListener("click", exit);
      const start = event => {
        event.preventDefault(); held=true; holdAt=performance.now();
        canvas.setPointerCapture?.(event.pointerId);
      };
      const end = event => {
        if (!held) return; event.preventDefault();
        held=false;
        const duration=Math.min(1.25,(performance.now()-holdAt)/1000);
        lastHoldDuration=duration;
        if (sim.frog.grounded) {
          sim.frog.vy=-150-120*duration; sim.frog.vx=sim.frog.dir*(55+60*duration); sim.frog.grounded=false;
        } else if (duration < .18 && sim.frog.y < 330) {
          sim.frog.vy=Math.max(80,sim.frog.vy); // tutorial platform drop
          platformDrop=true;
          if(sim.frog.vx!==0)bufferedDrop=true;
        }
      };
      canvas.addEventListener("pointerdown",start,{passive:false});
      canvas.addEventListener("pointerup",end,{passive:false});
      canvas.addEventListener("pointercancel",end,{passive:false});
      canvas.addEventListener("contextmenu",e=>e.preventDefault());
      requestAnimationFrame(loop);
    }

    function resetScenario() {
      sim.frog={x:80,y:390,vx:0,vy:0,dir:1,grounded:true};
      sim.rival={x:540,y:390,vx:0,vy:0,dir:-1,grounded:true};
      sim.caught=0; sim.wrong=false; passed=index===0; wallTouched=false; lastHoldDuration=0; platformDrop=false; bufferedDrop=false; bonkCount=0; reboundCount=0; rivalStun=0;
      const n = kind==="solo" ? index : Math.max(0,index-1);
      if (kind==="solo") {
        if (n===1) sim.flies=[{x:340,y:245,word:"CORRECT",correct:true}];
        else if (n===2) sim.flies=[{x:370,y:240,word:"MATCH",correct:true}];
        else if (n===3) sim.flies=[{x:300,y:270,word:"WRONG",correct:false},{x:420,y:230,word:"RIGHT",correct:true}];
        else if (n===4||n===5) {sim.frog.dir=1;sim.flies=[{x:35,y:260,word:"BEHIND",correct:true}];}
        else if (n===6) {sim.frog.y=240;sim.flies=[{x:180,y:380,word:"BELOW",correct:true}];}
        else if (n===7) {sim.flies=[{x:330,y:370,word:"BUFFER",correct:true}];}
        else if (n===8) sim.flies=[{x:300,y:260,word:"ONE",correct:true},{x:430,y:220,word:"TWO",correct:true}];
        else sim.flies=[0,1,2,3,4].map(i=>({x:210+i*105,y:230+(i%2)*70,word:String(i+1),correct:true}));
      } else {
        sim.flies=[{x:720,y:230,word:"MATCH",correct:true}];
      }
    }

    function renderStep() {
      const steps=kind==="solo"?soloSteps:pvpSteps;
      const [heading,body]=steps[index];
      title.textContent=`${kind==="solo"?"SINGLE PLAYER":"VERSUS"} TUTORIAL • ${index+1}/${steps.length}`;
      copy.innerHTML=`<strong>${heading}</strong><br>${body}<br><small>Hold anywhere in the practice window to charge; release to jump.</small><div data-tutorial-status style="margin-top:6px;color:#a51f1c">COMPLETE THE TASK TO CONTINUE</div>`;
      back.disabled=index===0;
      primary.textContent=index===steps.length-1?"FINISH":"TRY IT / NEXT";
      primary.disabled=!passed;
      resetScenario();
    }
    function open(nextKind="solo") {
      if (!shell) create();
      kind=nextKind; index=0; shell.hidden=false; renderStep();
    }
    function exit() {
      shell.hidden=true;
      localStorage.setItem(kind==="solo"?"ribbitRaceTutorialSoloSeenV1":"ribbitRaceTutorialPvpSeenV1","true");
    }
    function next() {
      const steps=kind==="solo"?soloSteps:pvpSteps;
      if(!passed){
        const status=shell.querySelector("[data-tutorial-status]");
        if(status)status.textContent="NOT YET — TRY THE TASK AGAIN";
        resetScenario();
        return;
      }
      if (index>=steps.length-1) return exit();
      index++; renderStep();
    }
    function prev() { if(index>0){index--;renderStep();} }

    function drawFrog(p,color) {
      ctx.save(); ctx.translate(p.x,p.y);
      ctx.fillStyle=color; ctx.strokeStyle="#26363d";ctx.lineWidth=5;
      ctx.fillRect(-28,-18,56,28);ctx.strokeRect(-28,-18,56,28);
      ctx.fillStyle="#fff";ctx.fillRect(p.dir>0?10:-22,-30,16,16);
      ctx.strokeRect(p.dir>0?10:-22,-30,16,16);
      ctx.fillStyle="#26363d";ctx.fillRect(p.dir>0?20:-20,-27,5,7);
      ctx.restore();
    }
    function drawFly(f) {
      ctx.fillStyle="#f7d242";ctx.fillRect(f.x-8,f.y-9,16,18);
      ctx.fillStyle="#fff";ctx.fillRect(f.x-18,f.y-5,10,8);ctx.fillRect(f.x+8,f.y-5,10,8);
      ctx.strokeStyle="#26363d";ctx.lineWidth=3;ctx.strokeRect(f.x-8,f.y-9,16,18);
      const w=Math.max(70,f.word.length*15);
      ctx.fillStyle="#fff";ctx.fillRect(f.x-w/2,f.y-50,w,30);
      ctx.strokeRect(f.x-w/2,f.y-50,w,30);
      ctx.fillStyle="#26363d";ctx.font="bold 18px monospace";ctx.textAlign="center";ctx.fillText(f.word,f.x,f.y-29);
    }

    function loop(now) {
      requestAnimationFrame(loop);
      if (!shell || shell.hidden) return;
      const dt=Math.min(.025,(now-last)/1000||0);last=now;
      const p=sim.frog;
      if (!p.grounded) {
        p.vy+=390*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
        if(p.x<28){p.x=28;p.vx=Math.abs(p.vx);p.dir=1}
        if(p.x>932){p.x=932;p.vx=-Math.abs(p.vx);p.dir=-1}
        if(p.y>=390){p.y=390;p.vy=0;p.vx*=.25;p.grounded=true}
      }
      for (const f of sim.flies) {
        if(f.caught)continue;
        if(Math.hypot(p.x-f.x,p.y-f.y)<48){f.caught=true;sim.caught++;if(!f.correct)sim.wrong=true;}
      }
      if(p.x<=29||p.x>=931)wallTouched=true;
      if(kind==="pvp"){
        const r=sim.rival;
        rivalStun=Math.max(0,rivalStun-dt);
        const dx=p.x-r.x,dy=p.y-r.y;
        if(Math.abs(dx)<52&&Math.abs(dy)<42){
          if(p.y<r.y-8&&p.vy>0&&rivalStun<=0){
            rivalStun=.8+Math.max(0,(r.y-p.y)/180);bonkCount++;r.y=390;r.vy=0;p.vy=-65;
          }else if(Math.abs(dx)>=Math.abs(dy)){
            p.vx=-p.vx;p.dir*=-1;r.vx=-r.vx;r.dir*=-1;reboundCount++;
          }
        }
      }
      if(kind==="solo"){
        if(index===0)passed=true;
        if(index===1)passed=lastHoldDuration>=.9;
        if(index===2)passed=sim.caught>=1;
        if(index===3)passed=sim.wrong;
        if(index===4)passed=wallTouched&&sim.caught>=1;
        if(index===5)passed=wallTouched&&sim.caught>=1;
        if(index===6)passed=platformDrop;
        if(index===7)passed=bufferedDrop;
        if(index===8)passed=sim.caught>=2;
        if(index===9)passed=sim.caught>=5;
      }else{
        if(index===0)passed=true;
        if([1,2,3,4,5].includes(index))passed=bonkCount>0;
        if(index===6)passed=lastHoldDuration<.45&&!p.grounded;
        if([7,8,9,10].includes(index))passed=reboundCount>0;
      }
      const status=shell.querySelector("[data-tutorial-status]");
      if(status){
        status.textContent=passed?"TASK COMPLETE — CONTINUE":"COMPLETE THE TASK TO CONTINUE";
        status.style.color=passed?"#1d6d3a":"#a51f1c";
      }
      primary.disabled=!passed;
      ctx.clearRect(0,0,960,540);
      const grad=ctx.createLinearGradient(0,0,0,540);grad.addColorStop(0,"#78cbf4");grad.addColorStop(1,"#dff4ad");
      ctx.fillStyle=grad;ctx.fillRect(0,0,960,540);
      ctx.fillStyle="#79b85b";ctx.fillRect(0,420,960,120);
      ctx.fillStyle="#26363d";ctx.fillRect(0,452,960,8);
      ctx.fillStyle="#8b663f";ctx.fillRect(200,305,220,20);ctx.fillRect(580,280,210,20);
      ctx.fillStyle="#9ee261";ctx.fillRect(200,295,220,10);ctx.fillRect(580,270,210,10);
      sim.flies.forEach(f=>{if(!f.caught)drawFly(f)});
      if(kind==="pvp")drawFrog(sim.rival,"#cf5f84");
      drawFrog(p,"#17a8c2");
      if(held){
        const charge=Math.min(1.25,(performance.now()-holdAt)/1000);
        ctx.fillStyle="rgba(255,255,255,.92)";ctx.fillRect(330,485,300,30);
        ctx.fillStyle="#17a8c2";ctx.fillRect(335,490,290*(charge/1.25),20);
        ctx.strokeStyle="#26363d";ctx.lineWidth=4;ctx.strokeRect(330,485,300,30);
      }
      if(sim.wrong){ctx.fillStyle="#a51f1c";ctx.font="bold 24px monospace";ctx.textAlign="center";ctx.fillText("WRONG FLY SPIT BACK — TRY AGAIN",480,40);}
    }
    return {open};
  })();

  function installSpectatorPresentation() {
    let lastWinner = "";
    let overlay = null;
    function frame() {
      const h=hooks(), g=h?.game, spectator=h?.spectator;
      const onlineRound = /online|quickplay|spectat/.test(`${h?.state||""} ${h?.mode||""}`.toLowerCase());
      if (spectator || onlineRound) {
        // Remove the old delayed-replay footer if it is a DOM element.
        document.querySelectorAll("*").forEach(el => {
          if (el.children.length===0 && /DELAYED VIEW|LEFT SHIFT|RIGHT SHIFT/i.test(el.textContent||"")) {
            if (/DELAYED VIEW/.test(el.textContent||"")) el.style.display="none";
          }
        });
        const winnerIndex=Number(g?.pvpRoundWinnerIndex??g?.roundWinnerIndex??g?.winnerIndex??-1);
        const winner=String(g?.roundWinnerName || g?.winnerName || (winnerIndex>=0?h?.playerName?.(winnerIndex):""));
        const signature=`${g?.pvpRoundIndex||g?.round||""}:${winner}:${g?.pvpRoundWinnerIndex??""}`;
        if(winner && signature!==lastWinner){
          lastWinner=signature;
          overlay?.remove();
          overlay=document.createElement("div");
          overlay.className="rr170-round-overlay";
          const scores=g?.pvpRoundWins || g?.roundWins || [];
          overlay.innerHTML=`<strong>${winner.toUpperCase()} WINS ROUND</strong><br><span>${Number(scores[0]||0)} 👑 — 👑 ${Number(scores[1]||0)}</span>`;
          root.appendChild(overlay);
          setTimeout(()=>overlay?.remove(),3200);
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }


  function mainMenuActive() {
    const joined = `${state()} ${mode()}`;
    return /menu|home|main/.test(joined) &&
      !/online|versus|pvp|single|solo|level|achievement|custom|tag|leader/.test(joined);
  }

  function installMainMenuIcons() {
    const account = button("rr170-account-icon", "", "ACCOUNT • SAVES • RECORDS");
    account.innerHTML = `<span><span class="rr170-avatar-head"></span><span class="rr170-avatar-body"></span></span>`;
    account.hidden = true;
    activateOnRelease(account, () => {
      const panel = qs("#cloud-account-panel");
      if (panel) {
        panel.hidden = false;
        document.body.classList.add("rr-account-modal-open");
      }
    });
    root.appendChild(account);
    tooltipFor(account, "ACCOUNT • SAVES • RECORDS");

    const device = button("rr170-device-icon", "", "SWITCH CONTROL MODE");
    device.innerHTML = `<span class="rr170-device-symbol">▣</span>`;
    device.hidden = true;
    activateOnRelease(device, () => {
      const enabling = !mobile();
      const accepted = window.confirm(enabling
        ? "TURN ON MOBILE MODE?\n\nUse touch controls and mobile instructions."
        : "TURN ON COMPUTER MODE?\n\nUse keyboard and mouse controls.");
      if (!accepted) return;
      try { localStorage.setItem("ribbitRaceMobileModeV1", enabling ? "true" : "false"); } catch (_) {}
      try {
        if (typeof window.RibbitRaceSetMobileMode === "function") window.RibbitRaceSetMobileMode(enabling);
        else window.dispatchEvent(new CustomEvent("ribbit:mobile-mode", {detail:{enabled:enabling}}));
      } catch (_) {}
      document.body.classList.toggle("rr-mobile-mode", enabling);
      if (enabling) {
        const mobileHelp = qs("#cloud-mobile-help") || qs('[id*="mobile"][id*="help"]');
        mobileHelp?.removeAttribute("hidden");
      }
      setTimeout(() => location.reload(), 80);
    });
    root.appendChild(device);
    const deviceTip = tooltipFor(device, "SWITCH TO MOBILE MODE");

    function update() {
      const show = mainMenuActive();
      account.hidden = !show;
      device.hidden = !show;
      deviceTip.textContent = mobile() ? "SWITCH TO COMPUTER MODE" : "SWITCH TO MOBILE MODE";
      device.querySelector(".rr170-device-symbol").textContent = mobile() ? "▰" : "▣";
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function firstBootTutorial() {
    const gate=qs("#cloud-gate");
    const check=()=> {
      if(!gate?.hidden){setTimeout(check,800);return;}
      if(localStorage.getItem("ribbitRaceTutorialSoloSeenV1")!=="true"){
        setTimeout(()=>Tutorial.open("solo"),500);
      }
    };
    setTimeout(check,1200);
  }

  ready(() => {
    installAccountModal();
    installOverlayControls();
    installMainMenuIcons();
    installSpectatorPresentation();
    firstBootTutorial();
  });
})();
