// Generador de JWT "mock" para el modo de desarrollo.
//
// IMPORTANTE: este modulo es server-only y SOLO debe invocarse desde el route
// handler /api/auth/dev-login (gateado por doble flag). El JWT generado tiene
// shape valido pero su firma es relleno; sirve unicamente para desbloquear la
// UI mientras el Auth Service real esta en construccion.
//
// SEGURIDAD: si el flag AUTH_MODO_DESARROLLO se filtrara a produccion,
// cualquiera podria entrar como admin sin password. Por eso se exige doble
// gate: NODE_ENV !== "production" AND AUTH_MODO_DESARROLLO === "true".

import type { ParTokens } from "./cookies-sesion"
import type { PayloadAccessToken, RolPayload } from "./tokens-jwt"

const ACCESS_EXPIRA_SEGUNDOS = 60 * 60 * 8 // 8h: cubre una jornada de trabajo
const REFRESH_EXPIRA_SEGUNDOS = 60 * 60 * 24 // 24h

export function modoDesarrolloActivo(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_MODO_DESARROLLO === "true"
  )
}

export interface OpcionesUsuarioDev {
  readonly email?: string
  readonly nombre?: string
  readonly tipo?: string
  readonly roles?: ReadonlyArray<RolPayload>
}

export function crearTokensMockDev(
  opciones: OpcionesUsuarioDev = {},
): ParTokens {
  const ahoraSegundos = Math.floor(Date.now() / 1000)

  const payload: PayloadAccessToken = {
    sub: crypto.randomUUID(),
    jti: crypto.randomUUID(),
    email: opciones.email ?? "dev-admin@hagemsa.local",
    type: opciones.tipo ?? "interno",
    name: opciones.nombre ?? "Admin Dev",
    roles: opciones.roles ?? [{ role: "SUPER_ADMIN", scope: {} }],
    iat: ahoraSegundos,
    exp: ahoraSegundos + ACCESS_EXPIRA_SEGUNDOS,
  }

  return {
    accessToken: construirJwtMock(payload),
    refreshToken: `dev-refresh.${crypto.randomUUID()}`,
    expiresIn: ACCESS_EXPIRA_SEGUNDOS,
    refreshExpiresIn: REFRESH_EXPIRA_SEGUNDOS,
  }
}

function construirJwtMock(payload: PayloadAccessToken): string {
  const header = { alg: "none", typ: "JWT", kid: "dev-mock" }
  const headerB64 = codificarBase64Url(JSON.stringify(header))
  const payloadB64 = codificarBase64Url(JSON.stringify(payload))
  const firmaB64 = codificarBase64Url("dev-mock-signature")
  return `${headerB64}.${payloadB64}.${firmaB64}`
}

function codificarBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let binario = ""
  for (let i = 0; i < bytes.length; i++) {
    binario += String.fromCharCode(bytes[i])
  }
  return btoa(binario)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}
