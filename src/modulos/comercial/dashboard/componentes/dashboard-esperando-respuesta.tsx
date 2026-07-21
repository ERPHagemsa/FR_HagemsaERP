"use client";

import Link from "next/link";
import { AlarmClock, ArrowRight, Inbox, MailCheck } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { formatearMoneda } from "@/compartido/utilidades/formato-moneda";

import { AyudaMetrica } from "./ayuda-metrica";
import { DASHBOARD_AYUDA } from "../dashboard-ayuda";
import { useEsperandoRespuestaQuery } from "../servicios/dashboard-queries";
import type {
  EsperandoRespuestaRespuesta,
  IdEjecutivoFiltro,
} from "../tipos/dashboard.tipos";

type Props = { idEjecutivoResponsable: IdEjecutivoFiltro };

/**
 * Widget "Esperando respuesta": la lista para perseguir HOY — cotizaciones ya
 * enviadas al cliente (estado ENVIADA) que siguen abiertas esperando su
 * respuesta. A diferencia del resto del dashboard es estado ACTUAL: NO depende
 * del selector de período, solo del filtro de ejecutivo (por eso recibe
 * `idEjecutivoResponsable` y NADA de `periodo`). Coherente con los KPIs de
 * acción del strip (Por vencer / Esperando aprobación / Sin cotizar).
 *
 * Consume `useEsperandoRespuestaQuery` (GET /dashboard/esperando-respuesta):
 * `{ cantidad, monto: { pen, usd }, porVencer }`. El criterio de estado y de
 * "por vencer" (≤3 días) es el MISMO que el de los buckets `enviadas` y
 * `porVencer` del listado de cotizaciones, así el número del widget cuadra
 * EXACTO con lo que muestra la lista al navegar (sin descuadres).
 *
 * Navegación (dos deep-links, sin anidar): el pie "Ver el listado" va al bucket
 * `enviadas`; el bloque ámbar "por vencer" va al bucket `porVencer`. Ambos
 * arrastran el filtro de ejecutivo si está activo. `monto` PEN/USD SIEMPRE
 * separado (regla D9). `cantidad === 0` → estado vacío "Todo respondido".
 */
export function DashboardEsperandoRespuesta({ idEjecutivoResponsable }: Props) {
  const { data, isLoading, isError, error } = useEsperandoRespuestaQuery({
    idEjecutivoResponsable,
  });

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Esperando respuesta</CardTitle>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.esperandoRespuesta} />
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar esperando respuesta")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : data.cantidad === 0 ? (
          <EstadoVacio />
        ) : (
          <Contenido data={data} idEjecutivoResponsable={idEjecutivoResponsable} />
        )}
      </CardContent>
    </Card>
  );
}

/** Href al listado de cotizaciones filtrado por bucket, arrastrando el ejecutivo. */
function hrefListado(bucket: string, idEjecutivoResponsable: IdEjecutivoFiltro) {
  const params = new URLSearchParams({ bucket });
  if (idEjecutivoResponsable) {
    params.set("idEjecutivoResponsable", idEjecutivoResponsable);
  }
  return `/comercial/cotizaciones?${params.toString()}`;
}

function Contenido({
  data,
  idEjecutivoResponsable,
}: {
  data: EsperandoRespuestaRespuesta;
  idEjecutivoResponsable: IdEjecutivoFiltro;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <Inbox className="size-5" />
        </span>
        <div>
          <div className="text-3xl font-bold leading-none tabular-nums">
            {data.cantidad}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            cotizaciones abiertas
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          En juego
        </span>
        <span className="text-base font-semibold tabular-nums">
          {formatearMoneda(data.monto.pen, "PEN")}
        </span>
        <span className="text-base font-semibold tabular-nums">
          {formatearMoneda(data.monto.usd, "USD")}
        </span>
      </div>

      <PorVencer
        cantidad={data.porVencer}
        idEjecutivoResponsable={idEjecutivoResponsable}
      />

      <Link
        href={hrefListado("enviadas", idEjecutivoResponsable)}
        className="flex items-center justify-end gap-1.5 text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
      >
        Ver el listado
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

/**
 * Bloque "por vencer": el subconjunto urgente, en ámbar (el único acento fuera
 * del emerald del widget, reservado para lo que necesita acción YA). Si no hay
 * ninguna por vencer, una línea muted en vez del bloque de alerta. Deep-link al
 * bucket `porVencer` del listado.
 */
function PorVencer({
  cantidad,
  idEjecutivoResponsable,
}: {
  cantidad: number;
  idEjecutivoResponsable: IdEjecutivoFiltro;
}) {
  if (cantidad === 0) {
    return (
      <span className="text-sm text-muted-foreground">Ninguna por vencer.</span>
    );
  }

  return (
    <Link
      href={hrefListado("porVencer", idEjecutivoResponsable)}
      className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm transition-colors hover:bg-amber-500/20"
    >
      <AlarmClock className="size-4 shrink-0 text-amber-500" />
      <span>
        <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
          {cantidad}
        </span>{" "}
        por vencer
      </span>
      <span className="ml-auto text-xs tabular-nums text-muted-foreground">
        ≤ 3 días
      </span>
    </Link>
  );
}

/** Estado vacío: no hay nada esperando respuesta ahora mismo. */
function EstadoVacio() {
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
        <MailCheck className="size-5" />
      </span>
      <span className="text-sm font-medium">Todo respondido</span>
      <span className="max-w-[24ch] text-xs text-muted-foreground">
        No hay cotizaciones esperando respuesta ahora mismo.
      </span>
    </div>
  );
}
