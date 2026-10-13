import test from 'node:test';
import assert from 'node:assert/strict';
import { readProjectFile as read } from './source-reader.mjs';

const cpu = read('client/game/62-versus-cpu.js');
const monitor = read('client/game/124-tutorial-monitoring.js');
const scene = read('client/game/122-tutorial-scenarios.js');
const render = read('client/game/63-versus-rendering-ui.js');
const lifecycle = read('client/game/123-tutorial-lifecycle.js');
const dialogue = read('client/game/121-tutorial-runtime-dialogue.js');
const hooks = read('client/game/126-tutorial-hooks.js');
const catches = read('client/game/61-versus-catches-rounds.js');

test('final tutorial CPU bypasses scripted practice controller',()=>{
 const m=monitor.slice(monitor.indexOf('function monitorPvp()'),monitor.indexOf('function tutorialMovementLocked'));
 assert.match(m,/if \(setup === "pvpFinalMatch"\) \{[\s\S]{0,700}return;[\s\S]{0,40}\}\s*drivePvpPracticeCpu/);
 assert.match(hooks,/const finalCpu = tutorial\.active/);
});
test('CPU cannot be stranded charging with its virtual key released',()=>{
 assert.match(cpu,/if \(cpu\.charging\) \{[\s\S]{0,600}if \(!cpu\.inputHeld\) cpu\.inputHeld = true/);
 assert.match(cpu,/if \(cpu\.charging\) releasePvpButton\(cpu\.index, "cpu"\);\s*else cpu\.inputHeld = false/);
});
test('Versus queues replacement flies until four are in the arena',()=>{
 assert.match(render,/const missing = Math\.max\(0, CONFIG\.maxFlies - liveCount - game\.spawnQueue\.length\)/);
 assert.match(render,/source: "pvp-fill"/);
 assert.match(render,/!game\.onlineMode && !authoredTraining/);
});
test('authored airborne catch demos use physically reachable synchronized launch timing',()=>{
 assert.match(scene,/case "pvpDemoReboundCatch"[\s\S]{0,350}positionPvp\(ember, 273,/);
 assert.match(scene,/case "pvpDemoDinnerSteal"[\s\S]{0,600}scriptPvpChargedJump\(0, 1, 1, 0\);[\s\S]{0,90}scriptPvpChargedJump\(1, 1, -1, 0\)/);
 assert.match(scene,/"pvpDemoDinnerSteal", "pvpDinnerSteal"\]\.includes\(setup\)\) return 0/);
});
test('unchanged fly is retained and eaten fly reappears at matching authored location',()=>{
 assert.match(dialogue,/currentFly\.state === "active" && currentFly\.tutorialArmed !== false/);
 assert.match(lifecycle,/preserveExistingFlies: true/);
 assert.match(scene,/const stillVisible = collectVisibleTutorialFlyKeys\(\)/);
 assert.match(scene,/armTutorialFlies\(\{ preserveKeys: stillVisible \}\)/);
});
test('rebound lessons wait for player landing and never paint close-catch labels',()=>{
 assert.match(monitor,/!game\.pvpCriticalCatchActive && p1\.grounded && !p1\.tongue\.active/);
 assert.match(scene,/if \(missedLanding\) \{\s*restartMissedPvpReboundDemonstration\(\)/);
 assert.match(hooks,/window\.RibbitTutorialShouldHidePvpCatchTitle/);
 assert.match(catches,/RibbitTutorialShouldHidePvpCatchTitle/);
});


test('question mark after colored dialogue emphasis has a visible punctuation gap',()=>{
 const rendering=read('client/game/125-tutorial-rendering.js');
 assert.match(rendering,/chunk\.startsWith\("\?"\) && cursor > 0/);
});
