import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoNuevoAcopleVista } from "@/modulos/activos/vistas/activo-nuevo-acople-vista";

export default function Page() {
  return (
    <>
      <SiteHeader title="Nuevo acople" />
      <ActivoNuevoAcopleVista />
    </>
  );
}
