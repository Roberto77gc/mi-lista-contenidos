const CORE_CACHE = 'seenly-core-v2';
const DYNAMIC_CACHE = 'seenly-dynamic-v2';
const OFFLINE_PAGE = './fallback.html';
const FALLBACK_IMAGE = './images/fallback.jpg';

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  OFFLINE_PAGE,
  FALLBACK_IMAGE,
  './icon-192-any.png',
  './icon-512-any.png'
];

// ======== Estrategias de Caché ========
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    return cached || (request.destination === 'document' ? caches.match(OFFLINE_PAGE) : undefined);
  }
};

const staleWhileRevalidate = async (request) => {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(response => {
      if (response.ok) {
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => {});

  return cached || network;
};

// ======== Ciclo de vida SW ========
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (![CORE_CACHE, DYNAMIC_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ======== Fetch ========
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.origin.includes(self.location.origin)) return;
  if (request.method !== 'GET') return;

  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
  } else if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
  } else if (['style', 'script', 'image'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(
      caches.match(request).then(response => response || fetch(request).catch(() => {
        if (request.destination === 'image') {
          return caches.match(FALLBACK_IMAGE);
        }
      }))
    );
  }
});

// ======== Background Sync ========
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(processQueue());
  }
});

const processQueue = async () => {
  const cache = await caches.open(DYNAMIC_CACHE);
  const keys = await cache.keys();

  const apiKeys = keys.filter(req =>
    req.url.includes('/api/') &&
    ['POST', 'PUT'].includes(req.method)
  );

  for (const req of apiKeys) {
    try {
      const body = await req.json();
      const res = await fetch(req.url, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) await cache.delete(req);
    } catch (err) {
      console.warn('[SW] Reintento fallido en sync:', err);
    }
  }
};

// ======== Push Notifications ========
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'Seenly',
    body: 'Actualización disponible',
    actions: [{ action: 'view', title: 'Ver' }],
    data: { url: './' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192-any.png',
      badge: './icon-96.png',
      image: './images/notification-banner.jpg',
      vibrate: [300, 100, 400],
      data: data.data,
      actions: data.actions
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsArr => {
      const client = clientsArr.find(c => c.url === url);
      return client ? client.focus() : clients.openWindow(url);
    })
  );
});


