"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/compartido/utilidades/utils";

import type { EventoCalendario } from "../tipos/calendario.tipos";
import { EventoChip } from "./evento-chip";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_CHIPS_POR_DIA = 3;
const COLUMNAS = 7;

/** Clave del dia (`yyyy-MM-dd`) usada para agrupar eventos por celda. */
export function claveDia(fecha: Date): string {
  return format(fecha, "yyyy-MM-dd");
}

/** Rango de la grilla visible: el mes + dias de relleno de semanas completas (design D2). */
export function calcularRangoGrilla(mesVisible: Date): { inicio: Date; fin: Date } {
  return {
    inicio: startOfWeek(startOfMonth(mesVisible), { locale: es }),
    fin: endOfWeek(endOfMonth(mesVisible), { locale: es }),
  };
}

type Props = {
  mesVisible: Date;
  eventosPorDia: Map<string, EventoCalendario[]>;
};

// Grilla mensual 7xN construida a mano con date-fns (design D1: sin libreria
// de calendario). Incluye los dias de relleno del mes anterior/siguiente para
// completar semanas (design D2). Colocacion de eventos por dia abarcado
// (design D4): la expansion inicio..fin la hace CalendarioVista antes de pasar
// `eventosPorDia`. Densidad: hasta MAX_CHIPS_POR_DIA chips y un "+X mas" (design riesgo 3).
export function CalendarioMensual({ mesVisible, eventosPorDia }: Props) {
  const { inicio: inicioGrilla, fin: finGrilla } = calcularRangoGrilla(mesVisible);
  const dias = eachDayOfInterval({ start: inicioGrilla, end: finGrilla });

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {dia}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((dia, indice) => {
          const clave = claveDia(dia);
          const eventos = eventosPorDia.get(clave) ?? [];
          const eventosVisibles = eventos.slice(0, MAX_CHIPS_POR_DIA);
          const restantes = eventos.length - eventosVisibles.length;
          const dentroDelMes = isSameMonth(dia, mesVisible);
          const esHoy = isToday(dia);
          const esUltimaColumna = (indice + 1) % COLUMNAS === 0;
          const esUltimaFila = indice >= dias.length - COLUMNAS;

          return (
            <div
              key={clave}
              className={cn(
                "flex min-h-36 flex-col gap-1 border-border p-2",
                !esUltimaColumna && "border-r",
                !esUltimaFila && "border-b",
                !dentroDelMes && "bg-muted/20 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "self-start rounded-full px-1.5 text-xs font-medium",
                  esHoy && "bg-primary text-primary-foreground"
                )}
              >
                {format(dia, "d")}
              </span>
              <div className="flex flex-1 flex-col gap-1">
                {eventosVisibles.map((evento) => (
                  <EventoChip key={`${clave}-${evento.id}`} evento={evento} />
                ))}
                {restantes > 0 ? (
                  <span className="px-1.5 text-xs text-muted-foreground">
                    +{restantes} más
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
