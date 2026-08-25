/**
 * Service Worker para Smart City Mobile (CityAlert)
 * Estrategia de Caché:
 * - Cache First / Stale-While-Revalidate para App Shell (HTML, CSS, JS, Iconos).
 * - Network First con Fallback para peticiones API.
 */

const CACHE_NAME = 'cityalert-shell-v1';
const APP_SHELL_ASSETS = [
  '/mobile/',
  '/mobile/index.html',
  '/mobile/manifest.json',
  '/mobile/css/mobile.css',
  '/mobile/js/mobile-router.js',
  '/mobile/js/mobile-gps.js',
  '/mobile/js/mobile-app.js',
  '/mobile/icons/icon.svg',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// 1. Instalación del Service Worker: precache del shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching App Shell');
      return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Precache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activación: limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removiendo caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Estrategia de Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Peticiones a la API REST: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(async () => {
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: 'Sin conexión a internet. La acción se sincronizará cuando recuperes conectividad.'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // App Shell y Estáticos: Stale-While-Revalidate / Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si falla la red y no está en caché, intentar entregar el index móvil
          if (request.mode === 'navigate') {
            return caches.match('/mobile/index.html');
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});
