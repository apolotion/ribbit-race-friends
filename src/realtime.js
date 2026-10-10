import {DurableObject} from 'cloudflare:workers';
import {json,limitedJson} from './common.js';

// One authenticated WebSocket relay per room/pair. The browser host still runs physics.
// State delivery uses receiver acknowledgements + one newest pending snapshot per recipient:
// slow receivers do not cause an unbounded queue of obsolete state frames.
export class FriendsRoom extends DurableObject {
 constructor(ctx,env){
  super(ctx,env);this.ctx=ctx;this.env=env;this.pending=new Map();this.waiting=new Map();this.leaseChecks=new Map();
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS policy (id INTEGER PRIMARY KEY, value TEXT NOT NULL)');
  this.policy=ctx.storage.sql.exec('SELECT value FROM policy WHERE id=1').toArray()[0];this.policy=this.policy?JSON.parse(this.policy.value):null;this.policyStamp=0;this.lastAlarmTouch=0;
 }
 sockets(){return this.ctx.getWebSockets().filter(s=>s.readyState===1);}
 info(ws){try{return ws.deserializeAttachment();}catch(_){return null;}}
 send(ws,data){try{if(ws.readyState===1)ws.send(typeof data==='string'?data:JSON.stringify(data));}catch(_){}}
 close(ws,reason){try{ws.close(4001,reason);}catch(_){}this.pending.delete(ws);this.waiting.delete(ws);}
 presence(){const out={pairId:this.policy?.pairId||'',host:null,guest:null};
  for(const ws of this.sockets()){const a=this.info(ws);if(!a)continue;out[a.role]={connectionId:a.connectionId,live:a.expires>Date.now()&&Date.now()-a.lastSeen<6000};}
  return out;
 }
 announce(){for(const ws of this.sockets()){const a=this.info(ws);this.send(ws,{type:'server-presence',partnerConnected:this.sockets().some(other=>other!==ws&&this.info(other)?.role!==a?.role)});}}
 setPolicy(m){
  if(Number(m.policyStamp)<this.policyStamp)return;this.policyStamp=Number(m.policyStamp)||0;
  if(Date.now()-this.lastAlarmTouch>60000){this.lastAlarmTouch=Date.now();this.ctx.waitUntil(this.ctx.storage.setAlarm(Date.now()+3600000));}
  const p={roomCode:m.roomCode,epoch:m.epoch,pairId:m.pairId,authorityRole:m.authorityRole,authorityVersion:m.authorityVersion,cpuIndex:m.cpuIndex,matchId:m.matchId,phase:m.phase,startSequence:Number(m.startSequence)||0,lobbyEpoch:Number(m.lobbyEpoch)||1};
  // Persisted lifecycle counters also fence delayed responses across hibernation.
  const old=this.policy;
  if(old&&p.authorityVersion===old.authorityVersion){
   if(p.startSequence<(old.startSequence||0)||p.lobbyEpoch<(old.lobbyEpoch||1))return;
   if(p.startSequence===(old.startSequence||0)&&p.lobbyEpoch===(old.lobbyEpoch||1)){
    const phaseOrder={lobby:0,starting:1,playing:2,finished:3};
    if((phaseOrder[p.phase]??0)<(phaseOrder[old.phase]??0))return;
   }
  }
  if(JSON.stringify(this.policy)===JSON.stringify(p))return;
  const changed=this.policy?.matchId!==p.matchId||this.policy?.authorityVersion!==p.authorityVersion;
  if(this.policy&&p.authorityVersion<this.policy.authorityVersion)return; // Ignore late HTTP results.
  this.policy=p;this.ctx.storage.sql.exec('INSERT INTO policy(id,value) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value',JSON.stringify(p));
  if(changed){this.pending.clear();this.waiting.clear();}
  for(const ws of this.sockets()){
   const a=this.info(ws);if(p.cpuIndex===(a.role==='host'?0:1))this.close(ws,'A CPU is continuing this match.');
   else this.send(ws,{type:'server-policy',authorityRole:p.authorityRole,cpuIndex:p.cpuIndex,matchId:p.matchId});
  }
 }
 async fetch(request){
  const path=new URL(request.url).pathname;
  if(path==='/sync'||path==='/policy'){
   const m=await limitedJson(request,8000);this.setPolicy(m);return json(this.presence());
  }
  if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({ok:false},426);
  let meta;try{meta=JSON.parse(request.headers.get('X-Friends-Member')||'null');}catch(_){}
  if(!meta||!['host','guest'].includes(meta.role)||!meta.uid||meta.expires<=Date.now())return json({ok:false},403);
  this.setPolicy(meta);
  const [client,server]=Object.values(new WebSocketPair());
  for(const ws of this.sockets())if(this.info(ws)?.role===meta.role)this.close(ws,'Reconnected in another tab.');
  this.ctx.acceptWebSocket(server,[meta.role]);
  server.serializeAttachment({...meta,connectionId:crypto.randomUUID(),lastSeen:Date.now(),leaseAt:Date.now(),rateAt:Date.now(),messages:0,bytes:0});
  this.announce();
  return new Response(null,{status:101,webSocket:client});
 }
 async webSocketMessage(ws,message){
  const a=this.info(ws);if(!a||typeof message!=='string')return this.close(ws,'Invalid frame.');
  const now=Date.now(),bytes=new TextEncoder().encode(message).length;
  if(a.expires<=now||bytes>65536)return this.close(ws,'Expired or oversized frame.');
  if(now-a.rateAt>=2000){a.rateAt=now;a.messages=0;a.bytes=0;}
  a.messages++;a.bytes+=bytes;a.lastSeen=now;
  if(a.messages>300||a.bytes>3000000)return this.close(ws,'Message rate exceeded.');
  ws.serializeAttachment(a);
  if(now-a.leaseAt>=15000&&!this.leaseChecks.has(ws)){
   // Check revocation without delaying every live movement packet.
   this.leaseChecks.set(ws,true);
   this.ctx.waitUntil(this.env.HUB.getByName('friends-main-v1').lease(a).then(ok=>{
    if(!ok){this.close(ws,'Session expired. Sign in again.');this.announce();}
    else {const fresh=this.info(ws);if(fresh){fresh.leaseAt=Date.now();ws.serializeAttachment(fresh);}}
   }).catch(()=>this.close(ws,'Cloud session could not be verified.')).finally(()=>this.leaseChecks.delete(ws)));
  }
  let m;try{m=JSON.parse(message);}catch(_){return this.close(ws,'Invalid JSON.');}
  if(m.type==='server-ping'){this.send(ws,{type:'server-pong',at:now});return;}
  if(m.type==='wire-ack'){
   const wait=this.waiting.get(ws);if(wait&&m.sequence===wait.sequence){this.waiting.delete(ws);const next=this.pending.get(ws);this.pending.delete(ws);if(next)this.deliverState(ws,next);}
   return;
  }
  if(m.protocol!==3||m.room!==a.roomCode||m.epoch!==a.epoch||m.pairId!==a.pairId)return;
  const allowed=['hello','ping','pong','direct-verified','direct-abort','leaving','snapshot','inputs','claims','result'];
  if(!allowed.includes(m.type))return;
  if(m.type==='hello'&&(m.data?.role!==a.role||m.data?.policy!==2))return;
  const control=['hello','ping','pong','direct-verified','direct-abort','leaving'].includes(m.type);
  if(!control){
   const p=this.policy;if(!p?.matchId||p.cpuIndex>=0)return;
   if(['snapshot','result'].includes(m.type)&&a.role!==p.authorityRole)return;
   if(['inputs','claims'].includes(m.type)&&a.role===p.authorityRole)return;
   if(['snapshot','result'].includes(m.type)&&m.data?.matchId!==p.matchId)return;
   if(['inputs','claims'].includes(m.type)&&(!Array.isArray(m.data)||m.data.length>32||m.data.some(x=>x?.matchId!==p.matchId)))return;
   if(m.type==='snapshot'&&(!Number.isSafeInteger(m.data?.sequence)||!Array.isArray(m.data?.players)||m.data.players.length!==2))return;
  }
  for(const other of this.sockets()){
   const b=this.info(other);if(other===ws||!b||b.role===a.role||b.expires<=now)continue;
   if(m.type==='snapshot'){
    const wait=this.waiting.get(other);
    if(wait){this.pending.set(other,message);if(now-wait.at>6000)this.close(other,'The game stopped receiving updates.');}
    else this.deliverState(other,message);
   }else this.send(other,message);
  }
 }
 deliverState(ws,message){const m=JSON.parse(message);this.waiting.set(ws,{sequence:m.data.sequence,at:Date.now()});this.send(ws,message);}
 async webSocketClose(ws,code,reason,clean){this.pending.delete(ws);this.waiting.delete(ws);try{ws.close(code===1006?1000:code,'Closed');}catch(_){}this.announce();}
 async alarm(){for(const ws of this.sockets())this.close(ws,'Room expired. Create a new room.');this.pending.clear();this.waiting.clear();this.policy=null;this.ctx.storage.sql.exec('DELETE FROM policy');await this.ctx.storage.deleteAlarm();}
 async webSocketError(ws){this.close(ws,'Connection error.');this.announce();}
}
