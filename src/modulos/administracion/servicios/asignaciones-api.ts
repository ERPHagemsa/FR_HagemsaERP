import { clienteHttp } from "@/compartido/api/cliente-http"

import type {
  AsignarRolPayload,
  AsignarRolResponse,
  ListaAsignacionesResponse,
  RevocarAsignacionPayload,
} from "../tipos/administracion.tipos"

// Las asignaciones viven bajo /api/admin/cuentas/:cuentaId/roles segun el
// backend (asignaciones-admin.controller.ts).

export async function obtenerAsignacionesCuenta(
  cuentaId: string,
  incluirHistorico = false,
): Promise<ListaAsignacionesResponse> {
  const query = incluirHistorico ? "?historico=true" : ""
  const { data } = await clienteHttp.get<ListaAsignacionesResponse>(
    `/api/admin/cuentas/${cuentaId}/roles${query}`,
  )
  return data
}

export async function asignarRol(
  cuentaId: string,
  payload: AsignarRolPayload,
): Promise<AsignarRolResponse> {
  const { data } = await clienteHttp.post<AsignarRolResponse>(
    `/api/admin/cuentas/${cuentaId}/roles`,
    payload,
  )
  return data
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
