import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivosInventarioVista } from "@/modulos/activos/vistas/activos-inventario-vista";

export default function ActivosInventarioPage() {
  return (
    <>
      <SiteHeader title="Inventario de activos" />
      <ActivosInventarioVista />
    </>
  );
}
