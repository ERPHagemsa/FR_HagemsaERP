import { clienteComercial } from "@/compartido/api/clientes-backend";

import type { PayloadRegistrarSC } from "../tipos/cotizaciones.tipos";

// ---------------------------------------------------------------------------
// Solicitudes de Cliente
// ---------------------------------------------------------------------------

// POST /solicitudes-cliente → 201
// Respuesta: { id: string (SC), idCotizacion: string (cotizacion BORRADOR auto-creada) }
export async function registrarSolicitudCliente(
  payload: PayloadRegistrarSC
): Promise<{ id: string; idCotizacion: string }> {
  const { data } = await clienteComercial.post<{ id: string; idCotizacion: string }>(
    "/solicitudes-cliente",
    payload
  );
  return data;
}
