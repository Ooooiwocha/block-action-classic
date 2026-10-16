import {database} from '@/lib/game-db';
import {allowedEndpoint,pushConfig} from '@/lib/push-notifications';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const c=pushConfig();return c?reply({publicKey:c.key}):reply({error:'Notifications are not available yet.'},503);}catch{return reply({error:'Notifications are unavailable.'},503);}}
export async function POST(request:Request){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Invalid origin.'},403);
 try{
  const raw=await request.text();if(raw.length>6000)return reply({error:'Invalid subscription.'},413);
  const data=JSON.parse(raw);if(!allowedEndpoint(data.endpoint))return reply({error:'Unsupported push service.'},400);
  const db=database();
  if(data.action==='unsubscribe'){await db.prepare('DELETE FROM push_subscriptions WHERE endpoint=?').bind(data.endpoint).run();return reply({ok:true});}
  if(data.action!=='subscribe'||!pushConfig())return reply({error:'Notifications are unavailable.'},503);
  const count=await db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions').first<{n:number}>();
  if((count?.n||0)>=5000&&!await db.prepare('SELECT endpoint FROM push_subscriptions WHERE endpoint=?').bind(data.endpoint).first())return reply({error:'Notification capacity reached.'},503);
  await db.prepare('INSERT INTO push_subscriptions(endpoint,created) VALUES(?,?) ON CONFLICT(endpoint) DO NOTHING').bind(data.endpoint,Date.now()).run();
  return reply({ok:true});
 }catch{return reply({error:'Could not update notifications. Please try again.'},503);}
}
