import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function ClientesPage() {
  return (
    <SocioNegocioVista
      titulo="Gestion de Clientes"
      etiqueta="Clientes con datos maestros validados por documento/RUC/DNI."
      accionPrincipal="Nuevo cliente"
      crearHref="/socio-negocios/clientes/nuevo"
      filtros={{ tipo: "CLIENTE" }}
    />
  )
}
