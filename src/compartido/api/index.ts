// Factory y tipos genericos (para casos avanzados o instancias custom).
export { crearClienteHttp, ApiError } from "./axios"
export type { OpcionesCliente, AxiosInstance, AxiosRequestConfig } from "./axios"

// Cliente para el navegador: pega a /api/... del propio Next (same-origin).
// Usarlo cuando la llamada pasa por un Route Handler de Next (recomendado
// para todo lo que requiera JWT).
export { clienteHttp } from "./cliente-http"

// Clientes preconfigurados por bounded context (uno por cada BC backend).
// Ver compartido/api/clientes-backend.ts para la guia de uso.
export {
  clienteActivos,
  clienteCombustible,
  clienteSocioNegocios,
  clienteComercial,
} from "./clientes-backend"

// Config compartida de los BCs (URLs base, timeouts, nombres).
export {
  obtenerConfiguracionApi,
  serviciosApi,
  type ServicioApi,
} from "./config"

// Hooks utility para consultas y mutaciones (reemplazan TanStack Query).
export {
  useConsulta,
  invalidarConsulta,
  type OpcionesConsulta,
  type ResultadoConsulta,
} from "./use-consulta"
export {
  useMutar,
  type OpcionesMutar,
  type ResultadoMutar,
} from "./use-mutar"

// Helpers para manejo consistente de errores en cualquier catch.
export {
  extraerMensajeError,
  esErrorRed,
  esErrorTimeout,
  esError401,
  esError403,
  esError404,
  esError409,
  esErrorValidacion,
  esErrorRateLimit,
  obtenerStatusError,
  obtenerCodigoError,
  obtenerTituloError,
  obtenerTrazaId,
  obtenerServicioError,
  obtenerErroresCampo,
  obtenerErroresPorCampo,
  obtenerErrorCampo,
} from "./formato-error"

// Tipos del shape estandar que devuelven los backends del ecosistema HAGEMSA
// (RespuestaRecurso, RespuestaPaginada, RespuestaError, etc.)
export {
  PAGINACION_DEFAULTS,
  CODIGO_ERROR_CAMPO,
  type CodigoErrorCampo,
  type ErrorCampo,
  type Paginacion,
  type PaginacionQuery,
  type RespuestaError,
  type RespuestaPaginada,
  type RespuestaRecurso,
} from "./contrato"
