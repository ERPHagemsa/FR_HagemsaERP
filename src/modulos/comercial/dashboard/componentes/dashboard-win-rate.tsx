"use client";

import { Pie, PieChart } from "recharts";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/compartido/componentes/ui/chart";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { formatearPorcentaje } from "@/compartido/utilidades/formato-porcentaje";

import { AyudaMetrica } from "./ayuda-metrica";
import { DASHBOARD_AYUDA } from "../dashboard-ayuda";
import { useWinRateQuery } from "../servicios/dashboard-queries";
import type { IdEjecutivoFiltro, RangoPeriodo } from "../tipos/dashboard.tipos";

const CHART_CONFIG = {
  ganadas: { label: "Ganadas", color: "var(--dataviz-teal)" },
  perdidas: { label: "Perdidas", color: "var(--dataviz-rose)" },
} satisfies ChartConfig;

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/**
 * KPI de win rate (design D4/D7/D8/D12, tarea 3.2): consume
 * `useWinRateQuery`; % + donut ganadas/perdidas (`Pie innerRadius`) y
 * `variacionVsMesAnterior` en puntos porcentuales (delta ya calculado por
 * backend, consumo directo — D12). `winRate`/`variacionVsMesAnterior` en
 * `null` renderizan un estado "sin datos" neutro, sin donut.
 */
export function DashboardWinRate({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useWinRateQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Win rate del período</CardTitle>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.winRate} />
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar el win rate")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <Skeleton className="h-48 w-full" />
        ) : data.winRate === null ? (
          <p className="text-sm text-muted-foreground">
            Sin cierres ganados/perdidos en el período.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <ChartContainer config={CHART_CONFIG} className="mx-auto aspect-square h-40">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={[
                    { serie: "ganadas", cantidad: data.ganadas, fill: "var(--color-ganadas)" },
                    { serie: "perdidas", cantidad: data.perdidas, fill: "var(--color-perdidas)" },
                  ]}
                  dataKey="cantidad"
                  nameKey="serie"
                  innerRadius={45}
                  outerRadius={70}
                />
              </PieChart>
            </ChartContainer>

            <div className="flex flex-col items-center gap-1 sm:items-end">
              <span className="text-3xl font-semibold tabular-nums">
                {formatearPorcentaje(data.winRate)}
              </span>
              <span className="text-xs text-muted-foreground">
                {data.ganadas} ganadas · {data.perdidas} perdidas
              </span>
              <VariacionWinRate variacion={data.variacionVsMesAnterior} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VariacionWinRate({ variacion }: { variacion: number | null }) {
  if (variacion === null) {
    return <span className="text-xs text-muted-foreground">Sin variación disponible</span>;
  }

  const esPositivo = variacion > 0;
  const esNegativo = variacion < 0;
  const color = esPositivo
    ? "text-emerald-600 dark:text-emerald-400"
    : esNegativo
      ? "text-rose-600 dark:text-rose-400"
      : "text-muted-foreground";
  const signo = esPositivo ? "+" : "";

  // NO se pasa a `formatearPorcentaje`: "pp" (puntos porcentuales) es una
  // unidad distinta de un porcentaje formateado con "%" — es la diferencia
  // entre dos porcentajes, no un porcentaje en si. Unico call-site en el
  // modulo: extraer un helper compartido para un solo consumidor seria
  // sobre-ingenieria. Se deja inline a proposito, no es un olvido del
  // refactor de dashboard-kpis-motivos-respuesta-front.
  return (
    <span className={`text-xs tabular-nums ${color}`}>
      {signo}
      {(variacion * 100).toFixed(1)} pp vs. período anterior
    </span>
  );
}
