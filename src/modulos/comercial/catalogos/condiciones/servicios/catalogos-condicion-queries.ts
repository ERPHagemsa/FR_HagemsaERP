"use client"

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"
import type { FiltrosCatalogosCondicion } from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"
import { CLAVE_CONDICIONES } from "@/modulos/comercial/claves-consulta"

import {
  actualizarCatalogoCondicion,
  cambiarEstadoCatalogoCondicion,
  crearCatalogoCondicion,
  listarCatalogosCondicion,
} from "./catalogos-condicion-api"

export function useCatalogosCondicionQuery(filtros?: FiltrosCatalogosCondicion) {
  return useConsulta(
    () => listarCatalogosCondicion(filtros),
    [JSON.stringify(filtros ?? {})],
    { clave: CLAVE_CONDICIONES },
  )
}

export interface OpcionesMutacionCatalogoCondicion {
  onSuccess?: () => unknown
  onError?: (err: unknown) => unknown
}

export function useCrearCatalogoCondicionMutation(
  opciones: OpcionesMutacionCatalogoCondicion = {},
) {
  return useMutar<Parameters<typeof crearCatalogoCondicion>[0], { id: string }>({
    fn: (payload) => crearCatalogoCondicion(payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_CONDICIONES)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useActualizarCatalogoCondicionMutation(
  id: string,
  opciones: OpcionesMutacionCatalogoCondicion = {},
) {
  return useMutar<Parameters<typeof actualizarCatalogoCondicion>[1], void>({
    fn: (payload) => actualizarCatalogoCondicion(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_CONDICIONES)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useCambiarEstadoCatalogoCondicionMutation(
  id: string,
  opciones: OpcionesMutacionCatalogoCondicion = {},
) {
  return useMutar<Parameters<typeof cambiarEstadoCatalogoCondicion>[1], void>({
    fn: (payload) => cambiarEstadoCatalogoCondicion(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_CONDICIONES)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}
