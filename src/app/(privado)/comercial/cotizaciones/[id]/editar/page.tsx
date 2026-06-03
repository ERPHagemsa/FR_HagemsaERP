import { SiteHeader } from "@/compartido/componentes/site-header";
import { CotizacionEditarVista } from "@/modulos/comercial/cotizaciones/vistas/cotizacion-editar-vista";

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
        title="Editor de borrador"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Cotizaciones", href: "/comercial/cotizaciones" },
          { title: "Detalle", href: `/comercial/cotizaciones/${id}` },
          { title: "Editor de borrador" },
        ]}
      />
      <CotizacionEditarVista id={id} />
    </>
  );
}
