/**
 * Módulo de Gestión de Mapa Interactivo con Leaflet.js
 */
let map = null;
let markersLayer = null;
let onMapClickCallback = null;

const CATEGORIA_ICONS = {
  'Bache': 'fa-road-barrier',
  'Luminaria': 'fa-lightbulb',
  'Semáforo': 'fa-traffic-light',
  'Basura/Aseo': 'fa-trash-can'
};

const CATEGORIA_CLASSES = {
  'Bache': 'custom-marker-bache',
  'Luminaria': 'custom-marker-luminaria',
  'Semáforo': 'custom-marker-semaforo',
  'Basura/Aseo': 'custom-marker-aseo'
};

const ESTADO_BADGES = {
  'Ingresado': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'Asignado': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'En Reparación': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Resuelto': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
};

export function initMap(containerId = 'map', onMapClick = null) {
  if (map) return map;

  onMapClickCallback = onMapClick;

  // Centro por defecto: Santiago de Chile (-33.4489, -70.6693)
  map = L.map(containerId, {
    zoomControl: false
  }).setView([-33.4489, -70.6693], 13);

  // Agregar Control de Zoom arriba a la derecha dentro del mapa visible
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Capa de Mapa Oscuro (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Grupo de marcadores
  markersLayer = L.layerGroup().addTo(map);

  // Evento de clic en el mapa para capturar coordenadas
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    if (onMapClickCallback) {
      onMapClickCallback(lat, lng);
    }
  });

  return map;
}

export function updateMapMarkers(incidencias, onStatusChange = null, onDelete = null) {
  if (!map || !markersLayer) return;

  markersLayer.clearLayers();

  if (!incidencias || incidencias.length === 0) return;

  const bounds = L.latLngBounds();

  incidencias.forEach(inc => {
    const iconClass = CATEGORIA_ICONS[inc.categoria] || 'fa-location-dot';
    const markerClass = CATEGORIA_CLASSES[inc.categoria] || 'custom-marker-bache';

    const customIcon = L.divIcon({
      className: '',
      html: `
        <div class="custom-leaflet-marker ${markerClass}" title="${inc.titulo}">
          <i class="fa-solid ${iconClass}"></i>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([inc.latitud, inc.longitud], { icon: customIcon });

    const badgeStyle = ESTADO_BADGES[inc.estado] || 'bg-slate-700 text-slate-300';
    const fotoHtml = inc.foto_url 
      ? `<img src="${inc.foto_url}" alt="Evidencia" class="w-full h-24 object-cover rounded-lg mb-2 border border-slate-700">`
      : '';

    const popupHtml = `
      <div class="space-y-2 min-w-[220px]">
        <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}">
            ${inc.estado}
          </span>
          <span class="text-[10px] text-slate-400 font-medium">Prioridad: ${inc.prioridad}</span>
        </div>
        
        <h4 class="text-xs font-bold text-white line-clamp-1">${inc.titulo}</h4>
        ${fotoHtml}
        <p class="text-[11px] text-slate-300 line-clamp-2">${inc.descripcion}</p>
        
        <div class="text-[10px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-800">
          <i class="fa-solid fa-location-dot text-cyan-400"></i> ${inc.latitud.toFixed(4)}, ${inc.longitud.toFixed(4)}
        </div>
        
        <div class="flex items-center gap-1 pt-1">
          ${inc.estado !== 'Resuelto' ? `
            <button data-action="advance" data-id="${inc.id}" class="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-[10px] py-1 rounded border border-cyan-500/30 font-semibold transition">
              Avanzar Estado
            </button>
          ` : ''}
          <button data-action="delete" data-id="${inc.id}" class="px-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] py-1 rounded border border-red-500/30 transition" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);

    // Eventos dentro del popup
    marker.on('popupopen', () => {
      const popupNode = marker.getPopup().getElement();
      if (!popupNode) return;

      const advanceBtn = popupNode.querySelector('[data-action="advance"]');
      const deleteBtn = popupNode.querySelector('[data-action="delete"]');

      if (advanceBtn && onStatusChange) {
        advanceBtn.addEventListener('click', () => {
          onStatusChange(inc);
        });
      }

      if (deleteBtn && onDelete) {
        deleteBtn.addEventListener('click', () => {
          onDelete(inc.id);
        });
      }
    });

    markersLayer.addLayer(marker);
    bounds.extend([inc.latitud, inc.longitud]);
  });

  if (incidencias.length > 0) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }
}

export function centerMapOn(lat, lng, zoom = 16) {
  if (!map) return;
  map.flyTo([lat, lng], zoom, {
    animate: true,
    duration: 1.2
  });
}

export function invalidateMapSize() {
  if (map) {
    setTimeout(() => map.invalidateSize(), 50);
  }
}
