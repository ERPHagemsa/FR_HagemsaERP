import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  AccionesPendientesRespuesta,
  CicloCierreRespuesta,
  EmbudoConversionRespuesta,
  FiltrosDashboardAcciones,
  FiltrosDashboardPeriodoEjecutivo,
  FiltrosDashboardRanking,
  FiltrosDashboardTendencia,
  KpisConsolidadoRespuesta,
  MotivosPerdidaRespuesta,
  MotivosRespuestaClienteRespuesta,
  RankingEjecutivoRespuesta,
  TendenciaRespuesta,
} from "../tipos/dashboard.tipos";

// ---------------------------------------------------------------------------
// Tríada de acceso a datos del dashboard (design D1): 8 funciones raw, una
// por endpoint `/dashboard/*` de BC03, espejando el estilo de
// cotizaciones-api.ts (params opcionales, axios omite `undefined` del query
// string). Todos exigen `bc03:dashboard:leer` — aplicado backend-side.
// ---------------------------------------------------------------------------

// GET /dashboard/ciclo-cierre — promedio de días creación→cierre GANADA del período.
export async function obtenerCicloCierre(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
): Promise<CicloCierreRespuesta> {
  const { data } = await clienteComercial.get<CicloCierreRespuesta>(
    "/dashboard/ciclo-cierre",
    { params: filtros }
  );
  return data;
}

// GET /dashboard/tendencia-mensual — conteo de cotizaciones ganadas vs. perdidas
// a lo largo del período (desde/hasta) + ejecutivo. El backend decide la
// granularidad (día si el rango es corto, mes si es largo) y corta en hoy;
// devuelve `{ granularidad, puntos }`.
export async function obtenerTendenciaMensual(
  filtros: FiltrosDashboardTendencia = {}
): Promise<TendenciaRespuesta> {
  const { data } = await clienteComercial.get<TendenciaRespuesta>(
    "/dashboard/tendencia-mensual",
    { params: filtros }
  );
  return data;
}

// GET /dashboard/ranking-ejecutivos — ranking del equipo completo del período.
// Restricción verificada (design D-restricción): el use case IGNORA
// idEjecutivoResponsable aunque el DTO lo acepte. Esta función deliberadamente
// no expone ese filtro para no poder pasarlo por error.
export async function obtenerRankingEjecutivos(
  filtros: FiltrosDashboardRanking = {}
): Promise<RankingEjecutivoRespuesta[]> {
  const { data } = await clienteComercial.get<RankingEjecutivoRespuesta[]>(
    "/dashboard/ranking-ejecutivos",
    { params: filtros }
  );
  return data;
}

// GET /dashboard/motivos-perdida — desglose best-effort de motivos de pérdida del período.
export async function obtenerMotivosPerdida(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
): Promise<MotivosPerdidaRespuesta> {
  const { data } = await clienteComercial.get<MotivosPerdidaRespuesta>(
    "/dashboard/motivos-perdida",
    { params: filtros }
  );
  return data;
}

// GET /dashboard/embudo-conversion — solicitud→cotizada→enviada→ganada ("ever-reached") del período.
export async function obtenerEmbudoConversion(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
): Promise<EmbudoConversionRespuesta> {
  const { data } = await clienteComercial.get<EmbudoConversionRespuesta>(
    "/dashboard/embudo-conversion",
    { params: filtros }
  );
  return data;
}

// GET /dashboard/acciones-pendientes — 3 listas (porVencer72h/esperandoAprobacion/solicitudesSinCotizar).
// No es dependiente de período: usa siempre "ahora" para la ventana de 72h.
export async function obtenerAccionesPendientes(
  filtros: FiltrosDashboardAcciones = {}
): Promise<AccionesPendientesRespuesta> {
  const { data } = await clienteComercial.get<AccionesPendientesRespuesta>(
    "/dashboard/acciones-pendientes",
    { params: filtros }
  );
  return data;
}

// GET /dashboard/kpis-consolidado — actividad (por creación) + cerrado
// (por fecha de cierre, con margen) del período. Cambio
// dashboard-kpis-motivos-respuesta-front.
export async function obtenerKpisConsolidado(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
): Promise<KpisConsolidadoRespuesta> {
  const { data } = await clienteComercial.get<KpisConsolidadoRespuesta>(
    "/dashboard/kpis-consolidado",
    { params: filtros }
  );
  return data;
}

// GET /dashboard/motivos-respuesta-cliente — catálogo RECHAZO/NEGOCIACION
// elegido por el cliente (distinto del texto libre de motivos-perdida).
// Cambio dashboard-kpis-motivos-respuesta-front.
export async function obtenerMotivosRespuestaCliente(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
): Promise<MotivosRespuestaClienteRespuesta> {
  const { data } = await clienteComercial.get<MotivosRespuestaClienteRespuesta>(
    "/dashboard/motivos-respuesta-cliente",
    { params: filtros }
  );
  return data;
}
