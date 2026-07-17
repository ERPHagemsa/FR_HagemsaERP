// Conversion entre Date y string ISO de fecha ("YYYY-MM-DD"), operando SIEMPRE
// en la zona local. Se evita `Date.toISOString()` / `new Date("YYYY-MM-DD")`
// porque interpretan la fecha en UTC: en husos negativos (p. ej. Peru UTC-5)
// eso corre el dia hacia atras. Promovido desde el helper privado del formulario
// de solicitud, sin cambios de comportamiento.

// Date (partes locales) -> "YYYY-MM-DD".
export function aISODate(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// "YYYY-MM-DD" (o un datetime ISO cuya parte de fecha lo sea, p. ej.
// "2026-07-17T00:00:00.000Z") -> Date a medianoche local. Se toma SOLO la parte
// de fecha para no arrastrar el corrimiento de huso del componente horario.
// Devuelve undefined si no hay una fecha valida al inicio del string.
export function desdeISODate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!match) return undefined;
  const [, anio, mes, dia] = match;
  return new Date(Number(anio), Number(mes) - 1, Number(dia));
}
