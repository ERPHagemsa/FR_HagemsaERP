// Helpers para consumir la sesion actual desde Route Handlers (server-only).
//
// USO TIPICO:
//   import { obtenerSesionActual, requerirSesion } from "@/compartido/autenticacion/sesion-servidor"
//
//   // En un Route Handler que necesita saber quien es el usuario:
//   const sesion = await requerirSesion()  // throws si no hay sesion
//   logger.info("X hizo Y", { accountId: sesion.sub })
//
//   // Variante que no lanza (devuelve null):
//   const sesion = await obtenerSesionActual()
//   if (!sesion) return NextResponse.json({}, { status: 401 })

import { cookies } from "next/headers"

import { COOKIE_ACCESS } from "./cookies-sesion"
import {
  decodificarAccessToken,
  type PayloadAccessToken,
  type RolPayload,
} from "./tokens-jwt"
import type { UsuarioSesion } from "./sesion"

export class SesionRequeridaError extends Error {
  constructor() {
    super("No hay sesion activa")
    this.name = "SesionRequeridaError"
  }
}

export async function obtenerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_ACCESS)?.value ?? null
}

// Solo lee la cookie real. Aun en modo desarrollo, la sesion se obtiene
// pasando por POST /api/auth/dev-login (boton "Entrar como admin (dev)" en
// /login), que setea las cookies httpOnly normales. Asi /login siempre es
// accesible y se puede probar tanto el login real como el atajo dev.
export async function obtenerSesionActual(): Promise<PayloadAccessToken | null> {
  const token = await obtenerAccessToken()
  if (!token) return null
  return decodificarAccessToken(token)
}

export async function requerirSesion(): Promise<PayloadAccessToken> {
  const sesion = await obtenerSesionActual()
  if (!sesion) {
    throw new SesionRequeridaError()
  }
  return sesion
}

// Transforma el payload del JWT en el shape que consume la UI (UsuarioSesion).
// El JWT trae `roles: [{ role, scope }]`, la UI solo usa los nombres.
export function mapearPayloadAUsuario(
  payload: PayloadAccessToken,
): UsuarioSesion {
  return {
    id: payload.sub,
    email: payload.email,
    nombre: payload.name,
    tipo: payload.type,
    roles: payload.roles.map((rol: RolPayload) => rol.role),
  }
}
