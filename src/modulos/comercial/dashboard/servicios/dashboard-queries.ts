"use client";

import { useConsulta } from "@/compartido/api";

import {
  obtenerAccionesPendientes,
  obtenerCicloCierre,
  obtenerEmbudoConversion,
  obtenerKpisMonetarios,
  obtenerMotivosPerdida,
  obtenerRankingEjecutivos,
  obtenerTendenciaMensual,
  obtenerWinRate,
} from "./dashboard-api";
import {
  CLAVE_DASHBOARD_ACCIONES,
  CLAVE_DASHBOARD_CICLO,
  CLAVE_DASHBOARD_EMBUDO,
  CLAVE_DASHBOARD_KPIS,
  CLAVE_DASHBOARD_MOTIVOS,
  CLAVE_DASHBOARD_RANKING,
  CLAVE_DASHBOARD_TENDENCIA,
  CLAVE_DASHBOARD_WIN_RATE,
} from "../../claves-consulta";

import type {
  FiltrosDashboardAcciones,
  FiltrosDashboardPeriodoEjecutivo,
  FiltrosDashboardRanking,
  FiltrosDashboardTendencia,
} from "../tipos/dashboard.tipos";

// ---------------------------------------------------------------------------
// Tríada de acceso a datos del dashboard (design D1/D3): 8 hooks useConsulta,
// cada uno con su clave (solo lectura, sin invalidarConsulta — D3) y deps
// derivadas de sus filtros (patrón [JSON.stringify(filtros)], igual que
// cotizaciones-queries.ts). Un useConsulta por widget: carga/error aislados
// (D10).
// ---------------------------------------------------------------------------

// kpis-monetarios: recalcula con período y ejecutivo.
export function useKpisMonetariosQuery(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
) {
  return useConsulta(
    () => obtenerKpisMonetarios(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_DASHBOARD_KPIS }
  );
}

// win-rate: recalcula con período y ejecutivo.
export function useWinRateQuery(
  filtros: FiltrosDashboardPeriodoEjecutivo = {}
) {
  return useConsulta(
    () => obtenerWinRate(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_DASHBOARD_WIN_RATE }
  );
}

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

// tendencia-mensual: SIN período en deps (D6) — solo ejecutivo/meses.
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

// acciones-pendientes: SIN período — solo ejecutivo.
export function useAccionesPendientesQuery(
  filtros: FiltrosDashboardAcciones = {}
) {
  return useConsulta(
    () => obtenerAccionesPendientes(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_DASHBOARD_ACCIONES }
  );
}
