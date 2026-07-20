import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia el backend de Socio de Negocios (bc01). Inyecta el bearer
// desde la cookie httpOnly. El GET /estado es publico (health del BC).
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.socioNegocios,
  nombre: "socio de negocio",
  esRutaPublica: (metodo, segmentos) =>
    metodo === "GET" && segmentos.length === 1 && segmentos[0] === "estado",
})
