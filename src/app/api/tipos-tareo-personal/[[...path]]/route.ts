import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia el maestro interno de tipos de tareo de personal, que vive en
// el backend de Socio de Negocios (bc01) bajo /tipos-tareo-personal.
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.socioNegocios,
  prefijoDestino: "tipos-tareo-personal",
  nombre: "tipos de tareo de personal",
})
