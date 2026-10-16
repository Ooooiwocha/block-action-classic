self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// No fetch handler: game requests and assets keep their existing behavior.
self.addEventListener('push',event=>event.waitUntil(self.registration.showNotification('BLOCK ACTION — Classic',{
 body:'A new level has been posted. Open the site to play!',tag:'new-levels',renotify:false,icon:'/notification-icon.png',data:{url:'/'},
})));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 const existing=windows.find(w=>new URL(w.url).origin===self.location.origin);
 if(existing){await existing.navigate('/');return existing.focus();}return self.clients.openWindow('/');
})());});
