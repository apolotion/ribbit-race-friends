import test from"node:test";import assert from"node:assert/strict";import{readFileSync}from"node:fs";const s=readFileSync("client/game/110-online-mobile-polish.js","utf8");
test("IndexedDB replay archive exists",()=>{assert.match(s,/RibbitRaceReplaysV2/);assert.match(s,/ReplayDb/)});
test("Frog Tags supports selecting opponent and all games",()=>{assert.match(s,/openTagGames/);assert.match(s,/RibbitOpenFrogTagGames/);assert.match(s,/PLAY REPLAY/)});
test("online matches record full replay from match start",()=>{assert.match(s,/priorOnlinePlaying/);assert.match(s,/finishOnlineArchive/)});
test("record notice remembers prior holder and suppresses repeated aggregate leaders",()=>{assert.match(s,/PREVIOUS:/);assert.match(s,/pvp\|flies/)});
test("Frog Tags uses frog appearance and disabled arrows",()=>{assert.match(s,/opponentAppearance/);assert.match(s,/drawMiniFrog/);assert.match(readFileSync("client/game/30-online-versus.js","utf8"),/battleReplayRects/)});
