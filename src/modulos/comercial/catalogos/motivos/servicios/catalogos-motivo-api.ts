import { clienteComercial } from "@/compartido/api/clientes-backend"

import type {
  FiltrosCatalogosMotivo,
  RespuestaPaginadaCatalogosMotivo,
  TipoMotivo,
} from "../tipos/motivos.tipos"

// GET /catalogos-motivo — lista admin (ACTIVO e INACTIVO), paginada.
export async function listarCatalogosMotivo(
  filtros: FiltrosCatalogosMotivo = {}
): Promise<RespuestaPaginadaCatalogosMotivo> {
  const { data } = await clienteComercial.get<RespuestaPaginadaCatalogosMotivo>(
    "/catalogos-motivo",
    { params: filtros }
  )
  return data
}

// POST /catalogos-motivo — crear (201). codigo y tipo se fijan al crear.
export async function crearCatalogoMotivo(payload: {
  codigo: string
  etiqueta: string
  tipo: TipoMotivo
  requiereDetalle?: boolean
  ordenSugerido?: number
}): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    "/catalogos-motivo",
    payload
  )
  return data
}

// PATCH /catalogos-motivo/:id — editar campos mutables (204).
export async function actualizarCatalogoMotivo(
  id: string,
  payload: {
    etiqueta?: string
    requiereDetalle?: boolean
    ordenSugerido?: number
  }
): Promise<void> {
  await clienteComercial.patch(`/catalogos-motivo/${id}`, payload)
}

// PATCH /catalogos-motivo/:id/estado — activar o desactivar (204).
export async function cambiarEstadoCatalogoMotivo(
  id: string,
  payload: { accion: "ACTIVAR" | "DESACTIVAR" }
): Promise<void> {
  await clienteComercial.patch(`/catalogos-motivo/${id}/estado`, payload)
}
