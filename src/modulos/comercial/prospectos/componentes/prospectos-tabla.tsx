"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { IconPlus } from "@tabler/icons-react";
import {
  IconEye,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";

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

import type { EstadoProspecto, Prospecto, RespuestaPaginadaProspectos } from "../tipos/prospecto.tipos";
import { EstadoProspectoBadge } from "./estado-prospecto-badge";

type Props = {
  respuesta: RespuestaPaginadaProspectos;
  filtrosActivos: {
    estado?: string;
    idEjecutivoResponsable?: string;
    busqueda?: string;
    pagina?: number;
    porPagina?: number;
  };
};

const ESTADOS_PROSPECTO: Array<{ valor: EstadoProspecto | "TODOS"; etiqueta: string }> = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "ACTIVO", etiqueta: "Activo" },
  { valor: "CONVERTIDO", etiqueta: "Convertido" },
  { valor: "DESCARTADO", etiqueta: "Descartado" },
];

export function ProspectosTabla({ respuesta, filtrosActivos }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: prospectos, total, pagina, porPagina } = respuesta;

  // Estado local de los controles de filtro (se flush a URL al aplicar)
  const [busquedaLocal, setBusquedaLocal] = React.useState(
    filtrosActivos.busqueda ?? ""
  );
  const [estadoLocal, setEstadoLocal] = React.useState(
    filtrosActivos.estado ?? "TODOS"
  );
  const [ejecutivoLocal, setEjecutivoLocal] = React.useState(
    filtrosActivos.idEjecutivoResponsable ?? ""
  );

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const desdeVisible = total ? (pagina - 1) * porPagina + 1 : 0;
  const hastaVisible = Math.min(pagina * porPagina, total);

  function construirUrl(params: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && v !== "TODOS") {
        sp.set(k, String(v));
      }
    }
    return `${pathname}?${sp.toString()}`;
  }

  function aplicarFiltros() {
    router.push(
      construirUrl({
        estado: estadoLocal,
        idEjecutivoResponsable: ejecutivoLocal,
        busqueda: busquedaLocal,
        pagina: 1,
        porPagina: filtrosActivos.porPagina,
      })
    );
  }

  function limpiarFiltros() {
    setBusquedaLocal("");
    setEstadoLocal("TODOS");
    setEjecutivoLocal("");
    router.push(pathname);
  }

  function irAPagina(nuevaPagina: number) {
    router.push(
      construirUrl({
        estado: filtrosActivos.estado,
        idEjecutivoResponsable: filtrosActivos.idEjecutivoResponsable,
        busqueda: filtrosActivos.busqueda,
        pagina: nuevaPagina,
        porPagina: filtrosActivos.porPagina,
      })
    );
  }

  const hayFiltros =
    !!filtrosActivos.estado ||
    !!filtrosActivos.idEjecutivoResponsable ||
    !!filtrosActivos.busqueda;

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Prospectos comerciales</CardTitle>
            <CardDescription>
              {total} {total === 1 ? "prospecto" : "prospectos"} encontrados
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/comercial/prospectos/nuevo">
              <IconPlus data-icon="inline-start" />
              Nuevo prospecto
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-5">
        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-64 flex-1 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Busqueda
            </span>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nombre comercial, razon social o documento"
                value={busquedaLocal}
                onChange={(e) => setBusquedaLocal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
              />
            </div>
          </div>
          <FiltroSelect
            className="min-w-36 flex-1"
            label="Estado"
            value={estadoLocal}
            valores={ESTADOS_PROSPECTO.map((e) => e.valor)}
            etiquetas={ESTADOS_PROSPECTO.map((e) => e.etiqueta)}
            onChange={setEstadoLocal}
          />
          <div className="grid min-w-36 flex-1 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Ejecutivo responsable
            </span>
            <Input
              type="number"
              placeholder="ID ejecutivo"
              value={ejecutivoLocal}
              onChange={(e) => setEjecutivoLocal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
            />
          </div>
          <Button type="button" onClick={aplicarFiltros}>
            Buscar
          </Button>
        </div>

        {hayFiltros ? (
          <div className="flex justify-end">
            <Button
              type="button"
              className="h-8"
              variant="outline"
              onClick={limpiarFiltros}
            >
              <IconRefresh />
              Limpiar filtros
            </Button>
          </div>
        ) : null}

        {/* Tabla */}
        <div className="overflow-hidden rounded-xl border border-border">
          <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">ID</TableHead>
                <TableHead className="w-[22%]">Nombre comercial</TableHead>
                <TableHead className="w-[18%]">Razon social</TableHead>
                <TableHead className="w-[12%]">Documento</TableHead>
                <TableHead className="w-[14%]">Medio contacto</TableHead>
                <TableHead className="w-[10%]">Estado</TableHead>
                <TableHead className="w-[12%]">Actualizado</TableHead>
                <TableHead className="w-[7%] text-center">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospectos.map((prospecto) => (
                <FilaProspecto key={prospecto.id} prospecto={prospecto} />
              ))}
              {!prospectos.length ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No se encontraron prospectos con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        {/* Paginacion */}
        <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            {total > 0
              ? `Mostrando ${desdeVisible}-${hastaVisible} de ${total} prospectos`
              : "Sin resultados"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagina <= 1}
              onClick={() => irAPagina(pagina - 1)}
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
              disabled={pagina >= totalPaginas}
              onClick={() => irAPagina(pagina + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilaProspecto({ prospecto }: { prospecto: Prospecto }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-muted-foreground">
        #{prospecto.id}
      </TableCell>
      <TableCell>
        <span className="truncate font-medium">{prospecto.nombreComercial}</span>
      </TableCell>
      <TableCell className="truncate text-muted-foreground">
        {prospecto.razonSocial ?? "-"}
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-xs font-medium text-muted-foreground">
            {prospecto.tipoDocumento}
          </span>
          <span className="truncate font-medium">{prospecto.numeroDocumento}</span>
        </div>
      </TableCell>
      <TableCell className="truncate text-sm">
        {formatearMedioContacto(prospecto.medioContactoInicial)}
      </TableCell>
      <TableCell>
        <EstadoProspectoBadge estado={prospecto.estado} />
      </TableCell>
      <TableCell className="truncate text-sm text-muted-foreground">
        {prospecto.fechaModificacion ? formatearFecha(prospecto.fechaModificacion) : "—"}
      </TableCell>
      <TableCell className="text-center">
        <Button asChild size="icon-sm" variant="outline">
          <Link href={`/comercial/prospectos/${prospecto.id}`}>
            <IconEye />
            <span className="sr-only">Ver</span>
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function FiltroSelect({
  className,
  label,
  value,
  valores,
  etiquetas,
  onChange,
}: {
  className?: string;
  label: string;
  value: string;
  valores: string[];
  etiquetas: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {valores.map((valor, i) => (
          <option key={valor} value={valor}>
            {etiquetas[i]}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatearMedioContacto(medio: string) {
  const mapa: Record<string, string> = {
    CORREO: "Correo",
    LLAMADA: "Llamada",
    PRESENCIAL: "Presencial",
    OTRO: "Otro",
  };
  return mapa[medio] ?? medio;
}
