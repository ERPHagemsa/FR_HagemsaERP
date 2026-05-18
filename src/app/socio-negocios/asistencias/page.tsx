import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function AsistenciasPage() {
  return (
    <SocioNegocioVista
      titulo="Asistencias"
      descripcion="Controla marcaciones, turnos, incidencias y presencia del personal asignado a la operacion diaria."
      metricas={[
        { etiqueta: "Asistencias hoy", valor: "96" },
        { etiqueta: "Tardanzas", valor: "4" },
        { etiqueta: "Incidencias", valor: "3" },
      ]}
      registros={[
        { codigo: "ASI-103", nombre: "Turno amanecida - base Arequipa", estado: "Cerrado" },
        { codigo: "ASI-104", nombre: "Turno dia - patio principal", estado: "En curso" },
        { codigo: "ASI-105", nombre: "Control de relevo operativo", estado: "Pendiente" },
      ]}
    />
  )
}
