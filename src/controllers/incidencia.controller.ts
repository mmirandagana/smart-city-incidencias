import { Request, Response } from 'express';
import { IncidenciaService } from '../services/incidencia.service';
import { CategoriaIncidencia, EstadoIncidencia, PrioridadIncidencia } from '../models/incidencia.model';

/**
 * Controladora REST HTTP para el recurso Incidencias.
 */
export class IncidenciaController {
  private service: IncidenciaService;

  constructor() {
    this.service = new IncidenciaService();
  }

  /**
   * GET /api/v1/incidencias
   */
  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { estado, categoria, prioridad, search } = req.query;

      const filters = {
        estado: estado ? (estado as EstadoIncidencia) : undefined,
        categoria: categoria ? (categoria as CategoriaIncidencia) : undefined,
        prioridad: prioridad ? (prioridad as PrioridadIncidencia) : undefined,
        search: search ? String(search) : undefined
      };

      const incidencias = await this.service.getAllIncidencias(filters);
      res.status(200).json({
        success: true,
        count: incidencias.length,
        data: incidencias
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al recuperar incidencias',
        details: error.message
      });
    }
  };

  /**
   * GET /api/v1/incidencias/stats
   */
  public getStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener métricas estadísticas',
        details: error.message
      });
    }
  };

  /**
   * POST /api/v1/incidencias/seed
   */
  public seedDemo = async (_req: Request, res: Response): Promise<void> => {
    try {
      await this.service.resetSeed();
      res.status(200).json({
        success: true,
        message: 'Base de datos restablecida exitosamente con datos de prueba'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Error al restablecer datos de prueba',
        details: error.message
      });
    }
  };

  /**
   * GET /api/v1/incidencias/:id
   */
  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const incidencia = await this.service.getIncidenciaById(id);
      res.status(200).json({
        success: true,
        data: incidencia
      });
    } catch (error: any) {
      const statusCode = error.message.includes('no existe') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * POST /api/v1/incidencias
   */
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const nuevaIncidencia = await this.service.createIncidencia(req.body);
      res.status(201).json({
        success: true,
        message: 'Incidencia registrada exitosamente',
        data: nuevaIncidencia
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * PUT/PATCH /api/v1/incidencias/:id
   */
  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const incidenciaActualizada = await this.service.updateIncidencia(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Incidencia actualizada exitosamente',
        data: incidenciaActualizada
      });
    } catch (error: any) {
      const statusCode = error.message.includes('no fue encontrada') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * DELETE /api/v1/incidencias/:id
   */
  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      await this.service.deleteIncidencia(id);
      res.status(200).json({
        success: true,
        message: `Incidencia ID ${id} eliminada correctamente`
      });
    } catch (error: any) {
      const statusCode = error.message.includes('no existe') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  };
}
