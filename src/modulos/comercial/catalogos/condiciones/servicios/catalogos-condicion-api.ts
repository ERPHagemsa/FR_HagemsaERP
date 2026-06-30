import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  FiltrosCatalogosCondicion,
  ParametroCondicion,
  RespuestaPaginadaCatalogosCondicion,
} from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos";

// GET /catalogos-condicion — lista todas las condiciones (admin: ACTIVO e INACTIVO)
export async function listarCatalogosCondicion(
  filtros: FiltrosCatalogosCondicion = {}
): Promise<RespuestaPaginadaCatalogosCondicion> {
  const { data } = await clienteComercial.get<RespuestaPaginadaCatalogosCondicion>(
    "/catalogos-condicion",
    { params: filtros }
  );
  return data;
}

// POST /catalogos-condicion — crear nueva condicion (201)
export async function crearCatalogoCondicion(payload: {
  titulo: string;
  texto: string;
  categoria: string;
  ordenSugerido?: number;
  esConstante?: boolean;
  parametros?: ParametroCondicion[];
}): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    "/catalogos-condicion",
    payload
  );
  return data;
}

// PATCH /catalogos-condicion/:id — actualizar campos (204)
export async function actualizarCatalogoCondicion(
  id: string,
  payload: {
    titulo?: string;
    texto?: string;
    categoria?: string;
    ordenSugerido?: number;
    esConstante?: boolean;
    parametros?: ParametroCondicion[];
  }
): Promise<void> {
  await clienteComercial.patch(`/catalogos-condicion/${id}`, payload);
}

// PATCH /catalogos-condicion/:id/estado — activar o desactivar (204)
export async function cambiarEstadoCatalogoCondicion(
  id: string,
  payload: { accion: "ACTIVAR" | "DESACTIVAR" }
): Promise<void> {
  await clienteComercial.patch(`/catalogos-condicion/${id}/estado`, payload);
}
