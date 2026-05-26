import { clienteHttp } from "@/compartido/api/cliente-http"

import type {
  CrearCuentaPayload,
  CrearCuentaResponse,
  CuentaResponse,
  ListaCuentasResponse,
  ListarCuentasQuery,
  ResetPasswordResponse,
  SetPasswordPayload,
  SuspenderCuentaPayload,
} from "../tipos/administracion.tipos"

function construirQuery(query: ListarCuentasQuery): string {
  const params = new URLSearchParams()
  if (query.estado) params.set("estado", query.estado)
  if (query.tipoCuenta) params.set("tipoCuenta", query.tipoCuenta)
  if (query.busqueda) params.set("busqueda", query.busqueda)
  if (query.offset !== undefined) params.set("offset", String(query.offset))
  if (query.limit !== undefined) params.set("limit", String(query.limit))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export async function obtenerCuentas(
  query: ListarCuentasQuery = {},
): Promise<ListaCuentasResponse> {
  const { data } = await clienteHttp.get<ListaCuentasResponse>(
    `/api/admin/cuentas${construirQuery(query)}`,
  )
  return data
}

export async function obtenerCuenta(id: string): Promise<CuentaResponse> {
  const { data } = await clienteHttp.get<CuentaResponse>(
    `/api/admin/cuentas/${id}`,
  )
  return data
}

export async function crearCuenta(
  payload: CrearCuentaPayload,
): Promise<CrearCuentaResponse> {
  const { data } = await clienteHttp.post<CrearCuentaResponse>(
    "/api/admin/cuentas",
    payload,
  )
  return data
}

export async function suspenderCuenta(
  id: string,
  payload: SuspenderCuentaPayload,
): Promise<void> {
  await clienteHttp.post(`/api/admin/cuentas/${id}/suspender`, payload)
}

export async function reactivarCuenta(id: string): Promise<void> {
  await clienteHttp.post(`/api/admin/cuentas/${id}/reactivar`, {})
}

export async function setPassword(
  id: string,
  payload: SetPasswordPayload,
): Promise<void> {
  await clienteHttp.post(`/api/admin/cuentas/${id}/set-password`, payload)
}

export async function resetPasswordAdmin(
  id: string,
): Promise<ResetPasswordResponse> {
  const { data } = await clienteHttp.post<ResetPasswordResponse>(
    `/api/admin/cuentas/${id}/reset-password`,
  )
  return data
}
