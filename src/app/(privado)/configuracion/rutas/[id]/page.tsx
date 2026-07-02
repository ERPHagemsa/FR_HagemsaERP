import { RutaDetalleVista } from "@/modulos/configuracion-general/vistas/ruta-detalle-vista"

export default async function RutaDetalleConfiguracionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <RutaDetalleVista rutaId={Number(id)} />
}
