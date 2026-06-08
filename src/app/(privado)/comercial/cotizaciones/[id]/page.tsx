import { SiteHeader } from "@/compartido/componentes/site-header";
import { CotizacionDetalleVista } from "@/modulos/comercial/cotizaciones/vistas/cotizacion-detalle-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <SiteHeader
        title="Detalle de cotizacion"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Cotizaciones", href: "/comercial/cotizaciones" },
          { title: "Detalle de cotizacion" },
        ]}
      />
      <CotizacionDetalleVista id={id} />
    </>
  );
}
