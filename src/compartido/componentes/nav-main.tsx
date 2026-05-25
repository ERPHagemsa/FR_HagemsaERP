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

function isRouteActive(pathname: string, href: string) {
  if (href === "#") {
    return false
  }

  return pathname === href || pathname.startsWith(`${href}/`)
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
  const [openItem, setOpenItem] = React.useState<string | null>(null)

  React.useEffect(() => {
    const activeItem = items.find((item) =>
      item.items.some((subItem) => isRouteActive(pathname, subItem.url))
    )

    if (activeItem) {
      setOpenItem(activeItem.title)
    }
  }, [items, pathname])

  return (
    <SidebarGroup className="px-2 pt-1">
      <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/45">
        Modulos
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const hasActiveChild = item.items.some((subItem) =>
              isRouteActive(pathname, subItem.url)
            )
            const isOpen = openItem === item.title
            const isHighlighted = isOpen || hasActiveChild

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
                  tooltip={item.title}
                  onClick={() => setOpenItem(isOpen ? null : item.title)}
                  aria-expanded={isOpen}
                  isActive={isHighlighted}
                  className={cn(
                    "h-11 rounded-2xl border border-transparent px-3 font-medium text-sidebar-foreground/76 transition-all duration-300 ease-out",
                    "hover:translate-x-0.5 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
                    isHighlighted &&
                      "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
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
                  <span
                    className={cn(
                      "ml-auto flex size-6 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/38 transition-all duration-300 ease-out",
                      isOpen &&
                        "rotate-90 bg-background text-sidebar-foreground"
                    )}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                  </span>
                </SidebarMenuButton>
                {isOpen ? (
                  <SidebarMenuSub className="sidebar-submenu mb-2 ml-7 mt-1.5 gap-1 border-l border-sidebar-border/70 pl-3">
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
                          isActive={isRouteActive(pathname, subItem.url)}
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
