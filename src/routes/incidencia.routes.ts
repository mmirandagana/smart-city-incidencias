import { Router } from 'express';
import { IncidenciaController } from '../controllers/incidencia.controller';

const router = Router();
const controller = new IncidenciaController();

// Rutas Especiales (deben ir antes de /:id para evitar conflicto)
router.get('/stats', controller.getStats);
router.post('/seed', controller.seedDemo);

// RUTAS CRUD PRINCIPALES
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
