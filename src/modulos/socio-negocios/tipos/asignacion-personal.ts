export type TipoAsignacionCuentaContrato = "CUENTA" | "CONTRATO"

/** Estado operativo de la asignacion (propio del agregado, distinto al del socio). */
export type EstadoAsignacion = "VIGENTE" | "FINALIZADA" | "ANULADA"

/** Estado de aprobacion de la asignacion (propio del agregado, distinto al del socio). */
export type EstadoAprobacionAsignacion = "PENDIENTE" | "APROBADA" | "RECHAZADA"

export type AccionHistorialAsignacion =
  | "ASIGNACION_CREADA"
  | "ASIGNACION_MODIFICADA"
  | "CUENTAS_CONTRATOS_REEMPLAZADOS"
  | "ASIGNACION_APROBADA"
  | "ASIGNACION_RECHAZADA"
  | "ASIGNACION_FINALIZADA"
  | "ASIGNACION_ANULADA"

/**
 * Cuenta o contrato asociado a una asignacion de personal. El backend conserva
 * un snapshot del catalogo de configuracion general al momento de asignar.
 */
export interface CuentaContrato {
  tipo: TipoAsignacionCuentaContrato
  configuracionId: string
  estado?: EstadoAsignacion
  vigenteDesde: string
  vigenteHasta?: string
  orden?: number
}

export interface CrearAsignacionPersonalRequest {
  /** FK al SocioDeNegocio con rol PERSONAL. */
  personalId: number | string
  cargoId?: string
  sedeId?: string
  areaId?: string
  aprobadorId?: string
  fechaAprobacion?: string
  estadoAprobacion?: EstadoAprobacionAsignacion
  estado?: EstadoAsignacion
  vigenteDesde: string
  vigenteHasta?: string
  usuarioId?: string
  cuentasContratos?: CuentaContrato[]
}

/** En modificacion, `null` limpia explicitamente el campo. */
export interface ModificarAsignacionPersonalRequest {
  cargoId?: string | null
  sedeId?: string | null
  areaId?: string | null
  estado?: EstadoAsignacion
  vigenteDesde?: string
  vigenteHasta?: string | null
  usuarioId?: string
}

/** Reemplaza por completo el set de cuentas/contratos de la asignacion. */
export interface ReemplazarCuentasContratosRequest {
  usuarioId?: string
  cuentasContratos: CuentaContrato[]
}

export interface AprobarAsignacionPersonalRequest {
  aprobadorId: string
  fechaAprobacion?: string
}

export interface CuentaContratoResponse {
  id: number
  asignacionPersonalId?: number
  tipo: TipoAsignacionCuentaContrato
  configuracionCodigo: string
  configuracionNombre: string
  snapshotJson: unknown
  estado: EstadoAsignacion
  vigenteDesde: string
  vigenteHasta?: string
  orden?: number
  fechaCreacion?: string
  usuarioCreacion?: string
  fechaModificacion?: string
  usuarioModificacion?: string
}

export interface AsignacionPersonalResponse {
  id: number
  personalId: number
  cargoNombre?: string
  sedeNombre?: string
  areaNombre?: string
  aprobadorId?: string
  fechaAprobacion?: string
  estadoAprobacion: EstadoAprobacionAsignacion
  snapshotJson: unknown
  estado: EstadoAsignacion
  vigenteDesde: string
  vigenteHasta?: string
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string
  usuarioModificacion: string
  cuentasContratos: CuentaContratoResponse[]
}

export interface AsignacionPersonalHistorialResponse {
  id: string
  asignacionPersonalId: number
  entidad: string
  entidadId?: number
  accion: AccionHistorialAsignacion
  fechaAccion: string
  usuarioAccion: string
  datosAnteriores?: unknown
  datosNuevos?: unknown
}
