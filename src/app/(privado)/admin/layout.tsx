import { redirect } from "next/navigation"

import { obtenerSesionActual } from "@/compartido/autenticacion/sesion-servidor"

// Guard server-side para todo /admin/*: si la sesion no es SUPER_ADMIN,
// redirige a / (home). Si no hay sesion, redirige a /login.
//
// Esto se ejecuta en el server antes de renderizar cualquier pagina del area
// admin, asi que el codigo del cliente NUNCA ve datos protegidos sin
// autorizacion previa.

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sesion = await obtenerSesionActual()

  if (!sesion) {
    redirect("/login?next=/admin/cuentas")
  }

  const esSuperAdmin = sesion.roles.some((r) => r.role === "SUPER_ADMIN")
  if (!esSuperAdmin) {
    redirect("/")
  }

  // Cada vista admin ahora renderiza su propio SiteHeader (breadcrumb +
  // SidebarTrigger), igual que el resto de la app, asi que aqui ya no hace
  // falta la barra movil que antes suplia el trigger del sidebar off-canvas.
  return children
}
