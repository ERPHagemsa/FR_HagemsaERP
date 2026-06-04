import { SiteHeader } from "@/compartido/componentes/site-header";
import { SolicitudClienteCotizarVista } from "@/modulos/comercial/solicitudes-cliente/vistas/solicitud-cliente-cotizar-vista";

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
        title="Nueva cotización"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Solicitudes de cliente", href: "/comercial/solicitudes-cliente" },
          { title: "Detalle de solicitud", href: `/comercial/solicitudes-cliente/${id}` },
          { title: "Nueva cotización" },
        ]}
      />
      <SolicitudClienteCotizarVista id={id} />
    </>
  );
}
