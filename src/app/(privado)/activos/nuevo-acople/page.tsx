import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoNuevoAcopleVista } from "@/modulos/activos/vistas/activo-nuevo-acople-vista";

export default function Page() {
  return (
    <>
      <SiteHeader
        title="Replaqueo"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Replaqueo" },
        ]}
      />
      <ActivoNuevoAcopleVista />
    </>
  );
}
