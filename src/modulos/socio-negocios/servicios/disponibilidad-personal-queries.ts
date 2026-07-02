"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  anularDisponibilidadPersonal,
  consultarDisponibilidadesPersonal,
  consultarDisponibilidadesPorPersonal,
  crearDisponibilidadPersonal,
  modificarDisponibilidadPersonal,
  obtenerDisponibilidadPersonal,
} from "./disponibilidad-personal-api"

import type { ConsultarDisponibilidadesPersonalConfiguradasQuery } from "../tipos/disponibilidad-personal"

export interface OpcionesMutacionDisponibilidadPersonal {
  readonly onSuccess?: () => unknown
}

export function useDisponibilidadesPersonalQuery(
  query?: ConsultarDisponibilidadesPersonalConfiguradasQuery,
  enabled = true,
) {
  return useConsulta(
    () => consultarDisponibilidadesPersonal(query),
    [JSON.stringify(query ?? {})],
    { enabled },
  )
}

export function useDisponibilidadesPorPersonalQuery(
  personalId: string | number,
  enabled = Boolean(personalId),
) {
  return useConsulta(
    () => consultarDisponibilidadesPorPersonal(personalId),
    [String(personalId)],
    { enabled },
  )
}

export function useDisponibilidadPersonalQuery(
  id: string | number,
  enabled = Boolean(id),
) {
  return useConsulta(() => obtenerDisponibilidadPersonal(id), [String(id)], {
    enabled,
  })
}

export function useCrearDisponibilidadPersonalMutation(
  opciones: OpcionesMutacionDisponibilidadPersonal = {},
) {
  return useMutar<
    Parameters<typeof crearDisponibilidadPersonal>[0],
    Awaited<ReturnType<typeof crearDisponibilidadPersonal>>
  >({
    fn: (payload) => crearDisponibilidadPersonal(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useModificarDisponibilidadPersonalMutation(
  id: string | number,
  opciones: OpcionesMutacionDisponibilidadPersonal = {},
) {
  return useMutar<
    Parameters<typeof modificarDisponibilidadPersonal>[1],
    Awaited<ReturnType<typeof modificarDisponibilidadPersonal>>
  >({
    fn: (payload) => modificarDisponibilidadPersonal(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useAnularDisponibilidadPersonalMutation(
  id: string | number,
  opciones: OpcionesMutacionDisponibilidadPersonal = {},
) {
  return useMutar<
    Parameters<typeof anularDisponibilidadPersonal>[1] | undefined,
    Awaited<ReturnType<typeof anularDisponibilidadPersonal>>
  >({
    fn: (payload) => anularDisponibilidadPersonal(id, payload ?? {}),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
