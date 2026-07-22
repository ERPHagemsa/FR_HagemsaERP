import { PlantillaDetalleVista } from "@/modulos/flota/checklist/vistas/plantilla-detalle-vista";

type Params = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function Page({ params }: Params) {
  const { id } = (await params) as { id: string };

  return <PlantillaDetalleVista plantillaId={Number(id)} />;
}
