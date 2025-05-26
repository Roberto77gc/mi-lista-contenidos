// firebase.js
import { db, guardarEnFirestore, obtenerDesdeFirestore } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById('formulario');
  const tipo = document.getElementById('tipo');
  const datosSerie = document.getElementById('datos-serie');
  const lista = document.getElementById('lista-contenido');
  const buscador = document.getElementById('buscador');
  const filtroTipo = document.getElementById('filtro-tipo');
  const filtroPlataforma = document.getElementById('filtro-plataforma');
  const botonEnviar = document.getElementById('boton-enviar');
  const botonExportar = document.getElementById('boton-exportar');
  const inputImportar = document.getElementById('importar-json');
  const botonInstalar = document.getElementById('boton-instalar');

  let contenido = JSON.parse(localStorage.getItem('contenido')) || [];
  let indiceEditando = null;
  let deferredPrompt;

  function init() {
    cargarDatos();
    setupEventListeners();
    verificarPWA();
  }

async function cargarDatos() {
  try {
    const datosRemotos = await obtenerDesdeFirestore();
    if (datosRemotos.length > 0) {
      contenido = datosRemotos;
      console.log('📡 Datos cargados desde Firestore');
      localStorage.setItem('contenido', JSON.stringify(contenido));
    } else {
      const local = localStorage.getItem('contenido');
      if (local) {
        contenido = JSON.parse(local);
        console.log('💾 Datos cargados desde localStorage');
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar desde Firestore:', error);
    const local = localStorage.getItem('contenido');
    if (local) {
      contenido = JSON.parse(local);
      console.log('⚠️ Fallo Firestore, se usó localStorage');
    }
  }

  mostrarContenido();
  mostrarEstadisticas();
}



  function setupEventListeners() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      botonInstalar.style.display = 'block';
    });

    botonInstalar.addEventListener('click', instalarPWA);
    tipo.addEventListener('change', () => {
      datosSerie.style.display = tipo.value === 'Serie' ? 'block' : 'none';
    });
    formulario.addEventListener('submit', handleSubmit);
    buscador.addEventListener('input', debounce(aplicarFiltros, 300));
    filtroTipo.addEventListener('change', aplicarFiltros);
    filtroPlataforma.addEventListener('input', debounce(aplicarFiltros, 300));
    botonExportar.addEventListener('click', exportarDatos);
    inputImportar.addEventListener('change', importarDatos);
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const titulo = document.getElementById('titulo')?.value.trim();
    if (!titulo) return mostrarNotificacion('⚠️ Por favor ingresa un título', 'error');

    const nuevoItem = {
      id: Date.now().toString(),
      tipo: tipo.value,
      titulo,
      plataforma: document.getElementById('plataforma')?.value.trim(),
      temporada: tipo.value === 'Serie' ? document.getElementById('temporada')?.value || 1 : null,
      episodio: tipo.value === 'Serie' ? document.getElementById('episodio')?.value || 1 : null,
      nota: document.getElementById('nota')?.value.trim(),
      estado: document.getElementById('estado')?.value,
      fecha: new Date().toISOString(),
      favorito: false
    };

    if (indiceEditando === null) {
      contenido.unshift(nuevoItem);
      await guardarEnFirestore(nuevoItem); // 🔥 Sincroniza con Firestore
    } else {
      contenido[indiceEditando] = nuevoItem;
      indiceEditando = null;
      botonEnviar.textContent = 'Añadir';
    }

    await guardarDatos();
    mostrarNotificacion('✅ Guardado correctamente');
    formulario.reset();
    datosSerie.style.display = 'none';
  }

  async function guardarDatos() {
    localStorage.setItem('contenido', JSON.stringify(contenido));
    try {
      if ('caches' in window) {
        const cache = await caches.open('mis-contenidos-data');
        await cache.put('./contenido', new Response(JSON.stringify(contenido)));
      }
    } catch (e) {
      console.log('⚠️ Error al guardar en caché:', e);
    }
    mostrarContenido();
    mostrarEstadisticas();
  }

  function aplicarFiltros() {
    const filtros = {
      texto: buscador.value.toLowerCase(),
      tipo: filtroTipo.value,
      plataforma: filtroPlataforma.value.toLowerCase()
    };

    localStorage.setItem('filtros', JSON.stringify(filtros));

    const filtrado = contenido.filter(item => {
      return (
        item.titulo.toLowerCase().includes(filtros.texto) &&
        (filtros.tipo === '' || item.tipo === filtros.tipo) &&
        (filtros.plataforma === '' || item.plataforma?.toLowerCase().includes(filtros.plataforma))
      );
    });

    mostrarContenido(filtrado);
  }

  function mostrarContenido(listaFiltrada = contenido) {
    // Asegurar que todos tienen campo favorito
    listaFiltrada.forEach(item => {
      if (typeof item.favorito === 'undefined') {
        item.favorito = false;
      }
    });

    lista.innerHTML = listaFiltrada.length === 0
      ? '<li class="no-resultados">No se encontraron resultados. ¡Añade tu primer contenido!</li>'
      : listaFiltrada.map(item => `
        <li data-id="${item.id}" class="${item.estado === 'Visto' ? 'visto' : ''}">
          <div class="contenido-header">
            <span class="tipo-badge ${item.tipo.toLowerCase()}">${item.tipo}</span>
            <h3>${item.titulo}</h3>
            ${item.plataforma ? `<span class="plataforma">${item.plataforma}</span>` : ''}
          </div>
          ${item.tipo === 'Serie' ? `
            <div class="serie-info">
              <span>Temporada ${item.temporada}</span>
              <span>Episodio ${item.episodio}</span>
            </div>` : ''}
          ${item.nota ? `<p class="nota">${item.nota}</p>` : ''}
          <div class="contenido-footer">
            <span class="estado ${item.estado.toLowerCase().replace(' ', '-')}">${item.estado}</span>
            <span class="fecha">${new Date(item.fecha).toLocaleDateString()}</span>
          </div>
          <div class="acciones">
          <button class="favorito" onclick="alternarFavorito('${item.id}')" title="Favorito">
          ${item.favorito ? '❤️' : '🤍'}
         </button>
         ${item.estado !== 'Visto' ? `<button class="visto" onclick="marcarVisto('${item.id}')">✔ Visto</button>` : ''}
         <button class="editar" onclick="editar('${item.id}')">✏️ Editar</button>
          <button class="eliminar" onclick="eliminar('${item.id}')">🗑️ Eliminar</button>
        </div>

        </li>
      `).join('');
  }

  function mostrarEstadisticas() {
    const stats = {
      total: contenido.length,
      vistos: contenido.filter(i => i.estado === 'Visto').length,
      enProgreso: contenido.filter(i => i.estado === 'En progreso').length,
      plataformas: {},
      tipos: {},
      horas: contenido.reduce((sum, item) => sum + (item.tipo === 'Serie' ? (parseInt(item.episodio || 0) * 0.5) : 2), 0)
    };

    contenido.forEach(item => {
      stats.plataformas[item.plataforma || 'Sin especificar'] = (stats.plataformas[item.plataforma || 'Sin especificar'] || 0) + 1;
      stats.tipos[item.tipo] = (stats.tipos[item.tipo] || 0) + 1;
    });

    const estadisticasDiv = document.getElementById('estadisticas');
    estadisticasDiv.innerHTML = `
      <h3>📊 Estadísticas Avanzadas</h3>
      <div class="stats-grid">
        <div class="stat-card"><span class="stat-number">${stats.total}</span><span class="stat-label">Total</span></div>
        <div class="stat-card"><span class="stat-number">${stats.vistos}</span><span class="stat-label">Vistos</span></div>
        <div class="stat-card"><span class="stat-number">${stats.enProgreso}</span><span class="stat-label">En progreso</span></div>
        <div class="stat-card"><span class="stat-number">${Math.round(stats.horas)}h</span><span class="stat-label">Tiempo</span></div>
      </div>
    `;
  }

  window.eliminar = async function(id) {
    if (!confirm('¿Eliminar este contenido permanentemente?')) return;
    contenido = contenido.filter(item => item.id !== id);
    await guardarDatos();
    mostrarNotificacion('🗑️ Contenido eliminado');
  };

  window.editar = function(id) {
    const item = contenido.find(i => i.id === id);
    if (!item) return;

    indiceEditando = contenido.indexOf(item);
    tipo.value = item.tipo;
    document.getElementById('titulo').value = item.titulo;
    document.getElementById('plataforma').value = item.plataforma || '';
    document.getElementById('nota').value = item.nota || '';
    document.getElementById('estado').value = item.estado;

    if (item.tipo === 'Serie') {
      document.getElementById('temporada').value = item.temporada;
      document.getElementById('episodio').value = item.episodio;
      datosSerie.style.display = 'block';
    } else {
      datosSerie.style.display = 'none';
    }

    botonEnviar.textContent = 'Guardar cambios';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.marcarVisto = async function(id) {
    const item = contenido.find(i => i.id === id);
    if (item) {
      item.estado = 'Visto';
      await guardarDatos();
      mostrarNotificacion('✅ Marcado como visto');
    }
  };

  window.alternarFavorito = async function(id) {
    const item = contenido.find(i => i.id === id);
    if (item) {
      item.favorito = !item.favorito;
      await guardarDatos();
      mostrarNotificacion(item.favorito ? '💖 Añadido a favoritos' : '🤍 Quitado de favoritos');
    }
  };

  async function exportarDatos() {
    if (contenido.length === 0) {
      return mostrarNotificacion('⚠️ No hay datos para exportar', 'error');
    }

    const blob = new Blob([JSON.stringify({ version: 2, fechaExportacion: new Date().toISOString(), datos: contenido }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-contenidos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    mostrarNotificacion('📤 Exportación completada');
  }

  async function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async e => {
        const parsed = JSON.parse(e.target.result);
        const datosImportados = parsed.version === 2 ? parsed.datos : parsed;

        if (!Array.isArray(datosImportados)) throw new Error('Formato inválido');
        if (!confirm(`¿Importar ${datosImportados.length} registros?`)) return;

        const nuevosIds = new Set(contenido.map(i => i.id));
        const nuevos = datosImportados.filter(i => !nuevosIds.has(i.id));

        contenido = [...nuevos, ...contenido];
        await guardarDatos();
        mostrarNotificacion(`✅ Importados ${nuevos.length} elementos`);
        inputImportar.value = '';
      };
      reader.readAsText(file);
    } catch (error) {
      mostrarNotificacion('❌ Error al importar', 'error');
      console.error(error);
    }
  }

  async function instalarPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      mostrarNotificacion('📱 App instalada correctamente');
      botonInstalar.style.display = 'none';
    }
    deferredPrompt = null;
  }

  function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    notificacion.setAttribute('role', 'alert');
    notificacion.setAttribute('aria-live', 'polite');
    document.body.appendChild(notificacion);

    setTimeout(() => notificacion.classList.add('mostrar'), 10);
    setTimeout(() => {
      notificacion.classList.remove('mostrar');
      setTimeout(() => notificacion.remove(), 300);
    }, 3000);
  }

  function verificarPWA() {
    const requisitos = {
      '✅ Service Worker': !!navigator.serviceWorker?.controller,
      '✅ Manifest': !!document.querySelector('link[rel="manifest"]'),
      '✅ HTTPS': location.protocol === 'https:',
      '✅ Standalone': window.matchMedia('(display-mode: standalone)').matches
    };
    console.table(requisitos);
  }

  const splash = document.getElementById('splash-screen');
  if (splash) {
    setTimeout(() => {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 400);
    }, 800);
  }

  init();
});

