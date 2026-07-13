import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia el backend de Activos (bc02). Inyecta el bearer desde la
// cookie httpOnly server-side; el navegador nunca ve el token.
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.activos,
  nombre: "activos",
  esRutaPublica: (metodo, segmentos) =>
    metodo === "GET" &&
    segmentos[0] === "activos" &&
    segmentos[1] === "etiquetas" &&
    segmentos[2] === "token" &&
    segmentos[4] === "publico",
})
