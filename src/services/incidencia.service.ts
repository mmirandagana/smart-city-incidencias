import { IncidenciaRepository } from '../repositories/incidencia.repository';
import { Incidencia, CreateIncidenciaDTO, UpdateIncidenciaDTO, IncidenciaFilter, CategoriaIncidencia, EstadoIncidencia, PrioridadIncidencia } from '../models/incidencia.model';

const CATEGORIAS_VALIDAS: CategoriaIncidencia[] = ['Bache', 'Luminaria', 'Semáforo', 'Basura/Aseo'];
const ESTADOS_VALIDOS: EstadoIncidencia[] = ['Ingresado', 'Asignado', 'En Reparación', 'Resuelto'];
const PRIORIDADES_VALIDAS: PrioridadIncidencia[] = ['Baja', 'Media', 'Alta', 'Crítica'];

/**
 * Capa de Servicio (Lógica de Negocio y Validaciones) para Incidencias Urbanas.
 */
export class IncidenciaService {
  private repository: IncidenciaRepository;

  constructor() {
    this.repository = new IncidenciaRepository();
  }

  public async getAllIncidencias(filters: IncidenciaFilter): Promise<Incidencia[]> {
    return await this.repository.findAll(filters);
  }

  public async getIncidenciaById(id: number): Promise<Incidencia> {
    if (isNaN(id) || id <= 0) {
      throw new Error('El ID provisto no es válido.');
    }

    const incidencia = await this.repository.findById(id);
    if (!incidencia) {
      throw new Error(`La incidencia con ID ${id} no existe.`);
    }

    return incidencia;
  }

  public async createIncidencia(dto: CreateIncidenciaDTO): Promise<Incidencia> {
    // Validaciones de campos obligatorios
    if (!dto.titulo || dto.titulo.trim().length < 3) {
      throw new Error('El título es obligatorio y debe contener al menos 3 caracteres.');
    }

    if (!dto.descripcion || dto.descripcion.trim().length < 5) {
      throw new Error('La descripción es obligatoria y debe tener al menos 5 caracteres.');
    }

    if (!dto.categoria || !CATEGORIAS_VALIDAS.includes(dto.categoria)) {
      throw new Error(`Categoría inválida. Opciones válidas: ${CATEGORIAS_VALIDAS.join(', ')}`);
    }

    if (typeof dto.latitud !== 'number' || isNaN(dto.latitud) || dto.latitud < -90 || dto.latitud > 90) {
      throw new Error('La latitud debe ser un número válido entre -90 y 90.');
    }

    if (typeof dto.longitud !== 'number' || isNaN(dto.longitud) || dto.longitud < -180 || dto.longitud > 180) {
      throw new Error('La longitud debe ser un número válido entre -180 y 180.');
    }

    if (dto.prioridad && !PRIORIDADES_VALIDAS.includes(dto.prioridad)) {
      throw new Error(`Prioridad inválida. Opciones válidas: ${PRIORIDADES_VALIDAS.join(', ')}`);
    }

    return await this.repository.create({
      ...dto,
      titulo: dto.titulo.trim(),
      descripcion: dto.descripcion.trim()
    });
  }

  public async updateIncidencia(id: number, dto: UpdateIncidenciaDTO): Promise<Incidencia> {
    if (isNaN(id) || id <= 0) {
      throw new Error('El ID provisto no es válido.');
    }

    // Verificar existencia previo a actualización
    const existente = await this.repository.findById(id);
    if (!existente) {
      throw new Error(`La incidencia con ID ${id} no fue encontrada para actualizar.`);
    }

    // Validar enumeraciones si fueron provistas
    if (dto.categoria && !CATEGORIAS_VALIDAS.includes(dto.categoria)) {
      throw new Error(`Categoría inválida. Opciones válidas: ${CATEGORIAS_VALIDAS.join(', ')}`);
    }

    if (dto.estado && !ESTADOS_VALIDOS.includes(dto.estado)) {
      throw new Error(`Estado inválido. Opciones válidas: ${ESTADOS_VALIDOS.join(', ')}`);
    }

    if (dto.prioridad && !PRIORIDADES_VALIDAS.includes(dto.prioridad)) {
      throw new Error(`Prioridad inválida. Opciones válidas: ${PRIORIDADES_VALIDAS.join(', ')}`);
    }

    if (dto.latitud !== undefined && (typeof dto.latitud !== 'number' || isNaN(dto.latitud) || dto.latitud < -90 || dto.latitud > 90)) {
      throw new Error('La latitud debe ser un número válido entre -90 y 90.');
    }

    if (dto.longitud !== undefined && (typeof dto.longitud !== 'number' || isNaN(dto.longitud) || dto.longitud < -180 || dto.longitud > 180)) {
      throw new Error('La longitud debe ser un número válido entre -180 y 180.');
    }

    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error('No se pudo actualizar la incidencia.');
    }

    return updated;
  }

  public async deleteIncidencia(id: number): Promise<void> {
    if (isNaN(id) || id <= 0) {
      throw new Error('El ID provisto no es válido.');
    }

    const existe = await this.repository.findById(id);
    if (!existe) {
      throw new Error(`La incidencia con ID ${id} no existe.`);
    }

    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error('No se pudo eliminar la incidencia de la base de datos.');
    }
  }

  public async getStats(): Promise<Record<string, number>> {
    return await this.repository.getStats();
  }
}
