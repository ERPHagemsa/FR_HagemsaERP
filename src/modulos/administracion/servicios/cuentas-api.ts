import { clienteHttp } from "@/compartido/api/cliente-http"
import type {
  RespuestaPaginada,
  RespuestaRecurso,
} from "@/compartido/api/contrato"

import type {
  ActualizarCodigosPayload,
  ActualizarCuentaPayload,
  CrearCuentaPayload,
  CrearCuentaResponse,
  CuentaResponse,
  DesactivarCuentaPayload,
  ListaCuentasResponse,
  ListarCuentasQuery,
  ResetPasswordResponse,
  SetPasswordPayload,
  SuspenderCuentaPayload,
  VincularSocioPayload,
} from "../tipos/administracion.tipos"

function construirQuery(query: ListarCuentasQuery): string {
  const params = new URLSearchParams()
  if (query.estado) params.set("estado", query.estado)
  if (query.tipoCuenta) params.set("tipoCuenta", query.tipoCuenta)
  if (query.busqueda) params.set("busqueda", query.busqueda)
  if (query.pagina !== undefined) params.set("pagina", String(query.pagina))
  if (query.limite !== undefined) params.set("limite", String(query.limite))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

// El backend devuelve { datos, paginacion } como envoltura estandar de listas.
// El servicio pasa la respuesta tal cual a la UI (que ya lee `datos` y `paginacion`).
export async function obtenerCuentas(
  query: ListarCuentasQuery = {},
): Promise<ListaCuentasResponse> {
  const { data } = await clienteHttp.get<RespuestaPaginada<CuentaResponse>>(
    `/api/admin/cuentas${construirQuery(query)}`,
  )
  return { datos: data.datos, paginacion: data.paginacion }
}

export async function obtenerCuenta(id: string): Promise<CuentaResponse> {
  const { data } = await clienteHttp.get<RespuestaRecurso<CuentaResponse>>(
    `/api/admin/cuentas/${id}`,
  )
  return data.datos
}

export async function crearCuenta(
  payload: CrearCuentaPayload,
): Promise<CrearCuentaResponse> {
  const { data } = await clienteHttp.post<RespuestaRecurso<CrearCuentaResponse>>(
    "/api/admin/cuentas",
    payload,
  )
  return data.datos
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
  const { data } = await clienteHttp.post<
    RespuestaRecurso<ResetPasswordResponse>
  >(`/api/admin/cuentas/${id}/reset-password`)
  return data.datos
}

export async function actualizarCuenta(
  id: string,
  payload: ActualizarCuentaPayload,
): Promise<void> {
  await clienteHttp.patch(`/api/admin/cuentas/${id}`, payload)
}

// Setea, edita o limpia (ambos null) los codigos internos de la cuenta.
export async function actualizarCodigosCuenta(
  id: string,
  payload: ActualizarCodigosPayload,
): Promise<void> {
  await clienteHttp.patch(`/api/admin/cuentas/${id}/codigos`, payload)
}

// Vincula un socio de BC01 a una cuenta existente (1:1).
export async function vincularSocioCuenta(
  id: string,
  payload: VincularSocioPayload,
): Promise<void> {
  await clienteHttp.post(`/api/admin/cuentas/${id}/vincular-socio`, payload)
}

// Desactivacion logica — el backend espera body en la DELETE para la razon.
export async function desactivarCuenta(
  id: string,
  payload: DesactivarCuentaPayload,
): Promise<void> {
  await clienteHttp.delete(`/api/admin/cuentas/${id}`, { data: payload })
}

// Cuentas (distintas de `excluyendoId`) que ya usan ese correo. El correo NO es
// unico, asi que esto no bloquea nada: alimenta una advertencia para que quien
// administra sepa que la casilla ya esta en uso y decida.
//
// Reusa el listado con `busqueda`, que en el backend matchea email, usuario y
// nombre por LIKE; por eso hay que filtrar el email exacto del lado del cliente.
export async function cuentasConEseCorreo(
  email: string,
  excluyendoId?: string,
): Promise<ReadonlyArray<CuentaResponse>> {
  const buscado = email.trim().toLowerCase()
  if (!buscado) return []
  const { datos } = await obtenerCuentas({ busqueda: buscado, limite: 100 })
  return datos.filter(
    (c) => c.email.toLowerCase() === buscado && c.id !== excluyendoId,
  )
}
