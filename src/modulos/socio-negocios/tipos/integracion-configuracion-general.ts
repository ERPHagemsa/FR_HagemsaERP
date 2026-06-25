// Integracion entrante: BC14 (Configuracion General) notifica a BC01 que un
// dato maestro fue creado/actualizado. BC01 lo persiste como evento de dominio
// pendiente para refrescar los snapshots de las asignaciones.

export type TipoDatoMaestroConfiguracionGeneral =
  | "CARGO"
  | "SEDE"
  | "AREA"
  | "CUENTA"
  | "CONTRATO"
  | "JEFE"
  | "HORARIO"
  | "TURNO"
  | "REGIMEN"

export interface EventoConfiguracionGeneralRequest {
  eventoId: string
  nombre: string
  tipoDatoMaestro: TipoDatoMaestroConfiguracionGeneral
  configuracionId: string
  fechaEvento: string
  payload?: Record<string, unknown>
}

export type EstadoEventoIntegracion = "PENDIENTE" | "PROCESADO" | "ERROR"

export interface EventoConfiguracionGeneralRegistradoResponse {
  id: string
  eventoId: string
  estado: EstadoEventoIntegracion
}
