import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  Aprobador,
  FiltrosAprobaciones,
  PayloadAprobar,
  PayloadRechazar,
  RespuestaPaginadaAprobaciones,
  ResumenAprobaciones,
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

// GET /aprobaciones → 200 { data, total, pagina, porPagina }
// Todas las solicitudes, de cualquier estado. Omitir `estado` trae todas.
export async function listarAprobaciones(
  filtros: FiltrosAprobaciones
): Promise<RespuestaPaginadaAprobaciones> {
  const { data } = await clienteComercial.get<RespuestaPaginadaAprobaciones>(
    "/aprobaciones",
    { params: filtros }
  );
  return data;
}

// GET /aprobaciones/resumen → 200 { total, enAprobacion, aprobadas, rechazadas }
// No acepta `estado`: filtrarlo dejaria las otras tarjetas en cero.
export async function obtenerResumenAprobaciones(params: {
  usuarioResolucion?: string;
  numeroCotizacion?: number;
}): Promise<ResumenAprobaciones> {
  const { data } = await clienteComercial.get<ResumenAprobaciones>(
    "/aprobaciones/resumen",
    { params }
  );
  return data;
}

// GET /aprobaciones/aprobadores → 200 Aprobador[]
export async function listarAprobadores(): Promise<Aprobador[]> {
  const { data } = await clienteComercial.get<Aprobador[]>("/aprobaciones/aprobadores");
  return data;
}

// GET /cotizaciones/:id/aprobaciones → 200 SolicitudAprobacion[] (array pelado)
// En orden cronologico de creacion: el front NO reordena.
export async function obtenerHistorialAprobaciones(
  idCotizacion: string
): Promise<SolicitudAprobacion[]> {
  const { data } = await clienteComercial.get<SolicitudAprobacion[]>(
    `/cotizaciones/${idCotizacion}/aprobaciones`
  );
  return data;
}
