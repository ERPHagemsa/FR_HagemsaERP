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
          etiqueta: "Altas del mes",
          valor: "8",
          detalle: "Nuevos proveedores creados sin duplicidad por tipo.",
        },
        {
          etiqueta: "Bajas pendientes",
          valor: "3",
          detalle: "Solicitudes con motivo de baja por confirmar.",
        },
      ]}
    />
  )
}
