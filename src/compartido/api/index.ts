// Factory y tipos genericos (para casos avanzados o instancias custom).
export { crearClienteHttp } from "./axios"
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
} from "./clientes-backend"

// Config compartida de los BCs (URLs base, timeouts, nombres).
export {
  obtenerConfiguracionApi,
  serviciosApi,
  type ServicioApi,
} from "./config"

// Legacy: requestJson y su clase ApiError. Hoy lo usan combustible y
// socio-negocios. Para codigo nuevo, preferir los clientes preconfigurados
// de arriba y la clase ApiError de "./axios".
export { ApiError, requestJson } from "./cliente-api"

// React Query: provider y query keys compartidos.
export { ApiQueryProvider } from "./query-provider"
export { queryKeys } from "./query-keys"
