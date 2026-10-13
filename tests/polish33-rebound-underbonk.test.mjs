import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readProjectFile as read } from './source-reader.mjs';
const scene = read('client/game/122-tutorial-scenarios.js');
const monitor = read('client/game/124-tutorial-monitoring.js');
const render = read('client/game/125-tutorial-rendering.js');
const font = read('client/game/70-rendering-text-world.js');
const config = read('client/game/120-tutorial-config.js');
function section(text,a,b){const start=text.indexOf(a), end=text.indexOf(b,start+a.length);assert.ok(start>=0&&end>start,`${a} -> ${b}`);return text.slice(start,end)}
function geometry(){
 const c = { W:480,CONFIG:{groundY:214},game:{targetVocabIndex:4,pvpSetupSkinIds:['azure','ember']},tutorial:{pvpPracticeLayoutIndex:0,pvpReboundCount:0},
  pvpPlayers:[{index:0,w:22,h:14},{index:1,w:22,h:14}],flies:[],clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  resetPvpPlayer:(p,x,dir)=>Object.assign(p,{x,dir,y:200,grounded:true}),
  basePvpScenario(){},clearScenarioState(){},addPvpTutorialFly(x,y,vocabIndex){c.flies.push({x,y,vocabIndex})},PVP_START_X:[70,330]};
 vm.createContext(c);
 vm.runInContext(section(read('client/game/10-core-config.js'),'const PARK_PLATFORMS =','const PARK_FLY_SPAWNS'),c);
 vm.runInContext(section(config,'const PVP_STEPS =','const PVP_WIN_DIALOGUE'),c);
 vm.runInContext(section(scene,'function positionPvp(player','function setPvpAirborne'),c);
 vm.runInContext(section(scene,'function positionPvpBonkPracticeLayout','function clearPvpScriptActions'),c);
 c.setup = setup=>vm.runInContext(`configurePvpStep(PVP_STEPS.findIndex(s=>s.setup===${JSON.stringify(setup)}))`,c);
 return c;
}
test('Borrow My Bounce demo swaps the frogs while player turn remains unchanged',()=>{
 const c=geometry();c.setup('pvpDemoBoostBonk');
 assert.deepEqual(c.pvpPlayers.map(p=>[p.x,p.y,p.dir]),[[145,200,1],[305,200,-1]]);
 assert.deepEqual(c.flies.map(f=>[f.x,f.y,f.vocabIndex]),[[72,84,4]]);
 c.flies.length=0;c.setup('pvpBoostBonk');
 assert.deepEqual(c.pvpPlayers.map(p=>[p.x,p.y,p.dir]),[[145,200,1],[305,200,-1]]);
 assert.deepEqual(c.flies.map(f=>[f.x,f.y,f.vocabIndex]),[[408,84,4]]);
});
test('Under-bonk demonstration reaches center platform through a real charged jump, never teleport',()=>{
 const demo=section(scene,'function beginPvpDemoMotion','function startPvpDemonstration');
 const motion=section(scene,'function updatePvpDemonstration','function startPvpFinalMatch');
 assert.match(demo,/case "pvpDemoUnderBonk"[\s\S]{0,360}scriptPvpChargedJump\(1, \.40, -1, 0\)/);
 assert.doesNotMatch(demo,/positionPvpOnPlatform\(ember, PARK_PLATFORMS\[3\]/);
 assert.match(motion,/setup === "pvpDemoUnderBonk"[\s\S]{0,280}getPvpStandingPlatform\(ember\) === PARK_PLATFORMS\[3\]/);
 assert.match(motion,/scriptPvpChargedJump\(0, \.78, 1, 120\)/);
});
test('Low-profile lesson completes after exactly five actual airborne landing cycles',()=>{
 const motion=section(scene,'function updatePvpDemonstration','function startPvpFinalMatch');
 assert.match(motion,/tutorial\.pvpLowProfileJumpCount = \(tutorial\.pvpLowProfileJumpCount \|\| 0\) \+ 1/);
 assert.match(motion,/tutorial\.pvpLowProfileJumpCount < 5/);
 assert.match(motion,/completed = tutorial\.pvpLowProfileJumpCount === 5 && ember\.grounded/);
 assert.doesNotMatch(motion,/setup === "pvpDemoAvoidUnder"[\s\S]{0,220}positionPvp\(ember/);
});
test('Rebound demo uses 75 percent charge and rebound-practice second setup is mirrored and centered',()=>{
 const demo=section(scene,'function beginPvpDemoMotion','function startPvpDemonstration');
 assert.match(demo,/case "pvpDemoRebound"[\s\S]{0,130}scriptPvpChargedJump\(0, \.75, 1, 0\)/);
 assert.match(demo,/case "pvpDemoRebound"[\s\S]{0,160}scriptPvpChargedJump\(1, \.75, -1, 0\)/);
 const c=geometry();c.positionPvpReboundPracticeLayout(1);
 assert.deepEqual(c.pvpPlayers.map(p=>[p.x + p.w/2,p.y+p.h,p.dir]),[[164,126,1],[316,126,-1]]);
 c.positionPvpReboundPracticeLayout(2);
 assert.equal(c.pvpPlayers[0].y+c.pvpPlayers[0].h,70);
 assert.equal(c.pvpPlayers[1].y+c.pvpPlayers[1].h,70);
});
test('Missed practice rebound retains the completed count instead of resetting a consecutive streak',()=>{
 const start=monitor.lastIndexOf('if (setup === "pvpReboundThree") {');
 assert.ok(start>=0);
 const end=monitor.indexOf('if (setup === "pvpReboundCatch") {', start);
 assert.ok(end>start);
 const code=monitor.slice(start,end);
 assert.match(code,/const completed = tutorial\.pvpReboundCount/);
 assert.match(code,/positionPvpReboundPracticeLayout\(completed\)/);
 assert.match(code,/tutorial\.pvpReboundCount = completed/);
 assert.doesNotMatch(code,/failAttempt\(/);
 assert.match(render,/\$\{Math\.min\(3, tutorial\.pvpReboundCount\)\} \/ 3/);
});
test('Bitmap apostrophe leans in the correct direction and the wall-free half of dialogue is white',()=>{
 assert.match(font,/"'": \["00100", "00100", "01000"/);
 assert.match(render,/"We both turned around—without touching a wall!": \[\s*"both turned around"\s*\]/);
});
