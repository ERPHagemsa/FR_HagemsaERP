// Configuracion server-only. NUNCA importar desde codigo del navegador.
// Las URLs y opciones aqui dentro NO llevan prefijo NEXT_PUBLIC_ porque solo
// se consumen desde Route Handlers y middleware.

export const URLS_SERVIDOR = {
  // URL base del Auth Service. El frontend NUNCA pega directo: los Route
  // Handlers de /api/auth/* hablan con este backend y devuelven al navegador
  // solo cookies httpOnly o datos no sensibles.
  authService: process.env.AUTH_SERVICE_URL ?? "http://localhost:8080",
  // URL base del backend de Configuracion General (bc14). SOLO se usa aca, en
  // el server: el Route Handler /api/configuracion-general/* reenvia hacia
  // aqui. El navegador nunca la ve.
  //
  // OJO: debe resolverse desde una variable PLANA (sin NEXT_PUBLIC_). Las
  // NEXT_PUBLIC_* se "inlinean" en tiempo de build, asi que en el servidor de
  // produccion quedan congeladas como undefined aunque las setees en runtime.
  // Por eso CONFIGURACION_GENERAL_API_URL va primero; las NEXT_PUBLIC_* quedan
  // al final solo como conveniencia para `next dev` (donde si se cargan).
  configuracionGeneral:
    process.env.CONFIGURACION_GENERAL_API_URL ??
    process.env.API_GATEWAY_URL ??
    process.env.NEXT_PUBLIC_CONFIGURACION_GENERAL_API_URL ??
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
    "http://localhost:8080/api",
  // URL base del backend de Socio de Negocios (bc01). El Route Handler
  // /api/socio-negocios/* inyecta el bearer token antes de reenviar.
  socioNegocios:
    process.env.SOCIO_NEGOCIOS_API_URL ??
    process.env.API_GATEWAY_URL ??
    process.env.NEXT_PUBLIC_SOCIO_NEGOCIOS_API_URL ??
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
    "http://localhost:8080/api",
} as const

export type ServicioBackendServidor = keyof typeof URLS_SERVIDOR

// Cuanto antes del exp del access token forzamos refresh transparente en el
// middleware. Default 60s.
export const SEGUNDOS_UMBRAL_REFRESH = Number(
  process.env.JWT_ACCESS_REFRESH_THRESHOLD_SECONDS ?? "60",
)
