import type { TipoRegimenPersonal } from "./tareo-personal"
import type { DisponibilidadPersonalConfiguradaResponse } from "./disponibilidad-personal"

export type TipoSocioDeNegocio = "CLIENTE" | "PROVEEDOR" | "PERSONAL"
export type EstadoSocioDeNegocio = "ACTIVO" | "INACTIVO"
export type EstadoRegistro = "ACTIVO" | "ANULADO"
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
export type DireccionEventoSocioDeNegocio = "ENTRANTE" | "SALIENTE"
export type AccionHistorialSocioDeNegocio =
  | "REGISTRO"
  | "MODIFICACION"
  | "ELIMINACION"
export type FormatoExportacionSocios = "EXCEL" | "PDF" | "JSON"
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
  codigoInternoSap?: string | null
  tipo: TipoSocioDeNegocio
  numeroDocumento: string
  razonSocial?: string
  nombreComercial?: string
  nombreCompleto?: string
  primerNombre?: string
  segundoNombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
  estado: EstadoSocioDeNegocio
  estadoRegistro: EstadoRegistro
  estadoSincronizacionSap?: EstadoSincronizacionSap
  fechaSincronizacionSap?: string
  ultimoErrorSincronizacionSap?: string
  origen: OrigenSocioDeNegocio
  registroAnteriorId: number | null
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string
  usuarioModificacion: string
  motivoBaja: string
  fechaBaja: string
  usuarioBajaId: string
  motivoAnulacion: string
  fechaAnulacion: string
  usuarioAnulacionId: string
  /** Solo PERSONAL: asignaciones vigentes embebidas en el detalle (GET /personal/:id). */
  asignaciones?: AsignacionPersonalResumen[]
  /** Solo PERSONAL: disponibilidad configurada activa y vigente a la fecha de consulta. */
  disponibilidadesVigentes?: DisponibilidadPersonalConfiguradaResponse[]
}

export function puedeGestionarAsignacionesPersonal(
  socio: Pick<SocioDeNegocioResponse, "tipo" | "estado" | "estadoRegistro">,
) {
  return (
    socio.tipo === "PERSONAL" &&
    socio.estado === "ACTIVO" &&
    socio.estadoRegistro === "ACTIVO"
  )
}

export interface ResumenSociosDeNegocioResponse {
  total?: number
  clientes?: number
  proveedores?: number
  personal?: number
  totalSocios?: number
  operativosActivos?: number
  inactivosReactivables?: number
  anulados?: number
  porTipo?: Array<{ tipo: TipoSocioDeNegocio; total: number }>
  porEstado?: Array<{ estado: EstadoSocioDeNegocio; total: number }>
  porEstadoRegistro?: Array<{ estadoRegistro: EstadoRegistro; total: number }>
  porTipoYEstado?: Array<{
    tipo: TipoSocioDeNegocio
    estado: EstadoSocioDeNegocio
    estadoRegistro: EstadoRegistro
    total: number
  }>
  bajasRecientes?: SocioDeNegocioResponse[]
  registrosRecientes?: SocioDeNegocioResponse[]
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

/**
 * Reemplaza un socio creando una version corregida. El backend anula el registro
 * original y devuelve uno nuevo con `registroAnteriorId` apuntando al anterior.
 * POST /socios-de-negocio/:id/reemplazo.
 */
export type ReemplazarSocioDeNegocioRequest = RegistrarSocioDeNegocioRequest & {
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

// ---- Listados dedicados por tipo (clientes / proveedores / personal) ----

/**
 * Item de los listados de empresa (clientes y proveedores). El backend omite del
 * JSON los campos sin valor, por eso casi todo es opcional salvo la identidad y los estados.
 */
export interface SocioEmpresaListadoResponse {
  id: number
  tipo: TipoSocioDeNegocio
  numeroDocumento: string
  estado: EstadoSocioDeNegocio
  estadoRegistro: EstadoRegistro
  origen: OrigenSocioDeNegocio
  fechaCreacion: string
  fechaModificacion?: string
  codigoInternoSap?: string
  razonSocial?: string
  nombreComercial?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  estadoSincronizacionSap?: EstadoSincronizacionSap
  fechaSincronizacionSap?: string
  ultimoErrorSincronizacionSap?: string
}

/** Resumen de cuenta/contrato embebido en la asignacion del listado de personal. */
export interface CuentaContratoResumen {
  id: number
  tipo: "CUENTA" | "CONTRATO"
  configuracionCodigo?: string
  configuracionNombre?: string
  /**
   * Jerarquía que el backend ya resuelve en el snapshot: padre directo del nodo
   * (puede ser una CUENTA o un CONTRATO) y la cuenta raíz a la que pertenece.
   * Sirve para agrupar los contratos bajo su cuenta sin consultar Configuración
   * General. `nivelCuentaContrato` es 1 para la cuenta raíz y crece hacia abajo.
   */
  configuracionPadreTipo?: "CUENTA" | "CONTRATO"
  configuracionPadreCodigo?: string
  configuracionPadreNombre?: string
  cuentaRaizCodigo?: string
  cuentaRaizNombre?: string
  nivelCuentaContrato?: number
  estado?: "VIGENTE" | "FINALIZADA" | "ANULADA"
  // Flujo de aprobacion jerarquica del detalle: nace PENDIENTE_APROBACION y solo
  // es operativo cuando queda APROBADO. El detalle del personal (GET /personal/:id)
  // trae estos campos embebidos; el listado liviano puede omitirlos.
  estadoAprobacion?: EstadoAprobacionCuentaContrato
  aprobadorNombre?: string
  motivoRechazo?: string
  vigenteDesde?: string
  vigenteHasta?: string
}

/** Estado de aprobacion jerarquica de un detalle cuenta/contrato. */
export type EstadoAprobacionCuentaContrato =
  | "PENDIENTE_APROBACION"
  | "APROBADO"
  | "RECHAZADO"

/**
 * Resumen de asignacion embebido en cada item del listado de personal y en el
 * detalle (GET /personal/:id). El detalle trae mas campos (tareo, horario y
 * jornada); todos son opcionales para soportar tambien el listado liviano. Las
 * respuestas ya no exponen `snapshotJson`: el detalle llega en campos canonicos.
 */
export interface AsignacionPersonalResumen {
  id: number
  cargoCodigo?: string
  cargoNombre?: string
  sedeCodigo?: string
  sedeNombre?: string
  areaCodigo?: string
  areaNombre?: string
  jefeCodigo?: string
  jefeNombre?: string
  // Tareo resuelto al asignar (tipo + configuracion laboral aplicable).
  tipoTareoCodigo?: string
  tipoTareoNombre?: string
  configuracionLaboralCodigo?: string
  configuracionLaboralNombre?: string
  tipoRegimen?: TipoRegimenPersonal
  turnoCodigo?: string
  turnoNombre?: string
  horarioCodigo?: string
  horarioNombre?: string
  horaInicio?: string
  horaFin?: string
  regimenCodigo?: string
  regimenNombre?: string
  regimenPatron?: string
  diasTrabajo?: number
  diasDescanso?: number
  horasPorDia?: number
  estado?: "VIGENTE" | "FINALIZADA" | "ANULADA"
  vigenteDesde?: string
  vigenteHasta?: string
  cuentasContratos?: CuentaContratoResumen[]
}

/**
 * Item del endpoint real de BC01 `GET /personal/activos`. OJO: su forma difiere
 * de `PersonalListadoResponse` (el del maestro /socios-de-negocio/personal): el
 * id es `personalId`, el documento va anidado en `documento`, y el contacto en
 * `contacto`. Se usa para el buscador de socio (vincular socio a una cuenta).
 */
export interface PersonalActivoResponse {
  personalId: number
  documento: {
    numeroDocumento: string
    tipoDocumento?: string
  }
  primerNombre?: string
  segundoNombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  nombreCompleto?: string
  contacto?: {
    direccion?: string
    contacto?: string
    correo?: string
    numeroCelular?: string
  }
  asignacionVigente?: Record<string, unknown>
  cuentasContratos?: CuentaContratoResumen[]
}

/**
 * Item del listado de personal. Incluye nombre completo y sus asignaciones
 * vigentes embebidas (el endpoint /personal las devuelve junto al registro).
 */
export interface PersonalListadoResponse {
  id: number
  tipo: TipoSocioDeNegocio
  numeroDocumento: string
  estado: EstadoSocioDeNegocio
  estadoRegistro: EstadoRegistro
  origen: OrigenSocioDeNegocio
  fechaCreacion: string
  fechaModificacion?: string
  nombreCompleto?: string
  primerNombre?: string
  segundoNombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  asignaciones?: AsignacionPersonalResumen[]
}

// ---- Linea historica de personal (cadena de reingresos) ----

/** Resumen de un registro dentro de la linea historica (raiz, anterior inmediato, etc.). */
export interface LineaHistoricaRegistroResumen {
  id: number
  estado: EstadoSocioDeNegocio
  motivoBaja?: string
  asignaciones: AsignacionPersonalResumen[]
}

/** Cada version del personal en la cadena de reingresos. */
export interface LineaHistoricaRegistro {
  id: number
  numeroVersion: number
  esRaiz: boolean
  esActual: boolean
  estado: EstadoSocioDeNegocio
  registroAnteriorId?: number | null
  motivoNuevoRegistro?: string
  asignaciones: AsignacionPersonalResumen[]
}

/** Respuesta de GET /socios-de-negocio/personal/:id/linea-historica. */
export interface LineaHistoricaPersonalResponse {
  personalId: number
  numeroDocumento: string
  totalRegistros: number
  totalReingresos: number
  registroRaizId: number
  registroActualId: number
  registroAnteriorInmediato?: LineaHistoricaRegistroResumen | null
  primerRegistro?: LineaHistoricaRegistroResumen | null
  registros: LineaHistoricaRegistro[]
}

/** Filtros soportados por GET /socios-de-negocio/personal (sin razon social ni SAP). */
export interface ConsultarPersonalQuery {
  id?: ValorPaginacion
  estado?: EstadoSocioDeNegocio
  estadoRegistro?: EstadoRegistro
  origen?: OrigenSocioDeNegocio
  numeroDocumento?: string
  primerNombre?: string
  segundoNombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  /** Filtra personal por una cuenta o contrato asignado (codigo de Configuración General). */
  configuracionCodigo?: string
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

export interface ConsultarEventosSocioDeNegocioQuery {
  estado?: EstadoEventoSocioDeNegocio
  direccion?: DireccionEventoSocioDeNegocio
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
  direccion?: DireccionEventoSocioDeNegocio
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
  existe: boolean
  cliente?: SocioDeNegocioResponse | null
}
