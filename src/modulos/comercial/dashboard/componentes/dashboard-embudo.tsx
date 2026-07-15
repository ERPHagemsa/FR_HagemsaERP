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

import { AyudaMetrica } from "./ayuda-metrica";
import { DASHBOARD_AYUDA } from "../dashboard-ayuda";
import { useEmbudoConversionQuery } from "../servicios/dashboard-queries";
import type {
  EmbudoConversionRespuesta,
  IdEjecutivoFiltro,
  RangoPeriodo,
} from "../tipos/dashboard.tipos";

const CHART_CONFIG = {
  cantidad: { label: "Cantidad", color: "var(--dataviz-teal)" },
} satisfies ChartConfig;

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

const ETAPAS: Array<{ clave: keyof EmbudoConversionRespuesta; etiqueta: string }> = [
  { clave: "solicitud", etiqueta: "Solicitud" },
  { clave: "cotizada", etiqueta: "Cotizada" },
  { clave: "enviada", etiqueta: "Enviada" },
  { clave: "ganada", etiqueta: "Ganada" },
];

/**
 * Embudo de conversión del período (design D4/D7, tarea 3.7): consume
 * `useEmbudoConversionQuery`; 4 barras decrecientes
 * solicitud → cotizada → enviada → ganada, semántica "alcanzó en algún
 * momento" (los conteos ya llegan monótonamente decrecientes del backend,
 * el frontend no recalcula ni valida el orden).
 */
export function DashboardEmbudo({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useEmbudoConversionQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  const datos = data
    ? ETAPAS.map((etapa) => ({ etapa: etapa.etiqueta, cantidad: data[etapa.clave] }))
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Embudo de conversión del período</CardTitle>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.embudo} />
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar el embudo de conversión")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ChartContainer config={CHART_CONFIG} className="aspect-auto h-48 w-full">
            <BarChart data={datos} layout="vertical">
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="etapa"
                tickLine={false}
                axisLine={false}
                width={80}
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
