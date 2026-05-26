import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function PersonalPage() {
  return (
    <SocioNegocioVista
      titulo="Gestion de Personal"
      etiqueta="Personal filtrable por area, puesto, sede, contrato y estado."
      accionPrincipal="Nuevo personal"
      crearHref="/socio-negocios/personal/nuevo"
      filtros={{ tipo: "PERSONAL" }}
    />
  )
}
