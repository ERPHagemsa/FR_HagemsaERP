import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function ProveedoresPage() {
  return (
    <SocioNegocioVista
      titulo="Gestion de Proveedores"
      etiqueta="Proveedores registrados con codigo interno/SAP y estado operativo."
      accionPrincipal="Nuevo proveedor"
      crearHref="/socio-negocios/proveedores/nuevo"
      filtros={{ tipo: "PROVEEDOR" }}
    />
  )
}
