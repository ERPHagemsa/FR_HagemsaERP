import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  cambiarCodigosContraAuthService,
  refrescarTokens,
} from "@/compartido/autenticacion/auth-service-cliente"
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  setCookiesSesion,
} from "@/compartido/autenticacion/cookies-sesion"
import { extraerIpCliente } from "@/compartido/autenticacion/extraer-ip-cliente"
import { respuestaDesdeApiError } from "@/compartido/autenticacion/forward-api-error"
import { mapearPayloadAUsuario } from "@/compartido/autenticacion/sesion-servidor"
import { decodificarAccessToken } from "@/compartido/autenticacion/tokens-jwt"

// Cambia los códigos internos de la cuenta (codigoSocio/codigoCuenta) del
// usuario autenticado y, si tiene éxito, FUERZA un refresh del token: así el
// nuevo access token ya lleva los códigos nuevos y los backends que los leen del
// JWT (ej. generación de PDFs) los ven al instante, sin esperar al refresh
// natural ni pedir re-login.
//
// El refresh aquí es un único refresh deliberado (no concurrente), así que no
// dispara la detección de reuso del Auth Service.

type Body = {
  codigoSocio?: string | null
  codigoCuenta?: string | null
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
    return NextResponse.json(
      { detalle: "Cuerpo inválido." },
      { status: 400 },
    )
  }

  try {
    await cambiarCodigosContraAuthService(
      accessToken,
      body.codigoSocio ?? null,
      body.codigoCuenta ?? null,
    )
  } catch (error) {
    return respuestaDesdeApiError(error)
  }

  // Códigos guardados. Forzamos refresh para que el JWT nuevo los incluya.
  const refreshToken = cookieStore.get(COOKIE_REFRESH)?.value
  if (refreshToken) {
    try {
      const tokens = await refrescarTokens(
        refreshToken,
        extraerIpCliente(request),
        request.headers.get("user-agent"),
      )
      const payload = decodificarAccessToken(tokens.accessToken)
      if (payload) {
        setCookiesSesion(cookieStore, tokens)
        return NextResponse.json({
          usuario: mapearPayloadAUsuario(payload),
          refrescado: true,
        })
      }
    } catch {
      // Los códigos SÍ se guardaron; solo no se pudo rotar el token ahora. El
      // frontend los verá en el próximo refresh natural (≤ TTL del access).
    }
  }

  return NextResponse.json({ refrescado: false })
}
