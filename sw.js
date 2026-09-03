const CACHE='tri-ceny-finance-launcher-v10';
const STATIC=['./icons/apple-touch-icon.png?v=10','./icons/icon-192.png?v=10','./icons/icon-512.png?v=10'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('./index.html')));return;}
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});
self.addEventListener('push',event=>{
  let data={};try{data=event.data?event.data.json():{};}catch(e){}
  const title=data.title||'Три Цены Finance RU';
  const options={
    body:data.body||'Новое уведомление',
    icon:'./icons/icon-192.png?v=10',badge:'./icons/icon-192.png?v=10',
    tag:data.tag||'3ceni-notification',renotify:true,
    data:{url:'./?source=pwa&v=10'}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus' in c){try{c.navigate('./?source=pwa&v=10');}catch(e){}return c.focus();}}
    return clients.openWindow?clients.openWindow('./?source=pwa&v=10'):undefined;
  }));
});
