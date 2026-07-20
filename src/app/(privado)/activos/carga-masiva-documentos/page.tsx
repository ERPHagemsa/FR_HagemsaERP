import { SiteHeader } from "@/compartido/componentes/site-header";
import { CargaMasivaDocumentosVista } from "@/modulos/activos/vistas/carga-masiva-documentos-vista";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <SiteHeader
        title="Carga masiva de documentos"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Carga masiva de documentos" },
        ]}
      />
      <CargaMasivaDocumentosVista />
    </>
  );
}
