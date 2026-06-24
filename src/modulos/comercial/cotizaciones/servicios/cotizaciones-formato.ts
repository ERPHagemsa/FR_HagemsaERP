import type { Moneda } from "../tipos/cotizaciones.tipos";

export function formatearMonto(monto: number | null, moneda: Moneda | null): string {
  if (monto == null) return "—";
  const valor = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);
  return moneda ? `${valor} ${moneda}` : valor;
}
