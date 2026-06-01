import { SiteHeader } from "@/compartido/componentes/site-header";
import { SolicitudClienteNuevaVista } from "@/modulos/comercial/cotizaciones/vistas/solicitud-cliente-nueva-vista";

export default function Page() {
  return (
    <>
      <SiteHeader title="Nueva solicitud de cliente" />
      <SolicitudClienteNuevaVista />
    </>
  );
}
