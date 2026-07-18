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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { formatearMoneda } from "@/compartido/utilidades/formato-moneda";
import { formatearPorcentaje } from "@/compartido/utilidades/formato-porcentaje";

import { AyudaMetrica } from "./ayuda-metrica";
import { DASHBOARD_AYUDA } from "../dashboard-ayuda";
import { useRankingEjecutivosQuery } from "../servicios/dashboard-queries";
import type { RangoPeriodo } from "../tipos/dashboard.tipos";

/** Props del ranking (design D5): SOLO período, sin ejecutivo (D-restricción). */
type Props = { periodo: RangoPeriodo };

/**
 * Ranking de ejecutivos (design D4/gap #3, tarea 3.5; extendido tras BC03
 * commit `b8feebb` con `cantidadCreadas`/`cantidadEnviadas`/`utilidad`):
 * consume `useRankingEjecutivosQuery({ periodo })` — SIN prop de ejecutivo,
 * el ranking es siempre de equipo completo (el endpoint ignora
 * `idEjecutivoResponsable`, restricción verificada). Tabla ordenada por
 * `ganado.pen` descendente; "Cotiz." mapea a `cantidadCerradas` (gap #3);
 * `winRate` null-safe → "sin datos", nunca `0%`.
 *
 * Jerarquía visual (pedido explícito del negocio): la columna "Utilidad" es
 * el valor PROTAGONISTA — S/ y US$ en grande, siempre separados — con el
 * margen (`utilidad / ganado`, por moneda) como dato de apoyo chico al lado,
 * nunca al revés. Las dos efectividades (cotizadas/cierre) usan el mismo
 * tamaño discreto que "Win rate": son ratios de diagnóstico, no el foco de
 * la tarjeta.
 */
export function DashboardRanking({ periodo }: Props) {
  const { data, isLoading, isError, error } = useRankingEjecutivosQuery(periodo);

  const filas = [...(data ?? [])].sort((a, b) => b.ganado.pen - a.ganado.pen);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ranking de ejecutivos</CardTitle>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.ranking} />
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar el ranking de ejecutivos")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos en el período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ejecutivo</TableHead>
                <TableHead className="text-right">Ganado</TableHead>
                <TableHead className="text-right">Utilidad</TableHead>
                <TableHead className="text-right">Cotiz.</TableHead>
                <TableHead className="text-right">Win rate</TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">
                    Efect. cotizadas
                    <AyudaMetrica descripcion={DASHBOARD_AYUDA.efectividadCotizadas} />
                  </span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">
                    Efect. cierre
                    <AyudaMetrica descripcion={DASHBOARD_AYUDA.efectividadCierre} />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila) => {
                const efectividadCotizadas =
                  fila.cantidadCreadas === 0
                    ? null
                    : fila.cantidadEnviadas / fila.cantidadCreadas;
                const efectividadCierre =
                  fila.cantidadCreadas === 0
                    ? null
                    : fila.cantidadGanadas / fila.cantidadCreadas;

                return (
                  <TableRow key={fila.ejecutivoId}>
                    <TableCell className="font-medium">{fila.ejecutivoNombre}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span>{formatearMoneda(fila.ganado.pen, "PEN")}</span>
                        <span>{formatearMoneda(fila.ganado.usd, "USD")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <ColumnaUtilidad ganado={fila.ganado} utilidad={fila.utilidad} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fila.cantidadCerradas}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          fila.winRate === null ? "text-muted-foreground" : undefined
                        }
                      >
                        {formatearPorcentaje(fila.winRate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          efectividadCotizadas === null
                            ? "text-muted-foreground"
                            : undefined
                        }
                      >
                        {formatearPorcentaje(efectividadCotizadas)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          efectividadCierre === null ? "text-muted-foreground" : undefined
                        }
                      >
                        {formatearPorcentaje(efectividadCierre)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Columna "Utilidad": el valor PROTAGONISTA del ranking (pedido explícito
 * del negocio — "quiere ver la plata, no un porcentaje pelado"). PEN y USD
 * en líneas separadas, tamaño grande. El margen (`utilidad / ganado`, por
 * moneda) va como dato secundario chico junto al monto — nunca al revés.
 *
 * A diferencia de `TarjetaMargen` en `dashboard-kpis-consolidado.tsx`
 * (`margenPct` llega del backend ya en escala 0..100), acá el margen se
 * CALCULA en el front como fracción 0..1 (`utilidad / ganado`), así que va
 * directo a `formatearPorcentaje` sin dividir entre 100.
 *
 * Regla "Sin cierres" (mismo precedente que `TarjetaMargen`): si
 * `ganado[moneda] === 0` no hay denominador real, así que el margen de esa
 * moneda se muestra como "Sin cierres" en vez de un `0.0%` engañoso —
 * evaluado por moneda, no de forma global. La utilidad en sí NUNCA se
 * oculta ni se trata como `0`: puede ser NEGATIVA (cotización ganada bajo
 * costo) y se muestra tal cual, en rojo, para que se note.
 */
function ColumnaUtilidad({
  ganado,
  utilidad,
}: {
  ganado: { pen: number; usd: number };
  utilidad: { pen: number; usd: number };
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <LineaUtilidad moneda="PEN" monto={utilidad.pen} ganado={ganado.pen} />
      <LineaUtilidad moneda="USD" monto={utilidad.usd} ganado={ganado.usd} />
    </div>
  );
}

function LineaUtilidad({
  moneda,
  monto,
  ganado,
}: {
  moneda: "PEN" | "USD";
  monto: number;
  ganado: number;
}) {
  const esNegativo = monto < 0;
  const margen = ganado === 0 ? null : monto / ganado;

  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={`text-sm font-semibold tabular-nums ${
          esNegativo ? "text-rose-600 dark:text-rose-400" : ""
        }`}
      >
        {formatearMoneda(monto, moneda)}
      </span>
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {margen === null ? "Sin cierres" : formatearPorcentaje(margen)}
      </span>
    </div>
  );
}
