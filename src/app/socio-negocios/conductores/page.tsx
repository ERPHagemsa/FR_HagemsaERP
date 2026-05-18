import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function ConductoresPage() {
  return (
    <SocioNegocioVista
      titulo="Conductores"
      descripcion="Gestiona informacion operativa, vigencia documental y estado de disponibilidad de conductores asociados a la operacion."
      metricas={[
        { etiqueta: "Conductores activos", valor: "128" },
        { etiqueta: "Disponibles hoy", valor: "74" },
        { etiqueta: "Observados", valor: "6" },
      ]}
      registros={[
        { codigo: "CON-001", nombre: "Luis Mamani Quispe", estado: "Disponible" },
        { codigo: "CON-014", nombre: "Carlos Rojas Medina", estado: "En ruta" },
        { codigo: "CON-028", nombre: "Miguel Torres Alvarez", estado: "Revision" },
      ]}
    />
  )
}
