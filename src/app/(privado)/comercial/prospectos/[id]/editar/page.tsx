import { SiteHeader } from "@/compartido/componentes/site-header";
import { ProspectoEditarVista } from "@/modulos/comercial/prospectos/vistas/prospecto-editar-vista";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <SiteHeader
        title="Editar prospecto"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Prospectos", href: "/comercial/prospectos" },
          { title: "Editar prospecto" },
        ]}
      />
      <ProspectoEditarVista id={id} />
    </>
  );
}
