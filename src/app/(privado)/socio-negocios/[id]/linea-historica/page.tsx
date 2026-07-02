import { SocioNegocioLineaHistoricaVista } from "@/modulos/socio-negocios/vistas/socio-negocio-linea-historica-vista"

type SocioNegocioLineaHistoricaPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function SocioNegocioLineaHistoricaPage({
  params,
}: SocioNegocioLineaHistoricaPageProps) {
  const { id } = await params

  return <SocioNegocioLineaHistoricaVista id={id} />
}
