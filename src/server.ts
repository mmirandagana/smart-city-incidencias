import app from './app';
import dotenv from 'dotenv';
import { Database } from './config/database';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Inicializar la conexión Singleton a la base de datos SQLite al arrancar el servidor
Database.getInstance();

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
