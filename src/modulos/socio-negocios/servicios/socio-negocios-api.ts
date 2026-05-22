import { requestJson } from "@/compartido/api"

import type {
  ConsultarSociosDeNegocioQuery,
  DarDeBajaSocioDeNegocioRequest,
  EstadoBcResponse,
  ExportarSociosDeNegocioQuery,
  ModificarSocioDeNegocioRequest,
  RegistrarClienteDesdeComercialRequest,
  RegistrarSocioDeNegocioRequest,
  ReporteSociosDeNegocioResponse,
  SocioDeNegocioResponse,
} from "../tipos/socio-negocio"

const BASE_ENDPOINT = "/socios-de-negocio"

function crearQueryString(
  query?: ConsultarSociosDeNegocioQuery | ExportarSociosDeNegocioQuery
) {
  const params = new URLSearchParams()

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

export function obtenerEstadoBcSocioDeNegocio() {
  return requestJson<EstadoBcResponse>({
    servicio: "socioNegocios",
    endpoint: `${BASE_ENDPOINT}/estado`,
    init: {
      cache: "no-store",
    },
    mensajeErrorDefault: "No se pudo obtener el estado del BC de socios de negocio",
  })
}

export function registrarSocioDeNegocio(
  payload: RegistrarSocioDeNegocioRequest
) {
  return requestJson<SocioDeNegocioResponse>({
    servicio: "socioNegocios",
    endpoint: BASE_ENDPOINT,
    init: {
      method: "POST",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo registrar el socio de negocio",
  })
}

export function registrarClienteDesdeComercial(
  payload: RegistrarClienteDesdeComercialRequest
) {
  return requestJson<SocioDeNegocioResponse>({
    servicio: "socioNegocios",
    endpoint: `${BASE_ENDPOINT}/desde-comercial/cliente-listo-para-alta`,
    init: {
      method: "POST",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo registrar el cliente desde Comercial",
  })
}

export function modificarSocioDeNegocio(
  id: string,
  payload: ModificarSocioDeNegocioRequest
) {
  return requestJson<SocioDeNegocioResponse>({
    servicio: "socioNegocios",
    endpoint: `${BASE_ENDPOINT}/${id}`,
    init: {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo modificar el socio de negocio",
  })
}

export function darDeBajaSocioDeNegocio(
  id: string,
  payload: DarDeBajaSocioDeNegocioRequest
) {
  return requestJson<SocioDeNegocioResponse>({
    servicio: "socioNegocios",
    endpoint: `${BASE_ENDPOINT}/${id}/baja`,
    init: {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo dar de baja el socio de negocio",
  })
}

export function consultarSociosDeNegocio(
  query?: ConsultarSociosDeNegocioQuery
) {
  return requestJson<SocioDeNegocioResponse[]>({
    servicio: "socioNegocios",
    endpoint: `${BASE_ENDPOINT}${crearQueryString(query)}`,
    init: {
      cache: "no-store",
    },
    mensajeErrorDefault: "No se pudo consultar socios de negocio",
  })
}

export function exportarSociosDeNegocio(query: ExportarSociosDeNegocioQuery) {
  return requestJson<ReporteSociosDeNegocioResponse>({
    servicio: "socioNegocios",
    endpoint: `${BASE_ENDPOINT}/exportar${crearQueryString(query)}`,
    init: {
      cache: "no-store",
    },
    mensajeErrorDefault: "No se pudo exportar socios de negocio",
  })
}

export function obtenerSocioDeNegocio(id: string) {
  return requestJson<SocioDeNegocioResponse>({
    servicio: "socioNegocios",
    endpoint: `${BASE_ENDPOINT}/${id}`,
    init: {
      cache: "no-store",
    },
    mensajeErrorDefault: "No se pudo obtener el socio de negocio",
  })
}
