// Cliente HTTP server-only para hablar con el Auth Service.
//
// IMPORTANTE: este modulo NUNCA debe importarse desde codigo del navegador.
// Solo se consume desde Route Handlers (src/app/api/auth/**) porque las URLs
// y secretos del Auth Service son privados al server.

import { crearClienteHttp } from "@/compartido/api/axios"
import type { RespuestaRecurso } from "@/compartido/api/contrato"
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

// El backend envuelve la respuesta como { datos: tokens }. Desempaquetamos
// `datos` aqui para que el caller reciba el objeto plano de tokens.
//
// `ipCliente` se reenvia como header X-Cliente-Ip para que el audit log del
// Auth Service registre la IP real del usuario final, no la del frontend Cloud Run.
export async function loginContraAuthService(
  identificador: string,
  password: string,
  ipCliente: string | null,
): Promise<RespuestaTokensAuth> {
  const { data } = await cliente.post<RespuestaRecurso<RespuestaTokensAuth>>(
    "/api/auth/login",
    { identificador, password },
    ipCliente ? { headers: { "X-Cliente-Ip": ipCliente } } : undefined,
  )
  return data.datos
}

export async function refrescarTokens(
  refreshToken: string,
  ipCliente: string | null,
): Promise<RespuestaTokensAuth> {
  const { data } = await cliente.post<RespuestaRecurso<RespuestaTokensAuth>>(
    "/api/auth/refresh",
    { refreshToken },
    ipCliente ? { headers: { "X-Cliente-Ip": ipCliente } } : undefined,
  )
  return data.datos
}

export async function logoutContraAuthService(
  accessToken: string,
): Promise<void> {
  await cliente.post("/api/auth/logout", null, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
