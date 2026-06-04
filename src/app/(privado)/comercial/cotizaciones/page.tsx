import { SiteHeader } from "@/compartido/componentes/site-header";
import { CotizacionesVista } from "@/modulos/comercial/cotizaciones/vistas/cotizaciones-vista";
import type {
  EstadoCotizacion,
  FiltrosCotizaciones,
  OrigenTipo,
} from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;

  const estadoRaw = Array.isArray(params.estado) ? params.estado[0] : params.estado;
  const origenTipoRaw = Array.isArray(params.origenTipo)
    ? params.origenTipo[0]
    : params.origenTipo;
  const busquedaRaw = Array.isArray(params.busqueda) ? params.busqueda[0] : params.busqueda;
  const paginaRaw = Array.isArray(params.pagina) ? params.pagina[0] : params.pagina;
  const porPaginaRaw = Array.isArray(params.porPagina) ? params.porPagina[0] : params.porPagina;

  const estadosValidos: EstadoCotizacion[] = [
    "BORRADOR",
    "ENVIADA",
    "EN_REVISION",
    "GANADA",
    "PERDIDA",
    "CANCELADA",
    "VENCIDA",
  ];
  const estado =
    estadoRaw && estadosValidos.includes(estadoRaw as EstadoCotizacion)
      ? (estadoRaw as EstadoCotizacion)
      : undefined;

  const originesValidos: OrigenTipo[] = ["PROSPECTO", "CLIENTE"];
  const origenTipo =
    origenTipoRaw && originesValidos.includes(origenTipoRaw as OrigenTipo)
      ? (origenTipoRaw as OrigenTipo)
      : undefined;

  const pagina = paginaRaw ? Math.max(1, Number(paginaRaw)) : 1;
  const porPagina = porPaginaRaw ? Math.max(1, Number(porPaginaRaw)) : 10;

  const filtros: FiltrosCotizaciones = {
    estado,
    origenTipo,
    busqueda: busquedaRaw,
    pagina,
    porPagina,
  };

  const filtrosRaw = {
    estado: estadoRaw,
    origenTipo: origenTipoRaw,
    busqueda: busquedaRaw,
    pagina,
    porPagina,
  };

  return (
    <>
      <SiteHeader title="Cotizaciones" />
      <CotizacionesVista filtros={filtros} filtrosRaw={filtrosRaw} />
    </>
  );
}
