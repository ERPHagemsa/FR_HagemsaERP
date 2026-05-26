// Tipos compartidos entre cliente y servidor para la sesion del usuario.
//
// Para el manejo real de cookies httpOnly, ver compartido/autenticacion/cookies-sesion.ts.
// Para decodificar JWTs, ver compartido/autenticacion/tokens-jwt.ts.

// Datos del usuario que el frontend muestra en UI (nombre, email, roles).
// Estos campos se derivan del payload del access token.
export interface UsuarioSesion {
  readonly id: string
  readonly email: string
  readonly nombre: string
  readonly tipo: string
  readonly roles: ReadonlyArray<string>
}

// === Legacy ============================================================
// Mantenido por compatibilidad con login/route.ts, logout/route.ts y proxy.ts
// hasta que se reemplacen por la integracion real con el Auth Service.
// Despues de esa migracion, eliminar estas constantes.

export const COOKIE_SESION = "hagemsa_session"
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 8
