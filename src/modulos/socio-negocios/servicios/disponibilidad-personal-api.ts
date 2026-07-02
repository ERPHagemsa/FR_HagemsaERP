import { clienteSocioNegocios } from "@/compartido/api/clientes-backend"

import type { RespuestaDto } from "../tipos/socio-negocio"
import type {
  AnularDisponibilidadPersonalConfiguradaRequest,
  ConsultarDisponibilidadesPersonalConfiguradasQuery,
  CrearDisponibilidadPersonalConfiguradaRequest,
  DisponibilidadPersonalConfiguradaResponse,
  ModificarDisponibilidadPersonalConfiguradaRequest,
} from "../tipos/disponibilidad-personal"

const BASE_ENDPOINT = "/disponibilidades-personal-configuradas"

function crearQueryString(
  query?: ConsultarDisponibilidadesPersonalConfiguradasQuery,
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

export async function crearDisponibilidadPersonal(
  payload: CrearDisponibilidadPersonalConfiguradaRequest,
): Promise<DisponibilidadPersonalConfiguradaResponse> {
  const { data } = await clienteSocioNegocios.post<
    RespuestaDto<DisponibilidadPersonalConfiguradaResponse>
  >(BASE_ENDPOINT, payload)
  return data.datos
}

export async function consultarDisponibilidadesPersonal(
  query?: ConsultarDisponibilidadesPersonalConfiguradasQuery,
): Promise<DisponibilidadPersonalConfiguradaResponse[]> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<DisponibilidadPersonalConfiguradaResponse[]>
  >(`${BASE_ENDPOINT}${crearQueryString(query)}`)
  return data.datos
}

export async function consultarDisponibilidadesPorPersonal(
  personalId: string | number,
): Promise<DisponibilidadPersonalConfiguradaResponse[]> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<DisponibilidadPersonalConfiguradaResponse[]>
  >(`${BASE_ENDPOINT}/personal/${encodeURIComponent(String(personalId))}`)
  return data.datos
}

export async function obtenerDisponibilidadPersonal(
  id: string | number,
): Promise<DisponibilidadPersonalConfiguradaResponse> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<DisponibilidadPersonalConfiguradaResponse>
  >(`${BASE_ENDPOINT}/${encodeURIComponent(String(id))}`)
  return data.datos
}

export async function modificarDisponibilidadPersonal(
  id: string | number,
  payload: ModificarDisponibilidadPersonalConfiguradaRequest,
): Promise<DisponibilidadPersonalConfiguradaResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<DisponibilidadPersonalConfiguradaResponse>
  >(`${BASE_ENDPOINT}/${encodeURIComponent(String(id))}`, payload)
  return data.datos
}

export async function anularDisponibilidadPersonal(
  id: string | number,
  payload: AnularDisponibilidadPersonalConfiguradaRequest = {},
): Promise<DisponibilidadPersonalConfiguradaResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<DisponibilidadPersonalConfiguradaResponse>
  >(`${BASE_ENDPOINT}/${encodeURIComponent(String(id))}/anular`, payload)
  return data.datos
}
