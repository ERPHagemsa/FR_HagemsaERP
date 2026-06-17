"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  Gauge,
  ListChecks,
  Plus,
  type LucideIcon,
} from "lucide-react";

import { extraerMensajeError } from "@/compartido/api";
import { useConsulta } from "@/compartido/api/use-consulta";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
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

import { ActivosResumen } from "../componentes/activos-resumen";
import { obtenerActivos } from "../servicios/activos-api";
import type { Activo, EstadoOperativo, TipoActivo } from "../tipos/activo.tipos";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

const DIAS_ALTAS_RECIENTES = 8;

const TIPOS_ACTIVO: TipoActivo[] = [
  "VEHICULO",
  "EQUIPO",
  "HERRAMIENTA",
  "DISPOSITIVO",
  "OTRO",
];

const ESTADOS_OPERATIVOS: EstadoOperativo[] = [
  "OPERATIVO",
  "MANTENIMIENTO",
  "NO_OPERATIVO",
];

export function ActivosVista() {
  const { data, isLoading, isError, error } = useConsulta(
    () => obtenerActivos(),
    [],
  );

  const activos = data ?? [];
  const activosVisibles = activos.filter(
    (activo) => activo.estadoRegistro !== false,
  );
  const ultimosActivos = [...activosVisibles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
  const bajasRecientes = activosVisibles
    .filter((activo) =>
      ["INACTIVO", "SINIESTRADO"].includes(activo.estadoActivo),
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const dataAltas = agruparAltasRecientes(activosVisibles);
  const maxAltas = Math.max(1, ...dataAltas.map((item) => item.total));
  const distribucionTipo = TIPOS_ACTIVO.map((tipo) => ({
    label: formatear(tipo),
    total: activosVisibles.filter((activo) => activo.tipoActivo === tipo).length,
  }));
  const distribucionOperativa = ESTADOS_OPERATIVOS.map((estado) => ({
    label: formatear(estado),
    total: activosVisibles.filter(
      (activo) => activo.vehiculo?.estadoOperativo === estado,
    ).length,
  }));
  const alertasMantenimiento = activosVisibles.filter(
    (activo) => activo.vehiculo?.estadoOperativo === "MANTENIMIENTO",
  ).length;
  const alertasCalibracion = activosVisibles.filter((activo) =>
    ["NO_CALIBRADA", "OBSERVADA"].includes(
      activo.vehiculo?.estadoCalibracion ?? "",
    ),
  ).length;

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar activos</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar activos")}
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex flex-col gap-5">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <>
        <ActivosResumen activos={activos} />

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Altas recientes</CardTitle>
                <CardDescription>
                  Evolucion de activos registrados en los ultimos{" "}
                  {DIAS_ALTAS_RECIENTES} dias.
                </CardDescription>
              </div>
              <Badge variant="outline">Ultimos {DIAS_ALTAS_RECIENTES} dias</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-end gap-2 border-b border-border px-1">
                {dataAltas.map((item) => (
                  <div
                    key={item.fecha}
                    className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-t-sm bg-primary/75"
                      style={{
                        height: `${Math.max(4, (item.total / maxAltas) * 210)}px`,
                      }}
                      title={`${item.label}: ${item.total}`}
                    />
                    <span className="truncate text-xs text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribucion</CardTitle>
              <CardDescription>
                Lectura rapida por tipo de activo y condicion del activo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DistribucionLista items={distribucionTipo} />
              <div className="border-t border-border pt-5">
                <DistribucionLista items={distribucionOperativa} />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Ultimos activos agregados</CardTitle>
                <CardDescription>
                  Registros recientes del maestro de unidades.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/activos/inventario">
                  Ver listado
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ubicacion</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Condicion</TableHead>
                      <TableHead>Calibracion</TableHead>
                      <TableHead>Modificado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ultimosActivos.map((activo) => (
                      <TableRow key={activo.id}>
                        <TableCell className="font-medium">
                          {activo.codigo}
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">
                              {activo.vehiculo?.marca || activo.descripcion}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {activo.vehiculo?.modelo || activo.descripcion}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activo.vehiculo?.placa || "Sin placa"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatear(activo.tipoActivo)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-44 truncate">
                          {activo.ubicacion}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatearEstadoActivo(activo.estadoActivo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatear(activo.vehiculo?.estadoOperativo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatear(activo.vehiculo?.estadoCalibracion)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatearFecha(activo.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                    {!ultimosActivos.length ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No hay activos registrados.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Bajas recientes</CardTitle>
                <CardDescription>
                  Activos inactivos o siniestrados enviados por control.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bajasRecientes.map((activo) => (
                  <div
                    key={activo.id}
                    className="rounded-lg border border-border px-3 py-2"
                  >
                    <p className="font-medium">{activo.codigo}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatear(activo.estadoActivo)} desde{" "}
                      {formatearFecha(activo.updatedAt)}
                    </p>
                  </div>
                ))}
                {!bajasRecientes.length ? (
                  <p className="text-sm text-muted-foreground">
                    No hay bajas recientes.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas operativas</CardTitle>
                <CardDescription>
                  Lectura rapida para seguimiento tecnico.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <AlertaMini
                  icon={Gauge}
                  label="En mantenimiento"
                  value={alertasMantenimiento}
                />
                <AlertaMini
                  icon={AlertTriangle}
                  label="Calibracion observada"
                  value={alertasCalibracion}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accesos rapidos</CardTitle>
                <CardDescription>Operaciones frecuentes del modulo.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button asChild>
                  <Link href="/activos/nuevo">
                    <Plus className="size-4" />
                    Nuevo activo
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/activos/inventario">
                    <ListChecks className="size-4" />
                    Listado de activos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
          </>
        )}
      </div>
    </main>
  );
}

function DistribucionLista({ items }: { items: { label: string; total: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.total));

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-semibold tabular-nums">{item.total}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(4, (item.total / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertaMini({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function agruparAltasRecientes(activos: Activo[]) {
  const conteo = activos.reduce<Record<string, number>>((acc, activo) => {
    const fecha = activo.createdAt?.slice(0, 10);
    if (!fecha) return acc;
    acc[fecha] = (acc[fecha] ?? 0) + 1;
    return acc;
  }, {});

  const fechas = Object.keys(conteo).sort((a, b) => a.localeCompare(b));
  const fechaFinal = fechas.length
    ? crearFechaLocal(fechas[fechas.length - 1])
    : new Date();
  const fechaInicial = new Date(fechaFinal);
  fechaInicial.setDate(fechaInicial.getDate() - (DIAS_ALTAS_RECIENTES - 1));

  return Array.from({ length: DIAS_ALTAS_RECIENTES }, (_, index) => {
    const fecha = new Date(fechaInicial);
    fecha.setDate(fechaInicial.getDate() + index);
    const fechaIso = formatearFechaIsoLocal(fecha);

    return {
      fecha: fechaIso,
      label: fechaIso.slice(5),
      total: conteo[fechaIso] ?? 0,
    };
  });
}

function crearFechaLocal(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatearFechaIsoLocal(fecha: Date) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return fecha;

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(valor);
}

function formatear(value?: string | null) {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatearEstadoActivo(value?: string | null) {
  if (value === "ACTIVO") return "Activo";
  if (value === "SINIESTRADO") return "Baja / Siniestro";
  if (value === "INACTIVO") return "Baja / De baja";
  return formatear(value);
}
