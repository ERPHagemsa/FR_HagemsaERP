import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { esError401 } from "@/compartido/api"
import {
  refrescarTokens,
} from "@/compartido/autenticacion/auth-service-cliente"
import {
  borrarCookiesSesion,
  COOKIE_REFRESH,
  setCookiesSesion,
} from "@/compartido/autenticacion/cookies-sesion"
import { extraerIpCliente } from "@/compartido/autenticacion/extraer-ip-cliente"
import { mapearPayloadAUsuario } from "@/compartido/autenticacion/sesion-servidor"
import { decodificarAccessToken } from "@/compartido/autenticacion/tokens-jwt"

// Endpoint para forzar refresh desde el cliente. El middleware ya refresca
// solo cuando detecta que el access esta por expirar, asi que esta ruta es
// principalmente un fallback (ej. cuando el cliente recibe 401 desde un BC
// con un access vencido por inactividad).

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(COOKIE_REFRESH)?.value

  if (!refreshToken) {
    return NextResponse.json(
      { message: "Sesion no iniciada." },
      { status: 401 },
    )
  }

  const ipCliente = extraerIpCliente(request)

  let tokens
  try {
    tokens = await refrescarTokens(refreshToken, ipCliente)
  } catch (error) {
    borrarCookiesSesion(cookieStore)
    if (esError401(error)) {
      return NextResponse.json(
        { message: "Sesion expirada." },
        { status: 401 },
      )
    }
    return NextResponse.json(
      { message: "Servicio de autenticacion no disponible." },
      { status: 503 },
    )
  }

  const payload = decodificarAccessToken(tokens.accessToken)
  if (!payload) {
    borrarCookiesSesion(cookieStore)
    return NextResponse.json(
      { message: "Respuesta invalida del servicio de autenticacion." },
      { status: 502 },
    )
  }

  setCookiesSesion(cookieStore, tokens)
  return NextResponse.json({ usuario: mapearPayloadAUsuario(payload) })
}
