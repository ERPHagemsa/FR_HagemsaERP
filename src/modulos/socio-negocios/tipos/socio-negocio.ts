export type TipoSocioDeNegocio = "CLIENTE" | "PROVEEDOR" | "PERSONAL"

export type EstadoSocioDeNegocio = "ACTIVO" | "INACTIVO"

export type EstadoRegistro = "ACTIVO" | "ANULADO"

export type FormatoExportacionSocios = "EXCEL" | "PDF"

export type AccionHistorialSocioDeNegocio =
  | "REGISTRO"
  | "MODIFICACION"
  | "ELIMINACION"

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

export interface ResumenSociosDeNegocioResponse {
  totalSocios: number
  operativosActivos: number
  inactivosReactivables: number
  anulados: number
  porTipo: Array<{
    tipo: TipoSocioDeNegocio
    total: number
  }>
  porEstado: Array<{
    estado: EstadoSocioDeNegocio
    total: number
  }>
  porEstadoRegistro: Array<{
    estadoRegistro: EstadoRegistro
    total: number
  }>
  porTipoYEstado: Array<{
    tipo: TipoSocioDeNegocio
    estado: EstadoSocioDeNegocio
    estadoRegistro: EstadoRegistro
    total: number
  }>
  bajasRecientes: SocioDeNegocioResponse[]
  registrosRecientes: SocioDeNegocioResponse[]
}

export interface SocioDeNegocioResponse {
  id: string
  codigoInternoSap: string
  tipo: TipoSocioDeNegocio
  numeroDocumento: string
  razonSocial: string
  nombreComercial: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
  estado: EstadoSocioDeNegocio
  estadoRegistro: EstadoRegistro
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string
  usuarioModificacion: string
  cargo: string
  sede: string
  area: string
  contrato: string
  cuenta: string
  motivoBaja: string
  fechaBaja: string
  usuarioBajaId: string
  motivoAnulacion: string
  fechaAnulacion: string
  usuarioAnulacionId: string
}

export interface EstadoBcResponse {
  boundedContext: string
  agregado: string
}

export interface RegistrarSocioDeNegocioRequest {
  codigoInternoSap: string
  tipo: TipoSocioDeNegocio
  numeroDocumento: string
  razonSocial: string
  nombreComercial: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
  cargo?: string
  sede?: string
  area?: string
  contrato?: string
  cuenta?: string
  usuarioId?: string
}

export type RegistrarClienteDesdeComercialRequest =
  RegistrarSocioDeNegocioRequest & { tipo: "CLIENTE" }

export interface ModificarSocioDeNegocioRequest {
  razonSocial?: string
  nombreComercial?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  cargo?: string
  sede?: string
  area?: string
  contrato?: string
  cuenta?: string
  usuarioId: string
}

export interface DarDeBajaSocioDeNegocioRequest {
  motivo: string
  usuarioId: string
  estadoRegistro?: EstadoRegistro
}

export interface ReactivarSocioDeNegocioRequest {
  usuarioId: string
}

export interface ConsultarSociosDeNegocioQuery {
  tipo?: TipoSocioDeNegocio
  estado?: EstadoSocioDeNegocio
  estadoRegistro?: EstadoRegistro
  numeroDocumento?: string
  codigoInternoSap?: string
  razonSocial?: string
  nombreComercial?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  area?: string
  cargo?: string
  sede?: string
  contrato?: string
  cuenta?: string
  page?: number
  pageSize?: number
  sortBy?:
    | "codigoInternoSap"
    | "tipo"
    | "numeroDocumento"
    | "razonSocial"
    | "estado"
    | "estadoRegistro"
    | "fechaCreacion"
  sortOrder?: "asc" | "desc"
}

export interface ConsultarHistorialSocioDeNegocioQuery {
  accion?: AccionHistorialSocioDeNegocio
  usuarioAccion?: string
  fechaDesde?: string
  fechaHasta?: string
  page?: number
  pageSize?: number
}

export interface ExportarSociosDeNegocioQuery
  extends ConsultarSociosDeNegocioQuery {
  formato: FormatoExportacionSocios
}

export interface ReporteSociosDeNegocioResponse {
  nombreArchivo: string
  formato: FormatoExportacionSocios
  contenido: string
}

export interface HistorialSocioDeNegocioResponse {
  id: string
  idRegistro: string
  accion: AccionHistorialSocioDeNegocio
  fechaAccion: string
  usuarioAccion: string
  datosAnteriores: Record<string, unknown>
  datosNuevos: Record<string, unknown>
}

