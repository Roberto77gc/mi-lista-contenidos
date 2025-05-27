# 🎬 Seenly – Tu Historial Visual

**Seenly** es una aplicación web progresiva (PWA) que te permite organizar y registrar todo el contenido audiovisual que ves: películas, series y documentales.

Guarda, filtra, edita, marca como "visto" y obtén estadísticas inteligentes de tu actividad visual.

---

## 🚀 Características principales

- ✅ Registro rápido de películas, series y documentales  
- ✅ Campos para temporada, episodio, notas y estado (visto, pendiente, en progreso)  
- ✅ Filtros por tipo, plataforma o texto libre  
- ✅ Estadísticas visuales y cálculo de horas vistas  
- ✅ Funciona **offline** (Service Worker + Cache API)  
- ✅ Exportación e importación en `.json`  
- ✅ Diseño responsive y accesible  
- ✅ Instalación como App (PWA) en móvil o escritorio

---

## 📱 Cómo instalar Seenly

1. Abre la app en tu navegador:  
   👉 [https://roberto77gc.github.io/mi-lista-contenidos/](https://roberto77gc.github.io/mi-lista-contenidos/)  
2. Haz clic en `➕ Añadir a pantalla de inicio` o `Instalar`  
3. ¡Listo! Funciona como una app nativa, incluso sin conexión

> ℹ️ Requiere conexión HTTPS y un navegador moderno (Chrome, Edge, Firefox, Brave...)

---

## 🛠️ Tecnologías utilizadas

- HTML5 + CSS3 (con diseño responsive y variables)
- JavaScript puro (sin frameworks)
- Firebase Firestore (opcional)
- LocalStorage + Cache API
- Service Worker personalizado
- Web App Manifest optimizado para Lighthouse y Play Store

---

## 📤 Exportación e importación

- Genera un archivo `.json` con todo tu historial  
- Puedes restaurarlo en otro dispositivo desde el botón "Importar"

---

## 🔍 Compatibilidad

| Navegador | Compatible | Comentarios                   |
|-----------|------------|-------------------------------|
| Chrome    | ✅         | Soporte completo              |
| Firefox   | ✅         | Funciona perfectamente        |
| Safari    | ⚠️         | Soporte PWA parcial (iOS)     |
| Edge      | ✅         | Muy buena compatibilidad      |

---

## 📦 Estructura del proyecto

📁 mi-lista-contenidos/
├── index.html
├── style.css
├── script.js
├── firebase.js
├── sw.js
├── fallback.html
├── manifest.json
├── icons/
│ └── icon-192-any.png, icon-512-maskable.png, etc.
├── images/
│ └── fallback.jpg, notification-banner.jpg, social-share.jpg
└── README.md

---

## 🧠 Autor y licencia

Creado por **José Roberto Valido Suárez**  
GitHub: [@Roberto77gc](https://github.com/Roberto77gc)  
Licencia: [MIT](https://opensource.org/licenses/MIT)  
© 2025 – Proyecto educativo/personal

---