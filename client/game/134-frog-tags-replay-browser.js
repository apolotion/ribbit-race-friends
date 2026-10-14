// Frog Tags — complete-set replay archive and spectator playlist.
// Records live in IndexedDB on this device; the small opponent/set index stays
// in Frog Tags' normal save namespace. Missing old recordings are never faked.
(() => {
  "use strict";
  const ARCHIVE_KEY="ribbitRaceOnlineHistoryV2";
  const store=()=>window.RibbitReplayStore;
  let dialog=null,filteredName="",searchText="",allSets=[],sequence=0;
  let replayWasPaused=null;

  function archiveRows(){
    const result=[...(window.RibbitFrogTags?.list?.()||[])];
    try{
      const history=JSON.parse(localStorage.getItem(ARCHIVE_KEY)||"{}");
      for(const [name,rows] of Object.entries(history)){
        if(Array.isArray(rows))for(const row of rows)result.push({...row,opponent:row.opponent||name});
      }
    }catch(_){}
    // Multiple save bridges can refer to the same physical recording.
    const unique=new Map();
    for(const row of result){
      if(!row || typeof row.replayId!=="string" || !row.replayId)continue;
      const replayId=row.replayId;
      const prior=unique.get(replayId);
      if(!prior || row.scope==="set" || (!prior.setId && row.setId)) unique.set(replayId,row);
    }
    return [...unique.values()];
  }
  function listSets(name=""){
    const scope=String(name||"").trim().toLowerCase();
    const grouped=new Map();
    for(const row of archiveRows()){
      const opponent=String(row.opponent||"OPPONENT").trim()||"OPPONENT";
      if(scope && opponent.toLowerCase()!==scope)continue;
      const matchId=String(row.setId||row.matchId||row.id||row.replayId);
      const key=opponent.toLowerCase()+"|"+matchId;
      if(!grouped.has(key))grouped.set(key,{
        id:key,opponent,setId:matchId,replayIds:[],entries:[],
        at:0,won:null,score:null,roundCount:0,scope:"round"
      });
      const group=grouped.get(key);
      group.entries.push(row);
      group.replayIds.push(row.replayId);
      group.at=Math.max(group.at,Number(row.at||row.updatedAt)||0);
      if(row.won!==undefined)group.won=!!row.won;
      if(row.score)group.score=row.score;
      group.roundCount=Math.max(group.roundCount,Number(row.roundCount)||0);
      if(row.scope==="set")group.scope="set";
    }
    return [...grouped.values()].map(group=>{
      group.entries.sort((a,b)=>Number(a.at||0)-Number(b.at||0));
      group.replayIds=group.entries.map(row=>row.replayId);
      group.roundCount=Math.max(group.roundCount,group.replayIds.length);
      if(group.scope!=="set" && group.replayIds.length>1)group.scope="legacy-set";
      return group;
    }).sort((a,b)=>b.at-a.at||a.opponent.localeCompare(b.opponent));
  }
  window.RibbitFrogTags.browseSets=listSets;

  function displayDate(at){
    const date=new Date(at);
    return Number.isFinite(date.getTime())
      ?date.toLocaleString(undefined,{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"})
      :"UNKNOWN DATE";
  }
  function resultText(group){
    return group.won===null?"MATCH":group.won?"WIN":"LOSS";
  }
  function scoreText(group){
    const score=group.score;
    return Array.isArray(score)&&score.length>=2?` • ${score[0]}–${score[1]}`:"";
  }
  function scopeText(group){
    if(group.scope==="set")return `${group.roundCount} ROUND${group.roundCount===1?"":"S"} • COMPLETE SET`;
    if(group.scope==="legacy-set")return `${group.replayIds.length} ARCHIVED ROUNDS • STITCHED SET`;
    return "OLDER ROUND-ONLY REPLAY";
  }
  function buildDialog(){
    if(dialog)return dialog;
    dialog=document.createElement("section");
    dialog.id="rr-frog-tag-replay-browser";
    dialog.hidden=true;
    dialog.setAttribute("role","dialog");
    dialog.setAttribute("aria-modal","true");
    dialog.setAttribute("aria-label","Frog Tags replay browser");
    dialog.innerHTML=`<div class="rr-tag-replay-card">
      <div class="rr-tag-replay-heading"><h2>FROG TAG REPLAYS</h2><button type="button" data-tag-action="close" aria-label="Close replay browser">×</button></div>
      <div class="rr-tag-replay-actions">
        <span class="rr-tag-replay-filter"></span>
        <button type="button" data-tag-action="all">ALL OPPONENTS</button>
        <input type="search" aria-label="Filter saved replays" placeholder="SEARCH OPPONENT OR DATE" maxlength="60" />
      </div>
      <div class="rr-tag-replay-count" aria-live="polite"></div>
      <div class="rr-tag-replay-list" role="list"></div>
      <div class="rr-tag-replay-help">SCROLL FOR OLDER SETS • SHIFT+N NEXT • SHIFT+B PREVIOUS • X/Z ±10S</div>
    </div>`;
    document.body.append(dialog);
    dialog.addEventListener("click",event=>{
      const action=event.target.closest("[data-tag-action]")?.dataset.tagAction;
      if(action==="close")hideDialog();
      else if(action==="all") {filteredName="";renderDialog();}
    });
    dialog.querySelector("input").addEventListener("input",event=>{
      searchText=event.target.value.trim().toLowerCase();renderDialog();
    });
    return dialog;
  }
  function isOpen(){return !!dialog&&!dialog.hidden;}
  function hideDialog(resume=true){
    if(!dialog)return;
    dialog.hidden=true;
    if(resume && replayWasPaused!==null)window.RibbitEngineReplay?.setPaused?.(replayWasPaused);
    replayWasPaused=null;
  }
  function renderDialog(){
    const root=buildDialog();
    const visible=allSets.filter(group=>
      (!filteredName||group.opponent.toLowerCase()===filteredName.toLowerCase()) &&
      (!searchText||`${group.opponent} ${displayDate(group.at)} ${resultText(group)}`.toLowerCase().includes(searchText)));
    root.querySelector(".rr-tag-replay-filter").textContent=filteredName?`OPPONENT: ${filteredName.toUpperCase()}`:"ALL SAVED OPPONENTS";
    root.querySelector('[data-tag-action="all"]').hidden=!filteredName;
    root.querySelector(".rr-tag-replay-count").textContent=
      `${visible.length} SAVED ${visible.length===1?"REPLAY":"REPLAYS"} • ONE ENTRY PER OPPONENT SET`;
    const list=root.querySelector(".rr-tag-replay-list");
    list.replaceChildren();
    if(!visible.length){
      const empty=document.createElement("p");empty.className="rr-tag-replay-empty";
      empty.textContent=allSets.length?"NO SAVED REPLAYS MATCH THIS FILTER":"NO FROG TAG RECORDINGS SAVED ON THIS DEVICE YET";
      list.append(empty);return;
    }
    for(const group of visible){
      const item=document.createElement("button");item.type="button";item.className="rr-tag-replay-entry";
      item.setAttribute("role","listitem");
      const text=document.createElement("span");text.className="rr-tag-replay-entry-text";
      const title=document.createElement("strong");title.textContent=`${group.opponent.toUpperCase()} • ${resultText(group)}${scoreText(group)}`;
      const caption=document.createElement("span");caption.textContent=`${displayDate(group.at)} • ${scopeText(group)}`;
      text.append(title,caption);
      const play=document.createElement("span");play.className="rr-tag-replay-entry-play";play.textContent="WATCH ▶";
      item.append(text,play);
      item.addEventListener("click",()=>{
        // Navigation follows the same menu order the player just saw.
        const index=visible.findIndex(row=>row.id===group.id);
        playSetAt(index,visible);
      });
      list.append(item);
    }
  }
  function openDialog(name=""){
    const root=buildDialog();
    filteredName=String(name||"").trim();searchText="";
    root.querySelector("input").value="";
    allSets=listSets();
    if(window.RibbitEngineReplay?.active?.()){
      replayWasPaused=window.RibbitEngineReplay?.isPaused?.()??null;
      window.RibbitEngineReplay?.setPaused?.(true);
    }
    renderDialog();root.hidden=false;
    const first=root.querySelector(".rr-tag-replay-entry")||root.querySelector('[data-tag-action="close"]');
    first?.focus?.({preventScroll:true});
    return true;
  }
  async function playSetAt(index,groups){
    const group=groups?.[index];if(!group)return false;
    const attempt=++sequence;
    const root=buildDialog();root.querySelector(".rr-tag-replay-count").textContent="LOADING SAVED SET...";
    const rows=[];
    for(const replayId of group.replayIds){
      try{
        const row=await store()?.get?.(replayId);
        if(row?.record?.kind==="ribbit-engine-frames")rows.push(row.record);
      }catch(error){console.warn("Could not load Frog Tags replay",error);}
    }
    if(attempt!==sequence)return false;
    if(!rows.length){
      root.querySelector(".rr-tag-replay-count").textContent="REPLAY DATA MISSING ON THIS DEVICE — CHOOSE ANOTHER SAVED SET";
      if(root.hidden)window.RibbitEngineReplay?.unavailable?.("REPLAY NOT STORED","THIS REPLAY IS NOT AVAILABLE ON THIS DEVICE");
      return false;
    }
    const data=rows.length===1?rows[0]:window.RibbitEngineReplay?.combineRounds?.(rows);
    if(!data){root.querySelector(".rr-tag-replay-count").textContent="SAVED REPLAY FRAMES ARE INVALID";return false;}
    const type=group.scope==="round"?"ROUND REPLAY":group.scope==="legacy-set"?"ARCHIVED SET":"FULL SET";
    const caption=`${group.opponent.toUpperCase()} • ${type} ${index+1}/${groups.length} • ${resultText(group)}`;
    const collection={entries:groups,index,playIndex:next=>playSetAt(next,groups),
      openBrowser:()=>openDialog(filteredName)};
    hideDialog(false);
    const played=window.RibbitEngineReplay?.play?.(data,caption,{recordedAt:group.at,collection});
    if(played)replayWasPaused=null;
    return !!played;
  }
  window.RibbitOpenFrogTagGames=openDialog;
  window.RibbitFrogTagReplayBrowser=Object.freeze({open:openDialog,close:hideDialog,
    isOpen,listSets,playIndex:playSetAt});
  window.addEventListener("keydown",event=>{
    if(!isOpen())return;
    if(event.code==="Escape"){
      event.preventDefault();event.stopImmediatePropagation();hideDialog();
    }
  },true);
})();
