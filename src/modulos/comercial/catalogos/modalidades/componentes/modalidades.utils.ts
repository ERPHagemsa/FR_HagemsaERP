// Mapas de etiquetas para los enums de Modalidad.

import type { Moneda, TipoModalidad, UnidadCobro } from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"

export const UNIDADES_COBRO: { valor: UnidadCobro; etiqueta: string }[] = [
  { valor: "VIAJE", etiqueta: "Viaje" },
  { valor: "DIA", etiqueta: "Dia" },
  { valor: "M2", etiqueta: "M²" },
  { valor: "SERVICIO", etiqueta: "Servicio" },
  { valor: "HORA", etiqueta: "Hora" },
  { valor: "TONELADA", etiqueta: "Tonelada" },
  { valor: "CONTENEDOR", etiqueta: "Contenedor" },
  { valor: "OTRO", etiqueta: "Otro" },
]

export const TIPOS_MODALIDAD: { valor: TipoModalidad; etiqueta: string }[] = [
  { valor: "SPOT", etiqueta: "Spot" },
  { valor: "PROYECTO", etiqueta: "Proyecto" },
  { valor: "OTRO", etiqueta: "Otro" },
]

export const MONEDAS: { valor: Moneda; etiqueta: string }[] = [
  { valor: "PEN", etiqueta: "Soles (PEN)" },
  { valor: "USD", etiqueta: "Dolares (USD)" },
]

export function etiquetaUnidadCobro(valor: UnidadCobro): string {
  return UNIDADES_COBRO.find((u) => u.valor === valor)?.etiqueta ?? valor
}

export function etiquetaTipoModalidad(valor: TipoModalidad): string {
  return TIPOS_MODALIDAD.find((t) => t.valor === valor)?.etiqueta ?? valor
}

export function etiquetaMoneda(valor: Moneda | null | undefined): string {
  if (!valor) return "—"
  return MONEDAS.find((m) => m.valor === valor)?.etiqueta ?? valor
}

// Formatea un importe a 2 decimales (es-PE). Sin moneda embebida: la columna
// Moneda la muestra aparte. Devuelve "—" cuando no hay valor.
export function formatearTarifa(valor: number | null): string {
  if (valor == null) return "—"
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

// Formatea un margen como porcentaje a 2 decimales. Devuelve "—" cuando no hay valor.
export function formatearMargen(valor: number | null): string {
  if (valor == null) return "—"
  return `${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)}%`
}
