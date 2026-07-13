"use client";

import { useRouter } from "next/navigation";

import { cn } from "@/compartido/utilidades/utils";

import type { EventoCalendario } from "../tipos/calendario.tipos";

type Props = {
  evento: EventoCalendario;
  className?: string;
};

// Chip de un evento (Cotizacion Ganada) en una celda de la grilla mensual. El
// click navega al detalle usando el `id` del evento — NO se parsea `enlace`:
// es una URL absoluta armada por el backend con FRONTEND_URL (puede no
// coincidir byte a byte con la ruta interna del front); la ruta interna
// conocida es `/comercial/cotizaciones/:id` (ver design riesgo 4).
export function EventoChip({ evento, className }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/comercial/cotizaciones/${evento.id}`)}
      title={evento.titulo}
      className={cn(
        "w-full truncate rounded-md bg-primary/10 px-1.5 py-0.5 text-left text-xs font-medium text-primary transition-colors hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30",
        className
      )}
    >
      {evento.titulo}
    </button>
  );
}
