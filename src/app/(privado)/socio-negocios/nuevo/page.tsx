import { SocioNegocioNuevoVista } from "@/modulos/socio-negocios/vistas/socio-negocio-nuevo-vista"
import type { TipoSocioDeNegocio } from "@/modulos/socio-negocios/tipos/socio-negocio"

type NuevoSocioNegocioPageProps = {
  searchParams?: Promise<{
    tipo?: string | string[]
  }>
}

const tiposValidos: TipoSocioDeNegocio[] = ["CLIENTE", "PROVEEDOR", "PERSONAL"]

function normalizarTipo(tipo?: string | string[]): TipoSocioDeNegocio {
  const valor = Array.isArray(tipo) ? tipo[0] : tipo

  return tiposValidos.includes(valor as TipoSocioDeNegocio)
    ? (valor as TipoSocioDeNegocio)
    : "CLIENTE"
}

export default async function NuevoSocioNegocioPage({
  searchParams,
}: NuevoSocioNegocioPageProps) {
  const params = await searchParams

  return <SocioNegocioNuevoVista tipo={normalizarTipo(params?.tipo)} />
}
