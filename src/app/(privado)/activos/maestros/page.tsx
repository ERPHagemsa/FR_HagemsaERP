import { SiteHeader } from "@/compartido/componentes/site-header";
import { MaestrosVista } from "@/modulos/activos/vistas/maestros-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ActivosMaestrosPage() {
  return (
    <>
      <SiteHeader
        title="Administrador de maestros"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Administrador de maestros" },
        ]}
      />
      <MaestrosVista />
    </>
  );
}
