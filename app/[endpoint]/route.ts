import {after} from 'next/server';
import {notifyNewStage} from '@/lib/push-notifications';
import {postingCountry} from '@/lib/posting-country';
import {env} from 'cloudflare:workers';
import {browserIdentity,shortID,visitorIP} from '@/lib/comment-identity';
import {isListedVPN} from '@/lib/vpn-match';
import {formatGameDate} from '@/lib/game-date';
import {database,ensureDemos,matches,encodePassword,adminMatches,StageRow} from '@/lib/game-db';
type Params=Record<string,string>;
function escapeFlashText(value:string){return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');}
function num(p:Params,k:string,d=0){const n=Number(p[k]);return p[k]!==undefined&&Number.isSafeInteger(n)?n:d;}
function text(p:Params,k:string,max=200){return (p[k]||'').slice(0,max);}
function form(values:Record<string,unknown>,status=200){return new Response(new URLSearchParams(Object.entries(values).map(([k,v])=>[k,String(v)])),{status,headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Cache-Control':'no-store'}});}
export async function POST(request:Request,{params}:{params:Promise<{endpoint:string}>}){
 let cookie:string|null=null;
 const reply=(values:Record<string,unknown>,status=200)=>{const response=form(values,status);if(cookie)response.headers.append('Set-Cookie',cookie);return response;};
 const {endpoint}=await params;
 const allowed=['loadActionList.php','loadMapData.php','saveMapData.php','editMapLogin.php','deleteMap.php','clearRanking.php','loadCommentListHeader.php','loadCommentList.php','saveComment.php','checkTimeAttack.php','saveTimeAttack.php','evaluateConnection.php','addPlayCount.php','addGameOverCount.php','addRetryCount.php','addSuicideCount.php'];
 if(!allowed.includes(endpoint))return reply({error:true},404);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:true},403);
 try{
 const body=await request.text();if(body.length>30000)return reply({error:true},413);
 const p=Object.fromEntries(new URLSearchParams(body));
 const secret=(env as unknown as Record<string,string|undefined>).COMMENT_ID_SECRET;
 if(!secret||secret.length<32)throw Error('Comment identity is not configured');
 const browser=await browserIdentity(request,secret);cookie=browser.cookie;
 await ensureDemos();const db=database();const sid=num(p,'action_id',-1);
 if(endpoint==='loadActionList.php'){
  const sort=num(p,'sortType',1),bind:(number|string)[]=[],where=['deleted=0'];
  if(sort===7){where.push('id=?');bind.push(num(p,'stage_id'));}
  if(sort===6)where.push('pickup=1');
  if(sort===5||sort===8){where.push('name LIKE ?');bind.push('%'+text(p,'name',100)+'%');}
  const filter=where.join(' AND '),key=({2:'good',3:'pn',4:'cn'} as Record<number,string>)[sort]||'id';
  const total=await db.prepare('SELECT COUNT(*) AS n FROM stages WHERE '+filter).bind(...bind).first<{n:number}>();
  const rows=await db.prepare('SELECT id FROM stages WHERE '+filter+' ORDER BY '+key+' DESC,id DESC LIMIT ? OFFSET ?').bind(...bind,Math.min(100,Math.max(1,num(p,'count',13))),Math.max(0,num(p,'snum'))).all<{id:number}>();
  return reply({total:total?.n||0,count:rows.results.length,...Object.fromEntries(rows.results.map((r,i)=>['id'+i,r.id]))});
 }
 const s=await db.prepare('SELECT * FROM stages WHERE id=? AND deleted=0').bind(sid).first<StageRow>();
 if(endpoint==='saveMapData.php'){
  const cells=p.mapdata?.split(',').map(Number);if(!cells||cells.length!==840||cells.some(v=>!Number.isInteger(v)||(v!==-1&&(v<1||v>19))))return reply({error:true,message:'Invalid map'});
  const adminEdit=await adminMatches(p.password||'','EDIT');
  if(s?.demo&&!adminEdit)return reply({error:true,message:'Demo stages require an administrator'});
  if(s&&!adminEdit&&!(await matches(p.password||'',s.password)))return reply({error:true,login:false});
  if(sid>0&&!s)return reply({error:true,message:'Stage not found'});
  if(!s&&(adminEdit||await adminMatches(p.password||'','PICKUP')||await adminMatches(p.password||'','RANKING')||await adminMatches(p.password||'','DELETE')))return reply({error:true,message:'Use a separate stage password'});
  const title=text(p,'title'),name=s&&p.name===s.name?s.name:text(p,'name',14),comment=text(p,'comment',4000);
  const fields=[title.trim()?title:'no title',name.trim()?name:'no name',comment.trim()?comment:'no comment',JSON.stringify(cells),adminEdit&&s?s.password:await encodePassword(text(p,'password',200)),p.valid==='1'||p.valid==='true'?1:0];
  let id=sid;
  if(s)await db.prepare('UPDATE stages SET title=?,name=?,comment=?,cells=?,password=?,valid=? WHERE id=?').bind(...fields,sid).run();
  else{const r=await db.prepare('INSERT INTO stages (title,name,comment,cells,password,valid,created,country) VALUES (?,?,?,?,?,?,?,?)').bind(...fields,new Date().toISOString(),postingCountry(request)).run();id=Number(r.meta.last_row_id);after(()=>notifyNewStage(new URL(request.url).origin).catch(()=>console.warn('New-level notifications unavailable')));}
  return reply({error:false,action_id:id});
 }
 if(!s)return reply({error:true,valid:false,title:'Stage not found',name:'',comment:'',total:0,count:0,ranking:0,login:false});
 if(endpoint==='loadMapData.php'){
  const scores=await db.prepare('SELECT name,time FROM scores WHERE stage_id=? ORDER BY time,id LIMIT 10').bind(sid).all<{name:string;time:number}>();
  const out:Record<string,unknown>={...Object.fromEntries(['title','name','comment','pn','dn','cn','retn','good','bad'].map(k=>[k,s[k as keyof StageRow]])),valid:s.valid||p.edit==='1'?'true':'false',comment:p.edit==='1'||s.comment.trim()?s.comment:'No description',country:s.country,create:formatGameDate(s.created)};
  (JSON.parse(s.cells) as number[]).forEach((v,i)=>out[i]=v);scores.results.forEach((r,i)=>{out['rn'+i]=r.name;out['rt'+i]=r.time;});return reply(out);
 }
 if(['editMapLogin.php','deleteMap.php','clearRanking.php'].includes(endpoint)){
  if(endpoint==='editMapLogin.php'&&await adminMatches(p.password||'','PICKUP')){
   const updated=await db.prepare('UPDATE stages SET pickup=1-pickup WHERE id=? RETURNING pickup').bind(sid).first<{pickup:number}>();
   return reply({login:false,pickup:true,pickup_enabled:!!updated?.pickup,action_id:sid});
  }
  const admin=endpoint==='editMapLogin.php'?await adminMatches(p.password||'','EDIT'):endpoint==='clearRanking.php'?await adminMatches(p.password||'','RANKING'):endpoint==='deleteMap.php'?await adminMatches(p.password||'','DELETE'):false;
  const ok=admin||(!s.demo&&await matches(p.password||'',s.password));
  if(ok&&endpoint==='deleteMap.php')await db.prepare('UPDATE stages SET deleted=1 WHERE id=?').bind(sid).run();
  if(ok&&endpoint==='clearRanking.php')await db.prepare('DELETE FROM scores WHERE stage_id=?').bind(sid).run();
  return reply({login:ok,pickup:false});
 }
 if(endpoint==='loadCommentListHeader.php'||endpoint==='loadCommentList.php'){
  const total=await db.prepare('SELECT COUNT(*) AS n FROM comments WHERE stage_id=?').bind(sid).first<{n:number}>();const out:Record<string,unknown>={total:total?.n||0,count:0,country:s.country||'--'};
  if(endpoint==='loadCommentList.php'){const rows=await db.prepare('SELECT name,comment,created,connection_id,browser_id,vpn FROM comments WHERE stage_id=? ORDER BY id DESC LIMIT 7 OFFSET ?').bind(sid,Math.max(0,num(p,'snum'))).all<{name:string;comment:string;created:string;connection_id:string|null;browser_id:string|null;vpn:number}>();out.count=rows.results.length;rows.results.forEach((r,i)=>{out['name'+i]=escapeFlashText(r.name);out['comment'+i]=escapeFlashText(r.comment);out['create'+i]=formatGameDate(r.created);});}return reply(out);
 }
 if(endpoint==='saveComment.php'){
  const ip=visitorIP(request);
  const connectionId=ip?await shortID(secret,'connection',sid,ip.canonical):null;
  const browserId=await shortID(secret,'browser',sid,browser.id);
  await db.prepare('INSERT INTO comments (stage_id,name,comment,created,connection_id,browser_id,vpn) VALUES (?,?,?,?,?,?,?)').bind(sid,text(p,'name',14)||'Anonymous',text(p,'comment',4000),new Date().toISOString(),connectionId,browserId,isListedVPN(ip)?1:0).run();
 }
 else if(endpoint==='checkTimeAttack.php'){
  const time=num(p,'time');if(time<=0)return reply({ranking:0});
  await db.prepare('UPDATE stages SET cn=cn+1 WHERE id=?').bind(sid).run();const r=await db.prepare('SELECT COUNT(*) AS n FROM scores WHERE stage_id=? AND time<=?').bind(sid,time).first<{n:number}>();const rank=1+(r?.n||0);return reply({ranking:rank<=10?rank:0});
 }else if(endpoint==='saveTimeAttack.php'){
  if(text(p,'name',100)==='')return reply({error:false,success:true,declined:true});
  const time=num(p,'time');if(time<=0||time>100000000||num(p,'secure')!==(time*(sid+24)+sid)*3+32)return reply({error:true});
  await db.prepare('INSERT INTO scores (stage_id,name,time) VALUES (?,?,?)').bind(sid,text(p,'name',100),time).run();
 }else if(endpoint==='evaluateConnection.php'){
  const key=num(p,'point')>0?'good':'bad';await db.prepare('UPDATE stages SET '+key+'='+key+'+1 WHERE id=?').bind(sid).run();
 }else{
  const key=({'addPlayCount.php':'pn','addGameOverCount.php':'dn','addRetryCount.php':'retn','addSuicideCount.php':'dn'} as Record<string,string>)[endpoint];
  if(key)await db.prepare('UPDATE stages SET '+key+'='+key+'+1 WHERE id=?').bind(sid).run();
 }
 return reply({error:false,success:true});
 }catch(e){console.error('Game API error',endpoint,e);return reply({error:true,message:'Storage unavailable. Please retry.'},503);}
}
