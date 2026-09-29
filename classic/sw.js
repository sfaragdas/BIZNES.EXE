'use strict';
// Replaced with the commit hash by the publication workflow.
const BUILD='classic-v1';
const CACHE='biznes-classic-'+BUILD;
const ASSETS=['./index.html','./game.js?v='+BUILD,'./style.css?v='+BUILD,'./pwa.js?v='+BUILD,'./manifest.webmanifest','./favicon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/PxPlus_IBM_VGA8.ttf'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith('biznes-classic-')&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(request.mode==='navigate'){
      try{const response=await fetch(request,{cache:'no-cache',signal:AbortSignal.timeout(3500)});if(response.ok)return response;}catch{}
      return await cache.match(new URL('./index.html',self.registration.scope))||Response.error();
    }
    const cached=await cache.match(request);if(cached)return cached;
    try{const response=await fetch(request);if(response.ok)return response;}catch{}
    return await cache.match(request,{ignoreSearch:true})||Response.error();
  })());
});
