import {env} from 'cloudflare:workers';
import {database} from './game-db';
export const COOLDOWN=15*60*1000;
export function allowedEndpoint(value:unknown):value is string{
 if(typeof value!=='string'||value.length>4096)return false;
 try{const u=new URL(value),h=u.hostname;return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(h==='fcm.googleapis.com'||h==='updates.push.services.mozilla.com'||h.endsWith('.notify.windows.com')||h.endsWith('.push.apple.com'));}catch{return false;}
}
const b64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
export async function authorization(endpoint:string,jwk:JsonWebKey,subject:string,now=Date.now()){
 const encode=(v:unknown)=>b64(new TextEncoder().encode(JSON.stringify(v)));
 const message=encode({typ:'JWT',alg:'ES256'})+'.'+encode({aud:new URL(endpoint).origin,exp:Math.floor(now/1000)+3600,sub:subject});
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(message));
 const raw=new Uint8Array(65);raw[0]=4;for(const [value,offset] of [[jwk.x,1],[jwk.y,33]] as const){const bin=atob(value!.replaceAll('-','+').replaceAll('_','/'));raw.set(Uint8Array.from(bin,c=>c.charCodeAt(0)),offset);}
 return 'vapid t='+message+'.'+b64(new Uint8Array(signature))+', k='+b64(raw);
}
export function pushConfig(){const vars=env as unknown as Record<string,string>;if(!vars.PUSH_VAPID_PRIVATE_JWK||!vars.PUSH_VAPID_PUBLIC_KEY)return null;return {key:vars.PUSH_VAPID_PUBLIC_KEY,jwk:JSON.parse(vars.PUSH_VAPID_PRIVATE_JWK) as JsonWebKey};}
export async function notifyNewStage(origin:string){
 const config=pushConfig();if(!config)return;
 const db=database(),now=Date.now();
 // Atomic claim across simultaneous submissions and all subscribed devices.
 const claimed=await db.prepare('UPDATE push_state SET last_sent=? WHERE id=1 AND last_sent<=? AND EXISTS (SELECT 1 FROM push_subscriptions) RETURNING id').bind(now,now-COOLDOWN).first();
 if(!claimed)return;
 const rows=await db.prepare('SELECT endpoint FROM push_subscriptions').all<{endpoint:string}>();
 let cursor=0,failed=0;
 await Promise.all(Array.from({length:Math.min(10,rows.results.length)},async()=>{
  while(cursor<rows.results.length){const {endpoint}=rows.results[cursor++];
   try{const auth=await authorization(endpoint,config.jwk,origin);
    // Empty push messages need no payload encryption; the worker displays a fixed notice.
    const r=await fetch(endpoint,{method:'POST',headers:{Authorization:auth,TTL:'900',Urgency:'normal',Topic:'new-levels'},redirect:'manual',signal:AbortSignal.timeout(8000)});
    if(r.status===404||r.status===410)await db.prepare('DELETE FROM push_subscriptions WHERE endpoint=?').bind(endpoint).run();
    else if(!r.ok)failed++;
   }catch{failed++;}
  }
 }));
 if(failed)console.warn('New-level push deliveries failed:',failed);
}
