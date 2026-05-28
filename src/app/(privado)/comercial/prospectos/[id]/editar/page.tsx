import { SiteHeader } from "@/compartido/componentes/site-header";
import { ProspectoEditarVista } from "@/modulos/comercial/prospectos/vistas/prospecto-editar-vista";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <SiteHeader title="Editar prospecto" />
      <ProspectoEditarVista id={Number(id)} />
    </>
  );
}
