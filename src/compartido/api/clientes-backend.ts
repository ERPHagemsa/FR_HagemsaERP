import { crearClienteHttp } from "@/compartido/api/axios"
import {
  obtenerConfiguracionApi,
  type ServicioApi,
} from "@/compartido/api/config"

// Instancias de axios preconfiguradas por bounded context.
//
// CADA backend tiene su propia instancia con su baseURL y timeout cargados
// desde config.ts (que lee NEXT_PUBLIC_<BC>_API_URL del entorno).
//
// COMO USARLAS desde un modulo (src/modulos/<bc>/servicios/<bc>-api.ts):
//
//   import { clienteActivos } from "@/compartido/api/clientes-backend"
//
//   export async function obtenerActivos(): Promise<Activo[]> {
//     const { data } = await clienteActivos.get<Activo[]>("/activos")
//     return data
//   }
//
//   export async function crearActivo(payload: CrearActivoPayload) {
//     const { data } = await clienteActivos.post<Activo>("/activos", payload)
//     return data
//   }
//
// COMO AGREGAR UN BACKEND NUEVO (ej. "despacho"):
//
//   1. Agregar la variable en .env.local:
//        NEXT_PUBLIC_DESPACHO_API_URL=http://localhost:3010
//
//   2. Agregar la entrada en compartido/api/config.ts dentro de serviciosApi:
//        despacho: {
//          baseUrl: process.env.NEXT_PUBLIC_DESPACHO_API_URL ?? "https://...",
//          nombre: "despacho",
//          timeoutMs: 8000,
//        }
//      Y extender el type ServicioApi para incluir "despacho".
//
//   3. Agregar la instancia aca abajo:
//        export const clienteDespacho = crearClientePorBC("despacho")
//
// MANEJO DE ERRORES: los interceptores normalizan cualquier error de axios a
// la clase ApiError de @/compartido/api/axios. Capturar asi:
//
//   import { ApiError } from "@/compartido/api/axios"
//
//   try {
//     const { data } = await clienteActivos.get(...)
//   } catch (err) {
//     if (err instanceof ApiError) {
//       // err.status, err.message, err.codigo
//     }
//   }

function crearClientePorBC(servicio: ServicioApi) {
  const configuracion = obtenerConfiguracionApi(servicio)
  return crearClienteHttp({
    baseURL: configuracion.baseUrl,
    timeoutMs: configuracion.timeoutMs,
    withCredentials: false,
    mensajeErrorDefault: `No se pudo completar la operacion en ${configuracion.nombre}.`,
  })
}

function crearClienteBffPorBC(servicio: ServicioApi) {
  const configuracion = obtenerConfiguracionApi(servicio)
  return crearClienteHttp({
    baseURL: "/api",
    timeoutMs: configuracion.timeoutMs,
    withCredentials: true,
    mensajeErrorDefault: `No se pudo completar la operacion en ${configuracion.nombre}.`,
  })
}

export const clienteActivos = crearClientePorBC("activos")
export const clienteCombustible = crearClientePorBC("combustible")
export const clienteSocioNegocios = crearClientePorBC("socioNegocios")
export const clienteConfiguracionGeneral = crearClienteBffPorBC("configuracionGeneral")
export const clienteComercial = crearClientePorBC("comercial")
