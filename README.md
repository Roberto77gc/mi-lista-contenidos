# 🎬 Seenly – Tu Historial Visual

**Seenly** es una aplicación web progresiva (PWA) que te permite organizar y registrar todo el contenido audiovisual que ves: películas, series y documentales.  
Diseñada para funcionar **incluso sin conexión**, y con posibilidad de instalarse como app móvil o de escritorio.

---

## 🚀 Características principales

- ✅ Añade películas, series o documentales con título, temporada, episodio y notas
- ✅ Marca como **visto**, **pendiente** o **en progreso**
- ✅ Filtrado por tipo de contenido, plataforma o texto libre
- ✅ Estadísticas visuales y cálculo de horas de visualización
- ✅ Funcionalidad **offline completa** (Service Worker + Cache API)
- ✅ Sincronización en la nube con Firebase Firestore (opcional)
- ✅ Exportación e importación en `.json` para copias de seguridad
- ✅ Diseño responsive, accesible y profesional
- ✅ Instalación como App (PWA) en cualquier dispositivo

---

## 📱 Instalación como App

1. Abre la app en tu navegador:  
   👉 [https://roberto77gc.github.io/mi-lista-contenidos/](https://roberto77gc.github.io/mi-lista-contenidos/)

2. Pulsa `➕ Añadir a pantalla de inicio` o el botón `Instalar` si aparece

3. ¡Listo! Funciona como una app nativa, incluso sin conexión

> ℹ️ Compatible con navegadores modernos: Chrome, Edge, Firefox, Brave...  
> ⚠️ En Safari (iOS), el soporte para PWA es limitado

---

## 🛠️ Tecnologías utilizadas

- HTML5 + CSS3 con diseño responsive y modo oscuro automático
- JavaScript puro (sin frameworks)
- Firebase Firestore (para sincronización en la nube)
- LocalStorage + Cache API (para funcionamiento sin conexión)
- Service Worker personalizado
- Web App Manifest optimizado para Lighthouse y Play Store

---

## 📤 Exportación e importación

Puedes exportar todo tu historial visual en un archivo `.json`, y volver a importarlo en otro dispositivo o después de una reinstalación.  
Ideal para tener siempre tu contenido guardado.

---

## 💻 Compatibilidad de navegadores

| Navegador | Compatibilidad | Comentarios                      |
|----------|----------------|----------------------------------|
| Chrome   | ✅             | Soporte completo para PWA        |
| Firefox  | ✅             | Soporte completo                 |
| Edge     | ✅             | Excelente rendimiento            |
| Safari   | ⚠️             | PWA limitado (especialmente iOS) |

---

## 📁 Estructura del proyecto

📦 mi-lista-contenidos/
├── index.html
├── style.css
├── script.js
├── firebase.js
├── sw.js
├── fallback.html
├── manifest.json
├── icons/
│ └── icon-192-any.png, icon-512-maskable.png, ...
├── images/
│ └── fallback.jpg, notification-banner.jpg, ...
└── README.md


---

## 👨‍💻 Autor y licencia

Creado por **José Roberto Valido Suárez**  
GitHub: [@Roberto77gc](https://github.com/Roberto77gc)  
Licencia: [MIT](https://opensource.org/licenses/MIT)  
© 2025 – Proyecto educativo y personal sin ánimo de lucro

---

## 🌐 Versión en producción

👉 [Ver app en GitHub Pages](https://roberto77gc.github.io/mi-lista-contenidos/)
