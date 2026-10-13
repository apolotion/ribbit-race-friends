import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {pbkdf2Sync} from "node:crypto";
import vm from "node:vm";
import {PIN_PBKDF2_ITERATIONS,pinHash,BUILD} from "../src/common.js";
import vocabulary from "../src/vocabulary.json" with {type:"json"};

const expectedVocabulary = [{"english": "To be", "spanish": "Ser, Estar"}, {"english": "To go", "spanish": "Ir"}, {"english": "To do", "spanish": "Hacer"}, {"english": "To have", "spanish": "Tener"}, {"english": "To speak", "spanish": "Hablar"}, {"english": "Good", "spanish": "Bueno"}, {"english": "Big", "spanish": "Grande"}, {"english": "Easy", "spanish": "Fácil"}, {"english": "Fast", "spanish": "Rápido"}, {"english": "New", "spanish": "Nuevo"}, {"english": "Student", "spanish": "Estudiante"}, {"english": "Book", "spanish": "Libro"}, {"english": "University", "spanish": "Universidad"}, {"english": "School", "spanish": "Escuela"}, {"english": "Country", "spanish": "País"}];
const indexHtml = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const browserFiles = [
  "../public/scripts/friends-api-client.js",
  "../public/scripts/auth-screen-controller.js",
  "../public/scripts/cloud-client.js",
  "../public/scripts/mobile-experience.js",
  "../public/scripts/game.bundle.js",
  "../public/scripts/bootstrap.js",
  "../public/scripts/playtest-guard.js",
  "../public/scripts/extended-features.js"
];
const styleFiles = [
  "../public/styles/base.css",
  "../public/styles/cloud-ui.css",
  "../public/styles/game-shell.css",
  "../public/styles/extended-features.css"
];
const browserSource = browserFiles.map(file=>fs.readFileSync(new URL(file,import.meta.url),"utf8")).join("\n");
const styles = styleFiles.map(file=>fs.readFileSync(new URL(file,import.meta.url),"utf8")).join("\n");
const html = `${indexHtml}\n${styles}\n${browserSource}`;

test("PIN hashing stays within Cloudflare PBKDF2 limit and matches 100000 rounds",()=>{
  assert.equal(PIN_PBKDF2_ITERATIONS,100000);
  const expected=pbkdf2Sync("u:1234","salt",100000,32,"sha256").toString("hex");
  assert.equal(pinHash("u","1234","salt"),expected);
  assert.doesNotMatch(fs.readFileSync(new URL("../src/common.js",import.meta.url),"utf8"),/120000/);
});

test("Friends release exposes the new build marker",()=>{
  assert.equal(BUILD,"2026.10.13-friends-polish-41");
  assert.match(browserSource,/2026\.10\.13\-friends\-polish\-41/);
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

test("logout confirms the server session and reloads the exact initial login document",()=>{
  assert.match(browserSource,/setGameInputLocked\(true\);\s*onlineIdentityGeneration\+\+/);
  assert.match(browserSource,/const result = await serverCall\("apiLogout"/);
  assert.match(browserSource,/window\.RibbitAuthScreen\?\.reloadToInitialLogin\(\)/);
  assert.match(browserSource,/class AuthScreenController/);
  assert.match(browserSource,/window\.location\.replace\(target\.href\)/);
  assert.match(browserSource,/window\.RibbitRaceSuspendForLogin = \(\) =>/);
  assert.match(browserSource,/game\.state = "friendsLogin"/);
});

test("auth boundary hides and inerts the runtime until sign-in or guest play",()=>{
  assert.match(indexHtml,/<body class="ribbit-auth-locked rr-tutorial-pending">/);
  assert.match(indexHtml,/<main id="game-frame" inert aria-hidden="true">/);
  assert.match(styles,/body\.ribbit-auth-locked #game-frame\{visibility:hidden;\}/);
  assert.match(browserSource,/setGameInputLocked\(false\);\s*elements\["cloud-gate"\]\.hidden = true/);
  assert.match(browserSource,/this\.gameFrame\.setAttribute\("inert", ""\)/);
});

test("index is presentation-only and gameplay source is separated by responsibility",()=>{
  assert.doesNotMatch(indexHtml,/<style\b/i);
  assert.equal((indexHtml.match(/<script\b[^>]*src=/g)||[]).length,13);
  assert.match(indexHtml,/\/scripts\/friends-api-client\.js/);
  assert.match(indexHtml,/\/scripts\/auth-screen-controller\.js/);
  assert.match(indexHtml,/\/scripts\/cloud-client\.js/);
  assert.match(indexHtml,/\/scripts\/game\.bundle\.js/);
  const modules=fs.readdirSync(new URL("../client/game/",import.meta.url)).filter(name=>/^\d+-.+\.js$/.test(name));
  assert.equal(modules.length,29);
  assert.match(fs.readFileSync(new URL("../scripts/build-game.mjs",import.meta.url),"utf8"),/class GameBundleBuilder/);
});


test("AuthScreenController owns runtime locking and clean-login navigation",()=>{
  const source=fs.readFileSync(new URL("../public/scripts/auth-screen-controller.js",import.meta.url),"utf8");
  const attrs=new Map();
  const classes=new Map();
  let suspended=0,replaced="";
  const frame={
    setAttribute:(key,value)=>attrs.set(key,value),
    removeAttribute:key=>attrs.delete(key),
    contains:()=>false
  };
  const context={
    URL, console,
    document:{body:{classList:{toggle:(key,value)=>classes.set(key,Boolean(value))}},getElementById:id=>id==="game-frame"?frame:null,activeElement:null},
    window:{
      location:{href:"https://game.example/"},
      history:{replaceState:()=>{}},
      RibbitRaceSuspendForLogin:()=>{suspended++;}
    }
  };
  context.window.window=context.window;
  context.window.document=context.document;
  context.location=context.window.location;
  context.history=context.window.history;
  vm.runInNewContext(source,context,{filename:"auth-screen-controller.js"});
  const controller=context.window.RibbitAuthScreen;
  controller.setLocked(true);
  assert.equal(classes.get("ribbit-auth-locked"),true);
  assert.equal(attrs.has("inert"),true);
  assert.equal(attrs.get("aria-hidden"),"true");
  assert.equal(suspended,1);
  controller.setLocked(false);
  assert.equal(classes.get("ribbit-auth-locked"),false);
  assert.equal(attrs.has("inert"),false);
  context.window.location.replace=url=>{replaced=url;};
  controller.reloadToInitialLogin();
  assert.match(replaced,/^https:\/\/game\.example\/\?signedOut=1$/);
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
  assert.match(html,/minimize:\{x:115,y:178,w:250,h:28\}/);
  assert.match(html,/cancel:\{x:184,y:231,w:112,h:23\}/);
  assert.match(html,/DEVICE CHECK PASSED - PARTNER LINK NOT YET TESTED/);
  assert.match(html,/const groupTop=y\+\(h-\(mainHeight\+gap\+subHeight\)\)\/2;/);
  assert.match(html,/drawBitmapText\(spec\.subLabel,\(left\+right\)\/2,groupTop\+mainHeight\+gap,subScale/);
  assert.doesNotMatch(html,/y\+h-9,right-left,.39/);
});


test("single-player fly labels keep persistent placements instead of re-solving every frame",()=>{
  assert.match(html,/const flyLabelPlacementCache = new Map\(\);/);
  assert.match(html,/function chooseFlyLabelRect\(currentFly, anchor, width, height\)/);
  assert.match(html,/if \(cached && cached\.vocabIndex === vocabIndex && cached\.width === width && cached\.height === height\) \{[\s\S]{0,80}return cached\.rect;/);
  assert.match(html,/flyLabelPlacementCache\.set\(cacheKey, \{/);
  assert.match(html,/function drawScene\(\) \{\s*pruneFlyLabelPlacementCache\(\);/);
  assert.doesNotMatch(html,/flyLabelLayoutStamp = game\.visualTime/);
  assert.doesNotMatch(html,/flyLabelRectsThisFrame\.length = 0/);
});

test("fly vocabulary text is rasterized once on quarter-step pixel scales",()=>{
  const start=html.indexOf("function drawFlyNameTag(currentFly)");
  const end=html.indexOf("function getFlySpawnScale",start);
  const block=html.slice(start,end);
  assert.ok(start>=0 && end>start);
  assert.doesNotMatch(block,/translate\(0\.25,\s*0\)/);
  assert.match(html,/const scales = \[1, 0\.75, 0\.5\]/);
  assert.match(html,/const flyLabelSpriteCache = new Map\(\);/);
  assert.match(html,/function getFlyLabelSprite\(/);
  assert.match(block,/ctx\.drawImage\(sprite,/);
  assert.doesNotMatch(block,/drawBitmapTextLayout\(layout,/);
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
  const make=new Function("game","flies","W","CONFIG","clamp",`const flyLabelPlacementCache=new Map();\nconst flyLabelSpriteCache=new Map();\n${source}\nreturn {chooseFlyLabelRect,pruneFlyLabelPlacementCache,cache:flyLabelPlacementCache};`);
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
  assert.equal(api.cache.has("solo:2:1"),false);
  assert.deepEqual(api.chooseFlyLabelRect(a,{x:a.baseX,y:a.baseY},72,20),a1);
});

test("online PvP label rectangles survive rebuilt snapshot flies and tiny anchor drift",()=>{
  const names=["flyLabelCacheKey","pruneFlyLabelPlacementCache","overlapArea","getFlyLabelHudObstacles","chooseFlyLabelRect"];
  const source=names.map(name=>extractFunctionSource(html,name)).join("\n");
  const make=new Function("game","flies","W","CONFIG","clamp",`const flyLabelPlacementCache=new Map();\nconst flyLabelSpriteCache=new Map();\n${source}\nreturn {chooseFlyLabelRect,pruneFlyLabelPlacementCache,cache:flyLabelPlacementCache};`);
  const game={mode:"pvp",pvpRoundNumber:2,pvpSuddenDeath:false};
  const flies=[];
  const api=make(game,flies,480,{playBottom:244},(v,a,b)=>Math.max(a,Math.min(b,v)));
  let fly={id:7,vocabIndex:4,baseX:220,baseY:104,state:"active"};
  flies.push(fly);api.pruneFlyLabelPlacementCache();
  const first=api.chooseFlyLabelRect(fly,{x:220,y:104},80,20);
  for(let snapshot=0;snapshot<90;snapshot++){
    // Simulate the guest replacing the fly object from an authoritative snapshot.
    fly={id:7,vocabIndex:4,baseX:220+(snapshot%3-1)*0.49,baseY:104+(snapshot%5-2)*0.37,state:"active"};
    flies[0]=fly;api.pruneFlyLabelPlacementCache();
    const rect=api.chooseFlyLabelRect(fly,{x:fly.baseX,y:fly.baseY},80,20);
    assert.deepEqual(rect,first);
  }
  assert.equal(api.cache.size,1);
  game.pvpRoundNumber=3;
  api.pruneFlyLabelPlacementCache();
  assert.equal(api.cache.size,0,"round change should release prior placements");
});

test("failed connection Local Play opens the single-player level menu without auto-starting",()=>{
  assert.match(html,/if\(id==='directLocal'\)\{[\s\S]{0,280}cleanup\(false\);quick\.suspendedActivity=null;quick\.peekActivity=null;openSoloMenu\(false\);return;/);
  assert.doesNotMatch(html,/if\(id==='directLocal'\)\{cleanup\(true\);return;\}/);
});

test("local Versus VS hover uses one contextual speech bubble",()=>{
  assert.match(html,/function drawPvpVsHoverTooltip\(\)/);
  assert.match(html,/game\.pvpSetupHoveredKey !== "vs"/);
  assert.match(html,/CLICK TO ENABLE LOCAL VERSUS/);
  assert.match(html,/CLICK TO PLAY AGAINST CPU/);
  assert.match(html,/drawPvpCpuDifficultyControl\(\); drawPvpVsHoverTooltip\(\);/);
});


test("owner legacy recovery is request-triggered, one-shot and refuses PIN accounts",()=>{
  const hub=fs.readFileSync(new URL("../src/hub.js",import.meta.url),"utf8");
  assert.match(hub,/OWNER_DELETE_LEGACY_USERNAME/);
  assert.match(hub,/OWNER_LEGACY_DELETE_V2:/);
  assert.match(hub,/runOwnerLegacyCleanup\(\)/);
  assert.match(hub,/async fetch\(request\)\{\s*this\.runOwnerLegacyCleanup\(\);/);
  assert.match(hub,/refused-pin-account/);
  assert.match(hub,/deleted-legacy/);
  assert.match(hub,/DELETE FROM sessions WHERE uid=\?/);
  assert.match(hub,/DELETE FROM awards WHERE uid=\?/);
  assert.match(hub,/DELETE FROM users WHERE id=\?/);
  assert.match(hub,/deletePrivate\(old\.id\)/);
});


test("untimed Single Player top-center fly keeps its word plate above the fly",()=>{
  const names=["flyLabelCacheKey","pruneFlyLabelPlacementCache","overlapArea","getFlyLabelHudObstacles","chooseFlyLabelRect"];
  const source=names.map(name=>extractFunctionSource(html,name)).join("\n");
  const make=new Function("game","flies","W","CONFIG","clamp",`const flyLabelPlacementCache=new Map();\nconst flyLabelSpriteCache=new Map();\n${source}\nreturn {chooseFlyLabelRect};`);
  const game={mode:"solo",soloTimeLimitSeconds:0};
  const fly={id:9,vocabIndex:2,baseX:240,baseY:56};
  const api=make(game,[fly],480,{playBottom:229},(v,a,b)=>Math.max(a,Math.min(b,v)));
  const rect=api.chooseFlyLabelRect(fly,{x:240,y:56},70,20);
  assert.ok(rect.y+rect.h<56,`expected label above fly, received ${JSON.stringify(rect)}`);
});

test("Single Player pause and resume countdown reuse one frozen world bitmap",()=>{
  assert.match(html,/const soloFrozenWorldCanvas = document\.createElement\("canvas"\);/);
  assert.match(html,/function shouldFreezeSoloWorld\(\) \{[\s\S]{0,160}game\.state === "paused" \|\| game\.state === "countdown"/);
  assert.match(html,/if \(freezeSoloWorld && paintSoloFrozenWorld\(\)\) \{[\s\S]{0,180}return;/);
  assert.match(html,/if \(freezeSoloWorld\) captureSoloFrozenWorld\(\);/);
  assert.match(html,/function drawSoloPauseOverlay\(\)/);
});

test("CPU takeover leaves an explicit disconnected-player notice",()=>{
  assert.match(html,/takeoverReason:''/);
  assert.match(html,/state\.takeoverReason=response\.takeover\?\.reason==='left'\?'left':'disconnected'/);
  assert.match(html,/PLAYER DISCONNECTED - CPU LEVEL 5 TAKES OVER/);
  assert.match(html,/drawBitmapText\(departedLabel,W\/2,panel\.y\+6/);
  assert.match(html,/CPU LEVEL 5 TAKES OVER/);
});

test("replaced Quickplay participant is released and routed back to requeue",()=>{
  const rooms=fs.readFileSync(new URL("../src/rooms-core.js",import.meta.url),"utf8");
  assert.match(rooms,/function rrQuickReleaseParticipant_\(cache,room,role\)/);
  assert.match(rooms,/rrQuickReleaseParticipant_\(cache,room,opposite\);/);
  assert.match(rooms,/if\(room\.quickplay\)rrQuickReleaseParticipant_\(cache,room,role\);/);
  assert.match(html,/if\(code==='REPLACED_BY_CPU'&&wasQuickplay\)/);
  assert.match(html,/PLAYER DISCONNECTED - READY TO FIND A NEW MATCH/);
});


test("every fly word plate uses top-only candidate rows",()=>{
  const names=["flyLabelCacheKey","pruneFlyLabelPlacementCache","overlapArea","getFlyLabelHudObstacles","chooseFlyLabelRect"];
  const source=names.map(name=>extractFunctionSource(html,name)).join("\n");
  const make=new Function("game","flies","W","CONFIG","clamp",`const flyLabelPlacementCache=new Map();\nconst flyLabelSpriteCache=new Map();\n${source}\nreturn {chooseFlyLabelRect};`);
  const game={mode:"solo",soloTimeLimitSeconds:0};
  const anchors=[
    [30,51],[240,39],[450,51],[76,105],[404,105],[161,149],[319,149],[240,117]
  ];
  const flies=anchors.map(([x,y],index)=>({id:index+1,vocabIndex:index,baseX:x,baseY:y}));
  const api=make(game,flies,480,{playBottom:229},(v,a,b)=>Math.max(a,Math.min(b,v)));
  for(const fly of flies){
    const rect=api.chooseFlyLabelRect(fly,{x:fly.baseX,y:fly.baseY},Math.min(110,44+fly.id*3),20);
    assert.ok(rect.y+rect.h<=fly.baseY-3,`label must remain above fly ${fly.id}: ${JSON.stringify(rect)}`);
  }
  assert.doesNotMatch(source,/anchorY \+ 10/);
  assert.doesNotMatch(source,/anchorX \+ 11/);
});

test("Friends first-place notice is a world-record notice with hover details",()=>{
  assert.match(html,/WORLD RECORD/);
  assert.match(html,/rr-world-record-hit/);
  assert.match(html,/Fastest time|Fewest jumps|Most PvP wins|Most flies eaten/);
  assert.doesNotMatch(indexHtml,/MIGRATE OLD PRIVATE-KEY ACCOUNT/);
});

test("version 1.7.29 remains in settings and the How To Play book footer",()=>{
  assert.match(html,/const RIBBIT_DISPLAY_VERSION = "VERSION 1\.7\.29"/);
  assert.match(html,/drawVersionLabel\(panel\.x \+ panel\.w \/ 2, panel\.y \+ panel\.h - 14, "center"/);
  assert.doesNotMatch(html,/drawVersionLabel\(399, 218, "right"\)/);
  assert.match(html,/function getPauseBookTheme/);
  assert.match(html,/function drawMiniBookIcon[\s\S]{0,1500}theme\.bookmark/);
});

test("frog overlap axis is deterministic and cooldown separation removes intersections",()=>{
  const source=["getPvpOverlapMetrics","separatePvpPlayersAlongAxis"].map(name=>extractFunctionSource(html,name)).join("\n");
  const make=new Function("W","CONFIG","clamp",`${source}\nreturn {getPvpOverlapMetrics,separatePvpPlayersAlongAxis};`);
  const api=make(480,{playBottom:229},(v,a,b)=>Math.max(a,Math.min(b,v)));
  const sideA={x:100,y:100,w:20,h:20},sideB={x:115,y:100,w:20,h:20};
  assert.equal(api.getPvpOverlapMetrics(sideA,sideB).axis,"horizontal");
  assert.equal(api.separatePvpPlayersAlongAxis(sideA,sideB),true);
  assert.equal(api.getPvpOverlapMetrics(sideA,sideB),null);
  const topA={x:100,y:100,w:20,h:20},topB={x:100,y:115,w:20,h:20};
  assert.equal(api.getPvpOverlapMetrics(topA,topB).axis,"vertical");
  assert.equal(api.separatePvpPlayersAlongAxis(topA,topB),true);
  assert.equal(api.getPvpOverlapMetrics(topA,topB),null);
});

test("overlap resolution rebounds horizontally and bonks vertically only with valid motion",()=>{
  const source=["getPvpOverlapMetrics","canPvpVerticalContactBonk","resolvePvpOverlapByAxis"].map(name=>extractFunctionSource(html,name)).join("\n");
  const events=[];
  const make=new Function("bouncePvpPlayersSideways","bonkPvpPlayer",`${source}\nreturn {resolvePvpOverlapByAxis};`);
  const api=make((a,b)=>events.push(["rebound",a,b]),(victim,stomper)=>events.push(["bonk",victim,stomper]));
  const a={x:0,y:0,w:20,h:20,vy:0},side={x:15,y:0,w:20,h:20,vy:0};
  assert.equal(api.resolvePvpOverlapByAxis(a,side),"rebound");
  const staticTop={x:0,y:0,w:20,h:20,vy:0},staticBottom={x:0,y:15,w:20,h:20,vy:0};
  assert.equal(api.resolvePvpOverlapByAxis(staticTop,staticBottom),"rebound");
  const fallingTop={x:0,y:0,w:20,h:20,vy:30},bottom={x:0,y:15,w:20,h:20,vy:0};
  assert.equal(api.resolvePvpOverlapByAxis(fallingTop,bottom),"bonk");
  const top={x:0,y:0,w:20,h:20,vy:0},risingBottom={x:0,y:15,w:20,h:20,vy:-40};
  assert.equal(api.resolvePvpOverlapByAxis(top,risingBottom),"bonk");
  assert.deepEqual(events.map(event=>event[0]),["rebound","rebound","bonk","bonk"]);
});

test("fast-moving frogs use swept collision detection instead of tunneling through",()=>{
  const source=["getPvpOverlapMetrics","getPvpSweptCollisionMetrics","placePvpPlayersAtSweptContact"].map(name=>extractFunctionSource(html,name)).join("\n");
  const make=new Function("clamp","lerp",`${source}\nreturn {getPvpOverlapMetrics,getPvpSweptCollisionMetrics,placePvpPlayersAtSweptContact};`);
  const api=make((v,a,b)=>Math.max(a,Math.min(b,v)),(a,b,t)=>a+(b-a)*t);
  const left={previousX:90,previousY:100,x:130,y:100,w:20,h:20};
  const right={previousX:130,previousY:100,x:90,y:100,w:20,h:20};
  assert.equal(api.getPvpOverlapMetrics(left,right),null);
  const horizontal=api.getPvpSweptCollisionMetrics(left,right);
  assert.equal(horizontal.axis,"horizontal");
  assert.ok(horizontal.time>=0&&horizontal.time<=1);
  const contact=api.placePvpPlayersAtSweptContact(left,right,horizontal);
  assert.equal(contact.axis,"horizontal");
  const upper={previousX:100,previousY:70,x:100,y:130,w:20,h:20};
  const lower={previousX:100,previousY:130,x:100,y:70,w:20,h:20};
  const vertical=api.getPvpSweptCollisionMetrics(upper,lower);
  assert.equal(vertical.axis,"vertical");
  assert.equal(api.placePvpPlayersAtSweptContact(upper,lower,vertical).axis,"vertical");
});

test("Versus collision code cannot silently ignore overlapping frogs",()=>{
  const block=extractFunctionSource(html,"resolvePvpCollision");
  assert.match(block,/let overlapMetrics = getPvpOverlapMetrics\(a, b\)/);
  assert.match(block,/if \(a\.collisionCooldown > 0 \|\| b\.collisionCooldown > 0\) \{\s*separatePvpPlayersAlongAxis\(a, b, overlapMetrics\)/);
  assert.doesNotMatch(block,/separatePvpPlayersWithoutRebound/);
  assert.match(block,/resolvePvpOverlapByAxis\(a, b, overlapMetrics\)/);
  assert.match(html,/else \{\s*const reboundSpeed = CONFIG\.minimumJumpX \* 0\.55;/);
});


test("achievement toast becomes translucent when a fly or word plate is behind it",()=>{
  assert.match(html,/achievementToastObstructedOpacity: 0\.62/);
  assert.match(html,/function achievementToastHasFlyBehind\(toastRect\)/);
  assert.match(html,/opacityCap = achievementToastHasFlyBehind\(toastRect\)/);
  assert.match(html,/ctx\.globalAlpha = clamp\(fade, 0, opacityCap\)/);
});

test("jungle center trunk no longer draws the decorative snake",()=>{
  assert.doesNotMatch(html,/snakeBaseX|snakeSegments|small snake coils/);
  assert.match(html,/function drawJungleBackground\(\)[\s\S]*?function bananaLeaf\(/);
});

test("final-catch word plates stay in camera space and fade with their flies",()=>{
  const block=extractFunctionSource(html,"drawFlyNameTag");
  assert.match(html,/function getCriticalCatchWordFade\(\)/);
  assert.match(block,/currentFly\.x/);
  assert.match(block,/ctx\.drawImage\(sprite, drawX, drawY, width, height\)/);
  assert.match(block,/const alpha = appear \* getCriticalCatchWordFade\(\)/);
});

test("PvP leaderboard uses singular grammar for exactly one win",()=>{
  assert.match(browserSource,/wins === 1 \? "WIN" : "WINS"/);
});

test("menu credit is Made by Nick M. on one shared baseline",()=>{
  assert.match(html,/const RIBBIT_CREDIT_TEXT = "MADE BY NICK M."/);
  assert.match(html,/const RIBBIT_CREDIT_Y = 228/);
  assert.ok((html.match(/RIBBIT_CREDIT_Y/g)||[]).length>=3);
  assert.doesNotMatch(html,/MR\. MANAHAN/);
});

test("fly-label sprite text is centered in physical pixels",()=>{
  assert.match(html,/function drawStableFlyLabelTextToSprite/);
  assert.match(html,/Math\.round\(\(width \* RENDER_SCALE - visibleWidth\) \/ 2\)/);
  assert.match(html,/const cell = Math\.max\(1, Math\.round\(logicalScale \* RENDER_SCALE\)\)/);
});

test("custom frog editor includes a large live preview and relocated controls",()=>{
  assert.match(html,/preview: Object\.freeze\(\{ x: 44, y: 52, w: 146, h: 148 \}\)/);
  assert.match(html,/drawMiniFrogSwatchFacing[\s\S]{0,220}2\.35/);
  assert.match(html,/LIVE PREVIEW/);
});

test("sandbox flies begin with the normal Single Player spawn animation",()=>{
  assert.match(html,/sandboxTest:true[\s\S]{0,120}spawnAge:0/);
  assert.doesNotMatch(html,/sandboxTest:true[\s\S]{0,120}spawnAge:1/);
  assert.match(html,/drawFlySpawnSparks\(currentFly\)/);
  assert.match(html,/getFlySpawnScale\(currentFly\)/);
});

test("public legacy-key migration controls are retired",()=>{
  assert.doesNotMatch(indexHtml,/friends-show-migrate|friends-migrate-view|MIGRATE OLD PRIVATE-KEY ACCOUNT/);
  assert.doesNotMatch(browserSource,/apiMigrateLegacyKey|friends-migrate-button/);
  assert.match(fs.readFileSync(new URL("../public/help.html",import.meta.url),"utf8"),/Public private-key migration has been retired/);
});
