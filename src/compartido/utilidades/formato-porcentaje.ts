// Formateo de fracciones (0..1) como porcentaje (dashboard comercial,
// cambio dashboard-kpis-motivos-respuesta-front). Hermano de
// formato-moneda.ts: funcion pura, sin React, sin dependencias.
//
// Recibe SIEMPRE una FRACCION 0..1 (winRate, ranking.winRate). Valores que ya
// vienen en escala 0..100 en el backend (ej. `margenPct` de
// kpis-consolidado, donde `20` significa `20%` — verificado contra
// obtener-kpis-consolidados.use-case.ts) deben convertirse a fraccion (/100)
// ANTES de llamar a este helper, con una variable nombrada que deje
// explicito el porque de esa division: no adivina la unidad por si mismo.

export function formatearPorcentaje(
  fraccion: number | null,
  opciones?: { decimales?: number; textoSinDatos?: string }
): string {
  if (fraccion === null) {
    return opciones?.textoSinDatos ?? "Sin datos";
  }
  return `${(fraccion * 100).toFixed(opciones?.decimales ?? 1)}%`;
}
