import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoNuevoVista } from "@/modulos/activos/vistas/activo-nuevo-vista";

type PageProps = {
  searchParams?: Promise<{
    origenId?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <SiteHeader title={params?.origenId ? "Nuevo acople" : "Nuevo activo"} />
      <ActivoNuevoVista origenId={params?.origenId} />
    </>
  );
}
