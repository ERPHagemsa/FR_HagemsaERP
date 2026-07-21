"use client";

import { useConsulta } from "@/compartido/api";

import {
  obtenerCicloCierre,
  obtenerEmbudoConversion,
  obtenerEsperandoRespuesta,
  obtenerKpisConsolidado,
  obtenerMotivosPerdida,
  obtenerRankingEjecutivos,
  obtenerTendenciaMensual,
} from "./dashboard-api";
import {
  CLAVE_DASHBOARD_CICLO,
  CLAVE_DASHBOARD_EMBUDO,
  CLAVE_DASHBOARD_ESPERANDO_RESPUESTA,
  CLAVE_DASHBOARD_KPIS_CONSOLIDADO,
  CLAVE_DASHBOARD_MOTIVOS,
  CLAVE_DASHBOARD_RANKING,
  CLAVE_DASHBOARD_TENDENCIA,
} from "../../claves-consulta";

import type {
  FiltrosDashboardEjecutivo,
  FiltrosDashboardPeriodoEjecutivo,
  FiltrosDashboardRanking,
  FiltrosDashboardTendencia,
} from "../tipos/dashboard.tipos";

// ---------------------------------------------------------------------------
// Tríada de acceso a datos del dashboard (design D1/D3): 7 hooks useConsulta,
// cada uno con su clave (solo lectura, sin invalidarConsulta — D3) y deps
// derivadas de sus filtros (patrón [JSON.stringify(filtros)], igual que
// cotizaciones-queries.ts). Un useConsulta por widget: carga/error aislados
// (D10).
// ---------------------------------------------------------------------------

// ciclo-cierre: recalcula con período y ejecutivo.
export function useCicloCierreQuery(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
) {
  return useConsulta(
    () => obtenerCicloCierre(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_DASHBOARD_CICLO }
  );
}

// tendencia: AHORA recalcula con período (desde/hasta) y ejecutivo, como el
// resto — el JSON.stringify de filtros ya cubre el período en las deps.
export function useTendenciaMensualQuery(
  filtros: FiltrosDashboardTendencia = {}
) {
  return useConsulta(
    () => obtenerTendenciaMensual(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_DASHBOARD_TENDENCIA }
  );
}

// ranking-ejecutivos: SIN ejecutivo en deps ni en la llamada (restricción
// verificada) — solo período.
export function useRankingEjecutivosQuery(
  filtros: FiltrosDashboardRanking = {}
) {
  return useConsulta(
    () => obtenerRankingEjecutivos(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_DASHBOARD_RANKING }
  );
}

// motivos-perdida: recalcula con período y ejecutivo.
export function useMotivosPerdidaQuery(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
) {
  return useConsulta(
    () => obtenerMotivosPerdida(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_DASHBOARD_MOTIVOS }
  );
}

// embudo-conversion: recalcula con período y ejecutivo.
export function useEmbudoConversionQuery(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
) {
  return useConsulta(
    () => obtenerEmbudoConversion(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_DASHBOARD_EMBUDO }
  );
}

// kpis-consolidado: recalcula con período y ejecutivo.
export function useKpisConsolidadoQuery(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
) {
  return useConsulta(
    () => obtenerKpisConsolidado(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_DASHBOARD_KPIS_CONSOLIDADO }
  );
}

// esperando-respuesta: estado ACTUAL, SOLO ejecutivo (sin período) — las deps
// cambian solo con el filtro de ejecutivo, no con el selector de fechas.
export function useEsperandoRespuestaQuery(
  filtros: FiltrosDashboardEjecutivo = {}
) {
  return useConsulta(
    () => obtenerEsperandoRespuesta(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_DASHBOARD_ESPERANDO_RESPUESTA }
  );
}
