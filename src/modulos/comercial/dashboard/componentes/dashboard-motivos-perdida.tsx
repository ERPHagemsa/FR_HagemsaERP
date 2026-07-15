"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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

import { useMotivosPerdidaQuery } from "../servicios/dashboard-queries";
import type { IdEjecutivoFiltro, RangoPeriodo } from "../tipos/dashboard.tipos";

const CHART_CONFIG = {
  cantidad: { label: "Cantidad", color: "var(--dataviz-amber)" },
} satisfies ChartConfig;

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/**
 * Motivos de pérdida del período (design D4/D7/D8, tarea 3.6): consume
 * `useMotivosPerdidaQuery`; `BarChart layout="vertical"` (barras
 * horizontales) por `motivoOriginal` × `cantidad`, color
 * `var(--dataviz-amber)`. Lista vacía renderiza estado vacío sin error; no
 * se presenta como taxonomía cerrada (agrupamiento best-effort del backend).
 */
export function DashboardMotivosPerdida({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useMotivosPerdidaQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  const datos = (data?.motivos ?? []).map((motivo) => ({
    motivo: motivo.motivoOriginal,
    cantidad: motivo.cantidad,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motivos de pérdida del período</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudieron cargar los motivos de pérdida")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <Skeleton className="h-48 w-full" />
        ) : datos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin pérdidas en el período.</p>
        ) : (
          <ChartContainer
            config={CHART_CONFIG}
            className="aspect-auto w-full"
            style={{ height: `${Math.max(datos.length * 36, 120)}px` }}
          >
            <BarChart data={datos} layout="vertical">
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="motivo"
                tickLine={false}
                axisLine={false}
                width={140}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
