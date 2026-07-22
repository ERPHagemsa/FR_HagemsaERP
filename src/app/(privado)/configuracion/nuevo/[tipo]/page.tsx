import { ConfiguracionGeneralRegistroRutaVista } from "@/modulos/configuracion-general/componentes/configuracion-general-registro"
import { notFound } from "next/navigation"

export default async function NuevoTipoConfiguracionGeneralPage({
  params,
}: {
  params: Promise<{ tipo?: string }>
}) {
  const { tipo } = await params

  if (tipo === "almacen" || tipo === "regimen") {
    notFound()
  }

  return <ConfiguracionGeneralRegistroRutaVista slug={tipo} />
}
