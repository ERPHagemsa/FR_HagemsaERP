import { clienteCombustible } from "@/compartido/api/clientes-backend"

import type {
  AbastecimientoResponse,
  CrearAbastecimientoRequest,
  CrearSolicitudDesdeManifiestoRequest,
  HealthResponse,
  ManifiestoResponse,
  SolicitudResponse,
} from "../tipos/combustible"

export async function obtenerHealthCombustible(): Promise<HealthResponse> {
  const { data } = await clienteCombustible.get<HealthResponse>("/health")
  return data
}

export async function listarManifiestos(): Promise<ManifiestoResponse[]> {
  const { data } =
    await clienteCombustible.get<ManifiestoResponse[]>("/manifiestos")
  return data
}

export async function crearSolicitudDesdeManifiesto(
  payload: CrearSolicitudDesdeManifiestoRequest,
): Promise<SolicitudResponse> {
  const { data } = await clienteCombustible.post<SolicitudResponse>(
    "/solicitudes/from-manifiesto",
    payload,
  )
  return data
}

export async function listarSolicitudes(): Promise<SolicitudResponse[]> {
  const { data } =
    await clienteCombustible.get<SolicitudResponse[]>("/solicitudes")
  return data
}

export async function crearAbastecimiento(
  payload: CrearAbastecimientoRequest,
): Promise<AbastecimientoResponse> {
  const { data } = await clienteCombustible.post<AbastecimientoResponse>(
    "/abastecimientos",
    payload,
  )
  return data
}

export async function listarAbastecimientos(): Promise<AbastecimientoResponse[]> {
  const { data } =
    await clienteCombustible.get<AbastecimientoResponse[]>("/abastecimientos")
  return data
}
