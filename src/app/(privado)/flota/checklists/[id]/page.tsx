import { ChecklistDetalleVista } from "@/modulos/flota/checklist/vistas/checklist-detalle-vista";

type Params = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function Page({ params }: Params) {
  const { id } = (await params) as { id: string };

  return <ChecklistDetalleVista checklistId={Number(id)} />;
}
