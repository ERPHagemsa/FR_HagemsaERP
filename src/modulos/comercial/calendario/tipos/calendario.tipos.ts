// Tipos del modulo Comercial / Calendario (feed de Cotizaciones Ganadas, BC03).
// Solo declaraciones de tipo — sin imports de runtime. Reflejan el contrato de
// GET /cotizaciones/ganadas/calendario (ver docs/api/API-Cotizaciones.md en BC03).

/**
 * Evento de calendario: una Cotizacion GANADA ubicada por su fecha de inicio
 * de servicio. `fin` es `null` cuando el servicio es de un solo dia (sin
 * fecha de fin). `enlace` es una URL absoluta armada por el backend
 * (FRONTEND_URL + ruta); el front NO la parsea para navegar — usa `id` para
 * construir la ruta interna `/comercial/cotizaciones/:id` (ver design riesgo 4).
 */
export type EventoCalendario = {
  id: string;
  titulo: string;
  inicio: string;
  fin: string | null;
  enlace: string;
};

/** Rango de fechas (ISO date, `yyyy-MM-dd`) pedido al feed del calendario. */
export type RangoCalendario = {
  desde: string;
  hasta: string;
};
