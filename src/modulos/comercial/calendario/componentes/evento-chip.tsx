"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpRight, CalendarDays, User } from "lucide-react";

import { cn } from "@/compartido/utilidades/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/compartido/componentes/ui/popover";

import type { EventoCalendario } from "../tipos/calendario.tipos";
import { colorEvento } from "../utilidades/colores-evento";

type Props = {
  evento: EventoCalendario;
  className?: string;
};

// Fecha larga en español a partir de la parte `YYYY-MM-DD` (parseada como
// fecha LOCAL para no desfasar por zona horaria, igual que en la agrupacion).
function fechaLarga(iso: string): string {
  const texto = format(parseISO(iso.slice(0, 10)), "EEEE, d 'de' MMMM", {
    locale: es,
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Chip de un evento (Cotizacion Ganada) en una celda de la grilla mensual. Al
// hacer click abre un desplegable (estilo Google Calendar) con el titulo, la
// fecha de servicio y un link al detalle. El link usa el `id` del evento — NO
// se parsea `enlace`: es una URL absoluta armada por el backend con
// FRONTEND_URL (puede no coincidir byte a byte con la ruta interna del front);
// la ruta interna conocida es `/comercial/cotizaciones/:id` (design riesgo 4).
export function EventoChip({ evento, className }: Props) {
  const inicioLabel = fechaLarga(evento.inicio);
  const esRango =
    Boolean(evento.fin) && evento.fin!.slice(0, 10) !== evento.inicio.slice(0, 10);
  const fechaLabel = esRango
    ? `${inicioLabel} — ${fechaLarga(evento.fin!)}`
    : inicioLabel;

  const color = colorEvento(evento.idEjecutivoResponsable);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={evento.titulo}
          className={cn(
            "w-full truncate rounded-md px-1.5 py-0.5 text-left text-xs font-medium transition-colors",
            color.chip,
            className
          )}
        >
          {evento.titulo}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <span
              className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", color.punto)}
              aria-hidden
            />
            <p className="text-sm leading-snug font-semibold">{evento.titulo}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            <span>{fechaLabel}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 shrink-0" aria-hidden />
            <span>{evento.nombreEjecutivoResponsable}</span>
          </div>

          <Link
            href={`/comercial/cotizaciones/${evento.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ver detalle de la cotización
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
