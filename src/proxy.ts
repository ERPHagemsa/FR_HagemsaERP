import { NextResponse, type NextRequest } from "next/server"

import {
  borrarCookiesSesion,
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  COOKIE_SESION_VALIDADA,
  marcarSesionValidada,
} from "@/compartido/autenticacion/cookies-sesion"
import { refrescarSiNecesario } from "@/compartido/autenticacion/refrescar-sesion"
import { validarSesionRemota } from "@/compartido/autenticacion/validar-sesion"

const rutasPublicas = ["/login", "/e"]
const prefijosPublicos = ["/api/auth"]

function esRutaPublica(pathname: string): boolean {
  return (
    rutasPublicas.some(
      (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
    ) || prefijosPublicos.some((ruta) => pathname.startsWith(ruta))
  )
}

function redirigirALogin(
  request: NextRequest,
  motivo?: "sesion_expirada",
): NextResponse {
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", request.nextUrl.pathname)
  if (motivo) {
    loginUrl.searchParams.set("motivo", motivo)
  }
  const response = NextResponse.redirect(loginUrl)
  borrarCookiesSesion(response.cookies)
  return response
}

// Middleware/proxy Next.js 16: corre antes de cualquier route handler.
// Reglas:
//   1. /login y /api/auth/* son publicas (acceso sin cookie).
//   2. Con sesion activa, /login redirige a /.
//   3. Sin sesion, cualquier ruta privada redirige a /login.
//   4. Con sesion, intenta refresh transparente si el access esta por expirar.
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  const tieneAccess = Boolean(request.cookies.get(COOKIE_ACCESS)?.value)
  const tieneRefresh = Boolean(request.cookies.get(COOKIE_REFRESH)?.value)
  const tieneSesion = tieneAccess && tieneRefresh

  if (tieneSesion && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (esRutaPublica(pathname)) {
    return NextResponse.next()
  }

  // El refresh transparente corre SOLO en navegaciones (requests de documento/RSC),
  // NUNCA en /api/*. Motivo: una pagina dispara varias llamadas /api concurrentes;
  // si cada una refrescara, todas presentarian el mismo refresh token a la vez ->
  // la primera lo rota y las demas caen en "reuso detectado" -> el Auth Service
  // revoca toda la familia -> logout espurio. Las llamadas /api se refrescan del
  // lado cliente con single-flight (ver cliente-http.ts), que serializa a UN refresh.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (!tieneSesion) {
    return redirigirALogin(request)
  }

  // Navegacion con sesion: refresco transparente si el access esta por expirar.
  const resultado = await refrescarSiNecesario(request)

  if (resultado.tipo === "falla") {
    return redirigirALogin(request, "sesion_expirada")
  }

  if (resultado.tipo === "refrescado") {
    // El refresh acaba de rotar el par contra el Auth Service: el access es
    // nuevo y valido, no hace falta revalidar. Cacheamos esa validez.
    marcarSesionValidada(resultado.response.cookies)
    return resultado.response
  }

  // Access vigente (no se refresco): decodificarlo en local NO detecta una
  // sesion revocada (logout en otro dispositivo o revocacion admin). Validamos
  // contra el Auth Service, pero con cache corto (COOKIE_SESION_VALIDADA) para
  // no pegarle en cada navegacion. Acota la latencia de revocacion a la duracion
  // de esa cookie (~20s) en vez de a la expiracion del access token.
  const yaValidada = Boolean(request.cookies.get(COOKIE_SESION_VALIDADA)?.value)
  if (yaValidada) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(COOKIE_ACCESS)?.value
  if (!accessToken) {
    return redirigirALogin(request, "sesion_expirada")
  }

  const validacion = await validarSesionRemota(accessToken)
  if (validacion.tipo === "revocada") {
    return redirigirALogin(request, "sesion_expirada")
  }

  const response = NextResponse.next()
  marcarSesionValidada(response.cookies)
  return response
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
}
