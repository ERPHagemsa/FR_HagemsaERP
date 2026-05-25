import { NextResponse, type NextRequest } from "next/server"

import { COOKIE_SESION } from "@/compartido/autenticacion/sesion"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const tieneSesion = Boolean(request.cookies.get(COOKIE_SESION)?.value)

  if (tieneSesion && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
}
