// Helper puro de período (tarea 2.7, base del selector `DashboardSelectorPeriodo`,
// tarea 2.5): resuelve cada `PeriodoPreset` a un `RangoPeriodo` (ISO date,
// `yyyy-MM-dd`) calculado en cliente respecto a "ahora". Un rango custom no
// pasa por acá — el selector lo construye directo como `RangoPeriodo` desde el
// calendario en modo rango.

import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

import type { PeriodoPreset, RangoPeriodo } from "../tipos/dashboard.tipos";

const FORMATO_FECHA_API = "yyyy-MM-dd";

/**
 * Resuelve un `PeriodoPreset` a `{ desde, hasta }` ISO. `ahora` es inyectable
 * para tests/determinismo; por default usa la fecha actual del cliente.
 */
export function resolverPeriodoPreset(
  preset: PeriodoPreset,
  ahora: Date = new Date()
): RangoPeriodo {
  switch (preset) {
    case "este-mes":
      return {
        desde: format(startOfMonth(ahora), FORMATO_FECHA_API),
        hasta: format(endOfMonth(ahora), FORMATO_FECHA_API),
      };
    case "mes-anterior": {
      const mesAnterior = subMonths(ahora, 1);
      return {
        desde: format(startOfMonth(mesAnterior), FORMATO_FECHA_API),
        hasta: format(endOfMonth(mesAnterior), FORMATO_FECHA_API),
      };
    }
    case "ultimos-3-meses":
      return {
        desde: format(startOfMonth(subMonths(ahora, 2)), FORMATO_FECHA_API),
        hasta: format(endOfMonth(ahora), FORMATO_FECHA_API),
      };
    case "este-ano":
      return {
        desde: format(startOfYear(ahora), FORMATO_FECHA_API),
        hasta: format(endOfYear(ahora), FORMATO_FECHA_API),
      };
  }
}

export const ETIQUETAS_PERIODO_PRESET: Record<PeriodoPreset, string> = {
  "este-mes": "Este mes",
  "mes-anterior": "Mes anterior",
  "ultimos-3-meses": "Últimos 3 meses",
  "este-ano": "Este año",
};
