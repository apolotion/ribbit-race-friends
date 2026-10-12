import test from "node:test";import assert from "node:assert/strict";import{readFileSync}from"node:fs";
const s=readFileSync("client/game/110-online-mobile-polish.js","utf8");
test("release touch updates online hover index",()=>{assert.match(s,/onlineMenuIndexForPoint/);assert.match(s,/pointerup/)});
test("final catch tongue assist calls normal catch candidates",()=>{assert.match(s,/finalCatchTongueAssist/);assert.match(s,/catchFly/)});
test("replay begins on active run and only uploads records",()=>{assert.match(s,/RibbitRecordReplay\.start/);assert.match(s,/qualifiesAsRecord/);assert.match(s,/uploadReplayBlob/)});
test("pause fullscreen DOM option exists",()=>{assert.match(s,/rr-pause-fullscreen/);assert.match(s,/FULLSCREEN/)});
test("reset and platform drop functions are wrapped",()=>{assert.match(s,/RR_V160_CANDIDATES\.restart/);assert.match(s,/RR_V160_CANDIDATES\.drop/)});
test("online appearance and Frog Tags are separated",()=>{assert.match(s,/ribbitRaceOnlineAppearanceV1/);assert.match(s,/ribbitRaceFrogTagMatchesV1/)});
test("CPU takeover counts down without reset",()=>{assert.match(s,/cpuSnapshot/);assert.match(s,/CPU LEVEL 5 TAKES OVER/)});
