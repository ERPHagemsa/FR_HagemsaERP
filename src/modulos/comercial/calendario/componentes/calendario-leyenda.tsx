"use client";

import { cn } from "@/compartido/utilidades/utils";

import type { EventoCalendario } from "../tipos/calendario.tipos";
import { colorEvento } from "../utilidades/colores-evento";

type Props = {
  eventos: EventoCalendario[];
};

// Leyenda de colores del calendario: un punto + nombre por cada ejecutivo
// presente en los eventos del mes visible. El color sale de la misma funcion
// determinista que pinta los chips, asi coinciden siempre.
export function CalendarioLeyenda({ eventos }: Props) {
  const ejecutivos = new Map<string, string>();
  for (const evento of eventos) {
    if (!ejecutivos.has(evento.idEjecutivoResponsable)) {
      ejecutivos.set(evento.idEjecutivoResponsable, evento.nombreEjecutivoResponsable);
    }
  }

  if (ejecutivos.size === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {[...ejecutivos].map(([id, nombre]) => (
        <div
          key={id}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className={cn("h-2.5 w-2.5 rounded-full", colorEvento(id).punto)}
            aria-hidden
          />
          <span>{nombre}</span>
        </div>
      ))}
    </div>
  );
}
