import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoInventarioFisicoDetalleVista } from "@/modulos/activos/vistas/activo-inventario-fisico-detalle-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ActivoInventarioFisicoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <SiteHeader title="Revision de inventario" />
      <ActivoInventarioFisicoDetalleVista id={Number(id)} />
    </>
  );
}
