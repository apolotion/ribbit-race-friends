import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readProjectFile as read } from './source-reader.mjs';

const hud = read('client/game/71-rendering-entities-hud.js');
const menus = read('client/game/73-rendering-menus-overlays.js');
const input = read('client/game/80-input-loop-startup.js');
const polish = read('client/game/130-polish-ui-replay-language.js');
const versus = read('client/game/63-versus-rendering-ui.js');
const scene = read('client/game/122-tutorial-scenarios.js');
const monitor = read('client/game/124-tutorial-monitoring.js');
const lifecycle = read('client/game/121-tutorial-runtime-dialogue.js');
const config = read('client/game/120-tutorial-config.js');
function section(s, start, end) {
  const a = s.indexOf(start), b = s.indexOf(end, a+start.length);
  assert.ok(a>=0 && b>a,`${start} to ${end} in source`);
  return s.slice(a,b);
}
function authoredPositions() {
  const calls=[];
  const c={W:480,CONFIG:{groundY:214},game:{pvpSetupSkinIds:['azure','ember'],targetVocabIndex:0},
   tutorial:{pvpPracticeLayoutIndex:0},pvpPlayers:[{index:0,w:22,h:14},{index:1,w:22,h:14}],
   clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
   resetPvpPlayer:(p,x,dir)=>Object.assign(p,{x,y:200,dir,grounded:true}),
   basePvpScenario(){},clearScenarioState(){},addPvpTutorialFly(...args){calls.push(args);},PVP_START_X:[70,330]};
  vm.createContext(c);
  vm.runInContext(section(read('client/game/10-core-config.js'),'const PARK_PLATFORMS =','const PARK_FLY_SPAWNS'),c);
  vm.runInContext(section(config,'const PVP_STEPS =','const PVP_WIN_DIALOGUE'),c);
  vm.runInContext(section(scene,'function positionPvp(player','function setPvpAirborne'),c);
  vm.runInContext(section(scene,'function positionPvpBonkPracticeLayout','function clearPvpScriptActions'),c);
  return {
    capture(setup) {calls.length=0;c.setup=undefined;vm.runInContext(`configurePvpStep(PVP_STEPS.findIndex(s=>s.setup===${JSON.stringify(setup)}))`,c);return {
      players:c.pvpPlayers.map(({x,y,dir})=>({x,y,dir})),flies:calls.map(a=>Array.from(a))};}
  };
}

test('Solo and Versus both use one compact framed mint pause sprite',()=>{
 assert.match(hud,/function drawHudPausePlaySprite\(rect, paused = false/);
 assert.match(hud,/if \(paused\)\s*\{[\s\S]*?play triangle/);
 assert.match(hud,/drawHudPausePlaySprite\(pause, game\.state === "paused"/);
 assert.match(versus,/drawHudPausePlaySprite\(HUD_UI\.pauseButton, game\.state === "paused"/);
 assert.match(input,/drawHudPausePlaySprite\(HUD_UI\.pauseButton, true, getSelectedSkin\(\)\)/);
 assert.doesNotMatch(section(polish,'const originalDrawScenePolish8 = drawScene','function interactiveRectForPoint'),/drawPvpPauseButtonPolish8\(\)/);
});

test('paused Versus HUD play button resumes locally rather than replaying a pause action',()=>{
 assert.match(polish,/game\.mode === "pvp" && game\.state === "paused" && !game\.onlineMode && !game\.pauseHelpOpen && pointIn\(point, HUD_UI\.pauseButton\)/);
 assert.match(polish,/resumePausedGame\(\); return;/);
});

test('fullscreen is drawn before the how-to sheet and cannot be clicked through the popup',()=>{
 const controls=section(menus,'function drawPauseControls','function getPauseBookTheme');
 assert.ok(controls.indexOf('const fs = { x:379')<controls.indexOf('drawPauseHowToOverlay();'));
 assert.match(polish,/if \(game\.state !== "paused" \|\| game\.pauseHelpOpen\) return/);
 assert.match(polish,/game\.state === "paused" && !game\.pauseHelpOpen && pointIn\(point, getPauseFullscreenRect\(\)\)/);
});

test('Your Turn keeps both frog positions but moves fly to opposite side',()=>{
 const positions=authoredPositions();const ember=positions.capture('pvpDemoBonkCatch');const player=positions.capture('pvpBonkCatch');
 assert.deepEqual(player.players,ember.players);
 assert.equal(ember.flies.length,1);
 assert.equal(player.flies.length,1);
 assert.equal(ember.flies[0][1],player.flies[0][1]);
 assert.notEqual(ember.flies[0][0],player.flies[0][0]);
 assert.equal(ember.flies[0][2],player.flies[0][2]);
});

test('buffered drop demo and practice begin under lower left/right perches',()=>{
 const positions=authoredPositions();
 for(const setup of ['pvpDemoBufferedBonk','pvpBufferedBonk']) {
   const {players}=positions.capture(setup);
   assert.equal(players[0].x+11,72,setup+' player left center');
   assert.equal(players[1].x+11,408,setup+' Ember right center');
   assert.equal(players[0].y,200);
   assert.equal(players[1].y,200);
 }
 const motion=section(scene,'function beginPvpDemoMotion','function updatePvpDemonstration');
 assert.match(motion,/case "pvpDemoBufferedBonk"[\s\S]{0,220}scriptPvpChargedJump\(1, \.90, -1, 0\)/);
 const update=section(scene,'function updatePvpDemonstration','function startPvpFinalMatch');
 assert.match(update,/setup === "pvpDemoBufferedBonk"[\s\S]{0,620}scriptPvpChargedJump\(1, \.88, -1, 120\)/);
 assert.match(update,/armPvpScriptedBuffer\(1, PARK_PLATFORMS\[1\]\)/);
 assert.match(monitor,/pvpBufferedApproachCount/);
 assert.match(lifecycle,/tutorial\.pvpBufferedApproachCount = 0/);
});

test('third practice bonk waits until Ember falls and finishes her stun rotation',()=>{
 assert.match(monitor,/setup === "pvpBonkThree"[\s\S]{0,450}ember\.grounded && !ember\.bonked/);
 assert.match(monitor,/ember\.stunTimer <= 0 && ember\.y \+ ember\.h >= CONFIG\.groundY - 1/);
});

test('sky bonk dialogue waits until frogs complete their natural recovery',()=>{
 assert.match(monitor,/setup === "pvpSkyBonk"[\s\S]{0,190}pvpTutorialSettled\(\)/);
 assert.match(monitor,/setup === "pvpBufferedSky"[\s\S]{0,260}pvpTutorialSettled\(\)/);
 assert.match(scene,/\["pvpDemoSkyBonk","pvpDemoBufferedSky"\]\.includes\(setup\)/);
 assert.match(scene,/p1\.grounded && !p1\.bonked && p1\.stunTimer <= 0 && ember\.grounded/);
});

test('platforms dialogue says these instead of those',()=>{
 assert.match(config,/Let's put these platforms to work!/);
 assert.doesNotMatch(config,/Let's put those platforms to work!/);
});
