"use client"

import * as React from "react"

import { AppSidebar } from "@/compartido/componentes/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/compartido/componentes/ui/sidebar"
import { TooltipProvider } from "@/compartido/componentes/ui/tooltip"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 60)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="overflow-hidden border border-border/80 bg-background shadow-sm">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
