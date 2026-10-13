import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readProjectFile as read} from './source-reader.mjs';
const scene=read('client/game/122-tutorial-scenarios.js');
const config=read('client/game/120-tutorial-config.js');
const monitor=read('client/game/124-tutorial-monitoring.js');
const hook=read('client/game/126-tutorial-hooks.js');
const render=read('client/game/125-tutorial-rendering.js');
function section(s,a,b){const start=s.indexOf(a),end=s.indexOf(b,start+a.length);assert.ok(start>=0&&end>start,`${a} -> ${b}`);return s.slice(start,end);}
function geometry(){
 const ctx={W:480,CONFIG:{groundY:214},game:{pvpSetupSkinIds:['azure','ember']},tutorial:{pvpPracticeLayoutIndex:0},
  pvpPlayers:[{index:0,w:22,h:14},{index:1,w:22,h:14}],clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  resetPvpPlayer:(p,x,dir)=>Object.assign(p,{x,dir,y:200,grounded:true}),
  basePvpScenario(){},clearScenarioState(){},addPvpTutorialFly(){},PVP_START_X:[70,330]};
 vm.createContext(ctx);
 vm.runInContext(section(read('client/game/10-core-config.js'),'const PARK_PLATFORMS =','const PARK_FLY_SPAWNS'),ctx);
 vm.runInContext(section(config,'const PVP_STEPS =','const PVP_WIN_DIALOGUE'),ctx);
 vm.runInContext(section(scene,'function positionPvp(player','function setPvpAirborne'),ctx);
 vm.runInContext(section(scene,'function positionPvpBonkPracticeLayout','function clearPvpScriptActions'),ctx);
 ctx.setup=name=>vm.runInContext(`configurePvpStep(PVP_STEPS.findIndex(s=>s.setup===${JSON.stringify(name)}))`,ctx);
 return ctx;
}
function keywords(){const c={normalizeBitmapText:s=>String(s).replace(/[–—]/g,'-').replace(/\s+/g,' ')};vm.createContext(c);vm.runInContext(section(render,'const TUTORIAL_EMPHASIS_BY_LINE','function drawEmberDialogueLine'),c);return c;}

test('Polish 22 splits player input blocking from world movement locking',()=>{
 const ctx={tutorial:{active:true,pvpPlayerScriptLocked:true},performance:{now:()=>1000}};
 vm.createContext(ctx);vm.runInContext(section(monitor,'function tutorialMovementLocked','function updateTutorialAmbient'),ctx);
 assert.equal(ctx.tutorialMovementLocked(),false);
 for(const key of ['dialogueOpen','resetPending','frogHidden','pvpFrogsHidden','passed']){ctx.tutorial[key]=true;assert.equal(ctx.tutorialMovementLocked(),true,key);ctx.tutorial[key]=false;}
 assert.match(section(hook,'function tutorialBlocksLiveInput','const originalPressMainButtonForTutorial'),/tutorial\.pvpDemoActive \|\| tutorial\.pvpPlayerScriptLocked/);
});
test('opening ground lane matches the supplied screenshot',()=>{
 const c=geometry();c.setup('pvpWelcome');assert.deepEqual(c.pvpPlayers.map(p=>[p.x,p.y,p.dir]),[[145,200,1],[305,200,-1]]);
 c.setup('pvpDemoBonk');assert.deepEqual(c.pvpPlayers.map(p=>[p.x,p.y,p.dir]),[[145,200,1],[305,200,-1]]);
});
test('second bonk target is centered under middle-left; third swaps the player into that spot',()=>{
 const c=geometry();c.positionPvpBonkPracticeLayout(1);assert.equal(c.pvpPlayers[1].x+c.pvpPlayers[1].w/2,164);assert.equal(c.pvpPlayers[1].y,200);
 c.positionPvpBonkPracticeLayout(2);assert.equal(c.pvpPlayers[0].x+c.pvpPlayers[0].w/2,164);assert.equal(c.pvpPlayers[0].y,200);
 assert.deepEqual([c.pvpPlayers[1].x+c.pvpPlayers[1].w/2,c.pvpPlayers[1].y+c.pvpPlayers[1].h],[316,126]);
});
test('high drop swaps roles in the same ground-left lane',()=>{
 const c=geometry();c.setup('pvpDemoDropHigh');const positions=c.pvpPlayers.map(p=>[p.x,p.y,p.dir]);assert.deepEqual(positions,[[178,200,1],[248,56,-1]]);
 c.setup('pvpDropHigh');assert.deepEqual(c.pvpPlayers.map(p=>[p.x,p.y,p.dir]),positions.reverse());
});
test('buffered-bonk roles share a target exactly centered under lower-middle',()=>{
 const c=geometry();c.setup('pvpBufferedBonk');assert.deepEqual(c.pvpPlayers.map(p=>[p.x,p.y,p.dir]),[[105,200,1],[229,200,-1]]);
 c.setup('pvpDemoBufferedBonk');assert.deepEqual(c.pvpPlayers.map(p=>[p.x,p.y,p.dir]),[[229,200,-1],[105,200,1]]);
});
test('knock-off demo places Ember lower-middle and player top-center',()=>{
 const c=geometry();c.setup('pvpDemoHighGround');assert.deepEqual(c.pvpPlayers.map(p=>[p.x,p.y]),[[229,56],[229,162]]);
 assert.match(section(scene,'function updatePvpDemonstration','function startPvpFinalMatch'),/p1\.grounded && p1\.y \+ p1\.h >= CONFIG\.groundY - 1/);
});
test('layout mirroring cannot overwrite airborne facing',()=>{
 const s=read('client/game/127-tutorial-refinements.js');const runtime=section(s,'function polish19PvpRuntimeCorrection','const polish19OriginalUpdateTutorial');
 assert.doesNotMatch(runtime,/(?:player|ember)\.(?:dir|chargeFacingDir)\s*=/);
 assert.doesNotMatch(s,/function polish19ApplyPvpChapterPose/);
 assert.match(section(scene,'function scriptPvpPress','function scriptPvpRelease'),/player\.grounded &&/);
});
test('dialogue emphasis does not match EMBER inside REMEMBER',()=>{
 const c=keywords(),line='Remember your buffered drops? They work for bonks, too!';
 const ranges=c.tutorialDialogueEmphasisRanges(line);assert.equal(ranges.length,1);assert.equal(line.slice(...ranges[0]),'buffered drops');
});
test('the same word can be emphasized in a lesson and plain in flavor dialogue',()=>{
 const c=keywords();assert.equal(c.tutorialDialogueEmphasisRanges('First lesson: the bonk!').length,1);
 assert.equal(c.tutorialDialogueEmphasisRanges("And don't waste your chance admiring that excellent bonk!").length,0);
 assert.equal(c.tutorialDialogueEmphasisRanges('Welcome back, tadpole! Ready to share the pond?').length,0);
});
test('highlights retain full-sentence identity and offsets after wrapping',()=>{
 assert.match(render,/tutorialDialogueEmphasisRanges\(spokenLine\)/);
 assert.match(render,/start-lineOffset/);assert.match(render,/textScale, fullLine, lineOffset/);
});
test('Versus pause and goal hit regions do not overlap; solo position is unchanged',()=>{
 const c={W:480,game:{mode:'pvp'},tutorial:{kind:'pvp'}};vm.createContext(c);
 vm.runInContext(section(read('client/game/40-ui-navigation-audio.js'),'const SOLO_PAUSE_BUTTON','const PAUSE_UI')+'\nglobalThis.hud=HUD_UI;',c);
 vm.runInContext(section(render,'function getTutorialGoalRect','function drawCurrentGoalHud'),c);
 assert.equal(c.hud.pauseButton.x,448);assert.equal(c.hud.pauseButton.y,239);assert.equal(c.getTutorialGoalRect().w,116);
 assert.ok(c.getTutorialGoalRect().x+c.getTutorialGoalRect().w<c.hud.pauseButton.x);
 c.game.mode='solo';assert.equal(c.hud.pauseButton.y,7);
});
test('Versus pause draws only narrow bars, not a pale background tile',()=>{
 const draw=section(read('client/game/130-polish-ui-replay-language.js'),'function drawPvpPauseButtonPolish8','// Own exactly one contextual');
 assert.doesNotMatch(draw,/fillRect\(rect\.x, rect\.y, rect\.w, rect\.h\)/);
 assert.match(draw,/for \(const dx of \[6, 16\]\)/);
});
test('pause suspends script and dialogue deadlines rather than consuming demo time',()=>{
 const c={performance:{now:()=>0},tutorial:{active:true,pvpDemoStartedAt:80,dialogueLineStartedAt:60,pvpScriptActions:[{dueAt:900}],smokeClouds:[{born:50}]},game:{state:'paused'}};
 vm.createContext(c);vm.runInContext(section(hook,'let tutorialClockSuspendedAt','const originalUpdate ='),c);
 c.synchronizeTutorialClock(100);c.synchronizeTutorialClock(7100);c.game.state='playing';c.synchronizeTutorialClock(7100);
 assert.equal(c.tutorial.pvpDemoStartedAt,7080);assert.equal(c.tutorial.dialogueLineStartedAt,7060);assert.equal(c.tutorial.pvpScriptActions[0].dueAt,7900);assert.equal(c.tutorial.smokeClouds[0].born,7050);
});
test('demonstrations require actual results instead of remote catches or timed success',()=>{
 const s=section(scene,'function updatePvpDemonstration','function startPvpFinalMatch');
 assert.doesNotMatch(s,/attemptPvpFlyCatch\(/);assert.doesNotMatch(s,/if \(completed \|\|/);
 assert.match(s,/if \(!completed && elapsed >= tutorial\.pvpDemoDuration \+ 2\.0\)/);
 assert.match(s,/tutorial\.pvpDemoBonkCount >= 2/);
});
test('sky-buffer tap is scheduled by landing time instead of a fixed pixel gap',()=>{
 const s=section(scene,'function updatePvpScriptedBuffer','function holdEmberStill');assert.match(s,/const timeToLanding/);assert.match(s,/timeToLanding > \.14/);assert.match(s,/queuePvpScriptAction\(55/);
});
test('Right Shift release and pause clicking cannot cancel or advance tutorial dialogue',()=>{
 assert.equal((hook.match(/tutorial\.kind === "pvp" && event\.code === "ShiftRight"/g)||[]).length,2);
 assert.match(hook,/if \(pointInsideRect\(getCanvasPoint\(event\), HUD_UI\.pauseButton\)\) return/);
});
