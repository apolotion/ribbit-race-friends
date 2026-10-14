import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { readGameModuleGroup } from "./source-reader.mjs";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const online = read('client/game/30-online-versus.js');
const tutorial = readGameModuleGroup(120, 139);
const rendering = readGameModuleGroup(70, 79);
const nav = read('client/game/40-ui-navigation-audio.js');
const versus = readGameModuleGroup(60, 69);
const config = read('client/game/10-core-config.js');

function decodeRgbaPng(file) {
  const input = fs.readFileSync(file);
  assert.equal(input.subarray(1, 4).toString('ascii'), 'PNG');
  let offset = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const chunks = [];
  while (offset < input.length) {
    const length = input.readUInt32BE(offset); offset += 4;
    const type = input.subarray(offset, offset + 4).toString('ascii'); offset += 4;
    const data = input.subarray(offset, offset + length); offset += length + 4;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
    } else if (type === 'IDAT') chunks.push(data);
    else if (type === 'IEND') break;
  }
  assert.equal(bitDepth, 8);
  assert.equal(colorType, 6);
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const bpp = 4, stride = width * bpp;
  const pixels = Buffer.alloc(stride * height);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = raw.subarray(src, src + stride); src += stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= bpp ? pixels[y * stride + x - bpp] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upLeft = y > 0 && x >= bpp ? pixels[(y - 1) * stride + x - bpp] : 0;
      let value = row[x];
      if (filter === 1) value = (value + left) & 255;
      else if (filter === 2) value = (value + up) & 255;
      else if (filter === 3) value = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
        value = (value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255;
      } else assert.equal(filter, 0);
      pixels[y * stride + x] = value;
    }
  }
  return { width, height, pixels };
}

test('Online entry order, room display-name button, and leave flow match the requested design', () => {
  assert.match(online, /const ONLINE_HUB=\[[\s\S]*?id:'quick'[\s\S]*?id:'spectate'[\s\S]*?id:'host'[\s\S]*?id:'join'[\s\S]*?id:'profile'[\s\S]*?id:'battle'/);
  assert.match(online, /spec\('profile','',PVP_SETUP_UI\.tutorialButton/);
  assert.match(online, /function drawRoomProfileButton[\s\S]*?rgba\(25,43,52,0\.28\)[\s\S]*?drawOnlineIcon\('palette'/);
  assert.match(online, /function leaveRoom\(\)[\s\S]*?cleanup\(false\);[\s\S]*?open\(\);[\s\S]*?state\.screen='entry'/);
});

test('Only the first Online page draws a fixed-size centered help bubble and Back has no popup', () => {
  assert.match(online, /function drawOnlineTooltip\(\)[\s\S]*?state\.screen!=="entry"/);
  assert.match(online, /if\(!b\?\.tip\|\|b\.id==="back"\)return/);
  assert.match(online, /const width=Math\.ceil\(widest\+18\)[\s\S]*?height=Math\.max\(22/);
  assert.match(online, /const cx=b\.x\+b\.w\/2/);
  assert.match(online, /id:'back'[\s\S]{0,120}tip:''/);
  assert.doesNotMatch(tutorial, /function getSpec\(\)[\s\S]*?function bubble\(spec\)/);
});

test('Pause utility buttons are flush, Fullscreen stays available beside the book, and tutorial labels are renamed', () => {
  assert.match(rendering, /Pause utility icons sit flush inside the panel without external drop shadows/);
  assert.match(tutorial, /function getPauseFullscreenRect\(\)/);
  assert.match(tutorial, /return PAUSE_FULLSCREEN_BUTTON;/);
  assert.match(rendering, /"RESTART SCENE"/);
  assert.match(rendering, /"EXIT TUTORIAL"/);
  assert.match(nav, /captureSoloFrozenWorld\(\)[\s\S]*?startResumeCountdown\(\)/);
});

test('Hat selector preserves locked requirements, uses live achievement-style unlocks, and has the base-color achievement', () => {
  assert.match(rendering, /Locked hats remain informational/);
  assert.match(rendering, /game\.customHatHoveredIndex = Math\.max\(0, lockedIndex\)/);
  assert.match(rendering, /playLockedSkinSound\(\)/);
  assert.match(rendering, /achievementToastHatId/);
  assert.match(tutorial, /queueAchievementToast\?\.\(\{ type:"hat", hatId \}\)/);
  assert.match(tutorial, /roundUnlockedHatIds/);
  assert.match(config, /id:\s*"all-frog-colors",\s*name:\s*"RAINBOW POND"/);
});

test('Custom Frog has random/template tools with history and hover labels', () => {
  assert.match(tutorial, /const CUSTOM_RANDOM_BUTTON/);
  assert.match(tutorial, /function randomizeCustomPalette[\s\S]*?beginCustomColorHistoryTransaction\(\)[\s\S]*?commitCustomColorHistoryTransaction\(\)/);
  assert.match(tutorial, /Pixel die: show, don't tell/);
  assert.match(tutorial, /"RANDOMIZE"/);
  assert.match(tutorial, /"CHOOSE TEMPLATE"/);
  assert.doesNotMatch(tutorial, /drawSpeechBubble\([^\n]*"UNDO"/);
  assert.doesNotMatch(tutorial, /drawSpeechBubble\([^\n]*"REDO"/);
  assert.match(tutorial, /CHOOSE BASE FROG/);
});

test('All packaged Ember portraits share the requested blue background', () => {
  const dir = path.join(root, 'public/tutorial');
  const files = fs.readdirSync(dir).filter((name) => /^ember-.*\.png$/.test(name));
  assert.ok(files.length >= 12);
  for (const name of files) {
    const { pixels } = decodeRgbaPng(path.join(dir, name));
    let matchingBlue = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] === 3 && pixels[i + 1] === 145 && pixels[i + 2] === 226 && pixels[i + 3] === 255) matchingBlue++;
    }
    assert.ok(matchingBlue > 5000, `${name} does not use the common Ember blue background`);
  }
});

test('Ember dialogue uses authored sentence-specific orange emphasis', () => {
  assert.match(tutorial, /function drawEmberDialogueLine/);
  assert.match(tutorial, /TUTORIAL_EMPHASIS_BY_LINE/);
  assert.match(tutorial, /tutorialDialogueEmphasisRanges\(spokenLine\)/);
  assert.match(tutorial, /orangeRange \? "#ff9b45" : COLORS\.white/);
  assert.doesNotMatch(tutorial, /const emphasis = \/RIBBIT RACE\|EMBER/);
});

test('Solo tutorial preserves the prompt shell, dynamic scene targets, prompt timing, and persistent goals', () => {
  assert.match(tutorial, /function drawBlankTutorialVocabularyPrompt[\s\S]*?"FIND THE MATCH"/);
  assert.match(tutorial, /tutorialDisplayCatchTarget[\s\S]*?threeCatches:3[\s\S]*?comboTwo:2[\s\S]*?comboThree:3[\s\S]*?normalRound:5/);
  assert.match(tutorial, /tutorial\.sceneLandingDelayUntil = now \+ 250/);
  assert.match(tutorial, /A scene's objective remains visible[\s\S]*?currentGoalLines/);
  assert.match(tutorial, /When the clue changes, come back and catch the fly you left behind!/);
  assert.match(tutorial, /If you get lucky, you might catch two flies in one jump!/);
  assert.match(tutorial, /The only way that you can turn around is by bouncing off of a wall\./);
  assert.match(tutorial, /Miss a fly, and you'll need to hit a wall to head back for it\./);
});

test('Tutorial progression cannot write ordinary hats, stats, jumps, or achievements', () => {
  assert.match(tutorial, /function tutorialTrainingSessionActive\(\)/);
  for (const fn of ['recordFlyEaten', 'recordCorrectCatchForAchievements', 'saveTotalFlyCount', 'saveTotalJumpCount', 'saveStatsProfile']) {
    assert.match(tutorial, new RegExp(`${fn} = function\\([\\s\\S]{0,180}tutorialTrainingSessionActive\\(\\)`));
  }
  assert.match(tutorial, /trainingSession && !\[TUTORIAL_ACHIEVEMENT_ID, PVP_TUTORIAL_ACHIEVEMENT_ID\]\.includes\(id\)/);
  assert.match(tutorial, /if \(game\.tutorialActive \|\| window\.RibbitRaceTutorialEngine\?\.active\) return false/);
});

test('Versus remembers both frogs and supports close-contest and last-second cinematic catches', () => {
  assert.match(nav, /ribbitRaceLastVersusFrogsV1/);
  assert.match(nav, /const persistedSkins = readLastPvpSkinSelections\(\)/);
  assert.match(nav, /game\.pvpSetupSkinIds = \[p1, p2\]/);
  assert.match(nav, /saveLastPvpSkinSelections\(game\.pvpSetupSkinIds\)/);
  assert.match(versus, /function pvpFlyContestIsClose/);
  assert.match(versus, /game\.pvpTimeRemaining\) > 0 && Number\(game\.pvpTimeRemaining\) <= 1\.0/);
  assert.match(versus, /if \(reachedTarget\) return "final"/);
  assert.match(versus, /if \(lastSecondCatch\) return "clutch"/);
  assert.match(versus, /return "contest"/);
  assert.match(versus, /game\.pvpCriticalCatchKind === "final" \? "FINAL CATCH!"/);
  assert.match(versus, /game\.pvpCriticalCatchKind === "contest" \? "CLOSE CATCH!"/);
  assert.match(versus, /const clockDt = game\.pvpCriticalCatchActive \? 0 : dt/);
});
