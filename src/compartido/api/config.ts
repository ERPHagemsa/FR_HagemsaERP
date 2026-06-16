// Config del lado CLIENTE de cada bounded context.
//
// IMPORTANTE: aca NO hay URLs de backend ni secretos. Todas las llamadas pasan
// por el BFF (`/api/<bc>`), asi que el cliente solo necesita el nombre (para
// mensajes de error) y el timeout. Las URLs reales viven server-only en
// config-servidor.ts (variables PLANAS, sin NEXT_PUBLIC).

export type ServicioApi =
  | "activos"
  | "combustible"
  | "socioNegocios"
  | "flota"
  | "configuracionGeneral"
  | "comercial"

type ConfiguracionServicioApi = {
  nombre: string
  timeoutMs: number
}

const REQUEST_TIMEOUT_MS = 60000

export const serviciosApi = {
  activos: { nombre: "activos", timeoutMs: REQUEST_TIMEOUT_MS },
  combustible: { nombre: "combustible", timeoutMs: REQUEST_TIMEOUT_MS },
  socioNegocios: { nombre: "socio de negocio", timeoutMs: REQUEST_TIMEOUT_MS },
  configuracionGeneral: {
    nombre: "configuracion general",
    timeoutMs: REQUEST_TIMEOUT_MS,
  },
  comercial: { nombre: "comercial", timeoutMs: REQUEST_TIMEOUT_MS },
  flota: { nombre: "flota", timeoutMs: 8000 },
} satisfies Record<ServicioApi, ConfiguracionServicioApi>

export function obtenerConfiguracionApi(
  servicio: ServicioApi,
): ConfiguracionServicioApi {
  return serviciosApi[servicio]
}
