"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  crearAbastecimiento,
  crearSolicitudDesdeManifiesto,
  listarAbastecimientos,
  listarManifiestos,
  listarSolicitudes,
  obtenerHealthCombustible,
} from "./combustible-api"

export function useHealthCombustibleQuery() {
  return useConsulta(obtenerHealthCombustible, [])
}

export function useManifiestosQuery() {
  return useConsulta(listarManifiestos, [])
}

export function useSolicitudesCombustibleQuery() {
  return useConsulta(listarSolicitudes, [])
}

export function useAbastecimientosCombustibleQuery() {
  return useConsulta(listarAbastecimientos, [])
}

export interface OpcionesMutacionCombustible {
  readonly onSuccess?: () => unknown
}

export function useCrearSolicitudCombustibleMutation(
  opciones: OpcionesMutacionCombustible = {},
) {
  return useMutar<
    Parameters<typeof crearSolicitudDesdeManifiesto>[0],
    Awaited<ReturnType<typeof crearSolicitudDesdeManifiesto>>
  >({
    fn: (payload) => crearSolicitudDesdeManifiesto(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useCrearAbastecimientoCombustibleMutation(
  opciones: OpcionesMutacionCombustible = {},
) {
  return useMutar<
    Parameters<typeof crearAbastecimiento>[0],
    Awaited<ReturnType<typeof crearAbastecimiento>>
  >({
    fn: (payload) => crearAbastecimiento(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
