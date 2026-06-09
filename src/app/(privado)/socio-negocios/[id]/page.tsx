import { SocioNegocioDetalleVista } from "@/modulos/socio-negocios/vistas/socio-negocio-detalle-vista"

type SocioNegocioDetallePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function SocioNegocioDetallePage({
  params,
}: SocioNegocioDetallePageProps) {
  const { id } = await params

  return <SocioNegocioDetalleVista id={id} />
}
