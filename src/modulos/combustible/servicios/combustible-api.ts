import { ApiError, requestJson } from "@/compartido/api"

import type {
  AbastecimientoResponse,
  CrearAbastecimientoRequest,
  CrearSolicitudDesdeManifiestoRequest,
  HealthResponse,
  ManifiestoResponse,
  SolicitudResponse,
} from "../tipos/combustible"

export class CombustibleApiError extends ApiError {
  constructor(status: number, message: string) {
    super("combustible", status, message)
    this.name = "CombustibleApiError"
  }
}

function requestCombustible<T>(endpoint: string, init?: RequestInit) {
  return requestJson<T>({
    servicio: "combustible",
    endpoint,
    init,
    mensajeErrorConexion: "No se pudo conectar con la API de combustible.",
    mensajeErrorTimeout: "La API de combustible no respondio a tiempo.",
  }).catch((error: unknown) => {
    if (error instanceof ApiError) {
      throw new CombustibleApiError(error.status, error.message)
    }

    throw error
  })
}

export function obtenerHealthCombustible() {
  return requestCombustible<HealthResponse>("/health")
}

export function listarManifiestos() {
  return requestCombustible<ManifiestoResponse[]>("/manifiestos")
}

export function crearSolicitudDesdeManifiesto(
  data: CrearSolicitudDesdeManifiestoRequest
) {
  return requestCombustible<SolicitudResponse>("/solicitudes/from-manifiesto", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function listarSolicitudes() {
  return requestCombustible<SolicitudResponse[]>("/solicitudes")
}

export function crearAbastecimiento(data: CrearAbastecimientoRequest) {
  return requestCombustible<AbastecimientoResponse>("/abastecimientos", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function listarAbastecimientos() {
  return requestCombustible<AbastecimientoResponse[]>("/abastecimientos")
}
