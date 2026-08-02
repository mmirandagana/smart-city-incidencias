/**
 * Suite de Pruebas Automatizadas para la API REST de Smart City.
 * Ejecutar con: npm run test
 */
const BASE_URL = 'http://localhost:3000/api/v1';

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪  SUITE DE PRUEBAS DE INTEGRACIÓN REST API (SMART CITY)');
  console.log('🧪 ========================================================\n');

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
    // TEST 1: Health Check
    console.log('📡 1. Verificando Health Check...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'online', 'Servidor respondió 200 OK en /health');

    // TEST 2: GET /incidencias
    console.log('\n📋 2. Obteniendo todas las incidencias (GET /incidencias)...');
    const getRes = await fetch(`${BASE_URL}/incidencias`);
    const getData = await getRes.json();
    assert(getRes.status === 200 && Array.isArray(getData.data), 'Respuesta 200 OK con arreglo de incidencias');
    assert(getData.data.length >= 5, `Poblado inicial correcto (${getData.data.length} incidencias encontradas)`);

    // TEST 3: POST /incidencias (Crear nueva incidencia)
    console.log('\n➕ 3. Creando nueva incidencia urbana (POST /incidencias)...');
    const newIncidencia = {
      titulo: 'Test Bache Automatizado',
      categoria: 'Bache',
      descripcion: 'Bache creado por la suite de pruebas integrales para verificar inserción.',
      latitud: -33.4500,
      longitud: -70.6600,
      prioridad: 'Alta'
    };

    const postRes = await fetch(`${BASE_URL}/incidencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIncidencia)
    });
    const postData = await postRes.json();
    assert(postRes.status === 201 && postData.success === true, 'Respuesta 201 Created');
    assert(postData.data.titulo === newIncidencia.titulo, 'El título retornado coincide con el enviado');
    const createdId = postData.data.id;

    // TEST 4: GET /incidencias/:id (Obtener por ID)
    console.log(`\n🔍 4. Consultando la incidencia creada ID ${createdId} (GET /incidencias/:id)...`);
    const getSingleRes = await fetch(`${BASE_URL}/incidencias/${createdId}`);
    const getSingleData = await getSingleRes.json();
    assert(getSingleRes.status === 200 && getSingleData.data.id === createdId, 'Incidencia recuperada correctamente por ID');

    // TEST 5: PATCH /incidencias/:id (Actualizar estado y prioridad)
    console.log(`\n🔄 5. Actualizando estado a "En Reparación" (PATCH /incidencias/:id)...`);
    const patchRes = await fetch(`${BASE_URL}/incidencias/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'En Reparación', prioridad: 'Crítica' })
    });
    const patchData = await patchRes.json();
    assert(patchRes.status === 200 && patchData.data.estado === 'En Reparación', 'Estado actualizado a "En Reparación"');
    assert(patchData.data.prioridad === 'Crítica', 'Prioridad actualizada a "Crítica"');

    // TEST 6: GET /incidencias/stats (Verificar métricas)
    console.log('\n📊 6. Consultando estadísticas del sistema (GET /incidencias/stats)...');
    const statsRes = await fetch(`${BASE_URL}/incidencias/stats`);
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && typeof statsData.data.Total === 'number', 'Estadísticas obtenidas correctamente');

    // TEST 7: Validación de errores (POST inválido)
    console.log('\n⚠️ 7. Probando validación de campos erróneos (POST /incidencias datos inválidos)...');
    const badPostRes = await fetch(`${BASE_URL}/incidencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'x', categoria: 'Inexistente', latitud: 500 })
    });
    assert(badPostRes.status === 400, 'El servidor rechazó datos inválidos con código 400 Bad Request');

    // TEST 8: DELETE /incidencias/:id (Eliminar incidencia de prueba)
    console.log(`\n🗑️ 8. Eliminando la incidencia ID ${createdId} (DELETE /incidencias/:id)...`);
    const deleteRes = await fetch(`${BASE_URL}/incidencias/${createdId}`, {
      method: 'DELETE'
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200 && deleteData.success === true, 'Respuesta 200 OK al eliminar');

    // TEST 9: Confirmar eliminación (GET 404)
    console.log(`\n🔎 9. Verificando que la incidencia ID ${createdId} ya no existe...`);
    const notFoundRes = await fetch(`${BASE_URL}/incidencias/${createdId}`);
    assert(notFoundRes.status === 404, 'La incidencia eliminada retorna 404 Not Found');

    console.log('\n========================================================');
    console.log(`🎉 RESUMEN DE PRUEBAS: ${successCount}/${testCount} exitosas.`);
    console.log('========================================================\n');

    if (successCount === testCount) {
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error catastrófico durante la ejecución de pruebas:', error);
    process.exit(1);
  }
}

runTests();
