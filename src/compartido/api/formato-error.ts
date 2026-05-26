import { ApiError } from "./axios"

// Helpers para procesar errores de cualquier llamada HTTP de forma consistente.
//
// USO TIPICO en un catch:
//
//   import { extraerMensajeError } from "@/compartido/api"
//
//   try {
//     await crearCosa(payload)
//   } catch (err) {
//     toast.error(extraerMensajeError(err))
//   }
//
// USO CON DISTINCION DE STATUS:
//
//   } catch (err) {
//     if (esError401(err)) router.replace("/login?motivo=sesion_expirada")
//     else if (esErrorRed(err)) toast.error("Sin conexion al servidor")
//     else toast.error(extraerMensajeError(err))
//   }

const MENSAJE_FALLBACK = "Ocurrio un error inesperado."

// Devuelve el mensaje para mostrarle al usuario. Funciona con ApiError, Error
// estandar o cualquier cosa thrown. Garantiza un string siempre.
export function extraerMensajeError(
  err: unknown,
  fallback: string = MENSAJE_FALLBACK,
): string {
  if (err instanceof ApiError) return err.message || fallback
  if (err instanceof Error) return err.message || fallback
  if (typeof err === "string" && err.length > 0) return err
  return fallback
}

// Status === 0 indica fallo de red (no llego al servidor).
export function esErrorRed(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0
}

// Status === 408 indica timeout.
export function esErrorTimeout(err: unknown): boolean {
  return err instanceof ApiError && err.status === 408
}

export function esError401(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401
}

export function esError403(err: unknown): boolean {
  return err instanceof ApiError && err.status === 403
}

export function esError404(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404
}

export function esError409(err: unknown): boolean {
  return err instanceof ApiError && err.status === 409
}

export function esErrorRateLimit(err: unknown): boolean {
  return err instanceof ApiError && err.status === 429
}

// Devuelve el status HTTP o null si no es un ApiError.
export function obtenerStatusError(err: unknown): number | null {
  return err instanceof ApiError ? err.status : null
}

// Devuelve el codigo de error de la API o null si no esta presente.
export function obtenerCodigoError(err: unknown): string | null {
  return err instanceof ApiError ? err.codigo : null
}
