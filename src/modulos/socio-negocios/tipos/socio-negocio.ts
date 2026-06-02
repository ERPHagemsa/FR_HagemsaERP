export type TipoSocioDeNegocio = "CLIENTE" | "PROVEEDOR" | "PERSONAL"

export type EstadoSocioDeNegocio = "ACTIVO" | "INACTIVO"

export type EstadoRegistro = "ACTIVO" | "ANULADO"

export type FormatoExportacionSocios = "EXCEL" | "PDF"

export type TipoDatoMaestroIntegracion =
  | "CARGO"
  | "SEDE"
  | "AREA"
  | "CUENTA"
  | "CONTRATO"
  | "UBICACION"
  | "ALMACEN"

export type AccionHistorialSocioDeNegocio =
  | "REGISTRO"
  | "MODIFICACION"
  | "ELIMINACION"

export type SortOrder = "asc" | "desc"

export type SortBySocioDeNegocio =
  | "count"
  | "codigoInternoSap"
  | "tipo"
  | "numeroDocumento"
  | "razonSocial"
  | "estado"
  | "estadoRegistro"
  | "fechaCreacion"

export type ValorPaginacion = number | string

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
  count: number
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
  cargoId: string
  cargoNombre: string
  sedeId: string
  sedeNombre: string
  areaId: string
  areaNombre: string
  contratoId: string
  contratoNombre: string
  cuentaId: string
  cuentaNombre: string
  motivoBaja: string
  fechaBaja: string
  usuarioBajaId: string
  motivoAnulacion: string
  fechaAnulacion: string
  usuarioAnulacionId: string
  cargo?: string
  sede?: string
  area?: string
  contrato?: string
  cuenta?: string
}

export interface EstadoBcResponse {
  boundedContext: string
  agregado: string
}

export interface MaestroConfiguracionGeneralIntegracion {
  id: string
  idExterno?: string
  tipoDatoMaestro: TipoDatoMaestroIntegracion
  codigo: string
  nombre: string
  estado: EstadoSocioDeNegocio
  areaId?: string | null
  sedeId?: string | null
  ubicacionId?: string | null
  fechaSincronizacion?: string | null
  ultimoEventoId?: string | null
  ultimoEvento?: string | null
}

export interface ConsultarMaestrosConfiguracionGeneralQuery {
  tipoDatoMaestro: TipoDatoMaestroIntegracion
  estado?: EstadoSocioDeNegocio
  sedeId?: string
  ubicacionId?: string
  page?: number
  pageSize?: number
}

/**
 * DTOs específicos por tipo de socio
 * - CLIENTE/PROVEEDOR: Campos básicos + contacto con área/cargo donde atiende
 * - PERSONAL: Campos básicos + datos laborales (ubicación, sede, área, cargo, contrato)
 */

/** Base común para todos los tipos */
interface RegistrarSocioDeNegocioBase {
  numeroDocumento: string
  razonSocial: string
  nombreComercial: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
  cuentaId?: string
  cuentaNombre?: string
  usuarioId?: string
}

/** Cliente: el backend obtiene datos comerciales desde SAP por documento */
export interface RegistrarClienteRequest extends RegistrarSocioDeNegocioBase {
  tipo: "CLIENTE"
  areaId?: string
  areaNombre?: string
  cargoId?: string
  cargoNombre?: string
}

/** Proveedor: el backend obtiene datos comerciales desde SAP por documento */
export interface RegistrarProveedorRequest extends RegistrarSocioDeNegocioBase {
  tipo: "PROVEEDOR"
  areaId?: string
  areaNombre?: string
  cargoId?: string
  cargoNombre?: string
}

/** Personal: TODOS los datos laborales OBLIGATORIOS */
export interface RegistrarPersonalRequest extends RegistrarSocioDeNegocioBase {
  tipo: "PERSONAL"
  razonSocial: string
  nombreComercial: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
  sedeId: string
  sedeNombre: string
  areaId: string
  areaNombre: string
  cargoId: string
  cargoNombre: string
  contratoId: string
  contratoNombre: string
}

/** Request unificado (compatible con el backend) */
export type RegistrarSocioDeNegocioRequest =
  | RegistrarClienteRequest
  | RegistrarProveedorRequest
  | RegistrarPersonalRequest

export type RegistrarClienteDesdeComercialRequest = RegistrarClienteRequest

export interface ModificarSocioDeNegocioRequest {
  razonSocial?: string
  nombreComercial?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  cargoId?: string
  cargoNombre?: string
  sedeId?: string
  sedeNombre?: string
  areaId?: string
  areaNombre?: string
  contratoId?: string
  contratoNombre?: string
  cuentaId?: string
  cuentaNombre?: string
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
  count?: ValorPaginacion
  numeroDocumento?: string
  codigoInternoSap?: string
  razonSocial?: string
  nombreComercial?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  cargoId?: string
  cargoNombre?: string
  sedeId?: string
  sedeNombre?: string
  areaId?: string
  areaNombre?: string
  contratoId?: string
  contratoNombre?: string
  cuentaId?: string
  cuentaNombre?: string
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

export interface ExportarSociosDeNegocioQuery {
  formato: FormatoExportacionSocios
  tipo?: TipoSocioDeNegocio
  estado?: EstadoSocioDeNegocio
  estadoRegistro?: EstadoRegistro
  count?: ValorPaginacion
  numeroDocumento?: string
  codigoInternoSap?: string
  razonSocial?: string
  nombreComercial?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  cargoId?: string
  cargoNombre?: string
  sedeId?: string
  sedeNombre?: string
  areaId?: string
  areaNombre?: string
  contratoId?: string
  contratoNombre?: string
  cuentaId?: string
  cuentaNombre?: string
  sortBy?: string
  sortOrder?: SortOrder
}

export interface ConsultarSapPorDocumentoQuery {
  tipo: Exclude<TipoSocioDeNegocio, "PERSONAL">
}

export interface SapBusinessPartnerResumenResponse {
  codigoInternoSap: string
  tipo: Exclude<TipoSocioDeNegocio, "PERSONAL">
  numeroDocumento: string
  razonSocial: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
}

export type SapBusinessPartnerResponse = SapBusinessPartnerResumenResponse & {
  nombreComercial?: string
  cargoId?: string
  cargoNombre?: string
  sedeId?: string
  sedeNombre?: string
  areaId?: string
  areaNombre?: string
  contratoId?: string
  contratoNombre?: string
  cuentaId?: string
  cuentaNombre?: string
  [key: string]: unknown
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
  datosAnteriores: Record<string, unknown> | null
  datosNuevos: Record<string, unknown> | null
}
