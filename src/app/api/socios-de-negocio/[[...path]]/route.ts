import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia el maestro de Socio de Negocios (bc01) bajo /socios-de-negocio.
// Inyecta el bearer desde la cookie httpOnly. El GET /estado es publico.
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.socioNegocios,
  prefijoDestino: "socios-de-negocio",
  nombre: "socio de negocio",
  esRutaPublica: (metodo, segmentos) =>
    metodo === "GET" && segmentos.length === 1 && segmentos[0] === "estado",
})
