import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";
const read=(p)=>readFileSync(p,"utf8");

const extension=read("public/scripts/extended-features.js");
const core=read("client/game/10-core-config.js");
const mobile=read("client/game/100-mobile-experience.js");
const render=readGameModuleGroup(70, 79);
const versus=readGameModuleGroup(60, 69);

test("1.7.46 build and responsibility-focused modular gameplay sources are present",()=>{
  assert.match(read("src/common.js"),/2026\.10\.13-friends-polish-58/);
  assert.match(read("package.json"),/"version": "1\.7\.46"/);
  assert.match(read("scripts/build-game.mjs"),/discoverModules\(\)/);
  assert.match(read("public/index.html"),/mobile-experience\.js/);
});

test("obsolete apolotion unlock code is absent and Playtest is reversible",()=>{
  const all=[core,read("client/game/40-ui-navigation-audio.js"),read("public/scripts/cloud-client.js")].join("\n");
  assert.doesNotMatch(all,/apolotion/i);
  assert.match(all,/PLAYTEST_TOGGLE_CODE = "playtest"/);
  const guard=read("public/scripts/playtest-guard.js");
  assert.match(guard,/rrFriendsPlaytestRecoveryV3/);
  assert.match(guard,/beforeunload/);
  assert.match(guard,/pagehide/);
});

test("world-record label, hover details and repeat suppression remain installed",()=>{
  assert.match(extension,/WORLD RECORD/);
  assert.match(extension,/rr-world-record-hit/);
  assert.match(extension,/rrWorldRecordFirstPlaceSeenV1/);
  assert.match(extension,/pvpwins/);
  assert.match(extension,/flies/);
});

test("fastest-time and fewest-jumps replay paths remain available",()=>{
  const hub=read("src/hub.js");
  assert.match(hub,/record_replays/);
  assert.match(hub,/api\/replays\/submit/);
  assert.match(hub,/api\/replays\/get/);
  assert.match(extension,/application\/vnd\.ribbit-race\.frames/);
  assert.match(extension,/spectator\.play/);
  assert.match(extension,/rr-replay-watch/);
});

test("hat progression uses a post-unlock baseline and no online/human-only requirements",()=>{
  assert.match(extension,/fliesBase/);
  assert.match(extension,/jumpsBase/);
  assert.match(extension,/post-unlock challenge|Silent initialization/);
  assert.match(extension,/Finish Garden under 30 seconds as Blossom/);
  assert.match(extension,/Win 10 Versus matches/);
  const requirements=extension.slice(extension.indexOf("requirements(id"),extension.indexOf("requirementLines(id"));
  assert.doesNotMatch(requirements,/online/i);
  assert.doesNotMatch(requirements,/human opponent|human frog/i);
  for(const skin of ["Azure","Crimson","Forest","Violet","Silver","Blossom","Ember"]){
    assert.match(requirements,new RegExp(skin,"i"));
  }
});

test("hatstest exposes Hats without directly unlocking individual hats",()=>{
  const nav=read("client/game/40-ui-navigation-audio.js");
  assert.match(core,/HATS_TEST_TOGGLE_CODE = "hatstest"/);
  assert.match(nav,/ribbitRaceHatsTestUnlockedV1/);
  assert.match(nav,/ribbit-hats-test-enabled/);
  const block=nav.slice(nav.indexOf("endsWith(HATS_TEST_TOGGLE_CODE)"),nav.indexOf("return true",nav.indexOf("endsWith(HATS_TEST_TOGGLE_CODE)"))+20);
  assert.doesNotMatch(block,/unlock\(/i);
  assert.doesNotMatch(block,/ribbitRaceUnlockedHatsV2/);
});

test("custom palette tools and revised Custom Frog 3 requirements remain installed",()=>{
  assert.match(extension,/BASE PALETTE/);
  assert.match(extension,/contextmenu/);
  assert.match(extension,/metaKey\|\|e\.ctrlKey/);
  assert.match(extension,/commitRgbEditor/);
  assert.match(extension,/flies>=100&&wins>=3&&levels>=3/);
});

test("Mobile Mode owns independent simultaneous P1 and P2 pointer slots",()=>{
  assert.match(core,/rrFriendsMobileModeV1/);
  assert.match(mobile,/const rrMobileHeldPointers = new Map\(\)/);
  assert.match(mobile,/RR_MOBILE_PVP_METERS/);
  assert.match(mobile,/pointerId/);
  assert.match(mobile,/pressPvpButton\(index, "human"\)/);
  assert.match(mobile,/releasePvpButton\(held\.index, "human"\)/);
});

test("word plates stay horizontally centered above flies",()=>{
  assert.match(render,/const centeredX = Math\.round\(anchorX - width \/ 2\)/);
  const block=render.slice(render.indexOf("function chooseFlyLabelRect"),render.indexOf("function drawStableFlyLabelTextToSprite"));
  assert.doesNotMatch(block,/getFlyLabelHudObstacles\(/);
  assert.doesNotMatch(block,/clamp\(candidate\.x/);
});

test("bonks require a falling upper frog or a rising lower frog",()=>{
  assert.match(versus,/function canPvpVerticalContactBonk/);
  assert.match(versus,/Number\(top\.vy \|\| 0\) > 12/);
  assert.match(versus,/Number\(bottom\.vy \|\| 0\) < -24/);
});

test("PvP achievements and bounce stats accept the eligible active human on either side",()=>{
  assert.match(core,/isAchievementEligibleHumanPvpIndex/);
  const nav=read("client/game/40-ui-navigation-audio.js");
  assert.match(nav,/function recordPvpBounceStat/);
  assert.match(nav,/isAchievementEligibleHumanPvpIndex\(playerIndex\)/);
});

test("Versus entry persists the preferred selected frog skin",()=>{
  const ext=read("client/game/90-extended-features.js");
  assert.match(ext,/rr14PersistPreferredSkin/);
  assert.match(ext,/ribbitRaceSelectedSkinV1/);
});

test("replay routes are forwarded through the Worker",()=>{
  assert.match(read("src/index.js"),/api\/replays\//);
});
