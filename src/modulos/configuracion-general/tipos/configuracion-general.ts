export type TipoDatoMaestro = "CARGO" | "SEDE" | "AREA" | "CUENTA" | "CONTRATO"

export type EstadoDatoMaestro = "ACTIVO" | "INACTIVO"

export type EstadoRegistro = "VIGENTE" | "ANULADO"

export type AccionHistorial =
  | "REGISTRO"
  | "MODIFICACION"
  | "INHABILITACION"
  | "REACTIVACION"
  | "ANULACION"

export interface PaginationMeta {
  page?: number
  pageSize?: number
  pagina?: number
  limite?: number
  total: number
  totalPaginas?: number
  totalPages?: number
  tieneSiguiente?: boolean
  tieneAnterior?: boolean
}

export interface PaginatedResponse<T> {
  datos: T[]
  paginacion: PaginationMeta
}

export interface EstadoBcConfiguracionGeneralResponse {
  boundedContext: string
  agregado: string
}

export interface ConfiguracionGeneralResponse {
  id: string
  tipoDatoMaestro: TipoDatoMaestro
  codigo: string
  nombre: string
  descripcion?: string | null
  atributos?: Record<string, unknown> | null
  estado: EstadoDatoMaestro
  estadoRegistro: EstadoRegistro
  motivoInhabilitacion?: string | null
  fechaInhabilitacion?: string | null
  usuarioInhabilitacionId?: string | null
  motivoAnulacion?: string | null
  fechaAnulacion?: string | null
  usuarioAnulacionId?: string | null
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion?: string | null
  usuarioModificacion?: string | null
}

export interface HistorialConfiguracionGeneralResponse {
  id: string
  configuracionGeneralId?: string
  idRegistro?: string
  tipoDatoMaestro: TipoDatoMaestro
  codigo: string
  accion: AccionHistorial
  fechaAccion: string
  usuarioAccion: string
  datosAnteriores?: string | Record<string, unknown> | null
  datosNuevos?: string | Record<string, unknown> | null
}

export interface RegistrarConfiguracionGeneralRequest {
  tipoDatoMaestro: TipoDatoMaestro
  codigo: string
  nombre: string
  descripcion?: string
  atributos?: Record<string, unknown>
  usuarioId: string
}

export interface ModificarConfiguracionGeneralRequest {
  codigo?: string
  nombre?: string
  descripcion?: string
  atributos?: Record<string, unknown>
  usuarioId: string
}

export interface CambiarEstadoConfiguracionGeneralRequest {
  motivo?: string
  usuarioId: string
}

export interface ConsultarConfiguracionGeneralQuery {
  tipoDatoMaestro?: TipoDatoMaestro
  estado?: EstadoDatoMaestro
  estadoRegistro?: EstadoRegistro
  codigo?: string
  nombre?: string
  page?: number
  pageSize?: number
  sortBy?:
    | "tipoDatoMaestro"
    | "codigo"
    | "nombre"
    | "estado"
    | "estadoRegistro"
    | "fechaCreacion"
    | "fechaModificacion"
  sortOrder?: "asc" | "desc"
}
