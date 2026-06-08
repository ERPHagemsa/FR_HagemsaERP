"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/compartido/componentes/ui/sidebar"
import { cn } from "@/compartido/utilidades/utils"

function isRouteActive(pathname: string, href: string, exact = false) {
  if (href === "#") {
    return false
  }

  if (exact) {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

// Devuelve la URL del subitem que mejor coincide con la ruta actual: de todos
// los que matchean por prefijo, gana el de URL mas larga (mas especifica). Asi,
// estando en "/comercial/prospectos", Prospectos (/comercial/prospectos) le gana
// a Cotizaciones (/comercial) y solo se marca el correcto.
function urlSubitemActivo(
  pathname: string,
  subitems: { url: string }[],
): string | null {
  let mejor: string | null = null
  for (const { url } of subitems) {
    if (isRouteActive(pathname, url) && (!mejor || url.length > mejor.length)) {
      mejor = url
    }
  }
  return mejor
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url?: string
    icon?: React.ReactNode
    items: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  // En pantallas chicas el sidebar es un panel off-canvas; al navegar hay que
  // cerrarlo (en escritorio openMobile no se usa, asi que es inocuo).
  const { setOpenMobile } = useSidebar()
  const activeItem = React.useMemo(
    () =>
      items.find((item) => {
        const moduleHref =
          item.url ?? item.items.find((subItem) => subItem.url !== "#")?.url ?? "#"

        return (
          isRouteActive(pathname, moduleHref) ||
          item.items.some((subItem) =>
            isRouteActive(pathname, subItem.url, subItem.url === moduleHref),
          )
        )
      }),
    [items, pathname],
  )
  const activeItemTitle = activeItem?.title ?? null

  // Modulo abierto (solo uno a la vez). Se siembra con el modulo activo por
  // ruta para que el sidebar muestre la seccion del usuario al cargar.
  const [openItem, setOpenItem] = React.useState<string | null>(activeItemTitle)

  // Cuando la ruta cambia a otro modulo, abrimos automaticamente el nuevo.
  // Se hace en render (patron oficial de React para ajustar state ante cambio
  // de prop) — evita un commit extra.
  const [lastActiveTitle, setLastActiveTitle] = React.useState<string | null>(
    activeItemTitle,
  )
  if (activeItemTitle !== lastActiveTitle) {
    setLastActiveTitle(activeItemTitle)
    if (activeItemTitle) setOpenItem(activeItemTitle)
  }

  function alternar(itemTitle: string) {
    setOpenItem((actual) => (actual === itemTitle ? null : itemTitle))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Modulos</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const moduleHref =
              item.url ?? item.items.find((subItem) => subItem.url !== "#")?.url ?? "#"
            const isModuleActive = isRouteActive(pathname, moduleHref)
            const subUrlActiva = urlSubitemActivo(pathname, item.items)
            const hasActiveChild = subUrlActiva !== null
            const isOpen = openItem === item.title
            const isHighlighted = isOpen || hasActiveChild || isModuleActive
            const tieneSub = item.items.length > 0

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isHighlighted}
                  className={cn(
                    // En tema oscuro los modulos inactivos van mas tenues; el
                    // seleccionado conserva el tono pleno (data-active manda).
                    !isHighlighted && "dark:text-sidebar-foreground/60",
                  )}
                >
                  <Link
                    href={moduleHref}
                    onClick={() => setOpenMobile(false)}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>

                {tieneSub ? (
                  <SidebarMenuAction
                    onClick={() => alternar(item.title)}
                    aria-label={
                      isOpen
                        ? `Contraer ${item.title}`
                        : `Expandir ${item.title}`
                    }
                    className={cn(
                      "text-sidebar-foreground/50 transition-transform duration-200",
                      isOpen && "rotate-90",
                    )}
                  >
                    <ChevronRight />
                  </SidebarMenuAction>
                ) : null}

                {isOpen && tieneSub ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={subItem.url === subUrlActiva}
                        >
                          <Link
                            href={subItem.url}
                            onClick={() => setOpenMobile(false)}
                          >
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
