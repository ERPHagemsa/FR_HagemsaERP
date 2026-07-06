"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { InspeccionesListado } from "../componentes/inspecciones-listado";

export function InspeccionesVista() {
  return (
    <>
      <SiteHeader
        title="Inspecciones"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Inspecciones" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <InspeccionesListado />
        </div>
      </main>
    </>
  );
}

export default InspeccionesVista;
