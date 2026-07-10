import { ServiceClientDetalleVista } from "@/modulos/administracion/vistas/service-client-detalle-vista"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ServiceClientPage({ params }: Props) {
  const { id } = await params
  return <ServiceClientDetalleVista clienteId={id} />
}
