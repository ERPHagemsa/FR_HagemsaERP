"use client"

import * as React from "react"

import { AppSidebar } from "@/compartido/componentes/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/compartido/componentes/ui/sidebar"
import { TooltipProvider } from "@/compartido/componentes/ui/tooltip"
import type { UsuarioSesion } from "@/compartido/autenticacion/sesion"
import { SesionProvider } from "@/modulos/autenticacion/contexto/sesion-contexto"

export function AppShell({
  sesionInicial,
  children,
}: {
  // Sesion resuelta server-side en el layout privado. Siembra el contexto para
  // que el sidebar (y todo consumidor de useSesion) nazca ya filtrado, sin flash.
  sesionInicial: UsuarioSesion | null
  children: React.ReactNode
}) {
  return (
    <SesionProvider sesionInicial={sesionInicial}>
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
    </SesionProvider>
  )
}
