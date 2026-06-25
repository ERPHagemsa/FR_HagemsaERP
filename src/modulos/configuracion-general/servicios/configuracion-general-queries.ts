"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  anularConfiguracionGeneral,
  consultarCatalogoConfiguracionGeneral,
  consultarConfiguracionGeneral,
  exportarConfiguracionGeneral,
  inhabilitarConfiguracionGeneral,
  listarPorTipo,
  modificarPorTipo,
  obtenerEstadoBcConfiguracionGeneral,
  obtenerResumenDashboardConfiguracionGeneral,
  reactivarConfiguracionGeneral,
  registrarPorTipo,
} from "./configuracion-general-api"
import type {
  ConsultarConfiguracionGeneralQuery,
  ExportarConfiguracionGeneralQuery,
  ModificarRequestPorTipo,
  RegistrarRequestPorTipo,
  TipoDatoMaestro,
} from "../tipos/configuracion-general"

export function useEstadoBcConfiguracionGeneralQuery() {
  return useConsulta(obtenerEstadoBcConfiguracionGeneral, [])
}

export function useResumenDashboardConfiguracionGeneralQuery() {
  return useConsulta(obtenerResumenDashboardConfiguracionGeneral, [])
}

export function useConfiguracionGeneralQuery(
  query?: ConsultarConfiguracionGeneralQuery,
  enabled = true,
) {
  return useConsulta(
    () => consultarConfiguracionGeneral(query),
    [JSON.stringify(query ?? {})],
    { enabled },
  )
}

/** Lista un tipo concreto desde su recurso dedicado (/cargos, /sedes, ...). */
export function useListarPorTipoQuery(
  tipo: TipoDatoMaestro,
  query?: ConsultarConfiguracionGeneralQuery,
  enabled = true,
) {
  return useConsulta(
    () => listarPorTipo(tipo, query),
    [tipo, JSON.stringify(query ?? {})],
    { enabled },
  )
}

export function useCatalogoConfiguracionGeneralQuery(
  query?: ConsultarConfiguracionGeneralQuery,
  enabled = true,
) {
  return useConsulta(
    () => consultarCatalogoConfiguracionGeneral(query),
    [JSON.stringify(query ?? {})],
    { enabled },
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

export function useInhabilitarConfiguracionGeneralMutation(
  id: number,
  tipo: TipoDatoMaestro,
  opciones: OpcionesMutacionConfiguracionGeneral = {},
) {
  return useMutar<
    Parameters<typeof inhabilitarConfiguracionGeneral>[2],
    Awaited<ReturnType<typeof inhabilitarConfiguracionGeneral>>
  >({
    fn: (payload) => inhabilitarConfiguracionGeneral(id, tipo, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useReactivarConfiguracionGeneralMutation(
  id: number,
  tipo: TipoDatoMaestro,
  opciones: OpcionesMutacionConfiguracionGeneral = {},
) {
  return useMutar<
    Parameters<typeof reactivarConfiguracionGeneral>[2],
    Awaited<ReturnType<typeof reactivarConfiguracionGeneral>>
  >({
    fn: (payload) => reactivarConfiguracionGeneral(id, tipo, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useAnularConfiguracionGeneralMutation(
  id: number,
  tipo: TipoDatoMaestro,
  opciones: OpcionesMutacionConfiguracionGeneral = {},
) {
  return useMutar<
    Parameters<typeof anularConfiguracionGeneral>[2],
    Awaited<ReturnType<typeof anularConfiguracionGeneral>>
  >({
    fn: (payload) => anularConfiguracionGeneral(id, tipo, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

/** Registra un maestro en el recurso dedicado de su tipo. */
export function useRegistrarPorTipoMutation<T extends TipoDatoMaestro>(
  tipo: T,
  opciones: OpcionesMutacionConfiguracionGeneral = {},
) {
  return useMutar<RegistrarRequestPorTipo[T], Awaited<ReturnType<typeof registrarPorTipo>>>({
    fn: (payload) => registrarPorTipo(tipo, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

/** Modifica un maestro en el recurso dedicado de su tipo. */
export function useModificarPorTipoMutation<T extends TipoDatoMaestro>(
  tipo: T,
  id: number,
  opciones: OpcionesMutacionConfiguracionGeneral = {},
) {
  return useMutar<ModificarRequestPorTipo[T], Awaited<ReturnType<typeof modificarPorTipo>>>({
    fn: (payload) => modificarPorTipo(tipo, id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
