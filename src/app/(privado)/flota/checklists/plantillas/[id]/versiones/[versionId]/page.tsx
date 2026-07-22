import { PlantillaVersionVista } from "@/modulos/flota/checklist/vistas/plantilla-version-vista";

type Params = {
  params: Promise<{ id: string; versionId: string }> | { id: string; versionId: string };
};

export default async function Page({ params }: Params) {
  const { id, versionId } = (await params) as { id: string; versionId: string };

  return <PlantillaVersionVista plantillaId={Number(id)} versionId={Number(versionId)} />;
}
