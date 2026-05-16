import { SiteHeader } from "@/compartido/componentes/site-header";
import { SolicitudesCombustibleVista } from "@/modulos/combustible/vistas/solicitudes-combustible-vista";

export default function SolicitudesCombustiblePage() {
  return (
    <>
      <SiteHeader title="Vales" />
      <SolicitudesCombustibleVista />
    </>
  );
}
