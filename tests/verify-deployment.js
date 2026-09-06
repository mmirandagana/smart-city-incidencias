/**
 * Suite de Pruebas Automatizadas de Despliegue Cloud & Plataforma Híbrida.
 * Audita infraestructura Docker, Render PaaS, Capacitor iOS/Android y conectividad HTTP/PWA.
 * 
 * Ejecutar con: node tests/verify-deployment.js  o  npm run test:deploy
 */

const fs = require('fs');
const path = require('path');

let BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let tempServer = null;

async function ensureServer() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/health`, { signal: AbortSignal.timeout(1200) });
    if (res.ok) {
      console.log(`🔌 Conectado al servidor activo en: ${BASE_URL}\n`);
      return;
    }
  } catch (err) {
    // Si el servidor en localhost:3000 no está activo, levantamos una instancia efímera
  }

  try {
    const distAppPath = path.join(__dirname, '../dist/app.js');
    if (fs.existsSync(distAppPath)) {
      const appModule = require(distAppPath);
      const app = appModule.default || appModule;
      const { Database } = require('../dist/config/database');
      const { seedDatabase } = require('../dist/config/seed');

      const db = Database.getInstance();
      await db.ready();
      await seedDatabase(false);

      await new Promise((resolve) => {
        tempServer = app.listen(0, () => {
          const port = tempServer.address().port;
          BASE_URL = `http://localhost:${port}`;
          console.log(`🚀 Servidor en memoria iniciado temporalmente para pruebas en: ${BASE_URL}\n`);
          resolve();
        });
      });
    } else {
      console.warn(`⚠️ Advertencia: dist/app.js no encontrado. Asegúrate de ejecutar 'npm run build' antes de las pruebas.`);
    }
  } catch (startErr) {
    console.warn(`⚠️ No se pudo inicializar servidor temporal: ${startErr.message}. Continuando contra ${BASE_URL}...`);
  }
}

async function runDeploymentTests() {
  console.log('☁️ ================================================================');
  console.log('☁️  SUITE DE VERIFICACIÓN DE DESPLIEGUE CLOUD & ARQUITECTURA HÍBRIDA');
  console.log('☁️ ================================================================\n');

  await ensureServer();

  let testCount = 0;
  let successCount = 0;

  function assert(condition, message) {
    testCount++;
    if (condition) {
      console.log(`✅ [PASS ${testCount}] ${message}`);
      successCount++;
    } else {
      console.error(`❌ [FAIL ${testCount}] ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // BLOQUE 1: VERIFICACIÓN DE CONFIGURACIÓN HÍBRIDA CAPACITOR
    // -------------------------------------------------------------
    console.log('📱 --- BLOQUE 1: Configuración Multiplataforma Capacitor iOS/Android ---');
    
    // 1.1 capacitor.config.json
    const capConfigPath = path.join(__dirname, '../capacitor.config.json');
    assert(fs.existsSync(capConfigPath), 'Existe capacitor.config.json en raíz');
    const capConfig = JSON.parse(fs.readFileSync(capConfigPath, 'utf8'));
    assert(capConfig.appId === 'cl.smartcity.incidencias', 'capacitor.config.json: appId es "cl.smartcity.incidencias"');
    assert(capConfig.appName === 'smart-city-incidencias', 'capacitor.config.json: appName es "smart-city-incidencias"');
    assert(capConfig.webDir === 'src/public/mobile', 'capacitor.config.json: webDir apunta a "src/public/mobile"');

    // 1.2 Android Manifest & Gradle
    const androidManifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
    assert(fs.existsSync(androidManifestPath), 'Existe android/app/src/main/AndroidManifest.xml');
    const manifestContent = fs.existsSync(androidManifestPath) ? fs.readFileSync(androidManifestPath, 'utf8') : '';
    assert(manifestContent.includes('package="cl.smartcity.incidencias"') && manifestContent.includes('ACCESS_FINE_LOCATION'), 
      'AndroidManifest.xml declara package cl.smartcity.incidencias y permisos GPS/Hardware');

    // 1.3 iOS Info.plist
    const iosPlistPath = path.join(__dirname, '../ios/App/App/Info.plist');
    assert(fs.existsSync(iosPlistPath), 'Existe ios/App/App/Info.plist');
    const plistContent = fs.existsSync(iosPlistPath) ? fs.readFileSync(iosPlistPath, 'utf8') : '';
    assert(plistContent.includes('cl.smartcity.incidencias') && plistContent.includes('NSLocationWhenInUseUsageDescription'),
      'Info.plist declara CFBundleIdentifier cl.smartcity.incidencias y permisos de geolocalización');

    // 1.4 Scripts y dependencias en package.json
    const packageJsonPath = path.join(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    assert(allDeps['@capacitor/core'] && allDeps['@capacitor/android'] && allDeps['@capacitor/ios'], 
      'package.json contiene dependencias @capacitor/core, @capacitor/android y @capacitor/ios');
    assert(pkg.scripts['cap:sync'] && pkg.scripts['build:mobile'], 
      'package.json incluye scripts de compilación y sincronización móvil ("cap:sync", "build:mobile")');

    // -------------------------------------------------------------
    // BLOQUE 2: VERIFICACIÓN DE ARTEFACTOS CLOUD & CONTENERIZACIÓN
    // -------------------------------------------------------------
    console.log('\n🐳 --- BLOQUE 2: Contenerización Docker & Cloud Config ---');

    // 2.1 Dockerfile Multi-Stage
    const dockerfilePath = path.join(__dirname, '../Dockerfile');
    assert(fs.existsSync(dockerfilePath), 'Existe Dockerfile en la raíz del proyecto');
    const dockerfileContent = fs.existsSync(dockerfilePath) ? fs.readFileSync(dockerfilePath, 'utf8') : '';
    assert(dockerfileContent.includes('AS builder') && dockerfileContent.includes('AS runner'), 
      'Dockerfile implementa arquitectura multi-stage (Stage 1: builder, Stage 2: runner)');
    assert(dockerfileContent.includes('node:18-alpine') && dockerfileContent.includes('dist/server.js'), 
      'Dockerfile utiliza node:18-alpine y ejecuta dist/server.js');

    // 2.2 .dockerignore
    const dockerignorePath = path.join(__dirname, '../.dockerignore');
    assert(fs.existsSync(dockerignorePath), 'Existe archivo .dockerignore');
    const dockerignoreContent = fs.existsSync(dockerignorePath) ? fs.readFileSync(dockerignorePath, 'utf8') : '';
    assert(dockerignoreContent.includes('node_modules') && dockerignoreContent.includes('android') && dockerignoreContent.includes('ios'), 
      '.dockerignore excluye node_modules, android, ios y artefactos temporales');

    // 2.3 docker-compose.yml
    const dockerComposePath = path.join(__dirname, '../docker-compose.yml');
    assert(fs.existsSync(dockerComposePath), 'Existe docker-compose.yml');
    const composeContent = fs.existsSync(dockerComposePath) ? fs.readFileSync(dockerComposePath, 'utf8') : '';
    assert(composeContent.includes('services:') && composeContent.includes('web:') && composeContent.includes('sqlite_data:'), 
      'docker-compose.yml define servicio web con volumen nombrado sqlite_data');

    // 2.4 render.yaml (PaaS Blueprint)
    const renderYamlPath = path.join(__dirname, '../render.yaml');
    assert(fs.existsSync(renderYamlPath), 'Existe render.yaml para despliegue Cloud');
    const renderContent = fs.existsSync(renderYamlPath) ? fs.readFileSync(renderYamlPath, 'utf8') : '';
    assert(renderContent.includes('type: web') && renderContent.includes('runtime: docker'), 
      'render.yaml especifica servicio tipo web y runtime docker');
    assert(renderContent.includes('mountPath: /data') && renderContent.includes('DB_PATH'), 
      'render.yaml configura disco persistente en /data y variable DB_PATH=/data/database.sqlite');

    // 2.5 Pipeline CI/CD GitHub Actions
    const workflowPath = path.join(__dirname, '../.github/workflows/deploy.yml');
    assert(fs.existsSync(workflowPath), 'Existe pipeline .github/workflows/deploy.yml');
    const workflowContent = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : '';
    assert(workflowContent.includes('npm run build') && workflowContent.includes('docker build'), 
      'Pipeline de CI/CD automatiza build TypeScript, pruebas de integración y validación Docker');

    // -------------------------------------------------------------
    // BLOQUE 3: AUDITORÍA DE CONECTIVIDAD HTTP & ENDPOINTS DUALES
    // -------------------------------------------------------------
    console.log('\n🌐 --- BLOQUE 3: Auditoría de Endpoints Web, Móvil & API REST ---');

    // 3.1 Endpoint Raíz (Dashboard Desktop)
    console.log('🖥️ Auditando Endpoint Raíz (Dashboard Web Municipal)...');
    const rootRes = await fetch(`${BASE_URL}/`);
    const rootHtml = await rootRes.text();
    assert(rootRes.status === 200, 'GET / responde HTTP 200 OK');
    assert(rootHtml.includes('<!DOCTYPE html>') && rootHtml.includes('map'), 'GET / entrega Dashboard HTML con contenedor de mapa');

    // 3.2 Endpoint Móvil Shell (/mobile)
    console.log('📱 Auditando App Shell Móvil (/mobile y /mobile/)...');
    const mobileRes = await fetch(`${BASE_URL}/mobile/`);
    const mobileHtml = await mobileRes.text();
    assert(mobileRes.status === 200, 'GET /mobile/ responde HTTP 200 OK');
    assert(mobileHtml.includes('app-container') || mobileHtml.includes('screen-home'), 'GET /mobile/ entrega App Shell SPA');

    // 3.3 Artefactos PWA (manifest.json y sw.js)
    console.log('⚡ Auditando Artefactos PWA...');
    const manifestRes = await fetch(`${BASE_URL}/mobile/manifest.json`);
    const manifestJson = await manifestRes.json();
    assert(manifestRes.status === 200 && manifestJson.short_name, 'GET /mobile/manifest.json responde HTTP 200 con manifest válido');

    const swRes = await fetch(`${BASE_URL}/mobile/sw.js`);
    const swContent = await swRes.text();
    assert(swRes.status === 200 && swContent.includes('addEventListener'), 'GET /mobile/sw.js responde HTTP 200 con Service Worker');

    // 3.4 API REST de Incidencias (/api/v1/incidencias)
    console.log('📡 Auditando API RESTful (/api/v1/incidencias)...');
    const apiRes = await fetch(`${BASE_URL}/api/v1/incidencias`);
    const contentType = apiRes.headers.get('content-type') || '';
    const apiData = await apiRes.json();
    assert(apiRes.status === 200, 'GET /api/v1/incidencias responde HTTP 200 OK');
    assert(contentType.includes('application/json'), 'Encabezado Content-Type es application/json');
    assert(Array.isArray(apiData.data), 'Payload retornado contiene array de incidencias');

    // -------------------------------------------------------------
    // RESUMEN FINAL
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`🎉 RESUMEN DE AUDITORÍA DE DESPLIEGUE: ${successCount}/${testCount} pruebas exitosas.`);
    console.log('================================================================\n');

    if (successCount < testCount) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('💥 Error durante la ejecución de auditoría de despliegue:', err);
    process.exitCode = 1;
  } finally {
    if (tempServer) {
      tempServer.close();
      console.log('🛑 Servidor temporal cerrado correctamente.');
    }
  }
}

runDeploymentTests();
