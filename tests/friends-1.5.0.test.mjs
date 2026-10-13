import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";

const read=(path)=>readFileSync(path,"utf8");
const html=read("public/index.html");
const mobileClient=read("public/scripts/mobile-experience.js");
const mobileGame=read("client/game/100-mobile-experience.js");
const polish170=read("public/scripts/rr-170-polish.js");
const core=read("client/game/10-core-config.js");
const render=readGameModuleGroup(70, 79);
const versus=readGameModuleGroup(60, 69);
const input=read("client/game/80-input-loop-startup.js");
const extension=read("public/scripts/extended-features.js");
const css=[read("public/styles/base.css"),read("public/styles/game-shell.css"),read("public/styles/extended-features.css")].join("\n");

test("iPhone Home Screen metadata, manifest and installation help ship together",()=>{
  assert.match(html,/rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html,/apple-mobile-web-app-capable" content="yes"/);
  assert.match(html,/apple-mobile-web-app-status-bar-style" content="black-translucent"/);
  assert.match(html,/apple-touch-icon/);
  assert.match(html,/PLAYING ON MOBILE\?/);
  assert.match(html,/Add to Home Screen/);
  const manifest=JSON.parse(read("public/manifest.webmanifest"));
  assert.equal(manifest.display,"standalone");
  assert.equal(manifest.orientation,"landscape");
  assert.ok(manifest.icons.some(icon=>icon.sizes==="180x180"));
  assert.ok(manifest.icons.some(icon=>icon.sizes==="512x512"));
});

test("Mobile Mode confirmation and repeat iPhone instructions are explicit",()=>{
  assert.match(mobileClient,/TURN ON MOBILE MODE\?/);
  assert.match(mobileClient,/TURN ON COMPUTER MODE\?/);
  assert.match(mobileClient,/setTimeout\(showInstallHelp, 80\)/);
  assert.match(mobileClient,/window\.navigator\.standalone/);
});

test("main menu uses one canvas-native profile/device control without legacy DOM modal",()=>{
  assert.match(mobileGame, /RR_MOBILE_MENU_UI/);
  assert.match(mobileGame, /rrDrawAvatarIcon/);
  assert.match(mobileGame, /rrDrawDeviceIcon/);
  assert.match(mobileGame, /RibbitRaceOpenProfileMenu\?\.\(\)/);
  assert.match(mobileGame, /RibbitRaceOpenDeviceMenu\?\.\(\)/);
  assert.match(polish170, /Canvas menu controls are painted into the game canvas|Main-menu account and device controls are painted into the canvas/);
  assert.doesNotMatch(polish170, /root\.appendChild\(account\)/);
});

test("Mobile Mode hides the legacy guest/fullscreen DOM toolbar",()=>{
  assert.match(css,/body\.rr-mobile-enabled #corner-controls\{display:none!important\}/);
});

test("iOS long-press magnifier and native selection are suppressed on the game canvas",()=>{
  assert.match(css,/-webkit-touch-callout:none/);
  assert.match(css,/touch-action:none/);
  for(const event of ["touchstart","touchmove","gesturestart","contextmenu","selectstart","dragstart"]){
    assert.match(mobileClient,new RegExp(`addEventListener\\(\\"${event}\\"`));
  }
  assert.match(mobileClient,/event\.preventDefault\(\)/);
});

test("Mobile meters retain gradient charge and independent pointer ownership",()=>{
  assert.match(mobileGame,/createLinearGradient/);
  assert.match(mobileGame,/RELEASE TO JUMP/);
  assert.match(mobileGame,/const rrMobileHeldPointers = new Map\(\)/);
  assert.match(mobileGame,/rrMobileHeldPointers\.set\(event\.pointerId/);
  assert.match(mobileGame,/rrMobileHeldPointers\.get\(event\.pointerId\)/);
  assert.match(mobileGame,/RR_MOBILE_PVP_METERS\[0\]/);
  assert.match(mobileGame,/RR_MOBILE_PVP_METERS\[1\]/);
});

test("mobile pause is drawn in Versus and routes through pauseGame",()=>{
  assert.match(mobileGame,/rrDrawMobilePauseButton\(\)/);
  assert.match(mobileGame,/rrOriginalDrawPvpHud/);
  assert.match(mobileGame,/pointInsideRect\(point, HUD_UI\.pauseButton\)/);
  assert.match(mobileGame,/pauseGame\(\)/);
});

test("letterboxed touchscreen coordinates are mapped through one cached content rectangle",()=>{
  assert.match(input,/function getCanvasPointMetrics\(\)/);
  assert.match(input,/const scale = Math\.min\(rect\.width \/ W, rect\.height \/ H\)/);
  assert.match(input,/offsetX: \(rect\.width - W \* scale\) \/ 2/);
  assert.match(input,/offsetY: \(rect\.height - H \* scale\) \/ 2/);
  assert.match(input,/requestAnimationFrame\(invalidateCanvasPointMetrics\)/);
});

test("mobile instructions do not tell players to use keyboard controls",()=>{
  assert.match(render,/HOLD THE JUMP METER/);
  assert.match(versus,/HOLD JUMP METER/);
  assert.match(versus,/HOLD P\$\{player\.index \+ 1\} JUMP BUTTON/);
  assert.match(render,/mobileHelp \? "P1: HOLD THE LEFT JUMP METER"/);
  assert.match(render,/mobileHelp \? "P2: HOLD THE RIGHT JUMP METER"/);
});

test("opponent frogs and flies lower the first-jump instruction bubble opacity",()=>{
  assert.match(versus,/const opponentBehind = Boolean/);
  assert.match(versus,/flyBehind \|\| jumpPreviewBehind \|\| opponentBehind \? 0\.25 : 1/);
});

test("Versus round results are awarded once and transition through a real result state",()=>{
  assert.match(versus,/pvpRoundAwardedToken === roundAwardToken/);
  assert.match(versus,/game\.state = "pvpCelebration"/);
  assert.match(versus,/game\.state = "won"/);
  assert.match(versus,/ribbit-pvp-round-ended/);
});

test("Mobile performance mode reduces render pixels, video recording and catch-up work",()=>{
  assert.match(core,/const RENDER_SCALE = RIBBIT_COARSE_TOUCH_DEVICE \? 2 : 4/);
  // Game-state replay snapshots replace expensive MediaRecorder videos.
  assert.doesNotMatch(extension,/new MediaRecorder/);
  assert.match(read("client/game/133-engine-replay.js"),/now-capture\.lastAt>=RIBBIT_REPLAY_FRAME_INTERVAL-\.6/);
  assert.match(input,/mobilePerformance \? 8 : 12/);
  assert.match(input,/accumulator = Math\.min\(accumulator, STEP \* 2\)/);
  assert.match(css,/100dvh/);
  assert.match(css,/safe-area-inset/);
});

test("hatstest unlocks only the Hats feature and no requirement needs online/human opponents",()=>{
  assert.match(core,/HATS_TEST_TOGGLE_CODE = "hatstest"/);
  const requirements=extension.slice(extension.indexOf("requirements(id"),extension.indexOf("requirementLines(id"));
  assert.doesNotMatch(requirements,/online/i);
  assert.doesNotMatch(requirements,/human opponent|human frog/i);
  assert.match(extension,/ribbit-hats-test-enabled/);
  assert.match(extension,/if\(!this\.progress\|\|\(this\.progress\.activityCount\|\|0\)<=0\)return/);
});

test("no-hat selection uses a dashed empty top-hat outline",()=>{
  assert.match(render,/function drawEmptyTopHatOutline/);
  assert.match(render,/Dashed crown outline/);
  assert.match(render,/Dashed brim outline/);
  assert.match(core,/name: "NO HAT"/);
});

test("runtime loops are throttled and replay recording is disabled on mobile",()=>{
  assert.match(extension,/setTimeout\(\(\)=>this\.tick\(\),250\)/);
  assert.match(extension,/setTimeout\(\(\)=>this\.tick\(\),750\)/);
  assert.doesNotMatch(extension,/requestAnimationFrame\(\(\)=>this\.tick\(\)\)/);
  assert.match(read("client/game/133-engine-replay.js"),/ribbitReplayCaptureTick/);
});
