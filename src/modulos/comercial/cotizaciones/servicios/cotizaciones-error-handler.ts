// Helper centralizado para manejar errores de las acciones de cotizacion.
//
// Convencion BC-03:
//   400  → error de formato/DTO; NO mostrar el message raw; tratar como
//           error de formulario (campo requerido, valor invalido).
//   422  → regla de negocio; mostrar el message del backend VERBATIM
//           (ya viene en español, p.ej. "No se puede enviar sin lineas.").
//   otro → fallback generico.

import { extraerMensajeError, esErrorValidacion } from "@/compartido/api";

export interface ResultadoErrorAccion {
  /** Mensaje listo para mostrar al usuario (toast o inline). */
  mensaje: string;
  /**
   * true cuando es un error de regla de negocio (422).
   * false cuando es un error de formato/red/otro.
   */
  esReglaNegocio: boolean;
}

/**
 * Normaliza cualquier error de una accion de cotizacion en un resultado
 * uniforme { mensaje, esReglaNegocio } para que cada dialog decida si
 * mostrar el mensaje en un toast o en el campo del formulario.
 */
export function normalizarErrorAccion(
  err: unknown,
  fallback = "Ocurrio un error inesperado"
): ResultadoErrorAccion {
  if (esErrorValidacion(err)) {
    // 422 — regla de negocio: mostrar verbatim
    return {
      mensaje: extraerMensajeError(err, fallback),
      esReglaNegocio: true,
    };
  }
  // 400, red, etc. — error de formato o inesperado
  return {
    mensaje: extraerMensajeError(err, fallback),
    esReglaNegocio: false,
  };
}
