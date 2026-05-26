import {
  SocioNegocioVista,
} from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function ReportesPage() {
  return (
    <SocioNegocioVista
      titulo="Reportes y Exportacion"
      etiqueta="Exportaciones de prueba para el maestro de socios."
      formatoExportacion="EXCEL"
    />
  )
}
