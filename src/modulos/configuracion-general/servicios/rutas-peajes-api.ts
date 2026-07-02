import { clienteConfiguracionGeneral } from "@/compartido/api/clientes-backend"

import type {
  ActualizarEstructuraRutaRequest,
  ActualizarPeajesRutaRequest,
  ActualizarPuntosRutaRequest,
  ConsultarCostoPeajesQuery,
  ConsultarCostoResumenQuery,
  ConsultarPeajesQuery,
  ConsultarRutasQuery,
  CostoPeajesResumenResponse,
  CostoPeajesRutaResponse,
  ModificarPeajeRequest,
  ModificarRutaRequest,
  ModificarTarifaPeajeRequest,
  PaginatedResponse,
  PeajeResponse,
  RegistrarPeajeRequest,
  RegistrarRutaRequest,
  RegistrarTarifaPeajeRequest,
  RutaDetalleResponse,
  RutaResponse,
  TarifaPeajeResponse,
} from "../tipos/rutas-peajes"

const BASE = "/configuracion-general"

type RespuestaConDatos<T> = { datos: T }

function qs(query?: object): string {
  const params = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  })
  const s = params.toString()
  return s ? `?${s}` : ""
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

// Normaliza una respuesta paginada que puede venir "plana"
// ({ datos: [...], paginacion }) o envuelta una vez mas en el sobre estandar
// ({ datos: { datos: [...], paginacion } }). Sin esto, una envoltura extra del
// backend de peajes/rutas dejaria la lista vacia sin lanzar ningun error.
function extraerPaginado<T>(
  respuesta: PaginatedResponse<T> | RespuestaConDatos<PaginatedResponse<T>>,
): PaginatedResponse<T> {
  if (
    respuesta &&
    typeof respuesta === "object" &&
    "datos" in respuesta &&
    !Array.isArray((respuesta as { datos: unknown }).datos) &&
    (respuesta as RespuestaConDatos<PaginatedResponse<T>>).datos &&
    Array.isArray((respuesta as RespuestaConDatos<PaginatedResponse<T>>).datos?.datos)
  ) {
    return (respuesta as RespuestaConDatos<PaginatedResponse<T>>).datos
  }
  return respuesta as PaginatedResponse<T>
}

// --- Peajes -------------------------------------------------------------------

export async function listarPeajes(
  query?: ConsultarPeajesQuery,
): Promise<PaginatedResponse<PeajeResponse>> {
  const { data } = await clienteConfiguracionGeneral.get<
    PaginatedResponse<PeajeResponse> | RespuestaConDatos<PaginatedResponse<PeajeResponse>>
  >(`${BASE}/peajes${qs(query)}`)
  return extraerPaginado(data)
}

export async function registrarPeaje(payload: RegistrarPeajeRequest): Promise<PeajeResponse> {
  const { data } = await clienteConfiguracionGeneral.post<
    PeajeResponse | RespuestaConDatos<PeajeResponse>
  >(`${BASE}/peajes`, payload)
  return extraerDatos(data)
}

export async function modificarPeaje(
  id: number,
  payload: ModificarPeajeRequest,
): Promise<PeajeResponse> {
  const { data } = await clienteConfiguracionGeneral.put<
    PeajeResponse | RespuestaConDatos<PeajeResponse>
  >(`${BASE}/peajes/${id}`, payload)
  return extraerDatos(data)
}

export async function listarTarifasPeaje(peajeId: number): Promise<TarifaPeajeResponse[]> {
  const { data } = await clienteConfiguracionGeneral.get<
    PaginatedResponse<TarifaPeajeResponse> | RespuestaConDatos<TarifaPeajeResponse[]> | TarifaPeajeResponse[]
  >(`${BASE}/peajes/${peajeId}/tarifas`)
  if (Array.isArray(data)) return data
  if ("datos" in data && Array.isArray(data.datos)) return data.datos
  return []
}

export async function registrarTarifaPeaje(
  peajeId: number,
  payload: RegistrarTarifaPeajeRequest,
): Promise<TarifaPeajeResponse> {
  const { data } = await clienteConfiguracionGeneral.post<
    TarifaPeajeResponse | RespuestaConDatos<TarifaPeajeResponse>
  >(`${BASE}/peajes/${peajeId}/tarifas`, payload)
  return extraerDatos(data)
}

export async function modificarTarifaPeaje(
  peajeId: number,
  tarifaId: number,
  payload: ModificarTarifaPeajeRequest,
): Promise<TarifaPeajeResponse> {
  const { data } = await clienteConfiguracionGeneral.put<
    TarifaPeajeResponse | RespuestaConDatos<TarifaPeajeResponse>
  >(`${BASE}/peajes/${peajeId}/tarifas/${tarifaId}`, payload)
  return extraerDatos(data)
}

// --- Rutas --------------------------------------------------------------------

export async function listarRutas(
  query?: ConsultarRutasQuery,
): Promise<PaginatedResponse<RutaResponse>> {
  const { data } = await clienteConfiguracionGeneral.get<
    PaginatedResponse<RutaResponse> | RespuestaConDatos<PaginatedResponse<RutaResponse>>
  >(`${BASE}/rutas${qs(query)}`)
  return extraerPaginado(data)
}

export async function registrarRuta(payload: RegistrarRutaRequest): Promise<RutaResponse> {
  const { data } = await clienteConfiguracionGeneral.post<
    RutaResponse | RespuestaConDatos<RutaResponse>
  >(`${BASE}/rutas`, payload)
  return extraerDatos(data)
}

export async function modificarRuta(
  id: number,
  payload: ModificarRutaRequest,
): Promise<RutaResponse> {
  const { data } = await clienteConfiguracionGeneral.put<
    RutaResponse | RespuestaConDatos<RutaResponse>
  >(`${BASE}/rutas/${id}`, payload)
  return extraerDatos(data)
}

export async function obtenerDetalleRuta(id: number): Promise<RutaDetalleResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    RutaDetalleResponse | RespuestaConDatos<RutaDetalleResponse>
  >(`${BASE}/rutas/${id}/detalle`)
  return extraerDatos(data)
}

export async function actualizarPuntosRuta(
  id: number,
  payload: ActualizarPuntosRutaRequest,
): Promise<RutaDetalleResponse> {
  const { data } = await clienteConfiguracionGeneral.put<
    RutaDetalleResponse | RespuestaConDatos<RutaDetalleResponse>
  >(`${BASE}/rutas/${id}/puntos`, payload)
  return extraerDatos(data)
}

export async function actualizarPeajesRuta(
  id: number,
  payload: ActualizarPeajesRutaRequest,
): Promise<RutaDetalleResponse> {
  const { data } = await clienteConfiguracionGeneral.put<
    RutaDetalleResponse | RespuestaConDatos<RutaDetalleResponse>
  >(`${BASE}/rutas/${id}/peajes`, payload)
  return extraerDatos(data)
}

export async function obtenerCostoPeajesRuta(
  id: number,
  query: ConsultarCostoPeajesQuery,
): Promise<CostoPeajesRutaResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    CostoPeajesRutaResponse | RespuestaConDatos<CostoPeajesRutaResponse>
  >(`${BASE}/rutas/${id}/costo-peajes${qs(query)}`)
  return extraerDatos(data)
}

// Guarda puntos y peajes en una sola transaccion (endpoint recomendado para la
// pantalla de edicion de ruta). Valida tramos contra los puntos del request.
export async function actualizarEstructuraRuta(
  id: number,
  payload: ActualizarEstructuraRutaRequest,
): Promise<RutaDetalleResponse> {
  const { data } = await clienteConfiguracionGeneral.put<
    RutaDetalleResponse | RespuestaConDatos<RutaDetalleResponse>
  >(`${BASE}/rutas/${id}/estructura`, payload)
  return extraerDatos(data)
}

// Calcula el costo para varios numeros de ejes en una sola llamada.
export async function obtenerCostoPeajesResumen(
  id: number,
  query: ConsultarCostoResumenQuery,
): Promise<CostoPeajesResumenResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    CostoPeajesResumenResponse | RespuestaConDatos<CostoPeajesResumenResponse>
  >(`${BASE}/rutas/${id}/costo-peajes/resumen${qs(query)}`)
  return extraerDatos(data)
}
