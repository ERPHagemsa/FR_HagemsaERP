"use client";

import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";

import { Button } from "@/compartido/componentes/ui/button";

import { ActivosTabla } from "../componentes/activos-tabla";

export function ActivosInventarioVista() {
  // La tabla consulta directo al backend (filtros, orden, paginacion y
  // resumen server-side); la vista solo aporta el encabezado de la pagina.
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal">
              Listar activos
            </h1>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/activos/nuevo">
              <IconPlus />
              Nuevo
            </Link>
          </Button>
        </div>

        <ActivosTabla />
      </div>
    </main>
  );
}
