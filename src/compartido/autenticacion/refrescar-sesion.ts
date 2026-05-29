// Refresh transparente de la sesion desde el middleware.
//
// NOTA SOBRE RUNTIME: este modulo se importa desde proxy.ts (middleware de
// Next), que corre en EDGE RUNTIME por default. Por eso aca usamos fetch
// nativo en vez de axios: axios 1.x todavia tiene limitaciones en Edge runtime
// y la llamada es simple (POST JSON, sin interceptores complejos). Todo el
// resto del codigo de auth sigue usando axios.

import { NextResponse, type NextRequest } from "next/server"

import {
  SEGUNDOS_UMBRAL_REFRESH,
  URLS_SERVIDOR,
} from "@/compartido/api/config-servidor"

import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  opcionesCookieSesion,
} from "./cookies-sesion"
import { extraerIpCliente } from "./extraer-ip-cliente"
import { decodificarAccessToken, vaACaducar } from "./tokens-jwt"

export type ResultadoRefresh =
  | { readonly tipo: "no_se_necesita" }
  | { readonly tipo: "refrescado"; readonly response: NextResponse }
  | { readonly tipo: "falla" }

type RespuestaRefresh = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
}

export async function refrescarSiNecesario(
  request: NextRequest,
): Promise<ResultadoRefresh> {
  const accessToken = request.cookies.get(COOKIE_ACCESS)?.value
  const refreshToken = request.cookies.get(COOKIE_REFRESH)?.value

  if (!accessToken || !refreshToken) {
    return { tipo: "no_se_necesita" }
  }

  const payload = decodificarAccessToken(accessToken)
  if (!payload) {
    return { tipo: "falla" }
  }

  if (!vaACaducar(payload, SEGUNDOS_UMBRAL_REFRESH)) {
    return { tipo: "no_se_necesita" }
  }

  const ipCliente = extraerIpCliente(request)
  const headersFetch: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (ipCliente) {
    headersFetch["X-Cliente-Ip"] = ipCliente
  }

  let datos: RespuestaRefresh
  try {
    const respuesta = await fetch(`${URLS_SERVIDOR.authService}/api/auth/refresh`, {
      method: "POST",
      headers: headersFetch,
      body: JSON.stringify({ refreshToken }),
    })

    if (!respuesta.ok) {
      // No loggeamos el refreshToken por seguridad; solo el status del Auth Service.
      console.warn(
        `[refrescar-sesion] Auth Service rechazo el refresh con status ${respuesta.status}`,
      )
      return { tipo: "falla" }
    }

    datos = (await respuesta.json()) as RespuestaRefresh
  } catch (err) {
    console.warn(
      "[refrescar-sesion] Network error contactando al Auth Service",
      err instanceof Error ? err.message : String(err),
    )
    return { tipo: "falla" }
  }

  const response = NextResponse.next()
  response.cookies.set({
    ...opcionesCookieSesion,
    name: COOKIE_ACCESS,
    value: datos.accessToken,
    maxAge: datos.expiresIn,
  })
  response.cookies.set({
    ...opcionesCookieSesion,
    name: COOKIE_REFRESH,
    value: datos.refreshToken,
    maxAge: datos.refreshExpiresIn,
  })

  return { tipo: "refrescado", response }
}
