import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { cambiarPasswordContraAuthService } from "@/compartido/autenticacion/auth-service-cliente"
import { COOKIE_ACCESS } from "@/compartido/autenticacion/cookies-sesion"
import { respuestaDesdeApiError } from "@/compartido/autenticacion/forward-api-error"

// Cambia la contraseña del usuario autenticado probando la actual. No rota el
// token (el cambio de contraseña no altera los claims del JWT). Responde 204.

type Body = {
  passwordActual?: string
  passwordNueva?: string
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_ACCESS)?.value
  if (!accessToken) {
    return NextResponse.json({ message: "Sesion no iniciada." }, { status: 401 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ detalle: "Cuerpo inválido." }, { status: 400 })
  }

  try {
    await cambiarPasswordContraAuthService(
      accessToken,
      body.passwordActual ?? "",
      body.passwordNueva ?? "",
    )
  } catch (error) {
    return respuestaDesdeApiError(error)
  }

  return new NextResponse(null, { status: 204 })
}
