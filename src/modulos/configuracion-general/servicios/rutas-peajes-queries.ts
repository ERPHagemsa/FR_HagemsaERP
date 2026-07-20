"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  actualizarEstructuraRuta,
  actualizarPeajesRuta,
  actualizarPuntosRuta,
  obtenerCostoPeajesResumen,
  listarPeajes,
  listarRutas,
  listarTarifasPeaje,
  modificarPeaje,
  modificarRuta,
  modificarTarifaPeaje,
  obtenerCostoPeajesRuta,
  obtenerDetalleRuta,
  registrarPeaje,
  registrarRuta,
  registrarTarifaPeaje,
} from "./rutas-peajes-api"
import type {
  ConsultarPeajesQuery,
  ConsultarRutasQuery,
} from "../tipos/rutas-peajes"

interface OpcionesMutacion {
  readonly onSuccess?: () => unknown
}

// --- Peajes -------------------------------------------------------------------

export function usePeajesQuery(query?: ConsultarPeajesQuery, enabled = true) {
  return useConsulta(() => listarPeajes(query), [JSON.stringify(query ?? {})], { enabled })
}

export function useTarifasPeajeQuery(peajeId: number | null, enabled = true) {
  return useConsulta(
    () => listarTarifasPeaje(peajeId ?? 0),
    [peajeId],
    { enabled: enabled && peajeId != null },
  )
}

export function useRegistrarPeajeMutation(opciones: OpcionesMutacion = {}) {
  return useMutar<Parameters<typeof registrarPeaje>[0], Awaited<ReturnType<typeof registrarPeaje>>>({
    fn: (payload) => registrarPeaje(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useModificarPeajeMutation(id: number, opciones: OpcionesMutacion = {}) {
  return useMutar<Parameters<typeof modificarPeaje>[1], Awaited<ReturnType<typeof modificarPeaje>>>({
    fn: (payload) => modificarPeaje(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useRegistrarTarifaPeajeMutation(peajeId: number, opciones: OpcionesMutacion = {}) {
  return useMutar<
    Parameters<typeof registrarTarifaPeaje>[1],
    Awaited<ReturnType<typeof registrarTarifaPeaje>>
  >({
    fn: (payload) => registrarTarifaPeaje(peajeId, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useModificarTarifaPeajeMutation(
  peajeId: number,
  tarifaId: number,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<
    Parameters<typeof modificarTarifaPeaje>[2],
    Awaited<ReturnType<typeof modificarTarifaPeaje>>
  >({
    fn: (payload) => modificarTarifaPeaje(peajeId, tarifaId, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

// --- Rutas --------------------------------------------------------------------

export function useRutasQuery(query?: ConsultarRutasQuery, enabled = true) {
  return useConsulta(() => listarRutas(query), [JSON.stringify(query ?? {})], { enabled })
}

export function useDetalleRutaQuery(rutaId: number | null, enabled = true) {
  return useConsulta(
    () => obtenerDetalleRuta(rutaId ?? 0),
    [rutaId],
    { enabled: enabled && rutaId != null },
  )
}

export function useRegistrarRutaMutation(opciones: OpcionesMutacion = {}) {
  return useMutar<Parameters<typeof registrarRuta>[0], Awaited<ReturnType<typeof registrarRuta>>>({
    fn: (payload) => registrarRuta(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useModificarRutaMutation(id: number, opciones: OpcionesMutacion = {}) {
  return useMutar<Parameters<typeof modificarRuta>[1], Awaited<ReturnType<typeof modificarRuta>>>({
    fn: (payload) => modificarRuta(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useActualizarPuntosRutaMutation(id: number, opciones: OpcionesMutacion = {}) {
  return useMutar<
    Parameters<typeof actualizarPuntosRuta>[1],
    Awaited<ReturnType<typeof actualizarPuntosRuta>>
  >({
    fn: (payload) => actualizarPuntosRuta(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useActualizarPeajesRutaMutation(id: number, opciones: OpcionesMutacion = {}) {
  return useMutar<
    Parameters<typeof actualizarPeajesRuta>[1],
    Awaited<ReturnType<typeof actualizarPeajesRuta>>
  >({
    fn: (payload) => actualizarPeajesRuta(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useCostoPeajesRutaQuery(
  rutaId: number,
  query: Parameters<typeof obtenerCostoPeajesRuta>[1],
  enabled = false,
) {
  return useConsulta(
    () => obtenerCostoPeajesRuta(rutaId, query),
    [rutaId, JSON.stringify(query)],
    { enabled },
  )
}

export function useCostoPeajesResumenQuery(
  rutaId: number,
  query: Parameters<typeof obtenerCostoPeajesResumen>[1],
  enabled = false,
) {
  return useConsulta(
    () => obtenerCostoPeajesResumen(rutaId, query),
    [rutaId, JSON.stringify(query)],
    { enabled },
  )
}

export function useActualizarEstructuraRutaMutation(id: number, opciones: OpcionesMutacion = {}) {
  return useMutar<
    Parameters<typeof actualizarEstructuraRuta>[1],
    Awaited<ReturnType<typeof actualizarEstructuraRuta>>
  >({
    fn: (payload) => actualizarEstructuraRuta(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
