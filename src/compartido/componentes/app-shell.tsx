"use client";

import {
  IconBuildingWarehouse,
  IconCar,
  IconChartBar,
  IconClipboardList,
  IconGasStation,
  IconRoute,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { cn } from "@/compartido/utilidades";

const navegacion = [
  {
    href: "/",
    label: "Inicio",
    descripcion: "Vista general",
    icon: IconChartBar,
  },
  {
    href: "/activos",
    label: "Activos",
    descripcion: "BC-13",
    icon: IconCar,
  },
  {
    href: "/combustible",
    label: "Combustible",
    descripcion: "BC-09",
    icon: IconGasStation,
  },
  {
    href: "/flota",
    label: "Flota",
    descripcion: "Unidades",
    icon: IconRoute,
  },
  {
    href: "/despacho",
    label: "Despacho",
    descripcion: "Operaciones",
    icon: IconClipboardList,
  },
  {
    href: "/comercial",
    label: "Comercial",
    descripcion: "Clientes",
    icon: IconBuildingWarehouse,
  },
];

function estaActivo(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const moduloActivo =
    navegacion.find((item) => estaActivo(pathname, item.href)) ?? navegacion[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card px-4 py-5 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-2 py-1">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            H
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Hagemsa ERP</p>
            <p className="truncate text-xs text-muted-foreground">
              Frontend modular
            </p>
          </div>
        </Link>

        <nav className="mt-8 flex flex-col gap-1">
          {navegacion.map((item) => {
            const Icon = item.icon;
            const active = estaActivo(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Icon data-icon="inline-start" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span
                  className={cn(
                    "text-[11px] font-normal text-muted-foreground",
                    active && "text-primary-foreground/80"
                  )}
                >
                  {item.descripcion}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground">Modulo activo</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{moduloActivo.label}</p>
            <Badge variant="secondary">{moduloActivo.descripcion}</Badge>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="font-semibold">
              Hagemsa ERP
            </Link>
            <Badge variant="secondary">{moduloActivo.label}</Badge>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navegacion.map((item) => {
              const Icon = item.icon;
              const active = estaActivo(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground",
                    active && "border-primary bg-primary text-primary-foreground"
                  )}
                >
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
