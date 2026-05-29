"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/compartido/componentes/ui/sidebar"
import { cn } from "@/compartido/utilidades/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

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
// a Cotizaciones (/comercial) y solo se marca el correcto. Evita el falso
// positivo cuando la URL de un subitem es prefijo de la de un hermano.
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
  // ruta para que el sidebar muestre la seccion del usuario al cargar, y
  // luego el chevron permite togglear manualmente.
  const [openItem, setOpenItem] = React.useState<string | null>(activeItemTitle)

  // Cuando la ruta cambia a otro modulo, abrimos automaticamente el nuevo.
  // Se hace en render (no en useEffect) siguiendo el patron oficial de React
  // para "ajustar state cuando una prop cambia" — evita un commit extra.
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
    <SidebarGroup className="px-2 pt-1">
      <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/45">
        Modulos
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const moduleHref =
              item.url ?? item.items.find((subItem) => subItem.url !== "#")?.url ?? "#"
            const isModuleActive = isRouteActive(pathname, moduleHref)
            const subUrlActiva = urlSubitemActivo(pathname, item.items)
            const hasActiveChild = subUrlActiva !== null
            const isOpen = openItem === item.title
            const isHighlighted = isOpen || hasActiveChild || isModuleActive

            return (
              <SidebarMenuItem
                key={item.title}
                className={cn(
                  "sidebar-nav-item relative rounded-2xl transition-colors duration-300 ease-out before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-transparent before:transition-colors",
                  isHighlighted &&
                    "bg-sidebar-accent/80 text-sidebar-accent-foreground before:bg-primary"
                )}
              >
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isHighlighted}
                  className={cn(
                    "h-11 rounded-2xl border border-transparent px-3 pr-12 font-medium text-sidebar-foreground/76 transition-all duration-300 ease-out",
                    "hover:translate-x-0.5 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
                    isHighlighted &&
                      "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Link href={moduleHref}>
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-xl bg-background/80 text-sidebar-foreground/62 transition-all duration-300 ease-out",
                        "group-hover/button:scale-105 group-hover/button:text-sidebar-foreground",
                        isHighlighted &&
                          "bg-primary text-primary-foreground",
                        hasActiveChild &&
                          !isHighlighted &&
                          "bg-primary/10 text-primary"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>

                {/*
                  Chevron como boton hermano del Link, no hijo. Asi un click
                  toggle el submenu sin disparar la navegacion. Posicionado
                  absoluto para preservar el look del diseno original.
                */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`submenu-${item.title}`}
                  aria-label={
                    isOpen
                      ? `Contraer ${item.title}`
                      : `Expandir ${item.title}`
                  }
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    alternar(item.title)
                  }}
                  className={cn(
                    // `top-2.5` (10px) ancla el chevron al header de 44px (h-11)
                    // del modulo. Si usaramos `top-1/2 -translate-y-1/2`, al
                    // expandirse el submenu el SidebarMenuItem crece y el
                    // chevron descenderia con el. Aqui queda fijo al header.
                    "absolute right-3 top-2.5 z-10 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sidebar-foreground/38 transition-all duration-300 ease-out hover:bg-background hover:text-sidebar-foreground focus-visible:bg-background focus-visible:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    isOpen &&
                      "rotate-90 bg-background text-sidebar-foreground"
                  )}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </button>

                {isOpen ? (
                  <SidebarMenuSub
                    id={`submenu-${item.title}`}
                    className="sidebar-submenu mb-2 ml-7 mt-1.5 gap-1 border-l border-sidebar-border/70 pl-3 animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    {item.items.map((subItem, index) => (
                      <SidebarMenuSubItem
                        key={subItem.title}
                        className="sidebar-submenu-item"
                        style={
                          {
                            "--submenu-index": index,
                          } as React.CSSProperties
                        }
                      >
                        <SidebarMenuSubButton
                          asChild
                          isActive={subItem.url === subUrlActiva}
                          className="group/sub relative h-8 rounded-xl px-3 text-sidebar-foreground/60 transition-all duration-300 ease-out before:absolute before:-left-[17px] before:size-1.5 before:rounded-full before:bg-sidebar-border before:transition-all before:duration-300 hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:before:bg-primary data-active:bg-transparent data-active:font-semibold data-active:text-primary data-active:before:bg-primary"
                        >
                          <Link href={subItem.url}>
                            <span className="truncate pl-2">
                              {subItem.title}
                            </span>
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
