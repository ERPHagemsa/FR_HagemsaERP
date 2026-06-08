import { redirect } from "next/navigation";
import { obtenerHistorialPorPlaca } from "@/modulos/flota/servicios/flota-api";
import { FlotaAuditoriaVista } from "@/modulos/flota/vistas/flota-auditoria-vista";

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

  return <FlotaAuditoriaVista placa={placa} historial={res.datos || []} />;
}
