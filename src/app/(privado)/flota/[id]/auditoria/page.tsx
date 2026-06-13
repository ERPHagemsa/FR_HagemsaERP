import { redirect } from "next/navigation";
import { obtenerHistorialPorId } from "@/modulos/flota/servicios/flota-api";
import { FlotaAuditoriaVista } from "@/modulos/flota/vistas/flota-auditoria-vista";

export default async function FlotaAuditoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const unidadId = decodeURIComponent(resolvedParams.id);
  const res = await obtenerHistorialPorId(unidadId);

  if (!res) {
    redirect("/flota/unidades");
  }

  return <FlotaAuditoriaVista id={unidadId} historial={res.datos || []} />;
}
