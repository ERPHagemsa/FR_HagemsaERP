import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia el backend de Gestion Comercial (bc03). Inyecta el bearer
// desde la cookie httpOnly server-side; el navegador nunca ve el token.
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.comercial,
  nombre: "comercial",
})
