import { SiteHeader } from "@/compartido/componentes/site-header";
import { ProspectosVista } from "@/modulos/comercial/prospectos/vistas/prospectos-vista";
import type { EstadoProspecto, FiltrosProspectos } from "@/modulos/comercial/prospectos/tipos/prospecto.tipos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;

  const estadoRaw = Array.isArray(params.estado) ? params.estado[0] : params.estado;
  const busquedaRaw = Array.isArray(params.busqueda) ? params.busqueda[0] : params.busqueda;
  const ejecutivoRaw = Array.isArray(params.idEjecutivoResponsable)
    ? params.idEjecutivoResponsable[0]
    : params.idEjecutivoResponsable;
  const paginaRaw = Array.isArray(params.pagina) ? params.pagina[0] : params.pagina;
  const porPaginaRaw = Array.isArray(params.porPagina) ? params.porPagina[0] : params.porPagina;

  const estadosValidos: EstadoProspecto[] = ["ACTIVO", "CONVERTIDO", "DESCARTADO"];
  const estado = estadoRaw && estadosValidos.includes(estadoRaw as EstadoProspecto)
    ? (estadoRaw as EstadoProspecto)
    : undefined;

  const pagina = paginaRaw ? Math.max(1, Number(paginaRaw)) : 1;
  const porPagina = porPaginaRaw ? Math.max(1, Number(porPaginaRaw)) : 10;
  const idEjecutivoResponsable = ejecutivoRaw ?? undefined;

  const filtros: FiltrosProspectos = {
    estado,
    busqueda: busquedaRaw,
    idEjecutivoResponsable,
    pagina,
    porPagina,
  };

  const filtrosRaw = {
    estado: estadoRaw,
    idEjecutivoResponsable: ejecutivoRaw,
    busqueda: busquedaRaw,
    pagina,
    porPagina,
  };

  return (
    <>
      <SiteHeader
        title="Prospectos"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Prospectos" },
        ]}
      />
      <ProspectosVista filtros={filtros} filtrosRaw={filtrosRaw} />
    </>
  );
}
