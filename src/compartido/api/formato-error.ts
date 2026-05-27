import { ApiError } from "./axios"
import type { ErrorCampo } from "./contrato"

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
//
// USO CON ERRORES DE CAMPO (status 422 — validacion con errores por campo):
//
//   } catch (err) {
//     const erroresCampo = obtenerErroresCampo(err)
//     setErrorEmail(erroresCampo.email?.mensaje ?? null)
//     setErrorNombre(erroresCampo.nombreCompleto?.mensaje ?? null)
//   }
//
// USO MOSTRANDO TRAZAID PARA SOPORTE:
//
//   <MensajeErrorApi error={err} />
//   // o manualmente: "ID de soporte: " + obtenerTrazaId(err)

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

// 422 — validacion fallida (el array `errores` viene poblado).
export function esErrorValidacion(err: unknown): boolean {
  return err instanceof ApiError && err.status === 422
}

export function esErrorRateLimit(err: unknown): boolean {
  return err instanceof ApiError && err.status === 429
}

// Devuelve el status HTTP o null si no es un ApiError.
export function obtenerStatusError(err: unknown): number | null {
  return err instanceof ApiError ? err.status : null
}

// Codigo estable del backend (AUTH_*, COMUN_*, ...) o null si no lo trae.
// El frontend lo usa para logica condicional estable.
export function obtenerCodigoError(err: unknown): string | null {
  return err instanceof ApiError ? err.codigo : null
}

// Titulo corto y estable del tipo de error (sin datos variables). Util para
// encabezados de Alert / toast.
export function obtenerTituloError(err: unknown): string | null {
  return err instanceof ApiError ? err.titulo : null
}

// trazaId para correlacionar con logs del backend. Mostrarselo al usuario
// cuando reporta un incidente (idealmente con copy-to-clipboard).
export function obtenerTrazaId(err: unknown): string | null {
  return err instanceof ApiError ? err.trazaId : null
}

// Nombre del servicio que origino el error. Util cuando el frontend habla con
// varios backends — ayuda a saber a quien escalar.
export function obtenerServicioError(err: unknown): string | null {
  return err instanceof ApiError ? err.servicio : null
}

// Array crudo `errores[]` del payload de error (validacion campo a campo).
// null si no hay; arreglo vacio si el backend lo mando vacio.
export function obtenerErroresCampo(
  err: unknown,
): ReadonlyArray<ErrorCampo> | null {
  return err instanceof ApiError ? err.errores : null
}

// Mapa `campo -> ErrorCampo` para consumo rapido en formularios.
// Si dos items tienen el mismo `campo` gana el ultimo (raro, pero estable).
export function obtenerErroresPorCampo(
  err: unknown,
): Record<string, ErrorCampo> {
  const items = obtenerErroresCampo(err)
  if (!items) return {}
  const mapa: Record<string, ErrorCampo> = {}
  for (const item of items) {
    mapa[item.campo] = item
  }
  return mapa
}

// Acceso directo al mensaje de un campo especifico (ej. para FieldError).
// Devuelve null si no hay error para ese campo.
export function obtenerErrorCampo(
  err: unknown,
  campo: string,
): string | null {
  const items = obtenerErroresCampo(err)
  if (!items) return null
  return items.find((item) => item.campo === campo)?.mensaje ?? null
}
