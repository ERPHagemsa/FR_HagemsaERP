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
import { formatearMoneda } from "@/compartido/utilidades/formato-moneda";

import { useKpisMonetariosQuery } from "../servicios/dashboard-queries";
import { calcularDeltaMonetario } from "../utilidades/delta-monetario";
import type {
  IdEjecutivoFiltro,
  RangoPeriodo,
  ResumenDineroPorEstado,
  TotalPorMoneda,
} from "../tipos/dashboard.tipos";

type Metrica = {
  clave: keyof ResumenDineroPorEstado;
  etiqueta: string;
};

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

const METRICAS: Metrica[] = [
  { clave: "ganado", etiqueta: "Ganado" },
  { clave: "pipeline", etiqueta: "Pipeline" },
  { clave: "ticketPromedio", etiqueta: "Ticket promedio" },
];

/**
 * Franja de KPI monetarios (design D4/D9/D12, tarea 3.1): consume
 * `useKpisMonetariosQuery`; Ganado / Pipeline / Ticket promedio, PEN y USD
 * SIEMPRE en líneas separadas (nunca sumados ni convertidos). El delta de
 * cada monto se deriva en cliente con `calcularDeltaMonetario` comparando
 * `actual` contra `variacionVsMesAnterior` (D12: el backend no manda un
 * delta ya calculado para este endpoint, a diferencia de win-rate/ciclo).
 */
export function DashboardKpisDinero({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useKpisMonetariosQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>KPI monetarios del período</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudieron cargar los KPI monetarios")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {METRICAS.map((metrica) => (
              <Skeleton key={metrica.clave} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {METRICAS.map((metrica) => (
              <TarjetaMetrica
                key={metrica.clave}
                etiqueta={metrica.etiqueta}
                actual={data.actual[metrica.clave]}
                anterior={data.variacionVsMesAnterior[metrica.clave]}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TarjetaMetrica({
  etiqueta,
  actual,
  anterior,
}: {
  etiqueta: string;
  actual: TotalPorMoneda;
  anterior: TotalPorMoneda;
}) {
  const delta = calcularDeltaMonetario(actual, anterior);

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <span className="text-xs font-medium text-muted-foreground">{etiqueta}</span>
      <LineaMoneda moneda="PEN" monto={actual.pen} delta={delta.pen} />
      <LineaMoneda moneda="USD" monto={actual.usd} delta={delta.usd} />
    </div>
  );
}

function LineaMoneda({
  moneda,
  monto,
  delta,
}: {
  moneda: "PEN" | "USD";
  monto: number;
  delta: number;
}) {
  const esPositivo = delta > 0;
  const esNegativo = delta < 0;
  const colorDelta = esPositivo
    ? "text-emerald-600 dark:text-emerald-400"
    : esNegativo
      ? "text-rose-600 dark:text-rose-400"
      : "text-muted-foreground";
  const signo = esPositivo ? "+" : "";

  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-lg font-semibold tabular-nums">
        {formatearMoneda(monto, moneda)}
      </span>
      <span className={`text-xs tabular-nums ${colorDelta}`}>
        {signo}
        {formatearMoneda(delta, moneda)}
      </span>
    </div>
  );
}
