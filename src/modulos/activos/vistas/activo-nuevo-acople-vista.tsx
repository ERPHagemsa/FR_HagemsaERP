import Link from "next/link";
import { GitCompareArrows } from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";

import { obtenerActivos } from "../servicios/activos-api";
import type { Activo } from "../tipos/activo.tipos";

export async function ActivoNuevoAcopleVista() {
  const resultado = await obtenerActivos({ estadoRegistro: true })
    .then((activos) => ({
      activos: activos.filter((activo) => activo.estadoActivo !== "ACTIVO"),
      error: null,
    }))
    .catch((error) => ({
      activos: [] as Activo[],
      error:
        error instanceof Error
          ? error.message
          : "No se pudo cargar activos de baja.",
    }));

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal">Replaqueo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Registro para cambio de placa usando una unidad dada de baja como referencia.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/activos/inventario">Volver</Link>
          </Button>
        </section>

        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                  <GitCompareArrows className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>Unidades de baja disponibles</CardTitle>
                  <CardDescription>
                    Selecciona el activo anterior que sera referencia para el
                    replaqueo.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline">
                {resultado.activos.length} de baja
              </Badge>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Este flujo parte de una unidad en baja y crea una nueva ficha
                operativa conservando trazabilidad historica del cambio de placa.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Listado de unidades de baja</p>
                <CardDescription>
                  Usa Crear replaqueo sobre la unidad anterior correspondiente.
                </CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link href="/activos/inventario">Ver listado general</Link>
              </Button>
            </div>

            {resultado.error ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {resultado.error}
              </div>
            ) : resultado.activos.length ? (
              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Unidad anterior</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Carroceria</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Accion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.activos.map((activo) => (
                      <TableRow key={activo.id}>
                        <TableCell>
                          <div className="font-semibold">
                            {activo.codigo}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Unidad de baja
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {activo.descripcion}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activo.tipoActivo}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatearTexto(activo.vehiculo?.placa)}
                        </TableCell>
                        <TableCell>
                          {formatearTexto(activo.vehiculo?.carroceria)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatearEstadoActivo(activo.estadoActivo)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm">
                            <Link
                              href={`/activos/nuevo?origenId=${encodeURIComponent(
                                String(activo.id)
                              )}`}
                            >
                              Crear replaqueo
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No hay activos de baja disponibles para crear un replaqueo.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatearTexto(valor?: string | null) {
  return valor?.trim() ? valor : "-";
}

function formatearEstadoActivo(estado: Activo["estadoActivo"]) {
  if (estado === "SINIESTRADO") return "Baja / Siniestro";
  if (estado === "INACTIVO") return "Baja / De baja";
  return "Activo";
}
