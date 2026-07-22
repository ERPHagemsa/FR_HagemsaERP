"use client";

import * as React from "react";
import { CircleCheck, CircleX, ClipboardCheck, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { cn } from "@/compartido/utilidades";

import { useResumenAprobacionesQuery } from "../servicios/aprobaciones-queries";
import {
  BUCKET_POR_ESTADO,
  type BucketAprobacion,
  type FiltrosAprobaciones,
} from "../tipos/aprobaciones.tipos";

type Props = {
  // De aca salen los filtros de contexto del resumen (aprobador / n° cotizacion)
  // y el bucket resaltado. El resumen NO acepta `estado`: filtrarlo dejaria
  // tres tarjetas en cero.
  filtros: FiltrosAprobaciones;
  // null = deseleccionar (clic en el bucket ya activo → listado sin filtro de estado).
  onSeleccionar: (bucket: BucketAprobacion | null) => void;
};

// Clases de color estaticas (Tailwind v4 no purga strings interpolados).
type DefTarjeta = {
  bucket: BucketAprobacion;
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
  claseIcono: string;
  claseActiva: string;
};

const TARJETAS: DefTarjeta[] = [
  {
    bucket: "enAprobacion",
    etiqueta: "Pendiente",
    descripcion: "Esperando resolución",
    icono: ClipboardCheck,
    claseIcono: "text-indigo-500",
    claseActiva: "ring-2 ring-indigo-500/60 bg-indigo-500/5",
  },
  {
    bucket: "aprobadas",
    etiqueta: "Aprobadas",
    descripcion: "La cotización se envió",
    icono: CircleCheck,
    claseIcono: "text-emerald-500",
    claseActiva: "ring-2 ring-emerald-500/60 bg-emerald-500/5",
  },
  {
    bucket: "rechazadas",
    etiqueta: "Rechazadas",
    descripcion: "Volvieron a borrador",
    icono: CircleX,
    claseIcono: "text-rose-500",
    claseActiva: "ring-2 ring-rose-500/60 bg-rose-500/5",
  },
];

export function AprobacionesKpis({ filtros, onSeleccionar }: Props) {
  const { data, isLoading } = useResumenAprobacionesQuery({
    usuarioResolucion: filtros.usuarioResolucion,
    numeroCotizacion: filtros.numeroCotizacion,
  });

  const bucketActivo = filtros.estado ? BUCKET_POR_ESTADO[filtros.estado] : undefined;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {TARJETAS.map((tarjeta) => {
        const activo = bucketActivo === tarjeta.bucket;
        const valor = data == null ? null : data[tarjeta.bucket];
        const Icono = tarjeta.icono;

        return (
          <button
            key={tarjeta.bucket}
            type="button"
            aria-pressed={activo}
            onClick={() => onSeleccionar(activo ? null : tarjeta.bucket)}
            className={cn(
              "flex flex-col gap-1 rounded-2xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10 transition-colors",
              "hover:ring-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activo && tarjeta.claseActiva
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {tarjeta.etiqueta}
              </span>
              <Icono className={cn("size-4 shrink-0", tarjeta.claseIcono)} />
            </div>

            {isLoading || valor == null ? (
              <Skeleton className="my-0.5 h-7 w-10" />
            ) : (
              <span className="text-2xl font-semibold tabular-nums">{valor}</span>
            )}

            <span className="text-[11px] text-muted-foreground">
              {tarjeta.descripcion}
            </span>
          </button>
        );
      })}
    </div>
  );
}
