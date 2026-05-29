import { clienteSocioNegocios } from "@/compartido/api/clientes-backend"

import type {
  ConsultarHistorialSocioDeNegocioQuery,
  ConsultarMaestrosConfiguracionGeneralQuery,
  ConsultarSociosDeNegocioQuery,
  DarDeBajaSocioDeNegocioRequest,
  EstadoBcResponse,
  ExportarSociosDeNegocioQuery,
  HistorialSocioDeNegocioResponse,
  MaestroConfiguracionGeneralIntegracion,
  ModificarSocioDeNegocioRequest,
  PaginatedResponse,
  ReactivarSocioDeNegocioRequest,
  RegistrarClienteDesdeComercialRequest,
  RegistrarSocioDeNegocioRequest,
  ReporteSociosDeNegocioResponse,
  RespuestaDto,
  ResumenSociosDeNegocioResponse,
  SocioDeNegocioResponse,
} from "../tipos/socio-negocio"

const BASE_ENDPOINT = "/socios-de-negocio"

function crearQueryString(
  query?:
    | ConsultarSociosDeNegocioQuery
    | ExportarSociosDeNegocioQuery
    | ConsultarHistorialSocioDeNegocioQuery
    | ConsultarMaestrosConfiguracionGeneralQuery,
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
  const { data } = await clienteSocioNegocios.get<RespuestaDto<EstadoBcResponse>>(
    `${BASE_ENDPOINT}/estado`,
  )
  return data.datos
}

export async function obtenerResumenSociosDeNegocio(): Promise<ResumenSociosDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<ResumenSociosDeNegocioResponse>
  >(`${BASE_ENDPOINT}/resumen`)
  return data.datos
}

export async function consultarMaestrosConfiguracionGeneral(
  query: ConsultarMaestrosConfiguracionGeneralQuery,
): Promise<MaestroConfiguracionGeneralIntegracion[]> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<MaestroConfiguracionGeneralIntegracion[]>
  >(`/integracion/configuracion-general/maestros${crearQueryString(query)}`)
  return data.datos
}

export async function registrarSocioDeNegocio(
  payload: RegistrarSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.post<RespuestaDto<SocioDeNegocioResponse>>(
    BASE_ENDPOINT,
    payload,
  )
  return data.datos
}

export async function registrarClienteDesdeComercial(
  payload: RegistrarClienteDesdeComercialRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.post<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/desde-comercial/prospecto-convertido-a-cliente`,
    payload,
  )
  return data.datos
}

export async function modificarSocioDeNegocio(
  id: string,
  payload: ModificarSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.put<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}`,
    payload,
  )
  return data.datos
}

export async function darDeBajaSocioDeNegocio(
  id: string,
  payload: DarDeBajaSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.patch<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}/baja`,
    payload,
  )
  return data.datos
}

export async function reactivarSocioDeNegocio(
  id: string,
  payload: ReactivarSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.patch<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}/reactivar`,
    payload,
  )
  return data.datos
}

export async function consultarSociosDeNegocio(
  query?: ConsultarSociosDeNegocioQuery,
): Promise<PaginatedResponse<SocioDeNegocioResponse>> {
  const { data } = await clienteSocioNegocios.get<
    PaginatedResponse<SocioDeNegocioResponse>
  >(`${BASE_ENDPOINT}${crearQueryString(query)}`)
  return data
}

export async function consultarHistorialSociosDeNegocio(
  query?: ConsultarHistorialSocioDeNegocioQuery,
): Promise<PaginatedResponse<HistorialSocioDeNegocioResponse>> {
  const { data } = await clienteSocioNegocios.get<
    PaginatedResponse<HistorialSocioDeNegocioResponse>
  >(`${BASE_ENDPOINT}/historial${crearQueryString(query)}`)
  return data
}

export async function consultarHistorialSocioDeNegocio(
  id: string,
  query?: ConsultarHistorialSocioDeNegocioQuery,
): Promise<PaginatedResponse<HistorialSocioDeNegocioResponse>> {
  const { data } = await clienteSocioNegocios.get<
    PaginatedResponse<HistorialSocioDeNegocioResponse>
  >(`${BASE_ENDPOINT}/${id}/historial${crearQueryString(query)}`)
  return data
}

export async function exportarSociosDeNegocio(
  query: ExportarSociosDeNegocioQuery,
): Promise<PaginatedResponse<ReporteSociosDeNegocioResponse>> {
  const { data } =
    await clienteSocioNegocios.get<
      PaginatedResponse<ReporteSociosDeNegocioResponse>
    >(
      `${BASE_ENDPOINT}/exportar${crearQueryString(query)}`,
    )
  return data
}

export async function obtenerSocioDeNegocio(
  id: string,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.get<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}`,
  )
  return data.datos
}
