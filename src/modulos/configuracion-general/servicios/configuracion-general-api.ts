import { clienteConfiguracionGeneral } from "@/compartido/api/clientes-backend"

import type {
  AnularConfiguracionGeneralRequest,
  ConfiguracionGeneralResponse,
  ConsultarConfiguracionGeneralQuery,
  EstadoBcConfiguracionGeneralResponse,
  ExportarConfiguracionGeneralQuery,
  InhabilitarConfiguracionGeneralRequest,
  ModificarConfiguracionGeneralRequest,
  PaginatedResponse,
  ReactivarConfiguracionGeneralRequest,
  RegistrarConfiguracionGeneralRequest,
} from "../tipos/configuracion-general"

const BASE_ENDPOINT = "/configuracion-general"

type RespuestaConDatos<T> = {
  datos: T
}

function crearQueryString(query?: ConsultarConfiguracionGeneralQuery): string {
  const params = new URLSearchParams()

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

function extraerDatos<T>(respuesta: T | RespuestaConDatos<T>): T {
  if (
    respuesta &&
    typeof respuesta === "object" &&
    "datos" in respuesta &&
    !Array.isArray((respuesta as { datos: unknown }).datos)
  ) {
    return (respuesta as RespuestaConDatos<T>).datos
  }

  return respuesta as T
}

export async function obtenerEstadoBcConfiguracionGeneral(): Promise<EstadoBcConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    EstadoBcConfiguracionGeneralResponse | RespuestaConDatos<EstadoBcConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/estado`)
  return extraerDatos(data)
}

export async function registrarConfiguracionGeneral(
  payload: RegistrarConfiguracionGeneralRequest,
): Promise<ConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.post<
    ConfiguracionGeneralResponse | RespuestaConDatos<ConfiguracionGeneralResponse>
  >(BASE_ENDPOINT, payload)
  return extraerDatos(data)
}

export async function modificarConfiguracionGeneral(
  id: string,
  payload: ModificarConfiguracionGeneralRequest,
): Promise<ConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.put<
    ConfiguracionGeneralResponse | RespuestaConDatos<ConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/${id}`, payload)
  return extraerDatos(data)
}

export async function inhabilitarConfiguracionGeneral(
  id: string,
  payload: InhabilitarConfiguracionGeneralRequest,
): Promise<ConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.patch<
    ConfiguracionGeneralResponse | RespuestaConDatos<ConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/${id}/inhabilitar`, payload)
  return extraerDatos(data)
}

export async function reactivarConfiguracionGeneral(
  id: string,
  payload: ReactivarConfiguracionGeneralRequest,
): Promise<ConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.patch<
    ConfiguracionGeneralResponse | RespuestaConDatos<ConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/${id}/reactivar`, payload)
  return extraerDatos(data)
}

export async function anularConfiguracionGeneral(
  id: string,
  payload: AnularConfiguracionGeneralRequest,
): Promise<ConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.patch<
    ConfiguracionGeneralResponse | RespuestaConDatos<ConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/${id}/anular`, payload)
  return extraerDatos(data)
}

export async function consultarConfiguracionGeneral(
  query?: ConsultarConfiguracionGeneralQuery,
): Promise<PaginatedResponse<ConfiguracionGeneralResponse>> {
  const { data } = await clienteConfiguracionGeneral.get<
    PaginatedResponse<ConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}${crearQueryString(query)}`)
  return data
}

export async function consultarCatalogoConfiguracionGeneral(
  query?: ConsultarConfiguracionGeneralQuery,
): Promise<PaginatedResponse<ConfiguracionGeneralResponse>> {
  const { data } = await clienteConfiguracionGeneral.get<
    PaginatedResponse<ConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/catalogo${crearQueryString(query)}`)
  return data
}

export async function exportarConfiguracionGeneral(
  query?: ExportarConfiguracionGeneralQuery,
): Promise<PaginatedResponse<ConfiguracionGeneralResponse>> {
  const { data } = await clienteConfiguracionGeneral.get<
    PaginatedResponse<ConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/exportar${crearQueryString(query)}`)
  return data
}
