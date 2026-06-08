import { SiteHeader } from "@/compartido/componentes/site-header";
import { ProspectoNuevoVista } from "@/modulos/comercial/prospectos/vistas/prospecto-nuevo-vista";

export default function Page() {
  return (
    <>
      <SiteHeader
        title="Nuevo prospecto"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Prospectos", href: "/comercial/prospectos" },
          { title: "Nuevo prospecto" },
        ]}
      />
      <ProspectoNuevoVista />
    </>
  );
}
