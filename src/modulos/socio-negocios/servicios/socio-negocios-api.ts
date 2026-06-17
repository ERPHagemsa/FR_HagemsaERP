import { clienteSocioNegocios } from "@/compartido/api/clientes-backend"

import type {
  AprobarSocioDeNegocioRequest,
  ClientePorDocumentoResponse,
  ConsultarSapPorDocumentoQuery,
  ConsultarHistorialSocioDeNegocioQuery,
  ConsultarSociosDeNegocioQuery,
  DarDeBajaSocioDeNegocioRequest,
  EstadoBcResponse,
  EventoSocioDeNegocioResponse,
  ExportarSociosDeNegocioQuery,
  HistorialSocioDeNegocioResponse,
  ModificarSocioDeNegocioRequest,
  PaginatedResponse,
  ReactivarSocioDeNegocioRequest,
  RechazarSocioDeNegocioRequest,
  RegistrarClienteDesdeComercialRequest,
  RegistrarDesdeSapRequest,
  RegistrarSocioDeNegocioRequest,
  ReporteSociosDeNegocioResponse,
  RespuestaDto,
  ResumenSociosDeNegocioResponse,
  SapBusinessPartnerResponse,
  SapBusinessPartnerResumenResponse,
  SapSessionQuery,
  SocioDeNegocioResponse,
} from "../tipos/socio-negocio"

const BASE_ENDPOINT = "/socio-negocios/socios-de-negocio"

function crearQueryString(
  query?:
    | ConsultarSociosDeNegocioQuery
    | ExportarSociosDeNegocioQuery
    | ConsultarHistorialSocioDeNegocioQuery
    | ConsultarSapPorDocumentoQuery
    | SapSessionQuery,
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
  id: string | number,
  payload: ModificarSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.put<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}`,
    payload,
  )
  return data.datos
}

export async function aprobarSocioDeNegocio(
  id: string | number,
  payload: AprobarSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.patch<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}/aprobar`,
    payload,
  )
  return data.datos
}

export async function rechazarSocioDeNegocio(
  id: string | number,
  payload: RechazarSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.patch<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}/rechazar`,
    payload,
  )
  return data.datos
}

export async function darDeBajaSocioDeNegocio(
  id: string | number,
  payload: DarDeBajaSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.patch<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}/baja`,
    payload,
  )
  return data.datos
}

export async function reactivarSocioDeNegocio(
  id: string | number,
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

export async function consultarSapBusinessPartnerPorDocumento(
  numeroDocumento: string,
  query: ConsultarSapPorDocumentoQuery,
): Promise<SapBusinessPartnerResumenResponse | null> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<SapBusinessPartnerResumenResponse | null>
  >(
    `${BASE_ENDPOINT}/sap/business-partners/documento/${encodeURIComponent(
      numeroDocumento,
    )}${crearQueryString(query)}`,
  )
  return data.datos
}

export async function consultarSapBusinessPartnerPorCodigo(
  codigoInternoSap: string,
  query?: SapSessionQuery,
): Promise<SapBusinessPartnerResponse | null> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<SapBusinessPartnerResponse | null>
  >(
    `${BASE_ENDPOINT}/sap/business-partners/${encodeURIComponent(
      codigoInternoSap,
    )}${crearQueryString(query)}`,
  )
  return data.datos
}

export async function registrarSocioDesdeSap(
  numeroDocumento: string,
  payload: RegistrarDesdeSapRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.post<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/desde-sap/documento/${encodeURIComponent(numeroDocumento)}`,
    payload,
  )
  return data.datos
}

export async function obtenerClientePorDocumento(
  numeroDocumento: string,
): Promise<ClientePorDocumentoResponse> {
  const { data } = await clienteSocioNegocios.get<RespuestaDto<ClientePorDocumentoResponse>>(
    `${BASE_ENDPOINT}/clientes/por-documento/${encodeURIComponent(numeroDocumento)}`,
  )
  return data.datos
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
  id: string | number,
  query?: ConsultarHistorialSocioDeNegocioQuery,
): Promise<PaginatedResponse<HistorialSocioDeNegocioResponse>> {
  const { data } = await clienteSocioNegocios.get<
    PaginatedResponse<HistorialSocioDeNegocioResponse>
  >(`${BASE_ENDPOINT}/${id}/historial${crearQueryString(query)}`)
  return data
}

export async function consultarEventosSociosDeNegocio(): Promise<
  EventoSocioDeNegocioResponse[]
> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<EventoSocioDeNegocioResponse[]>
  >(`${BASE_ENDPOINT}/eventos`)
  return data.datos
}

export async function consultarEventosSocioDeNegocio(
  id: string | number,
): Promise<EventoSocioDeNegocioResponse[]> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<EventoSocioDeNegocioResponse[]>
  >(`${BASE_ENDPOINT}/${id}/eventos`)
  return data.datos
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
