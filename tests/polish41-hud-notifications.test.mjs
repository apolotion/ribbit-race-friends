import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../client/game/73-rendering-menus-overlays.js', import.meta.url), 'utf8');
const bundle = readFileSync(new URL('../public/scripts/game.bundle.js', import.meta.url), 'utf8');
const toastSource = source.split('function drawAchievementToast() {')[1]?.split('function drawVictoryScreen()')[0];

test('achievement notifications share the score/pause HUD row, away from the map', () => {
  assert.ok(toastSource, 'toast renderer exists');
  assert.match(toastSource, /const top = 4;/);
  assert.match(toastSource, /const height = 23;/);
  assert.match(toastSource, /const hudSafeWidth = Math\.max\(178, W - 172\);/);
  assert.match(bundle, /const top = 4;/);
});

test('sun notification has a square badge separated from its text', () => {
  assert.match(toastSource, /const badgeSize = height - 4;/);
  assert.match(toastSource, /ctx\.fillRect\(badgeX, badgeY, badgeSize, badgeSize\);/);
  assert.match(toastSource, /drawMiniSun\(left \+ 16, top \+ 11, false\);/);
  assert.match(toastSource, /const textLeft = left \+ 34;/);
  assert.match(toastSource, /const textWidth = width - 39;/);
  assert.doesNotMatch(toastSource, /ctx\.fillRect\(left \+ 7, top \+ 7, 30, height - 14\)/);
});

test('two-line achievement and skin unlocks remain inside reduced HUD height', () => {
  assert.match(toastSource, /drawBitmapText\("ACHIEVEMENT!", left \+ 123, top \+ 3, 0\.8/);
  assert.match(toastSource, /drawBitmapText\(definition\.name, left \+ 123, top \+ 13, nameScale/);
  assert.match(toastSource, /drawBitmapText\("FROG UNLOCKED!", left \+ 121, top \+ 3, 0\.8/);
});
