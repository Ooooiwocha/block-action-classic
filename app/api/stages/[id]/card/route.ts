import {createElement} from 'react';
import {CardImage} from '@/lib/card-image';
import {ImageResponse} from 'next/og';
import {database} from '@/lib/game-db';
import {stageCardSVG} from '@/lib/stage-card';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const id=Number((await params).id);if(!Number.isSafeInteger(id)||id<1)return new Response('Not found',{status:404});
 try{const s=await database().prepare('SELECT title,name,cells FROM stages WHERE id=? AND deleted=0').bind(id).first<{title:string;name:string;cells:string}>();if(!s)return new Response('Not found',{status:404});const cells=JSON.parse(s.cells);if(!Array.isArray(cells)||cells.length!==840)throw Error('Invalid stage');
  const src='data:image/svg+xml;base64,'+btoa(stageCardSVG(cells));
  return new ImageResponse(createElement(CardImage,{src,id,title:s.title,name:s.name}),{width:1200,height:630,headers:{'Cache-Control':'public, max-age=300'}});
 }catch(error){console.error('Stage card unavailable');return new Response('Card unavailable',{status:503});}
}
