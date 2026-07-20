"use client";

import type { ReactNode } from "react";
import { Banknote, Coins, Percent, type LucideIcon } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  Card,
  CardContent,
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
import type {
  IdEjecutivoFiltro,
  PorcentajePorMoneda,
  RangoPeriodo,
  TotalPorMoneda,
} from "../tipos/dashboard.tipos";

type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/**
 * Bloque "Resultados del período": Monto ganado / Utilidad / Margen, sacados del
 * strip apretado a su propio card con más aire (números prominentes, PEN y USD
 * separados en columnas). Consume el MISMO `useKpisConsolidadoQuery` que el strip
 * (campo `cerrado`), anclado a la fecha de cierre.
 *
 * Reglas de dinero (design D9): PEN/USD SIEMPRE separados, sin sumar ni convertir;
 * el margen dice "Sin cierres" cuando `montoGanado` de esa moneda es `0` (mirar el
 * monto, no `margenPct`, que es `0` legítimo con cierres sin ganancia); `margenPct`
 * llega en escala 0..100 y se divide /100 con variable nombrada antes de formatear.
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Resultados del período</CardTitle>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.cerradoPeriodo} />
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar los resultados del período")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Resultado
              etiqueta="Monto ganado"
              descripcion="Facturado en ventas ganadas"
              icono={Banknote}
              claseIcono="text-emerald-500"
            >
              <ValorMoneda valores={data.cerrado.montoGanado} />
            </Resultado>
            <Resultado
              etiqueta="Utilidad"
              descripcion="Ganancia de las ventas ganadas"
              icono={Coins}
              claseIcono="text-teal-500"
            >
              <ValorMoneda valores={data.cerrado.utilidad} />
            </Resultado>
            <Resultado
              etiqueta="Margen"
              descripcion="Ganancia sobre lo que cobraste"
              icono={Percent}
              claseIcono="text-amber-500"
            >
              <ValorMargen
                montoGanado={data.cerrado.montoGanado}
                margenPct={data.cerrado.margenPct}
              />
            </Resultado>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Columna del bloque: etiqueta + ícono coloreado arriba, valor prominente en el
 * medio (via `children`) y una descripción llana abajo. Mismo patrón de color de
 * ícono que el strip (string estático, Tailwind v4 no purga interpolados).
 */
function Resultado({
  etiqueta,
  descripcion,
  icono: Icono,
  claseIcono,
  children,
}: {
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
  claseIcono: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{etiqueta}</span>
        <Icono className={cn("size-4 shrink-0", claseIcono)} />
      </div>
      {children}
      <span className="text-xs text-muted-foreground">{descripcion}</span>
    </div>
  );
}

/** Monto por moneda: PEN y USD apilados, sin sumar ni convertir. */
function ValorMoneda({ valores }: { valores: TotalPorMoneda }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-semibold tabular-nums">
        {formatearMoneda(valores.pen, "PEN")}
      </span>
      <span className="text-2xl font-semibold tabular-nums">
        {formatearMoneda(valores.usd, "USD")}
      </span>
    </div>
  );
}

/**
 * Margen por moneda: la regla mira `montoGanado`, NO `margenPct` (que es `0`
 * legítimo cuando hubo cierres sin ganancia). Si no hubo cierres en esa moneda,
 * dice "Sin cierres" en vez de un `0.0%` engañoso. `margenPct` llega en escala
 * 0..100 (backend `* 100`); `formatearPorcentaje` asume fracción 0..1, por eso
 * se convierte con una variable nombrada antes de formatear.
 */
function ValorMargen({
  montoGanado,
  margenPct,
}: {
  montoGanado: TotalPorMoneda;
  margenPct: PorcentajePorMoneda;
}) {
  const margenPenFraccion = margenPct.pen / 100;
  const margenUsdFraccion = margenPct.usd / 100;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-semibold tabular-nums">
        {montoGanado.pen === 0 ? (
          <span className="text-base font-normal text-muted-foreground">Sin cierres</span>
        ) : (
          formatearPorcentaje(margenPenFraccion)
        )}
      </span>
      <span className="text-2xl font-semibold tabular-nums">
        {montoGanado.usd === 0 ? (
          <span className="text-base font-normal text-muted-foreground">Sin cierres</span>
        ) : (
          formatearPorcentaje(margenUsdFraccion)
        )}
      </span>
    </div>
  );
}
