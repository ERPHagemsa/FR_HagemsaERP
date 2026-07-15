"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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

import { useTendenciaMensualQuery } from "../servicios/dashboard-queries";
import type { FiltrosDashboardTendencia } from "../tipos/dashboard.tipos";

const CHART_CONFIG = {
  ganado: { label: "Ganado (PEN)", color: "var(--dataviz-teal)" },
  perdido: { label: "Perdido (PEN)", color: "var(--dataviz-rose)" },
} satisfies ChartConfig;

/**
 * Tendencia mensual ganado vs. perdido (design D4/D6/D7, tarea 3.4): consume
 * `useTendenciaMensualQuery({ idEjecutivoResponsable })` — SIN prop
 * `periodo` (D6: la ventana es `meses` fijo hacia atrás, independiente del
 * selector global). Renderiza los N puntos de la ventana tal cual llegan
 * (meses en 0 se muestran, no se omiten). PEN y USD se grafican en gráficas
 * separadas (nunca sumadas/convertidas), cada una con 2 `Bar` (ganado/perdido)
 * — patrón `BarChart` agrupado de tasks.md 3.4 aplicado por moneda.
 */
export function DashboardTendencia({
  idEjecutivoResponsable,
}: FiltrosDashboardTendencia) {
  const { data, isLoading, isError, error } = useTendenciaMensualQuery({
    idEjecutivoResponsable,
  });

  const datosPen = (data ?? []).map((punto) => ({
    etiqueta: `${punto.mes}/${punto.anio}`,
    ganado: punto.ganado.pen,
    perdido: punto.perdido.pen,
  }));
  const datosUsd = (data ?? []).map((punto) => ({
    etiqueta: `${punto.mes}/${punto.anio}`,
    ganado: punto.ganado.usd,
    perdido: punto.perdido.usd,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia mensual (ganado vs. perdido)</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar la tendencia mensual")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : datosPen.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos en la ventana.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">PEN</span>
              <ChartContainer config={CHART_CONFIG} className="aspect-auto h-56 w-full">
                <BarChart data={datosPen}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ganado" fill="var(--color-ganado)" radius={4} />
                  <Bar dataKey="perdido" fill="var(--color-perdido)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">USD</span>
              <ChartContainer config={CHART_CONFIG} className="aspect-auto h-56 w-full">
                <BarChart data={datosUsd}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ganado" fill="var(--color-ganado)" radius={4} />
                  <Bar dataKey="perdido" fill="var(--color-perdido)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
