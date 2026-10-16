"use client";
import {useEffect,useState,useRef} from 'react';
export default function LevelNotifications(){
 const [on,setOn]=useState(false),[busy,setBusy]=useState(true),[message,setMessage]=useState(''),[supported,setSupported]=useState(true);
 const prepared=useRef<{registration:ServiceWorkerRegistration;key:string}|null>(null);
 async function save(endpoint:string,action:string){const r=await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint,action})});if(!r.ok)throw Error((await r.json()).error||'Could not update notifications.');}
 useEffect(()=>{let alive=true;
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){setSupported(false);setBusy(false);setMessage('This browser does not support push notifications. On iPhone/iPad, add this site to your Home Screen and open it there.');return;}
  (async()=>{try{const r=await fetch('/api/notifications');if(!r.ok)throw Error('Notifications are temporarily unavailable.');const {publicKey}=await r.json();await navigator.serviceWorker.register('/level-notifications-sw.js');const registration=await navigator.serviceWorker.ready;
   prepared.current={registration,key:publicKey};const sub=await registration.pushManager.getSubscription();if(sub&&Notification.permission==='granted')await save(sub.endpoint,'subscribe');if(alive)setOn(!!sub&&Notification.permission==='granted');
  }catch(e){if(alive)setMessage(e instanceof Error?e.message:'Notifications are unavailable.');}finally{if(alive)setBusy(false);}})();return()=>{alive=false;};
 },[]);
 async function toggle(){
  const p=prepared.current;if(!p){setMessage('Notifications are unavailable. Please reload and try again.');return;}
  setBusy(true);setMessage('');try{
   if(on){const sub=await p.registration.pushManager.getSubscription();if(sub){await save(sub.endpoint,'unsubscribe');await sub.unsubscribe();}setOn(false);return;}
   // Request permission directly from this user gesture (required on iOS).
   const permission=await Notification.requestPermission();if(permission!=='granted'){setMessage(permission==='denied'?'Notifications are blocked. You can allow them in your browser settings.':'Notification permission was not granted.');return;}
   const raw=atob(p.key.replaceAll('-','+').replaceAll('_','/'));const key=Uint8Array.from(raw,c=>c.charCodeAt(0));
   const existing=await p.registration.pushManager.getSubscription();const sub=existing||await p.registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
   try{await save(sub.endpoint,'subscribe');}catch(e){if(!existing)await sub.unsubscribe();throw e;}
   setOn(true);setMessage('New-level notifications enabled.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not update notifications.');}finally{setBusy(false);}
 }
 return <div className="level-notifications"><button onClick={toggle} disabled={busy||!supported} aria-pressed={on}>New Level Alerts: {on?'ON':'OFF'}</button><p>Notify me even when this site is closed. At most once every 15 minutes per site.</p>{message&&<p role="status">{message}</p>}</div>;
}
