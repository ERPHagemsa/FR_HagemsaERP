import { redirect } from "next/navigation"

import { obtenerSesionActual } from "@/compartido/autenticacion/sesion-servidor"
import { SidebarTrigger } from "@/compartido/componentes/ui/sidebar"

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

  return (
    <>
      {/* Barra solo movil: las vistas admin usan header plano (sin SiteHeader),
          asi que sin esto el sidebar off-canvas no tendria como abrirse en
          pantallas chicas. En >=md el sidebar ya es visible, no hace falta. */}
      <div className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:hidden">
        <SidebarTrigger className="-ml-1" />
        <span className="text-sm font-medium">Administración</span>
      </div>
      {children}
    </>
  )
}
