import { clienteConfiguracionGeneral } from "@/compartido/api/clientes-backend"

import type {
  AnularConfiguracionGeneralRequest,
  ConfiguracionGeneralResponse,
  ConsultarConfiguracionGeneralQuery,
  EstadoBcConfiguracionGeneralResponse,
  ExportarConfiguracionGeneralQuery,
  InhabilitarConfiguracionGeneralRequest,
  ModificarRequestPorTipo,
  PaginatedResponse,
  ReactivarConfiguracionGeneralRequest,
  RegistrarRequestPorTipo,
  ResumenConfiguracionGeneralResponse,
  TipoDatoMaestro,
} from "../tipos/configuracion-general"
import { RUTA_POR_TIPO } from "../tipos/configuracion-general"

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

export async function obtenerResumenDashboardConfiguracionGeneral(): Promise<ResumenConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    ResumenConfiguracionGeneralResponse | RespuestaConDatos<ResumenConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/dashboard/resumen`)
  return extraerDatos(data)
}

export async function inhabilitarConfiguracionGeneral(
  id: number,
  tipo: TipoDatoMaestro,
  payload: InhabilitarConfiguracionGeneralRequest,
): Promise<ConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.patch<
    ConfiguracionGeneralResponse | RespuestaConDatos<ConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/${id}/inhabilitar?tipoDatoMaestro=${tipo}`, payload)
  return extraerDatos(data)
}

export async function reactivarConfiguracionGeneral(
  id: number,
  tipo: TipoDatoMaestro,
  payload: ReactivarConfiguracionGeneralRequest,
): Promise<ConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.patch<
    ConfiguracionGeneralResponse | RespuestaConDatos<ConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/${id}/reactivar?tipoDatoMaestro=${tipo}`, payload)
  return extraerDatos(data)
}

export async function anularConfiguracionGeneral(
  id: number,
  tipo: TipoDatoMaestro,
  payload: AnularConfiguracionGeneralRequest,
): Promise<ConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.patch<
    ConfiguracionGeneralResponse | RespuestaConDatos<ConfiguracionGeneralResponse>
  >(`${BASE_ENDPOINT}/${id}/anular?tipoDatoMaestro=${tipo}`, payload)
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

// ---------------------------------------------------------------------------
// Endpoints por tipo de dato maestro
//
// Cada tipo tiene su recurso dedicado: /configuracion-general/<plural>. Listar,
// registrar y modificar viajan solo con los campos propios del tipo. El ciclo
// de vida (inhabilitar/reactivar/anular), el dashboard y la
// exportacion siguen siendo genericos sobre /configuracion-general/:id/...
// ---------------------------------------------------------------------------

function rutaTipo(tipo: TipoDatoMaestro) {
  return `${BASE_ENDPOINT}/${RUTA_POR_TIPO[tipo]}`
}

/** Lista los registros de un tipo concreto desde su recurso dedicado. */
export async function listarPorTipo(
  tipo: TipoDatoMaestro,
  query?: ConsultarConfiguracionGeneralQuery,
): Promise<PaginatedResponse<ConfiguracionGeneralResponse>> {
  // El recurso ya esta acotado al tipo: no reenviamos tipoDatoMaestro.
  const { tipoDatoMaestro: _omitido, ...resto } = query ?? {}
  void _omitido
  const { data } = await clienteConfiguracionGeneral.get<
    PaginatedResponse<ConfiguracionGeneralResponse>
  >(`${rutaTipo(tipo)}${crearQueryString(resto)}`)
  return data
}

/** Registra un maestro en su recurso dedicado con solo sus campos propios. */
export async function registrarPorTipo<T extends TipoDatoMaestro>(
  tipo: T,
  payload: RegistrarRequestPorTipo[T],
): Promise<ConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.post<
    ConfiguracionGeneralResponse | RespuestaConDatos<ConfiguracionGeneralResponse>
  >(rutaTipo(tipo), payload)
  return extraerDatos(data)
}

/** Modifica un maestro en su recurso dedicado con solo sus campos propios. */
export async function modificarPorTipo<T extends TipoDatoMaestro>(
  tipo: T,
  id: number,
  payload: ModificarRequestPorTipo[T],
): Promise<ConfiguracionGeneralResponse> {
  const { data } = await clienteConfiguracionGeneral.put<
    ConfiguracionGeneralResponse | RespuestaConDatos<ConfiguracionGeneralResponse>
  >(`${rutaTipo(tipo)}/${id}`, payload)
  return extraerDatos(data)
}
