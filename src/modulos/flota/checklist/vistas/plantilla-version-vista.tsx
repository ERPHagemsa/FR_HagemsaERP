"use client";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { PlantillaVersionEditor } from "../componentes/plantilla-version-editor";
import { usePlantillasQuery } from "../servicios/plantillas-queries";

export function PlantillaVersionVista({
  plantillaId,
  versionId,
}: {
  plantillaId: string;
  versionId: string;
}) {
  const consulta = usePlantillasQuery({ limite: 100 });
  const plantilla = consulta.data?.datos.find((p) => p.id === plantillaId);

  return (
    <>
      <SiteHeader
        title="Estructura de checklist"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Plantillas", href: "/flota/checklist/plantillas" },
          {
            title: plantilla?.nombre ?? "Plantilla",
            href: `/flota/checklist/plantillas/${plantillaId}`,
          },
          { title: "Estructura" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
          <PlantillaVersionEditor plantillaId={plantillaId} versionId={versionId} />
        </div>
      </main>
    </>
  );
}

export default PlantillaVersionVista;
