"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpRight, Building2, CalendarDays, Truck, User } from "lucide-react";

import { cn } from "@/compartido/utilidades/utils";
import { formatearMoneda } from "@/compartido/utilidades/formato-moneda";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/compartido/componentes/ui/popover";

import type { EventoCalendario, TransporteEvento } from "../tipos/calendario.tipos";
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

// Una linea de transporte legible: "RUTA · N × UNIDAD". Cada parte se omite si
// falta (ruta o unidad vacias), asi una carga sin ruta o sin unidad no muestra
// separadores colgando. Sin partes → guion.
function formatearTransporte(transporte: TransporteEvento): string {
  const partes: string[] = [];
  if (transporte.ruta) partes.push(transporte.ruta);
  if (transporte.unidad) {
    partes.push(`${transporte.cantidad} × ${transporte.unidad}`);
  }
  return partes.join(" · ") || "—";
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

  // La tarifa por seccion solo aporta cuando hay mas de una: con una sola
  // seccion, su tarifa coincide con el total y mostrarla dos veces es ruido.
  const mostrarTarifaSeccion = evento.secciones.length > 1;

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
      <PopoverContent align="start" className="w-96">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <span
              className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", color.punto)}
              aria-hidden
            />
            <p className="text-sm leading-snug font-semibold">{evento.titulo}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0" aria-hidden />
            <span>{evento.cliente}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            <span>{fechaLabel}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 shrink-0" aria-hidden />
            <span>{evento.nombreEjecutivoResponsable}</span>
          </div>

          {evento.secciones.length > 0 && (
            <div className="flex flex-col gap-2 border-t pt-3">
              {evento.secciones.map((seccion, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {mostrarTarifaSeccion && (
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium">
                        {seccion.nombre ?? `Sección ${i + 1}`}
                      </span>
                      <span className="text-xs font-semibold tabular-nums">
                        {formatearMoneda(seccion.tarifa, evento.moneda)}
                      </span>
                    </div>
                  )}
                  {seccion.transportes.length > 0 ? (
                    <ul className="flex flex-col gap-0.5">
                      {seccion.transportes.map((transporte, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-1.5 text-xs text-muted-foreground"
                        >
                          <Truck className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                          <span>{formatearTransporte(transporte)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Sin transportes
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {evento.total !== null && (
            <div className="flex items-baseline justify-between gap-2 border-t pt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-semibold tabular-nums">
                {formatearMoneda(evento.total, evento.moneda)}
              </span>
            </div>
          )}

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
