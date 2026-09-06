# 🏙️ Smart City - Ecosistema de Gestión de Incidencias Urbanas (Web & Móvil)

Plataforma integral de reporte y gestión de incidencias urbanas municipales (baches, luminarias públicas, semáforos y microbasurales) diseñada bajo una **arquitectura dual desacoplada**:

1. **Panel Web Municipal (`/`)**: Dashboard administrativo para visualización en tiempo real, KPIs operativos y mapa georreferenciado con Leaflet.js.
2. **Cliente Móvil Ciudadano & Cuadrilla (`/mobile/`)**: Aplicación Mobile-First SPA / PWA interactiva con navegación táctil, geolocalización satelital HTML5, modo offline con Service Worker, switch de Modo Cuadrilla para actualización en terreno (`PATCH`), y configuración de empaquetado para distribución directa (.PWA y APK Capacitor sin tiendas).
3. **Backend RESTful con Node.js, Express & TypeScript**: Arquitectura limpia en 3 capas con persistencia local en SQLite3 bajo el patrón Singleton.

---

## 🏛️ Arquitectura del Sistema Dual

```
smart-city-incidencias/
├── .github/
│   └── workflows/
│       └── deploy.yml                  # 🚀 Pipeline de CI/CD automatizado (GitHub Actions)
├── android/                            # 🤖 Plataforma nativa Android (Capacitor)
│   └── app/
│       ├── build.gradle                # Configuración de compilación Android
│       └── src/main/AndroidManifest.xml# Permisos nativos (GPS satelital, Cámara, Red)
├── ios/                                # 🍎 Plataforma nativa iOS (Capacitor)
│   └── App/App/Info.plist              # Configuración y permisos nativos iOS
├── capacitor.config.json               # Configuración híbrida multiplataforma (Capacitor v6)
├── Dockerfile                          # 🐳 Contenerización multi-stage para producción (Alpine)
├── .dockerignore                       # Exclusiones de contexto para optimización de imagen
├── docker-compose.yml                  # 📦 Orquestación local/producción con volumen persistente
├── render.yaml                         # ☁️ Blueprint PaaS para Render con Persistent Disk SQLite
├── database.sqlite                     # Base de datos local SQLite3
├── package.json                        # Scripts de compilación, Capacitor, Docker y pruebas
├── tsconfig.json                       # Configuración de compilador TypeScript
├── .env                                # Variables de entorno (PORT, DB_PATH)
├── README.md                           # Documentación técnica integral del ecosistema
├── src/
│   ├── app.ts                          # Express, middlewares, estáticos y fallback SPA dual
│   ├── server.ts                       # Entrypoint, listener HTTP y graceful shutdown
│   ├── config/
│   │   ├── database.ts                 # Patrón Singleton SQLite3 con autocreación de directorios
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
    ├── verify-mobile.js                # Suite de pruebas automatizadas Cliente Móvil & PWA
    └── verify-deployment.js            # Suite de pruebas de despliegue Cloud & Plataforma Híbrida
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

### 1. Suite de Auditoría de Despliegue Cloud & Arquitectura Híbrida
Audita automáticamente la configuración multiplataforma de Capacitor (Android/iOS), los artefactos de infraestructura Docker, Docker Compose, el blueprint PaaS de Render, el pipeline de CI/CD y la conectividad HTTP/PWA de todos los endpoints:
```bash
npm run test:deploy
# o alternativamente:
node tests/verify-deployment.js
```

Salida esperada:
```
☁️ ================================================================
☁️  SUITE DE VERIFICACIÓN DE DESPLIEGUE CLOUD & ARQUITECTURA HÍBRIDA
☁️ ================================================================

📱 --- BLOQUE 1: Configuración Multiplataforma Capacitor iOS/Android ---
✅ [PASS 1] Existe capacitor.config.json en raíz
✅ [PASS 2] capacitor.config.json: appId es "cl.smartcity.incidencias"
✅ [PASS 3] capacitor.config.json: appName es "smart-city-incidencias"
✅ [PASS 4] capacitor.config.json: webDir apunta a "src/public/mobile"
✅ [PASS 5] Existe android/app/src/main/AndroidManifest.xml
✅ [PASS 6] AndroidManifest.xml declara package cl.smartcity.incidencias y permisos GPS/Hardware
✅ [PASS 7] Existe ios/App/App/Info.plist
✅ [PASS 8] Info.plist declara CFBundleIdentifier cl.smartcity.incidencias y permisos de geolocalización
✅ [PASS 9] package.json contiene dependencias @capacitor/core, @capacitor/android y @capacitor/ios
✅ [PASS 10] package.json incluye scripts de compilación y sincronización móvil ("cap:sync", "build:mobile")

🐳 --- BLOQUE 2: Contenerización Docker & Cloud Config ---
✅ [PASS 11] Existe Dockerfile en la raíz del proyecto
✅ [PASS 12] Dockerfile implementa arquitectura multi-stage (Stage 1: builder, Stage 2: runner)
✅ [PASS 13] Dockerfile utiliza node:18-alpine y ejecuta dist/server.js
✅ [PASS 14] Existe archivo .dockerignore
✅ [PASS 15] .dockerignore excluye node_modules, android, ios y artefactos temporales
✅ [PASS 16] Existe docker-compose.yml
✅ [PASS 17] docker-compose.yml define servicio web con volumen nombrado sqlite_data
✅ [PASS 18] Existe render.yaml para despliegue Cloud
✅ [PASS 19] render.yaml especifica servicio tipo web y runtime docker
✅ [PASS 20] render.yaml configura disco persistente en /data y variable DB_PATH=/data/database.sqlite
✅ [PASS 21] Existe pipeline .github/workflows/deploy.yml
✅ [PASS 22] Pipeline de CI/CD automatiza build TypeScript, pruebas de integración y validación Docker

🌐 --- BLOQUE 3: Auditoría de Endpoints Web, Móvil & API REST ---
🖥️ Auditando Endpoint Raíz (Dashboard Web Municipal)...
✅ [PASS 23] GET / responde HTTP 200 OK
✅ [PASS 24] GET / entrega Dashboard HTML con contenedor de mapa
📱 Auditando App Shell Móvil (/mobile y /mobile/)...
✅ [PASS 25] GET /mobile/ responde HTTP 200 OK
✅ [PASS 26] GET /mobile/ entrega App Shell SPA
⚡ Auditando Artefactos PWA...
✅ [PASS 27] GET /mobile/manifest.json responde HTTP 200 con manifest válido
✅ [PASS 28] GET /mobile/sw.js responde HTTP 200 con Service Worker
📡 Auditando API RESTful (/api/v1/incidencias)...
✅ [PASS 29] GET /api/v1/incidencias responde HTTP 200 OK
✅ [PASS 30] Encabezado Content-Type es application/json
✅ [PASS 31] Payload retornado contiene array de incidencias

================================================================
🎉 RESUMEN DE AUDITORÍA DE DESPLIEGUE: 31/31 pruebas exitosas.
================================================================
```

### 2. Suite de Pruebas del Cliente Móvil & PWA
Valida la entrega de `/mobile/`, el manifiesto PWA, el Service Worker, y el ciclo de vida móvil (POST con GPS ➔ GET detalle ➔ PATCH Cuadrilla ➔ DELETE):
```bash
npm run test:mobile
```

### 3. Suite de Pruebas de la API Backend (CRUD General)
```bash
npm test
```

### 4. Ejecutar Todas las Suites en Cadena
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

## 📡 Endpoints REST Detallados

#### 1. Obtener todas las incidencias
- **Método**: `GET`
- **Ruta**: `/api/v1/incidencias`
- **Query Params (Opcionales)**: `estado`, `categoria`, `prioridad`, `search`
- **Respuesta de Ejemplo (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "id": 1,
        "titulo": "Bache profundo en Av. España con Alameda",
        "categoria": "Bache",
        "descripcion": "Peligroso evento en calzada derecha sentido sur.",
        "latitud": -33.4512,
        "longitud": -70.6695,
        "estado": "Ingresado",
        "prioridad": "Alta",
        "foto_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&q=80",
        "creado_en": "2026-08-02 16:00:00"
      }
    ]
  }
  ```

#### 2. Obtener una incidencia específica
- **Método**: `GET`
- **Ruta**: `/api/v1/incidencias/:id`

#### 3. Crear una nueva incidencia urbana (Web / Móvil con GPS)
- **Método**: `POST`
- **Ruta**: `/api/v1/incidencias`

#### 4. Actualizar estado / prioridad de incidencia (Modo Cuadrilla)
- **Método**: `PATCH` / `PUT`
- **Ruta**: `/api/v1/incidencias/:id`

#### 5. Eliminar una incidencia
- **Método**: `DELETE`
- **Ruta**: `/api/v1/incidencias/:id`

#### 6. Obtener resumen de estadísticas
- **Método**: `GET`
- **Ruta**: `/api/v1/incidencias/stats`

---

## 📱 Despliegue Híbrido Multiplataforma (Capacitor iOS & Android)

El aplicativo móvil `smart-city-incidencias` soporta compilación y distribución híbrida nativa para **Android** e **iOS** a través de **Capacitor v6**, compartiendo el mismo núcleo web SPA/PWA ubicado en `src/public/mobile`:

### 1. Configuración de Plataforma (`capacitor.config.json`)
```json
{
  "appId": "cl.smartcity.incidencias",
  "appName": "smart-city-incidencias",
  "webDir": "src/public/mobile",
  "bundledWebRuntime": false
}
```

### 2. Permisos Nativos Configurados
- **Android (`android/app/src/main/AndroidManifest.xml`)**:
  - `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION`: Captura de coordenadas GPS en terreno.
  - `CAMERA`: Captura de evidencia fotográfica de eventos urbanos.
  - `INTERNET`: Comunicación bidireccional con la API REST.
- **iOS (`ios/App/App/Info.plist`)**:
  - `NSLocationWhenInUseUsageDescription`: Autorización de geolocalización satelital.
  - `NSCameraUsageDescription`: Autorización de acceso al sensor óptico/cámara.

### 3. Comandos de Compilación y Sincronización
```bash
# 1. Compilar backend y copiar assets web móviles al directorio nativo
npm run build:mobile

# 2. Sincronizar plugins y dependencias nativas con Capacitor
npm run cap:sync

# 3. Abrir proyecto nativo en Android Studio (para generar APK / AAB)
npx cap open android

# 4. Abrir proyecto nativo en Xcode (macOS requerido para compilar IPA)
npx cap open ios

# 5. Ejecutar directamente en emulador o dispositivo físico conectado
npx cap run android
npx cap run ios
```

---

## ☁️ Despliegue en la Nube (Cloud Deployment)

La plataforma cuenta con una arquitectura **Cloud-Ready** basada en contenedores Docker y configuración declarativa como código para despliegues confiables y reproducibles:

### 1. Contenerización con Docker (Multi-Stage Build)
El archivo `Dockerfile` implementa un diseño multi-etapa sobre Alpine Linux que optimiza el tamaño de la imagen final y compila limpiamente las extensiones C++ de SQLite:
- **Etapa 1 (`builder`)**: Instala dependencias y compila TypeScript a JavaScript nativo (`dist/`).
- **Etapa 2 (`runner`)**: Imagen limpia con `NODE_ENV=production`, dependencias optimizadas y herramientas de runtime nativas (`python3`, `make`, `g++`).

Comandos de construcción y ejecución local:
```bash
# Construir la imagen Docker
docker build -t smart-city-incidencias .

# Ejecutar el contenedor con volumen para persistencia SQLite
docker run -d \
  --name smart-city-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_PATH=/app/data/database.sqlite \
  -v smartcity_data:/app/data \
  smart-city-incidencias
```

### 2. Orquestación con Docker Compose
Para levantar el ecosistema completo con un único comando:
```bash
# Iniciar servicio en segundo plano
docker-compose up -d --build

# Ver registros de ejecución
docker-compose logs -f web

# Detener servicio
docker-compose down
```

El volumen `sqlite_data` asegura que la base de datos `/app/data/database.sqlite` no se destruya al reiniciar contenedores.

### 3. Despliegue en Render (PaaS con Blueprint `render.yaml`)
El repositorio incluye el manifiesto `render.yaml` listo para despliegues automatizados (Infrastructure as Code):
- **Runtime**: Docker Engine gestionado.
- **Disco Persistente**: Volumen SSD de 1 GB montado en `/data`.
- **Persistencia**: La variable `DB_PATH=/data/database.sqlite` garantiza que las incidencias reportadas por los ciudadanos persistan incluso si la instancia se reinicia o se despliega una nueva versión.

**Pasos de despliegue en Render**:
1. Conecta tu repositorio de GitHub a tu cuenta de Render.
2. Selecciona **Blueprints** y vincula el repositorio (`render.yaml` se detectará automáticamente).
3. Haz clic en **Apply**: Render creará el Web Service Docker y provisionará el disco persistente de 1 GB en `/data`.

### 4. Despliegue en AWS (ECS / Fargate o App Runner) & Railway
- **AWS**: Utilizar AWS ECR para almacenar la imagen Docker y AWS ECS/Fargate vinculando un volumen Amazon EFS para persistencia de la base de datos SQLite.
- **Railway**: Desplegar el `Dockerfile` directamente asociando un **Persistent Volume** montado en `/data`.

---

## 🚀 Pipeline de Integración y Entrega Continua (CI/CD)

El archivo `.github/workflows/deploy.yml` implementa un flujo de automatización completo ejecutado en cada `push` o `pull_request` a la rama `main`:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      GITHUB ACTIONS CI/CD WORKFLOW                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
  [1. Checkout & Setup]                                   [2. Dependencies]
  Node.js v18.x en Ubuntu                                 npm install limpio
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     ▼
                          [3. Typecheck & Build]
                          npm run build (tsc)
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
  [4. Service Start]                                      [5. Test Suites]
  Arranque en background +                                verify-crud.js
  Healthcheck HTTP polling                                verify-mobile.js
                                                          verify-deployment.js
                                     │
                                     ▼
                          [6. Docker Build Verify]
                          docker build . -t smart-city-incidencias:test
```

---

## 💻 Desarrollo y Evaluación
Desarrollado para el **Taller de Desarrollo Web y Móvil** (Semana 11 - Evaluación Sumativa 4: Propuesta de Solución y Despliegue Cloud) - **Manuel Miranda**.
