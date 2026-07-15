"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarRange } from "lucide-react";

import { cn } from "@/compartido/utilidades/utils";
import { Button } from "@/compartido/componentes/ui/button";
import { Calendar } from "@/compartido/componentes/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/compartido/componentes/ui/popover";

import {
  ETIQUETAS_PERIODO_PRESET,
  resolverPeriodoPreset,
} from "../utilidades/periodo-preset";
import type { PeriodoPreset, RangoPeriodo } from "../tipos/dashboard.tipos";

import type { DateRange } from "react-day-picker";

const FORMATO_FECHA_API = "yyyy-MM-dd";
const PRESETS: PeriodoPreset[] = [
  "este-mes",
  "mes-anterior",
  "ultimos-3-meses",
  "este-ano",
];

/**
 * Selector global de período (design D5/D6, spec "Selector global de
 * período"): componente controlado, sin estado propio ni fetch de datos —
 * mismo patrón que `DashboardFiltroEjecutivo`. Alimenta a kpis-dinero,
 * win-rate, ciclo-cierre, ranking, motivos-perdida y embudo; NO afecta a
 * tendencia ni a acciones (el componente no las conoce, solo expone
 * `periodo` por props).
 *
 * 4 presets calculados en cliente + un rango custom construido sobre
 * `Popover` + `Calendar` (`mode="range"`): no se detectó ningún selector de
 * rango de fechas existente en el repo para reusar.
 */
export function DashboardSelectorPeriodo({
  periodo,
  alCambiar,
}: {
  periodo: RangoPeriodo;
  alCambiar: (periodo: RangoPeriodo) => void;
}) {
  // "Ahora" estable durante el ciclo de vida del componente: evita que los
  // presets se recalculen a un valor distinto entre renders del mismo montaje.
  const [ahora] = React.useState(() => new Date());
  const [abierto, setAbierto] = React.useState(false);
  const [rangoBorrador, setRangoBorrador] = React.useState<DateRange | undefined>();

  const presetActivo = React.useMemo(() => {
    return PRESETS.find((preset) => {
      const resuelto = resolverPeriodoPreset(preset, ahora);
      return resuelto.desde === periodo.desde && resuelto.hasta === periodo.hasta;
    });
  }, [periodo, ahora]);

  const esCustom = !presetActivo && Boolean(periodo.desde && periodo.hasta);

  const etiquetaCustom = esCustom
    ? `${formatearFechaCorta(periodo.desde)} – ${formatearFechaCorta(periodo.hasta)}`
    : "Rango custom";

  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">Período</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant={presetActivo === preset ? "default" : "outline"}
            size="sm"
            onClick={() => alCambiar(resolverPeriodoPreset(preset, ahora))}
          >
            {ETIQUETAS_PERIODO_PRESET[preset]}
          </Button>
        ))}

        <Popover
          open={abierto}
          onOpenChange={(siguienteAbierto) => {
            setAbierto(siguienteAbierto);
            if (siguienteAbierto) {
              setRangoBorrador({
                from: periodo.desde ? parseISO(periodo.desde) : undefined,
                to: periodo.hasta ? parseISO(periodo.hasta) : undefined,
              });
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={esCustom ? "default" : "outline"}
              size="sm"
              className={cn(!esCustom && "text-muted-foreground")}
            >
              <CalendarRange className="size-4" />
              {etiquetaCustom}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={rangoBorrador}
              onSelect={(rango) => {
                setRangoBorrador(rango);
                if (rango?.from && rango?.to) {
                  alCambiar({
                    desde: format(rango.from, FORMATO_FECHA_API),
                    hasta: format(rango.to, FORMATO_FECHA_API),
                  });
                  setAbierto(false);
                }
              }}
              numberOfMonths={2}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function formatearFechaCorta(iso: string | undefined): string {
  if (!iso) return "—";
  return format(parseISO(iso), "d MMM");
}
