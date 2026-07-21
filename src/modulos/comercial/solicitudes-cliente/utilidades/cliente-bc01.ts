import type { ClienteBc01 } from "../tipos/solicitud-cliente.tipos";

// Un término solo de dígitos se busca como documento; si no, como nombre.
export const esDocumento = (t: string) => /^\d+$/.test(t.trim());

/**
 * Estado legible de un cliente de BC-01. Cruza los tres ejes que BC-01 maneja
 * por separado (estado, existencia y aprobación) en una sola etiqueta.
 *
 * Vive acá y no en cada buscador para que los dos —el de origen de la solicitud
 * y el del tarifario— no se contradigan si mañana cambia el criterio.
 */
export function etiquetaEstadoCliente(c: ClienteBc01): string {
  if (c.estado !== "ACTIVO" || c.estadoRegistro !== "ACTIVO") return "Inactivo";
  if (c.estadoAprobacion === "APROBADO") return "Activo";
  if (c.estadoAprobacion === "PENDIENTE_APROBACION") return "Pendiente aprob.";
  return "Rechazado";
}

/** Nombre a mostrar: razón social, y si no hay, el comercial. */
export function nombreCliente(c: ClienteBc01): string {
  return c.razonSocial ?? c.nombreComercial ?? "Sin nombre registrado";
}
