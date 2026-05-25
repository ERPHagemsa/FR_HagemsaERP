import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function ProveedoresPage() {
  return (
    <SocioNegocioVista
      titulo="Gestion de Proveedores"
      etiqueta="Proveedores registrados con codigo interno/SAP y estado operativo."
      accionPrincipal="Nuevo proveedor"
      crearHref="/socio-negocios/proveedores/nuevo"
      filtros={{ tipo: "PROVEEDOR" }}
      metricas={[
        {
          etiqueta: "Proveedores activos",
          valor: "96",
          detalle: "Socios tipo PROVEEDOR disponibles para compras y servicios.",
        },
        {
          etiqueta: "Nuevos registros",
          valor: "8",
          detalle: "Proveedores creados con fecha y usuario de registro.",
        },
        {
          etiqueta: "Proveedores inactivos",
          valor: "3",
          detalle: "Registros con estado INACTIVO y motivo de baja.",
        },
      ]}
    />
  )
}
