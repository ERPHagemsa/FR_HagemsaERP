"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, Eye, Plus } from "lucide-react";

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

import { aperturarInventarioFisico } from "../servicios/activos-api";
import type { InventarioFisico } from "../tipos/activo.tipos";

type Props = {
  inventariosIniciales: InventarioFisico[];
};

export function InventariosFisicosListado({ inventariosIniciales }: Props) {
  const router = useRouter();
  const [inventarios, setInventarios] = React.useState(inventariosIniciales);
  const [error, setError] = React.useState<string | null>(null);
  const [creando, setCreando] = React.useState(false);

  async function aperturar() {
    setError(null);
    setCreando(true);

    try {
      const inventario = await aperturarInventarioFisico({
        usuarioApertura: "activos.web",
      });
      setInventarios((actual) => [inventario, ...actual]);
      router.push(`/activos/inventario-fisico/${inventario.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo aperturar el inventario fisico"
      );
    } finally {
      setCreando(false);
    }
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm text-muted-foreground">BC-02</p>
        <h1 className="text-2xl font-semibold">Inventario fisico</h1>
        <p className="text-sm text-muted-foreground">
          Apertura de inventarios para revision fisica, conciliacion y control
          anual de activos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ResumenCard
          titulo="Inventarios"
          valor={inventarios.length}
          detalle="Procesos aperturados"
        />
        <ResumenCard
          titulo="Abiertos"
          valor={inventarios.filter((item) => item.estado !== "CERRADO").length}
          detalle="Pendientes de cierre"
        />
        <ResumenCard
          titulo="Activos revisados"
          valor={inventarios.reduce(
            (total, item) =>
              total +
              item.detalles.filter(
                (detalle) => detalle.estadoRevision !== "PENDIENTE"
              ).length,
            0
          )}
          detalle="Con estado fisico registrado"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Inventarios aperturados</CardTitle>
            <CardDescription>
              Cada apertura toma una foto de los activos vigentes del maestro.
            </CardDescription>
          </div>
          <Button onClick={aperturar} disabled={creando}>
            <Plus className="size-4" />
            {creando ? "Aperturando..." : "Aperturar inventario"}
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Inventario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha apertura</TableHead>
                  <TableHead>Activos</TableHead>
                  <TableHead>Pendientes</TableHead>
                  <TableHead>Faltantes</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventarios.map((inventario) => {
                  const pendientes = inventario.detalles.filter(
                    (detalle) => detalle.estadoRevision === "PENDIENTE"
                  ).length;
                  const faltantes = inventario.detalles.filter(
                    (detalle) => detalle.estadoRevision === "FALTANTE"
                  ).length;

                  return (
                    <TableRow key={inventario.id}>
                      <TableCell className="font-medium">
                        {inventario.codigo}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {inventario.nombre}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {inventario.descripcion || "Sin observacion"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatear(inventario.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatearFecha(inventario.fechaApertura)}</TableCell>
                      <TableCell>{inventario.detalles.length}</TableCell>
                      <TableCell>{pendientes}</TableCell>
                      <TableCell>
                        <span
                          className={
                            faltantes
                              ? "font-semibold text-destructive"
                              : undefined
                          }
                        >
                          {faltantes}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/activos/inventario-fisico/${inventario.id}`}>
                            <Eye className="size-4" />
                            Revisar
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!inventarios.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Todavia no hay inventarios fisicos aperturados.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ResumenCard({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: number;
  detalle: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardDescription>{titulo}</CardDescription>
          <CardTitle className="text-3xl">{valor}</CardTitle>
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          {titulo === "Inventarios" ? (
            <ClipboardList className="size-5" />
          ) : (
            <CalendarDays className="size-5" />
          )}
        </span>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{detalle}</CardContent>
    </Card>
  );
}

function formatear(value?: string | null) {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-";
  const value = new Date(fecha);
  if (Number.isNaN(value.getTime())) return fecha;

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
