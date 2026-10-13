import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectFile as read} from './source-reader.mjs';

const polish=read('client/game/130-polish-ui-replay-language.js');
const rr170=read('public/scripts/rr-170-polish.js');
const css=read('public/styles/rr-170.css');
const mobile=read('client/game/100-mobile-experience.js');
const hud=read('client/game/71-rendering-entities-hud.js');
const navigation=read('client/game/40-ui-navigation-audio.js');

function section(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,`Missing ${start} .. ${end}`);
 return source.slice(a,b);
}

test('Old DOM Roman-numeral pause and duplicate main-menu icons no longer exist',()=>{
 const controls=section(rr170,'function installOverlayControls()','function installSpectatorPresentation()');
 assert.doesNotMatch(controls,/createElement\(["']button["']\)/);
 assert.match(controls,/qs\("#rr170-pause"\)\?\.remove\(\)/);
 assert.match(rr170,/qs\("#rr170-account-icon"\)\?\.remove\(\)/);
 assert.match(css,/#rr170-pause[\s\S]{0,130}display\s*:\s*none\s*!important/);
});

test('Versus pause bars use the same dark, light, mid two-bar drawing as Solo',()=>{
 const draw=section(polish,'function drawPvpPauseButtonPolish8()','// Own exactly one contextual');
 assert.match(draw,/for \(const dx of \[7, 15\]\)/);
 assert.match(draw,/ctx\.fillRect\(rect\.x \+ dx, rect\.y \+ 5, 4, 12\)/);
 assert.doesNotMatch(draw,/fillRect\(rect\.x, rect\.y, rect\.w, rect\.h\)/);
});

test('Mouse profile and computer buttons route to the same canvas menus as keyboard',()=>{
 assert.match(mobile,/window\.RibbitRaceOpenProfileMenu\?\.\(\)/);
 assert.match(mobile,/window\.RibbitRaceOpenDeviceMenu\?\.\(\)/);
 const profile=section(polish,'function openProfileMenu()','function openFlashcardsMenu()');
 assert.match(profile,/game\.state\s*=\s*"rrProfileMenu"/);
 assert.match(profile,/rr-account-modal-open/);
 assert.doesNotMatch(mobile,/openAccount\(\)/);
});

test('Profile menu mouse fallback stays within canvas, so blurred overlay cannot trap clicks',()=>{
 assert.match(polish,/if \(game\.state === "main" && pointIn\(point, MAIN_PROFILE_BUTTON\)\)/);
 assert.match(polish,/event\.stopImmediatePropagation\(\); openProfileMenu\(\); return;/);
 assert.match(css,/#rr170-account-icon/);
});

test('Flash cards never print answer on front or outside the bounded card',()=>{
 const flash=section(polish,'function drawFlashcardsMenu()','function drawDeviceModeIcon(');
 assert.match(flash,/measureBitmapText\(value,1\)/);
 assert.match(flash,/ctx\.clip\(\)/);
 assert.match(flash,/FLIP CARD/);
 assert.doesNotMatch(flash,/OTHER SIDE:/);
 assert.doesNotMatch(flash,/ARROWS TO BROWSE/);
});

test('Flash controls reserve left/right for browsing, Space for flip and Backspace for profile',()=>{
 const key=polish.slice(polish.indexOf('window.addEventListener("keydown"'));
 assert.match(key,/"ArrowLeft","ArrowRight"/);
 assert.match(key,/activateFlashcardButton\(2\)/);
 assert.match(key,/"Space","Enter","NumpadEnter"/);
 assert.match(key,/["Escape","Backspace"]/);
 assert.match(key,/Up\/Down deliberately do nothing/);
 assert.doesNotMatch(key,/flashcardSelection\s*=/);
});

test('Leaderboard completely repaints its background gradient and no longer has a huge black shadow',()=>{
 const leader=section(polish,'function drawLeaderboardScreen()','async function playLeaderboardRecord(');
 assert.match(leader,/ctx\.createLinearGradient\(0, 0, 0, H\)/);
 assert.doesNotMatch(leader,/rgba\(12,26,33,0\.34\)/);
 assert.match(leader,/rgba\(12,26,33,0\.12\)/);
 assert.match(leader,/large opaque charcoal box/);
});

test('A missing Solo palette variable cannot crash the level-start rendering flow',()=>{
 const palette=section(hud,'function getFrogPalette()','function drawCatchSparkles()');
 assert.match(palette,/const skin\s*=\s*getSelectedSkin\(\)/);
 assert.doesNotMatch(palette,/const pauseSkin\s*=/);
 assert.doesNotMatch(palette,/return \{\s*dark:pauseSkin\.dark/);
});

test('Versus WiFi/tutorial setup controls have left margin and independent click hit targets',()=>{
 assert.match(navigation,/wifiButton: Object\.freeze\(\{ x: 36, y: 225, w: 24, h: 24 \}\)/);
 assert.match(navigation,/tutorialButton: Object\.freeze\(\{ x: 66, y: 225, w: 24, h: 24 \}\)/);
});

test('Fullscreen is placed inside pause help at the requested blue-square position without a drop shadow',()=>{
 assert.match(polish,/PAUSE_FULLSCREEN_BUTTON\s*=\s*Object\.freeze\(\{\s*x:\s*379,\s*y:\s*198/);
 assert.match(polish,/function getPauseFullscreenRect\(\)[\s\S]{0,250}return PAUSE_FULLSCREEN_BUTTON/);
 const draw=section(polish,'function drawPauseFullscreenButton()','function isOnlineMenuVisible()');
 assert.match(draw,/No offset shadow/);
 assert.doesNotMatch(draw,/rect\.x \+ 2, rect\.y \+ 2, rect\.w, rect\.h/);
});
