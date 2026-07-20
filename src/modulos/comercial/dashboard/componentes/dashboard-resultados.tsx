"use client";

import type { ReactNode } from "react";
import {
  Banknote,
  Coins,
  Minus,
  Percent,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

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
 * Bloque "Lo ganado en el período": Monto de cotizaciones ganadas / Utilidad /
 * Margen, con look de tarjeta financiera (ícono en círculo suave, números
 * prominentes y un chip de variación vs. el período anterior por moneda).
 * Consume el MISMO `useKpisConsolidadoQuery` que el strip (campo `cerrado`).
 *
 * Reglas de dinero (design D9): PEN/USD SIEMPRE separados, sin sumar ni convertir.
 * El margen dice "Sin cierres" cuando `montoGanado` de esa moneda es `0` (mirar el
 * monto, no `margenPct`, que es `0` legítimo con cierres sin ganancia); `margenPct`
 * llega en escala 0..100 y se divide /100 con variable nombrada antes de formatear.
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Resultado
              etiqueta="Monto de cotizaciones ganadas"
              descripcion="Facturado en cotizaciones ganadas"
              ayuda={DASHBOARD_AYUDA.montoGanado}
              icono={Banknote}
              claseIcono="text-emerald-500"
              claseFondo="bg-emerald-500/10"
            >
              <LineaMoneda
                valor={data.cerrado.montoGanado.pen}
                moneda="PEN"
                variacion={data.cerrado.variacionVsAnterior.montoGanado.pen}
              />
              <LineaMoneda
                valor={data.cerrado.montoGanado.usd}
                moneda="USD"
                variacion={data.cerrado.variacionVsAnterior.montoGanado.usd}
              />
            </Resultado>
            <Resultado
              etiqueta="Utilidad"
              descripcion="Ganancia de las cotizaciones ganadas"
              ayuda={DASHBOARD_AYUDA.utilidad}
              icono={Coins}
              claseIcono="text-teal-500"
              claseFondo="bg-teal-500/10"
            >
              <LineaMoneda
                valor={data.cerrado.utilidad.pen}
                moneda="PEN"
                variacion={data.cerrado.variacionVsAnterior.utilidad.pen}
              />
              <LineaMoneda
                valor={data.cerrado.utilidad.usd}
                moneda="USD"
                variacion={data.cerrado.variacionVsAnterior.utilidad.usd}
              />
            </Resultado>
            <Resultado
              etiqueta="Margen"
              descripcion="Ganancia sobre lo que cobraste"
              ayuda={DASHBOARD_AYUDA.margen}
              icono={Percent}
              claseIcono="text-amber-500"
              claseFondo="bg-amber-500/10"
            >
              <LineaMargen
                montoGanado={data.cerrado.montoGanado.pen}
                margenPct={data.cerrado.margenPct.pen}
                variacion={data.cerrado.variacionVsAnterior.margenPct.pen}
              />
              <LineaMargen
                montoGanado={data.cerrado.montoGanado.usd}
                margenPct={data.cerrado.margenPct.usd}
                variacion={data.cerrado.variacionVsAnterior.margenPct.usd}
              />
            </Resultado>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Columna del bloque: ícono en círculo suave + etiqueta arriba, las líneas de
 * valor en el medio (via `children`) y una descripción llana abajo.
 */
function Resultado({
  etiqueta,
  descripcion,
  ayuda,
  icono: Icono,
  claseIcono,
  claseFondo,
  children,
}: {
  etiqueta: string;
  descripcion: string;
  ayuda: string;
  icono: LucideIcon;
  claseIcono: string;
  claseFondo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            claseFondo
          )}
        >
          <Icono className={cn("size-5", claseIcono)} />
        </div>
        <span className="flex-1 text-sm font-medium text-muted-foreground">{etiqueta}</span>
        <AyudaMetrica descripcion={ayuda} />
      </div>
      <div className="flex flex-col gap-1">{children}</div>
      <span className="text-xs text-muted-foreground">{descripcion}</span>
    </div>
  );
}

/** Una línea de monto por moneda: número prominente + chip de variación (%). */
function LineaMoneda({
  valor,
  moneda,
  variacion,
}: {
  valor: number;
  moneda: "PEN" | "USD";
  variacion: number | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-2xl font-semibold tabular-nums">
        {formatearMoneda(valor, moneda)}
      </span>
      <ChipVariacion valor={variacion} unidad="pct" />
    </div>
  );
}

/**
 * Línea de margen por moneda. La regla mira `montoGanado` (no `margenPct`, que es
 * `0` legítimo con cierres sin ganancia): si no hubo cierres en esa moneda, dice
 * "Sin cierres". `margenPct` llega en escala 0..100 → se divide /100 con variable
 * nombrada antes de formatear. La variación del margen va en PUNTOS PORCENTUALES.
 */
function LineaMargen({
  montoGanado,
  margenPct,
  variacion,
}: {
  montoGanado: number;
  margenPct: number;
  variacion: number | null;
}) {
  if (montoGanado === 0) {
    return <span className="text-base font-normal text-muted-foreground">Sin cierres</span>;
  }

  const margenFraccion = margenPct / 100;

  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-2xl font-semibold tabular-nums">
        {formatearPorcentaje(margenFraccion)}
      </span>
      <ChipVariacion valor={variacion} unidad="pp" />
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
