// Configuracion server-only. NUNCA importar desde codigo del navegador.
//
// ESTANDAR DE VARIABLES (importante):
//   - Las URLs de backend van en variables PLANAS (sin prefijo NEXT_PUBLIC_),
//     porque solo se consumen desde el server (Route Handlers, middleware,
//     server actions). Las NEXT_PUBLIC_* se "inlinean" en build y quedan
//     congeladas/undefined en el servidor de produccion (Cloud Run), donde la
//     env var se inyecta en runtime. Por eso aca todo es plano.
//   - Una sola variable por backend: <BC>_API_URL. API_GATEWAY_URL (plana)
//     sirve de fallback unico cuando una URL especifica no esta configurada.
//   - NEXT_PUBLIC_ queda reservado para config genuinamente publica del cliente
//     (hoy: ninguna URL de backend la usa).

const API_GATEWAY_URL = process.env.API_GATEWAY_URL

export const URLS_SERVIDOR = {
  // URL base del Auth Service. El frontend NUNCA pega directo: los Route
  // Handlers de /api/auth/* hablan con este backend y devuelven al navegador
  // solo cookies httpOnly o datos no sensibles.
  authService: process.env.AUTH_SERVICE_URL ?? "http://localhost:8080",

  // BC-02 Activos. Lo consume el Route Handler /api/activos/*.
  activos:
    process.env.ACTIVOS_API_URL ??
    API_GATEWAY_URL ??
    "http://localhost:3000",

  // Combustible. Lo consume el Route Handler /api/combustible/*.
  combustible:
    process.env.COMBUSTIBLE_API_URL ??
    API_GATEWAY_URL ??
    "http://localhost:3003",

  // BC-03 Gestion Comercial. Lo consume el Route Handler /api/comercial/*.
  comercial:
    process.env.COMERCIAL_API_URL ??
    API_GATEWAY_URL ??
    "http://localhost:3000/api/v1",

  // BC-04 Flota. Lo consumen las server actions de flota (flota-api.ts).
  flota:
    process.env.FLOTA_API_URL ??
    API_GATEWAY_URL ??
    "http://localhost:8084/api",

  // BC-01 Socio de Negocios. Lo consumen los Route Handlers
  // /api/socio-negocios/* y /api/asignaciones-personal/* (mismo backend).
  socioNegocios:
    process.env.SOCIO_NEGOCIOS_API_URL ??
    API_GATEWAY_URL ??
    "http://localhost:8080/api",

  // BC-14 Configuracion General. Lo consume el Route Handler
  // /api/configuracion-general/*.
  configuracionGeneral:
    process.env.CONFIGURACION_GENERAL_API_URL ??
    API_GATEWAY_URL ??
    "http://localhost:4002/api",
} as const

export type ServicioBackendServidor = keyof typeof URLS_SERVIDOR

// Cuanto antes del exp del access token forzamos refresh transparente en el
// middleware. Default 60s.
export const SEGUNDOS_UMBRAL_REFRESH = Number(
  process.env.JWT_ACCESS_REFRESH_THRESHOLD_SECONDS ?? "60",
)
