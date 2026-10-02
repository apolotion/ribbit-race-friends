import {Buffer} from 'node:buffer';
import {createHash, timingSafeEqual} from 'node:crypto';
export const BUILD='2026.09.25-friends-1';
export const digest=v=>createHash('sha256').update(String(v)).digest('hex');
export function randomHex(bytes=32){return [...crypto.getRandomValues(new Uint8Array(bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');}
export function equal(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
export function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});}
export const error=(code,message)=>({ok:false,code,message});
export const roomName=m=>m.roomCode+':'+m.epoch+':'+m.pairId;
export function cookieName(url){return new URL(url).protocol==='https:'?'__Host-rrfriends':'rrfriends_dev';}
export function cookieValue(request){const name=cookieName(request.url);return (request.headers.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)||'';}
export function sessionCookie(url,token,seconds){return cookieName(url)+'='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+seconds+(new URL(url).protocol==='https:'?'; Secure':'');}
export async function limitedJson(request,maximum=600000){
 if(Number(request.headers.get('Content-Length')||0)>maximum)throw new Error('Request is too large.');
 const reader=request.body?.getReader();if(!reader)return {};
 let size=0;const parts=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maximum){await reader.cancel();throw new Error('Request is too large.');}parts.push(value);}
 const all=new Uint8Array(size);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}
 const v=JSON.parse(new TextDecoder().decode(all)||'{}');
 if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Expected an object.');return v;
}
