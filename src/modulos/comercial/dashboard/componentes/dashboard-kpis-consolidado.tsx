"use client";

import type { ReactNode } from "react";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Card, CardContent } from "@/compartido/componentes/ui/card";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { formatearMoneda } from "@/compartido/utilidades/formato-moneda";
import { formatearPorcentaje } from "@/compartido/utilidades/formato-porcentaje";

import { AyudaMetrica } from "./ayuda-metrica";
import { DASHBOARD_AYUDA } from "../dashboard-ayuda";
import { useCicloCierreQuery, useKpisConsolidadoQuery } from "../servicios/dashboard-queries";
import type {
  IdEjecutivoFiltro,
  PorcentajePorMoneda,
  RangoPeriodo,
  TotalPorMoneda,
} from "../tipos/dashboard.tipos";

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/**
 * Tira compacta de KPIs del período (cambio de UI, pedido de producto): una
 * sola fila de tiles angostos, sin título de card ni sub-encabezados —
 * "roban espacio y son obvios". Los 4 primeros son conteos de ACTIVIDAD
 * (anclados a la creación de la solicitud) y los 3 últimos son plata CERRADA
 * (anclada a la fecha de cierre): son cohortes distintas y por eso NUNCA se
 * divide un conteo por un monto. La distinción de anclaje, antes en los
 * encabezados, ahora vive en los popovers de ayuda de "Perdidas" y "Margen".
 * La respuesta siempre trae ambos grupos, por eso no hay rama de "vacío": los
 * ceros se muestran como ceros.
 */
export function DashboardKpisConsolidado({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useKpisConsolidadoQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  return (
    <Card size="sm">
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar el resumen del período")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <TarjetaEntero etiqueta="Solicitudes" valor={data.actividad.totalSolicitudes} />
            <TarjetaEntero etiqueta="Cotizadas" valor={data.actividad.cotizadas} />
            <TarjetaMoneda etiqueta="Monto ganado" valores={data.cerrado.montoGanado} />
            <TarjetaMoneda etiqueta="Utilidad" valores={data.cerrado.utilidad} />
            <TarjetaMargen
              montoGanado={data.cerrado.montoGanado}
              margenPct={data.cerrado.margenPct}
            />
            <TarjetaCiclo
              periodo={periodo}
              idEjecutivoResponsable={idEjecutivoResponsable}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Etiqueta micro de KPI: mayúsculas, atenuada, ocupa lo mínimo. */
function EtiquetaKpi({ children, ayuda }: { children: ReactNode; ayuda?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {children}
      </span>
      {ayuda ? <AyudaMetrica descripcion={ayuda} /> : null}
    </div>
  );
}

/**
 * `ayuda` es opcional: solo la usan métricas con una regla de negocio que no
 * es obvia por el nombre (p. ej. "Perdidas" excluye VENCIDA/CANCELADA).
 */
function TarjetaEntero({
  etiqueta,
  valor,
  ayuda,
}: {
  etiqueta: string;
  valor: number;
  ayuda?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-3 py-2">
      <EtiquetaKpi ayuda={ayuda}>{etiqueta}</EtiquetaKpi>
      <span className="text-xl font-semibold tabular-nums">{valor}</span>
    </div>
  );
}

function TarjetaMoneda({
  etiqueta,
  valores,
}: {
  etiqueta: string;
  valores: TotalPorMoneda;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-3 py-2">
      <EtiquetaKpi>{etiqueta}</EtiquetaKpi>
      <div className="flex flex-col">
        <span className="text-sm font-semibold tabular-nums">
          {formatearMoneda(valores.pen, "PEN")}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {formatearMoneda(valores.usd, "USD")}
        </span>
      </div>
    </div>
  );
}

/**
 * Margen por moneda: la regla mira `montoGanado`, NO `margenPct` (que es `0`
 * legítimo cuando hubo cierres sin ganancia). Si no hubo cierres en esa
 * moneda, la celda dice "Sin cierres" en vez de un `0.0%` engañoso.
 * Evaluación POR MONEDA: PEN puede tener cierres y USD no (o viceversa).
 *
 * `margenPct` llega YA en escala 0..100 (backend: `20` significa `20%`, ver
 * comentario en `dashboard.tipos.ts`). `formatearPorcentaje` asume fracción
 * 0..1, así que acá se convierte explícitamente ANTES de formatear —
 * variable nombrada `margenFraccion`, no un `/100` perdido en el JSX.
 */
function TarjetaMargen({
  montoGanado,
  margenPct,
}: {
  montoGanado: TotalPorMoneda;
  margenPct: PorcentajePorMoneda;
}) {
  const margenPenFraccion = margenPct.pen / 100;
  const margenUsdFraccion = margenPct.usd / 100;

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-3 py-2">
      <EtiquetaKpi ayuda={DASHBOARD_AYUDA.margen}>Margen</EtiquetaKpi>
      <div className="flex flex-col">
        <span className="text-sm font-semibold tabular-nums">
          {montoGanado.pen === 0 ? (
            <span className="text-muted-foreground">Sin cierres</span>
          ) : (
            formatearPorcentaje(margenPenFraccion)
          )}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {montoGanado.usd === 0 ? (
            <span className="text-muted-foreground">Sin cierres</span>
          ) : (
            formatearPorcentaje(margenUsdFraccion)
          )}
        </span>
      </div>
    </div>
  );
}

/**
 * Ciclo de cierre como TILE del strip (pedido de producto: al nivel de los
 * KPIs, no como widget suelto que desperdiciaba todo el ancho en un solo
 * número). Trae su propia data (`useCicloCierreQuery`) para no acoplar el
 * fetch de kpis-consolidado con el de ciclo — cada uno con su propio loading.
 */
function TarjetaCiclo({ periodo, idEjecutivoResponsable }: PropsPeriodoEjecutivo) {
  const { data, isLoading } = useCicloCierreQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-3 py-2">
      <EtiquetaKpi ayuda={DASHBOARD_AYUDA.cicloCierre}>Ciclo de cierre</EtiquetaKpi>
      {isLoading || !data ? (
        <span className="text-sm text-muted-foreground">…</span>
      ) : data.cicloPromedioDias === null ? (
        <span className="text-sm text-muted-foreground">Sin cierres</span>
      ) : (
        <>
          <span className="text-xl font-semibold tabular-nums">
            {data.cicloPromedioDias.toFixed(1)} días
          </span>
          <VariacionCiclo variacion={data.variacionVsMesAnterior} />
        </>
      )}
    </div>
  );
}

/**
 * Variación del ciclo, convención "menos es mejor": delta negativo (se acortó)
 * = verde/mejora, positivo (se alargó) = rojo/deterioro. Signo crudo del
 * backend, sin invertir. `null` no renderiza nada (tile compacto).
 */
function VariacionCiclo({ variacion }: { variacion: number | null }) {
  if (variacion === null) return null;

  const esMejora = variacion < 0;
  const esDeterioro = variacion > 0;
  const color = esMejora
    ? "text-emerald-600 dark:text-emerald-400"
    : esDeterioro
      ? "text-rose-600 dark:text-rose-400"
      : "text-muted-foreground";
  const signo = variacion > 0 ? "+" : "";

  return (
    <span className={`text-xs tabular-nums ${color}`}>
      {signo}
      {variacion.toFixed(1)} d vs. anterior
    </span>
  );
}
