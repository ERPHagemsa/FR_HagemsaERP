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
import { useMotivosPerdidaQuery } from "../servicios/dashboard-queries";
import type { IdEjecutivoFiltro, RangoPeriodo } from "../tipos/dashboard.tipos";

// Paleta categórica validada (CVD-safe en claro y oscuro, ver globals.css). El
// color se asigna por la CLAVE del motivo —no por ranking—, así un motivo
// conserva su color aunque cambie su cantidad al mover el período.
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
 * Motivos de pérdida del período, como gráfico de pastel. Cada porción es un
 * motivo agrupado por el backend (dos fuentes: el código del catálogo que
 * eligió el CLIENTE al rechazar, y el texto libre que escribió el ejecutivo al
 * marcar la pérdida — `motivoNormalizado` es la clave, `motivoOriginal` la
 * descripción). La leyenda muestra la clave + cantidad; el hover sobre la
 * porción muestra la descripción.
 */
export function DashboardMotivosPerdida({
  periodo,
  idEjecutivoResponsable,
}: PropsPeriodoEjecutivo) {
  const { data, isLoading, isError, error } = useMotivosPerdidaQuery({
    ...periodo,
    idEjecutivoResponsable,
  });

  const motivos = data?.motivos ?? [];

  // Color por clave, en orden alfabético estable: no depende de la cantidad.
  const clavesOrdenadas = [...new Set(motivos.map((m) => m.motivoNormalizado))].sort();
  const colorDe = (clave: string) =>
    PALETA_MOTIVOS[clavesOrdenadas.indexOf(clave) % PALETA_MOTIVOS.length];

  // Se muestran en el orden que trae el backend (cantidad DESC).
  const datos = motivos.map((motivo) => ({
    clave: motivo.motivoNormalizado,
    etiqueta: motivo.motivoOriginal,
    cantidad: motivo.cantidad,
    fill: colorDe(motivo.motivoNormalizado),
  }));

  // La config mapea cada clave a su descripción: el tooltip (por `clave`)
  // muestra la descripción al pasar el cursor sobre la porción.
  const config: ChartConfig = Object.fromEntries(
    datos.map((d) => [d.clave, { label: d.etiqueta, color: d.fill }]),
  );

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Motivos de pérdida del período</CardTitle>
        <AyudaMetrica descripcion={DASHBOARD_AYUDA.motivosPerdida} />
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudieron cargar los motivos de pérdida")}
            </AlertDescription>
          </Alert>
        ) : isLoading || !data ? (
          <Skeleton className="h-48 w-full" />
        ) : datos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin pérdidas en el período.</p>
        ) : (
          <>
            <ChartContainer
              config={config}
              className="mx-auto aspect-square max-h-[200px]"
            >
              <PieChart>
                {/* hideLabel: cada ítem del tooltip ya muestra la descripción
                    (config[clave].label) + la cantidad. */}
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent nameKey="clave" hideLabel />}
                />
                <Pie
                  data={datos}
                  dataKey="cantidad"
                  nameKey="clave"
                  innerRadius={48}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {datos.map((d) => (
                    <Cell key={d.clave} fill={d.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            {/* Leyenda: la clave del motivo junto a su color y cantidad. La
                descripción completa vive en el hover (tooltip y title). */}
            <ul className="mt-1 grid gap-1.5">
              {datos.map((d) => (
                <li
                  key={d.clave}
                  className="flex items-center gap-2 text-sm"
                  title={d.etiqueta}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: d.fill }}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate font-medium uppercase">
                    {d.clave}
                  </span>
                  <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                    {d.cantidad}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
