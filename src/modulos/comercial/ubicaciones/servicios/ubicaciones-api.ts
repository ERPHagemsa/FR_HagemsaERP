import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  PayloadCompletarUbicacion,
  Ubicacion,
  UbicacionTemporal,
  EstadoUbicacionTemporal,
} from "../tipos/ubicaciones.tipos";

// El backend envuelve los listados en { data: [...] }.
interface RespuestaLista<T> {
  data: T[];
}

// GET /ubicaciones/temporales?idCotizacion=&estado=
// Ubicaciones temporales de una cotización (la bandeja "por completar" usa PENDIENTE).
export async function listarUbicacionesTemporales(
  idCotizacion: string,
  estado?: EstadoUbicacionTemporal
): Promise<UbicacionTemporal[]> {
  const { data } = await clienteComercial.get<RespuestaLista<UbicacionTemporal>>(
    "/ubicaciones/temporales",
    { params: { idCotizacion, estado } }
  );
  return data.data;
}

// PATCH /ubicaciones/temporales/:id/completar — completa datos (solo cotización
// GANADA). La dedup contra BC-14 la resuelve la fase final (PUB/SUB), no acá.
// Devuelve la temporal actualizada.
export async function completarUbicacionTemporal(
  id: string,
  payload: PayloadCompletarUbicacion
): Promise<UbicacionTemporal> {
  const { data } = await clienteComercial.patch<UbicacionTemporal>(
    `/ubicaciones/temporales/${id}/completar`,
    payload
  );
  return data;
}

// GET /ubicaciones?busqueda= — maestra local (réplica confirmada de BC-14).
export async function listarUbicaciones(
  busqueda?: string
): Promise<Ubicacion[]> {
  const { data } = await clienteComercial.get<RespuestaLista<Ubicacion>>(
    "/ubicaciones",
    { params: { busqueda } }
  );
  return data.data;
}
