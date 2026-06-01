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
  cargoId?: string | null
  cargoNombre?: string | null
  sede: string
  sedeId?: string | null
  sedeNombre?: string | null
  area: string
  areaId?: string | null
  areaNombre?: string | null
  contrato: string
  contratoId?: string | null
  contratoNombre?: string | null
  cuenta: string
  cuentaId?: string | null
  cuentaNombre?: string | null
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
  codigoInternoSap: string
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

/** Cliente: contacto + área/cargo OPCIONAL (donde atiende en nuestras operaciones) */
export interface RegistrarClienteRequest extends RegistrarSocioDeNegocioBase {
  tipo: "CLIENTE"
  areaId?: string
  areaNombre?: string
  cargoId?: string
  cargoNombre?: string
}

/** Proveedor: contacto + área/cargo OPCIONAL (donde atiende en nuestras operaciones) */
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
  ubicacionId: string
  ubicacionNombre: string
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

