"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"
import {
  actualizarCatalogoCargoAdicional,
  cambiarEstadoCatalogoCargoAdicional,
  crearCatalogoCargoAdicional,
  listarCatalogosCargoAdicional,
} from "@/modulos/comercial/cotizaciones/servicios/catalogos-cargo-adicional-api"
import type { FiltrosCatalogosCargoAdicional } from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"

export function useCatalogosCargoAdicionalQuery(
  filtros?: FiltrosCatalogosCargoAdicional,
) {
  return useConsulta(
    () => listarCatalogosCargoAdicional(filtros),
    [JSON.stringify(filtros ?? {})],
  )
}

export interface OpcionesMutacionCatalogoCargoAdicional {
  onSuccess?: () => unknown
  onError?: (err: unknown) => unknown
}

export function useCrearCatalogoCargoAdicionalMutation(
  opciones: OpcionesMutacionCatalogoCargoAdicional = {},
) {
  return useMutar<Parameters<typeof crearCatalogoCargoAdicional>[0], { id: string }>({
    fn: (payload) => crearCatalogoCargoAdicional(payload),
    onSuccess: () => opciones.onSuccess?.(),
    onError: (err) => opciones.onError?.(err),
  })
}

export function useActualizarCatalogoCargoAdicionalMutation(
  id: string,
  opciones: OpcionesMutacionCatalogoCargoAdicional = {},
) {
  return useMutar<Parameters<typeof actualizarCatalogoCargoAdicional>[1], void>({
    fn: (payload) => actualizarCatalogoCargoAdicional(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
    onError: (err) => opciones.onError?.(err),
  })
}

export function useCambiarEstadoCatalogoCargoAdicionalMutation(
  id: string,
  opciones: OpcionesMutacionCatalogoCargoAdicional = {},
) {
  return useMutar<Parameters<typeof cambiarEstadoCatalogoCargoAdicional>[1], void>({
    fn: (payload) => cambiarEstadoCatalogoCargoAdicional(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
    onError: (err) => opciones.onError?.(err),
  })
}
