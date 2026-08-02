/**
 * Módulo Cliente API REST para comunicarse con el servidor Express backend.
 */
const BASE_URL = '/api/v1/incidencias';

export async function fetchIncidencias(filters = {}) {
  const queryParams = new URLSearchParams();

  if (filters.estado) queryParams.append('estado', filters.estado);
  if (filters.categoria) queryParams.append('categoria', filters.categoria);
  if (filters.prioridad) queryParams.append('prioridad', filters.prioridad);
  if (filters.search) queryParams.append('search', filters.search);

  const url = `${BASE_URL}?${queryParams.toString()}`;
  const response = await fetch(url);
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Error al recuperar incidencias');
  }

  return json.data;
}

export async function fetchStats() {
  const response = await fetch(`${BASE_URL}/stats`);
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Error al recuperar estadísticas');
  }

  return json.data;
}

export async function fetchIncidenciaById(id) {
  const response = await fetch(`${BASE_URL}/${id}`);
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || `Error al obtener incidencia ID ${id}`);
  }

  return json.data;
}

export async function createIncidencia(data) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Error al crear la incidencia');
  }

  return json.data;
}

export async function updateIncidencia(id, data) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || `Error al actualizar incidencia ID ${id}`);
  }

  return json.data;
}

export async function deleteIncidencia(id) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE'
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || `Error al eliminar incidencia ID ${id}`);
  }

  return true;
}
