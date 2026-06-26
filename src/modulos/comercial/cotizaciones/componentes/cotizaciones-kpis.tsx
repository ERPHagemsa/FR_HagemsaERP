"use client";

import * as React from "react";
import {
  FilePen,
  Send,
  Trophy,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { cn } from "@/compartido/utilidades";

import { useResumenCotizacionesQuery } from "../servicios/cotizaciones-queries";
import type {
  BucketCotizacion,
  FiltrosCotizaciones,
} from "../tipos/cotizaciones.tipos";

type Props = {
  // Contexto activo: de aca salen los filtros del resumen (origen/ejecutivo/busqueda)
  // y el bucket resaltado.
  filtros: FiltrosCotizaciones;
  // null = deseleccionar (clic en el bucket ya activo → listado sin filtro de bucket).
  onSeleccionar: (bucket: BucketCotizacion | null) => void;
};

// Cada tarjeta es un filtro 1:1 con su KPI de /resumen. Clases de color
// estaticas (Tailwind v4 no purga strings interpolados).
type DefTarjeta = {
  bucket: BucketCotizacion;
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
  claseIcono: string;
  claseActiva: string;
};

const TARJETAS: DefTarjeta[] = [
  {
    bucket: "enPreparacion",
    etiqueta: "En preparacion",
    descripcion: "Borrador o en revision",
    icono: FilePen,
    claseIcono: "text-amber-500",
    claseActiva: "ring-2 ring-amber-500/60 bg-amber-500/5",
  },
  {
    bucket: "enviadas",
    etiqueta: "Enviadas",
    descripcion: "Enviadas al cliente",
    icono: Send,
    claseIcono: "text-sky-500",
    claseActiva: "ring-2 ring-sky-500/60 bg-sky-500/5",
  },
  {
    bucket: "ganadas",
    etiqueta: "Ganadas",
    descripcion: "Cierre exitoso",
    icono: Trophy,
    claseIcono: "text-emerald-500",
    claseActiva: "ring-2 ring-emerald-500/60 bg-emerald-500/5",
  },
  {
    bucket: "perdidas",
    etiqueta: "Perdidas",
    descripcion: "Perdida, vencida o cancelada",
    icono: XCircle,
    claseIcono: "text-rose-500",
    claseActiva: "ring-2 ring-rose-500/60 bg-rose-500/5",
  },
];

export function CotizacionesKpis({ filtros, onSeleccionar }: Props) {
  const { data, isLoading } = useResumenCotizacionesQuery({
    origenTipo: filtros.origenTipo,
    idEjecutivoResponsable: filtros.idEjecutivoResponsable,
    busqueda: filtros.busqueda,
  });

  const bucketActivo = filtros.bucket;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
