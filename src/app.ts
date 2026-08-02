import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import incidenciaRoutes from './routes/incidencia.routes';

const app: Application = express();

// Middlewares Globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Resolver la ruta estática para el Frontend Web Municipal (soporta tsx y dist)
const primaryPublicPath = path.join(__dirname, 'public');
const fallbackPublicPath = path.join(__dirname, '../src/public');
const publicPath = fs.existsSync(primaryPublicPath) ? primaryPublicPath : fallbackPublicPath;

app.use(express.static(publicPath));

// Rutas de API RESTful
app.use('/api/v1/incidencias', incidenciaRoutes);

// Endpoint de Estado del Sistema / Health Check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    system: 'Smart City - Ecosistema Municipal de Incidencias Urbanas',
    timestamp: new Date().toISOString()
  });
});

// Ruta Fallback para SPA / Frontend Web
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ success: false, error: 'Endpoint API no encontrado' });
    return;
  }
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      next(err);
    }
  });
});

// Middleware Global de Manejo de Errores
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Error no controlado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message || 'Ocurrió un error inesperado'
  });
});

export default app;
