import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { COOKIE_SESION } from "@/compartido/autenticacion/sesion"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_SESION)

  return NextResponse.json({ ok: true })
}
