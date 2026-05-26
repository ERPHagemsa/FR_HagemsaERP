import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios"

const TIMEOUT_DEFAULT_MS = 8000
const MENSAJE_ERROR_DEFAULT = "No se pudo completar la operacion."

export class ApiError extends Error {
  readonly status: number
  readonly codigo: string | null

  constructor(status: number, message: string, codigo: string | null = null) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.codigo = codigo
  }
}

type PayloadErrorAxios = {
  message?: string | string[]
  error?: string
  codigo?: string
  statusCode?: number
}

export type OpcionesCliente = {
  baseURL?: string
  timeoutMs?: number
  withCredentials?: boolean
  obtenerAuthHeader?: () => string | null | undefined
  mensajeErrorDefault?: string
}

export function crearClienteHttp(opciones: OpcionesCliente = {}): AxiosInstance {
  const instancia = axios.create({
    baseURL: opciones.baseURL ?? "",
    timeout: opciones.timeoutMs ?? TIMEOUT_DEFAULT_MS,
    withCredentials: opciones.withCredentials ?? true,
    headers: { Accept: "application/json" },
  })

  const { obtenerAuthHeader } = opciones
  if (obtenerAuthHeader) {
    instancia.interceptors.request.use((config) => {
      const auth = obtenerAuthHeader()
      if (auth) {
        config.headers.set("Authorization", auth)
      }
      return config
    })
  }

  const mensajeFallback = opciones.mensajeErrorDefault ?? MENSAJE_ERROR_DEFAULT

  instancia.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(transformarError(error, mensajeFallback)),
  )

  return instancia
}

function transformarError(error: unknown, fallback: string): ApiError {
  if (!axios.isAxiosError(error)) {
    return new ApiError(0, fallback)
  }

  if (error.code === "ECONNABORTED") {
    return new ApiError(408, "La operacion tardo demasiado.")
  }

  if (!error.response) {
    return new ApiError(0, "No se pudo conectar con el servidor.")
  }

  const status = error.response.status
  const data = error.response.data as PayloadErrorAxios | undefined
  const mensaje = extraerMensaje(data) ?? fallback
  const codigo = data?.codigo ?? null

  return new ApiError(status, mensaje, codigo)
}

function extraerMensaje(payload: PayloadErrorAxios | undefined): string | null {
  if (!payload) return null

  const message = Array.isArray(payload.message)
    ? payload.message.join(", ")
    : payload.message

  return message || payload.error || null
}

export type { AxiosInstance, AxiosRequestConfig }
