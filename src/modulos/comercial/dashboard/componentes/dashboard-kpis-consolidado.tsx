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

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/**
 * Resumen consolidado del período (cambio
 * dashboard-kpis-motivos-respuesta-front): consume
 * `useKpisConsolidadoQuery`. Dos bloques con encabezado y ayuda PROPIOS,
 * nunca una fila plana homogénea — "Actividad" está anclada a la creación
 * de la solicitud y "Cerrado" a la fecha de cierre: son cohortes distintas,
 * jamás se divide un número de una contra el de la otra. La respuesta
 * siempre trae ambos bloques (nunca `undefined`), por eso no hay rama de
 * "vacío": los ceros se muestran como ceros.
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Resumen del período</CardTitle>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.resumenPeriodo} />
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar el resumen del período")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {["solicitudes", "cotizadas", "ganadas", "perdidas"].map((clave) => (
                <Skeleton key={clave} className="h-24 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {["ganado", "utilidad", "margen"].map((clave) => (
                <Skeleton key={clave} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Actividad del período
                </h3>
                <AyudaMetrica descripcion={DASHBOARD_AYUDA.actividadPeriodo} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TarjetaEntero
                  etiqueta="Solicitudes"
                  valor={data.actividad.totalSolicitudes}
                />
                <TarjetaEntero etiqueta="Cotizadas" valor={data.actividad.cotizadas} />
                <TarjetaEntero etiqueta="Ganadas" valor={data.actividad.ganadas} />
                <TarjetaEntero
                  etiqueta="Perdidas"
                  valor={data.actividad.perdidas}
                  ayuda={DASHBOARD_AYUDA.perdidas}
                />
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Cerrado en el período
                </h3>
                <AyudaMetrica descripcion={DASHBOARD_AYUDA.cerradoPeriodo} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TarjetaMoneda etiqueta="Monto ganado" valores={data.cerrado.montoGanado} />
                <TarjetaMoneda etiqueta="Utilidad" valores={data.cerrado.utilidad} />
                <TarjetaMargen
                  montoGanado={data.cerrado.montoGanado}
                  margenPct={data.cerrado.margenPct}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * `ayuda` es opcional: solo la usan métricas con una regla de negocio que no
 * es obvia por el nombre (p. ej. "Perdidas" excluye VENCIDA/CANCELADA). Las
 * demás tarjetas de este tipo se apoyan en la ayuda del bloque
 * (`actividadPeriodo`), igual que "Solicitudes"/"Cotizadas"/"Ganadas".
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
    <div className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground">{etiqueta}</span>
        {ayuda ? <AyudaMetrica descripcion={ayuda} /> : null}
      </div>
      <span className="text-2xl font-semibold tabular-nums">{valor}</span>
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
    <div className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <span className="text-xs font-medium text-muted-foreground">{etiqueta}</span>
      <span className="text-sm font-semibold tabular-nums">
        {formatearMoneda(valores.pen, "PEN")}
      </span>
      <span className="text-sm font-semibold tabular-nums">
        {formatearMoneda(valores.usd, "USD")}
      </span>
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
    <div className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground">Margen</span>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.margen} />
      </div>
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
  );
}
