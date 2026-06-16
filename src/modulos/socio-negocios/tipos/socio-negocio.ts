export type TipoSocioDeNegocio = "CLIENTE" | "PROVEEDOR" | "PERSONAL"
export type EstadoSocioDeNegocio = "ACTIVO" | "INACTIVO"
export type EstadoRegistro = "ACTIVO" | "ANULADO"
export type EstadoAprobacion = "PENDIENTE_APROBACION" | "APROBADO" | "RECHAZADO"
export type EstadoSincronizacionSap =
  | "NO_APLICA"
  | "NO_INICIADA"
  | "PENDIENTE"
  | "PROCESANDO"
  | "SINCRONIZADO"
  | "FALLIDO"
export type OrigenSocioDeNegocio = "MANUAL" | "COMERCIAL" | "SAP"
export type EstadoEventoSocioDeNegocio =
  | "PENDIENTE"
  | "PROCESANDO"
  | "PUBLICADO"
  | "FALLIDO"
export type AccionHistorialSocioDeNegocio =
  | "REGISTRO"
  | "MODIFICACION"
  | "ELIMINACION"
export type FormatoExportacionSocios = "EXCEL" | "PDF"
export type SortOrder = "asc" | "desc"
export type ValorPaginacion = number | string

export type SortBySocioDeNegocio =
  | "id"
  | "codigoInternoSap"
  | "tipo"
  | "numeroDocumento"
  | "razonSocial"
  | "estado"
  | "estadoRegistro"
  | "fechaCreacion"

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

export interface RespuestaDto<T> {
  datos: T
}

export interface SocioDeNegocioResponse {
  id: number
  codigoInternoSap: string | null
  tipo: TipoSocioDeNegocio
  numeroDocumento: string
  razonSocial: string
  nombreComercial: string
  primerNombre: string
  segundoNombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
  estado: EstadoSocioDeNegocio
  estadoRegistro: EstadoRegistro
  estadoAprobacion: EstadoAprobacion
  estadoSincronizacionSap: EstadoSincronizacionSap
  fechaSincronizacionSap: string
  ultimoErrorSincronizacionSap: string
  origen: OrigenSocioDeNegocio
  registroAnteriorId: number | null
  motivoNuevoRegistro: string
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string
  usuarioModificacion: string
  fechaAprobacion: string
  usuarioAprobacion: string
  fechaRechazo: string
  usuarioRechazo: string
  motivoRechazo: string
  motivoBaja: string
  fechaBaja: string
  usuarioBajaId: string
  motivoAnulacion: string
  fechaAnulacion: string
  usuarioAnulacionId: string
}

export interface ResumenSociosDeNegocioResponse {
  totalSocios: number
  operativosActivos: number
  inactivosReactivables: number
  anulados: number
  porTipo: Array<{ tipo: TipoSocioDeNegocio; total: number }>
  porEstado: Array<{ estado: EstadoSocioDeNegocio; total: number }>
  porEstadoRegistro: Array<{ estadoRegistro: EstadoRegistro; total: number }>
  porTipoYEstado: Array<{
    tipo: TipoSocioDeNegocio
    estado: EstadoSocioDeNegocio
    estadoRegistro: EstadoRegistro
    total: number
  }>
  bajasRecientes: SocioDeNegocioResponse[]
  registrosRecientes: SocioDeNegocioResponse[]
}

export interface EstadoBcResponse {
  boundedContext: string
  agregado: string
}

export interface RegistrarSocioDeNegocioRequest {
  tipo: TipoSocioDeNegocio
  numeroDocumento: string
  razonSocial: string
  nombreComercial: string
  primerNombre?: string
  segundoNombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
  usuarioId?: string
}

export type RegistrarClienteRequest = RegistrarSocioDeNegocioRequest & { tipo: "CLIENTE" }
export type RegistrarProveedorRequest = RegistrarSocioDeNegocioRequest & { tipo: "PROVEEDOR" }
export type RegistrarPersonalRequest = RegistrarSocioDeNegocioRequest & { tipo: "PERSONAL" }
export type RegistrarClienteDesdeComercialRequest = RegistrarClienteRequest

export interface ModificarSocioDeNegocioRequest {
  razonSocial?: string
  nombreComercial?: string
  primerNombre?: string
  segundoNombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  usuarioId: string
}

export interface AprobarSocioDeNegocioRequest {
  usuarioId: string
}

export interface RechazarSocioDeNegocioRequest {
  usuarioId: string
  motivo: string
}

export interface DarDeBajaSocioDeNegocioRequest {
  motivo: string
  usuarioId: string
  estadoRegistro?: EstadoRegistro
}

export interface ReactivarSocioDeNegocioRequest {
  usuarioId: string
  sapSession?: string
}

export interface ConsultarSociosDeNegocioQuery {
  id?: ValorPaginacion
  tipo?: TipoSocioDeNegocio
  estado?: EstadoSocioDeNegocio
  estadoRegistro?: EstadoRegistro
  estadoAprobacion?: EstadoAprobacion
  estadoSincronizacionSap?: EstadoSincronizacionSap
  origen?: OrigenSocioDeNegocio
  numeroDocumento?: string
  codigoInternoSap?: string
  razonSocial?: string
  nombreComercial?: string
  primerNombre?: string
  segundoNombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  page?: ValorPaginacion
  pageSize?: ValorPaginacion
  sortBy?: SortBySocioDeNegocio
  sortOrder?: SortOrder
}

export interface ConsultarHistorialSocioDeNegocioQuery {
  accion?: AccionHistorialSocioDeNegocio
  usuarioAccion?: string
  fechaDesde?: string
  fechaHasta?: string
  page?: ValorPaginacion
  pageSize?: ValorPaginacion
}

export type ExportarSociosDeNegocioQuery = ConsultarSociosDeNegocioQuery & {
  formato: FormatoExportacionSocios
}

export interface ConsultarSapPorDocumentoQuery {
  tipo?: TipoSocioDeNegocio
  session?: string
}

export interface SapSessionQuery {
  session?: string
}

export interface SapBusinessPartnerResponse {
  codigoInternoSap: string
  tipo: TipoSocioDeNegocio
  numeroDocumento: string
  razonSocial: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
}

export type SapBusinessPartnerResumenResponse = SocioDeNegocioResponse

export interface RegistrarDesdeSapRequest {
  tipo?: TipoSocioDeNegocio
  usuarioId?: string
  session?: string
}

export interface ReporteSociosDeNegocioResponse {
  nombreArchivo: string
  formato: FormatoExportacionSocios
  contenido: string
}

export interface HistorialSocioDeNegocioResponse {
  id: string
  idRegistro: number
  accion: AccionHistorialSocioDeNegocio
  fechaAccion: string
  usuarioAccion: string
  datosAnteriores: Record<string, unknown> | null
  datosNuevos: Record<string, unknown> | null
}

export interface EventoSocioDeNegocioResponse {
  id: string
  eventoId?: string
  idRegistro: number
  nombre: string
  origen: string
  destino: string
  payload: Record<string, unknown>
  estado: EstadoEventoSocioDeNegocio
  intentos: number
  proximoIntentoEn?: string | null
  fechaInicioProcesamiento?: string | null
  ultimoError: string
  fechaCreacion: string
  fechaProcesamiento?: string | null
  fechaPublicacion?: string | null
}

export interface ClientePorDocumentoResponse {
  clienteId: number
  numeroDocumento: string
  razonSocial: string
  nombreComercial: string
  contacto: string
  correo: string
  numeroCelular: string
  estado: EstadoSocioDeNegocio
}
