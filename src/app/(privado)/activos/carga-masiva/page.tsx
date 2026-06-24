import { SiteHeader } from "@/compartido/componentes/site-header";
import { CargaMasivaVista } from "@/modulos/activos/vistas/carga-masiva-vista";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <SiteHeader
        title="Carga masiva"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Carga masiva" },
        ]}
      />
      <CargaMasivaVista />
    </>
  );
}
