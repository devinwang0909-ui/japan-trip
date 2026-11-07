const V = 'trip-v42';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'data.js', 'art.js', 'trip.js', 'firebase-config.js', 'manifest.webmanifest',
  'assets/t1.jpg', 'assets/t2.jpg', 'assets/t3.jpg', 'assets/t4.jpg', 'assets/t5.jpg', 'assets/t6.jpg', 'assets/kix1.jpg', 'assets/kix2.jpg', 'assets/kix3.jpg', 'assets/kix5.jpg', 'assets/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
const OK = ['www.gstatic.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin && !OK.includes(u.hostname)) return;
  // 有網路先抓最新版，沒網路才用手機裡存的（地鐵站內也能看）
  e.respondWith(caches.open(V).then(async (c) => {
    try {
      const res = await fetch(r, { cache: 'no-cache' });
      if (res.ok || res.type === 'opaque') c.put(r, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(r);
      if (hit) return hit;
      throw err;
    }
  }));
});

// ---- 推播：伺服器送來「資料」，由這裡顯示通知（網頁正開著時不重複跳）----
self.addEventListener('push', (e) => {
  let p = {}; try { p = e.data ? e.data.json() : {}; } catch { p = {}; }
  const d = p.data || p.notification || p;
  const title = d.title || '日本旅行';
  e.waitUntil((async () => {
    const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.some((w) => w.visibilityState === 'visible')) return;
    await self.registration.showNotification(title, {
      body: d.body || '', tag: d.tag || 'trip', renotify: true, requireInteraction: true,
      icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', vibrate: [400, 150, 400, 150, 400],
      actions: [{ action: 'ack', title: '我知道了' }],
      data: { url: d.url || './', ackKey: d.ackKey || '', ackUrl: d.ackUrl || '' },
    });
  })());
});
// 按「我知道了」或直接點通知，都算已讀，不再重複提醒。iPhone 不顯示按鈕，點通知本身就算。
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const { url, ackKey, ackUrl } = e.notification.data || {};
  e.waitUntil((async () => {
    if (ackKey && ackUrl) { try { await fetch(`${ackUrl}?key=${encodeURIComponent(ackKey)}`, { mode: 'no-cors' }); } catch {} }
    if (e.action === 'ack') return;
    const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) { if ('focus' in w) { await w.focus(); return; } }
    await clients.openWindow(url || './');
  })());
});
