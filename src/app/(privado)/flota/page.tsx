import { SiteHeader } from "@/compartido/componentes/site-header";
import { FlotaVista } from "@/modulos/flota/vistas/flota-vista";

export default async function FlotaPage() {
  return (
    <>
      <SiteHeader title="Flota y Disponibilidad" />
      <FlotaVista />
    </>
  );
}
