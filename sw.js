const CACHE='wort-ei-classic-v34';
const PREFIX='wort-ei-';
const ASSETS=['./','./index.html','./css/style.css?v=34','./js/app.js?v=34','./js/game.js','./js/edition.js','./js/extras.js','./js/audio.js','./js/themes.js','./categories.json','./assets/icon.svg','./manifest.webmanifest'];
const root=new URL('./',self.location.href);
function belongs(url){return url.origin===root.origin&&url.pathname.startsWith(root.pathname)&&!url.pathname.startsWith(new URL('18/',root).pathname);}
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key.startsWith(PREFIX)&&!key.startsWith('wort-ei-adult-')).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||!belongs(new URL(event.request.url)))return;event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(()=>caches.match(event.request)));});
