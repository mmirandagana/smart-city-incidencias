# 🏙️ Smart City - Ecosistema de Gestión de Incidencias Urbanas (Web & Móvil)

Plataforma integral de reporte y gestión de incidencias urbanas municipales (baches, luminarias públicas, semáforos y microbasurales) diseñada bajo una **arquitectura dual desacoplada**:

1. **Panel Web Municipal (`/`)**: Dashboard administrativo para visualización en tiempo real, KPIs operativos y mapa georreferenciado con Leaflet.js.
2. **Cliente Móvil Ciudadano & Cuadrilla (`/mobile/`)**: Aplicación Mobile-First SPA / PWA interactiva con navegación táctil, geolocalización satelital HTML5, modo offline con Service Worker, switch de Modo Cuadrilla para actualización en terreno (`PATCH`), y configuración de empaquetado para distribución directa (.PWA y APK Capacitor sin tiendas).
3. **Backend RESTful con Node.js, Express & TypeScript**: Arquitectura limpia en 3 capas con persistencia local en SQLite3 bajo el patrón Singleton.

---

## 🏛️ Arquitectura del Sistema Dual

```
smart-city-incidencias/
├── capacitor.config.json               # Configuración para empaquetado APK directo (Capacitor)
├── database.sqlite                     # Base de datos local SQLite3
├── package.json                        # Scripts de compilación y pruebas automatizadas
├── tsconfig.json                       # Configuración de compilador TypeScript
├── .env                                # Variables de entorno (PORT, DB_PATH)
├── README.md                           # Documentación técnica del ecosistema
├── src/
│   ├── app.ts                          # Express, middlewares, estáticos y fallback SPA dual
│   ├── server.ts                       # Entrypoint y listener HTTP
│   ├── config/
│   │   ├── database.ts                 # Patrón Singleton de conexión SQLite3
│   │   └── seed.ts                     # Poblado inicial de prueba
│   ├── models/
│   │   └── incidencia.model.ts         # Tipos e invariantes de dominio
│   ├── repositories/
│   │   └── incidencia.repository.ts    # Capa de Acceso a Datos (DAO / SQL promisificado)
│   ├── services/
│   │   └── incidencia.service.ts       # Capa de Lógica de Negocio y Reglas
│   ├── controllers/
│   │   └── incidencia.controller.ts    # Controladores REST HTTP
│   ├── routes/
│   │   └── incidencia.routes.ts        # Enrutador /api/v1/incidencias
│   └── public/                         # Capa de Presentación Dual
│       ├── index.html                  # Dashboard Web Municipal (Desktop / Panel Central)
│       ├── css/styles.css              # Estilos del Dashboard Web
│       ├── js/                         # Lógica del Dashboard Web (Leaflet, KPIs, Modales)
│       └── mobile/                     # 📱 APLICATIVO MÓVIL (SPA / PWA Mobile-First)
│           ├── index.html              # Shell HTML5 (Viewport móvil, 5 Mockups interactivos)
│           ├── manifest.json           # Web App Manifest PWA (CityAlert, standalone)
│           ├── sw.js                   # Service Worker (Caché offline y App Shell)
│           ├── icons/                  # Iconografía PWA (SVG, PNG 192x192, 512x512)
│           ├── css/mobile.css          # Estilos táctiles (Touch targets >=48px, notch safe-areas)
│           └── js/
│               ├── mobile-router.js    # Enrutador SPA ligero y gestor de historial de pantallas
│               ├── mobile-gps.js       # Sensor GPS HTML5 con tolerancia a fallos y fallback
│               └── mobile-app.js       # Orquestador cliente, mapa vertical y API REST
└── tests/
    ├── test-api.http                   # Suite REST Client (VS Code)
    ├── verify-crud.js                  # Suite de pruebas automatizadas Backend CRUD
    └── verify-mobile.js                # Suite de pruebas automatizadas Cliente Móvil & PWA
```

---

## 📱 Módulo Móvil: Vistas, Mockups y Flujos de Interacción

La aplicación móvil en `src/public/mobile/` implementa una experiencia nativa táctil mediante una **Single Page Application (SPA)** de alto rendimiento sin frameworks pesados:

```
                  ┌───────────────────────────────┐
                  │      BARRA DE NAVEGACIÓN      │
                  │   [Inicio] [Mapa] [+] [Perfil]│
                  └───────────────┬───────────────┘
                                  │
      ┌──────────────────┬────────┴─────────┬──────────────────┐
      ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ screen-home  │   │  screen-map  │   │screen-report │   │screen-profile│
│ Feed Tarjetas│   │Leaflet Mobile│   │Form + GPS    │   │PWA / APK Dist│
│ Filtros Cat. │   │Bottom Sheet  │   │Cámara Evid.  │   │Cuadrilla Mode│
└──────┬───────┘   └──────┬───────┘   └──────────────┘   └──────────────┘
       │                  │
       └─────────┬────────┘
                 ▼
          ┌──────────────┐
          │screen-detail │
          │Info Detallada│
          │Modo Cuadrilla│
          │PATCH Estados │
          └──────────────┘
```

### Mapeo de Pantallas (Mockups Interactivos):

1. **`screen-home` (Feed Ciudadano & Acciones Rápidas)**:
   - Visualización de incidencias recientes en formato tarjeta táctil (touch target > 48px).
   - Filtros dinámicos por categoría (Baches, Alumbrado, Semáforos, Basura/Aseo).
   - Indicador de estado de red (Online / Offline PWA).
   - Botón Flotante de Acción (FAB `+`) para reporte inmediato.

2. **`screen-report` (Formulario de Reporte con GPS & Evidencia Fotográfica)**:
   - Selector visual de categorías con retroalimentación háptica/visual.
   - Sensor GPS en tiempo real con indicador de precisión satelital y fallback inteligente.
   - Campos de título, descripción y nivel de urgencia/prioridad.
   - Simulación de captura con cámara y previsualización de imagen.
   - Envío asíncrono hacia `POST /api/v1/incidencias`.

3. **`screen-map` (Mapa Leaflet Interactivo Vertical)**:
   - Cartografía optimizada para orientación vertical y gestos táctiles (pinch-to-zoom).
   - Marcadores georreferenciados dinámicos con iconos por categoría.
   - Botón "Mi Ubicación" para centrado GPS instantáneo.
   - *Bottom Sheet* deslizante con resumen del incidente y acceso directo al detalle.

4. **`screen-detail` (Detalle de Incidencia & Modo Cuadrilla)**:
   - Vista de pantalla completa con fotografía de evidencia, ubicación exacta y fecha.
   - **Modo Cuadrilla Municipal**: activa el panel de operaciones en terreno permitiendo cambiar el estado del reporte (`Ingresado` ➔ `Asignado` ➔ `En Reparación` ➔ `Resuelto`) enviando una petición `PATCH` a la API en tiempo real.

5. **`screen-profile` (Perfil de Usuario & Distribución Directa)**:
   - Identificación de rol (Vecino Ciudadano vs. Operador de Cuadrilla en Terreno).
   - Conmutador de rol operativo.
   - Métricas de incidentes totales y resueltos.
   - Sección de **Distribución Directa** para instalación PWA o generación de APK Capacitor.

---

## 📦 Distribución Directa (Sin Dependencia de Tiendas de Aplicaciones)

El aplicativo móvil está preparado para distribuirse a usuarios y funcionarios sin pasar por Google Play Store ni Apple App Store:

### Opción 1: Instalación Directa como PWA (Progressive Web App)
Gracias a `manifest.json` y `sw.js`:
- **Android (Chrome / Edge / Firefox)**:
  1. Ingresa a `http://<IP-SERVIDOR>:3000/mobile/`.
  2. Pulsa en el botón **"Instalar"** del banner superior o en el menú del navegador selecciona **"Instalar aplicación"** / **"Agregar a la pantalla principal"**.
  3. La app se abrirá en modo `standalone` sin barras de navegador y con icono propio `CityAlert`.
- **iOS (Safari)**:
  1. Abre `http://<IP-SERVIDOR>:3000/mobile/` en Safari.
  2. Pulsa el botón **Compartir** (icono de flecha hacia arriba).
  3. Selecciona **"Agregar al inicio"** (Add to Home Screen).

### Opción 2: Empaquetado a APK Directo con Capacitor
El proyecto incluye el archivo de configuración `capacitor.config.json` en la raíz:

```json
{
  "appId": "cl.unab.smartcity.incidencias",
  "appName": "Smart City Mobile",
  "webDir": "src/public/mobile",
  "bundledWebRuntime": false
}
```

Para generar un archivo `.apk` instalable directamente (Sideloading):

```bash
# 1. Instalar dependencias de Capacitor (si no están instaladas globalmente)
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Agregar la plataforma Android
npx cap add android

# 3. Sincronizar los archivos estáticos de src/public/mobile
npx cap sync

# 4. Compilar el APK debug directamente con Gradle
cd android
./gradlew assembleDebug

# El archivo APK generado estará disponible en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🚀 Instalación y Puesta en Marcha

### 1. Requisitos Previos
- **Node.js**: v18.0.0 o superior (v20+ / v26+ recomendado).
- **npm**: v9.0.0 o superior.

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Poblado Inicial de la Base de Datos (Opcional)
```bash
npm run seed
```

### 4. Ejecución en Modo Desarrollo
```bash
npm run dev
```
- **Dashboard Web Municipal**: `http://localhost:3000/`
- **Aplicación Móvil PWA**: `http://localhost:3000/mobile/`
- **Health Check API**: `http://localhost:3000/api/v1/health`

### 5. Compilación a Producción
```bash
npm run build
npm start
```

---

## 🧪 Pruebas Automatizadas

Con el servidor en ejecución, puedes correr las suites de pruebas integrales:

### 1. Suite de Pruebas del Cliente Móvil & PWA
Valida la entrega de `/mobile/`, el manifiesto PWA, el Service Worker, y el ciclo de vida móvil (POST con GPS ➔ GET detalle ➔ PATCH Cuadrilla ➔ DELETE):
```bash
npm run test:mobile
```

Salida esperada:
```
📱 ========================================================
📱  SUITE DE PRUEBAS DEL CLIENTE MÓVIL & PWA (SMART CITY)
📱 ========================================================

📡 1. Verificando disponibilidad del backend (/api/v1/health)...
✅ [PASS 1] Servidor backend en línea (HTTP 200)

📱 2. Verificando entrega del HTML Shell Móvil (/mobile/)...
✅ [PASS 2] Ruta /mobile/ responde HTTP 200 OK
✅ [PASS 3] HTML contiene el contenedor principal #app-container
✅ [PASS 4] HTML contiene las vistas Mockup requeridas

📄 3. Verificando Web App Manifest PWA (/mobile/manifest.json)...
✅ [PASS 5] Ruta /mobile/manifest.json responde HTTP 200 OK
✅ [PASS 6] Manifest contiene short_name "CityAlert"
✅ [PASS 7] Manifest define display "standalone"
✅ [PASS 8] Manifest define start_url "/mobile/"

⚙️ 4. Verificando Service Worker (/mobile/sw.js)...
✅ [PASS 9] Service Worker accesible en HTTP 200
✅ [PASS 10] Service Worker define manejadores de install y fetch

🛰️ 5. Simulando reporte móvil ciudadano con geolocalización GPS (POST /incidencias)...
✅ [PASS 11] Incidencia móvil creada con HTTP 201 Created
✅ [PASS 12] Categoría guardada correctamente

🔍 6. Consultando detalle de incidencia ID #10...
✅ [PASS 13] Incidencia recuperada con éxito para pantalla screen-detail

🛠️ 7. Simulando actualización de estado en Modo Cuadrilla Municipal (PATCH)...
✅ [PASS 14] Estado actualizado a "En Reparación" vía PATCH

📋 8. Consultando feed móvil actualizado...
✅ [PASS 15] Feed móvil contiene la incidencia reportada

🗑️ 9. Limpiando datos de prueba (DELETE ID #10)...
✅ [PASS 16] Incidencia de prueba eliminada correctamente

========================================================
🎉 RESULTADOS DE VERIFICACIÓN MÓVIL: 16/16 exitosas.
========================================================
```

### 2. Suite de Pruebas de la API Backend (CRUD General)
```bash
npm test
```

### 3. Ejecutar Todas las Suites
```bash
npm run test:all
```

---

## 📡 Especificación de la API RESTful (`/api/v1/incidencias`)

| Método | Endpoint | Descripción | Consumido por |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/incidencias` | Lista todas las incidencias (soporta filtros `categoria`, `estado`, `search`) | Web Panel & Móvil Feed/Mapa |
| `GET` | `/api/v1/incidencias/:id` | Retorna el detalle completo de una incidencia por ID | Web Modal & Móvil Detalle |
| `POST` | `/api/v1/incidencias` | Registra una nueva incidencia con coordenadas GPS y foto | Web Form & Móvil Reporte |
| `PATCH` | `/api/v1/incidencias/:id` | Actualiza estado (`Ingresado`, `Asignado`, `En Reparación`, `Resuelto`) o prioridad | Web Cuadrilla & Móvil Cuadrilla |
| `DELETE` | `/api/v1/incidencias/:id` | Elimina un registro de incidencia del sistema | Web Panel & Test Suites |
| `GET` | `/api/v1/incidencias/stats` | Resumen de conteos totales y clasificados por estado | Web KPI Cards & Perfil Móvil |
| `GET` | `/api/v1/health` | Estado de salud y conectividad del servidor | Monitorización & Tests |

---

## 💻 Asignatura y Evaluación
Desarrollado para el **Taller de Desarrollo Web y Móvil** (Semana 09 - Evaluación Sumativa 3 - APTC106).
