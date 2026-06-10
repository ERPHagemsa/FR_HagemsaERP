import { SiteHeader } from "@/compartido/componentes/site-header"
import type {
  EstadoModalidad,
  FiltrosModalidades,
  TipoLinea,
  TipoModalidad,
} from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"
import { CatalogoModalidadesVista } from "@/modulos/comercial/catalogos/modalidades/vistas/catalogo-modalidades-vista"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams

  const estadoRaw = Array.isArray(params.estado) ? params.estado[0] : params.estado
  const tipoRaw = Array.isArray(params.tipo) ? params.tipo[0] : params.tipo
  const tipoLineaRaw = Array.isArray(params.tipoLinea) ? params.tipoLinea[0] : params.tipoLinea
  const busquedaRaw = Array.isArray(params.busqueda) ? params.busqueda[0] : params.busqueda
  const paginaRaw = Array.isArray(params.pagina) ? params.pagina[0] : params.pagina
  const porPaginaRaw = Array.isArray(params.porPagina) ? params.porPagina[0] : params.porPagina

  const estadosValidos: EstadoModalidad[] = ["ACTIVA", "INACTIVA"]
  const estado =
    estadoRaw && estadosValidos.includes(estadoRaw as EstadoModalidad)
      ? (estadoRaw as EstadoModalidad)
      : undefined

  const tiposValidos: TipoModalidad[] = ["SPOT", "PROYECTO", "OTRO"]
  const tipo =
    tipoRaw && tiposValidos.includes(tipoRaw as TipoModalidad)
      ? (tipoRaw as TipoModalidad)
      : undefined

  const tiposLineaValidos: TipoLinea[] = [
    "TRANSPORTE",
    "ALQUILER_EQUIPO",
    "ALMACENAJE",
    "AGENCIAMIENTO",
    "PERSONAL",
    "SERVICIO_AUXILIAR",
  ]
  const tipoLinea =
    tipoLineaRaw && tiposLineaValidos.includes(tipoLineaRaw as TipoLinea)
      ? (tipoLineaRaw as TipoLinea)
      : undefined

  const pagina = paginaRaw ? Math.max(1, Number(paginaRaw)) : 1
  const porPagina = porPaginaRaw ? Math.max(1, Number(porPaginaRaw)) : 10

  const filtros: FiltrosModalidades = {
    estado,
    tipo,
    tipoLinea,
    busqueda: busquedaRaw,
    pagina,
    porPagina,
  }

  return (
    <>
      <SiteHeader
        title="Modalidades"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Modalidades" },
        ]}
      />
      <CatalogoModalidadesVista filtrosIniciales={filtros} />
    </>
  )
}
