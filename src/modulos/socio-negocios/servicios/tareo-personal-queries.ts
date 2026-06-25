"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import type {
  ConsultarConfiguracionesLaboralesPersonalQuery,
  ConsultarTiposTareoPersonalQuery,
} from "../tipos/tareo-personal"
import {
  activarConfiguracionLaboralPersonal,
  activarTipoTareoPersonal,
  consultarConfiguracionesLaboralesPersonal,
  consultarTiposTareoPersonal,
  crearConfiguracionLaboralPersonal,
  crearTipoTareoPersonal,
  inactivarConfiguracionLaboralPersonal,
  inactivarTipoTareoPersonal,
  modificarConfiguracionLaboralPersonal,
  modificarTipoTareoPersonal,
  obtenerConfiguracionLaboralPersonal,
  obtenerTipoTareoPersonal,
} from "./tareo-personal-api"

export interface OpcionesMutacionTareo {
  readonly onSuccess?: () => unknown
}

// --- Tipo de tareo -------------------------------------------------------------

export function useTiposTareoPersonalQuery(
  query?: ConsultarTiposTareoPersonalQuery,
  enabled = true,
) {
  return useConsulta(
    () => consultarTiposTareoPersonal(query),
    [query?.estado ?? "", query?.q ?? ""],
    { enabled },
  )
}

export function useTipoTareoPersonalQuery(
  id: string | number,
  enabled = Boolean(id),
) {
  return useConsulta(() => obtenerTipoTareoPersonal(id), [String(id)], {
    enabled,
  })
}

export function useCrearTipoTareoPersonalMutation(
  opciones: OpcionesMutacionTareo = {},
) {
  return useMutar<
    Parameters<typeof crearTipoTareoPersonal>[0],
    Awaited<ReturnType<typeof crearTipoTareoPersonal>>
  >({
    fn: (payload) => crearTipoTareoPersonal(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useModificarTipoTareoPersonalMutation(
  id: string | number,
  opciones: OpcionesMutacionTareo = {},
) {
  return useMutar<
    Parameters<typeof modificarTipoTareoPersonal>[1],
    Awaited<ReturnType<typeof modificarTipoTareoPersonal>>
  >({
    fn: (payload) => modificarTipoTareoPersonal(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useActivarTipoTareoPersonalMutation(
  id: string | number,
  opciones: OpcionesMutacionTareo = {},
) {
  return useMutar<
    Parameters<typeof activarTipoTareoPersonal>[1],
    Awaited<ReturnType<typeof activarTipoTareoPersonal>>
  >({
    fn: (payload) => activarTipoTareoPersonal(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useInactivarTipoTareoPersonalMutation(
  id: string | number,
  opciones: OpcionesMutacionTareo = {},
) {
  return useMutar<
    Parameters<typeof inactivarTipoTareoPersonal>[1],
    Awaited<ReturnType<typeof inactivarTipoTareoPersonal>>
  >({
    fn: (payload) => inactivarTipoTareoPersonal(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

// --- Configuracion laboral -----------------------------------------------------

export function useConfiguracionesLaboralesPersonalQuery(
  query?: ConsultarConfiguracionesLaboralesPersonalQuery,
  enabled = true,
) {
  return useConsulta(
    () => consultarConfiguracionesLaboralesPersonal(query),
    [String(query?.tipoTareoId ?? ""), query?.estado ?? "", query?.q ?? ""],
    { enabled },
  )
}

export function useConfiguracionLaboralPersonalQuery(
  id: string | number,
  enabled = Boolean(id),
) {
  return useConsulta(
    () => obtenerConfiguracionLaboralPersonal(id),
    [String(id)],
    { enabled },
  )
}

export function useCrearConfiguracionLaboralPersonalMutation(
  opciones: OpcionesMutacionTareo = {},
) {
  return useMutar<
    Parameters<typeof crearConfiguracionLaboralPersonal>[0],
    Awaited<ReturnType<typeof crearConfiguracionLaboralPersonal>>
  >({
    fn: (payload) => crearConfiguracionLaboralPersonal(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useModificarConfiguracionLaboralPersonalMutation(
  id: string | number,
  opciones: OpcionesMutacionTareo = {},
) {
  return useMutar<
    Parameters<typeof modificarConfiguracionLaboralPersonal>[1],
    Awaited<ReturnType<typeof modificarConfiguracionLaboralPersonal>>
  >({
    fn: (payload) => modificarConfiguracionLaboralPersonal(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useActivarConfiguracionLaboralPersonalMutation(
  id: string | number,
  opciones: OpcionesMutacionTareo = {},
) {
  return useMutar<
    Parameters<typeof activarConfiguracionLaboralPersonal>[1],
    Awaited<ReturnType<typeof activarConfiguracionLaboralPersonal>>
  >({
    fn: (payload) => activarConfiguracionLaboralPersonal(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useInactivarConfiguracionLaboralPersonalMutation(
  id: string | number,
  opciones: OpcionesMutacionTareo = {},
) {
  return useMutar<
    Parameters<typeof inactivarConfiguracionLaboralPersonal>[1],
    Awaited<ReturnType<typeof inactivarConfiguracionLaboralPersonal>>
  >({
    fn: (payload) => inactivarConfiguracionLaboralPersonal(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
