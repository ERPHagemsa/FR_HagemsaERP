import { SiteHeader } from "@/compartido/componentes/site-header";
import { DashboardVista } from "@/modulos/comercial/dashboard/vistas/dashboard-vista";

// Índice del módulo Comercial: es el dashboard del área (pantalla de arranque),
// no una ruta base vacía. Monta la vista de orquestación del dashboard.
export default function ComercialPage() {
  return (
    <>
      <SiteHeader title="Gestión Comercial" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <DashboardVista />
      </div>
    </>
  );
}
