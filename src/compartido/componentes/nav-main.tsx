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

  return (
    <SidebarGroup className="px-2 pt-1">
      <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/45">
        Modulos
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-1.5">
          {items.map((item) => {
            const hasActiveChild = item.items.some((subItem) =>
              isRouteActive(pathname, subItem.url)
            )
            const isOpen = openItem === item.title
            const isHighlighted = isOpen

            return (
              <SidebarMenuItem
                key={item.title}
                className={cn(
                  "relative rounded-xl before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-transparent",
                  isHighlighted && "bg-red-50 text-red-950 before:bg-red-600"
                )}
              >
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => setOpenItem(isOpen ? null : item.title)}
                  aria-expanded={isOpen}
                  isActive={isHighlighted}
                  className={cn(
                    "h-10 rounded-xl border border-transparent px-2.5 font-medium text-sidebar-foreground/82",
                    "hover:border-sidebar-border/80 hover:bg-background hover:text-sidebar-foreground",
                    isHighlighted &&
                      "border-red-100 bg-red-50 text-red-950 hover:bg-red-50 hover:text-red-950"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground/65 ring-1 ring-sidebar-border/60",
                      isHighlighted && "bg-red-600 text-white ring-red-600",
                      hasActiveChild &&
                        !isHighlighted &&
                        "bg-red-100 text-red-700 ring-red-100"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  <span
                    className={cn(
                      "ml-auto flex size-6 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/40 transition-transform",
                      isOpen && "rotate-90 bg-white text-red-700"
                    )}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                  </span>
                </SidebarMenuButton>
                {isOpen ? (
                  <SidebarMenuSub className="mx-4 my-1.5 gap-1 rounded-lg border-l-2 border-red-200 bg-background/70 px-2.5 py-1.5">
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isRouteActive(pathname, subItem.url)}
                          className="h-8 rounded-lg px-2.5 text-sidebar-foreground/65 hover:bg-red-50 hover:text-red-900 data-active:bg-red-600 data-active:font-medium data-active:text-white"
                        >
                          <Link href={subItem.url}>
                            <span className="truncate">{subItem.title}</span>
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
