// Run explicitly against YOUR local or deployed Friends game. This creates then deletes one test account.
// No real friend's account or school data is touched. A failed cleanup prints the test account's username,
// never its private key. The test account will count toward registration limits until manually removed.
import assert from 'node:assert/strict';
const input=process.argv[2];if(!input){console.error('Usage: npm run smoke -- https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev');process.exit(1);}
const origin=new URL(input).origin;if(!/^https?:/.test(origin))throw Error('Provide your HTTP(S) game URL.');let cookie='',marker='',pin='4826',username='smoke_'+crypto.randomUUID().slice(0,8),created=false,checks=0;
async function request(method,p={},opts={}){const r=await fetch(origin+'/api/'+method,{method:'POST',headers:{'Content-Type':'application/json','Origin':opts.origin||origin,'Cookie':cookie},body:JSON.stringify({...p,friendsVersion:1}),signal:AbortSignal.timeout(20000)});const sc=r.headers.get('set-cookie');if(sc)cookie=sc.split(';')[0];let data;try{data=await r.json();}catch(_){throw Error('Expected JSON: verify that the Worker, not a static-only site, is deployed.');}return {r,data};}
function check(ok,label){assert.ok(ok,label);console.log('PASS '+label);checks++;}
try{
 const health=await (await fetch(origin+'/api/health')).json();check(health.friendsVersion===1,'Friends API reachable');
 const wrong=await request('apiBootstrap',{}, {origin:'https://different-site.invalid'});check(wrong.r.status===403,'cross-origin request rejected');
 const r=await request('apiCreatePlayer',{username,pin});check(r.data.ok===true,'temporary test account created');created=true;marker=r.data.sessionToken;check(r.r.headers.get('set-cookie')?.includes('HttpOnly'),'PIN account created and HttpOnly cookie set');
 const a=await request('apiLoad',{sessionToken:marker});check(a.data.ok&&a.data.pinReady===true,'PIN account loads without exposing PIN');
 const save=await request('apiSave',{sessionToken:marker,baseRevision:a.data.revision,saveData:{'ribbitRaceBestEndlessFlies:park':'10'}});check(save.data.ok,'cloud save accepted');
 const conflict=await request('apiSave',{sessionToken:marker,baseRevision:a.data.revision,saveData:{}});check(conflict.data.code==='REVISION_CONFLICT','stale save rejected with merge information');
 const saved=await request('apiLoad',{sessionToken:marker});check(saved.data.saveData['ribbitRaceBestEndlessFlies:park']==='10','saved value reloads');
 const forged=await request('apiSave',{sessionToken:'wrong-marker',baseRevision:saved.data.revision,saveData:{}});check(forged.data.code==='SESSION_EXPIRED','cross-tab/account marker mismatch rejected');
 const diag=await request('apiOnlineDiagnostic');check(diag.data.saveCompatibility?.ok,'save/leaderboard compatibility diagnostic');
 console.log(`${checks} HTTP checks passed. Next test Host/Join and Quickplay on two browsers/devices.`);
}finally{
 if(created){const r=await request('apiDeleteAccount',{pin,confirm:username});if(!r.data.deleted)console.error('Cleanup failed for temporary account '+username+'. Ask the installation owner to remove it.');else console.log('Temporary test account deleted.');}
}
