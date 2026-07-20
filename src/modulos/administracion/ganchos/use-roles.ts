"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  actualizarPermiso,
  actualizarRol,
  agregarPermisoARol,
  crearPermiso,
  crearRol,
  eliminarPermiso,
  eliminarRol,
  obtenerPermisos,
  obtenerRol,
  obtenerRoles,
  reemplazarPermisosDeRol,
  revocarPermisoDeRol,
} from "../servicios/roles-api"
import type {
  ActualizarPermisoPayload,
  ActualizarRolPayload,
  AgregarPermisoARolPayload,
  CrearPermisoPayload,
  CrearPermisoResponse,
  CrearRolPayload,
  CrearRolResponse,
  ListarPermisosQuery,
  ListarRolesQuery,
} from "../tipos/administracion.tipos"

export function useRoles(query: ListarRolesQuery = {}) {
  return useConsulta(() => obtenerRoles(query), [query.pagina, query.limite])
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

export function usePermisos(query: ListarPermisosQuery = {}) {
  return useConsulta(() => obtenerPermisos(query), [
    query.pagina,
    query.limite,
    query.busqueda,
  ])
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

// Deja el rol con exactamente los permisos recibidos (editor masivo). Un solo
// PUT atomico: o se aplica todo o no se aplica nada, asi que no hay estados
// parciales que reconciliar en la UI.
export interface OpcionesEditarPermisosBulk {
  readonly onSuccess?: () => unknown
}

export function useEditarPermisosRol(
  rolId: string,
  opciones: OpcionesEditarPermisosBulk = {},
) {
  return useMutar<ReadonlyArray<string>, void>({
    fn: (codigosFinales) => reemplazarPermisosDeRol(rolId, codigosFinales),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
