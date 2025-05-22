const CORE_CACHE = 'seenly-core-v2'; // Incrementa versión al actualizar
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

// ===== STRATEGIES =====
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || (request.destination === 'document' ? caches.match(OFFLINE_PAGE) : undefined);
  }
};

const staleWhileRevalidate = async (request) => {
  try {
    const [cacheResponse, networkResponse] = await Promise.all([
      caches.match(request),
      fetch(request)
    ]);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return cacheResponse || networkResponse;
  } catch (err) {
    return caches.match(request);
  }
};

// ===== LIFECYCLE =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => ![CORE_CACHE, DYNAMIC_CACHE].includes(key) && caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// ===== INTELLIGENT FETCH =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Excluir solicitudes externas y POST
  if (!url.origin.includes(self.location.origin)) return;
  if (request.method !== 'GET') return;

  // Estrategias por tipo de recurso
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
  } else if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
  } else if (['style', 'script', 'image'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(caches.match(request) || fetch(request));
  }
});

// ===== BACKGROUND SYNC (MEJORADO) =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(processQueue());
  }
});

const processQueue = async () => {
  const cache = await caches.open(DYNAMIC_CACHE);
  const queue = await cache.keys()
    .then(keys => keys.filter(key => 
      key.url.includes('/api/') && 
      ['POST', 'PUT'].includes(key.method)
    ));

  for (const req of queue) {
    try {
      const body = await req.json();
      const response = await fetch(req.url, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) await cache.delete(req);
    } catch (err) {
      console.log('[SW] Sync fallido, reintentando...');
      return Promise.reject(err);
    }
  }
};

// ===== PUSH NOTIFICATIONS (MEJORADO) =====
self.addEventListener('push', (event) => {
  const notificationData = event.data?.json() || {
    title: 'Seenly',
    body: 'Actualización disponible',
    actions: [{ action: 'view', title: 'Ver' }],
    data: { url: './' }
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: './icon-192-any.png',
      badge: './icon-96.png',
      image: './images/notification-banner.jpg',
      vibrate: [300, 100, 400],
      data: notificationData.data,
      actions: notificationData.actions
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const focusedClient = clientList.find(c => c.url === url);
      return focusedClient ? focusedClient.focus() : clients.openWindow(url);
    })
  );
});

