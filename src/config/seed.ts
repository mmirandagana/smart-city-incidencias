import { Database } from './database';

const initialIncidencias = [
  {
    titulo: 'Bache profundo en Av. España con Alameda',
    categoria: 'Bache',
    descripcion: 'Peligroso evento en calzada derecha sentido sur. Mide aprox. 1.5 metros de diámetro y causa frenazos bruscos de vehículos.',
    latitud: -33.4512,
    longitud: -70.6695,
    estado: 'Ingresado',
    prioridad: 'Alta',
    foto_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&q=80'
  },
  {
    titulo: 'Luminaria apagada en sector Parque O\'Higgins',
    categoria: 'Luminaria',
    descripcion: 'Foco LED del poste #402 fuera de servicio. Sector oscuro durante la noche cerca del acceso por Tupper.',
    latitud: -33.4650,
    longitud: -70.6601,
    estado: 'Asignado',
    prioridad: 'Media',
    foto_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&q=80'
  },
  {
    titulo: 'Semáforo fuera de servicio en Av. Providencia',
    categoria: 'Semáforo',
    descripcion: 'Cruce con Pedro de Valdivia tiene luces apagadas por aparente fallo eléctrico. Se requiere presencia de Carabineros y cuadrilla.',
    latitud: -33.4285,
    longitud: -70.6184,
    estado: 'En Reparación',
    prioridad: 'Crítica',
    foto_url: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&q=80'
  },
  {
    titulo: 'Acumulación de escombros y voluminosos en San Diego',
    categoria: 'Basura/Aseo',
    descripcion: 'Restos de poda y muebles abandonados bloqueando paso peatonal y rampa de accesibilidad universal.',
    latitud: -33.4568,
    longitud: -70.6512,
    estado: 'Resuelto',
    prioridad: 'Baja',
    foto_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80'
  },
  {
    titulo: 'Tapa de alcantarilla desprendida en Av. Matta',
    categoria: 'Bache',
    descripcion: 'Riesgo alto de caída para ciclistas y peatones. Tapa desplazada parcialmente hacia la acera.',
    latitud: -33.4602,
    longitud: -70.6430,
    estado: 'Asignado',
    prioridad: 'Crítica',
    foto_url: 'https://images.unsplash.com/photo-1617886322168-72b886573c35?w=600&q=80'
  },
  {
    titulo: 'Farola intermitente en Barrio Italia',
    categoria: 'Luminaria',
    descripcion: 'Luminaria pública parpadea continuamente causando molestias a residentes de Calle Italia.',
    latitud: -33.4440,
    longitud: -70.6265,
    estado: 'Ingresado',
    prioridad: 'Media',
    foto_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&q=80'
  }
];

export async function seedDatabase() {
  console.log('🌱 Iniciando siembra (seeding) de la base de datos de Smart City...');
  const db = Database.getInstance();
  await db.ready();

  try {
    // Limpiar tabla existente para asegurar estado limpio
    await db.run('DELETE FROM incidencias;');
    
    // Resetear secuencia de autoincremento en sqlite
    try {
      await db.run('DELETE FROM sqlite_sequence WHERE name="incidencias";');
    } catch (_e) {
      // Ignorar si sqlite_sequence no existe aún
    }

    const insertSql = `
      INSERT INTO incidencias (titulo, categoria, descripcion, latitud, longitud, estado, prioridad, foto_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const inc of initialIncidencias) {
      await db.run(insertSql, [
        inc.titulo,
        inc.categoria,
        inc.descripcion,
        inc.latitud,
        inc.longitud,
        inc.estado,
        inc.prioridad,
        inc.foto_url
      ]);
    }

    console.log(`✅ ¡Base de datos poblada exitosamente con ${initialIncidencias.length} incidencias georreferenciadas!`);
  } catch (error) {
    console.error('❌ Error durante la siembra de la base de datos:', error);
  }
}

// Permitir ejecución directa del script via cli: npx tsx src/config/seed.ts
if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  });
}
