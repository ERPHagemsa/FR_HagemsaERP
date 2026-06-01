import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  esError401,
  esError409,
  esErrorRateLimit,
  extraerMensajeError,
  obtenerCodigoError,
} from "@/compartido/api"
import {
  loginContraAuthService,
} from "@/compartido/autenticacion/auth-service-cliente"
import { setCookiesSesion } from "@/compartido/autenticacion/cookies-sesion"
import { extraerIpCliente } from "@/compartido/autenticacion/extraer-ip-cliente"
import { mapearPayloadAUsuario } from "@/compartido/autenticacion/sesion-servidor"
import { decodificarAccessToken } from "@/compartido/autenticacion/tokens-jwt"

type CuerpoLogin = {
  identificador?: string
  password?: string
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CuerpoLogin | null

  if (!body?.identificador || !body.password) {
    return NextResponse.json(
      { message: "Usuario o correo y contrasena son obligatorios." },
      { status: 400 },
    )
  }

  const ipCliente = extraerIpCliente(request)

  let tokens
  try {
    tokens = await loginContraAuthService(
      body.identificador,
      body.password,
      ipCliente,
      request.headers.get("user-agent"),
    )
  } catch (error) {
    if (esError401(error)) {
      // Generico: no revelamos si el usuario/correo existe o si la password es incorrecta.
      return NextResponse.json(
        { message: "Credenciales invalidas." },
        { status: 401 },
      )
    }
    // Cuenta suspendida o inactiva: el Auth Service ya verifico la password
    // antes de revelar el estado, asi que es seguro mostrar el motivo preciso.
    const codigo = obtenerCodigoError(error)
    if (
      esError409(error) &&
      (codigo === "AUTH_CUENTA_SUSPENDIDA" || codigo === "AUTH_CUENTA_INACTIVA")
    ) {
      return NextResponse.json(
        {
          message: extraerMensajeError(
            error,
            "Tu cuenta no esta habilitada para iniciar sesion.",
          ),
        },
        { status: 409 },
      )
    }
    if (esErrorRateLimit(error)) {
      return NextResponse.json(
        { message: "Demasiados intentos. Esperar unos minutos." },
        { status: 429 },
      )
    }
    return NextResponse.json(
      { message: "Servicio de autenticacion no disponible." },
      { status: 503 },
    )
  }

  const payload = decodificarAccessToken(tokens.accessToken)
  if (!payload) {
    return NextResponse.json(
      { message: "Respuesta invalida del servicio de autenticacion." },
      { status: 502 },
    )
  }

  const cookieStore = await cookies()
  setCookiesSesion(cookieStore, tokens)

  return NextResponse.json({ usuario: mapearPayloadAUsuario(payload) })
}
