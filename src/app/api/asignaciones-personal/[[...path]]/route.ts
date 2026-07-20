import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia las asignaciones de personal, que viven en el backend de
// Socio de Negocios (bc01) bajo /asignaciones-personal.
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.socioNegocios,
  prefijoDestino: "asignaciones-personal",
  nombre: "asignaciones de personal",
})
