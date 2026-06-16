import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia el backend de Configuracion General (bc14). El backend agrupa
// sus recursos bajo /configuracion-general, por eso el prefijoDestino.
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.configuracionGeneral,
  prefijoDestino: "configuracion-general",
  nombre: "configuracion general",
})
