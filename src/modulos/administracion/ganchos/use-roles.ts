"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  actualizarPermiso,
  actualizarRol,
  agregarPermisoARol,
  crearPermiso,
  crearRol,
  editarPermisosRol,
  eliminarPermiso,
  eliminarRol,
  obtenerPermisos,
  obtenerRol,
  obtenerRoles,
  revocarPermisoDeRol,
  type ResultadoEditarPermisosRol,
} from "../servicios/roles-api"
import type {
  ActualizarPermisoPayload,
  ActualizarRolPayload,
  AgregarPermisoARolPayload,
  CrearPermisoPayload,
  CrearPermisoResponse,
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

export interface OpcionesMutarRol {
  readonly onSuccess?: () => unknown
}

export function useActualizarRol(
  rolId: string,
  opciones: OpcionesMutarRol = {},
) {
  return useMutar<ActualizarRolPayload, void>({
    fn: (payload) => actualizarRol(rolId, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useEliminarRol(opciones: OpcionesMutarRol = {}) {
  return useMutar<string, void>({
    fn: (rolId) => eliminarRol(rolId),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export interface OpcionesCrearPermiso {
  readonly onSuccess?: (data: CrearPermisoResponse) => unknown
}

export function useCrearPermiso(opciones: OpcionesCrearPermiso = {}) {
  return useMutar<CrearPermisoPayload, CrearPermisoResponse>({
    fn: (payload) => crearPermiso(payload),
    onSuccess: (data) => opciones.onSuccess?.(data),
  })
}

export interface OpcionesMutarPermiso {
  readonly onSuccess?: () => unknown
}

export function useActualizarPermiso(
  permisoId: string,
  opciones: OpcionesMutarPermiso = {},
) {
  return useMutar<ActualizarPermisoPayload, void>({
    fn: (payload) => actualizarPermiso(permisoId, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useEliminarPermiso(opciones: OpcionesMutarPermiso = {}) {
  return useMutar<string, void>({
    fn: (permisoId) => eliminarPermiso(permisoId),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function usePermisos(modulo?: string) {
  return useConsulta(() => obtenerPermisos(modulo), [modulo])
}

export interface OpcionesEditarPermisosRol {
  readonly onSuccess?: () => unknown
}

export function useAgregarPermisoARol(
  rolId: string,
  opciones: OpcionesEditarPermisosRol = {},
) {
  return useMutar<AgregarPermisoARolPayload, void>({
    fn: (payload) => agregarPermisoARol(rolId, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useRevocarPermisoDeRol(
  rolId: string,
  opciones: OpcionesEditarPermisosRol = {},
) {
  return useMutar<string, void>({
    fn: (codigoPermiso) => revocarPermisoDeRol(rolId, codigoPermiso),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

// Aplica un set final de permisos al rol — el servicio calcula el diff y
// dispara add/remove en paralelo. El componente debe refetchear el rol con
// onSuccess para reflejar fallos parciales (no hay transaccion).
export interface OpcionesEditarPermisosBulk {
  readonly onSuccess?: (resultado: ResultadoEditarPermisosRol) => unknown
}

export function useEditarPermisosRol(
  rolId: string,
  codigosActuales: ReadonlyArray<string>,
  opciones: OpcionesEditarPermisosBulk = {},
) {
  return useMutar<ReadonlyArray<string>, ResultadoEditarPermisosRol>({
    fn: (codigosFinales) =>
      editarPermisosRol(rolId, codigosActuales, codigosFinales),
    onSuccess: (resultado) => opciones.onSuccess?.(resultado),
  })
}
