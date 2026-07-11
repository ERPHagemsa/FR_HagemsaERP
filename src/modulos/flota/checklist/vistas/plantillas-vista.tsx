"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { PlantillasListado } from "../componentes/plantillas-listado";

export function PlantillasVista() {
  return (
    <>
      <SiteHeader
        title="Plantillas"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Plantillas" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <PlantillasListado />
        </div>
      </main>
    </>
  );
}

export default PlantillasVista;
