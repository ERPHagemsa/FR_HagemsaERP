"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { ChecklistCaptura } from "../componentes/checklist-captura";

export function ChecklistDetalleVista({ checklistId }: { checklistId: number }) {
  return (
    <>
      <SiteHeader
        title="Detalle de checklist"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Checklists", href: "/flota/checklists" },
          { title: "Detalle" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <ChecklistCaptura checklistId={checklistId} />
        </div>
      </main>
    </>
  );
}

export default ChecklistDetalleVista;
