import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios"

import type { ErrorCampo, RespuestaError } from "./contrato"

const TIMEOUT_DEFAULT_MS = 5000
const MENSAJE_ERROR_DEFAULT = "No se pudo completar la operacion."

// Presupuesto de rendimiento (solo desarrollo): avisa en consola cuando una
// llamada excede estos umbrales. El backend tiene su propio monitoreo con
// umbrales por env; estos son fijos porque solo aplican al entorno local.
const UMBRAL_LATENCIA_MS = 1000
const UMBRAL_TAMANO_KB = 500

// Error normalizado para cualquier llamada HTTP del frontend. Guarda intacto
// el payload del error tal como viene del backend, para que el UI
// pueda mostrar `detalle`, `errores[]` por campo y `trazaId` para soporte.
//
// Para errores fuera del contrato (timeout, sin conexion, respuesta no-JSON)
// solo `status` y `message` estan poblados; el resto queda en null.
export class ApiError extends Error {
  readonly status: number
  readonly codigo: string | null
  readonly tipo: string | null
  readonly titulo: string | null
  readonly detalle: string | null
  readonly instancia: string | null
  readonly fecha: string | null
  readonly trazaId: string | null
  readonly servicio: string | null
  readonly errores: ReadonlyArray<ErrorCampo> | null

  constructor(
    status: number,
    message: string,
    payload: Partial<RespuestaError> | null = null,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.codigo = payload?.codigo ?? null
    this.tipo = payload?.tipo ?? null
    this.titulo = payload?.titulo ?? null
    this.detalle = payload?.detalle ?? null
    this.instancia = payload?.instancia ?? null
    this.fecha = payload?.fecha ?? null
    this.trazaId = payload?.trazaId ?? null
    this.servicio = payload?.servicio ?? null
    this.errores = payload?.errores ?? null
  }
}

type PayloadErrorAxios = Partial<RespuestaError> & {
  // Compatibilidad con backends legacy que aun no devuelven el shape estandar:
  message?: string | string[]
  error?: string
  statusCode?: number
}

export type OpcionesCliente = {
  baseURL?: string
  timeoutMs?: number
  withCredentials?: boolean
  obtenerAuthHeader?: () => string | null | undefined
  mensajeErrorDefault?: string
  // Hook opcional que se invoca ante un 401. Debe intentar refrescar la sesion
  // (idealmente single-flight) y devolver true si lo logro; en ese caso la
  // request original se reintenta UNA vez. Lo usa el cliente del navegador para
  // recuperar llamadas /api cuyo access token expiro entre navegaciones, sin
  // disparar refresh concurrente (ver cliente-http.ts).
  alRecibir401?: () => Promise<boolean>
}

export function crearClienteHttp(opciones: OpcionesCliente = {}): AxiosInstance {
  const instancia = axios.create({
    baseURL: opciones.baseURL ?? "",
    timeout: opciones.timeoutMs ?? TIMEOUT_DEFAULT_MS,
    withCredentials: opciones.withCredentials ?? true,
    headers: { Accept: "application/json" },
  })

  if (process.env.NODE_ENV !== "production") {
    registrarMonitoreoRendimiento(instancia)
  }

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

  // Interceptor de reintento ante 401. Se registra ANTES del de normalizacion
  // para recibir el error de axios crudo (con `config`) y poder reintentar.
  const { alRecibir401 } = opciones
  if (alRecibir401) {
    instancia.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          const cfg = error.config as
            | (AxiosRequestConfig & { _reintentado?: boolean })
            | undefined
          if (cfg && !cfg._reintentado) {
            cfg._reintentado = true
            const refrescado = await alRecibir401()
            if (refrescado) {
              // Reintenta UNA vez; la cookie nueva viaja sola (same-origin).
              return instancia(cfg)
            }
          }
        }
        return Promise.reject(error)
      },
    )
  }

  const mensajeFallback = opciones.mensajeErrorDefault ?? MENSAJE_ERROR_DEFAULT

  instancia.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(transformarError(error, mensajeFallback)),
  )

  return instancia
}

type ConfigConInicio = AxiosRequestConfig & { _inicioMs?: number }

// Mide duracion y tamano de cada respuesta y avisa en consola si exceden el
// presupuesto. Solo se registra en desarrollo: en produccion no agrega nada.
function registrarMonitoreoRendimiento(instancia: AxiosInstance): void {
  instancia.interceptors.request.use((config) => {
    ;(config as ConfigConInicio)._inicioMs = Date.now()
    return config
  })

  instancia.interceptors.response.use((response) => {
    const inicioMs = (response.config as ConfigConInicio)._inicioMs
    const duracionMs = inicioMs ? Date.now() - inicioMs : 0

    // content-length puede faltar (gzip/chunked); en ese caso se estima desde
    // el JSON ya parseado, que ademas refleja el tamano real descomprimido.
    const contentLength = Number(response.headers?.["content-length"] ?? 0)
    const tamanoKb = Math.round(
      (contentLength || estimarTamanoBytes(response.data)) / 1024,
    )

    if (duracionMs > UMBRAL_LATENCIA_MS || tamanoKb > UMBRAL_TAMANO_KB) {
      const metodo = response.config.method?.toUpperCase() ?? "GET"
      console.warn(
        `[rendimiento] ${metodo} ${response.config.url} -> ` +
          `${duracionMs} ms (umbral ${UMBRAL_LATENCIA_MS} ms) | ` +
          `~${tamanoKb} KB (umbral ${UMBRAL_TAMANO_KB} KB)`,
      )
    }

    return response
  })
}

function estimarTamanoBytes(data: unknown): number {
  if (data == null) return 0
  if (typeof data === "string") return data.length
  try {
    return JSON.stringify(data).length
  } catch {
    return 0
  }
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

  return new ApiError(status, mensaje, data ?? null)
}

function extraerMensaje(payload: PayloadErrorAxios | undefined): string | null {
  if (!payload) return null

  // Prioridad: `detalle` del backend estandarizado → message/error de backends legacy.
  if (payload.detalle) return payload.detalle

  const message = Array.isArray(payload.message)
    ? payload.message.join(", ")
    : payload.message

  return message || payload.error || null
}

export type { AxiosInstance, AxiosRequestConfig }
