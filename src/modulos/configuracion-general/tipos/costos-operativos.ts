import type {
  EstadoDatoMaestro,
  EstadoRegistro,
  PaginatedResponse,
} from "./configuracion-general"

export type { PaginatedResponse }

// ---------------------------------------------------------------------------
// Costos operativos del viaje
//
// Modelo:
//   - Modalidad de entrega (modalidad_entrega): catalogo que describe la
//     modalidad/rapidez de entrega (antes era el enum tipoServicio).
//   - Concepto (concepto_costo_operativo): que costo existe y como se comporta.
//     Si tiene comidas, es de alimentacion (desayuno/almuerzo/cena).
//   - Costo operativo (costo_operativo): paquete por ruta + cuenta/contrato +
//     modalidad, con vigencia temporal (fechaInicio/fechaFin).
//   - Linea (costo_operativo_concepto): concepto marcado con su tarifa. Si es
//     alimentacion, el importe se desglosa por comida.
//
// BC14 gobierna la configuracion y ademas CALCULA el total via
// GET /costos-operativos/calcular. Caja hace la rendicion (consumo real).
// ---------------------------------------------------------------------------

// FIJO se cobra una vez; VARIABLE cambia en el tiempo (por dia).
export type NaturalezaConcepto = "FIJO" | "VARIABLE"
// A que se imputa: vehiculo, conductor/operador, o servicio.
export type BaseImputacion = "UNIDAD" | "PERSONA" | "SERVICIO"
// Cada cuanto se genera el costo. El "a quien multiplica" lo aporta baseImputacion.
export type FrecuenciaCosto = "POR_VIAJE" | "POR_DIA" | "POR_SERVICIO"
// Que dato del paquete usar como cantidad. DIA = diasViatico; NOCHE =
// nochesViatico. nochesViatico no se deriva de diasViatico (no es dias - 1).
export type BaseConteo = "DIA" | "NOCHE"
// Comidas de un concepto de alimentacion.
export type TipoComida = "DESAYUNO" | "ALMUERZO" | "CENA"
// Modalidad de entrega: solo diferencia el paquete (fija, no administrable).
export type ModalidadEntrega = "NORMAL" | "EXPRESS"
// Tipo de carga fijo para costo: general o dimensionado.
export type TipoCargaCosto = "GENERAL" | "DIMENSIONADO"

// --- Catalogo de conceptos ------------------------------------------------

export interface ComidaConcepto {
  tipoComida: TipoComida
  montoReferencial: number
  moneda?: string
  baseConteo?: BaseConteo
}

export interface ComidaConceptoResponse {
  tipoComida: TipoComida
  montoReferencial: number
  moneda: string
  baseConteo: BaseConteo
}

export interface ConceptoCostoResponse {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  naturaleza: NaturalezaConcepto
  baseImputacion: BaseImputacion
  frecuencia: FrecuenciaCosto
  baseConteo: BaseConteo
  montoReferencial?: number | null
  moneda?: string
  esAlimentacion: boolean
  comidas: ComidaConceptoResponse[]
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
  frecuencia?: FrecuenciaCosto
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
  frecuencia: FrecuenciaCosto
  baseConteo?: BaseConteo
  montoReferencial?: number | null
  moneda?: string
  comidas?: ComidaConcepto[]
  usuarioCreacion?: string
}

export interface ModificarConceptoCostoRequest {
  nombre?: string
  descripcion?: string | null
  naturaleza?: NaturalezaConcepto
  baseImputacion?: BaseImputacion
  frecuencia?: FrecuenciaCosto
  baseConteo?: BaseConteo
  montoReferencial?: number | null
  moneda?: string
  comidas?: ComidaConcepto[]
  usuarioModificacion?: string
}

export interface InhabilitarConceptoCostoRequest {
  usuarioModificacion?: string
}

export interface HabilitarConceptoCostoRequest {
  usuarioModificacion?: string
}

// --- Checklist (pantalla ruta + cuenta/contrato + modalidad) ---------------

export interface LineaComidaResponse {
  tipoComida: TipoComida
  activo?: boolean
  monto: number
  moneda: string
  baseConteo: BaseConteo
  cantidad?: number | null
  override: boolean
}

export interface ChecklistItemCostoOperativo {
  id: number | null
  conceptoCostoOperativoId: number
  conceptoCodigo: string
  conceptoNombre: string
  naturaleza: NaturalezaConcepto
  baseImputacion: BaseImputacion
  frecuencia: FrecuenciaCosto
  baseConteo: BaseConteo
  esAlimentacion: boolean
  activo: boolean
  monto: number | null
  moneda: string
  comidas: LineaComidaResponse[]
}

export interface ChecklistCostoOperativoResponse {
  rutaId: number
  cuentaContratoId: number | null
  modalidadEntrega: ModalidadEntrega
  tipoCarga: TipoCargaCosto
  costoOperativoId: number | null
  diasViatico: number | null
  nochesViatico: number | null
  moneda: string
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
  frecuencia?: FrecuenciaCosto
  baseConteo?: BaseConteo
  esAlimentacion: boolean
  activo: boolean
  monto: number | null
  moneda: string
  comidas: LineaComidaResponse[]
}

export interface CostoOperativoResponse {
  id: number
  codigo?: string
  rutaId: number
  rutaNombre?: string | null
  cuentaContratoId: number | null
  cuentaContratoNombre?: string | null
  modalidadEntrega: ModalidadEntrega
  tipoCarga: TipoCargaCosto
  diasViatico: number | null
  nochesViatico: number | null
  moneda: string
  fechaInicio?: string
  fechaFin?: string | null
  estado: EstadoDatoMaestro
  estadoRegistro: EstadoRegistro
  fechaCreacion?: string
  usuarioCreacion?: string
  fechaModificacion?: string | null
  usuarioModificacion?: string | null
  lineas: LineaCostoOperativoResponse[]
}

export interface TramoCostoOperativoRequest {
  ubicacionDesdeId: number
  ubicacionHastaId: number
  horasBase: number
  distanciaKm?: number | null
  tiempoParadaHoras?: number | null
}

export interface GuardarTramosCostoOperativoRequest {
  tramos: TramoCostoOperativoRequest[]
  usuarioCreacion?: string
}

export interface TramoCostoOperativoResponse extends TramoCostoOperativoRequest {
  id: number
  orden: number
  ubicacionDesdeNombre: string
  ubicacionHastaNombre: string
}

export interface CalculoTiempoCostoOperativoResponse {
  costoOperativoId: number
  tipoUnidadId: number | null
  tipoUnidadNombre: string | null
  factorVelocidad: number
  horasPorDia: number
  horasBaseTotal: number
  horasTotal: number
  diasSugeridos: number
  nochesSugeridas: number
  tramos: Array<{
    orden: number
    ubicacionDesdeNombre: string
    ubicacionHastaNombre: string
    horasBase: number
    tiempoParadaHoras: number
    horas: number
  }>
}

export interface ConsultarCostosOperativosQuery {
  rutaId?: number
  cuentaContratoId?: number
  modalidadEntrega?: ModalidadEntrega
  tipoCarga?: TipoCargaCosto
  estado?: EstadoDatoMaestro
  estadoRegistro?: EstadoRegistro
  page?: number
  pageSize?: number
}

export interface LineaComidaRequest {
  tipoComida: TipoComida
  activo?: boolean
  monto: number
  moneda?: string
  baseConteo?: BaseConteo
  cantidad?: number | null
}

export interface LineaCostoOperativoRequest {
  conceptoId: number
  activo: boolean
  monto?: number | null
  moneda?: string
  baseConteo?: BaseConteo
  comidas?: LineaComidaRequest[]
}

export interface GuardarCostoOperativoRequest {
  rutaId: number
  cuentaContratoId?: number | null
  modalidadEntrega: ModalidadEntrega
  tipoCarga?: TipoCargaCosto
  diasViatico?: number | null
  nochesViatico?: number | null
  moneda?: string
  fechaInicio?: string | null
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
  frecuencia: FrecuenciaCosto
  baseConteo: BaseConteo
  esAlimentacion: boolean
  monto: number | null
  moneda: string
  comidas: LineaComidaResponse[]
}

export interface CostoVigenteResponse {
  costoOperativoId: number
  rutaId: number
  cuentaContratoId: number | null
  modalidadEntrega: ModalidadEntrega
  tipoCarga: TipoCargaCosto
  diasViatico: number | null
  nochesViatico: number | null
  moneda: string
  fechaInicio?: string
  fechaFin?: string | null
  lineas: LineaCostoVigenteResponse[]
}

// --- Calculo (la config aplica la formula) ---------------------------------

export interface CalcularCostoQuery {
  rutaId: number
  cuentaContratoId?: number | null
  modalidadEntrega: ModalidadEntrega
  tipoCarga?: TipoCargaCosto
  personas?: number
  unidades?: number
  fecha?: string
}

export interface CalculoComida {
  tipoComida: TipoComida
  baseConteo: BaseConteo
  monto: number
  cantidad: number
  subtotal: number
}

export interface CalculoLinea {
  conceptoCostoOperativoId: number
  conceptoCodigo: string
  conceptoNombre: string
  naturaleza: NaturalezaConcepto
  baseImputacion: BaseImputacion
  frecuencia: FrecuenciaCosto
  esAlimentacion: boolean
  cantidad: number | null
  monto: number | null
  comidas: CalculoComida[]
  subtotal: number
}

export interface CalculoCostoResponse {
  costoOperativoId: number
  rutaId: number
  cuentaContratoId: number | null
  modalidadEntrega: ModalidadEntrega
  tipoCarga: TipoCargaCosto
  personas: number
  unidades: number
  diasViatico: number | null
  nochesViatico: number | null
  moneda: string
  fecha: string
  lineas: CalculoLinea[]
  total: number
}
