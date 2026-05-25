import { SocioNegocioVista } from "@/modulos/socio-negocios/vistas/socio-negocio-vista"

export default function PersonalPage() {
  return (
    <SocioNegocioVista
      titulo="Gestion de Personal"
      etiqueta="Personal filtrable por area, puesto, sede, contrato y estado."
      accionPrincipal="Nuevo personal"
      crearHref="/socio-negocios/personal/nuevo"
      filtros={{ tipo: "PERSONAL" }}
      metricas={[
        {
          etiqueta: "Personal activo",
          valor: "148",
          detalle: "Registros tipo PERSONAL con contrato vigente.",
        },
        {
          etiqueta: "Cambios laborales",
          valor: "21",
          detalle: "Modificaciones de puesto, sede, area o contrato.",
        },
        {
          etiqueta: "Contratos observados",
          valor: "5",
          detalle: "Registros que requieren completar informacion laboral.",
        },
      ]}
    />
  )
}
