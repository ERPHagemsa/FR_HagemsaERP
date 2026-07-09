import { SiteHeader } from "@/compartido/componentes/site-header";
import { AprobacionesVista } from "@/modulos/comercial/aprobaciones/vistas/aprobaciones-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const paginaRaw = Array.isArray(params.pagina) ? params.pagina[0] : params.pagina;
  const porPaginaRaw = Array.isArray(params.porPagina) ? params.porPagina[0] : params.porPagina;

  const pagina = paginaRaw ? Math.max(1, Number(paginaRaw)) : 1;
  const porPagina = porPaginaRaw ? Math.max(1, Number(porPaginaRaw)) : 10;

  return (
    <>
      <SiteHeader
        title="Aprobación de cotizaciones"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Aprobación de cotizaciones" },
        ]}
      />
      <AprobacionesVista pagina={pagina} porPagina={porPagina} />
    </>
  );
}
