import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ui=readFileSync('client/game/130-polish-ui-replay-language.js','utf8');
const engine=readFileSync('client/game/133-engine-replay.js','utf8');
const sounds=readFileSync('client/game/40-ui-navigation-audio.js','utf8');
const layout=readFileSync('public/styles/rr-170.css','utf8');
const uploader=readFileSync('public/scripts/extended-features.js','utf8');

test('flashcard counter and language are both inside the bottom edge of each card',()=>{
 assert.match(ui,/drawBitmapText\(`\$\{index\+1\} \/ \$\{count\}`,card\.x\+14,card\.y\+85/);
 assert.match(ui,/drawBitmapText\(label,W\/2,card\.y\+85/);
 assert.doesNotMatch(ui,/ENGLISH FRONT|TARGET LANGUAGE/);
});

test('completing full deck offers all and starred and prioritizes starred for Space or Next',()=>{
 assert.match(ui,/STUDY STARRED TERMS/);
 assert.match(ui,/RESTART ALL TERMS/);
 assert.match(ui,/flashcardCompletionSelection=!availableStarredFlashcardCount\(\)\?"all":"starred"/);
 assert.match(ui,/function completeFlashcardSession\(/);
 assert.match(ui,/if\(polish\.flashcardOnlyStarred\)\{[\s\S]{0,160}completeFlashcardSession\("all"\)/);
});

test('unstarring within starred deck never removes card from the frozen review order',()=>{
 assert.match(ui,/const order=polish\.flashcardOrder\.filter/);
 const start=ui.indexOf('}else if(id==="star"){');
 const section=ui.slice(start,ui.indexOf('}else if(polish.flashcardComplete){',start));
 assert.match(section,/marked\.delete\(key\)/);
 assert.match(section,/polish\.flashcardStars=\[\.\.\.marked\]/);
 assert.doesNotMatch(section,/rebuildFlashcardDeck/);
});

test('language panel has two centered, separately clickable language selectors and a compact swap arrow',()=>{
 assert.match(ui,/Object\.freeze\(\{ id:"spoken", label:"I SPEAK\.\.\." \}\)/);
 assert.match(ui,/Object\.freeze\(\{ id:"learning", label:"I'M LEARNING\.\.\." \}\)/);
 assert.match(ui,/const LANGUAGE_SWAP_RECT/);
 assert.match(ui,/drawLanguageSwapArrow\(polish\.languageSelection===-1\)/);
 assert.match(ui,/getLanguagePickerRects/);
 assert.match(ui,/function openLanguagePicker\(/);
 assert.match(ui,/const innerCenter=rect\.y\+\(rect\.h\+7\)\/2/);
 assert.match(ui,/const centerY=rect\.y\+\(rect\.h\+7\)\/2/);
 assert.match(ui,/const header = \{ x:panel\.x\+14, y:panel\.y\+10, w:panel\.w-28, h:34 \}/);
});

test('spectator HUD is outside the canvas and sampling preserves all cutscene state',()=>{
 assert.match(layout,/#game-frame\.rr-replay-layout/);
 assert.match(layout,/grid-template-rows/);
 assert.match(layout,/#rr-spectator-toolbar/);
 assert.match(engine,/host\.append\(header,footer\)/);
 for(const field of ['soloCriticalCatchActive','soloCriticalCatchElapsed','pvpCriticalCatchActive','pvpCriticalCatchElapsed'])assert.ok(engine.includes(field));
 assert.match(engine,/window\.RibbitRaceFinalCatchLabelsGone=false/);
 assert.match(engine,/tongue:\{\.\.\.tongue\}/);
 assert.match(engine,/const RIBBIT_REPLAY_FPS = 60/);
 assert.match(engine,/const RIBBIT_REPLAY_DANCE_MILLIS = 3000/);
 assert.match(uploader,/await window\.RibbitEngineReplay\?\.whenComplete\?\.\(\)/);
 assert.match(sounds,/window\.RibbitReplaySoundCapture\?\.\(/);
});

test('spectator playback supports freeze-until-release, frame stepping, 10-second skips, speed toggles and native fullscreen',()=>{
 for(const key of ['KeyJ','KeyL','KeyF','KeyR','Comma','Period','Digit','pointerdown','pointerup','pointercancel'])assert.ok(engine.includes(key));
 assert.match(engine,/view\.scrubbing=true;view\.wasPaused=view\.paused;view\.paused=true/);
 assert.match(engine,/view\.scrubbing=false;view\.paused=view\.wasPaused/);
 assert.match(engine,/ribbitReplaySeek\(view\.position\/1000-10\)/);
 assert.match(engine,/ribbitReplaySeek\(view\.position\/1000\+10\)/);
 assert.match(engine,/ribbitReplaySeek\(\(view\.position\+\(1000\/RIBBIT_REPLAY_FPS\)\)\/1000\)/);
 assert.match(engine,/ribbitReplaySeek\(\(view\.position-\(1000\/RIBBIT_REPLAY_FPS\)\)\/1000\)/);
 assert.match(engine,/view\.rate=view\.rate===4\?1:4/);
 assert.match(engine,/clamp\(Math\.round\(\(ribbitReplayView\.rate\+step\)\*4\)\/4,\.25,2\)/);
 assert.match(engine,/else if\(key==="KeyF"\)toggleRibbitFullscreen\(\)/);
});
