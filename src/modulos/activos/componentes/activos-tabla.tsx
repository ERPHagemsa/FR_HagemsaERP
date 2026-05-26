"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  IconArrowDown,
  IconArrowUp,
  IconEye,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { cn } from "@/compartido/utilidades";
import { useCambiarEstadoActivoMutation } from "../servicios/activos-queries";
import type {
  Activo,
  EstadoActivo,
  EstadoCalibracion,
  EstadoOperativo,
} from "../tipos/activo.tipos";

type Props = {
  activos: Activo[];
};

export function ActivosTabla({ activos }: Props) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [tipoActivo, setTipoActivo] = React.useState("TODOS");
  const [estadoActivo, setEstadoActivo] = React.useState("TODOS");
  const [estadoOperativo, setEstadoOperativo] = React.useState("TODOS");
  const [estadoCalibracion, setEstadoCalibracion] = React.useState("TODOS");
  const [fechaDesde, setFechaDesde] = React.useState("");
  const [fechaHasta, setFechaHasta] = React.useState("");
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);
  const [ordenModificacion, setOrdenModificacion] = React.useState<
    "reciente" | "antigua"
  >("reciente");
  const [activoParaBorrar, setActivoParaBorrar] = React.useState<Activo | null>(
    null
  );
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const cambiarEstadoMutation = useCambiarEstadoActivoMutation();

  const activosVisibles = activos.filter(
    (activo) => activo.estadoActivo !== "ELIMINADO"
  );
  const normalizedQuery = query.trim().toUpperCase();
  const filtrados = activosVisibles.filter((activo) => {
    const placa = activo.vehiculo?.placaRodaje ?? "";
    const marca = activo.vehiculo?.marca ?? "";
    const modelo = activo.vehiculo?.modelo ?? "";
    const fechaModificacion = normalizarFecha(activo.updatedAt);
    const coincideTexto = [activo.codigo, activo.descripcion, placa, marca, modelo]
      .join(" ")
      .toUpperCase()
      .includes(normalizedQuery);

    return (
      coincideTexto &&
      (tipoActivo === "TODOS" || activo.tipoActivo === tipoActivo) &&
      (estadoActivo === "TODOS" || activo.estadoActivo === estadoActivo) &&
      (estadoOperativo === "TODOS" ||
        activo.vehiculo?.estadoOperativo === estadoOperativo) &&
      (estadoCalibracion === "TODOS" ||
        activo.vehiculo?.estadoCalibracion === estadoCalibracion) &&
      (!fechaDesde || fechaModificacion >= fechaDesde) &&
      (!fechaHasta || fechaModificacion <= fechaHasta)
    );
  });

  const hayFiltros =
    query ||
    tipoActivo !== "TODOS" ||
    estadoActivo !== "TODOS" ||
    estadoOperativo !== "TODOS" ||
    estadoCalibracion !== "TODOS" ||
    fechaDesde ||
    fechaHasta;

  const ordenados = [...filtrados].sort((a, b) => {
    const fechaA = new Date(a.updatedAt).getTime();
    const fechaB = new Date(b.updatedAt).getTime();

    return ordenModificacion === "reciente"
      ? fechaB - fechaA
      : fechaA - fechaB;
  });

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / registrosPorPagina));
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const visibles = ordenados.slice(inicioPagina, finPagina);
  const desdeVisible = ordenados.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, ordenados.length);

  React.useEffect(() => {
    setPagina(1);
  }, [
    query,
    tipoActivo,
    estadoActivo,
    estadoOperativo,
    estadoCalibracion,
    fechaDesde,
    fechaHasta,
    registrosPorPagina,
  ]);

  function limpiarFiltros() {
    setQuery("");
    setTipoActivo("TODOS");
    setEstadoActivo("TODOS");
    setEstadoOperativo("TODOS");
    setEstadoCalibracion("TODOS");
    setFechaDesde("");
    setFechaHasta("");
  }

  async function confirmarBorrado() {
    if (!activoParaBorrar) return;

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await cambiarEstadoMutation.mutateAsync({
        id: activoParaBorrar.id,
        payload: {
          estadoActivo: "ELIMINADO",
          motivo: "Borrado desde maestro de activos",
          usuario: "activos.web",
        },
      });
      setActivoParaBorrar(null);
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "No se pudo borrar el activo"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Maestro de unidades</CardTitle>
            <CardDescription>
              {filtrados.length} de {activosVisibles.length} activos visibles
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/activos/nuevo">
              <IconPlus />
              Nuevo activo
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-64 flex-1 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Busqueda
            </span>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Codigo, placa, marca o modelo"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          <FiltroSelect
            className="min-w-36 flex-1"
            label="Tipo"
            value={tipoActivo}
            onChange={setTipoActivo}
            values={[
              "TODOS",
              "VEHICULO",
              "EQUIPO",
              "HERRAMIENTA",
              "DISPOSITIVO",
              "OTRO",
            ]}
          />
          <FiltroSelect
            className="min-w-36 flex-1"
            label="Estado"
            value={estadoActivo}
            onChange={setEstadoActivo}
            values={["TODOS", "ACTIVO", "INACTIVO", "SINIESTRADO"]}
          />
          <FiltroSelect
            className="min-w-36 flex-1"
            label="Operativo"
            value={estadoOperativo}
            onChange={setEstadoOperativo}
            values={["TODOS", "OPERATIVO", "MANTENIMIENTO", "NO_OPERATIVO"]}
          />
          <FiltroSelect
            className="min-w-36 flex-1"
            label="Calibracion"
            value={estadoCalibracion}
            onChange={setEstadoCalibracion}
            values={["TODOS", "CALIBRADA", "NO_CALIBRADA", "PENDIENTE", "OBSERVADA"]}
          />
          <FiltroFecha
            className="min-w-36 flex-1"
            label="Desde"
            value={fechaDesde}
            max={fechaHasta || undefined}
            onChange={setFechaDesde}
          />
          <FiltroFecha
            className="min-w-36 flex-1"
            label="Hasta"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={setFechaHasta}
          />
        </div>

        {hayFiltros ? (
          <div className="flex justify-end">
            <Button type="button" className="h-8" onClick={limpiarFiltros}>
              <IconRefresh />
              Limpiar filtros
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Fase 1: maestro base</Badge>
          {!hayFiltros ? (
            <span className="text-sm text-muted-foreground">Sin filtros activos</span>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[10%]">Código</TableHead>
                <TableHead className="w-[15%]">Unidad</TableHead>
                <TableHead className="w-[9%]">Placa</TableHead>
                <TableHead className="w-[7%]">Tipo</TableHead>
                <TableHead className="w-[13%]">Ubicacion</TableHead>
                <TableHead className="w-[8%]">Estado</TableHead>
                <TableHead className="w-[9%]">Operativo</TableHead>
                <TableHead className="w-[9%]">Calibracion</TableHead>
                <TableHead className="w-[9%]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-left transition-colors hover:text-primary"
                    title={
                      ordenModificacion === "reciente"
                        ? "Ordenado por modificacion mas reciente"
                        : "Ordenado por modificacion mas antigua"
                    }
                    onClick={() =>
                      setOrdenModificacion((actual) =>
                        actual === "reciente" ? "antigua" : "reciente"
                      )
                    }
                  >
                    Modificado
                    {ordenModificacion === "reciente" ? (
                      <IconArrowDown className="size-3.5 text-primary" />
                    ) : (
                      <IconArrowUp className="size-3.5 text-primary" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[11%] text-center">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((activo) => (
                <TableRow key={activo.id}>
                  <TableCell className="truncate font-medium">{activo.codigo}</TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">
                        {[activo.vehiculo?.marca, activo.vehiculo?.modelo]
                          .filter(Boolean)
                          .join(" ") || activo.descripcion}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {activo.vehiculo?.carroceria ?? activo.descripcion}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="truncate">
                    {activo.vehiculo?.placaRodaje ?? "Sin placa"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatear(activo.tipoActivo)}</Badge>
                  </TableCell>
                  <TableCell className="truncate">
                    {activo.ubicacion}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge
                      value={activo.estadoActivo}
                      variant={estadoActivoVariant(activo.estadoActivo)}
                    />
                  </TableCell>
                  <TableCell>
                    <EstadoBadge
                      value={activo.vehiculo?.estadoOperativo ?? "SIN_DETALLE"}
                      variant={estadoOperativoVariant(
                        activo.vehiculo?.estadoOperativo
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <EstadoBadge
                      value={activo.vehiculo?.estadoCalibracion ?? "SIN_DETALLE"}
                      variant={estadoCalibracionVariant(
                        activo.vehiculo?.estadoCalibracion
                      )}
                    />
                  </TableCell>
                  <TableCell className="truncate text-sm text-muted-foreground">
                    {formatearFecha(activo.updatedAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="mx-auto flex w-fit justify-center gap-1">
                      <Button asChild size="icon-sm" variant="outline">
                        <Link href={`/activos/${activo.codigo}`}>
                          <IconEye />
                          <span className="sr-only">Ver</span>
                        </Link>
                      </Button>
                      <Button asChild size="icon-sm">
                        <Link href={`/activos/${activo.codigo}/editar`}>
                          <IconPencil />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="destructive"
                        title="Borrar activo"
                        onClick={() => {
                          setDeleteError(null);
                          setActivoParaBorrar(activo);
                        }}
                        disabled={activo.estadoActivo === "ELIMINADO"}
                      >
                        <IconTrash />
                        <span className="sr-only">Borrar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!ordenados.length ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No se encontraron activos con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            Mostrando {desdeVisible}-{hastaVisible} de {ordenados.length} activos
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <span>Filas</span>
              <select
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                value={registrosPorPagina}
                onChange={(event) =>
                  setRegistrosPorPagina(Number(event.target.value))
                }
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
        {activoParaBorrar ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
              <h3 className="text-lg font-semibold">Confirmar borrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                El activo {activoParaBorrar.codigo} se retirara del maestro
                visible y no podra usarse en procesos operativos. Deseas
                continuar?
              </p>
              {deleteError ? (
                <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-destructive">
                  {deleteError}
                </div>
              ) : null}
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActivoParaBorrar(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmarBorrado}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Procesando..." : "Borrar activo"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];


function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function normalizarFecha(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function EstadoBadge({
  value,
  variant,
}: {
  value: string;
  variant: BadgeVariant;
}) {
  return (
    <Badge className="max-w-44" variant={variant}>
      <span className="truncate">{formatear(value)}</span>
    </Badge>
  );
}

function estadoActivoVariant(value: EstadoActivo): BadgeVariant {
  if (value === "ACTIVO") return "default";
  if (value === "SINIESTRADO" || value === "ELIMINADO") return "destructive";
  return "secondary";
}

function estadoOperativoVariant(
  value: EstadoOperativo | null | undefined
): BadgeVariant {
  if (value === "OPERATIVO") return "default";
  if (value === "NO_OPERATIVO") return "destructive";
  return "secondary";
}

function estadoCalibracionVariant(
  value: EstadoCalibracion | null | undefined
): BadgeVariant {
  if (value === "CALIBRADA") return "default";
  if (value === "OBSERVADA" || value === "NO_CALIBRADA") return "destructive";
  return "secondary";
}

function formatear(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function FiltroSelect({
  className,
  label,
  value,
  values,
  onChange,
}: {
  className?: string;
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        className={cn(
          "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {values.map((item) => (
          <option key={item} value={item}>
            {item === "TODOS" ? "Todos" : formatear(item)}
          </option>
        ))}
      </select>
    </label>
  );
}

function FiltroFecha({
  className,
  label,
  value,
  min,
  max,
  onChange,
}: {
  className?: string;
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        className="h-9"
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
