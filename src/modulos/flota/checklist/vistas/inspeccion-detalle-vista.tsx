"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { InspeccionDetalle } from "../componentes/inspeccion-detalle";

export function InspeccionDetalleVista({ inspeccionId }: { inspeccionId: string }) {
  return (
    <>
      <SiteHeader
        title="Detalle de inspección"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Inspecciones", href: "/flota/checklist/inspecciones" },
          { title: "Detalle" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <InspeccionDetalle inspeccionId={inspeccionId} />
        </div>
      </main>
    </>
  );
}

export default InspeccionDetalleVista;
