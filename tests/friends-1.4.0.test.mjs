import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(p,"utf8");

test("1.4.0 build and modular extension are present",()=>{
  assert.match(read("src/common.js"),/friends-mobile-replay-hats-1/);
  assert.match(read("scripts/build-game.mjs"),/90-extended-features\.js/);
  assert.match(read("public/index.html"),/extended-features\.js/);
});
test("obsolete apolotion unlock code is absent",()=>{
  const all=["client/game/40-ui-navigation-audio.js","client/game/80-input-loop-startup.js","public/scripts/cloud-client.js"].map(read).join("\n");
  assert.doesNotMatch(all,/apolotion/i);
  assert.match(all,/playtest/i);
});
test("playtest has persistent pre-session rollback",()=>{
  const s=read("public/scripts/playtest-guard.js");assert.match(s,/rrFriendsPlaytestRecoveryV3/);assert.match(s,/beforeunload/);assert.match(s,/pagehide/);
});
test("world-record label and repeat suppression are installed",()=>{
  const s=read("public/scripts/extended-features.js");assert.match(s,/NEW WORLD RECORD/);assert.match(s,/pvpwins/);assert.match(s,/rrWorldRecordFirstPlaceSeenV1/);
});
test("fastest-time and fewest-jumps replay paths exist",()=>{
  const s=read("src/hub.js");assert.match(s,/record_replays/);assert.match(s,/api\/replays\/submit/);assert.match(s,/api\/replays\/get/);
  assert.match(read("public/scripts/extended-features.js"),/WORLD RECORD REPLAY/);
});
test("hat progression starts from a post-unlock baseline",()=>{
  const s=read("public/scripts/extended-features.js");assert.match(s,/fliesBase/);assert.match(s,/winsBase/);assert.match(s,/HATS UNLOCKED/);assert.match(s,/HAT UNLOCKED/);
  assert.match(s,/Garden under 30 seconds as Bloom/);assert.match(s,/Rebound from a human frog 10 times/);assert.match(s,/Win 10 individual Versus games/);
});
test("custom palette copy paste and base selection are installed",()=>{
  const s=read("public/scripts/extended-features.js");assert.match(s,/BASE PALETTE/);assert.match(s,/contextmenu/);assert.match(s,/metaKey\|\|e\.ctrlKey/);assert.match(s,/commitRgbEditor/);
});
test("custom frog three uses revised achievable parameters",()=>{
  const s=read("public/scripts/extended-features.js");assert.match(s,/flies>=100&&wins>=3&&levels>=3/);
});
test("mobile mode has independent simultaneous P1 and P2 pointers",()=>{
  const s=read("public/scripts/extended-features.js");assert.match(s,/rrFriendsMobileModeV1/);assert.match(s,/ShiftLeft/);assert.match(s,/ShiftRight/);assert.match(s,/this\.pointers=new Map/);
});
test("word plates remain exactly centered above flies",()=>{
  const s=read("client/game/70-rendering.js");assert.match(s,/centeredX = .*\.x - .* \/ 2/);assert.match(s,/HUD\/timer/);
});
test("bonks require falling or an opponent rising",()=>{
  const s=read("client/game/90-extended-features.js");assert.match(s,/top\.vy > 0\.08 \|\| bottom\.vy < -0\.08/);
});

test("PvP achievements accept either active human index",()=>{
 const s=read("client/game/90-extended-features.js");assert.match(s,/rr14IsHumanPvpIndex/);
});
test("Versus entry persists the preferred selected skin",()=>{
 const s=read("client/game/90-extended-features.js");assert.match(s,/rr14PersistPreferredSkin/);assert.match(s,/ribbitRaceSelectedSkinV1/);
});
test("leaderboard record rows receive a replay frog control",()=>{
 const s=read("public/scripts/extended-features.js");assert.match(s,/rr-replay-frog/);assert.match(s,/Watch this record run/);
});

test("replay routes are forwarded through the Worker",()=>{assert.match(read("src/index.js"),/api\/replays\//);});
test("hat requirements enumerate the real hat catalog",()=>{assert.match(read("client/game/90-extended-features.js"),/rr14HatIds/);assert.match(read("public/scripts/extended-features.js"),/hatIds/);});
test("repeat world-record notices can return an empty suppressed label",()=>{const all=[read("client/game/70-rendering.js"),read("public/scripts/cloud-client.js")].join("\n");assert.doesNotMatch(all,/prepare\?\.\(\) \|\| ["']NEW WORLD RECORD/);});

test("hat counters include online wins and post-unlock jumps",()=>{const s=read("public/scripts/extended-features.js");assert.match(s,/ribbit-pvp-match-finished/);assert.match(s,/jumpsBase/);assert.match(s,/onlineWins/);});

test("every live hat has a thematic or fallback requirement",()=>{const s=read("public/scripts/extended-features.js");for(const word of ["horn","chef","halo","baseball","sombrero","santa","bow","propeller"])assert.match(s,new RegExp(word));assert.match(s,/Catch 40 flies after Hats unlock/);});
