import { SiteHeader } from "@/compartido/componentes/site-header";
import { InspeccionesVista } from "@/modulos/activos/vistas/inspecciones-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ActivosInspeccionPage() {
  return (
    <>
      <SiteHeader
        title="Inspeccion"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Inspeccion" },
        ]}
      />
      <InspeccionesVista />
    </>
  );
}
