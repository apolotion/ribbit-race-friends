import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(join(root,p),'utf8');
const ui=read('client/game/130-polish-ui-replay-language.js');
const game=read('client/game/30-online-versus.js');
const tags=read('client/game/110-online-mobile-polish.js');
const hub=read('src/hub.js');
const replay=read('public/scripts/extended-features.js');
const menus=read('client/game/73-rendering-menus-overlays.js');
const states=read('client/game/40-ui-navigation-audio.js');
const startup=read('client/game/80-input-loop-startup.js');
test('ten different 28x28 PNG medal sprite options ship with fitted default',()=>{
 const names=['smile','laurel','frog','star','crown','trophy','check','lightning','spiral','gem'];
 for(const n of names){
   const p=join(root,'public/icons/medal-options',n+'.png');
   const data=readFileSync(p);
   assert.equal(data.readUInt32BE(16),28,n+' width');
   assert.equal(data.readUInt32BE(20),28,n+' height');
 }
 assert.ok(statSync(join(root,'public/icons/leaderboard-medal.png')).size>100);
 assert.match(ui,/leaderboardMedalSprite|leaderboard-medal/);
});
test('leaderboard names open a stat-card screen with an X and two pages, not replay',()=>{
 assert.match(ui,/function leaderboardPlayerMetrics\(/);
 assert.match(ui,/drawStatsMetricIcon\(/);
 assert.match(ui,/const close = \{ x:panel\.x \+ panel\.w - 32, y:panel\.y \+ 9, w:20, h:20 \}/);
 assert.match(ui,/if \(name\) \{ openLeaderboardStats\(name.row\); return; \}/);
});
test('leaderboard level filtering uses short flat mini-label and level-specific sprite',()=>{
 assert.match(ui,/const headerH = 5/);
 assert.match(ui,/drawLevelUnlockIcon\(entry,/);
 assert.match(ui,/drawLevelUnlockIcon\(polish.leaderboardLevel,/);
});
test('Worker returns a replay availability map for saved personal best recordings',()=>{
 assert.match(hub,/SELECT uid,level,metric FROM record_replays/);
 assert.match(hub,/replayAvailable/);
 assert.match(ui,/serverReplayAvailable/);
 assert.match(ui,/playLeaderboardRecord\(replay.row\)/);
 assert.match(replay,/ribbit-replay-uploaded/);
});
test('Account menu uses five in-bounds options with distinct icon art',()=>{
 assert.match(ui,/x:91, y:78\+index\*30, w:298/);
 assert.match(ui,/function drawProfileOptionIcon\(/);
 for(const id of ['language','flashcards','manage','signout'])assert.ok(ui.includes('kind==="'+id+'"'));
 assert.match(ui,/else \{r\(-1,-2,8,4\)/);
});
test('flashcards flip on a timer onto frog secondary color; star, shuffle and remember fronts',()=>{
 assert.match(ui,/flashcardFlipAt/);
 assert.match(ui,/Math\.abs\(Math\.cos\(Math\.PI\*flipT\)\)/);
 assert.match(ui,/mixHexColors\(skin\.mid/);
 assert.match(ui,/FLASHCARD_STARS_KEY/);
 assert.match(ui,/rebuildFlashcardDeck/);
 assert.match(ui,/resetFlashcardFace\(\)/);
 assert.match(ui,/flashcardComplete=true/);
 for(const key of ['KeyS','Slash','KeyH','KeyV','Space','ArrowLeft','ArrowRight','Backspace'])assert.ok(ui.includes(key),key);
});
test('hat unlock events never display a toast',()=>{
 assert.doesNotMatch(replay,/toast\(["']HAT[S]? UNLOCKED/);
 assert.match(menus,/if \(game\.achievementToastHatId\) return;/);
 assert.match(states,/entry\.type === "hat"/);
 assert.doesNotMatch(startup,/type: "hat", hatId/);
});
test('solo and versus tutorial menu books share the pause art',()=>{
 assert.match(menus,/function drawMiniTutorialBookIcon\([\s\S]{0,175}drawMiniBookIcon\(cx, cy, getPauseBookTheme\(false\)\)/);
});
test('Frog Tags shows frog, last played, replay camera and bottom-aligned navigation',()=>{
 for(const s of ['drawMiniFrogSwatchFacing','LAST PLAYED','recentBattleReplay','battleReplayRects','playBattleReplay'])assert.ok(game.includes(s),s);
 assert.match(game,/battlePrev[\s\S]{0,80}y:231/);
 assert.match(game,/battleNext[\s\S]{0,80}y:231/);
 assert.match(game,/battleTags[\s\S]{0,400}x:184,y:231,w:112,h:23/);
 assert.match(game,/cancel:\{x:184,y:231,w:112,h:23\}/);
 assert.match(tags,/p\.x>=378/);
});
