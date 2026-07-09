import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  PayloadAprobar,
  PayloadObservar,
  PayloadRechazar,
  RespuestaPaginadaAprobaciones,
  SolicitudAprobacion,
} from "../tipos/aprobaciones.tipos";

// POST /aprobaciones/:id/aprobar → 204
export async function aprobarSolicitud(
  id: string,
  payload?: PayloadAprobar
): Promise<void> {
  await clienteComercial.post(`/aprobaciones/${id}/aprobar`, payload ?? {});
}

// POST /aprobaciones/:id/rechazar → 204
export async function rechazarSolicitud(
  id: string,
  payload: PayloadRechazar
): Promise<void> {
  await clienteComercial.post(`/aprobaciones/${id}/rechazar`, payload);
}

// POST /aprobaciones/:id/observar → 204
export async function observarSolicitud(
  id: string,
  payload: PayloadObservar
): Promise<void> {
  await clienteComercial.post(`/aprobaciones/${id}/observar`, payload);
}

// GET /aprobaciones/pendientes → 200 { data, total, pagina, porPagina }
export async function listarPendientes(params: {
  pagina: number;
  porPagina: number;
}): Promise<RespuestaPaginadaAprobaciones> {
  const { data } = await clienteComercial.get<RespuestaPaginadaAprobaciones>(
    "/aprobaciones/pendientes",
    { params }
  );
  return data;
}

// GET /cotizaciones/:id/aprobaciones → 200 SolicitudAprobacion[]
export async function obtenerHistorialAprobaciones(
  idCotizacion: string
): Promise<SolicitudAprobacion[]> {
  const { data } = await clienteComercial.get<SolicitudAprobacion[]>(
    `/cotizaciones/${idCotizacion}/aprobaciones`
  );
  return data;
}
