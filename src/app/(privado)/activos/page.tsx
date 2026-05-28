import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivosVista } from "@/modulos/activos/vistas/activos-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <>
      <SiteHeader title="Activos" />
      <ActivosVista />
    </>
  );
}
