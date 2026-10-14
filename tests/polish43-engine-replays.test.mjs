import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = (path) => readFileSync(path,'utf8');
const engine=source('client/game/133-engine-replay.js');
const hooks=source('client/game/126-tutorial-hooks.js');
const captions=source('client/game/125-tutorial-rendering.js');
const lessons=source('client/game/122-tutorial-scenarios.js');
const startup=source('client/game/80-input-loop-startup.js');
const recorder=source('public/scripts/extended-features.js');
const online=source('client/game/110-online-mobile-polish.js');
const worker=source('src/hub.js');

test('new replay captures compact real-game frog and fly state, not recorded browser video',()=>{
  assert.match(engine,/kind:"ribbit-engine-frames"/);
  assert.match(engine,/captureRibbitReplaySnapshot\(now\)/);
  assert.match(engine,/pvpPlayers\.map\(captureRibbitReplayPlayer\)/);
  assert.match(engine,/flies\.filter\(fly=>fly/);
  assert.doesNotMatch(recorder,/new MediaRecorder\(/);
  assert.doesNotMatch(recorder,/\.captureStream\(/);
});
test('stage spectator playback renders through original game scene and restores real game state',()=>{
  assert.match(engine,/const ribbitReplayPreviousDrawScene=drawScene/);
  assert.match(engine,/ribbitReplayPreviousDrawScene\(\)/);
  assert.match(engine,/Object\.assign\(game,gameOld\)/);
  assert.match(engine,/flies\.splice\(0,flies\.length,\.\.\.fliesOld\)/);
  assert.match(engine,/game\.state="rrEngineReplay"/);
  assert.match(engine,/game\.state=restore\?\.state\|\|"main"/);
});
test('stage replay offers spectator-like playback controls, seeking, speed and Exit',()=>{
  for(const item of ['rr-play-bars','rr-play-triangle','rr-replay-arrow','SPECTATOR REPLAY','EXIT','ArrowLeft','ArrowRight','Space','Escape'])assert.ok(engine.includes(item));
  assert.match(engine,/window\.addEventListener\("keydown",handleRibbitReplayKey,true\)/);
  assert.match(engine,/canvas\.addEventListener\("pointerdown",event=>/);
});
test('new PB state timelines use gzip/json, saved through the authenticated Worker',()=>{
  assert.match(recorder,/new CompressionStream\("gzip"\)/);
  assert.match(recorder,/new DecompressionStream\("gzip"\)/);
  assert.match(recorder,/\/api\/replays\/submit/);
  assert.match(recorder,/\/api\/replays\/get/);
  assert.match(recorder,/spectator\.play\(record,caption,\{recordedAt:/);
  assert.match(worker,/application\\\/vnd\\\.ribbit-race\\\.frames\\\+|application\/vnd\.ribbit-race\.frames\+/);
});
test('frame sampler stays connected to game RAF and retains past rounds in Versus replays',()=>{
  assert.match(startup,/RibbitEngineReplay\?\.tick/);
  assert.match(engine,/pvpCelebration/);
  assert.match(engine,/mode!=="pvp"&&Number\(game\.elapsed/);
});
test('Frog Tags play saved frame data on stage and never construct a video popup',()=>{
  assert.match(online,/RibbitEngineReplay\?\.play\?\.\(row\.record/);
  assert.match(online,/RibbitEngineReplay\?\.exportCurrent\?\.\(\)/);
  assert.doesNotMatch(online, /createElement\("video"\)/);
});
test('unexpected in-air bonks settle normally while Ember dialogue blocks input',()=>{
  assert.match(hooks,/tutorial\.kind === "pvp" &&\s*\(tutorial\.dialogueOpen \|\| tutorial\.pvpAwaitRecoveryAdvance\)/);
  assert.match(hooks,/updatePvpPlayer\(player, dt\)/);
  assert.match(hooks,/player\.charging = false/);
  assert.match(hooks,/updatePvpImpactEffects\(dt\)/);
});
test('WATCH EMBER caption remains until speech actually begins',()=>{
  assert.match(captions,/const holdUntilDialogue = !tutorial\.dialogueOpen/);
  assert.match(captions,/\(!holdUntilDialogue && performance\.now\(\) > tutorial\.pvpCaptionUntil\)/);
  assert.match(lessons,/tutorial\.pvpCaption = "WATCH EMBER!";\s*tutorial\.pvpCaptionUntil = performance\.now\(\) \+ 15000/);
});
