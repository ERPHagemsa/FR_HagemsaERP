import { SiteHeader } from "@/compartido/componentes/site-header";
import { HistorialProspectosVista } from "@/modulos/comercial/prospectos/vistas/historial-prospectos-vista";
import type {
  AccionHistorial,
  FiltrosHistorial,
} from "@/modulos/comercial/prospectos/tipos/prospecto.tipos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;

  const primero = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const accionRaw = primero(params.accion);
  const desdeRaw = primero(params.desde);
  const hastaRaw = primero(params.hasta);
  const paginaRaw = primero(params.pagina);
  const porPaginaRaw = primero(params.porPagina);

  const accionesValidas: AccionHistorial[] = [
    "REGISTRO",
    "MODIFICACION",
    "ELIMINACION",
  ];
  const accion =
    accionRaw && accionesValidas.includes(accionRaw as AccionHistorial)
      ? (accionRaw as AccionHistorial)
      : undefined;

  const pagina = paginaRaw ? Math.max(1, Number(paginaRaw)) : 1;
  const porPagina = porPaginaRaw ? Math.max(1, Number(porPaginaRaw)) : 20;

  const filtros: FiltrosHistorial = {
    accion,
    desde: desdeRaw,
    hasta: hastaRaw,
    pagina,
    porPagina,
  };

  const filtrosRaw = {
    accion: accionRaw,
    desde: desdeRaw,
    hasta: hastaRaw,
    pagina,
    porPagina,
  };

  return (
    <>
      <SiteHeader
        title="Historial de prospectos"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Prospectos", href: "/comercial/prospectos" },
          { title: "Historial" },
        ]}
      />
      <HistorialProspectosVista filtros={filtros} filtrosRaw={filtrosRaw} />
    </>
  );
}
