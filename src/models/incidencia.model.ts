export type CategoriaIncidencia = 'Bache' | 'Luminaria' | 'Semáforo' | 'Basura/Aseo';
export type EstadoIncidencia = 'Ingresado' | 'Asignado' | 'En Reparación' | 'Resuelto';
export type PrioridadIncidencia = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export interface Incidencia {
  id: number;
  titulo: string;
  categoria: CategoriaIncidencia;
  descripcion: string;
  latitud: number;
  longitud: number;
  estado: EstadoIncidencia;
  prioridad: PrioridadIncidencia;
  foto_url?: string | null;
  creado_en: string;
}

export interface CreateIncidenciaDTO {
  titulo: string;
  categoria: CategoriaIncidencia;
  descripcion: string;
  latitud: number;
  longitud: number;
  prioridad?: PrioridadIncidencia;
  foto_url?: string;
}

export interface UpdateIncidenciaDTO {
  titulo?: string;
  categoria?: CategoriaIncidencia;
  descripcion?: string;
  latitud?: number;
  longitud?: number;
  estado?: EstadoIncidencia;
  prioridad?: PrioridadIncidencia;
  foto_url?: string;
}

export interface IncidenciaFilter {
  estado?: EstadoIncidencia;
  categoria?: CategoriaIncidencia;
  prioridad?: PrioridadIncidencia;
  search?: string;
}
