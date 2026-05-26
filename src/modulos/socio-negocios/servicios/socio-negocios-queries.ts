"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  consultarSociosDeNegocio,
  darDeBajaSocioDeNegocio,
  exportarSociosDeNegocio,
  modificarSocioDeNegocio,
  obtenerEstadoBcSocioDeNegocio,
  obtenerSocioDeNegocio,
  registrarClienteDesdeComercial,
  registrarSocioDeNegocio,
} from "./socio-negocios-api"
import type {
  ConsultarSociosDeNegocioQuery,
  ExportarSociosDeNegocioQuery,
} from "../tipos/socio-negocio"

export function useEstadoBcSocioDeNegocioQuery() {
  return useConsulta(obtenerEstadoBcSocioDeNegocio, [])
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
