import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia el maestro interno de configuraciones laborales de personal,
// que vive en el backend de Socio de Negocios (bc01) bajo
// /configuraciones-laborales-personal.
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.socioNegocios,
  prefijoDestino: "configuraciones-laborales-personal",
  nombre: "configuraciones laborales de personal",
})
