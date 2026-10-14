import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const read = (file) => readFileSync(new URL(`../client/game/${file}`, import.meta.url), 'utf8');
const catches = read('61-versus-catches-rounds.js');
const tutorialHooks = read('126-tutorial-hooks.js');
const tutorialLifecycle = read('123-tutorial-lifecycle.js');
const tutorialRendering = read('125-tutorial-rendering.js');
const monitoring = read('124-tutorial-monitoring.js');
const rendering = read('63-versus-rendering-ui.js');
const config = read('120-tutorial-config.js');
function extract(source, a, b) {
  const from = source.indexOf(a), to = source.indexOf(b, from + a.length);
  assert.ok(from >= 0 && to > from, `source section ${a}`);
  return source.slice(from, to);
}
function chaseHarness() {
  const players = [
    {index:0, x:97, y:90, w:24, h:16, vx:100, vy:0, grounded:false, tongue:{active:false}},
    {index:1, x:164, y:90, w:24, h:16, vx:-100, vy:0, grounded:false, tongue:{active:false}}
  ];
  const fly = {id:3, baseX:146,baseY:98,vocabIndex:0,pvpPursuers:[true,true]};
  const c={pvpPlayers:players,flyMatchesPrompt:()=>true,getPvpMouth:p=>({x:p.x+p.w/2,y:p.y+p.h/2}),Math,Number,Boolean};
  vm.createContext(c);
  vm.runInContext(extract(catches, 'function pvpFrogActivelyPursuingFly(', 'function getPvpCriticalCatchKind('), c);
  return {c, players, fly, contested:()=>c.pvpFlyContestIsClose(players[0],fly)};
}
test('CLOSE CATCH requires BOTH frogs moving toward one fly within catch range',()=>{
  const h=chaseHarness();
  assert.equal(h.contested(),true);
  h.players[1].vx=0;
  assert.equal(h.contested(),false,'stationary Ember must not trigger CLOSE CATCH');
  h.players[1].vx=100;
  assert.equal(h.contested(),false,'Ember moving AWAY from fly must not trigger it');
  h.players[1].vx=-100;h.players[0].x=-20;
  assert.equal(h.contested(),false,'far player never triggers contest');
  h.players[0].x=97;h.players[1].bonked=true;
  assert.equal(h.contested(),false,'bonked opponent cannot contest');
});
test('an actively extending tongue towards the same fly is an active pursuit, not stale history',()=>{
  const h=chaseHarness();
  h.players[1].vx=0;
  h.players[1].tongue={active:true,targetFlyId:h.fly.id,captured:false,duration:0.6,elapsed:0.2};
  assert.equal(h.contested(),true);
  h.players[1].tongue.captured=true;
  assert.equal(h.contested(),false);
  h.players[1].tongue.active=false;
  assert.equal(h.contested(),false);
});
test('Chapter 15 limits slow-mo to player catch while preserving other chapter criticals',()=>{
  const source=extract(catches, 'function startPvpCriticalCatch(', 'function updatePvpCriticalCatch(');
  const players=[{index:0,x:80,y:80,w:24,h:16},{index:1,x:280,y:80,w:24,h:16}];
  const effects=[];
  const ctx={
    tutorial:{active:true,kind:'pvp'}, tutorialStep:()=>({setup:'pvpDemoDinnerSteal'}),
    game:{mode:'pvp',pvpCriticalCatchActive:false,pvpRoundNumber:1,promptSerial:1,pvpSuddenDeath:false},
    pvpPlayers:players, OnlineVersus:{canStartCritical:()=>true},
    CONFIG:{playBottom:230,flyGrowDuration:.3}, W:480,
    clamp:(v,a,b)=>Math.min(Math.max(v,a),b),tone:(...a)=>effects.push(a),
    Number,Math,Array
  };
  vm.createContext(ctx);vm.runInContext(source,ctx);
  const fly={id:19,x:110,y:90,baseX:110,baseY:90,vocabIndex:1};
  // Ember's scripted DINNER STEAL demonstration is cinematic. During the
  // player's turn, an accidental assisted Ember catch stays at normal speed.
  ctx.tutorialStep=()=>({setup:'pvpDinnerSteal'});
  assert.equal(ctx.startPvpCriticalCatch(players[1],fly,'technique'),false);
  assert.equal(ctx.game.pvpCriticalCatchActive,false);
  assert.equal(effects.length,0,'player-turn Ember catch does not play cinematic tones');
  assert.equal(ctx.startPvpCriticalCatch(players[0],fly,'technique'),true);
  assert.equal(ctx.game.pvpCriticalCatchKind,'technique');
});
test('despawn effect fades and removes fly from collision immediately without touching unrelated flies',()=>{
  const source=extract(tutorialLifecycle, '// Visual-only despawn:', 'function beginPoofTransition(');
  let now=1000, clearCalls=0, rendered=0, spark=0;
  const ctx={
    tutorial:{active:true,kind:'pvp',flyDespawnEffects:[]},
    flies:[{id:1,x:100,y:75,state:'active',tutorialAuthored:true,tutorialArmed:true,vocabIndex:1},
      {id:2,x:240,y:75,state:'active',tutorialAuthored:false,tutorialArmed:true,vocabIndex:2}],
    tutorialFlyKey:fly=>String(fly.id), clearLabelCaches:()=>clearCalls++,
    performance:{now:()=>now},ctx:{save(){},restore(){},fillRect(){spark++;},set globalAlpha(a){this.alpha=a},set fillStyle(a){}},
    drawFlyAt:()=>rendered++,clamp:(n,l,h)=>Math.min(h,Math.max(n,l)),Math,Number,Set,Array
  };
  vm.createContext(ctx);vm.runInContext(source,ctx);
  assert.equal(ctx.despawnTutorialFlies(),1);
  assert.equal(ctx.flies.length,1);
  assert.equal(ctx.flies[0].id,2);
  assert.equal(ctx.tutorial.flyDespawnEffects.length,1);
  now=1130;ctx.drawTutorialFlyDespawnEffects();
  assert.ok(rendered>0 && spark>=8);
  now=1500;ctx.drawTutorialFlyDespawnEffects();
  assert.equal(ctx.tutorial.flyDespawnEffects.length,0);
  assert.equal(clearCalls,1);
  // The generic pool from a previous round also poofs out in an authored lesson.
  assert.equal(ctx.despawnTutorialFlies({onlyUnrelated:true}),1);
  assert.equal(ctx.flies.length,0);
});
test('end of final 1v1 removes all flies, spawn tickets and matching term before Ember speaks',()=>{
  const source=extract(monitoring,'function beginPvpTutorialEnding() {','function monitorPvp() {');
  const ctx={
    tutorial:{pvpFinalOutcome:null,dynamicDialogueLines:null,kind:'pvp',active:true,promptHidden:false},
    pvpPlayers:[{score:7},{score:0}],
    game:{state:'won',pvpWinnerIndex:0,pvpMatchWinnerIndex:0,pvpCpuEnabled:true,pvpSetupSkinIds:['pink','ember'],
      targetVocabIndex:7,spawnQueue:[{vocabIndex:5}],pvpCriticalCatchActive:false},
    performance:{now:()=>4000},
    despawnTutorialFlies:()=>{ctx.flies.length=0;return 3;},
    flies:[{id:1},{id:2},{id:3}],
    PVP_WIN_DIALOGUE:['win'],PVP_LOSE_DIALOGUE:['lose'],
    beginPoofTransition(opts){ctx.finalPoofOptions=opts;return true;},
    positionPvp(player,x,y,dir){Object.assign(player,{x,y,dir})},
    CONFIG:{groundY:214},
    openDynamicDialogue:()=>{ctx.spokeAfterPoof=true;},Number
  };
  vm.createContext(ctx);vm.runInContext(source,ctx);ctx.beginPvpTutorialEnding();
  assert.equal(ctx.flies.length,0);
  assert.equal(ctx.game.spawnQueue.length,0);
  assert.equal(ctx.game.targetVocabIndex,null);
  assert.equal(ctx.tutorial.promptHidden,true);
  assert.equal(ctx.tutorial.pvpFinalOutcome,'win');
  assert.equal(ctx.finalPoofOptions.reason,'pvp-final-post-victory');
  ctx.finalPoofOptions.action();
  assert.equal(ctx.spokeAfterPoof,true);
});
test('only tutorial final countdown advances scenery clock; simulation remains paused',()=>{
  assert.match(tutorialHooks,/game\.state === "countdown" && tutorial\.kind === "pvp"[\s\S]{0,145}setup === "pvpFinalMatch"/);
  assert.match(tutorialHooks,/game\.visualTime \+= Math\.max/);
  assert.match(tutorialHooks,/const result = originalUpdate\.call\(this, dt, \.\.\.rest\)/);
});
test('close catch title appears in tutorials only for a real two-frog contest',()=>{
  assert.match(catches,/title !== "CLOSE CATCH!" && window\.RibbitTutorialShouldHidePvpCatchTitle/);
  assert.match(catches,/pvpFrogActivelyPursuingFly\(player, targetFly\) &&/);
  assert.match(catches,/pvpFrogActivelyPursuingFly\(other, targetFly\)/);
  assert.match(catches,/game\.pvpCriticalCatchKind === "contest" \? "CLOSE CATCH!"/);
  assert.match(tutorialRendering,/drawTutorialFlyDespawnEffects\(\)/);
  assert.match(config,/flyDespawnEffects: \[\]/);
  assert.match(rendering,/tutorial\.pvpFinalOutcome !== null/);
});
