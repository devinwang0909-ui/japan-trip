const V = 'trip-v6';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'data.js', 'art.js', 'trip.js', 'firebase-config.js', 'manifest.webmanifest',
  'assets/t1.jpg', 'assets/t2.jpg', 'assets/t3.jpg', 'assets/t4.jpg', 'assets/t5.jpg', 'assets/t6.jpg', 'assets/kix1.jpg', 'assets/kix2.jpg', 'assets/kix3.jpg', 'assets/kix5.jpg', 'assets/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
const OK = ['www.gstatic.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin && !OK.includes(u.hostname)) return;
  e.respondWith(caches.open(V).then(async (c) => {
    const hit = await c.match(r, { ignoreSearch: false });
    const net = fetch(r).then((res) => { if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
