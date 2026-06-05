import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivosInventarioFisicoVista } from "@/modulos/activos/vistas/activos-inventario-fisico-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ActivosInventarioFisicoPage() {
  return (
    <>
      <SiteHeader title="Inventario fisico" />
      <ActivosInventarioFisicoVista />
    </>
  );
}
