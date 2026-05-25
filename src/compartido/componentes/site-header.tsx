"use client"

import * as React from "react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/compartido/componentes/ui/breadcrumb"
import { Separator } from "@/compartido/componentes/ui/separator"
import { SidebarTrigger } from "@/compartido/componentes/ui/sidebar"

type SiteHeaderBreadcrumb = {
  title: string
  href?: string
}

export function SiteHeader({
  title,
  breadcrumbs,
}: {
  title: string
  breadcrumbs?: SiteHeaderBreadcrumb[]
}) {
  const items =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs
      : [{ title }]

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap overflow-hidden">
            {items.map((item, index) => {
              const isLast = index === items.length - 1

              return (
                <React.Fragment key={`${item.title}-${index}`}>
                  <BreadcrumbItem className="min-w-0">
                    {item.href && !isLast ? (
                      <BreadcrumbLink asChild className="truncate">
                        <Link href={item.href}>{item.title}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="truncate font-semibold">
                        {item.title}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? <BreadcrumbSeparator /> : null}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
