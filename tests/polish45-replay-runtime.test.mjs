import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { gzipSync, gunzipSync } from 'node:zlib';
const replaySource=readFileSync('client/game/133-engine-replay.js','utf8');
const captureSource=replaySource.slice(0,replaySource.indexOf('// The stage belongs to the canvas alone'));

function newRecorder(mode='solo'){
  let now=0;
  const time={now:()=>now};
  const sandbox={
    performance:time,window:{},game:{state:'playing',mode,selectedLevelId:'park',elapsed:0,visualTime:0,worldTime:0,score:0,jumps:0,
      targetVocabIndex:0,soloCriticalCatchActive:false,soloCriticalCatchDuration:1.7,
      soloCriticalCatchElapsed:0,selectedSkinId:'azure',skinId:'azure'},
    frog:{x:10,y:100,w:22,h:14,vx:0,vy:0,dir:1,grounded:true,danceTime:0,afterimages:[]},
    tongue:{active:false,elapsed:0,duration:.24,targetX:0,targetY:0,captured:false},
    pvpPlayers:[{x:40,y:100,w:22,h:14,dir:1,grounded:true,afterimages:[],tongue:{active:false}},{x:180,y:100,w:22,h:14,dir:-1,grounded:true,afterimages:[],tongue:{active:false}}],
    flies:[{id:1,x:110,y:25,baseX:110,baseY:25,phase:0,spawnAge:2,vocabIndex:0,state:'alive'}],
    tutorial:{active:false}, OnlineVersus:{isSpectating:()=>false},
    VOCABULARY:[{english:'To speak',spanish:'Hablar'}],LEVELS:{park:{}},
    setTimeout,clearTimeout,Math,Promise,console
  };
  vm.createContext(sandbox);
  vm.runInContext(captureSource,sandbox,{filename:'133-engine-replay-capture.js'});
  return {sandbox,advance(ms=1000/60){now+=ms;sandbox.game.elapsed=now/1000;sandbox.game.worldTime=now/1000;sandbox.frog.x+=.3;sandbox.ribbitReplayCaptureTick(now)},tick(){sandbox.ribbitReplayCaptureTick(now)},now:()=>now};
}

test('Polish 45 replay samples 60 snapshots per second with real fly label, solo tongue, camera and afterimage state',()=>{
  const rt=newRecorder();
  rt.tick();
  for(let i=0;i<64;i++){
    if(i===22){
      rt.sandbox.game.soloCriticalCatchActive=true;
      rt.sandbox.game.soloCriticalCatchElapsed=.12;
      rt.sandbox.tongue.active=true;
      rt.sandbox.tongue.elapsed=.075;
      rt.sandbox.tongue.targetX=114;
      rt.sandbox.frog.afterimages.push({x:7,y:88,life:.5,maxLife:.5,light:'#ffe1bb',mid:'#baae77'});
      rt.sandbox.window.RibbitReplaySoundCapture(470,.12,.02,80,.025);
    }
    rt.advance();
  }
  const result=rt.sandbox.ribbitReplayExportCurrent();
  assert.equal(result.fps,60);
  assert.equal(result.kind,'ribbit-engine-frames');
  assert.ok(result.frames.length>=60,`${result.frames.length} frames in ~1.07 seconds`);
  const zoom=result.frames.find(f=>f.gameState.soloCriticalCatchActive===true);
  assert.ok(zoom);
  assert.equal(zoom.tongue.active,true);
  assert.equal(zoom.tongue.targetX,114);
  assert.equal(zoom.flies[0].vocabIndex,0);
  assert.equal(zoom.player.afterimages[0].light,'#ffe1bb');
  assert.equal(result.sounds.length,1);
  assert.equal(result.sounds[0].f,470);
  assert.equal(result.sounds[0].d,.12);
  assert.ok(rt.sandbox.validateRibbitReplayData(result));
  const decoded=JSON.parse(gunzipSync(gzipSync(Buffer.from(JSON.stringify(result)))).toString());
  assert.equal(decoded.sounds[0].f,470);
  assert.equal(decoded.frames.length,result.frames.length);
});

test('Polish 45 waits through the full three-second victory dance then retains final time and jumps',async()=>{
  const rt=newRecorder();
  rt.tick();
  for(let i=0;i<70;i++)rt.advance();
  rt.sandbox.game.state='won';
  rt.sandbox.game.finishTime=1.16;
  rt.sandbox.game.jumps=7;
  rt.sandbox.game.score=5;
  rt.tick();
  const finished=rt.sandbox.ribbitReplayWhenComplete();
  for(let i=0;i<184;i++){
    rt.sandbox.frog.danceTime+=1/60;
    rt.advance();
  }
  await finished;
  const result=rt.sandbox.ribbitReplayExportCurrent();
  assert.equal(result.final.danceMs,3000);
  assert.equal(result.final.time,1.16);
  assert.equal(result.final.jumps,7);
  assert.equal(result.final.score,5);
  const dance=result.frames.filter(f=>f.phase==='won');
  assert.ok(dance.length>=175,`victory frames: ${dance.length}`);
  assert.ok(dance.at(-1).player.danceTime>=3);
  assert.ok(result.duration>result.frames.at(-1).t);
});

test('Polish 45 holds replay clocks during pause and resumes the same 60fps recording',()=>{
  const rt=newRecorder();
  rt.tick();for(let i=0;i<30;i++)rt.advance();
  rt.sandbox.game.state='paused';rt.tick();
  for(let i=0;i<180;i++)rt.advance();
  rt.sandbox.game.state='playing';for(let i=0;i<30;i++)rt.advance();
  const result=rt.sandbox.ribbitReplayExportCurrent();
  assert.ok(result.frames.length>=58);
  assert.ok(result.frames.at(-1).t<1800,`paused interval is omitted: ${result.frames.at(-1).t}ms`);
});
