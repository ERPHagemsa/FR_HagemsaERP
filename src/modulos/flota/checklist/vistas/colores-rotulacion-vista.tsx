"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { ColoresRotulacionListado } from "../componentes/colores-rotulacion-listado";

export function ColoresRotulacionVista() {
  return (
    <>
      <SiteHeader
        title="Colores de rotulación"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Colores de rotulación" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <ColoresRotulacionListado />
        </div>
      </main>
    </>
  );
}

export default ColoresRotulacionVista;
