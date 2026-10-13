from pathlib import Path
P=Path('/mnt/data/rr-polish35-work/client/game/130-polish-ui-replay-language.js');s=P.read_text()
s=s.replace('''    leaderboardStatsHitRects: {},
''','''    leaderboardStatsHitRects: {},
    leaderboardStatsPage: 0,
''',1)
start=s.index('  function buildLeaderboardStatsRows(row) {')
end=s.index('\n  function openLeaderboardStats(row) {',start)
s=s[:start]+'''  function leaderboardPlayerMetrics(row) {
    const entry = row?.sourceEntry || {};
    const stats = entry.stats && typeof entry.stats === "object" ? entry.stats : {};
    const format = (value, digits = 0) => {
      const n = Number(value);
      return value === undefined || value === null || !Number.isFinite(n) ? "—" : (digits ? n.toFixed(digits) : String(Math.floor(n)));
    };
    const records = entry.records && typeof entry.records === "object" ? entry.records : {};
    const bestTime = Object.values(records).reduce((result, record) => {
      const n = Number(record?.time);
      return Number.isFinite(n) && n > 0 && (result === null || n < result) ? n : result;
    }, null);
    return [
      { label:"TOTAL JUMPS", value:format(entry.totalJumps ?? stats.totalJumps), icon:"jump" },
      { label:"FLIES CAUGHT", value:format(entry.totalFlies ?? stats.totalFliesEaten), icon:"fly" },
      { label:"DISTANCE JUMPED", value:stats.distanceJumpedPx === undefined ? "—" : formatStatDistance(stats.distanceJumpedPx), icon:"distance" },
      { label:"PERFECT JUMPS", value:format(stats.perfectJumps), icon:"perfect" },
      { label:"BEST FLY COMBO", value:format(stats.maxFliesOneJump), icon:"combo" },
      { label:"LONGEST AIR TIME", value:stats.longestAirTime === undefined ? "—" : `${format(stats.longestAirTime,1)} SEC`, icon:"air" },
      { label:"FASTEST FINISH", value:bestTime === null ? "--:--.-" : formatTime(bestTime), icon:"clock" },
      { label:"LEVEL WINS", value:format(stats.totalWins), icon:"trophy" },
      { label:"WALL BOUNCES", value:format(stats.wallBounces), icon:"bounce" },
      { label:"FLIES SPAT BACK", value:format(stats.wrongFlies), icon:"spit" },
      { label:"PVP BONKS", value:format(stats.pvpBonksDealt), icon:"pvpBonk" },
      { label:"TIMES BONKED", value:format(stats.pvpTimesBonked), icon:"bonk-max" },
      { label:"PVP BOUNCES", value:format(stats.pvpBounces), icon:"bounce" },
      { label:"PVP MATCH WINS", value:format(entry.pvpMatchWins ?? stats.pvpMatchWins), icon:"trophy" }
    ];
  }
''' +s[end:]
s=s.replace('''    polish.leaderboardStatsRow = row || null;
    polish.leaderboardStatsHitRects = {};
''','''    polish.leaderboardStatsRow = row || null;
    polish.leaderboardStatsPage = 0;
    polish.leaderboardStatsHitRects = {};
''')
start=s.index('  function drawLeaderboardStatsModal() {')
end=s.index('\n  async function playLeaderboardRecord(row) {',start)
s=s[:start]+'''  function drawLeaderboardStatsModal() {
    const row = polish.leaderboardStatsRow;
    if (!row) return;
    const skin = leaderboardFrogPalette(row);
    const panel = { x:20, y:7, w:440, h:256 };
    const close = { x:432, y:18, w:20, h:20 };
    const back = STATS_UI.backButton;
    const prev = STATS_UI.pagePrevButton, next = STATS_UI.pageNextButton;
    polish.leaderboardStatsHitRects = { panel, close, back, prev, next };
    ctx.fillStyle="rgba(8,25,33,.66)";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(12,26,33,.22)";ctx.fillRect(panel.x+6,panel.y+7,panel.w-6,panel.h-7);
    ctx.fillStyle=COLORS.ink;
    ctx.fillRect(panel.x+4,panel.y,panel.w-8,panel.h);
    ctx.fillRect(panel.x,panel.y+4,panel.w,panel.h-8);
    ctx.fillStyle="#f7fdff";
    ctx.fillRect(panel.x+7,panel.y+4,panel.w-14,panel.h-8);
    ctx.fillRect(panel.x+4,panel.y+8,panel.w-8,panel.h-16);
    ctx.fillStyle=skin.dark;ctx.fillRect(panel.x+12,panel.y+9,panel.w-24,36);
    ctx.fillStyle=skin.mid;ctx.fillRect(panel.x+14,panel.y+11,panel.w-28,31);
    ctx.fillStyle=skin.light;ctx.fillRect(panel.x+17,panel.y+13,panel.w-34,4);
    drawBitmapText("PLAYER STATS",W/2,panel.y+18,2,"center",COLORS.white,skin.dark);
    // Real top-right X; clicking it closes this overlay rather than the leaderboard.
    ctx.fillStyle=COLORS.ink;ctx.fillRect(close.x,close.y,close.w,close.h);
    ctx.fillStyle="#f7fdff";ctx.fillRect(close.x+2,close.y+2,close.w-4,close.h-4);
    ctx.fillStyle="#48555a";
    for(let i=0;i<8;i+=2){ctx.fillRect(close.x+6+i/2,close.y+5+i/2,2,2);ctx.fillRect(close.x+12-i/2,close.y+5+i/2,2,2);}
    const name = String(row.name || "FROG").toUpperCase();
    const nameScale = Math.min(.75,200 / Math.max(1,measureBitmapText(name,1)));
    drawBitmapText(name, STATS_UI.startX+4, panel.y+54, nameScale,"left","#34484f");
    drawMiniFrogSwatchFacing(410,panel.y+50,skin,.72,1);
    const allMetrics=leaderboardPlayerMetrics(row);
    const pageCount=Math.max(1,Math.ceil(allMetrics.length/STATS_UI.itemsPerPage));
    const page=Math.max(0,Math.min(polish.leaderboardStatsPage,pageCount-1));
    polish.leaderboardStatsPage=page;
    const metrics=allMetrics.slice(page*STATS_UI.itemsPerPage,(page+1)*STATS_UI.itemsPerPage);
    metrics.forEach((metric,index)=>{
      const column=index%STATS_UI.columns, rowIndex=Math.floor(index/STATS_UI.columns);
      const x=STATS_UI.startX+column*(STATS_UI.cardW+STATS_UI.gapX),y=STATS_UI.startY+rowIndex*(STATS_UI.cardH+STATS_UI.gapY);
      ctx.fillStyle="rgba(25,43,52,.22)";ctx.fillRect(x+2,y+2,STATS_UI.cardW,STATS_UI.cardH);
      ctx.fillStyle="#8fa6ac";ctx.fillRect(x,y,STATS_UI.cardW,STATS_UI.cardH);
      ctx.fillStyle="#f7fdff";ctx.fillRect(x+2,y+2,STATS_UI.cardW-4,STATS_UI.cardH-4);
      ctx.fillStyle=mixHexColors(skin.belly,"#ffffff",.25);ctx.fillRect(x+5,y+4,STATS_UI.cardW-10,3);
      drawStatsMetricIcon(metric.icon,x+30,y+STATS_UI.cardH/2,skin);
      drawBitmapText(metric.label,x+120,y+7,.82,"center","#59666b");
      drawBitmapText(metric.value,x+120,y+16,.90,"center",skin.dark);
    });
    if(pageCount>1){
      [{rect:prev,dir:-1},{rect:next,dir:1}].forEach(({rect,dir})=>{
        ctx.fillStyle="#9aa9ae";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
        ctx.fillStyle="#f7fdff";ctx.fillRect(rect.x+2,rect.y+2,rect.w-4,rect.h-4);
        drawPagerArrowIcon(rect,dir,"#48555a");
      });
      drawBitmapText(`${page+1}/${pageCount}`,STATS_UI.pagePrevButton.x-8,STATS_UI.pagePrevButton.y+5,.75,"right","#617177");
    }
    ctx.fillStyle="#93a2a7";ctx.fillRect(back.x,back.y,back.w,back.h);
    ctx.fillStyle="#f7fdff";ctx.fillRect(back.x+2,back.y+2,back.w-4,back.h-4);
    drawBitmapText("BACK",back.x+back.w/2,back.y+6,.92,"center","#48555a");
  }
''' +s[end:]
# stats handling prevent blank page, prev/next
s=s.replace('''        if (pointIn(point, statsHits.close) || pointIn(point, statsHits.back) || !pointIn(point, statsHits.panel)) {
          closeLeaderboardStats();
        }
''','''        if (pointIn(point, statsHits.close) || pointIn(point, statsHits.back) || !pointIn(point, statsHits.panel)) {
          closeLeaderboardStats();
        } else if(pointIn(point,statsHits.prev)) {
          polish.leaderboardStatsPage=(polish.leaderboardStatsPage+1)%2;
        } else if(pointIn(point,statsHits.next)) {
          polish.leaderboardStatsPage=(polish.leaderboardStatsPage+1)%2;
        }
''')
s=s.replace('''        if (polish.leaderboardStatsRow) {
          closeLeaderboardStats();
        } else if (event.code === "Escape"''','''        if (polish.leaderboardStatsRow) {
          if(["ArrowLeft","ArrowRight","KeyA","KeyD"].includes(event.code))polish.leaderboardStatsPage=(polish.leaderboardStatsPage+1)%2;
          else closeLeaderboardStats();
        } else if (event.code === "Escape"''')
P.write_text(s)
# Worker adds public stats (no account secrets) plus replay-availability summary
P=Path('/mnt/data/rr-polish35-work/src/hub.js');s=P.read_text()
old="""     const rows=this.sql.exec('SELECT id,username,name,savedata,summary,updated FROM users ORDER BY updated DESC LIMIT 500').toArray();
     return {ok:true,currentClassPeriod:'friends',entries:rows.map(u=>{
      const summary=JSON.parse(u.summary),saved=parseSaveJson_(u.savedata);
"""
new="""     const rows=this.sql.exec('SELECT id,username,name,savedata,summary,updated FROM users ORDER BY updated DESC LIMIT 500').toArray();
     const replayRows=this.sql.exec('SELECT uid,level,metric FROM record_replays').toArray();
     const replaysByUser=new Map();
     for(const replay of replayRows){const byLevel=replaysByUser.get(replay.uid)||{};
       const levelRecord=byLevel[replay.level]||(byLevel[replay.level]={});
       levelRecord[replay.metric]=true;replaysByUser.set(replay.uid,byLevel);}
     return {ok:true,currentClassPeriod:'friends',entries:rows.map(u=>{
      const summary=JSON.parse(u.summary),saved=parseSaveJson_(u.savedata);
      const parsedStats=parseSaveJson_(saved.ribbitRaceStatsV1);
      const publicKeys=['distanceJumpedPx','perfectJumps','maxFliesOneJump','totalWins','longestAirTime','wrongFlies','wallBounces','pvpBonksDealt','pvpTimesBonked','pvpBounces','pvpMatchWins'];
      const stats=Object.fromEntries(publicKeys.map(k=>[k,Number.isFinite(Number(parsedStats[k]))?Math.max(0,Number(parsedStats[k])):0]));
      const replayAvailable=replaysByUser.get(u.id)||{};
"""
assert old in s
s=s.replace(old,new)
s=s.replace("""totalFlies:summary.totalFlies,pvpMatchWins:summary.pvpMatchWins,records:summary.levelRecords,lastUpdated:new Date(u.updated).toISOString(),skinId,appearance""", """totalFlies:summary.totalFlies,totalJumps:summary.totalJumps,pvpMatchWins:summary.pvpMatchWins,stats,records:summary.levelRecords,replayAvailable,lastUpdated:new Date(u.updated).toISOString(),skinId,appearance""")
P.write_text(s)
