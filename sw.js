const CACHE='tri-ceny-finance-launcher-auth-v29';
const PREFIX='tri-ceny-finance-launcher-';
const SHELL=new URL('index.html',self.registration.scope).href;
const STATIC=['./index.html','./manifest.webmanifest','./icons/apple-touch-icon.png?v=29','./icons/icon-192.png?v=29','./icons/icon-512.png?v=29'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    // One unavailable icon must not prevent a new worker from activating.
    await Promise.all(STATIC.map(url=>cache.add(new Request(url,{cache:'reload'})).catch(()=>{})));
    await self.skipWaiting();
  }));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
  if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const isShell=url.pathname===scope.pathname||url.pathname===new URL(SHELL).pathname;
  if(request.mode==='navigate'&&isShell){
    let timer;
    const network=fetch(request,{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new Error('Launcher HTTP '+response.status);
      const cache=await caches.open(CACHE);await cache.put(SHELL,response.clone());return response;
    });
    event.waitUntil(network.then(()=>{},()=>{}));
    event.respondWith((async()=>{
      try{return await Promise.race([network,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('slow network')),2000)})]);}
      catch(_){
        const cache=await caches.open(CACHE),saved=await cache.match(SHELL);
        if(saved)return saved;
        { // No cached shell: return a usable error instead of awaiting a hung fetch.
          return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>3Ceni Finance</title><body style="font:18px system-ui;padding:32px;background:#f7f9fc"><h2>3Ceni Finance</h2><p>Нет связи с сервером. Проверьте интернет и откройте приложение снова.</p><a href="./">Повторить</a>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
        }
      }finally{clearTimeout(timer);}
    })());return;
  }
  if(url.pathname.includes('/icons/')||url.pathname.endsWith('/manifest.webmanifest')){
    event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
  }
});
self.addEventListener('push',event=>{
  let data={};try{data=event.data?event.data.json():{};}catch(e){}
  const title=data.title||'Три Цены Finance RU';
  const options={
    body:data.body||'Новое уведомление',
    icon:'./icons/icon-192.png?v=28',badge:'./icons/icon-192.png?v=28',
    tag:data.tag||'3ceni-notification',renotify:true,
    data:{url:'./?source=pwa&v=28'}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const scope=self.registration.scope;
    for(const c of list){if(c.url.startsWith(scope)&&'focus' in c)return c.focus();}
    return clients.openWindow?clients.openWindow(scope):undefined;
  }));
});

