import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=(name)=>fs.readFileSync(new URL(`../client/game/${name}`,import.meta.url),'utf8');
const scenarios=read('122-tutorial-scenarios.js');
const monitors=read('124-tutorial-monitoring.js');
const hooks=read('126-tutorial-hooks.js');
const renderer=read('71-rendering-entities-hud.js');
const world=read('61-versus-catches-rounds.js');
const preview=read('125-tutorial-rendering.js');
function cut(text,a,b){const i=text.indexOf(a),j=text.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,`cannot extract ${a}`);return text.slice(i,j)}
function evalSource(text,env){vm.createContext(env);vm.runInContext(text,env);return env}

test('under-bonk starts at right edge and Ember cannot reach the high perch on a 50% charge',()=>{
  assert.match(scenarios,/case "pvpUnderBonkTwo"[\s\S]*?middleLeft\.w - p1\.w - 2/);
  assert.match(monitors,/setup === "pvpUnderBonkTwo"[\s\S]*?scriptPvpChargedJump\(1, \.50, -1, 0\)/);
  const rise=(463*.5)**2/(2*820);
  assert.ok(200-rise>126,'the 50% frog head stays below a player on y=126');
  assert.ok(200-rise<176,'but can rise beneath a frog at the lower-middle perch');
  assert.match(preview,/BUFFER DROP OFF THE RIGHT EDGE/);
});

test('avoid-under starts at indicated x with Ember facing left',()=>{
  const b=cut(scenarios,'case "pvpAvoidUnder"','case "pvpDemoRebound"');
  assert.match(b,/positionPvpOnPlatform\(p1, perch, 1\)/);
  assert.match(b,/positionPvp\(ember, perch\.x - ember\.w - 12, CONFIG\.groundY - ember\.h, 1\)/);
});

test('first demonstration rebound has no artificial paired catch sparkles',()=>{
  const b=cut(hooks,'const originalBouncePvpPlayersSidewaysForTutorial','const originalAttemptPvpFlyCatchForTutorial');
  assert.match(b,/tutorialStep\(\)\?\.setup === "pvpReboundThree"/);
  assert.doesNotMatch(b,/\["pvpDemoRebound", "pvpReboundThree"/);
});

test('player can make only one grounded jump per rebound layout',()=>{
  let launches=0;
  const t={active:true,kind:'pvp'};
  const env={tutorial:t,tutorialStep:()=>({setup:'pvpReboundThree'}),tutorialBlocksLiveInput:()=>false,
    pvpPlayers:[{firstJumpMade:true,grounded:true},{index:1}],getPvpCpuIndex:()=>1,
    pressPvpButton(){launches++;},Array,Number};
  evalSource(cut(hooks,'const originalPressPvpButtonForTutorial','const originalReleasePvpButtonForTutorial'),env);
  env.pressPvpButton(0,'human');assert.equal(launches,0);
  env.pvpPlayers[0].grounded=false;env.pressPvpButton(0,'human');assert.equal(launches,1);
  env.pvpPlayers[0].grounded=true;env.pvpPlayers[0].firstJumpMade=false;
  env.pressPvpButton(0,'human');assert.equal(launches,2);
});

test('fly stays on the real tongue tip while reel-in continues',()=>{
  let pos=null;const ctx={save(){},restore(){},fillRect(){},globalAlpha:1,fillStyle:''};
  const tongue={active:true,captured:true,targetFlyId:17,targetX:100,targetY:60,elapsed:.75,duration:1};
  const env={ctx,drawFlyAt(x,y,scale){pos={x,y,scale}},Math,Number,
    clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,t)=>a+(b-a)*t};
  evalSource(cut(renderer,'    function drawSlowMotionFlyPull','    function drawTongue'),env);
  env.drawSlowMotionFlyPull({id:17,x:100,y:60}, {x:20,y:50},.3,2,{tongue,dir:1});
  assert.ok(Math.abs(pos.x-(20+80*Math.sin(.75*Math.PI)))<.001);
  assert.ok(Math.abs(pos.y-(50+10*Math.sin(.75*Math.PI)))<.001);
  tongue.captured=false;pos=null;
  env.drawSlowMotionFlyPull({id:17,x:100,y:60}, {x:20,y:50},.3,2,{tongue,dir:1});
  assert.equal(pos.x,100,'the fly stays at its original location until actually caught');
  tongue.captured=true;tongue.active=false;pos=null;
  env.drawSlowMotionFlyPull({id:17,x:100,y:60}, {x:20,y:50},.3,2,{tongue,dir:1});
  assert.equal(pos,null,'when the tongue reaches the mouth the fly is swallowed');
});

test('during a final match catch cinematic the original targeted fly scores but a second fly cannot',()=>{
  let caught=[];
  const tutorial={active:true,kind:'pvp',pvpFinalOutcome:null};
  const game={mode:'pvp',state:'playing',pvpCriticalCatchActive:true,pvpCriticalCatchFlyVisual:{id:17},pvpWinPendingIndex:null};
  const env={tutorial,tutorialStep:()=>({setup:'pvpFinalMatch'}),game,OnlineVersus:{isGuestActive:()=>false},
    registerPvpFlyPursuit(){},pvpFlyBlockedForPlayer:()=>false,flyMatchesPrompt:()=>true,
    completePvpCorrectCatch(player,fly){caught.push(fly.id);return true},
    beginPvpWrongCatch(){throw Error('not a wrong fly')},pvpPlayers:[]};
  evalSource(cut(world,'    function attemptPvpFlyCatch','    function shouldStartPvpCriticalCatch'),env);
  assert.equal(env.attemptPvpFlyCatch({index:0},{id:18,state:'active'}),false);
  assert.equal(env.attemptPvpFlyCatch({index:0},{id:17,state:'active'}),true);
  assert.deepEqual(caught,[17]);
  game.state='won';assert.equal(env.attemptPvpFlyCatch({index:0},{id:17,state:'active'}),false);
});

test('tutorial final last-second catch takes clutch priority even when contested',()=>{
  const tutorial={active:true,kind:'pvp'};
  const game={mode:'pvp',pvpCriticalCatchActive:false,pvpTimeLimitSeconds:30,pvpTimeRemaining:.5,
    pvpSuddenDeath:false,pvpTimerGraceActive:false};
  const player={index:0,score:2};
  const env={tutorial,tutorialStep:()=>({setup:'pvpFinalMatch'}),game,pvpPlayers:[player,{index:1,score:2}],
    getPvpTargetScore:()=>99,isPvpEndlessMode:()=>true,flyMatchesPrompt:()=>true,
    pvpFlyContestIsClose:()=>true,Number};
  evalSource(cut(world,'    function getPvpCriticalCatchKind','    function completePvpCorrectCatch'),env);
  assert.equal(env.getPvpCriticalCatchKind(player,{id:5}),'clutch');
  game.pvpTimeRemaining=1.01;
  assert.equal(env.getPvpCriticalCatchKind(player,{id:5}),'contest');
});

test('real last-second catches display CLUTCH CATCH in the Ember final, but scripted tutorial titles stay hidden',()=>{
  const code=cut(hooks,'window.RibbitTutorialShouldHidePvpCatchTitle = ()','const originalMarkAchievementEarnedForTutorial');
  const env={window:{},tutorial:{active:true,kind:'pvp'},game:{pvpCriticalCatchKind:'clutch'},tutorialStep:()=>({setup:'pvpFinalMatch'}),Boolean};
  evalSource(code,env);
  assert.equal(env.window.RibbitTutorialShouldHidePvpCatchTitle(),false,'do not suppress final-match clutch title');
  env.game.pvpCriticalCatchKind='technique';
  assert.equal(env.window.RibbitTutorialShouldHidePvpCatchTitle(),true);
  env.game.pvpCriticalCatchKind='clutch';env.tutorialStep=()=>({setup:'pvpDinnerSteal'});
  assert.equal(env.window.RibbitTutorialShouldHidePvpCatchTitle(),true);
});

test('chapter-switch while poofing resets hidden flags, smoke and callbacks',()=>{
  const b=cut(preview,'function applyTutorialChapterPreview()','function drawTutorialPauseArrow(');
  assert.match(b,/tutorial\.resetAction = null/);
  assert.match(b,/tutorial\.pvpHiddenPlayerIndices = \[\]/);
  assert.match(b,/tutorial\.pvpFrogsHidden = false/);
  assert.match(b,/tutorial\.frogHidden = false/);
  assert.match(b,/tutorial\.smokeClouds\.length = 0/);
});

test('final race forces fresh one-round timer and shows EMBER meter during countdown',()=>{
  const start=scenarios.slice(scenarios.indexOf('function startPvpFinalMatch()'));
  assert.match(start,/game\.pvpRoundAwardedToken = null/);
  assert.match(start,/game\.pvpRoundWins = \[0,0\]/);
  assert.match(start,/game\.pvpTimeRemaining = 30/);
  const hud=read('63-versus-rendering-ui.js');
  assert.match(hud,/tutorialFinalMatch && \(game\.state === "countdown"/);
});

test('victory completes before both frogs poof into the closing Ember dialogue',()=>{
  const b=cut(monitors,'function beginPvpTutorialEnding()','function monitorPvp()');
  assert.match(b,/reason: "pvp-final-post-victory"/);
  assert.match(b,/positionPvp\(pvpPlayers\[0\], 150/);
  assert.match(b,/positionPvp\(pvpPlayers\[1\], 300/);
  assert.match(b,/openDynamicDialogue\(playerWon/);
});
