from pathlib import Path
root=Path('/mnt/data/rr-polish35-work')
p=root/'client/game/30-online-versus.js';s=p.read_text()
s=s.replace('''preview:{x:151,y:91,w:178,h:72},previous:{x:159,y:111,w:22,h:27},next:{x:299,y:111,w:22,h:27},
        enter:{x:144,y:176,w:192,h:26},cancel:{x:185,y:232,w:110,h:22},minimize''','''preview:{x:151,y:91,w:178,h:72},previous:{x:159,y:111,w:22,h:27},next:{x:299,y:111,w:22,h:27},
        enter:{x:144,y:176,w:192,h:26},cancel:{x:184,y:231,w:112,h:23},minimize''')
s=s.replace('''if(state.screen==='battleTags')return [spec('battlePrev','',{x:354,y:232,w:23,h:22},'previous','#eac65b','Previous opponents.'),spec('battleNext','',{x:384,y:232,w:23,h:22},'next','#eac65b','More opponents.'),spec('back','BACK',ENTRY.back,'back','#bac8cf','Return to Online.')];''','''if(state.screen==='battleTags')return [spec('battlePrev','',{x:354,y:231,w:23,h:23},'previous','#eac65b','Previous opponents.'),spec('battleNext','',{x:384,y:231,w:23,h:23},'next','#eac65b','More opponents.'),spec('back','BACK',{x:184,y:231,w:112,h:23},'back','#bac8cf','Return to Online.')];''')
# enrich Frog Tags from archive; use local replay only if actually captured
anchor="""      function drawBattleTags(){
"""
insert='''      const battleReplayRects=[];
      function recentBattleArchive(opponent) {
        const name=String(opponent||"").trim().toLowerCase();
        const records=window.RibbitFrogTags?.against?.(opponent)||[];
        return records.filter(r=>r&&String(r.opponent||opponent).toLowerCase()===name)
          .sort((a,b)=>Number(b.at||b.updatedAt||0)-Number(a.at||a.updatedAt||0));
      }
      function recentBattleReplay(opponent) {
        return recentBattleArchive(opponent).find(r=>typeof r.replayId==="string"&&r.replayId.length>0)||null;
      }
      async function playBattleReplay(row) {
        const recent=recentBattleReplay(row?.name);
        if(!recent)return;
        const replayId=recent.replayId;
        try {
          await window.RibbitRacePlayStoredReplay?.(replayId,`${row.name} • RECENT MATCH`);
        }catch(error){console.warn("Frog Tags replay unavailable",error);}
      }
'''
assert anchor in s;s=s.replace(anchor,insert+anchor)
a=s.index('      function drawBattleTags(){')
b=s.index('      function drawOnlineEntry(){',a)
s=s[:a]+'''      function drawBattleTags(){
        drawPanel('FROG TAGS');
        fitText(battleView.loading?'LOADING MATCH RECORDS':battleView.error||'YOUR QUICKPLAY HEAD-TO-HEAD RECORDS',240,67,376,.70,battleView.error?'#96334c':'#07516a');
        drawBitmapText('OPPONENT',103,88,.57,'left','#59666b');
        drawBitmapText('W - L',260,88,.57,'center','#59666b');
        drawBitmapText('LAST PLAYED',337,88,.53,'center','#59666b');
        drawBitmapText('REPLAY',395,88,.51,'center','#59666b');
        battleReplayRects.length=0;
        const entries=battleView.entries.slice(battleView.page*6,battleView.page*6+6);
        entries.forEach((r,i)=>{
          const y=102+i*18;
          ctx.fillStyle=i%2?'#e6f3f3':'#f0f7f8';ctx.fillRect(68,y-3,344,17);
          const latest=recentBattleArchive(r.name)[0];
          const appearance=latest?.opponentAppearance;
          let palette=getPvpSkinPalette(appearance?.skinId||appearance?.id||r.skinId||'azure','azure');
          if(appearance&&typeof appearance==='object')palette={...palette,...appearance};
          drawMiniFrogSwatchFacing(82,y+2,palette,.49,1);
          fitText(r.name+(r.temporary?' *':''),100,y+1,132,.69,'#174f65','left');
          drawBitmapText(`${r.wins} - ${r.losses}`,260,y+1,.66,'center','#07516a');
          const stamp=Number(latest?.at||r.updatedAt||0);
          const date=stamp?new Date(stamp).toLocaleDateString('en-US',{month:'numeric',day:'numeric',year:'2-digit'}):'—';
          drawBitmapText(date,338,y+2,.48,'center','#59666b');
          if(recentBattleReplay(r.name)){
            const hit={x:383,y:y-3,w:26,h:17,row:r};
            ctx.fillStyle='#26363d';ctx.fillRect(hit.x+1,hit.y+3,17,10);
            ctx.fillRect(hit.x+5,hit.y+1,8,3);
            ctx.fillStyle='#f7fdff';ctx.fillRect(hit.x+3,hit.y+5,13,6);
            ctx.fillStyle='#59666b';ctx.fillRect(hit.x+9,hit.y+6,4,4);
            battleReplayRects.push(hit);
          }
        });
        if(!entries.length&&!battleView.loading&&!battleView.error)fitText('NO COMPLETED QUICKPLAY MATCHES YET',240,146,350,.78);
        fitText(battleView.guest?'GUEST RECORDS ARE TEMPORARY':"",240,216,374,.53);
        for(const b of onlineButtons())drawOnlineAction(b,state.focus===b.id);
        fitText(`${battleView.page+1}/${Math.max(1,Math.ceil(battleView.entries.length/6))}`,337,240,29,.6);
      }
''' +s[b:]
# pointer down priority
needle="""        const b=onlineButtons().find(b=>pointInsideRect(p,b));if(!b)return true;focusOnlineButton(b.id);
"""
replace="""        if(state.screen==='battleTags'){
          const replayHit=battleReplayRects.find(hit=>pointInsideRect(p,hit));
          if(replayHit){playBattleReplay(replayHit.row);return true;}
        }
        const b=onlineButtons().find(b=>pointInsideRect(p,b));if(!b)return true;focusOnlineButton(b.id);
"""
assert needle in s;s=s.replace(needle,replace)
# adjust hover cursor over replay hit
s=s.replace("""try{canvas.style.setProperty('cursor',b?'pointer':'default','important');}catch(_){ }""","""try{canvas.style.setProperty('cursor',(b||(state.screen==='battleTags'&&battleReplayRects.some(hit=>pointInsideRect(p,hit))))?'pointer':'default','important');}catch(_){ }""")
p.write_text(s)
# remove inaccurate legacy visual overlay arrows and icons, retain replay database and detail modal
p=root/'client/game/110-online-mobile-polish.js';s=p.read_text()
a=s.index('  function drawFrogTagsPolish(g){')
b=s.index('\n  // Select a Frog Tags opponent',a)
s=s[:a]+'''  function drawFrogTagsPolish(g){
    // OnlineVersus now owns all Frog Tags row sprites and correctly aligned
    // arrow buttons; the old post-render overlay must not draw duplicates.
  }
''' +s[b:]
p.write_text(s)
