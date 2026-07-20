"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { TiposChecklistListado } from "../componentes/tipos-checklist-listado";

export function TiposChecklistVista() {
  return (
    <>
      <SiteHeader
        title="Tipos de checklist"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Tipos de checklist" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <TiposChecklistListado />
        </div>
      </main>
    </>
  );
}

export default TiposChecklistVista;
