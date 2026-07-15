"use client"

import { useSesion } from "./use-sesion"

// Permisos planos del usuario actual (roles[].permisos[] del JWT).
//
// IGUAL que use-tiene-rol: esto SOLO controla UI (ocultar modulos/botones).
// La autorizacion real la hace cada backend con @RequirePermission (403).
export function usePermisos(): ReadonlyArray<string> {
  const { usuario } = useSesion()
  return usuario?.permisos ?? []
}

// true si el usuario tiene el permiso exacto (ej. "bc02:activo:escribir").
export function useTienePermiso(codigo: string): boolean {
  const permisos = usePermisos()
  return permisos.includes(codigo)
}

// true si el usuario tiene ALGUN permiso del modulo indicado. El prefijo es
// el primer segmento del codigo `<modulo>:<recurso>:<accion>` (ej. "bc02").
export function useTienePermisoDeModulo(prefijo: string): boolean {
  const permisos = usePermisos()
  return permisos.some((permiso) => permiso.startsWith(`${prefijo}:`))
}
