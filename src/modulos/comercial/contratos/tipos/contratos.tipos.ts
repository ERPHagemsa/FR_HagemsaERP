// Tipos del modulo Contratos (BC-03). Espejo de las respuestas del backend
// (shapes crudas de los controllers: listas como { data, total, pagina, porPagina }).

import type { Moneda } from "@/modulos/comercial/tarifarios/tipos/tarifarios.tipos"

export type EstadoContrato = "ACTIVO" | "VENCIDO"

// Metadata del PDF firmado del contrato (HU-03-021), o null si aun no se subio.
export interface PdfContrato {
  nombre: string
  hash: string
  tamano: number
  fechaCarga: string
  usuarioCarga: string
}

// Detalle completo del contrato (GET /contratos/:id).
export interface Contrato {
  id: string
  idClienteExterno: string
  idCotizacionOrigen: string | null
  contratoOrigenId: string | null
  estado: EstadoContrato
  vigenciaInicio: string | null
  vigenciaFin: string | null
  pdf: PdfContrato | null
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string | null
}

// Fila del listado (GET /contratos) — sin el PDF, solo si existe.
export interface ContratoResumen {
  id: string
  idClienteExterno: string
  idCotizacionOrigen: string | null
  contratoOrigenId: string | null
  estado: EstadoContrato
  vigenciaInicio: string | null
  vigenciaFin: string | null
  tienePdf: boolean
  fechaCreacion: string
  fechaModificacion: string | null
}

export interface FiltrosContratos {
  estado?: EstadoContrato
  idClienteExterno?: string
  pagina?: number
  porPagina?: number
}

export interface RespuestaListaContratos {
  data: ContratoResumen[]
  total: number
  pagina: number
  porPagina: number
}

// El contrato nace de un tarifario (hereda cliente + cotizacion origen). Solo se
// envian los datos propios del contrato.
export interface PayloadCrearContratoDesdeTarifario {
  contratoOrigenId?: string
  vigenciaInicio?: string
  vigenciaFin?: string
}

// Una tarifa del tarifario consolidado del cliente (GET /contratos/tarifario-consolidado/:idClienteExterno).
export interface ItemTarifarioConsolidado {
  idContrato: string
  idTarifario: string
  idModalidad: string
  origen: string | null
  destino: string | null
  tipoVehiculo: string | null
  condicion: string | null
  precio: number
  moneda: Moneda
  tarifaStandbyDia: number | null
  vigenciaInicio: string | null
  vigenciaFin: string | null
}

export const ESTADOS_CONTRATO: ReadonlyArray<{
  valor: EstadoContrato
  etiqueta: string
}> = [
  { valor: "ACTIVO", etiqueta: "Activo" },
  { valor: "VENCIDO", etiqueta: "Vencido" },
]

export function etiquetaEstadoContrato(valor: EstadoContrato): string {
  return ESTADOS_CONTRATO.find((e) => e.valor === valor)?.etiqueta ?? valor
}
