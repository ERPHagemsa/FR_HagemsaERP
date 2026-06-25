import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia las disponibilidades configuradas del personal, que viven en
// el backend de Socio de Negocios (bc01) bajo /disponibilidades-personal-configuradas.
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.socioNegocios,
  prefijoDestino: "disponibilidades-personal-configuradas",
  nombre: "disponibilidades configuradas de personal",
})
