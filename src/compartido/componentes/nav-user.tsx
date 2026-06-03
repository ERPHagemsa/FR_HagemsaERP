"use client"

import { useRouter } from "next/navigation"

import { clienteHttp } from "@/compartido/api/cliente-http"
import {
  Avatar,
  AvatarFallback,
} from "@/compartido/componentes/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/compartido/componentes/ui/sidebar"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import { Bell, CreditCard, CircleUser, EllipsisVertical, LogOut } from "lucide-react"

function calcularIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "HG"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

type NavUserProps = {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function NavUser({ user }: NavUserProps = {}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { usuario, estaCargando } = useSesion()

  async function cerrarSesion() {
    try {
      await clienteHttp.post("/api/auth/logout")
    } catch {
      // El logout local siempre procede aunque el server falle.
    }
    router.replace("/login")
    router.refresh()
  }

  if (estaCargando && !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Skeleton className="h-14 w-full rounded-xl" />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const usuarioActual = usuario
    ? {
        nombre: usuario.nombre || usuario.email,
        nombreUsuario: usuario.nombreUsuario,
        email: usuario.email,
        tipo: usuario.tipo,
      }
    : user
      ? {
          nombre: user.name,
          nombreUsuario: "",
          email: user.email,
          tipo: "operacion",
        }
      : null

  if (!usuarioActual) {
    return null
  }

  const iniciales = calcularIniciales(usuarioActual.nombre || usuarioActual.email)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-red-100 text-red-700">
                  {iniciales}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{usuarioActual.nombre}</span>
                <span className="truncate text-xs text-muted-foreground capitalize">
                  {usuarioActual.tipo}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{iniciales}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{usuarioActual.nombre}</span>
                  {usuarioActual.nombreUsuario ? (
                    <span className="truncate text-xs text-muted-foreground">
                      @{usuarioActual.nombreUsuario}
                    </span>
                  ) : null}
                  <span className="truncate text-xs text-muted-foreground">
                    {usuarioActual.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <CircleUser />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Administracion
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notificaciones
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void cerrarSesion()}>
              <LogOut />
              Salir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
