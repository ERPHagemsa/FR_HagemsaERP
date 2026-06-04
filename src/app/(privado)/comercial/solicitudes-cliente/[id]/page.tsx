import { SiteHeader } from "@/compartido/componentes/site-header";
import { SolicitudClienteDetalleVista } from "@/modulos/comercial/solicitudes-cliente/vistas/solicitud-cliente-detalle-vista";

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
        title="Detalle de solicitud"
        breadcrumbs={[
          { title: "Solicitudes de cliente", href: "/comercial/solicitudes-cliente" },
          { title: "Detalle" },
        ]}
      />
      <SolicitudClienteDetalleVista id={id} />
    </>
  );
}
