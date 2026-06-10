export type ServicioApi =
  | "activos"
  | "combustible"
  | "socioNegocios" 
  | "flota"
  | "configuracionGeneral"
  | "comercial"

type ConfiguracionServicioApi = {
  baseUrl: string
  nombre: string
  timeoutMs: number
}

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL
const REQUEST_TIMEOUT_MS = 60000

export const serviciosApi = {
  activos: {
    baseUrl:
      process.env.NEXT_PUBLIC_ACTIVOS_API_URL ??
      API_GATEWAY_URL ??
      "https://api-activos-dev.hagemsa.com",
    nombre: "activos",
    timeoutMs: REQUEST_TIMEOUT_MS,
  },
  combustible: {
    baseUrl:
      process.env.NEXT_PUBLIC_COMBUSTIBLE_API_URL ??
      API_GATEWAY_URL ??
      "https://api-combustible-dev.hagemsa.com/api",
    nombre: "combustible",
    timeoutMs: REQUEST_TIMEOUT_MS,
  },
  socioNegocios: {
    baseUrl:
      process.env.NEXT_PUBLIC_SOCIO_NEGOCIOS_API_URL ??
      API_GATEWAY_URL ??
      "https://api-bc01-socio-negocio.hagemsa.com/api",
    nombre: "socio de negocio",
    timeoutMs: REQUEST_TIMEOUT_MS,
  },
  configuracionGeneral: {
    baseUrl:
      process.env.NEXT_PUBLIC_CONFIGURACION_GENERAL_API_URL ??
      API_GATEWAY_URL ??
      "https://api-bc14-configuracion-general.hagemsa.com",
    nombre: "configuracion general",
    timeoutMs: REQUEST_TIMEOUT_MS,
  },
  comercial: {
    baseUrl:
      process.env.NEXT_PUBLIC_COMERCIAL_API_URL ??
      API_GATEWAY_URL ??
      "https://api-bc03-comercial.hagemsa.com/api/v1",
    nombre: "comercial",
    timeoutMs: REQUEST_TIMEOUT_MS,
  },
  flota: {
    baseUrl:
      process.env.NEXT_PUBLIC_FLOTA_API_URL ??
      API_GATEWAY_URL ??
      "http://localhost:8084/api",
    nombre: "flota",
    timeoutMs: 8000,
  },
} satisfies Record<ServicioApi, ConfiguracionServicioApi>

export function obtenerConfiguracionApi(servicio: ServicioApi) {
  const configuracion = serviciosApi[servicio]

  if (!configuracion.baseUrl) {
    throw new Error(`Falta configurar la URL base de la API de ${configuracion.nombre}`)
  }

  return configuracion
}
