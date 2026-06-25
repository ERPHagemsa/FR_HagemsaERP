import { SocioNegocioDisponibilidadVista } from "@/modulos/socio-negocios/vistas/socio-negocio-disponibilidad-vista"

type SocioNegocioDisponibilidadPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function SocioNegocioDisponibilidadPage({
  params,
}: SocioNegocioDisponibilidadPageProps) {
  const { id } = await params

  return <SocioNegocioDisponibilidadVista id={id} />
}
