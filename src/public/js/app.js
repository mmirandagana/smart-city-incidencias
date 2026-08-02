import * as API from './api.js';
import * as MapModule from './map.js';
import * as UI from './ui.js';

let currentIncidencias = [];

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inicializando Dashboard Smart City Municipal...');

  // 1. Inicializar Mapa Leaflet
  MapModule.initMap('map', (lat, lng) => {
    UI.fillCoordinatesForm(lat, lng);
    UI.showModal();
    UI.showToast(`Coordenadas seleccionadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'info');
  });

  // 2. Cargar datos iniciales
  await loadData();

  // 3. Setup de Event Listeners
  setupEventListeners();
});

async function loadData() {
  try {
    const filters = getActiveFilters();
    currentIncidencias = await API.fetchIncidencias(filters);
    const stats = await API.fetchStats();

    // Actualizar UI en vivo sin recargar la página
    UI.renderStats(stats);
    UI.renderIncidenciasList(currentIncidencias, {
      onCenterMap: (lat, lng) => {
        MapModule.centerMapOn(lat, lng);
        UI.showToast('Centrando mapa en incidencia', 'info');
      },
      onAdvanceState: handleAdvanceState,
      onDelete: handleDeleteIncidencia
    });

    MapModule.updateMapMarkers(
      currentIncidencias,
      (inc) => handleAdvanceState(inc.id, getNextState(inc.estado)),
      (id) => handleDeleteIncidencia(id)
    );
  } catch (error) {
    console.error('Error al cargar datos:', error);
    UI.showToast(error.message || 'Error al cargar incidencias', 'error');
  }
}

function getActiveFilters() {
  const estado = document.getElementById('filter-estado').value;
  const categoria = document.getElementById('filter-categoria').value;
  const search = document.getElementById('filter-search').value.trim();

  return {
    estado: estado || undefined,
    categoria: categoria || undefined,
    search: search || undefined
  };
}

function setupEventListeners() {
  // Modal Buttons
  document.getElementById('btn-open-modal').addEventListener('click', () => {
    UI.showModal();
  });

  document.getElementById('btn-close-modal').addEventListener('click', () => {
    UI.hideModal();
  });

  document.getElementById('btn-cancel-modal').addEventListener('click', () => {
    UI.hideModal();
  });

  // Form Submit (Crear Incidencia)
  document.getElementById('form-incidencia').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleCreateIncidencia();
  });

  // Reset Demo Button (Restablecer siembra de prueba)
  const btnSeed = document.getElementById('btn-seed-data');
  if (btnSeed) {
    btnSeed.classList.remove('hidden');
    btnSeed.addEventListener('click', async () => {
      if (confirm('¿Desea restablecer la base de datos con las incidencias de prueba iniciales?')) {
        try {
          await API.seedDemo();
          UI.showToast('Base de datos restablecida con éxito', 'success');
          await loadData(); // Refresco reactivo sin location.reload()
        } catch (error) {
          UI.showToast(error.message || 'Error al restablecer demo', 'error');
        }
      }
    });
  }

  // GPS Current Location Button
  document.getElementById('btn-detect-gps').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          UI.fillCoordinatesForm(pos.coords.latitude, pos.coords.longitude);
          UI.showToast('Ubicación GPS obtenida con éxito', 'success');
        },
        (err) => {
          console.warn('Geolocation denied/failed, usando fallback:', err);
          // Fallback a centro de Santiago con leve variación aleatoria
          const lat = -33.4489 + (Math.random() - 0.5) * 0.02;
          const lng = -70.6693 + (Math.random() - 0.5) * 0.02;
          UI.fillCoordinatesForm(lat, lng);
          UI.showToast('Coordenadas simuladas generadas en zona céntrica', 'info');
        }
      );
    } else {
      UI.showToast('Geolocalización no soportada por el navegador', 'error');
    }
  });

  // Filter Listeners
  document.getElementById('filter-estado').addEventListener('change', loadData);
  document.getElementById('filter-categoria').addEventListener('change', loadData);
  
  // Search input con Debounce
  let debounceTimeout;
  document.getElementById('filter-search').addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(loadData, 300);
  });

  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    document.getElementById('filter-estado').value = '';
    document.getElementById('filter-categoria').value = '';
    document.getElementById('filter-search').value = '';
    loadData();
  });

  // View Mode Selectors
  const mapPanel = document.getElementById('map-panel');
  const listPanel = document.getElementById('list-panel');

  document.getElementById('view-split').addEventListener('click', () => {
    mapPanel.classList.remove('hidden', 'lg:col-span-12');
    listPanel.classList.remove('hidden', 'lg:col-span-12');
    mapPanel.classList.add('lg:col-span-7');
    listPanel.classList.add('lg:col-span-5');
    updateViewButtons('view-split');
  });

  document.getElementById('view-map').addEventListener('click', () => {
    listPanel.classList.add('hidden');
    mapPanel.classList.remove('hidden', 'lg:col-span-7');
    mapPanel.classList.add('lg:col-span-12');
    updateViewButtons('view-map');
  });

  document.getElementById('view-list').addEventListener('click', () => {
    mapPanel.classList.add('hidden');
    listPanel.classList.remove('hidden', 'lg:col-span-5');
    listPanel.classList.add('lg:col-span-12');
    updateViewButtons('view-list');
  });
}

function updateViewButtons(activeId) {
  ['view-split', 'view-map', 'view-list'].forEach(id => {
    const btn = document.getElementById(id);
    if (id === activeId) {
      btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
    } else {
      btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition text-slate-400 hover:text-white';
    }
  });
}

async function handleCreateIncidencia() {
  try {
    const dto = {
      titulo: document.getElementById('form-titulo').value.trim(),
      categoria: document.getElementById('form-categoria').value,
      descripcion: document.getElementById('form-descripcion').value.trim(),
      prioridad: document.getElementById('form-prioridad').value,
      latitud: parseFloat(document.getElementById('form-latitud').value),
      longitud: parseFloat(document.getElementById('form-longitud').value),
      foto_url: document.getElementById('form-foto-url').value.trim() || undefined
    };

    const nueva = await API.createIncidencia(dto);
    UI.hideModal();
    UI.showToast(`Incidencia "#${nueva.id} - ${nueva.titulo}" registrada exitosamente!`, 'success');
    await loadData(); // Actualización reactiva sin recargar página
    MapModule.centerMapOn(nueva.latitud, nueva.longitud);
  } catch (error) {
    console.error('Error al ingresar incidencia:', error);
    UI.showToast(error.message || 'Error al guardar la incidencia', 'error');
  }
}

async function handleAdvanceState(id, nextState) {
  if (!nextState) return;

  try {
    await API.updateIncidencia(id, { estado: nextState });
    UI.showToast(`Incidencia #${id} actualizada a: ${nextState}`, 'success');
    await loadData(); // Actualización reactiva sin recargar página
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    UI.showToast(error.message || 'Error al actualizar el estado', 'error');
  }
}

async function handleDeleteIncidencia(id) {
  if (!confirm(`¿Está seguro de eliminar la incidencia #${id}? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    await API.deleteIncidencia(id);
    UI.showToast(`Incidencia #${id} eliminada del sistema.`, 'success');
    await loadData(); // Actualización reactiva sin recargar página
  } catch (error) {
    console.error('Error al eliminar incidencia:', error);
    UI.showToast(error.message || 'Error al eliminar', 'error');
  }
}

function getNextState(currentState) {
  switch (currentState) {
    case 'Ingresado': return 'Asignado';
    case 'Asignado': return 'En Reparación';
    case 'En Reparación': return 'Resuelto';
    default: return null;
  }
}
