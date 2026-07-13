import { SiteHeader } from "@/compartido/componentes/site-header";
import { CalendarioVista } from "@/modulos/comercial/calendario/vistas/calendario-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <>
      <SiteHeader
        title="Calendario de ganadas"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Calendario de ganadas" },
        ]}
      />
      <CalendarioVista />
    </>
  );
}
