import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivosVista } from "@/modulos/activos/vistas/activos-vista";

export default function Page() {
  return (
    <>
      <SiteHeader title="Activos" />
      <ActivosVista />
    </>
  );
}
