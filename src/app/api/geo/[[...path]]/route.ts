import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia geo-peru-api (reverse-geocoding de distritos + cascada).
// Es un servicio PÚBLICO (datos de referencia, sin secretos): todas sus rutas
// son públicas, así que no se exige sesión ni se reenvía bearer.
export const { GET } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.geo,
  nombre: "geo",
  esRutaPublica: () => true,
})
