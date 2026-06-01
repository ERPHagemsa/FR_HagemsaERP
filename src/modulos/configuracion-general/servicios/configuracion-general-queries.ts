"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  anularConfiguracionGeneral,
  consultarCatalogoConfiguracionGeneral,
  consultarConfiguracionGeneral,
  exportarConfiguracionGeneral,
  inhabilitarConfiguracionGeneral,
  modificarConfiguracionGeneral,
  obtenerEstadoBcConfiguracionGeneral,
  obtenerResumenDashboardConfiguracionGeneral,
  reactivarConfiguracionGeneral,
  registrarConfiguracionGeneral,
} from "./configuracion-general-api"
import type {
  ConsultarConfiguracionGeneralQuery,
  ExportarConfiguracionGeneralQuery,
} from "../tipos/configuracion-general"

export function useEstadoBcConfiguracionGeneralQuery() {
  return useConsulta(obtenerEstadoBcConfiguracionGeneral, [])
}

export function useResumenDashboardConfiguracionGeneralQuery() {
  return useConsulta(obtenerResumenDashboardConfiguracionGeneral, [])
}

export function useConfiguracionGeneralQuery(query?: ConsultarConfiguracionGeneralQuery) {
  return useConsulta(
    () => consultarConfiguracionGeneral(query),
    [JSON.stringify(query ?? {})],
  )
}

export function useCatalogoConfiguracionGeneralQuery(query?: ConsultarConfiguracionGeneralQuery) {
  return useConsulta(
    () => consultarCatalogoConfiguracionGeneral(query),
    [JSON.stringify(query ?? {})],
  )
}

export function useExportarConfiguracionGeneralQuery(
  query?: ExportarConfiguracionGeneralQuery,
  enabled = false,
) {
  return useConsulta(
    () => exportarConfiguracionGeneral(query),
    [JSON.stringify(query ?? {})],
    { enabled },
  )
}

export interface OpcionesMutacionConfiguracionGeneral {
  readonly onSuccess?: () => unknown
}

export function useRegistrarConfiguracionGeneralMutation(
  opciones: OpcionesMutacionConfiguracionGeneral = {},
) {
  return useMutar<
    Parameters<typeof registrarConfiguracionGeneral>[0],
    Awaited<ReturnType<typeof registrarConfiguracionGeneral>>
  >({
    fn: (payload) => registrarConfiguracionGeneral(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useModificarConfiguracionGeneralMutation(
  id: string,
  opciones: OpcionesMutacionConfiguracionGeneral = {},
) {
  return useMutar<
    Parameters<typeof modificarConfiguracionGeneral>[1],
    Awaited<ReturnType<typeof modificarConfiguracionGeneral>>
  >({
    fn: (payload) => modificarConfiguracionGeneral(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useInhabilitarConfiguracionGeneralMutation(
  id: string,
  opciones: OpcionesMutacionConfiguracionGeneral = {},
) {
  return useMutar<
    Parameters<typeof inhabilitarConfiguracionGeneral>[1],
    Awaited<ReturnType<typeof inhabilitarConfiguracionGeneral>>
  >({
    fn: (payload) => inhabilitarConfiguracionGeneral(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useReactivarConfiguracionGeneralMutation(
  id: string,
  opciones: OpcionesMutacionConfiguracionGeneral = {},
) {
  return useMutar<
    Parameters<typeof reactivarConfiguracionGeneral>[1],
    Awaited<ReturnType<typeof reactivarConfiguracionGeneral>>
  >({
    fn: (payload) => reactivarConfiguracionGeneral(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useAnularConfiguracionGeneralMutation(
  id: string,
  opciones: OpcionesMutacionConfiguracionGeneral = {},
) {
  return useMutar<
    Parameters<typeof anularConfiguracionGeneral>[1],
    Awaited<ReturnType<typeof anularConfiguracionGeneral>>
  >({
    fn: (payload) => anularConfiguracionGeneral(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
