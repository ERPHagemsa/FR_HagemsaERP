import { SiteHeader } from "@/compartido/componentes/site-header";
import { InspeccionDetalleVista } from "@/modulos/activos/vistas/inspeccion-detalle-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ActivosInspeccionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <SiteHeader
        title="Inspeccion"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Inspeccion", href: "/activos/inspeccion" },
          { title: "Detalle" },
        ]}
      />
      <InspeccionDetalleVista id={Number(id)} />
    </>
  );
}
