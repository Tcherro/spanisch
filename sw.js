/* Offline-Cache. SHELL_VERSION bei App-Änderungen erhöhen; Daten werden network-first geladen. */
const SHELL_VERSION = 'shell-1';
const DATA_CACHE = 'data';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
const DATA = ['data/meta.json', 'data/vocab.json', 'data/grammar.json', 'data/dialogs.json'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL_VERSION); await c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })));
    const d = await caches.open(DATA_CACHE); await Promise.all(DATA.map(u => fetch(u, { cache: 'reload' }).then(r => r.ok && d.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== SHELL_VERSION && k !== DATA_CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/data/')) {
    e.respondWith((async () => {
      const c = await caches.open(DATA_CACHE); const key = 'data/' + url.pathname.split('/data/')[1];
      try {
        const r = await Promise.race([fetch(e.request), new Promise((_, rej) => setTimeout(() => rej('timeout'), 4000))]);
        if (r.ok) { c.put(key, r.clone()); return r; }
        throw 0;
      } catch (err) { return (await c.match(key)) || Response.error(); }
    })());
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true }) || (url.pathname.endsWith('/') ? await caches.match('index.html') : null);
    if (hit) return hit;
    try { return await fetch(e.request); } catch (err) { return (await caches.match('index.html')) || Response.error(); }
  })());
});
