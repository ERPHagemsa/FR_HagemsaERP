import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoNuevoVista } from "@/modulos/activos/vistas/activo-nuevo-vista";

export default function Page() {
  return (
    <>
      <SiteHeader title="Nuevo activo" />
      <ActivoNuevoVista />
    </>
  );
}
