// Tipos del contrato de respuestas HTTP que publican todos los backends del
// ecosistema HAGEMSA (Auth Service y demás).
//
// Ver doc completa en https://hagemsa-auth-docs/api-reference/convenciones/.

export interface RespuestaRecurso<T> {
  readonly datos: T
}

export interface Paginacion {
  readonly pagina: number
  readonly limite: number
  readonly total: number
  readonly totalPaginas: number
  readonly tieneSiguiente: boolean
  readonly tieneAnterior: boolean
}

export interface RespuestaPaginada<T> {
  readonly datos: ReadonlyArray<T>
  readonly paginacion: Paginacion
}

export interface PaginacionQuery {
  pagina?: number
  limite?: number
}

export const PAGINACION_DEFAULTS = {
  pagina: 1,
  limite: 20,
} as const

// Codigos genericos del array `errores` (validacion campo a campo).
// No llevan prefijo de servicio — son los mismos para todo el ecosistema.
export const CODIGO_ERROR_CAMPO = {
  REQUERIDO: "REQUERIDO",
  FORMATO_INVALIDO: "FORMATO_INVALIDO",
  LONGITUD_INVALIDA: "LONGITUD_INVALIDA",
  VALOR_FUERA_DE_RANGO: "VALOR_FUERA_DE_RANGO",
  VALOR_NO_PERMITIDO: "VALOR_NO_PERMITIDO",
  YA_EXISTE: "YA_EXISTE",
  NO_ENCONTRADO: "NO_ENCONTRADO",
} as const
export type CodigoErrorCampo =
  (typeof CODIGO_ERROR_CAMPO)[keyof typeof CODIGO_ERROR_CAMPO]

// Item del array `errores` cuando una validacion 422 falla en varios campos.
// El servidor garantiza al menos campo + codigo + mensaje.
export interface ErrorCampo {
  readonly campo: string
  readonly codigo: CodigoErrorCampo | string
  readonly mensaje: string
  readonly valorRechazado: unknown
}

// Shape completo que publican los backends en cualquier respuesta de error
// (status >= 400). El frontend lo consume desde ApiError (axios.ts) y los
// helpers de formato-error.ts.
// La clase ApiError (axios.ts) lo guarda intacto y los helpers lo consumen.
export interface RespuestaError {
  readonly estado: number
  readonly codigo: string
  readonly titulo: string
  readonly detalle: string
  readonly fecha: string
  readonly trazaId: string
  readonly errores: ReadonlyArray<ErrorCampo> | null
  // Campos opcionales — no todos los servicios los envían
  readonly tipo?: string
  readonly instancia?: string
  readonly servicio?: string
}
