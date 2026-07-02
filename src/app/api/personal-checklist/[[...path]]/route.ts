import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia el checklist de personal, que vive en el backend de
// Socio de Negocios (bc01) bajo /personal-checklist.
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.socioNegocios,
  prefijoDestino: "personal-checklist",
  nombre: "checklist de personal",
})
