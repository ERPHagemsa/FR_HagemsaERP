"use client"

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"
import { CLAVE_MOTIVOS } from "@/modulos/comercial/claves-consulta"

import type { FiltrosCatalogosMotivo } from "../tipos/motivos.tipos"
import {
  actualizarCatalogoMotivo,
  cambiarEstadoCatalogoMotivo,
  crearCatalogoMotivo,
  listarCatalogosMotivo,
} from "./catalogos-motivo-api"

export function useCatalogosMotivoQuery(filtros?: FiltrosCatalogosMotivo) {
  return useConsulta(
    () => listarCatalogosMotivo(filtros),
    [JSON.stringify(filtros ?? {})],
    { clave: CLAVE_MOTIVOS },
  )
}

export interface OpcionesMutacionCatalogoMotivo {
  onSuccess?: () => unknown
  onError?: (err: unknown) => unknown
}

export function useCrearCatalogoMotivoMutation(
  opciones: OpcionesMutacionCatalogoMotivo = {},
) {
  return useMutar<Parameters<typeof crearCatalogoMotivo>[0], { id: string }>({
    fn: (payload) => crearCatalogoMotivo(payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_MOTIVOS)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useActualizarCatalogoMotivoMutation(
  id: string,
  opciones: OpcionesMutacionCatalogoMotivo = {},
) {
  return useMutar<Parameters<typeof actualizarCatalogoMotivo>[1], void>({
    fn: (payload) => actualizarCatalogoMotivo(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_MOTIVOS)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useCambiarEstadoCatalogoMotivoMutation(
  id: string,
  opciones: OpcionesMutacionCatalogoMotivo = {},
) {
  return useMutar<Parameters<typeof cambiarEstadoCatalogoMotivo>[1], void>({
    fn: (payload) => cambiarEstadoCatalogoMotivo(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_MOTIVOS)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}
