"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
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

import { AyudaMetrica } from "./ayuda-metrica";
import { DASHBOARD_AYUDA } from "../dashboard-ayuda";
import { useTendenciaMensualQuery } from "../servicios/dashboard-queries";
import type {
  GranularidadTendencia,
  IdEjecutivoFiltro,
  RangoPeriodo,
} from "../tipos/dashboard.tipos";

const CHART_CONFIG = {
  ganadas: { label: "Ganadas", color: "var(--dataviz-teal)" },
  perdidas: { label: "Perdidas", color: "var(--dataviz-rose)" },
} satisfies ChartConfig;

type SerieTendencia = keyof typeof CHART_CONFIG;

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/**
 * Formatea la etiqueta del eje X según la granularidad que eligió el backend.
 * Parte el string `yyyy-MM-dd` A MANO (sin `new Date`) para NO caer en el
 * corrimiento de timezone que desplaza la fecha un día.
 */
function formatearEtiquetaTendencia(
  fecha: string,
  granularidad: GranularidadTendencia
): string {
  const [anio, mes, dia] = fecha.split("-");
  return granularidad === "dia"
    ? `${Number(dia)}/${Number(mes)}`
    : `${Number(mes)}/${anio}`;
}

/**
 * Tendencia de CONTEO de cotizaciones ganadas vs. perdidas — bar chart
 * interactivo (patrón shadcn "Bar Chart - Interactive"): el header muestra los
 * dos totales del período (Ganadas / Perdidas) como botones; al clickear uno,
 * el gráfico dibuja SOLO esa serie. Por default, "Ganadas".
 *
 * Sigue el filtro global de período como el resto; el backend decide la
 * granularidad (día si el rango es corto, mes si es largo), corta en hoy y
 * devuelve `{ granularidad, puntos }`. Las barras aguantan bien tanto el diario
 * (finitas y densas) como el mensual.
 */
export function DashboardTendencia({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useTendenciaMensualQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  const [serieActiva, setSerieActiva] = React.useState<SerieTendencia>("ganadas");

  const granularidad = data?.granularidad ?? "mes";
  const datos = (data?.puntos ?? []).map((punto) => ({
    etiqueta: formatearEtiquetaTendencia(punto.fecha, granularidad),
    ganadas: punto.ganadas,
    perdidas: punto.perdidas,
  }));

  const totales = React.useMemo(
    () => ({
      ganadas: datos.reduce((suma, punto) => suma + punto.ganadas, 0),
      perdidas: datos.reduce((suma, punto) => suma + punto.perdidas, 0),
    }),
    [datos]
  );

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-3 sm:py-4">
          <div className="flex items-center gap-1">
            <CardTitle>Cotizaciones ganadas vs. perdidas</CardTitle>
            <AyudaMetrica descripcion={DASHBOARD_AYUDA.tendencia} />
          </div>
          <CardDescription>
            {granularidad === "dia" ? "Por día" : "Por mes"} · en el período seleccionado
          </CardDescription>
        </div>
        <div className="flex">
          {(Object.keys(CHART_CONFIG) as SerieTendencia[]).map((serie) => (
            <button
              key={serie}
              type="button"
              data-active={serieActiva === serie}
              onClick={() => setSerieActiva(serie)}
              className="flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-6 sm:py-4"
            >
              <span className="text-xs text-muted-foreground">
                {CHART_CONFIG[serie].label}
              </span>
              <span className="text-lg font-bold leading-none tabular-nums sm:text-2xl">
                {data ? totales[serie].toLocaleString() : "—"}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6">
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar la tendencia")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <Skeleton className="h-56 w-full" />
        ) : datos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin cierres en el período seleccionado.
          </p>
        ) : (
          <ChartContainer config={CHART_CONFIG} className="aspect-auto h-56 w-full">
            <BarChart data={datos}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="etiqueta"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={serieActiva} fill={`var(--color-${serieActiva})`} radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
