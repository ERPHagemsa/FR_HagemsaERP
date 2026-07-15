"use client";

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
import { useResumenCotizacionesQuery } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-queries";
import type { ResumenCotizaciones } from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos";
import { useResumenSolicitudesQuery } from "@/modulos/comercial/solicitudes-cliente/servicios/solicitudes-cliente-queries";
import type { ResumenSolicitudesCliente } from "@/modulos/comercial/solicitudes-cliente/tipos/solicitud-cliente.tipos";

import type { DashboardKpisProps } from "../tipos/dashboard.tipos";

type Tarjeta = { etiqueta: string; valor: number };

function tarjetasCotizaciones(resumen: ResumenCotizaciones | null): Tarjeta[] {
  return [
    { etiqueta: "En preparación", valor: resumen?.enPreparacion ?? 0 },
    { etiqueta: "Pend. aprobación", valor: resumen?.pendientesAprobacion ?? 0 },
    { etiqueta: "Enviadas", valor: resumen?.enviadas ?? 0 },
    { etiqueta: "Ganadas", valor: resumen?.ganadas ?? 0 },
    { etiqueta: "Perdidas", valor: resumen?.perdidas ?? 0 },
    { etiqueta: "Total", valor: resumen?.total ?? 0 },
  ];
}

function tarjetasSolicitudes(resumen: ResumenSolicitudesCliente | null): Tarjeta[] {
  return [
    { etiqueta: "Sin cotizar", valor: resumen?.disponibles ?? 0 },
    { etiqueta: "En cotización", valor: resumen?.enCotizacion ?? 0 },
    { etiqueta: "Sin respuesta", valor: resumen?.sinRespuesta ?? 0 },
    { etiqueta: "Cotizadas", valor: resumen?.cotizadas ?? 0 },
    { etiqueta: "Total", valor: resumen?.total ?? 0 },
  ];
}

/**
 * Franja de KPI del dashboard (design D4, spec "Franja de KPI del embudo" +
 * "Rotulado explícito del alcance temporal"): conteos de Cotizaciones y
 * Solicitudes, presentacional puro — no clicable (indicador, no filtro).
 * Cotizaciones respeta el filtro de ejecutivo vigente; Solicitudes queda a
 * nivel área (`FiltrosResumenSolicitudes` no acepta `idEjecutivoResponsable`
 * — restricción verificada en design.md). El frontend no calcula
 * agregaciones de negocio: solo muestra los conteos que devuelve cada
 * `/resumen`.
 */
export function DashboardKpis({ idEjecutivoResponsable }: DashboardKpisProps) {
  const cotizaciones = useResumenCotizacionesQuery({ idEjecutivoResponsable });
  const solicitudes = useResumenSolicitudesQuery({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Totales del área (histórico)</CardTitle>
        <CardDescription>
          Conteos acumulados bajo el filtro de ejecutivo vigente — no son
          cifras del mes ni del periodo en curso.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <SeccionResumen
          titulo="Cotizaciones"
          isLoading={cotizaciones.isLoading}
          isError={cotizaciones.isError}
          mensajeError={extraerMensajeError(
            cotizaciones.error,
            "No se pudo cargar el resumen de cotizaciones"
          )}
          tarjetas={tarjetasCotizaciones(cotizaciones.data)}
        />
        <SeccionResumen
          titulo="Solicitudes"
          isLoading={solicitudes.isLoading}
          isError={solicitudes.isError}
          mensajeError={extraerMensajeError(
            solicitudes.error,
            "No se pudo cargar el resumen de solicitudes"
          )}
          tarjetas={tarjetasSolicitudes(solicitudes.data)}
        />
      </CardContent>
    </Card>
  );
}

type SeccionResumenProps = {
  titulo: string;
  isLoading: boolean;
  isError: boolean;
  mensajeError: string;
  tarjetas: Tarjeta[];
};

function SeccionResumen({
  titulo,
  isLoading,
  isError,
  mensajeError,
  tarjetas,
}: SeccionResumenProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{titulo}</span>
      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar {titulo.toLowerCase()}</AlertTitle>
          <AlertDescription>{mensajeError}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {tarjetas.map((tarjeta) => (
            <div
              key={tarjeta.etiqueta}
              className="flex flex-col gap-1 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10"
            >
              <span className="text-[11px] text-muted-foreground">
                {tarjeta.etiqueta}
              </span>
              {isLoading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                <span className="text-2xl font-semibold tabular-nums">
                  {tarjeta.valor}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
