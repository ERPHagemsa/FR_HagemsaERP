// Cliente HTTP server-only para hablar con el Auth Service.
//
// IMPORTANTE: este modulo NUNCA debe importarse desde codigo del navegador.
// Solo se consume desde Route Handlers (src/app/api/auth/**) porque las URLs
// y secretos del Auth Service son privados al server.

import { crearClienteHttp } from "@/compartido/api/axios"
import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

export interface RespuestaTokensAuth {
  readonly accessToken: string
  readonly refreshToken: string
  readonly tokenType: "Bearer"
  readonly expiresIn: number
  readonly refreshExpiresIn: number
}

const cliente = crearClienteHttp({
  baseURL: URLS_SERVIDOR.authService,
  timeoutMs: 8000,
  withCredentials: false,
  mensajeErrorDefault: "No se pudo contactar al servicio de autenticacion.",
})

export async function loginContraAuthService(
  email: string,
  password: string,
): Promise<RespuestaTokensAuth> {
  const { data } = await cliente.post<RespuestaTokensAuth>("/api/auth/login", {
    email,
    password,
  })
  return data
}

export async function refrescarTokens(
  refreshToken: string,
): Promise<RespuestaTokensAuth> {
  const { data } = await cliente.post<RespuestaTokensAuth>("/api/auth/refresh", {
    refreshToken,
  })
  return data
}

export async function logoutContraAuthService(
  accessToken: string,
): Promise<void> {
  await cliente.post("/api/auth/logout", null, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
