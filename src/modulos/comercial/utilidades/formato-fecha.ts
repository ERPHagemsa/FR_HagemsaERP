// Formateadores de fecha compartidos por el modulo comercial. Centralizan lo
// que antes estaba duplicado en tablas, listados y vistas de detalle.
//
// Distincion clave (de aca sale el bug de corrimiento de un dia):
//
// - FECHA SOLA: el valor es "YYYY-MM-DD" (p. ej. fechaVencimiento, fechaRequerida,
//   vigencias). `new Date("YYYY-MM-DD")` lo interpreta como medianoche UTC; al
//   formatear en es-PE (Lima, UTC-5) retrocede un dia. Por eso se parsea con
//   `desdeISODate`, que toma solo la parte de fecha y arma un Date en zona LOCAL.
//
// - FECHA + HORA (timestamp ISO completo con hora/zona, p. ej. fechaCreacion,
//   fechaModificacion, fechaEnvio, fechaCarga): `new Date()` ya interpreta la
//   zona correctamente. NO se pasan por `desdeISODate`: eso borraria la hora y
//   ademas mostraria la fecha UTC en vez de la local del momento real. Se
//   mantiene `new Date()` intacto (con o sin hora en la salida).

import { desdeISODate } from "@/compartido/utilidades";

const FALLBACK = "—";

// Estilo "17/07/2026" (dia y mes con dos digitos). Coincide con lo que hoy
// muestran las tablas/vistas de cotizaciones, solicitudes y prospectos.
const fechaLarga = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Estilo "17/07/2026 09:30".
const fechaHoraLarga = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// FECHA SOLA. Parsea "YYYY-MM-DD" con `desdeISODate` para evitar el corrimiento
// de un dia. Devuelve el fallback si el valor es nulo/vacio o no es una fecha
// valida. Estilo "17/07/2026".
export function formatearFecha(fecha: string | null | undefined): string {
  const parseada = desdeISODate(fecha);
  return parseada ? fechaLarga.format(parseada) : FALLBACK;
}

// FECHA SOLA de vigencia. Mismo arreglo con `desdeISODate`, pero conserva el
// estilo compacto `toLocaleDateString` ("17/7/2026", sin ceros a la izquierda)
// que ya usaban los detalles y listados de contratos. Antes se emulaba con
// `timeZone: "UTC"` sobre `new Date`; `desdeISODate` lo resuelve sin ese truco.
export function formatearFechaVigencia(fecha: string | null | undefined): string {
  const parseada = desdeISODate(fecha);
  return parseada ? parseada.toLocaleDateString("es-PE") : FALLBACK;
}

// TIMESTAMP con hora. `new Date()` ya trae la zona; NO se usa `desdeISODate`.
// Estilo "17/07/2026 09:30".
export function formatearFechaHora(fecha: string | null | undefined): string {
  if (!fecha) return FALLBACK;
  const fechaObj = new Date(fecha);
  return Number.isNaN(fechaObj.getTime()) ? FALLBACK : fechaHoraLarga.format(fechaObj);
}

// TIMESTAMP mostrado solo como fecha (sin hora). Se mantiene `new Date()` para
// respetar la fecha LOCAL del momento real (p. ej. fechaCreacion, fechaEnvio,
// fechaCarga); NO se usa `desdeISODate`, que mostraria la fecha UTC.
//
// - por defecto: estilo "17/07/2026" (dos digitos), como en cotizaciones,
//   solicitudes y prospectos.
// - `{ compacta: true }`: estilo "17/7/2026" (`toLocaleDateString`), como en los
//   listados/detalles de contratos y tarifarios.
export function formatearFechaDeTimestamp(
  fecha: string | null | undefined,
  opciones?: { compacta?: boolean },
): string {
  if (!fecha) return FALLBACK;
  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return FALLBACK;
  return opciones?.compacta
    ? fechaObj.toLocaleDateString("es-PE")
    : fechaLarga.format(fechaObj);
}
