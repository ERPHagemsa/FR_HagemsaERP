export type TipoDatoMaestro = "CARGO" | "SEDE" | "AREA" | "CUENTA" | "CONTRATO"

export type EstadoDatoMaestro = "ACTIVO" | "INACTIVO"

export type EstadoRegistro = "ACTIVO" | "ANULADO"

export type NivelArea = "GERENCIA" | "AREA"

export type AccionHistorial =
  | "REGISTRO"
  | "MODIFICACION"
  | "INHABILITACION"
  | "REACTIVACION"
  | "ANULACION"

export interface PaginationMeta {
  pagina?: number
  limite?: number
  total: number
  totalPaginas: number
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
  cargoSuperiorId?: string | null
  direccion?: string | null
  pais?: string | null
  departamento?: string | null
  provincia?: string | null
  ciudad?: string | null
  distrito?: string | null
  referenciaUbicacion?: string | null
  sedeId?: string | null
  nivelArea?: NivelArea | null
  gerenciaId?: string | null
  tipoCuenta?: string | null
  tipoContrato?: string | null
  cuentaId?: string | null
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
  descripcion?: string | null
  cargoSuperiorId?: string | null
  direccion?: string | null
  pais?: string | null
  departamento?: string | null
  provincia?: string | null
  ciudad?: string | null
  distrito?: string | null
  referenciaUbicacion?: string | null
  sedeId?: string | null
  nivelArea?: NivelArea | null
  gerenciaId?: string | null
  tipoCuenta?: string | null
  tipoContrato?: string | null
  cuentaId?: string | null
  usuarioCreacion: string
}

export interface ModificarConfiguracionGeneralRequest {
  codigo?: string
  nombre?: string
  descripcion?: string | null
  cargoSuperiorId?: string | null
  direccion?: string | null
  pais?: string | null
  departamento?: string | null
  provincia?: string | null
  ciudad?: string | null
  distrito?: string | null
  referenciaUbicacion?: string | null
  sedeId?: string | null
  nivelArea?: NivelArea | null
  gerenciaId?: string | null
  tipoCuenta?: string | null
  tipoContrato?: string | null
  cuentaId?: string | null
  usuarioModificacion: string
}

export interface InhabilitarConfiguracionGeneralRequest {
  motivo: string
  usuarioModificacion: string
}

export interface ReactivarConfiguracionGeneralRequest {
  usuarioModificacion: string
}

export interface AnularConfiguracionGeneralRequest {
  motivo: string
  usuarioModificacion: string
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
  sortOrder?: "asc" | "desc"
}

export type FormatoExportacionConfiguracionGeneral = "EXCEL" | "PDF"

export type ExportarConfiguracionGeneralQuery = ConsultarConfiguracionGeneralQuery & {
  formato?: FormatoExportacionConfiguracionGeneral
}
