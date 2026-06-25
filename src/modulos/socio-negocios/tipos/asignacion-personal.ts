import type { TipoRegimenPersonal } from "./tareo-personal"

export type TipoAsignacionCuentaContrato = "CUENTA" | "CONTRATO"

/** Estado operativo de la asignacion (propio del agregado, distinto al del socio). */
export type EstadoAsignacion = "VIGENTE" | "FINALIZADA" | "ANULADA"

/** Estado de aprobacion jerarquica de un detalle cuenta/contrato. */
export type EstadoAprobacionCuentaContrato =
  | "PENDIENTE_APROBACION"
  | "APROBADO"
  | "RECHAZADO"

export type AccionHistorialAsignacion =
  | "ASIGNACION_CREADA"
  | "ASIGNACION_MODIFICADA"
  | "CUENTAS_CONTRATOS_REEMPLAZADOS"
  | "ASIGNACION_FINALIZADA"
  | "ASIGNACION_ANULADA"

/**
 * Aprobador (firma) de un detalle cuenta/contrato. El backend solo recibe codigo
 * y nombre; el orden en el arreglo define `ordenAprobacion` (1, 2, 3...) y todas
 * quedan como firmas obligatorias y secuenciales. No se infiere jerarquia.
 */
export interface AprobadorCuentaContratoRequest {
  aprobadorCodigo: string
  aprobadorNombre: string
}

/**
 * Cuenta o contrato asociado a una asignacion de personal. El backend conserva
 * un snapshot del catalogo de configuracion general al momento de asignar.
 */
export interface CuentaContrato {
  tipo: TipoAsignacionCuentaContrato
  configuracionId: string
  /**
   * Respaldo temporal: solo si la cuenta/contrato aun no llego a la replica de
   * BC-01. Si la configuracion ya esta replicada, BC-01 resuelve codigo/nombre.
   */
  configuracionCodigo?: string
  configuracionNombre?: string
  estado?: EstadoAsignacion
  vigenteDesde: string
  vigenteHasta?: string
  orden?: number
  /**
   * Firmas requeridas para aprobar el detalle. Si se omite, el detalle nace
   * PENDIENTE_APROBACION sin firmas y no podra aprobarse hasta reemplazarlo con
   * aprobadores.
   */
  aprobadores?: AprobadorCuentaContratoRequest[]
}

export interface CrearAsignacionPersonalRequest {
  /** FK al SocioDeNegocio con rol PERSONAL. */
  personalId: number | string
  cargoId?: string
  sedeId?: string
  areaId?: string
  /**
   * Jefe directo. Se conserva solo por compatibilidad; BC-01 ya no lo valida
   * contra Configuracion General.
   */
  jefeId?: string
  /** Jefe/responsable como dato libre definido por el front (recomendado). */
  jefeCodigo?: string
  jefeNombre?: string
  /** Maestro interno de BC-01: forma de tareo (turno, horario, regimen, etc.). */
  tipoTareoId?: number | string
  /** Maestro interno de BC-01: configuracion laboral aplicable al tipo de tareo. */
  configuracionLaboralId?: number | string
  diasTrabajo?: number
  diasDescanso?: number
  horasPorDia?: number
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
  /** Compatibilidad; BC-01 ya no lo valida contra Configuracion General. */
  jefeId?: string | null
  /** Jefe/responsable como dato libre definido por el front (recomendado). */
  jefeCodigo?: string | null
  jefeNombre?: string | null
  tipoTareoId?: number | string | null
  configuracionLaboralId?: number | string | null
  diasTrabajo?: number | null
  diasDescanso?: number | null
  horasPorDia?: number | null
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

/**
 * Body para decidir (aprobar/rechazar) una firma de aprobacion de un detalle
 * cuenta/contrato. `motivoRechazo` solo aplica al rechazar.
 */
export interface DecidirAprobacionCuentaContratoRequest {
  usuarioId?: string
  comentario?: string
  motivoRechazo?: string
}

/**
 * Una decision de aprobacion jerarquica sobre un detalle cuenta/contrato. El
 * backend puede exigir uno o varios aprobadores (gerentes, cargos superiores o
 * responsables jerarquicos) en cierto `ordenAprobacion`.
 */
export interface CuentaContratoAprobacionResponse {
  id: number
  asignacionPersonalCuentaContratoId?: number
  aprobadorCodigo: string
  aprobadorNombre: string
  aprobadorCargoCodigo: string
  aprobadorCargoNombre: string
  aprobadorAreaCodigo: string
  aprobadorAreaNombre: string
  aprobadorNivelJerarquico: string
  ordenAprobacion: number
  esObligatorio: boolean
  estadoAprobacion: EstadoAprobacionCuentaContrato
  fechaDecision?: string
  usuarioDecisionId?: string
  motivoRechazo: string
  comentario: string
  fechaCreacion?: string
  usuarioCreacion?: string
  fechaModificacion?: string
  usuarioModificacion?: string
}

export interface CuentaContratoResponse {
  id: number
  asignacionPersonalId?: number
  tipo: TipoAsignacionCuentaContrato
  configuracionId?: string | number
  configuracionCodigo: string
  configuracionNombre: string
  /**
   * Jerarquía resuelta por el backend en el snapshot: padre directo (CUENTA o
   * CONTRATO) y cuenta raíz a la que pertenece. Permite agrupar los contratos
   * bajo su cuenta sin reconstruir la relación desde Configuración General.
   */
  configuracionPadreTipo?: TipoAsignacionCuentaContrato
  configuracionPadreCodigo?: string
  configuracionPadreNombre?: string
  cuentaRaizCodigo?: string
  cuentaRaizNombre?: string
  nivelCuentaContrato?: number
  estado: EstadoAsignacion
  // Flujo de aprobacion jerarquica: el detalle nace PENDIENTE_APROBACION y solo
  // es operativo cuando queda APROBADO. Los campos `aprobador*` resumen al
  // aprobador actual/efectivo; `aprobaciones` trae el detalle de cada decision.
  estadoAprobacion?: EstadoAprobacionCuentaContrato
  aprobadorCodigo?: string
  aprobadorNombre?: string
  aprobadorCargoCodigo?: string
  aprobadorCargoNombre?: string
  aprobadorAreaCodigo?: string
  aprobadorAreaNombre?: string
  aprobadorNivelJerarquico?: string
  motivoRechazo?: string
  aprobaciones?: CuentaContratoAprobacionResponse[]
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
  cargoCodigo?: string
  cargoNombre?: string
  sedeCodigo?: string
  sedeNombre?: string
  areaCodigo?: string
  areaNombre?: string
  jefeCodigo?: string
  jefeNombre?: string
  // Copia historica canonica del tareo resuelto al momento de asignar. El backend
  // expone codigos/nombres del tipo y de la configuracion (turno, horario o regimen
  // segun el tipo), ademas del patron y la carga (dias/horas).
  tipoTareoId?: number
  configuracionLaboralId?: number
  tipoTareoCodigo?: string
  tipoTareoNombre?: string
  configuracionLaboralCodigo?: string
  configuracionLaboralNombre?: string
  tipoRegimen?: TipoRegimenPersonal
  turnoCodigo?: string
  turnoNombre?: string
  horarioCodigo?: string
  horarioNombre?: string
  regimenCodigo?: string
  regimenNombre?: string
  regimenPatron?: string
  diasTrabajo?: number
  diasDescanso?: number
  horasPorDia?: number
  estado: EstadoAsignacion
  vigenteDesde: string
  vigenteHasta?: string
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string
  usuarioModificacion: string
  cuentasContratos: CuentaContratoResponse[]
}

/** Tipos de dato maestro de Configuracion General asignables en BC-01. */
export type TipoDatoMaestroAsignable =
  | "CARGO"
  | "SEDE"
  | "AREA"
  | "CUENTA"
  | "CONTRATO"

/**
 * Opcion de Configuracion General tal como la entrega BC-01 (forma simple para
 * combos). No incluye datos geograficos (departamento/provincia/distrito) ni
 * `sedeId`; para eso usar el BC de Configuracion General directamente.
 */
export interface ConfiguracionGeneralOpcionResponse {
  id: string
  tipoDatoMaestro: TipoDatoMaestroAsignable
  codigo: string
  nombre: string
  estado: string
  estadoRegistro: string
  contratoPadreId?: string
  nivelCuentaContrato?: number
  cargoSuperiorId?: string
  cargoSuperiorCodigo?: string
  cargoSuperiorNombre?: string
  nivelArea?: string
  gerenciaId?: string
  gerenciaCodigo?: string
  gerenciaNombre?: string
}

/**
 * Filtros para `GET /asignaciones-personal/configuracion-general/opciones`. Sirve
 * para recargar/buscar un combo puntual sin volver a pedir todo el formulario.
 * `tiposDatoMaestro` permite traer varios tipos en una sola request
 * (ej. `["CARGO", "SEDE", "AREA"]`).
 */
export interface ConsultarConfiguracionGeneralOpcionesQuery {
  tipoDatoMaestro?: TipoDatoMaestroAsignable
  tiposDatoMaestro?: TipoDatoMaestroAsignable[]
  busqueda?: string
  soloActivos?: boolean
}

/** Opcion simple de catalogo (codigo/nombre) para combos de disponibilidad. */
export interface OpcionCatalogoFormulario {
  codigo: string
  nombre: string
  descripcion?: string
}

/**
 * Respuesta consolidada para inicializar el formulario de asignacion en una sola
 * llamada (`GET /asignaciones-personal/opciones-formulario`). Evita pedir combo
 * por combo a Configuracion General y a los maestros internos.
 */
export interface OpcionesFormularioAsignacionResponse {
  cargos: ConfiguracionGeneralOpcionResponse[]
  sedes: ConfiguracionGeneralOpcionResponse[]
  areas: ConfiguracionGeneralOpcionResponse[]
  cuentas: ConfiguracionGeneralOpcionResponse[]
  contratos: ConfiguracionGeneralOpcionResponse[]
  tiposTareo: import("./tareo-personal").TipoTareoPersonalResponse[]
  configuracionesLaborales: import("./tareo-personal").ConfiguracionLaboralPersonalResponse[]
  estadosDisponibilidad: OpcionCatalogoFormulario[]
  origenesDisponibilidad: OpcionCatalogoFormulario[]
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
