import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function ListarSociosNegocioPage() {
  return (
    <SocioNegocioVista
      titulo="Listar Socios de Negocio"
      accionPrincipal="Nuevo"
      crearHref="/socio-negocios/nuevo"
      filtros={{
        estado: "ACTIVO",
        estadoRegistro: "ACTIVO",
        sortBy: "fechaCreacion",
        sortOrder: "desc",
      }}
    />
  )
}
