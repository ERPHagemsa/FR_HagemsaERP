import type { EstadoAsignacion } from "./asignacion-personal"

export type EstadoAprobacionChecklist =
  | "NO_APLICA"
  | "PENDIENTE"
  | "APROBADO"
  | "RECHAZADO"

export interface ConsultarPersonalChecklistQuery {
  numeroDocumento?: string
}

export interface AsignacionChecklistResponse {
  asignacionId: number
  cargo: string
  sede: string
  area: string
  estado: EstadoAsignacion
  estadoAprobacion: EstadoAprobacionChecklist
  vigenteDesde: string
  vigenteHasta?: string
}

export interface PersonalChecklistResponse {
  personalId: number
  primerNombre: string
  segundoNombre?: string
  apellidoPaterno: string
  apellidoMaterno?: string
  numeroDocumento: string
  cargo?: string
  asignaciones: AsignacionChecklistResponse[]
}
