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
 * Ranking de ejecutivos (design D4/gap #3, tarea 3.5; contrato corregido tras
 * BC03 commit `2bbb181`, ver JSDoc de `RankingEjecutivoRespuesta`): consume
 * `useRankingEjecutivosQuery({ periodo })` — SIN prop de ejecutivo, el
 * ranking es siempre de equipo completo (el endpoint ignora
 * `idEjecutivoResponsable`, restricción verificada). El ORDEN lo entrega el
 * backend (`DashboardDineroPorEjecutivoQuery`: `ORDER BY ganado_pen DESC,
 * ganado_usd DESC`) — el front NO re-ordena, renderiza tal como llega;
 * `winRate` null-safe → "sin datos", nunca `0%`.
 *
 * La columna "Cotiz." (que mostraba `cantidadCerradas`) se ELIMINÓ junto con
 * el campo en el backend — pedido explícito de producto, ya era redundante
 * con "Ganadas / Total".
 *
 * Jerarquía visual (pedido explícito del negocio + pase de estilo tipo
 * dashboard financiero minimalista): "Utilidad" es el valor PROTAGONISTA
 * (S/ y US$ en semibold, margen de apoyo chico al lado, nunca al revés).
 * Un escalón abajo va "Ganado": su línea PEN en tinta foreground + medium
 * —es la métrica de ORDEN, tiene que leerse— con el USD muted debajo. Los
 * ratios ("Ganadas / Enviadas" y "Cotizados / Total") resaltan el NUMERADOR
 * en foreground y apagan el denominador en muted: truco tipográfico, sin
 * color. El win rate lleva una mini-barra fina emerald bajo el número —es el
 * ÚNICO acento de color de la tabla, más el rojo de la utilidad negativa, a
 * propósito para no parecer una feria—. Un número de posición muted antecede
 * al nombre para que se lea como ranking.
 *
 * Formato de división LITERAL (pedido explícito, corrección post-review):
 * estas dos columnas muestran `enviadas/delPeriodo` y
 * `ganadasDelPeriodo/enviadas` como texto crudo (ej. `9/16` y `1/9`), NO
 * como porcentaje — a diferencia de "Win rate", que sí usa
 * `formatearPorcentaje`. No pasar estos dos valores por ese helper.
 *
 * "Ganadas / Enviadas" (pedido explícito de producto, cambio
 * `dashboard-kpis-motivos-respuesta-front`): el denominador de esta columna
 * pasó de `cantidadDelPeriodo` a `cantidadEnviadas`, encadenando con
 * "Cotizados / Total" (`enviadas/delPeriodo`). El ORDEN en pantalla es
 * drill-down (pedido explícito): primero "Ganadas / Enviadas" (el cierre) y
 * después "Cotizados / Total" (la base), leyendo del resultado hacia el
 * detalle. Por eso "Ganadas / Enviadas" tiene su PROPIA condición de "sin
 * datos" (`cantidadEnviadas === 0`), distinta de la de "Cotizados / Total"
 * (`cantidadDelPeriodo === 0`) — no unificar ambas condiciones.
 */
export function DashboardRanking({ periodo }: Props) {
  const { data, isLoading, isError, error } = useRankingEjecutivosQuery(periodo);

  // El orden del ranking es lógica de negocio y vive en el backend
  // (`DashboardDineroPorEjecutivoQuery`: ORDER BY ganado_pen DESC, ganado_usd
  // DESC). El front NO re-ordena: renderiza las filas tal como llegan. Si el
  // criterio cambia, se cambia en el SQL y esto lo sigue sin tocar nada.
  const filas = data ?? [];

  return (
    <Card size="sm">
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
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">
                    Win rate
                    <AyudaMetrica descripcion={DASHBOARD_AYUDA.winRate} />
                  </span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">
                    Ganadas / Enviadas
                    <AyudaMetrica descripcion={DASHBOARD_AYUDA.efectividadCierre} />
                  </span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">
                    Cotizados / Total
                    <AyudaMetrica descripcion={DASHBOARD_AYUDA.efectividadCotizadas} />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila, indice) => {
                const sinActividad = fila.cantidadDelPeriodo === 0;
                const sinEnviadas = fila.cantidadEnviadas === 0;

                return (
                  <TableRow key={fila.ejecutivoId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 shrink-0 text-right text-xs font-normal tabular-nums text-muted-foreground">
                          {indice + 1}
                        </span>
                        <span>{fila.ejecutivoNombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end tabular-nums">
                        <span className="text-sm font-medium">
                          {formatearMoneda(fila.ganado.pen, "PEN")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatearMoneda(fila.ganado.usd, "USD")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <ColumnaUtilidad ganado={fila.ganado} utilidad={fila.utilidad} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ColumnaWinRate winRate={fila.winRate} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ColumnaRatio
                        numerador={fila.cantidadGanadasDelPeriodo}
                        denominador={fila.cantidadEnviadas}
                        vacio={sinEnviadas}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <ColumnaRatio
                        numerador={fila.cantidadEnviadas}
                        denominador={fila.cantidadDelPeriodo}
                        vacio={sinActividad}
                      />
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

/**
 * Columna "Win rate": el número (fracción 0..1 → %) con una mini-barra fina
 * debajo cuyo ancho es el propio win rate. Es el ÚNICO acento de color de la
 * tabla (emerald), a propósito: la barra da magnitud de un vistazo sin tener
 * que pintar el número. `null` (sin cotizaciones resueltas) → "Sin datos" sin
 * barra, coherente con `formatearPorcentaje(null)`.
 */
function ColumnaWinRate({ winRate }: { winRate: number | null }) {
  if (winRate === null) {
    return <span className="text-sm text-muted-foreground">Sin datos</span>;
  }

  const anchoPorcentaje = Math.max(0, Math.min(1, winRate)) * 100;

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-sm tabular-nums">{formatearPorcentaje(winRate)}</span>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${anchoPorcentaje}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Columna de ratio literal (ej. "6/10"): el NUMERADOR en tinta foreground (el
 * número que importa) y el denominador en muted — truco tipográfico puro, sin
 * color, para que el ojo lea la parte relevante. `vacio` (denominador 0) →
 * "Sin datos", nunca un "0/0" engañoso.
 */
function ColumnaRatio({
  numerador,
  denominador,
  vacio,
}: {
  numerador: number;
  denominador: number;
  vacio: boolean;
}) {
  if (vacio) {
    return <span className="text-sm text-muted-foreground">Sin datos</span>;
  }

  return (
    <span className="tabular-nums">
      <span className="text-sm font-medium">{numerador}</span>
      <span className="text-xs text-muted-foreground">/{denominador}</span>
    </span>
  );
}
