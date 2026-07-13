"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { PlantillaVersionesListado } from "../componentes/plantilla-versiones-listado";
import { usePlantillasQuery } from "../servicios/plantillas-queries";

export function PlantillaDetalleVista({ plantillaId }: { plantillaId: number }) {
  // No existe GET /flota/plantillas/:id en el backend (ver plantilla.controller.ts).
  // El volumen de plantillas es chico (un puñado de tipos de checklist), así que
  // se busca en el listado en vez de justificar un endpoint nuevo solo para esto.
  const consulta = usePlantillasQuery({ limite: 100 });
  const plantilla = consulta.data?.datos.find((p) => p.id === plantillaId);

  return (
    <>
      <SiteHeader
        title={plantilla?.nombre ?? "Plantilla"}
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Mantenedores de checklist", href: "/flota/checklist/mantenedores" },
          { title: plantilla?.nombre ?? "Detalle" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {plantilla?.descripcion ? (
            <p className="text-sm text-muted-foreground">{plantilla.descripcion}</p>
          ) : null}
          <PlantillaVersionesListado plantillaId={plantillaId} />
        </div>
      </main>
    </>
  );
}

export default PlantillaDetalleVista;
