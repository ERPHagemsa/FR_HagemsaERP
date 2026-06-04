import { SocioNegocioHistorialDetalleVista } from "@/modulos/socio-negocios/vistas/socio-negocio-historial-vista"

type HistorialSocioDetallePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function HistorialSocioDetallePage({
  params,
}: HistorialSocioDetallePageProps) {
  const { id } = await params

  return <SocioNegocioHistorialDetalleVista id={id} />
}
