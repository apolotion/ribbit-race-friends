import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = n => fs.readFileSync(new URL(`../client/game/${n}`, import.meta.url), 'utf8');
const physics = read('60-versus-physics.js');
const lifecycle = read('123-tutorial-lifecycle.js');
const hooks = read('126-tutorial-hooks.js');
const render = read('63-versus-rendering-ui.js');
const scenes = read('122-tutorial-scenarios.js');
const monitor = read('124-tutorial-monitoring.js');
const config = read('10-core-config.js');
const cut = (src, from, until) => {
 const a=src.indexOf(from), b=src.indexOf(until,a+from.length);
 assert.ok(a>=0&&b>a,`cannot extract ${from}`);
 return src.slice(a,b);
};

// Uses the game's actual updatePvpPlayer, not a simulated replacement.
test('bonked player stays stunned for 120 full physics frames, then plays exactly one recovery rotation', () => {
 const env={Math, Number, CONFIG:{groundY:240,pvpBonkMinStunSeconds:2,pvpBonkMaxStunSeconds:5},
   tutorial:{active:true,kind:'pvp',dialogueOpen:true},game:{pvpElapsed:12,pvpCpuEnabled:false},
   getPvpCpuIndex:()=>1,isPvpPhysicalJumpHeld:()=>false,startPvpCharge(){throw Error('unexpected charge')},
 };
 vm.createContext(env);
 vm.runInContext(cut(physics,'    function updatePvpPlayer(player, dt)', '    function '),env);
 const player={index:0,x:10,y:216,w:24,h:24,grounded:true,bonked:false,stunTimer:2,
  stunCountdownStarted:true,landingSquash:0,bonkLandingPopTimer:0,recoveryFlipTimer:0,
  collisionCooldown:0,blinkTimer:200,catchSparkleTimer:0,wrongCatchBubbleTimer:0,
  inputHeld:false,charging:false,openingJumpActive:false};
 for(let i=0;i<119;i++)env.updatePvpPlayer(player,1/60);
 assert.ok(player.stunTimer>0 && player.stunTimer<0.035);
 assert.equal(player.recoveryFlipTimer,0);
 env.updatePvpPlayer(player,1/60);
 assert.equal(player.stunTimer,0);
 assert.equal(player.stunCountdownStarted,false);
 assert.equal(player.recoveryFlipTimer,.56);
 assert.equal(player.y,216);
 player.inputHeld=false;
 // Pause normal physics once recovery is running to exercise the grounded case.
 env.tutorial.dialogueOpen=true;
 for(let i=0;i<34;i++)env.updatePvpPlayer(player,1/60);
 assert.equal(player.recoveryFlipTimer,0);
 assert.equal(player.stunTimer,0);
 });

test('the actual physics stun formula never drops below two seconds and still reaches five',()=>{
 assert.match(config,/pvpBonkMinStunSeconds: 2\.0/);
 assert.match(config,/pvpBonkMaxStunSeconds: 5\.0/);
 const env={CONFIG:{pvpBonkMaxDropDistance:300,pvpBonkMinStunSeconds:2,pvpBonkMaxStunSeconds:5},
  clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,t)=>a+(b-a)*t};
 vm.createContext(env);
 vm.runInContext(cut(physics,'    function getPvpFootstoolStunDuration(stomper)', '    function isMaximumPvpBonkDuration'),env);
 assert.equal(env.getPvpFootstoolStunDuration({y:200,highestY:200}),2);
 assert.equal(env.getPvpFootstoolStunDuration({y:200,highestY:-100}),5);
 assert.ok(env.getPvpFootstoolStunDuration({y:200,highestY:110})>2);
 });

test('tutorial dialogue and completed lessons advance the real recovery clock while blocking input',()=>{
 assert.match(hooks,/tutorial\.dialogueOpen \|\| tutorial\.pvpAwaitRecoveryAdvance \|\|\s*tutorial\.passed \|\| tutorial\.passPending/);
 assert.match(hooks,/player\.bonked \|\| player\.stunTimer > 0 \|\| \(player\.recoveryFlipTimer \|\| 0\) > 0/);
 assert.match(hooks,/for \(const player of pvpPlayers\)[\s\S]*?updatePvpPlayer\(player, dt\)/);
 assert.match(physics,/player\.recoveryFlipTimer = player\.recoveryFlipDuration/);
 assert.match(physics,/victim\.recoveryFlipTimer = 0/);
 });

test('poof hides every frog-derived shadow, afterimage, charge preview and tongue',()=>{
 const scene=render.slice(render.indexOf('    function drawPvpScene()'));
 assert.match(scene,/tutorial\.pvpFrogsHidden \|\| tutorial\.pvpHiddenPlayerIndices\?\.includes\(player\.index\)/);
 for(const effect of ['drawPvpArcPreview','drawPvpTongue','drawFrogAfterimages','drawAirShadowForEntity','drawPvpOffscreenIndicator']){
  assert.match(scene,new RegExp('pvpPlayers\\.filter\\(visibleInTutorial\\)[^;]*'+effect));
 }
 });

test('input cannot flow from a poof straight into a buffered or held jump',()=>{
 const time={now:()=>1_100};
 const tutorial={active:true,kind:'pvp',pvpInputGuardUntil:1_250};
 const env={performance:time,tutorial,game:{state:'playing'},tutorialMovementLocked:()=>false,Boolean};
 vm.createContext(env);
 vm.runInContext(cut(hooks,'function tutorialBlocksLiveInput()', 'const originalPressMainButtonForTutorial'),env);
 assert.equal(env.tutorialBlocksLiveInput(),true);
 time.now=()=>1_300;
 assert.equal(env.tutorialBlocksLiveInput(),false);
 tutorial.blockJumpUntilRelease=true;
 assert.equal(env.tutorialBlocksLiveInput(),true);
 tutorial.blockJumpUntilRelease=false;
 tutorial.dialogueOpen=true;env.tutorialMovementLocked=()=>true;
 assert.equal(env.tutorialBlocksLiveInput(),true);
 assert.match(lifecycle,/tutorial\.blockJumpUntilRelease = tutorial\.blockJumpUntilRelease \|\|/);
 });

test('two retry requests in the same poof lifetime schedule only one transition',()=>{
 let ms=1000; const calls=[];
 const tutorial={active:true,kind:'pvp',passed:false,resetPending:false};
 const env={performance:{now:()=>ms},POOF_TRANSITION_MS:430,tutorial,tutorialStep:()=>({setup:'pvpSkyBonk'}),
  PVP_RETRY_EMBER_STATIONARY_SETUPS:new Set(),flies:[],pvpPlayers:[{},{}],
  beginPoofTransition(opts){calls.push(opts);return true},CONFIG:{},Number};
 vm.createContext(env);
 vm.runInContext(cut(lifecycle,'function failAttempt(message)', 'function finalizePassedStep()'),env);
 env.failAttempt('MISSED');env.failAttempt('MISSED');
 assert.equal(calls.length,1);
 assert.ok(tutorial.pvpRetryGraceUntil>=1790);
 ms=1700;env.failAttempt('MISSED');assert.equal(calls.length,1);
 ms=1900;env.failAttempt('ACTUAL NEW ATTEMPT');assert.equal(calls.length,2);
 });

test('successful rebound or retry poof never reuses prior landing flags',()=>{
 const section=cut(monitor,'if (setup === "pvpReboundThree")', 'if (setup === "pvpReboundCatch")');
 const cleared=(section.match(/pvpLessonAirborneSeen = \[false, false\]/g)||[]).length;
 assert.equal(cleared,2);
 assert.equal((section.match(/pvpLessonLanded = \[false, false\]/g)||[]).length,2);
 assert.equal((section.match(/pvpReboundLandingHoldAt = 0/g)||[]).length>=2,true);
 assert.match(lifecycle,/tutorial\.pvpLessonLanded = \[false, false\]/);
 assert.match(lifecycle,/tutorial\.pvpInputGuardUntil = tutorial\.enteredAt \+ 220/);
 });

test('Avoiding Under Bonk matches screenshot: player on lower-middle perch facing right',()=>{
 const section=cut(scenes,'case "pvpAvoidUnder"','case "pvpDemoRebound"');
 assert.match(section,/positionPvpOnPlatform\(p1, perch, 1\)/);
 assert.match(section,/positionPvp\(ember, perch\.x - ember\.w - 12, CONFIG\.groundY - ember\.h, 1\)/);
 assert.match(monitor,/if \(setup === "pvpAvoidUnder"\)[\s\S]*?p1\.x >= platform\.x \+ platform\.w - p1\.w - 1/);
 });

test('Not So Fast: simultaneous demonstration releases, then Ember aims left for the middle-left perch',()=>{
 const demo=cut(scenes,'case "pvpDemoIntercept"','case "pvpDemoDinnerSteal"');
 const movement=cut(scenes,'function beginPvpDemoMotion(setup)', 'function ');
 assert.match(movement,/scriptPvpChargedJump\(0, \.85, 1, 0\)/);
 assert.match(movement,/scriptPvpChargedJump\(1, \.85, -1, 0\)/);
 const practice=cut(monitor,'if (setup === "pvpIntercept" || setup === "pvpDinnerSteal")', 'function beginPvpTutorialEnding()');
 assert.match(practice,/const launchDirection = -1/);
 assert.match(practice,/setup === "pvpDinnerSteal" \? \.82 : \.86/);
 assert.match(practice,/ember\.dir = launchDirection/);
 });
