"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  aprobarAsignacionPersonal,
  consultarAsignacionesPorPersonal,
  consultarHistorialAsignacionPersonal,
  crearAsignacionPersonal,
  modificarAsignacionPersonal,
  obtenerAsignacionPersonal,
  reemplazarCuentasContratos,
} from "./asignaciones-personal-api"

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

export function useAprobarAsignacionPersonalMutation(
  id: string | number,
  opciones: OpcionesMutacionAsignacionPersonal = {},
) {
  return useMutar<
    Parameters<typeof aprobarAsignacionPersonal>[1],
    Awaited<ReturnType<typeof aprobarAsignacionPersonal>>
  >({
    fn: (payload) => aprobarAsignacionPersonal(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
