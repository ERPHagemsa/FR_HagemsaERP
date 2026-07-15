// Formateo de montos en PEN/USD (design D9, dashboard Fase 2b).
// Promovido desde cotizaciones/componentes/lineas-grid.utils.ts:72-80 — mismo
// output (S/ / US$ + toLocaleString("es-PE"), 2 decimales), sin cambios de
// comportamiento. El call-site de Cotizaciones re-importa desde aca.

const SIMBOLO_MONEDA: Record<string, string> = { PEN: "S/", USD: "US$" };

export function formatearMoneda(monto: number, moneda: string): string {
  const simbolo = SIMBOLO_MONEDA[moneda] ?? "";
  return `${simbolo} ${monto.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
