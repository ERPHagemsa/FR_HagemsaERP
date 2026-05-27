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
const ID_USUARIO_DEV = "00000000-0000-4000-8000-000000000001"
const JTI_USUARIO_DEV = "00000000-0000-4000-8000-000000000002"

let advertenciaImpresa = false

export function modoDesarrolloActivo(): boolean {
  const flag = process.env.AUTH_MODO_DESARROLLO === "true"
  const enProduccion = process.env.NODE_ENV === "production"

  // Doble gate: aunque AUTH_MODO_DESARROLLO=true se filtre a un build de
  // produccion, NODE_ENV === "production" lo neutraliza y el bypass queda
  // desactivado. Si esto pasa, lo gritamos por logs al menos una vez para
  // que sea facil detectarlo en observabilidad.
  if (flag && enProduccion) {
    if (!advertenciaImpresa) {
      // eslint-disable-next-line no-console
      console.error(
        "[SEGURIDAD] AUTH_MODO_DESARROLLO=true detectado en NODE_ENV=production. " +
          "El bypass de autenticacion permanece DESACTIVADO. " +
          "Quitar esta variable del entorno productivo INMEDIATAMENTE.",
      )
      advertenciaImpresa = true
    }
    return false
  }

  if (flag && !advertenciaImpresa) {
    // eslint-disable-next-line no-console
    console.warn(
      "[DEV] AUTH_MODO_DESARROLLO=true. Bypass de autenticacion ACTIVO. " +
        "No usar este build en produccion.",
    )
    advertenciaImpresa = true
  }

  return flag
}

export interface OpcionesUsuarioDev {
  readonly email?: string
  readonly nombre?: string
  readonly tipo?: string
  readonly roles?: ReadonlyArray<RolPayload>
}

export function crearPayloadUsuarioDev(
  opciones: OpcionesUsuarioDev = {},
): PayloadAccessToken {
  const ahoraSegundos = Math.floor(Date.now() / 1000)

  return {
    sub: ID_USUARIO_DEV,
    jti: JTI_USUARIO_DEV,
    email: opciones.email ?? "dev-admin@hagemsa.local",
    type: opciones.tipo ?? "interno",
    name: opciones.nombre ?? "Admin Dev",
    // SUPER_ADMIN sintetico sin permisos asignados (el guard del frontend usa
    // el nombre del rol; permisos se quedan vacios). Si necesitas probar UI que
    // depende de permisos especificos, pasa opciones.roles con la lista.
    roles: opciones.roles ?? [
      { role: "SUPER_ADMIN", scope: {}, permisos: [] },
    ],
    iat: ahoraSegundos,
    exp: ahoraSegundos + ACCESS_EXPIRA_SEGUNDOS,
  }
}

export function crearTokensMockDev(
  opciones: OpcionesUsuarioDev = {},
): ParTokens {
  const payload = crearPayloadUsuarioDev(opciones)
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
