"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  aprobarSocioDeNegocio,
  consultarEventosSocioDeNegocio,
  consultarEventosSociosDeNegocio,
  consultarSapBusinessPartnerPorCodigo,
  consultarSapBusinessPartnerPorDocumento,
  consultarHistorialSocioDeNegocio,
  consultarHistorialSociosDeNegocio,
  consultarSociosDeNegocio,
  darDeBajaSocioDeNegocio,
  exportarSociosDeNegocio,
  modificarSocioDeNegocio,
  obtenerEstadoBcSocioDeNegocio,
  obtenerClientePorDocumento,
  obtenerResumenSociosDeNegocio,
  obtenerSocioDeNegocio,
  registrarClienteDesdeComercial,
  registrarSocioDesdeSap,
  registrarSocioDeNegocio,
  rechazarSocioDeNegocio,
  reactivarSocioDeNegocio,
} from "./socio-negocios-api"
import type {
  ConsultarSapPorDocumentoQuery,
  ConsultarHistorialSocioDeNegocioQuery,
  ConsultarSociosDeNegocioQuery,
  ExportarSociosDeNegocioQuery,
  SapSessionQuery,
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
  id: string | number,
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
  id: string | number,
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
  id: string | number,
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

export function useRegistrarSocioDesdeSapMutation(
  numeroDocumento: string,
  opciones: OpcionesMutacionSocioNegocios = {},
) {
  return useMutar<
    Parameters<typeof registrarSocioDesdeSap>[1],
    Awaited<ReturnType<typeof registrarSocioDesdeSap>>
  >({
    fn: (payload) => registrarSocioDesdeSap(numeroDocumento, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useAprobarSocioDeNegocioMutation(
  id: string | number,
  opciones: OpcionesMutacionSocioNegocios = {},
) {
  return useMutar<
    Parameters<typeof aprobarSocioDeNegocio>[1],
    Awaited<ReturnType<typeof aprobarSocioDeNegocio>>
  >({
    fn: (payload) => aprobarSocioDeNegocio(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useRechazarSocioDeNegocioMutation(
  id: string | number,
  opciones: OpcionesMutacionSocioNegocios = {},
) {
  return useMutar<
    Parameters<typeof rechazarSocioDeNegocio>[1],
    Awaited<ReturnType<typeof rechazarSocioDeNegocio>>
  >({
    fn: (payload) => rechazarSocioDeNegocio(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useSapBusinessPartnerPorDocumentoQuery(
  numeroDocumento: string,
  query: ConsultarSapPorDocumentoQuery,
  enabled = Boolean(numeroDocumento),
) {
  return useConsulta(
    () =>
      consultarSapBusinessPartnerPorDocumento(
        numeroDocumento,
        query,
      ),
    [numeroDocumento, JSON.stringify(query)],
    { enabled },
  )
}

export function useSapBusinessPartnerPorCodigoQuery(
  codigoInternoSap: string,
  query?: SapSessionQuery,
  enabled = Boolean(codigoInternoSap),
) {
  return useConsulta(
    () =>
      consultarSapBusinessPartnerPorCodigo(
        codigoInternoSap,
        query,
      ),
    [codigoInternoSap, JSON.stringify(query ?? {})],
    { enabled },
  )
}

export function useClientePorDocumentoQuery(
  numeroDocumento: string,
  enabled = Boolean(numeroDocumento),
) {
  return useConsulta(
    () => obtenerClientePorDocumento(numeroDocumento),
    [numeroDocumento],
    { enabled },
  )
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

export function useEventosSociosDeNegocioQuery() {
  return useConsulta(consultarEventosSociosDeNegocio, [])
}

export function useEventosSocioDeNegocioQuery(id: string | number) {
  return useConsulta(() => consultarEventosSocioDeNegocio(id), [String(id)], {
    enabled: Boolean(id),
  })
}
