import { clienteSocioNegocios } from "@/compartido/api/clientes-backend"

import type {
  AprobarSocioDeNegocioRequest,
  ClientePorDocumentoResponse,
  ConsultarSapPorDocumentoQuery,
  ConsultarEventosSocioDeNegocioQuery,
  ConsultarHistorialSocioDeNegocioQuery,
  ConsultarPersonalQuery,
  ConsultarSociosDeNegocioQuery,
  DarDeBajaSocioDeNegocioRequest,
  EstadoBcResponse,
  EventoSocioDeNegocioResponse,
  ExportarSociosDeNegocioQuery,
  HistorialSocioDeNegocioResponse,
  LineaHistoricaPersonalResponse,
  ModificarSocioDeNegocioRequest,
  PaginatedResponse,
  PersonalListadoResponse,
  ReactivarSocioDeNegocioRequest,
  RechazarSocioDeNegocioRequest,
  ReemplazarSocioDeNegocioRequest,
  ReenviarAprobacionSocioDeNegocioRequest,
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
  SocioEmpresaListadoResponse,
  TipoSocioDeNegocio,
} from "../tipos/socio-negocio"

const BASE_ENDPOINT = "/socios-de-negocio"

type RespuestaPaginadaBackend<T> = {
  datos: T[]
  paginacion: {
    totalItems?: number
    totalPaginas?: number
    paginaActual?: number
    tamanioPagina?: number
    pagina?: number
    limite?: number
    total?: number
    tieneSiguiente?: boolean
    tieneAnterior?: boolean
  }
}

function normalizarRespuestaPaginada<T>(
  respuesta: RespuestaPaginadaBackend<T>,
): PaginatedResponse<T> {
  const paginacion = respuesta.paginacion
  const pagina = paginacion.pagina ?? paginacion.paginaActual ?? 1
  const limite = paginacion.limite ?? paginacion.tamanioPagina ?? respuesta.datos.length
  const total = paginacion.total ?? paginacion.totalItems ?? respuesta.datos.length
  const totalPaginas = paginacion.totalPaginas ?? Math.max(1, Math.ceil(total / Math.max(limite, 1)))

  return {
    datos: respuesta.datos,
    paginacion: {
      pagina,
      limite,
      total,
      totalPaginas,
      tieneSiguiente: paginacion.tieneSiguiente ?? pagina < totalPaginas,
      tieneAnterior: paginacion.tieneAnterior ?? pagina > 1,
    },
  }
}

function crearQueryString(
  query?:
    | ConsultarSociosDeNegocioQuery
    | ConsultarPersonalQuery
    | ExportarSociosDeNegocioQuery
    | ConsultarHistorialSocioDeNegocioQuery
    | ConsultarEventosSocioDeNegocioQuery
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

export async function reemplazarSocioDeNegocio(
  id: string | number,
  payload: ReemplazarSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.post<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}/reemplazo`,
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

export async function reenviarAprobacionSocioDeNegocio(
  id: string | number,
  payload: ReenviarAprobacionSocioDeNegocioRequest,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.patch<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}/reenviar-aprobacion`,
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
    RespuestaPaginadaBackend<SocioDeNegocioResponse>
  >(`${BASE_ENDPOINT}${crearQueryString(query)}`)
  return normalizarRespuestaPaginada(data)
}

export async function consultarClientesSociosDeNegocio(
  query?: ConsultarSociosDeNegocioQuery,
): Promise<PaginatedResponse<SocioEmpresaListadoResponse>> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaPaginadaBackend<SocioEmpresaListadoResponse>
  >(`${BASE_ENDPOINT}/clientes${crearQueryString(query)}`)
  return normalizarRespuestaPaginada(data)
}

export async function consultarProveedoresSociosDeNegocio(
  query?: ConsultarSociosDeNegocioQuery,
): Promise<PaginatedResponse<SocioEmpresaListadoResponse>> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaPaginadaBackend<SocioEmpresaListadoResponse>
  >(`${BASE_ENDPOINT}/proveedores${crearQueryString(query)}`)
  return normalizarRespuestaPaginada(data)
}

export async function consultarPersonalSociosDeNegocio(
  query?: ConsultarPersonalQuery,
): Promise<PaginatedResponse<PersonalListadoResponse>> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaPaginadaBackend<PersonalListadoResponse>
  >(`${BASE_ENDPOINT}/personal${crearQueryString(query)}`)
  return normalizarRespuestaPaginada(data)
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
    RespuestaPaginadaBackend<HistorialSocioDeNegocioResponse>
  >(`${BASE_ENDPOINT}/historial${crearQueryString(query)}`)
  return normalizarRespuestaPaginada(data)
}

export async function consultarHistorialSocioDeNegocio(
  id: string | number,
  query?: ConsultarHistorialSocioDeNegocioQuery,
): Promise<PaginatedResponse<HistorialSocioDeNegocioResponse>> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaPaginadaBackend<HistorialSocioDeNegocioResponse>
  >(`${BASE_ENDPOINT}/${id}/historial${crearQueryString(query)}`)
  return normalizarRespuestaPaginada(data)
}

export async function consultarEventosSociosDeNegocio(
  query?: ConsultarEventosSocioDeNegocioQuery,
): Promise<PaginatedResponse<EventoSocioDeNegocioResponse>> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaPaginadaBackend<EventoSocioDeNegocioResponse>
  >(`${BASE_ENDPOINT}/eventos${crearQueryString(query)}`)
  return normalizarRespuestaPaginada(data)
}

export async function consultarEventosSocioDeNegocio(
  id: string | number,
  query?: ConsultarEventosSocioDeNegocioQuery,
): Promise<PaginatedResponse<EventoSocioDeNegocioResponse>> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaPaginadaBackend<EventoSocioDeNegocioResponse>
  >(`${BASE_ENDPOINT}/${id}/eventos${crearQueryString(query)}`)
  return normalizarRespuestaPaginada(data)
}

export async function exportarSociosDeNegocio(
  query: ExportarSociosDeNegocioQuery,
): Promise<PaginatedResponse<ReporteSociosDeNegocioResponse>> {
  const { data } =
    await clienteSocioNegocios.get<
      RespuestaPaginadaBackend<ReporteSociosDeNegocioResponse>
    >(
      `${BASE_ENDPOINT}/exportar${crearQueryString(query)}`,
    )
  return normalizarRespuestaPaginada(data)
}

export async function obtenerSocioDeNegocio(
  id: string,
): Promise<SocioDeNegocioResponse> {
  const { data } = await clienteSocioNegocios.get<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${id}`,
  )
  return data.datos
}

export async function obtenerSocioDeNegocioPorTipo(
  id: string,
  tipo: TipoSocioDeNegocio,
): Promise<SocioDeNegocioResponse> {
  const segmentosPorTipo: Record<TipoSocioDeNegocio, string> = {
    CLIENTE: "clientes",
    PROVEEDOR: "proveedores",
    PERSONAL: "personal",
  }
  const { data } = await clienteSocioNegocios.get<RespuestaDto<SocioDeNegocioResponse>>(
    `${BASE_ENDPOINT}/${segmentosPorTipo[tipo]}/${id}`,
  )
  return data.datos
}

export async function obtenerLineaHistoricaPersonal(
  id: string | number,
): Promise<LineaHistoricaPersonalResponse> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<LineaHistoricaPersonalResponse>
  >(`${BASE_ENDPOINT}/personal/${id}/linea-historica`)
  return data.datos
}

export async function obtenerSocioDeNegocioDetalle(
  id: string,
  tipo?: TipoSocioDeNegocio,
): Promise<SocioDeNegocioResponse> {
  if (tipo) {
    return obtenerSocioDeNegocioPorTipo(id, tipo)
  }

  const socio = await obtenerSocioDeNegocio(id)
  return obtenerSocioDeNegocioPorTipo(id, socio.tipo)
}
