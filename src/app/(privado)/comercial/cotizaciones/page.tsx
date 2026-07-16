import { SiteHeader } from "@/compartido/componentes/site-header";
import { CotizacionesVista } from "@/modulos/comercial/cotizaciones/vistas/cotizaciones-vista";
import type {
  BucketCotizacion,
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

  const bucketRaw = Array.isArray(params.bucket) ? params.bucket[0] : params.bucket;
  const estadoRaw = Array.isArray(params.estado) ? params.estado[0] : params.estado;
  const origenTipoRaw = Array.isArray(params.origenTipo)
    ? params.origenTipo[0]
    : params.origenTipo;
  const idEjecutivoRaw = Array.isArray(params.idEjecutivoResponsable)
    ? params.idEjecutivoResponsable[0]
    : params.idEjecutivoResponsable;
  const busquedaRaw = Array.isArray(params.busqueda) ? params.busqueda[0] : params.busqueda;
  const paginaRaw = Array.isArray(params.pagina) ? params.pagina[0] : params.pagina;
  const porPaginaRaw = Array.isArray(params.porPagina) ? params.porPagina[0] : params.porPagina;

  const bucketsValidos: BucketCotizacion[] = [
    "enPreparacion",
    "pendientesAprobacion",
    "enviadas",
    "ganadas",
    "perdidas",
  ];
  const bucket =
    bucketRaw && bucketsValidos.includes(bucketRaw as BucketCotizacion)
      ? (bucketRaw as BucketCotizacion)
      : undefined;

  const estadosValidos: EstadoCotizacion[] = [
    "BORRADOR",
    "PENDIENTE_APROBACION",
    "ENVIADA",
    "EN_REVISION",
    "GANADA",
    "PERDIDA",
    "CANCELADA",
    "VENCIDA",
  ];
  // `bucket` y `estado` son mutuamente excluyentes (el backend devuelve 400 si
  // van juntos). El bucket gana: es el filtro que produce la UI nueva.
  const estado =
    bucket === undefined &&
    estadoRaw &&
    estadosValidos.includes(estadoRaw as EstadoCotizacion)
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
    bucket,
    estado,
    origenTipo,
    idEjecutivoResponsable: idEjecutivoRaw,
    busqueda: busquedaRaw,
    // Trae tambien las cotizaciones con baja logica: llegan mezcladas y el listado
    // las tacha en sitio, con Restaurar como accion de fila (patron del pilot de prospectos).
    incluirEliminados: true,
    pagina,
    porPagina,
  };

  return (
    <>
      <SiteHeader
        title="Cotizaciones"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Cotizaciones" },
        ]}
      />
      <CotizacionesVista filtros={filtros} />
    </>
  );
}
