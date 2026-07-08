"use client"

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"
import { CLAVE_TIPOS_UNIDAD } from "@/modulos/comercial/claves-consulta"
import { listarTiposUnidad } from "@/modulos/comercial/cotizaciones/servicios/tipos-unidad-api"

import {
  actualizarTipoUnidadTercero,
  crearTipoUnidadTercero,
  eliminarTipoUnidadTercero,
} from "./tipos-unidad-terceros-api"

// Catalogo UNIDO (ACTIVOS + terceros activos) — el mismo que alimenta el select
// de la carga. La vista de administracion lo lista completo y habilita acciones
// solo sobre las filas de fuente TERCERO. Comparte CLAVE_TIPOS_UNIDAD con el
// select, asi una alta/edicion/baja de tercero invalida ambos a la vez.
export function useCatalogoTiposUnidadQuery() {
  return useConsulta(() => listarTiposUnidad(), [], { clave: CLAVE_TIPOS_UNIDAD })
}

export interface OpcionesMutacionTipoUnidadTercero {
  onSuccess?: () => unknown
  onError?: (err: unknown) => unknown
}

export function useCrearTipoUnidadTerceroMutation(
  opciones: OpcionesMutacionTipoUnidadTercero = {},
) {
  return useMutar<Parameters<typeof crearTipoUnidadTercero>[0], { id: string }>({
    fn: (payload) => crearTipoUnidadTercero(payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TIPOS_UNIDAD)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useActualizarTipoUnidadTerceroMutation(
  id: string,
  opciones: OpcionesMutacionTipoUnidadTercero = {},
) {
  return useMutar<Parameters<typeof actualizarTipoUnidadTercero>[1], void>({
    fn: (payload) => actualizarTipoUnidadTercero(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TIPOS_UNIDAD)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useEliminarTipoUnidadTerceroMutation(
  id: string,
  opciones: OpcionesMutacionTipoUnidadTercero = {},
) {
  return useMutar<void, void>({
    fn: () => eliminarTipoUnidadTercero(id),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TIPOS_UNIDAD)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}
