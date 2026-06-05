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
      <SiteHeader title="Historial y auditoria" />
      <ActivoHistorialVista codigo={codigo} />
    </>
  );
}
