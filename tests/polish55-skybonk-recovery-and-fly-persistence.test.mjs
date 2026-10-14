import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const physics = read('client/game/60-versus-physics.js');
const hooks = read('client/game/126-tutorial-hooks.js');
const scenes = read('client/game/122-tutorial-scenarios.js');
const monitor = read('client/game/124-tutorial-monitoring.js');
const render = read('client/game/63-versus-rendering-ui.js');
const soloRender = read('client/game/80-input-loop-startup.js');
const lifecycle = read('client/game/123-tutorial-lifecycle.js');
const config = read('client/game/120-tutorial-config.js');

test('maximum-height bonk is five actual seconds from landing and recovery starts on the exact final tick',()=>{
  assert.match(physics, /dropDistance\s*>=\s*CONFIG\.pvpBonkMaxDropDistance\s*-\s*0\.1\)\s*return CONFIG\.pvpBonkMaxStunSeconds/);
  assert.match(physics, /if\s*\(player\.y \+ player\.h >= CONFIG\.groundY\)[\s\S]{0,310}player\.stunTimer = appliedBonkDuration/);
  assert.match(physics, /player\.stunTimer <= 1e-8\)[\s\S]{0,440}player\.recoveryFlipTimer = player\.recoveryFlipDuration/);
  assert.match(hooks, /\["pvpDemoSkyBonk", "pvpSkyBonk", "pvpDemoBufferedSky", "pvpBufferedSky"\]/);
  assert.match(hooks, /victim\.bonkStunDuration = CONFIG\.pvpBonkMaxStunSeconds/);
  assert.doesNotMatch(hooks,/victim\.bonkStunDuration\s*=\s*4\.7/);
});

test('ordinary blocked-bonk demonstration retains Versus stun lengths and completes when Ember lands',()=>{
  assert.match(scenes, /setup === "pvpDemoRecoveryBonk"\)[\s\S]*?completed = tutorial\.pvpDemoBlockedBonkAt > 0\s*&&[\s\S]*?ember\.grounded/);
  assert.doesNotMatch(hooks,/victim\.bonkStunDuration = Math\.max\(victim\.bonkStunDuration,\s*4\.7\)/);
});

test('second recovery bonk is accepted only within one second of actual recovery',()=>{
  assert.match(hooks,/const recoveryGap = Number\(game\.pvpElapsed\) - Number\(victim\?\.lastStunEndAt\)/);
  assert.match(hooks,/recoveryGap >= 0 && recoveryGap <= 1/);
  assert.match(monitor,/if \(tutorial\.pvpRecoverySecondBonkOnTime\)/);
  assert.match(monitor,/SECOND BONK MUST LAND WITHIN 1 SECOND OF RECOVERY/);
});

test('screen-reference poses face the requested directions',()=>{
  assert.match(scenes,/case "pvpBufferedBonk"[\s\S]*?positionPvp\(p1, 64, CONFIG\.groundY-p1\.h, 1\)/);
  assert.match(scenes,/case "pvpDemoUnderBonk"[\s\S]*?positionPvp\(p1, 210, CONFIG\.groundY - p1\.h, 1\)/);
  assert.match(scenes,/case "pvpUnderBonkTwo"[\s\S]*?positionPvpOnPlatform\(p1, middleLeft, 1, middleLeft\.w - p1\.w - 2\);[\s\S]*?positionPvp\(ember, 238, CONFIG\.groundY - ember\.h, -1\)/);
  assert.match(scenes,/case "pvpAvoidUnder"[\s\S]*?positionPvp\(p1, 222, CONFIG\.groundY - p1\.h, -1\)/);
  assert.match(scenes,/positionPvpReboundPracticeLayout\(completed = 0\)[\s\S]*?positionPvp\(p1, 145,[\s\S]*?positionPvp\(ember, 305/);
});

test('under bonk now needs just one success',()=>{
  assert.match(config,/"setup": "pvpUnderBonkTwo"[\s\S]{0,200}"0 \/ 1"/);
  assert.match(monitor,/setup === "pvpUnderBonkTwo"[\s\S]*?if \(tutorial\.pvpUnderBonks >= 1\)/);
  assert.match(config,/Give me one clean under bonk/);
});

test('low-profile jump above lower-middle platform waits for landing and then poofs',()=>{
  assert.match(monitor,/setup === "pvpAvoidUnder"[\s\S]*?p1\.y \+ p1\.h <= platform\.y \+ 0\.5/);
  assert.match(monitor,/if \(tutorial\.pvpAvoidUnderTooHigh\)[\s\S]*?if \(playerLanded[\s\S]*?failAttempt\("THAT JUMP WENT TOO HIGH/);
});

test('the rebound completes its catch sparkle for both frogs and waits 500ms after landing to poof',()=>{
  assert.match(hooks,/a\.catchSparkleTimer = Math\.max\(/);
  assert.match(hooks,/b\.catchSparkleTimer = Math\.max\(/);
  assert.match(monitor,/setup === "pvpReboundThree"[\s\S]*?tutorial\.pvpReboundLandingHoldAt >= 500/);
  assert.match(monitor,/reason: "next-pvp-rebound"/);
});

test('the rebound catch retry preserves original fly objects through the poof',()=>{
  assert.match(lifecycle,/const retainedFlyObjects = setup === "pvpReboundCatch"/);
  assert.match(lifecycle,/for \(const fly of retainedFlyObjects\)/);
  assert.match(lifecycle,/flies\.push\(fly\)/);
  assert.match(lifecycle,/preserveExistingFlies: true/);
});

test('tongues draw behind active/caught fly sprites in Versus, solo and slow motion',()=>{
  const pvpTonguePos = render.indexOf('pvpPlayers.forEach(p => drawEntity(p, drawPvpTongue))');
  const pvpFlyPos = render.indexOf('drawFlyAt(fly.x, fly.y');
  assert.ok(pvpTonguePos >= 0 && pvpFlyPos >= 0 && pvpTonguePos < pvpFlyPos);
  assert.ok(soloRender.indexOf('drawTongue(); // Draw beneath flies') < soloRender.indexOf('for (const currentFly of flies)'));
});
