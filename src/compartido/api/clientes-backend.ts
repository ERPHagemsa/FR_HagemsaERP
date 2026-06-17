import { crearClienteHttp, type AxiosInstance } from "@/compartido/api/axios"
import { refrescarSesion } from "@/compartido/api/cliente-http"
import {
  obtenerConfiguracionApi,
  type ServicioApi,
} from "@/compartido/api/config"
import {
  URLS_SERVIDOR,
  type ServicioBackendServidor,
} from "@/compartido/api/config-servidor"

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

function crearClienteBff(
  baseURL: string,
  servicio: ServicioApi,
  // Clave del backend en URLS_SERVIDOR. Si se pasa, el cliente funciona TAMBIEN
  // en Server Components (fetch durante el SSR). En el servidor NO hay origin
  // contra el cual resolver el baseURL relativo `/api/<bc>` (axios revienta),
  // asi que reescribimos al backend ABSOLUTO e inyectamos el bearer desde la
  // cookie httpOnly. En el navegador NO se toca nada: sigue usando el BFF.
  // Solo aplica a backends cuyo Route Handler reenvia el path tal cual (sin
  // prefijoDestino): activos, combustible, comercial. socio/config son
  // "use client" (fetch en el navegador), por eso no lo necesitan.
  servidorKey?: ServicioBackendServidor,
): AxiosInstance {
  const configuracion = obtenerConfiguracionApi(servicio)
  const cliente = crearClienteHttp({
    baseURL,
    timeoutMs: configuracion.timeoutMs,
    withCredentials: true,
    // Mismo single-flight refresh que clienteHttp: ante un 401 (access token
    // vencido) refresca una sola vez y reintenta, sin disparar refresh
    // concurrente. Asi los clientes por BC se comportan igual que admin/auth.
    alRecibir401: refrescarSesion,
    mensajeErrorDefault: `No se pudo completar la operacion en ${configuracion.nombre}.`,
  })

  if (servidorKey) {
    cliente.interceptors.request.use((config) => {
      // typeof window === "undefined" => corremos en el servidor (SSR de un
      // Server Component). El BFF (mismo origen) no existe aca, asi que vamos
      // directo al backend con su URL absoluta.
      //
      // STOPGAP: no inyectamos el bearer en SSR. No podemos leer la cookie aca
      // sin importar next/headers, que contaminaria el bundle del cliente (este
      // modulo lo importan tambien Client Components). Hoy los backends bc02/bc03
      // no exigen auth (responden 200 sin token), asi que el SSR funciona igual.
      // El JWT sigue httpOnly y nunca se expone al cliente (esto corre solo en
      // server). Cuando esos backends activen el guard, mover esos fetch a un
      // modulo "use server" (patron de flota-api.ts) que si pueda leer la cookie.
      if (typeof window === "undefined") {
        config.baseURL = URLS_SERVIDOR[servidorKey]
      }
      return config
    })
  }

  return cliente
}

// Backends de un solo segmento de ruta: el baseURL incluye el segmento del BC.
// Pasan servidorKey para funcionar tambien en Server Components (SSR).
export const clienteActivos = crearClienteBff("/api/activos", "activos", "activos")
export const clienteCombustible = crearClienteBff("/api/combustible", "combustible", "combustible")
export const clienteComercial = crearClienteBff("/api/comercial", "comercial", "comercial")

// Socio de Negocios expone DOS grupos de rutas (socios-de-negocio y
// asignaciones-personal) sobre el mismo backend, por eso su baseURL es `/api`
// y cada modulo lleva su segmento en el path (ver socio-negocios-api.ts /
// asignaciones-personal-api.ts). Configuracion General sigue el mismo patron.
export const clienteSocioNegocios = crearClienteBff("/api", "socioNegocios")
export const clienteConfiguracionGeneral = crearClienteBff("/api", "configuracionGeneral")
