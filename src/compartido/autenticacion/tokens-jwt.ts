// Decodificador del payload del access token (JWT firmado por el Auth Service).
//
// IMPORTANTE: este modulo SOLO decodifica (parsea base64url -> JSON). NO
// verifica la firma. Es seguro porque:
//   1. El JWT viene de una cookie httpOnly que setea NUESTRO server de Next
//      despues de un login exitoso contra el Auth Service. JS del cliente no la
//      puede modificar.
//   2. El payload se usa SOLO para UI (mostrar nombre, ocultar/mostrar botones
//      por rol). La autorizacion real la hace cada backend de BC verificando
//      la firma contra JWKS del Auth Service.
//
// Funciona tanto en Node runtime (Route Handlers) como en Edge runtime
// (middleware) porque usa atob + TextDecoder en vez de Buffer.

export interface RolPayload {
  readonly role: string
  readonly scope: Record<string, unknown>
  // Permisos del rol resueltos al emitir el JWT. El frontend los usa para
  // ocultar/mostrar botones; la autorizacion real la hace cada backend.
  readonly permisos: ReadonlyArray<string>
}

export interface PayloadAccessToken {
  readonly sub: string
  readonly jti: string
  readonly email: string
  // Nombre de usuario: la unica llave de acceso (el correo dejo de ser unico).
  // Opcional: tokens emitidos antes de habilitarlo pueden no traerlo.
  readonly username?: string
  // TipoCuenta del dominio: "interno" | "cliente" | "proveedor"
  readonly type: string
  readonly name: string
  readonly roles: ReadonlyArray<RolPayload>
  // Vinculo con el socio de negocio (BC01), presente solo si la cuenta lo tiene.
  // codigoSocio/codigoCuenta son alfanumericos (hasta 20); socioExternoId es el
  // personalId de BC01. El backend los emite via ...(socio && { ... }).
  readonly codigoSocio?: string
  readonly codigoCuenta?: string
  readonly socioExternoId?: number
  // Datos de display del socio extraídos del snapshot (nombre y documento).
  readonly socioNombre?: string
  readonly socioDocumento?: string
  readonly iat: number
  readonly exp: number
}

export function decodificarAccessToken(
  token: string,
): PayloadAccessToken | null {
  try {
    const partes = token.split(".")
    if (partes.length !== 3) return null

    const payloadCrudo = partes[1]
    if (!payloadCrudo) return null

    const json = decodificarBase64Url(payloadCrudo)
    const payload = JSON.parse(json) as PayloadAccessToken

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function vaACaducar(
  payload: PayloadAccessToken,
  segundosUmbral: number,
): boolean {
  const ahoraSegundos = Math.floor(Date.now() / 1000)
  return payload.exp - ahoraSegundos < segundosUmbral
}

export function estaExpirado(payload: PayloadAccessToken): boolean {
  const ahoraSegundos = Math.floor(Date.now() / 1000)
  return payload.exp <= ahoraSegundos
}

function decodificarBase64Url(entrada: string): string {
  const base64 = entrada.replace(/-/g, "+").replace(/_/g, "/")
  const padLen = base64.length % 4
  const padded = padLen ? base64 + "=".repeat(4 - padLen) : base64
  const binario = atob(padded)

  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}
