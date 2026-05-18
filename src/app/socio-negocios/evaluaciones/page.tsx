import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function EvaluacionesPage() {
  return (
    <SocioNegocioVista
      titulo="Evaluaciones"
      descripcion="Registra evaluaciones de desempeno, seguridad, induccion y cumplimiento operativo de socios de negocio."
      metricas={[
        { etiqueta: "Evaluaciones mes", valor: "42" },
        { etiqueta: "Aprobadas", valor: "35" },
        { etiqueta: "Reprogramadas", valor: "7" },
      ]}
      registros={[
        { codigo: "EVA-210", nombre: "Induccion operativa", estado: "Aprobada" },
        { codigo: "EVA-211", nombre: "Manejo defensivo", estado: "Programada" },
        { codigo: "EVA-212", nombre: "Seguridad en ruta", estado: "Reprogramada" },
      ]}
    />
  )
}
