import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  COOKIE_SESION,
  DURACION_SESION_SEGUNDOS,
} from "@/compartido/autenticacion/sesion"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string
    password?: string
  } | null

  if (!body?.email || !body.password) {
    return NextResponse.json(
      { message: "Correo y contrasena son obligatorios." },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()

  cookieStore.set(COOKIE_SESION, "sesion-local-hagemsa", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  })

  return NextResponse.json({
    usuario: {
      email: body.email,
      nombre: "Hagemsa",
    },
  })
}
