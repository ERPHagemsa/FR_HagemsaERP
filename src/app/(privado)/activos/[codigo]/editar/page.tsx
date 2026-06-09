import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoEditarVista } from "@/modulos/activos/vistas/activo-editar-vista";

type Props = {
  params: Promise<{ codigo: string }>;
};

export default async function Page({ params }: Props) {
  const { codigo } = await params;

  return (
    <>
      <SiteHeader
        title="Actualizar Activo"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Actualizar Activo" },
        ]}
      />
      <ActivoEditarVista codigo={codigo} />
    </>
  );
}
