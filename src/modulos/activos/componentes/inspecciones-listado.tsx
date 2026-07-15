"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardCheck, Eye, Plus } from "lucide-react";
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

import { aperturarInspeccion } from "../servicios/inspeccion-api";
import type { Inspeccion, InspeccionResumen } from "../tipos/inspeccion.tipos";

type Props = {
  inspeccionesIniciales: InspeccionResumen[];
};

// La apertura devuelve la inspeccion completa; el listado trabaja con el
// resumen liviano, asi que se deriva el total de activos localmente.
function aResumen(inspeccion: Inspeccion): InspeccionResumen {
  const { detalles, historial: _historial, ...cabecera } = inspeccion;
  return { ...cabecera, totalActivos: detalles.length };
}

export function InspeccionesListado({ inspeccionesIniciales }: Props) {
  const router = useRouter();
  const [inspecciones, setInspecciones] = React.useState(inspeccionesIniciales);
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);
  const [error, setError] = React.useState<string | null>(null);
  const [creando, setCreando] = React.useState(false);
  const [mostrarApertura, setMostrarApertura] = React.useState(false);
  const [formulario, setFormulario] = React.useState({
    responsable: "",
    fechaInspeccion: toDateTimeInputValue(new Date()),
    descripcion: "",
    observacion: "",
  });
  const totalPaginas = Math.max(
    1,
    Math.ceil(inspecciones.length / registrosPorPagina)
  );
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const inspeccionesVisibles = inspecciones.slice(inicioPagina, finPagina);
  const desdeVisible = inspecciones.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, inspecciones.length);

  React.useEffect(() => {
    setPagina((actual) => Math.min(Math.max(actual, 1), totalPaginas));
  }, [totalPaginas]);

  function mostrarError(mensaje: string) {
    setError(mensaje);
    toast.error("No se pudo aperturar la inspeccion", {
      description: mensaje,
    });
  }

  async function aperturar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!formulario.responsable.trim() || !formulario.fechaInspeccion) {
      mostrarError("Completa responsable y fecha de inspeccion.");
      return;
    }

    setCreando(true);

    try {
      const inspeccion = await aperturarInspeccion({
        responsable: formulario.responsable.trim(),
        fechaInspeccion: convertirDateTimeLocalAISO(formulario.fechaInspeccion),
        descripcion: formulario.descripcion.trim() || undefined,
        observacion: formulario.observacion.trim() || undefined,
        usuarioApertura: "activos.web",
      });
      setInspecciones((actual) => [aResumen(inspeccion), ...actual]);
      router.push(`/activos/inspeccion/${inspeccion.id}`);
    } catch (err) {
      mostrarError(
        err instanceof Error
          ? err.message
          : "No se pudo aperturar la inspeccion"
      );
    } finally {
      setCreando(false);
    }
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm text-muted-foreground">BC-02</p>
        <h1 className="text-2xl font-semibold">Inspeccion</h1>
        <p className="text-sm text-muted-foreground">
          Apertura de inspecciones de activos vehiculares (FT-AS-007): estado,
          observaciones y evidencia fotografica por unidad.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ResumenCard
          titulo="Inspecciones"
          valor={inspecciones.length}
          detalle="Procesos aperturados"
        />
        <ResumenCard
          titulo="Abiertas"
          valor={inspecciones.filter((item) => item.estado === "ABIERTA").length}
          detalle="Pendientes de cierre"
        />
        <ResumenCard
          titulo="Activos registrados"
          valor={inspecciones.reduce((total, item) => total + item.totalActivos, 0)}
          detalle="Sumando todas las inspecciones"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Inspecciones aperturadas</CardTitle>
            <CardDescription>
              La apertura crea la cabecera; los activos se registran luego
              desde el panel de la inspeccion.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setError(null);
              setFormulario((actual) => ({
                ...actual,
                fechaInspeccion: toDateTimeInputValue(new Date()),
              }));
              setMostrarApertura(true);
            }}
            disabled={creando}
          >
            <Plus className="size-4" />
            Aperturar inspeccion
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
                  <TableHead>N°</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha inspeccion</TableHead>
                  <TableHead>Activos registrados</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspeccionesVisibles.map((inspeccion) => (
                  <TableRow key={inspeccion.id}>
                    <TableCell className="font-medium">{inspeccion.id}</TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {inspeccion.responsable}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {inspeccion.descripcion || "Sin descripcion"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={estadoInspeccionClassName(inspeccion.estado)}
                      >
                        {formatear(inspeccion.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatearFecha(inspeccion.fechaInspeccion)}</TableCell>
                    <TableCell>{inspeccion.totalActivos}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/activos/inspeccion/${inspeccion.id}`}>
                          <Eye className="size-4" />
                          Abrir
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!inspecciones.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Todavia no hay inspecciones aperturadas.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          {inspecciones.length ? (
            <div className="flex flex-col gap-3 border-t border-border pt-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div>
                Mostrando {desdeVisible}-{hastaVisible} de{" "}
                {inspecciones.length} inspecciones
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
                  onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
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
            <h3 className="text-lg font-semibold">Aperturar inspeccion</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Registra los datos de apertura. El N° de inspeccion lo genera el
              sistema automaticamente.
            </p>
            {error ? (
              <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="inspeccion-responsable">Responsable</Label>
                <Input
                  id="inspeccion-responsable"
                  value={formulario.responsable}
                  onChange={(event) =>
                    setFormulario((actual) => ({
                      ...actual,
                      responsable: event.target.value,
                    }))
                  }
                  placeholder="Edson Arias Taco"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inspeccion-fecha">Fecha y hora</Label>
                <Input
                  id="inspeccion-fecha"
                  type="datetime-local"
                  value={formulario.fechaInspeccion}
                  onChange={(event) =>
                    setFormulario((actual) => ({
                      ...actual,
                      fechaInspeccion: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inspeccion-descripcion">Descripcion</Label>
                <Input
                  id="inspeccion-descripcion"
                  value={formulario.descripcion}
                  onChange={(event) =>
                    setFormulario((actual) => ({
                      ...actual,
                      descripcion: event.target.value,
                    }))
                  }
                  placeholder="Inspeccion de flota Gamarra - julio 2026"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inspeccion-observacion">Observacion</Label>
                <Input
                  id="inspeccion-observacion"
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
          {titulo === "Inspecciones" ? (
            <ClipboardCheck className="size-5" />
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

export function estadoInspeccionClassName(
  estado: InspeccionResumen["estado"]
) {
  switch (estado) {
    case "ABIERTA":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
    case "CERRADA":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "ANULADA":
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
