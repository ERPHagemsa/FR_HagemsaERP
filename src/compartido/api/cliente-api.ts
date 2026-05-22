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

function unirUrl(baseUrl: string, endpoint: string) {
  const base = baseUrl.replace(/\/+$/, "")
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  return `${base}${path}`
}

async function obtenerMensajeError(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as ApiErrorPayload
      const message = Array.isArray(payload.message)
        ? payload.message.join(", ")
        : payload.message

      return message || payload.error || fallback
    } catch {
      return fallback
    }
  }

  const message = await response.text()
  return message || fallback
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
  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    timeoutMs ?? configuracion.timeoutMs
  )

  let response: Response

  try {
    response = await fetch(unirUrl(configuracion.baseUrl, endpoint), {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    })
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        servicio,
        408,
        mensajeErrorTimeout ??
          `La API de ${configuracion.nombre} no respondio a tiempo.`
      )
    }

    throw new ApiError(
      servicio,
      0,
      mensajeErrorConexion ??
        `No se pudo conectar con la API de ${configuracion.nombre}.`
    )
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    throw new ApiError(
      servicio,
      response.status,
      await obtenerMensajeError(response, mensajeErrorDefault)
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
