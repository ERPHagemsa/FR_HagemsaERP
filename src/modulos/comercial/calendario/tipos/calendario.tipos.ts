// Tipos del modulo Comercial / Calendario (feed de Cotizaciones Ganadas, BC03).
// Solo declaraciones de tipo — sin imports de runtime. Reflejan el contrato de
// GET /cotizaciones/ganadas/calendario (ver docs/api/API-Cotizaciones.md en BC03).

/**
 * Un transporte emparejado dentro de una seccion: la ruta (origen → destino),
 * la unidad y su cantidad. Es el par ruta↔unidad tal como lo cotizo el negocio;
 * una seccion puede tener varios.
 */
export type TransporteEvento = {
  /** "ORIGEN → DESTINO"; solo el presente si falta uno, "" si faltan ambos. */
  ruta: string;
  /** Nombre del tipo de unidad; puede ser "". */
  unidad: string;
  cantidad: number;
};

/**
 * Una seccion de la cotizacion vigente: su nombre, la tarifa (venta neta
 * post-descuento) y sus transportes. El total de la cotizacion es la suma de
 * las secciones (`EventoCalendario.total`), no se recalcula en el front.
 */
export type SeccionEvento = {
  nombre: string | null;
  tarifa: number;
  transportes: TransporteEvento[];
};

/**
 * Evento de calendario: una Cotizacion GANADA ubicada por su fecha de inicio
 * de servicio. `fin` es `null` cuando el servicio es de un solo dia (sin
 * fecha de fin). `enlace` es una URL absoluta armada por el backend
 * (FRONTEND_URL + ruta); el front NO la parsea para navegar — usa `id` para
 * construir la ruta interna `/comercial/cotizaciones/:id` (ver design riesgo 4).
 *
 * El desglose (`cliente`, `moneda`, `total`, `secciones`) viene de la version
 * vigente y alimenta la tarjeta del evento: el front solo lo pinta, no calcula
 * fechas ni montos de negocio.
 */
export type EventoCalendario = {
  id: string;
  titulo: string;
  inicio: string;
  fin: string | null;
  enlace: string;
  /** Ejecutivo responsable: el calendario colorea cada evento por este id. */
  idEjecutivoResponsable: string;
  /** Nombre del ejecutivo, para la leyenda de colores. */
  nombreEjecutivoResponsable: string;
  /** Nombre del solicitante (cliente) del servicio. */
  cliente: string;
  /** Moneda de la version vigente ("PEN" | "USD"). */
  moneda: string;
  /** Total de la cotizacion (version vigente); `null` si no hay vigente. */
  total: number | null;
  /** Desglose por seccion de la version vigente. */
  secciones: SeccionEvento[];
};

/** Rango de fechas (ISO date, `yyyy-MM-dd`) pedido al feed del calendario. */
export type RangoCalendario = {
  desde: string;
  hasta: string;
};
