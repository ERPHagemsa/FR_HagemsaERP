import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"
import { crearProxyBackend } from "@/compartido/api/proxy-backend"

// Proxy BFF hacia el backend de Flota (bc04). Inyecta el bearer desde la cookie
// httpOnly server-side; el navegador nunca ve el token. Las vistas de flota son
// Client Components que fetchean por aca (clienteFlota -> /api/flota).
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.flota,
  nombre: "flota",
})
