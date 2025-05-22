// ===== CONFIGURACIÓN =====
const CORE_CACHE = 'seenly-core-v2';
const DYNAMIC_CACHE = 'seenly-dynamic-v2';
const OFFLINE_PAGE = '/mi-lista-contenidos/fallback.html';
const FALLBACK_IMAGE = '/mi-lista-contenidos/images/fallback.jpg';

const CORE_ASSETS = [
  '/mi-lista-contenidos/',
  '/mi-lista-contenidos/index.html',
  '/mi-lista-contenidos/style.css',
  '/mi-lista-contenidos/script.js',
  '/mi-lista-contenidos/manifest.json',
  OFFLINE_PAGE,
  FALLBACK_IMAGE,
  '/mi-lista-contenidos/icons/icon-192-any.png',
  '/mi-lista-contenidos/icons/icon-512-any.png'
];

// ===== ESTRATEGIAS =====
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
  const cache = await caches.open(DYNAMIC_CACHE);
  try {
    const [cacheResponse, networkResponse] = await Promise.all([
      cache.match(request),
      fetch(request)
    ]);

    if (networkResponse?.ok) {
      cache.put(request, networkResponse.clone());
    }

    return cacheResponse || networkResponse;
  } catch (err) {
    return cache.match(request);
  }
};

// ===== INSTALACIÓN =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ===== ACTIVACIÓN =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => ![CORE_CACHE, DYNAMIC_CACHE].includes(key) && caches.delete(key))
    ))
    .then(() => self.clients.claim())
  );
});

// ===== MANEJO DE PETICIONES =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Excluir solicitudes externas y no GET
  if (!url.origin.includes(self.location.origin) || request.method !== 'GET') return;

  // Estrategias por tipo de recurso
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith('/mi-lista-contenidos/api/')) {
    event.respondWith(networkFirst(request));
  } else if (['style', 'script', 'image'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(caches.match(request) || fetch(request));
  }
});

// ===== SINCRONIZACIÓN EN SEGUNDO PLANO =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-contenidos') {
    event.waitUntil(syncPendingData());
  }
});

const syncPendingData = async () => {
  const cache = await caches.open(DYNAMIC_CACHE);
  const pending = await cache.keys()
    .then(keys => keys.filter(key => 
      key.url.includes('/api/') && 
      ['POST', 'PUT'].includes(key.method)
    ));

  for (const req of pending) {
    try {
      const body = await req.json();
      const response = await fetch(req.url, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) await cache.delete(req);
    } catch (err) {
      console.log('[SW] Error en sincronización, reintentando...');
      return Promise.reject(err);
    }
  }
};

// ===== NOTIFICACIONES PUSH =====
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'Novedades en Seenly',
    body: 'Tienes actualizaciones disponibles',
    actions: [{ action: 'ver', title: 'Abrir' }],
    data: { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/mi-lista-contenidos/icons/icon-192.png',
      badge: '/mi-lista-contenidos/icons/icon-96.png',
      image: data.image || '/mi-lista-contenidos/images/notificacion.jpg',
      vibrate: [200, 100, 200],
      data: data.data,
      actions: data.actions
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

