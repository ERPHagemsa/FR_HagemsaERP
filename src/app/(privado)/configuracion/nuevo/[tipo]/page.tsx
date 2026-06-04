import { ConfiguracionGeneralRegistroRutaVista } from "@/modulos/configuracion-general/componentes/configuracion-general-registro"

export default async function NuevoTipoConfiguracionGeneralPage({
  params,
}: {
  params: Promise<{ tipo?: string }>
}) {
  const { tipo } = await params

  return <ConfiguracionGeneralRegistroRutaVista slug={tipo} />
}
