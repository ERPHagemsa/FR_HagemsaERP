"use client";

import Link from "next/link";
import * as React from "react";
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
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
  const [query, setQuery] = React.useState("");
  const [tipoActivo, setTipoActivo] = React.useState("TODOS");
  const [estadoActivo, setEstadoActivo] = React.useState("TODOS");
  const [estadoOperativo, setEstadoOperativo] = React.useState("TODOS");
  const [estadoCalibracion, setEstadoCalibracion] = React.useState("TODOS");

  const normalizedQuery = query.trim().toUpperCase();
  const filtrados = activos.filter((activo) => {
    const placa = activo.vehiculo?.placaRodaje ?? "";
    const marca = activo.vehiculo?.marca ?? "";
    const modelo = activo.vehiculo?.modelo ?? "";
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
        activo.vehiculo?.estadoCalibracion === estadoCalibracion)
    );
  });

  const hayFiltros =
    query ||
    tipoActivo !== "TODOS" ||
    estadoActivo !== "TODOS" ||
    estadoOperativo !== "TODOS" ||
    estadoCalibracion !== "TODOS";

  function limpiarFiltros() {
    setQuery("");
    setTipoActivo("TODOS");
    setEstadoActivo("TODOS");
    setEstadoOperativo("TODOS");
    setEstadoCalibracion("TODOS");
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Maestro de unidades</CardTitle>
            <CardDescription>
              {filtrados.length} de {activos.length} activos visibles
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
        <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_repeat(4,170px)_auto] xl:items-end">
          <div className="grid gap-1.5">
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
            label="Estado"
            value={estadoActivo}
            onChange={setEstadoActivo}
            values={["TODOS", "ACTIVO", "INACTIVO", "SINIESTRADO"]}
          />
          <FiltroSelect
            label="Operativo"
            value={estadoOperativo}
            onChange={setEstadoOperativo}
            values={["TODOS", "OPERATIVO", "MANTENIMIENTO", "NO_OPERATIVO"]}
          />
          <FiltroSelect
            label="Calibracion"
            value={estadoCalibracion}
            onChange={setEstadoCalibracion}
            values={["TODOS", "CALIBRADA", "NO_CALIBRADA", "PENDIENTE", "OBSERVADA"]}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!hayFiltros}
            onClick={limpiarFiltros}
          >
            <IconRefresh />
            Limpiar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Contrato: pendiente Flota</Badge>
          {!hayFiltros ? (
            <span className="text-sm text-muted-foreground">Sin filtros activos</span>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <Table className="min-w-[1040px]">
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ubicacion</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Operativo</TableHead>
                <TableHead>Calibracion</TableHead>
                <TableHead className="w-36 text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((activo) => (
                <TableRow key={activo.id}>
                  <TableCell className="font-medium">{activo.codigo}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {[activo.vehiculo?.marca, activo.vehiculo?.modelo]
                          .filter(Boolean)
                          .join(" ") || activo.descripcion}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {activo.vehiculo?.placaRodaje ?? "Sin placa"}
                        {activo.vehiculo?.carroceria
                          ? ` - ${activo.vehiculo.carroceria}`
                          : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatear(activo.tipoActivo)}</Badge>
                  </TableCell>
                  <TableCell>{activo.ubicacion}</TableCell>
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
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/activos/${activo.codigo}`}>
                          <IconEye />
                          Ver
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/activos/${activo.codigo}/editar`}>
                          <IconPencil />
                          Editar
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filtrados.length ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No se encontraron activos con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

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
  if (value === "SINIESTRADO") return "destructive";
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
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
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
