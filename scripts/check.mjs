import {readFileSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
for(const name of readdirSync('src').filter(v=>v.endsWith('.js'))){const r=spawnSync(process.execPath,['--check','src/'+name],{encoding:'utf8'});if(r.status){console.error(r.stderr);process.exit(1);}}
for(const name of readdirSync('public').filter(v=>v.endsWith('.js'))){const r=spawnSync(process.execPath,['--check','public/'+name],{encoding:'utf8'});if(r.status){console.error(r.stderr);process.exit(1);}}
const html=readFileSync('public/index.html','utf8');let n=0;
for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){new vm.Script(m[1],{filename:'game-inline-'+(++n)});}
if(/google\.script\.run|script\.google\.com|new RTCPeerConnection/.test(html))throw new Error('School or peer-only dependency remains.');
if(html.includes('__RRTEST'))throw new Error('Test-only controls must not be shipped.');
if(!html.includes('new WebSocket(')||!html.includes('FRIENDS EDITION'))throw new Error('Missing Friends integration.');
console.log('Server modules and complete HTML pass parsing; no Google or WebRTC runtime dependency.');
