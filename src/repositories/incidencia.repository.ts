import { Database } from '../config/database';
import { Incidencia, CreateIncidenciaDTO, UpdateIncidenciaDTO, IncidenciaFilter } from '../models/incidencia.model';

/**
 * Capa Repository / Data Access Object (DAO) para la entidad Incidencia.
 */
export class IncidenciaRepository {
  private db: Database;

  constructor() {
    // Utiliza el Singleton de conexión a base de datos
    this.db = Database.getInstance();
  }

  /**
   * Obtiene todas las incidencias aplicando filtros opcionales de estado, categoría, prioridad y búsqueda.
   */
  public async findAll(filters: IncidenciaFilter = {}): Promise<Incidencia[]> {
    let sql = 'SELECT * FROM incidencias WHERE 1=1';
    const params: any[] = [];

    if (filters.estado) {
      sql += ' AND estado = ?';
      params.push(filters.estado);
    }

    if (filters.categoria) {
      sql += ' AND categoria = ?';
      params.push(filters.categoria);
    }

    if (filters.prioridad) {
      sql += ' AND prioridad = ?';
      params.push(filters.prioridad);
    }

    if (filters.search) {
      sql += ' AND (titulo LIKE ? OR descripcion LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY creado_en DESC';

    return await this.db.all<Incidencia>(sql, params);
  }

  /**
   * Obtiene una incidencia por su ID.
   */
  public async findById(id: number): Promise<Incidencia | undefined> {
    const sql = 'SELECT * FROM incidencias WHERE id = ?';
    return await this.db.get<Incidencia>(sql, [id]);
  }

  /**
   * Crea una nueva incidencia urbana.
   */
  public async create(dto: CreateIncidenciaDTO): Promise<Incidencia> {
    const sql = `
      INSERT INTO incidencias (titulo, categoria, descripcion, latitud, longitud, estado, prioridad, foto_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const estadoDefecto = 'Ingresado';
    const prioridadDefecto = dto.prioridad || 'Media';
    const fotoUrl = dto.foto_url || null;

    const result = await this.db.run(sql, [
      dto.titulo,
      dto.categoria,
      dto.descripcion,
      dto.latitud,
      dto.longitud,
      estadoDefecto,
      prioridadDefecto,
      fotoUrl
    ]);

    const created = await this.findById(result.lastID);
    if (!created) {
      throw new Error('Error al recuperar la incidencia recién creada.');
    }

    return created;
  }

  /**
   * Actualiza una incidencia existente por su ID.
   */
  public async update(id: number, dto: UpdateIncidenciaDTO): Promise<Incidencia | undefined> {
    const fields: string[] = [];
    const params: any[] = [];

    if (dto.titulo !== undefined) {
      fields.push('titulo = ?');
      params.push(dto.titulo);
    }

    if (dto.categoria !== undefined) {
      fields.push('categoria = ?');
      params.push(dto.categoria);
    }

    if (dto.descripcion !== undefined) {
      fields.push('descripcion = ?');
      params.push(dto.descripcion);
    }

    if (dto.latitud !== undefined) {
      fields.push('latitud = ?');
      params.push(dto.latitud);
    }

    if (dto.longitud !== undefined) {
      fields.push('longitud = ?');
      params.push(dto.longitud);
    }

    if (dto.estado !== undefined) {
      fields.push('estado = ?');
      params.push(dto.estado);
    }

    if (dto.prioridad !== undefined) {
      fields.push('prioridad = ?');
      params.push(dto.prioridad);
    }

    if (dto.foto_url !== undefined) {
      fields.push('foto_url = ?');
      params.push(dto.foto_url);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    params.push(id);
    const sql = `UPDATE incidencias SET ${fields.join(', ')} WHERE id = ?`;
    const result = await this.db.run(sql, params);

    if (result.changes === 0) {
      return undefined;
    }

    return await this.findById(id);
  }

  /**
   * Elimina una incidencia por su ID.
   */
  public async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM incidencias WHERE id = ?';
    const result = await this.db.run(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Obtiene estadísticas agregadas por estado.
   */
  public async getStats(): Promise<Record<string, number>> {
    const sql = 'SELECT estado, COUNT(*) as count FROM incidencias GROUP BY estado';
    const rows = await this.db.all<{ estado: string; count: number }>(sql);
    
    const stats: Record<string, number> = {
      Total: 0,
      Ingresado: 0,
      Asignado: 0,
      'En Reparación': 0,
      Resuelto: 0
    };

    rows.forEach(row => {
      stats[row.estado] = row.count;
      stats.Total += row.count;
    });

    return stats;
  }
}
