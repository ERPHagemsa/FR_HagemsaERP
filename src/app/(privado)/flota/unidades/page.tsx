import { SiteHeader } from "@/compartido/componentes/site-header";
import { FlotaUnidadesVista } from "@/modulos/flota/vistas/flota-unidades-vista";

export default function FlotaUnidadesPage() {
  return (
    <>
      <SiteHeader title="Unidades de Flota" />
      <FlotaUnidadesVista />
    </>
  );
}
