import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoInventarioFisicoDetalleVista } from "@/modulos/activos/vistas/activo-inventario-fisico-detalle-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ActivoInventarioFisicoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const activo =
    typeof query.activo === "string" && query.activo.trim()
      ? query.activo.trim()
      : undefined;

  return (
    <>
      <SiteHeader
        title="Revision de Inventario"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Inventario Fisico", href: "/activos/inventario-fisico" },
          { title: "Revision de Inventario" },
        ]}
      />
      <ActivoInventarioFisicoDetalleVista id={Number(id)} activo={activo} />
    </>
  );
}
