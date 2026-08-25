/**
 * Smart City Mobile GPS Module
 * Captura coordenadas del sensor GPS del dispositivo móvil con tolerancia a fallos y fallback urbano.
 */

const DEFAULT_COORDS = {
  latitud: -33.4372,
  longitud: -70.6506,
  precision: 'Modo Simulado / Fallback'
};

const MobileGPS = {
  /**
   * Obtiene la posición actual del usuario o recurre al fallback de prueba.
   * @returns {Promise<{latitud: number, longitud: number, precision: string, isFallback: boolean}>}
   */
  async getCurrentLocation() {
    if (!('geolocation' in navigator)) {
      console.warn('[GPS] Geolocalización no soportada por el navegador. Usando fallback.');
      return { ...DEFAULT_COORDS, isFallback: true };
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn('[GPS] Timeout al obtener señal GPS. Usando fallback urbano.');
        resolve({
          latitud: DEFAULT_COORDS.latitud + (Math.random() - 0.5) * 0.01,
          longitud: DEFAULT_COORDS.longitud + (Math.random() - 0.5) * 0.01,
          precision: 'Fallback por Timeout',
          isFallback: true
        });
      }, 7000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          const accuracy = Math.round(position.coords.accuracy || 15);
          
          resolve({
            latitud: lat,
            longitud: lng,
            precision: `±${accuracy}m (GPS Real)`,
            isFallback: false
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn('[GPS] Error al obtener coordenadas:', error.message);
          // Fallback con leve variación aleatoria realista para pruebas
          const randomOffsetLat = (Math.random() - 0.5) * 0.008;
          const randomOffsetLng = (Math.random() - 0.5) * 0.008;
          
          resolve({
            latitud: parseFloat((DEFAULT_COORDS.latitud + randomOffsetLat).toFixed(6)),
            longitud: parseFloat((DEFAULT_COORDS.longitud + randomOffsetLng).toFixed(6)),
            precision: 'Coordenadas de Referencia',
            isFallback: true
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 10000
        }
      );
    });
  }
};

window.mobileGPS = MobileGPS;
