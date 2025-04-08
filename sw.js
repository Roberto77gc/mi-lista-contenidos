// ===== CONFIGURACIÓN =====
const CACHE_NAME = 'mis-contenidos-v3';
const DYNAMIC_CACHE = 'dynamic-content-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './icon-192.png',
  './icon-512.png',
  './manifest.json',
  './fallback.html'
];

// ===== INSTALACIÓN =====
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando recursos estáticos');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('[SW] Instalación completada');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Error durante instalación:', err);
      })
  );
});

// ===== ACTIVACIÓN =====
self.addEventListener('activate', (event) => {
  console.log('[SW] Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
            console.log('[SW] Limpiando cache antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// ===== ESTRATEGIA DE CACHÉ (Cache First + Network Fallback) =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Excluir APIs externas
  if (url.origin !== location.origin) return;

  // Estrategia para navegación (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => cacheDynamic(DYNAMIC_CACHE, request, networkResponse.clone()))
        .catch(() => caches.match('./fallback.html'))
    );
    return;
  }

  // Otros recursos: Cache First
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        return cachedResponse || fetch(request)
          .then(networkResponse => {
            if (request.method === 'GET') {
              return cacheDynamic(DYNAMIC_CACHE, request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            if (request.url.includes('.jpg')) {
              return caches.match('./images/fallback.jpg');
            }
            return new Response('', { status: 404 });
          });
      })
  );
});

// ===== FUNCIONES AUXILIARES =====
function cacheDynamic(cacheName, request, response) {
  if (response.ok) {
    return caches.open(cacheName).then(cache => {
      cache.put(request, response.clone());
      return response;
    });
  }
  return response;
}

// ===== SINCRONIZACIÓN EN SEGUNDO PLANO =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Sincronización en segundo plano');
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const keys = await cache.keys();

  const pendingRequests = keys.filter(request => {
    return request.url.includes('/api/') && request.method === 'POST';
  });

  return Promise.all(
    pendingRequests.map(async request => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('[SW] Error en sincronización:', error);
      }
    })
  );
}

// ===== NOTIFICACIONES PUSH =====
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'Nueva actualización',
    body: 'Hay nuevos contenidos disponibles',
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
    clients.matchAll({ type: 'window' }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].navigate(event.notification.data.url);
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});
