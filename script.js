// ===== CONSTANTES Y CONFIGURACIÓN =====
const PWA_CONFIG = {
  CACHE_NAME: 'contenidos-data-v2',
  SYNC_TAG: 'contenidos-sync',
  OFFLINE_TIMEOUT: 5000,
};

// ===== SERVICE WORKER INTEGRATION =====
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/mi-lista-contenidos/sw.js');
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
      throw error;
    }
  }
  return null;
}

// ===== OFFLINE FIRST DATA HANDLING =====
async function guardarDatos() {
  try {
    // Intentar guardar en red primero
    const response = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(contenido),
      headers: {'Content-Type': 'application/json'}
    });
    
    if (!response.ok) throw new Error('Network error');
    
    // Actualizar caché local
    await updateLocalCache();
    
  } catch (error) {
    // Guardar en IndexedDB para sincronización posterior
    await queueForBackgroundSync(contenido);
    await updateLocalCache();
  }
}

async function updateLocalCache() {
  // Estrategia de caché híbrida (localStorage + IndexedDB)
  try {
    localStorage.setItem('contenido', JSON.stringify(contenido));
    
    if ('caches' in window) {
      const cache = await caches.open(PWA_CONFIG.CACHE_NAME);
      await cache.put(
        new Request('./contenido'),
        new Response(JSON.stringify(contenido))
      );
    }
    
    if ('indexedDB' in window) {
      await idb.set('contenido', contenido);
    }
  } catch (error) {
    console.error('Error updating caches:', error);
    throw error;
  }
}

// ===== BACKGROUND SYNC HANDLING =====
async function queueForBackgroundSync(data) {
  if ('sync' in navigator) {
    await idb.set('pendingData', data);
    await navigator.serviceWorker.ready.then(swRegistration => {
      swRegistration.sync.register(PWA_CONFIG.SYNC_TAG);
    });
  } else {
    mostrarNotificacion('⚠️ Los cambios se guardarán localmente', 'warning');
  }
}

// ===== OFFLINE DETECTION =====
function setupConnectivityHandlers() {
  const updateOnlineStatus = () => {
    document.getElementById('offline-status').hidden = navigator.onLine;
    if (!navigator.onLine) mostrarNotificacion('⚡ Modo offline activado', 'warning');
  };

  window.addEventListener('online', () => {
    updateOnlineStatus();
    checkPendingChanges();
  });
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

// ===== INSTALLATION HANDLING =====
function setupInstallPrompt() {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    botonInstalar.style.display = 'block';
    
    botonInstalar.addEventListener('click', async () => {
      botonInstalar.disabled = true;
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          ga('send', 'event', 'PWA', 'install');
          mostrarNotificacion('📱 App instalada correctamente');
        }
      } finally {
        deferredPrompt = null;
        botonInstalar.hidden = true;
      }
    });
  });
}

// ===== ENHANCED NOTIFICATIONS =====
function mostrarNotificacion(mensaje, tipo = 'success') {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(mensaje, {
      icon: '/mi-lista-contenidos/icons/icon-192-any.png',
      badge: '/mi-lista-contenidos/icons/icon-96.png'
    });
  } else {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    setTimeout(() => notificacion.classList.add('mostrar'), 10);
    setTimeout(() => {
      notificacion.classList.remove('mostrar');
      setTimeout(() => notificacion.remove(), 300);
    }, 3000);
  }
}

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await registerServiceWorker();
    await loadInitialData();
    setupConnectivityHandlers();
    setupInstallPrompt();
    setupEventListeners();
    checkPendingChanges();
    verificarPWA();
  } catch (error) {
    mostrarNotificacion('⚠️ Error crítico: Recarga la aplicación', 'error');
    console.error('Initialization error:', error);
  }
});

// ===== IMPROVED DATA LOADING =====
async function loadInitialData() {
  try {
    const networkData = await fetch('/api/data')
      .then(response => response.json())
      .catch(() => null);

    contenido = networkData || await getCachedData();
    mostrarContenido();
    mostrarEstadisticas();
  } catch (error) {
    contenido = await getFallbackData();
    throw error;
  }
}

async function getCachedData() {
  try {
    return await Promise.any([
      caches.match('./contenido').then(r => r.json()),
      idb.get('contenido'),
      localStorage.getItem('contenido').then(JSON.parse)
    ]);
  } catch {
    return [];
  }
}
