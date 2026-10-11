import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(path,"utf8");
const html=read("public/index.html");
const mobileClient=read("public/scripts/mobile-experience.js");
const mobileGame=read("client/game/100-mobile-experience.js");
const core=read("client/game/10-core-config.js");
const render=read("client/game/70-rendering.js");
const versus=read("client/game/60-versus-gameplay.js");
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

test("main menu has canvas-native account and phone-computer controls",()=>{
  assert.match(mobileGame,/RR_MOBILE_MENU_UI/);
  assert.match(mobileGame,/rrDrawAvatarIcon/);
  assert.match(mobileGame,/rrDrawDeviceIcon/);
  assert.match(mobileGame,/ACCOUNT • SAVES • RECORDS/);
  assert.match(mobileGame,/SWITCH TO MOBILE MODE/);
  assert.match(mobileGame,/SWITCH TO COMPUTER MODE/);
  assert.match(mobileGame,/RibbitMobileExperience\?\.openAccount/);
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

test("letterboxed touchscreen coordinates are mapped into the 480 by 270 game area",()=>{
  assert.match(input,/const scale = Math\.min\(rect\.width \/ W, rect\.height \/ H\)/);
  assert.match(input,/const offsetX = \(rect\.width - contentWidth\) \/ 2/);
  assert.match(input,/const offsetY = \(rect\.height - contentHeight\) \/ 2/);
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
  assert.match(extension,/const mobile=window\.RibbitMobileExperience/);
  assert.match(extension,/if\(mobile&&this\.recorder\)/);
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
  assert.match(extension,/const single=!mobile/);
});
