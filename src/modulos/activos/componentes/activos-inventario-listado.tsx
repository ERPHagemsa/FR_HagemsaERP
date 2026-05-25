"use client";

import Link from "next/link";
import * as React from "react";
import { IconEye, IconSearch } from "@tabler/icons-react";

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
import { cn } from "@/compartido/utilidades";
import type { Activo } from "../tipos/activo.tipos";

type Props = {
  activos: Activo[];
};

export function ActivosInventarioListado({ activos }: Props) {
  const [query, setQuery] = React.useState("");
  const [tipoActivo, setTipoActivo] = React.useState("TODOS");
  const [estadoActivo, setEstadoActivo] = React.useState("TODOS");
  const [estadoOperativo, setEstadoOperativo] = React.useState("TODOS");
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);

  const activosVisibles = activos.filter(
    (activo) => activo.estadoActivo !== "ELIMINADO"
  );
  const normalizedQuery = query.trim().toUpperCase();

  const filtrados = activosVisibles.filter((activo) => {
    const vehiculo = activo.vehiculo;
    const textoBusqueda = [
      activo.id,
      activo.codigo,
      activo.descripcion,
      activo.ubicacion,
      vehiculo?.placaRodaje,
      vehiculo?.marca,
      vehiculo?.modelo,
      vehiculo?.serieChasis,
      vehiculo?.serieMotor,
      vehiculo?.carroceria,
      vehiculo?.categoria,
    ]
      .filter(Boolean)
      .join(" ")
      .toUpperCase();

    return (
      textoBusqueda.includes(normalizedQuery) &&
      (tipoActivo === "TODOS" || activo.tipoActivo === tipoActivo) &&
      (estadoActivo === "TODOS" || activo.estadoActivo === estadoActivo) &&
      (estadoOperativo === "TODOS" ||
        vehiculo?.estadoOperativo === estadoOperativo)
    );
  });

  const ordenados = [...filtrados].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const totalPaginas = Math.max(
    1,
    Math.ceil(ordenados.length / registrosPorPagina)
  );
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const visibles = ordenados.slice(inicioPagina, finPagina);
  const desdeVisible = ordenados.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, ordenados.length);

  React.useEffect(() => {
    setPagina(1);
  }, [query, tipoActivo, estadoActivo, estadoOperativo, registrosPorPagina]);

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Listado detallado de inventario</CardTitle>
        <CardDescription>
          {filtrados.length} de {activosVisibles.length} activos visibles
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_repeat(3,180px)]">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Busqueda
            </span>
            <div className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-3">
              <IconSearch className="size-4 text-muted-foreground" />
              <Input
                className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                placeholder="ID, codigo, placa, chasis, motor o unidad"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </label>
          <FiltroSelect
            label="Tipo"
            value={tipoActivo}
            onChange={setTipoActivo}
            values={["TODOS", "VEHICULO", "EQUIPO", "HERRAMIENTA", "DISPOSITIVO", "OTRO"]}
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
        </div>

        <div className="grid gap-3">
          {visibles.map((activo) => (
            <InventarioItem key={activo.id} activo={activo} />
          ))}
          {!ordenados.length ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No se encontraron activos con los filtros aplicados.
            </div>
          ) : null}
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
      </CardContent>
    </Card>
  );
}

function InventarioItem({ activo }: { activo: Activo }) {
  const vehiculo = activo.vehiculo;

  return (
    <article className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">ID inventario</Badge>
            <span
              className="max-w-full truncate font-mono text-xs text-muted-foreground"
              title={activo.id}
            >
              {activo.id}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold">{activo.codigo}</h3>
          <p className="text-sm text-muted-foreground">{activo.descripcion}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/activos/${activo.codigo}`}>
            <IconEye />
            Ver detalle
          </Link>
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Dato label="Placa" value={vehiculo?.placaRodaje} />
        <Dato label="Tipo" value={formatear(activo.tipoActivo)} />
        <Dato label="Ubicacion" value={activo.ubicacion} />
        <Dato label="Estado activo" value={formatear(activo.estadoActivo)} />
        <Dato label="Operativo" value={formatear(vehiculo?.estadoOperativo)} />
        <Dato
          label="Calibracion"
          value={formatear(vehiculo?.estadoCalibracion)}
        />
        <Dato label="Marca" value={vehiculo?.marca} />
        <Dato label="Modelo" value={vehiculo?.modelo} />
        <Dato label="Carroceria" value={vehiculo?.carroceria} />
        <Dato label="Categoria" value={vehiculo?.categoria} />
        <Dato label="Serie chasis" value={vehiculo?.serieChasis} />
        <Dato label="Serie motor" value={vehiculo?.serieMotor} />
        <Dato label="Creacion" value={formatearFecha(activo.createdAt)} />
        <Dato label="Ultima modificacion" value={formatearFecha(activo.updatedAt)} />
      </div>
    </article>
  );
}

function Dato({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background/40 px-3 py-2">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium" title={String(value ?? "-")}>
        {value ?? "-"}
      </p>
    </div>
  );
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
          "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground",
          "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
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

function formatear(value?: string | null) {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
