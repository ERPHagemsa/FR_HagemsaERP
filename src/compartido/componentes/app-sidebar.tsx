"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  BadgeCheck,
  Boxes,
  Briefcase,
  Car,
  CircleDot,
  Fuel,
  MapPin,
  ReceiptText,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  Warehouse,
  Wrench,
} from "lucide-react"

import { NavMain } from "@/compartido/componentes/nav-main"
import { NavUser } from "@/compartido/componentes/nav-user"
import { ThemeToggle } from "@/compartido/componentes/theme-toggle"
import { useTieneRol } from "@/modulos/autenticacion/ganchos/use-tiene-rol"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/compartido/componentes/ui/sidebar"

const data = {
  user: {
    name: "Hagemsa",
    email: "operaciones@hagemsa.local",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Socio de Negocios",
      url: "/socio-negocios",
      icon: <Users />,
      items: [
        { title: "Listar socios", url: "/socio-negocios/listar" },
        { title: "Registrar socio", url: "/socio-negocios/nuevo" },
        { title: "Historial", url: "/socio-negocios/historial" },
      ],
    },
    {
      title: "Activos",
      url: "/activos",
      icon: <Boxes />,
      items: [
        { title: "Listado de activos", url: "/activos/inventario" },
        { title: "Inventario fisico", url: "/activos/inventario-fisico" },
        { title: "Nuevo activo", url: "/activos/nuevo" },
        { title: "Carga masiva", url: "/activos/carga-masiva" },
        { title: "Carga masiva documentos", url: "/activos/carga-masiva-documentos" },
        { title: "Replaqueo", url: "/activos/nuevo-acople" },
        { title: "Estados", url: "#" },
        { title: "Documentos", url: "#" },
      ],
    },
    {
      title: "TMS-Operaciones",
      icon: <Truck />,
      items: [
        { title: "Ordenes de Servicio", url: "#" },
        { title: "Manifiestos", url: "#" },
        { title: "Convoys", url: "#" },
        { title: "Despacho", url: "/despacho" },
      ],
    },
    {
      title: "WMS-Almacen",
      icon: <Warehouse />,
      items: [
        { title: "Inventario", url: "#" },
        { title: "Ingresos", url: "#" },
        { title: "Salidas", url: "#" },
        { title: "Operadores 3PL", url: "#" },
      ],
    },
    {
      title: "Gestion Comercial",
      icon: <Briefcase />,
      items: [
        { title: "Prospectos", url: "/comercial/prospectos" },
        { title: "Historial de prospectos", url: "/comercial/prospectos/historial" },
        { title: "Solicitudes de cliente", url: "/comercial/solicitudes-cliente" },
        { title: "Tarifarios", url: "#" },
        { title: "Contratos", url: "#" },
        { title: "Modalidades", url: "/comercial/catalogos/modalidades" },
        { title: "Cargos Adicionales", url: "/comercial/catalogos/cargos-adicionales" },
        // Listado global de cotizaciones: vista secundaria/reporte. El camino principal
        // para cotizar es Solicitudes de cliente (la cotizacion nace de una SC).
        { title: "Todas las cotizaciones", url: "/comercial/cotizaciones" },
      ],
    },
    {
      title: "Seguimiento y Monitoreo",
      icon: <MapPin />,
      items: [
        { title: "Tracking GPS", url: "#" },
        { title: "Checkpoints", url: "#" },
        { title: "Incidencias", url: "#" },
        { title: "Alertas", url: "#" },
      ],
    },
    {
      title: "Flota y Disponibilidad",
      url: "/flota",
      icon: <Car />,
      items: [
        { title: "Unidades", url: "/flota/unidades" },
        { title: "Conductores", url: "#" },
        { title: "Disponibilidad", url: "#" },
        { title: "Prestamos", url: "#" },
      ],
    },
    {
      title: "Acreditaciones",
      icon: <BadgeCheck />,
      items: [
        { title: "Homologaciones", url: "#" },
        { title: "Documentos", url: "#" },
        { title: "Acreditaciones", url: "#" },
      ],
    },
    {
      title: "Mantenimiento de Flota",
      icon: <Wrench />,
      items: [
        { title: "Ordenes", url: "#" },
        { title: "Preventivos", url: "#" },
        { title: "Correctivos", url: "#" },
      ],
    },
    {
      title: "Gestion de Neumaticos",
      icon: <CircleDot />,
      items: [
        { title: "Inventario", url: "#" },
        { title: "Rotaciones", url: "#" },
        { title: "Vida util", url: "#" },
      ],
    },
    {
      title: "Control de Combustible",
      icon: <Fuel />,
      items: [
        { title: "Asignaciones", url: "/combustible" },
        { title: "Vales", url: "/combustible/solicitudes" },
        { title: "Consumos", url: "/combustible/abastecimiento" },
        { title: "Diferencias", url: "#" },
      ],
    },
    {
      title: "Valorizacion y Facturacion",
      icon: <ReceiptText />,
      items: [
        { title: "Valorizaciones", url: "#" },
        { title: "Facturas", url: "#" },
        { title: "Documentos", url: "#" },
      ],
    },
    {
      title: "Liquidacion de Viaticos",
      icon: <Wallet />,
      items: [
        { title: "Viaticos", url: "#" },
        { title: "Rendiciones", url: "#" },
        { title: "Aprobaciones", url: "#" },
      ],
    },
    {
      title: "CS-Configuración General",
      url: "/configuracion",
      icon: <Settings />,
      items: [
        { title: "Configuraciones", url: "/configuracion/listar" },
        { title: "Nueva configuración", url: "/configuracion/nuevo/ubicacion" },
        { title: "Reportes", url: "/configuracion/reportes" },
      ],
    },
  ],
}

// Bloque de IAM y administracion (gestion de identidades, accesos y auditoria
// del Auth Service). Visible solo para SUPER_ADMIN — todas sus rutas estan
// ademas protegidas server-side en /(privado)/admin/layout.tsx.
const navAdmin = {
  title: "IAM y administracion",
  icon: <ShieldCheck />,
  items: [
    { title: "Cuentas", url: "/admin/cuentas" },
    { title: "Roles", url: "/admin/roles" },
    { title: "Permisos", url: "/admin/permisos" },
    { title: "Auditoria", url: "/admin/auditoria" },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const esSuperAdmin = useTieneRol("SUPER_ADMIN")
  const navMain = esSuperAdmin ? [...data.navMain, navAdmin] : data.navMain
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/" onClick={() => setOpenMobile(false)}>
                <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-accent">
                  <Image
                    src="/logo/logo.svg"
                    alt="Hagemsa"
                    width={24}
                    height={24}
                    className="size-6 object-contain"
                  />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    Hagemsa ERP
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Operación
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <ThemeToggle showLabel />
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
