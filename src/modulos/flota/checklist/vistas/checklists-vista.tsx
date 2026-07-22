"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { ChecklistsListado } from "../componentes/checklists-listado";

export function ChecklistsVista() {
  return (
    <>
      <SiteHeader
        title="Checklists"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Checklists" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <ChecklistsListado />
        </div>
      </main>
    </>
  );
}

export default ChecklistsVista;
