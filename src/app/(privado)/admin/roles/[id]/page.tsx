import { RolDetalleVista } from "@/modulos/administracion/vistas/rol-detalle-vista"

interface PropsRolPage {
  params: Promise<{ id: string }>
}

export default async function RolPage({ params }: PropsRolPage) {
  const { id } = await params
  return <RolDetalleVista rolId={id} />
}
