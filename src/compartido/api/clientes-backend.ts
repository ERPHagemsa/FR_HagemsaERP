import { crearClienteHttp } from "@/compartido/api/axios"
import {
  obtenerConfiguracionApi,
  type ServicioApi,
} from "@/compartido/api/config"

// Instancias de axios preconfiguradas por bounded context.
//
// ESTANDAR: TODA llamada a un backend pasa por el BFF (Route Handlers de Next
// en src/app/api/<bc>/*). El cliente apunta a `/api/<bc>` (mismo origen) con
// `withCredentials: true`: el navegador manda la cookie httpOnly y el Route
// Handler inyecta el `Authorization: Bearer` server-side. El JWT NUNCA queda
// expuesto al JS del cliente, y las URLs reales de los backends viven solo en
// el servidor (ver config-servidor.ts). Por eso aca NO hay URLs de backend ni
// variables NEXT_PUBLIC.
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
// El path es RELATIVO al backend (sin el segmento del BC): el baseURL ya lo
// incluye. Ej: clienteActivos.get("/activos") -> /api/activos/activos -> el
// Route Handler reenvia "/activos" al backend de Activos.
//
// COMO AGREGAR UN BACKEND NUEVO (ej. "despacho"):
//
//   1. Variable PLANA (server-only) en config-servidor.ts -> URLS_SERVIDOR.despacho
//      (leyendo DESPACHO_API_URL del entorno). NUNCA NEXT_PUBLIC.
//   2. Route Handler src/app/api/despacho/[[...path]]/route.ts con
//      crearProxyBackend({ destino: () => URLS_SERVIDOR.despacho, nombre: "despacho" }).
//   3. Entrada en config.ts (nombre + timeout) y type ServicioApi.
//   4. Instancia aca: export const clienteDespacho = crearClienteBff("/api/despacho", "despacho")
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

function crearClienteBff(baseURL: string, servicio: ServicioApi) {
  const configuracion = obtenerConfiguracionApi(servicio)
  return crearClienteHttp({
    baseURL,
    timeoutMs: configuracion.timeoutMs,
    withCredentials: true,
    mensajeErrorDefault: `No se pudo completar la operacion en ${configuracion.nombre}.`,
  })
}

// Backends de un solo segmento de ruta: el baseURL incluye el segmento del BC.
export const clienteActivos = crearClienteBff("/api/activos", "activos")
export const clienteCombustible = crearClienteBff("/api/combustible", "combustible")
export const clienteComercial = crearClienteBff("/api/comercial", "comercial")

// Socio de Negocios expone DOS grupos de rutas (socios-de-negocio y
// asignaciones-personal) sobre el mismo backend, por eso su baseURL es `/api`
// y cada modulo lleva su segmento en el path (ver socio-negocios-api.ts /
// asignaciones-personal-api.ts). Configuracion General sigue el mismo patron.
export const clienteSocioNegocios = crearClienteBff("/api", "socioNegocios")
export const clienteConfiguracionGeneral = crearClienteBff("/api", "configuracionGeneral")
