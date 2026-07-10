import { SiteHeader } from "@/compartido/componentes/site-header";
import { EtiquetaDetalleVista } from "@/modulos/activos/vistas/etiqueta-detalle-vista";

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
        title="Etiqueta QR"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Etiquetas QR", href: "/activos/etiquetas" },
          { title: "Detalle" },
        ]}
      />
      <EtiquetaDetalleVista id={Number(id)} />
    </>
  );
}
