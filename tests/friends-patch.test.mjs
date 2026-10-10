import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {pbkdf2Sync} from "node:crypto";
import {PIN_PBKDF2_ITERATIONS,pinHash,BUILD} from "../src/common.js";
import vocabulary from "../src/vocabulary.json" with {type:"json"};

const expectedVocabulary = [{"english": "To be", "spanish": "Ser, Estar"}, {"english": "To go", "spanish": "Ir"}, {"english": "To do", "spanish": "Hacer"}, {"english": "To have", "spanish": "Tener"}, {"english": "To speak", "spanish": "Hablar"}, {"english": "Good", "spanish": "Bueno"}, {"english": "Big", "spanish": "Grande"}, {"english": "Easy", "spanish": "Fácil"}, {"english": "Fast", "spanish": "Rápido"}, {"english": "New", "spanish": "Nuevo"}, {"english": "Student", "spanish": "Estudiante"}, {"english": "Book", "spanish": "Libro"}, {"english": "University", "spanish": "Universidad"}, {"english": "School", "spanish": "Escuela"}, {"english": "Country", "spanish": "País"}];
const html = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

test("PIN hashing stays within Cloudflare PBKDF2 limit and matches 100000 rounds",()=>{
  assert.equal(PIN_PBKDF2_ITERATIONS,100000);
  const expected=pbkdf2Sync("u:1234","salt",100000,32,"sha256").toString("hex");
  assert.equal(pinHash("u","1234","salt"),expected);
  assert.doesNotMatch(fs.readFileSync(new URL("../src/common.js",import.meta.url),"utf8"),/120000/);
});

test("Friends release exposes the new build marker",()=>{
  assert.equal(BUILD,"2026.10.09-friends-stable-word-labels-1 ".trim());
  assert.match(html,/2026\.10\.09\-friends\-stable\-word\-labels\-1/);
});

test("server vocabulary is exactly the requested 15 entries",()=>{
  assert.deepEqual(vocabulary,expectedVocabulary);
});

test("offline fallback vocabulary matches the server vocabulary",()=>{
  for(const item of expectedVocabulary){
    assert.ok(html.includes(JSON.stringify(item).slice(1,-1).replaceAll('\"','"')) || (html.includes(item.english)&&html.includes(item.spanish)));
  }
  assert.match(html,/const FALLBACK_VOCABULARY = Object\.freeze/);
});

test("logout uses an explicit auth input lock and game suspension hook",()=>{
  assert.match(html,/setGameInputLocked\(true\);\s*onlineIdentityGeneration\+\+/);
  assert.match(html,/window\.RibbitRaceSuspendForLogin = \(\) =>/);
  assert.match(html,/game\.state = "friendsLogin"/);
  assert.match(html,/window\.RibbitFriendsGameInputLocked = \(\) => gameInputLocked/);
  assert.match(html,/if \(friendsGameInputLocked\(\)\) \{\s*lastFrameTime = now;\s*accumulator = 0;/);
});

test("auth gate hides and inerts the game until sign-in or guest play",()=>{
  assert.match(html,/<body class="ribbit-auth-locked">/);
  assert.match(html,/<main id="game-frame" inert aria-hidden="true">/);
  assert.match(html,/body\.ribbit-auth-locked #game-frame\{visibility:hidden;\}/);
  assert.match(html,/setGameInputLocked\(false\);\s*elements\["cloud-gate"\]\.hidden = true/);
});

test("global gameplay hotkeys are gated while the login screen owns focus",()=>{
  assert.ok((html.match(/if \(friendsGameInputLocked\(\)\) return;/g)||[]).length >= 8);
  assert.match(html,/function handlePhysicalJumpDown\(event\) \{\s*if \(friendsGameInputLocked\(\)\) return;/);
  assert.match(html,/window\.addEventListener\("keydown", \(event\) => \{\s*if \(friendsGameInputLocked\(\)\) return;/);
});


test("Quickplay partner connection check is capped at 30 seconds",()=>{
  assert.match(html,/const DIRECT=Object\.freeze\(\{version:2,connectMs:30000,/);
  assert.doesNotMatch(html,/connectMs:45000/);
  assert.match(html,/quickConnecting[^\n]+>DIRECT\.connectMs\)\{/);
});

test("queued device-check status is centered inside Play While Waiting",()=>{
  assert.match(html,/minimize:\{x:115,y:204,w:250,h:29\}/);
  assert.match(html,/subLabel=''/);
  assert.match(html,/DEVICE CHECK PASSED - PARTNER LINK NOT YET TESTED/);
  assert.match(html,/Status is centered inside PLAY WHILE WAITING/);
  assert.doesNotMatch(html,/fitText\('DEVICE CHECK PASSED - PARTNER LINK NOT YET TESTED',240,225/);
});


test("single-player fly labels keep persistent placements instead of re-solving every frame",()=>{
  assert.match(html,/const flyLabelPlacementCache = new Map\(\);/);
  assert.match(html,/function chooseFlyLabelRect\(currentFly, anchor, width, height\)/);
  assert.match(html,/if \(cached && cached\.signature === signature\) return cached\.rect;/);
  assert.match(html,/flyLabelPlacementCache\.set\(cacheKey, \{ signature, rect: stableRect \}\);/);
  assert.match(html,/function drawScene\(\) \{\s*\/\/ Prune labels only when a fly actually leaves[\s\S]{0,220}pruneFlyLabelPlacementCache\(\);/);
  assert.doesNotMatch(html,/flyLabelLayoutStamp = game\.visualTime/);
  assert.doesNotMatch(html,/flyLabelRectsThisFrame\.length = 0/);
});

test("single-player vocabulary text has no fractional duplicate render pass",()=>{
  const start=html.indexOf("function drawFlyNameTag(currentFly)");
  const end=html.indexOf("function getFlySpawnScale",start);
  const block=html.slice(start,end);
  assert.ok(start>=0 && end>start);
  assert.doesNotMatch(block,/translate\(0\.25,\s*0\)/);
  assert.equal((block.match(/drawBitmapTextLayout\(layout,/g)||[]).length,1);
});


function extractFunctionSource(source,name){
  const marker=`function ${name}(`;
  const start=source.indexOf(marker);
  assert.ok(start>=0,`Missing ${name}`);
  const brace=source.indexOf("{",start);
  let depth=0;
  for(let i=brace;i<source.length;i++){
    if(source[i]==="{")depth++;
    else if(source[i]==="}"){depth--;if(depth===0)return source.slice(start,i+1);}
  }
  throw new Error(`Unclosed ${name}`);
}

test("actual label-placement function keeps existing fly rectangles stable as flies spawn and leave",()=>{
  const names=["flyLabelCacheKey","pruneFlyLabelPlacementCache","overlapArea","getFlyLabelHudObstacles","chooseFlyLabelRect"];
  const source=names.map(name=>extractFunctionSource(html,name)).join("\n");
  const make=new Function("game","flies","W","CONFIG","clamp",`const flyLabelPlacementCache=new Map();\n${source}\nreturn {chooseFlyLabelRect,pruneFlyLabelPlacementCache,cache:flyLabelPlacementCache};`);
  const game={mode:"solo"};
  const flies=[];
  const api=make(game,flies,480,{playBottom:244},(v,a,b)=>Math.max(a,Math.min(b,v)));
  const a={id:1,vocabIndex:0,baseX:120,baseY:95};
  const b={id:2,vocabIndex:1,baseX:148,baseY:95};
  flies.push(a,b);
  api.pruneFlyLabelPlacementCache();
  const a1=api.chooseFlyLabelRect(a,{x:a.baseX,y:a.baseY},72,20);
  const b1=api.chooseFlyLabelRect(b,{x:b.baseX,y:b.baseY},72,20);
  for(let frame=0;frame<120;frame++){
    assert.deepEqual(api.chooseFlyLabelRect(a,{x:a.baseX,y:a.baseY},72,20),a1);
    assert.deepEqual(api.chooseFlyLabelRect(b,{x:b.baseX,y:b.baseY},72,20),b1);
  }
  const c={id:3,vocabIndex:2,baseX:134,baseY:110};
  flies.push(c);
  api.pruneFlyLabelPlacementCache();
  api.chooseFlyLabelRect(c,{x:c.baseX,y:c.baseY},72,20);
  assert.deepEqual(api.chooseFlyLabelRect(a,{x:a.baseX,y:a.baseY},72,20),a1);
  assert.deepEqual(api.chooseFlyLabelRect(b,{x:b.baseX,y:b.baseY},72,20),b1);
  flies.splice(flies.indexOf(b),1);
  api.pruneFlyLabelPlacementCache();
  assert.equal(api.cache.has("solo:2"),false);
  assert.deepEqual(api.chooseFlyLabelRect(a,{x:a.baseX,y:a.baseY},72,20),a1);
});

test("failed connection Local Play opens the single-player level menu without auto-starting",()=>{
  assert.match(html,/if\(id==='directLocal'\)\{[\s\S]{0,280}cleanup\(false\);quick\.suspendedActivity=null;quick\.peekActivity=null;openSoloMenu\(false\);return;/);
  assert.doesNotMatch(html,/if\(id==='directLocal'\)\{cleanup\(true\);return;\}/);
});

test("local Versus VS hover draws requested player-switch tooltip",()=>{
  assert.match(html,/function drawPvpVsHoverTooltip\(\)/);
  assert.match(html,/game\.pvpSetupHoveredKey !== "vs"/);
  assert.match(html,/drawBitmapText\("CLICK TO SWITCH TO PLAYER"/);
  assert.doesNotMatch(html,/fitText\("CLICK TO SWITCH TO PLAYER"/);
  assert.match(html,/drawPvpCpuDifficultyControl\(\); drawPvpVsHoverTooltip\(\);/);
});
