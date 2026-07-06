import type {
  EstadoDatoMaestro,
  EstadoRegistro,
  PaginatedResponse,
} from "./configuracion-general"

export type { PaginatedResponse }

// ---------------------------------------------------------------------------
// Costos operativos del viaje
//
// Modelo en tres niveles:
//   - Concepto (concepto_costo_operativo): que costo existe y como se
//     comporta. Catalogo reutilizable.
//   - Costo operativo (costo_operativo): un paquete por par ruta +
//     cuenta/contrato. Uno solo activo por par.
//   - Linea (costo_operativo_concepto): dentro de un paquete, un concepto
//     marcado (activo) con su tarifa (monto, moneda).
//
// BC14 solo gobierna la configuracion. El calculo real lo hacen Operaciones
// y Caja consumiendo GET /costos-operativos/vigente.
// ---------------------------------------------------------------------------

// FIJO se cobra una vez; VARIABLE cambia en el tiempo (por dia).
export type NaturalezaConcepto = "FIJO" | "VARIABLE"
// A que se imputa: vehiculo, conductor/operador, o servicio.
export type BaseImputacion = "UNIDAD" | "PERSONA" | "SERVICIO"
// Clave de deduplicacion: cada cuanto se paga una sola vez.
export type UnidadDevengo = "VIAJE" | "DIA_PERSONA" | "DIA_UNIDAD" | "SERVICIO"
// Que dato del paquete usar como cantidad. DIA = diasViatico; NOCHE =
// nochesViatico. nochesViatico no se deriva de diasViatico (no es dias - 1):
// son dos datos independientes que el usuario informa a mano.
export type BaseConteo = "DIA" | "NOCHE"
// NORMAL y EXPRESS de la misma ruta+cuenta son paquetes separados.
export type TipoServicio = "NORMAL" | "EXPRESS"

// --- Catalogo de conceptos ------------------------------------------------

export interface ConceptoCostoResponse {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  naturaleza: NaturalezaConcepto
  baseImputacion: BaseImputacion
  unidadDevengo: UnidadDevengo
  baseConteo: BaseConteo
  // Tarifa unitaria sugerida (no el total del viaje). Prellena el checklist
  // cuando el par ruta + cuenta/contrato aun no tiene linea propia.
  montoReferencial?: number | null
  moneda?: string
  estado: EstadoDatoMaestro
  estadoRegistro: EstadoRegistro
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion?: string | null
  usuarioModificacion?: string | null
}

export interface ConsultarConceptosCostoQuery {
  codigo?: string
  nombre?: string
  naturaleza?: NaturalezaConcepto
  baseImputacion?: BaseImputacion
  unidadDevengo?: UnidadDevengo
  estado?: EstadoDatoMaestro
  estadoRegistro?: EstadoRegistro
  page?: number
  pageSize?: number
}

export interface RegistrarConceptoCostoRequest {
  nombre: string
  descripcion?: string | null
  naturaleza: NaturalezaConcepto
  baseImputacion: BaseImputacion
  unidadDevengo: UnidadDevengo
  baseConteo?: BaseConteo
  montoReferencial?: number | null
  moneda?: string
  usuarioCreacion?: string
}

export interface ModificarConceptoCostoRequest {
  nombre?: string
  descripcion?: string | null
  naturaleza?: NaturalezaConcepto
  baseImputacion?: BaseImputacion
  unidadDevengo?: UnidadDevengo
  baseConteo?: BaseConteo
  montoReferencial?: number | null
  moneda?: string
  usuarioModificacion?: string
}

export interface InhabilitarConceptoCostoRequest {
  usuarioModificacion?: string
}

export interface HabilitarConceptoCostoRequest {
  usuarioModificacion?: string
}

// --- Checklist (pantalla ruta + cuenta/contrato) --------------------------

export interface ChecklistItemCostoOperativo {
  // null cuando el concepto aun no tiene linea en este par.
  id: number | null
  conceptoCostoOperativoId: number
  conceptoCodigo: string
  conceptoNombre: string
  naturaleza: NaturalezaConcepto
  baseImputacion: BaseImputacion
  unidadDevengo: UnidadDevengo
  baseConteo: BaseConteo
  activo: boolean
  monto: number | null
  moneda: string
}

export interface ChecklistCostoOperativoResponse {
  rutaId: number
  cuentaContratoId: number
  tipoServicio: TipoServicio
  // null cuando el par aun no tiene paquete (alta nueva).
  costoOperativoId: number | null
  diasViatico: number | null
  nochesViatico: number | null
  items: ChecklistItemCostoOperativo[]
}

// --- Paquete (costo_operativo) ---------------------------------------------

export interface LineaCostoOperativoResponse {
  id: number
  conceptoCostoOperativoId: number
  conceptoCodigo?: string | null
  conceptoNombre?: string | null
  naturaleza?: NaturalezaConcepto
  baseImputacion?: BaseImputacion
  unidadDevengo?: UnidadDevengo
  baseConteo?: BaseConteo
  activo: boolean
  monto: number
  moneda: string
}

export interface CostoOperativoResponse {
  id: number
  rutaId: number
  rutaNombre?: string | null
  cuentaContratoId: number
  cuentaContratoNombre?: string | null
  tipoServicio: TipoServicio
  diasViatico: number | null
  nochesViatico: number | null
  estado: EstadoDatoMaestro
  estadoRegistro: EstadoRegistro
  fechaCreacion?: string
  usuarioCreacion?: string
  fechaModificacion?: string | null
  usuarioModificacion?: string | null
  lineas: LineaCostoOperativoResponse[]
}

export interface ConsultarCostosOperativosQuery {
  rutaId?: number
  cuentaContratoId?: number
  tipoServicio?: TipoServicio
  estado?: EstadoDatoMaestro
  estadoRegistro?: EstadoRegistro
  page?: number
  pageSize?: number
}

export interface LineaCostoOperativoRequest {
  conceptoId: number
  activo: boolean
  monto: number
  moneda?: string
}

export interface GuardarCostoOperativoRequest {
  rutaId: number
  cuentaContratoId: number
  tipoServicio?: TipoServicio
  diasViatico?: number | null
  nochesViatico?: number | null
  usuarioCreacion?: string
  lineas: LineaCostoOperativoRequest[]
}

export interface AnularCostoOperativoRequest {
  usuarioModificacion?: string
}

// --- Consumo (Operaciones / Caja) ------------------------------------------

export interface LineaCostoVigenteResponse {
  conceptoCostoOperativoId: number
  conceptoCodigo: string
  conceptoNombre: string
  naturaleza: NaturalezaConcepto
  baseImputacion: BaseImputacion
  unidadDevengo: UnidadDevengo
  baseConteo: BaseConteo
  monto: number
  moneda: string
}

export interface CostoVigenteResponse {
  costoOperativoId: number
  rutaId: number
  cuentaContratoId: number
  tipoServicio: TipoServicio
  diasViatico: number | null
  nochesViatico: number | null
  lineas: LineaCostoVigenteResponse[]
}
