const CACHE='rosie-app-v20260617build209';
const URLS=['/','/book','/pricing','/services','/login','/assets/site.css','/assets/chrome.js','/assets/site.js','/data/responsive_visual_registry.json','/data/visual_placeholder_registry.json','/data/workflow_connection_build208.json','/detailer-jobs.html','/admin-progress.html','/progress.html','/admin-workflow.html','/assets/visual-placeholders.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET') return; e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))));});
