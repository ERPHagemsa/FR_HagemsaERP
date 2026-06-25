"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  aprobarAprobacionCuentaContrato,
  consultarAsignacionesPorPersonal,
  consultarOpcionesConfiguracionGeneral,
  consultarHistorialAsignacionPersonal,
  crearAsignacionPersonal,
  modificarAsignacionPersonal,
  obtenerAsignacionPersonal,
  obtenerOpcionesFormularioAsignacion,
  rechazarAprobacionCuentaContrato,
  reemplazarCuentasContratos,
} from "./asignaciones-personal-api"

import type {
  ConsultarConfiguracionGeneralOpcionesQuery,
  DecidirAprobacionCuentaContratoRequest,
} from "../tipos/asignacion-personal"

export interface OpcionesMutacionAsignacionPersonal {
  readonly onSuccess?: () => unknown
}

export function useAsignacionesPorPersonalQuery(
  personalId: string | number,
  enabled = Boolean(personalId),
) {
  return useConsulta(
    () => consultarAsignacionesPorPersonal(personalId),
    [String(personalId)],
    { enabled },
  )
}

export function useAsignacionPersonalQuery(
  id: string | number,
  enabled = Boolean(id),
) {
  return useConsulta(() => obtenerAsignacionPersonal(id), [String(id)], {
    enabled,
  })
}

/**
 * Opciones consolidadas del formulario de asignacion en una sola request. Usar
 * en vez de pedir cargos/sedes/areas/cuentas/contratos/tareo por separado.
 */
export function useOpcionesFormularioAsignacionQuery(
  soloActivos = true,
  enabled = true,
) {
  return useConsulta(
    () => obtenerOpcionesFormularioAsignacion(soloActivos),
    ["opciones-formulario-asignacion", String(soloActivos)],
    { enabled },
  )
}

export function useOpcionesConfiguracionGeneralAsignacionQuery(
  query?: ConsultarConfiguracionGeneralOpcionesQuery,
  enabled = true,
) {
  return useConsulta(
    () => consultarOpcionesConfiguracionGeneral(query),
    ["opciones-configuracion-general-asignacion", JSON.stringify(query ?? {})],
    { enabled },
  )
}

export function useHistorialAsignacionPersonalQuery(
  id: string | number,
  enabled = Boolean(id),
) {
  return useConsulta(
    () => consultarHistorialAsignacionPersonal(id),
    [String(id)],
    { enabled },
  )
}

export function useCrearAsignacionPersonalMutation(
  opciones: OpcionesMutacionAsignacionPersonal = {},
) {
  return useMutar<
    Parameters<typeof crearAsignacionPersonal>[0],
    Awaited<ReturnType<typeof crearAsignacionPersonal>>
  >({
    fn: (payload) => crearAsignacionPersonal(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useModificarAsignacionPersonalMutation(
  id: string | number,
  opciones: OpcionesMutacionAsignacionPersonal = {},
) {
  return useMutar<
    Parameters<typeof modificarAsignacionPersonal>[1],
    Awaited<ReturnType<typeof modificarAsignacionPersonal>>
  >({
    fn: (payload) => modificarAsignacionPersonal(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useReemplazarCuentasContratosMutation(
  id: string | number,
  opciones: OpcionesMutacionAsignacionPersonal = {},
) {
  return useMutar<
    Parameters<typeof reemplazarCuentasContratos>[1],
    Awaited<ReturnType<typeof reemplazarCuentasContratos>>
  >({
    fn: (payload) => reemplazarCuentasContratos(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

/** Payload de una decision de aprobacion: identifica el detalle, la firma y el cuerpo. */
export interface DecisionAprobacionCuentaContrato {
  detalleId: string | number
  aprobacionId: string | number
  decision?: DecidirAprobacionCuentaContratoRequest
}

export function useAprobarAprobacionCuentaContratoMutation(
  asignacionId: string | number,
  opciones: OpcionesMutacionAsignacionPersonal = {},
) {
  return useMutar<DecisionAprobacionCuentaContrato, Awaited<
    ReturnType<typeof aprobarAprobacionCuentaContrato>
  >>({
    fn: ({ detalleId, aprobacionId, decision }) =>
      aprobarAprobacionCuentaContrato(asignacionId, detalleId, aprobacionId, decision),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useRechazarAprobacionCuentaContratoMutation(
  asignacionId: string | number,
  opciones: OpcionesMutacionAsignacionPersonal = {},
) {
  return useMutar<DecisionAprobacionCuentaContrato, Awaited<
    ReturnType<typeof rechazarAprobacionCuentaContrato>
  >>({
    fn: ({ detalleId, aprobacionId, decision }) =>
      rechazarAprobacionCuentaContrato(asignacionId, detalleId, aprobacionId, decision),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
