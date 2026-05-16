"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVerticalCircle01Icon, UserCircle02Icon, CreditCardIcon, Notification03Icon, Logout01Icon } from "@hugeicons/core-free-icons"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-14 rounded-xl border border-sidebar-border/70 bg-background/70 px-2.5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-9 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-red-100 text-red-700">
                  HG
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/55">
                  Operaciones
                </span>
              </div>
              <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} className="ml-auto size-4 text-sidebar-foreground/45" />
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
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">HG</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <HugeiconsIcon icon={UserCircle02Icon} strokeWidth={2} />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                Administracion
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
                Notificaciones
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
              Salir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
