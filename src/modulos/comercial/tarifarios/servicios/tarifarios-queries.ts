"use client"

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"
import {
  CLAVE_TARIFARIOS,
  CLAVE_TARIFARIO_DETALLE,
} from "@/modulos/comercial/claves-consulta"

import {
  actualizarTarifa,
  agregarTarifa,
  anularTarifario,
  consultarTarifario,
  crearTarifarioManual,
  eliminarTarifa,
  generarTarifarioDesdeCotizacion,
  listarTarifarios,
} from "./tarifarios-api"
import type {
  FiltrosTarifarios,
  PayloadActualizarTarifa,
  PayloadCrearTarifarioManual,
  PayloadTarifa,
} from "../tipos/tarifarios.tipos"

export interface OpcionesMutacion {
  onSuccess?: () => unknown
  onError?: (err: unknown) => unknown
}

export function useTarifariosQuery(filtros?: FiltrosTarifarios) {
  return useConsulta(
    () => listarTarifarios(filtros),
    [JSON.stringify(filtros ?? {})],
    { clave: CLAVE_TARIFARIOS },
  )
}

export function useTarifarioDetalleQuery(id: string) {
  return useConsulta(() => consultarTarifario(id), [id], {
    enabled: Boolean(id),
    clave: CLAVE_TARIFARIO_DETALLE,
  })
}

export function useCrearTarifarioManualMutation(opciones: OpcionesMutacion = {}) {
  return useMutar<PayloadCrearTarifarioManual, { id: string }>({
    fn: (payload) => crearTarifarioManual(payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TARIFARIOS)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useGenerarDesdeCotizacionMutation(opciones: OpcionesMutacion = {}) {
  return useMutar<string, { id: string }>({
    fn: (idCotizacion) => generarTarifarioDesdeCotizacion(idCotizacion),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TARIFARIOS)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useAnularTarifarioMutation(
  id: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<void, void>({
    fn: () => anularTarifario(id),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TARIFARIOS)
      invalidarConsulta(CLAVE_TARIFARIO_DETALLE)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useAgregarTarifaMutation(
  idTarifario: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<PayloadTarifa, { id: string }>({
    fn: (payload) => agregarTarifa(idTarifario, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TARIFARIO_DETALLE)
      invalidarConsulta(CLAVE_TARIFARIOS)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useActualizarTarifaMutation(
  idTarifario: string,
  idTarifa: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<PayloadActualizarTarifa, void>({
    fn: (payload) => actualizarTarifa(idTarifario, idTarifa, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TARIFARIO_DETALLE)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}

export function useEliminarTarifaMutation(
  idTarifario: string,
  idTarifa: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<void, void>({
    fn: () => eliminarTarifa(idTarifario, idTarifa),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TARIFARIO_DETALLE)
      invalidarConsulta(CLAVE_TARIFARIOS)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}
