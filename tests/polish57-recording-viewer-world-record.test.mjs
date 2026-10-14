import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
const replay=read('client/game/133-engine-replay.js');
const getPart=(start,end)=>replay.slice(replay.indexOf(start),replay.indexOf(end));
function countdownVM(){
  const part=getPart('function ribbitReplayEnsureCountdown(data)', '// Merge historical round recordings');
  const ctx={RIBBIT_REPLAY_COUNTDOWN_STEP_MS:750};vm.createContext(ctx);vm.runInContext(part,ctx);
  const f=(t,phase='playing')=>({t,phase,gameState:{state:phase},player:{x:10,y:80,w:22,h:14,dir:1},players:[],flies:[]});
  const base={kind:'ribbit-engine-frames',version:2,mode:'solo',level:'park',duration:2000,
    sounds:[{t:100,f:500,d:.1,v:.02,s:0}],frames:[f(100),f(1000),f(2000)]};
  return {ctx,base};
}
test('Polish 57 reconstructs a 3-2-1 opening only when the saved replay does not contain one',()=>{
  const {ctx,base}=countdownVM(); const original=JSON.stringify(base);
  const loaded=ctx.ribbitReplayEnsureCountdown(base);
  assert.equal(loaded.reconstructedCountdown,true);
  assert.equal(loaded.frames[0].phase,'countdown');
  assert.deepEqual(Array.from(new Set(loaded.frames.slice(0,135).map(f=>f.gameState.countdownNumber))),[3,2,1]);
  assert.equal(loaded.frames[135].phase,'playing');
  assert.equal(loaded.frames[135].t,2250);
  assert.equal(loaded.sounds.find(s=>s.f===500).t,2250);
  assert.equal(JSON.stringify(base),original,'saved archive cannot be modified by playback repair');
  const existing={...base,frames:base.frames.map(f=>({...f,phase:'countdown',gameState:{countdownNumber:3}}))};
  assert.equal(ctx.ribbitReplayEnsureCountdown(existing),existing,'do not double-insert already captured countdown');
});
test('Polish 57 adds missing 3 for a replay that begins on countdown 2 without disturbing the existing 2 and 1',()=>{
  const {ctx,base}=countdownVM();base.frames[0].phase='countdown';base.frames[0].gameState={state:'countdown',countdownNumber:2};
  const result=ctx.ribbitReplayEnsureCountdown(base);
  assert.equal(result.frames[0].gameState.countdownNumber,3);
  assert.equal(result.frames[45].gameState.countdownNumber,2);
  assert.equal(result.frames[45].t,750);
});
test('Polish 57 records the original timezone and the visible solo slow-mo fly, keeping replay schema backwards compatible',()=>{
  assert.match(replay,/recordedTimeZone:Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone/);
  assert.match(replay,/visual\.soloCriticalCatchFlyVisual=\{\.\.\.game\.soloCriticalCatchFlyVisual\}/);
  assert.match(replay,/compatibleVersions:\[1,2\]/);
  assert.match(replay,/ribbitReplayEnsureCountdown\(validated\)/);
  assert.match(replay,/recordedAt:playable\.recordedAt\|\|options\.recordedAt/);
  const upload=read('public/scripts/extended-features.js');
  assert.match(upload,/recordedAt:record\.recordedAt\|\|payload\.recordedAt\|\|payload\.updated/);
});
test('Polish 57 moves a caught fly smoothly to the mouth and draws it after the tongue',()=>{
  const src=read('client/game/71-rendering-entities-hud.js');
  const functionSrc=src.slice(src.indexOf('function drawSlowMotionFlyPull('),src.indexOf('    function drawTongue()'));
  const drawn=[],ctx={clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),lerp:(a,b,t)=>a+(b-a)*t,
    Number,Math,ctx:{globalAlpha:1,fillStyle:'',save(){},restore(){},fillRect(x,y,w,h){drawn.push(['tongue',x,y,w,h]);}},
    drawFlyAt(x,y,size){drawn.push(['fly',x,y,size]);}};
  vm.createContext(ctx);vm.runInContext(functionSrc+';this.draw=drawSlowMotionFlyPull;',ctx);
  const ghost={baseX:180,baseY:50},mouth={x:110,y:80};
  const pos=[];
  for(const seconds of [.2,.55,1.0,1.4]){
    drawn.length=0;ctx.draw(ghost,mouth,seconds,2);
    assert.equal(drawn.at(-1)?.[0],'fly','fly must be foreground, drawn last');
    pos.push(drawn.at(-1)[1]);
  }
  assert.ok(pos[0]>pos[1]&&pos[1]>pos[2]&&pos[2]>pos[3],`smooth movement toward mouth: ${pos}`);
  drawn.length=0;ctx.draw(ghost,mouth,1.8,2);
  assert.ok(!drawn.some(d=>d[0]==='fly'),'the fly enters the frog mouth only at the END of the zoom');
  const render=read('client/game/63-versus-rendering-ui.js');
  assert.match(render,/drawSlowMotionFlyPull\(game\.pvpCriticalCatchFlyVisual,getPvpMouth\(catcher\)/);
  const solo=read('client/game/80-input-loop-startup.js');
  assert.match(solo,/drawSlowMotionFlyPull\(game\.soloCriticalCatchFlyVisual,getFrogMouth\(\)/);
});
test('Polish 57 replay transport has icon-only play/pause/replay, working volume and fixed stopwatch width',()=>{
  for(const icon of ['rr-play-triangle','rr-play-bars','rr-replay-arrow','rr-replay-volume','rr-replay-speed','rr-speed-value'])
    assert.ok(replay.includes(icon),`Missing ${icon}`);
  assert.match(replay,/ribbitReplayView\.volume=clamp\(Number\(event\.target\.value\)\/100,0,1\)/);
  assert.match(replay,/sound\.v\*view\.volume/);
  assert.match(replay,/playState=view\.data && view\.position>=duration-1/);
  assert.match(replay,/glyph\.toggleAttribute\("hidden",playState!==kind\)/);
  const css=read('public/styles/rr-170.css');
  assert.match(css,/\.rr-replay-speed\s*\{[\s\S]*?flex:0 0 clamp\(64px,6\.3vw,93px\)/);
  assert.match(css,/\.rr-spectator-date \{color:#f7fdff;font-size:inherit/);
});
test('Polish 57 frame hotkeys are backwards comma, forwards period, leaving shifted speed keys working',()=>{
  assert.match(replay,/else if\(key==="Comma"\)ribbitReplaySeek\(\(view\.position-\(1000\/RIBBIT_REPLAY_FPS\)\)\/1000\)/);
  assert.match(replay,/else if\(key==="Period"\)ribbitReplaySeek\(\(view\.position\+\(1000\/RIBBIT_REPLAY_FPS\)\)\/1000\)/);
  assert.match(replay,/key==="Comma"&&event\.shiftKey/);
  assert.match(replay,/key==="Period"&&event\.shiftKey/);
});
test('Polish 57 score overlay is centered over 229px playfield, excluding bottom 41px HUD',()=>{
  assert.match(replay,/rect\.y=Math\.round\(\(CONFIG\.playBottom-rect\.h\)\/2\)/);
  assert.match(replay,/const rect=\{w:402,h:128\}/);
  assert.match(replay,/ribbitReplayPreviousDrawScene\(\);[\s\S]*if\(finalHold\)/);
});
test('Polish 57 World Record hover reads actual victory card and prior-holder details after asynchronous appearance',()=>{
  const ui=read('client/game/80-input-loop-startup.js');
  assert.match(ui,/card\.type === "leaderboard"/);
  assert.match(ui,/window\.RibbitPreviousWorldRecord/);
  assert.match(ui,/game\.victoryPointerPoint = point/);
  assert.match(ui,/Re-evaluate the last mouse position on EVERY paint/);
  assert.match(ui,/PREVIOUS HOLDER: NOT RECORDED/);
  const cloud=read('public/scripts/cloud-client.js');
  assert.match(cloud,/readPreviousWorldLeaders/);
  assert.match(cloud,/NEXT BEST/);
  assert.match(cloud,/localStorage\.setItem\(WORLD_RECORD_LEADERS_KEY/);
});
