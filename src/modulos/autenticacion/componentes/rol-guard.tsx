"use client"

import type { ReactNode } from "react"

import {
  useTieneAlgunRol,
  useTieneRol,
} from "@/modulos/autenticacion/ganchos/use-tiene-rol"

type PropsRolGuard = {
  // Rol unico requerido.
  rol?: string
  // O cualquiera de estos roles (OR).
  rolesPermitidos?: ReadonlyArray<string>
  // Que mostrar si el usuario NO tiene el rol. Default: nada.
  fallback?: ReactNode
  children: ReactNode
}

// Renderiza `children` solo si el usuario tiene el rol indicado.
//
// USO:
//   <RolGuard rol="SUPER_ADMIN">
//     <BotonPeligroso />
//   </RolGuard>
//
//   <RolGuard rolesPermitidos={["ADMIN_ACTIVOS", "SUPER_ADMIN"]}>
//     <CrearActivo />
//   </RolGuard>
//
//   <RolGuard rol="ADMIN" fallback={<Alert>Sin permisos</Alert>}>
//     <PaginaAdmin />
//   </RolGuard>
//
// NOTA: esto es solo UI. La autorizacion real la hace el backend en cada
// endpoint. Si el usuario hace algo que su rol no permite, el backend
// devuelve 403 igual.
export function RolGuard({
  rol,
  rolesPermitidos,
  fallback = null,
  children,
}: PropsRolGuard) {
  const tieneRolUnico = useTieneRol(rol ?? "")
  const tieneAlgunRol = useTieneAlgunRol(rolesPermitidos ?? [])

  const autorizado = rol ? tieneRolUnico : tieneAlgunRol

  if (!autorizado) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
