export type ServicioApi =
  | "activos"
  | "combustible"
  | "socioNegocios"
  | "configuracionGeneral"

type ConfiguracionServicioApi = {
  baseUrl: string
  nombre: string
  timeoutMs: number
}

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL

export const serviciosApi = {
  activos: {
    baseUrl:
      process.env.NEXT_PUBLIC_ACTIVOS_API_URL ??
      API_GATEWAY_URL ??
      "https://api-activos-dev.hagemsa.com/api",
    nombre: "activos",
    timeoutMs: 8000,
  },
  combustible: {
    baseUrl:
      process.env.NEXT_PUBLIC_COMBUSTIBLE_API_URL ??
      API_GATEWAY_URL ??
      "https://api-combustible-dev.hagemsa.com/api",
    nombre: "combustible",
    timeoutMs: 6000,
  },
  socioNegocios: {
    baseUrl:
      process.env.NEXT_PUBLIC_SOCIO_NEGOCIOS_API_URL ??
      API_GATEWAY_URL ??
      "https://api-bc01-socio-negocio.hagemsa.com/api",
    nombre: "socio de negocio",
    timeoutMs: 8000,
  },
  configuracionGeneral: {
    baseUrl:
      process.env.NEXT_PUBLIC_CONFIGURACION_GENERAL_API_URL ??
      API_GATEWAY_URL ??
      "https://api-bc14-configuracion-general.hagemsa.com",
    nombre: "configuracion general",
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
