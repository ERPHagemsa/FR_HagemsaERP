import { SiteHeader } from "@/compartido/componentes/site-header";
import { FlotaAuditoriaVista } from "@/modulos/flota/vistas/flota-auditoria-vista";
import { obtenerHistorialPorPlaca } from "@/modulos/flota/servicios/flota-api";
import { redirect } from "next/navigation";

export default async function FlotaAuditoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const placa = decodeURIComponent(resolvedParams.id);
  
  const res = await obtenerHistorialPorPlaca(placa);
  
  if (!res) {
    redirect("/flota/unidades");
  }

  return (
    <>
      <SiteHeader title="Auditoría de Unidad" />
      <FlotaAuditoriaVista placa={placa} historial={res.datos || []} />
    </>
  );
}
