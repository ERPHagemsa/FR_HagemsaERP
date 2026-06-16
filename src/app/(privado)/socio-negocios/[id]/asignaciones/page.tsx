import { SocioNegocioAsignacionesVista } from "@/modulos/socio-negocios/vistas/socio-negocio-asignaciones-vista"

type SocioNegocioAsignacionesPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function SocioNegocioAsignacionesPage({
  params,
}: SocioNegocioAsignacionesPageProps) {
  const { id } = await params

  return <SocioNegocioAsignacionesVista id={id} />
}
