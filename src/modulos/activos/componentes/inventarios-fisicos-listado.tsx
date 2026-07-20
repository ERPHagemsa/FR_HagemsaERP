"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";

import { aperturarInventarioFisico } from "../servicios/activos-api";
import type {
  InventarioFisico,
  InventarioFisicoResumen,
} from "../tipos/activo.tipos";

type Props = {
  inventariosIniciales: InventarioFisicoResumen[];
};

// La apertura devuelve el inventario completo; el listado trabaja con el
// resumen liviano, asi que se derivan los conteos localmente.
function aResumen(inventario: InventarioFisico): InventarioFisicoResumen {
  const { detalles, historial: _historial, ...cabecera } = inventario;
  const pendientes = detalles.filter(
    (detalle) => detalle.estadoRevision === "PENDIENTE"
  ).length;

  return {
    ...cabecera,
    totalDetalles: detalles.length,
    inventariados: detalles.length - pendientes,
    pendientes,
    faltantes: detalles.filter(
      (detalle) => detalle.estadoRevision === "FALTANTE"
    ).length,
  };
}

export function InventariosFisicosListado({ inventariosIniciales }: Props) {
  const router = useRouter();
  const [inventarios, setInventarios] = React.useState(inventariosIniciales);
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);
  const [error, setError] = React.useState<string | null>(null);
  const [creando, setCreando] = React.useState(false);
  const [mostrarApertura, setMostrarApertura] = React.useState(false);
  const [formulario, setFormulario] = React.useState({
    codigo: "",
    fechaApertura: toDateTimeInputValue(new Date()),
    descripcion: "",
    observacion: "",
  });
  const totalPaginas = Math.max(
    1,
    Math.ceil(inventarios.length / registrosPorPagina)
  );
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const inventariosVisibles = inventarios.slice(inicioPagina, finPagina);
  const desdeVisible = inventarios.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, inventarios.length);

  React.useEffect(() => {
    setPagina((actual) => Math.min(Math.max(actual, 1), totalPaginas));
  }, [totalPaginas]);

  function mostrarError(mensaje: string) {
    setError(mensaje);
    toast.error("No se pudo aperturar el inventario", {
      description: mensaje,
    });
  }

  async function aperturar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!formulario.codigo.trim() || !formulario.fechaApertura || !formulario.descripcion.trim()) {
      mostrarError("Completa codigo, fecha de apertura y descripcion.");
      return;
    }

    setCreando(true);

    try {
      const inventario = await aperturarInventarioFisico({
        codigo: formulario.codigo.trim().toUpperCase(),
        fechaApertura: convertirDateTimeLocalAISO(formulario.fechaApertura),
        descripcion: formulario.descripcion.trim(),
        observacion: formulario.observacion.trim() || undefined,
        usuarioApertura: "activos.web",
      });
      setInventarios((actual) => [aResumen(inventario), ...actual]);
      router.push(`/activos/inventario-fisico/${inventario.id}`);
    } catch (err) {
      mostrarError(
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
          valor={
            inventarios.filter(
              (item) => item.estado !== "CERRADO" && item.estado !== "ANULADO"
            ).length
          }
          detalle="Pendientes de cierre"
        />
        <ResumenCard
          titulo="Activos revisados"
          valor={inventarios.reduce(
            (total, item) => total + item.inventariados,
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
              La apertura crea la cabecera y la foto historica de activos
              vigentes; la revision fisica se registra luego desde Revisar.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setError(null);
              setFormulario((actual) => ({
                ...actual,
                fechaApertura: toDateTimeInputValue(new Date()),
              }));
              setMostrarApertura(true);
            }}
            disabled={creando}
          >
            <Plus className="size-4" />
            Aperturar inventario
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!mostrarApertura && error ? (
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
                  <TableHead>Inventariados</TableHead>
                  <TableHead>Pendientes</TableHead>
                  <TableHead>Faltantes</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventariosVisibles.map((inventario) => {
                  const { inventariados, pendientes, faltantes } = inventario;

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
                        <Badge
                          variant="outline"
                          className={estadoInventarioClassName(
                            inventario.estado
                          )}
                        >
                          {formatear(inventario.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatearFecha(inventario.fechaApertura)}</TableCell>
                      <TableCell>{inventariados}</TableCell>
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
          {inventarios.length ? (
            <div className="flex flex-col gap-3 border-t border-border pt-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div>
                Mostrando {desdeVisible}-{hastaVisible} de{" "}
                {inventarios.length} inventarios
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2">
                  <span>Filas</span>
                  <select
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    value={registrosPorPagina}
                    onChange={(event) => {
                      setRegistrosPorPagina(Number(event.target.value));
                      setPagina(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagina === 1}
                  onClick={() =>
                    setPagina((actual) => Math.max(1, actual - 1))
                  }
                >
                  Anterior
                </Button>
                <span className="min-w-20 text-center">
                  {pagina} / {totalPaginas}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagina === totalPaginas}
                  onClick={() =>
                    setPagina((actual) => Math.min(totalPaginas, actual + 1))
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      {mostrarApertura ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
          <form
            onSubmit={aperturar}
            className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            <h3 className="text-lg font-semibold">Aperturar inventario</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Registra los datos de apertura. El inventario iniciara en estado
              Creado y sin activos inventariados.
            </p>
            {error ? (
              <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="inventario-codigo">Codigo</Label>
                <Input
                  id="inventario-codigo"
                  value={formulario.codigo}
                  onChange={(event) =>
                    setFormulario((actual) => ({
                      ...actual,
                      codigo: event.target.value,
                    }))
                  }
                  placeholder="INV-2026-06"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inventario-fecha">Fecha y hora de apertura</Label>
                <Input
                  id="inventario-fecha"
                  type="datetime-local"
                  value={formulario.fechaApertura}
                  onChange={(event) =>
                    setFormulario((actual) => ({
                      ...actual,
                      fechaApertura: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inventario-descripcion">Descripcion</Label>
                <Input
                  id="inventario-descripcion"
                  value={formulario.descripcion}
                  onChange={(event) =>
                    setFormulario((actual) => ({
                      ...actual,
                      descripcion: event.target.value,
                    }))
                  }
                  placeholder="Inventario fisico junio 2026"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inventario-observacion">Observacion</Label>
                <Input
                  id="inventario-observacion"
                  value={formulario.observacion}
                  onChange={(event) =>
                    setFormulario((actual) => ({
                      ...actual,
                      observacion: event.target.value,
                    }))
                  }
                  placeholder="Comentario opcional"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setMostrarApertura(false);
                }}
                disabled={creando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creando}>
                {creando ? "Aperturando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
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

function estadoInventarioClassName(estado: InventarioFisicoResumen["estado"]) {
  switch (estado) {
    case "CREADO":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300";
    case "ABIERTO":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
    case "EN_REVISION":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
    case "CERRADO":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "ANULADO":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "";
  }
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
    timeZone: "America/Lima",
  }).format(value);
}

function toDateTimeInputValue(fecha: Date) {
  const offset = fecha.getTimezoneOffset();
  const local = new Date(fecha.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function convertirDateTimeLocalAISO(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T${toTimeInputValue(new Date())}`).toISOString();
  }

  const fecha = new Date(value);
  return Number.isNaN(fecha.getTime()) ? value : fecha.toISOString();
}

function toTimeInputValue(fecha: Date) {
  return `${String(fecha.getHours()).padStart(2, "0")}:${String(
    fecha.getMinutes()
  ).padStart(2, "0")}`;
}
