"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  anularCostoOperativo,
  calcularCostoOperativo,
  guardarCostoOperativo,
  habilitarConceptoCosto,
  inhabilitarConceptoCosto,
  listarConceptosCosto,
  listarCostosOperativos,
  modificarConceptoCosto,
  obtenerChecklistCostoOperativo,
  obtenerConceptoCosto,
  obtenerCostoOperativo,
  obtenerCostoVigente,
  registrarConceptoCosto,
} from "./costos-operativos-api"
import type {
  CalcularCostoQuery,
  ConsultarConceptosCostoQuery,
  ConsultarCostosOperativosQuery,
  ModalidadEntrega,
} from "../tipos/costos-operativos"

interface OpcionesMutacion {
  readonly onSuccess?: () => unknown
}

// --- Catalogo de conceptos ------------------------------------------------

export function useConceptosCostoQuery(query?: ConsultarConceptosCostoQuery, enabled = true) {
  return useConsulta(() => listarConceptosCosto(query), [JSON.stringify(query ?? {})], { enabled })
}

export function useConceptoCostoQuery(id: number | null, enabled = true) {
  return useConsulta(() => obtenerConceptoCosto(id ?? 0), [id], { enabled: enabled && id != null })
}

export function useRegistrarConceptoCostoMutation(opciones: OpcionesMutacion = {}) {
  return useMutar<
    Parameters<typeof registrarConceptoCosto>[0],
    Awaited<ReturnType<typeof registrarConceptoCosto>>
  >({
    fn: (payload) => registrarConceptoCosto(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useModificarConceptoCostoMutation(id: number, opciones: OpcionesMutacion = {}) {
  return useMutar<
    Parameters<typeof modificarConceptoCosto>[1],
    Awaited<ReturnType<typeof modificarConceptoCosto>>
  >({
    fn: (payload) => modificarConceptoCosto(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useInhabilitarConceptoCostoMutation(id: number, opciones: OpcionesMutacion = {}) {
  return useMutar<void, Awaited<ReturnType<typeof inhabilitarConceptoCosto>>>({
    fn: () => inhabilitarConceptoCosto(id),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useHabilitarConceptoCostoMutation(id: number, opciones: OpcionesMutacion = {}) {
  return useMutar<void, Awaited<ReturnType<typeof habilitarConceptoCosto>>>({
    fn: () => habilitarConceptoCosto(id),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

// --- Checklist / paquete ----------------------------------------------------

export function useChecklistCostoOperativoQuery(
  rutaId: number | null,
  cuentaContratoId: number | null,
  modalidadEntrega: ModalidadEntrega,
  fecha?: string,
  enabled = true,
) {
  return useConsulta(
    () =>
      obtenerChecklistCostoOperativo(
        rutaId ?? 0,
        cuentaContratoId ?? 0,
        modalidadEntrega,
        fecha,
      ),
    [rutaId, cuentaContratoId, modalidadEntrega, fecha],
    {
      enabled: enabled && rutaId != null && cuentaContratoId != null,
    },
  )
}

export function useGuardarCostoOperativoMutation(opciones: OpcionesMutacion = {}) {
  return useMutar<
    Parameters<typeof guardarCostoOperativo>[0],
    Awaited<ReturnType<typeof guardarCostoOperativo>>
  >({
    fn: (payload) => guardarCostoOperativo(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useCostosOperativosQuery(query?: ConsultarCostosOperativosQuery, enabled = true) {
  return useConsulta(() => listarCostosOperativos(query), [JSON.stringify(query ?? {})], { enabled })
}

export function useCostoOperativoQuery(id: number | null, enabled = true) {
  return useConsulta(() => obtenerCostoOperativo(id ?? 0), [id], { enabled: enabled && id != null })
}

export function useAnularCostoOperativoMutation(id: number, opciones: OpcionesMutacion = {}) {
  return useMutar<void, Awaited<ReturnType<typeof anularCostoOperativo>>>({
    fn: () => anularCostoOperativo(id),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

// --- Consumo / calculo -------------------------------------------------------

export function useCostoVigenteQuery(
  rutaId: number | null,
  cuentaContratoId: number | null,
  modalidadEntrega: ModalidadEntrega,
  fecha?: string,
  enabled = true,
) {
  return useConsulta(
    () =>
      obtenerCostoVigente(rutaId ?? 0, cuentaContratoId ?? 0, modalidadEntrega, fecha),
    [rutaId, cuentaContratoId, modalidadEntrega, fecha],
    {
      enabled: enabled && rutaId != null && cuentaContratoId != null,
    },
  )
}

export function useCalcularCostoQuery(query: CalcularCostoQuery | null, enabled = true) {
  return useConsulta(
    () => calcularCostoOperativo(query as CalcularCostoQuery),
    [JSON.stringify(query ?? {})],
    { enabled: enabled && query != null },
  )
}
