// Formateadores puros compartidos por la vista de detalle y el diálogo de
// detalles de cotización. Sin dependencias de React: solo transforman valores.
//
// Los formateadores de fecha viven ahora en el helper del módulo y se
// reexportan aquí para no romper los imports existentes.

export {
  formatearFecha,
  formatearFechaHora,
  formatearFechaDeTimestamp,
} from "@/modulos/comercial/utilidades/formato-fecha";

export function formatearOrigenTipo(tipo: string) {
  return tipo === "PROSPECTO"
    ? "Prospecto"
    : tipo === "CLIENTE"
      ? "Cliente"
      : tipo;
}
