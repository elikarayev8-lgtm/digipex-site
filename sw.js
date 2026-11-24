// Digipex CBCT — service worker: lets the viewer open instantly and work offline.
// Patient files are never cached or sent anywhere; only the app itself is cached.
const CACHE = 'digipex-cbct-v1';
const APP = ['cbct.html', 'digipex-logo.jpg', 'favicon.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest',
  'https://cdn.jsdelivr.net/npm/dicom-parser@1.8.21/dist/dicomParser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(APP.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isApp = APP.some(a => req.url.endsWith(a)) || url.hostname.includes('fonts.g');
  if (!isApp) return;                       // everything else (accounts, Supabase) goes straight to the network
  // network first for the page itself so updates arrive; cache first for libraries and images
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req)));
  } else {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })));
  }
});
