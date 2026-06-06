"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import {
  IconEye,
  IconRefresh,
  IconSearch,
  IconDotsVertical,
  IconHistory,
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
  estadoActivoVehiculo,
  estadoCalibracionVehiculo,
  estadoOperativoVehiculo,
  formatear,
  marcaVehiculo,
  modeloVehiculo,
  placaVehiculo,
  textoBusquedaVehiculo,
} from "./flota-normalizadores";
import { FlotaAuditPanel } from "./flota-audit-panel";

type Props = {
  loading: boolean;
  vehiculos: VehiculoFlota[];
};

export function FlotaTabla({ loading, vehiculos }: Props) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [estadoActivo, setEstadoActivo] = React.useState("TODOS");
  const [estadoOperativo, setEstadoOperativo] = React.useState("TODOS");
  const [auditPlaca, setAuditPlaca] = React.useState<string | null>(null);
  const [estadoCalibracion, setEstadoCalibracion] = React.useState("TODOS");
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);

  const normalizedQuery = query.trim().toUpperCase();
  const filtrados = vehiculos.filter((vehiculo) => {
    const coincideTexto = textoBusquedaVehiculo(vehiculo).includes(normalizedQuery);

    return (
      coincideTexto &&
      (estadoActivo === "TODOS" || estadoActivoVehiculo(vehiculo) === estadoActivo) &&
      (estadoOperativo === "TODOS" ||
        estadoOperativoVehiculo(vehiculo) === estadoOperativo) &&
      (estadoCalibracion === "TODOS" ||
        estadoCalibracionVehiculo(vehiculo) === estadoCalibracion)
    );
  });

  const hayFiltros =
    query ||
    estadoActivo !== "TODOS" ||
    estadoOperativo !== "TODOS" ||
    estadoCalibracion !== "TODOS";

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / registrosPorPagina));
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const visibles = filtrados.slice(inicioPagina, finPagina);
  const desdeVisible = filtrados.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, filtrados.length);

  function limpiarFiltros() {
    setQuery("");
    setEstadoActivo("TODOS");
    setEstadoOperativo("TODOS");
    setEstadoCalibracion("TODOS");
    setPagina(1);
  }

  function actualizarQuery(value: string) {
    setQuery(value);
    setPagina(1);
  }

  function actualizarEstadoActivo(value: string) {
    setEstadoActivo(value);
    setPagina(1);
  }

  function actualizarEstadoOperativo(value: string) {
    setEstadoOperativo(value);
    setPagina(1);
  }

  function actualizarEstadoCalibracion(value: string) {
    setEstadoCalibracion(value);
    setPagina(1);
  }

  function actualizarRegistrosPorPagina(value: number) {
    setRegistrosPorPagina(value);
    setPagina(1);
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b border-border">
        <CardTitle>Maestro de flota</CardTitle>
        <CardDescription>
          {filtrados.length} de {vehiculos.length} unidades visibles
        </CardDescription>
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
                placeholder="Placa, codigo, marca, contrato o cuenta"
                value={query}
                onChange={(event) => actualizarQuery(event.target.value)}
              />
            </div>
          </div>
          <FiltroSelect
            className="min-w-40 flex-1"
            label="Estado"
            value={estadoActivo}
            onChange={actualizarEstadoActivo}
            values={["TODOS", "ACTIVO", "INACTIVO", "SINIESTRADO"]}
          />
          <FiltroSelect
            className="min-w-40 flex-1"
            label="Operativo"
            value={estadoOperativo}
            onChange={actualizarEstadoOperativo}
            values={["TODOS", "OPERATIVO", "MANTENIMIENTO", "NO_OPERATIVO"]}
          />
          <FiltroSelect
            className="min-w-40 flex-1"
            label="Calibracion"
            value={estadoCalibracion}
            onChange={actualizarEstadoCalibracion}
            values={["TODOS", "CALIBRADA", "NO_CALIBRADA", "PENDIENTE", "OBSERVADA"]}
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
                <TableHead className="w-[12%]">Operativo</TableHead>
                <TableHead className="w-[12%]">Calibracion</TableHead>
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
                              onClick={() => setAuditPlaca(vehiculo.placa ?? null)}
                            >
                              <IconHistory className="h-4 w-4" />
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
                      <TableCell className="truncate">{vehiculo.contrato ?? "-"}</TableCell>
                      <TableCell className="truncate">{vehiculo.cuenta ?? "-"}</TableCell>
                      <TableCell>
                        <EstadoBadge value={estadoActivoVehiculo(vehiculo)} />
                      </TableCell>
                      <TableCell>
                        <EstadoBadge value={estadoOperativoVehiculo(vehiculo)} />
                      </TableCell>
                      <TableCell>
                        <EstadoBadge value={estadoCalibracionVehiculo(vehiculo)} />
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

    <FlotaAuditPanel
      placa={auditPlaca}
      isOpen={!!auditPlaca}
      onClose={() => setAuditPlaca(null)}
    />
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
