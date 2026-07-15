"use client";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { useCicloCierreQuery } from "../servicios/dashboard-queries";
import type { IdEjecutivoFiltro, RangoPeriodo } from "../tipos/dashboard.tipos";

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/**
 * KPI de ciclo de cierre (design D4/D12, tarea 3.3): consume
 * `useCicloCierreQuery`; tile "N días" + `variacionVsMesAnterior` coloreado
 * con la convención "menos es mejor" (delta negativo = mejora = verde,
 * positivo = deterioro = rojo — el signo crudo del backend NO se invierte,
 * solo se colorea distinto). `null` en cualquiera de los dos campos
 * renderiza "sin datos" neutro.
 */
export function DashboardCicloCierre({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useCicloCierreQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ciclo de cierre del período</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar el ciclo de cierre")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <Skeleton className="h-20 w-full" />
        ) : data.cicloPromedioDias === null ? (
          <p className="text-sm text-muted-foreground">
            Sin cierres ganados en el período.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-semibold tabular-nums">
              {data.cicloPromedioDias.toFixed(1)} días
            </span>
            <VariacionCiclo variacion={data.variacionVsMesAnterior} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VariacionCiclo({ variacion }: { variacion: number | null }) {
  if (variacion === null) {
    return <span className="text-xs text-muted-foreground">Sin variación disponible</span>;
  }

  // "Menos es mejor": delta negativo (se acortó) = mejora/verde; delta
  // positivo (se alargó) = deterioro/rojo. Signo crudo, sin invertir.
  const esMejora = variacion < 0;
  const esDeterioro = variacion > 0;
  const color = esMejora
    ? "text-emerald-600 dark:text-emerald-400"
    : esDeterioro
      ? "text-rose-600 dark:text-rose-400"
      : "text-muted-foreground";
  const signo = variacion > 0 ? "+" : "";

  return (
    <span className={`text-xs tabular-nums ${color}`}>
      {signo}
      {variacion.toFixed(1)} días vs. período anterior
    </span>
  );
}
