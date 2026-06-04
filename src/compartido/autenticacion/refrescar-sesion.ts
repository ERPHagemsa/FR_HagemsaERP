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

// Single-flight del refresh en el middleware. Una pagina dispara varias
// navegaciones/prefetch (RSC) concurrentes; cada una pasa por aca y, sin esto,
// todas presentarian el MISMO refresh token a la vez -> la primera lo rota y las
// demas caen como "reuso" en el Auth Service -> logout espurio. Colapsamos las
// concurrentes (mismo refresh token) a UNA sola llamada y todas comparten el
// resultado, asi cada respuesta reescribe las cookies con el mismo par nuevo.
// In-memory por instancia (mismo patron que cliente-http.ts); cubre el caso
// comun de un burst que cae en la misma instancia.
const refreshesEnCurso = new Map<string, Promise<RespuestaRefresh | null>>()

function llamarRefreshUnaVez(
  refreshToken: string,
  headersFetch: Record<string, string>,
): Promise<RespuestaRefresh | null> {
  const enCurso = refreshesEnCurso.get(refreshToken)
  if (enCurso) return enCurso

  const promesa = (async (): Promise<RespuestaRefresh | null> => {
    try {
      const respuesta = await fetch(
        `${URLS_SERVIDOR.authService}/api/auth/refresh`,
        {
          method: "POST",
          headers: headersFetch,
          body: JSON.stringify({ refreshToken }),
        },
      )
      if (!respuesta.ok) {
        // No loggeamos el refreshToken por seguridad; solo el status.
        console.warn(
          `[refrescar-sesion] Auth Service rechazo el refresh con status ${respuesta.status}`,
        )
        return null
      }
      return (await respuesta.json()) as RespuestaRefresh
    } catch (err) {
      console.warn(
        "[refrescar-sesion] Network error contactando al Auth Service",
        err instanceof Error ? err.message : String(err),
      )
      return null
    }
  })()

  refreshesEnCurso.set(refreshToken, promesa)
  // Liberamos la entrada al terminar para que el proximo ciclo (con el token ya
  // rotado) arranque fresco. El guard evita borrar una promesa mas nueva.
  void promesa.finally(() => {
    if (refreshesEnCurso.get(refreshToken) === promesa) {
      refreshesEnCurso.delete(refreshToken)
    }
  })
  return promesa
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
  const userAgenteCliente = request.headers.get("user-agent")
  const headersFetch: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (ipCliente) {
    headersFetch["X-Cliente-Ip"] = ipCliente
  }
  if (userAgenteCliente) {
    headersFetch["X-Cliente-User-Agent"] = userAgenteCliente
  }

  // Single-flight: si varias navegaciones concurrentes necesitan refrescar el
  // mismo token, comparten esta unica llamada (ver llamarRefreshUnaVez).
  const datos = await llamarRefreshUnaVez(refreshToken, headersFetch)
  if (!datos) {
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
