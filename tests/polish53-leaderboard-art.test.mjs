import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';

const root=resolve(import.meta.dirname,'..');
const source=readFileSync(resolve(root,'client/game/130-polish-ui-replay-language.js'),'utf8');
const uiSource=readFileSync(resolve(root,'client/game/40-ui-navigation-audio.js'),'utf8');
const read=(f)=>readFileSync(resolve(root,f),'utf8');

function extractFunction(name){
  const anchor=`function ${name}(`;
  const start=source.indexOf(anchor);
  assert.ok(start>=0,`missing ${name}`);
  let depth=0, first=source.indexOf('{',start),last=first;
  for(let i=first;i<source.length;i++){
    if(source[i]==='{')depth++;
    if(source[i]==='}'&&!--depth){last=i+1;break;}
  }
  return source.slice(start,last);
}

test('leaderboard pager uses same button positions as Achievements and places count to left',()=>{
  const draw=extractFunction('drawLeaderboardScreen');
  assert.match(draw,/const prev = ACHIEVEMENTS_UI\.pagePrevButton/);
  assert.match(draw,/const next = ACHIEVEMENTS_UI\.pageNextButton/);
  assert.match(draw,/const back = ACHIEVEMENTS_UI\.backButton/);
  assert.match(draw,/prev\.x - 8,/);
  assert.match(draw,/prev\.y \+ \(prev\.h - 7 \* pageLabelScale\) \/ 2,/);
  assert.match(draw,/pageLabelScale, "right"/);
  assert.doesNotMatch(draw,/const prev = \{ x: 52, y: 226/);
  assert.doesNotMatch(draw,/drawBitmapText\(`\$\{polish\.leaderboardPage \+ 1\}\/\$\{pageCount\}`, 99/);
  assert.match(uiSource,/pagePrevButton: Object\.freeze\(\{ x: 344, y: 232, w: 20, h: 20 \}\)/);
  assert.match(uiSource,/pageNextButton: Object\.freeze\(\{ x: 370, y: 232, w: 20, h: 20 \}\)/);
});

test('trophy crop visibly centers pixel artwork inside 28x28 button',()=>{
  const calls=[];
  const ctx={fillRect(){},save(){},restore(){},drawImage(...args){calls.push(args);}};
  const context={ctx,leaderboardMedalSprite:{complete:true,naturalWidth:26},
    getSelectedSkin:()=>({dark:'#223',mid:'#445',belly:'#ffe'}),
    COLORS:{ink:'#202b33'},mixHexColors:()=> '#eff',window:{}};
  vm.runInNewContext(extractFunction('drawMiniMedalButton')+'; globalThis.renderMedal=drawMiniMedalButton;',context);
  context.renderMedal({x:416,y:229,w:28,h:28},false);
  assert.equal(calls.length,1,'draw medal once');
  const [img,sx,sy,sw,sh,dx,dy,dw,dh]=calls[0];
  assert.ok(img);
  assert.deepEqual([sx,sy,sw,sh],[1,3,23,17],'crop exact visible alpha region');
  assert.deepEqual([dw,dh],[23,17]);
  assert.ok(Math.abs(dx+dw/2-(416+14))<=0.5,'center artwork horizontally');
  assert.ok(Math.abs(dy+dh/2-(229+14))<=0.5,'center artwork vertically');
});

test('ten unique 20x20 transparent refresh icon concepts are included, while original refresh is retained',()=>{
  const previews=resolve(root,'DESIGN_PREVIEWS');
  const items=readdirSync(resolve(previews,'refresh-icons')).filter(f=>f.endsWith('.png'));
  assert.equal(items.length,10);
  assert.equal(new Set(items).size,10);
  for(const file of items){
    const buffer=readFileSync(resolve(previews,'refresh-icons',file));
    assert.equal(buffer.subarray(1,4).toString('ascii'),'PNG');
    assert.equal(buffer.readUInt32BE(16),20);
    assert.equal(buffer.readUInt32BE(20),20);
  }
  assert.ok(statSync(resolve(previews,'refresh-icon-concepts.png')).size>15000);
  assert.match(source,/function drawLeaderboardRefreshIcon\(/);
  assert.match(extractFunction('drawLeaderboardScreen'),/drawLeaderboardRefreshIcon\(/);
});

test('version and built runtime stay synchronized',()=>{
  assert.equal(JSON.parse(read('package.json')).version,'1.7.46');
  assert.match(read('public/scripts/game.bundle.js'),/const RIBBIT_DISPLAY_VERSION = "VERSION 1\.7\.46"/);
  assert.match(read('public/index.html'),/2026\.10\.13-friends-polish-58/);
});
