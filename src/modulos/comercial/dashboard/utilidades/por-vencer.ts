// Utilidad del modulo Comercial / Dashboard (BC-03, Fase 1).
// Funciones puras: sin fetch, sin React, sin efectos. Calculan en el cliente
// que cotizaciones ENVIADA vencen dentro de las proximas `horas` (design D6).
//
// DEUDA Fase 1: mover a bucket porVencer del backend (Fase 2)
// Este archivo es la unica deuda de negocio en cliente del change: aislado,
// autocontenido y trivialmente removible cuando el backend exponga el bucket
// `porVencer` — no calcula dinero ni win rate, solo compara fechas.

/**
 * `true` si `fechaVencimiento` cae dentro de las `horas` siguientes a `ahora`
 * (ventana `[ahora, ahora + horas]`, ambos extremos inclusive). Cotizaciones
 * ya vencidas (`fechaVencimiento` en el pasado) NO cuentan como "por vencer".
 */
export function esPorVencer(
  fechaVencimiento: string | null,
  ahora: Date,
  horas = 72
): boolean {
  if (!fechaVencimiento) return false;

  const vencimiento = new Date(fechaVencimiento);
  if (Number.isNaN(vencimiento.getTime())) return false;

  const diferenciaMs = vencimiento.getTime() - ahora.getTime();
  const limiteMs = horas * 60 * 60 * 1000;

  return diferenciaMs >= 0 && diferenciaMs <= limiteMs;
}

/**
 * Filtra `items` a los que estan "por vencer" segun `esPorVencer`. `ahora` es
 * inyectable (default `new Date()`) para mantener la funcion pura y testeable.
 */
export function filtrarPorVencer<T extends { fechaVencimiento: string | null }>(
  items: T[],
  ahora: Date = new Date(),
  horas = 72
): T[] {
  return items.filter((item) => esPorVencer(item.fechaVencimiento, ahora, horas));
}
