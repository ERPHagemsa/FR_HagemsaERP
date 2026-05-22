import { SiteHeader } from "@/compartido/componentes/site-header";
import { CombustibleInicioVista } from "@/modulos/combustible/vistas/combustible-inicio-vista";

export default function CombustiblePage() {
  return (
    <>
      <SiteHeader title="Control de Combustible" />
      <CombustibleInicioVista />
    </>
  );
}
