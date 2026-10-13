import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const catches = read('client/game/61-versus-catches-rounds.js');
const render = read('client/game/63-versus-rendering-ui.js');
const config = read('client/game/120-tutorial-config.js');
const scenarios = read('client/game/122-tutorial-scenarios.js');
const monitor = read('client/game/124-tutorial-monitoring.js');
const hooks = read('client/game/126-tutorial-hooks.js');
const lifecycle = read('client/game/123-tutorial-lifecycle.js');
const dialogue = read('client/game/121-tutorial-runtime-dialogue.js');
const tutorialUi = read('client/game/125-tutorial-rendering.js');

function extract(source, start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a+start.length);
  assert.ok(a >= 0 && b > a, `Cannot extract: ${start}`);
  return source.slice(a, b);
}

test('A clutch catch is impossible with more than a second remaining', () => {
  const player={index:0,score:0};
  const opponent={index:1,score:0};
  const game={mode:'pvp',pvpTimeLimitSeconds:30,pvpSuddenDeath:false,pvpCriticalCatchActive:false,
    pvpTimerGraceActive:false,pvpTimeRemaining:1.5};
  const context={game,pvpPlayers:[player,opponent],
    flyMatchesPrompt:()=>true,isPvpEndlessMode:()=>true,getPvpTargetScore:()=>5,
    pvpFlyContestIsClose:()=>false};
  vm.createContext(context);
  vm.runInContext(extract(catches,'function getPvpCriticalCatchKind','function completePvpCorrectCatch'),context);
  assert.equal(context.getPvpCriticalCatchKind(player,{id:8}), '', '1.5 seconds must not be a clutch catch');
  game.pvpTimeRemaining = 1.0;
  assert.equal(context.getPvpCriticalCatchKind(player,{id:8}), 'clutch', 'exact final second counts');
  game.pvpTimeRemaining = .25;
  assert.equal(context.getPvpCriticalCatchKind(player,{id:8}), 'clutch');
  game.pvpTimeRemaining = 2.0;
  assert.equal(context.getPvpCriticalCatchKind(player,{id:8}), '');
});

test('Final tutorial timeout resolves pending grace after two monotonic seconds', () => {
  const game = {mode:'pvp',state:'playing',pvpTimeLimitSeconds:30,pvpCriticalCatchActive:false,
    pvpTimeRemaining:0,pvpSuddenDeath:false,pvpWinPendingIndex:null,pvpTimerGraceActive:true,
    pvpTimedOutcomePending:true,pvpTimeExpiredAt:30,pvpTimeExpiredRealAt:1000,
    pvpElapsed:30,elapsed:30,worldTime:0,pvpCpuEnabled:true};
  const tutorial={active:true,kind:'pvp'};
  const players=[{index:0,score:1},{index:1,score:2}];
  let resolved=0;
  const context={game,tutorial,performance:{now:()=>4100},pvpPlayers:players,
    tutorialStep:()=>({setup:'pvpFinalMatch'}),
    updatePvpMovingPlatforms:()=>{},updatePvpImpactEffects:()=>{},
    updatePvpCpuInput:()=>{},updatePvpPlayer:()=>{},resolvePvpCollision:()=>{},
    updateFrogAfterimages:()=>{},getPvpSkinPalette:()=>({}),updatePvpFlies:()=>{},
    resolvePvpTimedOutcomeAfterJump:()=>{resolved++;game.pvpTimedOutcomePending=false;game.state='pvpCelebration';},
    pvpTimerGraceHasFinished:()=>false};
  vm.createContext(context);
  vm.runInContext(extract(render,'function updatePvp(dt)','function getPvpPreviewPoints'),context);
  context.updatePvp(.016);
  assert.equal(resolved,1);
  assert.equal(game.state,'pvpCelebration');
});

test('Final entrance reserves one second AFTER poof without starting CPU or game clock', () => {
  assert.match(scenarios,/reason:"pvp-final-match-precountdown"/);
  assert.match(scenarios,/pvpFinalMatchCountdownUntil = performance\.now\(\) \+ 1000/);
  assert.match(hooks,/tutorial\.pvpFinalMatchCountdownUntil > 0/);
  assert.match(hooks,/updateTutorialAmbient\(dt, \{ animateFlies:true \}\)/);
  assert.match(monitor,/startResumeCountdown\(false\)/);
  assert.match(render,/pvpTimeExpiredRealAt = performance\.now\(\)/);
});

test('Player can begin sky-bonk dialogue on landing while stun flip-back remains unskippable', () => {
  assert.match(monitor,/setup === "pvpBufferedSky"[\s\S]{0,280}p1\.grounded/);
  assert.match(dialogue,/const recovering = pvpPlayers\.some/);
  assert.match(dialogue,/if \(recovering\) return true/);
  assert.match(hooks,/player\.stunTimer > 0/);
  assert.match(lifecycle,/if \(tutorial\.kind === "pvp"\) clearHeldInput\(\)/);
});

test('Fly vocabulary matches live visible targets and blank panel survives retries', () => {
  assert.match(render,/activeFlyPool\.some\(\(fly\) => fly\.vocabIndex === game\.targetVocabIndex\)/);
  assert.match(monitor,/tutorial\.promptHidden = false/);
  assert.match(tutorialUi,/drawBlankTutorialVocabularyPrompt\(\)/);
  assert.match(tutorialUi,/currentFly\.state === "active" && currentFly\.tutorialArmed !== false/);
  assert.match(render,/game\.pvpCriticalCatchFlyVisual/);
});

test('Real wall rebound controls Ember facing, rebound sparkles affect both frogs', () => {
  assert.match(scenarios,/ember\.wallBouncedThisJump/);
  assert.match(scenarios,/scriptPvpChargedJump\(1, \.75, null, 0\)/);
  assert.doesNotMatch(scenarios,/scriptPvpChargedJump\(1, \.55, 1, 0\)/);
  assert.match(hooks,/a\.catchSparkleTimer/);
  assert.match(hooks,/b\.catchSparkleTimer/);
});

test('Tutorial practice and final match remove misleading replay captions', () => {
  assert.match(hooks,/RibbitTutorialShouldHidePvpCatchTitle/);
  assert.match(catches,/silentTrainingCinematic/);
  assert.match(render,/EMBER WINS!/);
  assert.match(config,/bottom LEFT perch/i);
});
