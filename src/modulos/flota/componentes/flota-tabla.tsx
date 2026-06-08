"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import {
  IconEye,
  IconRefresh,
  IconSearch,
  IconDotsVertical,
  IconChartBar,
} from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu";

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
import type { VehiculoFlota } from "../tipos/flota.tipos";
import {
  carroceriaVehiculo,
  contratoVehiculo,
  cuentaVehiculo,
  estadoActivoVehiculo,
  estadoOperativoVehiculo,
  formatear,
  marcaVehiculo,
  modeloVehiculo,
  placaVehiculo,
  textoBusquedaVehiculo,
} from "./flota-normalizadores";

type Props = {
  loading: boolean;
  vehiculos: VehiculoFlota[];
};

export function FlotaTabla({ loading, vehiculos }: Props) {
  const router = useRouter();
  const [queryApplied, setQueryApplied] = React.useState("");
  const [estadoActivoApplied, setEstadoActivoApplied] = React.useState("TODOS");
  const [estadoOperativoApplied, setEstadoOperativoApplied] = React.useState("TODOS");

  // Form state (unsaved until 'Aplicar')
  const [queryForm, setQueryForm] = React.useState("");
  const [estadoActivoForm, setEstadoActivoForm] = React.useState("TODOS");
  const [estadoOperativoForm, setEstadoOperativoForm] = React.useState("TODOS");
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);

  const normalizedQuery = queryApplied.trim().toUpperCase();
  const filtrados = vehiculos.filter((vehiculo) => {
    const coincideTexto = textoBusquedaVehiculo(vehiculo).includes(normalizedQuery);

    return (
      coincideTexto &&
      (estadoActivoApplied === "TODOS" || estadoActivoVehiculo(vehiculo) === estadoActivoApplied) &&
      (estadoOperativoApplied === "TODOS" || estadoOperativoVehiculo(vehiculo) === estadoOperativoApplied)
    );
  });

  const hayFiltros =
    queryApplied ||
    estadoActivoApplied !== "TODOS" ||
    estadoOperativoApplied !== "TODOS";

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / registrosPorPagina));
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const visibles = filtrados.slice(inicioPagina, finPagina);
  const desdeVisible = filtrados.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, filtrados.length);

  function limpiarFiltros() {
    setQueryForm("");
    setEstadoActivoForm("TODOS");
    setEstadoOperativoForm("TODOS");

    setQueryApplied("");
    setEstadoActivoApplied("TODOS");
    setEstadoOperativoApplied("TODOS");
    setPagina(1);
  }

  function actualizarQuery(value: string) {
    setQueryForm(value);
    setPagina(1);
  }

  function actualizarEstadoActivo(value: string) {
    setEstadoActivoForm(value);
    setPagina(1);
  }

  function actualizarEstadoOperativo(value: string) {
    setEstadoOperativoForm(value);
    setPagina(1);
  }

  function actualizarRegistrosPorPagina(value: number) {
    setRegistrosPorPagina(value);
    setPagina(1);
  }

  return (
    <>
      {/* Header card */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Maestro de flota</CardTitle>
          <CardDescription>
            {filtrados.length} de {vehiculos.length} unidades visibles
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters outside the table card */}
      <div className="my-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form
            className="flex flex-col gap-2 lg:flex-row lg:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              // aplicar filtros
              setQueryApplied(queryForm);
              setEstadoActivoApplied(estadoActivoForm);
              setEstadoOperativoApplied(estadoOperativoForm);
              setPagina(1);
            }}
          >
            <div className="grid min-w-64 flex-1 gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Busqueda</span>
              <div className="relative">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Placa, codigo, marca, contrato o cuenta"
                  value={queryForm}
                  onChange={(event) => actualizarQuery(event.target.value)}
                />
              </div>
            </div>

            <FiltroSelect
              className="min-w-40 flex-1"
              label="Estado"
              value={estadoActivoForm}
              onChange={actualizarEstadoActivo}
              values={["TODOS", "ACTIVO", "INACTIVO", "SINIESTRADO"]}
            />
            <FiltroSelect
              className="min-w-40 flex-1"
              label="Operativo"
              value={estadoOperativoForm}
              onChange={actualizarEstadoOperativo}
              values={["TODOS", "OPERATIVO", "MANTENIMIENTO", "NO_OPERATIVO"]}
            />

            <div className="flex gap-2">
              <Button type="submit" size="sm">
                <IconSearch />
                Aplicar
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={limpiarFiltros}>
                Limpiar
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">Excel</Button>
            <Button variant="outline" size="sm">PDF</Button>
          </div>
        </div>

        {hayFiltros ? (
          <div className="flex justify-end mt-2">
            <Button type="button" className="h-8" onClick={limpiarFiltros}>
              <IconRefresh />
              Limpiar filtros
            </Button>
          </div>
        ) : null}
      </div>

      {/* Table card */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div className="overflow-hidden rounded-xl border border-border">
            <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[5%] text-center"></TableHead>
                  <TableHead className="w-[13%]">Placa</TableHead>
                  <TableHead className="w-[22%]">Unidad</TableHead>
                  <TableHead className="w-[14%]">Contrato</TableHead>
                  <TableHead className="w-[14%]">Cuenta</TableHead>
                  <TableHead className="w-[11%]">Estado</TableHead>
                  <TableHead className="w-[14%]">Operativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                      Cargando flota...
                    </TableCell>
                  </TableRow>
                ) : null}
                {!loading
                  ? visibles.map((vehiculo) => (
                      <TableRow key={vehiculo.id}>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => router.push(`/flota/${encodeURIComponent(vehiculo.placa ?? "")}`)}                            >
                                <IconEye className="h-4 w-4" />
                                <span>Ver registro</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => router.push(`/flota/${encodeURIComponent(vehiculo.placa ?? "")}/auditoria`)}
                              >
                                <IconChartBar className="h-4 w-4" />
                                <span>Auditar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="truncate font-mono text-xs">
                          {placaVehiculo(vehiculo)}
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 flex-col gap-1">
                            <span className="truncate font-medium">
                              {[marcaVehiculo(vehiculo), modeloVehiculo(vehiculo)]
                                .filter((item) => item && item !== "-")
                                .join(" ") || "Unidad sin detalle"}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {carroceriaVehiculo(vehiculo)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="truncate">{contratoVehiculo(vehiculo)?.codigo || "-"}</TableCell>
                        <TableCell className="truncate">{cuentaVehiculo(vehiculo)?.nombre || "-"}</TableCell>
                        <TableCell>
                          <EstadoBadge value={estadoActivoVehiculo(vehiculo)} />
                        </TableCell>
                        <TableCell>
                          <EstadoBadge value={estadoOperativoVehiculo(vehiculo)} />
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
                {!loading && !filtrados.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                      No se encontraron unidades con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              Mostrando {desdeVisible}-{hastaVisible} de {filtrados.length} unidades
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                <span>Filas</span>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  value={registrosPorPagina}
                  onChange={(event) =>
                    actualizarRegistrosPorPagina(Number(event.target.value))
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
        </CardContent>
      </Card>
    </>
  );
}

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

function EstadoBadge({ value }: { value: string | null }) {
  return (
    <Badge className="max-w-44" variant={estadoVariant(value)}>
      <span className="truncate">{formatear(value)}</span>
    </Badge>
  );
}

function estadoVariant(value: string | null): BadgeVariant {
  if (value === "ACTIVO" || value === "OPERATIVO" || value === "CALIBRADA") {
    return "default";
  }

  if (
    value === "SINIESTRADO" ||
    value === "ELIMINADO" ||
    value === "NO_OPERATIVO" ||
    value === "NO_CALIBRADA" ||
    value === "OBSERVADA"
  ) {
    return "destructive";
  }

  return "secondary";
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
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
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