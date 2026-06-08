import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  logoutContraAuthService,
} from "@/compartido/autenticacion/auth-service-cliente"
import {
  borrarCookiesSesion,
  COOKIE_ACCESS,
} from "@/compartido/autenticacion/cookies-sesion"

export async function POST() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS)?.value

  // Intentamos revocar la sesion en el Auth Service. Si falla (token vencido,
  // network down, etc.) igual borramos las cookies locales: el cliente debe
  // poder cerrar sesion siempre, sin importar el estado del servidor.
  if (accessToken) {
    try {
      await logoutContraAuthService(accessToken)
    } catch {
      // intencional: no rompemos el logout local si el server falla.
    }
  }

  borrarCookiesSesion(cookieStore)
  return new NextResponse(null, { status: 204 })
}
