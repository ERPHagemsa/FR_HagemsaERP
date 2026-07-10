import { SiteHeader } from "@/compartido/componentes/site-header";
import { AprobacionesVista } from "@/modulos/comercial/aprobaciones/vistas/aprobaciones-vista";
import type {
  EstadoSolicitud,
  FiltrosAprobaciones,
} from "@/modulos/comercial/aprobaciones/tipos/aprobaciones.tipos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ESTADOS_VALIDOS: EstadoSolicitud[] = ["EN_APROBACION", "APROBADA", "RECHAZADA"];

function primerValor(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

/** Entero >= 1, o undefined si el query param no es utilizable. */
function enteroPositivo(valor: string | undefined) {
  if (!valor) return undefined;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 1 ? numero : undefined;
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;

  const estadoRaw = primerValor(params.estado) as EstadoSolicitud | undefined;
  const estado = estadoRaw && ESTADOS_VALIDOS.includes(estadoRaw) ? estadoRaw : undefined;

  const filtros: FiltrosAprobaciones = {
    estado,
    usuarioResolucion: primerValor(params.usuarioResolucion) || undefined,
    numeroCotizacion: enteroPositivo(primerValor(params.numeroCotizacion)),
    pagina: enteroPositivo(primerValor(params.pagina)) ?? 1,
    porPagina: enteroPositivo(primerValor(params.porPagina)) ?? 10,
  };

  return (
    <>
      <SiteHeader
        title="Aprobación de cotizaciones"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Aprobación de cotizaciones" },
        ]}
      />
      <AprobacionesVista filtros={filtros} />
    </>
  );
}
