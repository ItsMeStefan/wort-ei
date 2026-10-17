const CACHE='wort-ei-adult-v3';
const PREFIX='wort-ei-adult-';
const ASSETS=['./','./index.html','./categories.json','./manifest.webmanifest','../assets/icon.svg','../css/style.css?v=34','../css/adult.css?v=3','../js/app.js?v=34','../js/game.js','../js/edition.js','../js/lines.js','../js/extras.js','../js/audio.js','../js/themes.js'];
const scope=new URL('./',self.location.href);
const shared=new URL('../',scope);
function belongs(url){return url.origin===scope.origin&&(url.pathname.startsWith(scope.pathname)||['js/','css/','assets/'].some(dir=>url.pathname.startsWith(new URL(dir,shared).pathname)));}
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key.startsWith(PREFIX)).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||!belongs(new URL(event.request.url)))return;event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(()=>caches.match(event.request)));});
