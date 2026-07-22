import type { UsuarioSesion } from "./sesion"

export function obtenerUsuarioAuditoria(
  usuario: UsuarioSesion | null | undefined,
): string {
  return (
    usuario?.nombreUsuario?.trim() ||
    usuario?.email?.trim() ||
    usuario?.nombre?.trim() ||
    "usuario-autenticado"
  )
}
