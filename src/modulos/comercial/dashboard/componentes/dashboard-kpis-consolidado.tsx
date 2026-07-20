"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlarmClock,
  ClipboardCheck,
  FileQuestion,
  FileText,
  Inbox,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { cn } from "@/compartido/utilidades";
import { useResumenCotizacionesQuery } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-queries";
import { useResumenSolicitudesQuery } from "@/modulos/comercial/solicitudes-cliente/servicios/solicitudes-cliente-queries";

import { useCicloCierreQuery, useKpisConsolidadoQuery } from "../servicios/dashboard-queries";
import type { IdEjecutivoFiltro, RangoPeriodo } from "../tipos/dashboard.tipos";

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

const GRID_KPIS = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6";

/**
 * Strip de KPIs del período. Adopta el lenguaje visual de `CotizacionesKpis`
 * (tarjeta con borde + ícono arriba a la derecha + descripción abajo).
 *
 * Seis tiles en una sola franja, de dos naturalezas distintas:
 * - Estado del período (Solicitudes, Cotizadas): salen de `useKpisConsolidadoQuery`,
 *   anclados a la creación de la solicitud. Solo lectura.
 * - Estado ACTUAL, clickeables (Por vencer, Esperando aprobación, Sin cotizar):
 *   NO dependen del período (como el viejo acciones-pendientes). Cada uno trae su
 *   propia data y navega al listado filtrado por su bucket. "Por vencer" y
 *   "Esperando aprobación" comparten UNA sola llamada al resumen de cotizaciones;
 *   "Sin cotizar" viene del resumen de solicitudes (sin ejecutivo: una solicitud
 *   sin cotizar no tiene ejecutivo asignado).
 * - "Tiempo para ganar" (`TarjetaCiclo`): endpoint aparte, con su propio loading.
 *
 * Cada tile es su PROPIA tarjeta (`bg-card ring-1`) en un grid, no van dentro de
 * un card contenedor — así se evita el anidado "caja dentro de caja".
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
        Array.from({ length: 2 }).map((_, i) => (
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
        </>
      )}
      <TarjetaCiclo periodo={periodo} idEjecutivoResponsable={idEjecutivoResponsable} />
      <TarjetasPipelineCotizaciones idEjecutivoResponsable={idEjecutivoResponsable} />
      <TarjetaSinCotizar />
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

/**
 * Variante clickeable de `TarjetaKpi`: mismo lenguaje visual, envuelta en un
 * `Link` que navega al listado filtrado por el bucket del KPI. Suma afordancia
 * de click (`cursor-pointer` + realce del ring en hover).
 */
function TarjetaKpiLink({
  etiqueta,
  descripcion,
  icono: Icono,
  claseIcono,
  href,
  children,
}: {
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
  claseIcono: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-full cursor-pointer flex-col gap-1 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/25"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{etiqueta}</span>
        <Icono className={cn("size-4 shrink-0", claseIcono)} />
      </div>
      {children}
      <span className="mt-auto pt-2 text-[11px] text-muted-foreground">{descripcion}</span>
    </Link>
  );
}

function ValorSimple({ children }: { children: ReactNode }) {
  return <span className="text-lg font-semibold tabular-nums">{children}</span>;
}

/** Placeholder chico mientras un tile clickeable resuelve su propia data. */
function ValorCargando() {
  return <span className="text-sm text-muted-foreground">…</span>;
}

/**
 * Dos tiles clickeables que salen de UNA sola llamada al resumen de cotizaciones
 * (no dependen del período, sí del ejecutivo): "Por vencer" (subconjunto de las
 * ENVIADA que caducan en <=3 días) y "Esperando aprobación". Cada uno navega a su
 * bucket del listado.
 */
function TarjetasPipelineCotizaciones({
  idEjecutivoResponsable,
}: {
  idEjecutivoResponsable: IdEjecutivoFiltro;
}) {
  const { data, isLoading } = useResumenCotizacionesQuery({ idEjecutivoResponsable });
  const cargando = isLoading || !data;

  return (
    <>
      <TarjetaKpiLink
        etiqueta="Por vencer"
        descripcion="Enviadas que vencen en ≤3 días"
        icono={AlarmClock}
        claseIcono="text-amber-500"
        href="/comercial/cotizaciones?bucket=porVencer"
      >
        {cargando ? <ValorCargando /> : <ValorSimple>{data.porVencer}</ValorSimple>}
      </TarjetaKpiLink>
      <TarjetaKpiLink
        etiqueta="Esperando aprobación"
        descripcion="Requieren aprobación interna"
        icono={ClipboardCheck}
        claseIcono="text-indigo-500"
        href="/comercial/cotizaciones?bucket=pendientesAprobacion"
      >
        {cargando ? <ValorCargando /> : <ValorSimple>{data.pendientesAprobacion}</ValorSimple>}
      </TarjetaKpiLink>
    </>
  );
}

/**
 * Tile clickeable "Sin cotizar": solicitudes sin ninguna cotización. Trae su
 * propia data del resumen de solicitudes SIN ejecutivo (invariante de dominio:
 * una solicitud sin cotizar no tiene ejecutivo asignado). No depende del período.
 */
function TarjetaSinCotizar() {
  const { data, isLoading } = useResumenSolicitudesQuery();
  const cargando = isLoading || !data;

  return (
    <TarjetaKpiLink
      etiqueta="Sin cotizar"
      descripcion="Solicitudes sin cotización"
      icono={FileQuestion}
      claseIcono="text-sky-500"
      href="/comercial/solicitudes-cliente?bucket=disponibles"
    >
      {cargando ? <ValorCargando /> : <ValorSimple>{data.disponibles}</ValorSimple>}
    </TarjetaKpiLink>
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
