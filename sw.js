const CACHE_NAME = 'seenly-cache-v1';
const DYNAMIC_CACHE = 'seenly-dynamic-v1';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './fallback.html',
  './icon-192.png',
  './icon-512.png'
];

// INSTALACIÓN
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cacheando archivos');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ACTIVACIÓN
self.addEventListener('activate', (event) => {
  console.log('[SW] Activado');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (![CACHE_NAME, DYNAMIC_CACHE].includes(key)) {
            console.log('[SW] Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH (Cache First + Network Fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        return caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./fallback.html');
        }
        return new Response('', { status: 404 });
      });
    })
  );
});

// SINCRONIZACIÓN EN SEGUNDO PLANO
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Sync en segundo plano');
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const keys = await cache.keys();
  const pending = keys.filter(req => req.url.includes('/api/') && req.method === 'POST');

  return Promise.all(pending.map(async req => {
    try {
      const res = await fetch(req);
      if (res.ok) await cache.delete(req);
    } catch (err) {
      console.error('[SW] Error en sync:', err);
    }
  }));
}

// NOTIFICACIONES PUSH
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'Seenly',
    body: 'Hay nuevas actualizaciones disponibles',
    icon: './icon-192.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});

