# 🏙️ Smart City - Ecosistema Municipal de Gestión de Incidencias Urbanas

Plataforma Web CRUD y API RESTful de grado profesional para la gestión operativa de incidencias urbanas municipales (baches, fallas de alumbrado público, semáforos descalibrados y acumulación de basura). 

El sistema cuenta con persistencia local en **SQLite3**, implementación de **TypeScript** con arquitectura limpia en capas, patrón **Singleton** para la base de datos y un **Dashboard Web Interactivo con Leaflet.js** para visualización georreferenciada en tiempo real.

---

## 🏛️ Arquitectura del Sistema

El proyecto está diseñado bajo principios de software limpio, modular y escalable.

```
smart-city-incidencias/
├── database.sqlite            # Base de datos local SQLite3 (generada automáticamente)
├── package.json               # Configuración de dependencias y scripts npm
├── tsconfig.json              # Configuración del compilador TypeScript
├── .env                       # Variables de entorno (Puerto, ruta DB)
├── README.md                  # Documentación integral del ecosistema
├── src/
│   ├── app.ts                 # Configuración de Express, middlewares y estáticos
│   ├── server.ts              # Punto de entrada y listener del servidor HTTP
│   ├── config/
│   │   ├── database.ts        # Singleton de conexión SQLite3
│   │   └── seed.ts            # Script de inicialización / poblado de prueba
│   ├── models/
│   │   └── incidencia.model.ts# Interfaces e Invariantes de Dominio (TypeScript)
│   ├── repositories/
│   │   └── incidencia.repository.ts # Capa de Acceso a Datos (DAO / SQL Directo)
│   ├── services/
│   │   └── incidencia.service.ts    # Capa de Lógica de Negocio y Validaciones
│   ├── controllers/
│   │   └── incidencia.controller.ts # Capa Controlador HTTP (REST Controllers)
│   ├── routes/
│   │   └── incidencia.routes.ts     # Enrutador Express (/api/v1/incidencias)
│   └── public/                # Frontend Web Municipal (Static Assets)
│       ├── index.html         # Dashboard HTML5 accesible con Tailwind CSS
│       ├── css/
│       │   └── styles.css     # Estilos personalizados y animaciones
│       └── js/
│           ├── api.js         # Cliente HTTP Fetch para la REST API
│           ├── map.js         # Módulo de Mapa Interactivo Leaflet.js
│           ├── ui.js          # Manipulación DOM, contadores KPI y Modales
│           └── app.js         # Coordinador principal ES6 Modules
└── tests/
    ├── test-api.http          # Suite para REST Client (VS Code)
    └── verify-crud.js         # Suite de Pruebas Automatizadas de Integración
```

### 1. Patrón Singleton (`Database`)
Ubicado en `src/config/database.ts`, la clase `Database` encapsula la instancia de conexión a la base de datos SQLite3.
- **Propósito**: Asegurar que durante todo el ciclo de vida del servidor Express exista **una y solo una** conexión a la base de datos local, evitando bloqueos de archivo (file locking) o conexiones duplicadas.
- **Implementación**:
  ```typescript
  const dbInstance = Database.getInstance();
  ```

### 2. Arquitectura en Capas (Layered Architecture)
El flujo de datos sigue una separación de responsabilidades estricta de 3 capas:
1. **Controller (`incidencia.controller.ts`)**: Recibe las peticiones HTTP (`req`, `res`), desestructura parámetros y retorna respuestas formateadas en JSON con los códigos de estado HTTP adecuados (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`).
2. **Service (`incidencia.service.ts`)**: Implementa la lógica de negocio y validaciones estrictas (rango de coordenadas GPS, enumeraciones de categoría, estados y prioridades permitidas).
3. **Repository / DAO (`incidencia.repository.ts`)**: Realiza la ejecución de consultas SQL mediante métodos promisificados sobre la instancia Singleton de la base de datos.

---

## 📋 Requisitos Previos

- **Node.js**: v18.0.0 o superior (Recomendado v20+ / v26+).
- **npm**: v9.0.0 o superior.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar e Instalar Dependencias
```bash
npm install
```

### 2. Poblar Base de Datos de Prueba (Seeding)
Para inicializar la base de datos con al menos 6 incidencias georreferenciadas de prueba:
```bash
npm run seed
```

### 3. Ejecutar en Modo Desarrollo (Live Reloading)
```bash
npm run dev
```
El servidor se iniciará en `http://localhost:3000`.

### 4. Compilar y Ejecutar en Producción
```bash
npm run build
npm start
```

---

## 🧪 Pruebas Automatizadas (Verify CRUD)

Con el servidor en ejecución (`npm run dev`), abre una segunda terminal y ejecuta la suite automatizada de integración que valida todos los endpoints:

```bash
npm test
```

Salida esperada:
```
🧪 ========================================================
🧪  SUITE DE PRUEBAS DE INTEGRACIÓN REST API (SMART CITY)
🧪 ========================================================

📡 1. Verificando Health Check...
✅ [PASS 1] Servidor respondió 200 OK en /health

📋 2. Obteniendo todas las incidencias (GET /incidencias)...
✅ [PASS 2] Respuesta 200 OK con arreglo de incidencias
✅ [PASS 3] Poblado inicial correcto (6 incidencias encontradas)

➕ 3. Creando nueva incidencia urbana (POST /incidencias)...
✅ [PASS 4] Respuesta 201 Created
✅ [PASS 5] El título retornado coincide con el enviado

🔍 4. Consultando la incidencia creada ID 7 (GET /incidencias/:id)...
✅ [PASS 6] Incidencia recuperada correctamente por ID

🔄 5. Actualizando estado a "En Reparación" (PATCH /incidencias/:id)...
✅ [PASS 7] Estado actualizado a "En Reparación"
✅ [PASS 8] Prioridad actualizada a "Crítica"

📊 6. Consultando estadísticas del sistema (GET /incidencias/stats)...
✅ [PASS 9] Estadísticas obtenidas correctamente

⚠️ 7. Probando validación de campos erróneos (POST /incidencias datos inválidos)...
✅ [PASS 10] El servidor rechazó datos inválidos con código 400 Bad Request

🗑️ 8. Eliminando la incidencia ID 7 (DELETE /incidencias/:id)...
✅ [PASS 11] Respuesta 200 OK al eliminar

🔎 9. Verificando que la incidencia ID 7 ya no existe...
✅ [PASS 12] La incidencia eliminada retorna 404 Not Found

========================================================
🎉 RESUMEN DE PRUEBAS: 12/12 exitosas.
========================================================
```

---

## 📡 Documentación de la API RESTful

### Entidad Incidencia Urbana (`Incidencia`)
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Identificador único numérico (PK Auto-increment) |
| `titulo` | `TEXT` | Nombre o título del reporte (mín. 3 caracteres) |
| `categoria` | `TEXT` | Categoría: `'Bache'`, `'Luminaria'`, `'Semáforo'`, `'Basura/Aseo'` |
| `descripcion` | `TEXT` | Descripción detallada de la problemática urbana |
| `latitud` | `REAL` | Coordenada GPS Latitud (-90 a 90) |
| `longitud` | `REAL` | Coordenada GPS Longitud (-180 a 180) |
| `estado` | `TEXT` | Estado: `'Ingresado'`, `'Asignado'`, `'En Reparación'`, `'Resuelto'` |
| `prioridad` | `TEXT` | Prioridad: `'Baja'`, `'Media'`, `'Alta'`, `'Crítica'` |
| `foto_url` | `TEXT` | URL o ruta opcional a la imagen de evidencia |
| `creado_en` | `DATETIME` | Marca de tiempo ISO de creación |

---

### Endpoints REST

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
- **Respuesta de Ejemplo (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
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
  }
  ```

#### 3. Crear una nueva incidencia urbana
- **Método**: `POST`
- **Ruta**: `/api/v1/incidencias`
- **Payload Request**:
  ```json
  {
    "titulo": "Semáforo fuera de servicio en Av. Providencia",
    "categoria": "Semáforo",
    "descripcion": "Cruce con Pedro de Valdivia tiene luces apagadas por aparente fallo eléctrico.",
    "latitud": -33.4285,
    "longitud": -70.6184,
    "prioridad": "Crítica",
    "foto_url": "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&q=80"
  }
  ```
- **Respuesta de Ejemplo (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Incidencia registrada exitosamente",
    "data": {
      "id": 3,
      "titulo": "Semáforo fuera de servicio en Av. Providencia",
      "categoria": "Semáforo",
      "descripcion": "Cruce con Pedro de Valdivia tiene luces apagadas por aparente fallo eléctrico.",
      "latitud": -33.4285,
      "longitud": -70.6184,
      "estado": "Ingresado",
      "prioridad": "Crítica",
      "foto_url": "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&q=80",
      "creado_en": "2026-08-02 16:10:00"
    }
  }
  ```

#### 4. Actualizar estado / prioridad de incidencia
- **Método**: `PATCH` / `PUT`
- **Ruta**: `/api/v1/incidencias/:id`
- **Payload Request**:
  ```json
  {
    "estado": "En Reparación",
    "prioridad": "Crítica"
  }
  ```
- **Respuesta de Ejemplo (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Incidencia actualizada exitosamente",
    "data": {
      "id": 3,
      "titulo": "Semáforo fuera de servicio en Av. Providencia",
      "categoria": "Semáforo",
      "descripcion": "Cruce con Pedro de Valdivia tiene luces apagadas por aparente fallo eléctrico.",
      "latitud": -33.4285,
      "longitud": -70.6184,
      "estado": "En Reparación",
      "prioridad": "Crítica",
      "foto_url": "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&q=80",
      "creado_en": "2026-08-02 16:10:00"
    }
  }
  ```

#### 5. Eliminar una incidencia
- **Método**: `DELETE`
- **Ruta**: `/api/v1/incidencias/:id`
- **Respuesta de Ejemplo (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Incidencia ID 3 eliminada correctamente"
  }
  ```

#### 6. Obtener resumen de estadísticas
- **Método**: `GET`
- **Ruta**: `/api/v1/incidencias/stats`
- **Respuesta de Ejemplo (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "Total": 6,
      "Ingresado": 2,
      "Asignado": 2,
      "En Reparación": 1,
      "Resuelto": 1
    }
  }
  ```

---

## 🎨 Características del Frontend Web Municipal

- **Panel de Métricas KPI**: Tarjetas animadas con totales por estado.
- **Mapa Georreferenciado Interactivo**: Construido con **Leaflet.js** y mosaicos oscuros de CARTO. Los marcadores varían según la categoría de la incidencia.
- **Captura de Coordenadas al Clic**: Al hacer clic en cualquier punto del mapa, se abre automáticamente el formulario modal con la latitud y longitud autocompletadas.
- **Filtros en Tiempo Real**: Filtrado por estado, categoría y búsqueda en tiempo real con debounce.
- **Acciones Rápidas de Cuadrilla**: Botón para avanzar de estado (`Ingresado` ➔ `Asignado` ➔ `En Reparación` ➔ `Resuelto`).
- **Geolocalización GPS**: Botón para detectar ubicación real mediante la API del navegador.

---

## 💻 Desarrollo

Desarrollado para el **Taller de Desarrollo Web y Móvil (Semana 06)**.
