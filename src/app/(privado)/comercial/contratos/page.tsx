import { SiteHeader } from "@/compartido/componentes/site-header"
import type {
  EstadoContrato,
  FiltrosContratos,
} from "@/modulos/comercial/contratos/tipos/contratos.tipos"
import { ContratosVista } from "@/modulos/comercial/contratos/vistas/contratos-vista"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams

  const estadoRaw = primero(params.estado)
  const clienteRaw = primero(params.idClienteExterno)
  const paginaRaw = primero(params.pagina)

  const estadosValidos: EstadoContrato[] = ["ACTIVO", "VENCIDO"]
  const estado =
    estadoRaw && estadosValidos.includes(estadoRaw as EstadoContrato)
      ? (estadoRaw as EstadoContrato)
      : undefined

  const filtros: FiltrosContratos = {
    estado,
    idClienteExterno: clienteRaw,
    pagina: paginaRaw ? Math.max(1, Number(paginaRaw)) : 1,
    porPagina: 10,
  }

  return (
    <>
      <SiteHeader
        title="Contratos"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Contratos" },
        ]}
      />
      <ContratosVista filtrosIniciales={filtros} />
    </>
  )
}
