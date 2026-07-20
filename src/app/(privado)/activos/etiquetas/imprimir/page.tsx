import { Suspense } from "react";

import { EtiquetasImprimirVista } from "@/modulos/activos/vistas/etiquetas-imprimir-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Sin SiteHeader a proposito: esta pagina es una hoja de impresion y el
// encabezado del ERP no debe salir en el papel.
export default function ActivosEtiquetasImprimirPage() {
  return (
    <Suspense>
      <EtiquetasImprimirVista />
    </Suspense>
  );
}
