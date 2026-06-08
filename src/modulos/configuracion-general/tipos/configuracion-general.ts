export type TipoDatoMaestro =
  | "CARGO"
  | "UBICACION"
  | "SEDE"
  | "AREA"
  | "ALMACEN"
  | "CUENTA"
  | "CONTRATO"

export type EstadoDatoMaestro = "ACTIVO" | "INACTIVO"

export type EstadoRegistro = "ACTIVO" | "ANULADO"

export type NivelArea = "GERENCIA" | "AREA"

export type TipoUbicacion =
  | "SEDE"
  | "CLIENTE"
  | "PLANTA"
  | "MINA"
  | "PUERTO"
  | "ALMACEN"
  | "ALMACEN_TEMPORAL"
  | "PATIO"
  | "TERMINAL"
  | "PUNTO_CARGA"
  | "PUNTO_DESCARGA"
  | "PUNTO_ACOPIO"
  | "OTRO"

export type AccionHistorial =
  | "REGISTRO"
  | "MODIFICACION"
  | "INHABILITACION"
  | "REACTIVACION"
  | "ANULACION"

export interface PaginationMeta {
  pagina: number
  limite: number
  total: number
  totalPaginas: number
  tieneSiguiente: boolean
  tieneAnterior: boolean
}

export interface PaginatedResponse<T> {
  datos: T[]
  paginacion: PaginationMeta
}

export interface EstadoBcConfiguracionGeneralResponse {
  boundedContext: string
  agregado: string
}

export interface ResumenConfiguracionGeneralResponse {
  totalMaestros: number
  activos: number
  inactivos: number
  anulados: number
  vigentesConsumibles: number
  porTipoDatoMaestro: Array<{
    tipoDatoMaestro: TipoDatoMaestro
    total: number
    activos: number
    inactivos: number
    anulados: number
    vigentesConsumibles: number
  }>
  porEstado: Array<{
    estado: EstadoDatoMaestro
    total: number
  }>
  porEstadoRegistro: Array<{
    estadoRegistro: EstadoRegistro
    total: number
  }>
}

export interface ConfiguracionGeneralResponse {
  id: string
  count: number
  tipoDatoMaestro: TipoDatoMaestro
  codigo: string
  nombre: string
  descripcion?: string | null
  cargoSuperiorId?: string | null
  ubicacionId?: string | null
  tipoUbicacion?: TipoUbicacion | null
  direccion?: string | null
  pais?: string | null
  departamento?: string | null
  provincia?: string | null
  ciudad?: string | null
  distrito?: string | null
  referenciaUbicacion?: string | null
  latitud?: number | null
  longitud?: number | null
  sedeId?: string | null
  nivelArea?: NivelArea | null
  gerenciaId?: string | null
  esTemporal?: boolean | null
  fechaInicio?: string | null
  fechaFin?: string | null
  nivelCuentaContrato?: number | null
  contratoPadreId?: string | null
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
  nombre: string
  descripcion?: string | null
  cargoSuperiorId?: string | null
  ubicacionId?: string | null
  tipoUbicacion?: TipoUbicacion | null
  direccion?: string | null
  pais?: string | null
  departamento?: string | null
  provincia?: string | null
  ciudad?: string | null
  distrito?: string | null
  referenciaUbicacion?: string | null
  latitud?: number | null
  longitud?: number | null
  sedeId?: string | null
  nivelArea?: NivelArea | null
  gerenciaId?: string | null
  esTemporal?: boolean | null
  fechaInicio?: string | null
  fechaFin?: string | null
  contratoPadreId?: string | null
  usuarioCreacion: string
}

export interface ModificarConfiguracionGeneralRequest {
  nombre?: string
  descripcion?: string | null
  cargoSuperiorId?: string | null
  ubicacionId?: string | null
  tipoUbicacion?: TipoUbicacion | null
  direccion?: string | null
  pais?: string | null
  departamento?: string | null
  provincia?: string | null
  ciudad?: string | null
  distrito?: string | null
  referenciaUbicacion?: string | null
  latitud?: number | null
  longitud?: number | null
  sedeId?: string | null
  nivelArea?: NivelArea | null
  gerenciaId?: string | null
  esTemporal?: boolean | null
  fechaInicio?: string | null
  fechaFin?: string | null
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
  count?: number
  codigo?: string
  nombre?: string
  departamento?: string
  provincia?: string
  distrito?: string
  page?: number
  pageSize?: number
  sortBy?:
    | "count"
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
