import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  FiltrosCatalogosCargoAdicional,
  RespuestaPaginadaCatalogosCargoAdicional,
} from "../tipos/cotizaciones.tipos";

// GET /catalogos-cargo-adicional — catalogo de cargos adicionales (solo lectura)
export async function listarCatalogosCargoAdicional(
  filtros: FiltrosCatalogosCargoAdicional = {}
): Promise<RespuestaPaginadaCatalogosCargoAdicional> {
  const { data } = await clienteComercial.get<RespuestaPaginadaCatalogosCargoAdicional>(
    "/catalogos-cargo-adicional",
    { params: filtros }
  );
  return data;
}

// POST /catalogos-cargo-adicional — crear un nuevo item en el catalogo (201)
export async function crearCatalogoCargoAdicional(payload: {
  nombre: string;
  descripcion?: string;
}): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    "/catalogos-cargo-adicional",
    payload
  );
  return data;
}

// PATCH /catalogos-cargo-adicional/:id — actualizar nombre o descripcion (204)
export async function actualizarCatalogoCargoAdicional(
  id: string,
  payload: { nombre?: string; descripcion?: string }
): Promise<void> {
  await clienteComercial.patch(`/catalogos-cargo-adicional/${id}`, payload);
}

// PATCH /catalogos-cargo-adicional/:id/estado — activar o desactivar (204)
export async function cambiarEstadoCatalogoCargoAdicional(
  id: string,
  payload: { accion: "ACTIVAR" | "DESACTIVAR" }
): Promise<void> {
  await clienteComercial.patch(`/catalogos-cargo-adicional/${id}/estado`, payload);
}
