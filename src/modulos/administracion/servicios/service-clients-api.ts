import { clienteHttp } from "@/compartido/api/cliente-http"
import type {
  RespuestaPaginada,
  RespuestaRecurso,
} from "@/compartido/api/contrato"

import type {
  AsignarRolesServiceClientPayload,
  CrearServiceClientPayload,
  CrearServiceClientResponse,
  ListaServiceClientsResponse,
  ListarServiceClientsQuery,
  RotarSecretoPayload,
  RotarSecretoResponse,
  ServiceClientResponse,
} from "../tipos/administracion.tipos"

function construirQuery(query: ListarServiceClientsQuery): string {
  const params = new URLSearchParams()
  if (query.estado) params.set("estado", query.estado)
  if (query.busqueda) params.set("busqueda", query.busqueda)
  if (query.pagina !== undefined) params.set("pagina", String(query.pagina))
  if (query.limite !== undefined) params.set("limite", String(query.limite))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export async function obtenerServiceClients(
  query: ListarServiceClientsQuery = {},
): Promise<ListaServiceClientsResponse> {
  const { data } = await clienteHttp.get<
    RespuestaPaginada<ServiceClientResponse>
  >(`/api/admin/service-clients${construirQuery(query)}`)
  return { datos: data.datos, paginacion: data.paginacion }
}

export async function obtenerServiceClient(
  id: string,
): Promise<ServiceClientResponse> {
  const { data } = await clienteHttp.get<
    RespuestaRecurso<ServiceClientResponse>
  >(`/api/admin/service-clients/${id}`)
  return data.datos
}

export async function crearServiceClient(
  payload: CrearServiceClientPayload,
): Promise<CrearServiceClientResponse> {
  const { data } = await clienteHttp.post<
    RespuestaRecurso<CrearServiceClientResponse>
  >("/api/admin/service-clients", payload)
  return data.datos
}

export async function rotarSecreto(
  id: string,
  payload: RotarSecretoPayload = {},
): Promise<RotarSecretoResponse> {
  const { data } = await clienteHttp.post<RespuestaRecurso<RotarSecretoResponse>>(
    `/api/admin/service-clients/${id}/rotar-secreto`,
    payload,
  )
  return data.datos
}

export async function revocarSecreto(
  id: string,
  secretoId: string,
): Promise<void> {
  await clienteHttp.post(
    `/api/admin/service-clients/${id}/revocar-secreto/${secretoId}`,
    {},
  )
}

export async function suspenderServiceClient(id: string): Promise<void> {
  await clienteHttp.post(`/api/admin/service-clients/${id}/suspender`, {})
}

export async function reactivarServiceClient(id: string): Promise<void> {
  await clienteHttp.post(`/api/admin/service-clients/${id}/reactivar`, {})
}

export async function asignarRolesServiceClient(
  id: string,
  payload: AsignarRolesServiceClientPayload,
): Promise<void> {
  await clienteHttp.put(`/api/admin/service-clients/${id}/roles`, payload)
}
