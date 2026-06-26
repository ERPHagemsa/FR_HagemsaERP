// Tipos del modulo Tarifarios (BC-03). Espejo de las respuestas del backend
// (shapes crudas de los controllers: listas como { data, total, pagina, porPagina }).

export type Moneda = "PEN" | "USD"
export type TipoOrigenTarifa = "COTIZACION" | "CONTRATO" | "MANUAL"
export type EstadoTarifario = "VIGENTE" | "ANULADO"

// Una fila de tarifa dentro del detalle del tarifario.
export interface Tarifa {
  id: string
  idModalidad: string
  origen: string | null
  destino: string | null
  tipoVehiculo: string | null
  condicion: string | null
  precio: number
  tarifaStandbyDia: number | null
  orden: number
}

// Detalle completo del tarifario (GET /tarifarios/:id).
export interface Tarifario {
  id: string
  tipoOrigen: TipoOrigenTarifa
  idCotizacionOrigen: string | null
  idContrato: string | null
  idClienteExterno: string | null
  nombreClienteExterno: string | null
  moneda: Moneda
  estado: EstadoTarifario
  vigenciaInicio: string | null
  vigenciaFin: string | null
  tarifas: Tarifa[]
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string | null
}

// Fila del listado (GET /tarifarios) — sin la coleccion de tarifas, solo su cantidad.
export interface TarifarioResumen {
  id: string
  tipoOrigen: TipoOrigenTarifa
  idCotizacionOrigen: string | null
  idContrato: string | null
  idClienteExterno: string | null
  nombreClienteExterno: string | null
  moneda: Moneda
  estado: EstadoTarifario
  vigenciaInicio: string | null
  vigenciaFin: string | null
  cantidadTarifas: number
  fechaCreacion: string
  fechaModificacion: string | null
}

export interface FiltrosTarifarios {
  tipoOrigen?: TipoOrigenTarifa
  estado?: EstadoTarifario
  idContrato?: string
  idCotizacionOrigen?: string
  idClienteExterno?: string
  pagina?: number
  porPagina?: number
}

export interface RespuestaListaTarifarios {
  data: TarifarioResumen[]
  total: number
  pagina: number
  porPagina: number
}

// Payload de una tarifa (al crear manual o al agregar al detalle).
export interface PayloadTarifa {
  idModalidad: string
  origen?: string
  destino?: string
  tipoVehiculo?: string
  condicion?: string
  precio: number
  tarifaStandbyDia?: number
  orden?: number
}

export interface PayloadCrearTarifarioManual {
  moneda?: Moneda
  idClienteExterno?: string
  nombreClienteExterno?: string
  vigenciaInicio?: string
  vigenciaFin?: string
  tarifas: PayloadTarifa[]
}

// Todos los campos opcionales (cambio parcial / enriquecimiento).
export type PayloadActualizarTarifa = Partial<PayloadTarifa>

export const MONEDAS: ReadonlyArray<{ valor: Moneda; etiqueta: string }> = [
  { valor: "PEN", etiqueta: "Soles (PEN)" },
  { valor: "USD", etiqueta: "Dolares (USD)" },
]

export const TIPOS_ORIGEN_TARIFA: ReadonlyArray<{
  valor: TipoOrigenTarifa
  etiqueta: string
}> = [
  { valor: "COTIZACION", etiqueta: "Cotizacion" },
  { valor: "CONTRATO", etiqueta: "Contrato" },
  { valor: "MANUAL", etiqueta: "Manual" },
]

export function etiquetaTipoOrigen(valor: TipoOrigenTarifa): string {
  return TIPOS_ORIGEN_TARIFA.find((t) => t.valor === valor)?.etiqueta ?? valor
}

export function etiquetaMoneda(valor: Moneda): string {
  return MONEDAS.find((m) => m.valor === valor)?.etiqueta ?? valor
}
