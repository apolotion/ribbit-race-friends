import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readProjectFile as read} from './source-reader.mjs';

const replay = read('client/game/133-engine-replay.js');
const scenarios = read('client/game/122-tutorial-scenarios.js');
const physics = read('client/game/60-versus-physics.js');
const rendering = read('client/game/63-versus-rendering-ui.js');
const hud = read('client/game/71-rendering-entities-hud.js');

const version = '1.7.50';
const marker = '2026.10.13-friends-polish-62';

test('Polish 48 version and cache marker agree across source, browser and Worker', () => {
  assert.equal(JSON.parse(read('package.json')).version,version);
  assert.match(read('client/game/10-core-config.js'), /VERSION 1\.7\.50/);
  assert.ok(read('src/common.js').includes(marker));
  assert.ok(read('client/game/120-tutorial-config.js').includes(marker));
  assert.ok(read('public/index.html').includes(marker));
  assert.ok(read('public/scripts/game.bundle.js').includes(marker));
});

test('Replay records three seconds of victory, displays centered stats after one second, and hops for four total', () => {
  assert.match(replay,/const RIBBIT_REPLAY_RESULT_HOLD = 1000;/);
  assert.match(replay,/const RIBBIT_REPLAY_SCORE_DELAY = 1000;/);
  assert.match(replay,/const RIBBIT_REPLAY_SCORE_HOLD = 3000;/);
  assert.match(replay,/const animatedTailSeconds=timeline \? Math\.max\(0,\(view\.position-finalFrameTime\)\/1000\) : 0;/);
  assert.match(replay,/data\.mode==="solo" && \(state\.phase==="won" \|\| !!timeline/);
  assert.match(replay,/frog\.danceTime=Math\.max\(0,Number\(state\.player\?\.danceTime\)\|\|0\)\+animatedTailSeconds/);
  assert.ok(replay.indexOf('ribbitReplayPreviousDrawScene();') < replay.indexOf('if(finalHold){'));
});

test('Replay Complete card is centered in both axes, with stepped FIVE FLIES styling and blank final clue', () => {
  assert.match(replay,/const rect=\{w:402,h:128\};/);
  assert.match(replay,/rect\.x=Math\.round\(\(W-rect\.w\)\/2\);/);
  assert.match(replay,/rect\.y=Math\.round\(\(CONFIG\.playBottom-rect\.h\)\/2\);/);
  assert.match(replay,/ctx\.fillRect\(rect\.x\+5,rect\.y,rect\.w-10,rect\.h\)/);
  assert.match(replay,/drawBitmapText\("REPLAY COMPLETE!"/);
  assert.match(replay,/RibbitReplayClueBlank=finalHold \|\| view\.position/);
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
  assert.match(physics,/if \(prevStun > 0 && player\.stunTimer <= 1e-8\) \{[\s\S]{0,440}player\.recoveryFlipTimer = player\.recoveryFlipDuration;/);
  assert.match(physics,/player\.landingSquash = 0;\s*player\.bonkLandingPopTimer = 0;/);
  assert.match(physics,/victim\.recoveryFlipTimer = 0;/);
  assert.match(rendering,/const recoveringFlip = \(player\.recoveryFlipTimer \|\| 0\) > 0;/);
  assert.match(rendering,/const recoveryProgress = recoveringFlip \?/);
  assert.match(rendering,/ctx\.rotate\(recoveringFlip \? \(1 - recoveryProgress\) \* Math\.PI : Math\.PI\);/);
  assert.doesNotMatch(rendering,/(?:const )?recoveringStun\s*=/);
  assert.doesNotMatch(rendering,/player\.stunTimer \/ recoveryWindow/);
});
