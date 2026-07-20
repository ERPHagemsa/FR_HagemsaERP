// Helper puro de delta monetario (design D12, tarea 2.2).
//
// A diferencia de win-rate/ciclo-cierre (delta ya calculado por backend,
// consumido directo — ver WinRateRespuesta/CicloCierreRespuesta), el endpoint
// kpis-monetarios solo expone los valores CRUDOS del período anterior en
// `variacionVsMesAnterior` (ver KpisMonetariosRespuesta). El frontend deriva
// el delta restando actual − anterior, por moneda, sin convertir PEN/USD
// entre sí (una sola llamada, sin doble fetch).
//
// Uso (dashboard-kpis-dinero.tsx, tarea 3.1) — una llamada por métrica:
//   calcularDeltaMonetario(actual.ganado, variacionVsMesAnterior.ganado)
//   calcularDeltaMonetario(actual.pipeline, variacionVsMesAnterior.pipeline)
//   calcularDeltaMonetario(actual.ticketPromedio, variacionVsMesAnterior.ticketPromedio)

import type { TotalPorMoneda } from "../tipos/dashboard.tipos";

export function calcularDeltaMonetario(
  actual: TotalPorMoneda,
  anterior: TotalPorMoneda
): TotalPorMoneda {
  return {
    pen: actual.pen - anterior.pen,
    usd: actual.usd - anterior.usd,
  };
}
