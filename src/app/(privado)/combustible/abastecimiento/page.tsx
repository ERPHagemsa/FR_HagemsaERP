import { SiteHeader } from "@/compartido/componentes/site-header";
import { AbastecimientoCombustibleVista } from "@/modulos/combustible/vistas/abastecimiento-combustible-vista";

export default function AbastecimientoCombustiblePage() {
  return (
    <>
      <SiteHeader title="Consumos" />
      <AbastecimientoCombustibleVista />
    </>
  );
}
