import { SiteHeader } from "@/compartido/componentes/site-header";
import { SolicitudClienteNuevaVista } from "@/modulos/comercial/solicitudes-cliente/vistas/solicitud-cliente-nueva-vista";

export default function Page() {
  return (
    <>
      <SiteHeader
        title="Nueva solicitud de cliente"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Solicitudes de cliente", href: "/comercial/solicitudes-cliente" },
          { title: "Nueva solicitud de cliente" },
        ]}
      />
      <SolicitudClienteNuevaVista />
    </>
  );
}
