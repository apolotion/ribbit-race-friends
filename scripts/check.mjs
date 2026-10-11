import {readFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {join,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const root=process.cwd();
function walk(dir){
  const out=[];
  for(const name of readdirSync(dir)){
    const path=join(dir,name),stat=statSync(path);
    if(stat.isDirectory())out.push(...walk(path));
    else out.push(path);
  }
  return out;
}
function checkJavaScript(path){
  const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
  if(r.status){console.error(r.stderr||r.stdout);process.exit(1);}
}

for(const dir of ['src','public/scripts','client/game','scripts']){
  for(const path of walk(join(root,dir)).filter(v=>v.endsWith('.js')||v.endsWith('.mjs')))checkJavaScript(path);
}

const html=readFileSync('public/index.html','utf8');
if(/<style\b/i.test(html))throw new Error('index.html must not contain inline CSS.');
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())throw new Error('index.html must not contain inline JavaScript.');
}
const assets=[...html.matchAll(/(?:src|href)="(\/(?:scripts|styles|icons)\/[^"?]+|\/manifest\.webmanifest)(?:\?[^"#]*)?"/g)].map(m=>m[1].slice(1));
for(const asset of assets)if(!existsSync(join(root,'public',asset)))throw new Error('Missing referenced browser asset: '+asset);
const requiredMobileAssets=['manifest.webmanifest','icons/ribbit-race-180.png','icons/ribbit-race-512.png','scripts/mobile-experience.js'];
for(const asset of requiredMobileAssets)if(!existsSync(join(root,'public',asset)))throw new Error('Missing Mobile/PWA asset: '+asset);
const requiredTutorialAssets=[
  'tutorial/ember-confident.png',
  'tutorial/ember-smile.png',
  'tutorial/ember-cool.png',
  'tutorial/ember-laughing.png',
  'tutorial/ember-thinking.png'
];
for(const asset of requiredTutorialAssets)if(!existsSync(join(root,'public',asset)))throw new Error('Missing Ember tutorial portrait: '+asset);
const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));
if(manifest.display!=='standalone'||manifest.orientation!=='landscape')throw new Error('Mobile manifest must launch standalone in landscape.');

const browserSource=walk(join(root,'public/scripts')).filter(v=>v.endsWith('.js')).map(v=>readFileSync(v,'utf8')).join('\n');
new vm.Script(browserSource,{filename:'friends-browser-sources.js'});
if(/google\.script\.run|script\.google\.com|new RTCPeerConnection/.test(browserSource+html))throw new Error('School or peer-only dependency remains.');
if((browserSource+html).includes('__RRTEST'))throw new Error('Test-only controls must not be shipped.');
if(!browserSource.includes('new WebSocket(')||!html.includes('FRIENDS EDITION'))throw new Error('Missing Friends integration.');
if(!html.includes('/scripts/game.bundle.js')||!html.includes('/scripts/cloud-client.js'))throw new Error('Modular browser entry points are missing.');
if(!readFileSync('scripts/build-game.mjs','utf8').includes('class GameBundleBuilder'))throw new Error('Game bundle builder is missing.');
console.log(`Server and browser modules parse; ${assets.length} external assets are present; no Google or WebRTC runtime dependency.`);
