import { SiteHeader } from "@/compartido/componentes/site-header";
import { EtiquetasVista } from "@/modulos/activos/vistas/etiquetas-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ActivosEtiquetasPage() {
  return (
    <>
      <SiteHeader
        title="Etiquetas QR"
        breadcrumbs={[{ title: "Activos", href: "/activos" }, { title: "Etiquetas QR" }]}
      />
      <EtiquetasVista />
    </>
  );
}
