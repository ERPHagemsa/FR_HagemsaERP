import {
  SocioNegocioVista,
} from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function ConsultasPage() {
  return (
    <SocioNegocioVista
      titulo="Consultas de Socios"
      etiqueta="Resultados de busqueda con filtros de prueba."
      metricas={[
        {
          etiqueta: "Resultados",
          valor: "57",
          detalle: "Coincidencias por tipo de socio y estado.",
        },
        {
          etiqueta: "Documentos multirol",
          valor: "11",
          detalle: "Documentos con cliente, proveedor o personal asociados.",
        },
        {
          etiqueta: "Sin resultados",
          valor: "2",
          detalle: "Consultas recientes sin socios encontrados.",
        },
      ]}
    />
  )
}
