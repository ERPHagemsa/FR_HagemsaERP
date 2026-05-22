import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function ClientesPage() {
  return (
    <SocioNegocioVista
      titulo="Gestion de Clientes"
      etiqueta="Clientes con datos maestros validados por documento/RUC/DNI."
      accionPrincipal="Nuevo cliente"
      crearHref="/socio-negocios/clientes/nuevo"
      filtros={{ tipo: "CLIENTE" }}
      metricas={[
        {
          etiqueta: "Clientes activos",
          valor: "142",
          detalle: "Socios tipo CLIENTE disponibles para la operacion.",
        },
        {
          etiqueta: "Altas desde Comercial",
          valor: "12",
          detalle: "Eventos ClienteListoParaAlta procesados este mes.",
        },
        {
          etiqueta: "Observaciones",
          valor: "4",
          detalle: "Registros pendientes por datos minimos o duplicidad.",
        },
      ]}
    />
  )
}
