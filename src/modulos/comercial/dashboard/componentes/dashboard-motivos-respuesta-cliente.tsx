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
import { useMotivosRespuestaClienteQuery } from "../servicios/dashboard-queries";
import type {
  IdEjecutivoFiltro,
  MotivoRespuestaClienteAgrupado,
  RangoPeriodo,
} from "../tipos/dashboard.tipos";

const CHART_CONFIG_RECHAZO = {
  cantidad: { label: "Cantidad", color: "var(--dataviz-rose)" },
} satisfies ChartConfig;

const CHART_CONFIG_NEGOCIACION = {
  cantidad: { label: "Cantidad", color: "var(--dataviz-amber)" },
} satisfies ChartConfig;

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/**
 * Respuesta del cliente ante nuestras cotizaciones (cambio
 * dashboard-kpis-motivos-respuesta-front): consume
 * `useMotivosRespuestaClienteQuery`. A diferencia de "Motivos de pérdida"
 * (`DashboardMotivosPerdida`, texto libre del ejecutivo, agrupación
 * best-effort) esto viene de un CATÁLOGO cerrado elegido por el CLIENTE —
 * clona el patrón visual (BarChart vertical + ChartContainer) sin fusionarse
 * con ese componente, porque son dos conceptos de backend distintos.
 * Se particiona por `tipo` (RECHAZO/NEGOCIACION) preservando el orden que ya
 * trae el backend (cantidad DESC); cada sub-bloque tiene su propio estado
 * vacío porque un tipo puede venir vacío y el otro con datos.
 */
export function DashboardMotivosRespuestaCliente({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useMotivosRespuestaClienteQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  const motivos = data?.motivos ?? [];
  const rechazos = motivos.filter((motivo) => motivo.tipo === "RECHAZO");
  const negociaciones = motivos.filter((motivo) => motivo.tipo === "NEGOCIACION");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Respuesta del cliente</CardTitle>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.motivosRespuestaCliente} />
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(
                error,
                "No se pudieron cargar las respuestas del cliente"
              )}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : motivos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin respuestas de clientes registradas en el período.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BloqueMotivosRespuesta
              titulo="Rechazo"
              motivos={rechazos}
              chartConfig={CHART_CONFIG_RECHAZO}
              mensajeVacio="Sin rechazos en el período."
            />
            <BloqueMotivosRespuesta
              titulo="Negociación"
              motivos={negociaciones}
              chartConfig={CHART_CONFIG_NEGOCIACION}
              mensajeVacio="Sin negociaciones en el período."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BloqueMotivosRespuesta({
  titulo,
  motivos,
  chartConfig,
  mensajeVacio,
}: {
  titulo: string;
  motivos: MotivoRespuestaClienteAgrupado[];
  chartConfig: ChartConfig;
  mensajeVacio: string;
}) {
  const datos = motivos.map((motivo) => ({
    codigo: motivo.codigo,
    etiqueta: motivo.etiqueta,
    cantidad: motivo.cantidad,
  }));

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{titulo}</h3>
      {datos.length === 0 ? (
        <p className="text-sm text-muted-foreground">{mensajeVacio}</p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto w-full"
          style={{ height: `${Math.max(datos.length * 36, 120)}px` }}
        >
          <BarChart data={datos} layout="vertical">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
