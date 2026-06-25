import { clienteSocioNegocios } from "@/compartido/api/clientes-backend"

import type { RespuestaDto } from "../tipos/socio-negocio"
import type {
  CambiarEstadoTareoRequest,
  ConfiguracionLaboralPersonalResponse,
  ConsultarConfiguracionesLaboralesPersonalQuery,
  ConsultarTiposTareoPersonalQuery,
  CrearConfiguracionLaboralPersonalRequest,
  CrearTipoTareoPersonalRequest,
  ModificarConfiguracionLaboralPersonalRequest,
  ModificarTipoTareoPersonalRequest,
  TipoTareoPersonalResponse,
} from "../tipos/tareo-personal"

const TIPOS_ENDPOINT = "/tipos-tareo-personal"
const CONFIGS_ENDPOINT = "/configuraciones-laborales-personal"

function crearQueryString(
  query?:
    | ConsultarTiposTareoPersonalQuery
    | ConsultarConfiguracionesLaboralesPersonalQuery,
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

// --- Tipo de tareo -------------------------------------------------------------

export async function consultarTiposTareoPersonal(
  query?: ConsultarTiposTareoPersonalQuery,
): Promise<TipoTareoPersonalResponse[]> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<TipoTareoPersonalResponse[]>
  >(`${TIPOS_ENDPOINT}${crearQueryString(query)}`)
  return data.datos
}

export async function obtenerTipoTareoPersonal(
  id: string | number,
): Promise<TipoTareoPersonalResponse> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<TipoTareoPersonalResponse>
  >(`${TIPOS_ENDPOINT}/${encodeURIComponent(String(id))}`)
  return data.datos
}

export async function crearTipoTareoPersonal(
  payload: CrearTipoTareoPersonalRequest,
): Promise<TipoTareoPersonalResponse> {
  const { data } = await clienteSocioNegocios.post<
    RespuestaDto<TipoTareoPersonalResponse>
  >(TIPOS_ENDPOINT, payload)
  return data.datos
}

export async function modificarTipoTareoPersonal(
  id: string | number,
  payload: ModificarTipoTareoPersonalRequest,
): Promise<TipoTareoPersonalResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<TipoTareoPersonalResponse>
  >(`${TIPOS_ENDPOINT}/${encodeURIComponent(String(id))}`, payload)
  return data.datos
}

export async function activarTipoTareoPersonal(
  id: string | number,
  payload: CambiarEstadoTareoRequest = {},
): Promise<TipoTareoPersonalResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<TipoTareoPersonalResponse>
  >(`${TIPOS_ENDPOINT}/${encodeURIComponent(String(id))}/activar`, payload)
  return data.datos
}

export async function inactivarTipoTareoPersonal(
  id: string | number,
  payload: CambiarEstadoTareoRequest = {},
): Promise<TipoTareoPersonalResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<TipoTareoPersonalResponse>
  >(`${TIPOS_ENDPOINT}/${encodeURIComponent(String(id))}/inactivar`, payload)
  return data.datos
}

// --- Configuracion laboral -----------------------------------------------------

export async function consultarConfiguracionesLaboralesPersonal(
  query?: ConsultarConfiguracionesLaboralesPersonalQuery,
): Promise<ConfiguracionLaboralPersonalResponse[]> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<ConfiguracionLaboralPersonalResponse[]>
  >(`${CONFIGS_ENDPOINT}${crearQueryString(query)}`)
  return data.datos
}

export async function obtenerConfiguracionLaboralPersonal(
  id: string | number,
): Promise<ConfiguracionLaboralPersonalResponse> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<ConfiguracionLaboralPersonalResponse>
  >(`${CONFIGS_ENDPOINT}/${encodeURIComponent(String(id))}`)
  return data.datos
}

export async function crearConfiguracionLaboralPersonal(
  payload: CrearConfiguracionLaboralPersonalRequest,
): Promise<ConfiguracionLaboralPersonalResponse> {
  const { data } = await clienteSocioNegocios.post<
    RespuestaDto<ConfiguracionLaboralPersonalResponse>
  >(CONFIGS_ENDPOINT, payload)
  return data.datos
}

export async function modificarConfiguracionLaboralPersonal(
  id: string | number,
  payload: ModificarConfiguracionLaboralPersonalRequest,
): Promise<ConfiguracionLaboralPersonalResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<ConfiguracionLaboralPersonalResponse>
  >(`${CONFIGS_ENDPOINT}/${encodeURIComponent(String(id))}`, payload)
  return data.datos
}

export async function activarConfiguracionLaboralPersonal(
  id: string | number,
  payload: CambiarEstadoTareoRequest = {},
): Promise<ConfiguracionLaboralPersonalResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<ConfiguracionLaboralPersonalResponse>
  >(`${CONFIGS_ENDPOINT}/${encodeURIComponent(String(id))}/activar`, payload)
  return data.datos
}

export async function inactivarConfiguracionLaboralPersonal(
  id: string | number,
  payload: CambiarEstadoTareoRequest = {},
): Promise<ConfiguracionLaboralPersonalResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<ConfiguracionLaboralPersonalResponse>
  >(`${CONFIGS_ENDPOINT}/${encodeURIComponent(String(id))}/inactivar`, payload)
  return data.datos
}
