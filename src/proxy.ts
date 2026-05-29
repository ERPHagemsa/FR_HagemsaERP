import { NextResponse, type NextRequest } from "next/server"

import {
  borrarCookiesSesion,
  COOKIE_ACCESS,
  COOKIE_REFRESH,
} from "@/compartido/autenticacion/cookies-sesion"
import { refrescarSiNecesario } from "@/compartido/autenticacion/refrescar-sesion"

const rutasPublicas = ["/login"]
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

  if (!tieneSesion) {
    return redirigirALogin(request)
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

  // Navegacion con sesion: refresco transparente si el access esta por expirar.
  const resultado = await refrescarSiNecesario(request)

  if (resultado.tipo === "falla") {
    return redirigirALogin(request, "sesion_expirada")
  }

  if (resultado.tipo === "refrescado") {
    return resultado.response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
}
