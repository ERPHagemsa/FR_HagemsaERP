import { NextResponse } from "next/server"

import {
  mapearPayloadAUsuario,
  obtenerSesionActual,
} from "@/compartido/autenticacion/sesion-servidor"

// Devuelve el usuario de la sesion actual a partir del access cookie httpOnly.
// El frontend lo consume con TanStack Query para mostrar nombre, roles, etc.
// Si no hay sesion -> 401.

export async function GET() {
  const payload = await obtenerSesionActual()
  if (!payload) {
    return NextResponse.json(
      { message: "Sesion no iniciada." },
      { status: 401 },
    )
  }
  return NextResponse.json({ usuario: mapearPayloadAUsuario(payload) })
}
