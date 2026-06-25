import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Integraciones entrantes hacia BC01 (ej. eventos de Configuracion General).
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.socioNegocios,
  prefijoDestino: "integraciones",
  nombre: "integraciones de socio de negocio",
})
