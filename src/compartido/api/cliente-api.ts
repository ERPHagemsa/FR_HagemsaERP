import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios"

import {
  obtenerConfiguracionApi,
  type ServicioApi,
} from "@/compartido/api/config"

type ApiErrorPayload = {
  message?: string | string[]
  error?: string
  statusCode?: number
}

type RequestJsonOptions = {
  servicio: ServicioApi
  endpoint: string
  init?: RequestInit
  timeoutMs?: number
  mensajeErrorConexion?: string
  mensajeErrorTimeout?: string
  mensajeErrorDefault?: string
}

export class ApiError extends Error {
  status: number
  servicio: ServicioApi

  constructor(servicio: ServicioApi, status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.servicio = servicio
  }
}

const cacheClientes = new Map<ServicioApi, AxiosInstance>()

function obtenerCliente(
  servicio: ServicioApi,
  baseURL: string,
  timeout: number,
): AxiosInstance {
  const cached = cacheClientes.get(servicio)
  if (cached) return cached

  const cliente = axios.create({
    baseURL,
    timeout,
    headers: { Accept: "application/json" },
    validateStatus: () => true,
  })
  cacheClientes.set(servicio, cliente)
  return cliente
}

function normalizarHeaders(
  headers: RequestInit["headers"],
): Record<string, string> {
  if (!headers) return {}
  if (headers instanceof Headers) {
    const salida: Record<string, string> = {}
    headers.forEach((value, key) => {
      salida[key] = value
    })
    return salida
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }
  return headers as Record<string, string>
}

function extraerMensajeError(data: unknown, fallback: string): string {
  if (typeof data === "string") {
    return data || fallback
  }
  if (data && typeof data === "object") {
    const payload = data as ApiErrorPayload
    const mensaje = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message
    return mensaje || payload.error || fallback
  }
  return fallback
}

export async function requestJson<T>({
  servicio,
  endpoint,
  init,
  timeoutMs,
  mensajeErrorConexion,
  mensajeErrorTimeout,
  mensajeErrorDefault = "No se pudo completar la operacion.",
}: RequestJsonOptions): Promise<T> {
  const configuracion = obtenerConfiguracionApi(servicio)
  const cliente = obtenerCliente(
    servicio,
    configuracion.baseUrl,
    configuracion.timeoutMs,
  )
  const method = (init?.method ?? "GET").toUpperCase()
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  const headers: Record<string, string> = {
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...normalizarHeaders(init?.headers),
  }

  const axiosConfig: AxiosRequestConfig = {
    url,
    method,
    timeout: timeoutMs ?? configuracion.timeoutMs,
    signal: init?.signal ?? undefined,
    headers,
    data: init?.body ?? undefined,
  }

  let response
  try {
    response = await cliente.request<unknown>(axiosConfig)
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
        throw new ApiError(
          servicio,
          408,
          mensajeErrorTimeout ??
            `La API de ${configuracion.nombre} no respondio a tiempo.`,
        )
      }
    }
    throw new ApiError(
      servicio,
      0,
      mensajeErrorConexion ??
        `No se pudo conectar con la API de ${configuracion.nombre}.`,
    )
  }

  if (response.status < 200 || response.status >= 300) {
    const mensaje = extraerMensajeError(response.data, mensajeErrorDefault)
    throw new ApiError(servicio, response.status, mensaje)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.data as T
}
