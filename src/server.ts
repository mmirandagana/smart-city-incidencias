import app from './app';
import dotenv from 'dotenv';
import { Database } from './config/database';
import { seedDatabase } from './config/seed';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Inicializar la conexión Singleton a SQLite y ejecutar siembra automática si está vacía
async function startServer() {
  const db = Database.getInstance();
  await db.ready();
  await seedDatabase(false); // Auto-seeding si la tabla está vacía

  const server = app.listen(PORT, () => {
    console.log(`
  ================================================================
  🏙️   SMART CITY - PLATAFORMA DE GESTIÓN DE INCIDENCIAS URBANAS
  ================================================================
  🌐 Servidor ejecutándose en: http://localhost:${PORT}
  📡 API REST:                 http://localhost:${PORT}/api/v1/incidencias
  ❤️ Health Check:             http://localhost:${PORT}/api/v1/health
  ================================================================
    `);
  });

  // Manejo elegante de apagado
  process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor y conexión a base de datos...');
    try {
      await Database.getInstance().close();
      console.log('✅ Conexión SQLite cerrada.');
      server.close(() => {
        console.log('👋 Servidor finalizado con éxito.');
        process.exit(0);
      });
    } catch (err) {
      console.error('Error al cerrar la base de datos:', err);
      process.exit(1);
    }
  });
}

startServer();
