import { crearProxyBackend } from "@/compartido/api/proxy-backend"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

// Proxy BFF hacia el backend de Gestion Comercial (bc03). Inyecta el bearer
// desde la cookie httpOnly server-side; el navegador nunca ve el token.
export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
  destino: () => URLS_SERVIDOR.comercial,
  nombre: "comercial",
  // Rutas del formulario publico de respuesta del cliente (/c/[token]): el
  // cliente no tiene sesion y el token del enlace es la unica credencial. Se
  // listan una por una (metodo + forma exacta del path) para no abrir de mas:
  //   GET  publico/cotizaciones/{token}
  //   GET  publico/cotizaciones/{token}/pdf
  //   POST publico/cotizaciones/{token}/respuesta
  esRutaPublica: (metodo, segmentos) => {
    if (
      segmentos[0] !== "publico" ||
      segmentos[1] !== "cotizaciones" ||
      !segmentos[2]
    ) {
      return false
    }
    if (metodo === "GET") {
      return (
        segmentos.length === 3 ||
        (segmentos.length === 4 && segmentos[3] === "pdf")
      )
    }
    if (metodo === "POST") {
      return segmentos.length === 4 && segmentos[3] === "respuesta"
    }
    return false
  },
})
