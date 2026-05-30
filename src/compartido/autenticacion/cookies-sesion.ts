// Constantes y helpers para manejar las cookies httpOnly de sesion.
//
// IMPORTANTE: las cookies son httpOnly, lo que significa que el JS del cliente
// NO puede leerlas. Solo los Route Handlers de Next y el middleware tocan estos
// valores. El navegador las envia automaticamente en cada request same-origin.

export const COOKIE_ACCESS = "hagemsa_access"
export const COOKIE_REFRESH = "hagemsa_refresh"

// Cookie de cache de la validacion de sesion contra el Auth Service. El
// middleware valida que el jti no este revocado en cada navegacion, pero NO en
// cada una: tras una validacion OK setea esta cookie con un maxAge corto y
// mientras este presente saltea el round-trip. Asi acota la latencia de
// revocacion a su duracion (ver SEGUNDOS_CACHE_VALIDACION) sin pegarle al Auth
// Service en cada click.
export const COOKIE_SESION_VALIDADA = "hagemsa_sesion_ok"
export const SEGUNDOS_CACHE_VALIDACION = 20

export type ParTokens = {
  readonly accessToken: string
  readonly refreshToken: string
  readonly expiresIn: number
  readonly refreshExpiresIn: number
}

type OpcionesCookieBase = {
  readonly httpOnly: true
  readonly sameSite: "lax"
  readonly secure: boolean
  readonly path: "/"
}

export const opcionesCookieSesion: OpcionesCookieBase = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
}

type CookieParaSet = {
  name: string
  value: string
  httpOnly?: boolean
  sameSite?: "lax" | "strict" | "none"
  secure?: boolean
  path?: string
  maxAge?: number
}

type SetterCookies = {
  set: (opciones: CookieParaSet) => void
}

type DeletorCookies = {
  delete: (name: string) => void
}

// Setea las dos cookies (access + refresh) en una respuesta o RequestCookies
// de Next. Funciona tanto desde Route Handlers (via cookies() de next/headers)
// como desde el middleware (NextResponse.cookies).
export function setCookiesSesion(
  cookies: SetterCookies,
  tokens: ParTokens,
): void {
  // IMPORTANTE: el `maxAge` de la cookie de access NO se ata al `expiresIn` del
  // token (1h), sino al del refresh (~30d). La validez REAL del access token la
  // define su claim `exp` (los backends rechazan los vencidos); la cookie solo
  // necesita seguir presente para que el middleware pueda DETECTAR el token
  // vencido y refrescarlo. Si la cookie expirara a la hora, tras estar inactivo
  // >1h el navegador la borraría y el middleware desloguearía al usuario aunque
  // el refresh token (30d) siguiera válido — desperdiciando la sesión larga.
  cookies.set({
    ...opcionesCookieSesion,
    name: COOKIE_ACCESS,
    value: tokens.accessToken,
    maxAge: tokens.refreshExpiresIn,
  })
  cookies.set({
    ...opcionesCookieSesion,
    name: COOKIE_REFRESH,
    value: tokens.refreshToken,
    maxAge: tokens.refreshExpiresIn,
  })
}

// Marca la sesion como validada por un periodo corto (cache de la validacion
// remota contra el Auth Service). Mientras la cookie viva, el middleware no
// vuelve a consultar la blacklist.
export function marcarSesionValidada(cookies: SetterCookies): void {
  cookies.set({
    ...opcionesCookieSesion,
    name: COOKIE_SESION_VALIDADA,
    value: "1",
    maxAge: SEGUNDOS_CACHE_VALIDACION,
  })
}

export function borrarCookiesSesion(cookies: DeletorCookies): void {
  cookies.delete(COOKIE_ACCESS)
  cookies.delete(COOKIE_REFRESH)
  cookies.delete(COOKIE_SESION_VALIDADA)
}
