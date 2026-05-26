import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function SocioNegociosPage() {
  return (
    <SocioNegocioVista
      titulo="Socio de Negocio"
      etiqueta="Vista general del maestro de socios de negocio."
      accionPrincipal="Nuevo socio"
      crearHref="/socio-negocios/nuevo"
    />
  )
}
