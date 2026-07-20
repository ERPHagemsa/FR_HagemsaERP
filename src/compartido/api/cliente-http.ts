import { crearClienteHttp } from "@/compartido/api/axios"

// Single-flight refresh: si varias requests reciben 401 a la vez (ej. una pagina
// con varias llamadas /api cuyo access token expiro), SOLO una dispara el refresh
// y las demas esperan ese mismo resultado. Asi se evita el refresh concurrente
// que en el Auth Service dispararia "reuso detectado" y revocaria la familia.
let refreshEnCurso: Promise<boolean> | null = null

// Exportada para que TODOS los clientes del navegador (clienteHttp y los
// clientes por BC de clientes-backend.ts) compartan el MISMO single-flight: un
// solo refresh en vuelo ante 401s concurrentes, sin reimplementar la logica.
export function refrescarSesion(): Promise<boolean> {
  if (!refreshEnCurso) {
    // /api/auth/refresh lee el refresh token de la cookie httpOnly, rota el par
    // y reescribe las cookies. No necesita body.
    refreshEnCurso = fetch("/api/auth/refresh", { method: "POST" })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshEnCurso = null
      })
  }
  return refreshEnCurso
}

// Cliente HTTP para el NAVEGADOR.
// Pega a rutas relativas del propio Next (`/api/...`). Las cookies httpOnly
// viajan solas porque son same-origin. NO inyecta Authorization: el bearer
// token vive en cookies httpOnly y los Route Handlers de Next lo reenvian al
// backend correspondiente.
//
// `alRecibir401`: ante un 401 (access token vencido), refresca una sola vez
// (single-flight) y reintenta la request. Cubre las llamadas /api, que NO se
// refrescan en el middleware (eso es solo para navegaciones; ver proxy.ts).
//
// Para llamadas desde Route Handlers o middleware (server-side), crear una
// instancia propia con crearClienteHttp({ baseURL: ... }).
export const clienteHttp = crearClienteHttp({
  baseURL: "",
  timeoutMs: 5000,
  alRecibir401: refrescarSesion,
})
