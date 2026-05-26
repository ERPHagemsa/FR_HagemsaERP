"use client"

import { useSesion } from "./use-sesion"

// Devuelve true si el usuario actual tiene el rol indicado.
//
// Se basa en los roles que vienen en el JWT (campo roles: [{ role, scope }]).
// Para autorizacion fina (permisos), el backend valida en cada endpoint y
// devuelve 403. Esta funcion solo controla la UI.
export function useTieneRol(rolBuscado: string): boolean {
  const { usuario } = useSesion()
  if (!usuario) return false
  return usuario.roles.includes(rolBuscado)
}

// Variante para listas: requiere TODOS los roles indicados.
export function useTieneTodosLosRoles(rolesBuscados: ReadonlyArray<string>): boolean {
  const { usuario } = useSesion()
  if (!usuario) return false
  return rolesBuscados.every((rol) => usuario.roles.includes(rol))
}

// Variante para listas: requiere AL MENOS UNO de los roles.
export function useTieneAlgunRol(rolesBuscados: ReadonlyArray<string>): boolean {
  const { usuario } = useSesion()
  if (!usuario) return false
  return rolesBuscados.some((rol) => usuario.roles.includes(rol))
}
