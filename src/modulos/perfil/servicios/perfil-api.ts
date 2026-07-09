import { clienteHttp } from "@/compartido/api"
import type { UsuarioSesion } from "@/compartido/autenticacion/sesion"

// Llamadas client-side a los Route Handlers BFF del propio Next (same-origin).
// El JWT viaja en la cookie httpOnly; el navegador nunca lo ve.

type RespuestaCambioCodigos = {
  usuario?: UsuarioSesion
  refrescado: boolean
}

// Cambia (o limpia, pasando null) los códigos internos de la cuenta. El Route
// Handler fuerza un refresh, así que puede devolver el usuario ya actualizado.
export async function cambiarCodigos(
  codigoSocio: string | null,
  codigoCuenta: string | null,
): Promise<RespuestaCambioCodigos> {
  const { data } = await clienteHttp.patch<RespuestaCambioCodigos>(
    "/api/auth/perfil/codigos",
    { codigoSocio, codigoCuenta },
  )
  return data
}

export async function cambiarPassword(
  passwordActual: string,
  passwordNueva: string,
): Promise<void> {
  await clienteHttp.patch("/api/auth/perfil/password", {
    passwordActual,
    passwordNueva,
  })
}
