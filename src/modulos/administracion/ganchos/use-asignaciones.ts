"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  asignarRol,
  obtenerAsignacionesCuenta,
  revocarAsignacion,
} from "../servicios/asignaciones-api"
import type {
  AsignarRolPayload,
  AsignarRolResponse,
  RevocarAsignacionPayload,
} from "../tipos/administracion.tipos"

export function useAsignacionesCuenta(cuentaId: string) {
  return useConsulta(
    () => obtenerAsignacionesCuenta(cuentaId),
    [cuentaId],
    { enabled: Boolean(cuentaId) },
  )
}

export interface OpcionesMutacionAsignaciones {
  readonly onSuccess?: () => unknown
}

export function useAsignarRol(
  cuentaId: string,
  opciones: OpcionesMutacionAsignaciones = {},
) {
  return useMutar<AsignarRolPayload, AsignarRolResponse>({
    fn: (payload) => asignarRol(cuentaId, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useRevocarAsignacion(
  cuentaId: string,
  opciones: OpcionesMutacionAsignaciones = {},
) {
  return useMutar<
    { asignacionId: string; payload: RevocarAsignacionPayload },
    void
  >({
    fn: (vars) => revocarAsignacion(cuentaId, vars.asignacionId, vars.payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
