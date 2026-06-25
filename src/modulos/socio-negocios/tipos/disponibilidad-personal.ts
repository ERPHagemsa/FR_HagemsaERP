// Disponibilidad configurada del personal (esperada/informativa, NO asistencia
// real). Maestro operativo de BC-01 bajo /disponibilidades-personal-configuradas.
// El snapshot del horario (tipo tareo, configuracion laboral, regimen, etc.) lo
// copia BC-01 desde la asignacion; el front no lo envia.

import type { TipoRegimenPersonal } from "./tareo-personal"

/** Estado de disponibilidad. Catalogo viene en opciones-formulario. */
export type EstadoDisponibilidadPersonal =
  | "DISPONIBLE"
  | "VACACIONES"
  | "PERMISO"
  | "LICENCIA"
  | "DESCANSO_MEDICO"
  | "DESCANSO_PROGRAMADO"
  | "SUSPENSION"
  | "CAPACITACION"
  | "COMISION_SERVICIO"
  | "NO_DISPONIBLE"
  | "CONDICIONADO"

/** Origen de la disponibilidad. Catalogo viene en opciones-formulario. */
export type OrigenDisponibilidadPersonal =
  | "MANUAL"
  | "CONFIGURACION"
  | "SOLICITUD_EXTERNA"

/** Estado de registro (vigencia logica del registro). */
export type EstadoRegistroDisponibilidad = "ACTIVO" | "ANULADO"

export interface CrearDisponibilidadPersonalConfiguradaRequest {
  personalId: number | string
  asignacionPersonalId: number | string
  asignacionPersonalCuentaContratoId?: number | string | null
  estadoDisponibilidad: EstadoDisponibilidadPersonal
  /** Default MANUAL si se omite. */
  origen?: OrigenDisponibilidadPersonal
  /** Obligatorio. */
  motivo: string
  observacion?: string
  vigenteDesde?: string
  /** null = vigencia indefinida. */
  vigenteHasta?: string | null
  usuarioId?: string
}

/** En modificacion, `null` limpia explicitamente el campo cuando aplica. */
export interface ModificarDisponibilidadPersonalConfiguradaRequest {
  estadoDisponibilidad?: EstadoDisponibilidadPersonal
  origen?: OrigenDisponibilidadPersonal
  motivo?: string
  observacion?: string | null
  vigenteDesde?: string
  vigenteHasta?: string | null
  usuarioId?: string
}

export interface AnularDisponibilidadPersonalConfiguradaRequest {
  usuarioId?: string
}

export interface ConsultarDisponibilidadesPersonalConfiguradasQuery {
  personalId?: number | string
  asignacionPersonalId?: number | string
  estadoDisponibilidad?: EstadoDisponibilidadPersonal
  /** Default ACTIVO. */
  estadoRegistro?: EstadoRegistroDisponibilidad
}

/**
 * Respuesta. Los campos de snapshot del horario son de solo lectura: BC-01 los
 * copia desde la asignacion. Algunos pueden llegar como cadena vacia ("sin dato").
 */
export interface DisponibilidadPersonalConfiguradaResponse {
  id: number
  personalId: number
  asignacionPersonalId: number
  asignacionPersonalCuentaContratoId?: number
  estadoDisponibilidad: EstadoDisponibilidadPersonal
  origen: OrigenDisponibilidadPersonal
  motivo: string
  observacion: string
  vigenteDesde: string
  vigenteHasta?: string
  // Snapshot del horario copiado desde la asignacion (solo lectura).
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
  estadoRegistro: EstadoRegistroDisponibilidad
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string
  usuarioModificacion: string
}
