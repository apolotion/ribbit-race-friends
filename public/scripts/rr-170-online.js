
(() => {
  "use strict";
  const $ = (s,r=document)=>r.querySelector(s);
  const root = () => $("#rr170-overlay-root");
  const hooks = () => window.RibbitRaceV170 || null;
  const online = () => {
    const h=hooks();
    return h?.game?.online || window.RibbitRaceOnlineSession || null;
  };
  const safe = (v,n=40)=>String(v??"").replace(/[<>\x00-\x1f]/g,"").trim().slice(0,n);
  let lastHeartbeat=0, lastRoom="", picker, spectatorButton, overlayCanvas, octx;
  let currentMatchAppearance=null;
  let audioContext=null, audioUnlocked=false, lastCountdown=null, previousGrounded=[true,true];
  function unlockAudio(){
    try{
      audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();
      audioContext.resume?.();
      audioUnlocked=true;
    }catch(_){}
  }
  ["pointerdown","touchend","click","keydown"].forEach(type=>window.addEventListener(type,unlockAudio,{once:false,passive:true}));
  function tone(frequency,duration=.07,volume=.025){
    if(!audioUnlocked||!audioContext)return;
    try{
      const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
      oscillator.type="square";oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(volume,audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();oscillator.stop(audioContext.currentTime+duration);
    }catch(_){}
  }

  async function api(path,payload={}) {
    const response=await fetch(`/api/${path}`,{
      method:"POST",credentials:"same-origin",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(payload)
    });
    const data=await response.json().catch(()=>({ok:false}));
    if(!response.ok||data?.ok===false)throw new Error(data?.message||`Request failed (${response.status})`);
    return data;
  }

  function currentRoomData() {
    const h=hooks(), g=h?.game, o=online();
    const roomCode=safe(o?.roomCode||g?.roomCode||g?.onlineRoomCode,16).toUpperCase();
    const ps=h?.players||[];
    if(!roomCode)return null;
    return {
      roomCode,
      quickplay:!!(o?.quickplay||g?.quickplay),
      phase:safe(o?.phase||g?.state||"playing",24),
      matchId:safe(o?.matchId||g?.matchId,100),
      hostName:safe(o?.hostName||ps[0]?.name||ps[0]?.displayName||"PLAYER 1",28),
      guestName:safe(o?.guestName||ps[1]?.name||ps[1]?.displayName||"PLAYER 2",28),
      hostAppearance:o?.hostAppearance||ps[0]?.appearance||null,
      guestAppearance:o?.guestAppearance||ps[1]?.appearance||null
    };
  }

  async function heartbeat() {
    const data=currentRoomData(), now=Date.now();
    if(!data)return;
    if(now-lastHeartbeat<5000&&lastRoom===data.roomCode)return;
    lastHeartbeat=now;lastRoom=data.roomCode;
    try{await api("apiLiveMatchHeartbeat",data);}catch(_){}
  }
  setInterval(heartbeat,2500);

  function makePicker(){
    picker=document.createElement("section");
    picker.id="rr170-spectator-picker";
    picker.hidden=true;
    picker.innerHTML=`<div class="rr170-picker-card">
      <h2 style="margin:0 0 12px;text-align:center;color:#07516a;font:700 34px 'Courier New',monospace">LIVE MATCHES</h2>
      <p style="text-align:center;color:#59676d;font:700 14px 'Courier New',monospace">PRIVATE AND QUICKPLAY MATCHES CURRENTLY AVAILABLE</p>
      <div data-list></div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:12px">
        <button data-refresh style="padding:10px;border:4px solid #26363d;background:#b8f5dc;font:700 15px 'Courier New',monospace">REFRESH</button>
        <button data-close style="padding:10px;border:4px solid #26363d;background:#fff;font:700 15px 'Courier New',monospace">BACK</button>
      </div>
    </div>`;
    document.body.appendChild(picker);
    picker.querySelector("[data-close]").onclick=()=>picker.hidden=true;
    picker.querySelector("[data-refresh]").onclick=refreshPicker;
  }
  async function refreshPicker(){
    if(!picker)makePicker();
    picker.hidden=false;
    const list=picker.querySelector("[data-list]");
    list.innerHTML=`<p style="text-align:center">LOADING...</p>`;
    try{
      const result=await api("apiListLiveMatches",{});
      const matches=Array.isArray(result.matches)?result.matches:[];
      if(!matches.length){list.innerHTML=`<p style="text-align:center">NO LIVE MATCHES YET</p>`;return;}
      list.innerHTML="";
      for(const match of matches){
        const row=document.createElement("div");
        row.className="rr170-match-row";
        const host=safe(match.hostName,28)||"PLAYER 1",guest=safe(match.guestName,28)||"PLAYER 2";
        row.innerHTML=`<div><strong>${host} VS ${guest}</strong><br><small>${match.quickplay?"QUICKPLAY":"PRIVATE"} • ${safe(match.phase,20)}</small></div><button type="button" style="padding:8px;border:3px solid #26363d;background:#0f9fbb;color:#fff;font:700 14px 'Courier New',monospace">WATCH</button>`;
        row.querySelector("button").onclick=()=>spectate(match);
        list.appendChild(row);
      }
    }catch(error){list.innerHTML=`<p style="color:#a51f1c;text-align:center">${safe(error.message,120)}</p>`;}
  }

  async function spectate(match){
    currentMatchAppearance={host:match.hostAppearance,guest:match.guestAppearance};
    picker.hidden=true;
    const roomCode=match.roomCode;
    try{
      if(typeof window.RibbitRaceSpectateRoom==="function")return window.RibbitRaceSpectateRoom(roomCode);
      if(window.RibbitCloud?.spectateOnlineRoom)return window.RibbitCloud.spectateOnlineRoom({roomCode});
      if(window.RibbitCloud?.spectateRoom)return window.RibbitCloud.spectateRoom({roomCode});
      if(window.RibbitRaceOnline?.spectate)return window.RibbitRaceOnline.spectate(roomCode);
      // Last fallback: place code into a visible room input and activate existing Spectate.
      const input=document.querySelector('input[id*="room" i],input[name*="room" i]');
      if(input){input.value=roomCode;input.dispatchEvent(new Event("input",{bubbles:true}));}
      window.dispatchEvent(new CustomEvent("ribbit:spectate-room",{detail:{roomCode,match}}));
    }catch(error){alert(`Could not spectate ${roomCode}: ${error.message}`);}
  }

  function onlineMenuActive(){
    const s=`${hooks()?.state||""} ${hooks()?.mode||""}`.toLowerCase();
    return /online/.test(s)&&/menu|lobby|select/.test(s)&&!/playing|spectat|quickplay.?search/.test(s);
  }

  function gamePoint(event){
    const canvas=document.querySelector("#game");
    if(!canvas)return null;
    const rect=canvas.getBoundingClientRect(),scale=Math.min(rect.width/480,rect.height/270);
    const usedW=480*scale,usedH=270*scale;
    const left=rect.left+(rect.width-usedW)/2,top=rect.top+(rect.height-usedH)/2;
    return {x:(event.clientX-left)/scale,y:(event.clientY-top)/scale};
  }
  function installCanvasSpectateIntercept(){
    const canvas=document.querySelector("#game");
    if(!canvas)return;
    const pending=new Set();
    canvas.addEventListener("pointerdown",event=>{
      if(!onlineMenuActive())return;
      const p=gamePoint(event);
      // New online layout: QUICKPLAY | SPECTATE is the first row.
      if(p&&p.x>=245&&p.x<=446&&p.y>=92&&p.y<=142){
        event.preventDefault();event.stopImmediatePropagation();pending.add(event.pointerId);
        canvas.setPointerCapture?.(event.pointerId);
      }
    },true);
    canvas.addEventListener("pointerup",event=>{
      if(!pending.has(event.pointerId))return;
      event.preventDefault();event.stopImmediatePropagation();pending.delete(event.pointerId);refreshPicker();
    },true);
    canvas.addEventListener("pointercancel",event=>pending.delete(event.pointerId),true);
  }

  function installSpectateButton(){
    spectatorButton=document.createElement("button");
    spectatorButton.className="rr170-button";
    spectatorButton.type="button";
    spectatorButton.textContent="◉";
    spectatorButton.title="CHOOSE A LIVE MATCH TO SPECTATE";
    spectatorButton.style.cssText+=";right:10.6%;top:43%;width:5.8%;aspect-ratio:1";
    spectatorButton.hidden=true;
    spectatorButton.onclick=refreshPicker;
    root()?.appendChild(spectatorButton);
  }

  function installOverlayCanvas(){
    const frame=document.querySelector("#game-frame"),canvas=document.querySelector("#game");
    if(!frame||!canvas)return;
    overlayCanvas=document.createElement("canvas");
    overlayCanvas.width=480;overlayCanvas.height=270;
    overlayCanvas.style.cssText="position:absolute;inset:0;width:100%;height:100%;z-index:86;pointer-events:none;image-rendering:pixelated";
    frame.appendChild(overlayCanvas);octx=overlayCanvas.getContext("2d");
  }

  function drawArc(player,color){
    if(!player||!Number.isFinite(+player.x)||!Number.isFinite(+player.y))return;
    const charge=Math.max(0,Math.min(1,Number(player.charge||player.jumpCharge||0)));
    if(charge<=.03&&!player.charging&&!player.held)return;
    let x=+player.x,y=+player.y;
    let vx=Number(player.vx||0),vy=Number(player.vy||0);
    if(Math.abs(vx)<3)vx=(Number(player.dir||1)<0?-1:1)*(35+65*charge);
    if(Math.abs(vy)<3)vy=-(80+100*charge);
    octx.save();octx.strokeStyle=color;octx.lineWidth=1.25;octx.setLineDash([3,3]);octx.globalAlpha=.82;octx.beginPath();octx.moveTo(x,y);
    for(let i=1;i<=22;i++){const t=i*.035;const px=x+vx*t,py=y+vy*t+190*t*t;octx.lineTo(px,py);}
    octx.stroke();octx.restore();
  }

  function drawSpectatorOverlay(){
    if(!octx)return;
    octx.clearRect(0,0,480,270);
    const h=hooks(),isOnline=/online|quickplay|spectat/.test(`${h?.state||""} ${h?.mode||""}`.toLowerCase());
    if(!isOnline)return;
    const players=(h.spectator?h.smoothedSpectatorPlayers:null)||h.players||[];
    if(h.spectator){
      drawArc(players[0],"#1dc5da");drawArc(players[1],"#ef688a");
      // Cover the obsolete replay/delayed-view footer and label charge boxes by names.
      octx.fillStyle="#26363d";octx.fillRect(0,237,480,12);
      octx.fillStyle="#f4d6df";octx.fillRect(14,250,126,16);octx.fillRect(340,250,126,16);
      octx.strokeStyle="#26363d";octx.lineWidth=2;octx.strokeRect(14,250,126,16);octx.strokeRect(340,250,126,16);
      octx.fillStyle="#26363d";octx.font="bold 8px monospace";octx.textAlign="center";
      octx.fillText(h.playerName?.(0)||"PLAYER 1",77,261);
      octx.fillText(h.playerName?.(1)||"PLAYER 2",403,261);
    } else {
      // Replace the generic OPPONENT copy with the actual online display name.
      octx.fillStyle="rgba(244,214,223,.96)";octx.fillRect(350,250,118,16);
      octx.strokeStyle="#26363d";octx.lineWidth=2;octx.strokeRect(350,250,118,16);
      octx.fillStyle="#26363d";octx.font="bold 8px monospace";octx.textAlign="center";
      octx.fillText(h.opponentName||"CPU",409,261);
    }

    // Mobile Safari may suspend audio between rounds. Re-arm it and provide
    // remote jump/countdown cues when the established audio mixer is unavailable.
    const g=h.game||{},count=Number(g.countdownValue??g.countdown??g.startCountdown);
    if(Number.isFinite(count)&&count>=1&&count<=5&&count!==lastCountdown){lastCountdown=count;tone(count===1?880:660,.08,.028);}
    if(!Number.isFinite(count)||count<=0)lastCountdown=null;
    players.forEach((player,index)=>{
      const grounded=Boolean(player?.grounded??player?.onGround??true);
      if(previousGrounded[index]&&!grounded&&index!==h.localPlayerIndex)tone(240,.055,.018);
      previousGrounded[index]=grounded;
    });
  }

  function applySpectatorAppearance(){
    if(!currentMatchAppearance||!hooks()?.spectator)return;
    const ps=hooks()?.players||[];
    for(const [i,key] of [[0,"host"],[1,"guest"]]){
      const appearance=currentMatchAppearance[key];
      if(!appearance||!ps[i])continue;
      // Preserve the exact custom slot and full palette instead of incrementing a custom index.
      ps[i].appearance=JSON.parse(JSON.stringify(appearance));
      ps[i].skinId=appearance.id||ps[i].skinId;
      ps[i].id=appearance.id||ps[i].id;
    }
  }

  function loop(){
    if(!spectatorButton)installSpectateButton();
    spectatorButton.hidden=!onlineMenuActive();
    drawSpectatorOverlay();
    applySpectatorAppearance();
    requestAnimationFrame(loop);
  }

  document.addEventListener("DOMContentLoaded",()=>{
    makePicker();installOverlayCanvas();installCanvasSpectateIntercept();requestAnimationFrame(loop);
  },{once:true});
})();
