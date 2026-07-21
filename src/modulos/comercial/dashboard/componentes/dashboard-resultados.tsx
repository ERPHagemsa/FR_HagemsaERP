"use client";

import { Banknote, Minus, TrendingDown, TrendingUp } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { cn } from "@/compartido/utilidades";
import { formatearMoneda } from "@/compartido/utilidades/formato-moneda";
import { formatearPorcentaje } from "@/compartido/utilidades/formato-porcentaje";

import { AyudaMetrica } from "./ayuda-metrica";
import { DASHBOARD_AYUDA } from "../dashboard-ayuda";
import { useKpisConsolidadoQuery } from "../servicios/dashboard-queries";
import type { IdEjecutivoFiltro, RangoPeriodo } from "../tipos/dashboard.tipos";

type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/**
 * Bloque "Lo ganado en el período": NO son tres KPIs sueltos (Monto / Utilidad
 * / Margen) sino UNA cadena contada como historia, porque los tres se derivan
 * uno del otro — `Ganado − Costo = Utilidad` y `Margen = Utilidad / Ganado`.
 * Por eso el diseño (Opción A, pedido explícito) es un relato por moneda: el
 * Monto ganado como número HÉROE (lo que entró), una barra apilada
 * utilidad/costo que muestra qué proporción de ese monto es ganancia, y una
 * línea derivada "de eso, X es utilidad (Y% de margen)". Consume el MISMO
 * `useKpisConsolidadoQuery` que el strip (campo `cerrado`).
 *
 * Reglas de dinero (design D9): PEN/USD SIEMPRE en bloques separados, sin sumar
 * ni convertir. El monto ganado es el titular (`text-2xl`); utilidad y margen
 * quedan subordinados en la línea derivada. Las ayudas (utilidad/margen) se
 * muestran UNA sola vez, ancladas al bloque PEN: explican la MÉTRICA, no la
 * moneda, así que no se repiten en USD.
 *
 * Variación (`cerrado.variacionVsAnterior`): monto/utilidad en % de cambio,
 * margen en PUNTOS PORCENTUALES; `null` cuando el período anterior no da base de
 * comparación → no se muestra chip.
 */
export function DashboardResultados({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useKpisConsolidadoQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Lo ganado en el período</CardTitle>
          <CardDescription>Variación comparada con el período anterior</CardDescription>
        </div>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.cerradoPeriodo} />
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar lo ganado en el período")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <div className="flex flex-col gap-5">
            <Skeleton className="h-6 w-56" />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <Banknote className="size-4 text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Monto de cotizaciones ganadas
              </span>
              <AyudaMetrica descripcion={DASHBOARD_AYUDA.montoGanado} />
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <BloqueMoneda
                moneda="PEN"
                montoGanado={data.cerrado.montoGanado.pen}
                utilidad={data.cerrado.utilidad.pen}
                margenPct={data.cerrado.margenPct.pen}
                varMonto={data.cerrado.variacionVsAnterior.montoGanado.pen}
                varUtilidad={data.cerrado.variacionVsAnterior.utilidad.pen}
                varMargen={data.cerrado.variacionVsAnterior.margenPct.pen}
                mostrarAyuda
              />
              <BloqueMoneda
                moneda="USD"
                montoGanado={data.cerrado.montoGanado.usd}
                utilidad={data.cerrado.utilidad.usd}
                margenPct={data.cerrado.margenPct.usd}
                varMonto={data.cerrado.variacionVsAnterior.montoGanado.usd}
                varUtilidad={data.cerrado.variacionVsAnterior.utilidad.usd}
                varMargen={data.cerrado.variacionVsAnterior.margenPct.usd}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Un bloque-moneda del relato: cuenta la historia completa de UNA moneda de
 * arriba a abajo — Monto ganado (héroe, lo que entró) → barra apilada
 * utilidad/costo → línea derivada "de eso, X es utilidad (Y% de margen)".
 *
 * Si `montoGanado` es 0 no hubo cierres en esa moneda (mirar el monto, no
 * `margenPct`, que puede ser 0 legítimo): se muestra el héroe en 0 y "Sin
 * cierres", sin barra ni línea derivada.
 *
 * La utilidad puede ser NEGATIVA (cotización ganada bajo costo): se muestra en
 * rojo y la barra cae a 0% verde (todo costo) — la barra no dibuja proporciones
 * negativas, el número en rojo cuenta la historia real.
 *
 * `margenPct` llega del backend en escala 0..100 → se divide /100 con variable
 * nombrada antes de formatear. La proporción verde de la barra es
 * `utilidad / montoGanado` (= margen), clampada a [0,1].
 */
function BloqueMoneda({
  moneda,
  montoGanado,
  utilidad,
  margenPct,
  varMonto,
  varUtilidad,
  varMargen,
  mostrarAyuda = false,
}: {
  moneda: "PEN" | "USD";
  montoGanado: number;
  utilidad: number;
  margenPct: number;
  varMonto: number | null;
  varUtilidad: number | null;
  varMargen: number | null;
  mostrarAyuda?: boolean;
}) {
  const sinCierres = montoGanado === 0;
  const margenFraccion = margenPct / 100;
  const proporcionUtilidad = sinCierres
    ? 0
    : Math.max(0, Math.min(1, utilidad / montoGanado));
  const utilidadNegativa = utilidad < 0;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          {formatearMoneda(montoGanado, moneda)}
        </span>
        <ChipVariacion valor={varMonto} unidad="pct" />
      </div>

      {sinCierres ? (
        <span className="text-sm text-muted-foreground">Sin cierres</span>
      ) : (
        <>
          <div
            className="flex h-1.5 overflow-hidden rounded-full bg-muted"
            title="Proporción de lo ganado que es utilidad (verde) vs. costo (gris)"
          >
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${proporcionUtilidad * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              De eso,
              <span
                className={cn(
                  "font-medium tabular-nums",
                  utilidadNegativa ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                )}
              >
                {formatearMoneda(utilidad, moneda)}
              </span>
              de utilidad
              {mostrarAyuda ? <AyudaMetrica descripcion={DASHBOARD_AYUDA.utilidad} /> : null}
              <ChipVariacion valor={varUtilidad} unidad="pct" />
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="font-medium tabular-nums text-foreground">
                {formatearPorcentaje(margenFraccion)}
              </span>
              de margen
              {mostrarAyuda ? <AyudaMetrica descripcion={DASHBOARD_AYUDA.margen} /> : null}
              <ChipVariacion valor={varMargen} unidad="pp" />
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Chip de variación vs. período anterior: flecha + valor, verde si subió, rojo si
 * bajó ("más es mejor" para las tres métricas). `unidad="pct"` muestra "%" (cambio
 * porcentual); `unidad="pp"` muestra " pp" (delta del margen). `null` no renderiza
 * nada (sin base de comparación).
 */
function ChipVariacion({ valor, unidad }: { valor: number | null; unidad: "pct" | "pp" }) {
  if (valor === null) return null;

  const positivo = valor > 0;
  const negativo = valor < 0;
  const Icono = positivo ? TrendingUp : negativo ? TrendingDown : Minus;
  const color = positivo
    ? "text-emerald-600 dark:text-emerald-400"
    : negativo
      ? "text-rose-600 dark:text-rose-400"
      : "text-muted-foreground";
  const signo = valor > 0 ? "+" : "";
  const sufijo = unidad === "pp" ? " pp" : "%";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 text-xs font-medium tabular-nums",
        color
      )}
    >
      <Icono className="size-3" />
      {signo}
      {valor.toFixed(1)}
      {sufijo}
    </span>
  );
}
