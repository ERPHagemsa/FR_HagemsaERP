import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function LicenciasPage() {
  return (
    <SocioNegocioVista
      titulo="Licencias"
      descripcion="Supervisa vencimientos, categorias, restricciones y renovaciones de licencias del personal conductor."
      metricas={[
        { etiqueta: "Licencias vigentes", valor: "119" },
        { etiqueta: "Por vencer", valor: "9" },
        { etiqueta: "Vencidas", valor: "2" },
      ]}
      registros={[
        { codigo: "LIC-778", nombre: "AIIIC - Luis Mamani Quispe", estado: "Vigente" },
        { codigo: "LIC-812", nombre: "AIIIB - Carlos Rojas Medina", estado: "Por vencer" },
        { codigo: "LIC-840", nombre: "AIIIC - Miguel Torres Alvarez", estado: "Observada" },
      ]}
    />
  )
}
