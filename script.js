// script.js – optimizado por tu PM y Diseñador Web
import { db, guardarEnFirestore, obtenerDesdeFirestore } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById('formulario');
  const tipo = document.getElementById('tipo');
  const datosSerie = document.getElementById('datos-serie');
  const listaContenedor = document.getElementById('lista-contenido');
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

  init();

  async function init() {
    await cargarDatos();
    setupEventListeners();
    verificarPWA();
  }

  async function cargarDatos() {
    try {
      const remotos = await obtenerDesdeFirestore();
      if (remotos.length) {
        contenido = remotos;
        localStorage.setItem('contenido', JSON.stringify(contenido));
        console.log('📡 Firestore');
      } else {
        cargarDesdeLocal();
      }
    } catch (e) {
      console.error('❌ Firestore', e);
      cargarDesdeLocal();
    }
    mostrarContenido();
    mostrarEstadisticas();
  }

  function cargarDesdeLocal() {
    const local = localStorage.getItem('contenido');
    if (local) {
      contenido = JSON.parse(local);
      console.log('💾 LocalStorage');
    }
  }

  function setupEventListeners() {
    document.getElementById('boton-buscar').addEventListener('click', aplicarFiltros);
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      botonInstalar.hidden = false;
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
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const titulo = document.getElementById('titulo')?.value.trim();
    if (!titulo) return notificar('⚠️ Ingresa un título', 'error');

    const nuevo = {
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
      contenido.unshift(nuevo);
      await guardarEnFirestore(nuevo);
    } else {
      contenido[indiceEditando] = nuevo;
      indiceEditando = null;
      botonEnviar.textContent = 'Añadir';
    }

    await guardarDatos();
    notificar('✅ Guardado');
    formulario.reset();
    datosSerie.style.display = 'none';
  }

  async function guardarDatos() {
    localStorage.setItem('contenido', JSON.stringify(contenido));
    try {
      const cache = await caches.open('mis-contenidos-data');
      await cache.put('./contenido', new Response(JSON.stringify(contenido)));
    } catch (e) {
      console.warn('⚠️ No se guardó en caché:', e);
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

    const filtrados = contenido.filter(i =>
      i.titulo.toLowerCase().includes(filtros.texto) &&
      (filtros.tipo === '' || i.tipo === filtros.tipo) &&
      (filtros.plataforma === '' || i.plataforma?.toLowerCase().includes(filtros.plataforma))
    );

    mostrarContenido(filtrados);
  }

  function mostrarContenido(contenidoFiltrado = contenido) {
    contenidoFiltrado.forEach(i => { if (i.favorito === undefined) i.favorito = false; });

    listaContenedor.innerHTML = contenidoFiltrado.length === 0
      ? '<li class="no-resultados">No se encontraron resultados</li>'
      : contenidoFiltrado.map(item => `
        <li data-id="${item.id}" class="${item.estado === 'Visto' ? 'visto' : ''}">
          <div class="contenido-header">
            <span class="tipo-badge ${item.tipo.toLowerCase()}">${item.tipo}</span>
            <h3>${item.titulo}</h3>
            ${item.plataforma ? `<span class="plataforma">${item.plataforma}</span>` : ''}
          </div>
          ${item.tipo === 'Serie' ? `<div class="serie-info">
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
      horas: contenido.reduce((sum, i) => sum + (i.tipo === 'Serie' ? (parseInt(i.episodio || 0) * 0.5) : 2), 0)
    };

    const contenedor = document.getElementById('estadisticas');
    contenedor.innerHTML = `
      <h3>📊 Estadísticas</h3>
      <div class="stats-grid">
        <div class="stat-card"><span class="stat-number">${stats.total}</span><span>Total</span></div>
        <div class="stat-card"><span class="stat-number">${stats.vistos}</span><span>Vistos</span></div>
        <div class="stat-card"><span class="stat-number">${stats.enProgreso}</span><span>En progreso</span></div>
        <div class="stat-card"><span class="stat-number">${Math.round(stats.horas)}h</span><span>Tiempo</span></div>
      </div>
    `;
  }

  window.eliminar = async function(id) {
    if (!confirm('¿Eliminar este contenido?')) return;
    contenido = contenido.filter(i => i.id !== id);
    await guardarDatos();
    notificar('🗑️ Eliminado');
  };

  window.editar = function(id) {
    const i = contenido.find(e => e.id === id);
    if (!i) return;

    indiceEditando = contenido.indexOf(i);
    tipo.value = i.tipo;
    document.getElementById('titulo').value = i.titulo;
    document.getElementById('plataforma').value = i.plataforma || '';
    document.getElementById('nota').value = i.nota || '';
    document.getElementById('estado').value = i.estado;

    if (i.tipo === 'Serie') {
      document.getElementById('temporada').value = i.temporada;
      document.getElementById('episodio').value = i.episodio;
      datosSerie.style.display = 'block';
    } else {
      datosSerie.style.display = 'none';
    }

    botonEnviar.textContent = 'Guardar cambios';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.marcarVisto = async function(id) {
    const i = contenido.find(e => e.id === id);
    if (i) {
      i.estado = 'Visto';
      await guardarDatos();
      notificar('✅ Marcado como visto');
    }
  };

  window.alternarFavorito = async function(id) {
    const i = contenido.find(e => e.id === id);
    if (i) {
      i.favorito = !i.favorito;
      await guardarDatos();
      notificar(i.favorito ? '💖 Favorito' : '🤍 No favorito');
    }
  };

  async function exportarDatos() {
    if (!contenido.length) return notificar('⚠️ No hay datos', 'error');

    const blob = new Blob([JSON.stringify({ version: 2, fecha: new Date().toISOString(), datos: contenido }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    notificar('📤 Exportado');
  }

  async function importarDatos(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const parsed = JSON.parse(e.target.result);
        const datos = parsed.version === 2 ? parsed.datos : parsed;
        if (!Array.isArray(datos)) throw new Error('Inválido');
        if (!confirm(`¿Importar ${datos.length} elementos?`)) return;

        const existentes = new Set(contenido.map(i => i.id));
        const nuevos = datos.filter(i => !existentes.has(i.id));
        contenido = [...nuevos, ...contenido];
        await guardarDatos();
        notificar(`✅ Importados ${nuevos.length}`);
        inputImportar.value = '';
      } catch (err) {
        notificar('❌ Error al importar', 'error');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  async function instalarPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      notificar('📱 App instalada');
      botonInstalar.hidden = true;
    }
    deferredPrompt = null;
  }

  function notificar(mensaje, tipo = 'success') {
    const n = document.createElement('div');
    n.className = `notificacion ${tipo}`;
    n.textContent = mensaje;
    n.setAttribute('role', 'alert');
    n.setAttribute('aria-live', 'polite');
    n.setAttribute('tabindex', '-1');
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('mostrar'), 10);
    setTimeout(() => {
      n.classList.remove('mostrar');
      setTimeout(() => n.remove(), 300);
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
});

