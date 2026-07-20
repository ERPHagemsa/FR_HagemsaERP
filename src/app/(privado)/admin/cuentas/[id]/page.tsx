import { CuentaDetalleVista } from "@/modulos/administracion/vistas/cuenta-detalle-vista"

interface PropsCuentaPage {
  params: Promise<{ id: string }>
}

export default async function CuentaPage({ params }: PropsCuentaPage) {
  const { id } = await params
  return <CuentaDetalleVista cuentaId={id} />
}
