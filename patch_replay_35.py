from pathlib import Path
P=Path('/mnt/data/rr-polish35-work/client/game/130-polish-ui-replay-language.js');s=P.read_text()
# Use server-record availability to expose cam even without legacy replay IDs.
old='''      rows.push({
        rank:0,
        name:String(entry.name || entry.displayName || entry.username || entry.player || "FROG"),'''
new='''      const recordLevel = String(record.level || (level === "any" ? "all" : level)).toLowerCase();
      const serverReplay = (metric === "time" || metric === "jumps") &&
        Boolean(entry.replayAvailable?.[recordLevel]?.[metric]);
      rows.push({
        rank:0,
        name:String(entry.name || entry.displayName || entry.username || entry.player || "FROG"),'''
assert old in s;s=s.replace(old,new)
s=s.replace('''        replayId:record.replayId || null,
        skinId:entry.skinId''','''        replayId:record.replayId || (serverReplay ? `server:${recordLevel}:${metric}` : null),
        serverReplayAvailable:serverReplay,
        skinId:entry.skinId''')
# Change camera click to direct remote PB retrieval if server id
s=s.replace('''        if (replay.row.replayId) playReplayById(replay.row.replayId, `${replay.row.name} • ${replay.row.metric}`);
        else playLeaderboardRecord(replay.row);
''','''        if (replay.row.serverReplayAvailable || String(replay.row.replayId).startsWith("server:")) {
          playLeaderboardRecord(replay.row);
        } else if (replay.row.replayId) {
          playReplayById(replay.row.replayId, `${replay.row.name} • ${replay.row.metric}`);
        }
''')
s=s.replace('''    loadLeaderboard(false);
    safeCall(tone, 540''','''    loadLeaderboard(true); // authoritative replay availability may have changed since last visit
    safeCall(tone, 540''')
# Listener when recently recorded video uploads, refresh cache
anchor='''  function closeLeaderboard() {
'''
s=s.replace(anchor,'''  window.addEventListener("ribbit-replay-uploaded", () => {
    polish.leaderboardRawPayload = null;
    if (game.state === "rrLeaderboard") loadLeaderboard(true);
  });

'''+anchor)
P.write_text(s)
# replay sender refresh event with actual success status
P=Path('/mnt/data/rr-polish35-work/public/scripts/extended-features.js');s=P.read_text()
ix=s.index('fetch("/api/replays/submit"')
print(s[ix:ix+820])
P.write_text(s)
