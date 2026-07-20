import { clienteHttp } from "@/compartido/api/cliente-http"
import type {
  RespuestaPaginada,
  RespuestaRecurso,
} from "@/compartido/api/contrato"

import type {
  ActualizarPermisoPayload,
  ActualizarRolPayload,
  AgregarPermisoARolPayload,
  CrearPermisoPayload,
  CrearPermisoResponse,
  CrearRolPayload,
  CrearRolResponse,
  ListaPermisosResponse,
  ListaRolesResponse,
  ListarPermisosQuery,
  ListarRolesQuery,
  PermisoResponse,
  RolResponse,
} from "../tipos/administracion.tipos"

function construirQueryRoles(query: ListarRolesQuery): string {
  const params = new URLSearchParams()
  if (query.pagina !== undefined) params.set("pagina", String(query.pagina))
  if (query.limite !== undefined) params.set("limite", String(query.limite))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

// El backend pagina la lista (envoltura estandar { datos, paginacion }); el
// servicio la pasa tal cual a la UI.
export async function obtenerRoles(
  query: ListarRolesQuery = {},
): Promise<ListaRolesResponse> {
  const { data } = await clienteHttp.get<RespuestaPaginada<RolResponse>>(
    `/api/admin/roles${construirQueryRoles(query)}`,
  )
  return { datos: data.datos, paginacion: data.paginacion }
}

export async function obtenerRol(id: string): Promise<RolResponse> {
  const { data } = await clienteHttp.get<RespuestaRecurso<RolResponse>>(
    `/api/admin/roles/${id}`,
  )
  return data.datos
}

export async function crearRol(
  payload: CrearRolPayload,
): Promise<CrearRolResponse> {
  const { data } = await clienteHttp.post<RespuestaRecurso<CrearRolResponse>>(
    "/api/admin/roles",
    payload,
  )
  return data.datos
}

export async function actualizarRol(
  rolId: string,
  payload: ActualizarRolPayload,
): Promise<void> {
  await clienteHttp.patch(`/api/admin/roles/${rolId}`, payload)
}

export async function eliminarRol(rolId: string): Promise<void> {
  await clienteHttp.delete(`/api/admin/roles/${rolId}`)
}

function construirQueryPermisos(query: ListarPermisosQuery): string {
  const params = new URLSearchParams()
  if (query.pagina !== undefined) params.set("pagina", String(query.pagina))
  if (query.limite !== undefined) params.set("limite", String(query.limite))
  if (query.busqueda) params.set("busqueda", query.busqueda)
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

// El backend pagina si se pasan pagina/limite; sin params devuelve el catalogo
// completo (lo usa el editor masivo de permisos del rol).
export async function obtenerPermisos(
  query: ListarPermisosQuery = {},
): Promise<ListaPermisosResponse> {
  const { data } = await clienteHttp.get<RespuestaPaginada<PermisoResponse>>(
    `/api/admin/permisos${construirQueryPermisos(query)}`,
  )
  return { datos: data.datos, paginacion: data.paginacion }
}

export async function crearPermiso(
  payload: CrearPermisoPayload,
): Promise<CrearPermisoResponse> {
  const { data } = await clienteHttp.post<
    RespuestaRecurso<CrearPermisoResponse>
  >("/api/admin/permisos", payload)
  return data.datos
}

export async function actualizarPermiso(
  permisoId: string,
  payload: ActualizarPermisoPayload,
): Promise<void> {
  await clienteHttp.patch(`/api/admin/permisos/${permisoId}`, payload)
}

export async function eliminarPermiso(permisoId: string): Promise<void> {
  await clienteHttp.delete(`/api/admin/permisos/${permisoId}`)
}

export async function agregarPermisoARol(
  rolId: string,
  payload: AgregarPermisoARolPayload,
): Promise<void> {
  await clienteHttp.post(`/api/admin/roles/${rolId}/permisos`, payload)
}

export async function revocarPermisoDeRol(
  rolId: string,
  codigoPermiso: string,
): Promise<void> {
  await clienteHttp.delete(
    `/api/admin/roles/${rolId}/permisos/${encodeURIComponent(codigoPermiso)}`,
  )
}

// Deja el rol con EXACTAMENTE estos permisos: un solo PUT, atomico en el
// backend (todo-o-nada). El body describe el estado final, no un delta.
//
// Antes esto calculaba el diff y disparaba un request por permiso en paralelo.
// Cada uno leia el rol, sumaba lo suyo y reescribia el set completo, asi que
// se pisaban entre si y solo sobrevivia el ultimo: se guardaba una cantidad
// variable de permisos, siempre menor a la seleccionada.
export async function reemplazarPermisosDeRol(
  rolId: string,
  codigos: ReadonlyArray<string>,
): Promise<void> {
  await clienteHttp.put(`/api/admin/roles/${rolId}/permisos`, { codigos })
}
