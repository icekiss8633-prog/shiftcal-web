const CACHE = 'shiftcal-web-v13';
const ASSETS = ['./','./index.html','./styles.css','./shift-engine.js','./stats-engine.js','./holiday-engine.js','./app-utils.js','./storage.js','./app.js','./manifest.json','./icons/shiftcal.svg','./icons/shiftcal-180.png','./icons/shiftcal-192.png','./icons/shiftcal-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(asset => new Request(asset, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
