/**
 * Smart City Mobile Application (CityAlert)
 * Controlador central del cliente móvil SPA.
 */

const API_BASE = '/api/v1/incidencias';

// Categorías e imágenes de prueba representativas
const PHOTO_PRESETS = {
  'Bache': 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&q=80',
  'Luminaria': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
  'Semáforo': 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&q=80',
  'Basura/Aseo': 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&q=80'
};

const CATEGORY_ICONS = {
  'Bache': { icon: 'fa-triangle-exclamation', color: '#fb923c' },
  'Luminaria': { icon: 'fa-lightbulb', color: '#facc15' },
  'Semáforo': { icon: 'fa-traffic-light', color: '#f87171' },
  'Basura/Aseo': { icon: 'fa-trash-can', color: '#34d399' }
};

const STATE_COLORS = {
  'Ingresado': 'badge-ingresado',
  'Asignado': 'badge-asignado',
  'En Reparación': 'badge-reparacion',
  'Resuelto': 'badge-resuelto'
};

class MobileApp {
  constructor() {
    this.incidencias = [];
    this.currentIncidencia = null;
    this.selectedCategory = 'Bache';
    this.currentLocation = null;
    this.map = null;
    this.markersLayer = null;
    this.isCuadrillaMode = false;
    this.deferredPrompt = null;
    this.currentPhotoUrl = PHOTO_PRESETS['Bache'];
  }

  async init() {
    console.log('📱 Inicializando Smart City Mobile (CityAlert)...');
    
    // Inicializar Router
    window.mobileRouter.init();
    window.mobileRouter.on('screenChange', (data) => this.handleScreenChange(data));

    // Escuchar evento de pantalla activada para redibujado inmediato del mapa
    window.addEventListener('screen-activated', (e) => {
      const screenId = e.detail?.screenId || e.detail;
      if (screenId === 'screen-map') {
        this.initOrResizeMap();
      }
    });

    // Configurar ResizeObserver para el contenedor del mapa
    this.setupMapResizeObserver();

    // Registrar Service Worker PWA
    this.registerServiceWorker();

    // Escuchar eventos PWA Install Prompt
    this.setupPWAInstall();

    // Configurar escuchas de eventos UI
    this.setupUIEvents();

    // Cargar datos iniciales
    await this.fetchIncidencias();

    // Cargar GPS inicial en segundo plano
    this.refreshGPSLocation();

    // Detectar conectividad de red
    this.setupNetworkStatus();
  }

  // ==========================================
  // PWA & SERVICE WORKER
  // ==========================================
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/mobile/sw.js')
          .then((reg) => console.log('✅ ServiceWorker registrado con alcance:', reg.scope))
          .catch((err) => console.warn('⚠️ Error al registrar ServiceWorker:', err));
      });
    }
  }

  setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBanner = document.getElementById('pwa-install-banner');
      const installBtn = document.getElementById('btn-pwa-install-profile');
      if (installBanner) installBanner.classList.remove('hidden');
      if (installBtn) installBtn.classList.remove('hidden');
    });

    const triggerInstall = async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`PWA Prompt Outcome: ${outcome}`);
        this.deferredPrompt = null;
        const installBanner = document.getElementById('pwa-install-banner');
        if (installBanner) installBanner.classList.add('hidden');
      } else {
        this.showToast('ℹ️ Para instalar: Menú del navegador ➔ "Agregar a pantalla principal"');
      }
    };

    const bannerBtn = document.getElementById('btn-install-banner');
    const profileBtn = document.getElementById('btn-pwa-install-profile');
    if (bannerBtn) bannerBtn.addEventListener('click', triggerInstall);
    if (profileBtn) profileBtn.addEventListener('click', triggerInstall);
  }

  setupNetworkStatus() {
    const statusEl = document.getElementById('network-status-badge');
    const updateStatus = () => {
      if (navigator.onLine) {
        if (statusEl) {
          statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online';
          statusEl.className = 'text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-1.5';
        }
      } else {
        if (statusEl) {
          statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> Offline';
          statusEl.className = 'text-xs px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40 flex items-center gap-1.5';
        }
        this.showToast('📡 Modo sin conexión activado (PWA Cache)');
      }
    };
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }

  // ==========================================
  // CONEXIÓN API REST
  // ==========================================
  async fetchIncidencias() {
    try {
      const response = await fetch(API_BASE);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        this.incidencias = result.data;
        this.renderFeed(this.incidencias);
        this.updateMapMarkers();
        this.updateProfileStats();
      }
    } catch (err) {
      console.warn('⚠️ No se pudieron obtener incidencias de la API, usando caché local:', err);
      this.showToast('Cargando datos locales o de caché...');
    }
  }

  async getIncidenciaById(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch (e) {
      console.error('Error al obtener incidencia por ID:', e);
    }
    return this.incidencias.find((i) => String(i.id) === String(id));
  }

  async submitNewIncidencia(payload) {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        this.showToast('✅ ¡Reporte enviado con éxito!');
        await this.fetchIncidencias();
        window.mobileRouter.navigateTo('screen-home');
        return true;
      } else {
        this.showToast(`❌ Error: ${result.error || 'No se pudo registrar el reporte'}`);
        return false;
      }
    } catch (err) {
      console.error('Error en POST /incidencias:', err);
      this.showToast('❌ Error de conexión al enviar reporte');
      return false;
    }
  }

  async updateIncidenciaStatus(id, newStatus) {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        this.showToast(`🔄 Estado actualizado a "${newStatus}"`);
        await this.fetchIncidencias();
        this.currentIncidencia = result.data;
        this.renderDetailScreen(this.currentIncidencia);
        return true;
      } else {
        this.showToast(`❌ ${result.error || 'Error al actualizar estado'}`);
        return false;
      }
    } catch (err) {
      console.error('Error en PATCH /incidencias/:id:', err);
      this.showToast('❌ Error de conexión al actualizar estado');
      return false;
    }
  }

  // ==========================================
  // EVENTOS Y MANEJO DE VISTAS
  // ==========================================
  setupUIEvents() {
    // 1. Selector de Categoría en Formulario
    document.querySelectorAll('.category-pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-pill-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedCategory = btn.getAttribute('data-category');
        this.currentPhotoUrl = PHOTO_PRESETS[this.selectedCategory] || PHOTO_PRESETS['Bache'];
        const photoPreview = document.getElementById('report-photo-preview');
        if (photoPreview) photoPreview.src = this.currentPhotoUrl;
      });
    });

    // 2. Botón de Actualizar GPS en Formulario
    const refreshGpsBtn = document.getElementById('btn-refresh-gps');
    if (refreshGpsBtn) {
      refreshGpsBtn.addEventListener('click', () => this.refreshGPSLocation(true));
    }

    // 3. Simulación de Cámara / Foto
    const takePhotoBtn = document.getElementById('btn-take-photo');
    if (takePhotoBtn) {
      takePhotoBtn.addEventListener('click', () => {
        this.showToast('📸 Fotografía adjuntada desde la cámara');
        const photoPreview = document.getElementById('report-photo-preview');
        if (photoPreview) {
          photoPreview.classList.add('ring-2', 'ring-cyan-400');
          setTimeout(() => photoPreview.classList.remove('ring-2', 'ring-cyan-400'), 1000);
        }
      });
    }

    // 4. Envío del Formulario de Reporte
    const reportForm = document.getElementById('mobile-report-form');
    if (reportForm) {
      reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-submit-report');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
        }

        const titulo = document.getElementById('report-title').value.trim();
        const descripcion = document.getElementById('report-desc').value.trim();
        const prioridad = document.getElementById('report-priority').value;

        if (!this.currentLocation) {
          await this.refreshGPSLocation(false);
        }

        const payload = {
          titulo,
          categoria: this.selectedCategory,
          descripcion: descripcion || `Reporte ciudadano móvil de ${this.selectedCategory}`,
          latitud: this.currentLocation ? this.currentLocation.latitud : -33.4372,
          longitud: this.currentLocation ? this.currentLocation.longitud : -70.6506,
          prioridad: prioridad || 'Media',
          foto_url: this.currentPhotoUrl
        };

        const ok = await this.submitNewIncidencia(payload);
        if (ok) {
          reportForm.reset();
          this.selectedCategory = 'Bache';
          document.querySelectorAll('.category-pill-btn').forEach((b) => {
            b.classList.toggle('selected', b.getAttribute('data-category') === 'Bache');
          });
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publicar Incidencia';
        }
      });
    }

    // 5. Filtros de Categoría en Feed
    document.querySelectorAll('.feed-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.feed-filter-btn').forEach((b) => {
          b.classList.remove('bg-sky-600', 'text-white');
          b.classList.add('bg-slate-800', 'text-slate-300');
        });
        btn.classList.remove('bg-slate-800', 'text-slate-300');
        btn.classList.add('bg-sky-600', 'text-white');

        const cat = btn.getAttribute('data-filter');
        if (cat === 'all') {
          this.renderFeed(this.incidencias);
        } else {
          const filtered = this.incidencias.filter((i) => i.categoria === cat);
          this.renderFeed(filtered);
        }
      });
    });

    // 6. Pull / Refresh Manual en Feed
    const feedRefreshBtn = document.getElementById('btn-refresh-feed');
    if (feedRefreshBtn) {
      feedRefreshBtn.addEventListener('click', async () => {
        feedRefreshBtn.classList.add('animate-spin');
        await this.fetchIncidencias();
        feedRefreshBtn.classList.remove('animate-spin');
        this.showToast('🔄 Feed actualizado');
      });
    }

    // 7. Toggle Modo Cuadrilla
    const cuadrillaSwitches = document.querySelectorAll('.cuadrilla-mode-switch');
    cuadrillaSwitches.forEach((sw) => {
      sw.addEventListener('change', (e) => {
        this.isCuadrillaMode = e.target.checked;
        cuadrillaSwitches.forEach((other) => (other.checked = this.isCuadrillaMode));
        this.updateCuadrillaModeUI();
        this.showToast(this.isCuadrillaMode ? '🛠️ Modo Cuadrilla ACTIVADO' : '👤 Modo Ciudadano');
      });
    });

    // 8. Botones de Cambio de Estado Cuadrilla en Detalle
    document.querySelectorAll('.btn-change-status').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!this.currentIncidencia) return;
        const newStatus = btn.getAttribute('data-status');
        await this.updateIncidenciaStatus(this.currentIncidencia.id, newStatus);
      });
    });
  }

  async refreshGPSLocation(notify = false) {
    const gpsInfoEl = document.getElementById('gps-status-indicator');
    if (gpsInfoEl) {
      gpsInfoEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-cyan-400"></i> Calibrando sensor GPS...';
    }

    const location = await window.mobileGPS.getCurrentLocation();
    this.currentLocation = location;

    if (gpsInfoEl) {
      const isReal = !location.isFallback;
      gpsInfoEl.innerHTML = `
        <div class="flex items-center justify-between text-xs">
          <span class="flex items-center gap-1.5 text-slate-300">
            <i class="fa-solid fa-location-crosshairs ${isReal ? 'text-cyan-400' : 'text-amber-400'}"></i>
            Lat: ${location.latitud}, Lng: ${location.longitud}
          </span>
          <span class="text-xs text-slate-400">${location.precision}</span>
        </div>
      `;
    }

    if (notify) {
      this.showToast('📍 Coordenadas GPS actualizadas');
    }
  }

  updateCuadrillaModeUI() {
    const cuadrillaPanel = document.getElementById('detail-cuadrilla-panel');
    const cuadrillaBadge = document.getElementById('user-role-badge');

    if (cuadrillaPanel) {
      cuadrillaPanel.classList.toggle('hidden', !this.isCuadrillaMode);
    }
    if (cuadrillaBadge) {
      cuadrillaBadge.textContent = this.isCuadrillaMode ? 'Cuadrilla Operativa #4' : 'Vecino Ciudadano';
      cuadrillaBadge.className = this.isCuadrillaMode
        ? 'text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
        : 'text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium';
    }
  }

  // ==========================================
  // RENDERIZADO DE PANTALLAS
  // ==========================================
  async handleScreenChange({ screenId, params }) {
    if (screenId === 'screen-map') {
      this.initOrResizeMap();
    } else if (screenId === 'screen-detail' && params.id) {
      const item = await this.getIncidenciaById(params.id);
      if (item) {
        this.currentIncidencia = item;
        this.renderDetailScreen(item);
      }
    } else if (screenId === 'screen-home') {
      this.renderFeed(this.incidencias);
    }
  }

  renderFeed(items) {
    const feedContainer = document.getElementById('mobile-feed-container');
    if (!feedContainer) return;

    if (!items || items.length === 0) {
      feedContainer.innerHTML = `
        <div class="text-center py-12 text-slate-400">
          <i class="fa-solid fa-clipboard-check text-4xl mb-3 text-slate-600"></i>
          <p class="font-medium text-slate-300">No hay incidencias en esta categoría</p>
          <p class="text-xs mt-1">Sé el primero en reportar un evento urbano.</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = items
      .map((item) => {
        const catInfo = CATEGORY_ICONS[item.categoria] || { icon: 'fa-circle-exclamation', color: '#38bdf8' };
        const badgeStateClass = STATE_COLORS[item.estado] || 'badge-ingresado';
        const photo = item.foto_url || PHOTO_PRESETS[item.categoria] || PHOTO_PRESETS['Bache'];

        return `
        <div class="incident-card" data-nav="screen-detail" data-id="${item.id}">
          <div class="flex items-center justify-between">
            <span class="badge ${badgeStateClass}">
              <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
              ${item.estado}
            </span>
            <span class="text-xs text-slate-400 flex items-center gap-1">
              <i class="fa-regular fa-clock text-[10px]"></i>
              ${this.formatDate(item.creado_en)}
            </span>
          </div>

          <div class="flex gap-3 items-start">
            <div class="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 relative border border-slate-700">
              <img src="${photo}" alt="${item.categoria}" class="w-full h-full object-cover" loading="lazy">
              <div class="absolute bottom-0 right-0 bg-slate-900/80 p-1 rounded-tl-lg">
                <i class="fa-solid ${catInfo.icon} text-[10px]" style="color: ${catInfo.color}"></i>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-sm text-white truncate">${item.titulo}</h3>
              <p class="text-xs text-slate-400 line-clamp-2 mt-0.5">${item.descripcion}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
                  <i class="fa-solid fa-location-dot text-[10px]"></i>
                  ${item.latitud.toFixed(4)}, ${item.longitud.toFixed(4)}
                </span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  ${item.prioridad}
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  }

  renderDetailScreen(item) {
    const container = document.getElementById('detail-content-area');
    if (!container) return;

    const catInfo = CATEGORY_ICONS[item.categoria] || { icon: 'fa-circle-exclamation', color: '#38bdf8' };
    const badgeStateClass = STATE_COLORS[item.estado] || 'badge-ingresado';
    const photo = item.foto_url || PHOTO_PRESETS[item.categoria] || PHOTO_PRESETS['Bache'];

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Imagen Principal -->
        <div class="relative w-full h-52 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-lg">
          <img src="${photo}" alt="${item.categoria}" class="w-full h-full object-cover">
          <div class="absolute top-3 left-3 flex gap-2">
            <span class="badge ${badgeStateClass} shadow-md backdrop-blur-md">
              <span class="w-2 h-2 rounded-full bg-current"></span>
              ${item.estado}
            </span>
          </div>
          <div class="absolute top-3 right-3 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold text-white border border-slate-700">
            ${item.prioridad}
          </div>
          <div class="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span class="text-xs font-medium text-slate-200 flex items-center gap-2">
              <i class="fa-solid ${catInfo.icon}" style="color: ${catInfo.color}"></i>
              ${item.categoria}
            </span>
            <span class="text-[11px] text-slate-400">ID #${item.id}</span>
          </div>
        </div>

        <!-- Título y Descripción -->
        <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-2">
          <h2 class="text-lg font-bold text-white leading-snug">${item.titulo}</h2>
          <p class="text-sm text-slate-300 leading-relaxed">${item.descripcion}</p>
        </div>

        <!-- Coordenadas y Metadatos -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center gap-2.5">
            <i class="fa-solid fa-location-crosshairs text-cyan-400 text-lg"></i>
            <div class="min-w-0">
              <div class="text-[10px] text-slate-400">Geolocalización</div>
              <div class="text-xs font-medium text-white truncate">${item.latitud.toFixed(4)}, ${item.longitud.toFixed(4)}</div>
            </div>
          </div>
          <div class="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center gap-2.5">
            <i class="fa-regular fa-calendar text-cyan-400 text-lg"></i>
            <div class="min-w-0">
              <div class="text-[10px] text-slate-400">Fecha Ingreso</div>
              <div class="text-xs font-medium text-white truncate">${this.formatDate(item.creado_en)}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.updateCuadrillaModeUI();
  }

  // ==========================================
  // MAPA LEAFLET MÓVIL & RESIZEOBSERVER
  // ==========================================
  setupMapResizeObserver() {
    const mapElement = document.querySelector('#mobile-leaflet-map, #mobile-map');
    if (!mapElement || typeof ResizeObserver === 'undefined') return;

    if (this.mapResizeObserver) {
      this.mapResizeObserver.disconnect();
    }

    this.mapResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          if (this.map) {
            this.map.invalidateSize();
          }
        }
      }
    });

    this.mapResizeObserver.observe(mapElement);
  }

  initOrResizeMap() {
    const mapElement = document.querySelector('#mobile-leaflet-map, #mobile-map');
    if (!mapElement) return;

    if (!this.map) {
      // Coordenadas iniciales (Centro de Santiago de Chile)
      const center = [-33.4372, -70.6506];
      this.map = L.map(mapElement, {
        zoomControl: false,
        attributionControl: false
      }).setView(center, 13);

      // Capa base CartoDB Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(this.map);

      // Capa de marcadores
      this.markersLayer = L.layerGroup().addTo(this.map);

      // Botón "Centrar en mi ubicación"
      const locateBtn = document.getElementById('btn-map-locate-me');
      if (locateBtn) {
        locateBtn.addEventListener('click', async () => {
          await this.refreshGPSLocation();
          if (this.currentLocation && this.map) {
            this.map.flyTo([this.currentLocation.latitud, this.currentLocation.longitud], 15);
            L.circleMarker([this.currentLocation.latitud, this.currentLocation.longitud], {
              radius: 8,
              fillColor: '#38bdf8',
              color: '#ffffff',
              weight: 3,
              opacity: 1,
              fillOpacity: 0.9
            }).addTo(this.map);
            this.showToast('📍 Centrado en tu ubicación');
          }
        });
      }

      // Conectar ResizeObserver al contenedor del mapa
      this.setupMapResizeObserver();
    }

    // Inmediatamente redibujar dimensiones del mapa
    this.map.invalidateSize();
    this.updateMapMarkers();
  }

  updateMapMarkers() {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();

    this.incidencias.forEach((item) => {
      const catInfo = CATEGORY_ICONS[item.categoria] || { icon: 'fa-circle-exclamation', color: '#0284c7' };
      
      const customIcon = L.divIcon({
        className: 'custom-mobile-marker',
        html: `
          <div style="
            background: #0f172a;
            border: 2px solid ${catInfo.color};
            color: ${catInfo.color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            font-size: 13px;
          ">
            <i class="fa-solid ${catInfo.icon}"></i>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([item.latitud, item.longitud], { icon: customIcon });
      marker.on('click', () => this.showMapBottomSheet(item));
      this.markersLayer.addLayer(marker);
    });
  }

  showMapBottomSheet(item) {
    const bottomSheet = document.getElementById('map-bottom-sheet');
    const content = document.getElementById('map-bottom-sheet-content');
    if (!bottomSheet || !content) return;

    const catInfo = CATEGORY_ICONS[item.categoria] || { icon: 'fa-circle-exclamation', color: '#38bdf8' };
    const badgeClass = STATE_COLORS[item.estado] || 'badge-ingresado';

    content.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="badge ${badgeClass} text-[10px] mb-1">${item.estado}</span>
          <h4 class="font-bold text-white text-sm leading-tight">${item.titulo}</h4>
          <p class="text-xs text-slate-400 line-clamp-1 mt-0.5">${item.descripcion}</p>
        </div>
        <button class="btn-touch bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-1.5 rounded-lg flex-shrink-0" data-nav="screen-detail" data-id="${item.id}">
          Ver <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </button>
      </div>
    `;

    bottomSheet.classList.add('visible');

    const closeBtn = document.getElementById('btn-close-bottom-sheet');
    if (closeBtn) {
      closeBtn.onclick = () => bottomSheet.classList.remove('visible');
    }
  }

  updateProfileStats() {
    const totalEl = document.getElementById('profile-stat-total');
    const resolvedEl = document.getElementById('profile-stat-resolved');
    if (totalEl) totalEl.textContent = this.incidencias.length;
    if (resolvedEl) {
      const resolved = this.incidencias.filter((i) => i.estado === 'Resuelto').length;
      resolvedEl.textContent = resolved;
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================
  showToast(message) {
    const toast = document.getElementById('mobile-toast');
    const msgEl = document.getElementById('mobile-toast-msg');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  formatDate(dateStr) {
    if (!dateStr) return 'Reciente';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}

// Arrancar App cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.mobileApp = new MobileApp();
  window.mobileApp.init();
});
