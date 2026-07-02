import { SiteHeader } from "@/compartido/componentes/site-header"
import type {
  EstadoTarifario,
  FiltrosTarifarios,
  TipoOrigenTarifa,
} from "@/modulos/comercial/tarifarios/tipos/tarifarios.tipos"
import { TarifariosVista } from "@/modulos/comercial/tarifarios/vistas/tarifarios-vista"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function primero(
  v: string | string[] | undefined,
): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams

  const estadoRaw = primero(params.estado)
  const origenRaw = primero(params.tipoOrigen)
  const clienteRaw = primero(params.idClienteExterno)
  const paginaRaw = primero(params.pagina)

  const estadosValidos: EstadoTarifario[] = ["VIGENTE", "ANULADO"]
  const estado =
    estadoRaw && estadosValidos.includes(estadoRaw as EstadoTarifario)
      ? (estadoRaw as EstadoTarifario)
      : undefined

  const origenesValidos: TipoOrigenTarifa[] = ["COTIZACION", "CONTRATO", "MANUAL"]
  const tipoOrigen =
    origenRaw && origenesValidos.includes(origenRaw as TipoOrigenTarifa)
      ? (origenRaw as TipoOrigenTarifa)
      : undefined

  const filtros: FiltrosTarifarios = {
    estado,
    tipoOrigen,
    idClienteExterno: clienteRaw,
    pagina: paginaRaw ? Math.max(1, Number(paginaRaw)) : 1,
    porPagina: 10,
  }

  return (
    <>
      <SiteHeader
        title="Tarifarios"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Tarifarios" },
        ]}
      />
      <TarifariosVista filtrosIniciales={filtros} />
    </>
  )
}
