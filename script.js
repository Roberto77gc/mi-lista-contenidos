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
    if ('caches' in window) {
      try {
        const cache = await caches.open('mis-contenidos-data');
        const response = await cache.match('./contenido');
        if (response) {
          const cachedData = await response.json();
          if (cachedData.length > 0) {
            contenido = cachedData;
            console.log('📂 Datos cargados desde caché');
          }
        }
      } catch (e) {
        console.log('⚠️ Error al cargar caché:', e);
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
    const titulo = document.getElementById('titulo').value.trim();
    if (!titulo) {
      mostrarNotificacion('⚠️ Por favor ingresa un título', 'error');
      return;
    }

    const nuevoItem = {
      id: Date.now().toString(),
      tipo: tipo.value,
      titulo,
      plataforma: document.getElementById('plataforma').value.trim(),
      temporada: tipo.value === 'Serie' ? document.getElementById('temporada').value || 1 : null,
      episodio: tipo.value === 'Serie' ? document.getElementById('episodio').value || 1 : null,
      nota: document.getElementById('nota').value.trim(),
      estado: document.getElementById('estado').value,
      fecha: new Date().toISOString()
    };

    if (indiceEditando === null) {
      contenido.unshift(nuevoItem);
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
    if ('caches' in window) {
      try {
        const cache = await caches.open('mis-contenidos-data');
        await cache.put(
          './contenido',
          new Response(JSON.stringify(contenido))
        );
      } catch (e) {
        console.log('⚠️ Error al guardar en caché:', e);
      }
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
            ${item.estado !== 'Visto' ? `<button onclick="marcarVisto('${item.id}')">✔ Visto</button>` : ''}
            <button onclick="editar('${item.id}')">✏️ Editar</button>
            <button onclick="eliminar('${item.id}')" class="eliminar">🗑️ Eliminar</button>
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

  async function exportarDatos() {
    if (contenido.length === 0) {
      mostrarNotificacion('⚠️ No hay datos para exportar', 'error');
      return;
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
    document.body.appendChild(notificacion);

    setTimeout(() => notificacion.classList.add('mostrar'), 10);
    setTimeout(() => {
      notificacion.classList.remove('mostrar');
      setTimeout(() => notificacion.remove(), 300);
    }, 3000);
  }

  function verificarPWA() {
    const requisitos = {
      'Service Worker': !!navigator.serviceWorker?.controller,
      'Manifest': !!document.querySelector('link[rel="manifest"]'),
      'HTTPS': window.location.protocol === 'https:',
      'Standalone': window.matchMedia('(display-mode: standalone)').matches
    };
    console.table(requisitos);
  }

  init();
});
