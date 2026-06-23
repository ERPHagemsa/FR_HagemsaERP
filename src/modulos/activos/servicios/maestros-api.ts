import { clienteActivos } from "@/compartido/api/clientes-backend";
import type {
  ActualizarValorCatalogoPayload,
  CambiarEstadoRegistroValorCatalogoPayload,
  CrearValorCatalogoPayload,
  FiltrosHistorialCatalogo,
  TipoCatalogoMaestro,
  ValorCatalogo,
  ValorCatalogoHistorial,
} from "../tipos/maestros.tipos";

export async function obtenerValoresCatalogo(
  tipoCatalogo: TipoCatalogoMaestro,
  estadoRegistro?: boolean
): Promise<ValorCatalogo[]> {
  const params = estadoRegistro !== undefined ? { estadoRegistro } : undefined;
  const { data } = await clienteActivos.get<ValorCatalogo[]>(
    `/activos/maestros/${tipoCatalogo}/valores`,
    { params }
  );
  return Array.isArray(data) ? data : [];
}

export async function crearValorCatalogo(
  tipoCatalogo: TipoCatalogoMaestro,
  payload: CrearValorCatalogoPayload
): Promise<ValorCatalogo> {
  const { data } = await clienteActivos.post<ValorCatalogo>(
    `/activos/maestros/${tipoCatalogo}/valores`,
    payload
  );
  return data;
}

export async function actualizarValorCatalogo(
  tipoCatalogo: TipoCatalogoMaestro,
  id: number,
  payload: ActualizarValorCatalogoPayload
): Promise<ValorCatalogo> {
  const { data } = await clienteActivos.patch<ValorCatalogo>(
    `/activos/maestros/${tipoCatalogo}/valores/${id}`,
    payload
  );
  return data;
}

export async function cambiarEstadoRegistroValorCatalogo(
  tipoCatalogo: TipoCatalogoMaestro,
  id: number,
  payload: CambiarEstadoRegistroValorCatalogoPayload
): Promise<ValorCatalogo> {
  const { data } = await clienteActivos.patch<ValorCatalogo>(
    `/activos/maestros/${tipoCatalogo}/valores/${id}/estado-registro`,
    payload
  );
  return data;
}

export async function obtenerHistorialCatalogo(
  filtros?: FiltrosHistorialCatalogo
): Promise<ValorCatalogoHistorial[]> {
  const { data } = await clienteActivos.get<ValorCatalogoHistorial[]>(
    "/activos/maestros/historial",
    { params: filtros }
  );
  return Array.isArray(data) ? data : [];
}
