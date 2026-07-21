"use client";

import { Cell, Pie, PieChart } from "recharts";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/compartido/componentes/ui/chart";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { AyudaMetrica } from "./ayuda-metrica";
import { DASHBOARD_AYUDA } from "../dashboard-ayuda";
import { useMotivosRespuestaClienteQuery } from "../servicios/dashboard-queries";
import type {
  IdEjecutivoFiltro,
  MotivoRespuestaClienteAgrupado,
  RangoPeriodo,
} from "../tipos/dashboard.tipos";

// Paleta categórica validada (CVD-safe en claro y oscuro, ver globals.css). El
// color se asigna por CÓDIGO —no por ranking—, así un motivo conserva su color
// aunque cambie su cantidad al mover el período.
const PALETA_MOTIVOS = [
  "var(--dataviz-cat-1)",
  "var(--dataviz-cat-2)",
  "var(--dataviz-cat-3)",
  "var(--dataviz-cat-4)",
  "var(--dataviz-cat-5)",
  "var(--dataviz-cat-6)",
];

/** Props de widgets period-scoped + ejecutivo (design D5): el estado elevado en `DashboardVista`. */
type PropsPeriodoEjecutivo = {
  periodo: RangoPeriodo;
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/**
 * Respuesta del cliente ante nuestras cotizaciones (cambio
 * dashboard-kpis-motivos-respuesta-front): consume
 * `useMotivosRespuestaClienteQuery`. A diferencia de "Motivos de pérdida"
 * (`DashboardMotivosPerdida`, texto libre del ejecutivo, agrupación
 * best-effort) esto viene de un CATÁLOGO cerrado elegido por el CLIENTE —
 * clona el patrón visual (BarChart vertical + ChartContainer) sin fusionarse
 * con ese componente, porque son dos conceptos de backend distintos.
 * Se particiona por `tipo` (RECHAZO/NEGOCIACION) preservando el orden que ya
 * trae el backend (cantidad DESC); cada sub-bloque tiene su propio estado
 * vacío porque un tipo puede venir vacío y el otro con datos.
 */
export function DashboardMotivosRespuestaCliente({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useMotivosRespuestaClienteQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  const motivos = data?.motivos ?? [];
  const rechazos = motivos.filter((motivo) => motivo.tipo === "RECHAZO");
  const negociaciones = motivos.filter((motivo) => motivo.tipo === "NEGOCIACION");

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Respuesta del cliente</CardTitle>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.motivosRespuestaCliente} />
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(
                error,
                "No se pudieron cargar las respuestas del cliente"
              )}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : motivos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin respuestas de clientes registradas en el período.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BloqueMotivosRespuesta
              titulo="Rechazo"
              motivos={rechazos}
              mensajeVacio="Sin rechazos en el período."
            />
            <BloqueMotivosRespuesta
              titulo="Negociación"
              motivos={negociaciones}
              mensajeVacio="Sin negociaciones en el período."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BloqueMotivosRespuesta({
  titulo,
  motivos,
  mensajeVacio,
}: {
  titulo: string;
  motivos: MotivoRespuestaClienteAgrupado[];
  mensajeVacio: string;
}) {
  // Color por código, en orden alfabético estable: no depende de la cantidad,
  // así el mismo motivo mantiene su color entre períodos.
  const codigosOrdenados = [...new Set(motivos.map((m) => m.codigo))].sort();
  const colorDe = (codigo: string) =>
    PALETA_MOTIVOS[codigosOrdenados.indexOf(codigo) % PALETA_MOTIVOS.length];

  // Se muestran en el orden que trae el backend (cantidad DESC).
  const datos = motivos.map((motivo) => ({
    codigo: motivo.codigo,
    etiqueta: motivo.etiqueta,
    cantidad: motivo.cantidad,
    fill: colorDe(motivo.codigo),
  }));

  // La config mapea cada código a su descripción: el tooltip (por `codigo`)
  // muestra la etiqueta = descripción al pasar el cursor sobre el motivo.
  const config: ChartConfig = Object.fromEntries(
    datos.map((d) => [d.codigo, { label: d.etiqueta, color: d.fill }]),
  );

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{titulo}</h3>
      {datos.length === 0 ? (
        <p className="text-sm text-muted-foreground">{mensajeVacio}</p>
      ) : (
        <>
          <ChartContainer
            config={config}
            className="mx-auto aspect-square max-h-[200px]"
          >
            <PieChart>
              {/* hideLabel: sin la línea superior redundante. Cada ítem ya
                  muestra la descripción (config[codigo].label) + la cantidad. */}
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent nameKey="codigo" hideLabel />}
              />
              <Pie
                data={datos}
                dataKey="cantidad"
                nameKey="codigo"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
              >
                {datos.map((d) => (
                  <Cell key={d.codigo} fill={d.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          {/* Leyenda: el CÓDIGO junto a su color y su cantidad. La descripción
              vive en el tooltip (hover). */}
          <ul className="mt-1 grid gap-1.5">
            {datos.map((d) => (
              <li
                key={d.codigo}
                className="flex items-center gap-2 text-sm"
                title={d.etiqueta}
              >
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: d.fill }}
                  aria-hidden
                />
                <span className="font-medium">{d.codigo}</span>
                <span className="ml-auto tabular-nums text-muted-foreground">
                  {d.cantidad}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
