import { clienteSocioNegocios } from "@/compartido/api/clientes-backend"

import type {
  ConsultarSociosDeNegocioQuery,
  DarDeBajaSocioDeNegocioRequest,
  EstadoBcResponse,
  ExportarSociosDeNegocioQuery,
  ModificarSocioDeNegocioRequest,
  PaginatedResponse,
  ReactivarSocioDeNegocioRequest,
  RegistrarClienteDesdeComercialRequest,
  RegistrarSocioDeNegocioRequest,
  ReporteSociosDeNegocioResponse,
  SocioDeNegocioResponse,
} from "../tipos/socio-negocio"

const BASE_ENDPOINT = "/socios-de-negocio"

function crearQueryString(
  query?: ConsultarSociosDeNegocioQuery | ExportarSociosDeNegocioQuery,
): string {
  const params = new URLSearchParams()

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

export async function obtenerEstadoBcSocioDeNegocio(): Promise<EstadoBcResponse> {
  const { data } = await clienteSocioNegocios.get<EstadoBcResponse>(
    `${BASE_ENDPOINT}/estado`,
  )
  return data
}

export async function registrarSocioDeNegocio(
  payload: RegistrarSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.post<SocioDeNegocioResponse>(
    BASE_ENDPOINT,
    payload,
  )
  return data
}

export async function registrarClienteDesdeComercial(
  payload: RegistrarClienteDesdeComercialRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.post<SocioDeNegocioResponse>(
    `${BASE_ENDPOINT}/desde-comercial/prospecto-convertido-a-cliente`,
    payload,
  )
  return data
}

export async function modificarSocioDeNegocio(
  id: string,
  payload: ModificarSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.put<SocioDeNegocioResponse>(
    `${BASE_ENDPOINT}/${id}`,
    payload,
  )
  return data
}

export async function darDeBajaSocioDeNegocio(
  id: string,
  payload: DarDeBajaSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.patch<SocioDeNegocioResponse>(
    `${BASE_ENDPOINT}/${id}/baja`,
    payload,
  )
  return data
}

export async function reactivarSocioDeNegocio(
  id: string,
  payload: ReactivarSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.patch<SocioDeNegocioResponse>(
    `${BASE_ENDPOINT}/${id}/reactivar`,
    payload,
  )
  return data
}

export async function consultarSociosDeNegocio(
  query?: ConsultarSociosDeNegocioQuery,
): Promise<PaginatedResponse<SocioDeNegocioResponse>> {
  const { data } = await clienteSocioNegocios.get<
    PaginatedResponse<SocioDeNegocioResponse>
  >(`${BASE_ENDPOINT}${crearQueryString(query)}`)
  return data
}

export async function exportarSociosDeNegocio(
  query: ExportarSociosDeNegocioQuery,
): Promise<ReporteSociosDeNegocioResponse> {
  const { data } =
    await clienteSocioNegocios.get<ReporteSociosDeNegocioResponse>(
      `${BASE_ENDPOINT}/exportar${crearQueryString(query)}`,
    )
  return data
}

export async function obtenerSocioDeNegocio(
  id: string,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.get<SocioDeNegocioResponse>(
    `${BASE_ENDPOINT}/${id}`,
  )
  return data
}
