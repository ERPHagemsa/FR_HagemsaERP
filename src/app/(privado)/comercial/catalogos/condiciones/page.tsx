import { SiteHeader } from "@/compartido/componentes/site-header"
import type {
  CategoriaCondicion,
  EstadoCatalogoCondicion,
  FiltrosCatalogosCondicion,
} from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"
import { CatalogoCondicionesVista } from "@/modulos/comercial/catalogos/condiciones/vistas/catalogo-condiciones-vista"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams

  const estadoRaw = Array.isArray(params.estado) ? params.estado[0] : params.estado
  const categoriaRaw = Array.isArray(params.categoria) ? params.categoria[0] : params.categoria
  const busquedaRaw = Array.isArray(params.busqueda) ? params.busqueda[0] : params.busqueda
  const paginaRaw = Array.isArray(params.pagina) ? params.pagina[0] : params.pagina
  const porPaginaRaw = Array.isArray(params.porPagina) ? params.porPagina[0] : params.porPagina

  const estadosValidos: EstadoCatalogoCondicion[] = ["ACTIVO", "INACTIVO"]
  const estado =
    estadoRaw && estadosValidos.includes(estadoRaw as EstadoCatalogoCondicion)
      ? (estadoRaw as EstadoCatalogoCondicion)
      : undefined

  const categoriasValidas: CategoriaCondicion[] = [
    "CONSIDERACIONES_SERVICIO",
    "TARIFAS_INCLUYEN",
  ]
  const categoria =
    categoriaRaw && categoriasValidas.includes(categoriaRaw as CategoriaCondicion)
      ? (categoriaRaw as CategoriaCondicion)
      : undefined

  const pagina = paginaRaw ? Math.max(1, Number(paginaRaw)) : 1
  const porPagina = porPaginaRaw ? Math.max(1, Number(porPaginaRaw)) : 10

  const filtros: FiltrosCatalogosCondicion = {
    estado,
    categoria,
    busqueda: busquedaRaw,
    pagina,
    porPagina,
  }

  return (
    <>
      <SiteHeader
        title="Catalogo de condiciones"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Catalogo de condiciones" },
        ]}
      />
      <CatalogoCondicionesVista filtrosIniciales={filtros} />
    </>
  )
}
