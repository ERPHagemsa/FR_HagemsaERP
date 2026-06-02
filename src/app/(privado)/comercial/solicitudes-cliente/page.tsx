import { SiteHeader } from "@/compartido/componentes/site-header";
import { SolicitudesClienteVista } from "@/modulos/comercial/solicitudes-cliente/vistas/solicitudes-cliente-vista";
import type {
  EstadoSolicitudCliente,
  FiltrosSolicitudesCliente,
  TipoOrigen,
} from "@/modulos/comercial/solicitudes-cliente/tipos/solicitud-cliente.tipos";

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

  const estadosValidos: EstadoSolicitudCliente[] = [
    "PENDIENTE",
    "EN_COTIZACION",
    "COTIZADA",
    "CERRADA",
    "DESCARTADA",
  ];
  const estado =
    estadoRaw && estadosValidos.includes(estadoRaw as EstadoSolicitudCliente)
      ? (estadoRaw as EstadoSolicitudCliente)
      : undefined;

  const originesValidos: TipoOrigen[] = ["PROSPECTO", "CLIENTE"];
  const origenTipo =
    origenTipoRaw && originesValidos.includes(origenTipoRaw as TipoOrigen)
      ? (origenTipoRaw as TipoOrigen)
      : undefined;

  const pagina = paginaRaw ? Math.max(1, Number(paginaRaw)) : 1;
  const porPagina = porPaginaRaw ? Math.max(1, Number(porPaginaRaw)) : 10;

  const filtros: FiltrosSolicitudesCliente = {
    estado,
    origenTipo,
    busqueda: busquedaRaw,
    pagina,
    porPagina,
  };

  return (
    <>
      <SiteHeader title="Solicitudes de cliente" />
      <SolicitudesClienteVista filtros={filtros} />
    </>
  );
}
