import { SiteHeader } from "@/compartido/componentes/site-header"
import { CatalogoMotivosVista } from "@/modulos/comercial/catalogos/motivos/vistas/catalogo-motivos-vista"
import type {
  EstadoCatalogoMotivo,
  FiltrosCatalogosMotivo,
  TipoMotivo,
} from "@/modulos/comercial/catalogos/motivos/tipos/motivos.tipos"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function uno(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams

  const tipoRaw = uno(params.tipo)
  const estadoRaw = uno(params.estado)
  const busquedaRaw = uno(params.busqueda)
  const paginaRaw = uno(params.pagina)
  const porPaginaRaw = uno(params.porPagina)

  const tiposValidos: TipoMotivo[] = ["RECHAZO", "NEGOCIACION"]
  const tipo =
    tipoRaw && tiposValidos.includes(tipoRaw as TipoMotivo)
      ? (tipoRaw as TipoMotivo)
      : undefined

  const estadosValidos: EstadoCatalogoMotivo[] = ["ACTIVO", "INACTIVO"]
  const estado =
    estadoRaw && estadosValidos.includes(estadoRaw as EstadoCatalogoMotivo)
      ? (estadoRaw as EstadoCatalogoMotivo)
      : undefined

  const filtros: FiltrosCatalogosMotivo = {
    tipo,
    estado,
    busqueda: busquedaRaw,
    pagina: paginaRaw ? Math.max(1, Number(paginaRaw)) : 1,
    porPagina: porPaginaRaw ? Math.max(1, Number(porPaginaRaw)) : 10,
  }

  return (
    <>
      <SiteHeader
        title="Catálogo de motivos"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Catálogo de motivos" },
        ]}
      />
      <CatalogoMotivosVista filtrosIniciales={filtros} />
    </>
  )
}
