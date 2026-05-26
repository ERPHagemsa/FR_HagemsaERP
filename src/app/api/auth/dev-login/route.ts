import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { setCookiesSesion } from "@/compartido/autenticacion/cookies-sesion"
import {
  crearTokensMockDev,
  modoDesarrolloActivo,
  type OpcionesUsuarioDev,
} from "@/compartido/autenticacion/jwt-dev"
import { mapearPayloadAUsuario } from "@/compartido/autenticacion/sesion-servidor"
import { decodificarAccessToken } from "@/compartido/autenticacion/tokens-jwt"

// Endpoint de login para desarrollo. Setea cookies httpOnly con un JWT "mock"
// sin firma valida, util mientras el Auth Service real esta en construccion.
//
// Doble gate: NODE_ENV !== "production" AND AUTH_MODO_DESARROLLO === "true".
// Si el gate no aplica devuelve 404 (no 401) para que no se note que el
// endpoint existe en prod.

export async function POST(request: Request) {
  if (!modoDesarrolloActivo()) {
    return new NextResponse("Not Found", { status: 404 })
  }

  const body = (await request
    .json()
    .catch(() => null)) as OpcionesUsuarioDev | null

  const tokens = crearTokensMockDev(body ?? {})

  const payload = decodificarAccessToken(tokens.accessToken)
  if (!payload) {
    return NextResponse.json(
      { message: "No se pudo generar la sesion dev." },
      { status: 500 },
    )
  }

  const cookieStore = await cookies()
  setCookiesSesion(cookieStore, tokens)

  return NextResponse.json({ usuario: mapearPayloadAUsuario(payload) })
}
