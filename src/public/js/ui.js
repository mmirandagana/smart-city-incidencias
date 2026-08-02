/**
 * Módulo de Interfaz de Usuario y Renderizado DOM
 */

const ESTADO_BADGES = {
  'Ingresado': {
    class: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    icon: 'fa-inbox',
    next: 'Asignado'
  },
  'Asignado': {
    class: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: 'fa-user-gear',
    next: 'En Reparación'
  },
  'En Reparación': {
    class: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    icon: 'fa-wrench',
    next: 'Resuelto'
  },
  'Resuelto': {
    class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: 'fa-circle-check',
    next: null
  }
};

const PRIORIDAD_BADGES = {
  'Baja': 'bg-slate-800 text-slate-300 border-slate-700',
  'Media': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Alta': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Crítica': 'bg-red-500/10 text-red-400 border-red-500/30 font-bold'
};

const CATEGORIA_ICONS = {
  'Bache': 'fa-road-barrier text-orange-400',
  'Luminaria': 'fa-lightbulb text-yellow-400',
  'Semáforo': 'fa-traffic-light text-red-400',
  'Basura/Aseo': 'fa-trash-can text-emerald-400'
};

export function renderStats(stats) {
  document.getElementById('stat-total').textContent = stats.Total || 0;
  document.getElementById('stat-ingresado').textContent = stats.Ingresado || 0;
  document.getElementById('stat-asignado').textContent = stats.Asignado || 0;
  document.getElementById('stat-reparacion').textContent = stats['En Reparación'] || 0;
  document.getElementById('stat-resuelto').textContent = stats.Resuelto || 0;
}

export function renderIncidenciasList(incidencias, { onCenterMap, onAdvanceState, onDelete }) {
  const container = document.getElementById('incidencias-container');
  const countBadge = document.getElementById('incidencias-count-badge');

  countBadge.textContent = `${incidencias.length} ${incidencias.length === 1 ? 'ítem' : 'ítems'}`;

  if (!incidencias || incidencias.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
        <i class="fa-solid fa-folder-open text-4xl text-slate-600"></i>
        <p class="text-xs font-medium">No se encontraron incidencias registradas</p>
      </div>
    `;
    return;
  }

  container.innerHTML = incidencias.map(inc => {
    const estadoMeta = ESTADO_BADGES[inc.estado] || { class: 'bg-slate-800 text-slate-300', icon: 'fa-question', next: null };
    const prioridadMeta = PRIORIDAD_BADGES[inc.prioridad] || 'bg-slate-800 text-slate-300';
    const catIcon = CATEGORIA_ICONS[inc.categoria] || 'fa-location-dot text-slate-400';
    const fecha = new Date(inc.creado_en).toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    return `
      <div class="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3.5 transition shadow-sm hover:shadow-md flex flex-col gap-2.5 group">
        
        <!-- Row 1: Badges + ID -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${estadoMeta.class}">
              <i class="fa-solid ${estadoMeta.icon}"></i> ${inc.estado}
            </span>
            <span class="text-[10px] font-medium px-2 py-0.5 rounded-full border ${prioridadMeta}">
              Prioridad ${inc.prioridad}
            </span>
          </div>
          <span class="text-[10px] font-mono text-slate-400">#${inc.id}</span>
        </div>

        <!-- Row 2: Title & Category -->
        <div>
          <h3 class="text-xs font-bold text-white group-hover:text-cyan-400 transition flex items-center gap-1.5">
            <i class="fa-solid ${catIcon} text-xs"></i>
            <span>${inc.titulo}</span>
          </h3>
          <p class="text-[11px] text-slate-400 line-clamp-2 mt-1">${inc.descripcion}</p>
        </div>

        <!-- Row 3: Meta Date & GPS -->
        <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
          <span class="flex items-center gap-1">
            <i class="fa-regular fa-clock text-slate-400"></i> ${fecha}
          </span>
          <button data-action="center-map" data-id="${inc.id}" data-lat="${inc.latitud}" data-lng="${inc.longitud}" 
                  class="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition">
            <i class="fa-solid fa-location-crosshairs"></i> Ver en Mapa
          </button>
        </div>

        <!-- Row 4: Actions -->
        <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
          <!-- Advance Status Button -->
          ${estadoMeta.next ? `
            <button data-action="advance-state" data-id="${inc.id}" data-next="${estadoMeta.next}"
                    class="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg px-2.5 py-1 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition">
              <span>Pasar a: ${estadoMeta.next}</span>
              <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </button>
          ` : `
            <span class="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <i class="fa-solid fa-check-double"></i> Incidencia Finalizada
            </span>
          `}

          <!-- Delete Button -->
          <button data-action="delete" data-id="${inc.id}" 
                  class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-[11px] font-medium transition" title="Eliminar Incidencia">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>

      </div>
    `;
  }).join('');

  // Event Delegates
  container.querySelectorAll('[data-action="center-map"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lat = parseFloat(btn.getAttribute('data-lat'));
      const lng = parseFloat(btn.getAttribute('data-lng'));
      onCenterMap(lat, lng);
    });
  });

  container.querySelectorAll('[data-action="advance-state"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'), 10);
      const nextState = btn.getAttribute('data-next');
      onAdvanceState(id, nextState);
    });
  });

  container.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'), 10);
      onDelete(id);
    });
  });
}

export function showModal() {
  const modal = document.getElementById('modal-crear');
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.firstElementChild.classList.remove('scale-95');
    modal.firstElementChild.classList.add('scale-100');
  }, 10);
}

export function hideModal() {
  const modal = document.getElementById('modal-crear');
  modal.firstElementChild.classList.remove('scale-100');
  modal.firstElementChild.classList.add('scale-95');
  modal.classList.add('opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
    document.getElementById('form-incidencia').reset();
  }, 300);
}

export function fillCoordinatesForm(lat, lng) {
  document.getElementById('form-latitud').value = lat.toFixed(6);
  document.getElementById('form-longitud').value = lng.toFixed(6);
}

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  
  const icon = type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-triangle-exclamation text-amber-400';
  const border = type === 'success' ? 'border-emerald-500/30' : 'border-amber-500/30';

  toast.className = `toast-animate bg-slate-900 border ${border} text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs pointer-events-auto min-w-[260px]`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-base"></i>
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
