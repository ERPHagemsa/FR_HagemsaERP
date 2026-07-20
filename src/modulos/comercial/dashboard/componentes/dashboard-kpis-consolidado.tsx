"use client";

import type { ReactNode } from "react";
import {
  Banknote,
  Coins,
  FileText,
  Inbox,
  Percent,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { cn } from "@/compartido/utilidades";
import { formatearMoneda } from "@/compartido/utilidades/formato-moneda";
import { formatearPorcentaje } from "@/compartido/utilidades/formato-porcentaje";

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

const GRID_KPIS = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6";

/**
 * Strip de KPIs del período. Adopta el lenguaje visual de `CotizacionesKpis`
 * (tarjeta con borde + ícono arriba a la derecha + descripción abajo), SIN el
 * comportamiento de filtro clickeable: acá los KPIs son solo lectura.
 *
 * Cada tile es su PROPIA tarjeta (`bg-card ring-1`) en un grid, no van dentro
 * de un card contenedor — así se evita el anidado "caja dentro de caja".
 *
 * Los conteos (actividad) están anclados a la creación de la solicitud y la
 * plata (cerrado) a la fecha de cierre: son cohortes distintas y por eso nunca
 * se divide un conteo por un monto. El tile de "Tiempo para ganar" trae su
 * propia data (endpoint aparte), con su propio loading.
 */
export function DashboardKpisConsolidado({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useKpisConsolidadoQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar</AlertTitle>
        <AlertDescription>
          {extraerMensajeError(error, "No se pudo cargar el resumen del período")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={GRID_KPIS}>
      {isLoading || !data ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] w-full rounded-2xl" />
        ))
      ) : (
        <>
          <TarjetaKpi
            etiqueta="Solicitudes"
            descripcion="Recibidas en el período"
            icono={Inbox}
            claseIcono="text-sky-500"
          >
            <ValorSimple>{data.actividad.totalSolicitudes}</ValorSimple>
          </TarjetaKpi>
          <TarjetaKpi
            etiqueta="Cotizadas"
            descripcion="Con al menos una cotización"
            icono={FileText}
            claseIcono="text-indigo-500"
          >
            <ValorSimple>{data.actividad.cotizadas}</ValorSimple>
          </TarjetaKpi>
          <TarjetaKpi
            etiqueta="Monto ganado"
            descripcion="Facturado en ventas ganadas"
            icono={Banknote}
            claseIcono="text-emerald-500"
          >
            <ValorMoneda valores={data.cerrado.montoGanado} />
          </TarjetaKpi>
          <TarjetaKpi
            etiqueta="Utilidad"
            descripcion="Ganancia de las ventas ganadas"
            icono={Coins}
            claseIcono="text-teal-500"
          >
            <ValorMoneda valores={data.cerrado.utilidad} />
          </TarjetaKpi>
          <TarjetaKpi
            etiqueta="Margen"
            descripcion="Ganancia sobre lo que cobraste"
            icono={Percent}
            claseIcono="text-amber-500"
          >
            <ValorMargen
              montoGanado={data.cerrado.montoGanado}
              margenPct={data.cerrado.margenPct}
            />
          </TarjetaKpi>
        </>
      )}
      <TarjetaCiclo periodo={periodo} idEjecutivoResponsable={idEjecutivoResponsable} />
    </div>
  );
}

/**
 * Tarjeta base del strip (estilo `CotizacionesKpis`): header con etiqueta a la
 * izquierda + ícono coloreado a la derecha, el valor en el medio (via
 * `children`) y una descripción llana abajo. Las clases de color del ícono se
 * pasan como string estático (Tailwind v4 no purga strings interpolados).
 */
function TarjetaKpi({
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
    <div className="flex h-full flex-col gap-1 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{etiqueta}</span>
        <Icono className={cn("size-4 shrink-0", claseIcono)} />
      </div>
      {children}
      <span className="mt-auto pt-2 text-[11px] text-muted-foreground">{descripcion}</span>
    </div>
  );
}

function ValorSimple({ children }: { children: ReactNode }) {
  return <span className="text-lg font-semibold tabular-nums">{children}</span>;
}

function ValorMoneda({ valores }: { valores: TotalPorMoneda }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold tabular-nums">
        {formatearMoneda(valores.pen, "PEN")}
      </span>
      <span className="text-lg font-semibold tabular-nums">
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
    <div className="flex flex-col">
      <span className="text-lg font-semibold tabular-nums">
        {montoGanado.pen === 0 ? (
          <span className="text-sm font-normal text-muted-foreground">Sin cierres</span>
        ) : (
          formatearPorcentaje(margenPenFraccion)
        )}
      </span>
      <span className="text-lg font-semibold tabular-nums">
        {montoGanado.usd === 0 ? (
          <span className="text-sm font-normal text-muted-foreground">Sin cierres</span>
        ) : (
          formatearPorcentaje(margenUsdFraccion)
        )}
      </span>
    </div>
  );
}

/**
 * "Tiempo para ganar" (antes "Ciclo de cierre"): días promedio desde que se
 * crea una cotización hasta que se gana. Trae su propia data para no acoplar el
 * fetch de kpis-consolidado con el de ciclo — cada uno con su propio loading.
 */
function TarjetaCiclo({ periodo, idEjecutivoResponsable }: PropsPeriodoEjecutivo) {
  const { data, isLoading } = useCicloCierreQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  return (
    <TarjetaKpi
      etiqueta="Tiempo para ganar"
      descripcion="Días desde crear hasta ganar"
      icono={Timer}
      claseIcono="text-violet-500"
    >
      {isLoading || !data ? (
        <span className="text-sm text-muted-foreground">…</span>
      ) : data.cicloPromedioDias === null ? (
        <span className="text-sm text-muted-foreground">Sin cierres</span>
      ) : (
        <div className="flex flex-col">
          <span className="text-lg font-semibold tabular-nums">
            {data.cicloPromedioDias.toFixed(1)} días
          </span>
          <VariacionCiclo variacion={data.variacionVsMesAnterior} />
        </div>
      )}
    </TarjetaKpi>
  );
}

/**
 * Variación del ciclo, convención "menos es mejor": delta negativo (se acortó)
 * = verde/mejora, positivo (se alargó) = rojo/deterioro. Signo crudo del
 * backend, sin invertir. `null` no renderiza nada.
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
