import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readProjectFile as read} from './source-reader.mjs';

const replay = read('client/game/133-engine-replay.js');
const scenarios = read('client/game/122-tutorial-scenarios.js');
const physics = read('client/game/60-versus-physics.js');
const rendering = read('client/game/63-versus-rendering-ui.js');
const hud = read('client/game/71-rendering-entities-hud.js');

const version = '1.7.37';
const marker = '2026.10.13-friends-polish-49';

test('Polish 48 version and cache marker agree across source, browser and Worker', () => {
  assert.equal(JSON.parse(read('package.json')).version,version);
  assert.match(read('client/game/10-core-config.js'), /VERSION 1\.7\.37/);
  assert.ok(read('src/common.js').includes(marker));
  assert.ok(read('client/game/120-tutorial-config.js').includes(marker));
  assert.ok(read('public/index.html').includes(marker));
  assert.ok(read('public/scripts/game.bundle.js').includes(marker));
});

test('Replay holds completion card for two seconds while the victory frog continues hopping', () => {
  assert.match(replay,/const RIBBIT_REPLAY_RESULT_HOLD = 2000;/);
  assert.match(replay,/const animatedTailSeconds=finalHold \? Math\.max\(0,\(view\.position-finalFrameTime\)\/1000\) : 0;/);
  assert.match(replay,/data\.mode==="solo" && \(state\.phase==="won" \|\| finalHold\)/);
  assert.match(replay,/game\.state=replaySceneState/);
  assert.match(replay,/frog\.danceTime=Math\.max\(0,Number\(state\.player\?\.danceTime\)\|\|0\)\+animatedTailSeconds/);
  assert.match(replay,/game\.visualTime=\(Number\(state\.visual\)\|\|0\)\+animatedTailSeconds/);
  assert.ok(replay.indexOf('ribbitReplayPreviousDrawScene();') < replay.indexOf('if(finalHold){\n      // Stepped white end card'));
  assert.doesNotMatch(replay,/ctx\.fillRect\(103,84,274,78\)/);
});

test('Replay Complete card uses the wide stepped FIVE FLIES design and keeps blank matching plate', () => {
  assert.match(replay,/const rect=\{x:39,y:14,w:402,h:128\};/);
  assert.match(replay,/ctx\.fillRect\(rect\.x\+5,rect\.y,rect\.w-10,rect\.h\)/);
  assert.match(replay,/ctx\.fillRect\(rect\.x,rect\.y\+5,rect\.w,rect\.h-10\)/);
  assert.match(replay,/drawBitmapText\("REPLAY COMPLETE!"/);
  assert.match(replay,/drawBitmapText\(`FINAL TIME \$\{fmt\}`/);
  assert.match(replay,/RibbitReplayClueBlank=finalHold \|\| view\.position/);
  assert.match(hud,/At the end of an archived replay, retain the complete FIND THE MATCH/);
  assert.match(hud,/const prompt = window\.RibbitReplayClueBlank/);
});

test('WAIT FOR THE NEXT BONK starts with P1 left and Ember right, and uses actual left-wall collision', () => {
  assert.match(scenarios,/case "pvpDemoRecoveryBonk":[\s\S]{0,260}positionPvp\(p1, 145, CONFIG\.groundY - p1\.h, 1\);[\s\S]{0,100}positionPvp\(ember, 305, CONFIG\.groundY - ember\.h, -1\);/);
  assert.match(scenarios,/scriptPvpChargedJump\(1, pvpRecoveryDemoJumpPower\(travel, \.055\), -1, 0\)/);
  assert.match(scenarios,/const wallAndReturnDistance = ember\.x \+ p1\.x \+ p1\.w \* \.25;/);
  assert.match(scenarios,/scriptPvpChargedJump\(1, returnPower, -1, 0\)/);
  assert.match(scenarios,/if \(ember\.wallBouncedThisJump\) tutorial\.pvpRecoveryWallReboundSeen = true/);
  assert.match(scenarios,/completed = tutorial\.pvpDemoBlockedBonkAt > 0 &&\s*tutorial\.pvpRecoveryWallReboundSeen === true/);
  assert.doesNotMatch(scenarios,/scriptPvpChargedJump\(1, \.55, 1, 0\)/);
});

test('Ember jump-strength solver adjusts charges to actual travel distance and respects bounds', () => {
  const begin=scenarios.indexOf('function pvpRecoveryDemoJumpPower(');
  const end=scenarios.indexOf('function beginPvpDemoMotion(',begin);
  assert.ok(begin>0 && end>begin);
  const config={minimumJumpX:120,maximumJumpX:235,maximumJumpY:463,gravity:820};
  const ctx={CONFIG:config,Math,Number,clamp:(v,lo,hi)=>Math.min(hi,Math.max(lo,v))};
  vm.createContext(ctx);
  vm.runInContext(`${scenarios.slice(begin,end)}\nthis.jumpPower=pvpRecoveryDemoJumpPower;`,ctx);
  const p1x=145,p1w=22,emberx=305;
  const opening=ctx.jumpPower(emberx-(p1x+p1w/2),.055);
  const returnJump=ctx.jumpPower(45 + p1x + p1w*.25,.012);
  assert.ok(opening>.60 && opening<.86,`opening=${opening}`);
  assert.ok(returnJump>opening,`return=${returnJump}, opening=${opening}`);
  for (let travel=0;travel<1000;travel+=53) {
    const power=ctx.jumpPower(travel);
    assert.ok(power>=.18 && power<=1,`power out of range for ${travel}`);
  }
  assert.ok(ctx.jumpPower(100)<ctx.jumpPower(180));
});

test('Bonk recovery now rotates once, only AFTER stun ends, without a squash or stale timer',()=>{
  assert.match(physics,/if \(prevStun > 0 && player\.stunTimer === 0\) \{[\s\S]{0,150}player\.recoveryFlipTimer = \.24;/);
  assert.match(physics,/player\.landingSquash = 0;\s*player\.bonkLandingPopTimer = 0;/);
  assert.match(physics,/victim\.recoveryFlipTimer = 0;/);
  assert.match(rendering,/const recoveringFlip = \(player\.recoveryFlipTimer \|\| 0\) > 0;/);
  assert.match(rendering,/const recoveryProgress = recoveringFlip \?/);
  assert.match(rendering,/ctx\.rotate\(recoveringFlip \? \(1 - recoveryProgress\) \* Math\.PI : Math\.PI\);/);
  assert.doesNotMatch(rendering,/(?:const )?recoveringStun\s*=/);
  assert.doesNotMatch(rendering,/player\.stunTimer \/ recoveryWindow/);
});
