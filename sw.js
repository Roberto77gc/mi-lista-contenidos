// sw.js – Service Worker Optimizado para Seenly

const VERSION = 'v3';
const CACHE_CORE = `seenly-core-${VERSION}`;
const CACHE_DYNAMIC = `seenly-dynamic-${VERSION}`;

const OFFLINE_PAGE = './fallback.html';
const FALLBACK_IMAGE = './images/fallback.jpg';

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './firebase.js',
  OFFLINE_PAGE,
  FALLBACK_IMAGE,
  './icons/icon-192-any.png',
  './icons/icon-512-any.png'
];

// 🎯 Estrategia: Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_DYNAMIC);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    return cached || (request.destination === 'document' ? caches.match(OFFLINE_PAGE) : undefined);
  }
}

// 🎯 Estrategia: Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const networkFetch = fetch(request)
    .then(response => {
      if (response.ok) {
        caches.open(CACHE_DYNAMIC).then(cache => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => {});
  return cached || networkFetch;
}

// ✅ Instalación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_CORE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 🔁 Activación y limpieza de cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (![CACHE_CORE, CACHE_DYNAMIC].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 🌍 Interceptar peticiones
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.href.startsWith(self.location.origin)) return;

  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
  } else if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) return response;
        if (request.destination === 'image') {
          return caches.match(FALLBACK_IMAGE);
        }
        return fetch(request);
      }).catch(() => undefined)
    );
  }
});

// 🔄 Sync en segundo plano (ejemplo preparado)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-seenly') {
    event.waitUntil(procesarColaSync());
  }
});

async function procesarColaSync() {
  // Implementar lógica si se usa cola offline
  console.log('[SW] Sync en segundo plano activado');
}

// 🔔 Notificaciones Push
self.addEventListener('push', event => {
  const data = event.data?.json() || {
    title: 'Seenly',
    body: 'Tienes nuevo contenido pendiente',
    data: { url: './' }
  };

  const options = {
    body: data.body,
    icon: './icons/icon-192-any.png',
    badge: './icons/icon-96.png',
    image: './images/notification-banner.jpg',
    vibrate: [200, 100, 300],
    data: data.data,
    actions: data.actions || [{ action: 'ver', title: 'Ver ahora' }]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 📲 Acción al hacer clic en la notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      const ventanaActiva = clientsArr.find(client => client.url === url);
      return ventanaActiva ? ventanaActiva.focus() : clients.openWindow(url);
    })
  );
});


