"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/compartido/componentes/nav-main"
import { NavUser } from "@/compartido/componentes/nav-user"
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
  CommandIcon,
  FuelStationIcon,
  Invoice01Icon,
  LegalDocument01Icon,
  Route01Icon,
  ToolsIcon,
  TruckIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

const data = {
  user: {
    name: "Hagemsa",
    email: "operaciones@hagemsa.local",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Activos",
      icon: <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} />,
      items: [
        { title: "Registro de activos", url: "/activos" },
        { title: "Nuevo activo", url: "/activos/nuevo" },
        { title: "Estados", url: "#" },
        { title: "Documentos", url: "#" },
      ],
    },
    {
      title: "Socio y Negocios",
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
      items: [
        { title: "Conductores", url: "#" },
        { title: "Asistencias", url: "#" },
        { title: "Licencias", url: "#" },
        { title: "Evaluaciones", url: "#" },
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-none p-0 group-data-[variant=floating]:p-0 [&_[data-slot=sidebar-inner]]:rounded-none [&_[data-slot=sidebar-inner]]:shadow-none [&_[data-slot=sidebar-inner]]:ring-0"
      {...props}
    >
      <SidebarHeader className="p-2.5 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-14 rounded-xl border border-red-100 bg-red-50 px-3 text-red-900 shadow-none ring-0 hover:bg-red-100 hover:text-red-950 active:bg-red-100 active:text-red-950 data-[slot=sidebar-menu-button]:p-0!"
            >
              <Link href="/">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-700 text-sm font-bold text-white">
                  H
                </span>
                <span className="min-w-0 flex flex-1 flex-col">
                  <span className="truncate text-base font-semibold leading-5 tracking-normal">
                    Hagemsa
                  </span>
                  <span className="truncate text-[11px] font-medium leading-4 text-red-900/60">
                    Control operativo
                  </span>
                </span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-red-700/70">
                  <HugeiconsIcon
                    icon={CommandIcon}
                    strokeWidth={2}
                    className="size-4!"
                  />
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1 pb-2">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 p-2.5">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
