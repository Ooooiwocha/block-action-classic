import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw Error('Stage storage unavailable');return env.DB;}
export async function digest(p:string,salt:string){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(p),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},key,256);
 return Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function encodePassword(p:string){const salt=crypto.randomUUID();return salt+':'+await digest(p,salt);}
export async function matches(p:string,stored:string){const [salt,hash]=stored.split(':');return !!hash&&(await digest(p,salt))===hash;}
export async function adminMatches(p:string,role:'PICKUP'|'EDIT'|'RANKING'|'DELETE'){
 const hash=(env as unknown as Record<string,string|undefined>)[`ADMIN_${role}_HASH`];
 return !!p&&!!hash&&await matches(p,hash);
}
export async function ensureDemos(){
 const db=database();const exists=await db.prepare('SELECT id FROM stages WHERE id IN (1,2)').all();if(exists.results.length===2)return;
 const cells=Array(840).fill(-1);for(let x=0;x<30;x++){cells[x*28+26]=1;cells[x*28+27]=1;}cells[2*28+25]=6;cells[27*28+25]=7;
 const second=[...cells];for(let x=9;x<12;x++)second[x*28+25]=1;for(let x=17;x<20;x++)second[x*28+24]=1;
 const hash=await encodePassword('demo');
 await db.batch([cells,second].map((c,i)=>db.prepare('INSERT OR IGNORE INTO stages (id,title,name,comment,cells,password,valid,demo,created) VALUES (?,?,?,?,?,?,1,1,?)').bind(i+1,i?'DEMO 2 - Jump practice':'DEMO 1 - First steps','Restoration demo','New restoration demo, not an archived original.',JSON.stringify(c),hash,'2026-10-03')));
}
export type StageRow={country:string|null;id:number;title:string;name:string;comment:string;cells:string;password:string;valid:number;demo:number;pickup:number;created:string;pn:number;dn:number;cn:number;retn:number;good:number;bad:number;};
