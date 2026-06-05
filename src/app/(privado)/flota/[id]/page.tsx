import { SiteHeader } from "@/compartido/componentes/site-header";
import { VehiculoDetalleVista } from "@/modulos/flota/vistas/vehiculo-detalle-vista";

type Params = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function Page({ params }: Params) {
  const { id } = (await params) as { id: string };

  return (
    <>
      <SiteHeader title={`Vehículo ${id ?? ""}`} />
      <VehiculoDetalleVista id={id} />
    </>
  );
}
