import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import { readGameModuleGroup } from "./source-reader.mjs";

const read=(path)=>readFileSync(path,"utf8");
const rendering=readGameModuleGroup(70, 79);

function extractFunctionSource(source,name){
  const marker=`function ${name}(`;
  const start=source.indexOf(marker);
  assert.ok(start>=0,`Missing ${name}`);
  const brace=source.indexOf("{",start);
  let depth=0;
  for(let i=brace;i<source.length;i++){
    if(source[i]==="{")depth++;
    else if(source[i]==="}"){
      depth--;
      if(depth===0)return source.slice(start,i+1);
    }
  }
  throw new Error(`Unclosed ${name}`);
}

test("1.7.10 keeps a right-edge Lake word plate exactly centered over its fly",()=>{
  const names=["flyLabelCacheKey","overlapArea","chooseFlyLabelRect"];
  const source=names.map(name=>extractFunctionSource(rendering,name)).join("\n");
  const make=new Function("game",`${source}\nconst flyLabelPlacementCache=new Map();return {chooseFlyLabelRect};`);
  const api=make({mode:"solo"});
  const fly={id:14,vocabIndex:5,baseX:444,baseY:58};
  const rect=api.chooseFlyLabelRect(fly,{x:444,y:58},110,20);
  assert.equal(rect.x+rect.w/2,444);
  assert.ok(rect.x+rect.w>480,"the label may overlap the pause-button area instead of shifting left");
  assert.ok(rect.y+rect.h<58,"the plate remains above the fly");
});

test("running pause button is deliberately translucent",()=>{
  assert.match(rendering,/const pauseOpacity = game\.state === "paused" \? 0\.84 : game\.sandboxMode \? 0\.66 : 0\.56;/);
  assert.match(rendering,/ctx\.globalAlpha \*= pauseOpacity;/);
  assert.match(rendering,/ctx\.restore\(\);\s*\n\s*\}/);
});

test("pause book and How To Play pages inherit the selected frog palette",()=>{
  assert.match(rendering,/function getPauseBookTheme\(active = false\)/);
  for(const token of ["skin.dark","skin.mid","skin.light","skin.belly"]){
    assert.ok(rendering.includes(token),`missing themed book token ${token}`);
  }
  assert.match(rendering,/drawMiniBookIcon\([^\n]+bookTheme\)/);
  assert.match(rendering,/const bookTheme = getPauseBookTheme\(true\);/);
  assert.match(rendering,/ctx\.fillStyle = bookSkin\.mid;/);
  assert.match(rendering,/drawVersionLabel\([^\n]+bookSkin\.dark\)/);
});

test("record replay API is backed by SQLite and same-origin Worker forwarding",()=>{
  const hub=read("src/hub.js"),worker=read("src/index.js");
  assert.match(hub,/CREATE TABLE IF NOT EXISTS record_replays/);
  assert.match(hub,/async replaySubmit\(request\)/);
  assert.match(hub,/async replayGet\(request,url\)/);
  assert.match(hub,/\/api\/replays\/submit/);
  assert.match(hub,/\/api\/replays\/get/);
  assert.match(worker,/path\.startsWith\('\/api\/replays\/'\)/);
  assert.match(worker,/ORIGIN_DENIED/);
});
