"use client"

import { useMutar } from "@/compartido/api/use-mutar"

import {
  actualizarCuenta,
  crearCuenta,
  desactivarCuenta,
  reactivarCuenta,
  resetPasswordAdmin,
  setPassword,
  suspenderCuenta,
} from "../servicios/cuentas-api"
import type {
  ActualizarCuentaPayload,
  CrearCuentaPayload,
  CrearCuentaResponse,
  DesactivarCuentaPayload,
  ResetPasswordResponse,
  SetPasswordPayload,
  SuspenderCuentaPayload,
} from "../tipos/administracion.tipos"

export interface OpcionesMutacion {
  readonly onSuccess?: () => unknown
}

export function useCrearCuenta(opciones: OpcionesMutacion = {}) {
  return useMutar<CrearCuentaPayload, CrearCuentaResponse>({
    fn: (payload) => crearCuenta(payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useSuspenderCuenta(cuentaId: string, opciones: OpcionesMutacion = {}) {
  return useMutar<SuspenderCuentaPayload, void>({
    fn: (payload) => suspenderCuenta(cuentaId, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useReactivarCuenta(cuentaId: string, opciones: OpcionesMutacion = {}) {
  return useMutar<void, void>({
    fn: () => reactivarCuenta(cuentaId),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useSetPassword(cuentaId: string, opciones: OpcionesMutacion = {}) {
  return useMutar<SetPasswordPayload, void>({
    fn: (payload) => setPassword(cuentaId, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useResetPasswordAdmin(
  cuentaId: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<void, ResetPasswordResponse>({
    fn: () => resetPasswordAdmin(cuentaId),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useActualizarCuenta(
  cuentaId: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<ActualizarCuentaPayload, void>({
    fn: (payload) => actualizarCuenta(cuentaId, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useDesactivarCuenta(
  cuentaId: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<DesactivarCuentaPayload, void>({
    fn: (payload) => desactivarCuenta(cuentaId, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
