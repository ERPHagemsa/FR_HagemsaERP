// Formateadores puros compartidos por la vista de detalle y el diálogo de
// detalles de cotización. Sin dependencias de React: solo transforman valores.

export function formatearOrigenTipo(tipo: string) {
  return tipo === "PROSPECTO"
    ? "Prospecto"
    : tipo === "CLIENTE"
      ? "Cliente"
      : tipo;
}

export function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatearFechaHora(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
