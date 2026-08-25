/**
 * Suite de Pruebas Automatizadas para el Cliente Móvil y PWA de Smart City.
 * Ejecutar con: node tests/verify-mobile.js  o  npm run test:mobile
 */

const SERVER_BASE = 'http://localhost:3000';
const API_BASE = `${SERVER_BASE}/api/v1`;

async function runMobileTests() {
  console.log('📱 ========================================================');
  console.log('📱  SUITE DE PRUEBAS DEL CLIENTE MÓVIL & PWA (SMART CITY)');
  console.log('📱 ========================================================\n');

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
    // 1. Health Check del Servidor
    console.log('📡 1. Verificando disponibilidad del backend (/api/v1/health)...');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'online', 'Servidor backend en línea (HTTP 200)');

    // 2. Disponibilidad del Shell Móvil (/mobile/)
    console.log('\n📱 2. Verificando entrega del HTML Shell Móvil (/mobile/)...');
    const mobileRes = await fetch(`${SERVER_BASE}/mobile/`);
    const mobileHtml = await mobileRes.text();
    assert(mobileRes.status === 200, 'Ruta /mobile/ responde HTTP 200 OK');
    assert(mobileHtml.includes('id="app-container"'), 'HTML contiene el contenedor principal #app-container');
    assert(mobileHtml.includes('screen-home') && mobileHtml.includes('screen-report'), 'HTML contiene las vistas Mockup requeridas');

    // 3. Verificación de Web App Manifest (/mobile/manifest.json)
    console.log('\n📄 3. Verificando Web App Manifest PWA (/mobile/manifest.json)...');
    const manifestRes = await fetch(`${SERVER_BASE}/mobile/manifest.json`);
    const manifestData = await manifestRes.json();
    assert(manifestRes.status === 200, 'Ruta /mobile/manifest.json responde HTTP 200 OK');
    assert(manifestData.short_name === 'CityAlert', 'Manifest contiene short_name "CityAlert"');
    assert(manifestData.display === 'standalone', 'Manifest define display "standalone"');
    assert(manifestData.start_url === '/mobile/', 'Manifest define start_url "/mobile/"');

    // 4. Verificación de Service Worker (/mobile/sw.js)
    console.log('\n⚙️ 4. Verificando Service Worker (/mobile/sw.js)...');
    const swRes = await fetch(`${SERVER_BASE}/mobile/sw.js`);
    const swText = await swRes.text();
    assert(swRes.status === 200, 'Service Worker accesible en HTTP 200');
    assert(swText.includes('addEventListener(\'install\'') && swText.includes('addEventListener(\'fetch\''), 'Service Worker define manejadores de install y fetch');

    // 5. Simulación de Envío de Incidencia desde Cliente Móvil (POST con GPS)
    console.log('\n🛰️ 5. Simulando reporte móvil ciudadano con geolocalización GPS (POST /incidencias)...');
    const mobilePayload = {
      titulo: 'Falla semáforo sensor móvil test',
      categoria: 'Semáforo',
      descripcion: 'Reporte generado simulando sensor GPS del cliente móvil.',
      latitud: -33.4372,
      longitud: -70.6506,
      prioridad: 'Crítica',
      foto_url: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&q=80'
    };

    const postRes = await fetch(`${API_BASE}/incidencias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CityAlert-MobileClient/1.0'
      },
      body: JSON.stringify(mobilePayload)
    });
    const postData = await postRes.json();
    assert(postRes.status === 201 && postData.success === true, 'Incidencia móvil creada con HTTP 201 Created');
    assert(postData.data.categoria === 'Semáforo', 'Categoría guardada correctamente');
    const createdId = postData.data.id;

    // 6. Consulta del Detalle Móvil (GET /incidencias/:id)
    console.log(`\n🔍 6. Consultando detalle de incidencia ID #${createdId}...`);
    const getDetailRes = await fetch(`${API_BASE}/incidencias/${createdId}`);
    const getDetailData = await getDetailRes.json();
    assert(getDetailRes.status === 200 && getDetailData.data.id === createdId, 'Incidencia recuperada con éxito para pantalla screen-detail');

    // 7. Simulación de Transición de Estado en Modo Cuadrilla (PATCH /incidencias/:id)
    console.log(`\n🛠️ 7. Simulando actualización de estado en Modo Cuadrilla Municipal (PATCH)...`);
    const patchRes = await fetch(`${API_BASE}/incidencias/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'En Reparación' })
    });
    const patchData = await patchRes.json();
    assert(patchRes.status === 200 && patchData.data.estado === 'En Reparación', 'Estado actualizado a "En Reparación" vía PATCH');

    // 8. Consulta del Feed Móvil (GET /incidencias)
    console.log('\n📋 8. Consultando feed móvil actualizado...');
    const feedRes = await fetch(`${API_BASE}/incidencias`);
    const feedData = await feedRes.json();
    assert(feedRes.status === 200 && feedData.data.some(i => i.id === createdId), 'Feed móvil contiene la incidencia reportada');

    // 9. Limpieza de Incidencia de Prueba (DELETE)
    console.log(`\n🗑️ 9. Limpiando datos de prueba (DELETE ID #${createdId})...`);
    const delRes = await fetch(`${API_BASE}/incidencias/${createdId}`, { method: 'DELETE' });
    assert(delRes.status === 200, 'Incidencia de prueba eliminada correctamente');

    console.log('\n========================================================');
    console.log(`🎉 RESULTADOS DE VERIFICACIÓN MÓVIL: ${successCount}/${testCount} exitosas.`);
    console.log('========================================================\n');

    if (successCount !== testCount) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('❌ Error catastrófico durante las pruebas del módulo móvil:', error);
    process.exitCode = 1;
  }
}

runMobileTests();
