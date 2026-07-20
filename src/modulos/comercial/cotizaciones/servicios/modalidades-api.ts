import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  FiltrosModalidades,
  PayloadActualizarModalidad,
  PayloadCrearModalidad,
  RespuestaPaginadaModalidades,
} from "../tipos/cotizaciones.tipos";

// GET /modalidades — catalogo de modalidades
export async function listarModalidades(
  filtros: FiltrosModalidades = {}
): Promise<RespuestaPaginadaModalidades> {
  const { data } = await clienteComercial.get<RespuestaPaginadaModalidades>(
    "/modalidades",
    { params: filtros }
  );
  return data;
}

// POST /modalidades — crear una nueva modalidad (201)
export async function crearModalidad(
  payload: PayloadCrearModalidad
): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    "/modalidades",
    payload
  );
  return data;
}

// PATCH /modalidades/:id — actualizar campos de la modalidad (204)
export async function actualizarModalidad(
  id: string,
  payload: PayloadActualizarModalidad
): Promise<void> {
  await clienteComercial.patch(`/modalidades/${id}`, payload);
}

// PATCH /modalidades/:id/estado — activar o desactivar (204)
export async function cambiarEstadoModalidad(
  id: string,
  payload: { accion: "ACTIVAR" | "DESACTIVAR" }
): Promise<void> {
  await clienteComercial.patch(`/modalidades/${id}/estado`, payload);
}
