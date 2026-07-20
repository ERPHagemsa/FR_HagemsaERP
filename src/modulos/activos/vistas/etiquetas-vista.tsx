"use client";

import { Badge } from "@/compartido/componentes/ui/badge";
import { EtiquetasListado } from "../componentes/etiquetas-listado";

export function EtiquetasVista() {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <section className="border-b border-border pb-5">
          <Badge variant="secondary" className="mb-3">
            QR de activos
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Etiquetas QR
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Genera lotes de etiquetas QR para imprimir y pegar en las unidades. Cada
            etiqueta se identifica por un codigo correlativo y un token unico; la
            asignacion a un activo se hace desde el proceso de enlace (proximamente).
          </p>
        </section>

        <EtiquetasListado />
      </div>
    </main>
  );
}
