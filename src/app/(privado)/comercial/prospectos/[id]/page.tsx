import { SiteHeader } from "@/compartido/componentes/site-header";
import { ProspectoDetalleVista } from "@/modulos/comercial/prospectos/vistas/prospecto-detalle-vista";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;

  const accionRaw = Array.isArray(query.accion) ? query.accion[0] : query.accion;
  const accionesValidas = ["registrado", "actualizado", "descartado", "bloqueado"];
  const accion = accionRaw && accionesValidas.includes(accionRaw) ? accionRaw : undefined;

  return (
    <>
      <SiteHeader title="Detalle de prospecto" />
      <ProspectoDetalleVista id={id} accion={accion} />
    </>
  );
}
