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

export async function obtenerPermisos(
  modulo?: string,
): Promise<ListaPermisosResponse> {
  const query = modulo ? `?modulo=${encodeURIComponent(modulo)}` : ""
  const { data } = await clienteHttp.get<RespuestaPaginada<PermisoResponse>>(
    `/api/admin/permisos${query}`,
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

// Resultado de la operacion bulk. Conserva el detalle de que codigos fallaron
// para que la UI pueda mostrar al admin que cambios no se aplicaron y queden
// pendientes (en vez de hacer rollback automatico, que requiere transacciones
// en el backend).
export interface ResultadoEditarPermisosRol {
  readonly agregados: ReadonlyArray<string>
  readonly removidos: ReadonlyArray<string>
  readonly fallaronAgregar: ReadonlyArray<{ codigo: string; error: unknown }>
  readonly fallaronRemover: ReadonlyArray<{ codigo: string; error: unknown }>
}

// Aplica un set final de permisos a un rol calculando el diff contra el set
// actual y disparando los add/remove necesarios en paralelo. No envuelve en
// transaccion — si una llamada falla, las otras igual se aplican. La UI debe
// refetchear el rol al terminar para reflejar el estado real.
export async function editarPermisosRol(
  rolId: string,
  codigosActuales: ReadonlyArray<string>,
  codigosFinales: ReadonlyArray<string>,
): Promise<ResultadoEditarPermisosRol> {
  const setActual = new Set(codigosActuales)
  const setFinal = new Set(codigosFinales)
  const aAgregar = codigosFinales.filter((c) => !setActual.has(c))
  const aRemover = codigosActuales.filter((c) => !setFinal.has(c))

  const agregados: string[] = []
  const removidos: string[] = []
  const fallaronAgregar: { codigo: string; error: unknown }[] = []
  const fallaronRemover: { codigo: string; error: unknown }[] = []

  await Promise.all([
    ...aAgregar.map(async (codigo) => {
      try {
        await agregarPermisoARol(rolId, { codigoPermiso: codigo })
        agregados.push(codigo)
      } catch (error) {
        fallaronAgregar.push({ codigo, error })
      }
    }),
    ...aRemover.map(async (codigo) => {
      try {
        await revocarPermisoDeRol(rolId, codigo)
        removidos.push(codigo)
      } catch (error) {
        fallaronRemover.push({ codigo, error })
      }
    }),
  ])

  return { agregados, removidos, fallaronAgregar, fallaronRemover }
}
