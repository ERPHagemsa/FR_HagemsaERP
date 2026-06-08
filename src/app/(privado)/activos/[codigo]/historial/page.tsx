import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoHistorialVista } from "@/modulos/activos/vistas/activo-historial-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ codigo: string }>;
};

export default async function Page({ params }: Props) {
  const { codigo } = await params;

  return (
    <>
      <SiteHeader
        title="Auditar Activo"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Auditar Activo" },
        ]}
      />
      <ActivoHistorialVista codigo={codigo} />
    </>
  );
}
