import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoNuevoVista } from "@/modulos/activos/vistas/activo-nuevo-vista";

type PageProps = {
  searchParams?: Promise<{
    origenId?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const title = params?.origenId ? "Nuevo Acople" : "Nuevo Activo";

  return (
    <>
      <SiteHeader
        title={title}
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title },
        ]}
      />
      <ActivoNuevoVista origenId={params?.origenId} />
    </>
  );
}
