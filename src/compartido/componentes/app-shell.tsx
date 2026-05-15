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

import { cn } from "@/compartido/utilidades";

const navegacion = [
  {
    href: "/",
    label: "Inicio",
    icon: IconChartBar,
  },
  {
    href: "/activos",
    label: "Activos",
    icon: IconCar,
  },
  {
    href: "/flota",
    label: "Flota",
    icon: IconRoute,
  },
  {
    href: "/despacho",
    label: "Despacho",
    icon: IconClipboardList,
  },
  {
    href: "/comercial",
    label: "Comercial",
    icon: IconBuildingWarehouse,
  },
  {
    href: "/combustible",
    label: "Combustible",
    icon: IconGasStation,
    disabled: true,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-border bg-[#071526] px-4 py-5 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            H
          </div>
          <div>
            <p className="text-sm font-semibold">Hagemsa ERP</p>
            <p className="text-xs text-muted-foreground">Frontend modular</p>
          </div>
        </Link>

        <nav className="mt-8 grid gap-1">
          {navegacion.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-60"
                >
                  <Icon className="size-4" />
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-primary/15 hover:text-white",
                  active && "bg-primary text-primary-foreground hover:bg-primary"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-border/70 bg-background/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground">BC activo</p>
          <p className="mt-1 text-sm">BC-13 Gestion de Activos</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-semibold">
              Hagemsa ERP
            </Link>
            <span className="text-xs text-muted-foreground">Frontend modular</span>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navegacion
              .filter((item) => !item.disabled)
              .map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground",
                      active && "border-primary bg-primary text-primary-foreground"
                    )}
                  >
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
