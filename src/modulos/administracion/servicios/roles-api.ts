import { clienteHttp } from "@/compartido/api/cliente-http"

import type {
  CrearRolPayload,
  CrearRolResponse,
  ListaPermisosResponse,
  ListaRolesResponse,
  RolResponse,
} from "../tipos/administracion.tipos"

export async function obtenerRoles(): Promise<ListaRolesResponse> {
  const { data } = await clienteHttp.get<ListaRolesResponse>("/api/admin/roles")
  return data
}

export async function obtenerRol(id: string): Promise<RolResponse> {
  const { data } = await clienteHttp.get<RolResponse>(`/api/admin/roles/${id}`)
  return data
}

export async function crearRol(
  payload: CrearRolPayload,
): Promise<CrearRolResponse> {
  const { data } = await clienteHttp.post<CrearRolResponse>(
    "/api/admin/roles",
    payload,
  )
  return data
}

export async function obtenerPermisos(
  modulo?: string,
): Promise<ListaPermisosResponse> {
  const query = modulo ? `?modulo=${encodeURIComponent(modulo)}` : ""
  const { data } = await clienteHttp.get<ListaPermisosResponse>(
    `/api/admin/permisos${query}`,
  )
  return data
}
