"use client"

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"
import {
  actualizarModalidad,
  cambiarEstadoModalidad,
  crearModalidad,
  listarModalidades,
} from "@/modulos/comercial/cotizaciones/servicios/modalidades-api"
import type {
  FiltrosModalidades,
  PayloadActualizarModalidad,
  PayloadCrearModalidad,
} from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"
import { CLAVE_MODALIDADES } from "@/modulos/comercial/claves-consulta"

export function useModalidadesQuery(filtros?: FiltrosModalidades) {
  return useConsulta(
    () => listarModalidades(filtros),
    [JSON.stringify(filtros ?? {})],
    { clave: CLAVE_MODALIDADES },
  )
}

export interface OpcionesMutacionModalidad {
  onSuccess?: () => unknown
  onError?: (err: unknown) => unknown
}

export function useCrearModalidadMutation(
  opciones: OpcionesMutacionModalidad = {},
) {
  return useMutar<PayloadCrearModalidad, { id: string }>({
    fn: (payload) => crearModalidad(payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_MODALIDADES)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useActualizarModalidadMutation(
  id: string,
  opciones: OpcionesMutacionModalidad = {},
) {
  return useMutar<PayloadActualizarModalidad, void>({
    fn: (payload) => actualizarModalidad(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_MODALIDADES)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useCambiarEstadoModalidadMutation(
  id: string,
  opciones: OpcionesMutacionModalidad = {},
) {
  return useMutar<{ accion: "ACTIVAR" | "DESACTIVAR" }, void>({
    fn: (payload) => cambiarEstadoModalidad(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_MODALIDADES)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}
