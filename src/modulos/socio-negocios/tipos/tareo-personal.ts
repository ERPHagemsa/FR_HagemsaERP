// Maestros internos de BC-01: tipo de tareo y configuracion laboral de personal.
// La asignacion los referencia con `tipoTareoId` y `configuracionLaboralId` y guarda
// una copia historica canonica al momento de asignar (ver asignacion-personal.ts).

/** Forma de tareo que define el tipo. El detalle exigible depende de este valor. */
export type FormaTareo = "POR_TURNO" | "POR_HORARIO" | "POR_REGIMEN"

/** Tipo de regimen laboral, independiente de la forma de tareo. */
export type TipoRegimenPersonal = "ADMINISTRATIVO" | "OPERATIVO"

/** Estado del maestro (distinto al EstadoAsignacion del agregado). */
export type EstadoMaestroTareo = "ACTIVO" | "INACTIVO"

// --- Tipo de tareo -------------------------------------------------------------

export interface TipoTareoPersonalResponse {
  id: number
  codigo: string
  nombre: string
  forma: FormaTareo
  tipoRegimen?: TipoRegimenPersonal
  descripcion: string
  estado: EstadoMaestroTareo
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string
  usuarioModificacion: string
}

export interface CrearTipoTareoPersonalRequest {
  codigo: string
  nombre: string
  forma: FormaTareo
  descripcion?: string
  usuarioId?: string
}

/** En modificacion, `null` limpia explicitamente el campo. `codigo`/`forma`-base no se reabren aqui. */
export interface ModificarTipoTareoPersonalRequest {
  nombre?: string
  forma?: FormaTareo
  descripcion?: string | null
  usuarioId?: string
}

export interface ConsultarTiposTareoPersonalQuery {
  estado?: EstadoMaestroTareo
  /** Busca por codigo o nombre. */
  q?: string
}

// --- Configuracion laboral -----------------------------------------------------
// Detalle laboral aplicable al tipo de tareo: turno, horario, regimen, feriados,
// nocturnidad, horas extra y vigencia.

export interface ConfiguracionLaboralPersonalResponse {
  id: number
  tipoTareoId: number
  /** Forma del tipo de tareo al que pertenece (turno, horario o regimen). */
  tipoTareoForma?: FormaTareo
  codigo: string
  nombre: string
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
  permiteTrabajoFeriado: boolean
  requiereAprobacionTrabajoFeriado: boolean
  esTurnoNocturno: boolean
  horaInicioNocturna?: string
  horaFinNocturna?: string
  permiteHorasExtra: boolean
  requiereAprobacionHorasExtra: boolean
  maxHorasExtraDia?: number
  maxHorasExtraSemana?: number
  vigenteDesde: string
  vigenteHasta?: string
  descripcion: string
  estado: EstadoMaestroTareo
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string
  usuarioModificacion: string
}

export interface CrearConfiguracionLaboralPersonalRequest {
  tipoTareoId: number | string
  codigo: string
  nombre: string
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
  permiteTrabajoFeriado?: boolean
  requiereAprobacionTrabajoFeriado?: boolean
  esTurnoNocturno?: boolean
  horaInicioNocturna?: string
  horaFinNocturna?: string
  permiteHorasExtra?: boolean
  requiereAprobacionHorasExtra?: boolean
  maxHorasExtraDia?: number
  maxHorasExtraSemana?: number
  vigenteDesde?: string
  vigenteHasta?: string
  usuarioId?: string
}

/** En modificacion, `null` limpia explicitamente el campo. `tipoTareoId`/`codigo` son inmutables. */
export interface ModificarConfiguracionLaboralPersonalRequest {
  nombre?: string
  tipoRegimen?: TipoRegimenPersonal
  turnoCodigo?: string | null
  turnoNombre?: string | null
  horarioCodigo?: string | null
  horarioNombre?: string | null
  horaInicio?: string | null
  horaFin?: string | null
  regimenCodigo?: string | null
  regimenNombre?: string | null
  regimenPatron?: string | null
  diasTrabajo?: number | null
  diasDescanso?: number | null
  horasPorDia?: number | null
  permiteTrabajoFeriado?: boolean
  requiereAprobacionTrabajoFeriado?: boolean
  esTurnoNocturno?: boolean
  horaInicioNocturna?: string | null
  horaFinNocturna?: string | null
  permiteHorasExtra?: boolean
  requiereAprobacionHorasExtra?: boolean
  maxHorasExtraDia?: number | null
  maxHorasExtraSemana?: number | null
  vigenteDesde?: string
  vigenteHasta?: string | null
  usuarioId?: string
}

export interface ConsultarConfiguracionesLaboralesPersonalQuery {
  tipoTareoId?: number | string
  estado?: EstadoMaestroTareo
  /** Busca por codigo o nombre. */
  q?: string
}

// --- Comun ---------------------------------------------------------------------

/** Body de activar/inactivar para ambos maestros. */
export interface CambiarEstadoTareoRequest {
  usuarioId?: string
  motivo?: string
}
