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

import { useRankingEjecutivosQuery } from "../servicios/dashboard-queries";
import type { RangoPeriodo } from "../tipos/dashboard.tipos";

/** Props del ranking (design D5): SOLO período, sin ejecutivo (D-restricción). */
type Props = { periodo: RangoPeriodo };

/**
 * Ranking de ejecutivos (design D4/gap #3, tarea 3.5): consume
 * `useRankingEjecutivosQuery({ periodo })` — SIN prop de ejecutivo, el
 * ranking es siempre de equipo completo (el endpoint ignora
 * `idEjecutivoResponsable`, restricción verificada). Tabla ordenada por
 * `ganado.pen` descendente; "Cotiz." mapea a `cantidadCerradas` (gap #3);
 * `winRate` null-safe → "sin datos", nunca `0%`.
 */
export function DashboardRanking({ periodo }: Props) {
  const { data, isLoading, isError, error } = useRankingEjecutivosQuery(periodo);

  const filas = [...(data ?? [])].sort((a, b) => b.ganado.pen - a.ganado.pen);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de ejecutivos</CardTitle>
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
                <TableHead className="text-right">Ganado PEN</TableHead>
                <TableHead className="text-right">Ganado USD</TableHead>
                <TableHead className="text-right">Cotiz.</TableHead>
                <TableHead className="text-right">Win rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila) => (
                <TableRow key={fila.ejecutivoId}>
                  <TableCell className="font-medium">{fila.ejecutivoNombre}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatearMoneda(fila.ganado.pen, "PEN")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatearMoneda(fila.ganado.usd, "USD")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fila.cantidadCerradas}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fila.winRate === null ? (
                      <span className="text-muted-foreground">Sin datos</span>
                    ) : (
                      `${(fila.winRate * 100).toFixed(1)}%`
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
