"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  crearRol,
  obtenerPermisos,
  obtenerRol,
  obtenerRoles,
} from "../servicios/roles-api"
import type {
  CrearRolPayload,
  CrearRolResponse,
} from "../tipos/administracion.tipos"

export function useRoles() {
  return useConsulta(obtenerRoles, [])
}

export function useRol(id: string) {
  return useConsulta(() => obtenerRol(id), [id], { enabled: Boolean(id) })
}

export interface OpcionesCrearRol {
  readonly onSuccess?: (data: CrearRolResponse) => unknown
}

export function useCrearRol(opciones: OpcionesCrearRol = {}) {
  return useMutar<CrearRolPayload, CrearRolResponse>({
    fn: (payload) => crearRol(payload),
    onSuccess: (data) => opciones.onSuccess?.(data),
  })
}

export function usePermisos(modulo?: string) {
  return useConsulta(() => obtenerPermisos(modulo), [modulo])
}
