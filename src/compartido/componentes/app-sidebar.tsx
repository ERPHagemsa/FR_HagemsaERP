"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/compartido/componentes/nav-main"
import { NavUser } from "@/compartido/componentes/nav-user"
import { ThemeToggle } from "@/compartido/componentes/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/compartido/componentes/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Analytics01Icon,
  Building03Icon,
  Car01Icon,
  CheckListIcon,
  FuelStationIcon,
  Invoice01Icon,
  LegalDocument01Icon,
  Route01Icon,
  Settings02Icon,
  ToolsIcon,
  TruckIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

const data = {
  navMain: [
    {
      title: "Activos",
      icon: <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} />,
      items: [
        { title: "Registro de activos", url: "/activos" },
        { title: "Inventario de activos", url: "/activos/inventario" },
        { title: "Nuevo activo", url: "/activos/nuevo" },
        { title: "Estados", url: "#" },
        { title: "Documentos", url: "#" },
      ],
    },
    {
      title: "Socio de Negocios",
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
      items: [
        { title: "Resumen", url: "/socio-negocios" },
        { title: "Clientes", url: "/socio-negocios/clientes" },
        { title: "Proveedores", url: "/socio-negocios/proveedores" },
        { title: "Personal", url: "/socio-negocios/personal" },
        { title: "Consultas", url: "/socio-negocios/consultas" },
        { title: "Reportes", url: "/socio-negocios/reportes" },
      ],
    },
    {
      title: "TMS-Operaciones",
      icon: <HugeiconsIcon icon={TruckIcon} strokeWidth={2} />,
      items: [
        { title: "Ordenes de Servicio", url: "#" },
        { title: "Manifiestos", url: "#" },
        { title: "Convoys", url: "#" },
        { title: "Despacho", url: "/despacho" },
      ],
    },
    {
      title: "WMS-Almacen",
      icon: <HugeiconsIcon icon={Building03Icon} strokeWidth={2} />,
      items: [
        { title: "Inventario", url: "#" },
        { title: "Ingresos", url: "#" },
        { title: "Salidas", url: "#" },
        { title: "Operadores 3PL", url: "#" },
      ],
    },
    {
      title: "Gestion Comercial",
      icon: <HugeiconsIcon icon={Building03Icon} strokeWidth={2} />,
      items: [
        { title: "Cotizaciones", url: "/comercial" },
        { title: "Tarifarios", url: "#" },
        { title: "Contratos", url: "#" },
      ],
    },
    {
      title: "Seguimiento y Monitoreo",
      icon: <HugeiconsIcon icon={Route01Icon} strokeWidth={2} />,
      items: [
        { title: "Tracking GPS", url: "#" },
        { title: "Checkpoints", url: "#" },
        { title: "Incidencias", url: "#" },
        { title: "Alertas", url: "#" },
      ],
    },
    {
      title: "Flota y Disponibilidad",
      icon: <HugeiconsIcon icon={Car01Icon} strokeWidth={2} />,
      items: [
        { title: "Unidades", url: "#" },
        { title: "Conductores", url: "#" },
        { title: "Disponibilidad", url: "/flota" },
        { title: "Prestamos", url: "#" },
      ],
    },
    {
      title: "Acreditaciones",
      icon: <HugeiconsIcon icon={LegalDocument01Icon} strokeWidth={2} />,
      items: [
        { title: "Homologaciones", url: "#" },
        { title: "Documentos", url: "#" },
        { title: "Acreditaciones", url: "#" },
      ],
    },
    {
      title: "Mantenimiento de Flota",
      icon: <HugeiconsIcon icon={ToolsIcon} strokeWidth={2} />,
      items: [
        { title: "Ordenes", url: "#" },
        { title: "Preventivos", url: "#" },
        { title: "Correctivos", url: "#" },
      ],
    },
    {
      title: "Gestion de Neumaticos",
      icon: <HugeiconsIcon icon={Route01Icon} strokeWidth={2} />,
      items: [
        { title: "Inventario", url: "#" },
        { title: "Rotaciones", url: "#" },
        { title: "Vida util", url: "#" },
      ],
    },
    {
      title: "Control de Combustible",
      icon: <HugeiconsIcon icon={FuelStationIcon} strokeWidth={2} />,
      items: [
        { title: "Asignaciones", url: "/combustible" },
        { title: "Vales", url: "/combustible/solicitudes" },
        { title: "Consumos", url: "/combustible/abastecimiento" },
        { title: "Diferencias", url: "#" },
      ],
    },
    {
      title: "Valorizacion y Facturacion",
      icon: <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} />,
      items: [
        { title: "Valorizaciones", url: "#" },
        { title: "Facturas", url: "#" },
        { title: "Documentos", url: "#" },
      ],
    },
    {
      title: "Liquidacion de Viaticos",
      icon: <HugeiconsIcon icon={CheckListIcon} strokeWidth={2} />,
      items: [
        { title: "Viaticos", url: "#" },
        { title: "Rendiciones", url: "#" },
        { title: "Aprobaciones", url: "#" },
      ],
    },
    {
      title: "Configuracion",
      icon: <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />,
      items: [
        { title: "Cuentas", url: "/admin/cuentas" },
        { title: "Roles", url: "/admin/roles" },
        { title: "Parametros ERP", url: "#" },
        { title: "Preferencias", url: "#" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-none p-0 group-data-[variant=floating]:p-0 [&_[data-slot=sidebar-inner]]:rounded-none [&_[data-slot=sidebar-inner]]:bg-sidebar [&_[data-slot=sidebar-inner]]:shadow-none [&_[data-slot=sidebar-inner]]:ring-0"
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border/60 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-auto rounded-2xl bg-transparent px-0 py-0 text-sidebar-foreground shadow-none ring-0 hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent active:text-sidebar-foreground data-[slot=sidebar-menu-button]:p-0!"
            >
              <Link
                href="/"
                className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-sidebar-accent"
              >
                <span className="flex size-14 shrink-0 items-center justify-center">
                  <img
                    src="/logo/logo.svg"
                    alt="Hagemsa"
                    className="size-full object-contain"
                  />
                </span>
                <span className="min-w-0 flex flex-1 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground">
                    Hagemsa ERP
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/52">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Operacion
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1.5 py-3">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="gap-2 border-t border-sidebar-border/70 p-2.5">
        <ThemeToggle
          showLabel
          className="border-sidebar-border/80 bg-sidebar-accent/70 text-sidebar-foreground hover:bg-sidebar-accent"
        />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
