import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function SocioNegociosPage() {
  return (
    <SocioNegocioVista
      titulo="Socio de Negocio"
      etiqueta="Vista general del maestro de socios de negocio."
      accionPrincipal="Nuevo socio"
      crearHref="/socio-negocios/nuevo"
      metricas={[
        {
          etiqueta: "Socios activos",
          valor: "386",
          detalle: "Clientes, proveedores y personal en estado ACTIVO.",
        },
        {
          etiqueta: "Duplicidad controlada",
          valor: "18",
          detalle: "Documentos registrados en mas de un tipo de socio.",
        },
        {
          etiqueta: "Socios dados de baja",
          valor: "7",
          detalle: "Registros inactivos con motivo, fecha y usuario de baja.",
        },
      ]}
    />
  )
}
