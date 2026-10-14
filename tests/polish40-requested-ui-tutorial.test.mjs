import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(filename)=>readFileSync(new URL(`../${filename}`,import.meta.url),'utf8');
const ui=read('client/game/130-polish-ui-replay-language.js');
const menu=read('client/game/40-ui-navigation-audio.js');
const online=read('client/game/30-online-versus.js');
const sprites=read('client/game/71-rendering-entities-hud.js');
const scenes=read('client/game/122-tutorial-scenarios.js');
const lifecycle=read('client/game/123-tutorial-lifecycle.js');
const monitor=read('client/game/124-tutorial-monitoring.js');
const rendering=read('client/game/125-tutorial-rendering.js');
test('account/profile and computer icons shift three pixels with shared hit rects',()=>{
 assert.match(menu,/profileButton: Object\.freeze\(\{ id: "profile", x: 48/);
 assert.match(menu,/deviceButton: Object\.freeze\(\{ id: "device", x: 78/);
 assert.match(ui,/MAIN_PROFILE_BUTTON = MAIN_UI\.profileButton/);
 assert.match(ui,/MAIN_DEVICE_BUTTON = MAIN_UI\.deviceButton/);
});
test('pause and play use the chosen frog skin rather than fixed mint',()=>{
 const block=sprites.slice(sprites.indexOf('function drawHudPausePlaySprite'),sprites.indexOf('function draw',sprites.indexOf('function drawHudPausePlaySprite')+12));
 assert.match(block,/theme\.belly/); assert.match(block,/theme\.light/);assert.match(block,/theme\.dark/);
 assert.doesNotMatch(block,/#b8f5dc/);
});
test('player stats title, frog sprite and X share one centered header',()=>{
 assert.match(ui,/const headerTop=/);assert.match(ui,/const headerMid=/);assert.match(ui,/const frogScale=/);assert.match(ui,/const titleCenter=Math\.round/);assert.match(ui,/const close = \{ x:panel\.x \+ panel\.w - 32/);
});
test('leaderboard dropdown headings are left-aligned and vertically positioned',()=>{
 assert.match(ui,/drawBitmapText\(label, rect\.x \+ 8/);
 assert.match(ui,/rect\.y \+ 3, \.30, "left"/);
 assert.match(ui,/drawLevelUnlockIcon/);
});
test('refresh glyph and compact clapperboard stay in row footprint',()=>{
 assert.match(ui,/function drawLeaderboardRefreshIcon/);
 assert.match(ui,/function drawReplayIcon/);
 assert.match(ui,/ctx\.fillRect\(x-7, y-5, 14, 10\)/);
 assert.match(ui,/columns\.level-13/);
});
test('flashcards have card-flipping star, labelled back button and bottom-right help',()=>{
 for(const k of ['ICON_PREV','ICON_NEXT','ICON_SHUFFLE','"BACK"']) assert.ok(ui.includes(k));
 assert.match(ui,/help:Object\.freeze\(\{id:"help",x:380,y:222/);
 assert.match(ui,/star:Object\.freeze\(\{id:"star",x:378,y:88/);
 assert.match(ui,/moveToFlashcard\(polish\.flashcardIndex-1,-1,count\)/);
 assert.match(ui,/drawFlashcardStar\(starButton\.x\+starButton\.w\/2,starButton\.y\+starButton\.h\/2,starred\)/);
});
test('Frog Tags provide search and sorted opponent history',()=>{
 for(const s of ['battleSearch','sortedBattleEntries','searchOpen','battleHeaderRects','ratio','recent','name']) assert.ok(online.includes(s));
 assert.match(online,/battleView\.sort==='ratio'/);
});
test('Versus Current Goal may reach the right boundary without clipping',()=>{
 assert.match(rendering,/return \{ x:328, y:234, w:152, h:33 \}/);
});
test('poof before quick-drop and sky-bonk practice dialogue',()=>{
 for(const key of ['pvpDropLow','pvpDropHigh','pvpSkyBonk']) assert.ok(lifecycle.includes(`"${key}"`));
 assert.match(lifecycle,/setup === "pvpSkyBonk" \? 500 : 300/);
});
test('after high drop Ember uses the dazed portrait',()=>{
 assert.match(scenes,/pvpDropHigh/);assert.match(lifecycle,/dazed/);
});
test('buffered-bonk uses a re-aimed 80-percent charge for target moved left',()=>{
 assert.match(scenes,/scriptPvpChargedJump\(1, \.80, -1, 0\)/);
 assert.match(scenes,/PVP_START_X\[0\]/);
 assert.match(monitor,/setup === "pvpBufferedBonk"/);
});
test('buffered sky bonk launches top center to proven target facing left',()=>{
 assert.match(scenes,/case "pvpDemoBufferedSky"[\s\S]{0,300}positionPvpOnPlatform\(ember, top, 1\)/);
 assert.match(scenes,/rightMiddle\.x \+ rightMiddle\.w - p1\.w \+ 2/);
});
test('sky bonk dialogue only waits for impact plus attacker landing',()=>{
 assert.match(scenes,/const bonkImpactReady = tutorial\.pvpDemoBonkAt > 0/);
 assert.match(monitor,/pvpPracticeEventReady\(100, now\)/);
});
