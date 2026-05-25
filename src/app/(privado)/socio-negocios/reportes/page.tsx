import {
  SocioNegocioVista,
} from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function ReportesPage() {
  return (
    <SocioNegocioVista
      titulo="Reportes y Exportacion"
      etiqueta="Exportaciones de prueba para el maestro de socios."
      formatoExportacion="EXCEL"
      metricas={[
        {
          etiqueta: "Exportaciones",
          valor: "24",
          detalle: "Archivos generados durante el mes actual.",
        },
        {
          etiqueta: "Formatos",
          valor: "Excel / PDF",
          detalle: "Formatos disponibles segun el documento funcional.",
        },
        {
          etiqueta: "Campos incluidos",
          valor: "6",
          detalle: "Codigo, documento, tipo, estado, correo y celular.",
        },
      ]}
    />
  )
}
