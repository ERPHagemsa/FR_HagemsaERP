import { clienteHttp } from "@/compartido/api/cliente-http"
import type {
  RespuestaPaginada,
  RespuestaRecurso,
} from "@/compartido/api/contrato"

import type {
  AsignacionResponse,
  AsignarRolPayload,
  AsignarRolResponse,
  CambiarScopeAsignacionPayload,
  ListaAsignacionesResponse,
  RevocarAsignacionPayload,
} from "../tipos/administracion.tipos"

// Las asignaciones viven bajo /api/admin/cuentas/:cuentaId/roles segun el
// backend (asignaciones-admin.controller.ts). Devuelve {datos, paginacion}.

export async function obtenerAsignacionesCuenta(
  cuentaId: string,
  incluirHistorico = false,
): Promise<ListaAsignacionesResponse> {
  const query = incluirHistorico ? "?historico=true" : ""
  const { data } = await clienteHttp.get<RespuestaPaginada<AsignacionResponse>>(
    `/api/admin/cuentas/${cuentaId}/roles${query}`,
  )
  return { datos: data.datos, paginacion: data.paginacion }
}

export async function asignarRol(
  cuentaId: string,
  payload: AsignarRolPayload,
): Promise<AsignarRolResponse> {
  const { data } = await clienteHttp.post<RespuestaRecurso<AsignarRolResponse>>(
    `/api/admin/cuentas/${cuentaId}/roles`,
    payload,
  )
  return data.datos
}

export async function cambiarScopeAsignacion(
  cuentaId: string,
  asignacionId: string,
  payload: CambiarScopeAsignacionPayload,
): Promise<void> {
  await clienteHttp.patch(
    `/api/admin/cuentas/${cuentaId}/roles/${asignacionId}/scope`,
    payload,
  )
}

export async function revocarAsignacion(
  cuentaId: string,
  asignacionId: string,
  payload: RevocarAsignacionPayload,
): Promise<void> {
  await clienteHttp.post(
    `/api/admin/cuentas/${cuentaId}/roles/${asignacionId}/revocar`,
    payload,
  )
}
