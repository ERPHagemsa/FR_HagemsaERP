import { SiteHeader } from "@/compartido/componentes/site-header"
import { TarifarioDetalleVista } from "@/modulos/comercial/tarifarios/vistas/tarifario-detalle-vista"

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
        title="Detalle de tarifario"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Tarifarios", href: "/comercial/tarifarios" },
          { title: "Detalle" },
        ]}
      />
      <TarifarioDetalleVista id={id} />
    </>
  )
}
