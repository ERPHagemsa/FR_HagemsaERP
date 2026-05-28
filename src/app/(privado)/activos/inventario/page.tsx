import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivosInventarioVista } from "@/modulos/activos/vistas/activos-inventario-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ActivosInventarioPage() {
  return (
    <>
      <SiteHeader title="Inventario de activos" />
      <ActivosInventarioVista />
    </>
  );
}
