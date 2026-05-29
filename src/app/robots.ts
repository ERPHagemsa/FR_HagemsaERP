import type { MetadataRoute } from "next"

// ERP privado alojado en erp.hagemsa.com: ningun buscador debe rastrear ni
// indexar nada. Next genera /robots.txt con "Disallow: /" para todos los bots.
// Complementa al <meta name="robots" content="noindex, nofollow"> del layout:
// robots.txt evita el rastreo; el meta evita la indexacion aun si un bot llega
// a una pagina por un enlace directo.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  }
}
