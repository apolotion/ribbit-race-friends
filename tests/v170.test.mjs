
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
test("v1.7.0 project additions exist",()=>{
  for(const p of ["client/game/99-v170-hooks.js","public/scripts/rr-170-polish.js","public/scripts/rr-170-online.js","public/styles/rr-170.css"])assert.ok(existsSync(new URL(`../${p}`,import.meta.url)),p);
  assert.equal(JSON.parse(read("package.json")).version,"1.7.0");
});
test("tutorial and mobile touch support are present",()=>{
  const s=read("public/scripts/rr-170-polish.js");
  for(const word of ["WELCOME TO RIBBIT RACE","VERSUS TUTORIAL","rr170-touch-left","rr170-touch-right","rr170-pause"])assert.match(s,new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
});
test("spectator and live match support are present",()=>{
  assert.match(read("public/scripts/rr-170-online.js"),/apiListLiveMatches/);
  assert.match(read("src/hub.js"),/apiLiveMatchHeartbeat/);
});
test("safety guards are present",()=>{
  const s=read("client/game/99-v170-hooks.js");
  assert.match(s,/closeCallEligible/);
  assert.match(s,/recentCatchKeys/);
  assert.match(s,/unlockBeanieFallback/);
});
