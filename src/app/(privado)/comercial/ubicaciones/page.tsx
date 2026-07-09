import { SiteHeader } from "@/compartido/componentes/site-header";
import { UbicacionesVista } from "@/modulos/comercial/ubicaciones/vistas/ubicaciones-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const busquedaRaw = Array.isArray(params.busqueda)
    ? params.busqueda[0]
    : params.busqueda;

  return (
    <>
      <SiteHeader
        title="Ubicaciones"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Ubicaciones" },
        ]}
      />
      <UbicacionesVista busquedaInicial={busquedaRaw} />
    </>
  );
}
