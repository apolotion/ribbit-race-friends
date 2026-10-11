import {json,error,BUILD,roomName} from './common.js';
export {FriendsHub} from './hub.js';
export {FriendsRoom} from './realtime.js';

export default {
 async fetch(request,env,ctx){
    const rrReplayUrl = new URL(request.url);
    if (rrReplayUrl.pathname.startsWith("/api/replays/")) return env.HUB.getByName('friends-main-v1').fetch(request);

  const url=new URL(request.url),path=url.pathname;
  if(path==='/api/health')return json({ok:true,friendsVersion:1,build:BUILD,transport:'cloudflare-websocket'});
  if(path==='/ws'||path.startsWith('/api/')){
   // Same-origin only: no CORS wildcard and no third-party embedding of authenticated APIs.
   if(request.headers.get('Origin')!==url.origin)return json(error('ORIGIN_DENIED','Open the game from its own public link.'),403);
   const hub=env.HUB.getByName('friends-main-v1');
   if(path==='/ws'){
    if(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json(error('UPGRADE_REQUIRED','WebSocket required.'),426);
    const headers=new Headers({'Content-Type':'application/json','Cookie':request.headers.get('Cookie')||'','X-Friends-IP':request.headers.get('CF-Connecting-IP')||'local'});
    const checked=await hub.fetch(new Request(url.origin+'/internal/authorizeSocket',{method:'POST',headers,body:JSON.stringify({roomCode:url.searchParams.get('roomCode'),playerToken:url.searchParams.get('playerToken')})}));
    if(!checked.ok)return checked;const result=await checked.json();if(!result.ok)return json(result,403);
    const verified=new Headers(request.headers);verified.set('X-Friends-Member',JSON.stringify(result.metadata));
    return env.ROOMS.getByName(roomName(result.metadata)).fetch(new Request(request,{headers:verified}));
   }
   if(request.method!=='POST'||!/^\/api\/api[A-Za-z]+$/.test(path))return json(error('NOT_FOUND','API route not found.'),404);
   if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return json(error('JSON_REQUIRED','JSON is required.'),415);
   const headers=new Headers(request.headers);headers.set('X-Friends-IP',request.headers.get('CF-Connecting-IP')||'local');
   headers.delete('X-Friends-Member');
   return hub.fetch(new Request(request,{headers}));
  }
  return env.ASSETS.fetch(request);
 }
};
