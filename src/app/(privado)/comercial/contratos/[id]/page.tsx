import { SiteHeader } from "@/compartido/componentes/site-header"
import { ContratoDetalleVista } from "@/modulos/comercial/contratos/vistas/contrato-detalle-vista"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Props = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const { id } = await params

  return (
    <>
      <SiteHeader
        title="Detalle de contrato"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Contratos", href: "/comercial/contratos" },
          { title: "Detalle" },
        ]}
      />
      <ContratoDetalleVista id={id} />
    </>
  )
}
