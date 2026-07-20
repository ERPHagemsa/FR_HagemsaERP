import { VehiculoDetalleVista } from "@/modulos/flota/asignaciones/vistas/vehiculo-detalle-vista";

type Params = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function Page({ params }: Params) {
  const { id } = (await params) as { id: string };

  return <VehiculoDetalleVista id={id} />;
}
