"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  consultarHistorialSocioDeNegocio,
  consultarHistorialSociosDeNegocio,
  consultarSociosDeNegocio,
  darDeBajaSocioDeNegocio,
  exportarSociosDeNegocio,
  modificarSocioDeNegocio,
  obtenerEstadoBcSocioDeNegocio,
  obtenerResumenSociosDeNegocio,
  obtenerSocioDeNegocio,
  registrarClienteDesdeComercial,
  registrarSocioDeNegocio,
  reactivarSocioDeNegocio,
} from "./socio-negocios-api"
import type {
  ConsultarHistorialSocioDeNegocioQuery,
  ConsultarSociosDeNegocioQuery,
  ExportarSociosDeNegocioQuery,
} from "../tipos/socio-negocio"

export function useEstadoBcSocioDeNegocioQuery() {
  return useConsulta(obtenerEstadoBcSocioDeNegocio, [])
}

export function useResumenSociosDeNegocioQuery() {
  return useConsulta(obtenerResumenSociosDeNegocio, [])
}

export function useSociosDeNegocioQuery(query?: ConsultarSociosDeNegocioQuery) {
  return useConsulta(
    () => consultarSociosDeNegocio(query),
    [JSON.stringify(query ?? {})],
  )
}

export function useSocioDeNegocioQuery(id: string) {
  return useConsulta(() => obtenerSocioDeNegocio(id), [id], {
    enabled: Boolean(id),
  })
}

export function useExportarSociosDeNegocioQuery(
  query: ExportarSociosDeNegocioQuery,
  enabled = false,
) {
  return useConsulta(() => exportarSociosDeNegocio(query), [JSON.stringify(query)], {
    enabled,
  })
}

export interface OpcionesMutacionSocioNegocios {
  readonly onSuccess?: () => unknown
}

export function useRegistrarSocioDeNegocioMutation(
  opciones: OpcionesMutacionSocioNegocios = {},
) {
  return useMutar<
    Parameters<typeof registrarSocioDeNegocio>[0],
    Awaited<ReturnType<typeof registrarSocioDeNegocio>>
  >({
    fn: (payload) => registrarSocioDeNegocio(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useRegistrarClienteDesdeComercialMutation(
  opciones: OpcionesMutacionSocioNegocios = {},
) {
  return useMutar<
    Parameters<typeof registrarClienteDesdeComercial>[0],
    Awaited<ReturnType<typeof registrarClienteDesdeComercial>>
  >({
    fn: (payload) => registrarClienteDesdeComercial(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useModificarSocioDeNegocioMutation(
  id: string,
  opciones: OpcionesMutacionSocioNegocios = {},
) {
  return useMutar<
    Parameters<typeof modificarSocioDeNegocio>[1],
    Awaited<ReturnType<typeof modificarSocioDeNegocio>>
  >({
    fn: (payload) => modificarSocioDeNegocio(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useDarDeBajaSocioDeNegocioMutation(
  id: string,
  opciones: OpcionesMutacionSocioNegocios = {},
) {
  return useMutar<
    Parameters<typeof darDeBajaSocioDeNegocio>[1],
    Awaited<ReturnType<typeof darDeBajaSocioDeNegocio>>
  >({
    fn: (payload) => darDeBajaSocioDeNegocio(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useReactivarSocioDeNegocioMutation(
  id: string,
  opciones: OpcionesMutacionSocioNegocios = {},
) {
  return useMutar<
    Parameters<typeof reactivarSocioDeNegocio>[1],
    Awaited<ReturnType<typeof reactivarSocioDeNegocio>>
  >({
    fn: (payload) => reactivarSocioDeNegocio(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useHistorialSociosDeNegocioQuery(
  query?: ConsultarHistorialSocioDeNegocioQuery,
) {
  return useConsulta(
    () => consultarHistorialSociosDeNegocio(query),
    [JSON.stringify(query ?? {})],
  )
}

export function useHistorialSocioDeNegocioQuery(
  id: string,
  query?: ConsultarHistorialSocioDeNegocioQuery,
) {
  return useConsulta(
    () => consultarHistorialSocioDeNegocio(id, query),
    [id, JSON.stringify(query ?? {})],
    { enabled: Boolean(id) },
  )
}
