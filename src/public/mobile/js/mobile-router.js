/**
 * Smart City Mobile Router (SPA Routing & Screen Manager)
 * Gestiona transiciones de pantalla, historial y sincronización de tabs sin dependencias externas.
 */

class MobileRouter {
  constructor() {
    this.currentScreen = 'screen-home';
    this.historyStack = ['screen-home'];
    this.listeners = new Map();
    this.screenTitles = {
      'screen-home': 'Feed Ciudadano',
      'screen-report': 'Nuevo Reporte',
      'screen-map': 'Mapa de Incidencias',
      'screen-detail': 'Detalle de Incidencia',
      'screen-profile': 'Perfil & Configuración'
    };
  }

  init() {
    // Escuchar botones de navegación con atributo data-nav
    document.addEventListener('click', (e) => {
      const navTarget = e.target.closest('[data-nav]');
      if (navTarget) {
        e.preventDefault();
        const screenId = navTarget.getAttribute('data-nav');
        const paramId = navTarget.getAttribute('data-id');
        this.navigateTo(screenId, paramId ? { id: paramId } : {});
      }

      const backTarget = e.target.closest('[data-action="back"]');
      if (backTarget) {
        e.preventDefault();
        this.goBack();
      }
    });

    // Escuchar botón físico / navegador back
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.screen) {
        this.renderScreen(event.state.screen, event.state.params || {}, false);
      }
    });

    // Registrar estado inicial en history
    window.history.replaceState({ screen: this.currentScreen, params: {} }, '', '#home');
    this.renderScreen(this.currentScreen, {}, false);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  trigger(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => cb(data));
    }
  }

  navigateTo(screenId, params = {}) {
    if (!document.getElementById(screenId)) {
      console.warn(`[Router] Pantalla ${screenId} no existe`);
      return;
    }

    if (this.currentScreen !== screenId || Object.keys(params).length > 0) {
      this.historyStack.push(screenId);
      window.history.pushState({ screen: screenId, params }, '', `#${screenId.replace('screen-', '')}`);
      this.renderScreen(screenId, params, true);
    }
  }

  goBack() {
    if (this.historyStack.length > 1) {
      this.historyStack.pop();
      const previousScreen = this.historyStack[this.historyStack.length - 1];
      window.history.back();
      this.renderScreen(previousScreen, {}, false);
    } else {
      this.navigateTo('screen-home');
    }
  }

  renderScreen(screenId, params = {}, notify = true) {
    this.currentScreen = screenId;

    // Ocultar todas las pantallas
    document.querySelectorAll('.mobile-screen').forEach((screen) => {
      screen.classList.remove('active');
    });

    // Mostrar pantalla objetivo
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
      targetScreen.scrollTop = 0;
    }

    // Actualizar estado activo en Bottom Tabs
    document.querySelectorAll('.tab-button').forEach((btn) => {
      const tabTarget = btn.getAttribute('data-nav');
      if (tabTarget === screenId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Actualizar Header (Título y Botón Volver)
    const headerTitle = document.getElementById('mobile-header-title');
    if (headerTitle) {
      headerTitle.textContent = this.screenTitles[screenId] || 'CityAlert';
    }

    const backBtn = document.getElementById('mobile-back-btn');
    if (backBtn) {
      if (screenId === 'screen-home') {
        backBtn.classList.add('hidden');
      } else {
        backBtn.classList.remove('hidden');
      }
    }

    // Controlar visibilidad del botón flotante FAB (+)
    const globalFab = document.getElementById('mobile-global-fab');
    if (globalFab) {
      if (screenId === 'screen-report') {
        globalFab.style.display = 'none';
      } else {
        globalFab.style.display = 'flex';
      }
    }

    if (notify) {
      this.trigger('screenChange', { screenId, params });
    }
  }

  getCurrentScreen() {
    return this.currentScreen;
  }
}

window.mobileRouter = new MobileRouter();
