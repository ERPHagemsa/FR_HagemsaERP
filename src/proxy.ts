import { NextResponse, type NextRequest } from "next/server"

import { COOKIE_SESION } from "@/compartido/autenticacion/sesion"
const rutasPublicas = ["/login"]
const prefijosPublicos = ["/api/auth"]

function esRutaPublica(pathname: string) {
  return (
    rutasPublicas.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)) ||
    prefijosPublicos.some((ruta) => pathname.startsWith(ruta))
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const tieneSesion = Boolean(request.cookies.get(COOKIE_SESION)?.value)

  if (!tieneSesion && !esRutaPublica(pathname)) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)

    return NextResponse.redirect(loginUrl)
  }

  if (tieneSesion && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
}
