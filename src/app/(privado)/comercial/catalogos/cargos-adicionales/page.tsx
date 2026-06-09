import { SiteHeader } from "@/compartido/componentes/site-header"
import type {
  EstadoCatalogoCargoAdicional,
  FiltrosCatalogosCargoAdicional,
} from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"
import { CatalogoCargosAdicionalesVista } from "@/modulos/comercial/catalogos/cargos-adicionales/vistas/catalogo-cargos-adicionales-vista"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams

  const estadoRaw = Array.isArray(params.estado) ? params.estado[0] : params.estado
  const busquedaRaw = Array.isArray(params.busqueda) ? params.busqueda[0] : params.busqueda
  const paginaRaw = Array.isArray(params.pagina) ? params.pagina[0] : params.pagina
  const porPaginaRaw = Array.isArray(params.porPagina) ? params.porPagina[0] : params.porPagina

  const estadosValidos: EstadoCatalogoCargoAdicional[] = ["ACTIVO", "INACTIVO"]
  const estado =
    estadoRaw && estadosValidos.includes(estadoRaw as EstadoCatalogoCargoAdicional)
      ? (estadoRaw as EstadoCatalogoCargoAdicional)
      : undefined

  const pagina = paginaRaw ? Math.max(1, Number(paginaRaw)) : 1
  const porPagina = porPaginaRaw ? Math.max(1, Number(porPaginaRaw)) : 10

  const filtros: FiltrosCatalogosCargoAdicional = {
    estado,
    busqueda: busquedaRaw,
    pagina,
    porPagina,
  }

  return (
    <>
      <SiteHeader
        title="Catalogo de cargos adicionales"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Catalogo de cargos adicionales" },
        ]}
      />
      <CatalogoCargosAdicionalesVista filtrosIniciales={filtros} />
    </>
  )
}
