"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  obtenerSesionesCuenta,
  revocarSesion,
} from "../servicios/sesiones-api"
import type { RevocarSesionPayload } from "../tipos/administracion.tipos"

export function useSesionesCuenta(cuentaId: string) {
  return useConsulta(
    () => obtenerSesionesCuenta(cuentaId),
    [cuentaId],
    { enabled: Boolean(cuentaId) },
  )
}

export interface OpcionesMutacionSesiones {
  readonly onSuccess?: () => unknown
}

export function useRevocarSesion(opciones: OpcionesMutacionSesiones = {}) {
  return useMutar<
    { sesionId: string; payload: RevocarSesionPayload },
    void
  >({
    fn: (vars) => revocarSesion(vars.sesionId, vars.payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
