"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { useEjecutivosCotizacionesQuery } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-queries";

import type { DashboardFiltroEjecutivoProps } from "../tipos/dashboard.tipos";

// Sentinel del Select (shadcn/radix no acepta value="" en SelectItem): mapea
// a `undefined` (design D2: "Todos" = sin filtro de ejecutivo).
const VALOR_TODOS = "TODOS";

/**
 * Filtro global de ejecutivo (design D2, spec "Filtro global de ejecutivo"):
 * valor controlado por props, sin estado propio — `DashboardVista` lo eleva.
 * Alimentado por el mismo catálogo (`useEjecutivosCotizacionesQuery`) que ya
 * consume `CotizacionesTabla`: cero consultas nuevas.
 */
export function DashboardFiltroEjecutivo({
  idEjecutivoResponsable,
  alCambiar,
}: DashboardFiltroEjecutivoProps) {
  const { data: ejecutivos } = useEjecutivosCotizacionesQuery();

  return (
    <div className="grid min-w-48 gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        Ejecutivo
      </span>
      <Select
        value={idEjecutivoResponsable ?? VALOR_TODOS}
        onValueChange={(valor) =>
          alCambiar(valor === VALOR_TODOS ? undefined : valor)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={VALOR_TODOS}>Todos</SelectItem>
          {(ejecutivos ?? []).map((ejecutivo) => (
            <SelectItem key={ejecutivo.id} value={ejecutivo.id}>
              {ejecutivo.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
