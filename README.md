# 🎬 Seenly – Tu Historial Visual

**Seenly** es una app web progresiva (PWA) que te permite organizar y registrar todo el contenido audiovisual que ves: películas, series y documentales.  
Guarda, filtra, edita, marca como "visto" y obtén estadísticas inteligentes de tu actividad de visionado.

---

## 🚀 Características principales

✅ Registro rápido de películas, series y documentales  
✅ Campos para temporadas, episodios, notas y estado (visto, pendiente, en progreso)  
✅ Filtros por tipo, plataforma o búsqueda por texto  
✅ Estadísticas visuales y estimación de horas vistas  
✅ Instalación como app (PWA) en móvil y escritorio  
✅ Funciona **offline** gracias a Service Workers  
✅ Exportación/Importación en formato JSON  
✅ Diseño responsive y accesible

---

## 📱 Instala la app (PWA)

1. Abre la app desde tu navegador ([enlace si está online])  
2. Haz clic en el botón `➕ Añadir a pantalla de inicio` o `Instalar`  
3. ¡Listo! Tendrás la app como si fuera nativa en tu dispositivo

> **Requisitos**: conexión HTTPS y navegador compatible (Chrome, Edge, Firefox, etc.)

---

## 🛠️ Tecnologías utilizadas

- **HTML5** + **CSS3** con variables y responsive design
- **JavaScript** puro (sin frameworks)
- **LocalStorage** para almacenamiento persistente
- **Cache API** + **Service Worker** para modo offline
- **Web App Manifest** optimizado para Play Store y Lighthouse

---

## 📤 Exporta tu contenido

Puedes generar un archivo `.json` con todo tu historial.  
También puedes importar tus datos en otro dispositivo usando el mismo botón.

---

## 🧪 Testing y compatibilidad

| Navegador | Compatible | Notas                  |
|-----------|------------|------------------------|
| Chrome    | ✅         | Soporte total          |
| Firefox   | ✅         | Soporte PWA completo   |
| Safari    | ⚠️         | PWA parcial en iOS     |
| Edge      | ✅         | Soporte excelente      |

---

## 📦 Estructura del proyecto

```bash
.
├── index.html
├── style.css
├── script.js
├── manifest.json
├── sw.js
├── fallback.html
├── icons/
│   └── (varios tamaños y versiones maskable)
├── images/
│   └── fallback.jpg, notification-banner.jpg, social-share.jpg
└── README.md
