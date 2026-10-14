import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(name, 'utf8');
const labels = read('client/game/71-rendering-entities-hud.js');
const update = read('client/game/130-polish-ui-replay-language.js');
const replay = read('client/game/133-engine-replay.js');
const versus = read('client/game/63-versus-rendering-ui.js');
const online = read('client/game/30-online-versus.js');
const solo = read('client/game/80-input-loop-startup.js');
const hooks = read('client/game/115-v170-hooks.js');
const legacy = read('client/game/110-online-mobile-polish.js');
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function makeLabelOpacity(game, progress) {
  const start = labels.indexOf('    function getCriticalCatchWordFade() {');
  const end = labels.indexOf('\n    function drawFlyNameTag(', start);
  assert.ok(start >= 0 && end > start);
  const body = labels.slice(start, end);
  return new Function('game', 'clamp', 'getSoloCriticalCatchVisuals', 'getPvpCriticalCatchVisuals',
    `${body}\nreturn getCriticalCatchWordFade;`)(game, clamp, () => ({progress:progress.value}), () => ({progress:progress.value}));
}

function makeUpdate(game, state) {
  const start = update.indexOf('  const originalUpdatePolish8 = update;');
  const end = update.indexOf('\n  const originalDrawScenePolish8',start);
  assert.ok(start >= 0 && end > start);
  return new Function('game', 'polish', 'flushPendingHatNotices', 'archiveOnlineRound',
    `let update=()=>undefined;\n${update.slice(start,end)}\nreturn update;`
  )(game,state,()=>{},()=>{});
}

function makeLegacyReplayOpacity() {
  const start = replay.indexOf('function legacyReplayFlyLabelReturnAlpha(');
  const end = replay.indexOf('\nfunction paintRibbitReplayStage()',start);
  assert.ok(start >= 0 && end > start);
  return new Function('clamp',`${replay.slice(start,end)}\nreturn legacyReplayFlyLabelReturnAlpha;`)(clamp);
}

test('Polish 50 uses current cache marker and a 0.42-second return fade', () => {
  assert.equal(JSON.parse(read('package.json')).version, '1.7.40');
  assert.match(read('src/common.js'), /2026\.10\.13-friends-polish-52/);
  assert.match(update, /Math\.max\(0, dt\) \/ 0\.42/);
  assert.match(labels, /const returnOpacity = recovery \* recovery \* \(3 - 2 \* recovery\)/);
});

test('mid-round Versus zoom fades all words out and then steadily restores them', () => {
  const game = {mode:'pvp', state:'playing', pvpCriticalCatchActive:false, flyLabelReturnAlpha:1};
  const polish = {priorCriticalCatch:false};
  const tick = makeUpdate(game, polish);
  const progress = {value:0};
  const alpha = makeLabelOpacity(game,progress);
  assert.equal(alpha(),1);
  game.pvpCriticalCatchActive = true;
  tick(1/60);
  progress.value=.22;
  assert.ok(alpha()>0.65 && alpha()<1,'labels begin fading while the zoom starts');
  progress.value=.66;
  assert.equal(alpha(),0,'labels disappear only during the cinematic');
  game.pvpCriticalCatchActive = false;
  tick(1/60);
  assert.equal(alpha(),0,'labels do not flash fully visible in the first post-zoom frame');
  let previous = 0;
  for(let frame=1; frame<=25; frame++) {
    tick(1/60);
    const current = alpha();
    assert.ok(current >= previous && current <= 1,`frame ${frame}: fade must increase`);
    if(frame<25)assert.ok(current < 1,`frame ${frame}: fade should not instantly finish`);
    previous = current;
  }
  tick(1/60);
  assert.equal(alpha(),1,'all surviving fly tags are fully restored and stay restored');
  for(let frame=0;frame<60;frame++)tick(1/60);
  assert.equal(alpha(),1,'fly meaning cannot disappear permanently later in the round');
});

test('back-to-back zooms never flash labels back at full opacity', () => {
  const game = {mode:'pvp', state:'playing',pvpCriticalCatchActive:false,flyLabelReturnAlpha:1};
  const state = {priorCriticalCatch:false};
  const tick=makeUpdate(game,state);
  const progress={value:1};
  const opacity=makeLabelOpacity(game,progress);
  game.pvpCriticalCatchActive=true;
  tick(1/60);
  game.pvpCriticalCatchActive=false;
  tick(1/60);
  for(let i=0;i<8;i++)tick(1/60);
  const partial=opacity();
  assert.ok(partial>0 && partial<1);
  game.pvpCriticalCatchActive=true;
  progress.value=0;
  tick(1/60);
  assert.ok(opacity()<=partial+1e-10,'the next zoom preserves the partly faded value');
  progress.value=.65;
  assert.equal(opacity(),0);
  game.pvpCriticalCatchActive=false;
  tick(1/60);
  for(let i=0;i<26;i++)tick(1/60);
  assert.equal(opacity(),1,'the second zoom also restores its labels');
});

test('solo final zoom also restores term plates rather than leaving legacy hiding flags', () => {
  const game={mode:'solo',state:'playing',soloCriticalCatchActive:true,flyLabelReturnAlpha:1};
  const state={priorCriticalCatch:true};
  const tick=makeUpdate(game,state);
  const progress={value:0.75};
  const opacity=makeLabelOpacity(game,progress);
  assert.equal(opacity(),0);
  game.soloCriticalCatchActive=false;
  tick(1/60);
  assert.equal(opacity(),0);
  for(let i=0;i<26;i++)tick(1/60);
  assert.equal(opacity(),1);
  assert.match(legacy,/RibbitV160ShouldHideFlyLabels=\(\)=>false/);
  assert.doesNotMatch(hooks,/requestAnimationFrame\(finalCatchGuard\)/);
});

test('all gameplay modes keep drawing their fly tags after the cinematic ends', () => {
  assert.match(versus,/drawFlyAt\(fly\.x, fly\.y, getFlySpawnScale\(fly\)\);\s*drawFlyNameTag\(fly\);/);
  assert.match(online,/drawFlyNameTag\(f\);/);
  assert.match(solo,/drawFlyAt\(currentFly\.x, currentFly\.y, getFlySpawnScale\(currentFly\)\);\s*drawFlyNameTag\(currentFly\);/);
  assert.doesNotMatch(labels,/RibbitV160ShouldHideFlyLabels/);
  assert.doesNotMatch(versus,/if \(!window\.RibbitRaceFinalCatchLabelsGone\)/);
  assert.doesNotMatch(update,/window\.RibbitRaceFinalCatchLabelsGone = true/);
});

test('new replays record the fade; old replays infer a smooth fade during scrubbing', () => {
  assert.match(replay,/"flyLabelReturnAlpha"/);
  assert.match(replay,/game\.flyLabelReturnAlpha=legacyReplayFlyLabelReturnAlpha\(view\.position,data\.frames\)/);
  const legacyAlpha=makeLegacyReplayOpacity();
  const frames=[
    {t:0,gameState:{pvpCriticalCatchActive:true}},
    {t:460,gameState:{pvpCriticalCatchActive:true}},
    {t:480,gameState:{pvpCriticalCatchActive:false}},
    {t:700,gameState:{pvpCriticalCatchActive:false}},
    {t:950,gameState:{pvpCriticalCatchActive:false}}
  ];
  assert.equal(legacyAlpha(480,frames),0);
  assert.ok(legacyAlpha(600,frames)>0 && legacyAlpha(600,frames)<1);
  assert.equal(legacyAlpha(950,frames),1);
  assert.equal(legacyAlpha(1300,frames),1);
  assert.equal(legacyAlpha(600,frames),legacyAlpha(600,frames),'repeat seeks are deterministic');
});
