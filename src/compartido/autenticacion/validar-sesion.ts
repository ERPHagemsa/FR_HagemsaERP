// Validacion de la sesion contra el Auth Service desde el middleware.
//
// Por que existe: el access token es un JWT stateless. Decodificarlo en local
// (ver sesion-servidor.ts) dice quien es el usuario y si vencio, pero NO si la
// sesion fue REVOCADA (logout en otro dispositivo, o un admin que revoco la
// sesion). El Auth Service mantiene una blacklist de jti revocados y su guard la
// consulta por request; aca le preguntamos a un endpoint protegido para enterarnos
// de la revocacion sin esperar a que el access token expire.
//
// RUNTIME: se importa desde proxy.ts (Edge runtime), por eso usa fetch nativo.

import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"

export type ResultadoValidacion =
  | { readonly tipo: "valida" }
  | { readonly tipo: "revocada" }

// Consulta GET /api/auth/sesion con el access token. El JwtAuthGuard del Auth
// Service valida firma + exp + iss/aud y consulta la blacklist:
//   200 -> sesion valida.
//   401 -> token invalido/vencido O jti revocado -> tratamos como revocada.
//
// FAIL-OPEN ante error de red: si el Auth Service no responde NO bloqueamos la
// navegacion del ERP entero. El access token sigue siendo criptograficamente
// valido y de vida corta; la proxima navegacion reintenta la validacion. La
// decision de seguridad fuerte (rechazar el token) la toma cada backend de
// recurso con su propio guard fail-closed, no esta verificacion de UX.
export async function validarSesionRemota(
  accessToken: string,
): Promise<ResultadoValidacion> {
  try {
    const respuesta = await fetch(
      `${URLS_SERVIDOR.authService}/api/auth/sesion`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    if (respuesta.status === 401) {
      return { tipo: "revocada" }
    }
    // 200 (valida) o cualquier otro status no-401 (ej. 5xx transitorio):
    // no asumimos revocacion ante fallas del servidor.
    return { tipo: "valida" }
  } catch (err) {
    console.warn(
      "[validar-sesion] Network error contactando al Auth Service; fail-open",
      err instanceof Error ? err.message : String(err),
    )
    return { tipo: "valida" }
  }
}
