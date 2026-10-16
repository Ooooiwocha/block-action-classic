import type {Metadata} from 'next';
import Home from './home';
import {database} from '@/lib/game-db';
export const dynamic='force-dynamic';
export async function generateMetadata({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}):Promise<Metadata>{
 const q=await searchParams,siteCard=q.stage===undefined;let id=Number(Array.isArray(q.stage)?q.stage[0]:q.stage);const origin='https://block-action-revival.ooooiwocha.chatgpt.site';
 if(siteCard){try{const chosen=await database().prepare('SELECT id FROM stages WHERE pickup=1 AND deleted=0 ORDER BY RANDOM() LIMIT 1').first<{id:number}>();if(!chosen)return {};id=chosen.id;}catch{return {};}}
 if(!Number.isSafeInteger(id)||id<1)return {};
 try{const s=await database().prepare('SELECT title,name,cells FROM stages WHERE id=? AND deleted=0').bind(id).first<{title:string;name:string;cells:string}>();if(!s)return {};
  const title=(s.title||'Untitled')+' — Block Action',description='Creator: '+(s.name||'Anonymous')+' · Stage '+id+' · Block Action Classic';
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('refined-card-57\n'+s.title+'\n'+s.name+'\n'+s.cells))),x=>x.toString(16).padStart(2,'0')).join('').slice(0,16);
  const url=siteCard?origin+'/':origin+'/?stage='+id,image=origin+'/api/stages/'+id+'/card?v='+hash;
  return {title,description,alternates:{canonical:url},openGraph:{type:'website',siteName:'Block Action Classic',title,description,url,images:[{url:image,width:1200,height:630,alt:'Stage '+id+' preview'}]},twitter:{card:'summary_large_image',title,description,images:[image]}};
 }catch{return {};}
}
export default function Page(){return <Home/>;}
